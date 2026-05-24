import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection, 
  addDoc,
  getDocs,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";


import { auth, db } from "./firebase.js";

export function showAlert(alertId, message) {
  const alertElement = document.getElementById(alertId);
  const textElement = alertElement?.querySelector('#errorText') || alertElement;
  
  if (alertElement) {
    if (textElement) textElement.textContent = message;
    alertElement.classList.remove('d-none');
  }
}

export function hideAlert(alertId) {
  const alertElement = document.getElementById(alertId);
  if (alertElement) {
    alertElement.classList.add('d-none');
    alertElement.classList.remove('alert-success');
    alertElement.classList.add('alert-danger');
  }
}

export function setButtonLoading(button, isLoading, text, loadingText = "Procesando...") {
  if (!button) return;
  button.disabled = isLoading;
  button.innerHTML = isLoading
    ? `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>${loadingText}`
    : text;
}

export async function registerUser({ fullName, email, phone, address, password, role = "staff", active = true }) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    fullName: fullName,
    email: email,
    phone: phone || "",
    address: address || "",
    role: role,            
    active: active,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return user;
}

export async function loginUser({ email, password }) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export function observeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function logoutUser() {
  await signOut(auth);
}

export async function addTypeRoom({ name, capacity, description, basePrice }) {
  try {
    const typeRoomsRef = collection(db, "typeRooms");
    const newDocRef = doc(typeRoomsRef);
    await setDoc(newDocRef,{
      id: newDocRef.id,
      name: name,
      capacity: capacity,
      description: description || "",
      basePrice: basePrice,
      createdAt: serverTimestamp()
    });
    return newDocRef.id; 
    
  } catch (error) {
    console.error("Error al agregar tipo de habitación:", error);
    throw error; 
  }
}

export async function addRoom({ roomNumber, typeId, floor, pricePerNight, status, active }) {
  try {
  
    const roomsRef = collection(db, "rooms");
    const docRef = doc(roomsRef);

    await setDoc(docRef, {
      roomId: docRef.id,
      roomNumber: roomNumber,
      typeId: typeId,
      floor: floor,
      pricePerNight: pricePerNight,
      status: status,           
      active: active,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docRef.id; 
    
  } catch (error) {
    console.error("Error al agregar tipo de habitación:", error);
    throw error; 
  }
}

// función que obtiene los tipos de habitación
export async function getRoomTypes() {
  try {
    const querySnapshot = await getDocs(collection(db, "typeRooms"));
    const tipos = [];
    
    querySnapshot.forEach((doc) => { 
      tipos.push({ id: doc.id, ...doc.data() });
    });
    
    return tipos;
  } catch (error) {
    console.error("Error al traer los tipos de habitación:", error);
    throw error;
  }
}

export async function addGuest({ name, apellido, email, phone, identification, address, active = true }) {
  try {
  
    const guestRef = collection(db, "guests");
    const docGuestRef = doc(guestRef);

    await setDoc(docGuestRef, {
      guestId: docGuestRef.id,
      name: name,
      apellido: apellido,
      email: email,
      phone: phone,
      identification: identification,
      address: address,          
      active: active,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return docGuestRef.id; 
    
  } catch (error) {
    console.error("Error al agregar el huésped:", error);
    throw error; 
  }
}




export function getFirebaseErrorMessage(error) {
  const code = error?.code || "";

  switch (code) {
    case "auth/email-already-in-use":
      return "Este correo ya está registrado.";
    case "auth/invalid-email":
      return "El correo electrónico no tiene un formato válido.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/user-not-found":
      return "No existe una cuenta activa con este correo.";
    case "auth/wrong-password":
      return "La contraseña es incorrecta.";
    case "auth/too-many-requests":
      return "Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.";
    default:
      return error?.message || "Ocurrió un error inesperado.";
  }
}