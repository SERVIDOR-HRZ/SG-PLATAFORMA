// Resumen General - Dashboard del Coordinador
// Dashboard profesional con análisis completo de estudiantes

// Variables globales
let institucionCoordinador = null;
let todosLosEstudiantes = [];
let todasLasRespuestas = [];
let todosLosPlanes = [];
let datosAnalisis = null;

// Variables de paginación
let paginaActual = 1;
let estudiantesPorPagina = 10;
let estudiantesFiltrados = [];

// Variables para gráficos de Chart.js
let chartAsistenciaMaterias = null;
let chartTareasMaterias = null;

// Banderas para evitar cargas múltiples
let asistenciaCargada = false;
let tareasCargada = false;

// Colores de materias
const coloresMaterias = {
    'LC': '#FF4D4D',
    'MT': '#33CCFF',
    'SC': '#FF8C00',
    'CN': '#33FF77',
    'IN': '#B366FF'
};

const nombresMaterias = {
    'LC': 'Lectura Crítica',
    'MT': 'Matemáticas',
    'SC': 'Ciencias Sociales',
    'CN': 'Ciencias Naturales',
    'IN': 'Inglés'
};

const iconosMaterias = {
    'LC': 'bi-book-fill',
    'MT': 'bi-calculator-fill',
    'SC': 'bi-globe-americas',
    'CN': 'bi-tree-fill',
    'IN': 'bi-translate'
};

// Inicialización
document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacion();
    inicializarSidebar();
    inicializarTabs();
    cargarDatosUsuario();
    cargarDatosDashboard();
});

// Verificar autenticación
function verificarAutenticacion() {
    const usuarioActual = sessionStorage.getItem('currentUser');
    if (!usuarioActual) {
        window.location.href = '../index.html';
        return;
    }

    const usuario = JSON.parse(usuarioActual);
    // Aceptar tanto tipoUsuario como rol
    const esCoordinador = usuario.tipoUsuario === 'coordinador' || usuario.rol === 'coordinador';
    const esAdmin = usuario.tipoUsuario === 'admin' || usuario.rol === 'admin';

    if (!esCoordinador && !esAdmin) {
        console.error('Usuario no autorizado. Tipo:', usuario.tipoUsuario, 'Rol:', usuario.rol);
        window.location.href = 'Panel_Estudiantes.html';
        return;
    }

    console.log('✓ Usuario autorizado:', esCoordinador ? 'Coordinador' : 'Admin');
}

// Cargar datos del usuario
async function cargarDatosUsuario() {
    const usuarioActual = sessionStorage.getItem('currentUser');
    if (usuarioActual) {
        try {
            const usuario = JSON.parse(usuarioActual);

            console.log('=== CARGANDO DATOS DE USUARIO ===');
            console.log('Usuario desde sessionStorage:', usuario);

            const userNameElement = document.getElementById('coordinadorName');
            if (userNameElement && usuario.nombre) {
                userNameElement.textContent = usuario.nombre.toUpperCase();
            }

            // Intentar obtener institución de múltiples fuentes
            institucionCoordinador = usuario.institucion ||
                usuario.Institucion ||
                usuario.nombreInstitucion ||
                usuario.institution ||
                null;

            console.log('Institución desde sessionStorage:', institucionCoordinador);

            // Si no tiene institución en sessionStorage, buscar en Firebase
            if (!institucionCoordinador) {
                console.log('⚠️ No se encontró institución en sessionStorage, buscando en Firebase...');

                if (!window.firebaseDB) {
                    await esperarFirebase();
                }

                const db = window.firebaseDB;
                const usuarioDoc = await db.collection('usuarios').doc(usuario.id).get();

                if (usuarioDoc.exists) {
                    const datosUsuario = usuarioDoc.data();
                    console.log('Datos completos de Firebase:', datosUsuario);

                    // Buscar institución en todos los campos posibles
                    institucionCoordinador = datosUsuario.institucion ||
                        datosUsuario.Institucion ||
                        datosUsuario.nombreInstitucion ||
                        datosUsuario.institution ||
                        datosUsuario.nombreInstitucion ||
                        null;

                    console.log('Institución desde Firebase:', institucionCoordinador);

                    // Si aún no hay institución, mostrar todos los campos disponibles
                    if (!institucionCoordinador) {
                        console.error('❌ NO SE ENCONTRÓ INSTITUCIÓN');
                        console.log('📋 Campos disponibles en Firebase:', Object.keys(datosUsuario));
                        console.log('💡 Verifica en Firebase Console el campo correcto para la institución');
                    } else {
                        // Actualizar sessionStorage con la institución encontrada
                        usuario.institucion = institucionCoordinador;
                        sessionStorage.setItem('currentUser', JSON.stringify(usuario));
                        console.log('✓ Institución actualizada en sessionStorage');
                    }
                }
            }

            const institucionNombreEl = document.getElementById('institucionNombre');
            if (institucionNombreEl) {
                if (institucionCoordinador) {
                    institucionNombreEl.textContent = institucionCoordinador;
                    institucionNombreEl.style.color = 'rgba(255, 255, 255, 0.6)';
                    console.log('✓ Institución mostrada en UI:', institucionCoordinador);
                } else {
                    institucionNombreEl.textContent = '⚠️ Sin institución asignada - Verifica tu perfil';
                    institucionNombreEl.style.color = '#ffa500';
                    console.error('❌ No se pudo cargar la institución');
                }
            }

            await cargarFotoPerfil(usuario.id);

            console.log('=== FIN CARGA DE DATOS ===');

        } catch (error) {
            console.error('❌ Error al cargar datos del usuario:', error);
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
                const avatarDefault = document.getElementById('userAvatarDefault');
                const avatarImage = document.getElementById('userAvatarImage');

                if (avatarDefault && avatarImage) {
                    avatarDefault.style.display = 'none';
                    avatarImage.src = datosUsuario.fotoPerfil;
                    avatarImage.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar foto de perfil:', error);
    }
}

// Esperar Firebase
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

// Inicializar sidebar
function inicializarSidebar() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarPanel = document.getElementById('sidebarPanel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuToggle && sidebarPanel && sidebarOverlay) {
        mobileMenuToggle.addEventListener('click', function () {
            sidebarPanel.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', function () {
            sidebarPanel.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    }

    document.getElementById('btnProfile')?.addEventListener('click', () => {
        window.location.href = 'Perfil-Coordinador.html';
    });

    document.getElementById('btnHome')?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    document.getElementById('btnBack')?.addEventListener('click', () => {
        window.location.href = 'Panel_Coordinador.html';
    });

    document.getElementById('btnLogout')?.addEventListener('click', () => {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    });
}

// Inicializar tabs
function inicializarTabs() {
    const tabs = document.querySelectorAll('.dashboard-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');
            cambiarTab(targetTab);
        });
    });
}

