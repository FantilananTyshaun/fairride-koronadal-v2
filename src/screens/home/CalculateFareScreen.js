import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTripToFirebase } from '../../services/tripService';

export default function CalculateFareScreen() {
  const [location, setLocation] = useState(null);
  const [prev, setPrev] = useState(null);
  const [distance, setDistance] = useState(0);
  const [fare, setFare] = useState(15); // start at base fare
  const [tracking, setTracking] = useState(false);
  const watchRef = useRef(null);
  const [routeCoords, setRouteCoords] = useState([]);

  const startRide = async () => {
    setDistance(0);
    setFare(15); // reset to base fare
    setRouteCoords([]);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Location permission is required.');
      return;
    }

    const currentLoc = await Location.getCurrentPositionAsync({});
    setLocation(currentLoc.coords);
    setPrev(currentLoc.coords);
    setRouteCoords([currentLoc.coords]);

    watchRef.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (loc) => {
        setLocation(loc.coords);
        if (prev) {
          const newDistance = getDistance(
            prev.latitude,
            prev.longitude,
            loc.coords.latitude,
            loc.coords.longitude
          );
          setDistance((d) => {
            const updated = d + newDistance;
            setFare(calculateFare(updated)); // update fare live
            return updated;
          });
        }
        setPrev(loc.coords);
        setRouteCoords((coords) => [...coords, loc.coords]);
      }
    );

    setTracking(true);
  };

  const endRide = async () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
    setTracking(false);

    const trip = {
      start: routeCoords[0],
      end: routeCoords[routeCoords.length - 1],
      distance: distance.toFixed(2),
      fare: Math.round(fare),
      timestamp: new Date().toISOString(),
      routeCoords,
    };

    try {
      // ✅ Save to Firebase
      await saveTripToFirebase(trip);

      // ✅ Save locally to AsyncStorage
      const stored = await AsyncStorage.getItem('trips');
      const trips = stored ? JSON.parse(stored) : [];
      trips.unshift(trip); // always put newest trip at the top
      await AsyncStorage.setItem('trips', JSON.stringify(trips));

      Alert.alert('Success', 'Trip saved successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save trip.');
      console.error(err);
    }
  };

  const calculateFare = (km) => {
    const baseFare = 15; // ₱15 base fare
    const perKmRate = 10; // ₱10 per km after 1 km
    return km < 1 ? baseFare : baseFare + (km - 1) * perKmRate;
  };

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // ✅ Show Fare Matrix in an Alert
  const showFareMatrix = () => {
    Alert.alert(
      'Fare Matrix',
      'Base Fare: ₱15 (first 1 km)\nAdditional ₱10 per km after 1 km.\nExample:\n1 km = ₱15\n2 km = ₱25\n3 km = ₱35 and so on.'
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: location?.latitude || 11.0,
          longitude: location?.longitude || 124.8,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {location && <Marker coordinate={location} title="You are here" />}
        {routeCoords.length > 1 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor="green"
          />
        )}
      </MapView>

      <View style={styles.controls}>
        <Text style={styles.info}>Distance: {distance.toFixed(2)} km</Text>
        <Text style={styles.info}>Fare: ₱{Math.round(fare)}</Text>

        {!tracking ? (
          <TouchableOpacity style={styles.button} onPress={startRide}>
            <Text style={styles.buttonText}>Start Ride</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.button} onPress={endRide}>
            <Text style={styles.buttonText}>End Ride</Text>
          </TouchableOpacity>
        )}

        {/* ✅ New View Fare Matrix Button */}
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={showFareMatrix}>
          <Text style={styles.buttonText}>View Fare Matrix</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  map: { flex: 1 },
  controls: { padding: 16, backgroundColor: '#fff' },
  info: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    color: 'black',
  },
  button: {
    backgroundColor: 'green',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: 'darkgreen', // slightly different shade for the new button
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
