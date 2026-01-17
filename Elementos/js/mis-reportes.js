// Mis Reportes - Vista de Estudiante (Solo Lectura)
let graficoBarras;
let reporteActual = null;
let todosLosReportes = [];

// Colores para cada materia
const coloresMateria = {
    'LC': '#FF4D4D',
    'MT': '#33CCFF',
    'SC': '#FF8C00',
    'CN': '#33FF77',
    'IN': '#B366FF'
};

const mapeoMaterias = {
    'lectura crítica': 'LC',
    'lectura_critica': 'LC',
    'lectura': 'LC',
    'matemáticas': 'MT',
    'matematicas': 'MT',
    'matematica': 'MT',
    'ciencias sociales': 'SC',
    'ciencias_sociales': 'SC',
    'sociales': 'SC',
    'ciencias naturales': 'CN',
    'ciencias_naturales': 'CN',
    'ciencias': 'CN',
    'inglés': 'IN',
    'ingles': 'IN',
    'english': 'IN'
};

const ordenMaterias = ['LC', 'MT', 'SC', 'CN', 'IN'];

document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    loadUserInfo();
    inicializarGrafico();
    cargarReportesEstudiante();

    document.getElementById('btnDescargarPDF').addEventListener('click', descargarPDF);
    document.getElementById('filtroPrueba')?.addEventListener('change', filtrarReportes);

    if (typeof inicializarPerfilCompartido === 'function') {
        inicializarPerfilCompartido();
    }

    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', handleLogout);
    }
});

function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || currentUser.tipoUsuario !== 'estudiante') {
        window.location.href = '../index.html';
        return;
    }
}

function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (currentUser.nombre) {
        document.getElementById('studentName')?.textContent = currentUser.nombre.toUpperCase();
    }
}