function cambiarTab(tab) {
    document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.dashboard-tab[data-tab="${tab}"]`).classList.add('active');

    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`${tab}-panel`).classList.add('active');
}

// Cargar datos del dashboard
async function cargarDatosDashboard() {
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const db = window.firebaseDB;

        if (!institucionCoordinador) {
            mostrarError('No se pudo identificar la institución del coordinador. Por favor, verifica que tu perfil tenga una institución asignada.');
            return;
        }

        console.log('Cargando datos para institución:', institucionCoordinador);

        // Cargar estudiantes de la institución
        await cargarEstudiantes(db);

        // Cargar respuestas de los estudiantes
        await cargarRespuestas(db);

        // Cargar planes de estudio
        await cargarPlanes(db);

        // Analizar datos
        datosAnalisis = analizarDatos();

        // Renderizar dashboard
        renderizarDashboard();

    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        mostrarError('Error al cargar los datos: ' + error.message);
    }
}

// Cargar estudiantes
async function cargarEstudiantes(db) {
    try {
        console.log('Buscando estudiantes de la institución:', institucionCoordinador);

        const estudiantesSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .where('institucion', '==', institucionCoordinador)
            .get();

        todosLosEstudiantes = [];
        estudiantesSnapshot.forEach(doc => {
            const estudiante = doc.data();
            // Usar la misma lógica de ID que en resultados.js
            // Priorizar numeroDocumento o numeroIdentidad sobre doc.id
            const idFiltro = estudiante.numeroDocumento || estudiante.numeroIdentidad || doc.id;

            todosLosEstudiantes.push({
                id: doc.id,
                idFiltro: idFiltro,
                nombre: estudiante.nombre || 'Sin nombre',
                email: estudiante.email || '',
                documento: estudiante.numeroDocumento || estudiante.numeroIdentidad || ''
            });
        });

        console.log(`Se encontraron ${todosLosEstudiantes.length} estudiantes`);

        document.getElementById('totalEstudiantes').textContent = todosLosEstudiantes.length;

        if (todosLosEstudiantes.length === 0) {
            console.warn('No se encontraron estudiantes para esta institución');
        }
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        throw error;
    }
}

// Cargar respuestas
async function cargarRespuestas(db) {
    todasLasRespuestas = [];

    console.log('Cargando respuestas para', todosLosEstudiantes.length, 'estudiantes...');

    for (const estudiante of todosLosEstudiantes) {
        const respuestasSnapshot = await db.collection('respuestas')
            .where('estudianteId', '==', estudiante.idFiltro)
            .get();

        for (const doc of respuestasSnapshot.docs) {
            const respuesta = doc.data();

            // Verificar que tenga pruebaId
            if (!respuesta.pruebaId) {
                console.warn('Respuesta sin pruebaId:', doc.id);
                continue;
            }

            // Obtener información de la prueba
            try {
                const pruebaDoc = await db.collection('pruebas').doc(respuesta.pruebaId).get();
                if (!pruebaDoc.exists) {
                    console.warn('Prueba no encontrada:', respuesta.pruebaId);
                    continue;
                }

                const pruebaData = pruebaDoc.data();

                todasLasRespuestas.push({
                    id: doc.id,
                    estudianteId: estudiante.idFiltro,
                    estudianteNombre: estudiante.nombre,
                    pruebaId: respuesta.pruebaId,
                    pruebaNombre: pruebaData.nombre || 'Sin nombre',
                    fecha: respuesta.fechaEnvio,
                    estadisticas: respuesta.estadisticas || {},
                    respuestasEvaluadas: respuesta.respuestasEvaluadas || {}
                });
            } catch (error) {
                console.error('Error al cargar prueba:', respuesta.pruebaId, error);
            }
        }
    }

    console.log(`✓ Se cargaron ${todasLasRespuestas.length} respuestas`);
    document.getElementById('totalPruebas').textContent = todasLasRespuestas.length;
}

// Cargar planes de estudio
async function cargarPlanes(db) {
    todosLosPlanes = [];

    const planesSnapshot = await db.collection('planesEstudio').get();

    planesSnapshot.forEach(doc => {
        const plan = doc.data();

        // Verificar si el estudiante pertenece a la institución
        const estudiante = todosLosEstudiantes.find(e => e.idFiltro === plan.estudianteId);
        if (estudiante) {
            todosLosPlanes.push({
                id: doc.id,
                ...plan,
                estudianteNombre: estudiante.nombre
            });
        }
    });

    document.getElementById('totalPlanes').textContent = todosLosPlanes.length;
}

// Mapear nombres de materias a claves estándar
function mapearNombreMateriaAKey(nombreMateria) {
    const mapeo = {
        'lectura': 'LC',
        'Lectura Crítica': 'LC',
        'lecturaCritica': 'LC',
        'matematicas': 'MT',
        'Matemáticas': 'MT',
        'sociales': 'SC',
        'Ciencias Sociales': 'SC',
        'socialesCiudadanas': 'SC',
        'ciencias': 'CN',
        'Ciencias Naturales': 'CN',
        'cienciasNaturales': 'CN',
        'naturales': 'CN',
        'ingles': 'IN',
        'Inglés': 'IN',
        'LC': 'LC',
        'MT': 'MT',
        'SC': 'SC',
        'CN': 'CN',
        'IN': 'IN'
    };
    return mapeo[nombreMateria] || nombreMateria;
}

// Analizar datos
function analizarDatos() {
    console.log('=== INICIANDO ANÁLISIS DE DATOS ===');
    console.log('Estudiantes:', todosLosEstudiantes.length);
    console.log('Respuestas:', todasLasRespuestas.length);

    const analisis = {
        estudiantes: [],
        promedioGeneral: 0,
        promediosPorMateria: { LC: 0, MT: 0, SC: 0, CN: 0, IN: 0 },
        distribucion: { excelente: 0, bueno: 0, regular: 0, bajo: 0 },
        temasDificiles: [],
        estudiantesRiesgo: [],
        evolucion: []
    };

    // Analizar cada estudiante
    todosLosEstudiantes.forEach(estudiante => {
        const respuestasEstudiante = todasLasRespuestas.filter(r => r.estudianteId === estudiante.idFiltro);

        if (respuestasEstudiante.length === 0) {
            analisis.estudiantes.push({
                ...estudiante,
                promedio: 0,
                pruebas: 0,
                materias: { LC: 0, MT: 0, SC: 0, CN: 0, IN: 0 },
                tendencia: 'sin-datos'
            });
            return;
        }

        let totalCorrectas = 0;
        let totalPreguntas = 0;
        const materias = { LC: [], MT: [], SC: [], CN: [], IN: [] };
        const temas = {};

        respuestasEstudiante.forEach(respuesta => {
            // Estadísticas generales
            if (respuesta.estadisticas && typeof respuesta.estadisticas === 'object') {
                const total = respuesta.estadisticas.totalPreguntas || 0;
                const correctas = respuesta.estadisticas.respuestasCorrectas || respuesta.estadisticas.correctas || 0;
                totalPreguntas += total;
                totalCorrectas += correctas;
            }

            // Analizar por materia
            if (respuesta.respuestasEvaluadas && typeof respuesta.respuestasEvaluadas === 'object') {
                Object.keys(respuesta.respuestasEvaluadas).forEach(materiaOriginal => {
                    const respuestasMateria = respuesta.respuestasEvaluadas[materiaOriginal];

                    // Verificar que respuestasMateria sea un objeto
                    if (!respuestasMateria || typeof respuestasMateria !== 'object') {
                        return;
                    }

                    // Mapear nombre de materia a clave estándar
                    const materiaKey = mapearNombreMateriaAKey(materiaOriginal);

                    let correctasMateria = 0;
                    let totalMateria = 0;

                    Object.values(respuestasMateria).forEach(pregunta => {
                        if (!pregunta || typeof pregunta !== 'object') return;

                        totalMateria++;
                        if (pregunta.esCorrecta) {
                            correctasMateria++;
                        } else {
                            // Registrar tema con error (MEJORADO - con más información)
                            const tema = pregunta.tema || pregunta.competencia || 'Sin tema';
                            if (!temas[tema]) {
                                temas[tema] = {
                                    errores: 0,
                                    materia: materiaKey,
                                    componente: pregunta.componente || 'No especificado',
                                    competencia: pregunta.competencia || 'No especificada',
                                    afirmacion: pregunta.afirmacion || '',
                                    tema: tema
                                };
                            }
                            temas[tema].errores++;
                        }
                    });

                    if (totalMateria > 0) {
                        const porcentaje = (correctasMateria / totalMateria) * 100;
                        if (materias[materiaKey]) {
                            materias[materiaKey].push(porcentaje);
                        }
                    }
                });
            }
        });

        const promedio = totalPreguntas > 0 ? (totalCorrectas / totalPreguntas) * 100 : 0;

        // Calcular promedios por materia
        const promediosMaterias = {};
        Object.keys(materias).forEach(materia => {
            if (materias[materia].length > 0) {
                const suma = materias[materia].reduce((a, b) => a + b, 0);
                promediosMaterias[materia] = suma / materias[materia].length;
            } else {
                promediosMaterias[materia] = 0;
            }
        });

        // Calcular tendencia
        let tendencia = 'estable';
        if (respuestasEstudiante.length >= 2) {
            const ultimasDos = respuestasEstudiante.slice(-2);
            const promedio1 = calcularPromedioRespuesta(ultimasDos[0]);
            const promedio2 = calcularPromedioRespuesta(ultimasDos[1]);

            if (promedio2 > promedio1 + 5) tendencia = 'subiendo';
            else if (promedio2 < promedio1 - 5) tendencia = 'bajando';
        }

        analisis.estudiantes.push({
            ...estudiante,
            promedio: Math.round(promedio),
            pruebas: respuestasEstudiante.length,
            materias: promediosMaterias,
            tendencia,
            temas
        });

        // Distribución
        if (promedio >= 80) analisis.distribucion.excelente++;
        else if (promedio >= 60) analisis.distribucion.bueno++;
        else if (promedio >= 40) analisis.distribucion.regular++;
        else analisis.distribucion.bajo++;

        // Estudiantes en riesgo
        if (promedio < 50) {
            analisis.estudiantesRiesgo.push({
                ...estudiante,
                promedio: Math.round(promedio)
            });
        }
    });

    // Ordenar estudiantes por promedio
    analisis.estudiantes.sort((a, b) => b.promedio - a.promedio);

    // Calcular promedio general
    const sumaPromedios = analisis.estudiantes.reduce((sum, e) => sum + e.promedio, 0);
    analisis.promedioGeneral = analisis.estudiantes.length > 0
        ? Math.round(sumaPromedios / analisis.estudiantes.length)
        : 0;

    // Calcular promedios por materia
    ['LC', 'MT', 'SC', 'CN', 'IN'].forEach(materia => {
        const promedios = analisis.estudiantes
            .map(e => e.materias[materia] || 0)
            .filter(p => p > 0);

        if (promedios.length > 0) {
            const suma = promedios.reduce((a, b) => a + b, 0);
            analisis.promediosPorMateria[materia] = Math.round(suma / promedios.length);
        } else {
            analisis.promediosPorMateria[materia] = 0;
        }
    });

    // Identificar temas más difíciles (MEJORADO - con más información)
    const todosLosTemas = {};
    analisis.estudiantes.forEach(est => {
        if (est.temas && typeof est.temas === 'object') {
            Object.keys(est.temas).forEach(tema => {
                if (!todosLosTemas[tema]) {
                    todosLosTemas[tema] = {
                        tema,
                        errores: 0,
                        materia: est.temas[tema].materia,
                        componente: est.temas[tema].componente || 'No especificado',
                        competencia: est.temas[tema].competencia || 'No especificada',
                        afirmacion: est.temas[tema].afirmacion || ''
                    };
                }
                todosLosTemas[tema].errores += est.temas[tema].errores;
            });
        }
    });

    analisis.temasDificiles = Object.values(todosLosTemas)
        .sort((a, b) => b.errores - a.errores)
        .slice(0, 5);

    console.log('=== ANÁLISIS COMPLETADO ===');
    console.log('Promedio general:', analisis.promedioGeneral);
    console.log('Promedios por materia:', analisis.promediosPorMateria);
    console.log('Distribución:', analisis.distribucion);

    return analisis;
}

function calcularPromedioRespuesta(respuesta) {
    if (!respuesta || !respuesta.estadisticas) return 0;
    const total = respuesta.estadisticas.totalPreguntas || 0;
    const correctas = respuesta.estadisticas.respuestasCorrectas || respuesta.estadisticas.correctas || 0;
    return total > 0 ? (correctas / total) * 100 : 0;
}

// Renderizar dashboard
function renderizarDashboard() {
    // Actualizar estadísticas del header
    document.getElementById('promedioGeneral').textContent = datosAnalisis.promedioGeneral + '%';

    // Renderizar cada sección
    renderizarTopEstudiantes();
    renderizarDistribucion();
    renderizarTablaRanking();
    renderizarGraficoMaterias();
    renderizarAnalisisMaterias();
    renderizarRankingsPorMateria();
    renderizarTemasDificiles();
    renderizarEstudiantesRiesgo();
    renderizarPlanesActivos();
    // renderizarRecomendaciones(); // Comentado - no se usa
    renderizarGraficoEvolucion();
    renderizarGraficoRadar();
    renderizarEstadisticasAvanzadas();
    renderizarComparativaInstituciones(); // Solo tabla de ranking, sin gráfica

    // Configurar búsqueda
    document.getElementById('searchRanking')?.addEventListener('input', filtrarTablaRanking);
}

// Renderizar Top 5 Estudiantes
function renderizarTopEstudiantes() {
    const container = document.getElementById('topEstudiantes');
    const top5 = datosAnalisis.estudiantes.slice(0, 5);

    if (top5.length === 0) {
        container.innerHTML = '<p class="no-data">No hay datos disponibles</p>';
        return;
    }

    container.innerHTML = top5.map((est, index) => {
        const medalla = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
        return `
            <div class="ranking-item">
                <div class="ranking-position">${medalla || (index + 1)}</div>
                <div class="ranking-info">
                    <div class="ranking-name">${est.nombre}</div>
                    <div class="ranking-meta">${est.pruebas} prueba(s)</div>
                </div>
                <div class="ranking-score ${getScoreClass(est.promedio)}">${est.promedio}%</div>
            </div>
        `;
    }).join('');
}

function getScoreClass(promedio) {
    if (promedio >= 80) return 'excelente';
    if (promedio >= 60) return 'bueno';
    if (promedio >= 40) return 'regular';
    return 'bajo';
}

// Renderizar distribución con Chart.js
function renderizarDistribucion() {
    const ctx = document.getElementById('chartDistribucion');
    if (!ctx) return;

    const dist = datosAnalisis.distribucion;

    document.getElementById('countExcelente').textContent = dist.excelente;
    document.getElementById('countBueno').textContent = dist.bueno;
    document.getElementById('countRegular').textContent = dist.regular;
    document.getElementById('countBajo').textContent = dist.bajo;

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Excelente', 'Bueno', 'Regular', 'Bajo'],
            datasets: [{
                data: [dist.excelente, dist.bueno, dist.regular, dist.bajo],
                backgroundColor: ['#33ff77', '#33ccff', '#ffa500', '#ff4d4d'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Renderizar tabla de ranking completa con paginación
function renderizarTablaRanking() {
    estudiantesFiltrados = [...datosAnalisis.estudiantes];
    paginaActual = 1;
    renderizarPaginaRanking();
}

function renderizarPaginaRanking() {
    const tbody = document.getElementById('tablaRankingBody');

    if (estudiantesFiltrados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center">No hay datos disponibles</td></tr>';
        actualizarPaginacion(0);
        return;
    }

    // Calcular índices
    const inicio = (paginaActual - 1) * estudiantesPorPagina;
    const fin = inicio + estudiantesPorPagina;
    const estudiantesPagina = estudiantesFiltrados.slice(inicio, fin);

    // Renderizar filas
    tbody.innerHTML = estudiantesPagina.map((est, index) => {
        const posicionGlobal = inicio + index + 1;
        return `
            <tr>
                <td><strong>${posicionGlobal}</strong></td>
                <td>${est.nombre}</td>
                <td>${est.pruebas}</td>
                <td><span class="badge ${getScoreClass(est.promedio)}">${est.promedio}%</span></td>
                <td>${Math.round(est.materias.LC || 0)}%</td>
                <td>${Math.round(est.materias.MT || 0)}%</td>
                <td>${Math.round(est.materias.SC || 0)}%</td>
                <td>${Math.round(est.materias.CN || 0)}%</td>
                <td>${Math.round(est.materias.IN || 0)}%</td>
                <td><i class="bi bi-arrow-${est.tendencia === 'subiendo' ? 'up' : est.tendencia === 'bajando' ? 'down' : 'right'}" style="color: ${est.tendencia === 'subiendo' ? '#33ff77' : est.tendencia === 'bajando' ? '#ff4d4d' : '#ffa500'}"></i></td>
            </tr>
        `;
    }).join('');

    // Actualizar controles de paginación
    actualizarPaginacion(estudiantesFiltrados.length);
}

function actualizarPaginacion(totalEstudiantes) {
    const totalPaginas = Math.ceil(totalEstudiantes / estudiantesPorPagina);
    const paginacionContainer = document.getElementById('paginacionRanking');

    if (!paginacionContainer) return;

    if (totalPaginas <= 1) {
        paginacionContainer.style.display = 'none';
        return;
    }

    paginacionContainer.style.display = 'flex';

    let html = `
        <button class="btn-paginacion" onclick="cambiarPagina(${paginaActual - 1})" ${paginaActual === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i> Anterior
        </button>
        <div class="paginacion-info">
            Página <strong>${paginaActual}</strong> de <strong>${totalPaginas}</strong>
            <span class="separador">|</span>
            Mostrando <strong>${Math.min((paginaActual - 1) * estudiantesPorPagina + 1, totalEstudiantes)}</strong> - <strong>${Math.min(paginaActual * estudiantesPorPagina, totalEstudiantes)}</strong> de <strong>${totalEstudiantes}</strong>
        </div>
        <button class="btn-paginacion" onclick="cambiarPagina(${paginaActual + 1})" ${paginaActual === totalPaginas ? 'disabled' : ''}>
            Siguiente <i class="bi bi-chevron-right"></i>
        </button>
    `;

    paginacionContainer.innerHTML = html;
}

window.cambiarPagina = function (nuevaPagina) {
    const totalPaginas = Math.ceil(estudiantesFiltrados.length / estudiantesPorPagina);

    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;

    paginaActual = nuevaPagina;
    renderizarPaginaRanking();

    // Scroll suave a la tabla
    document.getElementById('tablaRanking').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

function filtrarTablaRanking() {
    const searchTerm = document.getElementById('searchRanking').value.toLowerCase();

    if (searchTerm === '') {
        estudiantesFiltrados = [...datosAnalisis.estudiantes];
    } else {
        estudiantesFiltrados = datosAnalisis.estudiantes.filter(est =>
            est.nombre.toLowerCase().includes(searchTerm) ||
            est.documento.toLowerCase().includes(searchTerm)
        );
    }

    paginaActual = 1;
    renderizarPaginaRanking();
}

// Renderizar gráfico de materias
function renderizarGraficoMaterias() {
    const ctx = document.getElementById('chartMaterias');
    if (!ctx) return;

    const promedios = datosAnalisis.promediosPorMateria;

    console.log('📊 Renderizando gráfico de materias:', promedios);

    const materiasOrden = [
        { key: 'LC', nombre: 'Lectura Crítica', color: '#FF4D4D', gradient: ['#FF6B6B', '#FF4D4D'] },
        { key: 'MT', nombre: 'Matemáticas', color: '#33CCFF', gradient: ['#5DDBFF', '#33CCFF'] },
        { key: 'SC', nombre: 'Sociales', color: '#FF8C00', gradient: ['#FFB347', '#FF8C00'] },
        { key: 'CN', nombre: 'Ciencias', color: '#33FF77', gradient: ['#5FFF99', '#33FF77'] },
        { key: 'IN', nombre: 'Inglés', color: '#B366FF', gradient: ['#CC8FFF', '#B366FF'] }
    ];

    const labels = [];
    const data = [];
    const backgroundColors = [];

    // Crear gradientes para cada barra
    materiasOrden.forEach(materia => {
        const valor = promedios[materia.key] || 0;
        labels.push(materia.nombre);
        data.push(valor);

        // Crear gradiente
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, materia.gradient[0]);
        gradient.addColorStop(1, materia.gradient[1]);
        backgroundColors.push(gradient);
    });

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Promedio',
                data: data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                borderRadius: 12,
                borderSkipped: false,
                barPercentage: 0.7,
                categoryPercentage: 0.8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart',
                delay: (context) => {
                    return context.dataIndex * 150;
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            size: 12,
                            weight: '500'
                        },
                        callback: function (value) {
                            return value + '%';
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        lineWidth: 1
                    },
                    border: {
                        display: false
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.9)',
                        font: {
                            size: 13,
                            weight: '600'
                        }
                    },
                    grid: {
                        display: false
                    },
                    border: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 16,
                        weight: 'bold'
                    },
                    callbacks: {
                        title: function (context) {
                            return context[0].label;
                        },
                        label: function (context) {
                            return 'Promedio: ' + context.parsed.y + '%';
                        }
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            onHover: (event, activeElements) => {
                event.native.target.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
            }
        }
    });
}

// Renderizar análisis de materias
function renderizarAnalisisMaterias() {
    const promedios = datosAnalisis.promediosPorMateria;

    // SIEMPRE usar todas las materias, sin filtrar por promedio
    const todasLasMaterias = ['LC', 'MT', 'SC', 'CN', 'IN'];

    console.log('📊 Análisis de materias (TODAS):', promedios);

    // Ordenar materias por promedio (de mayor a menor)
    const materiasOrdenadas = todasLasMaterias
        .map(key => ({
            key,
            promedio: promedios[key] || 0,
            nombre: nombresMaterias[key]
        }))
        .sort((a, b) => b.promedio - a.promedio);

    console.log('📊 Materias ordenadas:', materiasOrdenadas);

    // Materia más fuerte (la primera)
    const materiaFuerte = materiasOrdenadas[0];

    // Materias más débiles: SOLO las que están por debajo del 75%
    const materiasDebiles = materiasOrdenadas
        .filter(m => m.promedio < 75)
        .sort((a, b) => a.promedio - b.promedio) // Ordenar de menor a mayor (más débil primero)
        .slice(0, 3); // Máximo 3

    console.log('✅ Materia más fuerte:', materiaFuerte);
    console.log('⚠️ Materias más débiles (<75%):', materiasDebiles);

    // Renderizar materia más fuerte
    document.getElementById('materiaFuerte').textContent = materiaFuerte.nombre;
    document.getElementById('promedioFuerte').textContent = Math.round(materiaFuerte.promedio) + '%';

    // Renderizar materias más débiles
    const containerDebil = document.querySelector('.analysis-item.debil > div');
    if (containerDebil) {
        if (materiasDebiles.length === 0) {
            // Si no hay materias débiles, mostrar mensaje positivo
            containerDebil.innerHTML = `
                <span class="label">Materias a mejorar</span>
                <h4 style="margin: 0.5rem 0; color: #33ff77;">¡Excelente!</h4>
                <span class="value" style="display: block; color: rgba(255,255,255,0.7);">Todas las materias están por encima del 75%</span>
            `;
        } else {
            // Mostrar materias débiles
            containerDebil.innerHTML = `
                <span class="label">Materia${materiasDebiles.length > 1 ? 's' : ''} más débil${materiasDebiles.length > 1 ? 'es' : ''}</span>
                ${materiasDebiles.map(materia => `
                    <h4 style="margin: 0.3rem 0;">${materia.nombre}</h4>
                    <span class="value" style="display: block; margin-bottom: 0.5rem;">${Math.round(materia.promedio)}%</span>
                `).join('')}
            `;
        }
    }
}

// Renderizar rankings por materia
function renderizarRankingsPorMateria() {
    ['LC', 'MT', 'SC', 'CN', 'IN'].forEach(materia => {
        const container = document.getElementById(`ranking${materia}`);
        if (!container) return;

        // INCLUIR TODOS los estudiantes, incluso con 0%
        const ranking = datosAnalisis.estudiantes
            .map(e => ({
                ...e,
                promedioMateria: e.materias[materia] || 0
            }))
            .sort((a, b) => b.promedioMateria - a.promedioMateria)
            .slice(0, 5);

        if (ranking.length === 0) {
            container.innerHTML = '<p class="no-data">Sin datos</p>';
            return;
        }

        container.innerHTML = ranking.map((est, index) => `
            <div class="mini-ranking-item">
                <span class="position">${index + 1}</span>
                <span class="name">${est.nombre}</span>
                <span class="score">${Math.round(est.promedioMateria)}%</span>
            </div>
        `).join('');
    });
}

// Variable global para almacenar todos los temas
let todosTemasDificiles = [];

// Renderizar temas difíciles (MEJORADO - con filtro por materia)
function renderizarTemasDificiles() {
    const container = document.getElementById('temasDificiles');

    // Guardar todos los temas si aún no están guardados
    if (todosTemasDificiles.length === 0) {
        todosTemasDificiles = [...datosAnalisis.temasDificiles];
    }

    if (todosTemasDificiles.length === 0) {
        container.innerHTML = '<p class="no-data">No hay datos suficientes</p>';
        return;
    }

    // Agregar event listener al filtro
    const filtro = document.getElementById('filtroMateriaTemas');
    if (filtro && !filtro.hasAttribute('data-listener')) {
        filtro.setAttribute('data-listener', 'true');
        filtro.addEventListener('change', filtrarTemasPorMateria);
    }

    // Obtener materia seleccionada
    const materiaSeleccionada = filtro ? filtro.value : 'todas';

    // Filtrar temas según materia seleccionada
    const temasFiltrados = materiaSeleccionada === 'todas'
        ? todosTemasDificiles
        : todosTemasDificiles.filter(t => t.materia === materiaSeleccionada);

    if (temasFiltrados.length === 0) {
        container.innerHTML = '<p class="no-data">No hay temas difíciles en esta materia</p>';
        return;
    }

    container.innerHTML = temasFiltrados.map(tema => {
        const color = coloresMaterias[tema.materia] || '#999';
        const nombreMateria = nombresMaterias[tema.materia] || tema.materia;
        const icono = iconosMaterias[tema.materia] || 'bi-book';

        return `
            <div class="tema-dificil-item" data-materia="${tema.materia}">
                <div class="tema-icon" style="background: ${color};">
                    <i class="bi ${icono}"></i>
                </div>
                <div class="tema-info">
                    <div class="tema-nombre">${tema.tema}</div>
                    <div class="tema-meta">
                        <span class="tema-materia-badge" style="background: ${color};">
                            ${nombreMateria}
                        </span>
                        ${tema.componente && tema.componente !== 'No especificado' ? `
                            <span class="tema-detalle-badge">
                                <i class="bi bi-puzzle"></i> ${tema.componente}
                            </span>
                        ` : ''}
                        ${tema.competencia && tema.competencia !== 'No especificada' ? `
                            <span class="tema-detalle-badge">
                                <i class="bi bi-award"></i> ${tema.competencia}
                            </span>
                        ` : ''}
                    </div>
                    ${tema.afirmacion && tema.afirmacion !== '' ? `
                        <div class="tema-afirmacion">
                            <i class="bi bi-info-circle"></i>
                            <span>${tema.afirmacion}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="tema-errores">
                    <span class="tema-errores-numero">${tema.errores}</span>
                    <span class="tema-errores-label">errores</span>
                </div>
            </div>
        `;
    }).join('');
}

