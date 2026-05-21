import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1tzLIU0MGuE0_vtOveDSq7ejV6NkF82k",
  authDomain: "hotelstay-admin.firebaseapp.com",
  projectId: "hotelstay-admin",
  storageBucket: "hotelstay-admin.firebasestorage.app",
  messagingSenderId: "181513277608",
  appId: "1:181513277608:web:5ea0091f5215f49d0ef29d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }