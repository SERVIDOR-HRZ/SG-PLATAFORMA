// ============================================
// PROGRESO DE ESTUDIANTES - COORDINADOR
// ============================================

// Variables globales
let currentUser = null;
let db = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Esperar a que Firebase esté listo
        await esperarFirebase();
        
        db = window.firebaseDB;

        // Verificar autenticación
        await verificarAutenticacion();

        // Inicializar componentes
        inicializarReloj();
        inicializarEventos();
        cargarEstadisticasIniciales();

    } catch (error) {
        console.error('Error en inicialización:', error);
        mostrarError('Error al cargar la página');
    }
});

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

// ============================================
// AUTENTICACIÓN
// ============================================

async function verificarAutenticacion() {
    // Intentar obtener usuario de sessionStorage primero
    const sessionUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!sessionUser.id) {
        window.location.href = 'login.html';
        return;
    }

    // Verificar que sea coordinador
    if (sessionUser.rol !== 'coordinador') {
        mostrarError('Acceso denegado. Solo coordinadores pueden acceder.');
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
        return;
    }

    try {
        const userDoc = await db.collection('usuarios').doc(sessionUser.id).get();
        
        if (!userDoc.exists) {
            throw new Error('Usuario no encontrado');
        }

        currentUser = {
            id: sessionUser.id,
            ...userDoc.data()
        };

        actualizarPerfilUsuario();
    } catch (error) {
        console.error('Error al verificar autenticación:', error);
        window.location.href = 'login.html';
    }
}

function actualizarPerfilUsuario() {
    const nombreElement = document.getElementById('coordinadorName');
    
    if (nombreElement && currentUser) {
        const nombreCompleto = `${currentUser.nombre || ''} ${currentUser.apellido || ''}`.trim();
        nombreElement.textContent = nombreCompleto.toUpperCase() || 'COORDINADOR';
    }

    // Cargar foto de perfil si existe
    if (currentUser.fotoPerfil) {
        const avatarImage = document.getElementById('userAvatarImage');
        const avatarDefault = document.getElementById('userAvatarDefault');
        
        if (avatarImage && avatarDefault) {
            avatarImage.src = currentUser.fotoPerfil;
            avatarImage.style.display = 'block';
            avatarImage.style.position = 'absolute';
            avatarDefault.style.display = 'none';
        }
    }
}

// ============================================
// RELOJ Y FECHA
// ============================================

function inicializarReloj() {
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
}

function actualizarReloj() {
    const ahora = new Date();
    
    // Actualizar hora en formato 12 horas
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        };
        const timeString = ahora.toLocaleTimeString('en-US', timeOptions);
        timeElement.textContent = timeString;
    }

    // Actualizar fecha
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        const dateOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };
        const dateString = ahora.toLocaleDateString('es-ES', dateOptions);
        dateElement.textContent = dateString;
    }

    // Actualizar icono según hora
    const iconElement = document.getElementById('timeIcon');
    if (iconElement) {
        const hora = ahora.getHours();
        
        // Limpiar todas las clases
        iconElement.className = '';
        
        // Agregar clase según hora del día
        if (hora >= 6 && hora < 12) {
            iconElement.className = 'bi bi-sunrise-fill';
        } else if (hora >= 12 && hora < 18) {
            iconElement.className = 'bi bi-sun-fill';
        } else if (hora >= 18 && hora < 21) {
            iconElement.className = 'bi bi-sunset-fill';
        } else {
            iconElement.className = 'bi bi-moon-stars-fill';
        }
    }
}

// ============================================
// EVENTOS
// ============================================

