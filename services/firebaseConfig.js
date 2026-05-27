import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Hardcoded keys for final EAS build
const firebaseConfig = {
  apiKey: "AIzaSyBpUkx-Vjp9mByOI0wUDsOREkdkGXBRwXE",
  authDomain: "waypoint-ead81.firebaseapp.com",
  projectId: "waypoint-ead81",
  storageBucket: "waypoint-ead81.firebasestorage.app",
  messagingSenderId: "811512905408",
  appId: "1:811512905408:web:2ac1c7a989da4211693725"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore Database and Authentication
export const db = getFirestore(app);
export const auth = getAuth(app);