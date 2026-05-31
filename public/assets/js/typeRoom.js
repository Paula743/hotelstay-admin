import { hideAlert, showAlert, getFirebaseErrorMessage, observeAuth, logoutUser, setButtonLoading, addTypeRoom } from "./auth.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

//Constante para cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');

//Constantes para registrar tipo de habitación
const addTypeRoomForm = document.getElementById('addTypeRoomForm')
const nameCategory = document.getElementById('nameCategory') 
const capacityInput = document.getElementById('capacity') 
const descriptionInput = document.getElementById('description') 
const basePriceInput = document.getElementById('basePrice')
const imageCategoryInput = document.getElementById('image') 
const openAddTypeRoomBtn = document.getElementById('openAddTypeRoomBtn')
const saveTypeRoomBtn = document.getElementById('saveTypeRoomBtn') 

const addTypeRoomModalElement = document.getElementById('addTypeRoomModal')
const addTypeRoomModal = addTypeRoomModalElement ? bootstrap.Modal.getOrCreateInstance(addTypeRoomModalElement) : null

//Constantes para editar tipo de habitación
const editRoomTypeForm = document.getElementById('editRoomTypeForm')
const editNameCategoryInput = document.getElementById('editNameCategory')
const editCapacityInput = document.getElementById('editCapacity')
const editDescriptionInput = document.getElementById('editDescription')
const editBasePriceInput = document.getElementById('editBasePrice')
const editImageInput = document.getElementById('editImage')

const saveRoomTypeEditBtn = document.getElementById('saveRoomTypeEditBtn')

const editRoomTypeModalElement = document.getElementById('editRoomTypeModal')
const editRoomTypeModal = editRoomTypeModalElement ? bootstrap.Modal.getOrCreateInstance(editRoomTypeModalElement) : null

// Variable y constante para eliminar habitación
let roomTypeToDelete = null
const deleteRoomTypeBtn = document.getElementById('confirmDeleteBtn')
const deleteRoomTypeModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteRoomTypeModal'))

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

//Modal para registrar tipo de habitación
addTypeRoomForm?.addEventListener('submit', async (event) => {
  event.preventDefault()

  const name = nameCategory.value.trim()
  const capacityValue = capacityInput.value.trim()
  const description = descriptionInput.value.trim()
  const basePrice = basePriceInput.value.trim()
  const image = imageCategoryInput ? imageCategoryInput.value.trim() : ""

  if (!name || !capacityValue || !description || !basePrice || !image) {
          showAlert('errorMessage', 'Todos los campos son obligatorios para el registro.');
          return;
  }

  const q = query(collection(db, 'typeRooms'), where('name', '==',name))
  const nameExistente = await getDocs(q)

  if(!nameExistente.empty){
        alert('Esta categoría ya está registrada en el sistema')
        return
  }
 
  try {
    setButtonLoading(
      saveTypeRoomBtn,
      true,
      '<i class="bi bi-check-circle me-2"></i> Registrar',
      'Registrando...'
    )

    await addTypeRoom({ 
      name, 
      capacity: parseInt(capacityValue, 10), 
      description, 
      basePrice: parseFloat(basePrice),
      image
    })

    setTimeout(() => {
      addTypeRoomModal?.hide()
      addTypeRoomForm.reset()
      loadRoomTypes();
    }, 1500)

  } catch (error) {
    alert( 'No se pudo registrar el tipo de habitación')
  } finally {
    setButtonLoading(
      saveTypeRoomBtn,
      false,
      '<i class="bi bi-check-circle me-2"></i> Registrar' 
    )
  }
});

// Cargar información anterior al formulario
editRoomTypeModalElement?.addEventListener('show.bs.modal', (event) => {
  const button = event.relatedTarget
  const roomTypeId = button.getAttribute('data-id')

  document.getElementById('editTypeRoomId').value = button.getAttribute('data-id')
  editNameCategoryInput.value     = button.getAttribute('data-name')
  editCapacityInput.value         = button.getAttribute('data-capacity')
  editDescriptionInput.value      = button.getAttribute('data-description')
  editBasePriceInput.value        = button.getAttribute('data-basePrice')
  editImageInput.value            = button.getAttribute('data-image')

})

