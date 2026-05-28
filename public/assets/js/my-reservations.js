import { observeAuth, getCurrentUserProfile } from "./auth.js";
import { 
    collection, 
    getDocs, 
    doc, 
    query, 
    where, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

const welcomeSpan = document.getElementById('userWelcome');
let currentUserSession = null;

observeAuth(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
    } else {
        currentUserSession = user;
        
        loadUserReservations(); 

        try {
            const userData = await getCurrentUserProfile(user.uid);
            if (userData && welcomeSpan) {
                welcomeSpan.textContent = `👋 ¡Bienvenid@, ${userData.fullName || 'Usuario'}!`;
            }
        } catch (error) {
            console.error("Error al obtener los datos de perfil:", error);
        }
    }
});

async function loadUserReservations() {
    const container = document.getElementById('userReservationsContainer');
    if (!container || !currentUserSession) return;

    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-primary spinner-border-sm" role="status"></div>
            <p class="text-muted small mt-2">Cargando tu historial de reservaciones...</p>
        </div>
    `;

    try {
        const roomsSnapshot = await getDocs(collection(db, "rooms"));
        const roomsDataMap = {};
        roomsSnapshot.forEach(doc => roomsDataMap[doc.id] = doc.data());

        const typeRoomsSnapshot = await getDocs(collection(db, "typeRooms"));
        const typeRoomsMap = {};
        typeRoomsSnapshot.forEach(doc => typeRoomsMap[doc.id] = doc.data());

        const reservationsRef = collection(db, "reservations");
        const q = query(reservationsRef, where("guestId", "==", currentUserSession.uid));
        const querySnapshot = await getDocs(q);

        container.innerHTML = "";

        if (querySnapshot.empty) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted bg-white border p-4 rounded-3 d-inline-block shadow-sm">
                        Aún no cuentas con reservaciones registradas en tu cuenta.
                    </p>
                </div>
            `;
            return;
        }

        querySnapshot.forEach((reservaDoc) => {
            const reserva = reservaDoc.data();
            const idReserva = reservaDoc.id;
            const cuartoFisico = roomsDataMap[reserva.roomId] || {};
            const categoriaCuarto = typeRoomsMap[cuartoFisico.typeId] || { name: "Habitación Estándar", capacity: 4 };

            const esCancelada = reserva.status === "cancelled";
            
            const cardHTML = `
                <div class="col">
                    <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden position-relative ${esCancelada ? 'opacity-75 bg-light-subtle' : ''}">
                        <div class="card-body p-4 d-flex flex-column">
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h5 class="fw-bold text-dark mb-0">${categoriaCuarto.name}</h5>
                                <span class="badge ${esCancelada ? 'bg-danger-subtle text-danger border-danger-subtle' : 'bg-success-subtle text-success border-success-subtle'} border rounded-pill px-3 py-1 text-uppercase small" style="font-size: 11px; font-weight: 600;">
                                    ${reserva.status}
                                </span>
                            </div>
                            
                            <p class="text-secondary small mb-2">🏷️ <strong>Asignación:</strong> Habitación ${cuartoFisico.roomNumber || "S/N"}</p>

                            <div class="my-3 small text-muted bg-white p-3 rounded-3 border shadow-inner">
                                📅 <strong>Periodo:</strong> Del ${reserva.checkInDate} al ${reserva.checkOutDate} (${reserva.nights} noches)<br>
                                💰 <strong>Costo Total:</strong> <span class="text-primary fw-bold">$${reserva.total} MXN</span>
                            </div>

                            ${!esCancelada ? `
                                <div class="mt-auto pt-3 border-top d-flex flex-column flex-md-row gap-3 align-items-stretch align-items-md-center justify-content-between">
        
                                    <div class="d-flex align-items-center justify-content-between justify-content-md-start gap-2">
                                        <label class="small text-muted mb-0" style="font-size: 11px;">👥 Huéspedes:</label>
                                        <input type="number" 
                                            class="form-control form-control-sm text-center fw-bold bg-light" 
                                            id="guestsInput_${idReserva}" 
                                            value="${reserva.guests || 1}" 
                                            min="1" 
                                            max="${categoriaCuarto.capacity}" 
                                            style="width: 65px; border-radius: 8px;">
                                    </div>
        
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-outline-primary btn-sm rounded-pill px-3 fw-medium btn-edit-guests flex-grow-1 flex-md-grow-0" 
                                                data-id="${idReserva}" 
                                                data-max="${categoriaCuarto.capacity}">
                                            Guardar 💾 
                                        </button>
                                        <button class="btn btn-outline-danger btn-sm rounded-pill px-3 fw-medium btn-cancel-reserva flex-grow-1 flex-md-grow-0" 
                                                data-id="${idReserva}">
                                            Cancelar Reservación
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="mt-auto pt-3 border-top text-center">
                                    <p class="text-danger small mb-0 fw-medium">Esta reservación fue cancelada y la habitación ha sido liberada.</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', cardHTML);
        });

    } catch (error) {
        console.error("Error crítico al procesar la lista de reservas:", error);
    }
}

document.getElementById('userReservationsContainer')?.addEventListener('click', async (e) => {
    
    const btnEdit = e.target.closest('.btn-edit-guests');
    if (btnEdit) {
        const idReserva = btnEdit.dataset.id;
        const maxCapacidad = parseInt(btnEdit.dataset.max, 10);
        const inputHuespedes = document.getElementById(`guestsInput_${idReserva}`);
        const nuevosHuespedes = parseInt(inputHuespedes?.value || "1", 10);

        if (nuevosHuespedes < 1) {
            alert("⚠️ El número de huéspedes no puede ser menor a 1.");
            return;
        }

        try {
            const reservaDocRef = doc(db, "reservations", idReserva);
            await updateDoc(reservaDocRef, { 
                guests: nuevosHuespedes,
                updatedAt: new Date()
            });
            alert("🎉 ¡Número de huéspedes actualizado con éxito!");
            loadUserReservations(); 
        } catch (error) {
            console.error("Error al actualizar huéspedes en Firestore:", error);
            alert("No se pudieron guardar los cambios.");
        }
    }

    const btnCancel = e.target.closest('.btn-cancel-reserva');
    if (btnCancel) {
        const idReserva = btnCancel.dataset.id;
        const confirmar = confirm("¿Estás seguro de que deseas cancelar esta reservación? Las fechas quedarán libres inmediatamente para otros clientes.");
        
        if (!confirmar) return;

        try {
            const reservaDocRef = doc(db, "reservations", idReserva);
            await updateDoc(reservaDocRef, { 
                status: "cancelled",
                updatedAt: new Date()
            });
            alert("📉 Tu reservación ha sido cancelada.");
            loadUserReservations(); 
        } catch (error) {
            console.error("Error al actualizar el estado de la reserva:", error);
            alert("No se pudo procesar la cancelación.");
        }
    }
});