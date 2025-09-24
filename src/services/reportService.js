// src/services/reportService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';


/**
 * Save report locally and optionally to Firebase
 */
export const saveReportLocally = async (report, uid = null) => {
  try {
    const stored = await AsyncStorage.getItem('reports');
    const reports = stored ? JSON.parse(stored) : [];
    reports.push(report);
    await AsyncStorage.setItem('reports', JSON.stringify(reports));

    if (uid) {
      await addDoc(collection(db, 'users', uid, 'reports'), report); // ✅ linked to user
    }
  } catch (err) {
    console.error('Failed to save report locally or Firebase:', err);
  }
};
