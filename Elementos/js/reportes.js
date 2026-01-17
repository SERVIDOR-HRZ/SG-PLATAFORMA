// Configuración inicial del gráfico
let graficoBarras;

// Colores para cada materia
const coloresMateria = {
    'LC': '#FF4D4D',
    'MT': '#33CCFF',
    'SC': '#FF8C00',
    'CN': '#33FF77',
    'IN': '#B366FF'
};

// Función para animar números
function animarNumero(elemento, inicio, fin, duracion) {
    const rango = fin - inicio;
    const incremento = rango / (duracion / 16);
    let actual = inicio;

    const actualizar = () => {
        actual += incremento;
        if ((incremento > 0 && actual >= fin) || (incremento < 0 && actual <= fin)) {
            elemento.textContent = Math.round(fin);
            return;
        }
        elemento.textContent = Math.round(actual);
        requestAnimationFrame(actualizar);
    };

    requestAnimationFrame(actualizar);
}

// Función para convertir puntaje de 0-100 a 0-500
function convertirA500(puntaje) {
    return Math.round((puntaje * 5));
}

// Función para convertir puntaje de 0-500 a 0-100
function convertirA100(puntaje) {
    return Math.round((puntaje / 5));
}

// Función para calcular puntaje global
function calcularPuntajeGlobal() {
    const puntajes = Array.from(document.querySelectorAll('.puntaje-input')).map(input => parseInt(input.value) || 0);

    // Multiplicar cada puntaje por su ponderación
    const ponderaciones = [3, 3, 3, 3, 1]; // LC, MT, SC, CN, IN
    const puntajesPonderados = puntajes.map((puntaje, index) => puntaje * ponderaciones[index]);

    // Sumar todos los puntajes ponderados
    const sumaPonderada = puntajesPonderados.reduce((a, b) => a + b, 0);

    // Dividir por la suma de ponderaciones (13) y multiplicar por 5
    const puntajeGlobal = Math.round((sumaPonderada / 13) * 5);

    return puntajeGlobal;
}

// Función para actualizar el puntaje global
function actualizarPuntajeGlobal() {
    const puntajeGlobal = calcularPuntajeGlobal();
    const elementoPuntaje = document.getElementById('puntajeGlobal');
    elementoPuntaje.textContent = puntajeGlobal;
}

// Función para actualizar el rango activo
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

// Función para actualizar el gráfico
function actualizarGrafico() {
    const datos = Array.from(document.querySelectorAll('.puntaje-input')).map(input => ({
        materia: input.dataset.materia,
        puntaje: parseInt(input.value) || 0
    }));

    graficoBarras.data.datasets[0].data = datos.map(d => d.puntaje);
    graficoBarras.update('active');
    actualizarPuntajeGlobal();
}

