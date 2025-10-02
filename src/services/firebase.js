// src/services/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDoF9WZSVe4GlwYCvDlxtWUqq9pHz7GLdA",
  authDomain: "fairride-koronadal.firebaseapp.com",
  projectId: "fairride-koronadal",
  storageBucket: "fairride-koronadal.appspot.com", // ✅ fixed bucket domain
  messagingSenderId: "16577067553",
  appId: "1:16577067553:web:88475222a53bf470904160",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
