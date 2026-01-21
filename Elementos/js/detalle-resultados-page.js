// Detalle de Resultados - Página Separada
// Este archivo maneja la carga y visualización de resultados en una página dedicada

// Variables globales
let datosDetalleActual = null;
let graficosMaterias = [];

// Orden fijo de materias para mantener consistencia
const ordenMateriasArray = ['LC', 'MT', 'SC', 'CN', 'IN', 'lectura', 'matematicas', 'sociales', 'ciencias', 'ingles'];

// Colores por materia
const coloresMaterias = {
    'LC': '#FF4D4D',
    'MT': '#33CCFF',
    'SC': '#FF8C00',
    'CN': '#33FF77',
    'IN': '#B366FF',
    'Lectura Crítica': '#FF4D4D',
    'Matemáticas': '#33CCFF',
    'Ciencias Sociales': '#FF8C00',
    'Ciencias Naturales': '#33FF77',
    'Inglés': '#B366FF',
    'lectura': '#FF4D4D',
    'matematicas': '#33CCFF',
    'sociales': '#FF8C00',
    'ciencias': '#33FF77',
    'ingles': '#B366FF'
};

const nombresMaterias = {
    'LC': 'Lectura Crítica',
    'MT': 'Matemáticas',
    'SC': 'Ciencias Sociales',
    'CN': 'Ciencias Naturales',
    'IN': 'Inglés',
    'Lectura Crítica': 'Lectura Crítica',
    'Matemáticas': 'Matemáticas',
    'Ciencias Sociales': 'Ciencias Sociales',
    'Ciencias Naturales': 'Ciencias Naturales',
    'Inglés': 'Inglés',
    'lectura': 'Lectura Crítica',
    'matematicas': 'Matemáticas',
    'sociales': 'Ciencias Sociales',
    'ciencias': 'Ciencias Naturales',
    'ingles': 'Inglés'
};

const iconosMaterias = {
    'LC': 'bi-book-fill',
    'MT': 'bi-calculator-fill',
    'SC': 'bi-globe-americas',
    'CN': 'bi-tree-fill',
    'IN': 'bi-translate',
    'Lectura Crítica': 'bi-book-fill',
    'Matemáticas': 'bi-calculator-fill',
    'Ciencias Sociales': 'bi-globe-americas',
    'Ciencias Naturales': 'bi-tree-fill',
    'Inglés': 'bi-translate',
    'lectura': 'bi-book-fill',
    'matematicas': 'bi-calculator-fill',
    'sociales': 'bi-globe-americas',
    'ciencias': 'bi-tree-fill',
    'naturales': 'bi-tree-fill',
    'ingles': 'bi-translate'
};

// Tablas de porcentajes por errores
const tablasPorcentajes = {
    'LC': [100, 80, 78, 75, 72, 69, 66, 63, 60, 57, 54, 51, 49, 46, 43, 40, 37, 34, 31, 29, 26, 23, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'MT': [100, 82, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'SC': [100, 82, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'CN': [100, 81, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'IN': [100, 83, 80, 77, 76, 73, 69, 64, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
};

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacion();
    cargarDatosUsuario();
    inicializarEventListeners();
    inicializarSidebar();
    inicializarReloj();
    cargarResultadosDesdeURL();
});

// Verificar autenticación
function verificarAutenticacion() {
    const usuarioActual = sessionStorage.getItem('currentUser');
    if (!usuarioActual) {
        window.location.href = '../index.html';
        return;
    }
}

// Cargar datos del usuario
async function cargarDatosUsuario() {
    const usuarioActual = sessionStorage.getItem('currentUser');
    if (usuarioActual) {
        try {
            const usuario = JSON.parse(usuarioActual);
            
            // Actualizar nombre de usuario en el sidebar
            const sidebarUserName = document.getElementById('sidebarUserName');
            if (sidebarUserName && usuario.nombre) {
                sidebarUserName.textContent = usuario.nombre.toUpperCase();
            }
            
            // Actualizar rol en el sidebar
            const sidebarUserRole = document.getElementById('sidebarUserRole');
            if (sidebarUserRole && usuario.tipoUsuario) {
                const roles = {
                    'admin': 'Administrador',
                    'coordinador': 'Coordinador',
                    'estudiante': 'Estudiante',
                    'profesor': 'Profesor'
                };
                sidebarUserRole.textContent = roles[usuario.tipoUsuario] || 'Usuario';
            }
            
            // Cargar foto de perfil
            await cargarFotoPerfil(usuario.id);
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
        }
    }
}

// Cargar foto de perfil
async function cargarFotoPerfil(usuarioId) {
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioId).get();
        
        if (usuarioDoc.exists) {
            const datosUsuario = usuarioDoc.data();
            if (datosUsuario.fotoPerfil) {
                mostrarFotoPerfil(datosUsuario.fotoPerfil);
            }
        }
    } catch (error) {
        console.error('Error al cargar foto de perfil:', error);
    }
}

// Mostrar foto de perfil
function mostrarFotoPerfil(urlFoto) {
    // Sidebar avatar
    const sidebarAvatarDefault = document.getElementById('sidebarAvatarDefault');
    const sidebarAvatarImage = document.getElementById('sidebarAvatarImage');
    
    if (sidebarAvatarDefault && sidebarAvatarImage) {
        sidebarAvatarDefault.style.display = 'none';
        sidebarAvatarImage.src = urlFoto;
        sidebarAvatarImage.style.display = 'block';
    }
}

// Inicializar el sidebar para móvil
function inicializarSidebar() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarPanel = document.getElementById('sidebarPanel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Toggle del menú móvil
    if (mobileMenuToggle && sidebarPanel && sidebarOverlay) {
        mobileMenuToggle.addEventListener('click', function () {
            sidebarPanel.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            // El icono rota con CSS, no necesitamos cambiar la clase
        });

        // Cerrar al hacer clic en el overlay
        sidebarOverlay.addEventListener('click', function () {
            sidebarPanel.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    }

    // Botón Mi Perfil
    const btnProfile = document.getElementById('btnProfile');
    if (btnProfile) {
        btnProfile.addEventListener('click', function () {
            window.location.href = 'Perfil.html';
        });
    }

    // Botón Web Principal
    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
        btnHome.addEventListener('click', function () {
            window.location.href = '../index.html';
        });
    }

    // Botón Volver al Panel
    const btnBack = document.getElementById('btnBack');
    if (btnBack) {
        btnBack.addEventListener('click', function () {
            window.location.href = 'Resultados.html';
        });
    }

    // Botón Cerrar Sesión
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function () {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '¿Cerrar sesión?',
                    text: '¿Estás seguro de que quieres salir?',
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#cc0000',
                    cancelButtonColor: '#666',
                    confirmButtonText: 'Sí, salir',
                    cancelButtonText: 'Cancelar',
                    background: '#1a1a1a',
                    color: '#fff'
                }).then((result) => {
                    if (result.isConfirmed) {
                        sessionStorage.removeItem('currentUser');
                        window.location.href = '../index.html';
                    }
                });
            } else {
                if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                    sessionStorage.removeItem('currentUser');
                    window.location.href = '../index.html';
                }
            }
        });
    }
}

// Inicializar el reloj
function inicializarReloj() {
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
}