// Función para inicializar el gráfico
function inicializarGrafico() {
    const ctx = document.getElementById('graficoBarras').getContext('2d');
    const materias = ['Lectura Crítica', 'Matemáticas', 'Ciencias Sociales', 'Ciencias Naturales', 'Inglés'];
    const puntajes = Array.from(document.querySelectorAll('.puntaje-input')).map(input => parseInt(input.value) || 0);
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
                duration: 0 // Eliminar la animación
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

// Función para calcular percentil general
function calcularPercentilGeneral() {
    const puntajes = Array.from(document.querySelectorAll('.puntaje-input')).map(input => parseInt(input.value) || 0);
    const puntajePromedio = puntajes.reduce((a, b) => a + b, 0) / puntajes.length;

    if (puntajePromedio >= 80) return 100;
    if (puntajePromedio >= 60) return 93;
    if (puntajePromedio >= 40) return 75;
    return 50;
}

// Función para actualizar percentil general
function actualizarPercentilGeneral() {
    const percentil = calcularPercentilGeneral();
    document.getElementById('percentilGeneral').textContent = percentil;
}

// Función para calcular nivel de desempeño
function calcularNivelDesempeno(puntaje, esIngles = false) {
    if (esIngles) {
        if (puntaje >= 80) return 'B+';
        if (puntaje >= 60) return 'B1';
        if (puntaje >= 40) return 'A2';
        return 'A- / A1';
    }
    if (puntaje <= 39) return '1';
    if (puntaje <= 59) return '2';
    if (puntaje <= 79) return '3';
    return '4';
}

// Función para actualizar percentiles y niveles
function actualizarPercentilYNivel(input) {
    const fila = input.closest('tr');
    const columna = Array.from(fila.cells).indexOf(input.closest('td'));
    const tabla = input.closest('table');
    const valor = parseInt(input.value) || 0;
    const esIngles = columna === 5; // Corregido de 6 a 5 ya que es la quinta columna (índice 5)

    // Actualizar percentil general
    actualizarPercentilGeneral();

    // Actualizar nivel de desempeño
    const filaNivel = tabla.querySelector('.fila-desempeno');
    if (filaNivel) {
        const celdaNivel = filaNivel.cells[columna];
        if (celdaNivel) {
            celdaNivel.textContent = calcularNivelDesempeno(valor, esIngles);
        }
    }
}

// Función para actualizar el color según el nivel
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

// Función para formatear el nombre con iniciales en mayúsculas
function formatearNombrePDF(nombre) {
    return nombre.split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
        .join(' ');
}

// Función para validar las secciones del estudiante
function validarSeccionesEstudiante() {
    const puntajes = {
        'LC': parseInt(document.querySelector('.puntaje-input[data-materia="LC"]').value) || 0,
        'MT': parseInt(document.querySelector('.puntaje-input[data-materia="MT"]').value) || 0,
        'SC': parseInt(document.querySelector('.puntaje-input[data-materia="SC"]').value) || 0,
        'CN': parseInt(document.querySelector('.puntaje-input[data-materia="CN"]').value) || 0,
        'IN': parseInt(document.querySelector('.puntaje-input[data-materia="IN"]').value) || 0
    };

    // Verificar si falta inglés (sección 2)
    if (puntajes.IN === 0) {
        mostrarAlerta(
            'Sección Faltante',
            'Este estudiante no tiene la sección 2 (Inglés) registrada. No se puede generar el informe.',
            'error'
        );
        return false;
    }

    // Verificar si faltan otras materias (sección 1)
    const materiasIncompletas = ['LC', 'MT', 'SC', 'CN'].filter(materia => puntajes[materia] === 0);
    if (materiasIncompletas.length > 0) {
        mostrarAlerta(
            'Sección Faltante',
            'Este estudiante no tiene la sección 1 completa. No se puede generar el informe.',
            'error'
        );
        return false;
    }

    return true;
}

// Función para mostrar información del estudiante seleccionado y generar reporte automáticamente
async function mostrarInfoEstudiante() {
    const pruebaId = document.getElementById('selectorPrueba').value;
    const estudianteId = document.getElementById('selectorEstudiante').value;

    if (!pruebaId || !estudianteId) {
        document.getElementById('btnDescargarPDF').disabled = true;
        return;
    }

    // Mostrar overlay de carga
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }

    try {
        const db = window.firebaseDB;

        // Verificar si ya existe un reporte generado
        const reporteExistente = await buscarReporteExistente(pruebaId, estudianteId);
        
        if (reporteExistente) {
            // Cargar el reporte existente
            await cargarReporteExistente(reporteExistente);
            
            // Mostrar información en ventana emergente
            Swal.fire({
                icon: 'info',
                title: 'Reporte Existente',
                html: `
                    <p><strong>Estudiante:</strong> ${reporteExistente.estudianteNombre}</p>
                    <p><strong>Generado:</strong> ${reporteExistente.fechaGeneracion?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                    <p><strong>Puntaje Global:</strong> ${reporteExistente.puntajeGlobal}</p>
                    ${reporteExistente.datosEstudiante?.sg11Numero ? `<p><strong>Código SG11:</strong> SG11-${reporteExistente.datosEstudiante.sg11Numero}</p>` : ''}
                `,
                confirmButtonColor: '#667eea',
                confirmButtonText: 'Entendido'
            });
        } else {
            // Pedir código SG11 antes de generar
            const { value: sg11Codigo } = await Swal.fire({
                title: 'Código SG11',
                html: `
                    <p style="margin-bottom: 1rem;">Ingrese el código SG11 para este estudiante:</p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                        <span style="font-weight: bold; font-size: 1.2rem;">SG11-</span>
                        <input id="swal-sg11-input" class="swal2-input" maxlength="4" placeholder="####" style="width: 120px; text-align: center; font-size: 1.2rem; margin: 0;">
                    </div>
                `,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#667eea',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Generar Reporte',
                cancelButtonText: 'Cancelar',
                preConfirm: () => {
                    const input = document.getElementById('swal-sg11-input');
                    const valor = input.value.trim();
                    if (!valor) {
                        Swal.showValidationMessage('Debe ingresar un código SG11');
                        return false;
                    }
                    return valor;
                },
                didOpen: () => {
                    document.getElementById('swal-sg11-input').focus();
                }
            });
            
            if (!sg11Codigo) {
                // Usuario canceló
                if (loadingOverlay) {
                    loadingOverlay.style.display = 'none';
                }
                return;
            }
            
            // Generar nuevo reporte con el código SG11
            await generarReporteAutomatico(pruebaId, estudianteId, sg11Codigo);
            
            // Mostrar confirmación
            Swal.fire({
                icon: 'success',
                title: 'Reporte Generado',
                html: `
                    <p>El reporte se generó exitosamente</p>
                    <p><strong>Código SG11:</strong> SG11-${sg11Codigo}</p>
                `,
                confirmButtonColor: '#667eea',
                timer: 3000
            });
        }

        document.getElementById('btnDescargarPDF').disabled = false;
        document.getElementById('btnGuardarCambios').disabled = false;
        document.getElementById('btnEliminarReporteActual').disabled = false;

    } catch (error) {
        console.error('Error cargando información del estudiante:', error);
        
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la información del estudiante'
        });
    } finally {
        // Ocultar overlay de carga
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// Función para buscar un reporte existente
async function buscarReporteExistente(pruebaId, estudianteId) {
    try {
        const db = window.firebaseDB;
        const reportesSnapshot = await db.collection('reportes')
            .where('pruebaId', '==', pruebaId)
            .where('estudianteId', '==', estudianteId)
            .orderBy('fechaGeneracion', 'desc')
            .limit(1)
            .get();
        
        if (!reportesSnapshot.empty) {
            return reportesSnapshot.docs[0].data();
        }
        return null;
    } catch (error) {
        console.error('Error buscando reporte existente:', error);
        return null;
    }
}

// Función para cargar un reporte existente
async function cargarReporteExistente(reporteData) {
    try {
        // Llenar datos del estudiante
        const datosEstudiante = reporteData.datosEstudiante;
        document.getElementById('nombreEstudiante').value = datosEstudiante.nombre?.toUpperCase() || 'USUARIO';
        document.getElementById('identificacionEstudiante').value = datosEstudiante.numeroDocumento || '';
        document.getElementById('telefonoEstudiante').value = datosEstudiante.telefono || '';
        document.getElementById('municipioEstudiante').value = datosEstudiante.departamento || '';
        document.getElementById('tipoDocumento').value = datosEstudiante.tipoDocumento || 'CC';
        document.getElementById('calEstudiante').value = datosEstudiante.grado || 'ESTUDIANTE';
        
        // Llenar fecha
        if (reporteData.fechaPrueba) {
            const fecha = reporteData.fechaPrueba.toDate();
            document.getElementById('fechaAplicacion').value = fecha.toISOString().split('T')[0];
        }
        
        // Llenar campo SG11
        if (datosEstudiante.sg11Numero) {
            document.getElementById('sg11Numero').value = datosEstudiante.sg11Numero;
        }
        
        // Llenar puntajes
        const puntajes = reporteData.puntajes;
        Object.keys(puntajes).forEach(materia => {
            const codigoMateria = obtenerCodigoMateria(materia);
            const input = document.querySelector(`.puntaje-input[data-materia="${codigoMateria}"]`);
            if (input && puntajes[materia]) {
                input.value = puntajes[materia].puntaje;
                actualizarRangoActivo(input);
                actualizarNivelVisual(input);
                actualizarPercentilYNivel(input);
            }
        });
        
        // Actualizar gráfico y puntaje global
        actualizarGrafico();
        document.getElementById('puntajeGlobal').textContent = reporteData.puntajeGlobal;
        document.getElementById('percentilGeneral').textContent = reporteData.percentilGeneral || 0;
        
    } catch (error) {
        console.error('Error cargando reporte existente:', error);
        throw error;
    }
}

// Función para generar reportes para todos los estudiantes de una prueba
async function generarReportesParaTodos() {
    const pruebaId = document.getElementById('selectorPrueba').value;
    
    if (!pruebaId) {
        Swal.fire({
            icon: 'warning',
            title: 'Seleccione una prueba',
            text: 'Debe seleccionar una prueba primero'
        });
        return;
    }
    
    // Pedir el código SG11 antes de generar
    const { value: sg11Codigo } = await Swal.fire({
        title: 'Código SG11',
        html: `
            <p style="margin-bottom: 1rem;">Ingrese el código SG11 para esta prueba:</p>
            <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <span style="font-weight: bold; font-size: 1.2rem;">SG11-</span>
                <input id="swal-sg11-input" class="swal2-input" maxlength="4" placeholder="####" style="width: 120px; text-align: center; font-size: 1.2rem; margin: 0;">
            </div>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">Este código se aplicará a todos los reportes generados</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const input = document.getElementById('swal-sg11-input');
            const valor = input.value.trim();
            if (!valor) {
                Swal.showValidationMessage('Debe ingresar un código SG11');
                return false;
            }
            return valor;
        },
        didOpen: () => {
            // Enfocar el input al abrir
            document.getElementById('swal-sg11-input').focus();
        }
    });
    
    if (!sg11Codigo) return;
    
    // Confirmar acción
    const confirmacion = await Swal.fire({
        title: '¿Generar reportes para todos?',
        html: `
            <p>Se generarán reportes para todos los estudiantes que tomaron esta prueba</p>
            <p style="margin-top: 1rem;"><strong>Código SG11:</strong> SG11-${sg11Codigo}</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#667eea',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, generar',
        cancelButtonText: 'Cancelar'
    });
    
    if (!confirmacion.isConfirmed) return;
    
    try {
        const db = window.firebaseDB;
        
        // Obtener todos los estudiantes que tomaron la prueba
        const respuestasSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .get();
        
        const estudiantesMap = new Map();
        respuestasSnapshot.forEach(doc => {
            const respuesta = doc.data();
            estudiantesMap.set(respuesta.estudianteId, respuesta.estudianteNombre);
        });
        
        const totalEstudiantes = estudiantesMap.size;
        
        if (totalEstudiantes === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin estudiantes',
                text: 'No hay estudiantes que hayan tomado esta prueba'
            });
            return;
        }
        
        // Mostrar ventana de progreso
        let progresoSwal;
        Swal.fire({
            title: 'Generando Reportes',
            html: `
                <div style="margin: 20px 0;">
                    <div style="background: #f0f0f0; border-radius: 10px; overflow: hidden; height: 30px;">
                        <div id="swal-progress-bar" style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: 0%; transition: width 0.3s;"></div>
                    </div>
                    <p id="swal-progress-text" style="margin-top: 15px; font-size: 1.1rem;">0 de ${totalEstudiantes} reportes generados</p>
                </div>
            `,
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        let procesados = 0;
        let exitosos = 0;
        let errores = 0;
        
        // Procesar cada estudiante
        for (const [estudianteId, estudianteNombre] of estudiantesMap) {
            try {
                // Verificar si ya existe el reporte
                const reporteExistente = await buscarReporteExistente(pruebaId, estudianteId);
                
                if (!reporteExistente) {
                    // Generar nuevo reporte con el código SG11
                    await generarReporteAutomatico(pruebaId, estudianteId, sg11Codigo);
                    exitosos++;
                } else {
                    console.log(`Reporte ya existe para ${estudianteNombre}`);
                    exitosos++;
                }
                
            } catch (error) {
                console.error(`Error generando reporte para ${estudianteNombre}:`, error);
                errores++;
            }
            
            procesados++;
            const porcentaje = Math.round((procesados / totalEstudiantes) * 100);
            
            // Actualizar barra de progreso en la ventana emergente
            const progressBar = document.getElementById('swal-progress-bar');
            const progressText = document.getElementById('swal-progress-text');
            if (progressBar) progressBar.style.width = `${porcentaje}%`;
            if (progressText) progressText.textContent = `${procesados} de ${totalEstudiantes} reportes procesados`;
        }
        
        // Cerrar ventana de progreso y mostrar resultado
        Swal.close();
        
        // Mostrar resultado
        Swal.fire({
            icon: exitosos > 0 ? 'success' : 'error',
            title: 'Proceso completado',
            html: `
                <p><strong>Total procesados:</strong> ${procesados}</p>
                <p><strong>Exitosos:</strong> ${exitosos}</p>
                <p><strong>Errores:</strong> ${errores}</p>
            `
        });
        
        // Recargar lista de estudiantes
        await cargarEstudiantesPorPrueba();
        
    } catch (error) {
        console.error('Error generando reportes masivos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al generar los reportes'
        });
    }
}

