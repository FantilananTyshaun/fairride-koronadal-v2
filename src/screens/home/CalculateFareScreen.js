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
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import { saveTripToFirebase } from "../../services/tripService";
import { getAuth } from "firebase/auth";

const GOOGLE_API_KEY = "paste the new one"; // replace with your Google API Key

export default function CalculateFareScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [destinationText, setDestinationText] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [mtop, setMtop] = useState("");
  const [finalFare, setFinalFare] = useState(null);
  const [fares, setFares] = useState(null); // ✅ stores all fare breakdown
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [estimatedDistance, setEstimatedDistance] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [liveDistance, setLiveDistance] = useState(0);
  const [liveFare, setLiveFare] = useState(0);
  const [user, setUser] = useState(null);

  const watchRef = useRef(null);
  const snapInterval = useRef(null);

  // --- Autocomplete ---
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

  // --- Place Details ---
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

        if (location) {
          const { distanceKm, fare } = await fetchEstimatedFare(location, dest);
          setEstimatedDistance(distanceKm);
          setEstimatedFare(fare);
        }
      }
    } catch (err) {
      console.error("Place details error:", err);
    }
  };

  // --- Distance Matrix ---
  const fetchEstimatedFare = async (start, end) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${start.latitude},${start.longitude}&destinations=${end.latitude},${end.longitude}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.rows?.[0]?.elements?.[0]?.distance?.value) {
        const meters = data.rows[0].elements[0].distance.value;
        const km = meters / 1000;
        return {
          distanceKm: km.toFixed(2),
          fare: Math.round(km * 2),
        };
      }
    } catch (err) {
      console.error("Distance Matrix error:", err);
    }
    return { distanceKm: null, fare: null };
  };

  // --- Snap to Roads ---
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

  // --- User ---
  useEffect(() => {
    const fetchUser = () => {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "",
        });
      }
    };
    fetchUser();
  }, []);

  // --- Get current location ---
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

  // --- Start Ride ---
  const startRide = async () => {
    if (!destinationCoords || !mtop)
      return alert("Please set destination and MTOP first.");

    setRouteCoords([]);
    setLiveDistance(0);
    setLiveFare(0);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return alert("Location permission required.");

    const currentLoc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });
    setLocation(currentLoc.coords);
    setRouteCoords([currentLoc.coords]);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (loc) => {
        setLocation(loc.coords);
        setRouteCoords((c) => [...c, loc.coords]);
      }
    );

    snapInterval.current = setInterval(async () => {
      const snapped = await snapToRoads(routeCoords);
      let total = 0;
      for (let i = 1; i < snapped.length; i++) {
        total += getDistance(snapped[i - 1], snapped[i]);
      }
      const km = total / 1000;
      setLiveDistance(km);
      setLiveFare(Math.round(km * 2));
    }, 10000);

    setTracking(true);
  };

  // --- End Ride ---
  const endRide = async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    if (snapInterval.current) {
      clearInterval(snapInterval.current);
      snapInterval.current = null;
    }
    setTracking(false);

    if (routeCoords.length < 2) return alert("Not enough route data.");

    const snapped = await snapToRoads(routeCoords);
    let traveledMeters = 0;
    for (let i = 1; i < snapped.length; i++) {
      traveledMeters += getDistance(snapped[i - 1], snapped[i]);
    }
    const traveledKm = traveledMeters / 1000;

    const final = Math.round(traveledKm * 2);
    setFinalFare(final);

    // ✅ Compute other fares
    const hsFare = Math.max(final - 3, 0);
    const elemFare = Math.max(hsFare - 2, 0);
    const kinderFare = Math.max(elemFare - 2, 0);
    setFares({
      highschool: hsFare,
      elementary: elemFare,
      kinder: kinderFare,
    });

    const trip = {
      start: snapped[0],
      end: snapped[snapped.length - 1],
      destinationInput: destinationText,
      mtopNumber: mtop,
      distance: traveledKm.toFixed(2),
      finalFare: final,
      fares: {
        highschool: hsFare,
        elementary: elemFare,
        kinder: kinderFare,
      },
      timestamp: new Date().toISOString(),
      routeCoords: snapped,
    };

    try {
      if (user) {
        await saveTripToFirebase(trip, user.uid);
      }
      alert(
        `Ride Ended.\nFinal Fare: ₱${final}\nHS/College/PWD: ₱${hsFare}\nElementary: ₱${elemFare}\nKinder: ₱${kinderFare}`
      );
    } catch (err) {
      alert("Failed to save trip.");
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: location?.latitude || 6.5,
          longitude: location?.longitude || 124.85,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        provider="google"
      >
        {/* Green = current live location */}
        {routeCoords.length > 0 && (
          <Marker
            coordinate={routeCoords[routeCoords.length - 1]}
            pinColor="green"
            title="Current Location"
          />
        )}

        {/* Red = destination */}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            pinColor="red"
            title="Destination"
          />
        )}

        {/* Path traveled */}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="blue"
          />
        )}
      </MapView>

      {/* Inputs */}
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

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        {estimatedFare !== null && !tracking && (
          <Text style={styles.info}>
            Estimated: ₱{estimatedFare} ({estimatedDistance} km)
          </Text>
        )}
        {tracking && (
          <>
            <Text style={styles.info}>
              Distance Traveled: {liveDistance.toFixed(2)} km
            </Text>
            <Text style={styles.info}>Live Fare: ₱{liveFare}</Text>
          </>
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
