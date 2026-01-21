// Plan de Estudio - JavaScript
// Funcionalidad para el plan de estudio personalizado

// Variables globales
let datosResultados = null;
let temasAReforzar = [];
let sesionesEstudio = [];
let mesActual = new Date();
let diaSeleccionado = null;
let configuracionHorario = {
    horasPorDia: 2,
    diasDisponibles: [1, 2, 3, 4, 5], // Lun-Vie
    momentoPreferido: 'manana',
    fechaLimite: null
};

// Colores por materia
const coloresMaterias = {
    'LC': '#FF4D4D',
    'MT': '#33CCFF',
    'SC': '#FF8C00',
    'CN': '#33FF77',
    'IN': '#B366FF',
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
    'lectura': 'bi-book-fill',
    'matematicas': 'bi-calculator-fill',
    'sociales': 'bi-globe-americas',
    'ciencias': 'bi-tree-fill',
    'ingles': 'bi-translate'
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacion();
    cargarDatosUsuario();
    inicializarSidebar();
    inicializarReloj();
    inicializarTabs();
    inicializarConfiguracion();
    cargarDatosDesdeURL();
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
            
            const sidebarUserName = document.getElementById('sidebarUserName');
            if (sidebarUserName && usuario.nombre) {
                sidebarUserName.textContent = usuario.nombre.toUpperCase();
            }
            
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
                const sidebarAvatarDefault = document.getElementById('sidebarAvatarDefault');
                const sidebarAvatarImage = document.getElementById('sidebarAvatarImage');
                
                if (sidebarAvatarDefault && sidebarAvatarImage) {
                    sidebarAvatarDefault.style.display = 'none';
                    sidebarAvatarImage.src = datosUsuario.fotoPerfil;
                    sidebarAvatarImage.style.display = 'block';
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

// Inicializar sidebar móvil
function inicializarSidebar() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarPanel = document.getElementById('sidebarPanel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuToggle && sidebarPanel && sidebarOverlay) {
        mobileMenuToggle.addEventListener('click', function() {
            sidebarPanel.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
        });

        sidebarOverlay.addEventListener('click', function() {
            sidebarPanel.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
        });
    }

    // Botones del sidebar
    document.getElementById('btnProfile')?.addEventListener('click', () => {
        window.location.href = 'panelUsuario.html';
    });

    document.getElementById('btnHome')?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    document.getElementById('btnBack')?.addEventListener('click', () => {
        window.location.href = 'Resultados.html';
    });

    document.getElementById('btnLogout')?.addEventListener('click', async () => {
        if (typeof Swal !== 'undefined') {
            const result = await Swal.fire({
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
            });
            
            if (result.isConfirmed) {
                sessionStorage.removeItem('currentUser');
                window.location.href = '../index.html';
            }
        }
    });
}

// Inicializar reloj
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
        dateElement.textContent = `${diaSemana}, ${dia} de ${mes} de ${año}`;
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

// Inicializar tabs
function inicializarTabs() {
    const tabs = document.querySelectorAll('.plan-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            cambiarTab(targetTab);
        });
    });
}

function cambiarTab(tab) {
    document.querySelectorAll('.plan-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.plan-tab[data-tab="${tab}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tab}-content`).classList.add('active');
    
    if (tab === 'calendario') {
        renderizarCalendario();
    }
}

// Inicializar configuración de horario
function inicializarConfiguracion() {
    // Selector de horas
    document.querySelectorAll('.horas-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.horas-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            configuracionHorario.horasPorDia = parseInt(this.dataset.horas);
        });
    });

    // Selector de días
    document.querySelectorAll('.dia-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            this.classList.toggle('active');
            const dia = parseInt(this.dataset.dia);
            if (this.classList.contains('active')) {
                if (!configuracionHorario.diasDisponibles.includes(dia)) {
                    configuracionHorario.diasDisponibles.push(dia);
                }
            } else {
                configuracionHorario.diasDisponibles = configuracionHorario.diasDisponibles.filter(d => d !== dia);
            }
        });
    });

    // Selector de momento
    document.querySelectorAll('.momento-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.momento-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            configuracionHorario.momentoPreferido = this.dataset.momento;
        });
    });

    // Fecha límite
    const fechaLimiteInput = document.getElementById('fechaLimite');
    if (fechaLimiteInput) {
        // Establecer fecha mínima como hoy
        const hoy = new Date().toISOString().split('T')[0];
        fechaLimiteInput.min = hoy;
        
        // Establecer fecha por defecto (2 semanas)
        const dosSemanasDate = new Date();
        dosSemanasDate.setDate(dosSemanasDate.getDate() + 14);
        fechaLimiteInput.value = dosSemanasDate.toISOString().split('T')[0];
        configuracionHorario.fechaLimite = dosSemanasDate;
        
        fechaLimiteInput.addEventListener('change', function() {
            configuracionHorario.fechaLimite = new Date(this.value);
        });
    }

    // Botón generar plan
    document.getElementById('btnGenerarPlan')?.addEventListener('click', generarPlanEstudio);
    
    // Botón editar configuración
    document.getElementById('btnEditarConfig')?.addEventListener('click', async () => {
        const result = await Swal.fire({
            title: '¿Editar configuración?',
            text: 'Podrás generar un nuevo plan de estudio con diferentes opciones.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#ff0000',
            cancelButtonColor: '#666',
            confirmButtonText: 'Sí, editar',
            cancelButtonText: 'Cancelar',
            background: '#1a1a1a',
            color: '#fff'
        });
        
        if (result.isConfirmed) {
            // Mostrar configuración
            document.getElementById('planGenerado').style.display = 'none';
            document.querySelector('.horario-config').style.display = 'block';
            
            // Restaurar selecciones visuales de la configuración actual
            restaurarSeleccionesVisuales();
        }
    });

    // Navegación del calendario
    document.getElementById('mesAnterior')?.addEventListener('click', () => {
        mesActual.setMonth(mesActual.getMonth() - 1);
        renderizarCalendario();
    });

    document.getElementById('mesSiguiente')?.addEventListener('click', () => {
        mesActual.setMonth(mesActual.getMonth() + 1);
        renderizarCalendario();
    });

    // Modal de sesión
    document.getElementById('cerrarModalSesion')?.addEventListener('click', cerrarModalSesion);
    document.getElementById('cancelarSesion')?.addEventListener('click', cerrarModalSesion);
    document.getElementById('guardarSesion')?.addEventListener('click', guardarSesion);
    
    document.getElementById('modalSesion')?.addEventListener('click', function(e) {
        if (e.target === this) {
            cerrarModalSesion();
        }
    });
}