function actualizarReloj() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    const iconElement = document.getElementById('timeIcon');

    if (timeElement) {
        const hours = now.getHours();
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const seconds = now.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        timeElement.textContent = `${displayHours}:${minutes}:${seconds} ${ampm}`;
    }

    if (dateElement) {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const diaSemana = dias[now.getDay()];
        const dia = now.getDate();
        const mes = meses[now.getMonth()];
        const año = now.getFullYear();
        dateElement.textContent = `${diaSemana}, ${dia} De ${mes} De ${año}`;
    }

    if (iconElement) {
        const hour = now.getHours();
        if (hour >= 6 && hour < 12) {
            iconElement.className = 'bi bi-sunrise-fill';
        } else if (hour >= 12 && hour < 18) {
            iconElement.className = 'bi bi-sun-fill';
        } else if (hour >= 18 && hour < 21) {
            iconElement.className = 'bi bi-sunset-fill';
        } else {
            iconElement.className = 'bi bi-moon-stars-fill';
        }
    }
}

// Esperar a que Firebase esté listo
function esperarFirebase() {
    return new Promise(resolve => {
        const verificar = () => {
            if (window.firebaseDB) {
                resolve();
            } else {
                setTimeout(verificar, 100);
            }
        };
        verificar();
    });
}

// Inicializar event listeners
function inicializarEventListeners() {
    // Tabs de navegación
    const tabs = document.querySelectorAll('.detalle-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');
            cambiarTab(targetTab);
        });
    });
    
    // Botón volver desde detalle de materia
    const btnVolverMaterias = document.getElementById('btnVolverMaterias');
    if (btnVolverMaterias) {
        btnVolverMaterias.addEventListener('click', () => {
            volverDeDetalleMateria();
        });
    }
}

// Cargar resultados desde parámetros de URL
async function cargarResultadosDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const respuestaId = params.get('id');
    const pruebaId = params.get('pruebaId');
    const tipo = params.get('tipo') || 'prueba';
    const estudianteIdParam = params.get('estudianteId'); // Para cuando admin ve resultados de otro
    
    if (!pruebaId) {
        mostrarError('No se encontró la información de la prueba');
        return;
    }
    
    try {
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        
        // Obtener datos de la prueba
        const pruebaDoc = await db.collection('pruebas').doc(pruebaId).get();
        if (!pruebaDoc.exists) {
            throw new Error('No se encontró la prueba. Es posible que haya sido eliminada.');
        }
        
        const pruebaData = pruebaDoc.data();
        
        // Actualizar título de la página
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.querySelector('span').textContent = pruebaData.nombre || 'Detalle de Resultados';
        }
        
        // Actualizar tipo de prueba
        const tipoPruebaElement = document.getElementById('tipoPrueba');
        const tipoPruebaIcon = document.querySelector('#tipoPruebaContainer i');
        if (tipoPruebaElement) {
            tipoPruebaElement.textContent = tipo === 'minisimulacro' ? 'Minisimulacro' : 'Prueba';
        }
        if (tipoPruebaIcon) {
            tipoPruebaIcon.className = tipo === 'minisimulacro' ? 'bi bi-lightning-fill' : 'bi bi-clipboard-check-fill';
        }
        
        // Determinar el estudianteId a usar
        // Si viene en la URL (admin viendo resultados de otro), usar ese
        // Si no, usar el del usuario actual
        let estudianteId = estudianteIdParam;
        
        if (!estudianteId) {
            const usuarioActual = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            estudianteId = usuarioActual.numeroDocumento || usuarioActual.numeroIdentidad || usuarioActual.id;
        }
        
        // Validar que tenemos un estudianteId válido
        if (!estudianteId) {
            throw new Error('No se pudo identificar al estudiante. Por favor, vuelve a iniciar sesión.');
        }
        
        const respuestasEstudianteSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .where('estudianteId', '==', estudianteId)
            .get();
        
        if (respuestasEstudianteSnapshot.empty) {
            throw new Error('No se encontraron respuestas del estudiante');
        }
        
        // Consolidar respuestas de todos los bloques
        const respuestasConsolidadas = {};
        const bloquesCompletados = [];
        let fechaRealizacion = null;
        
        respuestasEstudianteSnapshot.forEach(doc => {
            const respuesta = doc.data();
            const bloqueNum = respuesta.bloque || 1;
            bloquesCompletados.push(bloqueNum);
            
            if (respuesta.fechaEnvio) {
                fechaRealizacion = respuesta.fechaEnvio;
            }
            
            if (respuesta.respuestasEvaluadas) {
                Object.keys(respuesta.respuestasEvaluadas).forEach(materia => {
                    if (!respuestasConsolidadas[materia]) {
                        respuestasConsolidadas[materia] = {};
                    }
                    
                    Object.keys(respuesta.respuestasEvaluadas[materia]).forEach(preguntaId => {
                        const respuestaPregunta = respuesta.respuestasEvaluadas[materia][preguntaId];
                        const preguntaUnicaId = `${preguntaId}_bloque${bloqueNum}`;
                        respuestasConsolidadas[materia][preguntaUnicaId] = respuestaPregunta;
                    });
                });
            }
        });
        
        // Actualizar información de fecha y bloques
        const fechaPruebaElement = document.getElementById('fechaPrueba');
        if (fechaPruebaElement && fechaRealizacion) {
            fechaPruebaElement.textContent = formatearFecha(fechaRealizacion.toDate());
        }
        
        const bloquesPruebaElement = document.getElementById('bloquesPrueba');
        if (bloquesPruebaElement) {
            const bloquesUnicos = [...new Set(bloquesCompletados)].sort();
            bloquesPruebaElement.textContent = bloquesUnicos.length > 1 ?
                `Bloques ${bloquesUnicos.join(' y ')}` :
                `Bloque ${bloquesUnicos[0]}`;
        }
        
        // Obtener TODAS las respuestas de TODOS los estudiantes
        const todasRespuestasSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .get();
        
        const todasLasRespuestas = [];
        todasRespuestasSnapshot.forEach(doc => {
            todasLasRespuestas.push(doc.data());
        });
        
        // Procesar datos
        const datosDetalle = procesarDatosConsolidado(respuestasConsolidadas, pruebaData, todasLasRespuestas, bloquesCompletados);
        datosDetalleActual = datosDetalle;
        
        // Ocultar loading y mostrar contenido
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('resumenContenido').style.display = 'block';
        
        // Renderizar resumen
        renderizarResumen(datosDetalle);
        
        // Renderizar materias
        renderizarMaterias(datosDetalle);
        
    } catch (error) {
        console.error('Error al cargar resultados:', error);
        mostrarError('No se pudieron cargar los resultados: ' + error.message);
    }
}

