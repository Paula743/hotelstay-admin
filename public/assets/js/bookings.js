import { observeAuth, logoutUser, setButtonLoading, addGuest } from "./auth.js";
import { doc, getDoc, collection, getDocs, query, where, addDoc, deleteDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { db } from "./firebase.js";



const reservationModalElement = document.getElementById('reservationModal');
const reservationModal = reservationModalElement ? bootstrap.Modal.getOrCreateInstance(reservationModalElement) : null;

const searchRoomsForm = document.getElementById('searchRoomsForm');
const availableRoomsContainer = document.getElementById('availableRoomsContainer');
const checkInDateInput = document.getElementById('checkInDate');
const checkOutDateInput = document.getElementById('checkOutDate');
const guestCountInput = document.getElementById('guestCount');

const guestEmailInput = document.getElementById('guestEmail');
const guestNameInput = document.getElementById('guestName');
const guestPhoneInput = document.getElementById('guestPhone');

const reservationsTableBody = document.getElementById('reservationsTableBody');
const searchCard = document.getElementById('searchCard');

const reservationForm = document.getElementById('reservationForm');
let selectedRoomId = null;
let editingReservationId = null;
let isEditingReservation = false;


searchRoomsForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  try {
    const guestCount = Number(guestCountInput.value);
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

      if (hasAvailableRoom && roomType.capacity >= guestCount) {
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

    searchCard.style.display = 'none';

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

      //searchRoomsForm.reset();
    });

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

    selectedRoomId = e.target.dataset.roomid;

    const roomNumber = e.target.dataset.roomnumber;
    const floor = e.target.dataset.floor;
    const price = Number(e.target.dataset.price);
    const type = e.target.dataset.type;
    const checkIn = checkInDateInput.value;
    const checkOut = checkOutDateInput.value;
    const guests = guestCountInput.value;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end - start;

    const nights = Math.ceil(
        diffTime / (1000 * 60 * 60 * 24)
    );

    const total = nights * price;

    document.getElementById('reservationRoomNumber').value = roomNumber;
    document.getElementById('reservationRoomType').value = type;
    document.getElementById('reservationFloor').value = floor;
    document.getElementById('reservationPrice').value = `$${price}`;
    document.getElementById('reservationCheckIn').value = checkIn;
    document.getElementById('reservationCheckOut').value = checkOut;
    document.getElementById('reservationGuests').value = guests;
    document.getElementById('reservationNights').value = `${nights} noche(s)`;
    document.getElementById('reservationTotal').value = `$${total}`;
    
    isEditingReservation = false;
    document.getElementById('registerGuestBtn').classList.remove('d-none');
    const checkOutInput = document.getElementById('reservationCheckOut');
    checkOutInput.setAttribute('readonly', true);
    checkOutInput.type = 'date';

    const guestsNumber = document.getElementById('reservationGuests');
    guestsNumber.setAttribute('readonly', true);
    guestsNumber.type = 'number';

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
      guestPhoneInput.value = '';

      return;
    }

    const guest = querySnapshot.docs[0].data();

    guestNameInput.value = guest.name || '';
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

document.getElementById('reservationCheckOut').addEventListener('change', () => {

    const checkIn = document.getElementById('reservationCheckIn').value;
    const checkOut = document.getElementById('reservationCheckOut').value;

    const price = Number(document.getElementById('reservationPrice').value.replace('$', ''));

    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn))/ (1000 * 60 * 60 * 24));

    document.getElementById('reservationNights').value = nights;
    document.getElementById('reservationTotal').value = `$${nights * price}`;
});

reservationForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const email = guestEmailInput.value.trim();
        const q = query(collection(db, 'guests'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            alert('El huésped no existe');
            return;
        }

        const guestDoc = querySnapshot.docs[0];
        const guestId = guestDoc.id;
        const checkInDate = document.getElementById('reservationCheckIn').value.trim();
        const checkOutDate = document.getElementById('reservationCheckOut').value.trim();
        const pricePerNight = Number(document.getElementById('reservationPrice').value.replace('$', ''));
        let nights = parseInt(document.getElementById('reservationNights').value);
        let guests = Number(document.getElementById('reservationGuests').value);
        let total = nights * pricePerNight;


        if (editingReservationId) {
            const reservationRef = doc(db, 'reservations', editingReservationId);
            const reservationSnap = await getDoc(reservationRef);
            const reservationData = reservationSnap.data();

            const roomRef = doc(db, 'rooms', reservationData.roomId);
            const roomSnap = await getDoc(roomRef);
            const roomData = roomSnap.data();

            const roomTypeRef = doc(db, 'typeRooms', roomData.typeId);
            const roomTypeSnap = await getDoc(roomTypeRef);
            const roomTypeData = roomTypeSnap.data();

            if (guests > roomTypeData.capacity) {
                alert(`La capacidad máxima de esta habitación es ${roomTypeData.capacity} huéspedes`);
                return;
            }
            if (new Date(checkOutDate) <= new Date(checkInDate)) {
                alert('La fecha de salida debe ser posterior a la fecha de entrada');
                return;
            }

            const q = query(
                collection(db, 'reservations'),
                where('roomId', '==', reservationData.roomId),
                where('status', '==', 'reserved')
            );

            const snapshot = await getDocs(q);

            let conflict = false;

            snapshot.forEach((docSnap) => {
                if (docSnap.id === editingReservationId) {
                    return;
                }

                const reserva = docSnap.data();

                if (checkInDate < reserva.checkOutDate && checkOutDate > reserva.checkInDate) {
                    conflict = true;
                }
            });

            if(conflict){
              alert('La habitación ya tiene una reservación para esas fechas');
              return;
            }

            nights = parseInt(document.getElementById('reservationNights').value);
            total = nights * reservationData.pricePerNight;

            await updateDoc(doc(db, 'reservations', editingReservationId), {
                    checkInDate,
                    checkOutDate,
                    guests,
                    nights,
                    total,
                    updatedAt: serverTimestamp()
                }
            );

            editingReservationId = null;
        } else {
            await addDoc( collection(db, 'reservations'), { 
              guestId: guestId,
              guests: guests,
              roomId: selectedRoomId,
              checkInDate: checkInDate,
              checkOutDate: checkOutDate,
              nights: nights,
              pricePerNight: pricePerNight,
              total: total,
              status: 'reserved',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
        }

        alert('Reservación creada correctamente');
        reservationForm.reset();
        reservationModal.hide();
        availableRoomsContainer.innerHTML = '';
        searchCard.style.display = 'block';
        loadReservations();

    } catch (error) {
        console.error(
            'Error al guardar reservación:',
            error
        );
        alert('Ocurrió un error al guardar');
    }
});

