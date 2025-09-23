import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTripToFirebase } from '../../services/tripService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useNavigation } from '@react-navigation/native';

export default function CalculateFareScreen() {
  const navigation = useNavigation();

  const [location, setLocation] = useState(null);
  const [prev, setPrev] = useState(null);
  const [distanceOutside, setDistanceOutside] = useState(0);
  const [fare, setFare] = useState(15);
  const [tracking, setTracking] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [baseFare, setBaseFare] = useState(15);
  const [perKmRate, setPerKmRate] = useState(2);

  const watchRef = useRef(null);

  // Downtown Koronadal coordinates
  const downtownCoords = [
    { latitude: 6.506284667483129, longitude: 124.83915594038785 },
    { latitude: 6.494151873410396, longitude: 124.85156390970461 },
    { latitude: 6.496278700668861, longitude: 124.85311130455793 },
    { latitude: 6.492243244226249, longitude: 124.83718248853992 },
    { latitude: 6.4907578984498615, longitude: 124.83968128852665 },
    { latitude: 6.488672181593102, longitude: 124.84278238356796 },
    { latitude: 6.491779593867804, longitude: 124.84526074460867 },
    { latitude: 6.49301505462528, longitude: 124.85169270085113 },
    { latitude: 6.492083671671429, longitude: 124.83546783493742 },
    { latitude: 6.496070832431574, longitude: 124.83547630970435 },
    { latitude: 6.501709229558065, longitude: 124.83232493853998 },
    { latitude: 6.5050015959388325, longitude: 124.83514997263975 },
    { latitude: 6.506351101272501, longitude: 124.83632162717356 },
    { latitude: 6.501391412382966, longitude: 124.85259742504603 },
    { latitude: 6.508395590208718, longitude: 124.85018178531979 },
  ];

  const center = {
    latitude:
      downtownCoords.reduce((sum, c) => sum + c.latitude, 0) / downtownCoords.length,
    longitude:
      downtownCoords.reduce((sum, c) => sum + c.longitude, 0) / downtownCoords.length,
  };

  const getDowntownRadius = () => {
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371; // km
    const distances = downtownCoords.map((c) => {
      const dLat = toRad(c.latitude - center.latitude);
      const dLon = toRad(c.longitude - center.longitude);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(center.latitude)) *
          Math.cos(toRad(c.latitude)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const cAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * cAngle * 1000; // meters
    });
    return Math.max(...distances);
  };

  const downtownRadius = getDowntownRadius();

  useEffect(() => {
    const fetchFareRates = async () => {
      try {
        const docRef = doc(db, 'settings', 'fareRates');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setBaseFare(data.baseFare ?? 15);
          setPerKmRate(data.perKmRate ?? 2);
        }
      } catch (err) {
        console.error('Failed to fetch fare rates from Firebase:', err);
      }
    };
    fetchFareRates();
  }, []);

  const isInsideDowntown = (coords) => {
    const R = 6371000; // meters
    const dLat = ((coords.latitude - center.latitude) * Math.PI) / 180;
    const dLon = ((coords.longitude - center.longitude) * Math.PI) / 180;
    const lat1 = (center.latitude * Math.PI) / 180;
    const lat2 = (coords.latitude * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= downtownRadius;
  };

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
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

  const startRide = async () => {
    setDistanceOutside(0);
    setFare(baseFare);
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
          const outsidePrev = !isInsideDowntown(prev);
          const outsideCurrent = !isInsideDowntown(loc.coords);

          if (outsidePrev || outsideCurrent) {
            const distKm = getDistanceKm(
              prev.latitude,
              prev.longitude,
              loc.coords.latitude,
              loc.coords.longitude
            );
            setDistanceOutside((d) => {
              const updated = d + distKm;
              setFare(baseFare + updated * perKmRate);
              return updated;
            });
          } else {
            setFare(baseFare);
          }
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
      distanceOutside: distanceOutside.toFixed(2),
      fare: Math.round(fare),
      timestamp: new Date().toISOString(),
      routeCoords,
    };

    try {
      await saveTripToFirebase(trip);

      const stored = await AsyncStorage.getItem('trips');
      const trips = stored ? JSON.parse(stored) : [];
      trips.unshift(trip);
      await AsyncStorage.setItem('trips', JSON.stringify(trips));

      Alert.alert('Success', 'Trip saved successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to save trip.');
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: location?.latitude || center.latitude,
          longitude: location?.longitude || center.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {location && <Marker coordinate={location} title="You are here" />}
        {routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="green" />
        )}

        {/* Downtown circle */}
        <Circle center={center} radius={downtownRadius} strokeColor="green" strokeWidth={2} fillColor="transparent" />
      </MapView>

      <View style={styles.controls}>
        <Text style={styles.info}>
          Distance Outside Downtown: {distanceOutside.toFixed(2)} km
        </Text>
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

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.navigate('FareMatrix')}
        >
          <Text style={styles.buttonText}>View Fare Matrix</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  map: { flex: 1 },
  controls: { padding: 16, backgroundColor: '#fff' },
  info: { fontSize: 16, marginBottom: 8, fontWeight: 'bold', color: 'black' },
  button: {
    backgroundColor: 'green',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  secondaryButton: { backgroundColor: 'darkgreen' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
