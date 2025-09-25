// src/screens/home/TripDetailsScreen.js
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, StatusBar } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function TripDetailsScreen({ route }) {
  const { trip } = route.params;
  const mapRef = useRef(null);

  // Ensure coordinates are numbers
  const routeCoords = (trip?.routeCoords || []).map((p) => ({
    latitude: Number(p.latitude),
    longitude: Number(p.longitude),
  }));

  const startCoord = trip?.start
    ? { latitude: Number(trip.start.latitude), longitude: Number(trip.start.longitude) }
    : routeCoords[0] || { latitude: 6.496, longitude: 124.840 };

  const endCoord = trip?.end
    ? { latitude: Number(trip.end.latitude), longitude: Number(trip.end.longitude) }
    : routeCoords[routeCoords.length - 1] || null;

  const tripDate = trip?.timestamp
    ? new Date(trip.timestamp)
    : new Date();

  useEffect(() => {
    if (mapRef.current && routeCoords.length > 0) {
      mapRef.current.fitToCoordinates(routeCoords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [routeCoords]);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: startCoord.latitude,
          longitude: startCoord.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Start Marker */}
        {startCoord && <Marker coordinate={startCoord} pinColor="green" title="Start" />}
        {/* End Marker */}
        {endCoord && <Marker coordinate={endCoord} pinColor="red" title="End" />}
        {/* Route Polyline */}
        {routeCoords.length > 1 && (
          <Polyline coordinates={routeCoords} strokeColor="green" strokeWidth={4} />
        )}
      </MapView>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Date: {tripDate.toLocaleString()}</Text>
        <Text style={styles.infoText}>Fare: ₱{trip?.fare || 0}</Text>
        <Text style={styles.infoText}>
          Distance outside downtown: {trip?.distanceOutside || 0} km
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  map: { flex: 1 },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'black',
  },
  infoText: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: 'black' },
});
