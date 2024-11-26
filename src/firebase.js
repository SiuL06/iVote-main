import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBZL28Y0Iipr7wsQA2E6R1eFV6xjgKIxPU",
  authDomain: "ivote-2fd0b.firebaseapp.com",
  databaseURL: "https://ivote-2fd0b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ivote-2fd0b",
  storageBucket: "ivote-2fd0b.firebasestorage.app",
  messagingSenderId: "1091981317033",
  appId: "1:1091981317033:web:780695ddcbc510f2fa2ab8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Make sure Firebase is initialized and then access the appVerificationDisabledForTesting setting

// Export the initialized services
export { auth, db, storage };