// Cargar datos desde URL
async function cargarDatosDesdeURL() {
    const params = new URLSearchParams(window.location.search);
    const pruebaId = params.get('pruebaId');
    const adminView = params.get('adminView') === 'true';
    const estudianteIdParam = params.get('estudianteId');
    const planIdParam = params.get('planId');
    
    if (!pruebaId) {
        mostrarError('No se especificó una prueba. Vuelve a la sección de resultados.');
        return;
    }
    
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        
        // Si es vista de admin y hay un planId, cargar el plan directamente
        if (adminView && planIdParam) {
            await cargarPlanExistenteAdmin(db, planIdParam);
            return;
        }
        
        // Obtener datos de la prueba
        const pruebaDoc = await db.collection('pruebas').doc(pruebaId).get();
        if (!pruebaDoc.exists) {
            throw new Error('No se encontró la prueba');
        }
        
        const pruebaData = pruebaDoc.data();
        
        // Actualizar información de la prueba
        document.getElementById('nombrePrueba').textContent = pruebaData.nombre || 'Prueba';
        
        // Determinar el estudianteId a usar
        let estudianteId;
        if (adminView && estudianteIdParam) {
            // Admin viendo plan de otro estudiante
            estudianteId = estudianteIdParam;
        } else {
            // Usuario viendo su propio plan
            const usuario = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            estudianteId = usuario.numeroDocumento || usuario.numeroIdentidad || usuario.id;
        }
        
        const respuestasSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .where('estudianteId', '==', estudianteId)
            .get();
        
        if (respuestasSnapshot.empty) {
            throw new Error('No se encontraron respuestas para esta prueba');
        }
        
        // Obtener la fecha de la última respuesta
        let fechaRealizacion = null;
        respuestasSnapshot.forEach(doc => {
            const respuesta = doc.data();
            if (respuesta.fechaEnvio) {
                fechaRealizacion = respuesta.fechaEnvio;
            }
        });
        
        if (fechaRealizacion) {
            document.getElementById('fechaPrueba').textContent = formatearFecha(fechaRealizacion.toDate());
        }
        
        // Consolidar respuestas
        const respuestasConsolidadas = {};
        respuestasSnapshot.forEach(doc => {
            const respuesta = doc.data();
            if (respuesta.respuestasEvaluadas) {
                Object.keys(respuesta.respuestasEvaluadas).forEach(materia => {
                    if (!respuestasConsolidadas[materia]) {
                        respuestasConsolidadas[materia] = {};
                    }
                    Object.assign(respuestasConsolidadas[materia], respuesta.respuestasEvaluadas[materia]);
                });
            }
        });
        
        // Analizar resultados
        analizarResultados(respuestasConsolidadas, pruebaData);
        
        // Ocultar loading
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('temasContenido').style.display = 'block';
        
        // Cargar sesiones guardadas
        await cargarSesionesGuardadas(pruebaId);
        
    } catch (error) {
        console.error('Error al cargar datos:', error);
        mostrarError('No se pudieron cargar los datos: ' + error.message);
    }
}

// Cargar plan existente para vista de admin
async function cargarPlanExistenteAdmin(db, planId) {
    try {
        // Obtener el plan desde Firebase
        const planDoc = await db.collection('planesEstudio').doc(planId).get();
        
        if (!planDoc.exists) {
            throw new Error('No se encontró el plan de estudio');
        }
        
        const planData = planDoc.data();
        
        // Actualizar información de la prueba
        document.getElementById('nombrePrueba').textContent = planData.nombrePrueba || 'Plan de Estudio';
        
        // Mostrar información del estudiante en el header
        const headerTitle = document.querySelector('.page-title span');
        if (headerTitle) {
            headerTitle.textContent = `Plan de ${planData.estudianteNombre || 'Estudiante'}`;
        }
        
        // Cargar fecha de actualización
        if (planData.fechaActualizacion) {
            const fecha = planData.fechaActualizacion.toDate ? 
                planData.fechaActualizacion.toDate() : 
                new Date(planData.fechaActualizacion);
            document.getElementById('fechaPrueba').textContent = formatearFecha(fecha);
        }
        
        // Cargar temas a reforzar
        temasAReforzar = planData.temasAReforzar || [];
        
        // Mostrar temas en la interfaz
        renderizarTemasAReforzar(temasAReforzar);
        
        // Cargar sesiones
        if (planData.sesiones && planData.sesiones.length > 0) {
            // Cargar sesiones en la variable global
            sesionesEstudio = planData.sesiones.map(s => ({
                ...s,
                fecha: s.fecha.toDate ? s.fecha.toDate() : new Date(s.fecha)
            }));
            
            // Renderizar calendario con las sesiones
            renderizarCalendario();
        }
        
        // Ocultar loading
        const loadingState = document.getElementById('loadingState');
        const temasContenido = document.getElementById('temasContenido');
        
        if (loadingState) loadingState.style.display = 'none';
        if (temasContenido) temasContenido.style.display = 'block';
        
        // Deshabilitar edición para admin (solo lectura)
        deshabilitarEdicionAdmin();
        
    } catch (error) {
        console.error('Error al cargar plan:', error);
        mostrarError('No se pudo cargar el plan de estudio: ' + error.message);
    }
}

// Deshabilitar edición para vista de admin (solo lectura)
function deshabilitarEdicionAdmin() {
    // Ocultar el tab "Mi Horario" (solo para estudiantes)
    const tabHorario = document.querySelector('.plan-tab[data-tab="horario"]');
    if (tabHorario) {
        tabHorario.style.display = 'none';
    }
    
    // Ocultar botones de acción
    const btnGenerar = document.getElementById('btnGenerarPlan');
    const btnGuardar = document.getElementById('btnGuardarSesiones');
    const btnExportar = document.getElementById('btnExportarPDF');
    
    if (btnGenerar) btnGenerar.style.display = 'none';
    if (btnGuardar) btnGuardar.style.display = 'none';
    
    // Mantener solo el botón de exportar (si existe)
    if (btnExportar) {
        btnExportar.style.display = 'inline-flex';
    }
    
    // Deshabilitar checkboxes de temas (no se pueden seleccionar/deseleccionar)
    document.querySelectorAll('.tema-checkbox').forEach(checkbox => {
        checkbox.disabled = true;
        checkbox.style.cursor = 'not-allowed';
        checkbox.style.opacity = '0.6';
    });
    
    // Deshabilitar todos los inputs de configuración
    document.querySelectorAll('input, select, textarea, button').forEach(element => {
        // No deshabilitar los botones de navegación y sidebar
        if (!element.classList.contains('plan-tab') && 
            !element.classList.contains('calendario-nav-btn') &&
            !element.classList.contains('materia-filter-btn') &&
            !element.classList.contains('sidebar-btn') &&
            element.id !== 'btnExportarPDF' &&
            element.id !== 'btnBack' &&
            element.id !== 'btnHome' &&
            element.id !== 'btnProfile' &&
            element.id !== 'btnLogout' &&
            element.id !== 'mobileMenuToggle') {
            element.disabled = true;
        }
    });
    
    // Agregar mensaje de solo lectura en el header
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        const readOnlyBadge = document.createElement('span');
        readOnlyBadge.style.cssText = 'background: rgba(255,165,0,0.2); color: #ffa500; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; margin-left: 1rem;';
        readOnlyBadge.innerHTML = '<i class="bi bi-eye"></i> Solo lectura';
        pageTitle.appendChild(readOnlyBadge);
    }
}

