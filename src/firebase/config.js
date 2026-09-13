import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const env = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForDevPreview1234567890',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'yuga-preview.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'yuga-preview',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'yuga-preview.appspot.com',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abcdef1234567890',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
try {
  auth.useDeviceLanguage();
} catch (e) {
  console.warn('Firebase language detection warning:', e);
}
export const storage = getStorage(app);

export default app;

