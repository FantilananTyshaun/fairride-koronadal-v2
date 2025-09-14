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
  Image,
} from 'react-native';
import { db } from '../../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

export default function ViewReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);

  const loadReports = async () => {
    try {
      const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
    } catch (err) {
      console.error('Failed to load reports from Firebase:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadReports);
    return () => unsubscribe();
  }, [navigation]);

  const renderItem = ({ item }) => {
    const formattedDate = item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Unknown';
    const evidenceUri = item?.evidence ?? null;

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('ReportDetails', { report: item })}
      >
        {evidenceUri && (
          <Image
            source={{ uri: evidenceUri }}
            style={{ width: '100%', height: 180, borderRadius: 8, marginBottom: 8 }}
            resizeMode="cover"
          />
        )}
        <Text style={styles.title}>{item?.type ?? 'Unknown'}</Text>
        <Text style={styles.description}>MTOP / Plate #: {item?.plateNumber ?? 'N/A'}</Text>
        <Text style={styles.timestamp}>{formattedDate}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No reports submitted yet.</Text>}
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
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: 'black',
  },
  timestamp: {
    fontSize: 12,
    color: 'black',
    marginTop: 4,
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: 'green',
  },
});
