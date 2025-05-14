import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyActULR2Fqu4F3A_A1TUOXQbfrORZecqiI",
  authDomain: "ofertassuper-a9841.firebaseapp.com",
  projectId: "ofertassuper-a9841",
  storageBucket: "ofertassuper-a9841.appspot.com",
  messagingSenderId: "29615340161",
  appId: "1:29615340161:web:bbca60564936cdc9e1ab80",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const formLogin = document.getElementById("formLogin");
const errorLogin = document.getElementById("errorLogin");

// Si ya está autenticado, redirigir a inicio.html
onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "inicio.html";
  }
});

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorLogin.style.display = "none";
  const email = formLogin.email.value.trim();
  const password = formLogin.password.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Redirigir a inicio.html tras login exitoso
    window.location.href = "inicio.html";
  } catch (error) {
    errorLogin.textContent = "Correo o contraseña incorrectos.";
    errorLogin.style.display = "block";
  }
});