// Función para eliminar el reporte actual (del estudiante seleccionado)
async function eliminarReporteActual() {
    const pruebaId = document.getElementById('selectorPrueba').value;
    const estudianteId = document.getElementById('selectorEstudiante').value;
    
    if (!pruebaId || !estudianteId) {
        Swal.fire({
            icon: 'warning',
            title: 'Seleccione un reporte',
            text: 'Debe seleccionar una prueba y un estudiante primero'
        });
        return;
    }
    
    // Confirmar eliminación
    const confirmacion = await Swal.fire({
        title: '¿Eliminar este reporte?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });
    
    if (!confirmacion.isConfirmed) return;
    
    try {
        const db = window.firebaseDB;
        
        // Buscar el reporte
        const reportesSnapshot = await db.collection('reportes')
            .where('pruebaId', '==', pruebaId)
            .where('estudianteId', '==', estudianteId)
            .get();
        
        if (reportesSnapshot.empty) {
            Swal.fire({
                icon: 'info',
                title: 'No hay reporte',
                text: 'No se encontró un reporte para este estudiante'
            });
            return;
        }
        
        // Eliminar todos los reportes encontrados
        const batch = db.batch();
        reportesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        Swal.fire({
            icon: 'success',
            title: 'Reporte eliminado',
            text: 'El reporte se eliminó correctamente',
            timer: 2000,
            showConfirmButton: false
        });
        
        // Limpiar el formulario
        limpiarReporte();
        
    } catch (error) {
        console.error('Error eliminando reporte:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el reporte'
        });
    }
}

// Función para eliminar todos los reportes de una prueba
async function eliminarReportesPrueba() {
    const pruebaId = document.getElementById('selectorPrueba').value;
    
    if (!pruebaId) {
        Swal.fire({
            icon: 'warning',
            title: 'Seleccione una prueba',
            text: 'Debe seleccionar una prueba primero'
        });
        return;
    }
    
    try {
        const db = window.firebaseDB;
        
        // Contar reportes
        const reportesSnapshot = await db.collection('reportes')
            .where('pruebaId', '==', pruebaId)
            .get();
        
        const totalReportes = reportesSnapshot.size;
        
        if (totalReportes === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin reportes',
                text: 'No hay reportes para esta prueba'
            });
            return;
        }
        
        // Confirmar eliminación
        const confirmacion = await Swal.fire({
            title: '¿Eliminar todos los reportes?',
            html: `
                <p>Se eliminarán <strong>${totalReportes}</strong> reportes de esta prueba.</p>
                <p style="color: #dc3545; font-weight: 600;">Esta acción no se puede deshacer.</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Sí, eliminar todos',
            cancelButtonText: 'Cancelar',
            input: 'checkbox',
            inputPlaceholder: 'Confirmo que quiero eliminar todos los reportes',
            inputValidator: (result) => {
                return !result && 'Debes confirmar la eliminación'
            }
        });
        
        if (!confirmacion.isConfirmed) return;
        
        // Mostrar progreso con SweetAlert2
        Swal.fire({
            title: 'Eliminando reportes...',
            html: 'Por favor espere',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Eliminar en lotes de 500 (límite de Firestore)
        const batchSize = 500;
        let eliminados = 0;
        
        while (eliminados < totalReportes) {
            const batch = db.batch();
            const snapshot = await db.collection('reportes')
                .where('pruebaId', '==', pruebaId)
                .limit(batchSize)
                .get();
            
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            eliminados += snapshot.size;
            
            // Actualizar mensaje de progreso
            Swal.update({
                html: `Eliminados ${eliminados} de ${totalReportes} reportes...`
            });
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Reportes eliminados',
            text: `Se eliminaron ${eliminados} reportes correctamente`
        });
        
        // Limpiar el formulario
        limpiarReporte();
        
    } catch (error) {
        console.error('Error eliminando reportes:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al eliminar los reportes'
        });
    }
}

// Tablas de porcentajes por errores según el README
const tablasPorcentajes = {
    'LC': [100, 80, 78, 75, 72, 69, 66, 63, 60, 57, 54, 51, 49, 46, 43, 40, 37, 34, 31, 29, 26, 23, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'MT': [100, 82, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'SC': [100, 82, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'CN': [100, 81, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'IN': [100, 83, 80, 77, 76, 73, 69, 64, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
};

// Mapeo de materias
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

// Función para obtener el código de materia
function obtenerCodigoMateria(materia) {
    const materiaLower = materia.toLowerCase();
    const codigo = mapeoMaterias[materiaLower];
    console.log(`Mapeando materia: "${materia}" -> "${codigo}"`);
    return codigo || materia.toUpperCase();
}

// Función para calcular puntaje por materia usando las tablas
function calcularPuntajeMateria(correctas, total, materia) {
    const errores = total - correctas;
    const codigoMateria = obtenerCodigoMateria(materia);
    const tabla = tablasPorcentajes[codigoMateria];

    console.log(`Calculando puntaje para ${materia}: ${correctas}/${total} correctas, ${errores} errores`);

    if (!tabla) {
        console.warn(`No se encontró tabla para la materia: ${materia}`);
        return Math.round((correctas / total) * 100);
    }

    // Para casos con muy pocas preguntas (especialmente inglés), usar porcentaje directo
    if (total <= 2) {
        const porcentajeDirecto = Math.round((correctas / total) * 100);
        console.log(`  Pocas preguntas (${total}), usando porcentaje directo: ${porcentajeDirecto}%`);
        return porcentajeDirecto;
    }

    // Para casos con más preguntas, usar las tablas de porcentajes por errores
    const puntajeTabla = tabla[Math.min(errores, tabla.length - 1)];
    console.log(`  Tabla[${errores}] = ${puntajeTabla}%`);

    return puntajeTabla; // Retornar directamente el valor de la tabla
}

// Función para cargar pruebas disponibles
async function cargarPruebas() {
    try {
        if (!window.firebaseDB) {
            await new Promise(resolve => {
                const checkDB = () => {
                    if (window.firebaseDB) resolve();
                    else setTimeout(checkDB, 100);
                };
                checkDB();
            });
        }

        const db = window.firebaseDB;
        const pruebasSnapshot = await db.collection('pruebas').get();
        const selectorPrueba = document.getElementById('selectorPrueba');

        selectorPrueba.innerHTML = '<option value="">Seleccione una prueba</option>';

        pruebasSnapshot.forEach(doc => {
            const prueba = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${prueba.nombre} - ${prueba.fechaCreacion?.toDate?.()?.toLocaleDateString() || 'Sin fecha'}`;
            selectorPrueba.appendChild(option);
        });

        selectorPrueba.addEventListener('change', cargarEstudiantesPorPrueba);

    } catch (error) {
        console.error('Error cargando pruebas:', error);
        document.getElementById('selectorPrueba').innerHTML = '<option value="">Error cargando pruebas</option>';
    }
}

