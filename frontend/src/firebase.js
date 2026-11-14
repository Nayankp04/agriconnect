// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCVN0ipGvD_Fn5DaIloycv6nVF18yxQo0k",
    authDomain: "agriconnect-f12ab.firebaseapp.com",
    projectId: "agriconnect-f12ab",
    storageBucket: "agriconnect-f12ab.firebasestorage.app",
    messagingSenderId: "372286455512",
    appId: "1:372286455512:web:192b7e26e7effac10fa1ad",
    measurementId: "G-H238Q8QL6D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);