// Modal para edición de habitación
editRoomTypeForm?.addEventListener('submit', async (event) => {
  event.preventDefault()

  hideAlert('roomAlert')
  hideAlert('roomSuccess')

  const roomTypeId = document.getElementById('editTypeRoomId').value;
  const roomTypeName = editNameCategoryInput.value.trim()
  const capacity = editCapacityInput.value.trim()
  const description = editDescriptionInput.value.trim()
  const basePrice = editBasePriceInput.value.trim()
  const imageRoomType = editImageInput.value.trim()

  if (!roomTypeId) {
    showAlert('roomAlert', 'No se encontró el ID de la habitación');
    return;
  }

  if(!roomTypeName || !capacity || !description || !imageRoomType){
    showAlert('roomAlert', 'Todos los campos son obligatorios');
    return;
  }

  if (!basePrice || Number(basePrice) <= 0) {
    showAlert('roomAlert', 'Por favor, ingresa un precio válido');
    return;
  }

  const q = query(collection(db, 'typeRooms'), where('name', '==',name))
  const nameExistente = await getDocs(q)

  if(!nameExistente.empty){
        alert('Esta categoría ya está registrada en el sistema')
        return
  }

  try {
    setButtonLoading(
      saveRoomTypeEditBtn,
      true,
      '<i class="bi bi-check-circle m-2"></i> Guardar Cambios',
      'Guardando...'
    )

    const roomTypeRef = doc(db, "typeRooms", roomTypeId);
    await updateDoc(roomTypeRef, {
        name: roomTypeName,
        description: description, 
        capacity: capacity,
        basePrice: Number(basePrice),
        image: imageRoomType
    })

    showAlert('roomSuccess', 'Tipo de Habitación Actualizado')
    await loadRoomTypes();

    setTimeout(() => {
      editRoomTypeModal?.hide()
      hideAlert('roomSuccess')
    }, 100)

  } catch (error) {
    showAlert('roomAlert', error.message || 'No se logro actualizar')

  } finally {
    setButtonLoading(
      saveRoomTypeEditBtn,
      false,
      '<i class="bi bi-check-circle m-2"></i> Guardar Cambios'
    )
  }
})

// Abre el modal de delete y guarda el id
window.deleteRoom = async function(button) {
    roomTypeToDelete = button.getAttribute('data_id')
    deleteRoomTypeModal.show()
    console.log(roomTypeToDelete)
}

// Elimina la habitación
deleteRoomTypeBtn?.addEventListener('click', async () => {
    if (!roomTypeToDelete) return

    try {
        await deleteDoc(doc(db, 'typeRooms', roomTypeToDelete))
        deleteRoomTypeModal.hide()
        await loadRoomTypes()

    } catch (error) {
        console.error('Error al eliminar tipo de habitación:', error)
    } finally {
        roomTypeToDelete = null
    }
})

async function loadRoomTypes() {

    try {
        //const plantilla = document.getElementById("molde-container")
        const roomTypesContainer = document.getElementById("roomTypesContainer");
        roomTypesContainer.innerHTML = "";
        const querySnapshot = await getDocs(collection(db, "typeRooms"));
        
        querySnapshot.forEach((doc) => {
            const roomType = doc.data();
            const roomTypeId = doc.id;
            const imgUrl = roomType.image;

            roomTypesContainer.innerHTML += `

            <div class="col-md-4">
                <div class="card shadow-sm border-0 h-100">
                    <div class="card-body">

                        <h5 class="card-title">
                            ${roomType.name}
                        </h5>

                        <p class="card-text">
                            <strong>Descripción:</strong>
                            ${roomType.description}
                        </p>

                        <p class="card-text">
                            <strong>Capacidad:</strong>
                            ${roomType.capacity} personas
                        </p>

                        <p class="card-text">
                            <strong>Precio:</strong>
                            $${roomType.basePrice}
                        </p>
                    </div>
                    <div class="d-flex gap-2 w-100 align-items-center">
                        <button type="button" 
                                class="btn btn-outline-secondary flex-grow-1 d-flex align-items-center justify-content-center gap-2 py-2 text-dark m-2" 
                                style="border-color: #cbd5e1; border-radius: 8px;"
                                data-bs-toggle="modal" 
                                data-bs-target="#editRoomTypeModal"
                                data-id="${roomTypeId}"
                                data-name="${roomType.name}"
                                data-capacity="${roomType.capacity}"
                                data-description="${roomType.description}"
                                data-basePrice="${roomType.basePrice}"
                                data-image="${roomType.image}">
                            <i class="bi bi-pencil fs-6"></i>
                            <span>Edit</span>
                        </button>
                        <button type="button" 
                                class="btn btn-outline-secondary d-flex align-items-center justify-content-center p-3 text-danger m-2" 
                                style="border-color: #cbd5e1; border-radius: 8px; width: 42px; height: 42px;"
                                data_id="${roomTypeId}"
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
            "Error al cargar tipos de habitación:",
            error
        );
    }
}

loadRoomTypes();