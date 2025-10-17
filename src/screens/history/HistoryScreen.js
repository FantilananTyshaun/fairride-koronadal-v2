// src/screens/history/HistoryScreen.js
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { auth, db } from "../../services/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");

export default function HistoryScreen() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const flatListRef = useRef();

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const tripsRef = collection(db, "users", uid, "trips");
      const q = query(tripsRef, orderBy("timestamp", "desc"));
      const snapshot = await getDocs(q);

      const tripsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrips(tripsData);

      setTimeout(() => {
        if (flatListRef.current && tripsData.length > 0) {
          flatListRef.current.scrollToIndex({ index: 0, animated: true });
        }
      }, 100);
    } catch (err) {
      console.error("Error fetching trips:", err);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [])
  );

  const renderTrip = ({ item }) => {
    const tripDate = item.timestamp ? new Date(item.timestamp) : new Date();
    const routeCoords = item.routeCoords || [];

    return (
      <TouchableOpacity
        style={styles.tripContainer}
        onPress={() => navigation.navigate("TripDetails", { trip: item })}
      >
        <Text style={styles.tripText}>Date: {tripDate.toLocaleString()}</Text>
        <Text style={styles.tripText}>Final Fare: ₱{item.finalFare}</Text>
        <Text style={styles.tripText}>HS/College/PWD/SC: ₱{item.fares?.highschool}</Text>
        <Text style={styles.tripText}>Elementary: ₱{item.fares?.elementary}</Text>
        <Text style={styles.tripText}>Kinder/Daycare: ₱{item.fares?.kinder}</Text>
        <Text style={styles.tripText}>Distance: {item.distance} km</Text>

        {routeCoords.length > 1 && (
          <MapView
            provider={PROVIDER_DEFAULT}
            style={styles.miniMap}
            initialRegion={{
              latitude: routeCoords[0].latitude,
              longitude: routeCoords[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Polyline coordinates={routeCoords} strokeColor="blue" strokeWidth={3} />
            <Marker coordinate={routeCoords[0]} title="Start" pinColor="green" />
            <Marker
              coordinate={routeCoords[routeCoords.length - 1]}
              title="End"
              pinColor="red"
            />
          </MapView>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      {trips.length === 0 ? (
        <Text style={styles.noTripsText}>No trips found.</Text>
      ) : (
        <FlatList
          ref={flatListRef}
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={renderTrip}
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0 },
  tripContainer: {
    margin: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  tripText: { fontWeight: "bold", color: "black", marginBottom: 5 },
  noTripsText: { textAlign: "center", marginTop: 20, fontSize: 16, color: "black" },
  miniMap: {
    width: width - 40,
    height: 150,
    marginTop: 10,
    borderRadius: 10,
  },
});
