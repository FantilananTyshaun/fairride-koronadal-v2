// src/screens/home/CalculateFareScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  StatusBar,
  FlatList,
  Alert,
} from "react-native";
import MapView, { Marker, Polyline, Polygon } from "react-native-maps";
import * as Location from "expo-location";
import { getDistance, isPointInPolygon } from "geolib";
import { saveTripToFirebase } from "../../services/tripService";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import koronadalData from "../../data/koronadalZone.json";
import { specialFares } from "../../utils/fixedFares";

const GOOGLE_API_KEY = "AIzaSyCv7AGS7RzHWopFN50Y17b_xiJU1SKCMyY";

export default function CalculateFareScreen() {
  const [location, setLocation] = useState(null);
  const [destinationText, setDestinationText] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [mtop, setMtop] = useState("");
  const [mtopStatus, setMtopStatus] = useState("");
  const [finalFare, setFinalFare] = useState(null);
  const [fares, setFares] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [estimatedFares, setEstimatedFares] = useState(null);
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [liveDistance, setLiveDistance] = useState(0);
  const [user, setUser] = useState(null);
  const [koronadalBoundary, setKoronadalBoundary] = useState([]);
  const [startInside, setStartInside] = useState(false);
  const [everEnteredDowntown, setEverEnteredDowntown] = useState(false);
  const mapRef = useRef(null);
  const watchRef = useRef(null);

  // ✅ Check MTOP registration
  const checkMtopRegistration = async (mtopNumber) => {
    if (!mtopNumber) {
      setMtopStatus("");
      return;
    }
    try {
      const db = getFirestore();
      const ref = doc(db, "mtopList", mtopNumber.trim());
      const snap = await getDoc(ref);
      setMtopStatus(snap.exists() ? "Registered" : "Not Registered");
    } catch (err) {
      console.error("MTOP check error:", err);
      setMtopStatus("Error");
    }
  };

  const findSpecialFare = (coords) => {
    for (const s of specialFares) {
      const d = getDistance(coords, { latitude: s.lat, longitude: s.lng });
      if (d <= s.radius) return s.fare;
    }
    return null;
  };

  useEffect(() => {
    try {
      const poly = koronadalData.features.find(
        (f) => f.geometry.type === "Polygon"
      );
      if (poly) {
        const coords = poly.geometry.coordinates[0].map(([lng, lat]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setKoronadalBoundary(coords);
      }
    } catch (err) {
      console.error("Failed to load zone:", err);
    }
  }, []);

  const fetchSuggestions = async (text) => {
    setDestinationText(text);
    if (!text) return setSuggestions([]);
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
        text
      )}&key=${GOOGLE_API_KEY}&components=country:ph`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.predictions) setSuggestions(data.predictions);
    } catch (err) {
      console.error("Autocomplete error:", err);
    }
  };

  const fetchPlaceDetails = async (placeId, description) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.result?.geometry?.location) {
        const loc = data.result.geometry.location;
        const dest = { latitude: loc.lat, longitude: loc.lng };
        setDestinationCoords(dest);
        setDestinationText(description);
        setSuggestions([]);
        if (location) fetchEstimatedFare(location, dest);
      }
    } catch (err) {
      console.error("Place details error:", err);
    }
  };

  const fetchEstimatedFare = async (start, end) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${start.latitude},${start.longitude}&destinations=${end.latitude},${end.longitude}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.rows?.[0]?.elements?.[0]?.distance?.value) {
        const meters = data.rows[0].elements[0].distance.value;
        const km = meters / 1000;

        const startInsideEst =
          koronadalBoundary.length &&
          isPointInPolygon(start, koronadalBoundary);
        const endInsideEst =
          koronadalBoundary.length && isPointInPolygon(end, koronadalBoundary);

        let estFare = 0;
        const startSpecial = findSpecialFare(start);
        const endSpecial = findSpecialFare(end);

        if (startInsideEst && endSpecial) estFare = endSpecial;
        else if (!startInsideEst && endInsideEst && startSpecial)
          estFare = startSpecial;
        else if (!startInsideEst && endInsideEst) estFare = km * 2 + 15;
        else if (startInsideEst && !endInsideEst) estFare = 15 + km * 2;
        else if (startInsideEst && endInsideEst) estFare = 15;
        else estFare = km * 2 + 15;

        estFare = Math.round(estFare);

        const hs = Math.max(estFare - 3, 0);
        const elem = Math.max(hs - 2, 0);
        const kinder = Math.max(elem - 2, 0);

        setEstimatedDistance(km.toFixed(2));
        setEstimatedFare(estFare);
        setEstimatedFares({ highschool: hs, elementary: elem, kinder });
      }
    } catch (err) {
      console.error("Distance Matrix error:", err);
    }
  };

  useEffect(() => {
    if (location && destinationCoords)
      fetchEstimatedFare(location, destinationCoords);
  }, [location, destinationCoords]);

  const snapToRoads = async (coords) => {
    if (coords.length < 2) return coords;
    try {
      const path = coords.map((c) => `${c.latitude},${c.longitude}`).join("|");
      const url = `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.snappedPoints)
        return data.snappedPoints.map((p) => ({
          latitude: p.location.latitude,
          longitude: p.location.longitude,
        }));
    } catch (err) {
      console.error("SnapToRoads error:", err);
    }
    return coords;
  };

  useEffect(() => {
    const auth = getAuth();
    const current = auth.currentUser;
    if (current)
      setUser({
        uid: current.uid,
        email: current.email,
        displayName: current.displayName || "",
      });
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setLocation(pos.coords);
      }
    })();
  }, []);

  const startRide = async () => {
    if (!destinationCoords || !mtop)
      return Alert.alert("Missing Info", "Enter destination and MTOP first.");
    setRouteCoords([]);
    setLiveDistance(0);
    setEverEnteredDowntown(false);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return Alert.alert("Location permission needed");

    const cur = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    setLocation(cur.coords);
    setRouteCoords([cur.coords]);

    const inside = koronadalBoundary.length
      ? isPointInPolygon(cur.coords, koronadalBoundary)
      : false;
    setStartInside(inside);
    if (inside) setEverEnteredDowntown(true);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (loc) => {
        setLocation(loc.coords);
        mapRef.current?.animateCamera(
          { center: loc.coords, zoom: 16 },
          { duration: 1000 }
        );
        setRouteCoords((prev) => {
          if (prev.length > 0) {
            const last = prev[prev.length - 1];
            const seg = getDistance(last, loc.coords) / 1000;
            setLiveDistance((d) => d + seg);
          }
          return [...prev, loc.coords];
        });

        if (
          koronadalBoundary.length &&
          isPointInPolygon(loc.coords, koronadalBoundary)
        )
          setEverEnteredDowntown(true);
      }
    );
    setTracking(true);
  };

  // ✅ Updated End Ride — auto reset + recenter map
  const endRide = async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setTracking(false);
    if (!routeCoords.length) return Alert.alert("No route data.");

    const snapped = await snapToRoads(routeCoords);
    let meters = 0;
    for (let i = 1; i < snapped.length; i++)
      meters += getDistance(snapped[i - 1], snapped[i]);
    const km = meters / 1000;

    const endInside =
      koronadalBoundary.length &&
      isPointInPolygon(snapped[snapped.length - 1], koronadalBoundary);

    let fare = 0;
    const startSpecial = findSpecialFare(snapped[0]);
    const endSpecial = findSpecialFare(snapped[snapped.length - 1]);

    if (startInside && endSpecial) fare = endSpecial;
    else if (!startInside && endInside && startSpecial) fare = startSpecial;
    else if (!startInside && endInside) fare = km * 2 + 15;
    else if (startInside && !endInside) fare = 15 + km * 2;
    else if (startInside && endInside) fare = 15;
    else if (!startInside && !endInside && everEnteredDowntown)
      fare = km * 2 + 15;
    else fare = km * 2 + 15;

    fare = Math.round(fare);
    setFinalFare(fare);

    const hs = Math.max(fare - 3, 0);
    const elem = Math.max(hs - 2, 0);
    const kinder = Math.max(elem - 2, 0);
    setFares({ highschool: hs, elementary: elem, kinder });

    const trip = {
      start: snapped[0],
      end: snapped[snapped.length - 1],
      destinationInput: destinationText,
      mtopNumber: mtop,
      distance: km.toFixed(2),
      finalFare: fare,
      fares: { highschool: hs, elementary: elem, kinder },
      timestamp: new Date().toISOString(),
      routeCoords: snapped,
    };

    try {
      if (user) await saveTripToFirebase(trip, user.uid);
      Alert.alert(
        "Ride Ended",
        `Final Fare: ₱${fare}\nHigh School/College/PWD/SC: ₱${Math.max(fare - 3, 0)}\nElementary: ₱${Math.max(fare - 5, 0)}\nKinder/Daycare: ₱${Math.max(fare - 7, 0)}`
      );


      // ✅ Reset everything
      setMtop("");
      setMtopStatus("");
      setDestinationText("");
      setDestinationCoords(null);
      setEstimatedFare(null);
      setEstimatedFares(null);
      setEstimatedDistance(null);
      setFinalFare(null);
      setFares(null);
      setRouteCoords([]);
      setLiveDistance(0);
      setEverEnteredDowntown(false);
      setStartInside(false);

      // ✅ Recenter to live location
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLocation(pos.coords);
      mapRef.current?.animateCamera(
        { center: pos.coords, zoom: 16 },
        { duration: 1000 }
      );
    } catch (err) {
      console.error("Save error:", err);
      Alert.alert("Failed to save trip");
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={{
          latitude: location?.latitude || 6.5,
          longitude: location?.longitude || 124.85,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        provider="google"
      >
        {koronadalBoundary.length > 0 && (
          <Polygon
            coordinates={koronadalBoundary}
            strokeColor="green"
            fillColor="rgba(0,128,0,0.2)"
            strokeWidth={2}
          />
        )}
        {routeCoords.length > 0 && (
          <Marker
            coordinate={routeCoords[routeCoords.length - 1]}
            pinColor="green"
            title="Current"
          />
        )}
        {destinationCoords && (
          <Marker coordinate={destinationCoords} pinColor="red" title="Dest" />
        )}
        {routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>

      <View style={styles.topInputs}>
        <TextInput
          style={styles.input}
          placeholder="Enter Destination"
          value={destinationText}
          onChangeText={fetchSuggestions}
        />
        {suggestions.length > 0 && (
          <FlatList
            data={suggestions}
            keyExtractor={(i) => i.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestion}
                onPress={() => fetchPlaceDetails(item.place_id, item.description)}
              >
                <Text>{item.description}</Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionList}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Enter MTOP Number"
          value={mtop}
          onChangeText={(t) => {
            setMtop(t);
            checkMtopRegistration(t);
          }}
        />
        {mtop.trim() && mtopStatus && (
          <Text
            style={{
              color:
                mtopStatus === "Registered"
                  ? "green"
                  : mtopStatus === "Not Registered"
                    ? "red"
                    : "orange",
              fontWeight: "bold",
              marginBottom: 6,
            }}
          >
            {mtopStatus}
          </Text>
        )}
      </View>

      <View style={styles.bottomControls}>
        {estimatedFare !== null && !tracking && (
          <>
            <Text style={styles.info}>
              Estimated: ₱{estimatedFare} ({estimatedDistance} km)
            </Text>
            <Text style={styles.info}>HS/College/PWD/SC: ₱{estimatedFares?.highschool}</Text>
            <Text style={styles.info}>Elementary: ₱{estimatedFares?.elementary}</Text>
            <Text style={styles.info}>Kinder/Daycare: ₱{estimatedFares?.kinder}</Text>
          </>
        )}

        {tracking && (
          <Text style={styles.info}>
            Distance Traveled: {liveDistance.toFixed(2)} km
          </Text>
        )}

        {finalFare !== null && (
          <>
            <Text style={styles.info}>Final Fare: ₱{finalFare}</Text>
            <Text style={styles.info}>HS/College/PWD/SC: ₱{fares?.highschool}</Text>
            <Text style={styles.info}>Elementary: ₱{fares?.elementary}</Text>
            <Text style={styles.info}>Kinder/Daycare: ₱{fares?.kinder}</Text>
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={tracking ? endRide : startRide}
        >
          <Text style={styles.buttonText}>
            {tracking ? "End Ride" : "Start Ride"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  map: { flex: 1 },
  topInputs: {
    position: "absolute",
    top: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 50,
    left: 10,
    right: 10,
    backgroundColor: "white",
    padding: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  suggestionList: {
    maxHeight: 150,
    backgroundColor: "white",
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 8,
    borderRadius: 5,
  },
  suggestion: { padding: 10, borderBottomWidth: 1, borderColor: "#eee" },
  bottomControls: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 10,
    elevation: 3,
    alignItems: "center",
  },
  info: { fontSize: 16, marginBottom: 6, fontWeight: "bold" },
  button: {
    backgroundColor: "green",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
    width: "100%",
  },
  buttonText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
