import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

// Firebase configuration using Next.js environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy initialization - only initialize when needed and on client side
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Initialize Firebase only on client side
function initializeFirebase() {
  if (typeof window === "undefined") {
    // Don't initialize on server side
    return null;
  }

  if (!app) {
    // Check if Firebase app already exists
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }
  }

  return app;
}

// Get Firestore instance
export function getDb(): Firestore {
  if (!db) {
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      throw new Error("Firebase cannot be initialized on server side");
    }
    db = getFirestore(firebaseApp);
  }
  return db;
}

// Get Auth instance
export function getAuthInstance(): Auth {
  if (!auth) {
    const firebaseApp = initializeFirebase();
    if (!firebaseApp) {
      throw new Error("Firebase cannot be initialized on server side");
    }
    auth = getAuth(firebaseApp);
  }
  return auth;
}

// Export db and auth for backward compatibility, but these will throw on server
export { db, auth };

export default app;
