// Reportes Estudiante JavaScript
let graficoBarras;
let reporteActual = null;

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

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    checkAuthentication();
    
    // Cargar información del usuario
    loadUserInfo();
    
    // Inicializar gráfico
    inicializarGrafico();
    
    // Cargar reportes del estudiante
    cargarReportesEstudiante();
    
    // Configurar botón de descarga
    document.getElementById('btnDescargarPDF').addEventListener('click', descargarPDF);
});

// Verificar autenticación del estudiante
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.id || currentUser.tipoUsuario !== 'estudiante') {
        window.location.href = '../index.html';
        return;
    }
}

// Cargar información del usuario
function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (currentUser.nombre) {
        document.getElementById('studentName').textContent = currentUser.nombre.toUpperCase();
    }
}

// Función para inicializar el gráfico
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

// Cargar reportes disponibles para el estudiante
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
                const maxAttempts = 50; // 5 segundos máximo
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
        
        // Buscar reportes del estudiante
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

        let reportesHTML = '';
        
        reportesSnapshot.forEach(doc => {
            const reporte = doc.data();
            const fechaGeneracion = reporte.fechaGeneracion?.toDate?.()?.toLocaleDateString() || 'Sin fecha';
            const fechaPrueba = reporte.fechaPrueba?.toDate?.()?.toLocaleDateString() || 'Sin fecha';
            
            reportesHTML += `
                <div class="reporte-item" data-reporte-id="${doc.id}">
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
                        <button class="btn-ver" onclick="verReporte('${doc.id}')">
                            <i class="bi bi-eye"></i> Ver
                        </button>
                        <button class="btn-descargar" onclick="descargarReporte('${doc.id}')">
                            <i class="bi bi-download"></i> Descargar
                        </button>
                    </div>
                </div>
            `;
        });

        reportesLista.innerHTML = reportesHTML;

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

// Ver un reporte específico
async function verReporte(reporteId) {
    try {
        const db = window.firebaseDB;
        const reporteDoc = await db.collection('reportes').doc(reporteId).get();
        
        if (!reporteDoc.exists) {
            throw new Error('Reporte no encontrado');
        }

        const reporte = reporteDoc.data();
        reporteActual = reporte;
        
        // Llenar datos del estudiante
        llenarDatosReporte(reporte);
        
        // Actualizar información del panel
        actualizarInfoPanel(reporte);
        
        // Habilitar botón de descarga
        document.getElementById('btnDescargarPDF').disabled = false;
        
        // Marcar reporte como seleccionado
        document.querySelectorAll('.reporte-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelector(`[data-reporte-id="${reporteId}"]`).classList.add('selected');

    } catch (error) {
        console.error('Error cargando reporte:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el reporte: ' + error.message
        });
    }
}

