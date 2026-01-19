// Student Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize panel modal styles
    initializePanelModal();
    
    // Check if user is logged in and is student
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

// Check if user is authenticated and is student
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.id || currentUser.tipoUsuario !== 'estudiante') {
        // Redirect to login if not authenticated or not student
        window.location.href = '../index.html';
        return;
    }
}

// Load user information
async function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (currentUser.nombre) {
        document.getElementById('studentName').textContent = currentUser.nombre.toUpperCase();
    }

    // Cargar foto de perfil desde Firebase
    await cargarFotoPerfil(currentUser.id);
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

// Update time display
function updateTimeDisplay() {
    const now = new Date();
    const hour = now.getHours();
    
    // Format time in 12-hour format
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    
    // Format date
    const dateOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    const dateString = now.toLocaleDateString('es-ES', dateOptions);
    
    // Update time icon based on hour
    const timeIcon = document.getElementById('timeIcon');
    if (timeIcon) {
        // Remove all possible icon classes
        timeIcon.className = '';
        
        // Add appropriate icon based on time of day
        if (hour >= 6 && hour < 12) {
            // Morning: sunrise
            timeIcon.className = 'bi bi-sunrise-fill';
        } else if (hour >= 12 && hour < 18) {
            // Afternoon: sun
            timeIcon.className = 'bi bi-sun-fill';
        } else if (hour >= 18 && hour < 21) {
            // Evening: sunset
            timeIcon.className = 'bi bi-sunset-fill';
        } else {
            // Night: moon
            timeIcon.className = 'bi bi-moon-stars-fill';
        }
    }
    
    // Update display
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    
    if (timeElement) timeElement.textContent = timeString;
    if (dateElement) dateElement.textContent = dateString;
}

// Show custom alert modal
function showCustomAlert(titulo, mensaje, icono = 'bi-exclamation-triangle-fill', iconColor = '#ffc107') {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="customAlertOverlay">
                <div class="panel-modal">
                    <div class="panel-modal-body">
                        <i class="bi ${icono} panel-modal-icon" style="color: ${iconColor};"></i>
                        <h3 style="margin: 0 0 10px 0; color: #333; font-size: 22px; font-weight: 700;">${titulo}</h3>
                        <p class="panel-modal-message">${mensaje}</p>
                        <div class="panel-modal-footer">
                            <button class="panel-modal-btn panel-btn-confirm" id="customAlertBtn" style="background: #9c27b0;">
                                <i class="bi bi-check-lg"></i>
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('customAlertOverlay');
        const confirmBtn = document.getElementById('customAlertBtn');
        
        // Show modal with animation
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);

        // Handle confirm
        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        // Handle overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(true);
            }
        });

        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                resolve(true);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// Handle Desafios button click
