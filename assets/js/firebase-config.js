import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, push, set, update, get, onValue, remove, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyAfNLKv-jNyyAaVrYSbwPnJKyNClDiF94Y",
    authDomain: "dj-posaxa-web.firebaseapp.com",
    databaseURL: "https://dj-posaxa-web-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "dj-posaxa-web",
    storageBucket: "dj-posaxa-web.appspot.com",
    messagingSenderId: "647042791526",
    appId: "1:647042791526:web:3b870e05ab0ed34cbd95a7",
    measurementId: "G-C8R4Z4TLE1"
};

const app = initializeApp(firebaseConfig);
console.log("Firebase App Initialized:", app.name);

const auth = getAuth(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Expose to window for legacy support and other scripts
// Safe exposure logic to handle load order differences
const firebaseAuthObj = {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    onAuthStateChanged,
    signOut,
    onValue,
    remove,
    push,
    set,
    serverTimestamp,
    runTransaction,
    getStorage,
    storageRef,
    uploadBytes,
    getDownloadURL
};

if (typeof window.exposeFirebase === 'function') {
    window.exposeFirebase(auth, database, ref, update, get, firebaseAuthObj);
} else {
    // Fallback if main.js hasn't loaded yet
    window.auth = auth;
    window.database = database;
    window.ref = ref;
    window.update = update;
    window.get = get;
    window.onValue = onValue;
    window.remove = remove;
    window.push = push;
    window.set = set;
    window.serverTimestamp = serverTimestamp;
    window.runTransaction = runTransaction;
    window.firebaseAuth = firebaseAuthObj;
}

// Also export for ES module usage
export {
    auth, database, storage, ref, update, get, onValue, remove, push, set,
    onAuthStateChanged, serverTimestamp, runTransaction,
    GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword,
    createUserWithEmailAndPassword, updateProfile, signOut,
    getStorage, storageRef, uploadBytes, getDownloadURL
};