// Analizar resultados para identificar temas a reforzar
function analizarResultados(respuestasConsolidadas, pruebaData) {
    temasAReforzar = [];
    let totalPreguntas = 0;
    let totalCorrectas = 0;
    let totalIncorrectas = 0;
    
    const materiasAnalisis = {};
    
    Object.keys(respuestasConsolidadas).forEach(materia => {
        const respuestasMateria = respuestasConsolidadas[materia];
        
        if (!materiasAnalisis[materia]) {
            materiasAnalisis[materia] = {
                total: 0,
                correctas: 0,
                incorrectas: 0,
                temas: {},
                competencias: {},
                componentes: {},
                afirmaciones: {}
            };
        }
        
        Object.keys(respuestasMateria).forEach(preguntaId => {
            const pregunta = respuestasMateria[preguntaId];
            const esCorrecta = pregunta.esCorrecta || false;
            
            totalPreguntas++;
            materiasAnalisis[materia].total++;
            
            if (esCorrecta) {
                totalCorrectas++;
                materiasAnalisis[materia].correctas++;
            } else {
                totalIncorrectas++;
                materiasAnalisis[materia].incorrectas++;
                
                // Extraer información para reforzar
                const tema = pregunta.tema || 'Sin tema especificado';
                const competencia = pregunta.competencia || 'Sin competencia especificada';
                const componente = pregunta.componente || 'Sin componente especificado';
                const afirmacion = pregunta.afirmacion || '';
                
                // Agregar a temas a reforzar
                if (tema !== 'Sin tema especificado' && tema !== 'No especificado') {
                    if (!materiasAnalisis[materia].temas[tema]) {
                        materiasAnalisis[materia].temas[tema] = { errores: 0, competencia, componente, afirmacion };
                    }
                    materiasAnalisis[materia].temas[tema].errores++;
                }
                
                // Agregar competencias
                if (competencia !== 'Sin competencia especificada' && competencia !== 'No especificada') {
                    if (!materiasAnalisis[materia].competencias[competencia]) {
                        materiasAnalisis[materia].competencias[competencia] = 0;
                    }
                    materiasAnalisis[materia].competencias[competencia]++;
                }
                
                // Agregar componentes
                if (componente !== 'Sin componente especificado' && componente !== 'No especificado') {
                    if (!materiasAnalisis[materia].componentes[componente]) {
                        materiasAnalisis[materia].componentes[componente] = 0;
                    }
                    materiasAnalisis[materia].componentes[componente]++;
                }
            }
        });
    });
    
    // Convertir análisis a lista de temas a reforzar
    Object.keys(materiasAnalisis).forEach(materia => {
        const analisis = materiasAnalisis[materia];
        const porcentajeError = analisis.total > 0 ? (analisis.incorrectas / analisis.total) * 100 : 0;
        
        Object.keys(analisis.temas).forEach(tema => {
            const temaData = analisis.temas[tema];
            const nivel = temaData.errores >= 3 ? 'bajo' : (temaData.errores >= 2 ? 'medio' : 'alto');
            
            temasAReforzar.push({
                materia,
                tema,
                errores: temaData.errores,
                competencia: temaData.competencia,
                componente: temaData.componente,
                afirmacion: temaData.afirmacion,
                nivel,
                prioridad: temaData.errores
            });
        });
    });
    
    // Ordenar por prioridad (más errores primero)
    temasAReforzar.sort((a, b) => b.prioridad - a.prioridad);
    
    // Renderizar resumen y temas
    renderizarResumenAnalisis(totalPreguntas, totalCorrectas, totalIncorrectas, materiasAnalisis);
    renderizarFiltroMaterias(Object.keys(materiasAnalisis));
    renderizarTemasAReforzar(temasAReforzar);
}

// Renderizar resumen del análisis
function renderizarResumenAnalisis(total, correctas, incorrectas, materias) {
    const container = document.getElementById('resumenAnalisis');
    
    // Contar temas por nivel
    const temasUrgentes = temasAReforzar.filter(t => t.nivel === 'bajo').length;
    const temasReforzar = temasAReforzar.filter(t => t.nivel === 'medio').length;
    
    container.innerHTML = `
        <div class="analisis-card debilidades">
            <div class="analisis-icon">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h4>Temas Urgentes</h4>
            <div class="valor">${temasUrgentes}</div>
        </div>
        <div class="analisis-card">
            <div class="analisis-icon" style="background: linear-gradient(135deg, #ffa500, #ff8c00);">
                <i class="bi bi-bookmark-star-fill"></i>
            </div>
            <h4>Temas a Reforzar</h4>
            <div class="valor">${temasReforzar}</div>
        </div>
        <div class="analisis-card fortalezas">
            <div class="analisis-icon">
                <i class="bi bi-trophy-fill"></i>
            </div>
            <h4>Correctas</h4>
            <div class="valor">${correctas}/${total}</div>
        </div>
        <div class="analisis-card">
            <div class="analisis-icon" style="background: linear-gradient(135deg, #33CCFF, #0099cc);">
                <i class="bi bi-percent"></i>
            </div>
            <h4>Rendimiento</h4>
            <div class="valor">${total > 0 ? Math.round((correctas / total) * 100) : 0}%</div>
        </div>
    `;
}

// Renderizar filtro de materias
function renderizarFiltroMaterias(materias) {
    const container = document.getElementById('materiasFilter');
    
    let html = `
        <button class="materia-filter-btn active" data-materia="todas">
            <i class="bi bi-grid-fill"></i>
            Todas
        </button>
    `;
    
    materias.forEach(materia => {
        const nombreMateria = nombresMaterias[materia] || materia;
        const icono = iconosMaterias[materia] || 'bi-book';
        const color = coloresMaterias[materia] || '#999';
        
        html += `
            <button class="materia-filter-btn" data-materia="${materia}" style="--materia-color: ${color}">
                <i class="bi ${icono}"></i>
                ${nombreMateria}
            </button>
        `;
    });
    
    container.innerHTML = html;
    
    // Event listeners para filtros
    container.querySelectorAll('.materia-filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            container.querySelectorAll('.materia-filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            filtrarTemasPorMateria(this.dataset.materia);
        });
    });
}

// Filtrar temas por materia
function filtrarTemasPorMateria(materia) {
    const temasFiltrados = materia === 'todas' 
        ? temasAReforzar 
        : temasAReforzar.filter(t => t.materia === materia);
    
    renderizarTemasAReforzar(temasFiltrados);
}

