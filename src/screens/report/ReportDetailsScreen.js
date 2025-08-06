//reportdetailsscreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { Video } from 'expo-av';

export default function ReportDetailsScreen({ route }) {
  const { report } = route.params;
  const formattedDate = new Date(report.timestamp).toLocaleString();
  const isVideo = report.evidence && report.evidence.endsWith('.mp4');

  return (
    <View style={styles.container}>
      {report.evidence && (
        isVideo ? (
          <Video
            source={{ uri: report.evidence }}
            style={styles.media}
            useNativeControls
            resizeMode="contain"
          />
        ) : (
          <Image
            source={{ uri: report.evidence }}
            style={styles.media}
            resizeMode="cover"
          />
        )
      )}

      <Text style={styles.label}>Report Type:</Text>
      <Text style={styles.text}>{report.type}</Text>

      <Text style={styles.label}>MTOP / Plate Number:</Text>
      <Text style={styles.text}>{report.plateNumber}</Text>

      <Text style={styles.label}>Description:</Text>
      <Text style={styles.text}>{report.description}</Text>

      <Text style={styles.label}>Date & Time:</Text>
      <Text style={styles.text}>{formattedDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    padding: 16,
    backgroundColor: '#fff',
  },
  media: {
    width: '100%',
    height: 240,
    borderRadius: 10,
    marginBottom: 16,
  },
  label: {
    fontWeight: 'bold',
    color: 'black',
    marginTop: 8,
  },
  text: {
    fontSize: 16,
    color: 'black',
    marginBottom: 6,
  },
});
