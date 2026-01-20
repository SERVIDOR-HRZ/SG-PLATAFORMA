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

    // Block 1 toggle for create modal
    document.getElementById('enableBlock1').addEventListener('change', function() {
        const block1Fields = document.getElementById('block1Fields');
        const block1StartTime = document.getElementById('block1StartTime');
        const block1EndTime = document.getElementById('block1EndTime');
        const enableBlock2 = document.getElementById('enableBlock2');
        
        if (this.checked) {
            block1Fields.style.display = 'grid';
        } else {
            // Si se intenta desactivar Bloque 1, verificar que Bloque 2 esté activo
            if (!enableBlock2.checked) {
                showNotification('Debes tener al menos un bloque activo', 'warning');
                this.checked = true;
                return;
            }
            block1Fields.style.display = 'none';
            // Clear fields when disabled
            block1StartTime.dataset.timeValue = '';
            block1StartTime.querySelector('span').textContent = 'Seleccionar hora';
            block1StartTime.classList.add('empty');
            block1EndTime.dataset.timeValue = '';
            block1EndTime.querySelector('span').textContent = 'Seleccionar hora';
            block1EndTime.classList.add('empty');
        }
    });

    // Block 2 toggle for create modal
    document.getElementById('enableBlock2').addEventListener('change', function() {
        const block2Fields = document.getElementById('block2Fields');
        const block2StartTime = document.getElementById('block2StartTime');
        const block2EndTime = document.getElementById('block2EndTime');
        const enableBlock1 = document.getElementById('enableBlock1');
        
        if (this.checked) {
            block2Fields.style.display = 'grid';
        } else {
            // Si se intenta desactivar Bloque 2, verificar que Bloque 1 esté activo
            if (!enableBlock1.checked) {
                showNotification('Debes tener al menos un bloque activo', 'warning');
                this.checked = true;
                return;
            }
            block2Fields.style.display = 'none';
            // Clear fields when disabled
            block2StartTime.dataset.timeValue = '';
            block2StartTime.querySelector('span').textContent = 'Seleccionar hora';
            block2StartTime.classList.add('empty');
            block2EndTime.dataset.timeValue = '';
            block2EndTime.querySelector('span').textContent = 'Seleccionar hora';
            block2EndTime.classList.add('empty');
        }
    });

    // Block 1 toggle for edit modal
    document.getElementById('editEnableBlock1').addEventListener('change', function() {
        const block1Fields = document.getElementById('editBlock1Fields');
        const block1StartTime = document.getElementById('editBlock1StartTime');
        const block1EndTime = document.getElementById('editBlock1EndTime');
        const enableBlock2 = document.getElementById('editEnableBlock2');
        
        if (this.checked) {
            block1Fields.style.display = 'grid';
        } else {
            // Si se intenta desactivar Bloque 1, verificar que Bloque 2 esté activo
            if (!enableBlock2.checked) {
                showNotification('Debes tener al menos un bloque activo', 'warning');
                this.checked = true;
                return;
            }
            block1Fields.style.display = 'none';
            // Clear fields when disabled
            block1StartTime.dataset.timeValue = '';
            block1StartTime.querySelector('span').textContent = 'Seleccionar hora';
            block1StartTime.classList.add('empty');
            block1EndTime.dataset.timeValue = '';
            block1EndTime.querySelector('span').textContent = 'Seleccionar hora';
            block1EndTime.classList.add('empty');
        }
    });

    // Block 2 toggle for edit modal
    document.getElementById('editEnableBlock2').addEventListener('change', function() {
        const block2Fields = document.getElementById('editBlock2Fields');
        const block2StartTime = document.getElementById('editBlock2StartTime');
        const block2EndTime = document.getElementById('editBlock2EndTime');
        const enableBlock1 = document.getElementById('editEnableBlock1');
        
        if (this.checked) {
            block2Fields.style.display = 'grid';
        } else {
            // Si se intenta desactivar Bloque 2, verificar que Bloque 1 esté activo
            if (!enableBlock1.checked) {
                showNotification('Debes tener al menos un bloque activo', 'warning');
                this.checked = true;
                return;
            }
            block2Fields.style.display = 'none';
            // Clear fields when disabled
            block2StartTime.dataset.timeValue = '';
            block2StartTime.querySelector('span').textContent = 'Seleccionar hora';
            block2StartTime.classList.add('empty');
            block2EndTime.dataset.timeValue = '';
            block2EndTime.querySelector('span').textContent = 'Seleccionar hora';
            block2EndTime.classList.add('empty');
        }
    });

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

    // Reset Block 1 toggle and show fields (default active)
    document.getElementById('enableBlock1').checked = true;
    document.getElementById('block1Fields').style.display = 'grid';

    // Reset Block 2 toggle and hide fields
    document.getElementById('enableBlock2').checked = false;
    document.getElementById('block2Fields').style.display = 'none';

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
        studentsList.innerHTML = `
            <div class="students-list-empty">
                <i class="bi bi-people"></i>
                <p>No hay estudiantes registrados</p>
            </div>
        `;
        studentsCounter.innerHTML = '<i class="bi bi-people-fill"></i> 0 estudiantes disponibles';
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
        
        // Get student email
        const studentEmail = student.usuario || student.email || student.emailRecuperacion || 'Sin email';
        
        // Get initials for avatar
        const initials = (student.nombre || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="student_${student.id}" value="${student.id}" class="student-check">
            <div class="student-checkbox-content">
                <div class="student-avatar">${initials}</div>
                <div class="student-info">
                    <label for="student_${student.id}">
                        <span class="student-name">${student.nombre || 'Sin nombre'}</span>
                        <div class="student-meta">
                            <span><i class="bi bi-card-text"></i> ${studentId}</span>
                            <span><i class="bi bi-envelope"></i> ${studentEmail}</span>
                        </div>
                    </label>
                </div>
            </div>
        `;
        studentsList.appendChild(checkboxDiv);
    });

    // Add event listeners to individual checkboxes
    document.querySelectorAll('.student-check').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateStudentsCounter();
            // Toggle selected class
            this.closest('.student-checkbox').classList.toggle('selected', this.checked);
        });
    });

    updateStudentsCounter();
}

// Setup select all functionality
function setupSelectAllStudents() {
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    const searchInput = document.getElementById('searchStudents');
    
    selectAllCheckbox.addEventListener('change', function() {
        const studentCheckboxes = document.querySelectorAll('.student-check:not([style*="display: none"])');
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            checkbox.closest('.student-checkbox').classList.toggle('selected', this.checked);
        });
        updateStudentsCounter();
    });
    
    // Setup search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const studentCheckboxes = document.querySelectorAll('.student-checkbox');
            
            studentCheckboxes.forEach(checkbox => {
                const studentName = checkbox.querySelector('.student-name').textContent.toLowerCase();
                const studentMeta = checkbox.querySelector('.student-meta').textContent.toLowerCase();
                const matches = studentName.includes(searchTerm) || studentMeta.includes(searchTerm);
                
                checkbox.style.display = matches ? 'flex' : 'none';
            });
            
            updateStudentsCounter();
        });
    }
}

// Update students counter
function updateStudentsCounter() {
    const selectedCount = document.querySelectorAll('.student-check:checked').length;
    const totalCount = document.querySelectorAll('.student-check').length;
    const counter = document.getElementById('studentsCounter');
    const selectAllCheckbox = document.getElementById('selectAllStudents');
    
    counter.innerHTML = `<i class="bi bi-people-fill"></i> ${selectedCount} de ${totalCount} estudiantes seleccionados`;
    
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

    // El botón está fuera del form (en el footer fijo), buscarlo por el atributo form
    const submitBtn = document.querySelector('button[form="createTestForm"][type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';

    try {
        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Creando...';
        }

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

        if (!formData.get('testStartDate')) {
            throw new Error('La fecha de inicio es requerida');
        }

        if (!formData.get('testEndDate')) {
            throw new Error('La fecha de fin es requerida');
        }

        // Validar que fecha fin sea mayor o igual a fecha inicio
        const startDate = formData.get('testStartDate');
        const endDate = formData.get('testEndDate');
        if (endDate < startDate) {
            throw new Error('La fecha de fin debe ser igual o posterior a la fecha de inicio');
        }

        if (selectedStudents.length === 0) {
            throw new Error('Debes seleccionar al menos un estudiante');
        }

        // Verificar que al menos un bloque esté habilitado
        const enableBlock1 = document.getElementById('enableBlock1').checked;
        const enableBlock2 = document.getElementById('enableBlock2').checked;
        
        if (!enableBlock1 && !enableBlock2) {
            throw new Error('Debes habilitar al menos un bloque');
        }

        const testData = {
            nombre: formData.get('testName').trim(),
            tipo: formData.get('testType') || 'prueba', // Tipo: prueba o minisimulacro
            fechaInicio: startDate,
            fechaFin: endDate,
            fechaDisponible: startDate, // Mantener compatibilidad
            estudiantesAsignados: selectedStudents,
            fechaCreacion: firebase.firestore.Timestamp.now(),
            creadoPor: currentUser.numeroIdentidad || currentUser.id,
            estado: 'activa'
        };

        // Función para convertir hora 12h a 24h
        const convertTo24Hour = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };

        // Función para comparar horas (retorna minutos desde medianoche)
        const timeToMinutes = (time24) => {
            const [hours, minutes] = time24.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Agregar Bloque 1 solo si está habilitado
        if (enableBlock1) {
            const block1StartTimeEl = document.getElementById('block1StartTime');
            const block1EndTimeEl = document.getElementById('block1EndTime');
            const block1StartTimeStr = block1StartTimeEl.dataset.timeValue;
            const block1EndTimeStr = block1EndTimeEl.dataset.timeValue;
            
            if (!block1StartTimeStr || !block1EndTimeStr) {
                throw new Error('Debes completar las horas de inicio y fin del Bloque 1');
            }
            
            const block1StartTime24 = convertTo24Hour(block1StartTimeStr);
            const block1EndTime24 = convertTo24Hour(block1EndTimeStr);

            // Validar que las horas del Bloque 1 sean lógicas
            if (timeToMinutes(block1StartTime24) >= timeToMinutes(block1EndTime24)) {
                throw new Error('La hora de fin del Bloque 1 debe ser posterior a la hora de inicio');
            }

            testData.bloque1 = {
                horaInicio: block1StartTime24,
                horaFin: block1EndTime24
            };
        }

        // Agregar Bloque 2 solo si está habilitado
        if (enableBlock2) {
            const block2StartTimeEl = document.getElementById('block2StartTime');
            const block2EndTimeEl = document.getElementById('block2EndTime');
            const block2StartTimeStr = block2StartTimeEl.dataset.timeValue;
            const block2EndTimeStr = block2EndTimeEl.dataset.timeValue;
            
            if (!block2StartTimeStr || !block2EndTimeStr) {
                throw new Error('Debes completar las horas de inicio y fin del Bloque 2');
            }
            
            const block2StartTime24 = convertTo24Hour(block2StartTimeStr);
            const block2EndTime24 = convertTo24Hour(block2EndTimeStr);

            // Validar que las horas del Bloque 2 sean lógicas
            if (timeToMinutes(block2StartTime24) >= timeToMinutes(block2EndTime24)) {
                throw new Error('La hora de fin del Bloque 2 debe ser posterior a la hora de inicio');
            }
            
            // Si ambos bloques están habilitados, validar que no se traslapen
            if (enableBlock1 && testData.bloque1) {
                if (timeToMinutes(testData.bloque1.horaFin) > timeToMinutes(block2StartTime24)) {
                    throw new Error('El Bloque 2 debe iniciar después de que termine el Bloque 1');
                }
            }

            testData.bloque2 = {
                horaInicio: block2StartTime24,
                horaFin: block2EndTime24
            };
        }

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
        
        const typeLabels = { 'prueba': 'Prueba', 'minisimulacro': 'Minisimulacro', 'reto': 'Reto' };
        const tipoCreado = testData.tipo || 'prueba';
        showNotification(`${typeLabels[tipoCreado]} creado exitosamente`, 'success');
        hideCreateTestModal();
        await loadAllTests();
        renderTestsList();

    } catch (error) {
        console.error('Error creating test:', error);
        showNotification(error.message || 'Error al crear la prueba', 'error');
    } finally {
        // Re-enable submit button
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

// Render tests list (admin view) - Filtrado por tipo
function renderTestsList() {
    const testsList = document.getElementById('testsList');
    const currentType = typeof getCurrentTestType === 'function' ? getCurrentTestType() : 'prueba';
    
    // Filtrar pruebas según el tipo seleccionado
    // Si es 'reto', por ahora no mostramos nada (será diferente)
    let filteredTests = [];
    
    if (currentType === 'reto') {
        // Los retos tendrán su propia lógica después
        filteredTests = allTests.filter(test => test.tipo === 'reto');
    } else {
        // Para pruebas y minisimulacros, filtrar por tipo
        // Si no tiene tipo definido, se considera 'prueba' por defecto
        filteredTests = allTests.filter(test => {
            const testType = test.tipo || 'prueba';
            return testType === currentType;
        });
    }

    if (filteredTests.length === 0) {
        const typeLabels = {
            'prueba': 'pruebas creadas',
            'minisimulacro': 'minisimulacros creados',
            'reto': 'retos creados'
        };
        const btnLabels = {
            'prueba': 'Crear Nueva Prueba',
            'minisimulacro': 'Crear Nuevo Minisimulacro',
            'reto': 'Crear Nuevo Reto'
        };
        testsList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-file-earmark-text"></i>
                <h3>No hay ${typeLabels[currentType]}</h3>
                <p>Crea tu primer registro haciendo clic en "${btnLabels[currentType]}"</p>
            </div>
        `;
        return;
    }

    testsList.innerHTML = '';

    filteredTests.forEach(test => {
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

    // Format dates (evitando problemas de zona horaria)
    const startDateStr = test.fechaInicio || test.fechaDisponible;
    const endDateStr = test.fechaFin || test.fechaDisponible;
    
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
    
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    
    const formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedStartDate = startDate.toLocaleDateString('es-ES', formatOptions);
    const formattedEndDate = endDate.toLocaleDateString('es-ES', formatOptions);
    
    // Mostrar rango o fecha única
    const formattedDate = startDateStr === endDateStr 
        ? formattedStartDate 
        : `${formattedStartDate} - ${formattedEndDate}`;

    // Construir HTML de bloques dinámicamente
    let blocksHTML = `
        <div class="block-info">
            <div class="block-title">
                <i class="bi bi-clock"></i> Bloque 1
            </div>
            <div class="block-time">
                <strong>Inicio:</strong> ${test.bloque1?.horaInicio || 'N/A'}<br>
                <strong>Fin:</strong> ${test.bloque1?.horaFin || 'N/A'}
            </div>
        </div>
    `;

    // Solo agregar Bloque 2 si existe
    if (test.bloque2 && test.bloque2.horaInicio && test.bloque2.horaFin) {
        blocksHTML += `
            <div class="block-info">
                <div class="block-title">
                    <i class="bi bi-clock"></i> Bloque 2
                </div>
                <div class="block-time">
                    <strong>Inicio:</strong> ${test.bloque2.horaInicio}<br>
                    <strong>Fin:</strong> ${test.bloque2.horaFin}
                </div>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="test-header">
            <h3 class="test-title">${test.nombre}</h3>
            <span class="test-date">${formattedDate}</span>
        </div>
        
        <div class="test-info">
            <div class="test-blocks">
                ${blocksHTML}
            </div>
        </div>
        
        <div class="assigned-students">
            <h4>
                <i class="bi bi-people"></i> 
                ${assignedStudentsNames.length} Estudiantes Asignados
            </h4>
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
    now.setHours(0, 0, 0, 0); // Normalizar a inicio del día
    
    const startDateStr = test.fechaInicio || test.fechaDisponible;
    const endDateStr = test.fechaFin || test.fechaDisponible;
    
    const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
    
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);
    endDate.setHours(23, 59, 59, 999); // Fin del día
    
    let status = 'available';
    let statusText = 'Disponible';
    let statusClass = 'status-available';

    if (now < startDate) {
        status = 'pending';
        statusText = 'Próximamente';
        statusClass = 'status-pending';
    } else if (now > endDate) {
        status = 'expired';
        statusText = 'Finalizada';
        statusClass = 'status-expired';
    }

    // Format dates
    const formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedStartDate = startDate.toLocaleDateString('es-ES', formatOptions);
    const formattedEndDate = endDate.toLocaleDateString('es-ES', formatOptions);
    
    const formattedDate = startDateStr === endDateStr 
        ? formattedStartDate 
        : `${formattedStartDate} - ${formattedEndDate}`;

    // Construir HTML de bloques dinámicamente
    let blocksHTML = `
        <div class="block-info">
            <div class="block-title">
                <i class="bi bi-clock"></i> Bloque 1
            </div>
            <div class="block-time">
                <strong>Inicio:</strong> ${test.bloque1?.horaInicio || 'N/A'}<br>
                <strong>Fin:</strong> ${test.bloque1?.horaFin || 'N/A'}
            </div>
        </div>
    `;

    // Solo agregar Bloque 2 si existe
    if (test.bloque2 && test.bloque2.horaInicio && test.bloque2.horaFin) {
        blocksHTML += `
            <div class="block-info">
                <div class="block-title">
                    <i class="bi bi-clock"></i> Bloque 2
                </div>
                <div class="block-time">
                    <strong>Inicio:</strong> ${test.bloque2.horaInicio}<br>
                    <strong>Fin:</strong> ${test.bloque2.horaFin}
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
        document.getElementById('editTestStartDate').value = test.fechaInicio || test.fechaDisponible;
        document.getElementById('editTestEndDate').value = test.fechaFin || test.fechaDisponible;
        
        // Cargar el tipo de evaluación
        const testType = test.tipo || 'prueba';
        if (typeof setTypeToggle === 'function') {
            setTypeToggle('editTestTypeGroup', testType);
        }
        
        // Configure Block 1 toggle and fields
        const hasBlock1 = test.bloque1 && test.bloque1.horaInicio && test.bloque1.horaFin;
        const enableBlock1Checkbox = document.getElementById('editEnableBlock1');
        const block1Fields = document.getElementById('editBlock1Fields');
        
        if (hasBlock1) {
            enableBlock1Checkbox.checked = true;
            block1Fields.style.display = 'grid';
            
            // Convert 24-hour format to 12-hour format for display
            const convertTo12Hour = (time24) => {
                const [hours, minutes] = time24.split(':').map(Number);
                const period = hours >= 12 ? 'PM' : 'AM';
                const hours12 = hours % 12 || 12;
                return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
            };
            
            const startTime12 = convertTo12Hour(test.bloque1.horaInicio);
            const endTime12 = convertTo12Hour(test.bloque1.horaFin);
            
            const startTimeEl = document.getElementById('editBlock1StartTime');
            const endTimeEl = document.getElementById('editBlock1EndTime');
            
            startTimeEl.dataset.timeValue = startTime12;
            startTimeEl.querySelector('span').textContent = startTime12;
            startTimeEl.classList.remove('empty');
            
            endTimeEl.dataset.timeValue = endTime12;
            endTimeEl.querySelector('span').textContent = endTime12;
            endTimeEl.classList.remove('empty');
        } else {
            enableBlock1Checkbox.checked = false;
            block1Fields.style.display = 'none';
            
            const startTimeEl = document.getElementById('editBlock1StartTime');
            const endTimeEl = document.getElementById('editBlock1EndTime');
            
            startTimeEl.dataset.timeValue = '';
            startTimeEl.querySelector('span').textContent = 'Seleccionar hora';
            startTimeEl.classList.add('empty');
            
            endTimeEl.dataset.timeValue = '';
            endTimeEl.querySelector('span').textContent = 'Seleccionar hora';
            endTimeEl.classList.add('empty');
        }
        
        // Configure Block 2 toggle and fields
        const hasBlock2 = test.bloque2 && test.bloque2.horaInicio && test.bloque2.horaFin;
        const enableBlock2Checkbox = document.getElementById('editEnableBlock2');
        const block2Fields = document.getElementById('editBlock2Fields');
        
        if (hasBlock2) {
            enableBlock2Checkbox.checked = true;
            block2Fields.style.display = 'grid';
            
            // Convert 24-hour format to 12-hour format for display
            const convertTo12Hour = (time24) => {
                const [hours, minutes] = time24.split(':').map(Number);
                const period = hours >= 12 ? 'PM' : 'AM';
                const hours12 = hours % 12 || 12;
                return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
            };
            
            const startTime12 = convertTo12Hour(test.bloque2.horaInicio);
            const endTime12 = convertTo12Hour(test.bloque2.horaFin);
            
            const startTimeEl = document.getElementById('editBlock2StartTime');
            const endTimeEl = document.getElementById('editBlock2EndTime');
            
            startTimeEl.dataset.timeValue = startTime12;
            startTimeEl.querySelector('span').textContent = startTime12;
            startTimeEl.classList.remove('empty');
            
            endTimeEl.dataset.timeValue = endTime12;
            endTimeEl.querySelector('span').textContent = endTime12;
            endTimeEl.classList.remove('empty');
        } else {
            enableBlock2Checkbox.checked = false;
            block2Fields.style.display = 'none';
            
            const startTimeEl = document.getElementById('editBlock2StartTime');
            const endTimeEl = document.getElementById('editBlock2EndTime');
            
            startTimeEl.dataset.timeValue = '';
            startTimeEl.querySelector('span').textContent = 'Seleccionar hora';
            startTimeEl.classList.add('empty');
            
            endTimeEl.dataset.timeValue = '';
            endTimeEl.querySelector('span').textContent = 'Seleccionar hora';
            endTimeEl.classList.add('empty');
        }

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

// Delete test function - AHORA TAMBIÉN ELIMINA LAS RESPUESTAS ASOCIADAS
async function deleteTest(testId) {
    const confirmed = await showDeleteTestModal();

    if (confirmed) {
        try {
            // Primero obtener y eliminar todas las respuestas asociadas a esta prueba
            const respuestasSnapshot = await db.collection('respuestas')
                .where('pruebaId', '==', testId)
                .get();
            
            // Contar respuestas a eliminar
            const cantidadRespuestas = respuestasSnapshot.size;
            
            if (cantidadRespuestas > 0) {
                console.log(`Eliminando ${cantidadRespuestas} respuestas asociadas a la prueba ${testId}...`);
                
                // Eliminar respuestas en batches (máximo 500 por batch en Firebase)
                const batchSize = 500;
                const docs = respuestasSnapshot.docs;
                
                for (let i = 0; i < docs.length; i += batchSize) {
                    const batch = db.batch();
                    const chunk = docs.slice(i, i + batchSize);
                    
                    chunk.forEach(doc => {
                        batch.delete(doc.ref);
                    });
                    
                    await batch.commit();
                }
                
                console.log(`✅ ${cantidadRespuestas} respuestas eliminadas correctamente`);
            }
            
            // Ahora eliminar la prueba
            await db.collection('pruebas').doc(testId).delete();
            
            // Mostrar mensaje con información de lo eliminado
            if (cantidadRespuestas > 0) {
                showNotification(`Prueba y ${cantidadRespuestas} respuesta(s) eliminadas exitosamente`, 'success');
            } else {
                showNotification('Prueba eliminada exitosamente', 'success');
            }
            
            await loadAllTests();
            renderTestsList();
        } catch (error) {
            console.error('Error deleting test:', error);
            showNotification('Error al eliminar la prueba: ' + error.message, 'error');
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
                        <p style="font-size: 0.9em; color: #666; margin-top: -15px; margin-bottom: 20px;">
                            <i class="bi bi-info-circle"></i> También se eliminarán todas las respuestas de los estudiantes asociadas a esta prueba.
                        </p>
                        <div class="panel-modal-footer">
                            <button class="panel-modal-btn panel-btn-cancel" id="deleteTestModalCancel">
                                <i class="bi bi-x-lg"></i>
                                Cancelar
                            </button>
                            <button class="panel-modal-btn panel-btn-confirm" id="deleteTestModalConfirm">
                                <i class="bi bi-trash"></i>
                                Eliminar Todo
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
        studentsList.innerHTML = `
            <div class="students-list-empty">
                <i class="bi bi-people"></i>
                <p>No hay estudiantes registrados</p>
            </div>
        `;
        studentsCounter.innerHTML = '<i class="bi bi-people-fill"></i> 0 estudiantes disponibles';
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
        
        // Get student email
        const studentEmail = student.usuario || student.email || student.emailRecuperacion || 'Sin email';
        
        // Check if student is assigned
        const isAssigned = assignedStudents.includes(student.id);
        
        // Get initials for avatar
        const initials = (student.nombre || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="edit_student_${student.id}" value="${student.id}" class="edit-student-check" ${isAssigned ? 'checked' : ''}>
            <div class="student-checkbox-content">
                <div class="student-avatar">${initials}</div>
                <div class="student-info">
                    <label for="edit_student_${student.id}">
                        <span class="student-name">${student.nombre || 'Sin nombre'}</span>
                        <div class="student-meta">
                            <span><i class="bi bi-card-text"></i> ${studentId}</span>
                            <span><i class="bi bi-envelope"></i> ${studentEmail}</span>
                        </div>
                    </label>
                </div>
            </div>
        `;
        
        if (isAssigned) {
            checkboxDiv.classList.add('selected');
        }
        
        studentsList.appendChild(checkboxDiv);
    });

    // Add event listeners to individual checkboxes
    document.querySelectorAll('.edit-student-check').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateEditStudentsCounter();
            // Toggle selected class
            this.closest('.student-checkbox').classList.toggle('selected', this.checked);
        });
    });

    updateEditStudentsCounter();
}

// Setup select all functionality for edit
function setupEditSelectAllStudents() {
    const selectAllCheckbox = document.getElementById('editSelectAllStudents');
    const searchInput = document.getElementById('editSearchStudents');
    
    selectAllCheckbox.addEventListener('change', function() {
        const studentCheckboxes = document.querySelectorAll('.edit-student-check:not([style*="display: none"])');
        studentCheckboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            checkbox.closest('.student-checkbox').classList.toggle('selected', this.checked);
        });
        updateEditStudentsCounter();
    });
    
    // Setup search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const studentCheckboxes = document.querySelectorAll('#editStudentsList .student-checkbox');
            
            studentCheckboxes.forEach(checkbox => {
                const studentName = checkbox.querySelector('.student-name').textContent.toLowerCase();
                const studentMeta = checkbox.querySelector('.student-meta').textContent.toLowerCase();
                const matches = studentName.includes(searchTerm) || studentMeta.includes(searchTerm);
                
                checkbox.style.display = matches ? 'flex' : 'none';
            });
            
            updateEditStudentsCounter();
        });
    }
}

// Update students counter for edit
function updateEditStudentsCounter() {
    const selectedCount = document.querySelectorAll('.edit-student-check:checked').length;
    const totalCount = document.querySelectorAll('.edit-student-check').length;
    const counter = document.getElementById('editStudentsCounter');
    const selectAllCheckbox = document.getElementById('editSelectAllStudents');
    
    counter.innerHTML = `<i class="bi bi-people-fill"></i> ${selectedCount} de ${totalCount} estudiantes seleccionados`;
    
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

    // El botón está fuera del form (en el footer fijo), buscarlo por el atributo form
    const submitBtn = document.querySelector('button[form="editTestForm"][type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';

    try {
        // Disable submit button
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Actualizando...';
        }

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

        if (!formData.get('editTestStartDate')) {
            throw new Error('La fecha de inicio es requerida');
        }

        if (!formData.get('editTestEndDate')) {
            throw new Error('La fecha de fin es requerida');
        }

        // Validar que fecha fin sea mayor o igual a fecha inicio
        const startDate = formData.get('editTestStartDate');
        const endDate = formData.get('editTestEndDate');
        if (endDate < startDate) {
            throw new Error('La fecha de fin debe ser igual o posterior a la fecha de inicio');
        }

        if (selectedStudents.length === 0) {
            throw new Error('Debes seleccionar al menos un estudiante');
        }

        // Verificar que al menos un bloque esté habilitado
        const enableBlock1 = document.getElementById('editEnableBlock1').checked;
        const enableBlock2 = document.getElementById('editEnableBlock2').checked;
        
        if (!enableBlock1 && !enableBlock2) {
            throw new Error('Debes habilitar al menos un bloque');
        }

        const updateData = {
            nombre: formData.get('editTestName').trim(),
            tipo: formData.get('editTestType') || 'prueba', // Tipo: prueba o minisimulacro
            fechaInicio: startDate,
            fechaFin: endDate,
            fechaDisponible: startDate, // Mantener compatibilidad
            estudiantesAsignados: selectedStudents,
            fechaModificacion: firebase.firestore.Timestamp.now()
        };

        // Función para convertir hora 12h a 24h
        const convertTo24Hour = (timeStr) => {
            const [time, period] = timeStr.split(' ');
            let [hours, minutes] = time.split(':').map(Number);
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        };

        // Función para comparar horas (retorna minutos desde medianoche)
        const timeToMinutes = (time24) => {
            const [hours, minutes] = time24.split(':').map(Number);
            return hours * 60 + minutes;
        };

        // Agregar Bloque 1 solo si está habilitado
        if (enableBlock1) {
            const block1StartTimeEl = document.getElementById('editBlock1StartTime');
            const block1EndTimeEl = document.getElementById('editBlock1EndTime');
            const block1StartTimeStr = block1StartTimeEl.dataset.timeValue;
            const block1EndTimeStr = block1EndTimeEl.dataset.timeValue;
            
            if (!block1StartTimeStr || !block1EndTimeStr) {
                throw new Error('Debes completar las horas de inicio y fin del Bloque 1');
            }
            
            const block1StartTime24 = convertTo24Hour(block1StartTimeStr);
            const block1EndTime24 = convertTo24Hour(block1EndTimeStr);

            // Validar que las horas del Bloque 1 sean lógicas
            if (timeToMinutes(block1StartTime24) >= timeToMinutes(block1EndTime24)) {
                throw new Error('La hora de fin del Bloque 1 debe ser posterior a la hora de inicio');
            }

            updateData.bloque1 = {
                horaInicio: block1StartTime24,
                horaFin: block1EndTime24
            };
        } else {
            // Si el Bloque 1 está deshabilitado, eliminar el campo si existía
            updateData.bloque1 = firebase.firestore.FieldValue.delete();
        }

        // Agregar Bloque 2 solo si está habilitado
        if (enableBlock2) {
            const block2StartTimeEl = document.getElementById('editBlock2StartTime');
            const block2EndTimeEl = document.getElementById('editBlock2EndTime');
            const block2StartTimeStr = block2StartTimeEl.dataset.timeValue;
            const block2EndTimeStr = block2EndTimeEl.dataset.timeValue;
            
            if (!block2StartTimeStr || !block2EndTimeStr) {
                throw new Error('Debes completar las horas de inicio y fin del Bloque 2');
            }
            
            const block2StartTime24 = convertTo24Hour(block2StartTimeStr);
            const block2EndTime24 = convertTo24Hour(block2EndTimeStr);

            // Validar que las horas del Bloque 2 sean lógicas
            if (timeToMinutes(block2StartTime24) >= timeToMinutes(block2EndTime24)) {
                throw new Error('La hora de fin del Bloque 2 debe ser posterior a la hora de inicio');
            }
            
            // Si ambos bloques están habilitados, validar que no se traslapen
            if (enableBlock1 && updateData.bloque1 && updateData.bloque1.horaFin) {
                if (timeToMinutes(updateData.bloque1.horaFin) > timeToMinutes(block2StartTime24)) {
                    throw new Error('El Bloque 2 debe iniciar después de que termine el Bloque 1');
                }
            }

            updateData.bloque2 = {
                horaInicio: block2StartTime24,
                horaFin: block2EndTime24
            };
        } else {
            // Si el Bloque 2 está deshabilitado, eliminar el campo si existía
            updateData.bloque2 = firebase.firestore.FieldValue.delete();
        }

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
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
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

// Initialize time pickers after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait for time picker to be initialized
    setTimeout(() => {
        // Attach time pickers to create modal
        attachTimePicker('block1StartTime');
        attachTimePicker('block1EndTime');
        attachTimePicker('block2StartTime');
        attachTimePicker('block2EndTime');
        
        // Attach time pickers to edit modal
        attachTimePicker('editBlock1StartTime');
        attachTimePicker('editBlock1EndTime');
        attachTimePicker('editBlock2StartTime');
        attachTimePicker('editBlock2EndTime');
    }, 500);
});
