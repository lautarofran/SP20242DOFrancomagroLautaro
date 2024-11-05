class Vehiculo { 
    constructor(P_id, P_modelo, P_anoFabricacion, P_velMax) {
        this.id = P_id;
        this.modelo = P_modelo;
        this.anoFabricacion = P_anoFabricacion;
        this.velMax = P_velMax;
    }

    toString() {
        return `ID: ${this.id}, Modelo: ${this.modelo}, Año Fabricacion: ${this.anoFabricacion}, Velocidad Maxima: ${this.velMax}`;
    }

    toJson() {
        return JSON.stringify({
            id: this.id,
            modelo: this.modelo,
            anoFabricacion: this.anoFabricacion,
            velMax: this.velMax
        });
    }
}
class Auto extends Vehiculo {
    constructor(P_id, P_modelo, P_anoFabricacion, P_velMax, P_cantidadPuertas, P_asientos) {
        super(P_id, P_modelo, P_anoFabricacion, P_velMax);
        this.cantidadPuertas = P_cantidadPuertas;
        this.asientos = P_asientos;
    }

    toString() {
        return `${super.toString()}, Cantidad de puertas: ${this.P_cantidadPuertas}, Asientos: ${this.asientos}`;
    }

    toJson() {
        const vehiculoAJson = super.toJson();
        const AutoAJson = {
            cantidadPuertas: this.cantidadPuertas,
            asientos: this.asientos
        };
        return JSON.stringify({ ...JSON.parse(vehiculoAJson), ...AutoAJson });
    }
}
class Camion extends Vehiculo {
    constructor(P_id, P_modelo, P_anoFabricacion, P_velMax, P_carga, P_autonomia) {
        super(P_id, P_modelo, P_anoFabricacion, P_velMax);
        this.carga = P_carga;
        this.autonomia = P_autonomia;
    }

    toString() {
        return `${super.toString()}, Carga: ${this.carga}, Autonomia: ${this.autonomia}`;
    }

    toJson() {
        const vehiculoAJson = super.toJson();
        const camionAJson = {
            carga: this.carga,
            autonomia: this.autonomia
        };
        return JSON.stringify({ ...JSON.parse(vehiculoAJson), ...camionAJson });
    }
}

let vehiculos = [];
let ordenAscendente = true;
let modoActual = "";