function inicializarGrafico() {
    const ctx = document.getElementById('graficoBarras').getContext('2d');
    const materias = ['Lectura Crítica', 'Matemáticas', 'Ciencias Sociales', 'Ciencias Naturales', 'Inglés'];
    const puntajes = [0, 0, 0, 0, 0];
    const colores = Object.values(coloresMateria);

    graficoBarras = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: materias,
            datasets: [{
                label: 'Puntaje por Materia',
                data: puntajes,
                backgroundColor: colores,
                borderColor: colores,
                borderWidth: 2,
                borderRadius: {
                    topLeft: 10,
                    topRight: 10
                },
                maxBarThickness: 75,
                minBarLength: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.08)'
                    },
                    ticks: {
                        stepSize: 10,
                        font: {
                            size: 12
                        },
                        callback: function (value) {
                            return value + '%';
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

async function cargarReportesEstudiante() {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const estudianteId = currentUser.numeroDocumento || currentUser.numeroIdentidad;

        if (!estudianteId) {
            throw new Error('No se pudo identificar al estudiante');
        }

        if (!window.firebaseDB) {
            await new Promise((resolve, reject) => {
                let attempts = 0;
                const maxAttempts = 50;
                const checkDB = () => {
                    attempts++;
                    if (window.firebaseDB) {
                        resolve();
                    } else if (attempts >= maxAttempts) {
                        reject(new Error('Firebase no se pudo inicializar'));
                    } else {
                        setTimeout(checkDB, 100);
                    }
                };
                checkDB();
            });
        }

        const db = window.firebaseDB;
        const reportesSnapshot = await db.collection('reportes')
            .where('estudianteId', '==', estudianteId)
            .get();

        const reportesLista = document.getElementById('reportesLista');

        if (reportesSnapshot.empty) {
            reportesLista.innerHTML = `
                <div class="no-reportes">
                    <i class="bi bi-file-earmark-x"></i>
                    <p>No tienes reportes disponibles</p>
                    <small>Los reportes aparecerán aquí cuando un administrador los genere</small>
                </div>
            `;
            return;
        }

        todosLosReportes = [];
        const pruebasUnicas = new Set();

        reportesSnapshot.forEach(doc => {
            const reporte = { id: doc.id, ...doc.data() };
            todosLosReportes.push(reporte);
            pruebasUnicas.add(reporte.pruebaNombre);
        });

        const filtroPrueba = document.getElementById('filtroPrueba');
        if (filtroPrueba) {
            filtroPrueba.innerHTML = '<option value="">Todas las pruebas</option>';
            pruebasUnicas.forEach(prueba => {
                const option = document.createElement('option');
                option.value = prueba;
                option.textContent = prueba;
                filtroPrueba.appendChild(option);
            });
        }

        mostrarReportes(todosLosReportes);

    } catch (error) {
        console.error('Error cargando reportes:', error);
        document.getElementById('reportesLista').innerHTML = `
            <div class="error-message">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error cargando reportes</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

function mostrarReportes(reportes) {
    const reportesLista = document.getElementById('reportesLista');
    
    if (reportes.length === 0) {
        reportesLista.innerHTML = `
            <div class="no-reportes">
                <i class="bi bi-search"></i>
                <p>No se encontraron reportes</p>
                <small>Intenta con otro filtro</small>
            </div>
        `;
        return;
    }

    let reportesHTML = '';

    reportes.forEach(reporte => {
        const fechaGeneracion = reporte.fechaGeneracion?.toDate?.()?.toLocaleDateString() || 'Sin fecha';
        const fechaPrueba = reporte.fechaPrueba?.toDate?.()?.toLocaleDateString() || 'Sin fecha';

        reportesHTML += `
            <div class="reporte-item" data-reporte-id="${reporte.id}">
                <div class="reporte-header">
                    <h4><i class="bi bi-file-earmark-pdf"></i> ${reporte.pruebaNombre}</h4>
                    <span class="reporte-puntaje">${reporte.puntajeGlobal}</span>
                </div>
                <div class="reporte-info">
                    <p><strong>Fecha de Prueba:</strong> ${fechaPrueba}</p>
                    <p><strong>Generado:</strong> ${fechaGeneracion}</p>
                    <p><strong>Percentil:</strong> ${reporte.percentilGeneral}%</p>
                </div>
                <div class="reporte-actions">
                    <button class="btn-ver" onclick="verReporte('${reporte.id}')">
                        <i class="bi bi-eye"></i> Ver
                    </button>
                    <button class="btn-descargar" onclick="descargarReporte('${reporte.id}')">
                        <i class="bi bi-download"></i> Descargar
                    </button>
                </div>
            </div>
        `;
    });

    reportesLista.innerHTML = reportesHTML;
}

function filtrarReportes() {
    const filtro = document.getElementById('filtroPrueba')?.value;
    
    if (!filtro) {
        mostrarReportes(todosLosReportes);
    } else {
        const reportesFiltrados = todosLosReportes.filter(reporte => reporte.pruebaNombre === filtro);
        mostrarReportes(reportesFiltrados);
    }
}

async function verReporte(reporteId) {
    try {
        const db = window.firebaseDB;
        const reporteDoc = await db.collection('reportes').doc(reporteId).get();

        if (!reporteDoc.exists) {
            throw new Error('Reporte no encontrado');
        }

        const reporte = reporteDoc.data();
        reporteActual = reporte;

        llenarDatosReporte(reporte);
        document.getElementById('btnDescargarPDF').disabled = false;

        document.querySelectorAll('.reporte-item').forEach(item => {
            item.classList.remove('selected');
        });
        const reporteElement = document.querySelector(`[data-reporte-id="${reporteId}"]`);
        if (reporteElement) {
            reporteElement.classList.add('selected');
        }

    } catch (error) {
        console.error('Error cargando reporte:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el reporte: ' + error.message
        });
    }
}

function llenarDatosReporte(reporte) {
    console.log('Llenando datos del reporte:', reporte);

    document.getElementById('nombreEstudiante').value = reporte.datosEstudiante.nombre?.toUpperCase() || 'USUARIO';
    document.getElementById('identificacionEstudiante').value = reporte.datosEstudiante.numeroDocumento || '';
    document.getElementById('telefonoEstudiante').value = reporte.datosEstudiante.telefono || '';
    document.getElementById('municipioEstudiante').value = reporte.datosEstudiante.departamento || '';
    document.getElementById('tipoDocumento').value = reporte.datosEstudiante.tipoDocumento || 'CC';

    const mapeoGrado = {
        'PRESABER': 'PRESABER',
        'REPITENTE': 'INDIV/REP',
        'VALIDANTE': 'VALIDANTE',
        'SABER11': 'ESTUDIANTE'
    };
    document.getElementById('calEstudiante').value = mapeoGrado[reporte.datosEstudiante.grado] || 'ESTUDIANTE';

    if (reporte.fechaPrueba) {
        const fechaFormateada = reporte.fechaPrueba.toDate().toISOString().split('T')[0];
        document.getElementById('fechaAplicacion').value = fechaFormateada;
    }

    document.getElementById('puntajeGlobal').textContent = reporte.puntajeGlobal;
    
    if (reporte.datosEstudiante.sg11Numero) {
        document.getElementById('sg11Numero').value = reporte.datosEstudiante.sg11Numero;
    }

    document.getElementById('percentilGeneral').textContent = reporte.percentilGeneral;

    document.querySelectorAll('.puntaje-input').forEach(input => {
        input.value = 0;
        actualizarNivelVisual(input);
        actualizarRangoActivo(input);
        actualizarNivelDesempeno(input, input.dataset.materia === 'IN');
    });

    const puntajesOrdenados = [0, 0, 0, 0, 0];

    Object.keys(reporte.puntajes).forEach(materia => {
        const codigoMateria = obtenerCodigoMateria(materia);
        const input = document.querySelector(`.puntaje-input[data-materia="${codigoMateria}"]`);

        if (input && reporte.puntajes[materia]) {
            const puntaje = reporte.puntajes[materia].puntaje;
            input.value = puntaje;

            actualizarNivelVisual(input);
            actualizarRangoActivo(input);
            actualizarNivelDesempeno(input, codigoMateria === 'IN');

            const indice = ordenMaterias.indexOf(codigoMateria);
            if (indice !== -1) {
                puntajesOrdenados[indice] = puntaje;
            }
        }
    });

    graficoBarras.data.datasets[0].data = puntajesOrdenados;
    graficoBarras.update('active');
}

function obtenerCodigoMateria(materia) {
    const materiaLower = materia.toLowerCase().trim();

    if (mapeoMaterias[materiaLower]) {
        return mapeoMaterias[materiaLower];
    }

    const mapeoEspecifico = {
        'ciencias': 'CN',
        'ingles': 'IN',
        'matematicas': 'MT',
        'sociales': 'SC',
        'lectura': 'LC'
    };

    if (mapeoEspecifico[materiaLower]) {
        return mapeoEspecifico[materiaLower];
    }

    if (materiaLower.includes('lectura') || materiaLower.includes('critica')) return 'LC';
    if (materiaLower.includes('matematica')) return 'MT';
    if (materiaLower.includes('social')) return 'SC';
    if (materiaLower.includes('ciencia') && !materiaLower.includes('social')) return 'CN';
    if (materiaLower.includes('ingles') || materiaLower.includes('english')) return 'IN';

    return materia.toUpperCase();
}

function actualizarNivelVisual(input) {
    const valor = parseInt(input.value) || 0;
    input.classList.remove('nivel-bajo', 'nivel-medio', 'nivel-alto', 'nivel-superior');

    if (valor <= 39) {
        input.classList.add('nivel-bajo');
    } else if (valor <= 59) {
        input.classList.add('nivel-medio');
    } else if (valor <= 79) {
        input.classList.add('nivel-alto');
    } else {
        input.classList.add('nivel-superior');
    }
}

function actualizarRangoActivo(input) {
    const valor = parseInt(input.value) || 0;
    const fila = input.closest('tr');
    const columna = Array.from(fila.cells).indexOf(input.closest('td'));
    const tabla = input.closest('table');
    const rangos = Array.from(tabla.querySelectorAll('.fila-nivel')).slice(0, 4);

    rangos.forEach(fila => {
        const celda = fila.cells[columna];
        celda.querySelector('.rango')?.classList.remove('activo');
    });

    let rangoActivo;
    if (valor <= 39) rangoActivo = rangos[0];
    else if (valor <= 59) rangoActivo = rangos[1];
    else if (valor <= 79) rangoActivo = rangos[2];
    else rangoActivo = rangos[3];

    if (rangoActivo) {
        const celda = rangoActivo.cells[columna];
        const rango = celda.querySelector('.rango');
        if (rango) rango.classList.add('activo');
    }
}

function actualizarNivelDesempeno(input, esIngles = false) {
    const valor = parseInt(input.value) || 0;
    const fila = input.closest('tr');
    const columna = Array.from(fila.cells).indexOf(input.closest('td'));
    const tabla = input.closest('table');
    const filaNivel = tabla.querySelector('.fila-desempeno');

    if (filaNivel) {
        const celdaNivel = filaNivel.cells[columna];
        if (celdaNivel) {
            let nivel;
            if (esIngles) {
                if (valor >= 80) nivel = 'B+';
                else if (valor >= 60) nivel = 'B1';
                else if (valor >= 40) nivel = 'A2';
                else nivel = 'A- / A1';
            } else {
                if (valor <= 39) nivel = '1';
                else if (valor <= 59) nivel = '2';
                else if (valor <= 79) nivel = '3';
                else nivel = '4';
            }
            celdaNivel.textContent = nivel;
        }
    }
}

async function descargarReporte(reporteId) {
    await verReporte(reporteId);
    setTimeout(() => {
        descargarPDF();
    }, 500);
}

async function descargarPDF() {
    if (!reporteActual) {
        Swal.fire({
            icon: 'warning',
            title: 'Advertencia',
            text: 'Seleccione un reporte primero'
        });
        return;
    }

    const nombreEstudiante = reporteActual.datosEstudiante.nombre || 'ESTUDIANTE';
    const fechaActual = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    const nombreArchivo = `Mi_Reporte_${formatearNombrePDF(nombreEstudiante)}_${fechaActual}.pdf`;

    const opciones = {
        margin: [15, 12, 15, 12],
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 1.3,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 770,
            height: 1300
        },
        jsPDF: {
            unit: 'mm',
            format: 'legal',
            orientation: 'portrait'
        }
    };

    try {
        const elemento = document.getElementById('documento');
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        window.scrollTo(0, 0);

        const estilosOriginales = elemento.style.cssText;
        const bodyOriginal = document.body.style.cssText;

        elemento.style.width = '770px';
        elemento.style.height = 'auto';
        elemento.style.minHeight = '1300px';
        elemento.style.margin = '0';
        elemento.style.padding = '12px 10px';
        elemento.style.boxSizing = 'border-box';
        elemento.style.position = 'relative';
        elemento.style.top = '0';
        elemento.style.left = '0';

        document.body.style.overflow = 'visible';
        document.body.style.height = 'auto';

        Swal.fire({
            title: 'Generando PDF...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        await html2pdf().set(opciones).from(elemento).save();

        elemento.style.cssText = estilosOriginales;
        document.body.style.cssText = bodyOriginal;

        window.scrollTo(0, scrollPosition);

        Swal.close();

        Swal.fire({
            icon: 'success',
            title: '¡Descarga exitosa!',
            text: 'El reporte se ha descargado correctamente'
        });

    } catch (error) {
        console.error('Error al generar PDF:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al generar el PDF: ' + error.message
        });
    }
}

function formatearNombrePDF(nombre) {
    return nombre.split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
        .join('_');
}

function handleLogout() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro de que deseas cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ff0000',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.clear();
            localStorage.clear();
            window.location.href = '../index.html';
        }
    });
}
