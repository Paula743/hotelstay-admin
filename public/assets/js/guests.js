import { observeAuth, logoutUser, setButtonLoading, addGuest } from "./auth.js";
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

const logoutBtn = document.getElementById('logoutBtn');

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

