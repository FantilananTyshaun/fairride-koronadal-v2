//ReportOverchargingScreen.js
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function ReportOverchargingScreen({ navigation }) {
  const [mtopNumber, setMtopNumber] = useState('');
  const [description, setDescription] = useState('');
  const [user, setUser] = useState(null);

  //Load logged in user
  useEffect(() => {
    (async () => {
      const storedUser = await AsyncStorage.getItem('loggedInUser');
      if (storedUser) setUser(JSON.parse(storedUser));
    })();
  }, []);

  //Submit report to "reports" collection
  const handleSubmit = async () => {
    if (!mtopNumber || !description) {
      Alert.alert('Required', 'Please fill out all fields.');
      return;
    }

    try {
      await addDoc(collection(db, 'reports'), {
        type: 'Overcharging',
        mtopNumber,
        description,
        timestamp: serverTimestamp(),
        userName: user?.name || 'Anonymous',
      });

      Alert.alert('Report Saved', 'Your report has been uploaded.');

      // Reset form
      setMtopNumber('');
      setDescription('');
    } catch (err) {
      console.error('Failed to save report:', err);
      Alert.alert('Error', 'Failed to save report. Check console for details.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>MTOP Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter MTOP number"
          value={mtopNumber}
          onChangeText={setMtopNumber}
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