// Filtrar temas por materia
function filtrarTemasPorMateria() {
    renderizarTemasDificiles();
}

// Renderizar estudiantes en riesgo
function renderizarEstudiantesRiesgo() {
    const container = document.getElementById('estudiantesRiesgo');

    if (datosAnalisis.estudiantesRiesgo.length === 0) {
        container.innerHTML = '<div class="success-message"><i class="bi bi-check-circle-fill"></i> ¡Excelente! No hay estudiantes en riesgo</div>';
        return;
    }

    container.innerHTML = datosAnalisis.estudiantesRiesgo.map(est => `
        <div class="estudiante-riesgo-item">
            <div class="estudiante-avatar">${est.nombre.charAt(0)}</div>
            <div class="estudiante-info">
                <div class="estudiante-nombre">${est.nombre}</div>
                <div class="estudiante-promedio">Promedio: ${est.promedio}%</div>
            </div>
            <button class="btn-accion" onclick="verDetalleEstudiante('${est.idFiltro}')">
                <i class="bi bi-eye"></i>
            </button>
        </div>
    `).join('');
}

// Renderizar planes activos (MEJORADO - más profesional)
function renderizarPlanesActivos() {
    const container = document.getElementById('planesActivos');
    const countEl = document.getElementById('countPlanesActivos');

    if (todosLosPlanes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-x"></i>
                <p>No hay planes de estudio activos</p>
                <small>Los planes aparecerán aquí cuando se creen</small>
            </div>
        `;
        countEl.textContent = '0 planes';
        return;
    }

    countEl.textContent = `${todosLosPlanes.length} plan(es)`;

    container.innerHTML = todosLosPlanes.slice(0, 6).map(plan => {
        const totalSesiones = plan.sesiones ? plan.sesiones.length : 0;
        const sesionesCompletadas = plan.sesiones ? plan.sesiones.filter(s => s.completada).length : 0;
        const progreso = totalSesiones > 0 ? Math.round((sesionesCompletadas / totalSesiones) * 100) : 0;

        // Determinar color según progreso
        let colorProgreso = '#ff4d4d';
        if (progreso >= 75) colorProgreso = '#33ff77';
        else if (progreso >= 50) colorProgreso = '#33ccff';
        else if (progreso >= 25) colorProgreso = '#ffa500';

        return `
            <div class="plan-card-mejorado">
                <div class="plan-header-mejorado">
                    <div class="plan-avatar-mejorado">${plan.estudianteNombre.charAt(0).toUpperCase()}</div>
                    <div class="plan-info-mejorado">
                        <div class="plan-nombre-mejorado">${plan.estudianteNombre}</div>
                        <div class="plan-meta-mejorado">
                            <span><i class="bi bi-calendar3"></i> ${totalSesiones} sesiones</span>
                            <span><i class="bi bi-check-circle"></i> ${sesionesCompletadas} completadas</span>
                        </div>
                    </div>
                </div>
                <div class="plan-progreso-mejorado">
                    <div class="progreso-info">
                        <span class="progreso-label">Progreso</span>
                        <span class="progreso-porcentaje" style="color: ${colorProgreso};">${progreso}%</span>
                    </div>
                    <div class="progreso-barra-mejorado">
                        <div class="progreso-fill-mejorado" style="width: ${progreso}%; background: ${colorProgreso};"></div>
                    </div>
                </div>
                <div class="plan-footer-mejorado">
                    <button class="btn-plan-detalle" onclick="verPlanEstudio('${plan.id}')">
                        <i class="bi bi-eye"></i> Ver detalles
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Ver plan de estudio
window.verPlanEstudio = function (planId) {
    // Buscar el plan en los datos
    const plan = todosLosPlanes.find(p => p.id === planId);

    if (!plan) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se encontró el plan de estudio',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#ff0000'
        });
        return;
    }

    // Redirigir a la página de plan de estudio con los parámetros necesarios
    // Agregamos adminView=true para indicar que es vista de coordinador/admin
    // Agregamos fromResumen=true para indicar que viene desde Resumen-General
    const url = `Plan-Estudio.html?pruebaId=${plan.pruebaId}&estudianteId=${encodeURIComponent(plan.estudianteId)}&planId=${planId}&adminView=true&fromResumen=true`;
    window.location.href = url;
};

