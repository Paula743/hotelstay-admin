import { hideAlert, showAlert, setButtonLoading, registerUser, getFirebaseErrorMessage } from "./auth.js";

const form = document.getElementById('registerForm');
const fullNameInput = document.getElementById('fullName');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const addressInput = document.getElementById('address');
const passwordInput = document.getElementById('password');
const registerBtn = document.getElementById('registerButton');

form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    hideAlert('errorMessage');

    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const address = addressInput.value.trim();
    const password = passwordInput.value.trim();

    if (!fullName || !email || !phone || !address || !password) {
        showAlert('errorMessage', 'Todos los campos son obligatorios para el registro.');
        return;
    }

    if (password.length < 6) {
        showAlert('errorMessage', 'La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    const userData = {
        fullName,
        email,
        phone,
        address,
        password,
        role: "customer",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date() 
    };

    try {
        setButtonLoading(registerBtn, true, 'Creando Cuenta...');
        await registerUser(userData);

        showAlert('errorMessage', 'Cuenta creada con éxito.');
        const alertBox = document.getElementById('errorMessage');
        alertBox?.classList.remove('alert-danger');
        alertBox?.classList.add('alert-success'); 

        setTimeout(() => {
            window.location.href = 'dashboard.html'; 
        }, 1500);
        
    } catch (error) {
        showAlert('errorMessage', getFirebaseErrorMessage(error));
    } finally {
        setButtonLoading(registerBtn, false, 'Registrarse');
    }
});

document.getElementById('btnHideAlert')?.addEventListener('click', () => {
    hideAlert('errorMessage');
});