// src/screens/reports/ReportDetailsScreen.js
import React, { useState } from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar,
  Image,
  TouchableOpacity,
  Modal,
  Pressable,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportDetailsScreen({ route }) {
  const { report } = route.params;
  const [modalVisible, setModalVisible] = useState(false);

  const formattedDate = report.timestamp?.toDate
    ? report.timestamp.toDate().toLocaleString()
    : 'Unknown';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Reported By</Text>
        <Text style={styles.value}>{report.userName || 'Anonymous'}</Text>

        <Text style={styles.label}>Report Type</Text>
        <Text style={styles.value}>{report.type || 'Unknown'}</Text>

        <Text style={styles.label}>MTOP Number</Text>
        <Text style={styles.value}>{report.mtopNumber || 'N/A'}</Text>

        <Text style={styles.label}>Description</Text>
        <Text style={styles.value}>
          {report.description || 'No description'}
        </Text>

        {report.photo && (
          <>
            <Text style={styles.label}>Uploaded Photo</Text>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image
                source={{ uri: report.photo }}
                style={styles.photo}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Date & Time</Text>
        <Text style={styles.value}>{formattedDate}</Text>

        {/* Fullscreen image modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalBackground} onPress={() => setModalVisible(false)}>
            <Image
              source={{ uri: report.photo }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
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
    marginTop: 12,
    fontSize: 16,
  },
  value: {
    color: 'black',
    fontSize: 16,
    marginTop: 4,
  },
  photo: {
    width: '100%',
    height: 250,
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'black',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
});