function cargarDatos() {
    mostrarSpinner();
    console.log("Iniciando la carga de datos...");
    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (xhttp.readyState === 4) {
            if (xhttp.status === 200) {
                try {
                    const data = JSON.parse(xhttp.responseText);

                    if (!Array.isArray(data)) {
                        throw new Error("Los datos recibidos no son un array");
                    }
                    vehiculos = data.map(item => {
                        if (item.carga !== undefined) {
                            return new Camion(item.id, item.modelo, item.anoFabricacion, item.velMax, item.carga, item.autonomia);
                        } else if (item.asientos !== undefined) {
                            return new Auto(item.id, item.modelo, item.anoFabricacion, item.velMax, item.cantidadPuertas, item.asientos);
                        }
                    }).filter(Boolean);
                    const filtroSeleccionado = document.getElementById('filtro').value;
                    actualizarTabla(filtroSeleccionado);
                } catch (error) {
                    alert("No se pudieron cargar los datos.");
                    console.error('Error al procesar los datos JSON:', error);
                }
                ocultarSpinner();
                console.log("Carga de datos finalizada.");
            } else {
                console.warn("Error al obtener los datos de la API:", xhttp.status);
                alert("No se pudo cargar la lista de vehiculos. Intente nuevamente.");
                ocultarSpinner();
            }
        }
    };

    xhttp.open("GET", "https://examenesutn.vercel.app/api/VehiculoAutoCamion", true);
    xhttp.send();
    console.log("Solicitud enviada a la API");
}
function actualizarTabla(filtro, vehiculosParaMostrar = window.listaVehiculos) {
    const tabla = document.querySelector('tbody');
    tabla.innerHTML = '';

    const vehiculosFiltrados = filtrarVehiculos(filtro, vehiculosParaMostrar);
    
    vehiculosFiltrados.forEach(vehiculo => {
        const fila = document.createElement('tr');
        fila.innerHTML = `<td>${vehiculo.id}</td>
                        <td>${vehiculo.modelo}</td>
                        <td>${vehiculo.anoFabricacion}</td>
                        <td>${vehiculo.velMax}</td>`;
        
        if (vehiculo instanceof Auto) {
            fila.innerHTML += `<td>${vehiculo.cantidadPuertas}</td>
                                <td>N/A</td>
                                <td>${vehiculo.asientos}</td>
                                <td>N/A</td>`;
        } else if (vehiculo instanceof Camion) {
            fila.innerHTML += `<td>N/A</td>
                                <td>${vehiculo.carga}</td>
                                <td>N/A</td>
                                <td>${vehiculo.autonomia}</td>`;
        }

        fila.innerHTML += `
        <td><button onclick='mostrarFormularioABM("modificacion", ${JSON.stringify(vehiculo)})'>Modificar</button></td>
        <td><button onclick='mostrarFormularioABM("baja", ${JSON.stringify(vehiculo)})'>Eliminar</button></td>`;

        tabla.appendChild(fila);
    });

    manejarVisibilidadColumnas();
    console.log("Tabla actualizada");
    agregarEventos();
}  
function agregarEventos() {
    const filas = document.querySelectorAll('tbody tr');
    filas.forEach(fila => {
        fila.addEventListener('dblclick', () => {
            const celdas = fila.querySelectorAll('td');
            const esAuto = celdas[4].textContent !== 'N/A';

            const datosFila = {
                id: parseInt(celdas[0].textContent),
                modelo: celdas[1].textContent,
                anoFabricacion: celdas[2].textContent,
                velMax: parseInt(celdas[3].textContent),
                cantidadPuertas: parseFloat(celdas[4].textContent !== 'N/A' ? celdas[4].textContent : 0),
                asientos: celdas[5].textContent !== 'N/A' ? celdas[5].textContent : '',
                carga: esAuto ? parseFloat(celdas[6].textContent) : 0,
                autonomia: parseFloat(celdas[7].textContent !== 'N/A' ? celdas[7].textContent : 0)
            };

            mostrarFormularioABM("modificacion", datosFila);
        });
    });

    const botonAgregar = document.querySelector('#agregarDatos');
    botonAgregar.addEventListener('click', () => {
        mostrarFormularioABM("alta");
    });

}
function mostrarFormularioABM(accion, datos = {}) {
    document.querySelector('.form-datos').style.display = 'none';
    const formABM = document.getElementById('form-abm');
    formABM.style.display = 'block';
    
    limpiarFormularioABM();

    const formTitle = document.getElementById('form-titulo');
    const tipoSelect = document.getElementById('tipo');

    switch (accion) {
        case 'alta':
            formTitle.textContent = 'Alta';
            document.getElementById('id').style.display = 'none';
            document.getElementById('idLabel').style.display = 'none';
            tipoSelect.disabled = false;    
            modoActual = 'alta';
            break;
        case 'baja':
            formTitle.textContent = 'Eliminacion';
            cargarDatosEnFormulario(datos);
            document.getElementById('id').disabled = true;
            tipoSelect.disabled = true;
            modoActual = 'baja';
            break;
        case 'modificacion':
            formTitle.textContent = 'Modificación';
            document.getElementById('id').style.display = "block";
            document.getElementById('idLabel').style.display = 'block';
            cargarDatosEnFormulario(datos);
            tipoSelect.disabled = true;
            modoActual = 'modificacion';
            break;
        default:
            formTitle.textContent = 'Acción Desconocida';
            break;
    }
}
function limpiarFormularioABM(){
    document.getElementById('modelo').value = '';
    document.getElementById('anoFabricacion').value = '';
    document.getElementById('velMax').value = '';
    document.getElementById('cantidadPuertas').value = '';
    document.getElementById('carga').value = '';
    document.getElementById('asientos').value = '';
    document.getElementById('autonomia').value = '';

    const tipoSelect = document.getElementById('tipo');
    tipoSelect.value = '';
    tipoSelect.disabled = false; 

    document.getElementById('autoInputs').style.display = 'none';
    document.getElementById('camionInputs').style.display = 'none';
}
function ocultarFormularioABM() {
    document.getElementById('form-abm').style.display = 'none';
    document.querySelector('.form-datos').style.display = 'block';
}
function mostrarInputsParaAbm() {
    const tipoSeleccionado = document.getElementById('tipo').value;

    document.getElementById('autoInputs').style.display = 'none';
    document.getElementById('camionInputs').style.display = 'none';

    if (tipoSeleccionado === 'auto') {
        document.getElementById('autoInputs').style.display = 'block';
    } else if (tipoSeleccionado === 'camion') {
        document.getElementById('camionInputs').style.display = 'block';
    }
}
function cargarDatosEnFormulario(datos) {
    document.getElementById('id').value = datos.id;
    document.getElementById('modelo').value = datos.modelo;
    document.getElementById('anoFabricacion').value = datos.anoFabricacion;
    document.getElementById('velMax').value = datos.velMax;

    const tipoSelect = document.getElementById('tipo');
    if (datos.asientos > 0) {
        tipoSelect.value = 'auto';
        document.getElementById('cantidadPuertas').value = datos.cantidadPuertas;
        document.getElementById('asientos').value = datos.asientos;
    } else if (datos.carga) {
        tipoSelect.value = 'camion';
        document.getElementById('carga').value = datos.carga;
        document.getElementById('autonomia').value = datos.autonomia;
    }

    mostrarInputsParaAbm();
}
function filtrarVehiculos(filtro, listaVehiculos = vehiculos) {
    return listaVehiculos.filter(vehiculo => {
        if (filtro === 'autos') {
            return vehiculo instanceof Auto;
        } else if (filtro === 'camiones') {
            return vehiculo instanceof Camion;
        }
        return true;
    });
}
function manejarVisibilidadColumnas() {
    const checkboxes = document.querySelectorAll('#checkboxContainer input[type="checkbox"]');
    const headers = document.querySelectorAll('th');
    const filtro = document.getElementById('filtro').value;

    checkboxes.forEach((checkbox, index) => {
        if (index >= headers.length) return;

        if (filtro === 'autos') {
            if (index === 5 || index === 7) {
                checkbox.checked = false;
                checkbox.disabled = true;
            } else {
                checkbox.disabled = false;
            }
        } else if (filtro === 'camiones') {
            if (index === 4 || index === 6) {
                checkbox.checked = false;
                checkbox.disabled = true;
            } else {
                checkbox.disabled = false;
            }
        } else {
            checkbox.disabled = false;
        }
        
        const isVisible = checkbox.checked;
        headers[index].style.display = isVisible ? '' : 'none';

        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (index < cells.length) {
                cells[index].style.display = isVisible ? '' : 'none';
            }
        });
    });
}
function manejarCambioFiltro() {
    const filtroSeleccionado = this.value;
    actualizarTabla(filtroSeleccionado);
}
function manejarCambioCheckbox(checkbox, index) {
    manejarVisibilidadColumnas(checkbox, index);
}
function ordenarTabla(columna) {
    const filtroActual = document.getElementById('filtro').value;

    let datosFiltrados = filtrarVehiculos(filtroActual, vehiculos);

    datosFiltrados.sort((a, b) => {
        let valorA = obtenerValorParaOrdenar(a, columna);
        let valorB = obtenerValorParaOrdenar(b, columna);

        if (typeof valorA === 'string') {
            return ordenAscendente ? valorA.localeCompare(valorB) : valorB.localeCompare(valorA);
        } else {
            return ordenAscendente ? valorA - valorB : valorB - valorA;
        }
    });
    ordenAscendente = !ordenAscendente;
    actualizarTabla(filtroActual, datosFiltrados);
}
function obtenerValorParaOrdenar(dato, columna) {
    if (columna === 'id') return dato.id;
    if (columna === 'modelo') return dato.modelo;
    if (columna === 'anoFabricacion') return dato.anoFabricacion;
    if (columna === 'velMax') return dato.velMax || 0;
    if (columna === 'cantidadPuertas') return dato.cantidadPuertas || 0;
    if (columna === 'asientos') return dato.asientos || 0;
    if (columna === 'carga') return dato.carga || 0;
    if (columna === 'autonomia') return dato.autonomia || 0;
    return ''; 
}
function mostrarSpinner() {
    console.log("Mostrando spinner...");
    document.getElementById('spinner').style.display = 'flex';
}
function ocultarSpinner() {
    console.log("Ocultando spinner...");
    document.getElementById('spinner').style.display = 'none';
}
function iniciarEscucharEventos() {
    const filtroSelect = document.getElementById('filtro');
    filtroSelect.addEventListener('change', manejarCambioFiltro);

    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', manejarVisibilidadColumnas);
    });
}
async function crearNuevoVehiculo(datos) {
    const { modelo, anoFabricacion, velMax, cantidadPuertas, carga, asientos, autonomia, tipoSeleccionado } = datos;
    let nuevoVehiculo;

    if (tipoSeleccionado === 'auto') {
        nuevoVehiculo = new Auto(null, modelo, anoFabricacion, velMax, cantidadPuertas, asientos);
    } else if (tipoSeleccionado === 'camion') {
        nuevoVehiculo = new Camion(null, modelo, anoFabricacion, velMax, carga, autonomia);
    }

    mostrarSpinner();

    try {
        const response = await fetch("https://examenesutn.vercel.app/api/VehiculoAutoCamion", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(nuevoVehiculo)
        });

        if (!response.ok) {
            throw new Error(`No se pudo realizar la operación. Código de respuesta: ${response.status}`);
        }

        const data = await response.json();
        if (data.id) {
            nuevoVehiculo.id = data.id;
            return nuevoVehiculo;
        } else {
            throw new Error("La respuesta no contiene un ID válido.");
        }
    } catch (error) {
        console.error("Error:", error.message);
        alert("No se pudo realizar la operación. Por favor, intenta de nuevo.");
        return null;
    } finally {
        ocultarSpinner();
    }
}
async function agregarElemento() {
    const datos = obtenerDatosDelFormulario();
    const errorMensaje = validarDatosVehiculo(datos);
    if (errorMensaje) {
        alert(errorMensaje);
        return;
    }

    if (modoActual === 'modificacion') {
        let vehiculoExistente = vehiculos.find(vehiculo => vehiculo.id === parseInt(datos.id));
        if (vehiculoExistente) {
            await modificarVehiculo();
            alert("Datos actualizados correctamente.");
            return;
        }
    }

    if (modoActual === 'alta') {
        const nuevoVehiculo = await crearNuevoVehiculo(datos);
        if (nuevoVehiculo) {
            vehiculos.push(nuevoVehiculo);
            alert("Agregado correctamente.");
            actualizarTabla();
        }
    }

    ocultarFormularioABM();
    limpiarFormularioABM();
}
function modificarVehiculo() {
    mostrarSpinner();
    const id = parseInt(document.getElementById('id').value);
    const modelo = document.getElementById('modelo').value.trim();
    const anoFabricacion = parseInt(document.getElementById('anoFabricacion').value);
    const velMax = parseFloat(document.getElementById('velMax').value);
    const cantidadPuertas = parseFloat(document.getElementById('cantidadPuertas').value);
    const carga = parseFloat(document.getElementById('carga').value);
    const asientos = parseFloat(document.getElementById('asientos').value);
    const autonomia = parseFloat(document.getElementById('autonomia').value);
    const tipo = document.getElementById('tipo').value;

    const datosVehiculo = { modelo, anoFabricacion, velMax, cantidadPuertas, carga, asientos, autonomia, tipoSeleccionado: tipo };

    const errorMensaje = validarDatosVehiculo(datosVehiculo);
    if (errorMensaje) {
        alert(errorMensaje);
        ocultarSpinner();
        return;
    }

    let vehiculoModificado;
    if (tipo === "auto") {
        vehiculoModificado = new Auto(id, modelo, anoFabricacion, velMax, cantidadPuertas, asientos);
    } else if (tipo === "camion") {
        vehiculoModificado = new Camion(id, modelo, anoFabricacion, velMax, carga, autonomia);
    }

    fetch("https://examenesutn.vercel.app/api/VehiculoAutoCamion", {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(vehiculoModificado)
    })
    .then(response => {
        ocultarSpinner();
        if (response.ok) {
            return response.text();
        } else {
            throw new Error("No se pudo modificar.");
        }
    })
    .then(text => {
        alert(text);

        const index = vehiculos.findIndex(vehiculo => vehiculo.id === vehiculoModificado.id);
        if (index !== -1) {
            vehiculos[index] = vehiculoModificado;
        }
        actualizarTabla(document.getElementById('filtro').value);
        ocultarFormularioABM();
    })
    .catch(error => {
        console.error(error);
        ocultarSpinner();
        alert('No se pudo realizar la modificación: ' + error.message);
    });
}
async function eliminarVehiculo(id) {
    mostrarSpinner();
    try {
        const response = await fetch("https://examenesutn.vercel.app/api/VehiculoAutoCamion", {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });

        if (response.ok) {
            vehiculos = vehiculos.filter(vehiculo => vehiculo.id !== id);
            actualizarTabla(document.getElementById('filtro').value);
            ocultarSpinner();
            ocultarFormularioABM();
            alert("Elemento eliminado correctamente.");
        } else {
            throw new Error('No se pudo realizar la operación');
        }
    } catch (error) {
        console.error(error);
        ocultarSpinner();
        ocultarFormularioABM();
        alert(error.message);
    }
}
function validarDatosVehiculo(datos) {
    const { modelo, anoFabricacion, velMax, tipoSeleccionado } = datos;
    
    if (!modelo || modelo.trim() === "") {
        return "El modelo no puede estar vacío.";
    }
    if (isNaN(anoFabricacion) || anoFabricacion <= 1985) {
        return "El año de fabricación debe ser mayor a 1985.";
    }
    if (isNaN(velMax) || velMax <= 0) {
        return "La velocidad máxima debe ser un número mayor a 0.";
    }
    if (tipoSeleccionado === 'auto') {
        return validarDatosAuto(datos);
    } else if (tipoSeleccionado === 'camion') {
        return validarDatosCamion(datos);
    } else {
        return "Tipo seleccionado no válido. Por favor, seleccione 'auto' o 'camion'.";
    }
}
function validarDatosAuto(datos) {
    const { cantidadPuertas, asientos } = datos;

    if (isNaN(cantidadPuertas) || cantidadPuertas <= 2) {
        return "El auto debe tener más de 2 puertas.";
    }
    if (isNaN(asientos) || asientos <= 2) {
        return "El auto debe tener más de 2 asientos.";
    }
    return null;
}
function validarDatosCamion(datos) {
    const { carga, autonomia } = datos;

    if (isNaN(carga) || carga <= 0) {
        return "La carga debe ser un número mayor a 0.";
    }
    if (isNaN(autonomia) || autonomia <= 0) {
        return "La autonomía debe ser un número mayor a 0.";
    }
    return null;
}
function obtenerDatosDelFormulario() {
    return {
        id: document.getElementById('id').value,
        modelo: document.getElementById('modelo').value,
        anoFabricacion: document.getElementById('anoFabricacion').value,
        velMax: parseInt(document.getElementById('velMax').value),
        cantidadPuertas: parseFloat(document.getElementById('cantidadPuertas').value) || 0,
        carga: parseFloat(document.getElementById('carga').value) || 0,
        asientos: parseFloat(document.getElementById('asientos').value) || 0,
        autonomia: parseFloat(document.getElementById('autonomia').value) || 0,
        tipoSeleccionado: document.getElementById('tipo').value
    };
}

document.getElementById('aceptar').addEventListener('click', async function() {
    const id = parseInt(document.getElementById('id').value);

    if (modoActual === 'alta') {
        await agregarElemento();
    } else if (modoActual === 'modificacion') {
        await modificarVehiculo();
    } else if (modoActual === 'baja') {
        await eliminarVehiculo(id);
    }

    
});

window.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    manejarVisibilidadColumnas();
    iniciarEscucharEventos();
});