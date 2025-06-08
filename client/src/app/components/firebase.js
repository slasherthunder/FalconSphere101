import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDN1xD03GeODQiCNnrYD49d0Hk1Z2Na5zs",
  authDomain: "falconsphere-407ae.firebaseapp.com",
  projectId: "falconsphere-407ae",
  storageBucket: "falconsphere-407ae.appspot.com",
  messagingSenderId: "841163655482",
  appId: "1:841163655482:web:e05c87189fdd9f54cb6803"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app; 