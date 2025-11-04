// Pruebas Management JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Initialize
    checkAuthentication();
    initializeView();
    initializePanelModal();
    setupEventListeners();
    loadData();
    
    // Inicializar foto de perfil
    if (typeof inicializarPerfilCompartido === 'function') {
        inicializarPerfilCompartido();
    }
});

let currentUser = null;
let allStudents = [];
let allTests = [];

// Check authentication and determine view
function checkAuthentication() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (!currentUser.id) {
        window.location.href = '../index.html';
        return;
    }
}

// Initialize view based on user type
function initializeView() {
    const userName = document.getElementById('userName');
    const pageTitle = document.getElementById('pageTitle');
    const adminView = document.getElementById('adminView');
    const studentView = document.getElementById('studentView');

    if (currentUser.nombre) {
        userName.textContent = currentUser.nombre.toUpperCase();
    }

    if (currentUser.tipoUsuario === 'admin') {
        pageTitle.textContent = 'Gestión de Pruebas';
        adminView.style.display = 'block';
        studentView.style.display = 'none';
    } else {
        pageTitle.textContent = 'Mis Pruebas';
        adminView.style.display = 'none';
        studentView.style.display = 'block';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', goBack);

    // Logout button en dropdown (manejado por perfil-compartido.js)

    // Create test button (admin only)
    const createTestBtn = document.getElementById('createTestBtn');
    if (createTestBtn) {
        createTestBtn.addEventListener('click', showCreateTestModal);
    }

    // Modal events
    document.getElementById('closeCreateModal').addEventListener('click', hideCreateTestModal);
    document.getElementById('cancelCreateTest').addEventListener('click', hideCreateTestModal);
    document.getElementById('createTestForm').addEventListener('submit', handleCreateTest);

    // Edit modal events
    document.getElementById('closeEditModal').addEventListener('click', hideEditTestModal);
    document.getElementById('cancelEditTest').addEventListener('click', hideEditTestModal);
    document.getElementById('editTestForm').addEventListener('submit', handleEditTest);

    // Close modals on overlay click
    document.getElementById('createTestModal').addEventListener('click', function (e) {
        if (e.target === this) {
            hideCreateTestModal();
        }
    });

    document.getElementById('editTestModal').addEventListener('click', function (e) {
        if (e.target === this) {
            hideEditTestModal();
        }
    });
}

// Go back to appropriate panel
function goBack() {
    if (currentUser.tipoUsuario === 'admin') {
        window.location.href = 'Panel_Admin.html';
    } else {
        window.location.href = 'Panel_Estudiantes.html';
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
        sessionStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}

// Load data based on user type
async function loadData() {
    try {
        showLoadingOverlay();

        if (currentUser.tipoUsuario === 'admin') {
            await Promise.all([loadStudents(), loadAllTests()]);
            renderTestsList();
        } else {
            await loadStudentTests();
            renderStudentTests();
        }

        hideLoadingOverlay();
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error al cargar los datos', 'error');
        hideLoadingOverlay();
    }
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

// Load all students (admin only)
async function loadStudents() {
    try {
        // Wait for Firebase to be initialized
        if (!db) {
            await new Promise(resolve => {
                const checkDB = () => {
                    if (window.firebaseDB) {
                        db = window.firebaseDB;
                        resolve();
                    } else {
                        setTimeout(checkDB, 100);
                    }
                };
                checkDB();
            });
        }

        const snapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        allStudents = [];
        snapshot.forEach(doc => {
            const userData = doc.data();
            console.log('Raw user data from Firebase:', userData); // Debug log
            
            allStudents.push({
                id: userData.numeroIdentidad || userData.numeroDocumento || doc.id, // Use numeroIdentidad as ID
                docId: doc.id, // Keep document ID for updates
                numeroIdentidad: userData.numeroIdentidad || userData.numeroDocumento || userData.cedula || userData.documento || 'N/A',
                ...userData
            });
        });

        console.log('Estudiantes cargados:', allStudents.length);
    } catch (error) {
        console.error('Error loading students:', error);
        showNotification('Error al cargar estudiantes: ' + error.message, 'error');
    }
}

// Load all tests (admin only)
async function loadAllTests() {
    try {
        // Wait for Firebase to be initialized
        if (!db) {
            await new Promise(resolve => {
                const checkDB = () => {
                    if (window.firebaseDB) {
                        db = window.firebaseDB;
                        resolve();
                    } else {
                        setTimeout(checkDB, 100);
                    }
                };
                checkDB();
            });
        }

        const snapshot = await db.collection('pruebas')
            .orderBy('fechaCreacion', 'desc')
            .get();

        allTests = [];
        snapshot.forEach(doc => {
            allTests.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('Pruebas cargadas:', allTests.length);
    } catch (error) {
        console.error('Error loading tests:', error);
        showNotification('Error al cargar pruebas: ' + error.message, 'error');
    }
}

// Load student's assigned tests
async function loadStudentTests() {
    try {
        // Wait for Firebase to be initialized
        if (!db) {
            await new Promise(resolve => {
                const checkDB = () => {
                    if (window.firebaseDB) {
                        db = window.firebaseDB;
                        resolve();
                    } else {
                        setTimeout(checkDB, 100);
                    }
                };
                checkDB();
            });
        }

        // Use numeroDocumento for student identification (based on Firebase data)
        const studentId = currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id;
        
        // Debug logs
        console.log('Current user data:', currentUser);
        console.log('Student ID being searched:', studentId);
        console.log('Available user fields:', Object.keys(currentUser));

        const snapshot = await db.collection('pruebas')
            .where('estudiantesAsignados', 'array-contains', studentId)
            .get();

        allTests = [];
        snapshot.forEach(doc => {
            const testData = doc.data();
            console.log('Test found:', testData.nombre, 'Assigned students:', testData.estudiantesAsignados);
            allTests.push({
                id: doc.id,
                ...testData
            });
        });

        console.log('Pruebas del estudiante cargadas:', allTests.length);
        
        // If no tests found, let's check all tests to see what IDs are being used
        if (allTests.length === 0) {
            console.log('No tests found for student. Checking all tests...');
            const allTestsSnapshot = await db.collection('pruebas').get();
            allTestsSnapshot.forEach(doc => {
                const testData = doc.data();
                console.log('All test:', testData.nombre, 'Assigned students:', testData.estudiantesAsignados);
            });
        }
    } catch (error) {
        console.error('Error loading student tests:', error);
        showNotification('Error al cargar tus pruebas: ' + error.message, 'error');
    }
}

// Show create test modal
function showCreateTestModal() {
    const modal = document.getElementById('createTestModal');
    const studentsList = document.getElementById('studentsList');

    // Clear form
    document.getElementById('createTestForm').reset();

    // Populate students selector
    populateStudentsSelector();

    // Setup select all functionality
    setupSelectAllStudents();

    modal.classList.add('active');
}

// Populate students selector
function populateStudentsSelector() {
    const studentsList = document.getElementById('studentsList');
    const studentsCounter = document.getElementById('studentsCounter');
    
    studentsList.innerHTML = '';
    
    if (allStudents.length === 0) {
        studentsList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No hay estudiantes registrados</p>';
        studentsCounter.textContent = '0 estudiantes disponibles';
        return;
    }

    allStudents.forEach(student => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'student-checkbox';
        
        // Debug: Log student data to see what's available
        console.log('Student data:', student);
        console.log('Available fields:', Object.keys(student));
        
        // Try multiple possible field names for ID
        const possibleIdFields = ['numeroIdentidad', 'numeroDocumento', 'cedula', 'documento', 'id'];
        let studentId = 'N/A';
        
        for (const field of possibleIdFields) {
            if (student[field] && student[field] !== 'N/A') {
                studentId = student[field];
                console.log(`Found ID in field: ${field} = ${studentId}`);
                break;
            }
        }
        
        // Try multiple possible field names for email
        const possibleEmailFields = ['email', 'correo', 'correoElectronico'];
        let studentEmail = 'Sin email';
        
        for (const field of possibleEmailFields) {
            if (student[field] && student[field] !== 'Sin email') {
                studentEmail = student[field];
                break;
            }
        }
        
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="student_${student.id}" value="${student.id}" class="student-check">
            <label for="student_${student.id}">
                <span class="student-name">${student.nombre || 'Sin nombre'}</span>
                <span class="student-meta">ID: ${studentId} - ${studentEmail}</span>
            </label>
        `;
        studentsList.appendChild(checkboxDiv);
    });

    // Add event listeners to individual checkboxes
    document.querySelectorAll('.student-check').forEach(checkbox => {
        checkbox.addEventListener('change', updateStudentsCounter);
    });

    updateStudentsCounter();
}

// Setup select all functionality
function setupSelectAllStudents() {
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    
    selectAllCheckbox.addEventListener('change', function() {
        const studentCheckboxes = document.querySelectorAll('.student-check');
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateStudentsCounter();
    });
}

// Update students counter
function updateStudentsCounter() {
    const selectedCount = document.querySelectorAll('.student-check:checked').length;
    const totalCount = document.querySelectorAll('.student-check').length;
    const counter = document.getElementById('studentsCounter');
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    
    counter.textContent = `${selectedCount} de ${totalCount} estudiantes seleccionados`;
    
    // Update select all checkbox state
    if (selectedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (selectedCount === totalCount) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
    }
}

// Hide create test modal
function hideCreateTestModal() {
    const modal = document.getElementById('createTestModal');
    modal.classList.remove('active');
}

// Handle create test form submission
async function handleCreateTest(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Creando...';

        const formData = new FormData(e.target);
        const selectedStudents = [];

        // Get selected students
        document.querySelectorAll('.student-check:checked').forEach(checkbox => {
            selectedStudents.push(checkbox.value);
        });

        // Validation
        if (!formData.get('testName').trim()) {
            throw new Error('El nombre de la prueba es requerido');
        }

        if (!formData.get('testDate')) {
            throw new Error('La fecha de la prueba es requerida');
        }

        if (selectedStudents.length === 0) {
            throw new Error('Debes seleccionar al menos un estudiante');
        }

        if (!formData.get('block1StartTime') || !formData.get('block2StartTime') ||
            !formData.get('block1EndTime') || !formData.get('block2EndTime')) {
            throw new Error('Debes configurar las horas de inicio y fin de ambos bloques');
        }

        // Crear fechas completas combinando fecha y hora (evitando problemas de zona horaria)
        const testDate = formData.get('testDate');
        const [year, month, day] = testDate.split('-').map(Number);
        
        // Crear fechas usando el constructor de Date para evitar problemas de zona horaria
        const block1StartTime = formData.get('block1StartTime').split(':');
        const block1EndTime = formData.get('block1EndTime').split(':');
        const block2StartTime = formData.get('block2StartTime').split(':');
        const block2EndTime = formData.get('block2EndTime').split(':');
        
        const block1Start = new Date(year, month - 1, day, parseInt(block1StartTime[0]), parseInt(block1StartTime[1]));
        const block1End = new Date(year, month - 1, day, parseInt(block1EndTime[0]), parseInt(block1EndTime[1]));
        const block2Start = new Date(year, month - 1, day, parseInt(block2StartTime[0]), parseInt(block2StartTime[1]));
        const block2End = new Date(year, month - 1, day, parseInt(block2EndTime[0]), parseInt(block2EndTime[1]));

        // Validar que las horas sean lógicas
        if (block1Start >= block1End) {
            throw new Error('La hora de fin del Bloque 1 debe ser posterior a la hora de inicio');
        }
        if (block2Start >= block2End) {
            throw new Error('La hora de fin del Bloque 2 debe ser posterior a la hora de inicio');
        }
        if (block1End > block2Start) {
            throw new Error('El Bloque 2 debe iniciar después de que termine el Bloque 1');
        }

        const testData = {
            nombre: formData.get('testName').trim(),
            fechaDisponible: testDate,
            estudiantesAsignados: selectedStudents,
            bloque1: {
                horaInicio: formData.get('block1StartTime'),
                horaFin: formData.get('block1EndTime'),
                fechaHoraInicio: firebase.firestore.Timestamp.fromDate(block1Start),
                fechaHoraFin: firebase.firestore.Timestamp.fromDate(block1End)
            },
            bloque2: {
                horaInicio: formData.get('block2StartTime'),
                horaFin: formData.get('block2EndTime'),
                fechaHoraInicio: firebase.firestore.Timestamp.fromDate(block2Start),
                fechaHoraFin: firebase.firestore.Timestamp.fromDate(block2End)
            },
            fechaCreacion: firebase.firestore.Timestamp.now(),
            creadoPor: currentUser.numeroIdentidad || currentUser.id,
            estado: 'activa'
        };

        // Wait for Firebase to be initialized
        if (!db) {
            await new Promise(resolve => {
                const checkDB = () => {
                    if (window.firebaseDB) {
                        db = window.firebaseDB;
                        resolve();
                    } else {
                        setTimeout(checkDB, 100);
                    }
                };
                checkDB();
            });
        }

        await db.collection('pruebas').add(testData);
        showNotification('Prueba creada exitosamente', 'success');
        hideCreateTestModal();
        await loadAllTests();
        renderTestsList();

    } catch (error) {
        console.error('Error creating test:', error);
        showNotification(error.message || 'Error al crear la prueba', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Render tests list (admin view)
function renderTestsList() {
    const testsList = document.getElementById('testsList');

    if (allTests.length === 0) {
        testsList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-text"></i>
                <h3>No hay pruebas creadas</h3>
                <p>Crea tu primera prueba haciendo clic en "Crear Nueva Prueba"</p>
            </div>
        `;
        return;
    }

    testsList.innerHTML = '';

    allTests.forEach(test => {
        const testCard = createTestCard(test);
        testsList.appendChild(testCard);
    });
}

// Create test card element
function createTestCard(test) {
    const card = document.createElement('div');
    card.className = 'test-card';

    // Get assigned students names
    const assignedStudentsNames = allStudents
        .filter(student => test.estudiantesAsignados && test.estudiantesAsignados.includes(student.id))
        .map(student => student.nombre);

    // Format date (evitando problemas de zona horaria)
    const [year, month, day] = test.fechaDisponible.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    const formattedDate = testDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    card.innerHTML = `
        <div class="test-header">
            <h3 class="test-title">${test.nombre}</h3>
            <span class="test-date">${formattedDate}</span>
        </div>
        
        <div class="test-info">
            <div class="test-blocks">
                <div class="block-info">
                    <div class="block-title">
                        <i class="bi bi-clock"></i> Bloque 1
                    </div>
                    <div class="block-time">
                        <strong>Inicio:</strong> ${test.bloque1?.horaInicio || 'N/A'}<br>
                        <strong>Fin:</strong> ${test.bloque1?.horaFin || 'N/A'}
                    </div>
                </div>
                <div class="block-info">
                    <div class="block-title">
                        <i class="bi bi-clock"></i> Bloque 2
                    </div>
                    <div class="block-time">
                        <strong>Inicio:</strong> ${test.bloque2?.horaInicio || 'N/A'}<br>
                        <strong>Fin:</strong> ${test.bloque2?.horaFin || 'N/A'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="assigned-students">
            <h4>
                <i class="bi bi-people"></i> 
                Estudiantes Asignados (${assignedStudentsNames.length})
            </h4>
            <div class="students-tags">
                ${assignedStudentsNames.length > 0
            ? assignedStudentsNames.map(name => `<span class="student-tag">${name}</span>`).join('')
            : '<span style="color: #666; font-style: italic;">No hay estudiantes asignados</span>'
        }
            </div>
        </div>
        
        <div class="test-actions">
            <button class="btn btn-primary" onclick="editBlocks('${test.id}')">
                <i class="bi bi-grid-3x3-gap"></i>
                Agregar/Editar Bloques
            </button>
            <button class="btn btn-secondary" onclick="editTest('${test.id}')">
                <i class="bi bi-pencil"></i>
                Editar
            </button>
            <button class="btn btn-danger" onclick="deleteTest('${test.id}')">
                <i class="bi bi-trash"></i>
                Eliminar
            </button>
        </div>
    `;

    return card;
}

// Render student tests
function renderStudentTests() {
    const studentTestsList = document.getElementById('studentTestsList');

    if (allTests.length === 0) {
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

    allTests.forEach(test => {
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

    card.innerHTML = `
        <div class="student-test-header">
            <h3 class="test-title">${test.nombre}</h3>
            <span class="test-status ${statusClass}">${statusText}</span>
        </div>
        
        <div class="test-info">
            <p><strong>Fecha:</strong> ${formattedDate}</p>
            
            <div class="test-blocks">
                <div class="block-info">
                    <div class="block-title">
                        <i class="bi bi-clock"></i> Bloque 1
                    </div>
                    <div class="block-time">
                        <strong>Inicio:</strong> ${test.bloque1?.horaInicio || 'N/A'}<br>
                        <strong>Fin:</strong> ${test.bloque1?.horaFin || 'N/A'}
                    </div>
                </div>
                <div class="block-info">
                    <div class="block-title">
                        <i class="bi bi-clock"></i> Bloque 2
                    </div>
                    <div class="block-time">
                        <strong>Inicio:</strong> ${test.bloque2?.horaInicio || 'N/A'}<br>
                        <strong>Fin:</strong> ${test.bloque2?.horaFin || 'N/A'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="test-actions">
            ${status === 'available' ? `
                <button class="btn btn-primary" onclick="startTest('${test.id}')">
                    <i class="bi bi-play-circle"></i>
                    Iniciar Prueba
                </button>
            ` : ''}
        </div>
    `;

    return card;
}

// Show edit test modal
async function editTest(testId) {
    try {
        const test = allTests.find(t => t.id === testId);
        if (!test) {
            showNotification('Prueba no encontrada', 'error');
            return;
        }

        const modal = document.getElementById('editTestModal');
        
        // Fill form with current test data
        document.getElementById('editTestId').value = testId;
        document.getElementById('editTestName').value = test.nombre;
        document.getElementById('editTestDate').value = test.fechaDisponible;
        document.getElementById('editBlock1StartTime').value = test.bloque1?.horaInicio || '';
        document.getElementById('editBlock1EndTime').value = test.bloque1?.horaFin || '';
        document.getElementById('editBlock2StartTime').value = test.bloque2?.horaInicio || '';
        document.getElementById('editBlock2EndTime').value = test.bloque2?.horaFin || '';

        // Populate students selector for edit
        populateEditStudentsSelector(test.estudiantesAsignados || []);

        // Setup select all functionality for edit
        setupEditSelectAllStudents();

        modal.classList.add('active');
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showNotification('Error al abrir el editor', 'error');
    }
}

// Delete test function
async function deleteTest(testId) {
    const confirmed = await showDeleteTestModal();

    if (confirmed) {
        try {
            await db.collection('pruebas').doc(testId).delete();
            showNotification('Prueba eliminada exitosamente', 'success');
            await loadAllTests();
            renderTestsList();
        } catch (error) {
            console.error('Error deleting test:', error);
            showNotification('Error al eliminar la prueba', 'error');
        }
    }
}

// Show delete test confirmation modal
function showDeleteTestModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="deleteTestModalOverlay">
                <div class="panel-modal">
                    <div class="panel-modal-body">
                        <i class="bi bi-exclamation-triangle panel-modal-icon"></i>
                        <p class="panel-modal-message">¿Estás seguro de que deseas eliminar esta prueba?</p>
                        <div class="panel-modal-footer">
                            <button class="panel-modal-btn panel-btn-cancel" id="deleteTestModalCancel">
                                <i class="bi bi-x-lg"></i>
                                Cancelar
                            </button>
                            <button class="panel-modal-btn panel-btn-confirm" id="deleteTestModalConfirm">
                                <i class="bi bi-check-lg"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('deleteTestModalOverlay');
        const confirmBtn = document.getElementById('deleteTestModalConfirm');
        const cancelBtn = document.getElementById('deleteTestModalCancel');
        
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

// Populate students selector for edit
function populateEditStudentsSelector(assignedStudents = []) {
    const studentsList = document.getElementById('editStudentsList');
    const studentsCounter = document.getElementById('editStudentsCounter');
    
    studentsList.innerHTML = '';
    
    if (allStudents.length === 0) {
        studentsList.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No hay estudiantes registrados</p>';
        studentsCounter.textContent = '0 estudiantes disponibles';
        return;
    }

    allStudents.forEach(student => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'student-checkbox';
        
        // Try multiple possible field names for ID
        const possibleIdFields = ['numeroIdentidad', 'numeroDocumento', 'cedula', 'documento', 'id'];
        let studentId = 'N/A';
        
        for (const field of possibleIdFields) {
            if (student[field] && student[field] !== 'N/A') {
                studentId = student[field];
                break;
            }
        }
        
        // Try multiple possible field names for email
        const possibleEmailFields = ['email', 'correo', 'correoElectronico'];
        let studentEmail = 'Sin email';
        
        for (const field of possibleEmailFields) {
            if (student[field] && student[field] !== 'Sin email') {
                studentEmail = student[field];
                break;
            }
        }
        
        // Check if student is assigned
        const isAssigned = assignedStudents.includes(student.id);
        
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="edit_student_${student.id}" value="${student.id}" class="edit-student-check" ${isAssigned ? 'checked' : ''}>
            <label for="edit_student_${student.id}">
                <span class="student-name">${student.nombre || 'Sin nombre'}</span>
                <span class="student-meta">ID: ${studentId} - ${studentEmail}</span>
            </label>
        `;
        studentsList.appendChild(checkboxDiv);
    });

    // Add event listeners to individual checkboxes
    document.querySelectorAll('.edit-student-check').forEach(checkbox => {
        checkbox.addEventListener('change', updateEditStudentsCounter);
    });

    updateEditStudentsCounter();
}

// Setup select all functionality for edit
function setupEditSelectAllStudents() {
    const selectAllCheckbox = document.getElementById('editSelectAllStudents');
    
    selectAllCheckbox.addEventListener('change', function() {
        const studentCheckboxes = document.querySelectorAll('.edit-student-check');
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
        updateEditStudentsCounter();
    });
}

// Update students counter for edit
function updateEditStudentsCounter() {
    const selectedCount = document.querySelectorAll('.edit-student-check:checked').length;
    const totalCount = document.querySelectorAll('.edit-student-check').length;
    const counter = document.getElementById('editStudentsCounter');
    const selectAllCheckbox = document.getElementById('editSelectAllStudents');
    
    counter.textContent = `${selectedCount} de ${totalCount} estudiantes seleccionados`;
    
    // Update select all checkbox state
    if (selectedCount === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
    } else if (selectedCount === totalCount) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
    } else {
        selectAllCheckbox.indeterminate = true;
    }
}

// Hide edit test modal
function hideEditTestModal() {
    const modal = document.getElementById('editTestModal');
    modal.classList.remove('active');
}

// Handle edit test form submission
async function handleEditTest(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Actualizando...';

        const formData = new FormData(e.target);
        const selectedStudents = [];
        const testId = formData.get('editTestId');

        // Get selected students
        document.querySelectorAll('.edit-student-check:checked').forEach(checkbox => {
            selectedStudents.push(checkbox.value);
        });

        // Validation
        if (!formData.get('editTestName').trim()) {
            throw new Error('El nombre de la prueba es requerido');
        }

        if (!formData.get('editTestDate')) {
            throw new Error('La fecha de la prueba es requerida');
        }

        if (selectedStudents.length === 0) {
            throw new Error('Debes seleccionar al menos un estudiante');
        }

        if (!formData.get('editBlock1StartTime') || !formData.get('editBlock2StartTime') ||
            !formData.get('editBlock1EndTime') || !formData.get('editBlock2EndTime')) {
            throw new Error('Debes configurar las horas de inicio y fin de ambos bloques');
        }

        // Crear fechas completas combinando fecha y hora (evitando problemas de zona horaria)
        const testDate = formData.get('editTestDate');
        const [year, month, day] = testDate.split('-').map(Number);
        
        // Crear fechas usando el constructor de Date para evitar problemas de zona horaria
        const block1StartTime = formData.get('editBlock1StartTime').split(':');
        const block1EndTime = formData.get('editBlock1EndTime').split(':');
        const block2StartTime = formData.get('editBlock2StartTime').split(':');
        const block2EndTime = formData.get('editBlock2EndTime').split(':');
        
        const block1Start = new Date(year, month - 1, day, parseInt(block1StartTime[0]), parseInt(block1StartTime[1]));
        const block1End = new Date(year, month - 1, day, parseInt(block1EndTime[0]), parseInt(block1EndTime[1]));
        const block2Start = new Date(year, month - 1, day, parseInt(block2StartTime[0]), parseInt(block2StartTime[1]));
        const block2End = new Date(year, month - 1, day, parseInt(block2EndTime[0]), parseInt(block2EndTime[1]));

        // Validar que las horas sean lógicas
        if (block1Start >= block1End) {
            throw new Error('La hora de fin del Bloque 1 debe ser posterior a la hora de inicio');
        }
        if (block2Start >= block2End) {
            throw new Error('La hora de fin del Bloque 2 debe ser posterior a la hora de inicio');
        }
        if (block1End > block2Start) {
            throw new Error('El Bloque 2 debe iniciar después de que termine el Bloque 1');
        }

        const updateData = {
            nombre: formData.get('editTestName').trim(),
            fechaDisponible: testDate,
            estudiantesAsignados: selectedStudents,
            bloque1: {
                horaInicio: formData.get('editBlock1StartTime'),
                horaFin: formData.get('editBlock1EndTime'),
                fechaHoraInicio: firebase.firestore.Timestamp.fromDate(block1Start),
                fechaHoraFin: firebase.firestore.Timestamp.fromDate(block1End)
            },
            bloque2: {
                horaInicio: formData.get('editBlock2StartTime'),
                horaFin: formData.get('editBlock2EndTime'),
                fechaHoraInicio: firebase.firestore.Timestamp.fromDate(block2Start),
                fechaHoraFin: firebase.firestore.Timestamp.fromDate(block2End)
            },
            fechaModificacion: firebase.firestore.Timestamp.now()
        };

        // Wait for Firebase to be initialized
        if (!db) {
            await new Promise(resolve => {
                const checkDB = () => {
                    if (window.firebaseDB) {
                        db = window.firebaseDB;
                        resolve();
                    } else {
                        setTimeout(checkDB, 100);
                    }
                };
                checkDB();
            });
        }

        await db.collection('pruebas').doc(testId).update(updateData);
        showNotification('Prueba actualizada exitosamente', 'success');
        hideEditTestModal();
        await loadAllTests();
        renderTestsList();

    } catch (error) {
        console.error('Error updating test:', error);
        showNotification(error.message || 'Error al actualizar la prueba', 'error');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Start test function (placeholder)
function startTest(testId) {
    showNotification('Función de inicio de prueba en desarrollo', 'info');
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

// Edit blocks function
function editBlocks(testId) {
    console.log('🚀 editBlocks called with testId:', testId);
    
    if (!testId) {
        console.error('❌ No testId provided');
        showNotification('Error: No se encontró el ID de la prueba', 'error');
        return;
    }
    
    // Store test ID in sessionStorage for the blocks editor
    sessionStorage.setItem('editingTestId', testId);
    console.log('✅ Stored testId in sessionStorage:', sessionStorage.getItem('editingTestId'));
    
    // Show loading notification
    showNotification('Cargando editor de bloques...', 'info');
    
    // Navigate to blocks editor
    console.log('🔄 Navigating to Bloques-Editor.html...');
    setTimeout(() => {
        window.location.href = 'Bloques-Editor.html';
    }, 500);
}

// Make function globally accessible
window.editBlocks = editBlocks;