// Renderizar recomendaciones (MEJORADO - más inteligente)
function renderizarRecomendaciones() {
    const container = document.getElementById('recomendacionesList');
    const countEl = document.getElementById('countRecomendaciones');
    const recomendaciones = [];

    // 1. Recomendación URGENTE por estudiantes en riesgo crítico (< 40%)
    const estudiantesCriticos = datosAnalisis.estudiantesRiesgo.filter(e => e.promedio < 40);
    if (estudiantesCriticos.length > 0) {
        recomendaciones.push({
            tipo: 'urgente',
            prioridad: 1,
            icono: 'bi-exclamation-octagon-fill',
            titulo: 'Atención Urgente Requerida',
            texto: `${estudiantesCriticos.length} estudiante(s) con promedio crítico (< 40%). Requiere intervención inmediata.`,
            accion: 'Ver estudiantes',
            onClick: () => cambiarTab('mejoras')
        });
    }

    // 2. Recomendación por estudiantes en riesgo moderado (40-50%)
    const estudiantesRiesgo = datosAnalisis.estudiantesRiesgo.filter(e => e.promedio >= 40 && e.promedio < 50);
    if (estudiantesRiesgo.length > 0) {
        recomendaciones.push({
            tipo: 'importante',
            prioridad: 2,
            icono: 'bi-exclamation-triangle-fill',
            titulo: 'Estudiantes en Riesgo',
            texto: `${estudiantesRiesgo.length} estudiante(s) con promedio entre 40-50%. Considera crear planes de refuerzo.`,
            accion: 'Crear plan',
            onClick: () => window.location.href = 'Plan-Estudio.html'
        });
    }

    // 3. Recomendación por materias débiles (< 60%)
    const promedios = datosAnalisis.promediosPorMateria;
    const materiasDebiles = Object.keys(promedios)
        .filter(m => promedios[m] < 60 && promedios[m] > 0)
        .sort((a, b) => promedios[a] - promedios[b]);

    if (materiasDebiles.length > 0) {
        const materiasMasDebiles = materiasDebiles.slice(0, 2);
        recomendaciones.push({
            tipo: 'importante',
            prioridad: 3,
            icono: 'bi-bookmark-star-fill',
            titulo: 'Reforzar Materias Débiles',
            texto: `${materiasMasDebiles.map(m => nombresMaterias[m]).join(' y ')} ${materiasDebiles.length > 1 ? 'tienen' : 'tiene'} promedios bajos. Considera sesiones de refuerzo.`,
            accion: 'Ver materias',
            onClick: () => cambiarTab('materias')
        });
    }

    // 4. Recomendación por temas específicos difíciles
    if (datosAnalisis.temasDificiles.length > 0) {
        const top3Temas = datosAnalisis.temasDificiles.slice(0, 3);
        const totalErrores = top3Temas.reduce((sum, t) => sum + t.errores, 0);
        recomendaciones.push({
            tipo: 'info',
            prioridad: 4,
            icono: 'bi-lightbulb-fill',
            titulo: 'Temas que Requieren Atención',
            texto: `${top3Temas.length} tema(s) presentan ${totalErrores} errores en total. Crea material de apoyo específico.`,
            accion: 'Ver temas',
            onClick: () => cambiarTab('mejoras')
        });
    }

    // 5. Recomendación por planes sin completar
    const planesSinCompletar = todosLosPlanes.filter(p => {
        const totalSesiones = p.sesiones ? p.sesiones.length : 0;
        const completadas = p.sesiones ? p.sesiones.filter(s => s.completada).length : 0;
        const progreso = totalSesiones > 0 ? (completadas / totalSesiones) * 100 : 0;
        return progreso < 50;
    });

    if (planesSinCompletar.length > 0) {
        recomendaciones.push({
            tipo: 'advertencia',
            prioridad: 5,
            icono: 'bi-calendar-x',
            titulo: 'Planes de Estudio Pendientes',
            texto: `${planesSinCompletar.length} plan(es) con menos del 50% de progreso. Motiva a los estudiantes a completarlos.`,
            accion: 'Ver planes',
            onClick: () => cambiarTab('mejoras')
        });
    }

    // 6. Recomendación positiva por buen rendimiento
    if (datosAnalisis.promedioGeneral >= 70) {
        const estudiantesExcelentes = datosAnalisis.estudiantes.filter(e => e.promedio >= 80).length;
        recomendaciones.push({
            tipo: 'exito',
            prioridad: 10,
            icono: 'bi-trophy-fill',
            titulo: '¡Excelente Rendimiento!',
            texto: `Promedio general de ${datosAnalisis.promedioGeneral}% con ${estudiantesExcelentes} estudiante(s) destacado(s). ¡Sigue así!`,
            accion: 'Ver ranking',
            onClick: () => cambiarTab('ranking')
        });
    }

    // 7. Recomendación por mejora en tendencia
    const estudiantesMejorando = datosAnalisis.estudiantes.filter(e => e.tendencia === 'subiendo').length;
    if (estudiantesMejorando > 0) {
        recomendaciones.push({
            tipo: 'exito',
            prioridad: 11,
            icono: 'bi-graph-up-arrow',
            titulo: 'Tendencia Positiva',
            texto: `${estudiantesMejorando} estudiante(s) muestran mejora en sus últimas pruebas. ¡Reconoce su esfuerzo!`,
            accion: 'Ver progreso',
            onClick: () => cambiarTab('ranking')
        });
    }

    // Ordenar por prioridad
    recomendaciones.sort((a, b) => a.prioridad - b.prioridad);

    // Actualizar contador
    if (countEl) {
        countEl.textContent = recomendaciones.length;
    }

    if (recomendaciones.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-check-circle"></i>
                <p>No hay recomendaciones en este momento</p>
                <small>Todo está funcionando correctamente</small>
            </div>
        `;
        return;
    }

    container.innerHTML = recomendaciones.map(rec => `
        <div class="recomendacion-item-mejorada ${rec.tipo}">
            <div class="recomendacion-icon">
                <i class="bi ${rec.icono}"></i>
            </div>
            <div class="recomendacion-content">
                <div class="recomendacion-titulo">${rec.titulo}</div>
                <p class="recomendacion-texto">${rec.texto}</p>
            </div>
            ${rec.accion ? `
                <button class="recomendacion-btn" onclick="(${rec.onClick.toString()})()">
                    ${rec.accion} <i class="bi bi-arrow-right"></i>
                </button>
            ` : ''}
        </div>
    `).join('');
}

// Renderizar gráfico de evolución
function renderizarGraficoEvolucion() {
    const ctx = document.getElementById('chartEvolucion');
    if (!ctx) return;

    // Agrupar respuestas por fecha
    const respuestasPorFecha = {};
    todasLasRespuestas.forEach(resp => {
        if (!resp.fecha) return;
        const fecha = resp.fecha.toDate();
        const fechaStr = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!respuestasPorFecha[fechaStr]) {
            respuestasPorFecha[fechaStr] = { total: 0, correctas: 0 };
        }

        if (resp.estadisticas) {
            respuestasPorFecha[fechaStr].total += resp.estadisticas.totalPreguntas || 0;
            respuestasPorFecha[fechaStr].correctas += resp.estadisticas.respuestasCorrectas || resp.estadisticas.correctas || 0;
        }
    });

    const fechas = Object.keys(respuestasPorFecha).sort();
    const promedios = fechas.map(fecha => {
        const datos = respuestasPorFecha[fecha];
        return datos.total > 0 ? Math.round((datos.correctas / datos.total) * 100) : 0;
    });

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: fechas.map(f => {
                const [year, month] = f.split('-');
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                return `${meses[parseInt(month) - 1]} ${year}`;
            }),
            datasets: [{
                label: 'Promedio',
                data: promedios,
                borderColor: '#ff0000',
                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#fff' },
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#fff' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Renderizar comparativa entre instituciones
async function renderizarComparativaInstituciones() {
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const db = window.firebaseDB;

        console.log('=== CARGANDO COMPARATIVA DE INSTITUCIONES ===');

        // 1. Cargar todas las instituciones únicas de los estudiantes
        const estudiantesSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        const institucionesDatos = {};

        estudiantesSnapshot.forEach(doc => {
            const estudiante = doc.data();
            const institucion = estudiante.institucion;

            if (institucion && institucion.trim()) {
                if (!institucionesDatos[institucion]) {
                    institucionesDatos[institucion] = {
                        nombre: institucion,
                        estudiantes: [],
                        totalRespuestas: 0,
                        totalCorrectas: 0,
                        totalPreguntas: 0
                    };
                }

                institucionesDatos[institucion].estudiantes.push({
                    id: doc.id,
                    idFiltro: estudiante.numeroDocumento || estudiante.numeroIdentidad || doc.id,
                    nombre: estudiante.nombre
                });
            }
        });

        console.log('Instituciones encontradas:', Object.keys(institucionesDatos));

        // 2. Cargar respuestas de cada institución
        for (const institucion in institucionesDatos) {
            const datos = institucionesDatos[institucion];

            for (const estudiante of datos.estudiantes) {
                const respuestasSnapshot = await db.collection('respuestas')
                    .where('estudianteId', '==', estudiante.idFiltro)
                    .get();

                respuestasSnapshot.forEach(doc => {
                    const respuesta = doc.data();
                    datos.totalRespuestas++;

                    if (respuesta.estadisticas) {
                        const total = respuesta.estadisticas.totalPreguntas || 0;
                        const correctas = respuesta.estadisticas.respuestasCorrectas || respuesta.estadisticas.correctas || 0;

                        datos.totalPreguntas += total;
                        datos.totalCorrectas += correctas;
                    }
                });
            }

            // Calcular promedio
            datos.promedio = datos.totalPreguntas > 0
                ? Math.round((datos.totalCorrectas / datos.totalPreguntas) * 100)
                : 0;
        }

        // 3. Convertir a array y FILTRAR instituciones sin datos
        const institucionesArray = Object.values(institucionesDatos)
            .filter(inst => {
                // Solo incluir instituciones que tengan:
                // - Al menos 1 estudiante
                // - Al menos 1 respuesta/prueba
                // - Promedio mayor a 0
                return inst.estudiantes.length > 0 &&
                    inst.totalRespuestas > 0 &&
                    inst.promedio > 0;
            })
            .sort((a, b) => b.promedio - a.promedio);

        console.log('Instituciones con datos válidos:', institucionesArray);

        // 4. Verificar si hay suficientes datos
        if (institucionesArray.length === 0) {
            mostrarMensajeSinDatos();
            return;
        }

        // 5. Tomar solo el TOP 5
        const top5Instituciones = institucionesArray.slice(0, 5);

        // 6. Renderizar gráfico comparativo (dona/pie)
        renderizarGraficoComparativaInstituciones(top5Instituciones);

        // 7. Renderizar tabla de posiciones (solo top 5)
        renderizarTablaPosicionesInstituciones(top5Instituciones, institucionesArray.length);

    } catch (error) {
        console.error('Error al cargar comparativa de instituciones:', error);
        mostrarMensajeSinDatos();
    }
}

// Mostrar mensaje cuando no hay datos suficientes
function mostrarMensajeSinDatos() {
    const chartContainer = document.getElementById('chartComparativaInstituciones');
    const tablaContainer = document.getElementById('tablaPosicionesInstituciones');

    const mensaje = `
        <div class="no-data-comparativa">
            <i class="bi bi-info-circle"></i>
            <h3>Datos Insuficientes</h3>
            <p>No hay suficientes instituciones con pruebas realizadas para generar una comparativa.</p>
            <small>Se necesitan al menos 2 instituciones con estudiantes y pruebas completadas.</small>
        </div>
    `;

    if (chartContainer) {
        chartContainer.parentElement.innerHTML = mensaje;
    }
    if (tablaContainer) {
        tablaContainer.innerHTML = '';
    }
}

// Renderizar gráfico de comparativa entre instituciones (DONA/PIE)
function renderizarGraficoComparativaInstituciones(instituciones) {
    // FUNCIÓN DESHABILITADA - Solo se usa la tabla de ranking
    console.log('Gráfico de comparativa deshabilitado por solicitud del usuario');
    return;
}

// Renderizar tabla de posiciones de instituciones (TOP 5)
function renderizarTablaPosicionesInstituciones(top5Instituciones, totalInstituciones) {
    const container = document.getElementById('tablaPosicionesInstituciones');
    if (!container) return;

    if (top5Instituciones.length === 0) {
        container.innerHTML = '<p class="no-data">No hay datos suficientes</p>';
        return;
    }

    // Encontrar posición de la institución actual
    const posicionActual = top5Instituciones.findIndex(inst => inst.nombre === institucionCoordinador) + 1;
    const institucionActual = top5Instituciones.find(inst => inst.nombre === institucionCoordinador);

    // Si la institución actual no está en el top 5, buscarla en todas
    const mensajePosicion = posicionActual > 0
        ? `Tu institución está en la posición <strong>#${posicionActual}</strong> del TOP ${top5Instituciones.length}`
        : `Tu institución no está en el TOP ${top5Instituciones.length}`;

    container.innerHTML = `
        ${institucionActual ? `
            <div class="posicion-actual-card">
                <div class="posicion-badge">
                    <i class="bi bi-trophy-fill"></i>
                    <span class="posicion-numero">#${posicionActual}</span>
                </div>
                <div class="posicion-info">
                    <h4>${institucionCoordinador}</h4>
                    <p>${mensajePosicion}</p>
                    <div class="posicion-stats">
                        <span><i class="bi bi-graph-up"></i> ${institucionActual.promedio}% promedio</span>
                        <span><i class="bi bi-people"></i> ${institucionActual.estudiantes.length} estudiantes</span>
                        <span><i class="bi bi-clipboard-check"></i> ${institucionActual.totalRespuestas} pruebas</span>
                    </div>
                </div>
            </div>
        ` : `
            <div class="posicion-actual-card sin-datos">
                <div class="posicion-badge">
                    <i class="bi bi-info-circle"></i>
                </div>
                <div class="posicion-info">
                    <h4>${institucionCoordinador}</h4>
                    <p>Tu institución aún no tiene suficientes datos para aparecer en el ranking</p>
                    <small>Completa más pruebas para ver tu posición</small>
                </div>
            </div>
        `}
        
        <div class="ranking-instituciones">
            <h4><i class="bi bi-list-ol"></i> TOP ${top5Instituciones.length} Instituciones</h4>
            <p class="ranking-subtitle">Instituciones con mejor rendimiento académico</p>
            ${top5Instituciones.map((inst, index) => {
        const esActual = inst.nombre === institucionCoordinador;
        const medalla = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';

        return `
                    <div class="institucion-item ${esActual ? 'actual' : ''}">
                        <div class="institucion-posicion">
                            ${medalla || `#${index + 1}`}
                        </div>
                        <div class="institucion-info">
                            <div class="institucion-nombre">
                                ${inst.nombre} 
                                ${esActual ? '<span class="badge-tu-institucion">Tu Institución</span>' : ''}
                            </div>
                            <div class="institucion-meta">
                                <i class="bi bi-people-fill"></i> ${inst.estudiantes.length} estudiantes • 
                                <i class="bi bi-clipboard-check-fill"></i> ${inst.totalRespuestas} pruebas • 
                                <i class="bi bi-question-circle-fill"></i> ${inst.totalPreguntas} preguntas
                            </div>
                        </div>
                        <div class="institucion-promedio ${getScoreClass(inst.promedio)}">
                            ${inst.promedio}%
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
        
        ${totalInstituciones > 5 ? `
            <div class="ranking-footer">
                <i class="bi bi-info-circle"></i>
                Mostrando TOP 5 de ${totalInstituciones} instituciones con datos
            </div>
        ` : ''}
    `;
}

// Renderizar gráfico radar
function renderizarGraficoRadar() {
    const ctx = document.getElementById('chartRadar');
    if (!ctx) return;

    const promedios = datosAnalisis.promediosPorMateria;

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Lectura Crítica', 'Matemáticas', 'Sociales', 'Ciencias', 'Inglés'],
            datasets: [{
                label: 'Promedio Institucional',
                data: [promedios.LC, promedios.MT, promedios.SC, promedios.CN, promedios.IN],
                borderColor: '#ff0000',
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                pointBackgroundColor: '#ff0000',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#ff0000'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { color: '#fff', backdropColor: 'transparent' },
                    grid: { color: 'rgba(255,255,255,0.1)' },
                    pointLabels: { color: '#fff' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Renderizar estadísticas avanzadas
function renderizarEstadisticasAvanzadas() {
    const promedios = datosAnalisis.estudiantes.map(e => e.promedio).filter(p => p > 0);

    if (promedios.length === 0) {
        document.getElementById('statMediana').textContent = '0%';
        document.getElementById('statDesviacion').textContent = '0';
        document.getElementById('statMejor').textContent = '0%';
        document.getElementById('statPeor').textContent = '0%';
        return;
    }

    // Mediana
    const sorted = [...promedios].sort((a, b) => a - b);
    const mediana = sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];

    // Desviación estándar
    const media = promedios.reduce((a, b) => a + b, 0) / promedios.length;
    const varianza = promedios.reduce((sum, p) => sum + Math.pow(p - media, 2), 0) / promedios.length;
    const desviacion = Math.sqrt(varianza);

    // Mejor y peor
    const mejor = Math.max(...promedios);
    const peor = Math.min(...promedios);

    document.getElementById('statMediana').textContent = Math.round(mediana) + '%';
    document.getElementById('statDesviacion').textContent = desviacion.toFixed(2);
    document.getElementById('statMejor').textContent = Math.round(mejor) + '%';
    document.getElementById('statPeor').textContent = Math.round(peor) + '%';
}

// Ver detalle de estudiante
window.verDetalleEstudiante = function (estudianteId) {
    // Guardar flag para volver a resumen general
    sessionStorage.setItem('volverAResumenGeneral', 'true');
    sessionStorage.setItem('estudianteIdSeleccionado', estudianteId);

    // Redirigir a resultados con el estudiante seleccionado
    window.location.href = `Resultados.html?estudianteId=${encodeURIComponent(estudianteId)}`;
};

// Mostrar error
function mostrarError(mensaje) {
    console.error('ERROR:', mensaje);

    const mainContent = document.querySelector('.main-panel-content');
    if (mainContent) {
        mainContent.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 60vh;
                text-align: center;
                padding: 2rem;
            ">
                <i class="bi bi-exclamation-triangle" style="font-size: 5rem; color: #ff4d4d; margin-bottom: 1.5rem; animation: pulse 2s infinite;"></i>
                <h2 style="color: white; margin-bottom: 1rem; font-size: 2rem;">Error al cargar datos</h2>
                <p style="color: rgba(255,255,255,0.7); margin-bottom: 1rem; max-width: 600px; line-height: 1.6;">${mensaje}</p>
                
                <div style="background: rgba(255, 165, 0, 0.1); border: 1px solid rgba(255, 165, 0, 0.3); border-radius: 12px; padding: 1.5rem; margin: 2rem 0; max-width: 600px;">
                    <h3 style="color: #ffa500; margin-bottom: 1rem; font-size: 1.2rem;">
                        <i class="bi bi-lightbulb-fill"></i> ¿Cómo solucionar esto?
                    </h3>
                    <ol style="color: rgba(255,255,255,0.8); text-align: left; line-height: 1.8; padding-left: 1.5rem;">
                        <li>Ve a <strong style="color: white;">Mi Perfil</strong> usando el botón del panel lateral</li>
                        <li>Verifica que el campo <strong style="color: white;">Institución</strong> esté lleno</li>
                        <li>Si está vacío, contacta al administrador del sistema</li>
                        <li>Vuelve a esta página después de verificar</li>
                    </ol>
                </div>
                
                <div style="display: flex; gap: 1rem; flex-wrap: wrap; justify-content: center;">
                    <button onclick="location.reload()" style="
                        padding: 1rem 2rem;
                        background: linear-gradient(135deg, #ff0000, #cc0000);
                        border: none;
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 20px rgba(255,0,0,0.4)'" onmouseout="this.style.transform=''; this.style.boxShadow=''">
                        <i class="bi bi-arrow-clockwise"></i> Reintentar
                    </button>
                    
                    <button onclick="window.location.href='Perfil-Coordinador.html'" style="
                        padding: 1rem 2rem;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.transform=''">
                        <i class="bi bi-person-gear"></i> Ir a Mi Perfil
                    </button>
                    
                    <button onclick="window.location.href='Panel_Coordinador.html'" style="
                        padding: 1rem 2rem;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.2);
                        border-radius: 12px;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 1rem;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        transition: all 0.3s ease;
                    " onmouseover="this.style.background='rgba(255, 255, 255, 0.15)'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'; this.style.transform=''">
                        <i class="bi bi-arrow-left"></i> Volver al Panel
                    </button>
                </div>
            </div>
            
            <style>
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.05); }
                }
            </style>
        `;
    }
}

