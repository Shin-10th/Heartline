import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Copy .env.example to .env and fill in your Firebase project's web config
// (Firebase console -> Project settings -> General -> Your apps) to go live.
// Until then, `isFirebaseConfigured` is false and every hook in hooks/ falls
// back to sample data (lib/demoData.ts) instead of crashing -- that's what
// lets the whole app be browsable before the backend exists.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
  } catch (err) {
    // Config present but invalid (typo'd key, project deleted, etc.) -- warn
    // once and keep the app usable in demo mode rather than crashing on boot.
    console.warn("[firebase] failed to initialize, falling back to demo mode:", err);
  }
}

export const firebaseApp = app;
export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;
