import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
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
// Use auto-detected long polling to improve reliability on iOS Safari/mobile networks
export const db = initializeFirestore(app, {
  // Mitigate Safari/extension/CORS issues with Firestore listen/write
  experimentalAutoDetectLongPolling: true,
  experimentalForceLongPolling: true as any,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }) as any,
});

// Persistence is configured via localCache above; no imperative enable calls needed.
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