// Función para cargar estudiantes que han tomado una prueba específica
async function cargarEstudiantesPorPrueba() {
    const pruebaId = document.getElementById('selectorPrueba').value;
    const selectorEstudiante = document.getElementById('selectorEstudiante');
    const btnGenerarTodos = document.getElementById('btnGenerarTodos');

    if (!pruebaId) {
        selectorEstudiante.innerHTML = '<option value="">Primero seleccione una prueba</option>';
        selectorEstudiante.disabled = true;
        btnGenerarTodos.disabled = true;
        return;
    }

    try {
        const db = window.firebaseDB;
        const respuestasSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .get();

        const estudiantesMap = new Map();

        respuestasSnapshot.forEach(doc => {
            const respuesta = doc.data();
            const estudianteId = respuesta.estudianteId;
            const estudianteNombre = respuesta.estudianteNombre;

            if (!estudiantesMap.has(estudianteId)) {
                estudiantesMap.set(estudianteId, {
                    id: estudianteId,
                    nombre: estudianteNombre,
                    bloques: []
                });
            }

            estudiantesMap.get(estudianteId).bloques.push(respuesta.bloque);
        });

        selectorEstudiante.innerHTML = '<option value="">Seleccione un estudiante</option>';

        estudiantesMap.forEach((estudiante, id) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = `${estudiante.nombre} (Bloques: ${estudiante.bloques.sort().join(', ')})`;
            selectorEstudiante.appendChild(option);
        });

        selectorEstudiante.disabled = false;
        btnGenerarTodos.disabled = estudiantesMap.size === 0;
        
        // Habilitar botón de eliminar reportes de prueba si hay estudiantes
        const btnEliminarReportesPrueba = document.getElementById('btnEliminarReportesPrueba');
        if (btnEliminarReportesPrueba) {
            btnEliminarReportesPrueba.disabled = estudiantesMap.size === 0;
        }
        
        selectorEstudiante.addEventListener('change', mostrarInfoEstudiante);

    } catch (error) {
        console.error('Error cargando estudiantes:', error);
        selectorEstudiante.innerHTML = '<option value="">Error cargando estudiantes</option>';
        btnGenerarTodos.disabled = true;
    }
}

