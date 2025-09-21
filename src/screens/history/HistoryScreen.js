import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

export default function HistoryScreen({ navigation }) {
  const [trips, setTrips] = useState([]);

  // Load trips whenever screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadTrips = async () => {
        try {
          const storedTrips = await AsyncStorage.getItem("trips");
          const parsed = storedTrips ? JSON.parse(storedTrips) : [];
          // ✅ Sort so that newest trips appear FIRST
          const sorted = parsed.sort(
            (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
          );
          setTrips(sorted);
        } catch (error) {
          console.log("[History] Failed to load trips:", error);
        }
      };
      loadTrips();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate("TripDetails", { trip: item })}
    >
      <Text style={styles.title}>Fare: ₱{item.fare?.toFixed?.(2) || "0.00"}</Text>
      <Text style={styles.details}>
        Distance: {item.distance?.toFixed?.(2) || "0.00"} km
      </Text>
      <Text style={styles.details}>
        Date: {item.timestamp ? new Date(item.timestamp).toLocaleString() : "N/A"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {trips.length === 0 ? (
        <Text style={styles.noTrips}>No trips recorded yet.</Text>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  item: {
    backgroundColor: "#f9f9f9",
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "black" },
  details: { fontSize: 14, color: "black", marginTop: 4 },
  noTrips: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
    color: "black",
  },
});
