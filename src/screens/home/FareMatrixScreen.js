//FareMatrixScreen.js
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
          {/* Zone Name */}
          <Text style={styles.zoneName}>{item.zoneName || 'Unnamed Zone'}</Text>
          <View style={styles.separator} />

          {/* Kindergarten Fare */}
          <View style={styles.row}>
            <Text style={styles.label}>Kindergarten Fare:</Text>
            <Text style={styles.value}>
              ₱{item.kindergartenFare ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.separator} />

          {/* PWD Fare */}
          <View style={styles.row}>
            <Text style={styles.label}>PWD Fare:</Text>
            <Text style={styles.value}>
              ₱{item.pwdFare ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.separator} />

          {/* Regular Fare */}
          <View style={styles.row}>
            <Text style={styles.label}>Regular Fare:</Text>
            <Text style={styles.value}>
              ₱{item.regularFare ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.separator} />

          {/* Student College Fare */}
          <View style={styles.row}>
            <Text style={styles.label}>Student College Fare:</Text>
            <Text style={styles.value}>
              ₱{item.studentCollegeFare ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.separator} />

          {/* Student Elementary Fare */}
          <View style={styles.row}>
            <Text style={styles.label}>Student Elementary Fare:</Text>
            <Text style={styles.value}>
              ₱{item.studentElemFare ?? 'N/A'}
            </Text>
          </View>
          <View style={styles.separator} />

          {/* Student High School Fare */}
          <View style={styles.row}>
            <Text style={styles.label}>Student High School Fare:</Text>
            <Text style={styles.value}>
              ₱{item.studentHighSchoolFare ?? 'N/A'}
            </Text>
          </View>
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  zoneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 6,
  },
  label: {
    fontWeight: 'bold',
    color: 'black',
    fontSize: 16,
  },
  value: {
    color: 'black',
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'right',
  },
});
