// src/screens/report/ReportIncidentScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ReportIncidentScreen({ navigation }) {
  const [plateNumber, setPlateNumber] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [reportType, setReportType] = useState('Overcharging');
  const [customType, setCustomType] = useState('');

  // Request location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  // Submit report to Firebase
  const handleSubmit = async () => {
    const typeToSave = reportType === 'Others' ? customType.trim() : reportType;

    if (!typeToSave || !plateNumber || !description) {
      Alert.alert('Required', 'Please fill out all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'reports'), {
        type: typeToSave,
        plateNumber,
        description,
        location: location ?? null,
        evidence: null, // removed evidence
        timestamp: serverTimestamp(),
      });

      Alert.alert('Report Saved', 'Your incident report has been uploaded.');

      // Reset form
      setPlateNumber('');
      setDescription('');
      setReportType('Overcharging');
      setCustomType('');
    } catch (err) {
      console.error('Failed to save report:', err);
      Alert.alert('Error', 'Failed to save report. Check console for details.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Report Type</Text>
        <View style={styles.pickerRow}>
          {['Overcharging', 'Unsafe Driving', 'Others'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pickerOption,
                reportType === type && styles.pickerOptionSelected,
              ]}
              onPress={() => setReportType(type)}
            >
              <Text
                style={[
                  styles.pickerText,
                  reportType === type && styles.pickerTextSelected,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {reportType === 'Others' && (
          <>
            <Text style={styles.label}>Custom Report Type</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Reckless Behavior"
              value={customType}
              onChangeText={setCustomType}
              placeholderTextColor="#999"
            />
          </>
        )}

        <Text style={styles.label}>MTOP / Tricycle Plate Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter MTOP or plate number"
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 6,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    color: 'black',
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: '#E6F5E6',
  },
  pickerText: {
    color: 'black',
    fontWeight: 'bold',
  },
  pickerTextSelected: {
    textDecorationLine: 'underline',
  },
  button: {
    backgroundColor: '#E6F5E6',
    padding: 14,
    borderRadius: 10,
    borderColor: 'black',
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'black',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
