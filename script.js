console.log("Script cargado con backend 🚀");

let movimientos = [];

// URL de tu backend
const API_URL = "http://localhost:3000/movimientos";

// Cargar movimientos desde el servidor al iniciar
async function cargarMovimientos() {
  try {
    const res = await fetch(API_URL);
    movimientos = await res.json();
    mostrarMovimientos();
  } catch (error) {
    console.error("Error al cargar movimientos:", error);
  }
}

cargarMovimientos();

// Agregar movimiento
async function agregarMovimiento() {
  const descripcion = document.getElementById("descripcion").value;
  const monto = parseFloat(document.getElementById("monto").value);
  const fecha = document.getElementById("fecha").value;
  const tipo = document.getElementById("tipo").value;

  if (!descripcion || isNaN(monto) || !fecha) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  const movimiento = { descripcion, monto, fecha, tipo };

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(movimiento)
    });
    const data = await res.json();
    movimiento.id = data.id; // asignar id generado por SQLite
    movimientos.push(movimiento);
    mostrarMovimientos();
    limpiarFormulario();
  } catch (error) {
    console.error("Error al agregar movimiento:", error);
  }
}

// Mostrar movimientos
function mostrarMovimientos(filtroMes = "") {
  const tabla = document.getElementById("tabla").getElementsByTagName("tbody")[0];
  tabla.innerHTML = "";

  let ingresos = 0;
  let gastos = 0;

  movimientos.forEach((mov) => {
    if (filtroMes && !mov.fecha.startsWith(filtroMes)) return;

    const fila = tabla.insertRow();
    fila.insertCell(0).innerText = mov.descripcion;
    fila.insertCell(1).innerText = "$" + mov.monto.toFixed(2);
    fila.insertCell(2).innerText = mov.fecha;
    fila.insertCell(3).innerText = mov.tipo;

    const acciones = fila.insertCell(4);
    acciones.innerHTML = `
      <button onclick="editarMovimiento(${mov.id})">✏️</button>
      <button onclick="eliminarMovimiento(${mov.id})">🗑️</button>
    `;

    if (mov.tipo === "ingreso") ingresos += mov.monto;
    else gastos += mov.monto;
  });

  document.getElementById("totalIngresos").innerText = ingresos.toFixed(2);
  document.getElementById("totalGastos").innerText = gastos.toFixed(2);
  document.getElementById("balance").innerText = (ingresos - gastos).toFixed(2);
}

// Eliminar movimiento
async function eliminarMovimiento(id) {
  try {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    movimientos = movimientos.filter(mov => mov.id !== id);
    mostrarMovimientos();
  } catch (error) {
    console.error("Error al eliminar movimiento:", error);
  }
}

// Editar movimiento
async function editarMovimiento(id) {
  const mov = movimientos.find(m => m.id === id);
  document.getElementById("descripcion").value = mov.descripcion;
  document.getElementById("monto").value = mov.monto;
  document.getElementById("fecha").value = mov.fecha;
  document.getElementById("tipo").value = mov.tipo;

  // Al guardar, eliminamos el viejo primero
  await eliminarMovimiento(id);
}

// Limpiar formulario
function limpiarFormulario() {
  document.getElementById("descripcion").value = "";
  document.getElementById("monto").value = "";
  document.getElementById("fecha").value = "";
  document.getElementById("tipo").value = "ingreso";
}

// Filtrar por mes
function filtrarPorMesUnico() {
  const mes = document.getElementById("filtroMesUnico").value;
  mostrarMovimientos(mes);
}
