// Resultados.js - Funcionalidad para la sección de resultados

// Variables globales para filtros
let todasLasPruebas = [];
let todosLosMinisimulacros = [];

// Variables para administrador
let esAdmin = false;
let todosLosEstudiantes = [];
let estudianteSeleccionado = null;
let todasLasInstituciones = [];
let institucionSeleccionada = null;

// Verificar autenticación al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    verificarAutenticacion();
    inicializarReloj();
    inicializarMenuTabs();
    inicializarSidebar();
    cargarDatosUsuario();
    cargarResultados();
    inicializarFiltros();
});

// Verificar si el usuario está autenticado
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

            // Actualizar nombre de usuario
            const userNameElement = document.getElementById('userName');
            if (userNameElement && usuario.nombre) {
                userNameElement.textContent = usuario.nombre.toUpperCase();
            }

            // Actualizar rol
            const userRoleElement = document.getElementById('userRole');
            if (userRoleElement && usuario.tipoUsuario) {
                const roles = {
                    'admin': 'Administrador',
                    'coordinador': 'Coordinador',
                    'estudiante': 'Estudiante',
                    'profesor': 'Profesor'
                };
                userRoleElement.textContent = roles[usuario.tipoUsuario] || 'Usuario';
            }

            // Cargar foto de perfil desde Firebase
            await cargarFotoPerfil(usuario.id);
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
        }
    }
}