async function loadReservations() {
    try {
        reservationsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    Cargando reservaciones...
                </td>
            </tr>
        `;

        const reservationsSnapshot = await getDocs(collection(db, 'reservations'));

        if (reservationsSnapshot.empty) {
            reservationsTableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        No hay reservaciones registradas
                    </td>
                </tr>
            `;
            return;
        }

        reservationsTableBody.innerHTML = '';

        for (const reservationDoc of reservationsSnapshot.docs) {
            const reservation = reservationDoc.data();
            let guestName = 'Sin huésped';

            if (reservation.guestId) {
                const guestRef = doc( db, 'guests', reservation.guestId);
                const guestSnap = await getDoc(guestRef);

                if (guestSnap.exists()) {
                    const guest = guestSnap.data();
                    guestName = `${guest.name}`;
                }
            }

            let roomNumber = 'N/A';

            if (reservation.roomId) {
                const roomRef = doc( db, 'rooms', reservation.roomId);
                const roomSnap = await getDoc(roomRef);

                if (roomSnap.exists()) {
                    roomNumber = roomSnap.data().roomNumber;
                }
            }

            reservationsTableBody.innerHTML += `
                <tr>
                    <td>
                        <span class="badge bg-primary">
                            ${roomNumber}
                        </span>
                    </td>
                    <td>
                        ${guestName}
                    </td>
                    <td>
                        ${reservation.checkInDate}
                    </td>
                    <td>
                        ${reservation.checkOutDate}
                    </td>
                    <td>
                        ${reservation.guests}
                    </td>
                    <td class="fw-bold text-success">
                        $${reservation.total}
                    </td>
                    <td>
                        <span class="badge bg-success">
                            ${reservation.status}
                        </span>
                    </td>
                    <td>
                      <button
                          class="btn btn-warning btn-sm editReservationBtn"
                          data-id="${reservationDoc.id}">
                          <i class="bi bi-pencil"></i>
                      </button>

                      <button
                          class="btn btn-danger btn-sm deleteReservationBtn"
                          data-id="${reservationDoc.id}">
                          <i class="bi bi-trash"></i>
                      </button>
                    </td>
                </tr>
            `;
        }
    } catch (error) {
        console.error( 'Error al cargar reservaciones:', error);

        reservationsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-danger text-center py-4">
                    Error al cargar reservaciones
                </td>
            </tr>
        `;
    }
}

document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.deleteReservationBtn');

    if (!deleteBtn) return;

    const reservationId = deleteBtn.dataset.id;
    const confirmDelete = confirm('¿Deseas eliminar esta reservación?');

    if (!confirmDelete) return;

    try {
        await deleteDoc(doc(db, 'reservations', reservationId));
        alert('Reservación eliminada');
        loadReservations();

    } catch (error) {
        console.error(error);
        alert('Error al eliminar la reservación');
    }
});

document.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('.editReservationBtn');

    if (!editBtn) return;

    isEditingReservation = true;
    document.getElementById('registerGuestBtn').classList.add('d-none');
    const checkOutInput = document.getElementById('reservationCheckOut');
    checkOutInput.removeAttribute('readonly');
    checkOutInput.type = 'date';

    const guestsNumber = document.getElementById('reservationGuests');
    guestsNumber.removeAttribute('readonly');
    guestsNumber.type = 'number';

    editingReservationId = editBtn.dataset.id;
    const reservationRef = doc(db, 'reservations', editingReservationId);
    const reservationSnap = await getDoc(reservationRef);
    const reservation = reservationSnap.data();

    const roomRef = doc(db, 'rooms', reservation.roomId);
    const roomSnap = await getDoc(roomRef);
    const room = roomSnap.data();

    const roomTypeRef = doc(db, 'typeRooms', room.typeId);
    const roomTypeSnap = await getDoc(roomTypeRef);
    const roomType = roomTypeSnap.data();

    const guestRef = doc(db, 'guests', reservation.guestId);
    const guestSnap = await getDoc(guestRef);
    const guest = guestSnap.data();


    document.getElementById('reservationRoomNumber').value = room.roomNumber;
    document.getElementById('reservationRoomType').value = roomType.name;
    document.getElementById('reservationFloor').value = room.floor;
    document.getElementById('reservationPrice').value = room.pricePerNight;
    document.getElementById('reservationCheckIn').value = reservation.checkInDate;
    document.getElementById('reservationCheckOut').value = reservation.checkOutDate;
    document.getElementById('reservationGuests').value = reservation.guests;
    document.getElementById('reservationNights').value = reservation.nights;
    document.getElementById('reservationTotal').value = reservation.total;
    document.getElementById('guestEmail').value = guest.email;
    document.getElementById('guestName').value = guest.name;
    document.getElementById('guestPhone').value = guest.phone;

    reservationModal.show();
});


loadReservations();