// Procesar datos consolidados
function procesarDatosConsolidado(respuestasConsolidadas, pruebaData, todasLasRespuestas, bloquesCompletados) {
    const bloques = pruebaData.bloques || {};
    
    // Calcular estadísticas de selección de opciones
    const estadisticasPorPregunta = calcularEstadisticasOpciones(todasLasRespuestas);
    
    let totalPreguntas = 0;
    let correctas = 0;
    let incorrectas = 0;
    
    const materias = {};
    
    Object.keys(respuestasConsolidadas).forEach(materia => {
        const respuestasMateria = respuestasConsolidadas[materia];
        const materiaKey = mapearNombreMateriaAKey(materia);
        
        if (!materias[materia]) {
            materias[materia] = {
                nombre: materia,
                total: 0,
                correctas: 0,
                incorrectas: 0,
                preguntas: []
            };
        }
        
        let numeroPreguntaGlobal = 0;
        Object.keys(respuestasMateria).forEach((preguntaIdUnico) => {
            const respuestaPregunta = respuestasMateria[preguntaIdUnico];
            const esCorrecta = respuestaPregunta.esCorrecta || false;
            
            const preguntaIdOriginal = preguntaIdUnico.split('_bloque')[0];
            const bloqueNum = preguntaIdUnico.includes('_bloque') ?
                parseInt(preguntaIdUnico.split('_bloque')[1]) : 1;
            
            totalPreguntas++;
            materias[materia].total++;
            numeroPreguntaGlobal++;
            
            if (esCorrecta) {
                correctas++;
                materias[materia].correctas++;
            } else {
                incorrectas++;
                materias[materia].incorrectas++;
            }
            
            // IMPORTANTE: Buscar estadísticas usando materia + preguntaId
            const claveEstadisticas = `${materia}|||${preguntaIdOriginal}`;
            const estadisticasPregunta = estadisticasPorPregunta[claveEstadisticas] || {
                totalRespuestas: 0,
                porOpcion: { 'A': { cantidad: 0, porcentaje: 0 }, 'B': { cantidad: 0, porcentaje: 0 }, 'C': { cantidad: 0, porcentaje: 0 }, 'D': { cantidad: 0, porcentaje: 0 } }
            };
            
            // ========== OBTENER DATOS DE SABER11 DIRECTAMENTE DE LA PREGUNTA ORIGINAL ==========
            let infoSaber11 = {
                componente: respuestaPregunta.componente || 'No especificado',
                competencia: respuestaPregunta.competencia || 'No especificada',
                afirmacion: respuestaPregunta.afirmacion || '',
                tema: respuestaPregunta.tema || 'No especificado'
            };
            
            // Si los datos están como "No especificada", intentar obtenerlos de la pregunta original
            const necesitaActualizar = infoSaber11.competencia === 'No especificada' || 
                                       infoSaber11.afirmacion === '' || 
                                       infoSaber11.afirmacion === 'No especificada';
            
            if (necesitaActualizar) {
                // Buscar la pregunta original en los bloques de la prueba
                const preguntaOriginal = buscarPreguntaOriginal(bloques, materia, parseInt(preguntaIdOriginal), bloqueNum);
                
                if (preguntaOriginal && preguntaOriginal.saber11) {
                    const saber11 = preguntaOriginal.saber11;
                    
                    // Procesar componentes
                    if (saber11.componentes && saber11.componentes.length > 0) {
                        infoSaber11.componente = saber11.componentes.join(', ');
                    }
                    
                    // Procesar competencias (convertir IDs a nombres)
                    if (saber11.competencias && saber11.competencias.length > 0) {
                        const nombresCompetencias = obtenerNombresCompetencias(materia, saber11.competencias);
                        if (nombresCompetencias.length > 0) {
                            infoSaber11.competencia = nombresCompetencias.join(', ');
                        }
                    }
                    
                    // Procesar afirmaciones (convertir IDs a descripciones)
                    if (saber11.afirmaciones && Object.keys(saber11.afirmaciones).length > 0) {
                        const descripcionesAfirmaciones = obtenerDescripcionesAfirmaciones(materia, saber11.afirmaciones);
                        if (descripcionesAfirmaciones.length > 0) {
                            infoSaber11.afirmacion = descripcionesAfirmaciones.join('; ');
                        }
                    }
                    
                    // Procesar temas
                    if (saber11.temas && saber11.temas.length > 0) {
                        const nombresTemas = saber11.temas.map(t => {
                            if (typeof t === 'string' && t.includes('|')) {
                                return t.split('|')[1];
                            }
                            return t.nombre || t;
                        });
                        infoSaber11.tema = nombresTemas.join(', ');
                    }
                    
                    console.log(`Datos Saber11 actualizados desde pregunta original:`, infoSaber11);
                }
            }
            
            // Obtener la respuesta del estudiante de múltiples campos posibles
            // IMPORTANTE: 0 es un valor válido, así que necesitamos verificar específicamente contra null/undefined
            let respuestaDelEstudiante = null;
            
            // Lista de campos posibles donde puede estar la respuesta
            const camposPosibles = [
                'respuestaUsuario', 
                'respuestaEstudiante',
                'respuesta', 
                'seleccion', 
                'opcionSeleccionada',
                'selectedOption',
                'answer',
                'indiceRespuesta',
                'answerIndex'
            ];
            
            for (const campo of camposPosibles) {
                const valor = respuestaPregunta[campo];
                // Verificar que el valor existe y no es vacío (pero 0 es válido!)
                if (valor !== null && valor !== undefined && valor !== '') {
                    respuestaDelEstudiante = valor;
                    break;
                }
                // Caso especial: el valor es exactamente 0 (número)
                if (valor === 0) {
                    respuestaDelEstudiante = valor;
                    break;
                }
            }
            
            // Debug: ver qué campos tiene respuestaPregunta
            console.log(`Procesando pregunta ${numeroPreguntaGlobal}:`, {
                respuestaUsuario: respuestaPregunta.respuestaUsuario,
                respuestaCorrecta: respuestaPregunta.respuestaCorrecta,
                respuestaEncontrada: respuestaDelEstudiante,
                esCorrecta: esCorrecta,
                camposDisponibles: Object.keys(respuestaPregunta),
                todosLosCampos: respuestaPregunta
            });
            
            materias[materia].preguntas.push({
                id: preguntaIdUnico,
                numeroPregunta: numeroPreguntaGlobal,
                pregunta: respuestaPregunta.textoPregunta || 'Pregunta sin texto',
                respuestaEstudiante: respuestaDelEstudiante,
                respuestaUsuario: respuestaDelEstudiante, // Guardar en ambos campos por compatibilidad
                respuestaCorrecta: respuestaPregunta.respuestaCorrecta,
                esCorrecta: esCorrecta,
                tipoRespuesta: respuestaPregunta.tipoRespuesta || 'multiple',
                bloque: bloqueNum,
                opcionA: respuestaPregunta.opcionA || '',
                opcionB: respuestaPregunta.opcionB || '',
                opcionC: respuestaPregunta.opcionC || '',
                opcionD: respuestaPregunta.opcionD || '',
                estadisticas: estadisticasPregunta,
                competencia: infoSaber11.competencia,
                componente: infoSaber11.componente,
                tema: infoSaber11.tema,
                afirmacion: infoSaber11.afirmacion
            });
        });
        
        materias[materia].porcentaje = materias[materia].total > 0
            ? Math.round((materias[materia].correctas / materias[materia].total) * 100)
            : 0;
    });
    
    const porcentajeGeneral = totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : 0;
    const puntajeGlobal = calcularPuntajeGlobal(materias);
    
    return {
        nombrePrueba: pruebaData.nombre,
        bloques: bloquesCompletados,
        totalPreguntas,
        correctas,
        incorrectas,
        porcentajeGeneral,
        materias,
        puntajeGlobal
    };
}

