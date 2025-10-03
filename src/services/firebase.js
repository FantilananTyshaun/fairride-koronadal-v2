// src/services/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyDoF9WZSVe4GlwYCvDlxtWUqq9pHz7GLdA",
  authDomain: "fairride-koronadal.firebaseapp.com",
  projectId: "fairride-koronadal",
  storageBucket: "fairride-koronadal.appspot.com",
  messagingSenderId: "16577067553",
  appId: "1:16577067553:web:88475222a53bf470904160",
};

// Initialize Firebase app
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// ✅ Initialize Auth with AsyncStorage persistence
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export default app;
