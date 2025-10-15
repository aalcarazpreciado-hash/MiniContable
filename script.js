const API_URL = "http://localhost:4000";

// Variables globales para los gráficos
let graficoBalance = null;
let graficoConceptos = null;

// ==========================
// FUNCIONES GENERALES
// ==========================
function abrirPestaña(evt, nombrePestaña) {
  const tabcontent = document.querySelectorAll(".tabcontent");
  tabcontent.forEach(div => div.style.display = "none");

  const tablinks = document.querySelectorAll(".tablink");
  tablinks.forEach(btn => btn.classList.remove("active"));

  document.getElementById(nombrePestaña).style.display = "block";
  evt.currentTarget.classList.add("active");

  // Cargar datos según la pestaña
  if (nombrePestaña === "Resumen") {
    cargarBalanceGeneral();
    cargarResumenPorConcepto();
  } else if (nombrePestaña === 'Configuracion') {
    cargarCatalogo();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("defaultOpen").click();
  cargarClientes();
  cargarProveedores();
  cargarMovimientos();
});

// Balance General
async function cargarBalanceGeneral() {
  try {
    const res = await fetch(`${API_URL}/movimientos`);
    const movimientos = await res.json();
    
    let totalIngresos = 0;
    let totalGastos = 0;

    movimientos.forEach(m => {
      totalIngresos += parseFloat(m.ingreso) || 0;
      totalGastos += parseFloat(m.gasto) || 0;
    });

    const saldo = totalIngresos - totalGastos;

    document.getElementById("balanceGeneral").innerHTML = `
      <p>Total Ingresos: $${totalIngresos.toFixed(2)}</p>
      <p>Total Gastos: $${totalGastos.toFixed(2)}</p>
      <p><strong>Saldo: $${saldo.toFixed(2)}</strong></p>
    `;
    
    // Actualizar gráficos después de cargar los datos
    actualizarGraficos();
  } catch (err) {
    console.error("Error cargando balance:", err);
  }
}

// Resumen por concepto
async function cargarResumenPorConcepto() {
  try {
    const res = await fetch(`${API_URL}/movimientos`);
    const movimientos = await res.json();
    
    const resumen = {};

    movimientos.forEach(m => {
      const concepto = m.concepto || 'Sin concepto';
      if (!resumen[concepto]) {
        resumen[concepto] = { ingreso: 0, gasto: 0 };
      }
      resumen[concepto].ingreso += parseFloat(m.ingreso) || 0;
      resumen[concepto].gasto += parseFloat(m.gasto) || 0;
    });

    let html = "<table><tr><th>Concepto</th><th>Ingresos</th><th>Gastos</th></tr>";
    for (const concepto in resumen) {
      html += `<tr>
        <td>${concepto}</td>
        <td>$${resumen[concepto].ingreso.toFixed(2)}</td>
        <td>$${resumen[concepto].gasto.toFixed(2)}</td>
      </tr>`;
    }
    html += "</table>";
    
    document.getElementById("resumenConceptos").innerHTML = html;
  } catch (err) {
    console.error("Error cargando resumen:", err);
  }
}

// ==========================
// CLIENTES
// ==========================
const API_CLIENTES = `${API_URL}/clientes`;
let clientes = [];

async function cargarClientes() {
  try {
    const res = await fetch(API_CLIENTES);
    clientes = await res.json();
    mostrarClientes();
  } catch (err) {
    console.error("Error cargando clientes:", err);
    clientes = [];
    mostrarClientes();
  }
}

