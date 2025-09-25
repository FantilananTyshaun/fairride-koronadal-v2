import { db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

/**
 * Save trip directly to Firebase under the current user
 */
export const saveTripToFirebase = async (trip, uid) => {
  if (!uid) throw new Error('User UID is required to save trip.');
  const tripsRef = collection(db, 'users', uid, 'trips');
  await addDoc(tripsRef, trip);
};
