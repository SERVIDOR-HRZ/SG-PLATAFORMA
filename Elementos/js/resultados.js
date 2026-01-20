// Resultados.js - Funcionalidad para la sección de resultados

// Variables globales para filtros
let todasLasPruebas = [];
let todosLosMinisimulacros = [];

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

        // Obtener el ID del estudiante (puede ser numeroDocumento, numeroIdentidad o id)
        const estudianteId = usuario.numeroDocumento || usuario.numeroIdentidad || usuario.id;

        // Cargar pruebas y minisimulacros
        await cargarPruebasYMinisimulacros(db, estudianteId);

    } catch (error) {
        console.error('Error al cargar resultados:', error);
    }
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

    // Crear tarjetas
    minisimulacros.forEach(minisimu => {
        const minisimuCard = crearTarjetaMinisimulacro(minisimu);
        minisimuContainer.appendChild(minisimuCard);
    });
}

// Mostrar estado vacío
function mostrarEstadoVacio(tipo) {
    const container = document.querySelector(`#${tipo}-content .results-grid`);
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
    const container = document.querySelector(`#${tipo}-content .results-grid`);
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
            <button class="btn-view-details" data-id="${resultado.id}" data-prueba-id="${resultado.pruebaId}" data-type="prueba">
                <i class="bi bi-eye-fill"></i>
                Ver Resultados
            </button>
        </div>
    `;

    return card;
}

// Crear tarjeta de minisimulacro// Crear tarjeta de minisimulacro
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
            <button class="btn-view-details" data-id="${resultado.id}" data-prueba-id="${resultado.pruebaId}" data-type="minisimulacro">
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

// Funcionalidad de botones "Ver Resultados" (placeholder)
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn-view-details') ||
        e.target.closest('.btn-view-details')) {
        const button = e.target.classList.contains('btn-view-details') ?
            e.target :
            e.target.closest('.btn-view-details');

        const id = button.getAttribute('data-id');
        const type = button.getAttribute('data-type');

        console.log(`Ver resultados de ${type} con ID: ${id}`);
        // Funcionalidad pendiente
    }
});


// Inicializar filtros y búsqueda
function inicializarFiltros() {
    // Filtros de Pruebas
    const searchPruebas = document.getElementById('searchPruebas');
    const filterPruebasDesde = document.getElementById('filterPruebasDesde');
    const filterPruebasHasta = document.getElementById('filterPruebasHasta');
    const clearFiltersPruebas = document.getElementById('clearFiltersPruebas');

    if (searchPruebas) {
        searchPruebas.addEventListener('input', () => filtrarPruebas());
    }
    if (filterPruebasDesde) {
        filterPruebasDesde.addEventListener('change', () => filtrarPruebas());
    }
    if (filterPruebasHasta) {
        filterPruebasHasta.addEventListener('change', () => filtrarPruebas());
    }
    if (clearFiltersPruebas) {
        clearFiltersPruebas.addEventListener('click', () => limpiarFiltrosPruebas());
    }

    // Filtros de Minisimulacros
    const searchMinisimu = document.getElementById('searchMinisimulacros');
    const filterMinisimuDesde = document.getElementById('filterMinisimuDesde');
    const filterMinisimuHasta = document.getElementById('filterMinisimuHasta');
    const clearFiltersMinisimu = document.getElementById('clearFiltersMinisimu');

    if (searchMinisimu) {
        searchMinisimu.addEventListener('input', () => filtrarMinisimulacros());
    }
    if (filterMinisimuDesde) {
        filterMinisimuDesde.addEventListener('change', () => filtrarMinisimulacros());
    }
    if (filterMinisimuHasta) {
        filterMinisimuHasta.addEventListener('change', () => filtrarMinisimulacros());
    }
    if (clearFiltersMinisimu) {
        clearFiltersMinisimu.addEventListener('click', () => limpiarFiltrosMinisimu());
    }
}

// Filtrar pruebas
function filtrarPruebas() {
    const searchTerm = document.getElementById('searchPruebas').value.toLowerCase();
    const fechaDesde = document.getElementById('filterPruebasDesde').value;
    const fechaHasta = document.getElementById('filterPruebasHasta').value;

    let pruebasFiltradas = todasLasPruebas.filter(prueba => {
        // Filtro por nombre
        const nombreMatch = prueba.nombrePrueba.toLowerCase().includes(searchTerm);

        // Filtro por fecha
        let fechaMatch = true;
        if (prueba.fechaRealizacion) {
            const fechaPrueba = prueba.fechaRealizacion.toDate();
            const fechaPruebaStr = fechaPrueba.toISOString().split('T')[0];

            if (fechaDesde && fechaPruebaStr < fechaDesde) {
                fechaMatch = false;
            }
            if (fechaHasta && fechaPruebaStr > fechaHasta) {
                fechaMatch = false;
            }
        }

        return nombreMatch && fechaMatch;
    });

    // Actualizar contador
    const pruebasCount = document.getElementById('pruebasCount');
    if (pruebasCount) {
        pruebasCount.textContent = `${pruebasFiltradas.length} resultado${pruebasFiltradas.length !== 1 ? 's' : ''}`;
    }

    // Mostrar resultados filtrados
    mostrarPruebasFiltradas(pruebasFiltradas);
}

// Filtrar minisimulacros
function filtrarMinisimulacros() {
    const searchTerm = document.getElementById('searchMinisimulacros').value.toLowerCase();
    const fechaDesde = document.getElementById('filterMinisimuDesde').value;
    const fechaHasta = document.getElementById('filterMinisimuHasta').value;

    let minisimuFiltrados = todosLosMinisimulacros.filter(minisimu => {
        // Filtro por nombre
        const nombreMatch = minisimu.nombrePrueba.toLowerCase().includes(searchTerm);

        // Filtro por fecha
        let fechaMatch = true;
        if (minisimu.fechaRealizacion) {
            const fechaMinisimu = minisimu.fechaRealizacion.toDate();
            const fechaMinisimuStr = fechaMinisimu.toISOString().split('T')[0];

            if (fechaDesde && fechaMinisimuStr < fechaDesde) {
                fechaMatch = false;
            }
            if (fechaHasta && fechaMinisimuStr > fechaHasta) {
                fechaMatch = false;
            }
        }

        return nombreMatch && fechaMatch;
    });

    // Actualizar contador
    const minisimuCount = document.getElementById('minisimuCount');
    if (minisimuCount) {
        minisimuCount.textContent = `${minisimuFiltrados.length} resultado${minisimuFiltrados.length !== 1 ? 's' : ''}`;
    }

    // Mostrar resultados filtrados
    mostrarMinisimuFiltrados(minisimuFiltrados);
}

// Limpiar filtros de pruebas
function limpiarFiltrosPruebas() {
    document.getElementById('searchPruebas').value = '';
    document.getElementById('filterPruebasDesde').value = '';
    document.getElementById('filterPruebasHasta').value = '';
    filtrarPruebas();
}

// Limpiar filtros de minisimulacros
function limpiarFiltrosMinisimu() {
    document.getElementById('searchMinisimulacros').value = '';
    document.getElementById('filterMinisimuDesde').value = '';
    document.getElementById('filterMinisimuHasta').value = '';
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
        const pruebaCard = crearTarjetaPrueba(prueba);
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
        const minisimuCard = crearTarjetaMinisimulacro(minisimu);
        minisimuContainer.appendChild(minisimuCard);
    });
}
