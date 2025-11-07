// Pruebas Student JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Initialize
    checkAuthentication();
    initializeView();
    initializePanelModal();
    setupEventListeners();
    loadStudentTests();
    
    // Inicializar foto de perfil
    if (typeof inicializarPerfilCompartido === 'function') {
        inicializarPerfilCompartido();
    }
});

let currentUser = null;
let studentTests = [];

// Check authentication and determine view
function checkAuthentication() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (!currentUser.id) {
        window.location.href = '../index.html';
        return;
    }

    // Ensure this is a student
    if (currentUser.tipoUsuario !== 'estudiante') {
        window.location.href = '../index.html';
        return;
    }
}

// Initialize view
function initializeView() {
    const userName = document.getElementById('userName');
    const pageTitle = document.getElementById('pageTitle');

    if (currentUser.nombre) {
        userName.textContent = currentUser.nombre.toUpperCase();
    }

    pageTitle.textContent = 'Mis Pruebas';
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', goBack);

    // Logout button en dropdown (manejado por perfil-compartido.js)
}

// Go back to student panel
function goBack() {
    window.location.href = 'Panel_Estudiantes.html';
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
        sessionStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}

// Load student's assigned tests
async function loadStudentTests() {
    try {
        showLoadingOverlay();

        // Wait for Firebase to be initialized
        if (!window.firebaseDB) {
            await new Promise(resolve => {
                const checkDB = () => {
                    if (window.firebaseDB) {
                        resolve();
                    } else {
                        setTimeout(checkDB, 100);
                    }
                };
                checkDB();
            });
        }

        const db = window.firebaseDB;

        // Try to get student ID from sessionStorage first (if login was fixed)
        let studentId = currentUser.numeroDocumento || currentUser.numeroIdentidad;
        
        console.log('Current user from sessionStorage:', currentUser);
        console.log('Student ID from sessionStorage:', studentId);

        // If no student ID in sessionStorage, get it from Firebase (fallback)
        if (!studentId) {
            console.log('No student ID in sessionStorage, fetching from Firebase...');
            
            const userSnapshot = await db.collection('usuarios')
                .where('usuario', '==', currentUser.email || currentUser.usuario)
                .get();

            if (userSnapshot.empty) {
                throw new Error('Usuario no encontrado en la base de datos');
            }

            const userData = userSnapshot.docs[0].data();
            console.log('User data from Firebase:', userData);
            studentId = userData.numeroDocumento || userData.numeroIdentidad || userData.id;
        }

        console.log('Final student ID to search for:', studentId);

        if (!studentId) {
            throw new Error('No se pudo determinar el ID del estudiante');
        }

        // Search for tests assigned to this student
        const testsSnapshot = await db.collection('pruebas')
            .where('estudiantesAsignados', 'array-contains', studentId)
            .get();

        studentTests = [];
        for (const doc of testsSnapshot.docs) {
            const testData = doc.data();
            console.log('Test found:', testData.nombre, 'Assigned students:', testData.estudiantesAsignados);
            
            // Check for completed blocks
            const completedBlocks = await checkCompletedBlocks(doc.id, studentId);
            
            studentTests.push({
                id: doc.id,
                ...testData,
                completedBlocks: completedBlocks
            });
        }

        console.log('Student tests loaded:', studentTests.length);

        // If no tests found, check all tests for debugging
        if (studentTests.length === 0) {
            console.log('No tests found. Checking all tests for debugging...');
            const allTestsSnapshot = await db.collection('pruebas').get();
            allTestsSnapshot.forEach(doc => {
                const testData = doc.data();
                console.log('All test:', testData.nombre, 'Assigned students:', testData.estudiantesAsignados);
            });
        }

        renderStudentTests();
        hideLoadingOverlay();

    } catch (error) {
        console.error('Error loading student tests:', error);
        showNotification('Error al cargar tus pruebas: ' + error.message, 'error');
        hideLoadingOverlay();
    }
}

// Check completed blocks for a student
async function checkCompletedBlocks(testId, studentId) {
    try {
        const db = window.firebaseDB;
        const responsesSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', testId)
            .where('estudianteId', '==', studentId)
            .get();

        const completedBlocks = [];
        responsesSnapshot.forEach(doc => {
            const responseData = doc.data();
            if (responseData.bloque && !completedBlocks.includes(responseData.bloque)) {
                completedBlocks.push(responseData.bloque);
            }
        });

        return completedBlocks;
    } catch (error) {
        console.error('Error checking completed blocks:', error);
        return [];
    }
}

