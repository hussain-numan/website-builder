// firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "genwebai-bd9b9.firebaseapp.com",
  projectId: "genwebai-bd9b9",
  storageBucket: "genwebai-bd9b9.firebasestorage.app",
  messagingSenderId: "545322969106",
  appId: "1:545322969106:web:869ff1d98a704cc6db50cb",
};

const app = initializeApp(firebaseConfig);

// Auth
export const auth = getAuth(app);

// Google Provider
export const provider = new GoogleAuthProvider();

// Optional but recommended
provider.setCustomParameters({
  prompt: "select_account",
});