function mostrarClientes() {
  const tbody = document.querySelector("#tablaClientes tbody");
  tbody.innerHTML = "";

  clientes.forEach((c, index) => {
    const fila = tbody.insertRow();
    fila.insertCell(0).innerText = c.id;
    fila.insertCell(1).innerText = c.nombre;
    fila.insertCell(2).innerText = c.rfc || "";
    fila.insertCell(3).innerText = c.domicilio || "";
    fila.insertCell(4).innerText = c.regimen || "";
    fila.insertCell(5).innerText = c.telefono || "";
    fila.insertCell(6).innerText = c.email || "";

    const acciones = fila.insertCell(7);
    acciones.innerHTML = `
      <button onclick="editarCliente(${c.id})">✏️</button>
      <button onclick="eliminarCliente(${c.id})">🗑️</button>
    `;
  });
}

async function guardarCliente() {
  const id = document.getElementById("cliente_id").value;
  const cliente = {
    nombre: document.getElementById("cliente_nombre").value.trim(),
    rfc: document.getElementById("cliente_rfc").value.trim(),
    domicilio: document.getElementById("cliente_domicilio").value.trim(),
    regimen: document.getElementById("cliente_regimen").value.trim(),
    telefono: document.getElementById("cliente_telefono").value.trim(),
    email: document.getElementById("cliente_email").value.trim()
  };

  if (!cliente.nombre) return alert("El nombre es obligatorio");

  try {
    let res;
    if (id) {
      res = await fetch(`${API_CLIENTES}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente)
      });
    } else {
      res = await fetch(API_CLIENTES, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cliente)
      });
    }

    if (!res.ok) {
      const errorData = await res.json();
      alert("Error al guardar: " + errorData.error);
      return;
    }

    limpiarFormularioCliente();
    cargarClientes();
  } catch (err) {
    console.error("Error guardando cliente:", err);
    alert("Error al guardar cliente");
  }
}

function editarCliente(id) {
  const c = clientes.find(x => x.id === id);
  if (!c) return alert("Cliente no encontrado");

  document.getElementById("cliente_id").value = c.id;
  document.getElementById("cliente_nombre").value = c.nombre;
  document.getElementById("cliente_rfc").value = c.rfc || "";
  document.getElementById("cliente_domicilio").value = c.domicilio || "";
  document.getElementById("cliente_regimen").value = c.regimen || "";
  document.getElementById("cliente_telefono").value = c.telefono || "";
  document.getElementById("cliente_email").value = c.email || "";

  document.querySelector(".tablink[onclick*='Clientes']")?.click();
  document.getElementById('formularioClientes').style.display = 'block';
}

async function eliminarCliente(id) {
  if (!confirm("¿Confirma eliminar este cliente?")) return;
  try {
    const res = await fetch(`${API_CLIENTES}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`DELETE ${res.status}`);
    cargarClientes();
  } catch (err) {
    console.error("Error eliminando cliente:", err);
    alert("No se pudo eliminar cliente");
  }
}

function limpiarFormularioCliente() {
  document.getElementById("cliente_id").value = "";
  ["cliente_nombre","cliente_rfc","cliente_domicilio","cliente_regimen","cliente_telefono","cliente_email"]
    .forEach(id => document.getElementById(id).value = "");
  document.getElementById('formularioClientes').style.display = 'none';
}

// ==========================
// PROVEEDORES
// ==========================
async function cargarProveedores() {
  try {
    const res = await fetch(`${API_URL}/proveedores`);
    const data = await res.json();
    const tbody = document.querySelector("#tablaProveedores tbody");
    tbody.innerHTML = "";
    data.forEach((prov, index) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${prov.nombre}</td>
        <td>${prov.rfc || ""}</td>
        <td>${prov.domicilio || ""}</td>
        <td>${prov.regimen || ""}</td>
        <td>${prov.telefono || ""}</td>
        <td>${prov.email || ""}</td>
        <td>
          <button onclick='editarProveedor(${JSON.stringify(prov)})'>Editar</button>
          <button onclick='eliminarProveedor(${prov.id})'>Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

function limpiarFormularioProveedor() {
  document.getElementById("proveedor_nombre").value = "";
  document.getElementById("proveedor_rfc").value = "";
  document.getElementById("proveedor_domicilio").value = "";
  document.getElementById("proveedor_regimen").value = "";
  document.getElementById("proveedor_telefono").value = "";
  document.getElementById("proveedor_email").value = "";
  document.getElementById("proveedor_nombre").dataset.id = "";
  document.getElementById('formularioProveedores').style.display = 'none';
}

function editarProveedor(prov) {
  abrirPestaña({ currentTarget: document.querySelector(".tablink:nth-child(5)") }, "Proveedores");
  document.getElementById("proveedor_nombre").value = prov.nombre;
  document.getElementById("proveedor_rfc").value = prov.rfc || "";
  document.getElementById("proveedor_domicilio").value = prov.domicilio || "";
  document.getElementById("proveedor_regimen").value = prov.regimen || "";
  document.getElementById("proveedor_telefono").value = prov.telefono || "";
  document.getElementById("proveedor_email").value = prov.email || "";
  document.getElementById("proveedor_nombre").dataset.id = prov.id;
  document.getElementById('formularioProveedores').style.display = 'block';
}

async function guardarProveedor() {
  const id = document.getElementById("proveedor_nombre").dataset.id;
  const prov = {
    nombre: document.getElementById("proveedor_nombre").value,
    rfc: document.getElementById("proveedor_rfc").value,
    domicilio: document.getElementById("proveedor_domicilio").value,
    regimen: document.getElementById("proveedor_regimen").value,
    telefono: document.getElementById("proveedor_telefono").value,
    email: document.getElementById("proveedor_email").value
  };

  if (!prov.nombre) {
    alert("El nombre es obligatorio");
    return;
  }

  try {
    if (id) {
      await fetch(`${API_URL}/proveedores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prov)
      });
    } else {
      await fetch(`${API_URL}/proveedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prov)
      });
    }
    limpiarFormularioProveedor();
    cargarProveedores();
  } catch (err) {
    console.error(err);
  }
}

async function eliminarProveedor(id) {
  if (!confirm("¿Seguro que deseas eliminar este proveedor?")) return;
  try {
    await fetch(`${API_URL}/proveedores/${id}`, { method: "DELETE" });
    cargarProveedores();
  } catch (err) {
    console.error(err);
  }
}

// ==========================
// MOVIMIENTOS
// ==========================
async function cargarMovimientos() {
  try {
    const res = await fetch(`${API_URL}/movimientos`);
    const data = await res.json();
    const tbody = document.querySelector("#tabla tbody");
    tbody.innerHTML = "";

    let saldo = 0;
    data.forEach((mov, index) => {
      saldo += (mov.ingreso || 0) - (mov.gasto || 0);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>${mov.concepto}</td>
        <td>${mov.fecha}</td>
        <td>${mov.formaPago || ""}</td>
        <td>${mov.proveedor_id || ""}</td>
        <td>${mov.ingreso || 0}</td>
        <td>${mov.gasto || 0}</td>
        <td>${saldo.toFixed(2)}</td>
        <td>${mov.descripcion || ""}</td>
        <td>
          <button onclick='editarMovimiento(${JSON.stringify(mov)})'>Editar</button>
          <button onclick='eliminarMovimiento(${mov.id})'>Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

function limpiarFormulario() {
  document.getElementById("concepto").value = "";
  document.getElementById("fecha").value = "";
  document.getElementById("formaPago").value = "Efectivo";
  document.getElementById("proveedor").value = "";
  document.getElementById("ingreso").value = "";
  document.getElementById("gasto").value = "";
  document.getElementById("descripcion").value = "";
  document.getElementById("concepto").dataset.id = "";
}

function editarMovimiento(mov) {
  abrirPestaña({ currentTarget: document.querySelector(".tablink:nth-child(2)") }, "Agregar");
  document.getElementById("concepto").value = mov.concepto;
  document.getElementById("fecha").value = mov.fecha;
  document.getElementById("formaPago").value = mov.formaPago || "Efectivo";
  document.getElementById("proveedor").value = mov.proveedor_id || "";
  document.getElementById("ingreso").value = mov.ingreso || 0;
  document.getElementById("gasto").value = mov.gasto || 0;
  document.getElementById("descripcion").value = mov.descripcion || "";
  document.getElementById("concepto").dataset.id = mov.id;
}

async function guardarMovimiento() {
  const id = document.getElementById("concepto").dataset.id;
  const mov = {
    concepto: document.getElementById("concepto").value,
    fecha: document.getElementById("fecha").value,
    formaPago: document.getElementById("formaPago").value,
    proveedor_id: document.getElementById("proveedor").value || null,
    ingreso: parseFloat(document.getElementById("ingreso").value) || 0,
    gasto: parseFloat(document.getElementById("gasto").value) || 0,
    descripcion: document.getElementById("descripcion").value
  };

  if (!mov.concepto || !mov.fecha) {
    alert("Concepto y Fecha son obligatorios");
    return;
  }

  try {
    if (id) {
      await fetch(`${API_URL}/movimientos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mov)
      });
    } else {
      await fetch(`${API_URL}/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mov)
      });
    }
    limpiarFormulario();
    cargarMovimientos();
    alert("Movimiento guardado exitosamente");
  } catch (err) {
    console.error(err);
    alert("Error al guardar el movimiento");
  }
}

async function eliminarMovimiento(id) {
  if (!confirm("¿Seguro que deseas eliminar este movimiento?")) return;
  try {
    await fetch(`${API_URL}/movimientos/${id}`, { method: "DELETE" });
    cargarMovimientos();
  } catch (err) {
    console.error(err);
  }
}

// ==========================
// FILTRO POR MES
// ==========================
function filtrarPorMesUnico() {
  const mesSeleccionado = document.getElementById("filtroMesUnico").value;
  const filas = document.querySelectorAll("#tabla tbody tr");
  
  filas.forEach(fila => {
    const fecha = fila.cells[2].textContent;
    if (!mesSeleccionado || fecha.startsWith(mesSeleccionado)) {
      fila.style.display = "";
    } else {
      fila.style.display = "none";
    }
  });
}

// ==========================
// ACTUALIZAR GRÁFICOS
// ==========================
async function actualizarGraficos() {
  try {
    const res = await fetch(`${API_URL}/movimientos`);
    const movimientos = await res.json();

    // Calcular totales generales
    const totalIngresos = movimientos.reduce((acc, m) => acc + (parseFloat(m.ingreso) || 0), 0);
    const totalGastos = movimientos.reduce((acc, m) => acc + (parseFloat(m.gasto) || 0), 0);

    // === GRÁFICO DE BALANCE GENERAL ===
    const ctxBalance = document.getElementById('graficoBalance');
    if (!ctxBalance) {
      console.error("No se encontró el canvas graficoBalance");
      return;
    }

    // Destruir gráfico anterior si existe
    if (graficoBalance) {
      graficoBalance.destroy();
    }

    graficoBalance = new Chart(ctxBalance, {
      type: 'doughnut',
      data: {
        labels: ['Ingresos', 'Gastos'],
        datasets: [{
          data: [totalIngresos, totalGastos],
          backgroundColor: ['#bea074', '#846c4c'],
          borderColor: ['#f4f6f8', '#f4f6f8'],
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { 
            display: true,
            text: 'Balance General', 
            color: '#f4f6f8',
            font: { size: 16 }
          },
          legend: { 
            position: 'bottom',
            labels: { color: '#f4f6f8' } 
          }
        }
      }
    });

    // === GRÁFICO DE RESUMEN POR CONCEPTO ===
    const resumen = {};

    movimientos.forEach(m => {
      const concepto = m.concepto || 'Sin concepto';
      const ingreso = parseFloat(m.ingreso) || 0;
      const gasto = parseFloat(m.gasto) || 0;
      const neto = ingreso - gasto;
      resumen[concepto] = (resumen[concepto] || 0) + neto;
    });

    const conceptos = Object.keys(resumen);
    const valores = Object.values(resumen);

    const ctxConceptos = document.getElementById('graficoConceptos');
    if (!ctxConceptos) {
      console.error("No se encontró el canvas graficoConceptos");
      return;
    }

    // Destruir gráfico anterior si existe
    if (graficoConceptos) {
      graficoConceptos.destroy();
    }

    graficoConceptos = new Chart(ctxConceptos, {
      type: 'bar',
      data: {
        labels: conceptos,
        datasets: [{
          label: 'Resultado por Concepto',
          data: valores,
          backgroundColor: '#bea074',
          borderColor: '#846c4c',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: { 
            display: true, 
            text: 'Resumen por Concepto', 
            color: '#f4f6f8',
            font: { size: 16 }
          },
          legend: { 
            labels: { color: '#f4f6f8' } 
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { 
              callback: value => '$' + value.toLocaleString(),
              color: '#f4f6f8'
            },
            grid: { color: '#514c41' }
          },
          x: {
            ticks: { color: '#f4f6f8' },
            grid: { color: '#514c41' }
          }
        }
      }
    });

    console.log("Gráficos actualizados correctamente");
  } catch (error) {
    console.error("Error generando gráficos:", error);
  }
}

// ==========================
// CATÁLOGO DE CUENTAS
// ==========================
function cargarCatalogo() {
  // Listado de cuentas creadas por el usuario
  fetch(`${API_URL}/cuentas`)
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector('#tablaCuentas tbody');
      tbody.innerHTML = '';

      data.forEach(cuenta => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${cuenta.codigo}</td>
          <td>${cuenta.nombre}</td>
          <td>${cuenta.tipo}</td>
          <td>${cuenta.nivel}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => console.error('Error al cargar cuentas creadas:', err));

  // Cargar select de Cuenta Padre con plantillas
  fetch(`${API_URL}/cuentas/plantillas`)
    .then(res => res.json())
    .then(data => {
      const cuentaPadreSelect = document.getElementById('cuentaPadre');
      cuentaPadreSelect.innerHTML = `<option value="">-- Cuenta Padre (opcional) --</option>`;

      data.forEach(cuenta => {
        const option = document.createElement('option');
        option.value = cuenta.id;
        option.textContent = `${cuenta.codigo} - ${cuenta.nombre}`;
        cuentaPadreSelect.appendChild(option);
      });
    })
    .catch(err => console.error('Error al cargar cuentas plantillas:', err));
}

// Búsqueda rápida
function filtrarCuentas() {
  const filtro = document.getElementById('buscarCuenta').value.toLowerCase();
  const rows = document.querySelectorAll('#tablaCuentas tbody tr');
  rows.forEach(row => {
    const nombre = row.cells[1].textContent.toLowerCase();
    const codigo = row.cells[0].textContent.toLowerCase();
    row.style.display = (nombre.includes(filtro) || codigo.includes(filtro)) ? '' : 'none';
  });
}

// Crear nueva cuenta
function crearCuenta(event) {
  event.preventDefault();

  const codigo = document.getElementById('nuevoCodigo').value.trim();
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const tipo = document.getElementById('nuevoTipo').value;
  const cuenta_padre_id = document.getElementById('cuentaPadre').value || null;
  const etiquetas = document.getElementById('etiquetas').value
                    .split(',')
                    .map(e => e.trim())
                    .filter(e => e);

  fetch(`${API_URL}/cuentas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo, nombre, tipo, nivel: 1, cuenta_padre_id, etiquetas })
  })
  .then(res => res.json())
  .then(data => {
    console.log('Cuenta creada:', data);
    document.getElementById('formNuevaCuenta').reset();
    cargarCatalogo();
  })
  .catch(err => console.error('Error al crear cuenta:', err));
}
