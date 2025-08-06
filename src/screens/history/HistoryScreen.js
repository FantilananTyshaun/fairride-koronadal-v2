import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline } from 'react-native-maps';

export default function HistoryScreen({ navigation }) {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const storedTrips = await AsyncStorage.getItem('trips');
        const parsed = storedTrips ? JSON.parse(storedTrips) : [];
        setTrips(parsed.reverse());
      } catch (err) {
        console.error('Failed to load trips:', err);
      }
    };

    const unsubscribe = navigation.addListener('focus', loadTrips);
    return () => unsubscribe();
  }, [navigation]);

  const renderItem = ({ item }) => {
    const start = item.start;
    const end = item.end;

    const region = {
      latitude: (start.latitude + end.latitude) / 2,
      longitude: (start.longitude + end.longitude) / 2,
      latitudeDelta: Math.abs(start.latitude - end.latitude) + 0.01,
      longitudeDelta: Math.abs(start.longitude - end.longitude) + 0.01,
    };

    const formattedDate = new Date(item.timestamp).toLocaleString();

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('TripDetails', { trip: item })}
      >
        <MapView
          style={styles.map}
          region={region}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          pointerEvents="none"
        >
          <Marker coordinate={start} pinColor="green" />
          <Marker coordinate={end} pinColor="red" />
          <Polyline coordinates={[start, end]} strokeColor="black" strokeWidth={3} />
        </MapView>

        <Text style={styles.title}>Fare: ₱{item.fare}</Text>
        <Text style={styles.detail}>Distance: {item.distance} km</Text>
        <Text style={styles.detail}>Date/Time: {formattedDate}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={trips}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No trip history found.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    padding: 16,
    backgroundColor: '#fff',
  },
  item: {
    backgroundColor: '#f1f1f1',
    padding: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  map: {
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  detail: {
    color: 'black',
    marginTop: 4,
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: 'black',
  },
});