// Llenar datos del reporte en el formulario
function llenarDatosReporte(reporte) {
    console.log('Llenando datos del reporte:', reporte);
    
    // Datos del estudiante
    document.getElementById('nombreEstudiante').value = reporte.datosEstudiante.nombre?.toUpperCase() || 'USUARIO';
    document.getElementById('identificacionEstudiante').value = reporte.datosEstudiante.numeroDocumento || '';
    document.getElementById('telefonoEstudiante').value = reporte.datosEstudiante.telefono || '';
    document.getElementById('municipioEstudiante').value = reporte.datosEstudiante.departamento || '';
    document.getElementById('tipoDocumento').value = reporte.datosEstudiante.tipoDocumento || 'CC';
    
    // Mapear grado a tipo de prueba
    const mapeoGrado = {
        'PRESABER': 'PRESABER',
        'REPITENTE': 'INDIV/REP',
        'VALIDANTE': 'VALIDANTE',
        'SABER11': 'ESTUDIANTE'
    };
    document.getElementById('calEstudiante').value = mapeoGrado[reporte.datosEstudiante.grado] || 'ESTUDIANTE';
    
    // Fecha de la prueba
    if (reporte.fechaPrueba) {
        const fechaFormateada = reporte.fechaPrueba.toDate().toISOString().split('T')[0];
        document.getElementById('fechaAplicacion').value = fechaFormateada;
    }
    
    // Puntaje global
    document.getElementById('puntajeGlobal').textContent = reporte.puntajeGlobal;
    
    // Percentil general
    document.getElementById('percentilGeneral').textContent = reporte.percentilGeneral;
    
    // Resetear todos los inputs primero
    document.querySelectorAll('.puntaje-input').forEach(input => {
        input.value = 0;
        actualizarNivelVisual(input);
        actualizarRangoActivo(input);
        actualizarNivelDesempeno(input, input.dataset.materia === 'IN');
    });
    
    // Puntajes por materia - Crear array ordenado para el gráfico
    const puntajesOrdenados = [0, 0, 0, 0, 0]; // LC, MT, SC, CN, IN
    
    console.log('Materias en el reporte:', Object.keys(reporte.puntajes));
    
    Object.keys(reporte.puntajes).forEach(materia => {
        console.log(`Procesando materia: "${materia}"`);
        
        const codigoMateria = obtenerCodigoMateria(materia);
        console.log(`Código obtenido: "${codigoMateria}"`);
        
        const input = document.querySelector(`.puntaje-input[data-materia="${codigoMateria}"]`);
        
        if (input && reporte.puntajes[materia]) {
            const puntaje = reporte.puntajes[materia].puntaje;
            console.log(`Asignando puntaje ${puntaje} a ${codigoMateria}`);
            
            input.value = puntaje;
            
            // Actualizar nivel visual
            actualizarNivelVisual(input);
            actualizarRangoActivo(input);
            actualizarNivelDesempeno(input, codigoMateria === 'IN');
            
            // Agregar al array ordenado para el gráfico
            const indice = ordenMaterias.indexOf(codigoMateria);
            if (indice !== -1) {
                puntajesOrdenados[indice] = puntaje;
            }
        } else {
            console.warn(`No se encontró input para materia: ${materia} (código: ${codigoMateria})`);
        }
    });
    
    console.log('Puntajes ordenados para gráfico:', puntajesOrdenados);
    
    // Actualizar gráfico
    graficoBarras.data.datasets[0].data = puntajesOrdenados;
    graficoBarras.update('active');
}

// Obtener código de materia
function obtenerCodigoMateria(materia) {
    const materiaLower = materia.toLowerCase().trim();
    
    // Primero intentar mapeo directo
    if (mapeoMaterias[materiaLower]) {
        return mapeoMaterias[materiaLower];
    }
    
    // Mapeo específico para casos conocidos de Firebase
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
    
    // Mapeo por palabras clave
    if (materiaLower.includes('lectura') || materiaLower.includes('critica')) {
        return 'LC';
    }
    if (materiaLower.includes('matematica')) {
        return 'MT';
    }
    if (materiaLower.includes('social')) {
        return 'SC';
    }
    if (materiaLower.includes('ciencia') && !materiaLower.includes('social')) {
        return 'CN';
    }
    if (materiaLower.includes('ingles') || materiaLower.includes('english')) {
        return 'IN';
    }
    
    // Fallback - devolver el código tal como viene
    console.warn(`No se pudo mapear la materia: "${materia}"`);
    return materia.toUpperCase();
}

// Actualizar nivel visual
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

