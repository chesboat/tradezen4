import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';
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
// Try WebSocket by default, fall back to long polling on mobile
const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
export const db = initializeFirestore(app, {
  // Use long polling only on iOS Safari where WebSocket has issues
  experimentalForceLongPolling: isIOSSafari as any,
  localCache: memoryLocalCache() as any,
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