import { hideAlert, showAlert,getFirebaseErrorMessage, observeAuth, logoutUser, setButtonLoading, addGuest } from "./auth.js";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

//Constante para cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');

//Constantes para registrar huesped
const addGuestForm = document.getElementById('addGuestForm')
const nameGuestInput = document.getElementById('nameGuest')
const emailGuestInput = document.getElementById('emailGuest') 
const phoneGuestInput = document.getElementById('phoneGuest') 
const identificationGuestInput = document.getElementById('identificationGuest') 
const addressGuestInput = document.getElementById('addressGuest')

const saveGuestBtn = document.getElementById('saveGuestBtn') 

const addGuestModalElement = document.getElementById('addGuestModal')
const addGuestModal = addGuestModalElement ? bootstrap.Modal.getOrCreateInstance(addGuestModalElement) : null

const guestsTableBody = document.getElementById('guestsTableBody');
const searchGuestInput = document.getElementById('searchGuest');

//Constantes para editar habitación
const editGuestForm = document.getElementById('editGuestForm')
const editNameGuestInput = document.getElementById('editNameGuest')  
const editEmailGuestInput = document.getElementById('editEmailGuest') 
const editPhoneGuestInput = document.getElementById('editPhoneGuest') 
const editIdentificationGuestInput = document.getElementById('editIdentificationGuest') 
const editAddressGuestInput = document.getElementById('editAddressGuest')
const saveGuestEditBtn = document.getElementById('saveGuestEditBtn') 

const editGuestModalElement = document.getElementById('editGuestModal')
const editGuestModal = editGuestModalElement ? bootstrap.Modal.getOrCreateInstance(editGuestModalElement) : null

// Variable y constante para eliminar habitación
let guestToDelete = null
const deleteGuestBtn = document.getElementById('confirmDeleteBtn')
const deleteGuestModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteGuestModal'))

let allGuests = [];

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

