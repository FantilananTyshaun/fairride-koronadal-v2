//ViewReportsScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { db, auth } from '../../services/firebase';
import { collection, query, orderBy, where, getDocs } from 'firebase/firestore';

export default function ViewReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      if (!auth.currentUser) {
        setReports([]);
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, 'reports'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const userReports = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReports(userReports);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ReportDetails', { report: item })}
    >
      <Text style={styles.type}>{item.type}</Text>
      <Text style={styles.mtop}>MTOP: {item.mtopNumber}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.message}>Loading reports...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (reports.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.message}>No reports submitted yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#fff',
    borderColor: 'black',
    borderWidth: 1,
    padding: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  type: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
    marginBottom: 4,
  },
  mtop: {
    fontSize: 14,
    color: 'black',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#555',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 16,
    color: 'black',
  },
});