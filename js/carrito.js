import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

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
const db = getFirestore(app);

const listaCarrito = document.getElementById("lista-carrito");
const carritoVacio = document.getElementById("carrito-vacio");
const btnProcederPago = document.getElementById("btn-proceder-pago");
const btnVaciarCarrito = document.getElementById("btn-vaciar-carrito");
const totalCarritoSpan = document.getElementById("total-carrito");

const modalPagoEl = document.getElementById("modalPago");
const modalPago = new bootstrap.Modal(modalPagoEl);
const formPago = document.getElementById("formPago");
const mensajePago = document.getElementById("mensajePago");

// Protección: redirigir si no está autenticado
onAuthStateChanged(auth, user => {
  if (!user) {
    window.location.href = "index.html"; // o login.html según tu estructura
  }
});

// Botón cerrar sesión (agrega en tu HTML un botón con id="btnCerrarSesion")
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
if (btnCerrarSesion) {
  btnCerrarSesion.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "index.html";
    }).catch(error => {
      alert("Error al cerrar sesión. Intenta de nuevo.");
      console.error(error);
    });
  });
}

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carritoOfertas")) || [];
}
function guardarCarrito(carrito) {
  localStorage.setItem("carritoOfertas", JSON.stringify(carrito));
}

// Calcula el total sumando (precioOferta * cantidadSeleccionada)
function calcularTotalCarrito() {
  const carrito = obtenerCarrito();
  let total = 0;
  carrito.forEach(oferta => {
    if (Array.isArray(oferta.productos)) {
      oferta.productos.forEach(p => {
        const precio = p.precioOferta || 0;
        const cantidad = p.cantidadSeleccionada || 0;
        total += precio * cantidad;
      });
    }
  });
  return total.toFixed(2);
}

// Renderiza los productos con input para cantidad
function renderizarProductos(productos, ofertaIndex) {
  if (!Array.isArray(productos) || productos.length === 0) return "<em>No hay productos</em>";
  let html = `<div class="producto-lista d-flex flex-column gap-2">`;

  productos.forEach((p, prodIndex) => {
    const cantidad = p.cantidadSeleccionada !== undefined ? p.cantidadSeleccionada : 1;
    html += `
      <div class="producto-item d-flex align-items-center justify-content-between" style="gap:10px;">
        <div style="flex: 2;">
          <strong>${p.nombre || "-"}</strong><br/>
          <small>
            <span class="precio-oferta">$${p.precioOferta ? p.precioOferta.toFixed(2) : "-"}</span>
            <span class="precio-original">$${p.precioOriginal ? p.precioOriginal.toFixed(2) : "-"}</span>
            &nbsp;| Stock: ${p.stockDisponible !== undefined ? p.stockDisponible : "-"}
          </small>
        </div>
        <div style="flex: 1; min-width: 90px;">
          <label style="margin-bottom:0; font-weight: 600;">Cantidad:</label>
          <input type="number" min="1" max="${p.stockDisponible || 1}" value="${cantidad}" 
            data-oferta-index="${ofertaIndex}" data-producto-index="${prodIndex}" 
            class="input-cantidad form-control form-control-sm" style="width: 70px;"/>
        </div>
      </div>
    `;
  });

  html += "</div>";
  return html;
}

