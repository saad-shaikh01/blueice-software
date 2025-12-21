import { initializeApp } from 'firebase/app';

// const firebaseConfig = {
//   apiKey: "YOUR_API_KEY",
//   authDomain: "YOUR_AUTH_DOMAIN",
//   projectId: "YOUR_PROJECT_ID",
//   storageBucket: "YOUR_STORAGE_BUCKET",
//   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
//   appId: "YOUR_APP_ID",
//   measurementId: "YOUR_MEASUREMENT_ID",
// };

const firebaseConfig = {
  apiKey: "AIzaSyBJVKyjZLUd-HZECDPwbgjXLLWcdzeeoms",
  authDomain: "jira-demo-98e33.firebaseapp.com",
  projectId: "jira-demo-98e33",
  storageBucket: "jira-demo-98e33.firebasestorage.app",
  messagingSenderId: "958329004149",
  appId: "1:958329004149:web:9bda00bab08c74f793183c",
  measurementId: "G-DBDGWVHNHD"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;