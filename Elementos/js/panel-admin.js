// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize panel modal styles
    initializePanelModal();
    
    // Check if user is logged in and is admin
    checkAuthentication();
    
    // Initialize time display
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
    
    // Load user info
    loadUserInfo();
    
    // Add event listeners
    setupEventListeners();
    
    // Check for unread messages
    checkUnreadMessages();
});

// Check if user is authenticated and is admin
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.id || currentUser.tipoUsuario !== 'admin') {
        // Redirect to login if not authenticated or not admin
        window.location.href = '../index.html';
        return;
    }
}

// Load user information
async function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (currentUser.nombre) {
        document.getElementById('adminName').textContent = currentUser.nombre.toUpperCase();
    }

    // Cargar foto de perfil desde Firebase
    await cargarFotoPerfil(currentUser.id);
    
    // Mostrar botón de finanzas solo para superadministradores
    await checkSuperAdminAccess(currentUser.id);
}

// Check if user is superadmin
async function checkSuperAdminAccess(usuarioId) {
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioId).get();

        if (usuarioDoc.exists) {
            const datosUsuario = usuarioDoc.data();
            
            // Mostrar botón de finanzas solo si es superusuario
            if (datosUsuario.rol === 'superusuario') {
                const finanzasCard = document.getElementById('finanzasCard');
                if (finanzasCard) {
                    finanzasCard.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error checking superadmin access:', error);
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

// Update time display
function updateTimeDisplay() {
    const now = new Date();
    
    // Format time
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    const timeString = now.toLocaleTimeString('es-ES', timeOptions);
    
    // Format date
    const dateOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    const dateString = now.toLocaleDateString('es-ES', dateOptions);
    
    // Update display
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    
    if (timeElement) timeElement.textContent = timeString;
    if (dateElement) dateElement.textContent = dateString;
}

// Setup event listeners
function setupEventListeners() {
    // Logout button en dropdown
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', handleLogout);
    }
    
    // Dashboard cards
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    dashboardCards.forEach(card => {
        card.addEventListener('click', handleCardClick);
    });

    // User menu dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    
    if (userMenuBtn && userDropdownMenu) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('active');
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('active');
            }
        });
    }

    // Click en avatar para ir a configuración
    const userAvatar = document.getElementById('userAvatarContainer');
    if (userAvatar) {
        userAvatar.addEventListener('click', function(e) {
            e.stopPropagation();
            window.location.href = 'panelUsuario.html';
        });
    }
}

// Initialize panel modal styles and functionality
function initializePanelModal() {
    // Add modal CSS styles to head
    const modalStyles = `
        <style id="panel-modal-styles">
        .panel-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .panel-modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .panel-modal {
            background: white;
            border-radius: 12px;
            padding: 0;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transform: scale(0.8);
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .panel-modal-overlay.active .panel-modal {
            transform: scale(1);
        }
        
        .panel-modal-body {
            padding: 30px;
            text-align: center;
        }
        
        .panel-modal-icon {
            font-size: 48px;
            color: #ffc107;
            margin-bottom: 20px;
            display: block;
        }
        
        .panel-modal-message {
            font-size: 18px;
            color: #333;
            margin: 0 0 30px 0;
            line-height: 1.5;
        }
        
        .panel-modal-footer {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .panel-modal-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .panel-btn-cancel {
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .panel-btn-cancel:hover {
            background: #e9e9e9;
            transform: translateY(-1px);
        }
        
        .panel-btn-confirm {
            background: #dc3545;
            color: white;
        }
        
        .panel-btn-confirm:hover {
            background: #c82333;
            transform: translateY(-1px);
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

// Show logout confirmation modal
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

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('panelModalOverlay');
        const confirmBtn = document.getElementById('panelModalConfirm');
        const cancelBtn = document.getElementById('panelModalCancel');
        
        // Show modal with animation
        setTimeout(() => {
            overlay.classList.add('active');
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

// Close modal
function closeModal(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}

// Handle logout
async function handleLogout() {
    const confirmed = await showLogoutModal();
    
    if (confirmed) {
        // Clear session storage
        sessionStorage.removeItem('currentUser');
        
        // Redirect to login
        window.location.href = '../index.html';
    }
}

// Handle card clicks
function handleCardClick(event) {
    const card = event.currentTarget;
    const section = card.getAttribute('data-section');
    
    // Add loading effect
    card.classList.add('loading');
    
    // Navigate based on section
    setTimeout(() => {
        switch(section) {
            case 'usuarios':
                window.location.href = 'Usuarios.html';
                break;
            case 'pruebas':
                window.location.href = 'Pruebas.html';
                break;
            case 'clases':
                window.location.href = 'Clases.html';
                break;
            case 'simulacros':
                window.location.href = 'Simulacros.html';
                break;
            case 'reportes':
                window.location.href = 'reporte.html';
                break;
            case 'chat':
                window.location.href = 'Chat.html';
                break;
            case 'contenido':
                window.location.href = 'Gestion-Contenido.html';
                break;
            case 'calendario':
                window.location.href = 'Calendario.html';
                break;
            case 'finanzas':
                window.location.href = 'Finanzas.html';
                break;
            case 'perfil':
                window.location.href = 'panelUsuario.html';
                break;
            default:
                console.log('Sección no encontrada:', section);
        }
    }, 500);
}

// Add hover effects
document.addEventListener('DOMContentLoaded', function() {
    const cards = document.querySelectorAll('.dashboard-card');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
});

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    // ESC key to logout
    if (event.key === 'Escape') {
        const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
        if (logoutBtnDropdown) {
            logoutBtnDropdown.click();
        }
    }
    
    // Number keys for quick navigation
    const keyMap = {
        '1': 'usuarios',
        '2': 'pruebas',
        '3': 'simulacros',
        '4': 'reportes'
    };
    
    if (keyMap[event.key]) {
        const card = document.querySelector(`[data-section="${keyMap[event.key]}"]`);
        if (card) {
            card.click();
        }
    }
});

// Check unread messages
async function checkUnreadMessages() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        
        if (!currentUser.id) return;
        
        // Listen for changes in conversations
        db.collection('conversaciones')
            .where('participantes', 'array-contains', currentUser.id)
            .onSnapshot((snapshot) => {
                let totalUnread = 0;
                
                snapshot.forEach((doc) => {
                    const conversation = doc.data();
                    const unreadCount = conversation.noLeidos?.[currentUser.id] || 0;
                    totalUnread += unreadCount;
                });
                
                // Update badge
                const badge = document.getElementById('chatNotificationBadge');
                if (badge) {
                    if (totalUnread > 0) {
                        badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                        badge.style.display = 'flex';
                    } else {
                        badge.style.display = 'none';
                    }
                }
            });
        
    } catch (error) {
        console.error('Error checking unread messages:', error);
    }
}