const renderGuests = (guests) => {
  guestsTableBody.innerHTML = '';
 
  if (!guests.length) {
    guestsTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center">No hay huéspedes registrados</td>
      </tr>
    `;
    return;
  }
 
  guests.forEach((guest) => {
    guestsTableBody.innerHTML += `
      <tr>
        <td>${guest.name}</td>
        <td>${guest.email}</td>
        <td>${guest.phone}</td>
        <td>${guest.identification}</td>
        <td>${guest.address}</td>
        <td>
          <div class="d-flex gap-2 px-3 py-2">
            <button type="button"
                class="btn btn-warning btn-sm editReservationBtn"
                data-bs-toggle="modal"
                data-bs-target="#editGuestModal"
                data-id="${guest.guestId}"
                data-name="${guest.name}"
                data-email="${guest.email}"
                data-phone="${guest.phone}"
                data-identification="${guest.identification}"
                data-address="${guest.address}">
              <i class="bi bi-pencil fs-5"></i>
            </button>
 
            <button type="button"
                class="btn btn-danger btn-sm deleteReservationBtn"
                data-id="${guest.guestId}"
                onclick="deleteGuest(this)">
              <i class="bi bi-trash3 fs-5"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
};

// Modal para registrar huesped
addGuestForm?.addEventListener('submit', async (event) => {
  event.preventDefault()

  const name = nameGuestInput.value.trim()
  const email = emailGuestInput.value.trim()
  const phone = phoneGuestInput.value.trim()
  const identification = identificationGuestInput.value.trim()
  const address = addressGuestInput.value.trim()

  if (!name || !email || !phone || !identification || !address) {
          alert('Todos los campos son obligatorios para el registro.');
          return;
  }

  if(phone.length != 10){
    alert('Cantidad de digitos erronea en el telefono');
    return;
  }

  const q = query(collection(db, 'guests'), where('phone', '==',phone))
  const phoneExistente = await getDocs(q)

  if(!phoneExistente.empty){
        alert('Este número telefonico ya está registrada en el sistema')
        return
  }


 
  try {
    setButtonLoading(
      saveGuestBtn,
      true,
      '<i class="bi bi-check-circle me-2"></i> Registrar huésped',
      'Registrando...'
    )

    await addGuest({ 
      name,
      email,
      phone,
      identification,
      address,
      active: true
       
    })

    setTimeout(() => {
      addGuestModal?.hide()
      addGuestForm.reset() 
    }, 100)

  } catch (error) {
    alert( 'No se pudo registrar el tipo de habitación')
  } finally {
    setButtonLoading(
      saveGuestBtn,
      false,
      '<i class="bi bi-check-circle me-2"></i> Registrar huésped' 
    )
  }
});

// Buscar huespedes
searchGuestInput?.addEventListener('input', (e) => {
  const text = e.target.value.toLowerCase();
  const filteredGuests = allGuests.filter((guest) =>
    guest.name.toLowerCase().includes(text)
  );

  renderGuests(filteredGuests);
});

// Cargar información anterior al formulario
editGuestModalElement?.addEventListener('show.bs.modal', (event) => {
  const button = event.relatedTarget

  document.getElementById('editGuestId').value = button.getAttribute('data-id')
  editNameGuestInput.value     = button.getAttribute('data-name')
  editEmailGuestInput.value         = button.getAttribute('data-email')
  editPhoneGuestInput.value      = button.getAttribute('data-phone')
  editIdentificationGuestInput.value        = button.getAttribute('data-identification')
  editAddressGuestInput.value            = button.getAttribute('data-address')

})

// Modal para edición de habitación
editGuestForm?.addEventListener('submit', async (event) => {
  event.preventDefault()

  hideAlert('guestAlert')
  hideAlert('guestSuccess')
  

  const guestId = document.getElementById('editGuestId').value;
  const name = editNameGuestInput.value.trim()
  const email = editEmailGuestInput.value.trim()
  const phone = editPhoneGuestInput.value.trim()
  const identification = editIdentificationGuestInput.value.trim()
  const address = editAddressGuestInput.value.trim()

  if (!guestId) {
    showAlert('guestAlert', 'No se encontró el ID del huésped');
    return;
  }

  if(!name || !email || !phone || !identification || !address){
    showAlert('guestAlert', 'Todos los campos son obligatorios');
    return;
  }

  if(phone.length != 10){
    showAlert('guestAlert','Cantidad de digitos erronea en el telefono');
    return;
  }

  const qEdit = query(collection(db, 'guests'), where('phone', '==', phone));
  const phoneExistenteEdit = await getDocs(qEdit);
  const phoneRepetido = phoneExistenteEdit.docs.some((docSnap) => docSnap.id !== guestId);

  if (phoneRepetido) {
    showAlert('guestAlert', 'Este número telefónico ya está registrado en otro huésped');
    return;
  }


  try {
    setButtonLoading(
      saveGuestEditBtn,
      true,
      '<i class="bi bi-check-circle m-2"></i> Guardar Cambios',
      'Guardando...'
    )

    const guestsRef = doc(db, "guests", guestId);
    await updateDoc(guestsRef, {
        name,
        email,
        phone,
        identification,
        address,
        active: true
    })

    showAlert('guestSuccess', 'Huésped Actualizado Correctamente')
    await loadGuests();

    setTimeout(() => {
      editGuestModal?.hide()
      hideAlert('guestSuccess')
    }, 100)

  } catch (error) {
    showAlert('guestAlert', error.message || 'No se logro actualizar')

  } finally {
    setButtonLoading(
      saveGuestEditBtn,
      false,
      '<i class="bi bi-check-circle m-2"></i> Guardar Cambios'
    )
  }
})

// Abre el modal de delete y guarda el id
window.deleteGuest = async function(button) {
    guestToDelete = button.getAttribute('data-id')
    deleteGuestModal.show()
    console.log(guestToDelete)
}

// Elimina la habitación
deleteGuestBtn?.addEventListener('click', async () => {
    if (!guestToDelete) return

    try {
        await deleteDoc(doc(db, 'guests', guestToDelete))
        deleteGuestModal.hide()
        await loadGuests()

    } catch (error) {
        console.error('Error al eliminar al huésped:', error)
    } finally {
        guestToDelete = null
    }
})

const loadGuests = async () => {
  try {

    const guestsSnapshot = await getDocs(collection(db, "guests"));

    guestsTableBody.innerHTML = '';

    if (guestsSnapshot.empty) {
      guestsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">
            No hay huéspedes registrados
          </td>
        </tr>
      `;
      return;
    }

    allGuests = guestsSnapshot.docs.map((doc) => ({
      guestId: doc.id,
      ...doc.data()
    }));
 
    renderGuests(allGuests);



  } catch (error) {
      console.error('Error al cargar huéspedes:', error);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  loadGuests();
});