// Cargar foto de perfil del usuario
async function cargarFotoPerfil(usuarioId) {
    try {
        // Esperar a que Firebase esté listo
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
    const avatarDefault = document.getElementById('userAvatarDefault');
    const avatarImage = document.getElementById('userAvatarImage');

    if (avatarDefault && avatarImage) {
        avatarDefault.style.display = 'none';
        avatarImage.src = urlFoto;
        avatarImage.style.display = 'block';
        avatarImage.style.position = 'absolute';
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

// Inicializar reloj y fecha
function inicializarReloj() {
    function actualizarReloj() {
        const ahora = new Date();

        // Actualizar hora
        const horas = ahora.getHours();
        const minutos = ahora.getMinutes().toString().padStart(2, '0');
        const segundos = ahora.getSeconds().toString().padStart(2, '0');
        const ampm = horas >= 12 ? 'PM' : 'AM';
        const horas12 = horas % 12 || 12;

        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = `${horas12}:${minutos}:${segundos} ${ampm}`;
        }

        // Actualizar icono según la hora
        const timeIcon = document.getElementById('timeIcon');
        if (timeIcon) {
            if (horas >= 6 && horas < 12) {
                timeIcon.className = 'bi bi-sunrise-fill';
            } else if (horas >= 12 && horas < 18) {
                timeIcon.className = 'bi bi-sun-fill';
            } else if (horas >= 18 && horas < 20) {
                timeIcon.className = 'bi bi-sunset-fill';
            } else {
                timeIcon.className = 'bi bi-moon-stars-fill';
            }
        }

        // Actualizar fecha
        const opciones = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const fechaFormateada = ahora.toLocaleDateString('es-ES', opciones);

        const dateElement = document.getElementById('currentDate');
        if (dateElement) {
            dateElement.textContent = fechaFormateada;
        }
    }

    actualizarReloj();
    setInterval(actualizarReloj, 1000);
}

// Inicializar menú de tabs
function inicializarMenuTabs() {
    const menuTabs = document.querySelectorAll('.menu-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    menuTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');

            // Remover clase active de todos los tabs
            menuTabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Agregar clase active al tab seleccionado
            this.classList.add('active');

            // Mostrar contenido correspondiente
            const targetContent = document.getElementById(`${targetTab}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            // Si es el tab de plan de estudio (estudiante), cargar las pruebas
            if (targetTab === 'plan-estudio' && !esAdmin) {
                cargarPruebasParaPlanEstudio();
            }
            
            // Si es el tab de planes admin, cargar los planes de estudiantes
            if (targetTab === 'planes-admin' && esAdmin) {
                cargarPlanesEstudiantesAdmin();
            }
        });
    });
}

// Inicializar sidebar móvil
function inicializarSidebar() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarPanel = document.getElementById('sidebarPanel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Mostrar botón móvil en pantallas pequeñas
    function checkMobileView() {
        if (window.innerWidth <= 768) {
            if (mobileMenuToggle) {
                mobileMenuToggle.style.display = 'flex';
            }
        } else {
            if (mobileMenuToggle) {
                mobileMenuToggle.style.display = 'none';
            }
            if (sidebarPanel) {
                sidebarPanel.classList.remove('active');
            }
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
            if (mobileMenuToggle) {
                mobileMenuToggle.classList.remove('active');
            }
        }
    }

    checkMobileView();
    window.addEventListener('resize', checkMobileView);

    // Toggle sidebar móvil
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            const isActive = sidebarPanel.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            this.classList.toggle('active');

            // Cambiar icono
            const icon = this.querySelector('i');
            if (isActive) {
                icon.className = 'bi bi-chevron-left';
            } else {
                icon.className = 'bi bi-chevron-right';
            }
        });
    }

    // Cerrar sidebar al hacer clic en overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function () {
            if (sidebarPanel) {
                sidebarPanel.classList.remove('active');
            }
            this.classList.remove('active');
            if (mobileMenuToggle) {
                mobileMenuToggle.classList.remove('active');
                const icon = mobileMenuToggle.querySelector('i');
                icon.className = 'bi bi-chevron-right';
            }
        });
    }
}

// Botón de perfil
const btnProfile = document.getElementById('btnProfile');
if (btnProfile) {
    btnProfile.addEventListener('click', function () {
        window.location.href = 'panelUsuario.html';
    });
}

// Botón de inicio
const btnHome = document.getElementById('btnHome');
if (btnHome) {
    btnHome.addEventListener('click', function () {
        window.location.href = '../index.html';
    });
}

// Botón de volver al panel
const btnBack = document.getElementById('btnBack');
if (btnBack) {
    btnBack.addEventListener('click', function () {
        const usuarioActual = sessionStorage.getItem('currentUser');

        if (usuarioActual) {
            try {
                const usuario = JSON.parse(usuarioActual);

                // Redirigir según el rol
                switch (usuario.tipoUsuario) {
                    case 'admin':
                        window.location.href = 'Panel_Admin.html';
                        break;
                    case 'coordinador':
                        window.location.href = 'Panel_Coordinador.html';
                        break;
                    case 'estudiante':
                        window.location.href = 'Panel_Estudiantes.html';
                        break;
                    case 'profesor':
                        window.location.href = 'Panel_Profesor.html';
                        break;
                    default:
                        window.location.href = 'Panel_Estudiantes.html';
                }
            } catch (error) {
                console.error('Error al redirigir:', error);
                window.location.href = 'Panel_Estudiantes.html';
            }
        }
    });
}

// Botón de cerrar sesión
const btnLogout = document.getElementById('btnLogout');
if (btnLogout) {
    btnLogout.addEventListener('click', async function () {
        const confirmed = await showLogoutModal();
        if (confirmed) {
            sessionStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        }
    });
}

// Mostrar modal de confirmación de logout
function showLogoutModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="panelModalOverlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            ">
                <div class="panel-modal" style="
                    background: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                    overflow: hidden;
                ">
                    <div class="panel-modal-body" style="padding: 30px; text-align: center;">
                        <i class="bi bi-exclamation-triangle" style="font-size: 48px; color: #ffc107; margin-bottom: 20px; display: block;"></i>
                        <p style="font-size: 18px; color: #333; margin: 0 0 30px 0; line-height: 1.5;">¿Estás seguro de que deseas cerrar sesión?</p>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button id="panelModalCancel" style="
                                padding: 12px 24px;
                                border: 1px solid #ddd;
                                border-radius: 8px;
                                background: #f5f5f5;
                                color: #333;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                min-width: 100px;
                            ">
                                <i class="bi bi-x-lg"></i> No
                            </button>
                            <button id="panelModalConfirm" style="
                                padding: 12px 24px;
                                border: none;
                                border-radius: 8px;
                                background: #dc3545;
                                color: white;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                min-width: 100px;
                            ">
                                <i class="bi bi-check-lg"></i> Sí
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const overlay = document.getElementById('panelModalOverlay');
        const confirmBtn = document.getElementById('panelModalConfirm');
        const cancelBtn = document.getElementById('panelModalCancel');

        // Show modal with animation
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
            overlay.querySelector('.panel-modal').style.transform = 'scale(1)';
        }, 10);

        // Handle confirm
        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        // Handle cancel
        cancelBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(false);
        });

        // Handle overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(false);
            }
        });

        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                resolve(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// Cerrar modal
function closeModal(overlay) {
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}

// Cargar resultados del usuario
async function cargarResultados() {
    const usuarioActual = sessionStorage.getItem('currentUser');

    if (!usuarioActual) return;

    try {
        const usuario = JSON.parse(usuarioActual);

        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const db = window.firebaseDB;

        // Verificar si es admin o coordinador
        esAdmin = usuario.tipoUsuario === 'admin' || usuario.tipoUsuario === 'coordinador';

        if (esAdmin) {
            // Mostrar interfaz de admin
            configurarInterfazAdmin();
            // Cargar todos los estudiantes
            await cargarTodosLosEstudiantes(db);
            // Cargar todos los resultados
            await cargarTodosLosResultados(db);
        } else {
            // Obtener el ID del estudiante (puede ser numeroDocumento, numeroIdentidad o id)
            const estudianteId = usuario.numeroDocumento || usuario.numeroIdentidad || usuario.id;
            // Cargar pruebas y minisimulacros del estudiante
            await cargarPruebasYMinisimulacros(db, estudianteId);
        }

    } catch (error) {
        console.error('Error al cargar resultados:', error);
    }
}

// Configurar interfaz para administrador
function configurarInterfazAdmin() {
    // Cambiar título
    const titulo = document.getElementById('panelTitle');
    const subtitulo = document.getElementById('panelSubtitle');
    
    if (titulo) titulo.textContent = 'Todos los Resultados';
    if (subtitulo) subtitulo.textContent = 'Consulta los resultados de todos los estudiantes';
    
    // Mostrar filtro de estudiante
    const adminFilter = document.getElementById('adminFilterContainer');
    if (adminFilter) {
        adminFilter.style.display = 'block';
    }
    
    // Mostrar tab de Planes de Estudiantes (solo admin)
    const tabPlanesAdmin = document.getElementById('tabPlanesAdmin');
    if (tabPlanesAdmin) {
        tabPlanesAdmin.style.display = 'flex';
    }
    
    // Ocultar tab de Plan de Estudio personal (no aplica a admin)
    const tabPlanEstudio = document.getElementById('tabPlanEstudio');
    if (tabPlanEstudio) {
        tabPlanEstudio.style.display = 'none';
    }
    
    // Actualizar placeholder de los buscadores
    const searchPruebas = document.getElementById('searchPruebas');
    const searchMinisimulacros = document.getElementById('searchMinisimulacros');
    
    if (searchPruebas) {
        searchPruebas.placeholder = 'Buscar por nombre de prueba o estudiante...';
    }
    if (searchMinisimulacros) {
        searchMinisimulacros.placeholder = 'Buscar por nombre de minisimulacro o estudiante...';
    }
    
    // Configurar evento del filtro de institución
    const filterInstitucion = document.getElementById('filterInstitucionAdmin');
    if (filterInstitucion) {
        filterInstitucion.addEventListener('change', function() {
            institucionSeleccionada = this.value || null;
            actualizarSelectorEstudiantes();
        });
    }
    
    // Configurar buscador de estudiante (input de texto)
    const searchEstudiante = document.getElementById('searchEstudianteAdmin');
    if (searchEstudiante) {
        searchEstudiante.addEventListener('input', function() {
            actualizarSelectorEstudiantes();
        });
    }
    
    // Configurar evento del selector de estudiante
    const filterEstudiante = document.getElementById('filterEstudiante');
    if (filterEstudiante) {
        filterEstudiante.addEventListener('change', async function() {
            estudianteSeleccionado = this.value || null;
            
            if (!window.firebaseDB) {
                await esperarFirebase();
            }
            
            if (estudianteSeleccionado) {
                await cargarPruebasYMinisimulacros(window.firebaseDB, estudianteSeleccionado);
            } else {
                await cargarTodosLosResultados(window.firebaseDB);
            }
        });
    }
    
    // Configurar botón limpiar filtros
    const btnLimpiar = document.getElementById('btnLimpiarFiltrosAdmin');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', async function() {
            // Limpiar todos los filtros
            const filterInstitucion = document.getElementById('filterInstitucionAdmin');
            const searchEstudiante = document.getElementById('searchEstudianteAdmin');
            const filterEstudiante = document.getElementById('filterEstudiante');
            
            if (filterInstitucion) filterInstitucion.value = '';
            if (searchEstudiante) searchEstudiante.value = '';
            if (filterEstudiante) filterEstudiante.value = '';
            
            institucionSeleccionada = null;
            estudianteSeleccionado = null;
            
            // Actualizar selector de estudiantes
            actualizarSelectorEstudiantes();
            
            // Si el tab de planes está activo, actualizar los planes
            if (planesEstudiantesCargados && todosLosPlanesEstudiantes.length > 0) {
                renderizarPlanesAdmin(todosLosPlanesEstudiantes);
            }
            
            // Recargar todos los resultados
            if (!window.firebaseDB) {
                await esperarFirebase();
            }
            await cargarTodosLosResultados(window.firebaseDB);
        });
    }
}

// Actualizar selector de estudiantes según filtros
function actualizarSelectorEstudiantes() {
    const select = document.getElementById('filterEstudiante');
    const searchInput = document.getElementById('searchEstudianteAdmin');
    
    if (!select) return;
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    
    // Filtrar estudiantes
    let estudiantesFiltrados = todosLosEstudiantes.filter(est => {
        // Filtro por institución
        const matchInstitucion = !institucionSeleccionada || est.institucion === institucionSeleccionada;
        
        // Filtro por búsqueda de texto
        const matchBusqueda = !searchTerm || 
            est.nombre.toLowerCase().includes(searchTerm) ||
            (est.documento && est.documento.toLowerCase().includes(searchTerm));
        
        return matchInstitucion && matchBusqueda;
    });
    
    // Limpiar y llenar el select
    select.innerHTML = '<option value="">-- Todos los estudiantes --</option>';
    
    estudiantesFiltrados.forEach(est => {
        const option = document.createElement('option');
        option.value = est.idFiltro;
        option.textContent = `${est.nombre} ${est.documento ? `(${est.documento})` : ''}`;
        if (est.institucion) {
            option.textContent += ` - ${est.institucion}`;
        }
        select.appendChild(option);
    });
    
    // Actualizar contador de estudiantes filtrados
    const totalEstudiantesEl = document.getElementById('totalEstudiantes');
    if (totalEstudiantesEl) {
        totalEstudiantesEl.textContent = estudiantesFiltrados.length;
    }
}

// Cargar todos los estudiantes para el filtro
async function cargarTodosLosEstudiantes(db) {
    try {
        // Primero cargar las instituciones
        await cargarInstitucionesAdmin(db);
        
        const usuariosSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();
        
        todosLosEstudiantes = [];
        const select = document.getElementById('filterEstudiante');
        
        if (!select) return;
        
        // Limpiar opciones existentes
        select.innerHTML = '<option value="">-- Todos los estudiantes --</option>';
        
        usuariosSnapshot.forEach(doc => {
            const estudiante = doc.data();
            const estudianteId = estudiante.numeroDocumento || estudiante.numeroIdentidad || doc.id;
            
            todosLosEstudiantes.push({
                id: doc.id,
                idFiltro: estudianteId,
                nombre: estudiante.nombre || 'Sin nombre',
                documento: estudiante.numeroDocumento || estudiante.numeroIdentidad || '',
                institucion: estudiante.institucion || ''
            });
        });
        
        // Ordenar por nombre
        todosLosEstudiantes.sort((a, b) => a.nombre.localeCompare(b.nombre));
        
        // Agregar opciones al select
        todosLosEstudiantes.forEach(est => {
            const option = document.createElement('option');
            option.value = est.idFiltro;
            option.textContent = `${est.nombre} ${est.documento ? `(${est.documento})` : ''}`;
            if (est.institucion) {
                option.textContent += ` - ${est.institucion}`;
            }
            select.appendChild(option);
        });
        
        // Actualizar contador de estudiantes
        const totalEstudiantesEl = document.getElementById('totalEstudiantes');
        if (totalEstudiantesEl) {
            totalEstudiantesEl.textContent = todosLosEstudiantes.length;
        }
        
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
    }
}

// Cargar instituciones para el filtro de admin
async function cargarInstitucionesAdmin(db) {
    try {
        // Obtener instituciones únicas de los estudiantes
        const institucionesSet = new Set();
        
        const estudiantesSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();
        
        estudiantesSnapshot.forEach(doc => {
            const estudiante = doc.data();
            if (estudiante.institucion) {
                institucionesSet.add(estudiante.institucion);
            }
        });
        
        todasLasInstituciones = Array.from(institucionesSet).sort();
        
        // Llenar el selector de instituciones
        const selectInstitucion = document.getElementById('filterInstitucionAdmin');
        if (selectInstitucion) {
            selectInstitucion.innerHTML = '<option value="">-- Todas las instituciones --</option>';
            
            todasLasInstituciones.forEach(inst => {
                const option = document.createElement('option');
                option.value = inst;
                option.textContent = inst;
                selectInstitucion.appendChild(option);
            });
        }
        
    } catch (error) {
        console.error('Error al cargar instituciones:', error);
    }
}

// Cargar todos los resultados (para admin) - OPTIMIZADO
async function cargarTodosLosResultados(db) {
    try {
        // Obtener todas las respuestas
        const respuestasSnapshot = await db.collection('respuestas').get();

        if (respuestasSnapshot.empty) {
            mostrarEstadoVacio('pruebas');
            mostrarEstadoVacio('minisimulacros');
            
            const totalRespuestasEl = document.getElementById('totalRespuestas');
            if (totalRespuestasEl) totalRespuestasEl.textContent = '0';
            return;
        }

        // OPTIMIZACIÓN: Primero recolectar todos los IDs de pruebas únicos y respuestas únicas
        const pruebaIdsUnicos = new Set();
        const respuestasUnicasAdmin = new Set(); // Para contar pruebas respondidas únicas
        
        respuestasSnapshot.forEach(doc => {
            const respuesta = doc.data();
            if (respuesta.pruebaId) {
                pruebaIdsUnicos.add(respuesta.pruebaId);
                // Clave única: pruebaId + estudianteId (agrupa bloques de la misma prueba)
                const claveUnica = `${respuesta.pruebaId}_${respuesta.estudianteId || 'unknown'}`;
                respuestasUnicasAdmin.add(claveUnica);
            }
        });
        
        // Actualizar contador de respuestas (pruebas respondidas únicas, no documentos)
        const totalRespuestasEl = document.getElementById('totalRespuestas');
        if (totalRespuestasEl) {
            totalRespuestasEl.textContent = respuestasUnicasAdmin.size;
        }

        // OPTIMIZACIÓN: Cargar todas las pruebas en paralelo (máximo 30 a la vez)
        const pruebasCache = new Map();
        const pruebaIdsArray = Array.from(pruebaIdsUnicos);
        const batchSize = 30;
        
        for (let i = 0; i < pruebaIdsArray.length; i += batchSize) {
            const batch = pruebaIdsArray.slice(i, i + batchSize);
            const promesas = batch.map(id => db.collection('pruebas').doc(id).get());
            const resultados = await Promise.all(promesas);
            
            resultados.forEach((pruebaDoc, index) => {
                if (pruebaDoc.exists) {
                    pruebasCache.set(batch[index], pruebaDoc.data());
                }
            });
        }

        // Agrupar respuestas por prueba (ahora usando el cache)
        const pruebasMap = new Map();
        const minisimulacrosMap = new Map();

        respuestasSnapshot.forEach(doc => {
            const respuesta = doc.data();
            const pruebaId = respuesta.pruebaId;

            if (!pruebaId) return;

            // Obtener información de la prueba del cache
            const pruebaData = pruebasCache.get(pruebaId);
            
            // Si la prueba no existe, saltarla
            if (!pruebaData) return;

            const tipoPrueba = pruebaData.tipo || 'prueba';

            // Obtener bloques habilitados
            const bloquesHabilitados = [];
            if (pruebaData.bloque1) bloquesHabilitados.push(1);
            if (pruebaData.bloque2) bloquesHabilitados.push(2);

            // Obtener nombre del estudiante
            const estudianteInfo = todosLosEstudiantes.find(e => e.idFiltro === respuesta.estudianteId);
            const nombreEstudiante = estudianteInfo ? estudianteInfo.nombre : respuesta.estudianteId;

            // Crear objeto de resultado
            const resultado = {
                id: doc.id,
                pruebaId: pruebaId,
                nombrePrueba: pruebaData.nombre || 'Sin nombre',
                bloques: bloquesHabilitados,
                bloque: respuesta.bloque || 1,
                fechaRealizacion: respuesta.fechaEnvio,
                estadisticas: respuesta.estadisticas,
                tipoPrueba: tipoPrueba,
                estudianteId: respuesta.estudianteId,
                nombreEstudiante: nombreEstudiante
            };

            // Crear clave única por prueba y estudiante
            const claveUnica = `${pruebaId}_${respuesta.estudianteId}`;

            // Separar por tipo
            if (tipoPrueba === 'minisimulacro') {
                if (!minisimulacrosMap.has(claveUnica)) {
                    minisimulacrosMap.set(claveUnica, []);
                }
                minisimulacrosMap.get(claveUnica).push(resultado);
            } else {
                if (!pruebasMap.has(claveUnica)) {
                    pruebasMap.set(claveUnica, []);
                }
                pruebasMap.get(claveUnica).push(resultado);
            }
        });

        // Mostrar pruebas con información del estudiante
        mostrarPruebasAdmin(pruebasMap);

        // Mostrar minisimulacros con información del estudiante
        mostrarMinisimulacrosAdmin(minisimulacrosMap);

    } catch (error) {
        console.error('Error al cargar todos los resultados:', error);
        mostrarError('pruebas');
        mostrarError('minisimulacros');
    }
}

// Mostrar pruebas para admin (con nombre del estudiante)
function mostrarPruebasAdmin(pruebasMap) {
    const pruebasContainer = document.getElementById('pruebasGrid');

    if (pruebasMap.size === 0) {
        mostrarEstadoVacio('pruebas');
        todasLasPruebas = [];
        return;
    }

    pruebasContainer.innerHTML = '';

    // Convertir a array y ordenar por fecha
    const pruebas = Array.from(pruebasMap.entries()).map(([clave, resultados]) => {
        // Obtener el resultado más reciente
        const resultadoReciente = resultados.sort((a, b) => {
            const fechaA = a.fechaRealizacion ? a.fechaRealizacion.toDate() : new Date(0);
            const fechaB = b.fechaRealizacion ? b.fechaRealizacion.toDate() : new Date(0);
            return fechaB - fechaA;
        })[0];

        return resultadoReciente;
    });

    // Ordenar por fecha
    pruebas.sort((a, b) => {
        const fechaA = a.fechaRealizacion ? a.fechaRealizacion.toDate() : new Date(0);
        const fechaB = b.fechaRealizacion ? b.fechaRealizacion.toDate() : new Date(0);
        return fechaB - fechaA;
    });

    // Guardar en variable global
    todasLasPruebas = pruebas;

    // Poblar selector de nombres de pruebas
    poblarSelectorPruebas();

    // Crear tarjetas
    pruebas.forEach(prueba => {
        const pruebaCard = crearTarjetaPruebaAdmin(prueba);
        pruebasContainer.appendChild(pruebaCard);
    });
}

// Mostrar minisimulacros para admin (con nombre del estudiante)
function mostrarMinisimulacrosAdmin(minisimulacrosMap) {
    const minisimuContainer = document.getElementById('minisimuGrid');

    if (minisimulacrosMap.size === 0) {
        mostrarEstadoVacio('minisimulacros');
        todosLosMinisimulacros = [];
        return;
    }

    minisimuContainer.innerHTML = '';

    // Convertir a array y ordenar por fecha
    const minisimulacros = Array.from(minisimulacrosMap.entries()).map(([clave, resultados]) => {
        // Obtener el resultado más reciente
        const resultadoReciente = resultados.sort((a, b) => {
            const fechaA = a.fechaRealizacion ? a.fechaRealizacion.toDate() : new Date(0);
            const fechaB = b.fechaRealizacion ? b.fechaRealizacion.toDate() : new Date(0);
            return fechaB - fechaA;
        })[0];

        return resultadoReciente;
    });

    // Ordenar por fecha
    minisimulacros.sort((a, b) => {
        const fechaA = a.fechaRealizacion ? a.fechaRealizacion.toDate() : new Date(0);
        const fechaB = b.fechaRealizacion ? b.fechaRealizacion.toDate() : new Date(0);
        return fechaB - fechaA;
    });

    // Guardar en variable global
    todosLosMinisimulacros = minisimulacros;

    // Poblar selector de nombres de minisimulacros
    poblarSelectorMinisimulacros();

    // Crear tarjetas
    minisimulacros.forEach(minisimu => {
        const minisimuCard = crearTarjetaMinisimulacroAdmin(minisimu);
        minisimuContainer.appendChild(minisimuCard);
    });
}

// Crear tarjeta de prueba para admin (incluye nombre del estudiante)
function crearTarjetaPruebaAdmin(prueba) {
    const card = crearTarjetaPrueba(prueba);
    
    // Agregar badge con nombre del estudiante
    if (prueba.nombreEstudiante) {
        const header = card.querySelector('.result-card-header');
        if (header) {
            const estudianteBadge = document.createElement('div');
            estudianteBadge.className = 'estudiante-badge';
            estudianteBadge.innerHTML = `<i class="bi bi-person-fill"></i> ${prueba.nombreEstudiante}`;
            header.insertBefore(estudianteBadge, header.firstChild);
        }
    }
    
    return card;
}

// Crear tarjeta de minisimulacro para admin (incluye nombre del estudiante)
function crearTarjetaMinisimulacroAdmin(minisimu) {
    const card = crearTarjetaMinisimulacro(minisimu);
    
    // Agregar badge con nombre del estudiante
    if (minisimu.nombreEstudiante) {
        const header = card.querySelector('.result-card-header');
        if (header) {
            const estudianteBadge = document.createElement('div');
            estudianteBadge.className = 'estudiante-badge';
            estudianteBadge.innerHTML = `<i class="bi bi-person-fill"></i> ${minisimu.nombreEstudiante}`;
            header.insertBefore(estudianteBadge, header.firstChild);
        }
    }
    
    return card;
}

// Cargar pruebas y minisimulacros del usuario
async function cargarPruebasYMinisimulacros(db, estudianteId) {
    try {
        // Obtener todas las respuestas del estudiante
        const respuestasSnapshot = await db.collection('respuestas')
            .where('estudianteId', '==', estudianteId)
            .get();

        if (respuestasSnapshot.empty) {
            mostrarEstadoVacio('pruebas');
            mostrarEstadoVacio('minisimulacros');
            return;
        }

        // Agrupar respuestas por prueba
        const pruebasMap = new Map();
        const minisimulacrosMap = new Map();

        for (const doc of respuestasSnapshot.docs) {
            const respuesta = doc.data();
            const pruebaId = respuesta.pruebaId;

            if (!pruebaId) continue;

            // Obtener información de la prueba
            const pruebaDoc = await db.collection('pruebas').doc(pruebaId).get();

            if (!pruebaDoc.exists) continue;

            const pruebaData = pruebaDoc.data();
            const tipoPrueba = pruebaData.tipo || 'prueba';

            // Obtener bloques habilitados
            const bloquesHabilitados = [];
            if (pruebaData.bloque1) bloquesHabilitados.push(1);
            if (pruebaData.bloque2) bloquesHabilitados.push(2);

            // Crear objeto de resultado
            const resultado = {
                id: doc.id,
                pruebaId: pruebaId,
                nombrePrueba: pruebaData.nombre || 'Sin nombre',
                bloques: bloquesHabilitados,
                bloque: respuesta.bloque || 1,
                fechaRealizacion: respuesta.fechaEnvio,
                estadisticas: respuesta.estadisticas,
                tipoPrueba: tipoPrueba
            };

            // Separar por tipo
            if (tipoPrueba === 'minisimulacro') {
                if (!minisimulacrosMap.has(pruebaId)) {
                    minisimulacrosMap.set(pruebaId, []);
                }
                minisimulacrosMap.get(pruebaId).push(resultado);
            } else {
                if (!pruebasMap.has(pruebaId)) {
                    pruebasMap.set(pruebaId, []);
                }
                pruebasMap.get(pruebaId).push(resultado);
            }
        }

        // Mostrar pruebas
        mostrarPruebas(pruebasMap);

        // Mostrar minisimulacros
        mostrarMinisimulacros(minisimulacrosMap);

    } catch (error) {
        console.error('Error al cargar pruebas y minisimulacros:', error);
        mostrarError('pruebas');
        mostrarError('minisimulacros');
    }
}

// Mostrar pruebas
function mostrarPruebas(pruebasMap) {
    const pruebasContainer = document.getElementById('pruebasGrid');

    if (pruebasMap.size === 0) {
        mostrarEstadoVacio('pruebas');
        todasLasPruebas = [];
        return;
    }

    pruebasContainer.innerHTML = '';

    // Convertir a array y ordenar por fecha
    const pruebas = Array.from(pruebasMap.entries()).map(([pruebaId, resultados]) => {
        // Obtener el resultado más reciente
        const resultadoReciente = resultados.sort((a, b) => {
            const fechaA = a.fechaRealizacion ? a.fechaRealizacion.toDate() : new Date(0);
            const fechaB = b.fechaRealizacion ? b.fechaRealizacion.toDate() : new Date(0);
            return fechaB - fechaA;
        })[0];

        return resultadoReciente;
    });

    // Ordenar por fecha
    pruebas.sort((a, b) => {
        const fechaA = a.fechaRealizacion ? a.fechaRealizacion.toDate() : new Date(0);
        const fechaB = b.fechaRealizacion ? b.fechaRealizacion.toDate() : new Date(0);
        return fechaB - fechaA;
    });

    // Guardar en variable global
    todasLasPruebas = pruebas;

    // Poblar selector de nombres de pruebas
    poblarSelectorPruebas();

    // Crear tarjetas
    pruebas.forEach(prueba => {
        const pruebaCard = crearTarjetaPrueba(prueba);
        pruebasContainer.appendChild(pruebaCard);
    });
}

// Mostrar minisimulacros
function mostrarMinisimulacros(minisimulacrosMap) {
    const minisimuContainer = document.getElementById('minisimuGrid');

    if (minisimulacrosMap.size === 0) {
        mostrarEstadoVacio('minisimulacros');
        todosLosMinisimulacros = [];
        return;
    }

    minisimuContainer.innerHTML = '';

    // Convertir a array y ordenar por fecha
    const minisimulacros = Array.from(minisimulacrosMap.entries()).map(([pruebaId, resultados]) => {
        // Obtener el resultado más reciente
        const resultadoReciente = resultados.sort((a, b) => {
            const fechaA = a.fechaRealizacion ? a.fechaRealizacion.toDate() : new Date(0);
            const fechaB = b.fechaRealizacion ? b.fechaRealizacion.toDate() : new Date(0);
            return fechaB - fechaA;
        })[0];

        return resultadoReciente;
    });

    // Ordenar por fecha
    minisimulacros.sort((a, b) => {
        const fechaA = a.fechaRealizacion ? a.fechaRealizacion.toDate() : new Date(0);
        const fechaB = b.fechaRealizacion ? b.fechaRealizacion.toDate() : new Date(0);
        return fechaB - fechaA;
    });

    // Guardar en variable global
    todosLosMinisimulacros = minisimulacros;

    // Poblar selector de nombres de minisimulacros
    poblarSelectorMinisimulacros();

    // Crear tarjetas
    minisimulacros.forEach(minisimu => {
        const minisimuCard = crearTarjetaMinisimulacro(minisimu);
        minisimuContainer.appendChild(minisimuCard);
    });
}

// Mostrar estado vacío
function mostrarEstadoVacio(tipo) {
    const containerId = tipo === 'pruebas' ? 'pruebasGrid' : 'minisimuGrid';
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const mensajes = {
        'pruebas': {
            icono: 'bi-file-earmark-text',
            titulo: 'No hay pruebas realizadas',
            descripcion: 'Aún no has realizado ninguna prueba'
        },
        'minisimulacros': {
            icono: 'bi-clipboard-check',
            titulo: 'No hay minisimulacros realizados',
            descripcion: 'Aún no has realizado ningún minisimulacro'
        }
    };

    const mensaje = mensajes[tipo];

    container.innerHTML = `
        <div class="empty-state">
            <i class="bi ${mensaje.icono}"></i>
            <h3>${mensaje.titulo}</h3>
            <p>${mensaje.descripcion}</p>
        </div>
    `;
}

// Mostrar error
function mostrarError(tipo) {
    const containerId = tipo === 'pruebas' ? 'pruebasGrid' : 'minisimuGrid';
    const container = document.getElementById(containerId);
    
    if (!container) return;
    
    const mensajes = {
        'pruebas': 'pruebas',
        'minisimulacros': 'minisimulacros'
    };

    container.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-exclamation-triangle"></i>
            <h3>Error al cargar ${mensajes[tipo]}</h3>
            <p>No se pudieron cargar los ${mensajes[tipo]}. Intenta nuevamente.</p>
        </div>
    `;
}

// Crear tarjeta de prueba
function crearTarjetaPrueba(resultado) {
    const card = document.createElement('div');
    card.className = 'result-card';

    // Formatear fecha
    const fecha = resultado.fechaRealizacion ?
        formatearFecha(resultado.fechaRealizacion.toDate()) :
        'Fecha no disponible';

    // Obtener bloques
    const bloques = resultado.bloques || [];
    const bloquesTexto = bloques.length > 0 ?
        bloques.map(b => `Bloque ${b}`).join(' - ') :
        'Sin bloques especificados';

    card.innerHTML = `
        <div class="result-card-header">
            <div class="result-icon">
                <i class="bi bi-file-earmark-text-fill"></i>
            </div>
            <div class="result-info">
                <h3>${resultado.nombrePrueba || 'Prueba sin nombre'}</h3>
                <div class="result-date">
                    <i class="bi bi-calendar3"></i> ${fecha}
                </div>
            </div>
        </div>
        <div class="result-card-body">
            <div class="result-subjects">
                <div class="subject-item">
                    <span><i class="bi bi-grid-3x3-gap-fill"></i> Bloques:</span>
                    <span class="subject-score">${bloquesTexto}</span>
                </div>
            </div>
        </div>
        <div class="result-card-footer">
            <button class="btn-view-details" data-id="${resultado.id}" data-prueba-id="${resultado.pruebaId}" data-type="prueba" ${resultado.estudianteId ? `data-estudiante-id="${resultado.estudianteId}"` : ''}>
                <i class="bi bi-eye-fill"></i>
                Ver Resultados
            </button>
        </div>
    `;

    return card;
}

// Crear tarjeta de minisimulacro
function crearTarjetaMinisimulacro(resultado) {
    const card = document.createElement('div');
    card.className = 'result-card';

    // Formatear fecha
    const fecha = resultado.fechaRealizacion ?
        formatearFecha(resultado.fechaRealizacion.toDate()) :
        'Fecha no disponible';

    // Obtener bloques
    const bloques = resultado.bloques || [];
    const bloquesTexto = bloques.length > 0 ?
        bloques.map(b => `Bloque ${b}`).join(' - ') :
        'Sin bloques especificados';

    card.innerHTML = `
        <div class="result-card-header">
            <div class="result-icon mini">
                <i class="bi bi-clipboard-check-fill"></i>
            </div>
            <div class="result-info">
                <h3>${resultado.nombrePrueba || 'Minisimulacro sin nombre'}</h3>
                <div class="result-date">
                    <i class="bi bi-calendar3"></i> ${fecha}
                </div>
            </div>
        </div>
        <div class="result-card-body">
            <div class="result-subjects">
                <div class="subject-item">
                    <span><i class="bi bi-grid-3x3-gap-fill"></i> Bloques:</span>
                    <span class="subject-score">${bloquesTexto}</span>
                </div>
            </div>
        </div>
        <div class="result-card-footer">
            <button class="btn-view-details" data-id="${resultado.id}" data-prueba-id="${resultado.pruebaId}" data-type="minisimulacro" ${resultado.estudianteId ? `data-estudiante-id="${resultado.estudianteId}"` : ''}>
                <i class="bi bi-eye-fill"></i>
                Ver Resultados
            </button>
        </div>
    `;

    return card;
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

// Funcionalidad de botones "Ver Resultados" - Redirige a página de detalle
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-view-details') ||
        e.target.closest('.btn-view-details')) {
        const button = e.target.classList.contains('btn-view-details') ?
            e.target :
            e.target.closest('.btn-view-details');

        const id = button.getAttribute('data-id');
        const pruebaId = button.getAttribute('data-prueba-id');
        const type = button.getAttribute('data-type');
        const estudianteIdAttr = button.getAttribute('data-estudiante-id');

        // Construir URL con parámetros
        let url = `Detalle-Resultados.html?id=${id}&pruebaId=${pruebaId}&tipo=${type}`;
        
        // Si es admin y hay un estudianteId, agregarlo a la URL
        if (esAdmin && estudianteIdAttr) {
            url += `&estudianteId=${encodeURIComponent(estudianteIdAttr)}`;
        }

        // Redirigir a la página de detalle de resultados
        window.location.href = url;
    }
});


// Inicializar filtros y búsqueda
function inicializarFiltros() {
    // Filtros de Pruebas
    const searchPruebas = document.getElementById('searchPruebas');
    const filterNombrePrueba = document.getElementById('filterNombrePrueba');
    const clearFiltersPruebas = document.getElementById('clearFiltersPruebas');

    if (searchPruebas) {
        searchPruebas.addEventListener('input', () => filtrarPruebas());
    }
    if (filterNombrePrueba) {
        filterNombrePrueba.addEventListener('change', () => filtrarPruebas());
    }
    if (clearFiltersPruebas) {
        clearFiltersPruebas.addEventListener('click', () => limpiarFiltrosPruebas());
    }

    // Filtros de Minisimulacros
    const searchMinisimu = document.getElementById('searchMinisimulacros');
    const filterNombreMinisimu = document.getElementById('filterNombreMinisimu');
    const clearFiltersMinisimu = document.getElementById('clearFiltersMinisimu');

    if (searchMinisimu) {
        searchMinisimu.addEventListener('input', () => filtrarMinisimulacros());
    }
    if (filterNombreMinisimu) {
        filterNombreMinisimu.addEventListener('change', () => filtrarMinisimulacros());
    }
    if (clearFiltersMinisimu) {
        clearFiltersMinisimu.addEventListener('click', () => limpiarFiltrosMinisimu());
    }
}

// Poblar selector de nombres de pruebas
function poblarSelectorPruebas() {
    const select = document.getElementById('filterNombrePrueba');
    if (!select) return;
    
    // Obtener nombres únicos de pruebas
    const nombresUnicos = [...new Set(todasLasPruebas.map(p => p.nombrePrueba))].sort();
    
    // Limpiar y llenar el selector
    select.innerHTML = '<option value="">Todas las pruebas</option>';
    nombresUnicos.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
}

// Poblar selector de nombres de minisimulacros
function poblarSelectorMinisimulacros() {
    const select = document.getElementById('filterNombreMinisimu');
    if (!select) return;
    
    // Obtener nombres únicos de minisimulacros
    const nombresUnicos = [...new Set(todosLosMinisimulacros.map(m => m.nombrePrueba))].sort();
    
    // Limpiar y llenar el selector
    select.innerHTML = '<option value="">Todos los simulacros</option>';
    nombresUnicos.forEach(nombre => {
        const option = document.createElement('option');
        option.value = nombre;
        option.textContent = nombre;
        select.appendChild(option);
    });
}

// Filtrar pruebas
function filtrarPruebas() {
    const searchTerm = document.getElementById('searchPruebas').value.toLowerCase();
    const nombreSeleccionado = document.getElementById('filterNombrePrueba').value;

    let pruebasFiltradas = todasLasPruebas.filter(prueba => {
        // Filtro por búsqueda de texto (nombre de prueba o estudiante)
        const nombrePruebaMatch = prueba.nombrePrueba.toLowerCase().includes(searchTerm);
        
        // Filtro por nombre de estudiante (solo admin)
        const nombreEstudianteMatch = esAdmin && prueba.nombreEstudiante ? 
            prueba.nombreEstudiante.toLowerCase().includes(searchTerm) : false;
        
        const searchMatch = nombrePruebaMatch || nombreEstudianteMatch;

        // Filtro por nombre específico de prueba
        let nombreMatch = true;
        if (nombreSeleccionado) {
            nombreMatch = prueba.nombrePrueba === nombreSeleccionado;
        }

        return searchMatch && nombreMatch;
    });

    // Mostrar resultados filtrados
    mostrarPruebasFiltradas(pruebasFiltradas);
}

// Filtrar minisimulacros
function filtrarMinisimulacros() {
    const searchTerm = document.getElementById('searchMinisimulacros').value.toLowerCase();
    const nombreSeleccionado = document.getElementById('filterNombreMinisimu').value;

    let minisimuFiltrados = todosLosMinisimulacros.filter(minisimu => {
        // Filtro por búsqueda de texto (nombre de minisimulacro o estudiante)
        const nombreMinisimuMatch = minisimu.nombrePrueba.toLowerCase().includes(searchTerm);
        
        // Filtro por nombre de estudiante (solo admin)
        const nombreEstudianteMatch = esAdmin && minisimu.nombreEstudiante ? 
            minisimu.nombreEstudiante.toLowerCase().includes(searchTerm) : false;
        
        const searchMatch = nombreMinisimuMatch || nombreEstudianteMatch;

        // Filtro por nombre específico de minisimulacro
        let nombreMatch = true;
        if (nombreSeleccionado) {
            nombreMatch = minisimu.nombrePrueba === nombreSeleccionado;
        }

        return searchMatch && nombreMatch;
    });

    // Mostrar resultados filtrados
    mostrarMinisimuFiltrados(minisimuFiltrados);
}

// Limpiar filtros de pruebas
function limpiarFiltrosPruebas() {
    document.getElementById('searchPruebas').value = '';
    document.getElementById('filterNombrePrueba').value = '';
    filtrarPruebas();
}

// Limpiar filtros de minisimulacros
function limpiarFiltrosMinisimu() {
    document.getElementById('searchMinisimulacros').value = '';
    document.getElementById('filterNombreMinisimu').value = '';
    filtrarMinisimulacros();
}

// Mostrar pruebas filtradas
function mostrarPruebasFiltradas(pruebas) {
    const pruebasContainer = document.getElementById('pruebasGrid');

    if (pruebas.length === 0) {
        pruebasContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-search"></i>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros criterios de búsqueda</p>
            </div>
        `;
        return;
    }

    pruebasContainer.innerHTML = '';
    pruebas.forEach(prueba => {
        // Usar función de admin si es admin y tiene nombre de estudiante
        const pruebaCard = (esAdmin && prueba.nombreEstudiante) ? 
            crearTarjetaPruebaAdmin(prueba) : crearTarjetaPrueba(prueba);
        pruebasContainer.appendChild(pruebaCard);
    });
}

// Mostrar minisimulacros filtrados
function mostrarMinisimuFiltrados(minisimulacros) {
    const minisimuContainer = document.getElementById('minisimuGrid');

    if (minisimulacros.length === 0) {
        minisimuContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-search"></i>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otros criterios de búsqueda</p>
            </div>
        `;
        return;
    }

    minisimuContainer.innerHTML = '';
    minisimulacros.forEach(minisimu => {
        // Usar función de admin si es admin y tiene nombre de estudiante
        const minisimuCard = (esAdmin && minisimu.nombreEstudiante) ? 
            crearTarjetaMinisimulacroAdmin(minisimu) : crearTarjetaMinisimulacro(minisimu);
        minisimuContainer.appendChild(minisimuCard);
    });
}

// ========== PLAN DE ESTUDIO ==========

// Variable para controlar si ya se cargaron las pruebas del plan
let pruebasPlanEstudioCargadas = false;

// Cargar pruebas para la sección de Plan de Estudio
async function cargarPruebasParaPlanEstudio() {
    // Evitar cargar múltiples veces
    if (pruebasPlanEstudioCargadas) return;
    
    const grid = document.getElementById('planEstudioGrid');
    if (!grid) return;
    
    // Mostrar loading con animación
    grid.innerHTML = `
        <div class="plan-loading-state" role="status" aria-live="polite">
            <div class="plan-loading-spinner">
                <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
            </div>
            <h3>Analizando tus resultados...</h3>
            <p>Preparando recomendaciones de estudio</p>
        </div>
    `;
    
    try {
        const usuarioActual = sessionStorage.getItem('currentUser');
        if (!usuarioActual) return;
        
        const usuario = JSON.parse(usuarioActual);
        const estudianteId = usuario.numeroDocumento || usuario.numeroIdentidad || usuario.id;
        
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        
        // Obtener todas las respuestas del estudiante
        const respuestasSnapshot = await db.collection('respuestas')
            .where('estudianteId', '==', estudianteId)
            .get();
        
        if (respuestasSnapshot.empty) {
            grid.innerHTML = `
                <div class="plan-empty-state">
                    <i class="bi bi-clipboard-x" aria-hidden="true"></i>
                    <h3>No hay pruebas realizadas</h3>
                    <p>Realiza algunas pruebas primero para poder crear tu plan de estudio personalizado.</p>
                </div>
            `;
            return;
        }
        
        // Agrupar respuestas por prueba y calcular estadísticas
        const pruebasConEstadisticas = new Map();
        
        for (const doc of respuestasSnapshot.docs) {
            const respuesta = doc.data();
            const pruebaId = respuesta.pruebaId;
            
            if (!pruebaId) continue;
            
            // Obtener información de la prueba
            const pruebaDoc = await db.collection('pruebas').doc(pruebaId).get();
            if (!pruebaDoc.exists) continue;
            
            const pruebaData = pruebaDoc.data();
            
            // Solo procesar pruebas completas (no minisimulacros para plan de estudio)
            if (pruebaData.tipo === 'minisimulacro') continue;
            
            // Acumular estadísticas
            if (!pruebasConEstadisticas.has(pruebaId)) {
                pruebasConEstadisticas.set(pruebaId, {
                    pruebaId,
                    nombre: pruebaData.nombre || 'Prueba sin nombre',
                    fecha: respuesta.fechaEnvio,
                    totalPreguntas: 0,
                    correctas: 0,
                    incorrectas: 0,
                    temasConErrores: new Set()
                });
            }
            
            const stats = pruebasConEstadisticas.get(pruebaId);
            
            // Procesar estadísticas generales - verificar diferentes estructuras
            if (respuesta.estadisticas) {
                const estadisticas = respuesta.estadisticas;
                const total = estadisticas.totalPreguntas || 0;
                // Puede ser 'respuestasCorrectas' o 'correctas'
                const correctas = estadisticas.respuestasCorrectas || estadisticas.correctas || 0;
                const incorrectas = total - correctas;
                
                stats.totalPreguntas += total;
                stats.correctas += correctas;
                stats.incorrectas += incorrectas;
            } else if (respuesta.respuestasEvaluadas) {
                // Si no hay estadísticas, calcular desde respuestasEvaluadas
                Object.keys(respuesta.respuestasEvaluadas).forEach(materia => {
                    const respuestasMateria = respuesta.respuestasEvaluadas[materia];
                    Object.values(respuestasMateria).forEach(pregunta => {
                        stats.totalPreguntas++;
                        if (pregunta.esCorrecta) {
                            stats.correctas++;
                        } else {
                            stats.incorrectas++;
                        }
                    });
                });
            }
            
            // Procesar respuestas individuales para encontrar temas con errores
            if (respuesta.respuestasEvaluadas) {
                Object.keys(respuesta.respuestasEvaluadas).forEach(materia => {
                    const respuestasMateria = respuesta.respuestasEvaluadas[materia];
                    Object.values(respuestasMateria).forEach(pregunta => {
                        if (!pregunta.esCorrecta) {
                            // Agregar tema si existe
                            if (pregunta.tema && pregunta.tema !== 'No especificado') {
                                stats.temasConErrores.add(pregunta.tema);
                            }
                            // También agregar competencia y componente si existen
                            if (pregunta.competencia && pregunta.competencia !== 'No especificado') {
                                stats.temasConErrores.add(pregunta.competencia);
                            }
                        }
                    });
                });
            }
            
            // Actualizar fecha más reciente
            if (respuesta.fechaEnvio && (!stats.fecha || respuesta.fechaEnvio > stats.fecha)) {
                stats.fecha = respuesta.fechaEnvio;
            }
        }
        
        if (pruebasConEstadisticas.size === 0) {
            grid.innerHTML = `
                <div class="plan-empty-state">
                    <i class="bi bi-clipboard-check" aria-hidden="true"></i>
                    <h3>No hay pruebas disponibles</h3>
                    <p>Las pruebas que realices aparecerán aquí para crear tu plan de estudio.</p>
                </div>
            `;
            return;
        }
        
        // Convertir a array y ordenar por fecha (más reciente primero)
        const pruebasArray = Array.from(pruebasConEstadisticas.values()).sort((a, b) => {
            if (!a.fecha) return 1;
            if (!b.fecha) return -1;
            return b.fecha.toDate() - a.fecha.toDate();
        });
        
        // Renderizar tarjetas
        grid.innerHTML = pruebasArray.map(prueba => crearTarjetaPlanEstudio(prueba)).join('');
        
        // Event listeners para botones
        grid.querySelectorAll('.btn-crear-plan').forEach(btn => {
            btn.addEventListener('click', function() {
                const pruebaId = this.dataset.pruebaId;
                window.location.href = `Plan-Estudio.html?pruebaId=${pruebaId}`;
            });
        });
        
        pruebasPlanEstudioCargadas = true;
        
    } catch (error) {
        console.error('Error al cargar pruebas para plan de estudio:', error);
        grid.innerHTML = `
            <div class="plan-empty-state plan-error-state">
                <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                <h3>Error al cargar pruebas</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Crear tarjeta de prueba para Plan de Estudio
function crearTarjetaPlanEstudio(prueba) {
    const porcentaje = prueba.totalPreguntas > 0 
        ? Math.round((prueba.correctas / prueba.totalPreguntas) * 100) 
        : 0;
    
    // Determinar nivel de urgencia
    let urgencia = 'baja';
    let urgenciaTexto = '¡Excelente!';
    if (porcentaje < 50) {
        urgencia = 'alta';
        urgenciaTexto = 'Urgente';
    } else if (porcentaje < 70) {
        urgencia = 'media';
        urgenciaTexto = 'Reforzar';
    }
    
    const fechaFormateada = prueba.fecha 
        ? prueba.fecha.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'Sin fecha';
    
    return `
        <article class="plan-prueba-card">
            <div class="plan-prueba-header">
                <div class="plan-prueba-icon">
                    <i class="bi bi-file-earmark-text"></i>
                </div>
                <div class="plan-prueba-info">
                    <h4>${prueba.nombre}</h4>
                    <p><i class="bi bi-calendar3"></i> ${fechaFormateada}</p>
                </div>
            </div>
            
            <div class="plan-prueba-stats">
                <div class="plan-stat correctas">
                    <span class="valor">${prueba.correctas}</span>
                    <span class="label">Correctas</span>
                </div>
                <div class="plan-stat incorrectas">
                    <span class="valor">${prueba.incorrectas}</span>
                    <span class="label">Incorrectas</span>
                </div>
                <div class="plan-stat porcentaje">
                    <span class="valor">${porcentaje}%</span>
                    <span class="label">Rendimiento</span>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <span class="urgencia-badge ${urgencia}">
                    <i class="bi bi-${urgencia === 'alta' ? 'exclamation-triangle' : urgencia === 'media' ? 'bookmark-star' : 'trophy'}"></i>
                    ${urgenciaTexto}
                </span>
                <span style="color: rgba(255,255,255,0.5); font-size: 0.85rem;">
                    <i class="bi bi-book"></i> ${prueba.temasConErrores.size} tema(s) a reforzar
                </span>
            </div>
            
            <div class="plan-prueba-footer">
                <button class="btn-crear-plan" data-prueba-id="${prueba.pruebaId}">
                    <i class="bi bi-calendar-plus"></i>
                    Crear Plan de Estudio
                </button>
            </div>
        </article>
    `;
}

// ========== PLANES DE ESTUDIO - VISTA ADMIN ==========

let planesEstudiantesCargados = false;
let todosLosPlanesEstudiantes = [];

// Cargar planes de estudio de todos los estudiantes (solo admin)
async function cargarPlanesEstudiantesAdmin() {
    if (planesEstudiantesCargados) return;
    
    const grid = document.getElementById('planesAdminGrid');
    if (!grid) return;
    
    // Mostrar loading
    grid.innerHTML = `
        <div class="plan-loading-state" role="status" aria-live="polite">
            <div class="plan-loading-spinner">
                <i class="bi bi-arrow-repeat" aria-hidden="true"></i>
            </div>
            <h3>Cargando planes de estudio...</h3>
            <p>Obteniendo información de los estudiantes</p>
        </div>
    `;
    
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        
        // Obtener todos los planes de estudio
        const planesSnapshot = await db.collection('planesEstudio')
            .orderBy('fechaActualizacion', 'desc')
            .get();
        
        if (planesSnapshot.empty) {
            grid.innerHTML = `
                <div class="plan-empty-state">
                    <i class="bi bi-calendar-x" aria-hidden="true"></i>
                    <h3>No hay planes de estudio</h3>
                    <p>Los estudiantes aún no han creado planes de estudio.</p>
                </div>
            `;
            return;
        }
        
        // Procesar planes
        todosLosPlanesEstudiantes = [];
        
        for (const doc of planesSnapshot.docs) {
            const plan = doc.data();
            
            // Obtener nombre de la prueba
            let nombrePrueba = 'Prueba no encontrada';
            try {
                const pruebaDoc = await db.collection('pruebas').doc(plan.pruebaId).get();
                if (pruebaDoc.exists) {
                    nombrePrueba = pruebaDoc.data().nombre || 'Sin nombre';
                }
            } catch (e) {
                console.error('Error al obtener prueba:', e);
            }
            
            todosLosPlanesEstudiantes.push({
                id: doc.id,
                ...plan,
                nombrePrueba
            });
        }
        
        // Configurar filtros (solo una vez)
        if (!planesEstudiantesCargados) {
            configurarFiltrosPlanesAdmin();
        }
        
        planesEstudiantesCargados = true;
        
        // Aplicar filtros actuales y renderizar
        filtrarPlanesAdmin();
        
    } catch (error) {
        console.error('Error al cargar planes de estudiantes:', error);
        grid.innerHTML = `
            <div class="plan-empty-state plan-error-state">
                <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
                <h3>Error al cargar planes</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Renderizar planes de admin
function renderizarPlanesAdmin(planes) {
    const grid = document.getElementById('planesAdminGrid');
    if (!grid) return;
    
    if (planes.length === 0) {
        grid.innerHTML = `
            <div class="plan-empty-state">
                <i class="bi bi-search" aria-hidden="true"></i>
                <h3>No se encontraron planes</h3>
                <p>No hay planes que coincidan con los filtros.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = planes.map(plan => crearTarjetaPlanAdmin(plan)).join('');
    
    // Event listeners para ver detalles
    grid.querySelectorAll('.btn-ver-plan').forEach(btn => {
        btn.addEventListener('click', function() {
            const planId = this.dataset.planId;
            verDetallePlanAdmin(planId);
        });
    });
}

// Crear tarjeta de plan para admin
function crearTarjetaPlanAdmin(plan) {
    const iniciales = (plan.estudianteNombre || 'NN').split(' ')
        .map(n => n.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    
    const totalSesiones = plan.sesiones ? plan.sesiones.length : 0;
    const totalTemas = plan.temasAReforzar ? plan.temasAReforzar.length : 0;
    
    // Calcular días hasta la fecha límite
    let diasRestantes = '--';
    let estadoPlan = 'pendiente';
    if (plan.configuracion && plan.configuracion.fechaLimite) {
        const fechaLimite = new Date(plan.configuracion.fechaLimite);
        const hoy = new Date();
        const diff = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
        diasRestantes = diff;
        
        if (diff < 0) {
            estadoPlan = 'completado';
        } else if (diff <= 7) {
            estadoPlan = 'activo';
        }
    }
    
    const fechaActualizacion = plan.fechaActualizacion 
        ? plan.fechaActualizacion.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
        : 'Sin fecha';
    
    return `
        <article class="plan-admin-card">
            <div class="plan-admin-header">
                <div class="plan-admin-avatar">${iniciales}</div>
                <div class="plan-admin-info">
                    <h4>${plan.estudianteNombre || 'Estudiante'}</h4>
                    <p>${plan.institucion || 'Sin institución'}</p>
                </div>
                <span class="plan-progreso-badge ${estadoPlan}">
                    <i class="bi bi-${estadoPlan === 'activo' ? 'lightning' : estadoPlan === 'completado' ? 'check-circle' : 'clock'}"></i>
                    ${estadoPlan === 'activo' ? 'Activo' : estadoPlan === 'completado' ? 'Finalizado' : 'Pendiente'}
                </span>
            </div>
            
            <div class="plan-admin-body">
                <div class="plan-admin-prueba">
                    <i class="bi bi-file-earmark-text"></i>
                    <span>${plan.nombrePrueba}</span>
                </div>
                
                <div class="plan-admin-stats">
                    <div class="plan-admin-stat sesiones">
                        <span class="valor">${totalSesiones}</span>
                        <span class="label">Sesiones</span>
                    </div>
                    <div class="plan-admin-stat temas">
                        <span class="valor">${totalTemas}</span>
                        <span class="label">Temas</span>
                    </div>
                    <div class="plan-admin-stat dias">
                        <span class="valor">${diasRestantes}</span>
                        <span class="label">Días rest.</span>
                    </div>
                </div>
            </div>
            
            <div class="plan-admin-footer">
                <button class="btn-ver-plan" data-plan-id="${plan.id}">
                    <i class="bi bi-eye"></i>
                    Ver Detalle
                </button>
            </div>
            
            <div class="plan-fecha-actualizacion">
                <i class="bi bi-clock-history"></i> Actualizado: ${fechaActualizacion}
            </div>
        </article>
    `;
}

// Ver detalle de plan (modal)
function verDetallePlanAdmin(planId) {
    const plan = todosLosPlanesEstudiantes.find(p => p.id === planId);
    if (!plan) return;
    
    const totalSesiones = plan.sesiones ? plan.sesiones.length : 0;
    
    // Colores por materia
    const coloresMateria = {
        'LC': '#FF4D4D', 'MT': '#33CCFF', 'SC': '#FF8C00', 'CN': '#33FF77', 'IN': '#B366FF',
        'lectura': '#FF4D4D', 'matematicas': '#33CCFF', 'sociales': '#FF8C00', 'ciencias': '#33FF77', 'ingles': '#B366FF'
    };
    
    const temasHtml = (plan.temasAReforzar || []).map(tema => {
        const color = coloresMateria[tema.materia] || '#ffa500';
        return `
            <div style="display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: rgba(255,255,255,0.05); border-radius: 8px; margin-bottom: 0.5rem; border-left: 3px solid ${color};">
                <span style="color: ${color}; font-weight: 600; min-width: 30px;">${tema.materia}</span>
                <span style="color: rgba(255,255,255,0.9);">${tema.tema || tema.competencia || 'Sin especificar'}</span>
            </div>
        `;
    }).join('') || '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 1rem;">No hay temas definidos</p>';
    
    // Agrupar sesiones por fecha
    const sesionesPorFecha = {};
    (plan.sesiones || []).forEach(sesion => {
        const fecha = new Date(sesion.fecha);
        const fechaKey = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
        if (!sesionesPorFecha[fechaKey]) {
            sesionesPorFecha[fechaKey] = [];
        }
        sesionesPorFecha[fechaKey].push(sesion);
    });
    
    const sesionesHtml = Object.keys(sesionesPorFecha).slice(0, 7).map(fecha => {
        const sesiones = sesionesPorFecha[fecha];
        return `
            <div style="margin-bottom: 0.75rem;">
                <div style="font-size: 0.85rem; color: #ffa500; font-weight: 600; margin-bottom: 0.5rem;">${fecha}</div>
                ${sesiones.map(s => {
                    const color = coloresMateria[s.materia] || '#ffa500';
                    return `
                        <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: 6px; margin-bottom: 0.25rem;">
                            <span style="color: rgba(255,255,255,0.6); font-size: 0.8rem; min-width: 45px;">${s.horaInicio || '--:--'}</span>
                            <span style="width: 8px; height: 8px; border-radius: 50%; background: ${color};"></span>
                            <span style="color: white; font-size: 0.85rem;">${s.tema || s.materia}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }).join('') || '<p style="color: rgba(255,255,255,0.5); text-align: center; padding: 1rem;">No hay sesiones programadas</p>';
    
    const diasRestantes = Object.keys(sesionesPorFecha).length > 7 ? Object.keys(sesionesPorFecha).length - 7 : 0;
    
    Swal.fire({
        title: `<i class="bi bi-calendar-check" style="color: #ffa500;"></i> Plan de Estudio`,
        html: `
            <div style="text-align: left; max-height: 65vh; overflow-y: auto; padding-right: 0.5rem;">
                <!-- Info del estudiante -->
                <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255,165,0,0.1); border-radius: 12px; margin-bottom: 1.5rem;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #ffa500, #cc8400); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem;">
                        ${(plan.estudianteNombre || 'NN').split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('')}
                    </div>
                    <div>
                        <div style="font-weight: 700; font-size: 1.1rem;">${plan.estudianteNombre}</div>
                        <div style="color: rgba(255,255,255,0.6); font-size: 0.85rem;">${plan.institucion || 'Sin institución'}</div>
                    </div>
                </div>
                
                <!-- Prueba -->
                <div style="margin-bottom: 1.25rem; padding: 0.75rem 1rem; background: rgba(255,0,0,0.1); border-radius: 10px; border-left: 3px solid #ff0000;">
                    <div style="font-size: 0.8rem; color: rgba(255,255,255,0.6); margin-bottom: 0.25rem;">Prueba</div>
                    <div style="font-weight: 600;">${plan.nombrePrueba}</div>
                </div>
                
                <!-- Estadísticas -->
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;">
                    <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: #ffa500;">${totalSesiones}</div>
                        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); text-transform: uppercase;">Sesiones</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: #ff5252;">${plan.temasAReforzar?.length || 0}</div>
                        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); text-transform: uppercase;">Temas</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 10px;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: #33ff77;">${plan.configuracion?.horasPorDia || 2}h</div>
                        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.5); text-transform: uppercase;">Hrs/día</div>
                    </div>
                </div>
                
                <!-- Temas a reforzar -->
                <div style="margin-bottom: 1.5rem;">
                    <h4 style="color: #ff5252; margin-bottom: 0.75rem; font-size: 0.95rem;"><i class="bi bi-book"></i> Temas a Reforzar</h4>
                    <div style="max-height: 150px; overflow-y: auto;">
                        ${temasHtml}
                    </div>
                </div>
                
                <!-- Sesiones programadas -->
                <div>
                    <h4 style="color: #33ff77; margin-bottom: 0.75rem; font-size: 0.95rem;"><i class="bi bi-calendar-week"></i> Cronograma de Sesiones</h4>
                    <div style="max-height: 200px; overflow-y: auto;">
                        ${sesionesHtml}
                        ${diasRestantes > 0 ? `<p style="color: rgba(255,255,255,0.4); text-align: center; font-size: 0.85rem; padding: 0.5rem;">... y ${diasRestantes} día(s) más con sesiones</p>` : ''}
                    </div>
                </div>
            </div>
        `,
        background: '#1a1a1a',
        color: '#fff',
        width: '600px',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            popup: 'plan-detail-modal'
        }
    });
}

// Configurar filtros de planes admin (usa los filtros existentes de admin)
function configurarFiltrosPlanesAdmin() {
    // Usar los filtros existentes de admin
    const searchInput = document.getElementById('searchEstudianteAdmin');
    const filterInstitucion = document.getElementById('filterInstitucionAdmin');
    const filterEstudiante = document.getElementById('filterEstudiante');
    
    // Agregar listeners para filtrar planes cuando cambian
    if (searchInput) {
        searchInput.addEventListener('input', filtrarPlanesAdminSiActivo);
    }
    
    if (filterInstitucion) {
        filterInstitucion.addEventListener('change', filtrarPlanesAdminSiActivo);
    }
    
    if (filterEstudiante) {
        filterEstudiante.addEventListener('change', filtrarPlanesAdminSiActivo);
    }
}

// Solo filtrar si el tab de planes está activo
function filtrarPlanesAdminSiActivo() {
    const tabPlanesActivo = document.getElementById('planes-admin-content')?.classList.contains('active');
    if (tabPlanesActivo) {
        filtrarPlanesAdmin();
    }
}

// Filtrar planes admin usando los filtros existentes
function filtrarPlanesAdmin() {
    const searchTerm = (document.getElementById('searchEstudianteAdmin')?.value || '').toLowerCase();
    const institucion = document.getElementById('filterInstitucionAdmin')?.value || '';
    const estudianteSeleccionadoId = document.getElementById('filterEstudiante')?.value || '';
    
    const planesFiltrados = todosLosPlanesEstudiantes.filter(plan => {
        // Filtrar por búsqueda de texto
        const coincideBusqueda = !searchTerm || 
            (plan.estudianteNombre || '').toLowerCase().includes(searchTerm) ||
            (plan.nombrePrueba || '').toLowerCase().includes(searchTerm);
        
        // Filtrar por institución
        const coincideInstitucion = !institucion || plan.institucion === institucion;
        
        // Filtrar por estudiante específico
        const coincideEstudiante = !estudianteSeleccionadoId || plan.estudianteId === estudianteSeleccionadoId;
        
        return coincideBusqueda && coincideInstitucion && coincideEstudiante;
    });
    
    renderizarPlanesAdmin(planesFiltrados);
}