// Renderizar temas a reforzar
function renderizarTemasAReforzar(temas) {
    const container = document.getElementById('temasPorMateria');
    
    if (temas.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem;">
                <i class="bi bi-emoji-smile" style="font-size: 4rem; color: #33ff77; margin-bottom: 1rem; display: block;"></i>
                <h3 style="color: white; margin-bottom: 0.5rem;">¡Excelente trabajo!</h3>
                <p style="color: rgba(255,255,255,0.7);">No hay temas urgentes que reforzar en esta categoría.</p>
            </div>
        `;
        return;
    }
    
    // Agrupar por materia
    const temasPorMateria = {};
    temas.forEach(tema => {
        if (!temasPorMateria[tema.materia]) {
            temasPorMateria[tema.materia] = [];
        }
        temasPorMateria[tema.materia].push(tema);
    });
    
    let html = '';
    
    Object.keys(temasPorMateria).forEach(materia => {
        const temasMateria = temasPorMateria[materia];
        const nombreMateria = nombresMaterias[materia] || materia;
        const icono = iconosMaterias[materia] || 'bi-book';
        const color = coloresMaterias[materia] || '#999';
        
        html += `
            <div class="materia-section">
                <div class="materia-header">
                    <div class="materia-icono" style="background: ${color};">
                        <i class="bi ${icono}"></i>
                    </div>
                    <div class="materia-info">
                        <h3>${nombreMateria}</h3>
                        <p>${temasMateria.length} tema(s) por reforzar</p>
                    </div>
                </div>
                <div class="temas-lista">
                    ${temasMateria.map(tema => renderizarTemaCard(tema)).join('')}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Event listeners para botones de agregar
    container.querySelectorAll('.btn-tema.agregar').forEach(btn => {
        btn.addEventListener('click', function() {
            const tema = this.dataset.tema;
            const materia = this.dataset.materia;
            agregarTemaAlPlan(tema, materia);
        });
    });
}

// Renderizar card de tema
function renderizarTemaCard(tema) {
    const nivelTexto = {
        'bajo': 'Urgente',
        'medio': 'Reforzar',
        'alto': 'Repasar'
    };
    
    return `
        <div class="tema-card ${tema.nivel}">
            <div class="tema-header">
                <span class="tema-nombre">${tema.tema}</span>
                <span class="tema-nivel">${nivelTexto[tema.nivel]}</span>
            </div>
            <div class="tema-detalles">
                ${tema.competencia && tema.competencia !== 'No especificada' ? `
                    <span class="tema-detalle">
                        <i class="bi bi-award"></i>
                        ${tema.competencia}
                    </span>
                ` : ''}
                ${tema.componente && tema.componente !== 'No especificado' ? `
                    <span class="tema-detalle">
                        <i class="bi bi-puzzle"></i>
                        ${tema.componente}
                    </span>
                ` : ''}
                <span class="tema-detalle">
                    <i class="bi bi-x-circle"></i>
                    ${tema.errores} error(es)
                </span>
            </div>
            ${tema.afirmacion ? `
                <div class="tema-detalles" style="margin-top: 0.5rem;">
                    <span class="tema-detalle" style="flex-basis: 100%;">
                        <i class="bi bi-lightbulb"></i>
                        ${tema.afirmacion.substring(0, 100)}${tema.afirmacion.length > 100 ? '...' : ''}
                    </span>
                </div>
            ` : ''}
            <div class="tema-acciones">
                <button class="btn-tema agregar" data-tema="${tema.tema}" data-materia="${tema.materia}">
                    <i class="bi bi-calendar-plus"></i>
                    Agregar al Plan
                </button>
            </div>
        </div>
    `;
}

// Agregar tema al plan
function agregarTemaAlPlan(tema, materia) {
    if (!diaSeleccionado) {
        // Si no hay día seleccionado, seleccionar hoy
        diaSeleccionado = new Date();
    }
    
    abrirModalSesion(tema, materia);
}

// ========== CALENDARIO ==========

// Renderizar calendario
function renderizarCalendario() {
    const grid = document.getElementById('calendarioGrid');
    const mesLabel = document.getElementById('calendarioMes');
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    mesLabel.textContent = `${meses[mesActual.getMonth()]} ${mesActual.getFullYear()}`;
    
    const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1);
    const ultimoDia = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Si no hay día seleccionado y estamos en el mes actual, seleccionar hoy automáticamente
    if (!diaSeleccionado && 
        mesActual.getMonth() === hoy.getMonth() && 
        mesActual.getFullYear() === hoy.getFullYear()) {
        diaSeleccionado = new Date(hoy);
    }
    
    let html = '';
    
    // Días del mes anterior
    const diasMesAnterior = new Date(mesActual.getFullYear(), mesActual.getMonth(), 0).getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
        const dia = diasMesAnterior - i;
        html += `<div class="calendario-dia otro-mes"><span class="dia-numero">${dia}</span></div>`;
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), dia);
        const esHoy = fecha.getTime() === hoy.getTime();
        const esSeleccionado = diaSeleccionado && fecha.getTime() === new Date(diaSeleccionado).setHours(0, 0, 0, 0);
        
        // Contar sesiones para este día
        const sesionesDelDia = sesionesEstudio.filter(s => {
            const fechaSesion = new Date(s.fecha);
            return fechaSesion.getDate() === dia && 
                   fechaSesion.getMonth() === mesActual.getMonth() && 
                   fechaSesion.getFullYear() === mesActual.getFullYear();
        });
        
        let clases = ['calendario-dia'];
        if (esHoy) clases.push('hoy');
        if (esSeleccionado) clases.push('seleccionado');
        
        html += `
            <div class="${clases.join(' ')}" data-fecha="${fecha.toISOString()}" onclick="seleccionarDia('${fecha.toISOString()}')">
                <span class="dia-numero">${dia}</span>
                ${sesionesDelDia.length > 0 ? `
                    <div class="sesiones-indicator">
                        ${sesionesDelDia.slice(0, 3).map(s => {
                            const color = coloresMaterias[s.materia] || '#ffa500';
                            return `<span class="sesion-dot" style="background: ${color};"></span>`;
                        }).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Días del mes siguiente
    const diasRestantes = 42 - (primerDiaSemana + diasEnMes);
    for (let dia = 1; dia <= diasRestantes; dia++) {
        html += `<div class="calendario-dia otro-mes"><span class="dia-numero">${dia}</span></div>`;
    }
    
    grid.innerHTML = html;
    
    // Si hay un día seleccionado, renderizar sus sesiones automáticamente
    if (diaSeleccionado) {
        renderizarSesionesDia();
    }
}

// Seleccionar día
window.seleccionarDia = function(fechaISO) {
    diaSeleccionado = new Date(fechaISO);
    renderizarCalendario();
    renderizarSesionesDia();
};

