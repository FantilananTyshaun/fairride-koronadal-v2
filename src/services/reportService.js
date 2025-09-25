import { db } from './firebase';
import { collection, addDoc, query, orderBy, getDocs } from 'firebase/firestore';

/**
 * Save report directly to Firebase under the current user
 */
export const saveReportToFirebase = async (report, uid) => {
  if (!uid) throw new Error('User UID is required to save report.');
  const reportsRef = collection(db, 'users', uid, 'reports');
  await addDoc(reportsRef, report);
};

/**
 * Fetch all reports of the current user
 */
export const fetchUserReports = async (uid) => {
  const q = query(collection(db, 'users', uid, 'reports'), orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