function renderizarCarrito() {
  const carrito = obtenerCarrito();
  listaCarrito.innerHTML = "";

  if (carrito.length === 0) {
    carritoVacio.style.display = "block";
    btnProcederPago.disabled = true;
    totalCarritoSpan.textContent = "0.00";
    return;
  } else {
    carritoVacio.style.display = "none";
    btnProcederPago.disabled = false;
  }

  carrito.forEach((oferta, index) => {
    const div = document.createElement("div");
    div.className = "carrito-item";

    div.innerHTML = `
      <h5>${oferta.titulo}</h5>
      <div class="supermercado-nombre">Supermercado: ${oferta.supermercado || "Desconocido"}</div>
      <p>${oferta.descripcion || "Sin descripción"}</p>
      ${renderizarProductos(oferta.productos, index)}
      <button class="btn btn-danger btn-sm btn-eliminar">Eliminar</button>
    `;

    div.querySelector(".btn-eliminar").addEventListener("click", () => {
      eliminarDelCarrito(index, oferta.id);
    });

    listaCarrito.appendChild(div);
  });

  totalCarritoSpan.textContent = calcularTotalCarrito();

  document.querySelectorAll(".input-cantidad").forEach(input => {
    input.addEventListener("change", e => {
      const ofertaIdx = parseInt(e.target.getAttribute("data-oferta-index"));
      const productoIdx = parseInt(e.target.getAttribute("data-producto-index"));
      let valor = parseInt(e.target.value);

      if (isNaN(valor) || valor < 1) valor = 1;

      const carrito = obtenerCarrito();
      const producto = carrito[ofertaIdx].productos[productoIdx];

      if (valor > producto.stockDisponible) {
        valor = producto.stockDisponible;
        alert(`No hay suficiente stock. Stock máximo: ${producto.stockDisponible}`);
        e.target.value = valor;
      }

      producto.cantidadSeleccionada = valor;
      guardarCarrito(carrito);
      totalCarritoSpan.textContent = calcularTotalCarrito();
    });
  });
}

function eliminarDelCarrito(index, ofertaId) {
  let carrito = obtenerCarrito();
  carrito.splice(index, 1);
  guardarCarrito(carrito);

  let ocultas = JSON.parse(localStorage.getItem("ofertasOcultas")) || [];
  ocultas = ocultas.filter(id => id !== ofertaId);
  localStorage.setItem("ofertasOcultas", JSON.stringify(ocultas));

  renderizarCarrito();
}

btnProcederPago.addEventListener("click", () => {
  mensajePago.style.display = "none";
  formPago.reset();
  modalPago.show();
});

formPago.addEventListener("submit", async e => {
  e.preventDefault();

  const tipo = document.getElementById("tipoTarjeta").value;
  const numero = document.getElementById("numeroTarjeta").value.trim();
  const expiracion = document.getElementById("fechaExpiracion").value;
  const cvv = document.getElementById("cvv").value.trim();

  if (!tipo || numero.length !== 16 || !expiracion || (cvv.length < 3 || cvv.length > 4)) {
    mensajePago.textContent = "Por favor, complete correctamente todos los campos.";
    mensajePago.style.display = "block";
    return;
  }

  mensajePago.style.display = "none";
  formPago.querySelector("button[type=submit]").disabled = true;

  try {
    await actualizarStockDespuesPago();

    modalPago.hide();
    alert("Pago realizado con éxito. ¡Gracias por su compra!\nEspere la factura de su compra en su correo electrónico.");

    guardarCarrito([]);
    localStorage.setItem("ofertasOcultas", JSON.stringify([]));
    renderizarCarrito();

  } catch (error) {
    alert("Error al procesar la compra. Intente nuevamente.");
    console.error(error);
  } finally {
    formPago.querySelector("button[type=submit]").disabled = false;
  }
});

async function actualizarStockDespuesPago() {
  let carrito = obtenerCarrito();

  for (const oferta of carrito) {
    if (Array.isArray(oferta.productos)) {
      for (const producto of oferta.productos) {
        if (producto.stockDisponible !== undefined && producto.cantidadSeleccionada && producto.id) {
          const nuevoStock = Math.max(0, producto.stockDisponible - producto.cantidadSeleccionada);
          const productoDocRef = doc(db, "productos", producto.id);

          await updateDoc(productoDocRef, { stockDisponible: nuevoStock });

          // Actualizar localmente para reflejar cambios si es necesario
          producto.stockDisponible = nuevoStock;
          producto.cantidadSeleccionada = 1;
        }
      }
    }
  }
}

btnVaciarCarrito.addEventListener("click", () => {
  if (confirm("¿Estás seguro de vaciar todo el carrito?")) {
    guardarCarrito([]);
    localStorage.setItem("ofertasOcultas", JSON.stringify([]));
    renderizarCarrito();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  renderizarCarrito();
});