// Renderizar sesiones del día
function renderizarSesionesDia() {
    const container = document.getElementById('sesionesLista');
    const tituloSesiones = document.querySelector('.sesiones-dia h3');
    
    if (!diaSeleccionado) {
        container.innerHTML = '<p class="no-sesiones">Selecciona un día en el calendario para ver las sesiones programadas</p>';
        if (tituloSesiones) {
            tituloSesiones.innerHTML = '<i class="bi bi-calendar-event"></i> Sesiones del Día';
        }
        return;
    }
    
    // Mostrar fecha seleccionada en el título
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    const fechaFormateada = diaSeleccionado.toLocaleDateString('es-ES', opciones);
    if (tituloSesiones) {
        tituloSesiones.innerHTML = `<i class="bi bi-calendar-event"></i> Sesiones <span class="fecha-seleccionada">${fechaFormateada}</span>`;
    }
    
    const sesionesDelDia = sesionesEstudio.filter(s => {
        const fechaSesion = new Date(s.fecha);
        return fechaSesion.getDate() === diaSeleccionado.getDate() && 
               fechaSesion.getMonth() === diaSeleccionado.getMonth() && 
               fechaSesion.getFullYear() === diaSeleccionado.getFullYear();
    });
    
    if (sesionesDelDia.length === 0) {
        container.innerHTML = `
            <p class="no-sesiones">No hay sesiones programadas para ${fechaFormateada}</p>
            <button class="btn-agregar-sesion" onclick="abrirModalSesion()">
                <i class="bi bi-plus-circle"></i>
                Agregar Sesión de Estudio
            </button>
        `;
        return;
    }
    
    // Ordenar por hora
    sesionesDelDia.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    
    let html = sesionesDelDia.map(sesion => {
        const color = coloresMaterias[sesion.materia] || '#ffa500';
        const nombreMateria = nombresMaterias[sesion.materia] || sesion.materia;
        
        return `
            <div class="sesion-item" style="border-left-color: ${color};">
                <div class="sesion-hora">
                    <span class="hora">${sesion.horaInicio}</span>
                    <span class="duracion">${sesion.duracion} min</span>
                </div>
                <div class="sesion-info">
                    <div class="sesion-materia" style="color: ${color};">${nombreMateria}</div>
                    <div class="sesion-tema">${sesion.tema}</div>
                    ${sesion.notas ? `<div class="sesion-notas">${sesion.notas}</div>` : ''}
                </div>
                <div class="sesion-acciones">
                    <button class="btn-sesion eliminar" onclick="eliminarSesion('${sesion.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    html += `
        <button class="btn-agregar-sesion" onclick="abrirModalSesion()">
            <i class="bi bi-plus-circle"></i>
            Agregar Otra Sesión
        </button>
    `;
    
    container.innerHTML = html;
}

// ========== MODAL DE SESIÓN ==========

// Abrir modal de sesión
window.abrirModalSesion = function(tema = '', materia = '') {
    const modal = document.getElementById('modalSesion');
    
    // Llenar select de materias
    const materiaSelect = document.getElementById('sesionMateria');
    const materiasUnicas = [...new Set(temasAReforzar.map(t => t.materia))];
    
    materiaSelect.innerHTML = materiasUnicas.map(m => {
        const nombre = nombresMaterias[m] || m;
        return `<option value="${m}" ${m === materia ? 'selected' : ''}>${nombre}</option>`;
    }).join('');
    
    // Llenar select de temas
    actualizarTemasSesion(materia || materiasUnicas[0]);
    
    // Seleccionar tema si viene especificado
    if (tema) {
        setTimeout(() => {
            const temaSelect = document.getElementById('sesionTema');
            temaSelect.value = tema;
        }, 100);
    }
    
    // Event listener para cambio de materia
    materiaSelect.onchange = function() {
        actualizarTemasSesion(this.value);
    };
    
    // Establecer hora por defecto según momento preferido
    const horaInput = document.getElementById('sesionHoraInicio');
    const horasPorMomento = {
        'manana': '08:00',
        'tarde': '14:00',
        'noche': '19:00'
    };
    horaInput.value = horasPorMomento[configuracionHorario.momentoPreferido];
    
    modal.classList.add('active');
};

// Actualizar temas según materia seleccionada
function actualizarTemasSesion(materia) {
    const temaSelect = document.getElementById('sesionTema');
    const temasMateria = temasAReforzar.filter(t => t.materia === materia);
    
    temaSelect.innerHTML = temasMateria.map(t => 
        `<option value="${t.tema}">${t.tema}</option>`
    ).join('');
    
    if (temasMateria.length === 0) {
        temaSelect.innerHTML = '<option value="">Sin temas disponibles</option>';
    }
}

// Cerrar modal
function cerrarModalSesion() {
    document.getElementById('modalSesion').classList.remove('active');
}

// Guardar sesión
async function guardarSesion() {
    const materia = document.getElementById('sesionMateria').value;
    const tema = document.getElementById('sesionTema').value;
    const horaInicio = document.getElementById('sesionHoraInicio').value;
    const duracion = document.getElementById('sesionDuracion').value;
    const notas = document.getElementById('sesionNotas').value;
    
    if (!tema || !horaInicio) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos requeridos',
            text: 'Por favor completa la materia, tema y hora de inicio.',
            background: '#1a1a1a',
            color: '#fff'
        });
        return;
    }
    
    const nuevaSesion = {
        id: Date.now().toString(),
        fecha: diaSeleccionado || new Date(),
        materia,
        tema,
        horaInicio,
        duracion: parseInt(duracion),
        notas,
        completada: false
    };
    
    sesionesEstudio.push(nuevaSesion);
    
    // Guardar en localStorage
    guardarSesionesLocalmente();
    
    // Cerrar modal y actualizar vista
    cerrarModalSesion();
    renderizarCalendario();
    renderizarSesionesDia();
    
    Swal.fire({
        icon: 'success',
        title: '¡Sesión agregada!',
        text: 'Tu sesión de estudio ha sido programada.',
        timer: 2000,
        showConfirmButton: false,
        background: '#1a1a1a',
        color: '#fff'
    });
}

// Eliminar sesión
window.eliminarSesion = async function(sesionId) {
    const result = await Swal.fire({
        title: '¿Eliminar sesión?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#666',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#1a1a1a',
        color: '#fff'
    });
    
    if (result.isConfirmed) {
        sesionesEstudio = sesionesEstudio.filter(s => s.id !== sesionId);
        guardarSesionesLocalmente();
        renderizarCalendario();
        renderizarSesionesDia();
    }
};

// ========== GENERACIÓN DE PLAN ==========

// Generar plan de estudio
function generarPlanEstudio() {
    if (temasAReforzar.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Sin temas para estudiar',
            text: '¡Felicidades! No tienes temas urgentes que reforzar.',
            background: '#1a1a1a',
            color: '#fff'
        });
        return;
    }
    
    if (configuracionHorario.diasDisponibles.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Selecciona días',
            text: 'Debes seleccionar al menos un día disponible para estudiar.',
            background: '#1a1a1a',
            color: '#fff'
        });
        return;
    }
    
    // Calcular días hasta la fecha límite
    const hoy = new Date();
    let fechaLimite = obtenerFechaLimiteComoDate(configuracionHorario.fechaLimite);
    if (!fechaLimite) {
        fechaLimite = new Date(hoy.getTime() + 14 * 24 * 60 * 60 * 1000);
        configuracionHorario.fechaLimite = fechaLimite;
    }
    const diasHastaLimite = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
    
    // Calcular sesiones necesarias
    const horasPorSesion = 1; // 1 hora por tema
    const sesionesNecesarias = temasAReforzar.length;
    
    // Calcular días disponibles
    let diasDisponiblesHastaLimite = 0;
    const fechaActual = new Date(hoy);
    
    while (fechaActual <= fechaLimite) {
        if (configuracionHorario.diasDisponibles.includes(fechaActual.getDay())) {
            diasDisponiblesHastaLimite++;
        }
        fechaActual.setDate(fechaActual.getDate() + 1);
    }
    
    // Calcular horas totales disponibles
    const horasTotalesDisponibles = diasDisponiblesHastaLimite * configuracionHorario.horasPorDia;
    const sesionesPorDia = Math.ceil(sesionesNecesarias / diasDisponiblesHastaLimite);
    
    // Generar sesiones automáticas
    generarSesionesAutomaticas(diasDisponiblesHastaLimite, fechaLimite);
    
    // Marcar que el plan fue generado
    planYaGenerado = true;
    
    // Guardar el estado actualizado
    guardarSesionesLocalmente();
    
    // Mostrar resumen del plan
    renderizarPlanGenerado(sesionesNecesarias, diasDisponiblesHastaLimite, horasTotalesDisponibles, diasHastaLimite);
    
    // Ocultar configuración y mostrar plan
    document.querySelector('.horario-config').style.display = 'none';
    document.getElementById('planGenerado').style.display = 'block';
    
    // Mostrar mensaje de éxito
    Swal.fire({
        icon: 'success',
        title: '¡Plan Generado!',
        text: `Se han programado ${sesionesEstudio.length} sesiones de estudio.`,
        timer: 3000,
        showConfirmButton: false,
        background: '#1a1a1a',
        color: '#fff'
    });
}

// Generar sesiones automáticas
function generarSesionesAutomaticas(diasDisponiblesCount, fechaLimite) {
    const params = new URLSearchParams(window.location.search);
    const pruebaId = params.get('pruebaId');
    
    // Limpiar sesiones anteriores de esta prueba
    sesionesEstudio = sesionesEstudio.filter(s => s.pruebaId !== pruebaId);
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    let diaActual = new Date(hoy);
    diaActual.setDate(diaActual.getDate() + 1); // Empezar desde mañana
    
    let temaIndex = 0;
    
    // Hora según momento preferido
    const horasPorMomento = {
        'manana': ['07:00', '08:00', '09:00', '10:00', '11:00'],
        'tarde': ['14:00', '15:00', '16:00', '17:00', '18:00'],
        'noche': ['19:00', '20:00', '21:00', '22:00']
    };
    
    const horasDisponibles = horasPorMomento[configuracionHorario.momentoPreferido] || horasPorMomento['manana'];
    
    // Crear array de temas expandido si hay pocas sesiones
    let temasExpandidos = [...temasAReforzar];
    
    // Si hay menos temas que días disponibles, repetir temas
    if (temasExpandidos.length < diasDisponiblesCount) {
        const repeticiones = Math.ceil(diasDisponiblesCount / temasExpandidos.length);
        const temasOriginales = [...temasExpandidos];
        for (let i = 1; i < repeticiones; i++) {
            temasExpandidos = temasExpandidos.concat(temasOriginales.map(t => ({...t, repeticion: i})));
        }
    }
    
    // Contador de sesiones creadas por día
    let sesionesDelDia = 0;
    let horaIndexDia = 0;
    
    // Iterar hasta completar todos los temas o llegar a la fecha límite
    while (temaIndex < temasExpandidos.length && diaActual <= fechaLimite) {
        const diaSemana = diaActual.getDay();
        
        // Verificar si este día de la semana está disponible
        if (configuracionHorario.diasDisponibles.includes(diaSemana)) {
            // Cuántas sesiones podemos poner hoy
            const sesionesPosiblesHoy = Math.min(
                configuracionHorario.horasPorDia, 
                horasDisponibles.length,
                temasExpandidos.length - temaIndex
            );
            
            for (let i = 0; i < sesionesPosiblesHoy; i++) {
                const tema = temasExpandidos[temaIndex];
                
                if (tema) {
                    const nuevaSesion = {
                        id: `auto_${Date.now()}_${temaIndex}_${Math.random().toString(36).substr(2, 9)}`,
                        pruebaId,
                        fecha: new Date(diaActual.getTime()),
                        materia: tema.materia,
                        tema: tema.tema || tema.competencia || 'Tema general',
                        competencia: tema.competencia,
                        horaInicio: horasDisponibles[i],
                        duracion: 60,
                        notas: tema.competencia ? `Competencia: ${tema.competencia}` : '',
                        completada: false,
                        generadoAutomaticamente: true
                    };
                    
                    sesionesEstudio.push(nuevaSesion);
                    temaIndex++;
                }
            }
        }
        
        // Avanzar al siguiente día
        diaActual.setDate(diaActual.getDate() + 1);
    }
    
    // Actualizar calendario
    renderizarCalendario();
    
    console.log(`Plan generado: ${sesionesEstudio.length} sesiones creadas`);
}

// Restaurar selecciones visuales de la configuración guardada
function restaurarSeleccionesVisuales() {
    // Restaurar horas por día
    document.querySelectorAll('.hora-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (parseInt(btn.dataset.horas) === configuracionHorario.horasPorDia) {
            btn.classList.add('selected');
        }
    });
    
    // Restaurar días de la semana
    document.querySelectorAll('.dia-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (configuracionHorario.diasDisponibles.includes(parseInt(btn.dataset.dia))) {
            btn.classList.add('selected');
        }
    });
    
    // Restaurar momento preferido
    document.querySelectorAll('.momento-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (btn.dataset.momento === configuracionHorario.momentoPreferido) {
            btn.classList.add('selected');
        }
    });
    
    // Restaurar fecha límite
    const fechaInput = document.getElementById('fechaLimite');
    if (fechaInput && configuracionHorario.fechaLimite) {
        const fecha = obtenerFechaLimiteComoDate(configuracionHorario.fechaLimite);
        if (fecha) {
            fechaInput.value = fecha.toISOString().split('T')[0];
        }
    }
}

// Normalizar fecha límite (maneja Date, string o Timestamp de Firebase)
function obtenerFechaLimiteComoDate(valor) {
    if (!valor) return null;

    // Ya es Date
    if (valor instanceof Date) {
        return isNaN(valor.getTime()) ? null : valor;
    }

    // Timestamp de Firebase (tiene toDate)
    if (typeof valor.toDate === 'function') {
        const f = valor.toDate();
        return isNaN(f.getTime()) ? null : f;
    }

    // String u otro tipo compatible con Date
    const fecha = new Date(valor);
    return isNaN(fecha.getTime()) ? null : fecha;
}

// Renderizar plan generado
function renderizarPlanGenerado(sesionesNecesarias, diasDisponibles, horasTotales, diasHastaLimite) {
    const resumenContainer = document.getElementById('planResumen');
    const horarioContainer = document.getElementById('horarioSemanal');
    const recomendacionesContainer = document.getElementById('recomendacionesLista');
    
    // Resumen
    resumenContainer.innerHTML = `
        <div class="resumen-item">
            <i class="bi bi-book"></i>
            <div class="valor">${sesionesNecesarias}</div>
            <div class="label">Temas a estudiar</div>
        </div>
        <div class="resumen-item">
            <i class="bi bi-calendar-check"></i>
            <div class="valor">${diasDisponibles}</div>
            <div class="label">Días de estudio</div>
        </div>
        <div class="resumen-item">
            <i class="bi bi-clock"></i>
            <div class="valor">${horasTotales}h</div>
            <div class="label">Horas totales</div>
        </div>
        <div class="resumen-item">
            <i class="bi bi-flag"></i>
            <div class="valor">${diasHastaLimite}</div>
            <div class="label">Días restantes</div>
        </div>
    `;
    
    // Horario semanal
    renderizarHorarioSemanal(horarioContainer);
    
    // Recomendaciones
    const recomendaciones = generarRecomendaciones();
    recomendacionesContainer.innerHTML = recomendaciones.map(rec => `
        <div class="recomendacion-item">
            <i class="bi ${rec.icono}"></i>
            <p>${rec.texto}</p>
        </div>
    `).join('');
}

// Renderizar horario semanal con fechas reales
function renderizarHorarioSemanal(container) {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Horas según el momento preferido
    const horasPorMomento = {
        'manana': ['07:00', '08:00', '09:00', '10:00', '11:00'],
        'tarde': ['14:00', '15:00', '16:00', '17:00', '18:00'],
        'noche': ['19:00', '20:00', '21:00', '22:00']
    };
    
    const horas = horasPorMomento[configuracionHorario.momentoPreferido] || horasPorMomento['manana'];
    
    // Encontrar el rango de fechas de las sesiones
    if (sesionesEstudio.length === 0) {
        container.innerHTML = '<p class="no-sesiones" style="text-align: center; padding: 2rem;">No hay sesiones programadas</p>';
        return;
    }
    
    // Obtener la semana actual (desde hoy hasta 6 días después)
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Encontrar el inicio de la semana actual (domingo)
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    
    // Crear array de los 7 días de la semana
    const diasDeLaSemana = [];
    for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(inicioSemana.getDate() + i);
        diasDeLaSemana.push(dia);
    }
    
    let html = '<div class="horario-grid">';
    
    // Header con fechas reales
    html += '<div class="horario-header">Hora</div>';
    diasDeLaSemana.forEach((fecha, index) => {
        const esHoy = fecha.toDateString() === hoy.toDateString();
        const esDiaDisponible = configuracionHorario.diasDisponibles.includes(index);
        html += `
            <div class="horario-header ${esHoy ? 'dia-hoy' : ''} ${esDiaDisponible ? 'dia-disponible' : ''}">
                <span class="dia-nombre">${diasSemana[index]}</span>
                <span class="dia-fecha">${fecha.getDate()} ${meses[fecha.getMonth()]}</span>
            </div>
        `;
    });
    
    // Celdas con sesiones
    horas.forEach(hora => {
        html += `<div class="horario-hora">${hora}</div>`;
        
        diasDeLaSemana.forEach((fechaDia) => {
            // Buscar si hay sesión para esta fecha y hora específica
            const sesion = sesionesEstudio.find(s => {
                const fechaSesion = new Date(s.fecha);
                return fechaSesion.getDate() === fechaDia.getDate() && 
                       fechaSesion.getMonth() === fechaDia.getMonth() && 
                       fechaSesion.getFullYear() === fechaDia.getFullYear() &&
                       s.horaInicio === hora;
            });
            
            if (sesion) {
                const color = coloresMaterias[sesion.materia] || '#ffa500';
                const icono = iconosMaterias[sesion.materia] || 'bi-book';
                const temaCorto = (sesion.tema || 'Estudio').length > 12 
                    ? (sesion.tema || 'Estudio').substring(0, 12) + '...' 
                    : (sesion.tema || 'Estudio');
                html += `
                    <div class="horario-celda ocupado" style="background: ${color}20; border-left: 3px solid ${color};">
                        <div class="tema-mini">
                            <i class="bi ${icono}" style="color: ${color};"></i>
                            <span>${temaCorto}</span>
                        </div>
                    </div>
                `;
            } else {
                html += '<div class="horario-celda"></div>';
            }
        });
    });
    
    html += '</div>';
    
    // Agregar navegación de semanas si hay sesiones en otras semanas
    const sesionesPosteriores = sesionesEstudio.filter(s => {
        const fechaSesion = new Date(s.fecha);
        return fechaSesion > diasDeLaSemana[6];
    });
    
    if (sesionesPosteriores.length > 0) {
        html += `
            <div class="horario-info-extra">
                <i class="bi bi-info-circle"></i>
                <span>Hay ${sesionesPosteriores.length} sesión(es) más programadas para las próximas semanas. 
                Revisa el tab "Mi Calendario" para ver todas.</span>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Generar recomendaciones
function generarRecomendaciones() {
    const recomendaciones = [];
    
    // Recomendación según momento del día
    const momentoTexto = {
        'manana': 'Tu cerebro está más activo por las mañanas. Aprovecha para los temas más difíciles primero.',
        'tarde': 'La tarde es ideal para repasar y practicar ejercicios.',
        'noche': 'Estudiar de noche puede ser efectivo si descansas bien. Evita pantallas brillantes antes de dormir.'
    };
    
    recomendaciones.push({
        icono: 'bi-lightbulb-fill',
        texto: momentoTexto[configuracionHorario.momentoPreferido]
    });
    
    // Recomendación de descansos
    recomendaciones.push({
        icono: 'bi-cup-hot-fill',
        texto: 'Toma descansos de 5-10 minutos cada hora. Esto mejora la retención de información.'
    });
    
    // Recomendación de técnica Pomodoro
    recomendaciones.push({
        icono: 'bi-stopwatch-fill',
        texto: 'Usa la técnica Pomodoro: 25 minutos de estudio + 5 de descanso. Después de 4 ciclos, descansa 15-30 minutos.'
    });
    
    // Recomendación según cantidad de temas
    if (temasAReforzar.filter(t => t.nivel === 'bajo').length > 3) {
        recomendaciones.push({
            icono: 'bi-exclamation-triangle-fill',
            texto: 'Tienes varios temas urgentes. Prioriza los de la misma materia para aprovechar mejor el tiempo.'
        });
    }
    
    return recomendaciones;
}

// ========== PERSISTENCIA ==========

// Variable para saber si el plan fue generado
let planYaGenerado = false;

// Guardar sesiones localmente Y en Firebase
async function guardarSesionesLocalmente() {
    const params = new URLSearchParams(window.location.search);
    const pruebaId = params.get('pruebaId');
    
    // Guardar en localStorage (respaldo local)
    const datosGuardados = {
        sesiones: sesionesEstudio,
        configuracion: configuracionHorario,
        planGenerado: planYaGenerado,
        temasAReforzar: temasAReforzar
    };
    localStorage.setItem(`plan_estudio_${pruebaId}`, JSON.stringify(datosGuardados));
    
    // Guardar en Firebase para que admins puedan ver
    await guardarPlanEnFirebase(pruebaId);
}

// Guardar plan de estudio en Firebase
async function guardarPlanEnFirebase(pruebaId) {
    try {
        const usuarioActual = sessionStorage.getItem('currentUser');
        if (!usuarioActual) return;
        
        const usuario = JSON.parse(usuarioActual);
        const estudianteId = usuario.numeroDocumento || usuario.numeroIdentidad || usuario.id;
        
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        
        // Preparar datos del plan
        const planData = {
            pruebaId,
            estudianteId,
            estudianteNombre: usuario.nombre || 'Sin nombre',
            estudianteEmail: usuario.email || '',
            institucion: usuario.institucion || '',
            sesiones: sesionesEstudio.map(s => ({
                ...s,
                fecha: s.fecha instanceof Date ? s.fecha.toISOString() : s.fecha
            })),
            temasAReforzar: temasAReforzar || [],
            configuracion: configuracionHorario,
            planGenerado: planYaGenerado,
            totalSesiones: sesionesEstudio.length,
            fechaCreacion: firebase.firestore.Timestamp.now(),
            fechaActualizacion: firebase.firestore.Timestamp.now()
        };
        
        // Usar un ID único basado en estudiante y prueba
        const planId = `plan_${estudianteId}_${pruebaId}`;
        
        // Verificar si ya existe el plan
        const planExistente = await db.collection('planesEstudio').doc(planId).get();
        
        if (planExistente.exists) {
            // Actualizar plan existente
            await db.collection('planesEstudio').doc(planId).update({
                sesiones: planData.sesiones,
                temasAReforzar: planData.temasAReforzar,
                configuracion: planData.configuracion,
                totalSesiones: planData.totalSesiones,
                fechaActualizacion: firebase.firestore.Timestamp.now()
            });
        } else {
            // Crear nuevo plan
            await db.collection('planesEstudio').doc(planId).set(planData);
        }
        
        console.log('Plan de estudio guardado en Firebase');
        
    } catch (error) {
        console.error('Error al guardar plan en Firebase:', error);
        // No mostrar error al usuario, el localStorage sigue funcionando
    }
}

// Cargar sesiones guardadas
async function cargarSesionesGuardadas(pruebaId) {
    let datosRecuperados = null;
    
    // Primero intentar cargar desde Firebase
    try {
        const usuarioActual = sessionStorage.getItem('currentUser');
        if (usuarioActual && window.firebaseDB) {
            const usuario = JSON.parse(usuarioActual);
            const estudianteId = usuario.numeroDocumento || usuario.numeroIdentidad || usuario.id;
            const planId = `plan_${estudianteId}_${pruebaId}`;
            
            const db = window.firebaseDB;
            const planDoc = await db.collection('planesEstudio').doc(planId).get();
            
            if (planDoc.exists) {
                const planData = planDoc.data();
                sesionesEstudio = (planData.sesiones || []).map(s => ({
                    ...s,
                    fecha: new Date(s.fecha)
                }));
                
                // Restaurar configuración
                if (planData.configuracion) {
                    configuracionHorario = { ...configuracionHorario, ...planData.configuracion };
                }
                
                // Restaurar temas
                if (planData.temasAReforzar) {
                    temasAReforzar = planData.temasAReforzar;
                }
                
                // Restaurar estado del plan
                planYaGenerado = planData.planGenerado || sesionesEstudio.length > 0;
                
                // Si el plan ya fue generado, mostrarlo
                if (planYaGenerado && sesionesEstudio.length > 0) {
                    mostrarPlanGeneradoExistente();
                }
                
                renderizarCalendario();
                return;
            }
        }
    } catch (error) {
        console.error('Error al cargar desde Firebase:', error);
    }
    
    // Fallback a localStorage si Firebase falla o no hay datos
    const datosGuardados = localStorage.getItem(`plan_estudio_${pruebaId}`);
    
    if (datosGuardados) {
        try {
            datosRecuperados = JSON.parse(datosGuardados);
            
            // Restaurar sesiones
            if (datosRecuperados.sesiones) {
                sesionesEstudio = datosRecuperados.sesiones.map(s => ({
                    ...s,
                    fecha: new Date(s.fecha)
                }));
            }
            
            // Restaurar configuración
            if (datosRecuperados.configuracion) {
                configuracionHorario = { ...configuracionHorario, ...datosRecuperados.configuracion };
            }
            
            // Restaurar temas
            if (datosRecuperados.temasAReforzar) {
                temasAReforzar = datosRecuperados.temasAReforzar;
            }
            
            // Restaurar estado del plan
            if (datosRecuperados.planGenerado && sesionesEstudio.length > 0) {
                planYaGenerado = true;
                mostrarPlanGeneradoExistente();
            }
            
        } catch (e) {
            console.error('Error al cargar sesiones:', e);
            sesionesEstudio = [];
        }
    }
    
    renderizarCalendario();
}

// Mostrar plan ya generado (cuando se recarga la página)
function mostrarPlanGeneradoExistente() {
    const configDiv = document.querySelector('.horario-config');
    const planDiv = document.getElementById('planGenerado');
    
    if (configDiv && planDiv) {
        configDiv.style.display = 'none';
        planDiv.style.display = 'block';
        
        // Calcular estadísticas para mostrar
        const hoy = new Date();
        let fechaLimite = obtenerFechaLimiteComoDate(configuracionHorario.fechaLimite);
        if (!fechaLimite) {
            fechaLimite = new Date(hoy.getTime() + 14 * 24 * 60 * 60 * 1000);
        }
        
        const diasHastaLimite = Math.max(0, Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24)));
        const horasTotales = sesionesEstudio.length * 1; // 1 hora por sesión
        
        // Contar días únicos con sesiones
        const diasUnicos = new Set(sesionesEstudio.map(s => {
            const fecha = new Date(s.fecha);
            return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
        }));
        
        renderizarPlanGenerado(
            temasAReforzar.length || sesionesEstudio.length,
            diasUnicos.size,
            horasTotales,
            diasHastaLimite
        );
    }
}

// Formatear fecha
function formatearFecha(fecha) {
    const opciones = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
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


