import { 
    observeAuth, 
    logoutUser, 
    hideAlert, 
    showAlert, 
    updateCurrentProfile, 
    setButtonLoading,
    getCurrentUserProfile 
} from "./auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js"; 

const welcomeSpan = document.getElementById('userWelcome');
const logoutBtn = document.getElementById('logoutBtn');

//Constantes para edición de Perfil
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModalElement = document.getElementById('editProfileModal');
const editProfileForm = document.getElementById('editProfileForm');
const saveProfileBtn = document.getElementById('saveProfileBtn');

const editName = document.getElementById('editName');
const editEmail = document.getElementById('editEmail');
const editPhone = document.getElementById('editPhone');
const editAddress = document.getElementById('editAddress');

// Constantes para Calendario de Estadía
const checkInInput = document.getElementById('checkInDate');
const checkOutInput = document.getElementById('checkOutDate');
const searchRoomsForm = document.getElementById('searchRoomsForm');
const roomsResultsContainer = document.getElementById('roomsResultsContainer');
const placeholderMessage = document.getElementById('placeholderMessage');
const resultsTitle = document.getElementById('resultsTitle');
const resultsSubtitle = document.getElementById('resultsSubtitle')

const editProfileModal = editProfileModalElement 
    ? bootstrap.Modal.getOrCreateInstance(editProfileModalElement) 
    : null;

let currentUserSession = null;

observeAuth(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUserSession = user;
        try {
            const userData = await getCurrentUserProfile(user.uid);

            if (userData) {
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
    try { 
        await logoutUser(); 
    } catch (error) { 
        console.error("Error al cerrar sesión:", error); 
    }
});

editProfileBtn?.addEventListener('click', async () => {
    if (!currentUserSession) return;

    hideAlert('profileAlert');
    hideAlert('profileSuccess');

    try {
        const data = await getCurrentUserProfile(currentUserSession.uid);

        if (data) {
            if (editName) editName.value = data.fullName || '';
            if (editEmail) editEmail.value = data.email || '';
            if (editPhone) editPhone.value = data.phone || '';
            if (editAddress) editAddress.value = data.address || '';
            
            editProfileModal?.show();
        }
    } catch (error) {
        console.error("Error al precargar el perfil:", error);
    }
});


editProfileForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    hideAlert('profileMessage');

    const name = editName?.value.trim();
    const email = editEmail?.value.trim();
    const phone = editPhone?.value.trim();
    const address = editAddress?.value.trim();

    if (!name) {
        showAlert('profileMessage', 'El nombre completo es obligatorio.');
        return; 
    }
    if (!email) {
        showAlert('profileMessage', 'El correo electrónico es obligatorio.');
        return;
    }

    try {
        setButtonLoading(saveProfileBtn, true, 'Guardar Cambios', 'Guardando...');

        await updateCurrentProfile(currentUserSession.uid, {
            fullName: name,
            email: email,
            phone: phone,
            address: address
        });

        showAlert('profileMessage', '¡Perfil actualizado con éxito!');
        
        const alertBox = document.getElementById('profileMessage');
        alertBox?.classList.remove('alert-danger');
        alertBox?.classList.add('alert-success');

        if (welcomeSpan) {
            welcomeSpan.textContent = `👋 ¡Bienvenid@, ${name}!`;
        }

        setTimeout(() => {
            editProfileModal?.hide();
        }, 1500);

    } catch (error) {
        console.error("Error al guardar en Firestore:", error);
        showAlert('profileMessage', error.message || 'No se pudo actualizar.');
    } finally {
        setButtonLoading(saveProfileBtn, false, 'Guardar Cambios');
    }
});

const hoy = new Date().toISOString().split('T')[0];
if (checkInInput) {
    checkInInput.min = hoy;
    
    checkInInput.addEventListener('change', (e) => {
        const fechaSeleccionada = e.target.value;
        if (checkOutInput) {
            checkOutInput.min = fechaSeleccionada; 
            if (checkOutInput.value <= fechaSeleccionada) {
                checkOutInput.value = "";
            }
        }
    });
}