// Calcular estadísticas de opciones
function calcularEstadisticasOpciones(todasLasRespuestas) {
    const estadisticas = {};
    
    todasLasRespuestas.forEach(respuesta => {
        const respuestasEvaluadas = respuesta.respuestasEvaluadas || {};
        const bloqueRespuesta = respuesta.bloque || 1;
        const estudianteId = respuesta.estudianteId;
        
        Object.keys(respuestasEvaluadas).forEach(materia => {
            const respuestasMateria = respuestasEvaluadas[materia];
            
            Object.keys(respuestasMateria).forEach(preguntaId => {
                const respuestaPregunta = respuestasMateria[preguntaId];
                
                // Crear clave única que incluya materia, pregunta Y bloque
                const claveUnica = `${materia}|||${preguntaId}|||bloque${bloqueRespuesta}`;
                
                if (!estadisticas[claveUnica]) {
                    estadisticas[claveUnica] = {
                        totalRespuestas: 0,
                        estudiantesUnicos: new Set(),
                        porOpcion: { 'A': 0, 'B': 0, 'C': 0, 'D': 0, '0': 0, '1': 0, '2': 0, '3': 0 },
                        preguntaIdOriginal: preguntaId,
                        materia: materia,
                        bloque: bloqueRespuesta
                    };
                }
                
                const respuestaUsuario = respuestaPregunta.respuestaUsuario;
                
                if (respuestaUsuario !== null && respuestaUsuario !== undefined && respuestaUsuario !== '') {
                    // Crear clave única de estudiante + pregunta + bloque para evitar duplicados
                    const claveEstudiante = `${estudianteId}|||${claveUnica}`;
                    
                    if (!estadisticas[claveUnica].estudiantesUnicos.has(claveEstudiante)) {
                        estadisticas[claveUnica].estudiantesUnicos.add(claveEstudiante);
                        estadisticas[claveUnica].totalRespuestas++;
                        
                        let opcionSeleccionada = respuestaUsuario;
                        if (typeof respuestaUsuario === 'number') {
                            const letras = ['A', 'B', 'C', 'D'];
                            opcionSeleccionada = letras[respuestaUsuario] || respuestaUsuario;
                        }
                        
                        if (estadisticas[claveUnica].porOpcion[opcionSeleccionada] !== undefined) {
                            estadisticas[claveUnica].porOpcion[opcionSeleccionada]++;
                        }
                    }
                }
            });
        });
    });
    
    // Calcular porcentajes y crear índice simplificado
    const estadisticasSimplificadas = {};
    
    Object.keys(estadisticas).forEach(claveUnica => {
        const stats = estadisticas[claveUnica];
        const total = stats.totalRespuestas;
        const preguntaIdOriginal = stats.preguntaIdOriginal;
        const materia = stats.materia;
        
        if (total > 0) {
            const porOpcionCalculado = {};
            Object.keys(stats.porOpcion).forEach(opcion => {
                const cantidad = stats.porOpcion[opcion];
                const porcentaje = Math.round((cantidad / total) * 100);
                porOpcionCalculado[opcion] = { cantidad, porcentaje };
            });
            
            // IMPORTANTE: Incluir materia en la clave para evitar sobrescrituras
            // Diferentes materias pueden tener preguntas con el mismo ID
            const claveConMateria = `${materia}|||${preguntaIdOriginal}`;
            estadisticasSimplificadas[claveConMateria] = {
                totalRespuestas: total,
                porOpcion: porOpcionCalculado,
                materia: materia,
                preguntaId: preguntaIdOriginal
            };
        }
    });
    
    console.log('=== ESTADÍSTICAS CALCULADAS ===', estadisticasSimplificadas);
    
    return estadisticasSimplificadas;
}

// Mapear nombre de materia a clave
function mapearNombreMateriaAKey(nombreMateria) {
    const mapeo = {
        'Lectura Crítica': 'lectura',
        'Matemáticas': 'matematicas',
        'Ciencias Sociales': 'sociales',
        'Ciencias Naturales': 'ciencias',
        'Inglés': 'ingles',
        'LC': 'lectura',
        'MT': 'matematicas',
        'SC': 'sociales',
        'CN': 'ciencias',
        'IN': 'ingles'
    };
    return mapeo[nombreMateria] || nombreMateria.toLowerCase();
}

// ========== FUNCIONES PARA OBTENER DATOS DE SABER11 DESDE PREGUNTAS ORIGINALES ==========

// Buscar pregunta original en los bloques de la prueba
function buscarPreguntaOriginal(bloques, materia, preguntaIndex, bloqueNum) {
    try {
        const bloqueKey = `bloque${bloqueNum}`;
        
        // Buscar en el bloque específico
        if (bloques[bloqueKey] && bloques[bloqueKey][materia]) {
            const questions = bloques[bloqueKey][materia].questions || [];
            
            // Filtrar solo preguntas reales (no textos de lectura)
            const preguntasReales = [];
            let indexReal = 0;
            
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (q.type === 'multiple' || q.type === 'short' || q.type === 'open') {
                    if (indexReal === preguntaIndex) {
                        console.log(`Pregunta original encontrada en bloque${bloqueNum}/${materia}[${i}]:`, q.saber11);
                        return q;
                    }
                    indexReal++;
                }
            }
        }
        
        console.log(`No se encontró pregunta original para índice ${preguntaIndex} en bloque${bloqueNum}/${materia}`);
        return null;
    } catch (error) {
        console.error('Error buscando pregunta original:', error);
        return null;
    }
}

// Obtener nombres de competencias desde SABER11_ESTRUCTURA
function obtenerNombresCompetencias(materia, competenciaIds) {
    const nombres = [];
    
    if (!window.SABER11_ESTRUCTURA) {
        console.warn('SABER11_ESTRUCTURA no está cargado');
        return nombres;
    }
    
    // Mapear nombres de materias a claves de SABER11_ESTRUCTURA
    // Las claves en SABER11_ESTRUCTURA son: ciencias, sociales, matematicas, lectura, ingles
    const mapeoMaterias = {
        'matematicas': 'matematicas',
        'lectura': 'lectura',
        'sociales': 'sociales',
        'ciencias': 'ciencias',
        'ingles': 'ingles',
        'Lectura Crítica': 'lectura',
        'Matemáticas': 'matematicas',
        'Ciencias Sociales': 'sociales',
        'Ciencias Naturales': 'ciencias',
        'Inglés': 'ingles',
        'naturales': 'ciencias'
    };
    
    const materiaKey = mapeoMaterias[materia] || materia.toLowerCase();
    const estructura = window.SABER11_ESTRUCTURA[materiaKey];
    
    if (!estructura || !estructura.competencias) {
        console.warn(`No se encontró estructura para materia: ${materia} (key: ${materiaKey})`);
        return nombres;
    }
    
    competenciaIds.forEach(competenciaId => {
        const competencia = estructura.competencias.find(c => c.id === competenciaId);
        if (competencia) {
            nombres.push(competencia.nombre);
        } else {
            console.warn(`Competencia no encontrada: ${competenciaId}`);
        }
    });
    
    return nombres;
}