// ============================================
// FUNCIONES PARA ASISTENCIA
// ============================================

// Cargar datos de asistencia cuando se activa el tab
document.addEventListener('DOMContentLoaded', function () {
    const asistenciaTab = document.querySelector('.dashboard-tab[data-tab="asistencia"]');
    if (asistenciaTab) {
        asistenciaTab.addEventListener('click', cargarDatosAsistencia);
    }

    // Setup filtro de materia para asistencia
    const filtroMateriaAsistencia = document.getElementById('filtroMateriaAsistencia');
    if (filtroMateriaAsistencia) {
        filtroMateriaAsistencia.addEventListener('change', filtrarAsistenciaPorMateria);
    }

    // Setup botón de exportar asistencia
    const btnExportAsistencia = document.getElementById('btnExportAsistencia');
    if (btnExportAsistencia) {
        btnExportAsistencia.addEventListener('click', exportarAsistencia);
    }
});

async function cargarDatosAsistencia() {
    // Evitar cargas múltiples
    if (asistenciaCargada) {
        console.log('⚠️ Asistencias ya cargadas, omitiendo...');
        return;
    }

    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const db = window.firebaseDB;

        if (!institucionCoordinador) {
            mostrarError('No se pudo identificar la institución');
            return;
        }

        console.log('=== CARGANDO ASISTENCIAS ===');
        console.log('📍 Institución:', institucionCoordinador);
        console.log('👥 Total estudiantes:', todosLosEstudiantes.length);

        // Obtener todas las asistencias de estudiantes de la institución
        const asistenciasData = [];
        let totalRegistrosEncontrados = 0;

        for (const estudiante of todosLosEstudiantes) {
            // Buscar asistencias por estudiante (colección singular: asistencia)
            const asistenciasSnapshot = await db.collection('asistencia')
                .where('estudianteId', '==', estudiante.id)
                .get();

            totalRegistrosEncontrados += asistenciasSnapshot.size;

            if (asistenciasSnapshot.size > 0) {
                console.log(`✓ ${estudiante.nombre}: ${asistenciasSnapshot.size} registro(s)`);
            }

            asistenciasSnapshot.forEach(doc => {
                const asistencia = doc.data();

                // Validar que tenga el campo presente
                if (asistencia.presente === undefined || asistencia.presente === null) {
                    console.warn('⚠️ Registro sin campo "presente":', doc.id);
                }

                asistenciasData.push({
                    id: doc.id,
                    estudianteId: estudiante.idFiltro,
                    estudianteNombre: estudiante.nombre,
                    materia: asistencia.materia || 'Sin materia',
                    fecha: asistencia.fechaRegistro || asistencia.fecha,
                    presente: asistencia.presente, // boolean: true = presente, false = ausente
                    aulaId: asistencia.aulaId || null,
                    claseId: asistencia.claseId || null
                });
            });
        }

        console.log('📊 Total registros encontrados:', totalRegistrosEncontrados);
        console.log('📋 Registros procesados:', asistenciasData.length);

        if (asistenciasData.length === 0) {
            console.warn('⚠️ No se encontraron registros de asistencia');
            // Mostrar mensaje en la UI
            const container = document.getElementById('tablaAsistenciaBody');
            if (container) {
                container.innerHTML = `
                    <tr>
                        <td colspan="6" class="text-center" style="padding: 2rem;">
                            <i class="bi bi-info-circle" style="font-size: 3rem; color: #ffa500; margin-bottom: 1rem;"></i>
                            <p style="color: rgba(255,255,255,0.7);">No hay registros de asistencia disponibles</p>
                            <small style="color: rgba(255,255,255,0.5);">Los registros aparecerán aquí cuando se tomen asistencias</small>
                        </td>
                    </tr>
                `;
            }
            asistenciaCargada = true;
            return;
        }

        // Procesar datos de asistencia
        const resumen = procesarDatosAsistencia(asistenciasData);

        // Renderizar resumen
        renderizarResumenAsistencia(resumen);

        // Renderizar gráfico
        renderizarGraficoAsistenciaMaterias(resumen.porMateria);

        // Renderizar tabla
        renderizarTablaAsistencia(resumen.porEstudiante);

        // Marcar como cargada
        asistenciaCargada = true;

        console.log('✅ Asistencias cargadas correctamente');

    } catch (error) {
        console.error('❌ Error al cargar datos de asistencia:', error);
        mostrarError('Error al cargar asistencia: ' + error.message);
    }
}

