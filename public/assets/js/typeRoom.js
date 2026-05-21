import { observeAuth, logoutUser, setButtonLoading, addTypeRoom } from "./auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

const logoutBtn = document.getElementById('logoutBtn');

const addTypeRoomForm = document.getElementById('addTypeRoomForm')
const nameCategory = document.getElementById('nameCategory') 
const capacityInput = document.getElementById('capacity') 
const descriptionInput = document.getElementById('description') 
const basePriceInput = document.getElementById('basePrice') 
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

  if (!name || !capacityValue || !description || !basePrice) {
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
      basePrice: parseFloat(basePrice) 
    })

    setTimeout(() => {
      addTypeRoomModal?.hide()
      addTypeRoomForm.reset() 
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
