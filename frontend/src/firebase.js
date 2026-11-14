import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

// AgriConnect Firebase Web App Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCVN0ipGvD_Fn5DaIloycv6nVF18yxQo0k',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'agriconnect-f12ab.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'agriconnect-f12ab',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'agriconnect-f12ab.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '372286455512',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:372286455512:web:192b7e26e7effac10fa1ad',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-H238Q8QL6D',
};

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Firebase Analytics safely (browser only)
export let analytics = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export default app;
