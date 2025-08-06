// src/screens/history/TripDetailsScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function TripDetailsScreen({ route }) {
  const { trip } = route.params;
  const formattedDate = new Date(trip.timestamp).toLocaleString();

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (trip.start.latitude + trip.end.latitude) / 2,
          longitude: (trip.start.longitude + trip.end.longitude) / 2,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={trip.start} pinColor="green" title="Start" />
        <Marker coordinate={trip.end} pinColor="red" title="End" />
        <Polyline coordinates={[trip.start, trip.end]} strokeColor="black" strokeWidth={3} />
      </MapView>

      <View style={styles.details}>
        <Text style={styles.label}>Fare: ₱{trip.fare}</Text>
        <Text style={styles.label}>Distance: {trip.distance} km</Text>
        <Text style={styles.label}>Date & Time: {formattedDate}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
  },
  map: {
    flex: 1,
  },
  details: {
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    color: 'black',
    marginBottom: 8,
    fontWeight: 'bold',
  },
});
