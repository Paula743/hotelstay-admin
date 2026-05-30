import { hideAlert, showAlert, getFirebaseErrorMessage, observeAuth, logoutUser, setButtonLoading, addRoom, getRoomTypes } from "./auth.js";
import { doc, getDoc, collection, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

//Constante para cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');

//Constantes para registrar habitación
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

//Constantes para editar habitación
const editRoomForm = document.getElementById('editRoomForm')
const editRoomNumberInput = document.getElementById('editRoomNumber')
const editTypeIdInput = document.getElementById('editTypeId')
const editFloorInput = document.getElementById('editFloor')
const editPricePerNightInput = document.getElementById('editPricePerNight')
const editStatusInput = document.getElementById('editStatus')

const saveRoomEditBtn = document.getElementById('saveRoomEditBtn')

const editRoomModalElement = document.getElementById('editRoomModal')
const editRoomModal = editRoomModalElement ? bootstrap.Modal.getOrCreateInstance(editRoomModalElement) : null

// Variable y constante para eliminar habitación
let roomToDelete = null
const deleteRoomBtn = document.getElementById('confirmDeleteBtn')
const deleteRoomModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteRoomModal'))

//Verificar rol
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

// Cerrar sesión
logoutBtn?.addEventListener('click', async () => {
    try { await logoutUser(); } catch (error) { console.error("Error al cerrar sesión:", error); }
});

// Modal para registrar habitación
addRoomForm?.addEventListener('submit', async (event) => {
    event.preventDefault()

    const roomNumber = roomNumberInput.value.trim()
    const typeId = typeIdSelect.value.trim()
    const floor = parseInt(floorInput.value.trim(), 10)
    const pricePerNight = parseFloat(pricePerNightInput.value.trim())
    const status = statusSelect ? statusSelect.value : 'available'

    if (!roomNumber || !typeId) {
            alert('Todos los campos son obligatorios para el registro.');
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
        '<i class="bi bi-check-circle me-2"></i> Registrar habitación',
        'Registrando...'
        )

        await addRoom({ 
        roomNumber, 
        typeId,
        floor,
        pricePerNight,
        status,
        role: "customer",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
        })

        setTimeout(() => {
        addRoomModal?.hide()
<<<<<<< HEAD
        addRoomForm.reset() 
        }, 100)
=======
        addRoomForm.reset()
        loadRooms();
        }, 1500)
>>>>>>> feature/dashboard

    } catch (error) {
        alert( 'No se pudo registrar la habitación')
    } finally {
        setButtonLoading(
        saveRoomBtn,
        false,
        '<i class="bi bi-check-circle me-2"></i> Registrar habitación' 
        )
    }
})

//Carga los tipos de habitacion que existen
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

//Cargar el tipo de habitaciones en el modal de edición
async function upEditRoomType(selectedTypeId) {
  try {
    const listaDeTipos = await getRoomTypes();
    editTypeIdInput.innerHTML = '<option value="">-- Selecciona un tipo --</option>';

    listaDeTipos.forEach((tipo) => {
      const option = document.createElement('option');
      option.value = tipo.id;
      option.textContent = tipo.name;
      option.dataset.price = tipo.basePrice;

      if (tipo.id === selectedTypeId) {
        option.selected = true;
      }

      editTypeIdInput.appendChild(option);
    });

  } catch (error) {
    editTypeIdInput.innerHTML = '<option value="">Error al cargar los tipos</option>';
  }
}

// Cargar información anterior al formulario
editRoomModalElement?.addEventListener('show.bs.modal', (event) => {
  const button = event.relatedTarget
  const roomId = button.getAttribute('data-id')
  const type   = button.getAttribute('data-type')

  document.getElementById('editRoomId').value = button.getAttribute('data-id')
  editRoomNumberInput.value    = button.getAttribute('data-number')
  editFloorInput.value         = button.getAttribute('data-floor')
  editPricePerNightInput.value = button.getAttribute('data-price')
  editStatusInput.value        = button.getAttribute('data-status')

  upEditRoomType(type)

})

