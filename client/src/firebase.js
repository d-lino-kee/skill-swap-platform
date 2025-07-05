import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCkyjWByrwhPyanLPGdlzim31yVziMqhtQ",
    authDomain: "skillswap-4c550.firebaseapp.com",
    projectId: "skillswap-4c550",
    storageBucket: "skillswap-4c550.firebasestorage.app",
    messagingSenderId: "626478410972",
    appId: "1:626478410972:web:c5edf26e5effe6e9d6d819",
    measurementId: "G-DMMKTL42MW"
  };  

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut };