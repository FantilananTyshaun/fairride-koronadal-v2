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
} from "react-native";
import MapView, { Marker, Polyline, Polygon } from "react-native-maps";
import * as Location from "expo-location";
import { getDistance, isPointInPolygon } from "geolib";
import { saveTripToFirebase } from "../../services/tripService";
import { getAuth } from "firebase/auth";
import koronadalData from "../../data/koronadalZone.json";
import { specialFares } from "../../utils/fixedFares";
const GOOGLE_API_KEY = "api"; // replace with your key

export default function CalculateFareScreen() {
  const [location, setLocation] = useState(null);
  const [destinationText, setDestinationText] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [mtop, setMtop] = useState("");
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

  const watchRef = useRef(null);
  const mapRef = useRef(null);

  function findSpecialFare(coords) {
    for (const spot of specialFares) {
      const d = getDistance(
        coords,
        { latitude: spot.lat, longitude: spot.lng }
      );
      if (d <= spot.radius) {
        return spot.fare;
      }
    }
    return null;
  }

  // Load Koronadal polygon
  useEffect(() => {
    try {
      const polygonFeature = koronadalData.features.find(
        (f) => f.geometry.type === "Polygon"
      );
      if (polygonFeature) {
        const coords = polygonFeature.geometry.coordinates[0].map(
          ([lng, lat]) => ({ latitude: lat, longitude: lng })
        );
        setKoronadalBoundary(coords);
      }
    } catch (err) {
      console.error("Failed to load Koronadal zone:", err);
    }
  }, []);

  // Autocomplete
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

  // Estimate distance-based fare
  const fetchEstimatedFare = async (start, end) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${start.latitude},${start.longitude}&destinations=${end.latitude},${end.longitude}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.rows?.[0]?.elements?.[0]?.distance?.value) {
        const meters = data.rows[0].elements[0].distance.value;
        const km = meters / 1000;

        const startInsideEst =
          koronadalBoundary.length > 0 &&
          isPointInPolygon(start, koronadalBoundary);
        const endInsideEst =
          koronadalBoundary.length > 0 &&
          isPointInPolygon(end, koronadalBoundary);

        // --- updated fare logic (matches endRide) ---
        let estFare = 0;

        // Check if destination is in special fare list
        const startSpecialFare = findSpecialFare(start);
        const endSpecialFare = findSpecialFare(end);

        if (startInsideEst && endSpecialFare) {
          estFare = endSpecialFare; // Downtown → special
        } else if (!startInsideEst && endInsideEst && startSpecialFare) {
          estFare = startSpecialFare; // Special → downtown
        } else {
          if (!startInsideEst && endInsideEst) estFare = km * 2 + 15;
          else if (startInsideEst && !endInsideEst) estFare = 15 + km * 2;
          else if (startInsideEst && endInsideEst) estFare = 15;
          else if (!startInsideEst && !endInsideEst) {
            if (km > 2) estFare = km * 2 + 15;
            else estFare = km * 2;
          }
        }



        estFare = Math.round(estFare);

        const hsFare = Math.max(estFare - 3, 0);
        const elemFare = Math.max(hsFare - 2, 0);
        const kinderFare = Math.max(elemFare - 2, 0);

        setEstimatedDistance(km.toFixed(2));
        setEstimatedFare(estFare);
        setEstimatedFares({
          highschool: hsFare,
          elementary: elemFare,
          kinder: kinderFare,
        });
      }
    } catch (err) {
      console.error("Distance Matrix error:", err);
    }
  };


  useEffect(() => {
    if (location && destinationCoords) {
      fetchEstimatedFare(location, destinationCoords);
    }
  }, [location, destinationCoords]);

  // Snap route to roads
  const snapToRoads = async (coords) => {
    try {
      if (coords.length < 2) return coords;
      const path = coords.map((c) => `${c.latitude},${c.longitude}`).join("|");
      const url = `https://roads.googleapis.com/v1/snapToRoads?path=${path}&interpolate=true&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.snappedPoints) {
        return data.snappedPoints.map((p) => ({
          latitude: p.location.latitude,
          longitude: p.location.longitude,
        }));
      }
      return coords;
    } catch (err) {
      console.error("SnapToRoads error:", err);
      return coords;
    }
  };

  // Current user
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      setUser({
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || "",
      });
    }
  }, []);

  // Get current location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setLocation(current.coords);
      }
    })();
  }, []);

  // Start Ride
  const startRide = async () => {
    if (!destinationCoords || !mtop)
      return alert("Please set destination and MTOP first.");
    setRouteCoords([]);
    setLiveDistance(0);
    setEverEnteredDowntown(false);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return alert("Location permission required.");

    const currentLoc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    setLocation(currentLoc.coords);
    setRouteCoords([currentLoc.coords]);

    if (koronadalBoundary.length > 0) {
      const inside = isPointInPolygon(currentLoc.coords, koronadalBoundary);
      setStartInside(inside);
      if (inside) setEverEnteredDowntown(true);
    }

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
          const last = prev[prev.length - 1];
          if (last) {
            const segment = getDistance(last, loc.coords) / 1000;
            setLiveDistance((d) => d + segment);
            return [...prev, loc.coords];
          }
          return [loc.coords];
        });

        // track if entered downtown
        if (koronadalBoundary.length > 0) {
          const nowInside = isPointInPolygon(loc.coords, koronadalBoundary);
          if (nowInside) setEverEnteredDowntown(true);
        }
      }
    );

    setTracking(true);
  };

  // End Ride
  const endRide = async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setTracking(false);

    if (routeCoords.length < 1) return alert("No route data.");

    const snapped = await snapToRoads(routeCoords);

    let traveledMeters = 0;
    for (let i = 1; i < snapped.length; i++) {
      traveledMeters += getDistance(snapped[i - 1], snapped[i]);
    }
    const traveledKm = traveledMeters / 1000;

    const endInside =
      koronadalBoundary.length > 0 &&
      isPointInPolygon(snapped[snapped.length - 1], koronadalBoundary);

    // --- final fare logic (with downtown pass-through rule) ---
    let final = 0;

    //Check if destination qualifies for a fixed fare
    const startSpecialFare = findSpecialFare(snapped[0]);
    const endSpecialFare = findSpecialFare(snapped[snapped.length - 1]);

    if (startInside && endSpecialFare) {
      final = endSpecialFare; // Downtown → special
    } else if (!startInside && endInside && startSpecialFare) {
      final = startSpecialFare; // Special → downtown
    } else {

      if (!startInside && endInside) final = traveledKm * 2 + 15;
      else if (startInside && !endInside) final = 15 + traveledKm * 2;
      else if (startInside && endInside) final = 15;
      else if (!startInside && !endInside && everEnteredDowntown)
        final = traveledKm * 2 + 15;
      else final = traveledKm * 2;
    }

    final = Math.round(final);
    setFinalFare(final);

    const hsFare = Math.max(final - 3, 0);
    const elemFare = Math.max(hsFare - 2, 0);
    const kinderFare = Math.max(elemFare - 2, 0);
    setFares({ highschool: hsFare, elementary: elemFare, kinder: kinderFare });

    const trip = {
      start: snapped[0],
      end: snapped[snapped.length - 1],
      destinationInput: destinationText,
      mtopNumber: mtop,
      distance: traveledKm.toFixed(2),
      finalFare: final,
      fares: { highschool: hsFare, elementary: elemFare, kinder: kinderFare },
      timestamp: new Date().toISOString(),
      routeCoords: snapped,
    };

    try {
      if (user) await saveTripToFirebase(trip, user.uid);
      alert(`Ride Ended.\nFinal Fare: ₱${final}`);
    } catch (err) {
      console.error(err);
      alert("Failed to save trip.");
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
            title="Current Location"
          />
        )}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            pinColor="red"
            title="Destination"
          />
        )}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="blue"
          />
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
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestion}
                onPress={() =>
                  fetchPlaceDetails(item.place_id, item.description)
                }
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
          onChangeText={setMtop}
        />
      </View>

      <View style={styles.bottomControls}>
        {estimatedFare !== null && !tracking && (
          <>
            <Text style={styles.info}>
              Estimated: ₱{estimatedFare}{" "}
              {estimatedDistance ? `(${estimatedDistance} km)` : ""}
            </Text>
            <Text style={styles.info}>
              HS/College/PWD: ₱{estimatedFares?.highschool}
            </Text>
            <Text style={styles.info}>
              Elementary: ₱{estimatedFares?.elementary}
            </Text>
            <Text style={styles.info}>Kinder: ₱{estimatedFares?.kinder}</Text>
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
            <Text style={styles.info}>
              HS/College/PWD: ₱{fares?.highschool}
            </Text>
            <Text style={styles.info}>Elementary: ₱{fares?.elementary}</Text>
            <Text style={styles.info}>Kinder: ₱{fares?.kinder}</Text>
          </>
        )}

        {!tracking ? (
          <TouchableOpacity style={styles.button} onPress={startRide}>
            <Text style={styles.buttonText}>Start Ride</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={endRide}>
            <Text style={styles.buttonText}>End Ride</Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: "white",
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  info: { fontSize: 16, marginBottom: 6, fontWeight: "bold", color: "black" },
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
