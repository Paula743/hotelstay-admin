import { hideAlert, showAlert, getFirebaseErrorMessage, observeAuth, logoutUser, setButtonLoading, addRoom, getRoomTypes } from "./auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

const logoutBtn = document.getElementById('logoutBtn');

const addRoomForm = document.getElementById('addRoomForm')
const roomNumberInput = document.getElementById('roomNumber') 
const typeIdSelect = document.getElementById('typeId') 
const floorInput = document.getElementById('floor') 
const pricePerNightInput = document.getElementById('pricePerNight') 
const statusSelect = document.getElementById('status')
const openAddRoomBtn = document.getElementById('openAddRoomBtn')
const saveRoomBtn = document.getElementById('saveRoomBtn') 


const addRoomModalElement = document.getElementById('addRoomModal')
const addRoomModal = addRoomModalElement ? bootstrap.Modal.getOrCreateInstance(addRoomModalElement) : null

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

addRoomForm?.addEventListener('submit', async (event) => {
    event.preventDefault()

 
    const roomNumber = roomNumberInput.value.trim()
    const typeId = typeIdSelect.value.trim()
    const floor = parseInt(floorInput.value.trim(), 10)
    const pricePerNight = parseFloat(pricePerNightInput.value.trim())
    const status = statusSelect ? statusSelect.value : 'available'


    if (!roomNumber || !typeId) {
            showAlert('errorMessage', 'Todos los campos son obligatorios para el registro.');
            return;
    }

    if (isNaN(floor) || isNaN(pricePerNight) ) {
        alert('Debe ser un número válido')
        return
    }

    try {
        setButtonLoading(
        saveRoomBtn,
        true,
        '<i class="bi bi-check-circle me-2"></i> Guardar Cambios',
        'Guardando...'
        )

        await addRoom({ 
        roomNumber, 
        typeId,
        floor,
        pricePerNight,
        status,
        role: "client",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
        })

        setTimeout(() => {
        addRoomModal?.hide()
        addRoomForm.reset() 
        }, 1500)

    } catch (error) {
        alert( 'No se pudo registrar la habitación')
    } finally {
        setButtonLoading(
        saveRoomBtn,
        false,
        '<i class="bi bi-check-circle me-2"></i> Guardar Cambios' 
        )
    }
})

async function upRoomType() {
  try {
    const listaDeTipos = await getRoomTypes();
    typeIdSelect.innerHTML = '<option value="">-- Selecciona un tipo --</option>';
    
    listaDeTipos.forEach((tipo) => {
      const option = document.createElement('option');
      
      option.value = tipo.id; 
      option.textContent = tipo.name;
      option.dataset.price = tipo.basePrice;


      typeIdSelect.appendChild(option);
    });
    
  } catch (error) {
    typeIdSelect.innerHTML = '<option value="">Error al cargar los tipos</option>';
  }
}

typeIdSelect.addEventListener('change', () => {
    const selectedOption = typeIdSelect.options[typeIdSelect.selectedIndex];
    const precio = selectedOption.dataset.price;
    if (precio) {
        pricePerNightInput.value = precio;
    } else {
        pricePerNightInput.value = "";
    }

});

async function loadRooms() {
    try {
        const roomsContainer = document.getElementById("roomsContainer");

        roomsContainer.innerHTML = "";

        const querySnapshot = await getDocs(collection(db, "rooms"));

        querySnapshot.forEach((doc) => {
            const room = doc.data();
            roomsContainer.innerHTML += `
            <div class="col-md-4">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body">

                        <h5 class="card-title">
                            Habitación ${room.roomNumber}
                        </h5>

                        <p class="card-text">
                            <strong>Piso:</strong>
                            ${room.floor}
                        </p>

                        <p class="card-text">
                            <strong>Estado:</strong>
                            ${room.status}
                        </p>

                        <p class="card-text">
                            <strong>Precio:</strong>
                            $${room.pricePerNight}
                        </p>

                    </div>
                </div>
            </div>
            `;
        });

    } catch(error) {

        console.error(
            "Error al cargar habitaciones:",
            error
        );

    }

}


document.addEventListener('DOMContentLoaded', upRoomType);
loadRooms();
