// Import the functions you need from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDN1xD03GeODQiCNnrYD49d0Hk1Z2Na5zs",
  authDomain: "falconsphere-407ae.firebaseapp.com",
  projectId: "falconsphere-407ae",
  storageBucket: "falconsphere-407ae.appspot.com",
  messagingSenderId: "841163655482",
  appId: "1:841163655482:web:e05c87189fdd9f54cb6803",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Export Firestore and Auth instances
export { db, auth };
