import { observeAuth, logoutUser, setButtonLoading, addTypeRoom } from "./auth.js";
import { doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

const logoutBtn = document.getElementById('logoutBtn');

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
 
  try {
    setButtonLoading(
      saveTypeRoomBtn,
      true,
      '<i class="bi bi-check-circle me-2"></i> Guardar Cambios',
      'Guardando...'
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
      '<i class="bi bi-check-circle me-2"></i> Guardar Cambios' 
    )
  }
});

async function loadRoomTypes() {

    try {

        const roomTypesContainer =
            document.getElementById("roomTypesContainer");

        roomTypesContainer.innerHTML = "";

        const querySnapshot =
            await getDocs(collection(db, "typeRooms"));

        querySnapshot.forEach((doc) => {
            const roomType = doc.data();
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