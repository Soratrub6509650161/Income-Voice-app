// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA6jSiXetvK69mpza4Wix3rJSYjwpwkCsY",
  authDomain: "speech-recognition-app-428d5.firebaseapp.com",
  projectId: "speech-recognition-app-428d5",
  storageBucket: "speech-recognition-app-428d5.firebasestorage.app",
  messagingSenderId: "304047990028",
  appId: "1:304047990028:web:50673396794ed093c61529",
  measurementId: "G-9BDGD063PZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);