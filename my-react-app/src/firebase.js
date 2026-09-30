// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCAduR-9C2l4vy43rDJSkhueLged2x_njo",
    authDomain: "crmbackend-42c83.firebaseapp.com",
    projectId: "crmbackend-42c83",
    storageBucket: "crmbackend-42c83.firebasestorage.app",
    messagingSenderId: "655839450453",
    appId: "1:655839450453:web:ae386adb175c2784714bdc",
    measurementId: "G-1RQ90PS24Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
