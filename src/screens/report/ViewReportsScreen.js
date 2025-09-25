//ViewReportsScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView, Platform, StatusBar } from 'react-native';
import { db } from '../../services/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ViewReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState(null);

  useEffect(() => {
    const loadUserAndReports = async () => {
      try {
        //Load logged-in user
        const storedUser = await AsyncStorage.getItem('loggedInUser');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        setUserName(parsedUser?.name);

        //Fetch all reports
        const q = query(collection(db, 'reports'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        //Filter by current user
        const userReports = allReports.filter(r => r.userName === parsedUser?.name);
        setReports(userReports);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndReports();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ReportDetails', { report: item })}
    >
      <Text style={styles.type}>{item.type}</Text>
      <Text style={styles.mtop}>MTOP: {item.mtopNumber}</Text>
      <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading reports...</Text>
      </SafeAreaView>
    );
  }

  if (reports.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>No reports submitted by you.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  type: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'black',
  },
  mtop: {
    marginTop: 4,
    fontSize: 14,
    color: 'black',
  },
  description: {
    marginTop: 4,
    fontSize: 14,
    color: '#555',
  },
  loadingText: {
    marginTop: 40,
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
  },
  emptyText: {
    marginTop: 40,
    textAlign: 'center',
    color: 'black',
    fontSize: 16,
  },
});
