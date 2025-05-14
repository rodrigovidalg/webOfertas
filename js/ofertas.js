import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  orderBy,
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

// --- Protección de página ---
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

// --- Botón cerrar sesión ---
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

// --- Tu código de ofertas ---
const listaOfertas = document.getElementById("lista-ofertas");
const filtroSupermercado = document.getElementById("filtro-supermercado");
const cacheSupermercados = {};

// Cargar supermercados y llenar el filtro
async function cargarSupermercadosSelect() {
  filtroSupermercado.innerHTML = `<option value="">Todos los supermercados</option>`;
  try {
    const q = query(collection(db, "supermercados"), orderBy("nombre", "asc"));
    const snapshot = await getDocs(q);
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      cacheSupermercados[docSnap.id] = {
        nombre: data.nombre || "Supermercado",
        ubicacion: data.direccion || "Ubicación no disponible"
      };
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = `${data.nombre || "Supermercado"} (${data.direccion || "Ubicación no disponible"})`;
      filtroSupermercado.appendChild(option);
    });
  } catch (e) {
    console.error("Error cargando supermercados:", e);
  }
}

// Obtener nombre y ubicación de supermercado (con cache)
async function obtenerNombreSupermercado(id) {
  if (cacheSupermercados[id]) return cacheSupermercados[id];
  try {
    const docRef = doc(db, "supermercados", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      cacheSupermercados[id] = {
        nombre: data.nombre || "Supermercado",
        ubicacion: data.direccion || "Ubicación no disponible"
      };
      return cacheSupermercados[id];
    }
    return { nombre: "Supermercado", ubicacion: "Ubicación no disponible" };
  } catch {
    return { nombre: "Supermercado", ubicacion: "Ubicación no disponible" };
  }
}

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carritoOfertas")) || [];
}
function guardarCarrito(carrito) {
  localStorage.setItem("carritoOfertas", JSON.stringify(carrito));
}
function obtenerOfertasOcultas() {
  return JSON.parse(localStorage.getItem("ofertasOcultas")) || [];
}
function guardarOfertasOcultas(ocultas) {
  localStorage.setItem("ofertasOcultas", JSON.stringify(ocultas));
}

function renderizarProductos(productos) {
  if (!Array.isArray(productos) || productos.length === 0) return "<em>No hay productos en esta oferta</em>";
  let html = `<div class="productos-lista">`;

  productos.forEach(p => {
    html += `
      <div class="producto-item">
        <p><strong>Producto:</strong> ${p.nombre || "-"}</p>
        <p><strong>Unidad:</strong> ${p.unidad || "-"}</p>
        <p>
          <strong>Precio:</strong> 
          <span class="precio-oferta">$${p.precioOferta ? p.precioOferta.toFixed(2) : "-"}</span>
          <span class="precio-original">$${p.precioOriginal ? p.precioOriginal.toFixed(2) : "-"}</span>
        </p>
        <p><strong>Stock:</strong> ${p.stockDisponible !== undefined ? p.stockDisponible : "-"}</p>
        <p><strong>Vence:</strong> ${p.fechaVencimiento ? new Date(p.fechaVencimiento).toLocaleDateString() : "-"}</p>
      </div>
    `;
  });

  html += "</div>";
  return html;
}

async function adquirirOferta(oferta) {
  let carrito = obtenerCarrito();
  if (carrito.find(item => item.id === oferta.id)) {
    alert("Esta oferta ya está en el carrito.");
    return;
  }
  carrito.push(oferta);
  guardarCarrito(carrito);

  let ocultas = obtenerOfertasOcultas();
  ocultas.push(oferta.id);
  guardarOfertasOcultas(ocultas);

  const card = document.querySelector(`[data-id="${oferta.id}"]`);
  if (card) card.remove();

  alert(`Oferta "${oferta.titulo}" agregada al carrito.`);
}

async function cargarTodasOfertas() {
  listaOfertas.innerHTML = "";

  try {
    // Filtro
    const filtroId = filtroSupermercado.value;
    let q;
    if (filtroId) {
      q = query(
        collection(db, "ofertas"),
        where("activo", "==", true),
        where("supermercadoId", "==", filtroId),
        orderBy("titulo", "asc")
      );
    } else {
      q = query(
        collection(db, "ofertas"),
        where("activo", "==", true),
        orderBy("titulo", "asc")
      );
    }

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      listaOfertas.innerHTML = `<p>No hay ofertas disponibles en este momento.</p>`;
      return;
    }

    const ocultas = obtenerOfertasOcultas();

    for (const docSnap of snapshot.docs) {
      const oferta = docSnap.data();
      oferta.id = docSnap.id;

      if (ocultas.includes(oferta.id)) continue;

      // Usar cache para evitar recargar supermercado
      let supermercadoData = cacheSupermercados[oferta.supermercadoId];
      if (!supermercadoData) {
        supermercadoData = await obtenerNombreSupermercado(oferta.supermercadoId);
      }
      const nombreSupermercado = supermercadoData.nombre;
      const ubicacionSupermercado = supermercadoData.ubicacion;

      const card = document.createElement("div");
      card.className = "col-md-6 col-lg-4";
      card.setAttribute("data-id", oferta.id);

      const cardStyle = (oferta.productos && oferta.productos.length === 1) ? "min-height: 360px;" : "";

      card.innerHTML = `
        <div class="oferta-card h-100" style="${cardStyle}">
          <h5>${oferta.titulo}</h5>
          <div class="supermercado-nombre">Supermercado: ${nombreSupermercado}</div>
          <div class="supermercado-ubicacion">Ubicación: ${ubicacionSupermercado}</div>
          <div class="oferta-descripcion">${oferta.descripcion ? oferta.descripcion : "Sin descripción"}</div>
          <p><strong>Válido del</strong> ${new Date(oferta.fechaInicio).toLocaleDateString()} <strong>al</strong> ${new Date(oferta.fechaFin).toLocaleDateString()}</p>
          ${renderizarProductos(oferta.productos)}
          <button class="btn btn-primary btn-sm btn-adquirir mt-2">Adquirir</button>
        </div>
      `;

      const btnAdquirir = card.querySelector(".btn-adquirir");
      btnAdquirir.addEventListener("click", () => adquirirOferta({
        id: oferta.id,
        titulo: oferta.titulo,
        supermercado: nombreSupermercado,
        ubicacion: ubicacionSupermercado,
        descripcion: oferta.descripcion,
        productos: oferta.productos || []
      }));

      listaOfertas.appendChild(card);
    }

  } catch (error) {
    console.error("Error cargando ofertas:", error);
    listaOfertas.innerHTML = `<p>Error al cargar ofertas.</p>`;
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", async () => {
  await cargarSupermercadosSelect();
  await cargarTodasOfertas();
  filtroSupermercado.addEventListener("change", cargarTodasOfertas);
});