// Render student tests
function renderStudentTests() {
    const studentTestsList = document.getElementById('studentTestsList');

    if (studentTests.length === 0) {
        studentTestsList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-text"></i>
                <h3>No tienes pruebas asignadas</h3>
                <p>Cuando tu profesor te asigne pruebas, aparecerán aquí</p>
            </div>
        `;
        return;
    }

    studentTestsList.innerHTML = '';

    studentTests.forEach(test => {
        const testCard = createStudentTestCard(test);
        studentTestsList.appendChild(testCard);
    });
}

// Create student test card
function createStudentTestCard(test) {
    const card = document.createElement('div');
    card.className = 'student-test-card';

    // Determine test status (evitando problemas de zona horaria)
    const now = new Date();
    const [year, month, day] = test.fechaDisponible.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    let status = 'available';
    let statusText = 'Disponible';
    let statusClass = 'status-available';

    if (testDate > now) {
        status = 'pending';
        statusText = 'Próximamente';
        statusClass = 'status-pending';
    }

    // Format date
    const formattedDate = testDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Check block availability and completion status
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const isToday = testDate.toDateString() === now.toDateString();
    
    // Block 1 status
    let block1Status = 'unavailable';
    let block1ButtonText = 'No disponible';
    let block1ButtonClass = 'btn-secondary';
    let block1Disabled = true;
    
    if (test.completedBlocks && test.completedBlocks.includes(1)) {
        block1Status = 'completed';
        block1ButtonText = 'Completado';
        block1ButtonClass = 'btn-success';
        block1Disabled = true;
    } else if (isToday && test.bloque1) {
        const [startHour1, startMin1] = test.bloque1.horaInicio.split(':').map(Number);
        const [endHour1, endMin1] = test.bloque1.horaFin.split(':').map(Number);
        const block1Start = startHour1 * 60 + startMin1;
        const block1End = endHour1 * 60 + endMin1;
        
        if (currentTime >= block1Start && currentTime <= block1End) {
            block1Status = 'available';
            block1ButtonText = 'Iniciar Bloque 1';
            block1ButtonClass = 'btn-primary';
            block1Disabled = false;
        } else if (currentTime < block1Start) {
            block1Status = 'pending';
            block1ButtonText = `Disponible a las ${test.bloque1.horaInicio}`;
            block1ButtonClass = 'btn-warning';
            block1Disabled = true;
        } else {
            block1Status = 'expired';
            block1ButtonText = 'Tiempo agotado';
            block1ButtonClass = 'btn-danger';
            block1Disabled = true;
        }
    }

    // Block 2 status
    let block2Status = 'unavailable';
    let block2ButtonText = 'No disponible';
    let block2ButtonClass = 'btn-secondary';
    let block2Disabled = true;
    
    if (test.completedBlocks && test.completedBlocks.includes(2)) {
        block2Status = 'completed';
        block2ButtonText = 'Completado';
        block2ButtonClass = 'btn-success';
        block2Disabled = true;
    } else if (isToday && test.bloque2) {
        const [startHour2, startMin2] = test.bloque2.horaInicio.split(':').map(Number);
        const [endHour2, endMin2] = test.bloque2.horaFin.split(':').map(Number);
        const block2Start = startHour2 * 60 + startMin2;
        const block2End = endHour2 * 60 + endMin2;
        
        if (currentTime >= block2Start && currentTime <= block2End) {
            block2Status = 'available';
            block2ButtonText = 'Iniciar Bloque 2';
            block2ButtonClass = 'btn-primary';
            block2Disabled = false;
        } else if (currentTime < block2Start) {
            block2Status = 'pending';
            block2ButtonText = `Disponible a las ${test.bloque2.horaInicio}`;
            block2ButtonClass = 'btn-warning';
            block2Disabled = true;
        } else {
            block2Status = 'expired';
            block2ButtonText = 'Tiempo agotado';
            block2ButtonClass = 'btn-danger';
            block2Disabled = true;
        }
    }

    // Build blocks HTML - only show enabled blocks
    let blocksHTML = '';
    
    // Show Block 1 only if it exists
    if (test.bloque1) {
        blocksHTML += `
            <div class="block-info ${block1Status === 'completed' ? 'completed' : ''}">
                <div class="block-title">
                    <i class="bi bi-clock"></i> Bloque 1
                    ${block1Status === 'completed' ? '<i class="bi bi-check-circle-fill completed-icon"></i>' : ''}
                </div>
                <div class="block-time">
                    <strong>Inicio:</strong> ${test.bloque1.horaInicio}<br>
                    <strong>Fin:</strong> ${test.bloque1.horaFin}
                </div>
                <div class="block-action">
                    <button class="btn btn-sm ${block1ButtonClass}" 
                            onclick="startBlock('${test.id}', 1)" 
                            ${block1Disabled ? 'disabled' : ''}>
                        <i class="bi bi-${getBlockIcon(block1Status)}"></i>
                        ${block1ButtonText}
                    </button>
                </div>
            </div>
        `;
    }
    
    // Show Block 2 only if it exists
    if (test.bloque2) {
        blocksHTML += `
            <div class="block-info ${block2Status === 'completed' ? 'completed' : ''}">
                <div class="block-title">
                    <i class="bi bi-clock"></i> Bloque 2
                    ${block2Status === 'completed' ? '<i class="bi bi-check-circle-fill completed-icon"></i>' : ''}
                </div>
                <div class="block-time">
                    <strong>Inicio:</strong> ${test.bloque2.horaInicio}<br>
                    <strong>Fin:</strong> ${test.bloque2.horaFin}
                </div>
                <div class="block-action">
                    <button class="btn btn-sm ${block2ButtonClass}" 
                            onclick="startBlock('${test.id}', 2)" 
                            ${block2Disabled ? 'disabled' : ''}>
                        <i class="bi bi-${getBlockIcon(block2Status)}"></i>
                        ${block2ButtonText}
                    </button>
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="student-test-header">
            <h3 class="test-title">${test.nombre}</h3>
            <span class="test-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="test-info">
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            
            <div class="test-blocks">
                ${blocksHTML}
            </div>
        </div>
    `;

    return card;
}

// Get block icon based on status
function getBlockIcon(status) {
    switch (status) {
        case 'available': return 'play-circle';
        case 'completed': return 'check-circle';
        case 'pending': return 'clock';
        case 'expired': return 'x-circle';
        default: return 'dash-circle';
    }
}

// Start test function
function startTest(testId) {
    // Verify test is available
    const test = studentTests.find(t => t.id === testId);
    if (!test) {
        showNotification('Prueba no encontrada', 'error');
        return;
    }

    // Check if test is available today
    const now = new Date();
    const [year, month, day] = test.fechaDisponible.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    
    if (testDate.toDateString() !== now.toDateString()) {
        showNotification('La prueba no está disponible hoy', 'warning');
        return;
    }

    // Check if current time is within any block time
    const currentTime = now.getHours() * 60 + now.getMinutes();
    let canStart = false;
    
    // Check Block 1
    if (test.bloque1) {
        const [startHour1, startMin1] = test.bloque1.horaInicio.split(':').map(Number);
        const [endHour1, endMin1] = test.bloque1.horaFin.split(':').map(Number);
        const block1Start = startHour1 * 60 + startMin1;
        const block1End = endHour1 * 60 + endMin1;
        
        if (currentTime >= block1Start && currentTime <= block1End) {
            canStart = true;
        }
    }
    
    // Check Block 2
    if (test.bloque2) {
        const [startHour2, startMin2] = test.bloque2.horaInicio.split(':').map(Number);
        const [endHour2, endMin2] = test.bloque2.horaFin.split(':').map(Number);
        const block2Start = startHour2 * 60 + startMin2;
        const block2End = endHour2 * 60 + endMin2;
        
        if (currentTime >= block2Start && currentTime <= block2End) {
            canStart = true;
        }
    }
    
    if (!canStart) {
        showNotification('La prueba no está disponible en este horario', 'warning');
        return;
    }

    // Store test ID in sessionStorage for the test interface
    sessionStorage.setItem('takingTestId', testId);
    
    // Navigate to test interface
    window.location.href = 'Tomar-Prueba.html';
}

// Show loading overlay
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-spinner"></div>
    `;
    document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bi bi-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                transform: translateX(400px);
                transition: all 0.3s ease;
                max-width: 400px;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success { background: #28a745; }
            .notification-error { background: #dc3545; }
            .notification-info { background: #17a2b8; }
            .notification-warning { background: #ffc107; color: #333; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };
    return icons[type] || 'info-circle';
}

// Start specific block
function startBlock(testId, blockNumber) {
    // Verify test is available
    const test = studentTests.find(t => t.id === testId);
    if (!test) {
        showNotification('Prueba no encontrada', 'error');
        return;
    }

    // Check if block is already completed
    if (test.completedBlocks && test.completedBlocks.includes(blockNumber)) {
        showNotification('Este bloque ya ha sido completado', 'warning');
        return;
    }

    // Check if test is available today
    const now = new Date();
    const [year, month, day] = test.fechaDisponible.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    
    if (testDate.toDateString() !== now.toDateString()) {
        showNotification('La prueba no está disponible hoy', 'warning');
        return;
    }

    // Check if current time is within the specific block time
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const blockKey = `bloque${blockNumber}`;
    const blockData = test[blockKey];
    
    if (!blockData) {
        showNotification(`El Bloque ${blockNumber} no está configurado`, 'error');
        return;
    }

    const [startHour, startMin] = blockData.horaInicio.split(':').map(Number);
    const [endHour, endMin] = blockData.horaFin.split(':').map(Number);
    const blockStart = startHour * 60 + startMin;
    const blockEnd = endHour * 60 + endMin;
    
    if (currentTime < blockStart) {
        showNotification(`El Bloque ${blockNumber} estará disponible a las ${blockData.horaInicio}`, 'warning');
        return;
    }
    
    if (currentTime > blockEnd) {
        showNotification(`El tiempo para el Bloque ${blockNumber} ha expirado`, 'error');
        return;
    }

    // Store test ID and block number in sessionStorage
    sessionStorage.setItem('takingTestId', testId);
    sessionStorage.setItem('takingBlockNumber', blockNumber.toString());
    
    // Navigate to test interface
    window.location.href = 'Tomar-Prueba.html';
}