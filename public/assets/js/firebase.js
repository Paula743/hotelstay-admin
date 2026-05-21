import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
/*
const firebaseConfig = {
  apiKey: "AIzaSyA1tzLIU0MGuE0_vtOveDSq7ejV6NkF82k",
  authDomain: "hotelstay-admin.firebaseapp.com",
  projectId: "hotelstay-admin",
  storageBucket: "hotelstay-admin.firebasestorage.app",
  messagingSenderId: "181513277608",
  appId: "1:181513277608:web:5ea0091f5215f49d0ef29d"
};
*/
const firebaseConfig = {
    apiKey: "AIzaSyBWio_zXZ5_KlRVPOTj6Jx0UiJ5zVRhEqA",
    authDomain: "hotelstays-376e5.firebaseapp.com",
    projectId: "hotelstays-376e5",
    storageBucket: "hotelstays-376e5.firebasestorage.app",
    messagingSenderId: "310214488562",
    appId: "1:310214488562:web:80bc17afbc8fa9ffff3b6b"
  };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }