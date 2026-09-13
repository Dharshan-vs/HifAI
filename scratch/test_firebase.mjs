import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

try {
  const firebaseConfig = {
    apiKey: "AIzaSyDummyDevKeyForPreviewOnly123456789",
    authDomain: "yuga-preview.firebaseapp.com",
    projectId: "yuga-preview",
    storageBucket: "yuga-preview.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890",
  };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  console.log("Firebase initialized successfully:", app.name);
} catch (e) {
  console.log("Caught error:", e.message);
}
