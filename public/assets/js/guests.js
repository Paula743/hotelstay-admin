<<<<<<< HEAD
import { hideAlert, showAlert, getFirebaseErrorMessage, observeAuth, logoutUser, setButtonLoading, addGuest } from "./auth.js";
import { doc, getDoc, collection, getDocs, where, query } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
=======
import { observeAuth, logoutUser, setButtonLoading, addGuest } from "./auth.js";
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
>>>>>>> develop
import { db } from "./firebase.js";

const logoutBtn = document.getElementById('logoutBtn');

const addGuestForm = document.getElementById('addGuestForm')
<<<<<<< HEAD
const nameInput = document.getElementById('fullNameGuest') 
const emailGuestInput = document.getElementById('emailGuest') 
const phoneGuestInput = document.getElementById('phoneGuest') 
const identificationGuestInput = document.getElementById('identificationGuest') 
const adressGuestInput = document.getElementById('adressGuest')
=======
const nameGuestInput = document.getElementById('nameGuest')
const apellidoGuestInput = document.getElementById('apellidoGuest')  
const emailGuestInput = document.getElementById('emailGuest') 
const phoneGuestInput = document.getElementById('phoneGuest') 
const identificationGuestInput = document.getElementById('identificationGuest') 
const addressGuestInput = document.getElementById('addressGuest')
>>>>>>> develop

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
<<<<<<< HEAD
    event.preventDefault()

    const nameGuest = nameInput.value.trim()
    const email = emailGuestInput.value.trim()
    const phone = phoneGuestInput.value.trim()
    const identification = identificationGuestInput.value.trim()
    const address = adressGuestInput.value.trim()


    if (!nameGuest || !email || !phone || !identification || !address) {
        alert('Todos los campos son obligatorios para el registro.');
        return;
    }

    if (phone.length !== 10){
        alert('Cantidad de digitos incorrectos en número telefonico');
        return;

    }

    const q = query(collection(db, 'guests'), where('phone', '==',phone))
    const phoneExistente = await getDocs(q)

    if(!phoneExistente.empty){
        alert('Este telefono ya está registrada en el sistema');
        return
    }

    
    try {
        setButtonLoading(
        saveGuestBtn,
        true,
        '<i class="bi bi-check-circle me-2"></i> Guardar Cambios',
        'Guardando...'
        )
        

        await addGuest({ 
        nameGuest: nameGuest,              // Mapea tu variable 'name' al parámetro 'nameGuest'
        emailGuest: email,            // Mapea 'email' a 'emailGuest'
        phoneGuest: phone,            // Mapea 'phone' a 'phoneGuest'
        identificationGuest: identification, // Mapea 'identification' a 'identificationGuest'
        addressGuest: address,        // Mapea 'address' a 'addressGuest'
        active: true                  // Se mantiene igual (puedes omitirlo si quieres por el default)
        });

        setTimeout(() => {
        addGuestModal?.hide()
        addGuestForm.reset() 
        }, 1500)

    } catch (error) {
        alert( 'No se pudo registrar al huesped')
    } finally {
        setButtonLoading(
        saveGuestBtn,
        false,
        '<i class="bi bi-check-circle me-2"></i> Guardar Cambios' 
        )
    }
})

/*
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
*/
=======
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
>>>>>>> develop