async function handleDesafiosClick() {
    try {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const db = window.firebaseDB;
        
        // Obtener las aulas del estudiante
        const usuarioDoc = await db.collection('usuarios').doc(currentUser.id).get();
        
        if (!usuarioDoc.exists) {
            await showCustomAlert(
                'Error',
                'No se pudo cargar tu información. Por favor, intenta de nuevo.',
                'bi-exclamation-circle-fill',
                '#dc3545'
            );
            return;
        }

        const usuarioData = usuarioDoc.data();
        const aulasAsignadas = usuarioData.aulasAsignadas || [];

        if (aulasAsignadas.length === 0) {
            await showCustomAlert(
                'Sin Aulas Asignadas',
                'No estás inscrito en ninguna aula. Por favor, contacta a tu administrador para que te asigne a un aula.',
                'bi-info-circle-fill',
                '#2196F3'
            );
            return;
        }

        // Cargar información de las aulas
        const aulas = [];
        for (const aulaRef of aulasAsignadas) {
            const aulaId = typeof aulaRef === 'object' ? aulaRef.aulaId : aulaRef;
            const aulaDoc = await db.collection('aulas').doc(aulaId).get();
            
            if (aulaDoc.exists) {
                aulas.push({
                    id: aulaDoc.id,
                    ...aulaDoc.data()
                });
            }
        }

        if (aulas.length === 0) {
            await showCustomAlert(
                'Sin Aulas Disponibles',
                'Las aulas asignadas no están disponibles. Por favor, contacta a tu administrador.',
                'bi-exclamation-triangle-fill',
                '#ff9800'
            );
            return;
        }

        // Nombres de materias
        const nombresMaterias = {
            'matematicas': 'Matemáticas',
            'lectura': 'Lectura Crítica',
            'sociales': 'Ciencias Sociales',
            'naturales': 'Ciencias Naturales',
            'ingles': 'Inglés',
            'anuncios': 'Anuncios'
        };

        // Crear opciones para el select de aulas
        let aulasOptions = '<option value="">Selecciona un aula</option>';
        aulas.forEach(aula => {
            aulasOptions += `<option value="${aula.id}">${aula.nombre}</option>`;
        });

        // Mostrar modal con selector de aula y materia
        const modalHTML = `
            <div class="modal-overlay" id="aulaModal" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(5px);
            ">
                <div style="
                    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                    border-radius: 24px;
                    padding: 2.5rem;
                    max-width: 550px;
                    width: 90%;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
                    border: 2px solid rgba(156, 39, 176, 0.3);
                ">
                    <h2 style="
                        color: white;
                        font-size: 2rem;
                        margin-bottom: 0.5rem;
                        font-family: 'Montserrat', sans-serif;
                        font-weight: 800;
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                    ">
                        <i class="bi bi-trophy-fill" style="color: #9c27b0; font-size: 2.2rem;"></i>
                        Desafíos
                    </h2>
                    <p style="
                        color: rgba(255, 255, 255, 0.6);
                        margin-bottom: 2rem;
                        font-family: 'Montserrat', sans-serif;
                        font-size: 0.95rem;
                    ">
                        Selecciona el aula y la materia para comenzar
                    </p>
                    
                    <div style="margin-bottom: 1.5rem;">
                        <label style="
                            color: rgba(255, 255, 255, 0.9);
                            font-family: 'Montserrat', sans-serif;
                            font-weight: 600;
                            font-size: 0.9rem;
                            display: block;
                            margin-bottom: 0.5rem;
                        ">
                            <i class="bi bi-building" style="margin-right: 0.5rem;"></i>Aula
                        </label>
                        <div style="position: relative;">
                            <select id="aulaSelect" style="
                                width: 100%;
                                padding: 1rem 1.25rem;
                                padding-right: 3rem;
                                border-radius: 14px;
                                border: 2px solid rgba(156, 39, 176, 0.3);
                                background: #000000;
                                color: white;
                                font-size: 1.05rem;
                                font-family: 'Montserrat', sans-serif;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                outline: none;
                                appearance: none;
                                -webkit-appearance: none;
                                -moz-appearance: none;
                            ">
                                ${aulasOptions}
                            </select>
                            <i class="bi bi-chevron-down" style="
                                position: absolute;
                                right: 1.25rem;
                                top: 50%;
                                transform: translateY(-50%);
                                color: #9c27b0;
                                font-size: 1.2rem;
                                pointer-events: none;
                            "></i>
                        </div>
                    </div>
                    
                    <div id="materiaContainer" style="margin-bottom: 2rem; display: none;">
                        <label style="
                            color: rgba(255, 255, 255, 0.9);
                            font-family: 'Montserrat', sans-serif;
                            font-weight: 600;
                            font-size: 0.9rem;
                            display: block;
                            margin-bottom: 0.5rem;
                        ">
                            <i class="bi bi-book" style="margin-right: 0.5rem;"></i>Materia
                        </label>
                        <div style="position: relative;">
                            <select id="materiaSelect" style="
                                width: 100%;
                                padding: 1rem 1.25rem;
                                padding-right: 3rem;
                                border-radius: 14px;
                                border: 2px solid rgba(156, 39, 176, 0.3);
                                background: #000000;
                                color: white;
                                font-size: 1.05rem;
                                font-family: 'Montserrat', sans-serif;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.3s ease;
                                outline: none;
                                appearance: none;
                                -webkit-appearance: none;
                                -moz-appearance: none;
                            ">
                                <option value="">Selecciona una materia</option>
                            </select>
                            <i class="bi bi-chevron-down" style="
                                position: absolute;
                                right: 1.25rem;
                                top: 50%;
                                transform: translateY(-50%);
                                color: #9c27b0;
                                font-size: 1.2rem;
                                pointer-events: none;
                            "></i>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem;">
                        <button id="cancelAulaBtn" style="
                            flex: 1;
                            padding: 1.1rem;
                            border-radius: 14px;
                            border: 2px solid rgba(255, 255, 255, 0.15);
                            background: rgba(255, 255, 255, 0.05);
                            color: white;
                            font-size: 1rem;
                            font-weight: 700;
                            cursor: pointer;
                            font-family: 'Montserrat', sans-serif;
                            transition: all 0.3s ease;
                        ">
                            Cancelar
                        </button>
                        <button id="confirmAulaBtn" style="
                            flex: 1;
                            padding: 1.1rem;
                            border-radius: 14px;
                            border: none;
                            background: linear-gradient(135deg, #9c27b0, #7b1fa2);
                            color: white;
                            font-size: 1rem;
                            font-weight: 700;
                            cursor: pointer;
                            font-family: 'Montserrat', sans-serif;
                            box-shadow: 0 6px 20px rgba(156, 39, 176, 0.4);
                            transition: all 0.3s ease;
                        ">
                            Continuar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        const modal = document.getElementById('aulaModal');
        const aulaSelect = document.getElementById('aulaSelect');
        const materiaSelect = document.getElementById('materiaSelect');
        const materiaContainer = document.getElementById('materiaContainer');
        const cancelBtn = document.getElementById('cancelAulaBtn');
        const confirmBtn = document.getElementById('confirmAulaBtn');

        // Cuando se selecciona un aula, mostrar sus materias
        aulaSelect.addEventListener('change', () => {
            const selectedAulaId = aulaSelect.value;
            if (selectedAulaId) {
                const selectedAula = aulas.find(a => a.id === selectedAulaId);
                const materias = selectedAula.materias || [];
                
                // Limpiar y llenar el select de materias
                materiaSelect.innerHTML = '<option value="">Selecciona una materia</option>';
                materias.forEach(materiaId => {
                    // Omitir la materia "anuncios"
                    if (materiaId === 'anuncios') return;
                    
                    const nombreMateria = nombresMaterias[materiaId] || materiaId;
                    materiaSelect.innerHTML += `<option value="${materiaId}">${nombreMateria}</option>`;
                });
                
                materiaContainer.style.display = 'block';
            } else {
                materiaContainer.style.display = 'none';
            }
        });

        // Estilos hover para los selects
        aulaSelect.addEventListener('focus', () => {
            aulaSelect.style.borderColor = '#9c27b0';
            aulaSelect.style.boxShadow = '0 0 0 3px rgba(156, 39, 176, 0.2)';
        });
        aulaSelect.addEventListener('blur', () => {
            aulaSelect.style.borderColor = 'rgba(156, 39, 176, 0.3)';
            aulaSelect.style.boxShadow = 'none';
        });
        
        materiaSelect.addEventListener('focus', () => {
            materiaSelect.style.borderColor = '#9c27b0';
            materiaSelect.style.boxShadow = '0 0 0 3px rgba(156, 39, 176, 0.2)';
        });
        materiaSelect.addEventListener('blur', () => {
            materiaSelect.style.borderColor = 'rgba(156, 39, 176, 0.3)';
            materiaSelect.style.boxShadow = 'none';
        });

        // Hover para botones
        cancelBtn.addEventListener('mouseenter', () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            cancelBtn.style.transform = 'translateY(-2px)';
        });
        cancelBtn.addEventListener('mouseleave', () => {
            cancelBtn.style.background = 'rgba(255, 255, 255, 0.05)';
            cancelBtn.style.transform = 'translateY(0)';
        });
        
        confirmBtn.addEventListener('mouseenter', () => {
            confirmBtn.style.background = 'linear-gradient(135deg, #ba68c8, #8e24aa)';
            confirmBtn.style.transform = 'translateY(-2px)';
            confirmBtn.style.boxShadow = '0 8px 30px rgba(156, 39, 176, 0.6)';
        });
        confirmBtn.addEventListener('mouseleave', () => {
            confirmBtn.style.background = 'linear-gradient(135deg, #9c27b0, #7b1fa2)';
            confirmBtn.style.transform = 'translateY(0)';
            confirmBtn.style.boxShadow = '0 6px 20px rgba(156, 39, 176, 0.4)';
        });

        // Cerrar modal
        cancelBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Confirmar selección
        confirmBtn.addEventListener('click', () => {
            const selectedAulaId = aulaSelect.value;
            const selectedMateriaId = materiaSelect.value;
            
            if (!selectedAulaId) {
                showCustomAlert(
                    'Selección Requerida',
                    'Por favor, selecciona un aula para continuar.',
                    'bi-info-circle-fill',
                    '#2196F3'
                );
                return;
            }
            
            if (!selectedMateriaId) {
                showCustomAlert(
                    'Selección Requerida',
                    'Por favor, selecciona una materia para continuar.',
                    'bi-info-circle-fill',
                    '#2196F3'
                );
                return;
            }

            // Redirigir a Desafios.html con el aula y materia
            window.location.href = `Desafios.html?aula=${selectedAulaId}&materia=${selectedMateriaId}`;
        });

        // Cerrar con ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                modal.remove();
            }
        });

    } catch (error) {
        console.error('Error al cargar aulas:', error);
        await showCustomAlert(
            'Error',
            'Error al cargar las aulas. Por favor, intenta de nuevo.',
            'bi-exclamation-circle-fill',
            '#dc3545'
        );
    }
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }
    
    // Profile button
    const btnProfile = document.getElementById('btnProfile');
    if (btnProfile) {
        btnProfile.addEventListener('click', () => {
            window.location.href = 'panelUsuario.html';
        });
    }
    
    // Home button
    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
        btnHome.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
    
    // Desafios button
    const btnDesafios = document.getElementById('btnDesafios');
    if (btnDesafios) {
        btnDesafios.addEventListener('click', handleDesafiosClick);
    }
    
    // Dashboard cards (nuevo diseño)
    const dashboardCards = document.querySelectorAll('.card-modern');
    dashboardCards.forEach(card => {
        card.addEventListener('click', handleCardClick);
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarPanel = document.getElementById('sidebarPanel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle && sidebarPanel && sidebarOverlay) {
        // Show mobile menu toggle on small screens
        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'flex';
        }
        
        mobileMenuToggle.addEventListener('click', () => {
            const isActive = sidebarPanel.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            
            // Cambiar icono entre chevron derecha y chevron izquierda
            const icon = mobileMenuToggle.querySelector('i');
            if (isActive) {
                icon.className = 'bi bi-chevron-left';
            } else {
                icon.className = 'bi bi-chevron-right';
            }
        });
        
        sidebarOverlay.addEventListener('click', () => {
            sidebarPanel.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            
            // Volver al icono de chevron derecha
            const icon = mobileMenuToggle.querySelector('i');
            icon.className = 'bi bi-chevron-right';
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                mobileMenuToggle.style.display = 'flex';
            } else {
                mobileMenuToggle.style.display = 'none';
                sidebarPanel.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                
                // Asegurar que el icono sea chevron derecha
                const icon = mobileMenuToggle.querySelector('i');
                icon.className = 'bi bi-chevron-right';
            }
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
    const element = event.currentTarget;
    const section = element.getAttribute('data-section');
    
    // Skip if dashboard
    if (section === 'dashboard') return;
    
    // Add loading effect
    element.classList.add('loading');
    
    // Navigate based on section
    setTimeout(() => {
        switch(section) {
            case 'pruebas':
                window.location.href = 'Pruebas-Estudiante.html';
                break;
            case 'clases':
                window.location.href = 'Clases.html';
                break;
            case 'simulacros':
                window.location.href = 'Simulacros.html';
                break;
            case 'reportes':
                window.location.href = 'Reportes.html';
                break;
            case 'chat':
                window.location.href = 'Chat.html';
                break;
            case 'perfil':
                window.location.href = 'panelUsuario.html';
                break;
            default:
                console.log('Sección no encontrada:', section);
        }
    }, 300);
}

// Keyboard navigation
document.addEventListener('keydown', function(event) {
    // ESC key to logout
    if (event.key === 'Escape') {
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.click();
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