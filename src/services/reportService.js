import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

/**
 * Upload evidence to Firebase Storage
 */
export const uploadEvidence = async (fileUri, fileName) => {
  try {
    const response = await fetch(fileUri);
    const blob = await response.blob();

    const storageRef = ref(storage, `evidence/${fileName}`);
    await uploadBytes(storageRef, blob);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (err) {
    console.error('Failed to upload evidence:', err);
    return null;
  }
};

/**
 * Save report locally and optionally to Firebase
 */
export const saveReportLocally = async (report, userId = null) => {
  try {
    const stored = await AsyncStorage.getItem('reports');
    const reports = stored ? JSON.parse(stored) : [];
    reports.push(report);
    await AsyncStorage.setItem('reports', JSON.stringify(reports));

    if (userId) {
      await addDoc(collection(db, 'users', userId, 'reports'), report);
    }
  } catch (err) {
    console.error('Failed to save report locally or Firebase:', err);
  }
};
