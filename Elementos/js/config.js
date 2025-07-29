// Firebase configuration - Using CDN approach to avoid module issues
const firebaseConfig = {
  apiKey: "AIzaSyCrEq4R5Qlg12-aKlGnYB7AIzdHMD4J-c4",
  authDomain: "seamosgenios-5ff9b.firebaseapp.com",
  projectId: "seamosgenios-5ff9b",
  storageBucket: "seamosgenios-5ff9b.firebasestorage.app",
  messagingSenderId: "80889659714",
  appId: "1:80889659714:web:36f1a82c50f8d6d9b648db",
  measurementId: "G-WE7FQPSKVM"
};

// Initialize Firebase (will be loaded via CDN)
let db;

// Initialize Firebase with better error handling
function initializeFirebase() {
  try {
    console.log('🔥 Inicializando Firebase...');
    
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase CDN no está cargado');
      return false;
    }
    
    // Check if already initialized
    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase app inicializada');
    } else {
      console.log('✅ Firebase ya estaba inicializada');
    }
    
    db = firebase.firestore();
    window.firebaseDB = db; // Make it globally available
    
    console.log('✅ Firestore inicializado y disponible globalmente');
    
    // Dispatch custom event to notify other scripts
    window.dispatchEvent(new CustomEvent('firebaseReady'));
    
    return true;
  } catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    return false;
  }
}

// Try to initialize immediately if Firebase is already loaded
if (typeof firebase !== 'undefined') {
  initializeFirebase();
} else {
  // Wait for Firebase to load
  console.log('⏳ Esperando que Firebase CDN se cargue...');
  
  // Check periodically for Firebase
  const checkFirebase = setInterval(() => {
    if (typeof firebase !== 'undefined') {
      clearInterval(checkFirebase);
      initializeFirebase();
    }
  }, 100);
  
  // Also listen for window load as fallback
  window.addEventListener('load', function() {
    setTimeout(() => {
      if (typeof firebase !== 'undefined' && !window.firebaseDB) {
        initializeFirebase();
      }
    }, 500);
  });
}


