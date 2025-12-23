import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBtEq9EasXtCb3xa-3vUcN59hYEYxZ2H3w",
    authDomain: "bd-hr-1d45c.firebaseapp.com",
    projectId: "bd-hr-1d45c",
    storageBucket: "bd-hr-1d45c.firebasestorage.app",
    messagingSenderId: "816644493018",
    appId: "1:816644493018:web:f4a8d09f1c4931fde71fe3",
    measurementId: "G-J7N3CWDRYW"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
