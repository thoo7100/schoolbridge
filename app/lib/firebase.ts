import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBk_b9zigQS8_JlC0B1kC2EGv9upDCsi6Q",
  authDomain: "schoolbridge-c7f06.firebaseapp.com",
  projectId: "schoolbridge-c7f06",
  storageBucket: "schoolbridge-c7f06.firebasestorage.app",
  messagingSenderId: "1055641334208",
  appId: "1:1055641334208:web:444e67fbb7865480439825"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export services
export const db = getFirestore(app);
export const auth = getAuth(app);