// Obtener descripciones de afirmaciones desde SABER11_ESTRUCTURA
function obtenerDescripcionesAfirmaciones(materia, afirmacionesObj) {
    const descripciones = [];
    
    if (!window.SABER11_ESTRUCTURA) {
        console.warn('SABER11_ESTRUCTURA no está cargado');
        return descripciones;
    }
    
    // Mapear nombres de materias a claves de SABER11_ESTRUCTURA
    // Las claves en SABER11_ESTRUCTURA son: ciencias, sociales, matematicas, lectura, ingles
    const mapeoMaterias = {
        'matematicas': 'matematicas',
        'lectura': 'lectura',
        'sociales': 'sociales',
        'ciencias': 'ciencias',
        'ingles': 'ingles',
        'Lectura Crítica': 'lectura',
        'Matemáticas': 'matematicas',
        'Ciencias Sociales': 'sociales',
        'Ciencias Naturales': 'ciencias',
        'Inglés': 'ingles',
        'naturales': 'ciencias'
    };
    
    const materiaKey = mapeoMaterias[materia] || materia.toLowerCase();
    const estructura = window.SABER11_ESTRUCTURA[materiaKey];
    
    if (!estructura || !estructura.competencias) {
        console.warn(`No se encontró estructura para materia: ${materia} (key: ${materiaKey})`);
        return descripciones;
    }
    
    // afirmacionesObj tiene formato: { competenciaId: [afirmacionId1, afirmacionId2, ...] }
    Object.keys(afirmacionesObj).forEach(competenciaId => {
        const afirmacionIds = afirmacionesObj[competenciaId];
        
        // Buscar la competencia
        const competencia = estructura.competencias.find(c => c.id === competenciaId);
        
        if (competencia && competencia.afirmaciones) {
            afirmacionIds.forEach(afirmacionId => {
                const afirmacion = competencia.afirmaciones.find(a => a.id === afirmacionId);
                if (afirmacion) {
                    descripciones.push(afirmacion.descripcion || afirmacion.id);
                } else {
                    console.warn(`Afirmación no encontrada: ${afirmacionId} en competencia ${competenciaId}`);
                }
            });
        }
    });
    
    return descripciones;
}

// Calcular puntaje por materia
function calcularPuntajeMateria(correctas, total, codigoMateria) {
    const errores = total - correctas;
    const tabla = tablasPorcentajes[codigoMateria];
    
    if (!tabla) {
        return Math.round((correctas / total) * 100);
    }
    
    if (total <= 2) {
        return Math.round((correctas / total) * 100);
    }
    
    return tabla[Math.min(errores, tabla.length - 1)];
}

// Calcular puntaje global
function calcularPuntajeGlobal(materias) {
    const mapeoMaterias = {
        'Lectura Crítica': 'LC',
        'Matemáticas': 'MT',
        'Ciencias Sociales': 'SC',
        'Ciencias Naturales': 'CN',
        'Inglés': 'IN',
        'LC': 'LC',
        'MT': 'MT',
        'SC': 'SC',
        'CN': 'CN',
        'IN': 'IN',
        'lectura': 'LC',
        'matematicas': 'MT',
        'sociales': 'SC',
        'ciencias': 'CN',
        'ingles': 'IN'
    };
    
    const puntajes = [];
    const ordenMaterias = ['LC', 'MT', 'SC', 'CN', 'IN'];
    
    ordenMaterias.forEach(codigo => {
        let puntaje = 0;
        Object.keys(materias).forEach(nombreMateria => {
            const codigoMateria = mapeoMaterias[nombreMateria];
            if (codigoMateria === codigo) {
                const data = materias[nombreMateria];
                puntaje = calcularPuntajeMateria(data.correctas, data.total, codigo);
            }
        });
        puntajes.push(puntaje);
    });
    
    const ponderaciones = [3, 3, 3, 3, 1];
    const puntajesPonderados = puntajes.map((puntaje, index) => puntaje * ponderaciones[index]);
    const sumaPonderada = puntajesPonderados.reduce((a, b) => a + b, 0);
    
    return Math.round((sumaPonderada / 13) * 5);
}

// Ordenar materias
function ordenarMaterias(materias) {
    return materias.sort((a, b) => {
        const indexA = ordenMateriasArray.indexOf(a);
        const indexB = ordenMateriasArray.indexOf(b);
        
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return a.localeCompare(b);
    });
}

