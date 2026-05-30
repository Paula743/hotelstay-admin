import { observeAuth, logoutUser } from "./auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

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
                if (userData.role !== 'admin') {
                    window.location.href = 'dashboard.html';
                }
            } else {
                window.location.href = 'login.html';
            }
        } catch (error) {
            console.error("Error en el panel de administración:", error);
            window.location.href = 'login.html';
        }
    }
});

logoutBtn?.addEventListener('click', async () => {
    try { await logoutUser(); } catch (error) { console.error("Error al cerrar sesión:", error); }
});

async function loadRoomStats() {

    try {
        const querySnapshot = await getDocs(collection(db, "rooms"));

        let total = 0;
        let available = 0;
        let reserved = 0;
        let occupied = 0;
        let maintenance = 0;
        let inactive = 0;

        querySnapshot.forEach((doc) => {
            const room = doc.data();
            total++;

            switch(room.status) {
                case "available":
                    available++;
                    break;

                case "reserved":
                    reserved++;
                    break;

                case "occupied":
                    occupied++;
                    break;

                case "maintenance":
                    maintenance++;
                    break;

                case "inactive":
                    inactive++;
                    break;
            }
        });

        document.getElementById("totalRooms").textContent = total;
        document.getElementById("availableRooms").textContent = available;
        document.getElementById("reservedRooms").textContent = reserved;
        document.getElementById("occupiedRooms").textContent = occupied;
        document.getElementById("maintenanceRooms").textContent = maintenance;
        document.getElementById("inactiveRooms").textContent = inactive;

    } catch(error) {

        console.error(
            "Error al cargar estadísticas:",
            error
        );

    }

}

async function loadRoomTypeStats() {

    try {
        const roomTypesContainer = document.getElementById("roomTypesStats");
        roomTypesContainer.innerHTML = "";
        const roomTypesSnapshot = await getDocs(collection(db, "typeRooms"));
        const roomsSnapshot = await getDocs(collection(db, "rooms"));

        roomTypesSnapshot.forEach((typeDoc) => {
            const type = typeDoc.data();
            const typeId = typeDoc.id;
            let totalRooms = 0;

            roomsSnapshot.forEach((roomDoc) => {
                const room = roomDoc.data();
                if (room.typeId === typeId) {
                    totalRooms++;
                }
            });

            roomTypesContainer.innerHTML += `

            <div class="col-md-3">
                <div class="card shadow border-0">
                    <div class="card-body text-center">
                        <h5>${type.name}</h5>
                        <h2>${totalRooms}</h2>
                    </div>
                </div>
            </div>
            `;
        });

    } catch(error) {
        console.error(
            "Error al cargar estadísticas de tipos:",
            error
        );
    }
}

async function loadBookingStats() {

    try {
        const querySnapshot = await getDocs(collection(db, "reservations"));

        let total = 0;
        let reserved = 0;
        let cancelled = 0;

        querySnapshot.forEach((doc) => {
            const reservation = doc.data();
            total++;

            switch(reservation.status) {
                case "reserved":
                    reserved++;
                    break;

                case "cancelled":
                    cancelled++;
                    break;
            }
        });

        document.getElementById("totalReservations").textContent = total;
        document.getElementById("reservedReservations").textContent = reserved;
        document.getElementById("cancelledReservations").textContent = cancelled;
      

    } catch(error) {

        console.error(
            "Error al cargar estadísticas:",
            error
        );

    }

}

async function loadGuestStats() {

    try {
        const querySnapshot = await getDocs(collection(db, "guests"));

        let total = 0;
        let activeGuest = 0;
        let disabledGuest = 0;

        querySnapshot.forEach((doc) => {
            const guest = doc.data();
            total++;

            switch(guest.active) {
                case true:
                    activeGuest++;
                    break;

                case false:
                    disabledGuest++;
                    break;
            }
        });

        document.getElementById("totalGuests").textContent = total;
        document.getElementById("activeGuests").textContent = activeGuest;
        document.getElementById("disabledGuest").textContent = disabledGuest;
      

    } catch(error) {

        console.error(
            "Error al cargar estadísticas:",
            error
        );

    }

}

loadRoomStats();
loadRoomTypeStats();
loadBookingStats();
loadGuestStats();