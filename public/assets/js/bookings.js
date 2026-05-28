import { observeAuth, logoutUser, setButtonLoading, addGuest } from "./auth.js";
import { doc, getDoc, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";

const addBookingBtn = document.getElementById('addBookingBtn');
const addBookingModalElement = document.getElementById('addBookingModal');

const addBookingModal = addBookingModalElement ? bootstrap.Modal.getOrCreateInstance(addBookingModalElement) : null;

const reservationModalElement = document.getElementById('reservationModal');
const reservationModal = reservationModalElement ? bootstrap.Modal.getOrCreateInstance(reservationModalElement) : null;

const searchRoomsForm = document.getElementById('searchRoomsForm');
const availableRoomsContainer = document.getElementById('availableRoomsContainer');
const checkInDateInput = document.getElementById('checkInDate');
const checkOutDateInput = document.getElementById('checkOutDate');

const guestEmailInput = document.getElementById('guestEmail');
const guestNameInput = document.getElementById('guestName');
const guestApellidoInput = document.getElementById('guestApellido');
const guestPhoneInput = document.getElementById('guestPhone');


addBookingBtn?.addEventListener('click', () => {
  addBookingModal?.show();
});


searchRoomsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const checkIn = checkInDateInput.value;
    const checkOut = checkOutDateInput.value;

    availableRoomsContainer.innerHTML = `
      <p class="text-muted">Buscando habitaciones disponibles...</p>
    `;

    const bookingsSnapshot = await getDocs(collection(db, 'reservations'));
    const roomsSnapshot = await getDocs(collection(db, 'rooms'));
    const roomTypesSnapshot = await getDocs(collection(db, 'typeRooms'));

    
    const occupiedRooms = [];

    bookingsSnapshot.forEach((bookingDoc) => {

      const booking = bookingDoc.data();

      const bookingStart = booking.checkInDate;
      const bookingEnd = booking.checkOutDate;

      // Verifica cruce de fechas
      const isOverlapping = checkIn <= bookingEnd && checkOut >= bookingStart;

      if (isOverlapping) {
        occupiedRooms.push(booking.roomId);
      }
    });

    // Habitaciones disponibles
    const availableRooms = [];

    roomsSnapshot.forEach((roomDoc) => {
        //const room = roomDoc.data();
        const room = {
            id: roomDoc.id,
            ...roomDoc.data()
        };

        if (!occupiedRooms.includes(room.id) && room.status != 'maintenance') {
            availableRooms.push(room);
        }
    });

    // Tipos disponibles
    const availableRoomTypes = [];

    roomTypesSnapshot.forEach((typeDoc) => {

      const roomType = typeDoc.data();

      const hasAvailableRoom = availableRooms.some(
        room => room.typeId === typeDoc.id
      );

      if (hasAvailableRoom) {
        availableRoomTypes.push({
          id: typeDoc.id,
          ...roomType
        });
      }
    });

    // Mostrar resultados
    availableRoomsContainer.innerHTML = '';

    if (availableRoomTypes.length === 0) {

      availableRoomsContainer.innerHTML = `
        <div class="alert alert-danger">
          No hay habitaciones disponibles para esas fechas.
        </div>
      `;

      return;
    }

    

    availableRoomTypes.forEach((roomType) => {
        const room = availableRooms.find(
            r => r.typeId === roomType.id
        );

      availableRoomsContainer.innerHTML += `
        <div class="card shadow-sm border-0 rounded-4 mb-3">

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

            <button
                class="btn btn-primary reserveBtn"
                data-roomid="${room.id}"
                data-roomnumber="${room.roomNumber}"
                data-floor="${room.floor}"
                data-price="${room.pricePerNight}"
                data-type="${roomType.name}"
                >
                Reservar
            </button>

          </div>
        </div>
      `;
    });

    setTimeout(() => {
      addBookingModal?.hide()
      searchRoomsForm.reset() 
    }, 100)

  } catch (error) {

    console.error('Error al buscar disponibilidad:', error);

    availableRoomsContainer.innerHTML = `
      <div class="alert alert-danger">
        Ocurrió un error al buscar habitaciones.
      </div>
    `;
  }
});

document.addEventListener('click', (e) => {

  if (e.target.classList.contains('reserveBtn')) {

    const roomNumber = e.target.dataset.roomnumber;
    const floor = e.target.dataset.floor;
    const price = e.target.dataset.price;
    const type = e.target.dataset.type;

    document.getElementById('reservationRoomNumber').value = roomNumber;
    document.getElementById('reservationRoomType').value = type;
    document.getElementById('reservationFloor').value = floor;
    document.getElementById('reservationPrice').value = `$${price}`;

    reservationModal.show();
  }
});

guestEmailInput?.addEventListener('input', async () => {

  const email = guestEmailInput.value.trim();

  if (!email) {
    return;
  }

  try {

    const q = query(
      collection(db, 'guests'),
      where('email', '==', email)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {

      guestNameInput.value = '';
      guestApellidoInput.value = '';
      guestPhoneInput.value = '';

      return;
    }

    const guest = querySnapshot.docs[0].data();

    guestNameInput.value = guest.name || '';
    guestApellidoInput.value = guest.apellido || '';
    guestPhoneInput.value = guest.phone || '';

  } catch (error) {

    console.error(
      'Error al buscar huésped:',
      error
    );
  }
});

const hoy = new Date().toISOString().split('T')[0];
if (checkInDateInput) {
    checkInDateInput.min = hoy;
    
    checkInDateInput.addEventListener('change', (e) => {
        const fechaSeleccionada = e.target.value;
        if (checkOutDateInput) {
            checkOutDateInput.min = fechaSeleccionada; 
            if (checkOutDateInput.value <= fechaSeleccionada) {
                checkOutDateInput.value = "";
            }
        }
    });
}