function procesarDatosAsistencia(asistenciasData) {
    const resumen = {
        totalAsistencias: 0,
        totalFaltas: 0,
        totalTardanzas: 0, // Mantener para compatibilidad pero siempre será 0
        porcentaje: 0,
        porMateria: {},
        porEstudiante: []
    };

    // Inicializar materias
    ['LC', 'MT', 'SC', 'CN', 'IN'].forEach(materia => {
        resumen.porMateria[materia] = {
            asistencias: 0,
            faltas: 0,
            tardanzas: 0, // Siempre 0
            total: 0
        };
    });

    console.log('📊 Procesando', asistenciasData.length, 'registros de asistencia...');

    // Procesar cada asistencia
    asistenciasData.forEach(asistencia => {
        const materiaKey = mapearNombreMateriaAKey(asistencia.materia);

        // DEBUG: Ver estructura de cada asistencia
        if (asistenciasData.indexOf(asistencia) < 3) {
            console.log('Ejemplo de asistencia:', {
                estudiante: asistencia.estudianteNombre,
                materia: asistencia.materia,
                presente: asistencia.presente,
                tipo: typeof asistencia.presente
            });
        }

        // presente es un booleano: true = presente, false = ausente
        if (asistencia.presente === true) {
            resumen.totalAsistencias++;
            if (resumen.porMateria[materiaKey]) {
                resumen.porMateria[materiaKey].asistencias++;
                resumen.porMateria[materiaKey].total++;
            }
        } else if (asistencia.presente === false) {
            resumen.totalFaltas++;
            if (resumen.porMateria[materiaKey]) {
                resumen.porMateria[materiaKey].faltas++;
                resumen.porMateria[materiaKey].total++;
            }
        } else {
            // Si presente no es booleano, registrar advertencia
            console.warn('⚠️ Valor inesperado para presente:', asistencia.presente, 'en', asistencia);
        }
    });

    // Calcular porcentaje general
    const totalClases = resumen.totalAsistencias + resumen.totalFaltas;
    resumen.porcentaje = totalClases > 0
        ? Math.round((resumen.totalAsistencias / totalClases) * 100)
        : 0;

    console.log('📈 Totales generales:', {
        asistencias: resumen.totalAsistencias,
        faltas: resumen.totalFaltas,
        porcentaje: resumen.porcentaje + '%'
    });

    // Procesar por estudiante y materia
    const estudiantesMap = {};

    asistenciasData.forEach(asistencia => {
        const materiaKey = mapearNombreMateriaAKey(asistencia.materia);
        const key = `${asistencia.estudianteId}_${materiaKey}`;

        if (!estudiantesMap[key]) {
            estudiantesMap[key] = {
                estudianteId: asistencia.estudianteId,
                estudianteNombre: asistencia.estudianteNombre,
                materia: materiaKey,
                asistencias: 0,
                faltas: 0,
                tardanzas: 0, // Siempre 0
                total: 0
            };
        }

        if (asistencia.presente === true) {
            estudiantesMap[key].asistencias++;
            estudiantesMap[key].total++;
        } else if (asistencia.presente === false) {
            estudiantesMap[key].faltas++;
            estudiantesMap[key].total++;
        }
    });

    resumen.porEstudiante = Object.values(estudiantesMap);

    console.log('👥 Estudiantes procesados:', resumen.porEstudiante.length);
    console.log('📊 Resumen por materia:', resumen.porMateria);

    return resumen;
}