// Función para generar el reporte automáticamente (sin botón)
async function generarReporteAutomatico(pruebaId, estudianteId, sg11Codigo = null) {
    try {
        const db = window.firebaseDB;

        // Cargar información completa del estudiante desde la base de datos
        const estudianteSnapshot = await db.collection('usuarios')
            .where('numeroDocumento', '==', estudianteId)
            .get();

        let datosEstudiante = null;
        if (!estudianteSnapshot.empty) {
            datosEstudiante = estudianteSnapshot.docs[0].data();
        } else {
            // Intentar con otros campos de identificación
            const estudianteSnapshot2 = await db.collection('usuarios')
                .where('numeroIdentidad', '==', estudianteId)
                .get();
            if (!estudianteSnapshot2.empty) {
                datosEstudiante = estudianteSnapshot2.docs[0].data();
            }
        }

        if (!datosEstudiante) {
            throw new Error('No se encontró la información del estudiante');
        }

        // Cargar respuestas del estudiante
        const respuestasSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .where('estudianteId', '==', estudianteId)
            .get();

        // Cargar información de la prueba
        const pruebaDoc = await db.collection('pruebas').doc(pruebaId).get();
        const pruebaData = pruebaDoc.data();

        // Consolidar respuestas de todos los bloques
        const respuestasConsolidadas = {};
        let nombreEstudiante = '';

        console.log('=== CONSOLIDACIÓN DE RESPUESTAS ===');
        respuestasSnapshot.forEach(doc => {
            const respuesta = doc.data();
            nombreEstudiante = respuesta.estudianteNombre;

            console.log(`Procesando bloque ${respuesta.bloque}:`);

            if (respuesta.respuestasEvaluadas) {
                Object.keys(respuesta.respuestasEvaluadas).forEach(materia => {
                    if (!respuestasConsolidadas[materia]) {
                        respuestasConsolidadas[materia] = {};
                    }

                    const respuestasMateria = respuesta.respuestasEvaluadas[materia];
                    const totalPreguntas = Object.keys(respuestasMateria).length;
                    const correctas = Object.values(respuestasMateria).filter(r => r.esCorrecta).length;

                    console.log(`  ${materia}: ${correctas}/${totalPreguntas} (${Math.round((correctas / totalPreguntas) * 100)}%)`);

                    // Agregar todas las respuestas del bloque actual para esta materia
                    Object.keys(respuesta.respuestasEvaluadas[materia]).forEach(preguntaId => {
                        const respuestaPregunta = respuesta.respuestasEvaluadas[materia][preguntaId];

                        // Crear un ID único combinando pregunta y bloque para evitar conflictos
                        const preguntaUnicaId = `${preguntaId}_bloque${respuesta.bloque}`;
                        respuestasConsolidadas[materia][preguntaUnicaId] = respuestaPregunta;
                    });
                });
            }
        });

        console.log('=== RESULTADO FINAL ===');
        // Calcular puntajes por materia usando solo las tablas de porcentajes
        const puntajesPorMateria = {};

        Object.keys(respuestasConsolidadas).forEach(materia => {
            const respuestasMateria = respuestasConsolidadas[materia];
            const totalPreguntas = Object.keys(respuestasMateria).length;
            const respuestasCorrectas = Object.values(respuestasMateria).filter(r => r.esCorrecta).length;

            console.log(`Materia: ${materia}, Total: ${totalPreguntas}, Correctas: ${respuestasCorrectas}, Porcentaje: ${Math.round((respuestasCorrectas / totalPreguntas) * 100)}%`);

            const puntaje = calcularPuntajeMateria(respuestasCorrectas, totalPreguntas, materia);
            puntajesPorMateria[materia] = {
                correctas: respuestasCorrectas,
                total: totalPreguntas,
                puntaje: puntaje
            };

            console.log(`  Puntaje calculado: ${puntaje}`);
        });

        // Llenar el formulario con los datos completos del estudiante
        llenarDatosEstudianteCompleto(datosEstudiante, puntajesPorMateria, pruebaData.fechaCreacion?.toDate(), sg11Codigo);

        // Habilitar botón de descarga
        document.getElementById('btnDescargarPDF').disabled = false;

        // Guardar el reporte en la base de datos
        await guardarReporteEnBD(pruebaId, estudianteId, datosEstudiante, puntajesPorMateria, pruebaData);

        console.log('Reporte generado automáticamente');

    } catch (error) {
        console.error('Error generando reporte:', error);
        throw error;
    }
}