function inicializarEventos() {
    // Botones del sidebar
    const btnProfile = document.getElementById('btnProfile');
    const btnHome = document.getElementById('btnHome');
    const btnBack = document.getElementById('btnBack');
    const btnLogout = document.getElementById('btnLogout');

    if (btnProfile) {
        btnProfile.addEventListener('click', () => {
            window.location.href = 'Perfil-Coordinador.html';
        });
    }

    if (btnHome) {
        btnHome.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }

    if (btnBack) {
        btnBack.addEventListener('click', () => {
            window.location.href = 'Panel_Coordinador.html';
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }

    // Tarjetas de progreso
    const progressCards = document.querySelectorAll('.progress-card');
    progressCards.forEach(card => {
        card.addEventListener('click', () => {
            const section = card.dataset.section;
            mostrarSeccion(section);
        });
    });

    // Botón volver
    const btnVolver = document.getElementById('btnVolver');
    if (btnVolver) {
        btnVolver.addEventListener('click', volverATarjetas);
    }

    // Menú móvil
    inicializarMenuMovil();
}

function inicializarMenuMovil() {
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebarPanel');
    const overlay = document.getElementById('sidebarOverlay');

    // Mostrar botón móvil en pantallas pequeñas
    if (window.innerWidth <= 768) {
        if (mobileToggle) mobileToggle.style.display = 'flex';
    }

    if (mobileToggle && sidebar && overlay) {
        mobileToggle.addEventListener('click', () => {
            const isActive = sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            
            const icon = mobileToggle.querySelector('i');
            if (icon) {
                icon.className = isActive ? 'bi bi-chevron-left' : 'bi bi-chevron-right';
            }
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            mobileToggle.classList.remove('active');
            
            const icon = mobileToggle.querySelector('i');
            if (icon) icon.className = 'bi bi-chevron-right';
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                if (mobileToggle) mobileToggle.style.display = 'flex';
            } else {
                if (mobileToggle) mobileToggle.style.display = 'none';
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                mobileToggle.classList.remove('active');
                
                const icon = mobileToggle.querySelector('i');
                if (icon) icon.className = 'bi bi-chevron-right';
            }
        });
    }
}

// ============================================
// NAVEGACIÓN ENTRE SECCIONES
// ============================================

function mostrarSeccion(section) {
    // Si es resumen-general, redirigir a su propia página
    if (section === 'resumen-general') {
        window.location.href = 'Resumen-General.html';
        return;
    }
    
    // Si es evaluaciones, redirigir a Resultados.html con parámetro de coordinador
    if (section === 'evaluaciones') {
        sessionStorage.setItem('modoCoordinador', 'true');
        sessionStorage.setItem('volverAProgresoEstudiantes', 'true');
        if (currentUser && currentUser.institucion) {
            sessionStorage.setItem('institucionCoordinador', currentUser.institucion);
        }
        window.location.href = 'Resultados.html';
        return;
    }
}

function volverATarjetas() {
    const cardsGrid = document.querySelector('.progress-cards-grid');
    const contentSection = document.getElementById('contentSection');
    
    // Mostrar tarjetas
    if (cardsGrid) {
        cardsGrid.style.display = 'grid';
    }
    
    // Ocultar sección de contenido
    if (contentSection) {
        contentSection.style.display = 'none';
    }
    
    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================
// CARGAR ESTADÍSTICAS
// ============================================

async function cargarEstadisticasIniciales() {
    // Función eliminada - ya no se cargan estadísticas en las tarjetas
}

// ============================================
// CERRAR SESIÓN
// ============================================

async function handleLogout() {
    const confirmed = await showLogoutModal();
    
    if (confirmed) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

function showLogoutModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="panelModalOverlay">
                <div class="panel-modal">
                    <div class="panel-modal-body">
                        <i class="bi bi-exclamation-triangle panel-modal-icon"></i>
                        <p class="panel-modal-message">¿Estás seguro de que deseas cerrar sesión?</p>
                        <div class="panel-modal-footer">
                            <button class="panel-modal-btn panel-btn-cancel" id="panelModalCancel">
                                <i class="bi bi-x-lg"></i>
                                No
                            </button>
                            <button class="panel-modal-btn panel-btn-confirm" id="panelModalConfirm">
                                <i class="bi bi-check-lg"></i>
                                Sí
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Agregar estilos del modal si no existen
        if (!document.getElementById('panel-modal-styles')) {
            const modalStyles = `
                <style id="panel-modal-styles">
                .panel-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    opacity: 0;
                    visibility: hidden;
                    transition: all 0.3s ease;
                }
                
                .panel-modal-overlay.active {
                    opacity: 1;
                    visibility: visible;
                }
                
                .panel-modal {
                    background: #1a1a1a;
                    border-radius: 20px;
                    padding: 0;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                    overflow: hidden;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .panel-modal-overlay.active .panel-modal {
                    transform: scale(1);
                }
                
                .panel-modal-body {
                    padding: 2.5rem;
                    text-align: center;
                }
                
                .panel-modal-icon {
                    font-size: 4rem;
                    color: #ffc107;
                    margin-bottom: 1.5rem;
                    display: block;
                }
                
                .panel-modal-message {
                    font-size: 1.2rem;
                    color: white;
                    margin: 0 0 2rem 0;
                    line-height: 1.5;
                    font-weight: 500;
                }
                
                .panel-modal-footer {
                    display: flex;
                    gap: 1rem;
                    justify-content: center;
                }
                
                .panel-modal-btn {
                    padding: 0.85rem 2rem;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                
                .panel-btn-cancel {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .panel-btn-cancel:hover {
                    background: rgba(255, 255, 255, 0.2);
                    transform: translateY(-2px);
                }
                
                .panel-btn-confirm {
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    color: white;
                }
                
                .panel-btn-confirm:hover {
                    background: linear-gradient(135deg, #c82333, #bd2130);
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(220, 53, 69, 0.4);
                }
                
                @media (max-width: 480px) {
                    .panel-modal {
                        margin: 20px;
                        width: calc(100% - 40px);
                    }
                    
                    .panel-modal-footer {
                        flex-direction: column;
                    }
                    
                    .panel-modal-btn {
                        width: 100%;
                    }
                }
                </style>
            `;
            document.head.insertAdjacentHTML('beforeend', modalStyles);
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('panelModalOverlay');
        const confirmBtn = document.getElementById('panelModalConfirm');
        const cancelBtn = document.getElementById('panelModalCancel');
        
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);

        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(false);
            }
        });

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

function closeModal(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}

// ============================================
// UTILIDADES
// ============================================

function mostrarError(mensaje) {
    console.error(mensaje);
    // Aquí puedes agregar una notificación visual si lo deseas
}