function renderizarResumenAsistencia(resumen) {
    console.log('📊 Renderizando resumen de asistencia:', resumen);

    const totalAsistenciasEl = document.getElementById('totalAsistencias');
    const totalFaltasEl = document.getElementById('totalFaltas');
    const porcentajeAsistenciaEl = document.getElementById('porcentajeAsistencia');

    // Validar que los elementos existan antes de actualizar
    if (!totalAsistenciasEl || !totalFaltasEl || !porcentajeAsistenciaEl) {
        console.error('❌ Elementos del DOM no encontrados:', {
            totalAsistencias: !!totalAsistenciasEl,
            totalFaltas: !!totalFaltasEl,
            porcentajeAsistencia: !!porcentajeAsistenciaEl
        });
        return;
    }

    // Actualizar valores
    totalAsistenciasEl.textContent = resumen.totalAsistencias;
    totalFaltasEl.textContent = resumen.totalFaltas;
    porcentajeAsistenciaEl.textContent = resumen.porcentaje + '%';

    console.log('✅ Resumen de asistencia renderizado:', {
        asistencias: resumen.totalAsistencias,
        faltas: resumen.totalFaltas,
        porcentaje: resumen.porcentaje + '%'
    });
}

function renderizarGraficoAsistenciaMaterias(porMateria) {
    const ctx = document.getElementById('chartAsistenciaMaterias');
    if (!ctx) {
        console.error('❌ Canvas chartAsistenciaMaterias no encontrado');
        return;
    }

    // Destruir gráfico existente si existe
    if (chartAsistenciaMaterias) {
        chartAsistenciaMaterias.destroy();
        chartAsistenciaMaterias = null;
    }

    const materias = ['LC', 'MT', 'SC', 'CN', 'IN'];
    const asistencias = materias.map(m => porMateria[m]?.asistencias || 0);
    const faltas = materias.map(m => porMateria[m]?.faltas || 0);

    // Verificar si hay datos
    const hayDatos = asistencias.some(a => a > 0) || faltas.some(f => f > 0);

    if (!hayDatos) {
        console.log('ℹ️ No hay datos para el gráfico de asistencia por materias');
        // Mostrar mensaje en lugar del gráfico
        const container = ctx.parentElement;
        if (container) {
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 300px; color: rgba(255,255,255,0.6);">
                    <i class="bi bi-bar-chart" style="font-size: 4rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No hay datos de asistencia por materias</p>
                </div>
            `;
        }
        return;
    }

    console.log('📊 Creando gráfico de asistencia por materias');

    chartAsistenciaMaterias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: materias.map(m => nombresMaterias[m]),
            datasets: [
                {
                    label: 'Asistencias',
                    data: asistencias,
                    backgroundColor: '#4CAF50',
                    borderRadius: 8
                },
                {
                    label: 'Faltas',
                    data: faltas,
                    backgroundColor: '#F44336',
                    borderRadius: 8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 12 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 12 }
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: { size: 13 }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1
                }
            }
        }
    });

    console.log('✅ Gráfico de asistencia por materias creado');
}

function renderizarTablaAsistencia(porEstudiante) {
    const tbody = document.getElementById('tablaAsistenciaBody');

    if (!tbody) {
        console.error('❌ Elemento tablaAsistenciaBody no encontrado en el DOM');
        return;
    }

    if (porEstudiante.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 2rem;">
                    <i class="bi bi-info-circle" style="font-size: 3rem; color: #ffa500; margin-bottom: 1rem; display: block;"></i>
                    <p style="color: rgba(255,255,255,0.7); margin: 0;">No hay datos de asistencia disponibles</p>
                    <small style="color: rgba(255,255,255,0.5); display: block; margin-top: 0.5rem;">Los registros aparecerán aquí cuando se tomen asistencias</small>
                </td>
            </tr>
        `;
        console.log('ℹ️ Tabla de asistencia vacía renderizada');
        return;
    }

    console.log('📋 Renderizando', porEstudiante.length, 'registros en la tabla');

    tbody.innerHTML = porEstudiante.map(item => {
        const porcentaje = item.total > 0
            ? Math.round((item.asistencias / item.total) * 100)
            : 0;

        let porcentajeClass = 'bajo';
        if (porcentaje >= 90) porcentajeClass = 'excelente';
        else if (porcentaje >= 75) porcentajeClass = 'bueno';
        else if (porcentaje >= 60) porcentajeClass = 'regular';

        return `
            <tr>
                <td>${item.estudianteNombre}</td>
                <td>${nombresMaterias[item.materia] || item.materia}</td>
                <td>${item.asistencias}</td>
                <td>${item.faltas}</td>
                <td>${item.total}</td>
                <td><span class="asistencia-porcentaje ${porcentajeClass}">${porcentaje}%</span></td>
            </tr>
        `;
    }).join('');

    console.log('✅ Tabla de asistencia renderizada correctamente');
}

function filtrarAsistenciaPorMateria() {
    const filtro = document.getElementById('filtroMateriaAsistencia').value;
    const tbody = document.getElementById('tablaAsistenciaBody');
    const filas = tbody.querySelectorAll('tr');

    filas.forEach(fila => {
        if (filtro === 'todas') {
            fila.style.display = '';
        } else {
            const materia = fila.cells[1]?.textContent || '';
            const materiaKey = Object.keys(nombresMaterias).find(k => nombresMaterias[k] === materia);
            fila.style.display = materiaKey === filtro ? '' : 'none';
        }
    });
}

function exportarAsistencia() {
    // Implementar exportación a CSV o Excel
    alert('Función de exportación en desarrollo');
}

// ============================================
// FUNCIONES PARA TAREAS
// ============================================

// Cargar datos de tareas cuando se activa el tab
document.addEventListener('DOMContentLoaded', function () {
    const tareasTab = document.querySelector('.dashboard-tab[data-tab="tareas"]');
    if (tareasTab) {
        tareasTab.addEventListener('click', cargarDatosTareas);
    }

    // Setup filtro de materia para tareas
    const filtroMateriaTareas = document.getElementById('filtroMateriaTareas');
    if (filtroMateriaTareas) {
        filtroMateriaTareas.addEventListener('change', filtrarTareasPorMateria);
    }

    // Setup botón de exportar tareas
    const btnExportTareas = document.getElementById('btnExportTareas');
    if (btnExportTareas) {
        btnExportTareas.addEventListener('click', exportarTareas);
    }
});

async function cargarDatosTareas() {
    // Evitar cargas múltiples
    if (tareasCargada) {
        return;
    }

    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const db = window.firebaseDB;

        if (!institucionCoordinador) {
            mostrarError('No se pudo identificar la institución');
            return;
        }

        console.log('=== CARGANDO TAREAS ===');
        console.log('Institución:', institucionCoordinador);
        console.log('Total estudiantes:', todosLosEstudiantes.length);

        // Obtener todas las tareas
        const tareasSnapshot = await db.collection('tareas').get();
        const todasLasTareas = [];

        tareasSnapshot.forEach(doc => {
            todasLasTareas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('Total tareas en BD:', todasLasTareas.length);

        // Obtener entregas de estudiantes de la institución
        const tareasData = [];

        for (const estudiante of todosLosEstudiantes) {
            const entregasSnapshot = await db.collection('entregas')
                .where('estudianteId', '==', estudiante.id)
                .get();

            console.log(`Entregas de ${estudiante.nombre}:`, entregasSnapshot.size);

            entregasSnapshot.forEach(doc => {
                const entrega = doc.data();
                const tarea = todasLasTareas.find(t => t.id === entrega.tareaId);

                if (tarea) {
                    tareasData.push({
                        id: doc.id,
                        estudianteId: estudiante.idFiltro,
                        estudianteNombre: estudiante.nombre,
                        tareaId: entrega.tareaId,
                        tareaNombre: tarea.titulo || 'Sin título',
                        materia: tarea.materia || 'Sin materia',
                        fechaEntrega: tarea.fechaEntrega,
                        fechaEnvio: entrega.fechaEnvio,
                        calificacion: entrega.calificacion,
                        puntosMaximos: tarea.puntos || 100,
                        estado: entrega.calificacion !== undefined && entrega.calificacion !== null ? 'calificada' : 'revision'
                    });
                } else {
                    console.warn('Tarea no encontrada para entrega:', entrega.tareaId);
                }
            });

            // Agregar tareas no entregadas
            todasLasTareas.forEach(tarea => {
                const entregada = tareasData.some(t =>
                    t.estudianteId === estudiante.idFiltro && t.tareaId === tarea.id
                );

                if (!entregada) {
                    const ahora = new Date();
                    const fechaEntrega = tarea.fechaEntrega ? (tarea.fechaEntrega.toDate ? tarea.fechaEntrega.toDate() : new Date(tarea.fechaEntrega)) : null;
                    const vencida = fechaEntrega && fechaEntrega < ahora;

                    tareasData.push({
                        id: `no-entregada-${estudiante.idFiltro}-${tarea.id}`,
                        estudianteId: estudiante.idFiltro,
                        estudianteNombre: estudiante.nombre,
                        tareaId: tarea.id,
                        tareaNombre: tarea.titulo || 'Sin título',
                        materia: tarea.materia || 'Sin materia',
                        fechaEntrega: tarea.fechaEntrega,
                        fechaEnvio: null,
                        calificacion: null,
                        puntosMaximos: tarea.puntos || 100,
                        estado: vencida ? 'vencida' : 'pendiente'
                    });
                }
            });
        }

        console.log('Total registros de tareas (entregadas + no entregadas):', tareasData.length);
        console.log('Tareas entregadas:', tareasData.filter(t => t.estado === 'calificada' || t.estado === 'revision').length);
        console.log('Tareas pendientes:', tareasData.filter(t => t.estado === 'pendiente' || t.estado === 'vencida').length);

        // Procesar datos de tareas
        const resumen = procesarDatosTareas(tareasData);

        console.log('Resumen procesado:', resumen);

        // Renderizar resumen
        renderizarResumenTareas(resumen);

        // Renderizar gráfico
        renderizarGraficoTareasMaterias(resumen.porMateria);

        // Renderizar tabla
        renderizarTablaTareas(tareasData);

        // Marcar como cargada
        tareasCargada = true;

    } catch (error) {
        console.error('Error al cargar datos de tareas:', error);
        mostrarError('Error al cargar tareas: ' + error.message);
    }
}

function procesarDatosTareas(tareasData) {
    const resumen = {
        totalTareas: 0,
        totalEntregadas: 0,
        totalPendientes: 0,
        promedio: 0,
        porMateria: {}
    };

    // Inicializar materias
    ['LC', 'MT', 'SC', 'CN', 'IN'].forEach(materia => {
        resumen.porMateria[materia] = {
            total: 0,
            entregadas: 0,
            pendientes: 0,
            calificadas: 0
        };
    });

    let sumaCalificaciones = 0;
    let totalCalificadas = 0;

    // Procesar cada tarea
    tareasData.forEach(tarea => {
        const materiaKey = mapearNombreMateriaAKey(tarea.materia);

        resumen.totalTareas++;

        if (resumen.porMateria[materiaKey]) {
            resumen.porMateria[materiaKey].total++;
        }

        if (tarea.estado === 'calificada') {
            resumen.totalEntregadas++;
            if (resumen.porMateria[materiaKey]) {
                resumen.porMateria[materiaKey].entregadas++;
                resumen.porMateria[materiaKey].calificadas++;
            }

            if (tarea.calificacion !== null && tarea.calificacion !== undefined) {
                const porcentaje = (tarea.calificacion / tarea.puntosMaximos) * 100;
                sumaCalificaciones += porcentaje;
                totalCalificadas++;
            }
        } else if (tarea.estado === 'revision') {
            resumen.totalEntregadas++;
            if (resumen.porMateria[materiaKey]) {
                resumen.porMateria[materiaKey].entregadas++;
            }
        } else {
            resumen.totalPendientes++;
            if (resumen.porMateria[materiaKey]) {
                resumen.porMateria[materiaKey].pendientes++;
            }
        }
    });

    // Calcular promedio general
    resumen.promedio = totalCalificadas > 0
        ? Math.round(sumaCalificaciones / totalCalificadas)
        : 0;

    return resumen;
}

function renderizarResumenTareas(resumen) {
    document.getElementById('totalTareas').textContent = resumen.totalTareas;
    document.getElementById('totalTareasEntregadas').textContent = resumen.totalEntregadas;
    document.getElementById('totalTareasPendientes').textContent = resumen.totalPendientes;
    document.getElementById('promedioTareas').textContent = resumen.promedio + '%';
}

function renderizarGraficoTareasMaterias(porMateria) {
    const ctx = document.getElementById('chartTareasMaterias');
    if (!ctx) return;

    // Destruir gráfico existente si existe
    if (chartTareasMaterias) {
        chartTareasMaterias.destroy();
    }

    const materias = ['LC', 'MT', 'SC', 'CN', 'IN'];
    const entregadas = materias.map(m => porMateria[m]?.entregadas || 0);
    const pendientes = materias.map(m => porMateria[m]?.pendientes || 0);

    chartTareasMaterias = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: materias.map(m => nombresMaterias[m]),
            datasets: [
                {
                    label: 'Entregadas',
                    data: entregadas,
                    backgroundColor: '#4CAF50'
                },
                {
                    label: 'Pendientes',
                    data: pendientes,
                    backgroundColor: '#FF9800'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: 'rgba(255, 255, 255, 0.7)' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            },
            plugins: {
                legend: {
                    labels: { color: 'rgba(255, 255, 255, 0.8)' }
                }
            }
        }
    });
}

