//ReportDetailsScreen.js
import React from 'react';
import {
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';

export default function ReportDetailsScreen({ route }) {
  const { report } = route.params;

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

        <Text style={styles.label}>Date & Time</Text>
        <Text style={styles.value}>{formattedDate}</Text>
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
});