// Modal para edición de habitación
editRoomForm?.addEventListener('submit', async (event) => {
  event.preventDefault()

  hideAlert('roomAlert')
  hideAlert('roomSuccess')

  const roomId = document.getElementById('editRoomId').value;
  const roomNumber = editRoomNumberInput.value.trim()
  const floor = editFloorInput.value.trim()
  const type = editTypeIdInput.value.trim()
  const status = editStatusInput.value.trim()
  const price = editPricePerNightInput.value.trim()

  if (!roomId) {
    showAlert('roomAlert', 'No se encontró el ID de la habitación');
    return;
  }

  if(!roomNumber || !type){
    showAlert('roomAlert', 'Todos los campos son obligatorios');
    return;
  }

  if (!floor) {
    showAlert('roomAlert', 'El número de piso es obligatorio');
    return; 
  }

  if (!price || Number(price) <= 0) {
    showAlert('roomAlert', 'Por favor, ingresa un precio válido');
    return;
  }

  try {
    setButtonLoading(
      saveRoomEditBtn,
      true,
      '<i class="bi bi-check-circle m-2"></i> Guardar Cambios',
      'Guardando...'
    )

    const roomRef = doc(db, "rooms", roomId);
    await updateDoc(roomRef, {
        roomNumber: roomNumber,
        floor: Number(floor), 
        typeId: type,
        status: status,
        pricePerNight: Number(price)
    })

    showAlert('roomSuccess', 'Habitación Actualizado')
    await loadRooms();

    setTimeout(() => {
      editRoomModal?.hide()
      hideAlert('roomSuccess')
    }, 100)

  } catch (error) {
    showAlert('roomAlert', error.message || 'No se logro actualizar')

  } finally {
    setButtonLoading(
      saveRoomEditBtn,
      false,
      '<i class="bi bi-check-circle m-2"></i> Guardar Cambios'
    )
  }
})

// Abre el modal y guarda el id
window.deleteRoom = async function(button) {
    roomToDelete = button.getAttribute('data_id')
    deleteRoomModal.show()
    console.log(roomToDelete)
}

// Elimina la habitación
deleteRoomBtn?.addEventListener('click', async () => {
    if (!roomToDelete) return

    try {
        await deleteDoc(doc(db, 'rooms', roomToDelete))
        deleteRoomModal.hide()
        await loadRooms()

    } catch (error) {
        console.error('Error al eliminar habitación:', error)
    } finally {
        roomToDelete = null
    }
})

// Tarjetas con información de las habitaciones
async function loadRooms() {
    try {
        const roomsContainer = document.getElementById("roomsContainer");
        roomsContainer.innerHTML = "";
        const querySnapshot = await getDocs(collection(db, "rooms"));

        const listaDeTipos = await getRoomTypes();

        querySnapshot.forEach((doc) => {
            const room = doc.data();
            const roomId = doc.id;

            const tipo = listaDeTipos.find(t => t.id === room.typeId);
            const tipoNombre = tipo ? tipo.name : 'Sin tipo';

            roomsContainer.innerHTML += `
            <div class="col-md-4">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body">

                        <h5 class="card-title">
                            Habitación ${room.roomNumber}
                        </h5>

                        <p class="card-text">
                            <strong>Tipo:</strong> ${tipoNombre}  
                        </p>

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
                    <div class="d-flex gap-2 w-100 align-items-center">
                        <button type="button" 
                                class="btn btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2 text-dark m-2" 
                                style="border-color: #cbd5e1; border-radius: 8px;"
                                data-bs-toggle="modal" 
                                data-bs-target="#editRoomModal"
                                data-id="${roomId}"
                                data-number="${room.roomNumber}"
                                data-type="${room.typeId}"
                                data-floor="${room.floor}"
                                data-price="${room.pricePerNight}"
                                data-status="${room.status}">
                            <i class="bi bi-pencil fs-6"></i>
                            <span>Edit</span>
                        </button>

                        <button type="button" 
                                class="btn btn-outline-secondary d-flex align-items-center justify-content-center p-3 text-danger m-2" 
                                style="border-color: #cbd5e1; border-radius: 8px; width: 42px; height: 42px;"
                                data_id="${roomId}"
                                onclick="deleteRoom(this)">
                            <i class="bi bi-trash3 fs-5"></i>
                        </button>
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
