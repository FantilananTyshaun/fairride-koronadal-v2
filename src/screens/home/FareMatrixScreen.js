// src/screens/home/FareMatrixScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { db } from '../../services/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function FareMatrixScreen() {
  const [fareMatrix, setFareMatrix] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFareMatrix = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'fareMatrix'));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFareMatrix(data);
      } catch (err) {
        console.error('Error fetching fare matrix:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFareMatrix();
  }, []);

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={{ marginTop: 10 }}>Loading fare matrix...</Text>
      </View>
    );
  }

  if (fareMatrix.length === 0) {
    return (
      <View style={styles.loading}>
        <Text>No fare data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {fareMatrix.map(item => (
        <View key={item.id} style={styles.card}>
          {Object.entries(item).map(([key, value]) => {
            if (key === 'id') return null; // skip internal id
            return (
              <View style={styles.row} key={key}>
                <Text style={styles.label}>{key}:</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    paddingHorizontal: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
    color: 'black',
    marginRight: 6,
    textTransform: 'capitalize',
  },
  value: {
    color: 'black',
    flexShrink: 1,
  },
});
