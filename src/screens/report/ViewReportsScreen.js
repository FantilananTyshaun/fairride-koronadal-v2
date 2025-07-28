import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ViewReportsScreen({ navigation }) {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const stored = await AsyncStorage.getItem('reports');
        const parsed = stored ? JSON.parse(stored) : [];
        setReports(parsed.reverse());
      } catch (err) {
        console.error('Failed to load reports:', err);
      }
    };

    const unsubscribe = navigation.addListener('focus', loadReports);
    return () => unsubscribe();
  }, [navigation]);

  const renderItem = ({ item }) => {
    const formattedDate = new Date(item.timestamp).toLocaleString();

    return (
      <View style={styles.item}>
        <Text style={styles.title}>Plate #: {item.plateNumber}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.timestamp}>{formattedDate}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={reports}
        keyExtractor={(_, index) => index.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.empty}>No reports submitted yet.</Text>
        }
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
    color: 'green',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: 'green',
  },
  timestamp: {
    fontSize: 12,
    color: 'green',
    marginTop: 4,
  },
  empty: {
    marginTop: 40,
    textAlign: 'center',
    fontSize: 16,
    color: 'green',
  },
});
