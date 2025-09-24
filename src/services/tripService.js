import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Save a trip to Firebase Firestore
 * @param {Object} trip - Trip data
 * @param {String} uid - Current user UID
 */
export const saveTripToFirebase = async (trip, uid) => {
  if (!uid) throw new Error('User UID is required to save trip.');
  try {
    const tripsRef = collection(db, 'users', uid, 'trips'); // ✅ linked to user
    await addDoc(tripsRef, trip);
    console.log('[TripService] Trip saved to Firebase for user:', uid);
  } catch (err) {
    console.error('[TripService] Failed to save trip to Firebase:', err);
    throw err;
  }
};