// Función para generar el reporte manualmente (mantener por compatibilidad)
async function generarReporte() {
    const pruebaId = document.getElementById('selectorPrueba').value;
    const estudianteId = document.getElementById('selectorEstudiante').value;

    if (!pruebaId || !estudianteId) {
        Swal.fire({
            icon: 'warning',
            title: 'Datos incompletos',
            text: 'Seleccione una prueba y un estudiante'
        });
        return;
    }

    await generarReporteAutomatico(pruebaId, estudianteId);
}

// Función para guardar el reporte generado en la base de datos
async function guardarReporteEnBD(pruebaId, estudianteId, datosEstudiante, puntajesPorMateria, pruebaData) {
    try {
        const db = window.firebaseDB;
        
        // Calcular puntaje global
        const puntajes = Object.values(puntajesPorMateria).map(p => p.puntaje);
        const ponderaciones = [3, 3, 3, 3, 1]; // LC, MT, SC, CN, IN
        const puntajesPonderados = puntajes.map((puntaje, index) => puntaje * ponderaciones[index]);
        const sumaPonderada = puntajesPonderados.reduce((a, b) => a + b, 0);
        const puntajeGlobal = Math.round((sumaPonderada / 13) * 5);
        
        // Obtener el valor del campo SG11
        const sg11Numero = document.getElementById('sg11Numero')?.value || '';
        
        // Preparar datos del reporte
        const reporteData = {
            pruebaId: pruebaId,
            estudianteId: estudianteId,
            estudianteNombre: datosEstudiante.nombre,
            pruebaNombre: pruebaData.nombre,
            fechaGeneracion: new Date(),
            fechaPrueba: pruebaData.fechaCreacion,
            datosEstudiante: {
                nombre: datosEstudiante.nombre,
                numeroDocumento: datosEstudiante.numeroDocumento || datosEstudiante.numeroIdentidad,
                tipoDocumento: datosEstudiante.tipoDocumento || 'CC',
                telefono: datosEstudiante.telefono || '',
                departamento: datosEstudiante.departamento || '',
                grado: datosEstudiante.grado || 'ESTUDIANTE',
                sg11Numero: sg11Numero
            },
            puntajes: puntajesPorMateria,
            puntajeGlobal: puntajeGlobal,
            percentilGeneral: calcularPercentilGeneral(),
            estado: 'generado'
        };
        
        // Crear ID único para el reporte
        const reporteId = `${pruebaId}_${estudianteId}_${Date.now()}`;
        
        // Guardar en la colección 'reportes'
        await db.collection('reportes').doc(reporteId).set(reporteData);
        
        console.log('Reporte guardado en BD:', reporteId);
        
    } catch (error) {
        console.error('Error guardando reporte en BD:', error);
        // No lanzar error para no interrumpir la generación del reporte
    }
}