// Actualizar rango activo
function actualizarRangoActivo(input) {
    const valor = parseInt(input.value) || 0;
    const fila = input.closest('tr');
    const columna = Array.from(fila.cells).indexOf(input.closest('td'));
    const tabla = input.closest('table');
    const rangos = Array.from(tabla.querySelectorAll('.fila-nivel')).slice(0, 4);

    // Remover clase activo de todos los rangos en esta columna
    rangos.forEach(fila => {
        const celda = fila.cells[columna];
        celda.querySelector('.rango')?.classList.remove('activo');
    });

    // Añadir clase activo al rango correspondiente
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

// Actualizar nivel de desempeño
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

// Actualizar información del panel
function actualizarInfoPanel(reporte) {
    const infoPanel = document.getElementById('infoReporte');
    
    let infoHTML = `
        <h4>Información del Reporte</h4>
        <p><strong>Prueba:</strong> ${reporte.pruebaNombre}</p>
        <p><strong>Puntaje Global:</strong> ${reporte.puntajeGlobal}</p>
        <p><strong>Percentil:</strong> ${reporte.percentilGeneral}%</p>
        <p><strong>Fecha de Prueba:</strong> ${reporte.fechaPrueba?.toDate?.()?.toLocaleDateString() || 'Sin fecha'}</p>
        <p><strong>Generado:</strong> ${reporte.fechaGeneracion?.toDate?.()?.toLocaleDateString() || 'Sin fecha'}</p>
        
        <h5>Puntajes por Materia:</h5>
    `;
    
    Object.keys(reporte.puntajes).forEach(materia => {
        const datos = reporte.puntajes[materia];
        infoHTML += `<p><strong>${materia}:</strong> ${datos.puntaje}% (${datos.correctas}/${datos.total})</p>`;
    });
    
    infoPanel.innerHTML = infoHTML;
}

// Descargar reporte específico
async function descargarReporte(reporteId) {
    await verReporte(reporteId);
    setTimeout(() => {
        descargarPDF();
    }, 500);
}

// Función para descargar el reporte como PDF
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

    // Configuración para html2pdf - Exactamente igual que en reportes.js del admin
    const opciones = {
        margin: [15, 12, 15, 12], // Márgenes más amplios: [arriba, derecha, abajo, izquierda]
        filename: nombreArchivo,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 1.3, // Escala ajustada para mejor calidad y ajuste
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: 770, // Ancho reducido para dar más margen
            height: 1300 // Alto ajustado para legal con márgenes
        },
        jsPDF: {
            unit: 'mm',
            format: 'legal', // Tamaño legal (oficio)
            orientation: 'portrait'
        }
    };

    try {
        // Obtener el elemento del documento
        const elemento = document.getElementById('documento');

        // Guardar posición de scroll actual
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;

        // Scroll al inicio del documento para asegurar captura completa
        window.scrollTo(0, 0);

        // Aplicar estilos temporales para optimizar el PDF
        const estilosOriginales = elemento.style.cssText;
        const bodyOriginal = document.body.style.cssText;
        
        // Configurar elemento para PDF
        elemento.style.width = '770px';
        elemento.style.height = 'auto'; // Cambiar a auto para capturar todo el contenido
        elemento.style.minHeight = '1300px';
        elemento.style.margin = '0';
        elemento.style.padding = '12px 10px';
        elemento.style.boxSizing = 'border-box';
        elemento.style.position = 'relative';
        elemento.style.top = '0';
        elemento.style.left = '0';
        
        // Configurar body para evitar problemas de scroll
        document.body.style.overflow = 'visible';
        document.body.style.height = 'auto';

        // Mostrar loading
        Swal.fire({
            title: 'Generando PDF...',
            text: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Esperar un momento para que se apliquen los estilos
        await new Promise(resolve => setTimeout(resolve, 500));

        // Generar y descargar el PDF
        await html2pdf().set(opciones).from(elemento).save();

        // Restaurar estilos originales
        elemento.style.cssText = estilosOriginales;
        document.body.style.cssText = bodyOriginal;
        
        // Restaurar posición de scroll
        window.scrollTo(0, scrollPosition);
        
        Swal.close();
        
        Swal.fire({
            icon: 'success',
            title: '¡Descarga exitosa!',
            text: 'El reporte se ha descargado correctamente'
        });

        console.log('PDF descargado exitosamente');

    } catch (error) {
        console.error('Error al generar PDF:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al generar el PDF: ' + error.message
        });
    }
}

// Función para formatear el nombre
function formatearNombrePDF(nombre) {
    return nombre.split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
        .join('_');
}