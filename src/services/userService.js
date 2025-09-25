//userService.js
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  updateEmail,
  updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/** Register a new user in Firebase Auth + Firestore */
export const registerUser = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  await setDoc(doc(db, 'users', user.uid), { name, email, createdAt: new Date().toISOString() });
  return user;
};

/** Login existing user */
export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

/** Logout user */
export const logoutUser = async () => {
  await signOut(auth);
};

/** Get user profile from Firestore */
export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

/** Update user profile in Firebase Auth + Firestore */
export const updateUserProfile = async ({ name, email, password }) => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  if (name) await updateProfile(user, { displayName: name });
  if (email && user.email !== email) await updateEmail(user, email);
  if (password) await updatePassword(user, password);

  await setDoc(doc(db, 'users', user.uid), { name, email }, { merge: true });
};
