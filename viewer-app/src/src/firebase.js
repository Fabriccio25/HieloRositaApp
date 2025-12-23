import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAWyvl5HVJCUDeWbuvGtDzeHuP6HFD8kYQ",
    authDomain: "ventasapp-6113d.firebaseapp.com",
    projectId: "ventasapp-6113d",
    storageBucket: "ventasapp-6113d.firebasestorage.app",
    messagingSenderId: "899737335400",
    appId: "1:899737335400:web:1e1603423cf4969728eddd",
    measurementId: "G-3KDXWR38WM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
