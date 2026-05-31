import { observeAuth, logoutUser, hideAlert, showAlert, updateCurrentProfile, setButtonLoading, getCurrentUserProfile 
} from "./auth.js";
import { collection, getDocs, doc, query, where, runTransaction 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js"; 

const welcomeSpan = document.getElementById('userWelcome');
const logoutBtn = document.getElementById('logoutBtn');

// Constantes para edición de Perfil
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModalElement = document.getElementById('editProfileModal');
const editProfileForm = document.getElementById('editProfileForm');
const saveProfileBtn = document.getElementById('saveProfileBtn');

const editName = document.getElementById('editName');
const editEmail = document.getElementById('editEmail');
const editPhone = document.getElementById('editPhone');
const editAddress = document.getElementById('editAddress');

// Constantes para Calendario de Estancia
const checkInInput = document.getElementById('checkInDate');
const checkOutInput = document.getElementById('checkOutDate');
const guestsInput = document.getElementById('guestsCount');
const searchRoomsForm = document.getElementById('searchRoomsForm');
const roomsResultsContainer = document.getElementById('roomsResultsContainer');
const placeholderMessage = document.getElementById('placeholderMessage');
const resultsTitle = document.getElementById('resultsTitle');
const resultsSubtitle = document.getElementById('resultsSubtitle');

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
async function isRoomOccupied(roomId, checkInBuscado, checkOutBuscado) {
    const reservationsRef = collection(db, "reservations");
    const q = query(
        reservationsRef, 
        where("roomId", "==", roomId),
        where("status", "==", "reserved") 
    );
    
    const querySnapshot = await getDocs(q);
    let ocupada = false;

    querySnapshot.forEach((doc) => {
        const reserva = doc.data();
        if (checkInBuscado < reserva.checkOutDate && checkOutBuscado > reserva.checkInDate) {
            ocupada = true; 
        }
    });

    return ocupada;
}

async function loadAvailableRooms(requiredGuests) {
    try {
        /*
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

                const checkInBuscado = checkInInput?.value;
                const checkOutBuscado = checkOutInput?.value;

                const habitacionesFisicasDeEsteTipo = roomsList.filter(room => 
                    room.typeId === idDelTipo && 
                    room.active !== false
                );

                const habitacionesFisicasDisponibles = [];

                for (const room of habitacionesFisicasDeEsteTipo) {
                    const ocupada = await isRoomOccupied(room.id, checkInBuscado, checkOutBuscado);
                    if (!ocupada) {
                        habitacionesFisicasDisponibles.push(room);
                    }
                }

                if (habitacionesFisicasDisponibles.length > 0) {
                    filteredResults.push({
                        ...tipoData,
                        finalPrice: habitacionesFisicasDisponibles[0].pricePerNight || tipoData.basePrice || 0,
                        availableStock: habitacionesFisicasDisponibles.length
                    });
                }
            }
        }*/

        const guestCount = Number(guestsInput.value);
        const checkIn = checkInInput.value;
        const checkOut = checkOutInput.value;
    
        const bookingsSnapshot = await getDocs(collection(db, 'reservations'));
        const roomsSnapshot = await getDocs(collection(db, 'rooms'));
        const roomTypesSnapshot = await getDocs(collection(db, 'typeRooms'));
    
        
        const occupiedRooms = [];
    
        bookingsSnapshot.forEach((bookingDoc) => {
    
            const booking = bookingDoc.data();
    
            const bookingStart = booking.checkInDate;
            const bookingEnd = booking.checkOutDate;
    
            // Verifica cruce de fechas
            const isOverlapping = checkIn <= bookingEnd && checkOut >= bookingStart;
    
            if (isOverlapping) {
            occupiedRooms.push(booking.roomId);
            }
        });
    
        // Habitaciones disponibles
        const availableRooms = [];
    
        roomsSnapshot.forEach((roomDoc) => {
            //const room = roomDoc.data();
            const room = {
                id: roomDoc.id,
                ...roomDoc.data()
            };
    
            if (!occupiedRooms.includes(room.id) && room.status != 'maintenance') {
                availableRooms.push(room);
            }
        });
    
        // Tipos disponibles
        const availableRoomTypes = [];
    
        roomTypesSnapshot.forEach((typeDoc) => {
    
            const roomType = typeDoc.data();
    
            const hasAvailableRoom = availableRooms.some(
            room => room.typeId === typeDoc.id
            );
    
            if (hasAvailableRoom && roomType.capacity >= guestCount) {
            availableRoomTypes.push({
                id: typeDoc.id,
                ...roomType,
                finalPrice: roomType.basePrice,
                availableStock: availableRoomTypes.length
            });
            }
        });
    

        renderRoomCards(availableRoomTypes);

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
                            <button 
                                class="btn btn-dark btn-sm rounded-pill px-4 fw-medium add-to-cart-btn" 
                                data-id="${room.id}"
                                data-name="${room.name}"
                                data-price="${room.finalPrice}"
                                data-capacity="${room.capacity}"
                            >
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

let cartReservations = JSON.parse(localStorage.getItem('cartReservations')) || [];

function addToCart(room) {
    const fechaCheckIn = checkInInput.value;
    const fechaCheckOut = checkOutInput.value;
    const nochesCalculadas = calculateSelectedNights();
    const huespedes = parseInt(guestsInput?.value || "1", 10);

    cartReservations = []; 

    cartReservations.push({ 
        ...room, 
        nights: nochesCalculadas,
        checkIn: fechaCheckIn,   
        checkOut: fechaCheckOut,
        guests: huespedes
    });
    
    localStorage.setItem('cartReservations', JSON.stringify(cartReservations));
    updateCartUI();

    const offcanvasElement = document.getElementById('reservationsOffcanvas');
    if (offcanvasElement) {
        const instance = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
        instance.show();
    }
}

function updateCartUI() {
    const reservationItems = document.getElementById('reservationItems');
    const reservationsEmpty = document.getElementById('reservationsEmpty');
    const reservationCount = document.getElementById('reservationCount');
    const reservationTotal = document.getElementById('reservationTotal');
    const checkoutBtn = document.getElementById('checkoutReservationsBtn');

    reservationCount.textContent = cartReservations.length;

    if (cartReservations.length === 0) {
        reservationsEmpty.classList.remove('d-none');
        reservationItems.innerHTML = '';
        reservationTotal.textContent = '$0';
        checkoutBtn.disabled = true;
        return;
    }

    reservationsEmpty.classList.add('d-none');
    checkoutBtn.disabled = false;
    
    let total = 0;
    reservationItems.innerHTML = '';

    cartReservations.forEach((item, index) => {
        const itemTotal = item.basePrice * item.nights;
        total += itemTotal;

        reservationItems.innerHTML += `
            <div class="card mb-3 border-0 bg-light rounded-3 p-3 position-relative">
                <button onclick="removeFromCart(${index})" class="btn-close position-absolute top-0 end-0 m-2" style="font-size: 0.8rem;"></button>
                <h6 class="fw-bold mb-1">${item.name}</h6>
                <small class="text-muted d-block mb-2">Máximo: ${item.capacity} personas</small>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold text-primary">$${item.basePrice} / noche</span>
                
                    <div class="input-group input-group-sm" style="width: 120px;">
                        <span class="input-group-text bg-white small">Noches</span>
                        <input 
                            type="number" 
                            class="form-control text-center bg-white" 
                            value="${item.nights}" 
                            disabled
                        >
                    </div>
                </div>
            </div>
        `;
    });

    reservationTotal.textContent = `$${total}`;
}

window.removeFromCart = (index) => {
    cartReservations.splice(index, 1);
    localStorage.setItem('cartReservations', JSON.stringify(cartReservations));
    updateCartUI();
};

window.updateNights = (index, value) => {
    const nightsParsed = parseInt(value, 10);
    cartReservations[index].nights = nightsParsed > 0 ? nightsParsed : 1;
    localStorage.setItem('cartReservations', JSON.stringify(cartReservations));
    updateCartUI();
};

updateCartUI();

function calculateSelectedNights() {
    const checkInStr = checkInInput?.value;
    const checkOutStr = checkOutInput?.value;

    const fechaEntrada = new Date(checkInStr + 'T00:00:00');
    const fechaSalida = new Date(checkOutStr + 'T00:00:00');

    const diferenciaMilisegundos = fechaSalida - fechaEntrada;
    const noches = Math.ceil(diferenciaMilisegundos / (1000 * 60 * 60 * 24));

    return noches;
}

roomsResultsContainer?.addEventListener('click', (e) => {
    const targetButton = e.target.closest('.add-to-cart-btn');
    
    if (targetButton) {
        const roomData = {
            id: targetButton.dataset.id,
            name: targetButton.dataset.name,
            basePrice: parseFloat(targetButton.dataset.price),
            capacity: parseInt(targetButton.dataset.capacity, 10)
        };

        addToCart(roomData);

        const offcanvasElement = document.getElementById('reservationsOffcanvas');
        if (offcanvasElement) {
            const instance = bootstrap.Offcanvas.getOrCreateInstance(offcanvasElement);
            instance.show();
        }
    }
});

document.getElementById('clearReservationsBtn')?.addEventListener('click', () => {
    cartReservations = [];
    localStorage.removeItem('cartReservations');
    updateCartUI();
});

const checkoutReservationsBtn = document.getElementById('checkoutReservationsBtn');

checkoutReservationsBtn?.addEventListener('click', async () => {
    if (cartReservations.length === 0) return;
    const reservationToProcess = cartReservations[0]; 

    try {
        setButtonLoading(checkoutReservationsBtn, true, 'Confirmar Reservación 🛎️', 'Creando Reservación...');

        let numeroHabitacionAsignada = "";
        const ahora = new Date();

        const roomsRef = collection(db, "rooms");
        const qRooms = query(
            roomsRef, 
            where("typeId", "==", reservationToProcess.id), 
            where("active", "!=", false)
        );

        const roomsSnapshot = await getDocs(qRooms);
        let roomPhysicalId = null;

        for (const roomDoc of roomsSnapshot.docs) {
            const isOccupied = await isRoomOccupied(roomDoc.id, reservationToProcess.checkIn, reservationToProcess.checkOut);
            if (!isOccupied) {
                roomPhysicalId = roomDoc.id;
                numeroHabitacionAsignada = roomDoc.data().roomNumber || "S/N";
                break; 
            }
        }

        if (!roomPhysicalId) {
            throw new Error("Lo sentimos, no quedan habitaciones físicas disponibles de esta categoría para las fechas solicitadas.");
        }

        await runTransaction(db, async (transaction) => {
            const docReservaRef = doc(collection(db, "reservations"));
            const nuevaReservaData = {
                guestId: currentUserSession?.uid || "invitado", 
                guests: reservationToProcess.guests,         
                roomId: roomPhysicalId,                                  
                checkInDate: reservationToProcess.checkIn,               
                checkOutDate: reservationToProcess.checkOut,             
                nights: reservationToProcess.nights,                     
                pricePerNight: reservationToProcess.basePrice,           
                total: reservationToProcess.basePrice * reservationToProcess.nights, 
                status: "reserved",                                      
                createdAt: ahora,                                        
                updatedAt: ahora                                         
            };

            transaction.set(docReservaRef, nuevaReservaData);
        });

        document.getElementById('modalRoomNumber').innerText = `Habitación ${numeroHabitacionAsignada}`;
        document.getElementById('modalDates').innerText = `${reservationToProcess.checkIn} al ${reservationToProcess.checkOut} (${reservationToProcess.nights} noches)`;
        document.getElementById('modalGuests').innerText = `${reservationToProcess.guests} ${reservationToProcess.guests === 1 ? 'persona' : 'personas'}`;
        document.getElementById('modalTotalPrice').innerText = `$${reservationToProcess.basePrice * reservationToProcess.nights} MXN`;

        const offcanvasElement = document.getElementById('reservationsOffcanvas');
        if (offcanvasElement) {
            const instanceOffcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
            instanceOffcanvas?.hide();
        }

        cartReservations = [];
        localStorage.removeItem('cartReservations');
        updateCartUI();

        const modalElement = document.getElementById('successReservationModal');
        const bootstrapModal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
        });
        bootstrapModal.show();

        document.getElementById('btnAcceptModal')?.addEventListener('click', () => {
            bootstrapModal.hide();
            window.location.reload();
        });

    } catch (error) {
        console.error("Error al procesar la reserva directa:", error);
        alert(error.message || "No se pudo crear la reserva. Inténtalo de nuevo.");
    } finally {
        setButtonLoading(checkoutReservationsBtn, false, 'Confirmar Reservación 🛎️');
    }
});