// Función para llenar los datos completos del estudiante en el formulario
function llenarDatosEstudianteCompleto(datosEstudiante, puntajesPorMateria, fechaPrueba, sg11Codigo = null) {
    // Llenar nombre
    document.getElementById('nombreEstudiante').value = datosEstudiante.nombre?.toUpperCase() || 'USUARIO';
    document.getElementById('identificacionEstudiante').value = datosEstudiante.numeroDocumento || datosEstudiante.numeroIdentidad || '';

    // Llenar teléfono
    document.getElementById('telefonoEstudiante').value = datosEstudiante.telefono || '';

    // Llenar departamento
    const selectDepartamento = document.getElementById('municipioEstudiante');
    if (datosEstudiante.departamento) {
        selectDepartamento.value = datosEstudiante.departamento;
    }

    // Llenar tipo de documento
    const selectTipoDocumento = document.getElementById('tipoDocumento');
    if (datosEstudiante.tipoDocumento) {
        selectTipoDocumento.value = datosEstudiante.tipoDocumento;
    }

    // Llenar tipo de prueba (grado)
    const selectTipoPrueba = document.getElementById('calEstudiante');
    if (datosEstudiante.grado) {
        // Mapear el grado a las opciones del select
        const mapeoGrado = {
            'PRESABER': 'PRESABER',
            'REPITENTE': 'INDIV/REP',
            'VALIDANTE': 'VALIDANTE',
            'SABER11': 'ESTUDIANTE'
        };
        selectTipoPrueba.value = mapeoGrado[datosEstudiante.grado] || 'ESTUDIANTE';
    }

    // Llenar fecha de la prueba
    if (fechaPrueba) {
        const fechaFormateada = fechaPrueba.toISOString().split('T')[0];
        document.getElementById('fechaAplicacion').value = fechaFormateada;
    }
    
    // Llenar código SG11 si se proporcionó
    if (sg11Codigo) {
        document.getElementById('sg11Numero').value = sg11Codigo;
    }

    // Llenar puntajes
    Object.keys(puntajesPorMateria).forEach(materia => {
        const codigoMateria = obtenerCodigoMateria(materia);
        const input = document.querySelector(`.puntaje-input[data-materia="${codigoMateria}"]`);

        if (input && puntajesPorMateria[materia]) {
            input.value = puntajesPorMateria[materia].puntaje;

            // Actualizar visualización
            actualizarRangoActivo(input);
            actualizarNivelVisual(input);
            actualizarPercentilYNivel(input);
        }
    });

    // Actualizar gráfico y puntaje global
    actualizarGrafico();
    actualizarPuntajeGlobal();
    actualizarPercentilGeneral();
}

// Función para limpiar el reporte
function limpiarReporte() {
    // Limpiar selectores
    document.getElementById('selectorPrueba').value = '';
    document.getElementById('selectorEstudiante').value = '';
    document.getElementById('selectorEstudiante').disabled = true;

    // Limpiar formulario
    document.getElementById('nombreEstudiante').value = 'USUARIO';
    document.getElementById('identificacionEstudiante').value = '';
    document.getElementById('telefonoEstudiante').value = '';
    document.getElementById('municipioEstudiante').value = '';
    document.getElementById('tipoDocumento').value = 'CC';
    document.getElementById('calEstudiante').value = 'ESTUDIANTE';

    // Resetear puntajes
    document.querySelectorAll('.puntaje-input').forEach(input => {
        input.value = 0;
        actualizarRangoActivo(input);
        actualizarNivelVisual(input);
    });

    // Actualizar gráfico
    actualizarGrafico();
    actualizarPuntajeGlobal();
    actualizarPercentilGeneral();

    // Deshabilitar botón de descarga
    document.getElementById('btnDescargarPDF').disabled = true;
    
    // Deshabilitar botones de eliminación
    document.getElementById('btnEliminarReporteActual').disabled = true;
    document.getElementById('btnEliminarReportesPrueba').disabled = true;
    document.getElementById('btnGenerarTodos').disabled = true;
}

