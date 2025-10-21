// PASTE YOUR FIREBASE CONFIGURATION HERE

// For Firebase JS SDK v9 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDw_QwKBXpK_ooZapmYYweag3a-HyIH5us",
  authDomain: "industrias-wayne-5a570.firebaseapp.com",
  projectId: "industrias-wayne-5a570",
  storageBucket: "industrias-wayne-5a570.firebasestorage.app",
  messagingSenderId: "642700597205",
  appId: "1:642700597205:web:1b7a630aa4e2986ae20f5c",
  measurementId: "G-2B3RTXS4YK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar serviços de forma condicional
const auth = firebase.auth();
window.auth = auth;

if (typeof firebase.firestore === 'function') {
  const db = firebase.firestore();
  window.db = db;
}

if (typeof firebase.storage === 'function') {
  const storage = firebase.storage();
  window.storage = storage;
}

// Expor config globalmente
window.firebaseConfig = firebaseConfig;