function renderizarTablaTareas(tareasData) {
    const tbody = document.getElementById('tablaTareasBody');

    if (tareasData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay datos de tareas disponibles</td></tr>';
        return;
    }

    tbody.innerHTML = tareasData.map(tarea => {
        const fechaEntrega = tarea.fechaEntrega
            ? (tarea.fechaEntrega.toDate ? tarea.fechaEntrega.toDate() : new Date(tarea.fechaEntrega))
            : null;

        const fechaFormateada = fechaEntrega
            ? fechaEntrega.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Sin fecha';

        let estadoHTML = '';
        let calificacionHTML = '';

        if (tarea.estado === 'calificada') {
            estadoHTML = '<span class="tarea-estado entregada">Calificada</span>';
            const porcentaje = (tarea.calificacion / tarea.puntosMaximos) * 100;
            let calificacionClass = 'baja';
            if (porcentaje >= 90) calificacionClass = 'excelente';
            else if (porcentaje >= 70) calificacionClass = 'buena';
            else if (porcentaje >= 50) calificacionClass = 'regular';

            calificacionHTML = `<span class="tarea-calificacion ${calificacionClass}">${tarea.calificacion}/${tarea.puntosMaximos}</span>`;
        } else if (tarea.estado === 'revision') {
            estadoHTML = '<span class="tarea-estado revision">En revisión</span>';
            calificacionHTML = '<span class="tarea-calificacion sin-calificar">Pendiente</span>';
        } else if (tarea.estado === 'vencida') {
            estadoHTML = '<span class="tarea-estado vencida">Vencida</span>';
            calificacionHTML = '<span class="tarea-calificacion sin-calificar">-</span>';
        } else {
            estadoHTML = '<span class="tarea-estado pendiente">Pendiente</span>';
            calificacionHTML = '<span class="tarea-calificacion sin-calificar">-</span>';
        }

        return `
            <tr>
                <td>${tarea.estudianteNombre}</td>
                <td>${nombresMaterias[mapearNombreMateriaAKey(tarea.materia)] || tarea.materia}</td>
                <td>${tarea.tareaNombre}</td>
                <td>${fechaFormateada}</td>
                <td>${estadoHTML}</td>
                <td>${calificacionHTML}</td>
            </tr>
        `;
    }).join('');
}

function filtrarTareasPorMateria() {
    const filtro = document.getElementById('filtroMateriaTareas').value;
    const tbody = document.getElementById('tablaTareasBody');
    const filas = tbody.querySelectorAll('tr');

    filas.forEach(fila => {
        if (filtro === 'todas') {
            fila.style.display = '';
        } else {
            const materia = fila.cells[1]?.textContent || '';
            const materiaKey = Object.keys(nombresMaterias).find(k => nombresMaterias[k] === materia);
            fila.style.display = materiaKey === filtro ? '' : 'none';
        }
    });
}

function exportarTareas() {
    // Implementar exportación a CSV o Excel
    alert('Función de exportación en desarrollo');
}
