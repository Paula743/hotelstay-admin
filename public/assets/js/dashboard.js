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
const guestsInput = document.getElementById('guestsCount');
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
            if (fechaSeleccionada) {
                const fechaEntrada = new Date(fechaSeleccionada + 'T00:00:00');
                fechaEntrada.setDate(fechaEntrada.getDate() + 1);
                const mañanaDeFechaSeleccionada = fechaEntrada.toISOString().split('T')[0];
                
                checkOutInput.min = mañanaDeFechaSeleccionada;
            } else {
                checkOutInput.min = hoy;
            }
            if (checkOutInput.value <= fechaSeleccionada) {
                checkOutInput.value = "";
            }
        }
    });
}

async function loadAvailableRooms(requiredGuests) {
    try {
        const typeRoomsSnapshot = await getDocs(collection(db, "typeRooms"));
        const typeRoomsList = {};
        
        typeRoomsSnapshot.forEach(doc => {
            typeRoomsList[doc.id] = { id: doc.id, ...doc.data() };
        });

        const roomsSnapshot = await getDocs(collection(db, "rooms"));
        const roomsList = [];
        
        roomsSnapshot.forEach(doc => {
            roomsList.push({ id: doc.id, ...doc.data() });
        });

        const filteredResults = [];

        for (const idDelTipo in typeRoomsList) {
            const tipoData = typeRoomsList[idDelTipo];
            
            if (tipoData.capacity >= requiredGuests) {
                
                const habitacionesFisicasDisponibles = roomsList.filter(room => 
                    room.typeId === idDelTipo && 
                    room.status === 'available' && 
                    room.active !== false
                );

                if (habitacionesFisicasDisponibles.length > 0) {
                    filteredResults.push({
                        ...tipoData,
                        finalPrice: habitacionesFisicasDisponibles[0].pricePerNight || tipoData.basePrice || 0,
                        availableStock: habitacionesFisicasDisponibles.length
                    });
                }
            }
        }
        renderRoomCards(filteredResults);

    } catch (error) {
        console.error("Error crítico al procesar la búsqueda en Firestore:", error);
        if (roomsResultsContainer) {
            roomsResultsContainer.innerHTML = `
                <div class="col-12 text-center text-danger py-5">
                    Hubo un error al intentar consultar la disponibilidad de las habitaciones.
                </div>
            `;
        }
    }
}

function renderRoomCards(roomTypes) {
    if (!roomsResultsContainer) return;
    
    if (placeholderMessage) placeholderMessage.classList.add('d-none');
    resultsTitle?.classList.remove('d-none');
    resultsSubtitle?.classList.remove('d-none');
    roomsResultsContainer.innerHTML = "";

    if (roomTypes.length === 0) {
        roomsResultsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <p class="text-muted fs-5">No hay habitaciones disponibles que cumplan con la capacidad o fechas solicitadas.</p>
            </div>
        `;
        return;
    }

    roomTypes.forEach(room => {
    const badges = `<span class="badge bg-light text-dark border me-1 mb-1"> Máximo: ${room.capacity} personas</span>`;

        const cardHTML = `
            <div class="col">
                <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative">
                    <img src="${room.image}" 
                         class="card-img-top" alt="${room.name}" style="height: 220px; object-fit: cover;">
                    <div class="card-body p-4 d-flex flex-column">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <h5 class="card-title fw-bold text-dark mb-0">${room.name}</h5>
                        </div>
                        <p class="card-text text-muted small text-truncate-3 mb-3">${room.description}</p>
                        <div class="mb-3">
                            ${badges}
                        </div>
                        <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                            <div>
                                <span class="fs-4 fw-bold text-primary">$${room.finalPrice}</span>
                                <small class="text-muted text-uppercase d-block" style="font-size: 10px;">Por noche</small>
                            </div>
                            <button class="btn btn-dark btn-sm rounded-pill px-4 fw-medium" data-id="${room.id}">
                                Reservar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        roomsResultsContainer.insertAdjacentHTML('beforeend', cardHTML);
    });
}

searchRoomsForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const checkIn = checkInInput?.value;
    const checkOut = checkOutInput?.value;
    // Leemos el valor del input numérico y lo transformamos a un entero base 10
    const guestsNeeded = parseInt(guestsInput?.value || "1", 10);

    if (!checkIn || !checkOut) {
        alert("Por favor, selecciona las fechas completas para tu estancia.");
        return;
    }

    if (roomsResultsContainer) {
        roomsResultsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p class="mt-2 text-muted">Buscando opciones óptimas para ${guestsNeeded} huéspedes...</p>
            </div>
        `;
    }
    await loadAvailableRooms(guestsNeeded);
});