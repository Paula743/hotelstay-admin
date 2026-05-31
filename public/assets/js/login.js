import { hideAlert, showAlert, setButtonLoading, loginUser, observeAuth, getFirebaseErrorMessage } from "./auth.js";

const form = document.getElementById('loginForm');
const emailInput = document.getElementById('loginEmail');
const passwordInput = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');

let isLoggingIn = false;

observeAuth((user) => {
     if (user && !isLoggingIn) { 
        window.location.href = 'dashboard.html';
    }
});

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    hideAlert('errorMessage');

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    if (!email || !password) {
        showAlert('errorMessage', 'Por favor, completa todos los campos.');
        return;        
    }

    isLoggingIn = true;

    try {
        setButtonLoading(loginBtn, true, 'Ingresar', 'Iniciando Sesión...'); 
        const user = await loginUser({ email, password });
    
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js");
        const { db } = await import("./firebase.js");
    
        const currentUser = await getDoc(doc(db, "users", user.uid));

        if (currentUser.exists() && currentUser.data().role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
        window.location.href = 'dashboard.html';
        }
    
    } catch (error) {
        showAlert('errorMessage', getFirebaseErrorMessage(error));
        isLoggingIn = false;
    
    } finally {
        setButtonLoading(loginBtn, false, 'Ingresar'); 
    }
});
