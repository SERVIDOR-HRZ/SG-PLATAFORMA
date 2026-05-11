// ═══════════════════════════════════════════════════════════
//   SEAMOS GENIOS — Firebase Initialization
//   Reemplaza los valores con los de tu proyecto en Firebase Console
//   https://console.firebase.google.com → Configuración del proyecto → Tus apps
// ═══════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCrEq4R5Qlg12-aKlGnYB7AIzdHMD4J-c4",
    authDomain: "seamosgenios-5ff9b.firebaseapp.com",
    projectId: "seamosgenios-5ff9b",
    storageBucket: "seamosgenios-5ff9b.firebasestorage.app",
    messagingSenderId: "80889659714",
    appId: "1:80889659714:web:36f1a82c50f8d6d9b648db",
    measurementId: "G-WE7FQPSKVM"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
