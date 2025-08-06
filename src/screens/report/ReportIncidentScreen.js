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
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';

export default function ReportIncidentScreen({ navigation }) {
  const [plateNumber, setPlateNumber] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [reportType, setReportType] = useState('Overcharging');
  const [customType, setCustomType] = useState('');
  const [evidenceUri, setEvidenceUri] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
  }, []);

  const pickEvidence = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need media access to upload evidence.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    if (!result.canceled) {
      setEvidenceUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    const typeToSave = reportType === 'Others' ? customType.trim() : reportType;
    if (!typeToSave || !plateNumber || !description) {
      Alert.alert('Required', 'Please fill out all fields.');
      return;
    }

    const report = {
      type: typeToSave,
      plateNumber,
      description,
      timestamp: new Date().toISOString(),
      location,
      evidence: evidenceUri,
    };

    try {
      const stored = await AsyncStorage.getItem('reports');
      const reports = stored ? JSON.parse(stored) : [];
      reports.push(report);
      await AsyncStorage.setItem('reports', JSON.stringify(reports));

      Alert.alert('Report Saved', 'Your incident report has been saved.');
      setPlateNumber('');
      setDescription('');
      setReportType('Overcharging');
      setCustomType('');
      setEvidenceUri(null);
    } catch (err) {
      console.error('Failed to save report:', err);
      Alert.alert('Error', 'Failed to save report.');
    }
  };

  const isVideo = evidenceUri?.endsWith('.mp4');

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

        <Text style={styles.label}>Add Photo or Video Evidence</Text>
        <TouchableOpacity style={styles.pickButton} onPress={pickEvidence}>
          <Text style={styles.pickButtonText}>Pick from Gallery</Text>
        </TouchableOpacity>

        {evidenceUri &&
          (isVideo ? (
            <Video
              source={{ uri: evidenceUri }}
              style={styles.preview}
              useNativeControls
              resizeMode="contain"
            />
          ) : (
            <Image source={{ uri: evidenceUri }} style={styles.preview} resizeMode="cover" />
          ))}

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
  pickButton: {
    backgroundColor: '#f1f1f1',
    padding: 12,
    borderRadius: 8,
    borderColor: 'black',
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  pickButtonText: {
    color: 'black',
    fontWeight: 'bold',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 16,
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