// Formatear fecha
function formatearFecha(fecha) {
    const opciones = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Renderizar resumen
function renderizarResumen(datos) {
    const resumenGrid = document.getElementById('resumenGrid');
    
    resumenGrid.innerHTML = `
        <div class="resumen-card destacado">
            <div class="resumen-card-header">
                <div class="resumen-icon global">
                    <i class="bi bi-trophy-fill"></i>
                </div>
                <div>
                    <div class="resumen-card-title">Puntaje Global</div>
                </div>
            </div>
            <div class="resumen-card-value">${datos.puntajeGlobal}</div>
            <div class="resumen-card-subtitle">de 500 puntos</div>
        </div>
        
        <div class="resumen-card">
            <div class="resumen-card-header">
                <div class="resumen-icon correctas">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
                <div>
                    <div class="resumen-card-title">Correctas</div>
                </div>
            </div>
            <div class="resumen-card-value">${datos.correctas}</div>
            <div class="resumen-card-subtitle">de ${datos.totalPreguntas} preguntas</div>
        </div>
        
        <div class="resumen-card">
            <div class="resumen-card-header">
                <div class="resumen-icon incorrectas">
                    <i class="bi bi-x-circle-fill"></i>
                </div>
                <div>
                    <div class="resumen-card-title">Incorrectas</div>
                </div>
            </div>
            <div class="resumen-card-value">${datos.incorrectas}</div>
            <div class="resumen-card-subtitle">de ${datos.totalPreguntas} preguntas</div>
        </div>
        
        <div class="resumen-card">
            <div class="resumen-card-header">
                <div class="resumen-icon porcentaje">
                    <i class="bi bi-percent"></i>
                </div>
                <div>
                    <div class="resumen-card-title">Porcentaje</div>
                </div>
            </div>
            <div class="resumen-card-value">${datos.porcentajeGeneral}%</div>
            <div class="resumen-card-subtitle">Rendimiento general</div>
        </div>
    `;
    
    // Renderizar gráficos
    renderizarGraficos(datos);
    
    // Renderizar lista de materias en resumen
    renderizarMateriasResumen(datos);
}

// Renderizar gráficos de materias
function renderizarGraficos(datos) {
    const container = document.getElementById('graficoContainer');
    container.innerHTML = '';
    
    // Destruir gráficos anteriores
    graficosMaterias.forEach(chart => chart.destroy());
    graficosMaterias = [];
    
    const materias = ordenarMaterias(Object.keys(datos.materias));
    
    materias.forEach(materia => {
        const data = datos.materias[materia];
        const color = coloresMaterias[materia] || '#999';
        const nombreMateria = nombresMaterias[materia] || materia;
        const porcentaje = data.porcentaje;
        
        const wrapper = document.createElement('div');
        wrapper.style.textAlign = 'center';
        wrapper.style.maxWidth = '200px';
        
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        
        const title = document.createElement('div');
        title.style.color = 'white';
        title.style.fontWeight = '600';
        title.style.marginTop = '1rem';
        title.style.fontSize = '0.95rem';
        title.textContent = nombreMateria;
        
        wrapper.appendChild(canvas);
        wrapper.appendChild(title);
        container.appendChild(wrapper);
        
        const chart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Aciertos', 'Errores'],
                datasets: [{
                    data: [porcentaje, 100 - porcentaje],
                    backgroundColor: [color, 'rgba(255, 255, 255, 0.1)'],
                    borderColor: ['rgba(0, 0, 0, 0.5)', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: color,
                        borderWidth: 2,
                        callbacks: {
                            label: function (context) {
                                return context.dataIndex === 0 ? `Aciertos: ${porcentaje}%` : `Errores: ${100 - porcentaje}%`;
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    const width = chart.width;
                    const height = chart.height;
                    
                    ctx.restore();
                    const fontSize = (height / 80).toFixed(2);
                    ctx.font = `bold ${fontSize}em sans-serif`;
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = color;
                    
                    const text = `${porcentaje}%`;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2;
                    
                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }]
        });
        
        graficosMaterias.push(chart);
    });
}

// Renderizar materias en resumen
function renderizarMateriasResumen(datos) {
    const container = document.getElementById('materiasResumen');
    
    container.innerHTML = ordenarMaterias(Object.keys(datos.materias)).map(materia => {
        const data = datos.materias[materia];
        const color = coloresMaterias[materia] || '#999';
        const nombreMateria = nombresMaterias[materia] || materia;
        const icono = iconosMaterias[materia] || 'bi-book';
        
        return `
            <div class="materia-card" onclick="verDetalleMateria('${materia}')">
                <div class="materia-card-header">
                    <div class="materia-nombre">
                        <div class="materia-icono" style="background: ${color};">
                            <i class="bi ${icono}"></i>
                        </div>
                        <span>${nombreMateria}</span>
                    </div>
                    <div class="materia-header-right">
                        <div class="materia-puntaje-badge" style="background: linear-gradient(135deg, ${color}, ${color}dd);">
                            ${data.porcentaje}%
                        </div>
                        <button class="btn-ver-preguntas" onclick="event.stopPropagation(); verDetalleMateria('${materia}')">
                            <i class="bi bi-eye-fill"></i>
                            <span>Ver Preguntas</span>
                            <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>
                <div class="materia-stats">
                    <div class="materia-stat">
                        <div class="materia-stat-label">Total</div>
                        <div class="materia-stat-value">${data.total}</div>
                    </div>
                    <div class="materia-stat">
                        <div class="materia-stat-label">Correctas</div>
                        <div class="materia-stat-value correctas">${data.correctas}</div>
                    </div>
                    <div class="materia-stat">
                        <div class="materia-stat-label">Incorrectas</div>
                        <div class="materia-stat-value incorrectas">${data.incorrectas}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar tab de materias
function renderizarMaterias(datos) {
    const container = document.getElementById('materiasContenido');
    
    container.innerHTML = `
        <div class="materias-resumen">
            ${ordenarMaterias(Object.keys(datos.materias)).map(materia => {
                const data = datos.materias[materia];
                const color = coloresMaterias[materia] || '#999';
                const nombreMateria = nombresMaterias[materia] || materia;
                const icono = iconosMaterias[materia] || 'bi-book';
                
                return `
                    <div class="materia-card" onclick="verDetalleMateria('${materia}')">
                        <div class="materia-card-header">
                            <div class="materia-nombre">
                                <div class="materia-icono" style="background: ${color};">
                                    <i class="bi ${icono}"></i>
                                </div>
                                <span>${nombreMateria}</span>
                            </div>
                            <div class="materia-header-right">
                                <div class="materia-puntaje-badge" style="background: linear-gradient(135deg, ${color}, ${color}dd);">
                                    ${data.porcentaje}%
                                </div>
                                <button class="btn-ver-preguntas" onclick="event.stopPropagation(); verDetalleMateria('${materia}')">
                                    <i class="bi bi-eye-fill"></i>
                                    <span>Ver Preguntas</span>
                                    <i class="bi bi-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                        <div class="materia-stats">
                            <div class="materia-stat">
                                <div class="materia-stat-label">Total</div>
                                <div class="materia-stat-value">${data.total}</div>
                            </div>
                            <div class="materia-stat">
                                <div class="materia-stat-label">Correctas</div>
                                <div class="materia-stat-value correctas">${data.correctas}</div>
                            </div>
                            <div class="materia-stat">
                                <div class="materia-stat-label">Incorrectas</div>
                                <div class="materia-stat-value incorrectas">${data.incorrectas}</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Cambiar tab
function cambiarTab(tab) {
    // Actualizar tabs
    document.querySelectorAll('.detalle-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.detalle-tab[data-tab="${tab}"]`).classList.add('active');
    
    // Mostrar contenido
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tab}-content`).classList.add('active');
    
    // Ocultar detalle de materia si está visible
    document.getElementById('detalleMateriaView').style.display = 'none';
}

// Ver detalle de materia
function verDetalleMateria(materia) {
    if (!datosDetalleActual || !datosDetalleActual.materias[materia]) return;
    
    const data = datosDetalleActual.materias[materia];
    const color = coloresMaterias[materia] || '#999';
    const nombreMateria = nombresMaterias[materia] || materia;
    const icono = iconosMaterias[materia] || 'bi-book';
    
    // Ocultar contenido de tabs
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Mostrar vista de detalle de materia
    const detalleMateriaView = document.getElementById('detalleMateriaView');
    detalleMateriaView.style.display = 'block';
    
    // Actualizar título
    document.getElementById('nombreMateriaDetalle').innerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 0.75rem;">
            <span style="width: 40px; height: 40px; border-radius: 10px; background: ${color}; display: inline-flex; align-items: center; justify-content: center;">
                <i class="bi ${icono}" style="color: white; font-size: 1.2rem;"></i>
            </span>
            ${nombreMateria}
        </span>
    `;
    
    // Renderizar estadísticas
    const statsContainer = document.getElementById('detalleMateriaStats');
    statsContainer.innerHTML = `
        <div class="resumen-card">
            <div class="resumen-card-header">
                <div class="resumen-icon" style="background: ${color};">
                    <i class="bi ${icono}"></i>
                </div>
                <div>
                    <div class="resumen-card-title">Rendimiento</div>
                </div>
            </div>
            <div class="resumen-card-value">${data.porcentaje}%</div>
        </div>
        <div class="resumen-card">
            <div class="resumen-card-header">
                <div class="resumen-icon correctas">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
                <div>
                    <div class="resumen-card-title">Correctas</div>
                </div>
            </div>
            <div class="resumen-card-value">${data.correctas}</div>
            <div class="resumen-card-subtitle">de ${data.total} preguntas</div>
        </div>
        <div class="resumen-card">
            <div class="resumen-card-header">
                <div class="resumen-icon incorrectas">
                    <i class="bi bi-x-circle-fill"></i>
                </div>
                <div>
                    <div class="resumen-card-title">Incorrectas</div>
                </div>
            </div>
            <div class="resumen-card-value">${data.incorrectas}</div>
            <div class="resumen-card-subtitle">de ${data.total} preguntas</div>
        </div>
    `;
    
    // Renderizar preguntas
    const preguntasContainer = document.getElementById('preguntasLista');
    preguntasContainer.innerHTML = data.preguntas.map((pregunta, index) => 
        renderizarPreguntaCard(pregunta, index + 1)
    ).join('');
    
    // Renderizar fórmulas matemáticas
    setTimeout(() => renderizarFormulas(), 100);
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Renderizar tarjeta de pregunta
function renderizarPreguntaCard(pregunta, numero) {
    const opciones = ['A', 'B', 'C', 'D'];
    const respuestaCorrecta = pregunta.respuestaCorrecta;
    
    // Intentar obtener la respuesta del estudiante de múltiples campos posibles
    // IMPORTANTE: 0 es un valor válido, así que verificamos explícitamente
    let respuestaEstudiante = null;
    
    // Lista de campos posibles
    const camposPosiblesRespuesta = [
        'respuestaEstudiante',
        'respuestaUsuario',
        'respuesta',
        'seleccion',
        'opcionSeleccionada',
        'selectedOption',
        'answer',
        'indiceRespuesta',
        'answerIndex'
    ];
    
    for (const campo of camposPosiblesRespuesta) {
        const valor = pregunta[campo];
        // Verificar que existe (0 es válido!)
        if (valor !== null && valor !== undefined && valor !== '') {
            respuestaEstudiante = valor;
            break;
        }
        if (valor === 0) {
            respuestaEstudiante = valor;
            break;
        }
    }
    
    const esCorrecta = pregunta.esCorrecta;
    const estadisticas = pregunta.estadisticas || { totalRespuestas: 0, porOpcion: {} };
    
    // Debug: mostrar en consola para ver qué datos tenemos
    console.log(`Pregunta ${numero}:`, {
        respuestaEstudiante,
        respuestaCorrecta,
        esCorrecta,
        camposDisponibles: Object.keys(pregunta)
    });
    
    // Procesar texto para fórmulas matemáticas
    const textoPregunta = procesarTextoMatematico(pregunta.pregunta || pregunta.textoPregunta || 'Pregunta sin texto');
    
    // Si es pregunta abierta
    if (pregunta.tipoRespuesta === 'open' || pregunta.tipoRespuesta === 'short') {
        return `
            <div class="pregunta-card">
                <div class="pregunta-header">
                    <div class="pregunta-numero">Pregunta ${numero}</div>
                    <div class="pregunta-estado ${esCorrecta ? 'correcta' : 'incorrecta'}">
                        <i class="bi bi-${esCorrecta ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                        ${esCorrecta ? 'Respondida' : 'Sin responder'}
                    </div>
                </div>
                
                ${renderizarMetadata(pregunta)}
                
                <div class="pregunta-texto">${textoPregunta}</div>
                
                <div class="pregunta-opciones">
                    <div class="opcion-item">
                        <div class="opcion-texto" style="width: 100%; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                            <strong>Tu respuesta:</strong><br>${procesarTextoMatematico(respuestaEstudiante || 'Sin respuesta')}
                        </div>
                    </div>
                    ${respuestaCorrecta && respuestaCorrecta !== 'Respuesta abierta - Requiere revisión manual' ? `
                        <div class="opcion-item correcta">
                            <div class="opcion-texto" style="width: 100%; padding: 1rem;">
                                <strong>Respuesta esperada:</strong><br>${procesarTextoMatematico(respuestaCorrecta)}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    // Convertir respuesta correcta a letra
    let respuestaCorrectaLetra = null;
    
    if (respuestaCorrecta !== null && respuestaCorrecta !== undefined && respuestaCorrecta !== '') {
        if (typeof respuestaCorrecta === 'number') {
            if (respuestaCorrecta >= 0 && respuestaCorrecta <= 3) {
                respuestaCorrectaLetra = opciones[respuestaCorrecta];
            }
        } else if (typeof respuestaCorrecta === 'string') {
            const correctaTrim = respuestaCorrecta.trim();
            
            // Verificar si es un dígito numérico como string
            if (['0', '1', '2', '3'].includes(correctaTrim)) {
                respuestaCorrectaLetra = opciones[parseInt(correctaTrim)];
            }
            // Verificar si es una letra válida
            else if (['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'].includes(correctaTrim)) {
                respuestaCorrectaLetra = correctaTrim.toUpperCase();
            }
        }
    }
    
    // Convertir respuesta del estudiante a letra
    let respuestaEstudianteLetra = null;
    
    if (respuestaEstudiante !== null && respuestaEstudiante !== undefined && respuestaEstudiante !== '') {
        if (typeof respuestaEstudiante === 'number') {
            // Es un número directo (0, 1, 2, 3)
            if (respuestaEstudiante >= 0 && respuestaEstudiante <= 3) {
                respuestaEstudianteLetra = opciones[respuestaEstudiante];
            }
        } else if (typeof respuestaEstudiante === 'string') {
            const respuestaTrim = respuestaEstudiante.trim();
            
            // PRIMERO: verificar si es un dígito numérico como string ("0", "1", "2", "3")
            if (['0', '1', '2', '3'].includes(respuestaTrim)) {
                respuestaEstudianteLetra = opciones[parseInt(respuestaTrim)];
            }
            // SEGUNDO: verificar si es una letra válida (A, B, C, D)
            else if (['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd'].includes(respuestaTrim)) {
                respuestaEstudianteLetra = respuestaTrim.toUpperCase();
            }
            // TERCERO: si es cualquier otro string, intentar usarlo como está
            else if (respuestaTrim.length > 0) {
                respuestaEstudianteLetra = respuestaTrim.toUpperCase();
            }
        }
    }
    
    // Log para debug
    console.log(`Pregunta ${numero} - Conversión:`, {
        valorOriginal: respuestaEstudiante,
        tipoOriginal: typeof respuestaEstudiante,
        valorConvertido: respuestaEstudianteLetra
    });
    
    // Si aún no tenemos respuesta, mostrar "Sin respuesta"
    const tieneRespuesta = respuestaEstudianteLetra && 
                           respuestaEstudianteLetra !== '' && 
                           respuestaEstudianteLetra !== null && 
                           respuestaEstudianteLetra !== undefined;
    
    // Determinar si respondió correctamente o no
    const respondioCorrectamente = tieneRespuesta && respuestaEstudianteLetra === respuestaCorrectaLetra;
    
    return `
        <div class="pregunta-card">
            <div class="pregunta-header">
                <div class="pregunta-numero">
                    <i class="bi bi-question-circle-fill"></i>
                    Pregunta ${numero}
                </div>
                <div class="pregunta-estado ${esCorrecta ? 'correcta' : 'incorrecta'}">
                    <i class="bi bi-${esCorrecta ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                    ${esCorrecta ? 'Correcta' : 'Incorrecta'}
                </div>
            </div>
            
            ${renderizarMetadata(pregunta)}
            
            <div class="pregunta-texto">${textoPregunta}</div>
            
            <!-- Resumen de respuestas -->
            <div class="respuestas-resumen">
                <div class="respuesta-box tu-respuesta ${tieneRespuesta ? (respondioCorrectamente ? 'acertaste' : 'fallaste') : 'sin-respuesta'}">
                    <div class="respuesta-label">
                        <i class="bi bi-hand-index-thumb-fill"></i>
                        Tu respuesta:
                    </div>
                    <div class="respuesta-valor">
                        ${tieneRespuesta ? `
                            <span class="letra-grande">${respuestaEstudianteLetra}</span>
                            ${respondioCorrectamente ? 
                                '<span class="resultado-icon"><i class="bi bi-check-circle-fill"></i></span>' : 
                                '<span class="resultado-icon"><i class="bi bi-x-circle-fill"></i></span>'
                            }
                        ` : `
                            <span class="letra-grande sin-responder">--</span>
                            <span class="resultado-icon"><i class="bi bi-question-circle-fill"></i></span>
                        `}
                    </div>
                </div>
                ${!respondioCorrectamente ? `
                    <div class="respuesta-box respuesta-correcta">
                        <div class="respuesta-label">
                            <i class="bi bi-check-circle-fill"></i>
                            Correcta:
                        </div>
                        <div class="respuesta-valor">
                            <span class="letra-grande">${respuestaCorrectaLetra || '?'}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="pregunta-opciones">
                ${opciones.map(opcion => {
                    const esRespuestaCorrecta = opcion === respuestaCorrectaLetra;
                    const esRespuestaEstudiante = tieneRespuesta && opcion === respuestaEstudianteLetra;
                    
                    let clasesPrincipales = ['opcion-item'];
                    
                    // Determinar el estado visual de la opción
                    if (esRespuestaCorrecta) {
                        clasesPrincipales.push('es-correcta');
                    }
                    if (esRespuestaEstudiante && !esRespuestaCorrecta) {
                        clasesPrincipales.push('es-tu-error');
                    }
                    if (esRespuestaEstudiante && esRespuestaCorrecta) {
                        clasesPrincipales.push('es-tu-acierto');
                    }
                    
                    const textoOpcion = procesarTextoMatematico(pregunta[`opcion${opcion}`] || `Opción ${opcion}`);
                    
                    let porcentajeReal = 0;
                    let cantidadReal = 0;
                    if (estadisticas.porOpcion && estadisticas.porOpcion[opcion]) {
                        porcentajeReal = estadisticas.porOpcion[opcion].porcentaje || 0;
                        cantidadReal = estadisticas.porOpcion[opcion].cantidad || 0;
                    }
                    
                    return `
                        <div class="${clasesPrincipales.join(' ')}">
                            <div class="opcion-letra-container">
                                <div class="opcion-letra">${opcion}</div>
                                ${esRespuestaEstudiante ? '<div class="tu-seleccion-indicator"><i class="bi bi-arrow-right-short"></i></div>' : ''}
                            </div>
                            <div class="opcion-contenido">
                                <div class="opcion-texto-wrapper">
                                    ${textoOpcion}
                                </div>
                                <div class="opcion-badges">
                                    ${esRespuestaEstudiante ? `
                                        <span class="badge badge-tu-respuesta">
                                            <i class="bi bi-person-fill"></i> TU RESPUESTA
                                        </span>
                                    ` : ''}
                                    ${esRespuestaCorrecta ? `
                                        <span class="badge badge-correcta">
                                            <i class="bi bi-check-lg"></i> CORRECTA
                                        </span>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="opcion-stats">
                                <span class="porcentaje-badge" title="${cantidadReal} estudiante(s) seleccionaron esta opción">
                                    ${porcentajeReal}%
                                </span>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            
            ${estadisticas.totalRespuestas > 0 ? `
                <div class="pregunta-stats-footer">
                    <i class="bi bi-people-fill"></i>
                    <span>Basado en ${estadisticas.totalRespuestas} respuesta(s) de estudiantes</span>
                </div>
            ` : ''}
        </div>
    `;
}

// Procesar texto para renderizar fórmulas matemáticas
function procesarTextoMatematico(texto) {
    if (!texto) return '';
    
    // Convertir formatos comunes de LaTeX a formato MathJax
    let procesado = texto
        // Preservar las fórmulas existentes
        .replace(/\\\[/g, '$$')
        .replace(/\\\]/g, '$$')
        .replace(/\\begin\{equation\}/g, '$$')
        .replace(/\\end\{equation\}/g, '$$')
        .replace(/\\begin\{align\}/g, '$$\\begin{aligned}')
        .replace(/\\end\{align\}/g, '\\end{aligned}$$')
        // Convertir fracciones simples si no están en formato LaTeX
        .replace(/(\d+)\/(\d+)/g, (match, num, den) => {
            // Solo convertir si parece una fracción matemática simple
            if (num.length <= 3 && den.length <= 3) {
                return `$\\frac{${num}}{${den}}$`;
            }
            return match;
        });
    
    return procesado;
}

// Re-renderizar fórmulas matemáticas con MathJax
function renderizarFormulas() {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise().catch((err) => {
            console.log('Error renderizando fórmulas:', err);
        });
    }
}

// Renderizar metadata de pregunta
function renderizarMetadata(pregunta) {
    const tieneCompetencia = pregunta.competencia && 
        pregunta.competencia !== 'No especificada' && 
        pregunta.competencia !== 'No especificado' &&
        pregunta.competencia.trim() !== '';
    const tieneComponente = pregunta.componente && 
        pregunta.componente !== 'No especificado' && 
        pregunta.componente !== 'No especificada' &&
        pregunta.componente.trim() !== '';
    const tieneTema = pregunta.tema && 
        pregunta.tema !== 'No especificado' && 
        pregunta.tema !== 'No especificada' &&
        pregunta.tema.trim() !== '';
    const tieneAfirmacion = pregunta.afirmacion && 
        pregunta.afirmacion !== 'No especificada' && 
        pregunta.afirmacion !== 'No especificado' &&
        pregunta.afirmacion.trim() !== '';
    
    // Debug: ver qué datos de metadata llegan
    console.log('Metadata de pregunta:', {
        componente: pregunta.componente,
        competencia: pregunta.competencia,
        tema: pregunta.tema,
        afirmacion: pregunta.afirmacion
    });
    
    if (!tieneCompetencia && !tieneComponente && !tieneTema && !tieneAfirmacion) {
        return '';
    }
    
    return `
        <div class="pregunta-metadata">
            ${tieneComponente ? `
                <span class="metadata-tag componente">
                    <i class="bi bi-puzzle-fill"></i>
                    <strong>Componente:</strong> ${pregunta.componente}
                </span>
            ` : ''}
            ${tieneCompetencia ? `
                <span class="metadata-tag competencia">
                    <i class="bi bi-award-fill"></i>
                    <strong>Competencia:</strong> ${pregunta.competencia}
                </span>
            ` : ''}
            ${tieneTema ? `
                <span class="metadata-tag tema">
                    <i class="bi bi-bookmark-fill"></i>
                    <strong>Tema:</strong> ${pregunta.tema}
                </span>
            ` : ''}
            ${tieneAfirmacion ? `
                <span class="metadata-tag afirmacion">
                    <i class="bi bi-lightbulb-fill"></i>
                    <strong>Afirmación:</strong> ${pregunta.afirmacion}
                </span>
            ` : ''}
        </div>
    `;
}

// Volver de detalle de materia
function volverDeDetalleMateria() {
    // Ocultar vista de detalle
    document.getElementById('detalleMateriaView').style.display = 'none';
    
    // Mostrar tab activo
    const tabActivo = document.querySelector('.detalle-tab.active').getAttribute('data-tab');
    document.getElementById(`${tabActivo}-content`).classList.add('active');
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Mostrar error
function mostrarError(mensaje) {
    const loadingState = document.getElementById('loadingState');
    loadingState.innerHTML = `
        <div class="loading-spinner">
            <i class="bi bi-exclamation-triangle" style="animation: none; color: #ff5252;"></i>
        </div>
        <p style="color: #ff5252;">${mensaje}</p>
        <button onclick="window.location.href='Resultados.html'" style="
            margin-top: 1.5rem;
            padding: 1rem 2rem;
            background: linear-gradient(135deg, #ff0000, #cc0000);
            border: none;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            cursor: pointer;
        ">
            <i class="bi bi-arrow-left"></i> Volver a Resultados
        </button>
    `;
}

