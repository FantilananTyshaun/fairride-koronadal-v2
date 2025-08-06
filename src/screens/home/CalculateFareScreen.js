import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { saveTripLocally } from 'services/tripService';

const deg2rad = (deg) => deg * (Math.PI / 180);
const getDistanceFromLatLon = (start, end) => {
  const R = 6371;
  const dLat = deg2rad(end.latitude - start.latitude);
  const dLon = deg2rad(end.longitude - start.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(deg2rad(start.latitude)) *
    Math.cos(deg2rad(end.latitude)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const calculateFare = (distanceKm) => {
  const baseFare = 10;
  const ratePerKm = 5;
  return Math.round(baseFare + distanceKm * ratePerKm);
};

export default function CalculateFareScreen() {
  const [location, setLocation] = useState(null);
  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [rideInProgress, setRideInProgress] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  const handleStartRide = async () => {
    const current = await Location.getCurrentPositionAsync({});
    setStart(current.coords);
    setEnd(null);
    setRideInProgress(true);

    const watch = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 10,
      },
      (loc) => setEnd(loc.coords)
    );

    setWatchId(watch);
    Alert.alert('Ride Started', 'Tracking your trip...');
  };

  const handleEndRide = async () => {
    if (!rideInProgress || !start || !end) {
      Alert.alert('Cannot End Ride', 'No ride is currently active.');
      return;
    }

    if (watchId) {
      watchId.remove();
      setWatchId(null);
    }

    const totalKm = getDistanceFromLatLon(start, end);
    const fare = calculateFare(totalKm);
    const now = new Date().toISOString();

    const trip = {
      start,
      end,
      distance: totalKm.toFixed(2),
      fare,
      timestamp: now,
    };

    await saveTripLocally(trip);

    // Reset states
    setStart(null);
    setEnd(null);
    setRideInProgress(false);

    Alert.alert('Trip Saved', `Distance: ${trip.distance} km\nFare: ₱${fare}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        showsUserLocation
        region={{
          latitude: location?.latitude || 6.5,
          longitude: location?.longitude || 124.85,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {start && <Marker coordinate={start} title="Start" pinColor="green" />}
        {end && <Marker coordinate={end} title="End" pinColor="red" />}
      </MapView>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleStartRide}>
          <Text style={styles.buttonText}>Start Ride</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleEndRide}>
          <Text style={styles.buttonText}>End Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  map: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#E6F5E6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'green',
  },
  buttonText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
