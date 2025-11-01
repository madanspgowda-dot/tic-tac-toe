// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyARgZ8tN1jlqlNLn7-tKago5S7ldwg6d6s",
  authDomain: "tic-tac-toe-62648.firebaseapp.com",
  databaseURL: "https://tic-tac-toe-62648-default-rtdb.firebaseio.com",
  projectId: "tic-tac-toe-62648",
  storageBucket: "tic-tac-toe-62648.firebasestorage.app",
  messagingSenderId: "630903602521",
  appId: "1:630903602521:web:4906a4ad5ab52abb972048",
  measurementId: "G-25SK6SNW1E",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getDatabase(app);

// ✅ Export everything needed
export { app, analytics, auth, db };
