import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyActULR2Fqu4F3A_A1TUOXQbfrORZecqiI",
  authDomain: "ofertassuper-a9841.firebaseapp.com",
  projectId: "ofertassuper-a9841",
  storageBucket: "ofertassuper-a9841.appspot.com",
  messagingSenderId: "29615340161",
  appId: "1:29615340161:web:bbca60564936cdc9e1ab80",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Proteger la página: si no está autenticado, redirigir a login (index.html)
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// Botón cerrar sesión
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener("click", () => {
    signOut(auth)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((error) => {
        alert("No se pudo cerrar sesión. Intenta de nuevo.");
        console.error(error);
      });
  });
}

// --- Tu código del carrusel y ofertas aquí ---

const carruselInner = document.getElementById("carrusel-inner");
const btnIzquierda = document.getElementById("btn-izquierda");
const btnDerecha = document.getElementById("btn-derecha");

let ofertas = [];
let indiceActual = 0;

// Cache para nombres supermercados
const cacheSupermercados = {};

async function obtenerNombreSupermercado(id) {
  if (cacheSupermercados[id]) return cacheSupermercados[id];
  try {
    const docRef = doc(db, "supermercados", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const nombre = docSnap.data().nombre || "Supermercado";
      cacheSupermercados[id] = nombre;
      return nombre;
    }
    return "Supermercado";
  } catch {
    return "Supermercado";
  }
}

// Función para crear el HTML de la oferta con los datos solicitados
function crearHtmlOferta(oferta) {
  const producto = oferta.productos && oferta.productos.length > 0 ? oferta.productos[0] : null;

  return `
    <h5 class="h5 ">🎉${oferta.titulo}</h5>
    <div class="supermercado-nombre label">🛒Supermercado: <span style="color:#2a77e3;">${oferta.supermercadoNombre}</span></div>
    ${producto ? `
      <p ><span class="label">🧺Producto: </span>${producto.nombre}</p>
      <p>
        <span class="label">💰Precio Oferta: </span> <span class="precio-oferta">$${producto.precioOferta.toFixed(2)}</span>
        <span class="precio-original" style="text-decoration: line-through; color: #ef4444;">$${producto.precioOriginal.toFixed(2)}</span>
      </p>
    ` : `<p>Sin productos disponibles</p>`}
    <p><span class="label">📅Válido del</span> ${new Date(oferta.fechaInicio).toLocaleDateString()} <strong>al</strong> ${new Date(oferta.fechaFin).toLocaleDateString()}</p>
    <button class="btn btn-primary btn-ver-oferta mt-3"><i class="bi bi-cart4"></i> Ver más ofertas</button>
  `;
}

function animarCambioOferta(nuevaOfertaHtml) {
  carruselInner.style.transition = "opacity 0.4s ease, transform 0.4s ease";
  carruselInner.style.opacity = "0";
  carruselInner.style.transform = "translateX(50px)";

  setTimeout(() => {
    carruselInner.innerHTML = nuevaOfertaHtml;
    carruselInner.style.opacity = "1";
    carruselInner.style.transform = "translateX(0)";
    const btnVer = carruselInner.querySelector(".btn-ver-oferta");
    if (btnVer) {
      btnVer.addEventListener("click", () => {
        window.location.href = `ofertas.html?id=${ofertas[indiceActual].id}`;
      });
    }
  }, 400);
}

async function cargarOfertas() {
  try {
    const q = query(collection(db, "ofertas"), where("activo", "==", true));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      carruselInner.innerHTML = "<p>No hay ofertas disponibles.</p>";
      btnIzquierda.disabled = true;
      btnDerecha.disabled = true;
      return;
    }

    const todasOfertas = [];

    for (const docSnap of snapshot.docs) {
      const oferta = docSnap.data();
      oferta.id = docSnap.id;
      oferta.supermercadoNombre = await obtenerNombreSupermercado(oferta.supermercadoId);
      todasOfertas.push(oferta);
    }

    ofertas = todasOfertas;
    indiceActual = 0;
    animarCambioOferta(crearHtmlOferta(ofertas[indiceActual]));

    btnIzquierda.disabled = ofertas.length <= 1;
    btnDerecha.disabled = ofertas.length <= 1;
  } catch (error) {
    console.error("Error cargando ofertas:", error);
    carruselInner.innerHTML = "<p>Error al cargar ofertas.</p>";
    btnIzquierda.disabled = true;
    btnDerecha.disabled = true;
  }
}

btnIzquierda.addEventListener("click", () => {
  if (ofertas.length === 0) return;
  indiceActual = (indiceActual - 1 + ofertas.length) % ofertas.length;
  animarCambioOferta(crearHtmlOferta(ofertas[indiceActual]));
});

btnDerecha.addEventListener("click", () => {
  if (ofertas.length === 0) return;
  indiceActual = (indiceActual + 1) % ofertas.length;
  animarCambioOferta(crearHtmlOferta(ofertas[indiceActual]));
});

document.addEventListener("DOMContentLoaded", () => {
  cargarOfertas();
});
