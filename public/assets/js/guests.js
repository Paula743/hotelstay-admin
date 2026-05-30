import { hideAlert, showAlert,getFirebaseErrorMessage, observeAuth, logoutUser, setButtonLoading, addGuest } from "./auth.js";
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

//Constante para cerrar sesión
const logoutBtn = document.getElementById('logoutBtn');

//Constantes para registrar huesped
const addGuestForm = document.getElementById('addGuestForm')
const nameGuestInput = document.getElementById('nameGuest')
const apellidoGuestInput = document.getElementById('apellidoGuest')  
const emailGuestInput = document.getElementById('emailGuest') 
const phoneGuestInput = document.getElementById('phoneGuest') 
const identificationGuestInput = document.getElementById('identificationGuest') 
const addressGuestInput = document.getElementById('addressGuest')

const openAddGuestBtn = document.getElementById('openAddGuestBtn')
const saveGuestBtn = document.getElementById('saveGuestBtn') 

const addGuestModalElement = document.getElementById('addGuestModal')
const addGuestModal = addGuestModalElement ? bootstrap.Modal.getOrCreateInstance(addGuestModalElement) : null

const guestsTableBody = document.getElementById('guestsTableBody');
const searchGuestInput = document.getElementById('searchGuest');

//Constantes para editar habitación
const editGuestForm = document.getElementById('editGuestForm')
const editNameGuestInput = document.getElementById('editNameGuest')
const editApellidoGuestInput = document.getElementById('editApellidoGuest')  
const edirEmailGuestInput = document.getElementById('editEmailGuest') 
const editPhoneGuestInput = document.getElementById('editPhoneGuest') 
const editIdentificationGuestInput = document.getElementById('editIdentificationGuest') 
const editAddressGuestInput = document.getElementById('editAddressGuest')
const saveGuestEditBtn = document.getElementById('saveGuestEditBtn') 

const addGuestModalElement = document.getElementById('addGuestModal')
const addGuestModal = addGuestModalElement ? bootstrap.Modal.getOrCreateInstance(addGuestModalElement) : null

// Variable y constante para eliminar habitación
let roomToDelete = null
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

// Modal para registrar huesped
addGuestForm?.addEventListener('submit', async (event) => {
  event.preventDefault()

  const name = nameGuestInput.value.trim()
  const apellido = apellidoGuestInput.value.trim()
  const email = emailGuestInput.value.trim()
  const phone = phoneGuestInput.value.trim()
  const identification = identificationGuestInput.value.trim()
  const address = addressGuestInput.value.trim()

  if (!name || !apellido || !email || !phone || !identification || !address) {
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
      apellido,
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

    allGuests = [];

    guestsSnapshot.forEach((doc) => {
      allGuests.push(doc.data());
    });

    const renderGuests = (guests) => {

      guestsTableBody.innerHTML = '';

      guests.forEach((guest) => {

        guestsTableBody.innerHTML += `
        <div class= "d-flex align-items-center">
          <tr>
            <td>${guest.name}</td>
            <td>${guest.apellido}</td>
            <td>${guest.email}</td>
            <td>${guest.phone}</td>
            <td>${guest.identification}</td>
            <td>${guest.address}</td>
            <td>
              <div class= "d-flex">
                <button type="button" 
                    class="btn btn-outline-secondary  d-flex align-items-center justify-content-center p-3 text-dark m-2" 
                    style="border-color: #cbd5e1; border-radius: 5px; width: 30px; height: 30px;">
                    <i class="bi bi-pencil fs-5"></i>
                </button>
                
                <button type="button" 
                      class="btn btn-outline-secondary d-flex align-items-center justify-content-center p-3 text-danger m-2" 
                      style="border-color: #cbd5e1; border-radius: 5px; width: 30px; height: 30px;">
                  <i class="bi bi-trash3 fs-5"></i>
                </button>
              </div>
            </td>
          </tr>
        </div>
        `;
      });
    };

    renderGuests(allGuests);

    searchGuestInput?.addEventListener('input', (e) => {

      const text = e.target.value.toLowerCase();

      const filteredGuests = allGuests.filter((guest) =>
        guest.name.toLowerCase().includes(text)
      );

      renderGuests(filteredGuests);
    });

  } catch (error) {
    console.error('Error al cargar huéspedes:', error);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  loadGuests();
});



