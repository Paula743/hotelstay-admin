import { observeAuth, logoutUser, hideAlert, showAlert } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

const welcomeSpan = document.getElementById('userWelcome');
const logoutBtn = document.getElementById('logoutBtn');

observeAuth(async (user) => {
    if (!user) {
        window.location.href = 'login.html';
    } else {
        try {
            const userRef = doc(db, "users", user.uid);
            const currentUser = await getDoc(userRef);

            if (currentUser.exists()) {
                const userData = currentUser.data();
                
                if (userData.role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                    return; 
                }

                welcomeSpan.textContent = `👋 ¡Bienvenid@, ${userData.fullName || 'Usuario'}!`;
            } else {
                welcomeSpan.textContent = `👋 ¡Bienvenid@!`;
            }
        } catch (error) {
            console.error("Error al obtener los datos de Firestore:", error);
            welcomeSpan.textContent = `👋 ¡Bienvenid@!`;
        }
    }
});

logoutBtn?.addEventListener('click', async () => {
    try { await logoutUser(); } catch (error) { console.error("Error al cerrar sesión:", error); }
});