// Función para descargar el reporte como PDF
async function descargarPDF() {
    const nombreEstudiante = document.getElementById('nombreEstudiante').value || 'ESTUDIANTE';
    const fechaActual = new Date().toLocaleDateString('es-CO').replace(/\//g, '-');
    const nombreArchivo = `Reporte_${formatearNombrePDF(nombreEstudiante)}_${fechaActual}.pdf`;

    // Configuración para html2pdf - Tamaño legal (oficio) con márgenes adecuados
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

        // Aplicar estilos temporales para optimizar el PDF
        const estilosOriginales = elemento.style.cssText;
        elemento.style.width = '770px'; // Ancho ajustado para los nuevos márgenes
        elemento.style.height = '1300px'; // Alto ajustado para legal con márgenes
        elemento.style.margin = '0';
        elemento.style.padding = '12px 10px'; // Padding que coincide con los estilos CSS
        elemento.style.boxSizing = 'border-box';

        // Generar y descargar el PDF
        await html2pdf().set(opciones).from(elemento).save();

        // Restaurar estilos originales
        elemento.style.cssText = estilosOriginales;

        console.log('PDF descargado exitosamente');

    } catch (error) {
        console.error('Error al generar PDF:', error);
        alert('Error al generar el PDF: ' + error.message);
    }
}

// Función para cargar el nombre del administrador actual
function cargarNombreAdministrador() {
    try {
        // Obtener el usuario actual del sessionStorage (como se usa en panel-admin.js)
        const usuarioActual = sessionStorage.getItem('currentUser');
        if (usuarioActual) {
            const datosUsuario = JSON.parse(usuarioActual);
            if (datosUsuario.nombre) {
                document.getElementById('adminName').textContent = datosUsuario.nombre.toUpperCase();
            }
        }
    } catch (error) {
        console.error('Error cargando nombre del administrador:', error);
        // Mantener el texto por defecto si hay error
    }
}

// Función para actualizar el reporte en la base de datos
async function actualizarReporteEnBD() {
    const pruebaId = document.getElementById('selectorPrueba').value;
    const estudianteId = document.getElementById('selectorEstudiante').value;
    
    if (!pruebaId || !estudianteId) {
        return;
    }
    
    try {
        const db = window.firebaseDB;
        
        // Buscar el reporte existente
        const reportesSnapshot = await db.collection('reportes')
            .where('pruebaId', '==', pruebaId)
            .where('estudianteId', '==', estudianteId)
            .orderBy('fechaGeneracion', 'desc')
            .limit(1)
            .get();
        
        if (reportesSnapshot.empty) {
            console.log('No hay reporte para actualizar');
            return;
        }
        
        const reporteDoc = reportesSnapshot.docs[0];
        const sg11Numero = document.getElementById('sg11Numero')?.value || '';
        
        // Actualizar solo el campo SG11
        await reporteDoc.ref.update({
            'datosEstudiante.sg11Numero': sg11Numero
        });
        
        console.log('Campo SG11 actualizado en BD:', sg11Numero);
        
    } catch (error) {
        console.error('Error actualizando campo SG11:', error);
    }
}

// Función para cerrar sesión
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

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Inicializar foto de perfil y menú desplegable
    if (typeof inicializarPerfilCompartido === 'function') {
        inicializarPerfilCompartido();
    }

    // Cargar nombre del administrador
    cargarNombreAdministrador();

    // Inicializar el gráfico
    inicializarGrafico();

    // Cargar pruebas disponibles
    cargarPruebas();

    // Configurar eventos de botones
    document.getElementById('btnGenerarTodos').addEventListener('click', generarReportesParaTodos);
    document.getElementById('btnDescargarPDF').addEventListener('click', descargarPDF);
    document.getElementById('btnLimpiarReporte').addEventListener('click', limpiarReporte);
    document.getElementById('btnEliminarReporteActual').addEventListener('click', eliminarReporteActual);
    document.getElementById('btnEliminarReportesPrueba').addEventListener('click', eliminarReportesPrueba);

    // Actualizar los eventos de los inputs
    document.querySelectorAll('.puntaje-input').forEach(input => {
        input.addEventListener('input', (e) => {
            let valor = parseInt(e.target.value) || 0;
            valor = Math.max(0, Math.min(100, valor));
            e.target.value = valor;

            actualizarRangoActivo(e.target);
            actualizarGrafico();
            actualizarPercentilYNivel(e.target);
            actualizarNivelVisual(e.target);
        });

        actualizarRangoActivo(input);
        actualizarNivelVisual(input);
    });

    // Inicializar percentil general
    actualizarPercentilGeneral();

    // Configurar evento para el campo SG11 - actualizar en BD cuando cambie
    const sg11Input = document.getElementById('sg11Numero');
    if (sg11Input) {
        sg11Input.addEventListener('blur', async function() {
            await actualizarReporteEnBD();
        });
        
        // También actualizar al presionar Enter
        sg11Input.addEventListener('keypress', async function(e) {
            if (e.key === 'Enter') {
                await actualizarReporteEnBD();
                Swal.fire({
                    icon: 'success',
                    title: 'Guardado',
                    text: 'Campo SG11 actualizado',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    }

    // Configurar botón de logout - Usar delegación de eventos en el contenedor
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    if (userDropdownMenu) {
        userDropdownMenu.addEventListener('click', function(e) {
            // Verificar si el click fue en el botón de logout o en alguno de sus hijos
            const logoutBtn = e.target.closest('#logoutBtnDropdown');
            if (logoutBtn) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Click en botón de logout detectado');
                handleLogout();
            }
        });
        console.log('Evento de logout configurado mediante delegación');
    } else {
        console.error('No se encontró el dropdown menu');
    }
});