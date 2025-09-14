// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDoF9WZSVe4GlwYCvDlxtWUqq9pHz7GLdA",
  authDomain: "fairride-koronadal.firebaseapp.com",
  projectId: "fairride-koronadal",
  storageBucket: "fairride-koronadal.appspot.com",
  messagingSenderId: "16577067553",
  appId: "1:16577067553:web:88475222a53bf470904160"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Automatically sign in anonymously
signInAnonymously(auth)
  .then(() => console.log('[Firebase] Signed in anonymously'))
  .catch((error) => console.error('[Firebase] Anonymous sign-in failed:', error));

export default app;
