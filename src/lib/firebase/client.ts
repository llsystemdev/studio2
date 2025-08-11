// This file is intended for client-side Firebase initialization and exports.
// It should NOT contain any server-side code, like the Firebase Admin SDK.

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// This is the public Firebase config for the client-side.
// It reads from environment variables to ensure a single source of truth.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Basic validation to ensure environment variables are loaded.
if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
    console.error("Firebase config is not set. Please check your .env file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set.");
}


// Initialize Firebase on the client-side
let app: FirebaseApp;

// This approach prevents re-initialization in HMR (Hot Module Replacement) environments
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}


const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
