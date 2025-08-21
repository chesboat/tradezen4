import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
import { getAnalytics, isSupported as analyticsIsSupported } from 'firebase/analytics';

// Your Firebase configuration object
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Auth and Firestore instances
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enable Firestore offline persistence (with multi-tab support when possible)
if (typeof window !== 'undefined') {
  // Try multi-tab persistence first so multiple tabs can share the cache
  enableMultiTabIndexedDbPersistence(db).catch(async (err: any) => {
    // If multi-tab isn't available, try single-tab persistence
    if (err?.code === 'failed-precondition' || err?.code === 'unimplemented') {
      try {
        await enableIndexedDbPersistence(db);
      } catch (e) {
        // Persistence not available (e.g., private mode); continue online-only
        console.warn('Firestore persistence unavailable:', e);
      }
    } else {
      console.warn('Failed to enable multi-tab persistence:', err);
    }
  });
}
// Initialize Analytics only when supported (avoids blank page issues locally)
export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== 'undefined') {
  analyticsIsSupported()
    .then((supported) => {
      if (supported) {
        try {
          analytics = getAnalytics(app);
        } catch (e) {
          console.warn('Firebase Analytics not initialized:', e);
        }
      }
    })
    .catch(() => {
      // Ignore
    });
}

export default app;