// src/services/tripService.js
import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Save a trip to Firebase Firestore
 * @param {Object} trip - Trip data
 */
export const saveTripToFirebase = async (trip) => {
  try {
    const tripsRef = collection(db, 'trips');
    await addDoc(tripsRef, trip);
    console.log('[TripService] Trip saved to Firebase');
  } catch (err) {
    console.error('[TripService] Failed to save trip to Firebase:', err);
    throw err;
  }
};
