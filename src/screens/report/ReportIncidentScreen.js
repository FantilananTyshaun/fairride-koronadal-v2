import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

export default function ReportIncidentScreen({ navigation }) {
  const [plateNumber, setPlateNumber] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const handleSubmit = async () => {
    if (!plateNumber || !description) {
      Alert.alert('Required', 'Please fill out all fields.');
      return;
    }

    const report = {
      plateNumber,
      description,
      timestamp: new Date().toISOString(),
      location,
    };

    try {
      const stored = await AsyncStorage.getItem('reports');
      const reports = stored ? JSON.parse(stored) : [];
      reports.push(report);
      await AsyncStorage.setItem('reports', JSON.stringify(reports));

      Alert.alert('Report Saved', 'Your incident report has been saved.');
      setPlateNumber('');
      setDescription('');
    } catch (err) {
      console.error('Failed to save report:', err);
      Alert.alert('Error', 'Failed to save report.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>Tricycle Plate Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter plate number"
        value={plateNumber}
        onChangeText={setPlateNumber}
        placeholderTextColor="#999"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Describe the incident"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={5}
        placeholderTextColor="#999"
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Report</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('ViewReports')}
      >
        <Text style={styles.secondaryButtonText}>View Submitted Reports</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 6,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: 'green',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    color: 'green',
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#E6F5E6',
    padding: 14,
    borderRadius: 10,
    borderColor: 'green',
    borderWidth: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'green',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
