// import app from 'firebase/app';
// import 'firebase/auth';

// const firebaseConfig = {
//   //Enter your firebase API details
//   };
// class Firebase {
//   constructor() {
//     app.initializeApp(firebaseConfig);
//     this.auth = app.auth();
//   }
  
//   // *** Auth API ***

//   doCreateUserWithEmailAndPassword = (email, password) =>
//   this.auth.createUserWithEmailAndPassword(email, password);

//   doSignInWithEmailAndPassword = (email, password) =>
//   this.auth.signInWithEmailAndPassword(email, password);

//   doSignOut = () => this.auth.signOut();

//   doPasswordReset = email => this.auth.sendPasswordResetEmail(email);

//   doPasswordUpdate = password =>
//     this.auth.currentUser.updatePassword(password);

//   doGetIdToken = (bool) => {
//     return this.auth.currentUser.getIdToken(/* forceRefresh */ bool);
//   }

//   doGetUserByEmail = email => this.auth.getUserByEmail(email);

// }

// export default Firebase;

// Import the functions needed from the Firebase SDKs
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  //paste the content of your firebaseConfig here
  apiKey: "AIzaSyA1ctTMAqKRud_RmO_5V6R6j0hJuSPKD8E",
  authDomain: "skillswap-lino.firebaseapp.com",
  projectId: "skillswap-lino",
  storageBucket: "skillswap-lino.firebasestorage.app",
  messagingSenderId: "956834227560",
  appId: "1:956834227560:web:4ef51182fd8ae7e80ca2dd",
  measurementId: "G-698QE4ZR66"
};

// Initialize Firebase only if no app instance exists
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

class Firebase {
  constructor() {
    this.auth = getAuth(app);
  }

  // *** Auth API ***
  doCreateUserWithEmailAndPassword = (email, password) =>
    createUserWithEmailAndPassword(this.auth, email, password);

  doSignInWithEmailAndPassword = (email, password) =>
    signInWithEmailAndPassword(this.auth, email, password);

  doSignOut = () => signOut(this.auth);

  doPasswordReset = email => sendPasswordResetEmail(this.auth, email);

  doPasswordUpdate = password =>
    updatePassword(this.auth.currentUser, password);

  // Function to get ID Token of the currently signed-in user
  doGetIdToken = () => {
    return new Promise((resolve, reject) => {
      const user = this.auth.currentUser;
      if (user) {
        user
          .getIdToken()
          .then(token => {
            resolve(token);
          })
          .catch(error => {
            reject(error);
          });
      } else {
        reject(new Error('No user is signed in.'));
      }
    });
  };
}

export default Firebase;