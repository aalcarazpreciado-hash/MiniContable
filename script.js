console.log("Script cargado con mejoras 🚀");

let movimientos = [];

function agregarMovimiento() {
  const descripcion = document.getElementById("descripcion").value;
  const monto = parseFloat(document.getElementById("monto").value);
  const fecha = document.getElementById("fecha").value;
  const tipo = document.getElementById("tipo").value;

  if (!descripcion || isNaN(monto) || !fecha) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  // Crear objeto movimiento
  const movimiento = { descripcion, monto, fecha, tipo };
  movimientos.push(movimiento);

  filtrarPorMes(); // aplicar filtro si hay mes seleccionado
  limpiarFormulario();
}

function mostrarMovimientos(filtroMes = "") {
  const tabla = document.getElementById("tabla").getElementsByTagName("tbody")[0];
  tabla.innerHTML = ""; // limpiar tabla

  let ingresos = 0;
  let gastos = 0;

  movimientos.forEach((mov, index) => {
    // Filtrar por mes si está activo
    if (filtroMes && !mov.fecha.startsWith(filtroMes)) return;

    const fila = tabla.insertRow();
    fila.insertCell(0).innerText = mov.descripcion;
    fila.insertCell(1).innerText = "$" + mov.monto.toFixed(2);
    fila.insertCell(2).innerText = mov.fecha;
    fila.insertCell(3).innerText = mov.tipo;

    // Acciones (editar y eliminar)
    const acciones = fila.insertCell(4);
    acciones.innerHTML = `
      <button onclick="editarMovimiento(${index})">✏️</button>
      <button onclick="eliminarMovimiento(${index})">🗑️</button>
    `;

    // Sumar totales
    if (mov.tipo === "ingreso") ingresos += mov.monto;
    else gastos += mov.monto;
  });

  // Actualizar totales
  document.getElementById("totalIngresos").innerText = ingresos.toFixed(2);
  document.getElementById("totalGastos").innerText = gastos.toFixed(2);
  document.getElementById("balance").innerText = (ingresos - gastos).toFixed(2);
}

function eliminarMovimiento(index) {
  movimientos.splice(index, 1);
  filtrarPorMes(); // actualizar con filtro si está activo
}

function editarMovimiento(index) {
  const mov = movimientos[index];
  document.getElementById("descripcion").value = mov.descripcion;
  document.getElementById("monto").value = mov.monto;
  document.getElementById("fecha").value = mov.fecha;
  document.getElementById("tipo").value = mov.tipo;

  // Eliminar el movimiento viejo para reemplazarlo con el editado
  movimientos.splice(index, 1);
  filtrarPorMes(); // refrescar la vista según el filtro actual
}

function limpiarFormulario() {
  document.getElementById("descripcion").value = "";
  document.getElementById("monto").value = "";
  document.getElementById("fecha").value = "";
  document.getElementById("tipo").value = "ingreso";
}

function filtrarPorMes() {
  const mes = document.getElementById("filtroMes").value;
  mostrarMovimientos(mes);
}
