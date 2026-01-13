// Users Management JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    checkAuthentication();

    // Load user info
    loadUserInfo();

    // Initialize page
    initializePage();

    // Load users
    loadUsers();

    // Cargar instituciones para los selectores
    loadInstitucionesForSelectors();

    // Inicializar foto de perfil
    if (typeof inicializarPerfilCompartido === 'function') {
        inicializarPerfilCompartido();
    }

    // Initialize profile modal
    initializeProfileModal();
});

let allUsers = [];
let filteredUsers = [];
let currentUserForReset = null;
let currentUserForEdit = null;

// Cache de nombres de aulas para mostrar en la tabla
let aulasNombresCache = {};

// Función para obtener los nombres de las aulas de un usuario
function getAulasNombres(aulasAsignadas) {
    if (!aulasAsignadas || aulasAsignadas.length === 0) return [];
    
    return aulasAsignadas.map(aula => {
        const aulaId = typeof aula === 'object' ? aula.aulaId : aula;
        // Buscar en el cache primero
        if (aulasNombresCache[aulaId]) {
            return aulasNombresCache[aulaId];
        }
        // Buscar en allAulas si está disponible
        if (typeof allAulas !== 'undefined' && allAulas.length > 0) {
            const aulaData = allAulas.find(a => a.id === aulaId);
            if (aulaData) {
                aulasNombresCache[aulaId] = aulaData.nombre;
                return aulaData.nombre;
            }
        }
        return aulaId; // Retornar el ID si no se encuentra el nombre
    }).filter(nombre => nombre); // Filtrar valores vacíos
}

// Función para cargar el cache de nombres de aulas
async function loadAulasNombresCache() {
    try {
        await waitForFirebase();
        const snapshot = await window.firebaseDB.collection('aulas').get();
        snapshot.forEach(doc => {
            const data = doc.data();
            aulasNombresCache[doc.id] = data.nombre || doc.id;
        });
    } catch (error) {
        console.error('Error loading aulas nombres cache:', error);
    }
}
let currentDashboardView = 'dashboard'; // dashboard, profesores, estudiantes

// Security code for creating superusers
const SUPERUSER_SECURITY_CODE = 'SG-PG-2025-OWH346OU6634OSDFS4YE431FSD325';

// Array para almacenar las instituciones cargadas
let institucionesDisponibles = [];

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    userTypeFilter: document.getElementById('userTypeFilter'),
    statusFilter: document.getElementById('statusFilter'),
    institucionFilter: document.getElementById('institucionFilter'),
    usersTableBody: document.getElementById('usersTableBody'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    noResults: document.getElementById('noResults'),
    refreshBtn: document.getElementById('refreshBtn'),
    createUserBtn: document.getElementById('createUserBtn'),
    backBtn: document.getElementById('backBtn'),

    // Dashboard tabs
    dashboardTab: document.getElementById('dashboardTab'),
    profesoresTab: document.getElementById('profesoresTab'),
    estudiantesTab: document.getElementById('estudiantesTab'),
    superusuariosTab: document.getElementById('superusuariosTab'),
    codigosTab: document.getElementById('codigosTab'),
    insigniasTab: document.getElementById('insigniasTab'),
    institucionesTab: document.getElementById('institucionesTab'),
    coordinadoresTab: document.getElementById('coordinadoresTab'),

    // Export elements
    exportBtn: document.getElementById('exportBtn'),
    exportMenu: document.getElementById('exportMenu'),
    exportDropdown: document.querySelector('.export-dropdown'),

    // Stats
    totalUsers: document.getElementById('totalUsers'),
    totalAdmins: document.getElementById('totalAdmins'),
    totalSuperusers: document.getElementById('totalSuperusers'),
    totalStudents: document.getElementById('totalStudents'),
    activeUsers: document.getElementById('activeUsers'),

    // Reset Password Modal
    resetPasswordModal: document.getElementById('resetPasswordModal'),
    closeModal: document.getElementById('closeModal'),
    cancelReset: document.getElementById('cancelReset'),
    resetPasswordForm: document.getElementById('resetPasswordForm'),
    modalUserName: document.getElementById('modalUserName'),
    modalUserEmail: document.getElementById('modalUserEmail'),
    modalUserType: document.getElementById('modalUserType'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    togglePassword: document.getElementById('togglePassword'),
    toggleConfirmPassword: document.getElementById('toggleConfirmPassword'),

    // Create User Modal
    createUserModal: document.getElementById('createUserModal'),
    closeCreateUserModal: document.getElementById('closeCreateUserModal'),
    cancelCreateUser: document.getElementById('cancelCreateUser'),
    createUserForm: document.getElementById('createUserForm'),
    createNombre: document.getElementById('createNombre'),
    createUsuario: document.getElementById('createUsuario'),
    createPassword: document.getElementById('createPassword'),
    createTelefono: document.getElementById('createTelefono'),
    createEmailRecuperacion: document.getElementById('createEmailRecuperacion'),
    createInstitucion: document.getElementById('createInstitucion'),
    createGrado: document.getElementById('createGrado'),
    createTipoDocumento: document.getElementById('createTipoDocumento'),
    createNumeroDocumento: document.getElementById('createNumeroDocumento'),
    createDepartamento: document.getElementById('createDepartamento'),
    toggleCreatePassword: document.getElementById('toggleCreatePassword'),
    createButtonText: document.getElementById('createButtonText'),
    createSecurityCode: document.getElementById('createSecurityCode'),
    securityCodeSectionCreate: document.getElementById('securityCodeSectionCreate'),

    // Edit User Modal
    editUserModal: document.getElementById('editUserModal'),
    closeEditUserModal: document.getElementById('closeEditUserModal'),
    cancelEditUser: document.getElementById('cancelEditUser'),
    editUserForm: document.getElementById('editUserForm'),
    editUserTypeBadge: document.getElementById('editUserTypeBadge'),
    editUserTypeText: document.getElementById('editUserTypeText'),
    editNombre: document.getElementById('editNombre'),
    editUsuario: document.getElementById('editUsuario'),
    editTelefono: document.getElementById('editTelefono'),
    editEmailRecuperacion: document.getElementById('editEmailRecuperacion'),
    editInstitucion: document.getElementById('editInstitucion'),
    editGrado: document.getElementById('editGrado'),
    editTipoDocumento: document.getElementById('editTipoDocumento'),
    editNumeroDocumento: document.getElementById('editNumeroDocumento'),
    editDepartamento: document.getElementById('editDepartamento'),

    // Confirmation Modal
    confirmationModal: document.getElementById('confirmationModal'),
    closeConfirmationModal: document.getElementById('closeConfirmationModal'),
    cancelConfirmation: document.getElementById('cancelConfirmation'),
    confirmAction: document.getElementById('confirmAction'),
    confirmationTitle: document.getElementById('confirmationTitle'),
    confirmationMessage: document.getElementById('confirmationMessage'),
    confirmationIcon: document.getElementById('confirmationIcon'),
    confirmationUserName: document.getElementById('confirmationUserName'),
    confirmationUserEmail: document.getElementById('confirmationUserEmail'),
    confirmButtonText: document.getElementById('confirmButtonText'),

    messageContainer: document.getElementById('messageContainer')
};

// Check authentication
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    // Permitir acceso a admin, superusuario o tipoUsuario admin
    const isAdmin = currentUser.tipoUsuario === 'admin' ||
        currentUser.rol === 'admin' ||
        currentUser.rol === 'superusuario';

    if (!currentUser.id || !isAdmin) {
        window.location.href = '../index.html';
        return;
    }

    // Guardar el rol del usuario actual para verificaciones posteriores
    window.currentUserRole = currentUser.rol || currentUser.tipoUsuario;
}

// Load user info
function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (currentUser.nombre) {
        document.getElementById('adminName').textContent = currentUser.nombre.toUpperCase();
    }
}

// Initialize page
function initializePage() {
    // Dashboard menu event listeners
    initializeDashboardMenu();

    // Event listeners
    elements.searchInput.addEventListener('input', handleSearch);
    elements.userTypeFilter.addEventListener('change', handleFilter);
    elements.statusFilter.addEventListener('change', handleFilter);
    elements.institucionFilter.addEventListener('change', handleFilter);
    elements.refreshBtn.addEventListener('click', loadUsers);
    elements.createUserBtn.addEventListener('click', openCreateUserModal);
    elements.backBtn.addEventListener('click', () => window.location.href = 'Panel_Admin.html');

    // Manage insignias button
    const manageInsigniasBtn = document.getElementById('manageInsigniasBtn');
    if (manageInsigniasBtn) {
        manageInsigniasBtn.addEventListener('click', openInsigniasManagement);
    }

    // Logout button manejado por perfil-compartido.js

    // Export dropdown events
    elements.exportBtn.addEventListener('click', toggleExportMenu);
    document.addEventListener('click', closeExportMenuOutside);

    // Export option events
    const exportOptions = document.querySelectorAll('.export-option');
    exportOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const type = e.currentTarget.getAttribute('data-type');
            handleExport(type);
            closeExportMenu();
        });
    });

    // Reset Password Modal events
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelReset.addEventListener('click', closeModal);
    elements.resetPasswordForm.addEventListener('submit', handlePasswordReset);
    elements.togglePassword.addEventListener('click', () => togglePasswordVisibility('newPassword', 'togglePassword'));
    elements.toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword'));

    // Create User Modal events
    elements.closeCreateUserModal.addEventListener('click', closeCreateUserModal);
    elements.cancelCreateUser.addEventListener('click', closeCreateUserModal);
    elements.createUserForm.addEventListener('submit', handleCreateUser);
    elements.toggleCreatePassword.addEventListener('click', () => togglePasswordVisibility('createPassword', 'toggleCreatePassword'));

    // Role selection change event for security code and subject visibility
    document.addEventListener('change', function (e) {
        if (e.target.name === 'rolUsuario') {
            toggleSecurityCodeSection();
        }
        if (e.target.name === 'rolUsuarioEdit') {
            toggleSubjectSectionEdit();
        }
    });

    // Username field validation - prevent @ and .com
    elements.createUsuario.addEventListener('input', function (e) {
        cleanUsernameField(e.target);
    });

    elements.createUsuario.addEventListener('paste', function (e) {
        // Allow paste but clean it after a short delay
        setTimeout(() => {
            cleanUsernameField(e.target);
        }, 10);
    });

    // Also add validation for edit modal
    const editUsuarioField = document.getElementById('editUsuario');
    if (editUsuarioField) {
        editUsuarioField.addEventListener('input', function (e) {
            cleanUsernameField(e.target);
        });

        editUsuarioField.addEventListener('paste', function (e) {
            setTimeout(() => {
                cleanUsernameField(e.target);
            }, 10);
        });
    }

    // Edit User Modal events
    elements.closeEditUserModal.addEventListener('click', closeEditUserModal);
    elements.cancelEditUser.addEventListener('click', closeEditUserModal);
    elements.editUserForm.addEventListener('submit', handleEditUser);

    // Delete User Modal events
    const deleteUserBtn = document.getElementById('deleteUserBtn');
    const deleteUserModal = document.getElementById('deleteUserModal');
    const closeDeleteModal = document.getElementById('closeDeleteModal');
    const cancelDeleteUser = document.getElementById('cancelDeleteUser');
    const confirmDeleteUser = document.getElementById('confirmDeleteUser');

    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', openDeleteUserModal);
    }
    if (closeDeleteModal) {
        closeDeleteModal.addEventListener('click', closeDeleteUserModal);
    }
    if (cancelDeleteUser) {
        cancelDeleteUser.addEventListener('click', closeDeleteUserModal);
    }
    if (confirmDeleteUser) {
        confirmDeleteUser.addEventListener('click', handleDeleteUser);
    }
    if (deleteUserModal) {
        deleteUserModal.addEventListener('click', function (e) {
            if (e.target === deleteUserModal) {
                closeDeleteUserModal();
            }
        });
    }

    // Confirmation Modal events
    elements.closeConfirmationModal.addEventListener('click', closeConfirmationModal);
    elements.cancelConfirmation.addEventListener('click', closeConfirmationModal);

    // User type radio buttons change event
    const userTypeRadios = document.querySelectorAll('input[name="tipoUsuario"]');
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleUserTypeChange);
    });

    // Close modals on outside click
    elements.resetPasswordModal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeModal();
        }
    });

    elements.createUserModal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeCreateUserModal();
        }
    });

    elements.editUserModal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeEditUserModal();
        }
    });

    elements.confirmationModal.addEventListener('click', function (e) {
        if (e.target === this) {
            closeConfirmationModal();
        }
    });
}

// Handle user type change in create modal
function handleUserTypeChange() {
    const selectedType = document.querySelector('input[name="tipoUsuario"]:checked').value;
    const studentFields = document.querySelectorAll('#createUserModal .student-fields');
    const adminFields = document.querySelectorAll('#createUserModal .admin-fields');
    const roleSelection = document.getElementById('roleSelectionCreate');
    const createButton = elements.createButtonText;
    const isSuperuser = window.currentUserRole === 'superusuario';
    const usuarioInput = elements.createUsuario;
    const usuarioLabel = document.getElementById('createUsuarioLabel');
    const usuarioHint = document.getElementById('createUsuarioHint');

    if (selectedType === 'estudiante') {
        studentFields.forEach(field => field.style.display = 'block');
        adminFields.forEach(field => field.style.display = 'none');
        roleSelection.style.display = 'none';
        createButton.textContent = 'Crear Estudiante';
        // Cambiar placeholder para estudiantes
        usuarioInput.placeholder = 'nombre.usuario';
        usuarioInput.type = 'text';
        if (usuarioLabel) usuarioLabel.textContent = 'Nombre de Usuario *';
        if (usuarioHint) usuarioHint.style.display = 'block';
    } else {
        studentFields.forEach(field => field.style.display = 'none');
        adminFields.forEach(field => field.style.display = 'block');
        // Solo mostrar selector de rol si el usuario actual es superusuario
        if (isSuperuser) {
            roleSelection.style.display = 'block';
            createButton.textContent = 'Crear Profesor';
        } else {
            roleSelection.style.display = 'none';
            createButton.textContent = 'Crear Profesor';
        }
        // Cambiar placeholder para profesores
        usuarioInput.placeholder = 'nombre.usuario';
        usuarioInput.type = 'text';
        if (usuarioLabel) usuarioLabel.textContent = 'Nombre de Usuario *';
        if (usuarioHint) usuarioHint.style.display = 'block';
        
        // Cargar aulas para profesores
        loadAulasForProfesorCreateForm();
    }

    // Update security code section visibility
    toggleSecurityCodeSection();
}

// Wait for Firebase
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebaseDB) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Cargar instituciones desde Firebase para los selectores
async function loadInstitucionesForSelectors() {
    try {
        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('instituciones').orderBy('nombre').get();
        institucionesDisponibles = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            institucionesDisponibles.push({
                id: doc.id,
                nombre: data.nombre,
                descripcion: data.descripcion || ''
            });
        });

        // Si no hay instituciones, usar valores por defecto
        if (institucionesDisponibles.length === 0) {
            institucionesDisponibles = [
                { id: 'default1', nombre: 'IETAC', descripcion: 'Institución Educativa Técnico Agropecuario Claret' },
                { id: 'default2', nombre: 'SEAMOSGENIOS', descripcion: 'Seamos Genios - Plataforma Educativa' }
            ];
        }

        // Poblar los selectores
        populateInstitucionSelectors();

    } catch (error) {
        console.error('Error loading instituciones for selectors:', error);
        // Usar valores por defecto en caso de error
        institucionesDisponibles = [
            { id: 'default1', nombre: 'IETAC', descripcion: 'Institución Educativa Técnico Agropecuario Claret' },
            { id: 'default2', nombre: 'SEAMOSGENIOS', descripcion: 'Seamos Genios - Plataforma Educativa' }
        ];
        populateInstitucionSelectors();
    }
}

// Poblar los selectores de institución
function populateInstitucionSelectors() {
    const createInstitucionSelect = document.getElementById('createInstitucion');
    const editInstitucionSelect = document.getElementById('editInstitucion');

    const optionsHTML = institucionesDisponibles.map(inst =>
        `<option value="${inst.nombre}">${inst.nombre}</option>`
    ).join('');

    if (createInstitucionSelect) {
        createInstitucionSelect.innerHTML = '<option value="">Seleccione Institución</option>' + optionsHTML;
    }

    if (editInstitucionSelect) {
        editInstitucionSelect.innerHTML = '<option value="">Seleccione Institución</option>' + optionsHTML;
    }
}

// Initialize Dashboard Menu
function initializeDashboardMenu() {
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');

    dashboardTabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const view = this.getAttribute('data-view');
            switchDashboardView(view);
        });
    });
}

// Switch Dashboard View - Updated for insignias management
// (Implementation moved to INSIGNIAS MANAGEMENT SYSTEM section below)

// Filter users by dashboard view
function filterUsersByDashboardView() {
    let baseUsers = [...allUsers];

    // Check if user is filtering by coordinador type in the dropdown
    const typeFilter = elements.userTypeFilter ? elements.userTypeFilter.value : '';
    const isFilteringCoordinadores = typeFilter === 'coordinador';

    // Apply dashboard view filter
    switch (currentDashboardView) {
        case 'profesores':
            baseUsers = baseUsers.filter(user =>
                (user.tipoUsuario === 'admin' || user.rol === 'admin') &&
                user.rol !== 'superusuario' &&
                user.rol !== 'coordinador'
            );
            break;
        case 'estudiantes':
            baseUsers = baseUsers.filter(user => user.tipoUsuario === 'estudiante');
            break;
        case 'superusuarios':
            baseUsers = baseUsers.filter(user => user.rol === 'superusuario');
            break;
        case 'coordinadores':
            // Coordinadores are handled in their own section, return empty for table
            baseUsers = [];
            break;
        case 'codigos':
            // Show all users for recovery codes view
            break;
        case 'insignias':
            // Show only students for insignias view
            baseUsers = baseUsers.filter(user => user.tipoUsuario === 'estudiante');
            break;
        case 'dashboard':
        default:
            // Show all users - if filtering by coordinador, include them; otherwise exclude
            if (!isFilteringCoordinadores) {
                baseUsers = baseUsers.filter(user => user.rol !== 'coordinador');
            }
            break;
    }

    // Apply existing filters (search, type, status, institucion)
    filteredUsers = baseUsers.filter(user => {
        const searchTerm = elements.searchInput.value.toLowerCase();
        const typeFilter = elements.userTypeFilter.value;
        const statusFilter = elements.statusFilter.value;
        const institucionFilter = elements.institucionFilter.value;

        // Search filter
        const matchesSearch = !searchTerm ||
            user.nombre?.toLowerCase().includes(searchTerm) ||
            user.usuario?.toLowerCase().includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm) ||
            user.telefono?.includes(searchTerm) ||
            user.institucion?.toLowerCase().includes(searchTerm);

        // Type filter
        const matchesType = !typeFilter ||
            (typeFilter === 'superusuario' && user.rol === 'superusuario') ||
            (typeFilter === 'admin' && user.tipoUsuario === 'admin' && user.rol !== 'superusuario' && user.rol !== 'coordinador') ||
            (typeFilter === 'estudiante' && user.tipoUsuario === 'estudiante') ||
            (typeFilter === 'coordinador' && user.rol === 'coordinador');

        // Status filter
        const matchesStatus = !statusFilter || user.activo.toString() === statusFilter;

        // Institucion filter (funciona para todos los usuarios que tengan institución)
        const matchesInstitucion = !institucionFilter || user.institucion === institucionFilter;

        return matchesSearch && matchesType && matchesStatus && matchesInstitucion;
    });

    updateStats();
    renderUsers();
}

// Populate institucion filter
function populateInstitucionFilter() {
    const instituciones = new Set();

    // Get all unique instituciones from students
    allUsers.forEach(user => {
        if (user.tipoUsuario === 'estudiante' && user.institucion && user.institucion.trim()) {
            instituciones.add(user.institucion.trim());
        }
    });

    // Sort instituciones alphabetically
    const sortedInstituciones = Array.from(instituciones).sort();

    // Clear and populate the filter
    elements.institucionFilter.innerHTML = '<option value="">Todas las instituciones</option>';

    sortedInstituciones.forEach(institucion => {
        const option = document.createElement('option');
        option.value = institucion;
        option.textContent = institucion;
        elements.institucionFilter.appendChild(option);
    });

    // Show/hide institucion filter based on current view
    updateInstitucionFilterVisibility();
}

// Update institucion filter visibility based on dashboard view
function updateInstitucionFilterVisibility() {
    // Mostrar el filtro de institución en todas las vistas principales de usuarios
    const shouldShowInstitucionFilter = currentDashboardView === 'estudiantes' ||
        currentDashboardView === 'dashboard' ||
        currentDashboardView === 'profesores' ||
        currentDashboardView === 'superusuarios' ||
        currentDashboardView === 'codigos' ||
        currentDashboardView === 'insignias';

    if (shouldShowInstitucionFilter && elements.institucionFilter) {
        elements.institucionFilter.style.display = '';
    } else if (elements.institucionFilter) {
        elements.institucionFilter.style.display = 'none';
        elements.institucionFilter.value = ''; // Reset filter when hidden
    }
}

// Update dashboard title and stats based on view
function updateDashboardTitle(view) {
    const tableHeader = document.querySelector('.table-header h2');
    const createUserBtn = document.getElementById('createUserBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const manageInsigniasBtn = document.getElementById('manageInsigniasBtn');

    // Control button visibility based on view
    const isInsigniasView = view === 'insignias';

    // Show/hide buttons
    if (createUserBtn) {
        if (isInsigniasView) {
            createUserBtn.classList.add('hide-in-insignias');
        } else {
            createUserBtn.classList.remove('hide-in-insignias');
        }
    }

    if (refreshBtn) {
        if (isInsigniasView) {
            refreshBtn.classList.add('hide-in-insignias');
        } else {
            refreshBtn.classList.remove('hide-in-insignias');
        }
    }

    if (manageInsigniasBtn) {
        if (isInsigniasView) {
            manageInsigniasBtn.classList.add('show');
        } else {
            manageInsigniasBtn.classList.remove('show');
        }
    }

    switch (view) {
        case 'profesores':
            tableHeader.textContent = 'Lista de Profesores';
            if (createUserBtn) createUserBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Crear Profesor';
            break;
        case 'estudiantes':
            tableHeader.textContent = 'Lista de Estudiantes';
            if (createUserBtn) createUserBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Crear Estudiante';
            break;
        case 'superusuarios':
            tableHeader.textContent = 'Lista de Super Usuarios';
            if (createUserBtn) createUserBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Crear Super Usuario';
            break;
        case 'codigos':
            tableHeader.textContent = 'Códigos de Recuperación';
            if (createUserBtn) createUserBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Crear Usuario';
            break;
        case 'insignias':
            tableHeader.textContent = 'Insignias y Gamificación';
            if (createUserBtn) createUserBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Crear Usuario';
            break;
        case 'coordinadores':
            // Coordinadores have their own section, no need to update main table header
            break;
        case 'instituciones':
            // Instituciones have their own section, no need to update main table header
            break;
        case 'dashboard':
        default:
            tableHeader.textContent = 'Lista de Usuarios';
            if (createUserBtn) createUserBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Crear Usuario';
            break;
    }

    // Update column visibility based on view (skip for views with their own sections)
    if (view !== 'coordinadores' && view !== 'instituciones') {
        updateColumnVisibility(view);
    }
}

// Update column visibility based on dashboard view
function updateColumnVisibility(view) {
    // Skip column visibility update for views that don't use the main users table
    if (view === 'coordinadores' || view === 'instituciones') {
        return;
    }

    const table = document.getElementById('usersTable');
    if (!table) return;

    // All column selectors - use more specific selectors (actualizado con nueva columna Nombre Aulas)
    const rolColumn = table.querySelector('thead th:nth-child(3)'); // Rol column
    const estadoColumn = table.querySelector('thead th:nth-child(4)'); // Estado column
    const puntosColumn = table.querySelector('thead th:nth-child(5)'); // Puntos column
    const insigniasColumn = table.querySelector('thead th:nth-child(6)'); // Insignias column
    const aulasColumn = table.querySelector('thead th:nth-child(7)'); // Aulas Asignadas column
    const nombreAulasColumn = table.querySelector('thead th:nth-child(8)'); // Nombre Aulas column (NUEVA)
    const telefonoColumn = table.querySelector('thead th:nth-child(9)'); // Teléfono column
    const documentoColumn = table.querySelector('thead th:nth-child(10)'); // Documento column
    const institucionColumn = table.querySelector('thead th:nth-child(11)'); // Institución column
    const gradoColumn = table.querySelector('thead th:nth-child(12)'); // Grado column
    const departamentoColumn = table.querySelector('thead th:nth-child(13)'); // Departamento column
    const emailRecuperacionColumn = table.querySelector('thead th:nth-child(14)'); // Email Recuperación column
    const codigoRecuperacionColumn = table.querySelector('thead th:nth-child(15)'); // Código Recuperación column
    const fechaColumn = table.querySelector('thead th:nth-child(16)'); // Fecha Registro column
    const accionesColumn = table.querySelector('thead th:nth-child(17)'); // Acciones column

    // Hide gamification columns for profesores and superusuarios only (NOT for estudiantes - they need to see their coins and badges)
    const shouldHideGamification = view === 'profesores' || view === 'superusuarios';

    // Hide student-specific columns for profesores and superusuarios
    const shouldHideStudentColumns = view === 'profesores' || view === 'superusuarios';

    // Recovery codes view - show only essential columns
    const isRecoveryView = view === 'codigos';

    // Insignias view - show only gamification columns
    const isInsigniasView = view === 'insignias';

    console.log(`Updating column visibility for view: ${view}, hide gamification: ${shouldHideGamification}, hide student columns: ${shouldHideStudentColumns}, recovery view: ${isRecoveryView}, insignias view: ${isInsigniasView}`);

    // Add/remove class for responsive adjustments
    if (table) {
        if (shouldHideGamification) {
            table.classList.add('hide-gamification');
        } else {
            table.classList.remove('hide-gamification');
        }

        if (shouldHideStudentColumns) {
            table.classList.add('hide-student-columns');
        } else {
            table.classList.remove('hide-student-columns');
        }

        if (isRecoveryView) {
            table.classList.add('recovery-view');
        } else {
            table.classList.remove('recovery-view');
        }

        if (isInsigniasView) {
            table.classList.add('insignias-view');
        } else {
            table.classList.remove('insignias-view');
        }
    }

    // Recovery view - hide all columns except Name, Usuario, Rol, Email Recuperación, Código Recuperación, Acciones
    if (isRecoveryView) {
        // Hide most columns for recovery view, but keep Rol visible
        if (rolColumn) rolColumn.style.display = ''; // Show Rol column
        if (estadoColumn) estadoColumn.style.display = 'none';
        if (puntosColumn) puntosColumn.style.display = 'none';
        if (insigniasColumn) insigniasColumn.style.display = 'none';
        if (aulasColumn) aulasColumn.style.display = 'none';
        if (nombreAulasColumn) nombreAulasColumn.style.display = 'none';
        if (telefonoColumn) telefonoColumn.style.display = 'none';
        if (documentoColumn) documentoColumn.style.display = 'none';
        if (institucionColumn) institucionColumn.style.display = 'none';
        if (gradoColumn) gradoColumn.style.display = 'none';
        if (departamentoColumn) departamentoColumn.style.display = 'none';
        if (fechaColumn) fechaColumn.style.display = 'none';
        // Show recovery columns in recovery view
        if (emailRecuperacionColumn) emailRecuperacionColumn.style.display = '';
        if (codigoRecuperacionColumn) codigoRecuperacionColumn.style.display = '';
        // Keep actions column visible for copy and reset password buttons
        if (accionesColumn) accionesColumn.style.display = '';
    } else if (isInsigniasView) {
        // Insignias view - hide all columns except Name, Usuario, Puntos, Insignias
        if (rolColumn) rolColumn.style.display = 'none';
        if (estadoColumn) estadoColumn.style.display = 'none';
        if (puntosColumn) puntosColumn.style.display = ''; // Show Puntos column
        if (insigniasColumn) insigniasColumn.style.display = ''; // Show Insignias column
        if (aulasColumn) aulasColumn.style.display = 'none';
        if (nombreAulasColumn) nombreAulasColumn.style.display = 'none';
        if (telefonoColumn) telefonoColumn.style.display = 'none';
        if (documentoColumn) documentoColumn.style.display = 'none';
        if (institucionColumn) institucionColumn.style.display = 'none';
        if (gradoColumn) gradoColumn.style.display = 'none';
        if (departamentoColumn) departamentoColumn.style.display = 'none';
        if (fechaColumn) fechaColumn.style.display = 'none';
        if (accionesColumn) accionesColumn.style.display = 'none';
        // Hide recovery columns in insignias view
        if (emailRecuperacionColumn) emailRecuperacionColumn.style.display = 'none';
        if (codigoRecuperacionColumn) codigoRecuperacionColumn.style.display = 'none';
    } else {
        // Show all columns for other views, then apply specific hiding rules
        if (rolColumn) rolColumn.style.display = '';
        if (estadoColumn) estadoColumn.style.display = '';
        if (aulasColumn) aulasColumn.style.display = '';
        if (nombreAulasColumn) nombreAulasColumn.style.display = '';
        if (telefonoColumn) telefonoColumn.style.display = '';
        if (fechaColumn) fechaColumn.style.display = '';
        if (accionesColumn) accionesColumn.style.display = '';
        // Hide recovery columns in non-recovery views
        if (emailRecuperacionColumn) emailRecuperacionColumn.style.display = 'none';
        if (codigoRecuperacionColumn) codigoRecuperacionColumn.style.display = 'none';

        // Apply specific hiding rules for other views
        // Hide/show gamification columns
        if (puntosColumn) {
            puntosColumn.style.display = shouldHideGamification ? 'none' : '';
        }
        if (insigniasColumn) {
            insigniasColumn.style.display = shouldHideGamification ? 'none' : '';
        }

        // Hide/show student-specific columns
        if (documentoColumn) {
            documentoColumn.style.display = shouldHideStudentColumns ? 'none' : '';
        }
        if (institucionColumn) {
            institucionColumn.style.display = shouldHideStudentColumns ? 'none' : '';
        }
        if (gradoColumn) {
            gradoColumn.style.display = shouldHideStudentColumns ? 'none' : '';
        }
        if (departamentoColumn) {
            departamentoColumn.style.display = shouldHideStudentColumns ? 'none' : '';
        }
    }

    // Update all table rows in the users table specifically
    const tableRows = table.querySelectorAll('tbody tr');
    tableRows.forEach(row => {
        // All cell selectors (actualizado con nueva columna Nombre Aulas)
        const cells = row.querySelectorAll('td');
        if (cells.length < 17) return; // Skip if row doesn't have all cells (ahora son 17)

        const rolCell = cells[2]; // 3rd column (index 2)
        const estadoCell = cells[3]; // 4th column
        const puntosCell = cells[4]; // 5th column
        const insigniasCell = cells[5]; // 6th column
        const aulasCell = cells[6]; // 7th column - Aulas Asignadas
        const nombreAulasCell = cells[7]; // 8th column - Nombre Aulas (NUEVA)
        const telefonoCell = cells[8]; // 9th column
        const documentoCell = cells[9]; // 10th column
        const institucionCell = cells[10]; // 11th column
        const gradoCell = cells[11]; // 12th column
        const departamentoCell = cells[12]; // 13th column
        const emailRecuperacionCell = cells[13]; // 14th column
        const codigoRecuperacionCell = cells[14]; // 15th column
        const fechaCell = cells[15]; // 16th column
        const accionesCell = cells[16]; // 17th column

        if (isRecoveryView) {
            // Hide most cells for recovery view, but keep Rol visible
            if (rolCell) rolCell.style.display = ''; // Show Rol cell
            if (estadoCell) estadoCell.style.display = 'none';
            if (puntosCell) puntosCell.style.display = 'none';
            if (insigniasCell) insigniasCell.style.display = 'none';
            if (aulasCell) aulasCell.style.display = 'none';
            if (nombreAulasCell) nombreAulasCell.style.display = 'none';
            if (telefonoCell) telefonoCell.style.display = 'none';
            if (documentoCell) documentoCell.style.display = 'none';
            if (institucionCell) institucionCell.style.display = 'none';
            if (gradoCell) gradoCell.style.display = 'none';
            if (departamentoCell) departamentoCell.style.display = 'none';
            if (fechaCell) fechaCell.style.display = 'none';
            // Show recovery cells in recovery view
            if (emailRecuperacionCell) emailRecuperacionCell.style.display = '';
            if (codigoRecuperacionCell) codigoRecuperacionCell.style.display = '';
            // Keep actions cell visible for copy and reset password buttons
            if (accionesCell) accionesCell.style.display = '';
        } else if (isInsigniasView) {
            // Hide most cells for insignias view, show only gamification data
            if (rolCell) rolCell.style.display = 'none';
            if (estadoCell) estadoCell.style.display = 'none';
            if (puntosCell) puntosCell.style.display = ''; // Show Puntos cell
            if (insigniasCell) insigniasCell.style.display = ''; // Show Insignias cell
            if (aulasCell) aulasCell.style.display = 'none';
            if (nombreAulasCell) nombreAulasCell.style.display = 'none';
            if (telefonoCell) telefonoCell.style.display = 'none';
            if (documentoCell) documentoCell.style.display = 'none';
            if (institucionCell) institucionCell.style.display = 'none';
            if (gradoCell) gradoCell.style.display = 'none';
            if (departamentoCell) departamentoCell.style.display = 'none';
            if (fechaCell) fechaCell.style.display = 'none';
            if (accionesCell) accionesCell.style.display = 'none';
            // Hide recovery cells in insignias view
            if (emailRecuperacionCell) emailRecuperacionCell.style.display = 'none';
            if (codigoRecuperacionCell) codigoRecuperacionCell.style.display = 'none';
        } else {
            // Show all cells for other views, then apply specific hiding rules
            if (rolCell) rolCell.style.display = '';
            if (estadoCell) estadoCell.style.display = '';
            if (aulasCell) aulasCell.style.display = '';
            if (nombreAulasCell) nombreAulasCell.style.display = '';
            if (telefonoCell) telefonoCell.style.display = '';
            if (fechaCell) fechaCell.style.display = '';
            if (accionesCell) accionesCell.style.display = '';
            // Hide recovery cells in non-recovery views
            if (emailRecuperacionCell) emailRecuperacionCell.style.display = 'none';
            if (codigoRecuperacionCell) codigoRecuperacionCell.style.display = 'none';

            // Apply specific hiding rules for other views
            // Hide/show gamification cells
            if (puntosCell) {
                puntosCell.style.display = shouldHideGamification ? 'none' : '';
            }
            if (insigniasCell) {
                insigniasCell.style.display = shouldHideGamification ? 'none' : '';
            }

            // Hide/show student-specific cells
            if (documentoCell) {
                documentoCell.style.display = shouldHideStudentColumns ? 'none' : '';
            }
            if (institucionCell) {
                institucionCell.style.display = shouldHideStudentColumns ? 'none' : '';
            }
            if (gradoCell) {
                gradoCell.style.display = shouldHideStudentColumns ? 'none' : '';
            }
            if (departamentoCell) {
                departamentoCell.style.display = shouldHideStudentColumns ? 'none' : '';
            }
        }
    });
}

// Load users from Firestore
async function loadUsers() {
    try {
        showLoading(true);
        await waitForFirebase();

        // Cargar cache de nombres de aulas primero
        await loadAulasNombresCache();

        const usersSnapshot = await window.firebaseDB.collection('usuarios').get();

        allUsers = [];
        usersSnapshot.forEach(doc => {
            allUsers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by creation date (newest first)
        allUsers.sort((a, b) => {
            const dateA = a.fechaCreacion ? a.fechaCreacion.toDate() : new Date(0);
            const dateB = b.fechaCreacion ? b.fechaCreacion.toDate() : new Date(0);
            return dateB - dateA;
        });

        // Populate institucion filter
        populateInstitucionFilter();

        // Apply current filters instead of resetting
        filterUsersByDashboardView();
        // Set initial column visibility
        updateColumnVisibility(currentDashboardView);
        showLoading(false);

    } catch (error) {
        console.error('Error loading users:', error);
        showMessage('Error al cargar usuarios', 'error');
        showLoading(false);
    }
}

// Update statistics
function updateStats() {
    // Use filtered users for current view statistics
    const currentUsers = filteredUsers.length > 0 ? filteredUsers : allUsers;

    const totalUsersCount = currentUsers.length;
    const totalAdminsCount = currentUsers.filter(user =>
        (user.tipoUsuario === 'admin' || user.rol === 'admin') &&
        user.rol !== 'superusuario' &&
        user.rol !== 'coordinador'
    ).length;
    const totalStudentsCount = currentUsers.filter(user => user.tipoUsuario === 'estudiante').length;
    const totalSuperusersCount = currentUsers.filter(user => user.rol === 'superusuario').length;
    const totalCoordinadoresCount = allUsers.filter(user => user.rol === 'coordinador').length;
    const activeUsersCount = currentUsers.filter(user => user.activo === true).length;

    // Get coordinadores element
    const totalCoordinadoresEl = document.getElementById('totalCoordinadores');

    // Update stats based on current dashboard view
    switch (currentDashboardView) {
        case 'profesores':
            elements.totalUsers.textContent = totalAdminsCount;
            elements.totalAdmins.textContent = totalAdminsCount;
            elements.totalSuperusers.textContent = '0';
            elements.totalStudents.textContent = '0';
            elements.activeUsers.textContent = currentUsers.filter(user => user.activo === true).length;
            if (totalCoordinadoresEl) totalCoordinadoresEl.textContent = '0';
            break;
        case 'estudiantes':
            elements.totalUsers.textContent = totalStudentsCount;
            elements.totalAdmins.textContent = '0';
            elements.totalSuperusers.textContent = '0';
            elements.totalStudents.textContent = totalStudentsCount;
            elements.activeUsers.textContent = currentUsers.filter(user => user.activo === true).length;
            if (totalCoordinadoresEl) totalCoordinadoresEl.textContent = '0';
            break;
        case 'superusuarios':
            elements.totalUsers.textContent = totalSuperusersCount;
            elements.totalAdmins.textContent = '0';
            elements.totalSuperusers.textContent = totalSuperusersCount;
            elements.totalStudents.textContent = '0';
            elements.activeUsers.textContent = currentUsers.filter(user => user.activo === true).length;
            if (totalCoordinadoresEl) totalCoordinadoresEl.textContent = '0';
            break;
        case 'coordinadores':
            elements.totalUsers.textContent = totalCoordinadoresCount;
            elements.totalAdmins.textContent = '0';
            elements.totalSuperusers.textContent = '0';
            elements.totalStudents.textContent = '0';
            elements.activeUsers.textContent = allUsers.filter(user => user.rol === 'coordinador' && user.activo === true).length;
            if (totalCoordinadoresEl) totalCoordinadoresEl.textContent = totalCoordinadoresCount;
            break;
        case 'dashboard':
        default:
            // Show global statistics
            const globalTotalAdmins = allUsers.filter(user =>
                (user.tipoUsuario === 'admin' || user.rol === 'admin') &&
                user.rol !== 'superusuario' &&
                user.rol !== 'coordinador'
            ).length;
            const globalTotalSuperusers = allUsers.filter(user => user.rol === 'superusuario').length;
            const globalTotalStudents = allUsers.filter(user => user.tipoUsuario === 'estudiante').length;
            const globalTotalCoordinadores = allUsers.filter(user => user.rol === 'coordinador').length;
            const globalActiveUsers = allUsers.filter(user => user.activo === true).length;

            elements.totalUsers.textContent = allUsers.length;
            elements.totalAdmins.textContent = globalTotalAdmins;
            elements.totalSuperusers.textContent = globalTotalSuperusers;
            elements.totalStudents.textContent = globalTotalStudents;
            elements.activeUsers.textContent = globalActiveUsers;
            if (totalCoordinadoresEl) totalCoordinadoresEl.textContent = globalTotalCoordinadores;
            break;
    }
}

// Render users table
function renderUsers() {
    if (filteredUsers.length === 0) {
        elements.usersTableBody.innerHTML = '';
        elements.noResults.style.display = 'block';
        return;
    }

    elements.noResults.style.display = 'none';

    const tbody = elements.usersTableBody;
    tbody.innerHTML = '';

    const isSuperuser = window.currentUserRole === 'superusuario';
    const currentUserId = JSON.parse(sessionStorage.getItem('currentUser') || '{}').id;

    filteredUsers.forEach(user => {
        const row = document.createElement('tr');

        // Add inactive class if user is not active
        if (!user.activo) {
            row.classList.add('inactive');
        }

        // Format date
        const creationDate = user.fechaCreacion ?
            user.fechaCreacion.toDate().toLocaleDateString('es-ES') :
            'No disponible';

        // Determinar el badge del usuario
        let userBadge = 'EST';
        let badgeClass = 'estudiante';
        if (user.tipoUsuario === 'admin' || user.rol === 'admin' || user.rol === 'superusuario' || user.rol === 'coordinador') {
            if (user.rol === 'superusuario') {
                userBadge = 'SUPER';
                badgeClass = 'superusuario';
            } else if (user.rol === 'coordinador') {
                userBadge = 'COORD';
                badgeClass = 'coordinador';
            } else {
                userBadge = 'PROF';
                badgeClass = 'admin';
            }
        }

        // Verificar si el usuario actual puede editar este usuario
        const canEdit = isSuperuser ||
            (user.tipoUsuario === 'estudiante') ||
            (user.id === currentUserId);

        row.innerHTML = `
            <td>
                <div class="user-name-with-photo">
                    <div class="table-user-avatar" onclick="openUserProfileModal('${user.id}')" title="Ver perfil completo">
                        ${user.fotoPerfil ?
                `<img src="${user.fotoPerfil}" alt="${user.nombre}" class="table-avatar-image">` :
                `<div class="table-avatar-default">
                                <i class="bi bi-person-fill"></i>
                            </div>`
            }
                    </div>
                    <span class="user-name-text">${user.nombre || 'No especificado'}</span>
                </div>
            </td>
            <td>
                <div class="user-email">
                    <strong>${user.usuario || user.email}</strong>
                </div>
            </td>
            <td>
                <span class="user-type-badge ${badgeClass}" title="${user.rol === 'superusuario' ? 'Superusuario - Acceso Total' : user.tipoUsuario === 'admin' ? 'Profesor' : 'Estudiante'}">
                    ${userBadge}
                </span>
            </td>
            <td>
                <span class="status-badge ${user.activo ? 'active' : 'inactive'}">
                    ${user.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' ?
                `<div class="monedas-cell-simple">
                        <strong>${user.puntos || user.puntosAcumulados || 0}</strong>
                    </div>` : 'N/A'}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' ?
                `<div class="insignias-cell-simple" onclick="verInsigniasUsuario('${user.id}', '${user.nombre}')" title="Click para ver insignias">
                        <span class="insignias-count-badge"><i class="bi bi-award-fill"></i> ${user.insignias && user.insignias.length > 0 ? user.insignias.length : 0}</span>
                    </div>` : 'N/A'}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' && user.aulasAsignadas && user.aulasAsignadas.length > 0 ?
                `<div class="aulas-cell" data-aulas='${JSON.stringify(user.aulasAsignadas)}'>
                        <span class="aulas-count-badge"><i class="bi bi-door-open"></i> ${user.aulasAsignadas.length} aula${user.aulasAsignadas.length > 1 ? 's' : ''}</span>
                    </div>` :
                (user.tipoUsuario === 'estudiante' ? '<span class="text-muted">Sin aulas</span>' :
                    (user.tipoUsuario === 'admin' && user.aulasAsignadas && user.aulasAsignadas.length > 0 ?
                        `<div class="aulas-cell">
                            <span class="aulas-count-badge" title="${user.aulasAsignadas.map(a => typeof a === 'object' ? a.aulaId : a).join(', ')}">
                                <i class="bi bi-door-open"></i> ${user.aulasAsignadas.length} aula${user.aulasAsignadas.length > 1 ? 's' : ''}
                            </span>
                        </div>` :
                        (user.tipoUsuario === 'admin' ? '<span class="text-muted">Sin aulas</span>' : 'N/A')))}
            </td>
            <td>
                ${(() => {
                    if ((user.tipoUsuario === 'estudiante' || user.tipoUsuario === 'admin') && user.aulasAsignadas && user.aulasAsignadas.length > 0) {
                        return `<button class="ver-aulas-btn" onclick="mostrarAulasUsuario('${user.id}', '${user.nombre}')" title="Ver aulas asignadas">
                            <i class="bi bi-eye"></i> Ver Aulas
                        </button>`;
                    } else if (user.tipoUsuario === 'estudiante' || user.tipoUsuario === 'admin') {
                        return '<span class="text-muted">-</span>';
                    }
                    return 'N/A';
                })()}
            </td>
            <td>
                ${user.telefono ?
                `<div class="phone-cell">
                        <span class="phone-number" onclick="copyPhone('${user.telefono}')" title="Click para copiar teléfono">${user.telefono}</span>
                        <button class="whatsapp-btn" onclick="openWhatsApp('${user.telefono}')" title="Abrir WhatsApp">
                            <i class="bi bi-whatsapp"></i>
                        </button>
                    </div>` :
                'No especificado'}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' ?
                `<div class="document-inline">
                        ${user.tipoDocumento || 'N/A'} ${user.numeroDocumento || 'N/A'}
                    </div>` : 'N/A'}
            </td>
            <td>
                ${(user.tipoUsuario === 'estudiante' || user.rol === 'coordinador') ? (user.institucion || 'No especificada') : 'N/A'}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' ? (user.grado || 'No especificado') : 'N/A'}
            </td>
            <td>
                ${(user.tipoUsuario === 'estudiante' || user.rol === 'coordinador') ? (user.departamento || 'No especificado') : 'N/A'}
            </td>
            <td>
                ${user.emailRecuperacion ?
                `<div class="recovery-email-cell">
                        <span class="recovery-email-text" onclick="copyRecoveryEmail('${user.emailRecuperacion}')" title="Click para copiar email">${user.emailRecuperacion}</span>
                        <button class="gmail-btn" onclick="openGmail('${user.emailRecuperacion}', '${user.codigoRecuperacion || ''}')" title="Enviar por Gmail">
                            <i class="bi bi-envelope-fill"></i>
                        </button>
                    </div>` :
                'No especificado'}
            </td>
            <td>
                ${user.codigoRecuperacion ?
                `<div class="recovery-code-cell">
                        <strong class="recovery-code-text" onclick="copyRecoveryCode('${user.codigoRecuperacion}')" title="Click para copiar código">${user.codigoRecuperacion}</strong>
                        ${user.telefono ?
                    `<button class="whatsapp-code-btn" onclick="sendCodeWhatsApp('${user.telefono}', '${user.codigoRecuperacion}')" title="Enviar por WhatsApp">
                                <i class="bi bi-whatsapp"></i>
                            </button>` :
                    ''}
                    </div>` :
                'No disponible'}
            </td>
            <td>
                ${creationDate}
            </td>
            <td>
                <div class="action-buttons">
                    ${currentDashboardView === 'codigos' ? `
                        <!-- Recovery view actions -->
                        <button class="action-btn copy-code-btn" 
                                onclick="copyRecoveryCode('${user.codigoRecuperacion || ''}')"
                                title="Copiar código de recuperación">
                            <i class="bi bi-clipboard"></i>
                        </button>
                        <button class="action-btn copy-email-btn" 
                                onclick="copyRecoveryEmail('${user.emailRecuperacion || ''}')"
                                title="Copiar email de recuperación">
                            <i class="bi bi-envelope"></i>
                        </button>
                        ${canEdit ? `
                            <button class="action-btn reset-password-btn" 
                                    onclick="openResetPasswordModal('${user.id}')"
                                    title="Restablecer contraseña">
                                <i class="bi bi-key"></i>
                            </button>
                        ` : ''}
                    ` : `
                        <!-- Normal view actions -->
                        ${canEdit ? `
                            <button class="action-btn edit-user-btn" 
                                    onclick="openEditUserModal('${user.id}')"
                                    title="Editar usuario">
                                <i class="bi bi-pencil-square"></i>
                            </button>
                            <button class="action-btn reset-password-btn" 
                                    onclick="openResetPasswordModal('${user.id}')"
                                    title="Restablecer contraseña">
                                <i class="bi bi-key"></i>
                            </button>
                            <button class="action-btn toggle-status-btn ${user.activo ? 'deactivate' : ''}" 
                                    onclick="toggleUserStatus('${user.id}', ${user.activo})"
                                    title="${user.activo ? 'Desactivar usuario' : 'Activar usuario'}">
                                <i class="bi bi-${user.activo ? 'person-x' : 'person-check'}"></i>
                            </button>
                        ` : `
                            <span class="no-permission-badge" title="No tienes permisos para editar este usuario">
                                <i class="bi bi-lock-fill"></i> Sin permisos
                            </span>
                        `}
                    `}
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });

    // Update column visibility after rendering
    updateColumnVisibility(currentDashboardView);

    // Load insignia icons from Firebase
    loadInsigniaIconsInTable();
}

// Handle search
function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    applyFilters(searchTerm);
}

// Handle filters
function handleFilter() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    applyFilters(searchTerm);
}

// Apply filters
function applyFilters(searchTerm = '') {
    // Use the dashboard view filter function instead
    filterUsersByDashboardView();
}

// Open create user modal
function openCreateUserModal() {
    // Clear form
    elements.createUserForm.reset();

    // Set user type based on current dashboard view
    const estudianteRadio = document.querySelector('input[name="tipoUsuario"][value="estudiante"]');
    const adminRadio = document.querySelector('input[name="tipoUsuario"][value="admin"]');
    const userTypeSelection = document.querySelector('.user-type-selection');

    if (currentDashboardView === 'profesores' || currentDashboardView === 'superusuarios') {
        // In professors/superusers section, only allow creating admins
        adminRadio.checked = true;
        estudianteRadio.disabled = true;
        adminRadio.disabled = false;

        // Update modal title
        document.querySelector('#createUserModal .modal-header h3').textContent = 'Crear Nuevo Profesor';

        // Hide user type selection since it's forced
        userTypeSelection.style.display = 'none';

    } else if (currentDashboardView === 'estudiantes') {
        // In students section, only allow creating students
        estudianteRadio.checked = true;
        estudianteRadio.disabled = false;
        adminRadio.disabled = true;

        // Update modal title
        document.querySelector('#createUserModal .modal-header h3').textContent = 'Crear Nuevo Estudiante';

        // Hide user type selection since it's forced
        userTypeSelection.style.display = 'none';

    } else {
        // In dashboard or other sections, allow both
        estudianteRadio.checked = true;
        estudianteRadio.disabled = false;
        adminRadio.disabled = false;

        // Update modal title
        document.querySelector('#createUserModal .modal-header h3').textContent = 'Crear Nuevo Usuario';

        // Show user type selection
        userTypeSelection.style.display = 'block';
    }

    // Load aulas for the create form
    loadAulasForCreateForm();

    handleUserTypeChange();
    elements.createUserModal.classList.add('show');
}

// Close create user modal
function closeCreateUserModal() {
    elements.createUserModal.classList.remove('show');
}

// Toggle security code section based on role selection
function toggleSecurityCodeSection() {
    const selectedType = document.querySelector('input[name="tipoUsuario"]:checked');
    const superuserRadio = document.querySelector('input[name="rolUsuario"][value="superusuario"]');
    const securityCodeSection = elements.securityCodeSectionCreate;
    const adminFields = document.querySelectorAll('#createUserModal .admin-fields');

    // Solo procesar si el tipo de usuario es admin/profesor
    if (!selectedType || selectedType.value !== 'admin') {
        // Si es estudiante, ocultar todo lo relacionado con admin
        if (securityCodeSection) securityCodeSection.style.display = 'none';
        if (elements.createSecurityCode) elements.createSecurityCode.value = '';
        return;
    }

    if (superuserRadio && superuserRadio.checked) {
        // Show security code section for superusers
        securityCodeSection.style.display = 'block';

        // Hide aulas/materias selection for superusers (they have access to all)
        adminFields.forEach(field => {
            const h4 = field.querySelector('h4');
            if (h4 && (h4.textContent.includes('Aulas') || h4.textContent.includes('Asignaturas'))) {
                field.style.display = 'none';
            }
        });
    } else {
        // Hide security code section for regular admins
        securityCodeSection.style.display = 'none';

        // Show aulas/materias selection for regular admins/professors
        adminFields.forEach(field => {
            const h4 = field.querySelector('h4');
            if (h4 && (h4.textContent.includes('Aulas') || h4.textContent.includes('Asignaturas'))) {
                field.style.display = 'block';
            }
        });

        // Clear the security code when hiding
        if (elements.createSecurityCode) {
            elements.createSecurityCode.value = '';
        }
    }
}

// Toggle subject section visibility in edit modal based on role
function toggleSubjectSectionEdit() {
    const superuserRadio = document.querySelector('input[name="rolUsuarioEdit"][value="superusuario"]');
    const adminEditFields = document.querySelectorAll('.admin-edit-fields');

    if (superuserRadio && superuserRadio.checked) {
        // Hide aulas/materias selection for superusers (they have access to all)
        adminEditFields.forEach(field => {
            const h4 = field.querySelector('h4');
            if (h4 && (h4.textContent.includes('Aulas') || h4.textContent.includes('Asignaturas'))) {
                field.style.display = 'none';
            }
        });
    } else {
        // Show aulas/materias selection for regular admins/professors
        adminEditFields.forEach(field => {
            const h4 = field.querySelector('h4');
            if (h4 && (h4.textContent.includes('Aulas') || h4.textContent.includes('Asignaturas'))) {
                field.style.display = 'block';
            }
        });
    }
}

// Clean username field - remove @ and domain parts
function cleanUsernameField(field) {
    let value = field.value;

    // Remove @ and everything after it
    if (value.includes('@')) {
        value = value.split('@')[0];
    }

    // Remove common domain parts if they somehow got through
    value = value.replace(/\.com$/i, '');
    value = value.replace(/\.org$/i, '');
    value = value.replace(/\.net$/i, '');
    value = value.replace(/\.edu$/i, '');

    // Remove any remaining @ symbols
    value = value.replace(/@/g, '');

    // Remove dots at the end
    value = value.replace(/\.+$/, '');

    // Only allow letters, numbers, dots, hyphens, and underscores
    value = value.replace(/[^a-zA-Z0-9.\-_]/g, '');

    // Update the field if the value changed
    if (field.value !== value) {
        const cursorPosition = field.selectionStart;
        field.value = value;
        // Restore cursor position (adjust if value got shorter)
        const newPosition = Math.min(cursorPosition, value.length);
        field.setSelectionRange(newPosition, newPosition);
    }
}

// Open edit user modal
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const isSuperuser = window.currentUserRole === 'superusuario';
    const currentUserId = JSON.parse(sessionStorage.getItem('currentUser') || '{}').id;

    // Verificar permisos: superusuario puede editar todo, admin solo estudiantes y su propio perfil
    if (!isSuperuser && user.tipoUsuario === 'admin' && user.id !== currentUserId) {
        showMessage('No tienes permisos para editar este administrador', 'error');
        return;
    }

    currentUserForEdit = user;

    // Fill form with user data
    elements.editNombre.value = user.nombre || '';
    // Remove @seamosgenios.com from username for editing
    let usuarioValue = user.usuario || user.email || '';
    if (usuarioValue.includes('@seamosgenios.com')) {
        usuarioValue = usuarioValue.replace('@seamosgenios.com', '');
    }
    elements.editUsuario.value = usuarioValue;
    elements.editTelefono.value = user.telefono || '';
    elements.editEmailRecuperacion.value = user.emailRecuperacion || '';

    // Set user type badge
    const isAdmin = user.tipoUsuario === 'admin' || user.rol === 'admin' || user.rol === 'superusuario';
    const isSuperuserUser = user.rol === 'superusuario';

    let badgeClass = user.tipoUsuario;
    let iconClass = 'bi bi-person-fill';
    let typeText = 'Estudiante';

    if (isSuperuserUser) {
        badgeClass = 'superusuario';
        iconClass = 'bi bi-shield-fill-exclamation';
        typeText = 'Superusuario';
    } else if (isAdmin) {
        badgeClass = 'admin';
        iconClass = 'bi bi-person-badge-fill';
        typeText = 'Profesor';
    }

    elements.editUserTypeBadge.className = `user-type-badge-display ${badgeClass}`;
    elements.editUserTypeBadge.querySelector('i').className = iconClass;
    elements.editUserTypeText.textContent = typeText;

    // Show/hide role selection for admins (only if current user is superuser)
    const roleSelectionEdit = document.getElementById('roleSelectionEdit');
    if (user.tipoUsuario === 'admin' && isSuperuser) {
        roleSelectionEdit.style.display = 'block';
        const userRole = user.rol || 'admin';
        const roleRadio = document.querySelector(`input[name="rolUsuarioEdit"][value="${userRole}"]`);
        if (roleRadio) {
            roleRadio.checked = true;
        }
    } else {
        roleSelectionEdit.style.display = 'none';
    }

    // Show/hide student fields and admin fields based on user type
    const studentFields = document.querySelectorAll('.student-edit-fields');
    const adminEditFields = document.querySelectorAll('.admin-edit-fields');

    if (user.tipoUsuario === 'estudiante') {
        // ESTUDIANTE: Mostrar campos de estudiante, OCULTAR campos de admin
        studentFields.forEach(field => field.style.display = 'block');
        adminEditFields.forEach(field => field.style.display = 'none');

        elements.editInstitucion.value = user.institucion || '';
        elements.editGrado.value = user.grado || '';
        elements.editTipoDocumento.value = user.tipoDocumento || '';
        elements.editNumeroDocumento.value = user.numeroDocumento || '';
        elements.editDepartamento.value = user.departamento || '';

        // Load gamification data
        document.getElementById('editPuntos').value = user.puntos || user.puntosAcumulados || 0;

        // Load insignias dynamically from Firebase
        loadInsigniasForEdit().then(() => {
            // After loading insignias, select the ones the user has
            const insigniasArray = user.insignias || [];
            const insigniasCheckboxes = document.querySelectorAll('input[name="insigniaEdit"]');

            insigniasCheckboxes.forEach(checkbox => {
                const insigniaId = checkbox.value;
                // Check if user has this insignia by ID
                const hasInsignia = insigniasArray.some(ins => {
                    // Support both old format (string/object with icono) and new format (ID)
                    if (typeof ins === 'string') {
                        return ins === insigniaId;
                    } else if (ins && ins.id) {
                        return ins.id === insigniaId;
                    }
                    return false;
                });
                checkbox.checked = hasInsignia;
            });
        });

        // Load aulas asignadas
        loadAulasForEditForm(user.aulasAsignadas || []);

        // Clear asignaturas checkboxes for students (they shouldn't have any)
        const asignaturasCheckboxes = document.querySelectorAll('input[name="asignaturaProfesorEdit"]');
        asignaturasCheckboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

    } else {
        // ADMIN/PROFESOR: Ocultar campos de estudiante, mostrar campos de admin
        studentFields.forEach(field => field.style.display = 'none');
        adminEditFields.forEach(field => field.style.display = 'block');

        // Load aulas y materias del profesor
        loadAulasForProfesorEditForm(user.aulasAsignadas || []);

        // Update subject section visibility based on role (hide for superusers)
        toggleSubjectSectionEdit();
    }

    elements.editUserModal.classList.add('show');
}

// Close edit user modal
function closeEditUserModal() {
    elements.editUserModal.classList.remove('show');
    currentUserForEdit = null;
}

// Open reset password modal
function openResetPasswordModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    currentUserForReset = user;

    elements.modalUserName.textContent = user.nombre || 'Usuario';
    elements.modalUserEmail.textContent = user.usuario || user.email;
    elements.modalUserType.textContent = user.tipoUsuario === 'admin' ? 'Profesor' : 'Estudiante';
    elements.modalUserType.className = `user-type-badge ${user.tipoUsuario}`;

    // Clear form
    elements.newPassword.value = '';
    elements.confirmPassword.value = '';

    elements.resetPasswordModal.classList.add('show');
}

// Close modal
function closeModal() {
    elements.resetPasswordModal.classList.remove('show');
    currentUserForReset = null;
}

// Close confirmation modal
function closeConfirmationModal() {
    elements.confirmationModal.classList.remove('show');
    // Remove any pending action
    elements.confirmAction.onclick = null;
}

// Show confirmation modal
function showConfirmationModal(title, message, user, action, onConfirm) {
    elements.confirmationTitle.textContent = title;
    elements.confirmationMessage.textContent = message;
    elements.confirmationUserName.textContent = user.nombre || 'Usuario';
    elements.confirmationUserEmail.textContent = user.usuario || user.email;

    // Update icon and button based on action
    const icon = elements.confirmationIcon.querySelector('i');
    const confirmBtn = elements.confirmAction;
    const buttonText = elements.confirmButtonText;

    if (action === 'activate') {
        elements.confirmationIcon.className = 'confirmation-icon activate';
        icon.className = 'bi bi-person-check';
        confirmBtn.className = 'confirm-btn activate';
        buttonText.textContent = 'Activar Usuario';
    } else if (action === 'deactivate') {
        elements.confirmationIcon.className = 'confirmation-icon deactivate';
        icon.className = 'bi bi-person-x';
        confirmBtn.className = 'confirm-btn deactivate';
        buttonText.textContent = 'Desactivar Usuario';
    }

    // Set the confirm action
    elements.confirmAction.onclick = () => {
        closeConfirmationModal();
        onConfirm();
    };

    elements.confirmationModal.classList.add('show');
}

// Handle create user
async function handleCreateUser(e) {
    e.preventDefault();

    const tipoUsuario = document.querySelector('input[name="tipoUsuario"]:checked').value;
    const nombre = elements.createNombre.value.trim();
    let usuario = elements.createUsuario.value.trim();
    const password = elements.createPassword.value;
    const telefono = elements.createTelefono.value.trim();
    const emailRecuperacion = elements.createEmailRecuperacion.value.trim();

    // Agregar @seamosgenios.com automáticamente para todos los usuarios
    // Remover @seamosgenios.com si el usuario lo escribió
    usuario = usuario.replace(/@seamosgenios\.com$/i, '');
    // Agregar el dominio
    usuario = usuario + '@seamosgenios.com';

    // Basic validation
    if (!nombre || !usuario || !password || !telefono || !emailRecuperacion) {
        showMessage('Todos los campos básicos son obligatorios', 'error');
        return;
    }

    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    // Validate email format (solo para email de recuperación, el usuario ya tiene el dominio)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRecuperacion)) {
        showMessage('Por favor ingresa un correo de recuperación válido', 'error');
        return;
    }

    // Student-specific validation
    if (tipoUsuario === 'estudiante') {
        const institucion = elements.createInstitucion.value.trim();
        const grado = elements.createGrado.value;
        const tipoDocumento = elements.createTipoDocumento.value;
        const numeroDocumento = elements.createNumeroDocumento.value.trim();
        const departamento = elements.createDepartamento.value;

        if (!institucion || !grado || !tipoDocumento || !numeroDocumento || !departamento) {
            showMessage('Todos los campos del estudiante son obligatorios', 'error');
            return;
        }
    }

    try {
        const submitBtn = document.querySelector('#createUserModal .create-btn');
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        await waitForFirebase();

        // Check if user already exists
        const existingUserQuery = await window.firebaseDB.collection('usuarios')
            .where('usuario', '==', usuario)
            .get();

        if (!existingUserQuery.empty) {
            showMessage('Ya existe un usuario con este email', 'error');
            const btn = document.querySelector('#createUserModal .create-btn');
            if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
            return;
        }

        // Generate recovery code
        const recoveryCode = generateRecoveryCode();

        // Determinar el rol del usuario
        let rol = tipoUsuario; // Por defecto, el rol es el tipo de usuario
        if (tipoUsuario === 'admin') {
            const rolSeleccionado = document.querySelector('input[name="rolUsuario"]:checked');
            if (rolSeleccionado && window.currentUserRole === 'superusuario') {
                rol = rolSeleccionado.value; // 'admin' o 'superusuario'
            } else {
                rol = 'admin'; // Por defecto admin normal
            }
        }

        // Validate security code for superuser creation
        if (rol === 'superusuario') {
            const securityCode = elements.createSecurityCode.value.trim();
            if (!securityCode) {
                showMessage('El código de seguridad es obligatorio para crear superusuarios', 'error');
                const btn = document.querySelector('#createUserModal .create-btn');
                if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
                return;
            }
            if (securityCode !== SUPERUSER_SECURITY_CODE) {
                showMessage('Código de seguridad incorrecto', 'error');
                const btn = document.querySelector('#createUserModal .create-btn');
                if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
                return;
            }
        }

        // Create user data object
        const userData = {
            nombre: nombre,
            usuario: usuario,
            password: password,
            telefono: telefono,
            emailRecuperacion: emailRecuperacion,
            tipoUsuario: tipoUsuario,
            rol: rol, // Nuevo campo rol
            activo: true,
            codigoRecuperacion: recoveryCode,
            fechaCreacion: window.firebase.firestore.FieldValue.serverTimestamp(),
            fechaUltimaActualizacion: window.firebase.firestore.FieldValue.serverTimestamp()
        };

        // Add student-specific fields
        if (tipoUsuario === 'estudiante') {
            userData.institucion = elements.createInstitucion.value.trim();
            userData.grado = elements.createGrado.value;
            userData.tipoDocumento = elements.createTipoDocumento.value;
            userData.numeroDocumento = elements.createNumeroDocumento.value.trim();
            userData.departamento = elements.createDepartamento.value;

            // Get selected aulas (aulas a las que tendrá acceso)
            const aulasCheckboxes = document.querySelectorAll('input[name="aulaPermisoCreate"]:checked');
            const aulasAsignadas = Array.from(aulasCheckboxes).map(cb => cb.value);
            userData.aulasAsignadas = aulasAsignadas;

            // Initialize gamification fields
            userData.puntos = 0;
            userData.puntosAcumulados = 0;
            userData.insignias = [];
        }

        // Add admin-specific fields (aulas y materias por aula)
        if (tipoUsuario === 'admin') {
            // Get aulas asignadas con sus materias
            const aulasAsignadas = getAulasProfesorFromForm('Create');
            userData.aulasAsignadas = aulasAsignadas; // Array de objetos {aulaId, materias: [...]}
        }

        // Add to Firestore
        await window.firebaseDB.collection('usuarios').add(userData);

        const rolText = rol === 'superusuario' ? 'Superusuario' : (tipoUsuario === 'admin' ? 'Profesor' : 'Estudiante');
        showMessage(`${rolText} creado exitosamente. Código de recuperación: ${recoveryCode}`, 'success');
        closeCreateUserModal();
        loadUsers(); // Refresh the list

    } catch (error) {
        console.error('Error creating user:', error);
        showMessage('Error al crear el usuario', 'error');
    } finally {
        const submitBtn = document.querySelector('#createUserModal .create-btn');
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
}

// Handle edit user
async function handleEditUser(e) {
    e.preventDefault();

    if (!currentUserForEdit) return;

    const nombre = elements.editNombre.value.trim();
    let usuario = elements.editUsuario.value.trim();
    const telefono = elements.editTelefono.value.trim();
    const emailRecuperacion = elements.editEmailRecuperacion.value.trim();

    // Basic validation
    if (!nombre || !usuario || !telefono || !emailRecuperacion) {
        showMessage('Todos los campos básicos son obligatorios', 'error');
        return;
    }

    // Agregar dominio si no lo tiene
    if (!usuario.includes('@')) {
        usuario = usuario + '@seamosgenios.com';
    }

    // Validate email format (solo para email de recuperación, el usuario ya tiene el dominio)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailRecuperacion)) {
        showMessage('Por favor ingresa un correo de recuperación válido', 'error');
        return;
    }

    const submitBtn = document.querySelector('#editUserModal .save-btn');

    try {
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        await waitForFirebase();

        // Check if email is being changed and if it already exists
        if (usuario !== currentUserForEdit.usuario) {
            const existingUserQuery = await window.firebaseDB.collection('usuarios')
                .where('usuario', '==', usuario)
                .get();

            if (!existingUserQuery.empty) {
                showMessage('Ya existe un usuario con este email', 'error');
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }
                return;
            }
        }

        // Create update data object
        const updateData = {
            nombre: nombre,
            usuario: usuario,
            telefono: telefono,
            emailRecuperacion: emailRecuperacion,
            fechaUltimaActualizacion: window.firebase.firestore.FieldValue.serverTimestamp()
        };

        // Update role if user is admin and current user is superuser
        if (currentUserForEdit.tipoUsuario === 'admin' && window.currentUserRole === 'superusuario') {
            const rolSeleccionado = document.querySelector('input[name="rolUsuarioEdit"]:checked');
            if (rolSeleccionado) {
                updateData.rol = rolSeleccionado.value;
            }
        }

        // Add student-specific fields if user is a student
        if (currentUserForEdit.tipoUsuario === 'estudiante') {
            const institucion = elements.editInstitucion.value.trim();
            const grado = elements.editGrado.value;
            const tipoDocumento = elements.editTipoDocumento.value;
            const numeroDocumento = elements.editNumeroDocumento.value.trim();
            const departamento = elements.editDepartamento.value;

            if (!institucion || !grado || !tipoDocumento || !numeroDocumento || !departamento) {
                showMessage('Todos los campos del estudiante son obligatorios', 'error');
                if (submitBtn) {
                    submitBtn.classList.remove('loading');
                    submitBtn.disabled = false;
                }
                return;
            }

            updateData.institucion = institucion;
            updateData.grado = grado;
            updateData.tipoDocumento = tipoDocumento;
            updateData.numeroDocumento = numeroDocumento;
            updateData.departamento = departamento;

            // Get gamification data
            const puntos = parseInt(document.getElementById('editPuntos').value) || 0;

            // Get selected insignias (now storing just IDs)
            const insigniasCheckboxes = document.querySelectorAll('input[name="insigniaEdit"]:checked');
            const insignias = Array.from(insigniasCheckboxes).map(checkbox => ({
                id: checkbox.value,
                nombre: checkbox.getAttribute('data-nombre')
            }));

            updateData.puntos = puntos;
            updateData.insignias = insignias;

            // Get selected aulas
            const aulasAsignadas = [];
            const aulasCheckboxes = document.querySelectorAll('input[name="aulaPermisoEdit"]:checked');
            aulasCheckboxes.forEach(checkbox => {
                aulasAsignadas.push(checkbox.value);
            });
            updateData.aulasAsignadas = aulasAsignadas;
        }

        // Update admin-specific fields (aulas y materias por aula) - ONLY for admins, not students
        if (currentUserForEdit.tipoUsuario === 'admin') {
            // Get aulas asignadas con sus materias
            const aulasAsignadas = getAulasProfesorFromForm('Edit');
            updateData.aulasAsignadas = aulasAsignadas; // Array de objetos {aulaId, materias: [...]}
        }

        // Update in Firestore
        await window.firebaseDB.collection('usuarios').doc(currentUserForEdit.id).update(updateData);

        showMessage('Usuario actualizado exitosamente', 'success');
        closeEditUserModal();
        loadUsers(); // Refresh the list

    } catch (error) {
        console.error('Error updating user:', error);
        showMessage('Error al actualizar el usuario', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    const icon = toggle.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'bi bi-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'bi bi-eye';
    }
}

// Handle password reset
async function handlePasswordReset(e) {
    e.preventDefault();

    if (!currentUserForReset) return;

    const newPassword = elements.newPassword.value;
    const confirmPassword = elements.confirmPassword.value;

    // Validation
    if (newPassword.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }

    const submitBtn = elements.resetPasswordForm.querySelector('.reset-btn');

    try {
        if (submitBtn) {
            submitBtn.classList.add('loading');
            submitBtn.disabled = true;
        }

        await waitForFirebase();

        // Verificar que Firebase esté disponible
        if (!window.firebase || !window.firebase.firestore) {
            throw new Error('Firebase no está disponible');
        }

        // Generate new recovery code
        const newRecoveryCode = generateRecoveryCode();

        // Update password and recovery code
        await window.firebaseDB.collection('usuarios').doc(currentUserForReset.id).update({
            password: newPassword,
            codigoRecuperacion: newRecoveryCode,
            fechaUltimaActualizacion: window.firebase.firestore.FieldValue.serverTimestamp()
        });

        showMessage(`Contraseña restablecida exitosamente. Nuevo código de recuperación: ${newRecoveryCode}`, 'success');
        closeModal();
        loadUsers(); // Refresh the list

    } catch (error) {
        console.error('Error resetting password:', error);
        showMessage(error.message || 'Error al restablecer la contraseña', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    }
}

// Toggle user status
async function toggleUserStatus(userId, currentStatus) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const action = currentStatus ? 'desactivar' : 'activar';
    const actionType = currentStatus ? 'deactivate' : 'activate';
    const title = currentStatus ? 'Desactivar Usuario' : 'Activar Usuario';
    const message = `¿Estás seguro de que deseas ${action} este usuario?`;

    // Show custom confirmation modal
    showConfirmationModal(title, message, user, actionType, async () => {
        try {
            await waitForFirebase();

            await window.firebaseDB.collection('usuarios').doc(userId).update({
                activo: !currentStatus,
                fechaUltimaActualizacion: window.firebase.firestore.FieldValue.serverTimestamp()
            });

            showMessage(`Usuario ${action}do exitosamente`, 'success');
            loadUsers(); // Refresh the list

        } catch (error) {
            console.error('Error toggling user status:', error);
            showMessage(`Error al ${action} usuario`, 'error');
        }
    });
}

// Generate recovery code
function generateRecoveryCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Show loading
function showLoading(show) {
    elements.loadingSpinner.style.display = show ? 'block' : 'none';
    elements.usersTableBody.style.display = show ? 'none' : '';
}

// Show message - Disabled
function showMessage(message, type) {
    // Notificaciones desactivadas
    console.log(`[${type}] ${message}`);
}

// Handle logout
function handleLogout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}

// Export dropdown functions
function toggleExportMenu(e) {
    e.stopPropagation();
    elements.exportDropdown.classList.toggle('active');
}

function closeExportMenu() {
    elements.exportDropdown.classList.remove('active');
}

function closeExportMenuOutside(e) {
    if (!elements.exportDropdown.contains(e.target)) {
        closeExportMenu();
    }
}

// Export to Excel function
function handleExport(type) {
    let dataToExport = [];
    let filename = '';

    // Get current institucion filter value
    const institucionFilter = elements.institucionFilter ? elements.institucionFilter.value : '';

    // Filter data based on type
    switch (type) {
        case 'all':
            dataToExport = allUsers;
            filename = 'todos_los_usuarios';
            break;
        case 'estudiante':
            dataToExport = allUsers.filter(user => user.tipoUsuario === 'estudiante');
            // Apply institucion filter if active
            if (institucionFilter) {
                dataToExport = dataToExport.filter(user => user.institucion === institucionFilter);
                filename = `estudiantes_${institucionFilter.replace(/\s+/g, '_')}`;
            } else {
                filename = 'estudiantes';
            }
            break;
        case 'admin':
            dataToExport = allUsers.filter(user => user.tipoUsuario === 'admin');
            filename = 'profesores';
            break;
        case 'superusuario':
            dataToExport = allUsers.filter(user => user.rol === 'superusuario');
            filename = 'superusuarios';
            break;
        case 'codigos':
            // Export recovery codes
            exportRecoveryCodes();
            return;
        case 'insignias':
            // Export insignias data
            exportInsigniasData();
            return;
        default:
            dataToExport = allUsers;
            filename = 'usuarios';
    }

    if (dataToExport.length === 0) {
        const message = institucionFilter && type === 'estudiante'
            ? `No hay estudiantes de ${institucionFilter} para exportar`
            : `No hay ${type === 'all' ? 'usuarios' : type === 'admin' ? 'profesores' : 'estudiantes'} para exportar`;
        showMessage(message, 'error');
        return;
    }

    // Prepare data for Excel
    const excelData = dataToExport.map(user => {
        const baseData = {
            'Usuario': user.usuario || user.email || '',
            'Nombre': user.nombre || '',
            'Tipo': user.tipoUsuario === 'admin' ? 'Profesor' : 'Estudiante',
            'Estado': user.activo ? 'Activo' : 'Inactivo',
            'Teléfono': user.telefono || '',
            'Email Recuperación': user.emailRecuperacion || '',
            'Código Recuperación': user.codigoRecuperacion || '',
            'Fecha Registro': user.fechaCreacion ? user.fechaCreacion.toDate().toLocaleDateString('es-ES') : ''
        };

        // Add student-specific fields if user is a student
        if (user.tipoUsuario === 'estudiante') {
            baseData['Institución'] = user.institucion || '';
            baseData['Grado'] = user.grado || '';
            baseData['Tipo Documento'] = user.tipoDocumento || '';
            baseData['Número Documento'] = user.numeroDocumento || '';
            baseData['Departamento'] = user.departamento || '';
        }

        return baseData;
    });

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');

    // Set column widths
    const colWidths = [
        { wch: 25 }, // Usuario
        { wch: 20 }, // Nombre
        { wch: 15 }, // Tipo
        { wch: 10 }, // Estado
        { wch: 15 }, // Teléfono
        { wch: 25 }, // Email Recuperación
        { wch: 20 }, // Código Recuperación
        { wch: 15 }, // Fecha Registro
        { wch: 25 }, // Institución
        { wch: 12 }, // Grado
        { wch: 15 }, // Tipo Documento
        { wch: 18 }, // Número Documento
        { wch: 20 }  // Departamento
    ];
    ws['!cols'] = colWidths;

    // Generate filename with current date
    const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    const finalFilename = `${filename}_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, finalFilename);

    const exportMessage = institucionFilter && type === 'estudiante'
        ? `Exportación completada: ${dataToExport.length} estudiantes de ${institucionFilter} exportados`
        : `Exportación completada: ${dataToExport.length} registros exportados`;

    showMessage(exportMessage, 'success');
}

// Export recovery codes function
function exportRecoveryCodes() {
    if (allUsers.length === 0) {
        showMessage('No hay usuarios para exportar', 'error');
        return;
    }

    const excelData = allUsers.map(user => ({
        'Usuario': user.usuario || user.email || '',
        'Nombre': user.nombre || '',
        'Rol': user.rol === 'superusuario' ? 'Superusuario' : user.tipoUsuario === 'admin' ? 'Profesor' : 'Estudiante',
        'Email Recuperación': user.emailRecuperacion || '',
        'Código Recuperación': user.codigoRecuperacion || '',
        'Estado': user.activo ? 'Activo' : 'Inactivo',
        'Fecha Registro': user.fechaCreacion ? user.fechaCreacion.toDate().toLocaleDateString('es-ES') : ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Códigos de Recuperación');

    const colWidths = [
        { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 10 }, { wch: 15 }
    ];
    ws['!cols'] = colWidths;

    const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    const filename = `codigos_recuperacion_${currentDate}.xlsx`;

    XLSX.writeFile(wb, filename);
    showMessage(`Códigos de recuperación exportados: ${allUsers.length} registros`, 'success');
}

// Export insignias data function
async function exportInsigniasData() {
    try {
        await waitForFirebase();

        // Get all insignias
        const insigniasSnapshot = await window.firebaseDB.collection('insignias').get();
        const insigniasMap = new Map();

        insigniasSnapshot.forEach(doc => {
            insigniasMap.set(doc.id, doc.data());
        });

        if (insigniasMap.size === 0) {
            showMessage('No hay insignias creadas para exportar', 'error');
            return;
        }

        // Get all students with insignias
        const students = allUsers.filter(user => user.tipoUsuario === 'estudiante' && user.insignias && user.insignias.length > 0);

        if (students.length === 0) {
            showMessage('No hay estudiantes con insignias para exportar', 'error');
            return;
        }

        const excelData = students.map(student => {
            // Get insignia names
            const insigniaNames = (student.insignias || []).map(ins => {
                if (typeof ins === 'string') {
                    const insigniaData = insigniasMap.get(ins);
                    return insigniaData ? insigniaData.nombre : ins;
                } else if (ins && ins.id) {
                    const insigniaData = insigniasMap.get(ins.id);
                    return insigniaData ? insigniaData.nombre : ins.nombre || 'Desconocida';
                } else if (ins && ins.nombre) {
                    return ins.nombre;
                }
                return 'Desconocida';
            }).join(', ');

            return {
                'Usuario': student.usuario || student.email || '',
                'Nombre': student.nombre || '',
                'Institución': student.institucion || '',
                'Grado': student.grado || '',
                'Puntos': student.puntos || student.puntosAcumulados || 0,
                'Cantidad Insignias': (student.insignias || []).length,
                'Insignias Obtenidas': insigniaNames
            };
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Insignias y Gamificación');

        const colWidths = [
            { wch: 25 }, { wch: 20 }, { wch: 25 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 50 }
        ];
        ws['!cols'] = colWidths;

        const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
        const filename = `insignias_gamificacion_${currentDate}.xlsx`;

        XLSX.writeFile(wb, filename);
        showMessage(`Datos de insignias exportados: ${students.length} estudiantes`, 'success');

    } catch (error) {
        console.error('Error exporting insignias:', error);
        showMessage('Error al exportar datos de insignias', 'error');
    }
}

// Handle logout - Modal de confirmación
async function handleLogout() {
    // Usar la función compartida si existe, si no usar confirm nativo
    if (typeof showLogoutModal === 'function') {
        const confirmed = await showLogoutModal();
        if (confirmed) {
            sessionStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        }
    } else {
        const confirmed = confirm('¿Estás seguro de que deseas cerrar sesión?');
        if (confirmed) {
            sessionStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        }
    }
}

// Open User Profile Modal
async function openUserProfileModal(userId) {
    try {
        // Get user data from Firebase
        const db = window.firebaseDB;
        const userDoc = await db.collection('usuarios').doc(userId).get();

        if (!userDoc.exists) {
            showMessage('Usuario no encontrado', 'error');
            return;
        }

        const userData = userDoc.data();
        const profileModal = document.getElementById('userProfileModal');

        // Set user avatar
        const avatarLarge = document.getElementById('profileAvatarLarge');
        if (userData.fotoPerfil) {
            avatarLarge.innerHTML = `<img src="${userData.fotoPerfil}" alt="${userData.nombre}">`;
        } else {
            avatarLarge.innerHTML = `<div class="avatar-default"><i class="bi bi-person-fill"></i></div>`;
        }

        // Set user name and type
        document.getElementById('profileUserName').textContent = userData.nombre || 'Usuario';
        document.getElementById('profileUserType').textContent = userData.tipoUsuario === 'admin' ? 'Profesor' : 'Estudiante';

        // Personal Information
        const personalInfo = document.getElementById('profilePersonalInfo');
        personalInfo.innerHTML = `
            <div class="profile-info-item">
                <div class="profile-info-label"><i class="bi bi-envelope"></i> Email</div>
                <div class="profile-info-value">${userData.usuario || userData.email || 'No especificado'}</div>
            </div>
            <div class="profile-info-item">
                <div class="profile-info-label"><i class="bi bi-telephone"></i> Teléfono</div>
                <div class="profile-info-value">${userData.telefono || 'No especificado'}</div>
            </div>
            ${userData.fechaNacimiento ? `
                <div class="profile-info-item">
                    <div class="profile-info-label"><i class="bi bi-calendar-heart"></i> Fecha de Nacimiento</div>
                    <div class="profile-info-value">${new Date(userData.fechaNacimiento).toLocaleDateString('es-ES')}</div>
                </div>
            ` : ''}
            ${userData.tipoDocumento && userData.numeroDocumento ? `
                <div class="profile-info-item">
                    <div class="profile-info-label"><i class="bi bi-card-text"></i> Documento</div>
                    <div class="profile-info-value">${userData.tipoDocumento} ${userData.numeroDocumento}</div>
                </div>
            ` : ''}
            ${userData.institucion ? `
                <div class="profile-info-item">
                    <div class="profile-info-label"><i class="bi bi-building"></i> Institución</div>
                    <div class="profile-info-value">${userData.institucion}</div>
                </div>
            ` : ''}
            ${userData.grado ? `
                <div class="profile-info-item">
                    <div class="profile-info-label"><i class="bi bi-mortarboard"></i> Grado</div>
                    <div class="profile-info-value">${userData.grado}</div>
                </div>
            ` : ''}
            ${userData.departamento ? `
                <div class="profile-info-item">
                    <div class="profile-info-label"><i class="bi bi-geo-alt"></i> Departamento</div>
                    <div class="profile-info-value">${userData.departamento}</div>
                </div>
            ` : ''}
        `;

        // Public profile information
        const perfilPublico = userData.perfilPublico || {};

        // Biography
        const biographySection = document.getElementById('profileBiographySection');
        const biographyDiv = document.getElementById('profileBiography');
        if (perfilPublico.biografia && perfilPublico.biografia.trim()) {
            biographySection.style.display = 'block';
            biographyDiv.className = 'profile-biography';
            biographyDiv.innerHTML = `<p>${perfilPublico.biografia}</p>`;
        } else {
            biographySection.style.display = 'none';
        }

        // Professional Information
        const professionalSection = document.getElementById('profileProfessionalSection');
        const professionalInfo = document.getElementById('profileProfessionalInfo');
        const hasProfessionalInfo = perfilPublico.profesion || perfilPublico.especialidad ||
            perfilPublico.ciudad || perfilPublico.institucion;

        if (hasProfessionalInfo) {
            professionalSection.style.display = 'block';
            professionalInfo.innerHTML = `
                ${perfilPublico.profesion ? `
                    <div class="profile-info-item">
                        <div class="profile-info-label"><i class="bi bi-briefcase"></i> Profesión</div>
                        <div class="profile-info-value">${perfilPublico.profesion}</div>
                    </div>
                ` : ''}
                ${perfilPublico.especialidad ? `
                    <div class="profile-info-item">
                        <div class="profile-info-label"><i class="bi bi-star"></i> Especialidad</div>
                        <div class="profile-info-value">${perfilPublico.especialidad}</div>
                    </div>
                ` : ''}
                ${perfilPublico.ciudad ? `
                    <div class="profile-info-item">
                        <div class="profile-info-label"><i class="bi bi-geo-alt"></i> Ciudad</div>
                        <div class="profile-info-value">${perfilPublico.ciudad}</div>
                    </div>
                ` : ''}
                ${perfilPublico.institucion ? `
                    <div class="profile-info-item">
                        <div class="profile-info-label"><i class="bi bi-building"></i> Institución</div>
                        <div class="profile-info-value">${perfilPublico.institucion}</div>
                    </div>
                ` : ''}
            `;
        } else {
            professionalSection.style.display = 'none';
        }

        // Social Links
        const socialSection = document.getElementById('profileSocialSection');
        const socialLinks = document.getElementById('profileSocialLinks');
        const redesSociales = perfilPublico.redesSociales || {};
        const hasSocialLinks = redesSociales.linkedin || redesSociales.twitter ||
            redesSociales.instagram || redesSociales.facebook;

        if (hasSocialLinks) {
            socialSection.style.display = 'block';
            let socialHTML = '';

            if (redesSociales.linkedin) {
                socialHTML += `
                    <a href="${redesSociales.linkedin}" target="_blank" class="social-link linkedin">
                        <i class="bi bi-linkedin"></i> LinkedIn
                    </a>
                `;
            }
            if (redesSociales.twitter) {
                const twitterUrl = redesSociales.twitter.startsWith('@')
                    ? `https://twitter.com/${redesSociales.twitter.substring(1)}`
                    : redesSociales.twitter;
                socialHTML += `
                    <a href="${twitterUrl}" target="_blank" class="social-link twitter">
                        <i class="bi bi-twitter"></i> Twitter
                    </a>
                `;
            }
            if (redesSociales.instagram) {
                const instagramUrl = redesSociales.instagram.startsWith('@')
                    ? `https://instagram.com/${redesSociales.instagram.substring(1)}`
                    : redesSociales.instagram;
                socialHTML += `
                    <a href="${instagramUrl}" target="_blank" class="social-link instagram">
                        <i class="bi bi-instagram"></i> Instagram
                    </a>
                `;
            }
            if (redesSociales.facebook) {
                socialHTML += `
                    <a href="${redesSociales.facebook}" target="_blank" class="social-link facebook">
                        <i class="bi bi-facebook"></i> Facebook
                    </a>
                `;
            }

            socialLinks.innerHTML = socialHTML;
        } else {
            socialSection.style.display = 'none';
        }

        // Show modal
        profileModal.classList.add('show');

    } catch (error) {
        console.error('Error loading user profile:', error);
        showMessage('Error al cargar el perfil del usuario', 'error');
    }
}

// Close User Profile Modal
function closeUserProfileModal() {
    const profileModal = document.getElementById('userProfileModal');
    profileModal.classList.remove('show');
}

// Initialize Profile Modal Events
function initializeProfileModal() {
    const closeProfileBtn = document.getElementById('closeProfileModal');
    const profileModal = document.getElementById('userProfileModal');

    if (closeProfileBtn) {
        closeProfileBtn.addEventListener('click', closeUserProfileModal);
    }

    // Close modal when clicking outside
    if (profileModal) {
        profileModal.addEventListener('click', function (e) {
            if (e.target === profileModal) {
                closeUserProfileModal();
            }
        });
    }
}

// Open Delete User Modal
function openDeleteUserModal() {
    if (!currentUserForEdit) return;

    // Set user info
    document.getElementById('deleteUserName').textContent = currentUserForEdit.nombre || 'Usuario';
    document.getElementById('deleteUserEmail').textContent = currentUserForEdit.usuario || currentUserForEdit.email;

    // Clear security code input
    document.getElementById('securityCodeInput').value = '';

    // Show delete modal
    document.getElementById('deleteUserModal').classList.add('show');
}

// Close Delete User Modal
function closeDeleteUserModal() {
    document.getElementById('deleteUserModal').classList.remove('show');
    document.getElementById('securityCodeInput').value = '';
}

// Handle Delete User
async function handleDeleteUser() {
    if (!currentUserForEdit) return;

    const securityCode = document.getElementById('securityCodeInput').value.trim();
    const SECURITY_CODE = 'SG-PG-2025-OWH346OU6634OSDFS4YE431FSD325';

    // Validate security code
    if (!securityCode) {
        showMessage('Debes ingresar el código de seguridad', 'error');
        return;
    }

    if (securityCode !== SECURITY_CODE) {
        showMessage('Código de seguridad incorrecto', 'error');
        document.getElementById('securityCodeInput').value = '';
        document.getElementById('securityCodeInput').focus();
        return;
    }

    try {
        const confirmBtn = document.getElementById('confirmDeleteUser');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Eliminando...';

        await waitForFirebase();

        // Delete user from Firestore
        await window.firebaseDB.collection('usuarios').doc(currentUserForEdit.id).delete();

        showMessage('Usuario eliminado exitosamente', 'success');
        closeDeleteUserModal();
        closeEditUserModal();
        loadUsers(); // Refresh the list

    } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Error al eliminar el usuario', 'error');
    } finally {
        const confirmBtn = document.getElementById('confirmDeleteUser');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-trash"></i><span>Eliminar</span>';
    }
}

// Global functions for onclick handlers
window.openResetPasswordModal = openResetPasswordModal;
window.toggleUserStatus = toggleUserStatus;
window.openEditUserModal = openEditUserModal;
window.openUserProfileModal = openUserProfileModal;

// Copy recovery code to clipboard
function copyRecoveryCode(code) {
    if (!code || code === 'No disponible') {
        showMessage('No hay código de recuperación disponible para copiar', 'error');
        return;
    }

    navigator.clipboard.writeText(code).then(() => {
        showMessage('Código de recuperación copiado al portapapeles', 'success');

        // Visual feedback - briefly highlight the copied code
        const codeElements = document.querySelectorAll('.recovery-code');
        codeElements.forEach(el => {
            if (el.textContent.includes(code)) {
                el.style.background = 'rgba(40, 167, 69, 0.2)';
                el.style.borderColor = '#28a745';
                setTimeout(() => {
                    el.style.background = 'rgba(255, 193, 7, 0.1)';
                    el.style.borderColor = 'rgba(255, 193, 7, 0.3)';
                }, 1000);
            }
        });
    }).catch(err => {
        console.error('Error copying recovery code:', err);
        showMessage('Error al copiar el código de recuperación', 'error');
    });
}

// Copy recovery email to clipboard
function copyRecoveryEmail(email) {
    if (!email || email === 'No especificado') {
        showMessage('No hay email de recuperación disponible para copiar', 'error');
        return;
    }

    navigator.clipboard.writeText(email).then(() => {
        showMessage('Email de recuperación copiado al portapapeles', 'success');

        // Visual feedback - briefly highlight the copied email
        const emailElements = document.querySelectorAll('.recovery-email');
        emailElements.forEach(el => {
            if (el.textContent.includes(email)) {
                el.style.background = 'rgba(40, 167, 69, 0.1)';
                el.style.color = '#28a745';
                setTimeout(() => {
                    el.style.background = '';
                    el.style.color = '#0066cc';
                }, 1000);
            }
        });
    }).catch(err => {
        console.error('Error copying recovery email:', err);
        showMessage('Error al copiar el email de recuperación', 'error');
    });
}

// Show message function (if not already defined)
function showMessage(message, type = 'info') {
    const messageContainer = elements.messageContainer;
    if (!messageContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    messageContainer.appendChild(messageDiv);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}

// Copy phone number to clipboard
function copyPhone(phone) {
    if (!phone || phone === 'No especificado') {
        showMessage('No hay teléfono disponible para copiar', 'error');
        return;
    }

    navigator.clipboard.writeText(phone).then(() => {
        showMessage('Teléfono copiado al portapapeles', 'success');

        // Visual feedback
        const phoneElements = document.querySelectorAll('.phone-number');
        phoneElements.forEach(el => {
            if (el.textContent.includes(phone)) {
                el.style.background = 'rgba(40, 167, 69, 0.2)';
                setTimeout(() => {
                    el.style.background = '';
                }, 1000);
            }
        });
    }).catch(err => {
        console.error('Error copying phone:', err);
        showMessage('Error al copiar el teléfono', 'error');
    });
}

// Open WhatsApp with phone number
function openWhatsApp(phone) {
    if (!phone || phone === 'No especificado') {
        showMessage('No hay teléfono disponible', 'error');
        return;
    }

    // Remove any non-numeric characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Open WhatsApp with the phone number
    const whatsappUrl = `https://wa.me/${cleanPhone}`;
    window.open(whatsappUrl, '_blank');
}

// Send recovery code via WhatsApp
function sendCodeWhatsApp(phone, code) {
    if (!phone || phone === 'No especificado') {
        showMessage('No hay teléfono disponible', 'error');
        return;
    }

    if (!code || code === 'No disponible') {
        showMessage('No hay código de recuperación disponible', 'error');
        return;
    }

    // Remove any non-numeric characters except +
    const cleanPhone = phone.replace(/[^\d+]/g, '');

    // Create message with recovery code
    const message = `Hola! Tu código de recuperación de Seamos Genios es: ${code}`;
    const encodedMessage = encodeURIComponent(message);

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

// Open Gmail to send recovery code
function openGmail(email, code) {
    if (!email || email === 'No especificado') {
        showMessage('No hay email disponible', 'error');
        return;
    }

    // Create email subject and body
    const subject = encodeURIComponent('Código de Recuperación - Seamos Genios');
    const body = code && code !== 'No disponible'
        ? encodeURIComponent(`Hola,\n\nTu código de recuperación de Seamos Genios es: ${code}\n\nPor favor, guarda este código en un lugar seguro.\n\nSaludos,\nEquipo Seamos Genios`)
        : encodeURIComponent(`Hola,\n\nEste es tu correo de recuperación registrado en Seamos Genios.\n\nSaludos,\nEquipo Seamos Genios`);

    // Open Gmail compose with pre-filled data
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
}

// Make copy functions globally available
window.copyRecoveryCode = copyRecoveryCode;
window.copyRecoveryEmail = copyRecoveryEmail;
window.copyPhone = copyPhone;
window.openWhatsApp = openWhatsApp;
window.sendCodeWhatsApp = sendCodeWhatsApp;
window.openGmail = openGmail;

// Add scroll effect to dashboard menu
function initializeDashboardMenuScroll() {
    const dashboardMenu = document.querySelector('.dashboard-menu');
    if (!dashboardMenu) return;

    let ticking = false;

    function updateDashboardMenuShadow() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 100) {
            dashboardMenu.classList.add('scrolled');
        } else {
            dashboardMenu.classList.remove('scrolled');
        }

        ticking = false;
    }

    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateDashboardMenuShadow);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestTick);
}

// Initialize dashboard menu scroll effect
document.addEventListener('DOMContentLoaded', function () {
    initializeDashboardMenuScroll();
});

// ========================================
// INSIGNIAS MANAGEMENT SYSTEM
// ========================================

// Bootstrap Icons for Insignias - Categorized
const BOOTSTRAP_ICONS = {
    all: [
        'award', 'award-fill', 'trophy', 'trophy-fill', 'star', 'star-fill',
        'bookmark', 'bookmark-fill', 'gem',
        'shield', 'shield-fill', 'shield-check',
        'lightbulb', 'lightbulb-fill', 'rocket',
        'fire', 'lightning', 'lightning-fill',
        'heart', 'heart-fill', 'emoji-smile', 'emoji-smile-fill',
        'gift', 'gift-fill', 'flag', 'flag-fill',
        'patch-check', 'patch-check-fill', 'check-circle', 'check-circle-fill',
        'hand-thumbs-up', 'hand-thumbs-up-fill',
        'brightness-high', 'brightness-high-fill', 'sun', 'sun-fill', 'moon-stars', 'moon-stars-fill',
        'balloon', 'balloon-fill', 'balloon-heart', 'balloon-heart-fill'
    ],
    education: [
        'book', 'book-fill', 'journal', 'journal-bookmark',
        'journal-text', 'pencil', 'pencil-fill',
        'pencil-square', 'pen', 'pen-fill', 'clipboard', 'clipboard-check', 'clipboard-check-fill',
        'clipboard-data', 'clipboard-fill',
        'file-text', 'file-text-fill',
        'easel', 'easel-fill',
        'palette', 'palette-fill', 'brush', 'brush-fill',
        'card-list', 'card-text', 'list-check', 'list-task'
    ],
    achievement: [
        'trophy', 'trophy-fill', 'award', 'award-fill', 'gem', 'star', 'star-fill',
        'patch-check', 'patch-check-fill', 'shield-check',
        'check-circle', 'check-circle-fill',
        'hand-thumbs-up', 'hand-thumbs-up-fill', 'flag', 'flag-fill', 'rocket',
        'fire', 'lightning', 'lightning-fill', 'brightness-high-fill',
        'balloon', 'balloon-fill', 'gift', 'gift-fill', 'emoji-smile-fill'
    ],
    subjects: [
        'calculator', 'calculator-fill', 'graph-up', 'graph-up-arrow',
        'globe', 'globe2',
        'tree', 'tree-fill',
        'translate',
        'chat', 'chat-fill', 'chat-text', 'chat-text-fill',
        'book', 'book-fill', 'journal-text', 'journal-bookmark', 'pencil', 'pencil-square'
    ]
};

// Variables globales para insignias
let allInsignias = [];
let currentInsigniaForEdit = null;
let currentInsigniaForDelete = null;

// Initialize insignias management
function initializeInsigniasManagement() {
    const createInsigniaBtn = document.getElementById('createInsigniaBtn');
    const closeInsigniaModal = document.getElementById('closeInsigniaModal');
    const cancelInsignia = document.getElementById('cancelInsignia');
    const insigniaForm = document.getElementById('insigniaForm');
    const insigniaNombre = document.getElementById('insigniaNombre');

    // Create insignia button
    if (createInsigniaBtn) {
        createInsigniaBtn.addEventListener('click', openCreateInsigniaModal);
    }

    // Close modal buttons
    if (closeInsigniaModal) {
        closeInsigniaModal.addEventListener('click', closeInsigniaModal_);
    }
    if (cancelInsignia) {
        cancelInsignia.addEventListener('click', closeInsigniaModal_);
    }

    // Form submit
    if (insigniaForm) {
        insigniaForm.addEventListener('submit', handleInsigniaFormSubmit);
    }

    // Preview update
    if (insigniaNombre) {
        insigniaNombre.addEventListener('input', updateInsigniaPreview);
    }

    // Category change - auto assign color
    const insigniaCategoria = document.getElementById('insigniaCategoria');
    if (insigniaCategoria) {
        insigniaCategoria.addEventListener('change', handleCategoriaChange);
    }

    // Icon category buttons
    const categoryBtns = document.querySelectorAll('.icon-category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', handleIconCategoryChange);
    });

    // Back to table button
    const backToTableBtn = document.getElementById('backToTableBtn');
    if (backToTableBtn) {
        backToTableBtn.addEventListener('click', closeInsigniasManagement);
    }

    // Delete insignia modal
    const closeDeleteInsigniaModal = document.getElementById('closeDeleteInsigniaModal');
    const cancelDeleteInsignia = document.getElementById('cancelDeleteInsignia');
    const confirmDeleteInsignia = document.getElementById('confirmDeleteInsignia');

    if (closeDeleteInsigniaModal) {
        closeDeleteInsigniaModal.addEventListener('click', closeDeleteInsigniaModal_);
    }
    if (cancelDeleteInsignia) {
        cancelDeleteInsignia.addEventListener('click', closeDeleteInsigniaModal_);
    }
    if (confirmDeleteInsignia) {
        confirmDeleteInsignia.addEventListener('click', handleDeleteInsignia);
    }

    // Populate icons grid
    populateIconsGrid('all');
}

// Update dashboard view to handle insignias, instituciones, coordinadores and aulas
function switchDashboardView(view) {
    currentDashboardView = view;

    // Update active tab
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');
    dashboardTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-view') === view) {
            tab.classList.add('active');
        }
    });

    // Get all sections
    const usersTableContainer = document.getElementById('usersTableContainer');
    const insigniasManagement = document.getElementById('insigniasManagement');
    const institucionesManagement = document.getElementById('institucionesManagement');
    const coordinadoresManagement = document.getElementById('coordinadoresManagement');
    const aulasManagement = document.getElementById('aulasManagement');
    const resetProgressManagement = document.getElementById('resetProgressManagement');
    const statsGrid = document.querySelector('.stats-grid');

    // Handle different views
    if (view === 'insignias') {
        if (usersTableContainer) usersTableContainer.style.display = 'none';
        if (insigniasManagement) insigniasManagement.style.display = 'block';
        if (institucionesManagement) institucionesManagement.style.display = 'none';
        if (coordinadoresManagement) coordinadoresManagement.style.display = 'none';
        if (aulasManagement) aulasManagement.style.display = 'none';
        if (resetProgressManagement) resetProgressManagement.style.display = 'none';
        if (statsGrid) statsGrid.style.display = 'none';
        loadInsignias();
    } else if (view === 'instituciones') {
        if (usersTableContainer) usersTableContainer.style.display = 'none';
        if (insigniasManagement) insigniasManagement.style.display = 'none';
        if (institucionesManagement) institucionesManagement.style.display = 'block';
        if (coordinadoresManagement) coordinadoresManagement.style.display = 'none';
        if (aulasManagement) aulasManagement.style.display = 'none';
        if (resetProgressManagement) resetProgressManagement.style.display = 'none';
        if (statsGrid) statsGrid.style.display = 'none';
        loadInstitucionesForManagement();
    } else if (view === 'coordinadores') {
        if (usersTableContainer) usersTableContainer.style.display = 'none';
        if (insigniasManagement) insigniasManagement.style.display = 'none';
        if (institucionesManagement) institucionesManagement.style.display = 'none';
        if (coordinadoresManagement) coordinadoresManagement.style.display = 'block';
        if (aulasManagement) aulasManagement.style.display = 'none';
        if (resetProgressManagement) resetProgressManagement.style.display = 'none';
        if (statsGrid) statsGrid.style.display = 'none';
        loadCoordinadores();
    } else if (view === 'aulas') {
        if (usersTableContainer) usersTableContainer.style.display = 'none';
        if (insigniasManagement) insigniasManagement.style.display = 'none';
        if (institucionesManagement) institucionesManagement.style.display = 'none';
        if (coordinadoresManagement) coordinadoresManagement.style.display = 'none';
        if (aulasManagement) aulasManagement.style.display = 'block';
        if (resetProgressManagement) resetProgressManagement.style.display = 'none';
        if (statsGrid) statsGrid.style.display = 'none';
        loadAulas();
    } else if (view === 'resetProgress') {
        if (usersTableContainer) usersTableContainer.style.display = 'none';
        if (insigniasManagement) insigniasManagement.style.display = 'none';
        if (institucionesManagement) institucionesManagement.style.display = 'none';
        if (coordinadoresManagement) coordinadoresManagement.style.display = 'none';
        if (aulasManagement) aulasManagement.style.display = 'none';
        if (resetProgressManagement) resetProgressManagement.style.display = 'block';
        if (statsGrid) statsGrid.style.display = 'none';
        loadResetProgressStats();
    } else {
        if (usersTableContainer) usersTableContainer.style.display = 'block';
        if (insigniasManagement) insigniasManagement.style.display = 'none';
        if (institucionesManagement) institucionesManagement.style.display = 'none';
        if (coordinadoresManagement) coordinadoresManagement.style.display = 'none';
        if (aulasManagement) aulasManagement.style.display = 'none';
        if (resetProgressManagement) resetProgressManagement.style.display = 'none';
        if (statsGrid) statsGrid.style.display = 'grid';
    }

    // Update institucion filter visibility
    updateInstitucionFilterVisibility();

    // Filter users based on view (existing functionality)
    filterUsersByDashboardView();
    updateDashboardTitle(view);
}

// Open insignias management view
function openInsigniasManagement() {
    // Hide users table, show insignias management
    const usersTableContainer = document.getElementById('usersTableContainer');
    const insigniasManagement = document.getElementById('insigniasManagement');

    if (usersTableContainer) usersTableContainer.style.display = 'none';
    if (insigniasManagement) {
        insigniasManagement.style.display = 'block';
        loadInsignias();
    }

    // Deactivate all dashboard tabs
    const dashboardTabs = document.querySelectorAll('.dashboard-tab');
    dashboardTabs.forEach(tab => tab.classList.remove('active'));

    // Hide all action buttons when in management view
    const createUserBtn = document.getElementById('createUserBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const manageInsigniasBtn = document.getElementById('manageInsigniasBtn');

    if (createUserBtn) createUserBtn.classList.add('hide-in-insignias');
    if (refreshBtn) refreshBtn.classList.add('hide-in-insignias');
    if (manageInsigniasBtn) manageInsigniasBtn.classList.remove('show');
}

// Close insignias management and return to table
function closeInsigniasManagement() {
    const usersTableContainer = document.getElementById('usersTableContainer');
    const insigniasManagement = document.getElementById('insigniasManagement');

    if (usersTableContainer) usersTableContainer.style.display = 'block';
    if (insigniasManagement) insigniasManagement.style.display = 'none';

    // Reactivate the current dashboard view
    switchDashboardView(currentDashboardView || 'dashboard');

    // Update button visibility based on current view
    updateDashboardTitle(currentDashboardView || 'dashboard');
}

// Load insignias from Firebase
async function loadInsignias() {
    try {
        const insigniasManagement = document.getElementById('insigniasManagement');
        const insigniasGridManager = document.getElementById('insigniasGridManager');
        const insigniasLoadingSpinner = document.getElementById('insigniasLoadingSpinner');
        const noInsignias = document.getElementById('noInsignias');

        if (insigniasLoadingSpinner) insigniasLoadingSpinner.style.display = 'block';
        if (insigniasGridManager) insigniasGridManager.style.display = 'none';
        if (noInsignias) noInsignias.style.display = 'none';

        await waitForFirebase();

        const insigniasSnapshot = await window.firebaseDB.collection('insignias').orderBy('nombre').get();

        allInsignias = [];
        insigniasSnapshot.forEach(doc => {
            allInsignias.push({
                id: doc.id,
                ...doc.data()
            });
        });

        renderInsignias();

        if (insigniasLoadingSpinner) insigniasLoadingSpinner.style.display = 'none';

    } catch (error) {
        console.error('Error loading insignias:', error);
        showMessage('Error al cargar insignias', 'error');
        const insigniasLoadingSpinner = document.getElementById('insigniasLoadingSpinner');
        if (insigniasLoadingSpinner) insigniasLoadingSpinner.style.display = 'none';
    }
}

// Render insignias in management view
function renderInsignias() {
    const insigniasGridManager = document.getElementById('insigniasGridManager');
    const noInsignias = document.getElementById('noInsignias');

    if (!insigniasGridManager) return;

    if (allInsignias.length === 0) {
        insigniasGridManager.style.display = 'none';
        if (noInsignias) noInsignias.style.display = 'block';
        return;
    }

    insigniasGridManager.style.display = 'grid';
    if (noInsignias) noInsignias.style.display = 'none';

    insigniasGridManager.innerHTML = '';

    allInsignias.forEach(insignia => {
        const card = createInsigniaManagerCard(insignia);
        insigniasGridManager.appendChild(card);
    });
}

// Create insignia manager card
function createInsigniaManagerCard(insignia) {
    const card = document.createElement('div');
    card.className = 'insignia-manager-card';
    card.style.setProperty('--insignia-color', insignia.color || '#667eea');

    const categoryNames = {
        matematicas: 'Matemáticas',
        lectura: 'Lectura Crítica',
        sociales: 'Ciencias Sociales',
        ciencias: 'Ciencias Naturales',
        ingles: 'Inglés'
    };

    card.innerHTML = `
        <div class="insignia-card-header">
            <div class="insignia-card-icon">
                <i class="bi bi-${insignia.icono}"></i>
            </div>
            <div class="insignia-card-info">
                <div class="insignia-card-name">${insignia.nombre}</div>
                <span class="insignia-card-category">${categoryNames[insignia.categoria] || insignia.categoria}</span>
            </div>
        </div>
        <p class="insignia-card-description">${insignia.descripcion || 'Sin descripción'}</p>
        <div class="insignia-card-actions">
            <button class="insignia-action-btn insignia-edit-btn" onclick="openEditInsigniaModal('${insignia.id}')">
                <i class="bi bi-pencil"></i> Editar
            </button>
            <button class="insignia-action-btn insignia-delete-btn" onclick="openDeleteInsigniaModal_('${insignia.id}')">
                <i class="bi bi-trash"></i> Eliminar
            </button>
        </div>
    `;

    return card;
}

// Populate icons grid
function populateIconsGrid(category = 'all') {
    const iconsGrid = document.getElementById('iconsGrid');
    if (!iconsGrid) return;

    iconsGrid.innerHTML = '';

    const icons = BOOTSTRAP_ICONS[category] || BOOTSTRAP_ICONS.all;

    icons.forEach(icon => {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'icon-option';
        iconDiv.innerHTML = `<i class="bi bi-${icon}"></i>`;
        iconDiv.dataset.icon = icon;
        iconDiv.addEventListener('click', () => selectIcon(icon));
        iconsGrid.appendChild(iconDiv);
    });
}

// Handle icon category change
function handleIconCategoryChange(e) {
    const categoryBtns = document.querySelectorAll('.icon-category-btn');
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');

    const category = e.target.dataset.category;
    populateIconsGrid(category);
}

// Select icon
function selectIcon(iconName) {
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => option.classList.remove('selected'));

    const selectedOption = document.querySelector(`[data-icon="${iconName}"]`);
    if (selectedOption) {
        selectedOption.classList.add('selected');
        // Scroll to selected icon
        selectedOption.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    document.getElementById('selectedIcon').value = iconName;

    // Show selected icon display
    const selectedIconDisplay = document.getElementById('selectedIconDisplay');
    const selectedIconName = document.getElementById('selectedIconName');
    if (selectedIconDisplay && selectedIconName) {
        selectedIconDisplay.style.display = 'flex';
        selectedIconName.textContent = iconName;
    }

    updateInsigniaPreview();
}

// Handle categoria change - auto assign color
function handleCategoriaChange() {
    const categoria = document.getElementById('insigniaCategoria').value;
    const colorMap = {
        'matematicas': '#667eea',
        'ciencias': '#28a745',
        'sociales': '#ffc107',
        'lectura': '#dc3545',
        'ingles': '#9c27b0'
    };

    const color = colorMap[categoria] || '#667eea';
    document.getElementById('insigniaColorHidden').value = color;

    // Update preview
    updateInsigniaPreview();
}

// Update insignia preview
function updateInsigniaPreview() {
    const nombre = document.getElementById('insigniaNombre').value || 'Nombre de la Insignia';
    const selectedIcon = document.getElementById('selectedIcon').value || 'award-fill';
    const selectedColor = document.getElementById('insigniaColorHidden')?.value || '#667eea';

    const previewIcon = document.getElementById('previewIcon');
    const previewName = document.getElementById('previewName');

    if (previewIcon) {
        previewIcon.className = `bi bi-${selectedIcon} preview-icon`;
        previewIcon.style.color = selectedColor;
    }

    if (previewName) {
        previewName.textContent = nombre;
    }

    // Update CSS variable for preview color
    document.documentElement.style.setProperty('--preview-color', selectedColor);
}

// Open create insignia modal
function openCreateInsigniaModal() {
    currentInsigniaForEdit = null;

    document.getElementById('insigniaModalTitle').textContent = 'Crear Nueva Insignia';
    document.getElementById('insigniaButtonText').textContent = 'Guardar Insignia';

    // Reset form
    document.getElementById('insigniaForm').reset();
    document.getElementById('selectedIcon').value = '';
    document.getElementById('insigniaColorHidden').value = '#667eea'; // Default color

    // Hide selected icon display
    const selectedIconDisplay = document.getElementById('selectedIconDisplay');
    if (selectedIconDisplay) {
        selectedIconDisplay.style.display = 'none';
    }

    // Clear icon selection
    const iconOptions = document.querySelectorAll('.icon-option');
    iconOptions.forEach(option => option.classList.remove('selected'));

    // Reset category buttons
    const categoryBtns = document.querySelectorAll('.icon-category-btn');
    categoryBtns.forEach(btn => btn.classList.remove('active'));
    const allCategoryBtn = document.querySelector('.icon-category-btn[data-category="all"]');
    if (allCategoryBtn) allCategoryBtn.classList.add('active');

    // Reset preview
    updateInsigniaPreview();

    // Show modal
    document.getElementById('insigniaModal').classList.add('show');

    // Populate icons (wait a bit for modal to show)
    setTimeout(() => {
        populateIconsGrid('all');
    }, 100);
}

// Open edit insignia modal
function openEditInsigniaModal(insigniaId) {
    const insignia = allInsignias.find(i => i.id === insigniaId);
    if (!insignia) return;

    currentInsigniaForEdit = insignia;

    document.getElementById('insigniaModalTitle').textContent = 'Editar Insignia';
    document.getElementById('insigniaButtonText').textContent = 'Actualizar Insignia';

    // Fill form
    document.getElementById('insigniaNombre').value = insignia.nombre;
    document.getElementById('insigniaCategoria').value = insignia.categoria;
    document.getElementById('insigniaDescripcion').value = insignia.descripcion || '';
    document.getElementById('selectedIcon').value = insignia.icono;

    // Set color in hidden field
    document.getElementById('insigniaColorHidden').value = insignia.color || '#667eea';

    // Select icon
    selectIcon(insignia.icono);

    // Update preview
    updateInsigniaPreview();

    // Show modal
    document.getElementById('insigniaModal').classList.add('show');

    // Populate icons
    populateIconsGrid('all');
}

// Close insignia modal
function closeInsigniaModal_() {
    document.getElementById('insigniaModal').classList.remove('show');
    currentInsigniaForEdit = null;
}

// Handle insignia form submit
async function handleInsigniaFormSubmit(e) {
    e.preventDefault();

    const nombre = document.getElementById('insigniaNombre').value.trim();
    const categoria = document.getElementById('insigniaCategoria').value;
    const descripcion = document.getElementById('insigniaDescripcion').value.trim();
    const icono = document.getElementById('selectedIcon').value;
    const color = document.getElementById('insigniaColorHidden')?.value;

    if (!nombre || !categoria || !icono) {
        showMessage('Por favor completa todos los campos requeridos', 'error');
        return;
    }

    try {
        const submitBtn = document.querySelector('.save-insignia-btn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Guardando...';

        await waitForFirebase();

        const insigniaData = {
            nombre,
            categoria,
            descripcion,
            icono,
            color: color || '#667eea',
            fechaCreacion: currentInsigniaForEdit ? currentInsigniaForEdit.fechaCreacion : window.firebase.firestore.FieldValue.serverTimestamp(),
            fechaActualizacion: window.firebase.firestore.FieldValue.serverTimestamp()
        };

        if (currentInsigniaForEdit) {
            // Update existing insignia
            await window.firebaseDB.collection('insignias').doc(currentInsigniaForEdit.id).update(insigniaData);
            showMessage('Insignia actualizada exitosamente', 'success');
        } else {
            // Create new insignia
            await window.firebaseDB.collection('insignias').add(insigniaData);
            showMessage('Insignia creada exitosamente', 'success');
        }

        closeInsigniaModal_();
        loadInsignias();

    } catch (error) {
        console.error('Error saving insignia:', error);
        showMessage('Error al guardar la insignia', 'error');
    } finally {
        const submitBtn = document.querySelector('.save-insignia-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-save"></i> <span id="insigniaButtonText">Guardar Insignia</span>';
    }
}

// Open delete insignia modal
function openDeleteInsigniaModal_(insigniaId) {
    const insignia = allInsignias.find(i => i.id === insigniaId);
    if (!insignia) return;

    currentInsigniaForDelete = insignia;

    document.getElementById('deleteInsigniaName').textContent = insignia.nombre;
    document.getElementById('deleteInsigniaModal').classList.add('show');
}

// Close delete insignia modal
function closeDeleteInsigniaModal_() {
    document.getElementById('deleteInsigniaModal').classList.remove('show');
    currentInsigniaForDelete = null;
}

// Handle delete insignia
async function handleDeleteInsignia() {
    if (!currentInsigniaForDelete) return;

    try {
        const confirmBtn = document.getElementById('confirmDeleteInsignia');
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Eliminando...';

        await waitForFirebase();

        await window.firebaseDB.collection('insignias').doc(currentInsigniaForDelete.id).delete();

        showMessage('Insignia eliminada exitosamente', 'success');
        closeDeleteInsigniaModal_();
        loadInsignias();

    } catch (error) {
        console.error('Error deleting insignia:', error);
        showMessage('Error al eliminar la insignia', 'error');
    } finally {
        const confirmBtn = document.getElementById('confirmDeleteInsignia');
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = '<i class="bi bi-trash"></i> <span>Eliminar Insignia</span>';
    }
}

// Load insignias for edit user modal
async function loadInsigniasForEdit() {
    const insigniasGridEdit = document.getElementById('insigniasGridEdit');
    if (!insigniasGridEdit) return;

    try {
        insigniasGridEdit.innerHTML = '<div class="loading-insignias"><i class="bi bi-arrow-clockwise spin"></i><p>Cargando insignias...</p></div>';

        await waitForFirebase();

        const insigniasSnapshot = await window.firebaseDB.collection('insignias').orderBy('nombre').get();

        const insignias = [];
        insigniasSnapshot.forEach(doc => {
            insignias.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (insignias.length === 0) {
            insigniasGridEdit.innerHTML = '<p style="text-align: center; color: #666; padding: 1rem;">No hay insignias disponibles. <a href="#" onclick="switchDashboardView(\'insignias\'); return false;" style="color: #667eea;">Crear insignia</a></p>';
            return;
        }

        insigniasGridEdit.innerHTML = '';

        insignias.forEach(insignia => {
            const label = document.createElement('label');
            label.className = 'insignia-checkbox-dynamic';

            // Convert hex to RGB for CSS variable
            const hexToRgb = (hex) => {
                const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '102, 126, 234';
            };

            label.innerHTML = `
                <input type="checkbox" name="insigniaEdit" value="${insignia.id}" data-nombre="${insignia.nombre}">
                <div class="insignia-checkbox-content-dynamic" style="--insignia-color: ${insignia.color}; --insignia-rgb: ${hexToRgb(insignia.color)};">
                    <i class="bi bi-${insignia.icono} insignia-icon-dynamic"></i>
                    <span class="insignia-name-dynamic">${insignia.nombre}</span>
                </div>
            `;

            insigniasGridEdit.appendChild(label);
        });

    } catch (error) {
        console.error('Error loading insignias for edit:', error);
        insigniasGridEdit.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 1rem;">Error al cargar insignias</p>';
    }
}

// Make functions globally available
window.openEditInsigniaModal = openEditInsigniaModal;
window.openDeleteInsigniaModal_ = openDeleteInsigniaModal_;

// Load insignia icons in table
async function loadInsigniaIconsInTable() {
    const insigniasPreviews = document.querySelectorAll('.insignias-preview-icons');
    if (insigniasPreviews.length === 0) return;

    try {
        await waitForFirebase();

        // Get all insignias from Firebase once
        const insigniasSnapshot = await window.firebaseDB.collection('insignias').get();
        const insigniasMap = new Map();

        insigniasSnapshot.forEach(doc => {
            insigniasMap.set(doc.id, doc.data());
        });

        // Update each preview with the actual icons
        insigniasPreviews.forEach(preview => {
            try {
                const userInsignias = JSON.parse(preview.dataset.insignias || '[]');
                const iconsHTML = userInsignias.slice(0, 3).map(ins => {
                    // Support both old format and new format
                    let insigniaData;
                    if (typeof ins === 'string') {
                        // Old format: just emoji or ID
                        insigniaData = insigniasMap.get(ins);
                        if (!insigniaData) {
                            // Fallback to emoji if it's not an ID
                            return ins;
                        }
                    } else if (ins && ins.id) {
                        // New format: object with ID
                        insigniaData = insigniasMap.get(ins.id);
                    } else if (ins && ins.icono) {
                        // Old format: object with emoji icon
                        return ins.icono;
                    }

                    if (insigniaData) {
                        return `<i class="bi bi-${insigniaData.icono}" style="color: ${insigniaData.color || '#667eea'}; font-size: 1rem; margin: 0 2px;" title="${insigniaData.nombre}"></i>`;
                    }
                    return '';
                }).join('');

                preview.innerHTML = iconsHTML || '<span class="text-muted">Sin insignias</span>';
            } catch (error) {
                console.error('Error parsing insignias:', error);
                preview.innerHTML = '<span class="text-muted">Error</span>';
            }
        });

    } catch (error) {
        console.error('Error loading insignia icons:', error);
    }
}

// Initialize insignias management on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeInsigniasManagement();
});


// ==========================================
// INSTITUCIONES MANAGEMENT SYSTEM
// ==========================================

// ImgBB API Configuration for Instituciones
const IMGBB_API_KEY_INST = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL_INST = 'https://api.imgbb.com/1/upload';

let allInstituciones = [];
let currentInstitucionForEdit = null;
let currentInstitucionForDelete = null;

// Initialize Instituciones Management
function initializeInstitucionesManagement() {
    // Create Institucion button
    const createInstitucionBtn = document.getElementById('createInstitucionBtn');
    if (createInstitucionBtn) {
        createInstitucionBtn.addEventListener('click', openCreateInstitucionModal);
    }

    // Back button from instituciones
    const backToTableFromInstituciones = document.getElementById('backToTableFromInstituciones');
    if (backToTableFromInstituciones) {
        backToTableFromInstituciones.addEventListener('click', () => {
            switchDashboardView('dashboard');
        });
    }

    // Modal events
    const closeInstitucionModal = document.getElementById('closeInstitucionModal');
    const cancelInstitucion = document.getElementById('cancelInstitucion');
    const institucionForm = document.getElementById('institucionForm');
    const institucionModal = document.getElementById('institucionModal');

    if (closeInstitucionModal) {
        closeInstitucionModal.addEventListener('click', closeInstitucionModalFn);
    }
    if (cancelInstitucion) {
        cancelInstitucion.addEventListener('click', closeInstitucionModalFn);
    }
    if (institucionForm) {
        institucionForm.addEventListener('submit', handleSaveInstitucion);
    }
    if (institucionModal) {
        institucionModal.addEventListener('click', function (e) {
            if (e.target === institucionModal) {
                closeInstitucionModalFn();
            }
        });
    }

    // Delete modal events
    const closeDeleteInstitucionModal = document.getElementById('closeDeleteInstitucionModal');
    const cancelDeleteInstitucion = document.getElementById('cancelDeleteInstitucion');
    const confirmDeleteInstitucion = document.getElementById('confirmDeleteInstitucion');
    const deleteInstitucionModal = document.getElementById('deleteInstitucionModal');

    if (closeDeleteInstitucionModal) {
        closeDeleteInstitucionModal.addEventListener('click', closeDeleteInstitucionModalFn);
    }
    if (cancelDeleteInstitucion) {
        cancelDeleteInstitucion.addEventListener('click', closeDeleteInstitucionModalFn);
    }
    if (confirmDeleteInstitucion) {
        confirmDeleteInstitucion.addEventListener('click', handleDeleteInstitucion);
    }
    if (deleteInstitucionModal) {
        deleteInstitucionModal.addEventListener('click', function (e) {
            if (e.target === deleteInstitucionModal) {
                closeDeleteInstitucionModalFn();
            }
        });
    }

    // Logo upload events
    const institucionLogoInput = document.getElementById('institucionLogoInput');
    const removeLogoBtn = document.getElementById('removeLogoBtn');

    if (institucionLogoInput) {
        institucionLogoInput.addEventListener('change', handleLogoUpload);
    }
    if (removeLogoBtn) {
        removeLogoBtn.addEventListener('click', handleRemoveLogo);
    }
}

// Load Instituciones for Management
async function loadInstitucionesForManagement() {
    const gridManager = document.getElementById('institucionesGridManager');
    const loadingSpinner = document.getElementById('institucionesLoadingSpinner');
    const noInstituciones = document.getElementById('noInstituciones');

    if (!gridManager) return;

    gridManager.innerHTML = '';
    if (loadingSpinner) loadingSpinner.style.display = 'flex';
    if (noInstituciones) noInstituciones.style.display = 'none';

    try {
        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('instituciones').orderBy('nombre').get();
        allInstituciones = [];

        snapshot.forEach(doc => {
            allInstituciones.push({ id: doc.id, ...doc.data() });
        });

        if (loadingSpinner) loadingSpinner.style.display = 'none';

        if (allInstituciones.length === 0) {
            if (noInstituciones) noInstituciones.style.display = 'flex';
            return;
        }

        // Count students per institution
        const studentsSnapshot = await window.firebaseDB.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        const studentCounts = {};
        studentsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.institucion) {
                studentCounts[data.institucion] = (studentCounts[data.institucion] || 0) + 1;
            }
        });

        // Render instituciones
        allInstituciones.forEach(institucion => {
            const studentCount = studentCounts[institucion.nombre] || 0;
            const card = createInstitucionCard(institucion, studentCount);
            gridManager.appendChild(card);
        });

    } catch (error) {
        console.error('Error loading instituciones:', error);
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        showMessage('Error al cargar instituciones', 'error');
    }
}

// Create Institucion Card
function createInstitucionCard(institucion, studentCount) {
    const card = document.createElement('div');
    card.className = 'institucion-card';
    card.dataset.id = institucion.id;

    const location = [institucion.ciudad, institucion.departamento].filter(Boolean).join(', ');

    card.innerHTML = `
        <div class="institucion-card-header">
            <div class="institucion-logo">
                ${institucion.logoUrl
            ? `<img src="${institucion.logoUrl}" alt="${institucion.nombre}">`
            : `<div class="institucion-logo-placeholder"><i class="bi bi-building"></i></div>`
        }
            </div>
            <div class="institucion-card-title">
                <h3>${institucion.nombre}</h3>
                ${location ? `<span class="location"><i class="bi bi-geo-alt"></i> ${location}</span>` : ''}
            </div>
        </div>
        <div class="institucion-card-body">
            ${institucion.descripcion
            ? `<p class="institucion-description">${institucion.descripcion}</p>`
            : '<p class="institucion-description" style="color: #999; font-style: italic;">Sin descripción</p>'
        }
            <div class="institucion-stats">
                <div class="institucion-stat">
                    <i class="bi bi-people-fill"></i>
                    <span><strong>${studentCount}</strong> estudiantes</span>
                </div>
            </div>
            <div class="institucion-card-actions">
                <button class="edit-institucion-btn" onclick="openEditInstitucionModal('${institucion.id}')">
                    <i class="bi bi-pencil"></i> Editar
                </button>
                <button class="delete-institucion-btn" onclick="openDeleteInstitucionModalFn('${institucion.id}')">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;

    return card;
}

// Open Create Institucion Modal
function openCreateInstitucionModal() {
    currentInstitucionForEdit = null;

    const modal = document.getElementById('institucionModal');
    const title = document.getElementById('institucionModalTitle');
    const buttonText = document.getElementById('institucionButtonText');
    const form = document.getElementById('institucionForm');

    if (title) title.textContent = 'Crear Nueva Institución';
    if (buttonText) buttonText.textContent = 'Guardar Institución';
    if (form) form.reset();

    // Reset logo preview
    resetLogoPreview();

    // Clear hidden fields
    document.getElementById('institucionLogoUrl').value = '';
    document.getElementById('institucionId').value = '';

    if (modal) modal.classList.add('show');
}

// Open Edit Institucion Modal
function openEditInstitucionModal(institucionId) {
    const institucion = allInstituciones.find(i => i.id === institucionId);
    if (!institucion) return;

    currentInstitucionForEdit = institucion;

    const modal = document.getElementById('institucionModal');
    const title = document.getElementById('institucionModalTitle');
    const buttonText = document.getElementById('institucionButtonText');

    if (title) title.textContent = 'Editar Institución';
    if (buttonText) buttonText.textContent = 'Actualizar Institución';

    // Fill form fields
    document.getElementById('institucionNombre').value = institucion.nombre || '';
    document.getElementById('institucionDescripcion').value = institucion.descripcion || '';
    document.getElementById('institucionDepartamento').value = institucion.departamento || '';
    document.getElementById('institucionCiudad').value = institucion.ciudad || '';
    document.getElementById('institucionLogoUrl').value = institucion.logoUrl || '';
    document.getElementById('institucionId').value = institucion.id;

    // Update logo preview
    if (institucion.logoUrl) {
        const logoPreviewImage = document.getElementById('logoPreviewImage');
        const logoPlaceholder = document.getElementById('logoPlaceholder');
        const removeLogoBtn = document.getElementById('removeLogoBtn');

        if (logoPreviewImage) {
            logoPreviewImage.src = institucion.logoUrl;
            logoPreviewImage.style.display = 'block';
        }
        if (logoPlaceholder) logoPlaceholder.style.display = 'none';
        if (removeLogoBtn) removeLogoBtn.style.display = 'flex';
    } else {
        resetLogoPreview();
    }

    if (modal) modal.classList.add('show');
}

// Close Institucion Modal
function closeInstitucionModalFn() {
    const modal = document.getElementById('institucionModal');
    if (modal) modal.classList.remove('show');
    currentInstitucionForEdit = null;
}

// Reset Logo Preview
function resetLogoPreview() {
    const logoPreviewImage = document.getElementById('logoPreviewImage');
    const logoPlaceholder = document.getElementById('logoPlaceholder');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    const logoInput = document.getElementById('institucionLogoInput');

    if (logoPreviewImage) {
        logoPreviewImage.src = '';
        logoPreviewImage.style.display = 'none';
    }
    if (logoPlaceholder) logoPlaceholder.style.display = 'block';
    if (removeLogoBtn) removeLogoBtn.style.display = 'none';
    if (logoInput) logoInput.value = '';

    document.getElementById('institucionLogoUrl').value = '';
}

// Handle Logo Upload
async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showMessage('Por favor selecciona una imagen válida', 'error');
        return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('La imagen no debe superar los 5MB', 'error');
        return;
    }

    try {
        showMessage('Subiendo imagen...', 'info');

        const logoUrl = await uploadImageToImgBBInst(file);

        if (logoUrl) {
            const logoPreviewImage = document.getElementById('logoPreviewImage');
            const logoPlaceholder = document.getElementById('logoPlaceholder');
            const removeLogoBtn = document.getElementById('removeLogoBtn');

            if (logoPreviewImage) {
                logoPreviewImage.src = logoUrl;
                logoPreviewImage.style.display = 'block';
            }
            if (logoPlaceholder) logoPlaceholder.style.display = 'none';
            if (removeLogoBtn) removeLogoBtn.style.display = 'flex';

            document.getElementById('institucionLogoUrl').value = logoUrl;
            showMessage('Imagen subida correctamente', 'success');
        }
    } catch (error) {
        console.error('Error uploading logo:', error);
        showMessage('Error al subir la imagen', 'error');
    }
}

// Upload Image to ImgBB
async function uploadImageToImgBBInst(file) {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${IMGBB_API_URL_INST}?key=${IMGBB_API_KEY_INST}`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (data.success) {
        return data.data.url;
    } else {
        throw new Error('Error al subir imagen a ImgBB');
    }
}

// Handle Remove Logo
function handleRemoveLogo() {
    resetLogoPreview();
    showMessage('Logo eliminado', 'info');
}

// Handle Save Institucion
async function handleSaveInstitucion(e) {
    e.preventDefault();

    const nombre = document.getElementById('institucionNombre').value.trim();
    const descripcion = document.getElementById('institucionDescripcion').value.trim();
    const departamento = document.getElementById('institucionDepartamento').value;
    const ciudad = document.getElementById('institucionCiudad').value.trim();
    const logoUrl = document.getElementById('institucionLogoUrl').value;
    const institucionId = document.getElementById('institucionId').value;

    if (!nombre) {
        showMessage('El nombre de la institución es requerido', 'error');
        return;
    }

    const saveBtn = document.querySelector('.save-institucion-btn');
    if (saveBtn) saveBtn.disabled = true;

    try {
        await waitForFirebase();

        const institucionData = {
            nombre,
            descripcion,
            departamento,
            ciudad,
            logoUrl,
            updatedAt: new Date().toISOString()
        };

        if (institucionId) {
            // Update existing
            await window.firebaseDB.collection('instituciones').doc(institucionId).update(institucionData);
            showMessage('Institución actualizada correctamente', 'success');
        } else {
            // Create new
            institucionData.createdAt = new Date().toISOString();
            await window.firebaseDB.collection('instituciones').add(institucionData);
            showMessage('Institución creada correctamente', 'success');
        }

        closeInstitucionModalFn();
        loadInstitucionesForManagement();

    } catch (error) {
        console.error('Error saving institucion:', error);
        showMessage('Error al guardar la institución', 'error');
    } finally {
        if (saveBtn) saveBtn.disabled = false;
    }
}

// Open Delete Institucion Modal
function openDeleteInstitucionModalFn(institucionId) {
    const institucion = allInstituciones.find(i => i.id === institucionId);
    if (!institucion) return;

    currentInstitucionForDelete = institucion;

    const modal = document.getElementById('deleteInstitucionModal');
    const nameEl = document.getElementById('deleteInstitucionName');

    if (nameEl) nameEl.textContent = institucion.nombre;
    if (modal) modal.classList.add('show');
}

// Close Delete Institucion Modal
function closeDeleteInstitucionModalFn() {
    const modal = document.getElementById('deleteInstitucionModal');
    if (modal) modal.classList.remove('show');
    currentInstitucionForDelete = null;
}

// Handle Delete Institucion
async function handleDeleteInstitucion() {
    if (!currentInstitucionForDelete) return;

    const confirmBtn = document.getElementById('confirmDeleteInstitucion');
    if (confirmBtn) confirmBtn.disabled = true;

    try {
        await waitForFirebase();

        await window.firebaseDB.collection('instituciones').doc(currentInstitucionForDelete.id).delete();

        showMessage('Institución eliminada correctamente', 'success');
        closeDeleteInstitucionModalFn();
        loadInstitucionesForManagement();

    } catch (error) {
        console.error('Error deleting institucion:', error);
        showMessage('Error al eliminar la institución', 'error');
    } finally {
        if (confirmBtn) confirmBtn.disabled = false;
    }
}

// Make functions globally available
window.openEditInstitucionModal = openEditInstitucionModal;
window.openDeleteInstitucionModalFn = openDeleteInstitucionModalFn;

// Initialize instituciones management on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeInstitucionesManagement();
    // Create default instituciones if none exist
    createDefaultInstituciones();
});

// Create default instituciones
async function createDefaultInstituciones() {
    try {
        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('instituciones').limit(1).get();

        if (snapshot.empty) {
            // Create default instituciones
            const defaultInstituciones = [
                {
                    nombre: 'IETAC',
                    descripcion: 'Institución Educativa Técnico Agropecuario Claret Tierradentro Córdoba',
                    departamento: 'Córdoba',
                    ciudad: 'Tierradentro',
                    logoUrl: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    nombre: 'SEAMOSGENIOS',
                    descripcion: 'Seamos Genios - Plataforma Educativa para preparación de pruebas Saber 11',
                    departamento: '',
                    ciudad: '',
                    logoUrl: '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];

            for (const inst of defaultInstituciones) {
                await window.firebaseDB.collection('instituciones').add(inst);
            }

            console.log('Default instituciones created');
        }
    } catch (error) {
        console.error('Error creating default instituciones:', error);
    }
}

// ============================================
// COORDINADORES MANAGEMENT SYSTEM
// ============================================

let allCoordinadores = [];
let currentCoordinadorForEdit = null;
let currentCoordinadorForDelete = null;

// Initialize coordinadores management
function initializeCoordinadoresManagement() {
    const createCoordinadorBtn = document.getElementById('createCoordinadorBtn');
    const closeCoordinadorModal = document.getElementById('closeCoordinadorModal');
    const cancelCoordinador = document.getElementById('cancelCoordinador');
    const coordinadorForm = document.getElementById('coordinadorForm');
    const toggleCoordinadorPassword = document.getElementById('toggleCoordinadorPassword');

    // Delete modal elements
    const closeDeleteCoordinadorModal = document.getElementById('closeDeleteCoordinadorModal');
    const cancelDeleteCoordinador = document.getElementById('cancelDeleteCoordinador');
    const confirmDeleteCoordinador = document.getElementById('confirmDeleteCoordinador');
    const deleteCoordinadorModal = document.getElementById('deleteCoordinadorModal');

    if (createCoordinadorBtn) {
        createCoordinadorBtn.addEventListener('click', openCreateCoordinadorModal);
    }

    if (closeCoordinadorModal) {
        closeCoordinadorModal.addEventListener('click', closeCoordinadorModalFn);
    }

    if (cancelCoordinador) {
        cancelCoordinador.addEventListener('click', closeCoordinadorModalFn);
    }

    if (coordinadorForm) {
        coordinadorForm.addEventListener('submit', handleCoordinadorSubmit);
    }

    if (toggleCoordinadorPassword) {
        toggleCoordinadorPassword.addEventListener('click', () => {
            togglePasswordVisibility('coordinadorPassword', 'toggleCoordinadorPassword');
        });
    }

    // Delete modal events
    if (closeDeleteCoordinadorModal) {
        closeDeleteCoordinadorModal.addEventListener('click', closeDeleteCoordinadorModalFn);
    }

    if (cancelDeleteCoordinador) {
        cancelDeleteCoordinador.addEventListener('click', closeDeleteCoordinadorModalFn);
    }

    if (confirmDeleteCoordinador) {
        confirmDeleteCoordinador.addEventListener('click', handleDeleteCoordinador);
    }

    if (deleteCoordinadorModal) {
        deleteCoordinadorModal.addEventListener('click', function (e) {
            if (e.target === deleteCoordinadorModal) {
                closeDeleteCoordinadorModalFn();
            }
        });
    }

    // Modal outside click
    const coordinadorModal = document.getElementById('coordinadorModal');
    if (coordinadorModal) {
        coordinadorModal.addEventListener('click', function (e) {
            if (e.target === coordinadorModal) {
                closeCoordinadorModalFn();
            }
        });
    }

    // Clean username field for coordinadores
    const coordinadorUsuario = document.getElementById('coordinadorUsuario');
    if (coordinadorUsuario) {
        coordinadorUsuario.addEventListener('input', function (e) {
            cleanUsernameField(e.target);
        });
    }
}

// Load coordinadores from Firebase
async function loadCoordinadores() {
    const loadingSpinner = document.getElementById('coordinadoresLoadingSpinner');
    const noCoordinadores = document.getElementById('noCoordinadores');
    const tableBody = document.getElementById('coordinadoresTableBody');

    try {
        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (noCoordinadores) noCoordinadores.style.display = 'none';
        if (tableBody) tableBody.innerHTML = '';

        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('usuarios')
            .where('rol', '==', 'coordinador')
            .get();

        allCoordinadores = [];
        snapshot.forEach(doc => {
            allCoordinadores.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by creation date (newest first)
        allCoordinadores.sort((a, b) => {
            const dateA = a.fechaCreacion ? a.fechaCreacion.toDate() : new Date(0);
            const dateB = b.fechaCreacion ? b.fechaCreacion.toDate() : new Date(0);
            return dateB - dateA;
        });

        if (loadingSpinner) loadingSpinner.style.display = 'none';

        if (allCoordinadores.length === 0) {
            if (noCoordinadores) noCoordinadores.style.display = 'block';
        } else {
            renderCoordinadores();
        }

    } catch (error) {
        console.error('Error loading coordinadores:', error);
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        showMessage('Error al cargar coordinadores', 'error');
    }
}

// Render coordinadores table
function renderCoordinadores() {
    const tableBody = document.getElementById('coordinadoresTableBody');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    allCoordinadores.forEach(coordinador => {
        const row = document.createElement('tr');

        // Add inactive class if coordinator is not active
        if (!coordinador.activo) {
            row.classList.add('inactive');
        }

        const creationDate = coordinador.fechaCreacion ?
            coordinador.fechaCreacion.toDate().toLocaleDateString('es-ES') :
            'No disponible';

        row.innerHTML = `
            <td>
                <div class="user-name-with-photo">
                    <div class="table-user-avatar">
                        ${coordinador.fotoPerfil ?
                `<img src="${coordinador.fotoPerfil}" alt="${coordinador.nombre}" class="table-avatar-image">` :
                `<div class="table-avatar-default" style="background: linear-gradient(135deg, #17a2b8, #138496);">
                                <i class="bi bi-person-workspace"></i>
                            </div>`
            }
                    </div>
                    <span class="user-name-text">${coordinador.nombre || 'No especificado'}</span>
                </div>
            </td>
            <td>
                <div class="user-email">
                    <strong>${coordinador.usuario || 'No especificado'}</strong>
                </div>
            </td>
            <td>${coordinador.institucion || 'No asignada'}</td>
            <td>
                <span class="status-badge ${coordinador.activo ? 'active' : 'inactive'}">
                    ${coordinador.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>${creationDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-coordinador-btn" 
                            onclick="openEditCoordinadorModal('${coordinador.id}')"
                            title="Editar coordinador">
                        <i class="bi bi-pencil-square"></i>
                    </button>
                    <button class="action-btn toggle-coordinador-btn ${coordinador.activo ? 'deactivate' : ''}" 
                            onclick="toggleCoordinadorStatus('${coordinador.id}', ${coordinador.activo})"
                            title="${coordinador.activo ? 'Desactivar' : 'Activar'}">
                        <i class="bi bi-${coordinador.activo ? 'person-x' : 'person-check'}"></i>
                    </button>
                    <button class="action-btn delete-coordinador-btn" 
                            onclick="openDeleteCoordinadorModal('${coordinador.id}')"
                            title="Eliminar coordinador">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// Open create coordinador modal
function openCreateCoordinadorModal() {
    const modal = document.getElementById('coordinadorModal');
    const form = document.getElementById('coordinadorForm');
    const title = document.getElementById('coordinadorModalTitle');
    const buttonText = document.getElementById('coordinadorButtonText');
    const passwordField = document.getElementById('coordinadorPassword');

    if (form) form.reset();
    if (title) title.textContent = 'Crear Nuevo Coordinador';
    if (buttonText) buttonText.textContent = 'Crear Coordinador';
    if (passwordField) {
        passwordField.required = true;
        passwordField.parentElement.parentElement.style.display = 'flex';
    }

    document.getElementById('coordinadorId').value = '';
    currentCoordinadorForEdit = null;

    // Load instituciones for selector
    loadInstitucionesForCoordinadorSelector();

    if (modal) modal.classList.add('show');
}

// Open edit coordinador modal
async function openEditCoordinadorModal(coordinadorId) {
    const coordinador = allCoordinadores.find(c => c.id === coordinadorId);
    if (!coordinador) {
        showMessage('Coordinador no encontrado', 'error');
        return;
    }

    currentCoordinadorForEdit = coordinador;

    const modal = document.getElementById('coordinadorModal');
    const title = document.getElementById('coordinadorModalTitle');
    const buttonText = document.getElementById('coordinadorButtonText');
    const passwordField = document.getElementById('coordinadorPassword');

    if (title) title.textContent = 'Editar Coordinador';
    if (buttonText) buttonText.textContent = 'Guardar Cambios';

    // Password not required for edit
    if (passwordField) {
        passwordField.required = false;
        passwordField.value = '';
        passwordField.placeholder = 'Dejar vacío';
    }

    document.getElementById('coordinadorId').value = coordinador.id;
    document.getElementById('coordinadorNombre').value = coordinador.nombre || '';

    // Extract username without domain
    let username = coordinador.usuario || '';
    if (username.includes('@')) {
        username = username.split('@')[0];
    }
    document.getElementById('coordinadorUsuario').value = username;

    document.getElementById('coordinadorTelefono').value = coordinador.telefono || '';
    document.getElementById('coordinadorEmailRecuperacion').value = coordinador.emailRecuperacion || '';

    // Load instituciones and set selected
    await loadInstitucionesForCoordinadorSelector();
    document.getElementById('coordinadorInstitucion').value = coordinador.institucion || '';

    if (modal) modal.classList.add('show');
}

// Load instituciones for coordinador selector
async function loadInstitucionesForCoordinadorSelector() {
    const select = document.getElementById('coordinadorInstitucion');
    if (!select) return;

    try {
        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('instituciones').orderBy('nombre').get();

        select.innerHTML = '<option value="">Seleccione una Institución</option>';

        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = data.nombre;
            option.textContent = data.nombre;
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading instituciones for coordinador:', error);
    }
}

// Close coordinador modal
function closeCoordinadorModalFn() {
    const modal = document.getElementById('coordinadorModal');
    if (modal) modal.classList.remove('show');
    currentCoordinadorForEdit = null;
}

// Handle coordinador form submit
async function handleCoordinadorSubmit(e) {
    e.preventDefault();

    const coordinadorId = document.getElementById('coordinadorId').value;
    const nombre = document.getElementById('coordinadorNombre').value.trim();
    let usuario = document.getElementById('coordinadorUsuario').value.trim();
    const password = document.getElementById('coordinadorPassword').value;
    const institucion = document.getElementById('coordinadorInstitucion').value;
    const telefono = document.getElementById('coordinadorTelefono').value.trim();
    const emailRecuperacion = document.getElementById('coordinadorEmailRecuperacion').value.trim();

    // Validation
    if (!nombre || !usuario || !institucion) {
        showMessage('Por favor complete todos los campos requeridos', 'error');
        return;
    }

    if (!coordinadorId && !password) {
        showMessage('La contraseña es requerida para crear un coordinador', 'error');
        return;
    }

    if (password && password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }

    // Add domain to username if not present
    if (!usuario.includes('@')) {
        usuario = usuario + '@seamosgenios.com';
    }

    try {
        await waitForFirebase();

        // Check if username already exists (for new coordinadores or if username changed)
        if (!coordinadorId || (currentCoordinadorForEdit && currentCoordinadorForEdit.usuario !== usuario)) {
            const existingUser = await window.firebaseDB.collection('usuarios')
                .where('usuario', '==', usuario)
                .get();

            if (!existingUser.empty) {
                showMessage('Este nombre de usuario ya está en uso', 'error');
                return;
            }
        }

        // Get departamento from the selected institucion
        let departamento = '';
        try {
            const instSnapshot = await window.firebaseDB.collection('instituciones')
                .where('nombre', '==', institucion)
                .limit(1)
                .get();

            if (!instSnapshot.empty) {
                departamento = instSnapshot.docs[0].data().departamento || '';
            }
        } catch (err) {
            console.error('Error getting institucion departamento:', err);
        }

        const coordinadorData = {
            nombre: nombre,
            usuario: usuario,
            institucion: institucion,
            departamento: departamento,
            telefono: telefono,
            emailRecuperacion: emailRecuperacion,
            tipoUsuario: 'admin',
            rol: 'coordinador',
            activo: true,
            updatedAt: new Date().toISOString()
        };

        if (password) {
            coordinadorData.password = password;
            coordinadorData.codigoRecuperacion = generateRecoveryCode();
        }

        if (coordinadorId) {
            // Update existing coordinador
            await window.firebaseDB.collection('usuarios').doc(coordinadorId).update(coordinadorData);
            showMessage('Coordinador actualizado exitosamente', 'success');
        } else {
            // Create new coordinador
            coordinadorData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            coordinadorData.createdAt = new Date().toISOString();
            await window.firebaseDB.collection('usuarios').add(coordinadorData);
            showMessage('Coordinador creado exitosamente', 'success');
        }

        closeCoordinadorModalFn();
        loadCoordinadores();
        loadUsers(); // Refresh main users list too

    } catch (error) {
        console.error('Error saving coordinador:', error);
        showMessage('Error al guardar el coordinador', 'error');
    }
}

// Toggle coordinador status
async function toggleCoordinadorStatus(coordinadorId, currentStatus) {
    try {
        await waitForFirebase();

        await window.firebaseDB.collection('usuarios').doc(coordinadorId).update({
            activo: !currentStatus,
            updatedAt: new Date().toISOString()
        });

        showMessage(`Coordinador ${!currentStatus ? 'activado' : 'desactivado'} exitosamente`, 'success');
        loadCoordinadores();
        loadUsers();

    } catch (error) {
        console.error('Error toggling coordinador status:', error);
        showMessage('Error al cambiar el estado del coordinador', 'error');
    }
}

// Open delete coordinador modal
function openDeleteCoordinadorModal(coordinadorId) {
    const coordinador = allCoordinadores.find(c => c.id === coordinadorId);
    if (!coordinador) {
        showMessage('Coordinador no encontrado', 'error');
        return;
    }

    currentCoordinadorForDelete = coordinador;

    const modal = document.getElementById('deleteCoordinadorModal');
    const nameElement = document.getElementById('deleteCoordinadorName');

    if (nameElement) nameElement.textContent = coordinador.nombre;
    if (modal) modal.classList.add('show');
}

// Close delete coordinador modal
function closeDeleteCoordinadorModalFn() {
    const modal = document.getElementById('deleteCoordinadorModal');
    if (modal) modal.classList.remove('show');
    currentCoordinadorForDelete = null;
}

// Handle delete coordinador
async function handleDeleteCoordinador() {
    if (!currentCoordinadorForDelete) return;

    try {
        await waitForFirebase();

        await window.firebaseDB.collection('usuarios').doc(currentCoordinadorForDelete.id).delete();

        showMessage('Coordinador eliminado exitosamente', 'success');
        closeDeleteCoordinadorModalFn();
        loadCoordinadores();
        loadUsers();

    } catch (error) {
        console.error('Error deleting coordinador:', error);
        showMessage('Error al eliminar el coordinador', 'error');
    }
}

// Make coordinador functions globally available
window.openEditCoordinadorModal = openEditCoordinadorModal;
window.openDeleteCoordinadorModal = openDeleteCoordinadorModal;
window.toggleCoordinadorStatus = toggleCoordinadorStatus;

// Initialize coordinadores management on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeCoordinadoresManagement();
});


// ==========================================
// AULAS MANAGEMENT SYSTEM
// ==========================================

let allAulas = [];
let currentAulaForEdit = null;
let currentAulaForDelete = null;

// Initialize Aulas Management
function initializeAulasManagement() {
    const createAulaBtn = document.getElementById('createAulaBtn');
    const closeAulaModal = document.getElementById('closeAulaModal');
    const cancelAula = document.getElementById('cancelAula');
    const aulaForm = document.getElementById('aulaForm');
    const closeDeleteAulaModal = document.getElementById('closeDeleteAulaModal');
    const cancelDeleteAula = document.getElementById('cancelDeleteAula');
    const confirmDeleteAula = document.getElementById('confirmDeleteAula');

    if (createAulaBtn) {
        createAulaBtn.addEventListener('click', openCreateAulaModal);
    }

    if (closeAulaModal) {
        closeAulaModal.addEventListener('click', closeAulaModalFn);
    }

    if (cancelAula) {
        cancelAula.addEventListener('click', closeAulaModalFn);
    }

    if (aulaForm) {
        aulaForm.addEventListener('submit', handleSaveAula);
    }

    if (closeDeleteAulaModal) {
        closeDeleteAulaModal.addEventListener('click', closeDeleteAulaModalFn);
    }

    if (cancelDeleteAula) {
        cancelDeleteAula.addEventListener('click', closeDeleteAulaModalFn);
    }

    if (confirmDeleteAula) {
        confirmDeleteAula.addEventListener('click', handleDeleteAula);
    }

    // Close modals on outside click
    const aulaModal = document.getElementById('aulaModal');
    const deleteAulaModal = document.getElementById('deleteAulaModal');

    if (aulaModal) {
        aulaModal.addEventListener('click', function (e) {
            if (e.target === aulaModal) closeAulaModalFn();
        });
    }

    if (deleteAulaModal) {
        deleteAulaModal.addEventListener('click', function (e) {
            if (e.target === deleteAulaModal) closeDeleteAulaModalFn();
        });
    }

    // Populate institucion selector for aulas
    populateAulaInstitucionSelector();
}

// Populate institucion selector in aula modal
function populateAulaInstitucionSelector() {
    const aulaInstitucionSelect = document.getElementById('aulaInstitucion');
    if (!aulaInstitucionSelect) return;

    const optionsHTML = institucionesDisponibles.map(inst =>
        `<option value="${inst.nombre}">${inst.nombre}</option>`
    ).join('');

    aulaInstitucionSelect.innerHTML = '<option value="">Todas las instituciones</option>' + optionsHTML;
}

// Load Aulas from Firebase
async function loadAulas() {
    try {
        const loadingSpinner = document.getElementById('aulasLoadingSpinner');
        const noAulas = document.getElementById('noAulas');
        const aulasGrid = document.getElementById('aulasGridManager');

        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (noAulas) noAulas.style.display = 'none';
        if (aulasGrid) aulasGrid.innerHTML = '';

        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('aulas').orderBy('nombre').get();
        allAulas = [];

        snapshot.forEach(doc => {
            allAulas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (loadingSpinner) loadingSpinner.style.display = 'none';

        if (allAulas.length === 0) {
            if (noAulas) noAulas.style.display = 'block';
        } else {
            renderAulas();
        }

    } catch (error) {
        console.error('Error loading aulas:', error);
        const loadingSpinner = document.getElementById('aulasLoadingSpinner');
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        showMessage('Error al cargar las aulas', 'error');
    }
}

// Render Aulas Grid
function renderAulas() {
    const aulasGrid = document.getElementById('aulasGridManager');
    if (!aulasGrid) return;

    aulasGrid.innerHTML = '';

    const materiasConfig = {
        'anuncios': { nombre: 'Anuncios', icon: 'bi-megaphone' },
        'matematicas': { nombre: 'Matemáticas', icon: 'bi-calculator' },
        'lectura': { nombre: 'Lectura Crítica', icon: 'bi-book' },
        'sociales': { nombre: 'C. Sociales', icon: 'bi-globe' },
        'naturales': { nombre: 'C. Naturales', icon: 'bi-tree' },
        'ingles': { nombre: 'Inglés', icon: 'bi-translate' }
    };

    allAulas.forEach(aula => {
        const card = document.createElement('div');
        card.className = 'aula-card';

        const color = aula.color || '#667eea';
        const materias = aula.materias || [];

        const materiasHTML = materias.map(materia => {
            const config = materiasConfig[materia] || { nombre: materia, icon: 'bi-book' };
            return `<span class="aula-materia-badge ${materia}">
                <i class="bi ${config.icon}"></i>
                ${config.nombre}
            </span>`;
        }).join('');

        card.innerHTML = `
            <div class="aula-card-header" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -30)});">
                <h3><i class="bi bi-door-open-fill"></i> ${aula.nombre}</h3>
                ${aula.descripcion ? `<p>${aula.descripcion}</p>` : ''}
            </div>
            <div class="aula-card-body">
                <div class="aula-materias">
                    ${materiasHTML || '<span class="text-muted">Sin materias asignadas</span>'}
                </div>
                <div class="aula-info">
                    ${aula.institucion ? `<div class="aula-info-item"><i class="bi bi-building"></i> ${aula.institucion}</div>` : ''}
                    ${aula.grado ? `<div class="aula-info-item"><i class="bi bi-mortarboard"></i> ${aula.grado}</div>` : ''}
                    <div class="aula-info-item"><i class="bi bi-collection"></i> ${materias.length} materia${materias.length !== 1 ? 's' : ''}</div>
                </div>
                <div class="aula-card-actions">
                    <button class="aula-action-btn aula-edit-btn" onclick="openEditAulaModal('${aula.id}')">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="aula-action-btn aula-delete-btn" onclick="openDeleteAulaModal('${aula.id}')">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `;

        aulasGrid.appendChild(card);
    });
}

// Adjust color brightness
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Open Create Aula Modal
function openCreateAulaModal() {
    currentAulaForEdit = null;

    const modal = document.getElementById('aulaModal');
    const title = document.getElementById('aulaModalTitle');
    const buttonText = document.getElementById('aulaButtonText');
    const form = document.getElementById('aulaForm');

    if (title) title.textContent = 'Crear Nueva Aula';
    if (buttonText) buttonText.textContent = 'Crear Aula';
    if (form) form.reset();

    // Reset checkboxes
    document.querySelectorAll('input[name="materiaAula"]').forEach(cb => cb.checked = false);
    document.querySelector('input[name="colorAula"][value="#667eea"]').checked = true;

    document.getElementById('aulaId').value = '';

    // Refresh institucion selector
    populateAulaInstitucionSelector();

    // Load estudiantes for assignment
    loadEstudiantesForAulaModal([]);

    if (modal) modal.classList.add('show');
}

// Open Edit Aula Modal
async function openEditAulaModal(aulaId) {
    const aula = allAulas.find(a => a.id === aulaId);
    if (!aula) {
        showMessage('Aula no encontrada', 'error');
        return;
    }

    currentAulaForEdit = aula;

    const modal = document.getElementById('aulaModal');
    const title = document.getElementById('aulaModalTitle');
    const buttonText = document.getElementById('aulaButtonText');

    if (title) title.textContent = 'Editar Aula';
    if (buttonText) buttonText.textContent = 'Guardar Cambios';

    // Fill form with null checks
    const aulaNombre = document.getElementById('aulaNombre');
    const aulaDescripcion = document.getElementById('aulaDescripcion');
    const aulaInstitucion = document.getElementById('aulaInstitucion');
    const aulaGrado = document.getElementById('aulaGrado');
    const aulaIdField = document.getElementById('aulaId');

    if (aulaNombre) aulaNombre.value = aula.nombre || '';
    if (aulaDescripcion) aulaDescripcion.value = aula.descripcion || '';
    if (aulaInstitucion) aulaInstitucion.value = aula.institucion || '';
    if (aulaGrado) aulaGrado.value = aula.grado || '';
    if (aulaIdField) aulaIdField.value = aula.id;

    // Set materias
    const materias = aula.materias || [];
    document.querySelectorAll('input[name="materiaAula"]').forEach(cb => {
        cb.checked = materias.includes(cb.value);
    });

    // Set color
    const colorRadio = document.querySelector(`input[name="colorAula"][value="${aula.color || '#667eea'}"]`);
    if (colorRadio) {
        colorRadio.checked = true;
    } else {
        const defaultColor = document.querySelector('input[name="colorAula"][value="#667eea"]');
        if (defaultColor) defaultColor.checked = true;
    }

    // Refresh institucion selector
    populateAulaInstitucionSelector();
    if (aulaInstitucion) aulaInstitucion.value = aula.institucion || '';

    // Load estudiantes and get those assigned to this aula
    await loadEstudiantesForAulaModal([], aulaId);

    if (modal) modal.classList.add('show');
}

// Close Aula Modal
function closeAulaModalFn() {
    const modal = document.getElementById('aulaModal');
    if (modal) modal.classList.remove('show');
    currentAulaForEdit = null;
}

// Handle Save Aula
async function handleSaveAula(e) {
    e.preventDefault();

    const aulaNombreEl = document.getElementById('aulaNombre');
    const aulaDescripcionEl = document.getElementById('aulaDescripcion');
    const aulaInstitucionEl = document.getElementById('aulaInstitucion');
    const aulaGradoEl = document.getElementById('aulaGrado');
    const aulaIdEl = document.getElementById('aulaId');

    const nombre = aulaNombreEl ? aulaNombreEl.value.trim() : '';
    const descripcion = aulaDescripcionEl ? aulaDescripcionEl.value.trim() : '';
    const institucion = aulaInstitucionEl ? aulaInstitucionEl.value : '';
    const grado = aulaGradoEl ? aulaGradoEl.value : '';
    const aulaId = aulaIdEl ? aulaIdEl.value : '';
    const color = document.querySelector('input[name="colorAula"]:checked')?.value || '#667eea';

    // Get selected materias
    const materias = [];
    document.querySelectorAll('input[name="materiaAula"]:checked').forEach(cb => {
        materias.push(cb.value);
    });

    // Get selected estudiantes
    const estudiantesSeleccionados = [];
    document.querySelectorAll('input[name="estudianteAula"]:checked').forEach(cb => {
        estudiantesSeleccionados.push(cb.value);
    });

    // Validation
    if (!nombre) {
        showMessage('El nombre del aula es obligatorio', 'error');
        return;
    }

    if (materias.length === 0) {
        showMessage('Debes seleccionar al menos una materia', 'error');
        return;
    }

    try {
        await waitForFirebase();

        const aulaData = {
            nombre,
            descripcion,
            institucion,
            grado,
            materias,
            color,
            updatedAt: new Date().toISOString()
        };

        let finalAulaId = aulaId;

        if (aulaId) {
            // Update existing aula
            await window.firebaseDB.collection('aulas').doc(aulaId).update(aulaData);
        } else {
            // Create new aula
            aulaData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            aulaData.createdAt = new Date().toISOString();
            const newAulaRef = await window.firebaseDB.collection('aulas').add(aulaData);
            finalAulaId = newAulaRef.id;
        }

        // Update estudiantes assignments
        await updateEstudiantesAulaAssignments(finalAulaId, estudiantesSeleccionados);

        showMessage(aulaId ? 'Aula actualizada exitosamente' : 'Aula creada exitosamente', 'success');
        closeAulaModalFn();
        loadAulas();
        loadUsers(); // Refresh users to show updated aula assignments

    } catch (error) {
        console.error('Error saving aula:', error);
        showMessage('Error al guardar el aula', 'error');
    }
}

// Update estudiantes aula assignments
async function updateEstudiantesAulaAssignments(aulaId, estudiantesSeleccionados) {
    try {
        // Get all estudiantes
        const estudiantesSnapshot = await window.firebaseDB.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        const batch = window.firebaseDB.batch();

        estudiantesSnapshot.forEach(doc => {
            const estudianteId = doc.id;
            const estudianteData = doc.data();
            const aulasActuales = estudianteData.aulasAsignadas || [];

            const debeEstarAsignado = estudiantesSeleccionados.includes(estudianteId);
            const estaAsignado = aulasActuales.includes(aulaId);

            if (debeEstarAsignado && !estaAsignado) {
                // Add aula to estudiante
                batch.update(doc.ref, {
                    aulasAsignadas: [...aulasActuales, aulaId]
                });
            } else if (!debeEstarAsignado && estaAsignado) {
                // Remove aula from estudiante
                batch.update(doc.ref, {
                    aulasAsignadas: aulasActuales.filter(id => id !== aulaId)
                });
            }
        });

        await batch.commit();
    } catch (error) {
        console.error('Error updating estudiantes assignments:', error);
        throw error;
    }
}

// Open Delete Aula Modal
function openDeleteAulaModal(aulaId) {
    const aula = allAulas.find(a => a.id === aulaId);
    if (!aula) {
        showMessage('Aula no encontrada', 'error');
        return;
    }

    currentAulaForDelete = aula;

    const modal = document.getElementById('deleteAulaModal');
    const nameElement = document.getElementById('deleteAulaName');

    if (nameElement) nameElement.textContent = aula.nombre;
    if (modal) modal.classList.add('show');
}

// Close Delete Aula Modal
function closeDeleteAulaModalFn() {
    const modal = document.getElementById('deleteAulaModal');
    if (modal) modal.classList.remove('show');
    currentAulaForDelete = null;
}

// Handle Delete Aula
async function handleDeleteAula() {
    if (!currentAulaForDelete) return;

    try {
        await waitForFirebase();

        await window.firebaseDB.collection('aulas').doc(currentAulaForDelete.id).delete();

        showMessage('Aula eliminada exitosamente', 'success');
        closeDeleteAulaModalFn();
        loadAulas();

    } catch (error) {
        console.error('Error deleting aula:', error);
        showMessage('Error al eliminar el aula', 'error');
    }
}

// Make aula functions globally available
window.openEditAulaModal = openEditAulaModal;
window.openDeleteAulaModal = openDeleteAulaModal;

// Initialize aulas management on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeAulasManagement();
});


// ==========================================
// AULAS PERMISOS FUNCTIONS (for student forms)
// ==========================================

// Load aulas for create user form
async function loadAulasForCreateForm() {
    const grid = document.getElementById('aulasPermisosCreateGrid');
    const noAulasMsg = document.getElementById('noAulasCreateMsg');

    if (!grid) return;

    // Show loading
    grid.innerHTML = `
        <div class="loading-aulas-msg">
            <i class="bi bi-arrow-clockwise spin"></i>
            <span>Cargando aulas disponibles...</span>
        </div>
    `;
    if (noAulasMsg) noAulasMsg.style.display = 'none';

    try {
        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('aulas').orderBy('nombre').get();
        const aulas = [];

        snapshot.forEach(doc => {
            aulas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (aulas.length === 0) {
            grid.innerHTML = '';
            if (noAulasMsg) noAulasMsg.style.display = 'flex';
            return;
        }

        renderAulasCheckboxes(grid, aulas, 'aulaPermisoCreate', []);

    } catch (error) {
        console.error('Error loading aulas for create form:', error);
        grid.innerHTML = '<div class="loading-aulas-msg"><i class="bi bi-exclamation-triangle"></i><span>Error al cargar aulas</span></div>';
    }
}

// Load aulas for edit user form
async function loadAulasForEditForm(selectedAulas = []) {
    const grid = document.getElementById('aulasPermisosEditGrid');
    const noAulasMsg = document.getElementById('noAulasEditMsg');

    if (!grid) return;

    // Show loading
    grid.innerHTML = `
        <div class="loading-aulas-msg">
            <i class="bi bi-arrow-clockwise spin"></i>
            <span>Cargando aulas disponibles...</span>
        </div>
    `;
    if (noAulasMsg) noAulasMsg.style.display = 'none';

    try {
        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('aulas').orderBy('nombre').get();
        const aulas = [];

        snapshot.forEach(doc => {
            aulas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (aulas.length === 0) {
            grid.innerHTML = '';
            if (noAulasMsg) noAulasMsg.style.display = 'flex';
            return;
        }

        renderAulasCheckboxes(grid, aulas, 'aulaPermisoEdit', selectedAulas);

    } catch (error) {
        console.error('Error loading aulas for edit form:', error);
        grid.innerHTML = '<div class="loading-aulas-msg"><i class="bi bi-exclamation-triangle"></i><span>Error al cargar aulas</span></div>';
    }
}

// Render aulas checkboxes
function renderAulasCheckboxes(container, aulas, inputName, selectedAulas = []) {
    const materiasConfig = {
        'anuncios': { nombre: 'ANU', color: '#1a1a1a' },
        'matematicas': { nombre: 'MAT', color: '#2196F3' },
        'lectura': { nombre: 'LEC', color: '#F44336' },
        'sociales': { nombre: 'SOC', color: '#FF9800' },
        'naturales': { nombre: 'NAT', color: '#4CAF50' },
        'ingles': { nombre: 'ING', color: '#9C27B0' }
    };

    container.innerHTML = '';

    aulas.forEach(aula => {
        const isChecked = selectedAulas.includes(aula.id);
        const color = aula.color || '#667eea';
        const materias = aula.materias || [];

        const materiasHTML = materias.map(materiaId => {
            const config = materiasConfig[materiaId] || { nombre: '?', color: '#666' };
            return `<span class="aula-mini-badge" style="background: ${config.color};">${config.nombre}</span>`;
        }).join('');

        const checkboxHTML = `
            <label class="aula-permiso-checkbox">
                <input type="checkbox" name="${inputName}" value="${aula.id}" ${isChecked ? 'checked' : ''}>
                <div class="aula-checkbox-content" style="--aula-color: ${color};">
                    <div class="aula-checkbox-header">
                        <i class="bi bi-door-open-fill" style="color: ${color};"></i>
                        <span>${aula.nombre}</span>
                    </div>
                    <div class="aula-checkbox-materias">
                        ${materiasHTML || '<span style="color: #999; font-size: 0.7rem;">Sin materias</span>'}
                    </div>
                </div>
            </label>
        `;

        container.insertAdjacentHTML('beforeend', checkboxHTML);
    });
}


// ==========================================
// ESTUDIANTES ASSIGNMENT IN AULA MODAL
// ==========================================

let allEstudiantesForAula = [];

// Load estudiantes for aula modal
async function loadEstudiantesForAulaModal(preselectedIds = [], aulaId = null) {
    const grid = document.getElementById('estudiantesAulaGrid');
    const institucionSelect = document.getElementById('aulaAsignarInstitucion');

    if (!grid) return;

    // Show loading
    grid.innerHTML = `
        <div class="loading-estudiantes-msg">
            <i class="bi bi-arrow-clockwise spin"></i>
            <span>Cargando estudiantes...</span>
        </div>
    `;

    try {
        await waitForFirebase();

        // Get all estudiantes (without orderBy to avoid index requirement)
        const snapshot = await window.firebaseDB.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        allEstudiantesForAula = [];
        const instituciones = new Set();

        snapshot.forEach(doc => {
            const data = doc.data();
            allEstudiantesForAula.push({
                id: doc.id,
                ...data
            });
            if (data.institucion) {
                instituciones.add(data.institucion);
            }
        });

        // Sort estudiantes by name in JavaScript
        allEstudiantesForAula.sort((a, b) => {
            const nameA = (a.nombre || '').toLowerCase();
            const nameB = (b.nombre || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });

        // Populate institucion filter
        if (institucionSelect) {
            institucionSelect.innerHTML = '<option value="">Seleccionar institución...</option>';
            Array.from(instituciones).sort().forEach(inst => {
                institucionSelect.innerHTML += `<option value="${inst}">${inst}</option>`;
            });
        }

        // If editing, get estudiantes assigned to this aula
        let estudiantesAsignados = [];
        if (aulaId) {
            allEstudiantesForAula.forEach(est => {
                if (est.aulasAsignadas && est.aulasAsignadas.includes(aulaId)) {
                    estudiantesAsignados.push(est.id);
                }
            });
        }

        // Render estudiantes
        renderEstudiantesForAula(allEstudiantesForAula, estudiantesAsignados);

        // Setup event listeners
        setupEstudiantesAulaEventListeners();

    } catch (error) {
        console.error('Error loading estudiantes for aula:', error);
        grid.innerHTML = '<div class="no-estudiantes-msg"><i class="bi bi-exclamation-triangle"></i><span>Error al cargar estudiantes</span></div>';
    }
}

// Render estudiantes checkboxes
function renderEstudiantesForAula(estudiantes, selectedIds = []) {
    const grid = document.getElementById('estudiantesAulaGrid');
    if (!grid) return;

    if (estudiantes.length === 0) {
        grid.innerHTML = '<div class="no-estudiantes-msg"><i class="bi bi-people"></i><span>No hay estudiantes registrados</span></div>';
        updateEstudiantesCounter();
        return;
    }

    grid.innerHTML = '';

    estudiantes.forEach(est => {
        const isChecked = selectedIds.includes(est.id);
        const initials = getInitials(est.nombre || 'NN');

        const checkboxHTML = `
            <label class="estudiante-aula-checkbox">
                <input type="checkbox" name="estudianteAula" value="${est.id}" ${isChecked ? 'checked' : ''} data-institucion="${est.institucion || ''}">
                <div class="estudiante-checkbox-content">
                    <div class="estudiante-avatar">${initials}</div>
                    <div class="estudiante-info">
                        <div class="estudiante-nombre">${est.nombre || 'Sin nombre'}</div>
                        <div class="estudiante-institucion">${est.institucion || 'Sin institución'}</div>
                    </div>
                    <div class="check-icon">
                        <i class="bi bi-check"></i>
                    </div>
                </div>
            </label>
        `;

        grid.insertAdjacentHTML('beforeend', checkboxHTML);
    });

    // Add change listeners to update counter
    grid.querySelectorAll('input[name="estudianteAula"]').forEach(cb => {
        cb.addEventListener('change', updateEstudiantesCounter);
    });

    updateEstudiantesCounter();
}

// Get initials from name
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Update estudiantes counter
function updateEstudiantesCounter() {
    const counter = document.getElementById('estudiantesSeleccionadosCount');
    if (!counter) return;

    const selectedCount = document.querySelectorAll('input[name="estudianteAula"]:checked').length;
    counter.textContent = selectedCount;
}

// Setup event listeners for estudiantes in aula modal
function setupEstudiantesAulaEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchEstudiantesAula');
    if (searchInput) {
        // Remove old listener if exists
        searchInput.removeEventListener('input', filterEstudiantesAula);
        searchInput.addEventListener('input', filterEstudiantesAula);
    }

    // Institution filter
    const institucionSelect = document.getElementById('aulaAsignarInstitucion');
    if (institucionSelect) {
        // Remove old listener if exists
        institucionSelect.removeEventListener('change', filterEstudiantesAula);
        institucionSelect.addEventListener('change', filterEstudiantesAula);
    }

    // Assign all from institution button
    const btnAsignar = document.getElementById('btnAsignarInstitucion');
    if (btnAsignar) {
        btnAsignar.removeEventListener('click', asignarTodosInstitucion);
        btnAsignar.addEventListener('click', asignarTodosInstitucion);
    }

    // Remove all from institution button
    const btnQuitar = document.getElementById('btnQuitarInstitucion');
    if (btnQuitar) {
        btnQuitar.removeEventListener('click', quitarTodosInstitucion);
        btnQuitar.addEventListener('click', quitarTodosInstitucion);
    }
}

// Filter estudiantes by search term and institution
function filterEstudiantesAula() {
    const searchTerm = document.getElementById('searchEstudiantesAula')?.value.toLowerCase() || '';
    const institucionFiltro = document.getElementById('aulaAsignarInstitucion')?.value || '';
    const checkboxes = document.querySelectorAll('.estudiante-aula-checkbox');

    checkboxes.forEach(cb => {
        const nombre = cb.querySelector('.estudiante-nombre')?.textContent.toLowerCase() || '';
        const institucion = cb.querySelector('.estudiante-institucion')?.textContent || '';
        const institucionData = cb.querySelector('input')?.dataset.institucion || '';

        // Check search term match
        const matchesSearch = !searchTerm || nombre.includes(searchTerm) || institucion.toLowerCase().includes(searchTerm);

        // Check institution filter match
        const matchesInstitucion = !institucionFiltro || institucionData === institucionFiltro;

        if (matchesSearch && matchesInstitucion) {
            cb.style.display = '';
        } else {
            cb.style.display = 'none';
        }
    });
}

// Assign all estudiantes from selected institution
function asignarTodosInstitucion() {
    const institucion = document.getElementById('aulaAsignarInstitucion')?.value;

    if (!institucion) {
        showMessage('Selecciona una institución primero', 'warning');
        return;
    }

    const checkboxes = document.querySelectorAll('input[name="estudianteAula"]');
    let count = 0;

    checkboxes.forEach(cb => {
        if (cb.dataset.institucion === institucion) {
            cb.checked = true;
            count++;
        }
    });

    updateEstudiantesCounter();
    showMessage(`${count} estudiantes de ${institucion} asignados`, 'success');
}

// Remove all estudiantes from selected institution
function quitarTodosInstitucion() {
    const institucion = document.getElementById('aulaAsignarInstitucion')?.value;

    if (!institucion) {
        showMessage('Selecciona una institución primero', 'warning');
        return;
    }

    const checkboxes = document.querySelectorAll('input[name="estudianteAula"]');
    let count = 0;

    checkboxes.forEach(cb => {
        if (cb.dataset.institucion === institucion) {
            cb.checked = false;
            count++;
        }
    });

    updateEstudiantesCounter();
    showMessage(`${count} estudiantes de ${institucion} removidos`, 'success');
}


// ==========================================
// AULAS Y MATERIAS PARA PROFESORES
// ==========================================

// Configuración de materias
const materiasConfigProfesor = {
    'anuncios': { nombre: 'Anuncios', icon: 'bi-megaphone', color: '#1a1a1a' },
    'matematicas': { nombre: 'Matemáticas', icon: 'bi-calculator', color: '#667eea' },
    'lectura': { nombre: 'Lectura Crítica', icon: 'bi-book', color: '#dc3545' },
    'sociales': { nombre: 'C. Sociales', icon: 'bi-globe', color: '#ffc107' },
    'naturales': { nombre: 'C. Naturales', icon: 'bi-tree', color: '#28a745' },
    'ciencias': { nombre: 'C. Naturales', icon: 'bi-tree', color: '#28a745' },
    'ingles': { nombre: 'Inglés', icon: 'bi-translate', color: '#9c27b0' }
};

// Cargar aulas para el formulario de crear profesor
async function loadAulasForProfesorCreateForm() {
    const grid = document.getElementById('aulasProfesorCreateGrid');
    const noAulasMsg = document.getElementById('noAulasProfesorCreateMsg');

    if (!grid) return;

    // Show loading
    grid.innerHTML = `
        <div class="loading-aulas-msg">
            <i class="bi bi-arrow-clockwise spin"></i>
            <span>Cargando aulas disponibles...</span>
        </div>
    `;
    if (noAulasMsg) noAulasMsg.style.display = 'none';

    try {
        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('aulas').orderBy('nombre').get();
        const aulas = [];

        snapshot.forEach(doc => {
            aulas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (aulas.length === 0) {
            grid.innerHTML = '';
            if (noAulasMsg) noAulasMsg.style.display = 'flex';
            return;
        }

        renderAulasProfesorGrid(grid, aulas, 'Create', []);

    } catch (error) {
        console.error('Error loading aulas for profesor create form:', error);
        grid.innerHTML = '<div class="loading-aulas-msg"><i class="bi bi-exclamation-triangle"></i><span>Error al cargar aulas</span></div>';
    }
}

// Cargar aulas para el formulario de editar profesor
async function loadAulasForProfesorEditForm(aulasAsignadas = []) {
    const grid = document.getElementById('aulasProfesorEditGrid');
    const noAulasMsg = document.getElementById('noAulasProfesorEditMsg');

    if (!grid) return;

    // Show loading
    grid.innerHTML = `
        <div class="loading-aulas-msg">
            <i class="bi bi-arrow-clockwise spin"></i>
            <span>Cargando aulas disponibles...</span>
        </div>
    `;
    if (noAulasMsg) noAulasMsg.style.display = 'none';

    try {
        await waitForFirebase();

        const snapshot = await window.firebaseDB.collection('aulas').orderBy('nombre').get();
        const aulas = [];

        snapshot.forEach(doc => {
            aulas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (aulas.length === 0) {
            grid.innerHTML = '';
            if (noAulasMsg) noAulasMsg.style.display = 'flex';
            return;
        }

        renderAulasProfesorGrid(grid, aulas, 'Edit', aulasAsignadas);

    } catch (error) {
        console.error('Error loading aulas for profesor edit form:', error);
        grid.innerHTML = '<div class="loading-aulas-msg"><i class="bi bi-exclamation-triangle"></i><span>Error al cargar aulas</span></div>';
    }
}

// Renderizar grid de aulas para profesores
function renderAulasProfesorGrid(container, aulas, formType, aulasAsignadas = []) {
    container.innerHTML = '';

    aulas.forEach(aula => {
        // Verificar si el aula está asignada y obtener las materias seleccionadas
        let isSelected = false;
        let materiasSeleccionadas = [];
        
        if (Array.isArray(aulasAsignadas)) {
            const aulaAsignada = aulasAsignadas.find(a => {
                if (typeof a === 'string') return a === aula.id;
                return a.aulaId === aula.id;
            });
            
            if (aulaAsignada) {
                isSelected = true;
                materiasSeleccionadas = typeof aulaAsignada === 'string' ? [] : (aulaAsignada.materias || []);
            }
        }

        const color = aula.color || '#667eea';
        const materias = aula.materias || [];

        // Crear badges de materias disponibles
        const materiasDisponiblesHTML = materias.map(materiaId => {
            const config = materiasConfigProfesor[materiaId] || { nombre: '?', color: '#666' };
            return `<span class="mini-badge" style="background: ${config.color};">${config.nombre.substring(0, 3)}</span>`;
        }).join('');

        // Crear checkboxes de materias para seleccionar
        const materiasCheckboxesHTML = materias.map(materiaId => {
            const config = materiasConfigProfesor[materiaId] || { nombre: materiaId, icon: 'bi-book', color: '#666' };
            const isChecked = materiasSeleccionadas.includes(materiaId);
            return `
                <label class="materia-profesor-checkbox">
                    <input type="checkbox" name="materiaProfesor${formType}_${aula.id}" value="${materiaId}" ${isChecked ? 'checked' : ''}>
                    <span class="materia-chip ${materiaId}">
                        <i class="bi ${config.icon}"></i>
                        ${config.nombre}
                    </span>
                </label>
            `;
        }).join('');

        const itemHTML = `
            <div class="aula-profesor-item ${isSelected ? 'selected' : ''}" data-aula-id="${aula.id}">
                <div class="aula-profesor-header" onclick="toggleAulaProfesor(this, '${formType}')">
                    <div class="aula-profesor-checkbox">
                        <i class="bi bi-check"></i>
                    </div>
                    <div class="aula-profesor-icon" style="background: ${color};">
                        <i class="bi bi-door-open-fill"></i>
                    </div>
                    <div class="aula-profesor-info">
                        <div class="aula-profesor-nombre">${aula.nombre}</div>
                        ${aula.descripcion ? `<div class="aula-profesor-descripcion">${aula.descripcion}</div>` : ''}
                    </div>
                    <div class="aula-profesor-materias-disponibles">
                        ${materiasDisponiblesHTML || '<span style="color: #999; font-size: 0.7rem;">Sin materias</span>'}
                    </div>
                </div>
                <div class="aula-profesor-materias-section">
                    <label>Materias que enseñará en esta aula:</label>
                    <div class="materias-profesor-grid">
                        ${materiasCheckboxesHTML || '<span style="color: #999; font-size: 0.8rem;">Esta aula no tiene materias configuradas</span>'}
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', itemHTML);
    });
}

// Toggle selección de aula para profesor
function toggleAulaProfesor(headerElement, formType) {
    const item = headerElement.closest('.aula-profesor-item');
    const isSelected = item.classList.contains('selected');
    
    if (isSelected) {
        item.classList.remove('selected');
        // Desmarcar todas las materias de esta aula
        const checkboxes = item.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = false);
    } else {
        item.classList.add('selected');
        // Marcar todas las materias por defecto
        const checkboxes = item.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = true);
    }
}

// Obtener aulas y materias seleccionadas del formulario
function getAulasProfesorFromForm(formType) {
    const gridId = formType === 'Create' ? 'aulasProfesorCreateGrid' : 'aulasProfesorEditGrid';
    const grid = document.getElementById(gridId);
    
    if (!grid) return [];

    const aulasAsignadas = [];
    const selectedItems = grid.querySelectorAll('.aula-profesor-item.selected');

    selectedItems.forEach(item => {
        const aulaId = item.dataset.aulaId;
        const materias = [];
        
        const checkboxes = item.querySelectorAll(`input[name="materiaProfesor${formType}_${aulaId}"]:checked`);
        checkboxes.forEach(cb => {
            materias.push(cb.value);
        });

        if (materias.length > 0) {
            aulasAsignadas.push({
                aulaId: aulaId,
                materias: materias
            });
        }
    });

    return aulasAsignadas;
}

// ==========================================
// MODAL PARA VER AULAS DEL USUARIO
// ==========================================

// Función para mostrar las aulas de un usuario en un modal
async function mostrarAulasUsuario(userId, userName) {
    // Buscar el usuario
    const user = allUsers.find(u => u.id === userId);
    if (!user || !user.aulasAsignadas || user.aulasAsignadas.length === 0) {
        showMessage('Este usuario no tiene aulas asignadas', 'info');
        return;
    }

    // Obtener información completa de las aulas
    const aulasInfo = [];
    for (const aulaRef of user.aulasAsignadas) {
        const aulaId = typeof aulaRef === 'object' ? aulaRef.aulaId : aulaRef;
        
        // Buscar en allAulas o en el cache
        let aulaData = null;
        if (typeof allAulas !== 'undefined' && allAulas.length > 0) {
            aulaData = allAulas.find(a => a.id === aulaId);
        }
        
        // Si no está en allAulas, buscar en Firebase
        if (!aulaData && window.firebaseDB) {
            try {
                const aulaDoc = await window.firebaseDB.collection('aulas').doc(aulaId).get();
                if (aulaDoc.exists) {
                    aulaData = { id: aulaDoc.id, ...aulaDoc.data() };
                }
            } catch (error) {
                console.error('Error fetching aula:', error);
            }
        }

        if (aulaData) {
            aulasInfo.push({
                id: aulaId,
                nombre: aulaData.nombre || aulaId,
                color: aulaData.color || '#667eea',
                descripcion: aulaData.descripcion || '',
                materias: aulaData.materias || []
            });
        } else {
            aulasInfo.push({
                id: aulaId,
                nombre: aulasNombresCache[aulaId] || aulaId,
                color: '#667eea',
                descripcion: '',
                materias: []
            });
        }
    }

    // Crear el modal si no existe
    let modal = document.getElementById('verAulasModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'verAulasModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content ver-aulas-modal-content">
                <div class="modal-header">
                    <h3><i class="bi bi-door-open-fill"></i> Aulas de <span id="verAulasUserName">Usuario</span></h3>
                    <button class="close-btn" onclick="cerrarModalAulas()">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="modal-body" id="verAulasModalBody">
                    <!-- Aulas se cargarán aquí -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Cerrar al hacer clic fuera
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalAulas();
            }
        });
    }

    // Actualizar título
    const userNameSpan = document.getElementById('verAulasUserName');
    if (userNameSpan) {
        userNameSpan.textContent = userName;
    }

    // Configuración de colores y nombres de materias
    const materiasColores = {
        'anuncios': { nombre: 'Anuncios', color: '#1a1a1a', icon: 'bi-megaphone' },
        'matematicas': { nombre: 'Matemáticas', color: '#667eea', icon: 'bi-calculator' },
        'lectura': { nombre: 'Lectura Crítica', color: '#dc3545', icon: 'bi-book' },
        'sociales': { nombre: 'C. Sociales', color: '#ffc107', icon: 'bi-globe' },
        'naturales': { nombre: 'C. Naturales', color: '#28a745', icon: 'bi-tree' },
        'ingles': { nombre: 'Inglés', color: '#9c27b0', icon: 'bi-translate' }
    };

    // Generar contenido de las aulas
    const aulasHTML = aulasInfo.map(aula => {
        const materiasHTML = aula.materias && aula.materias.length > 0 
            ? aula.materias.map(m => {
                const config = materiasColores[m] || { nombre: m, color: '#666', icon: 'bi-book' };
                return `<span class="materia-tag-colored" style="background: ${config.color};">
                    <i class="bi ${config.icon}"></i> ${config.nombre}
                </span>`;
            }).join('')
            : '';

        return `
            <div class="aula-info-card" style="border-color: ${aula.color};">
                <div class="aula-info-header" style="background: linear-gradient(135deg, ${aula.color}20, ${aula.color}10);">
                    <div class="aula-color-indicator" style="background: ${aula.color};"></div>
                    <h4 class="aula-info-nombre">${aula.nombre}</h4>
                </div>
                ${aula.descripcion ? `<p class="aula-info-descripcion">${aula.descripcion}</p>` : ''}
                ${materiasHTML ? `
                    <div class="aula-info-materias">
                        <span class="materias-label"><i class="bi bi-collection"></i> Materias:</span>
                        <div class="materias-tags">
                            ${materiasHTML}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');

    document.getElementById('verAulasModalBody').innerHTML = `
        <div class="aulas-info-container">
            <p class="aulas-count-info"><i class="bi bi-info-circle"></i> ${aulasInfo.length} aula${aulasInfo.length > 1 ? 's' : ''} asignada${aulasInfo.length > 1 ? 's' : ''}</p>
            ${aulasHTML}
        </div>
    `;

    // Mostrar modal
    modal.classList.add('show');
}

// Función para cerrar el modal de aulas
function cerrarModalAulas() {
    const modal = document.getElementById('verAulasModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Función para ver las insignias de un usuario
async function verInsigniasUsuario(userId, userName) {
    // Buscar el usuario
    const user = allUsers.find(u => u.id === userId);
    if (!user) {
        showMessage('Usuario no encontrado', 'error');
        return;
    }

    const insigniasUsuario = user.insignias || [];
    
    // Crear modal si no existe
    let modal = document.getElementById('verInsigniasModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'verInsigniasModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content ver-insignias-modal">
                <div class="modal-header">
                    <h3 id="verInsigniasModalTitle">Insignias del Estudiante</h3>
                    <button class="close-btn" onclick="cerrarModalInsignias()">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="modal-body" id="verInsigniasModalBody">
                    <!-- Contenido dinámico -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalInsignias();
            }
        });
    }

    // Actualizar título
    document.getElementById('verInsigniasModalTitle').innerHTML = `<i class="bi bi-award-fill"></i> Insignias de ${userName}`;

    // Si no tiene insignias
    if (insigniasUsuario.length === 0) {
        document.getElementById('verInsigniasModalBody').innerHTML = `
            <div class="no-insignias-message">
                <i class="bi bi-award" style="font-size: 3rem; color: #ccc;"></i>
                <p>Este estudiante aún no tiene insignias</p>
            </div>
        `;
        modal.classList.add('show');
        return;
    }

    // Cargar información de las insignias desde Firebase
    try {
        await waitForFirebase();
        const insigniasSnapshot = await window.firebaseDB.collection('insignias').get();
        const todasInsignias = {};
        insigniasSnapshot.forEach(doc => {
            todasInsignias[doc.id] = { id: doc.id, ...doc.data() };
        });

        // Mapear las insignias del usuario con su información completa
        // Las insignias pueden estar guardadas como strings (IDs) o como objetos
        const insigniasInfo = insigniasUsuario.map(insigniaItem => {
            // Determinar el ID de la insignia (puede ser string o objeto)
            let insigniaId;
            let insigniaData = null;
            
            if (typeof insigniaItem === 'string') {
                // Es un ID simple
                insigniaId = insigniaItem;
            } else if (typeof insigniaItem === 'object' && insigniaItem !== null) {
                // Es un objeto, puede tener id, insigniaId, o ser la insignia completa
                insigniaId = insigniaItem.id || insigniaItem.insigniaId || null;
                // Si el objeto ya tiene los datos de la insignia, usarlos
                if (insigniaItem.nombre) {
                    insigniaData = insigniaItem;
                }
            }
            
            // Buscar en Firebase si tenemos un ID
            if (insigniaId && todasInsignias[insigniaId]) {
                return todasInsignias[insigniaId];
            }
            
            // Si ya teníamos los datos del objeto, usarlos
            if (insigniaData) {
                return {
                    id: insigniaId || 'unknown',
                    nombre: insigniaData.nombre || 'Insignia',
                    icono: insigniaData.icono || 'award-fill',
                    color: insigniaData.color || '#667eea',
                    descripcion: insigniaData.descripcion || '',
                    categoria: insigniaData.categoria || ''
                };
            }
            
            // Fallback: mostrar lo que tengamos
            return { 
                id: insigniaId || 'unknown', 
                nombre: insigniaId || 'Insignia', 
                icono: 'award-fill', 
                color: '#667eea' 
            };
        });

        // Generar HTML de las insignias
        // Nota: el icono se guarda sin el prefijo 'bi-', así que lo agregamos aquí
        const insigniasHTML = insigniasInfo.map(insignia => {
            // Asegurar que el ícono tenga el formato correcto
            let iconClass = insignia.icono || 'award-fill';
            // Si ya tiene 'bi-' al inicio, no agregarlo de nuevo
            if (!iconClass.startsWith('bi-')) {
                iconClass = 'bi-' + iconClass;
            }
            
            return `
            <div class="insignia-info-card" style="border-color: ${insignia.color || '#667eea'};">
                <div class="insignia-icon-display" style="background: linear-gradient(135deg, ${insignia.color || '#667eea'}, ${insignia.color || '#667eea'}dd);">
                    <i class="bi ${iconClass}"></i>
                </div>
                <div class="insignia-info-content">
                    <h4 class="insignia-nombre">${insignia.nombre || 'Insignia'}</h4>
                    ${insignia.descripcion ? `<p class="insignia-descripcion">${insignia.descripcion}</p>` : ''}
                    ${insignia.categoria ? `<span class="insignia-categoria-tag">${getCategoriaLabel(insignia.categoria)}</span>` : ''}
                </div>
            </div>
        `}).join('');

        document.getElementById('verInsigniasModalBody').innerHTML = `
            <div class="insignias-info-container">
                <p class="insignias-count-info"><i class="bi bi-trophy-fill"></i> ${insigniasInfo.length} insignia${insigniasInfo.length > 1 ? 's' : ''} obtenida${insigniasInfo.length > 1 ? 's' : ''}</p>
                <div class="insignias-grid-display">
                    ${insigniasHTML}
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading insignias:', error);
        document.getElementById('verInsigniasModalBody').innerHTML = `
            <div class="error-message">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error al cargar las insignias</p>
            </div>
        `;
    }

    // Mostrar modal
    modal.classList.add('show');
}

// Función auxiliar para obtener el label de la categoría
function getCategoriaLabel(categoria) {
    const categorias = {
        'matematicas': 'Matemáticas',
        'lectura': 'Lectura Crítica',
        'sociales': 'Ciencias Sociales',
        'ciencias': 'Ciencias Naturales',
        'naturales': 'Ciencias Naturales',
        'ingles': 'Inglés'
    };
    return categorias[categoria] || categoria;
}

// Función para cerrar el modal de insignias
function cerrarModalInsignias() {
    const modal = document.getElementById('verInsigniasModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Hacer funciones globales
window.mostrarAulasUsuario = mostrarAulasUsuario;
window.cerrarModalAulas = cerrarModalAulas;
window.verInsigniasUsuario = verInsigniasUsuario;
window.cerrarModalInsignias = cerrarModalInsignias;
window.toggleAulaProfesor = toggleAulaProfesor;
window.loadAulasForProfesorCreateForm = loadAulasForProfesorCreateForm;
window.loadAulasForProfesorEditForm = loadAulasForProfesorEditForm;


// ==========================================
// RESET PROGRESS FUNCTIONS
// ==========================================

// Load reset progress statistics
async function loadResetProgressStats() {
    try {
        await waitForFirebase();

        // Get all students
        const snapshot = await window.firebaseDB.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        let totalStudents = 0;
        let totalXP = 0;
        let totalCoins = 0;

        // Lista de materias
        const materias = ['matematicas', 'lectura', 'sociales', 'naturales', 'ingles', 'anuncios'];

        snapshot.forEach(doc => {
            const data = doc.data();
            totalStudents++;
            
            // Sumar XP global
            totalXP += (data.xp || data.experiencia || 0);
            
            // Sumar XP por cada materia
            materias.forEach(materia => {
                const progresoMateria = data[`progreso_${materia}`];
                if (progresoMateria && progresoMateria.xp) {
                    totalXP += progresoMateria.xp;
                }
            });
            
            // Sumar monedas
            totalCoins += (data.puntos || data.puntosAcumulados || data.monedas || 0);
        });

        // Update stats display
        const resetTotalStudents = document.getElementById('resetTotalStudents');
        const resetTotalXP = document.getElementById('resetTotalXP');
        const resetTotalCoins = document.getElementById('resetTotalCoins');

        if (resetTotalStudents) resetTotalStudents.textContent = totalStudents.toLocaleString();
        if (resetTotalXP) resetTotalXP.textContent = totalXP.toLocaleString();
        if (resetTotalCoins) resetTotalCoins.textContent = totalCoins.toLocaleString();

    } catch (error) {
        console.error('Error loading reset progress stats:', error);
        showMessage('Error al cargar estadísticas', 'error');
    }
}

// Initialize reset progress management
function initializeResetProgressManagement() {
    const resetAllProgressBtn = document.getElementById('resetAllProgressBtn');
    const resetProgressModal = document.getElementById('resetProgressModal');
    const closeResetProgressModal = document.getElementById('closeResetProgressModal');
    const cancelResetProgress = document.getElementById('cancelResetProgress');
    const confirmResetProgress = document.getElementById('confirmResetProgress');

    if (resetAllProgressBtn) {
        resetAllProgressBtn.addEventListener('click', openResetProgressModal);
    }

    if (closeResetProgressModal) {
        closeResetProgressModal.addEventListener('click', closeResetProgressModalFn);
    }

    if (cancelResetProgress) {
        cancelResetProgress.addEventListener('click', closeResetProgressModalFn);
    }

    if (confirmResetProgress) {
        confirmResetProgress.addEventListener('click', handleResetAllProgress);
    }

    if (resetProgressModal) {
        resetProgressModal.addEventListener('click', function(e) {
            if (e.target === resetProgressModal) {
                closeResetProgressModalFn();
            }
        });
    }
}

// Open reset progress confirmation modal
async function openResetProgressModal() {
    const modal = document.getElementById('resetProgressModal');
    const confirmStudentCount = document.getElementById('resetConfirmStudentCount');
    const securityCodeInput = document.getElementById('resetProgressSecurityCode');

    if (!modal) return;

    // Get student count
    try {
        await waitForFirebase();
        const snapshot = await window.firebaseDB.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();
        
        if (confirmStudentCount) {
            confirmStudentCount.textContent = snapshot.size.toLocaleString();
        }
    } catch (error) {
        console.error('Error getting student count:', error);
    }

    // Clear security code input
    if (securityCodeInput) {
        securityCodeInput.value = '';
    }

    modal.classList.add('show');
}

// Close reset progress modal
function closeResetProgressModalFn() {
    const modal = document.getElementById('resetProgressModal');
    if (modal) {
        modal.classList.remove('show');
    }
}

// Handle reset all progress
async function handleResetAllProgress() {
    const securityCodeInput = document.getElementById('resetProgressSecurityCode');
    const confirmBtn = document.getElementById('confirmResetProgress');
    const logContainer = document.getElementById('resetProgressLog');
    const logContent = document.getElementById('resetLogContent');

    if (!securityCodeInput) return;

    const enteredCode = securityCodeInput.value.trim();

    // Verify security code
    if (enteredCode !== SUPERUSER_SECURITY_CODE) {
        showMessage('Código de seguridad incorrecto', 'error');
        securityCodeInput.classList.add('error');
        setTimeout(() => securityCodeInput.classList.remove('error'), 2000);
        return;
    }

    // Disable button and show loading
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Procesando...';
    }

    try {
        await waitForFirebase();

        // Get all students
        const snapshot = await window.firebaseDB.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        const totalStudents = snapshot.size;
        let processedCount = 0;
        let errorCount = 0;

        // Show log container
        if (logContainer) {
            logContainer.style.display = 'block';
            logContent.innerHTML = '';
        }

        // Add start log entry
        addLogEntry('info', `Iniciando restablecimiento de ${totalStudents} estudiantes...`);

        // Lista de materias para restablecer progreso
        const materias = ['matematicas', 'lectura', 'sociales', 'naturales', 'ingles', 'anuncios'];

        // Process each student - Firebase batch limit is 500, so we may need multiple batches
        const batchSize = 500;
        const docs = snapshot.docs;
        
        for (let i = 0; i < docs.length; i += batchSize) {
            const batch = window.firebaseDB.batch();
            const batchDocs = docs.slice(i, i + batchSize);
            
            batchDocs.forEach(doc => {
                const userRef = window.firebaseDB.collection('usuarios').doc(doc.id);
                
                // Crear objeto de actualización con campos globales
                const updateData = {
                    puntos: 0,
                    puntosAcumulados: 0,
                    monedas: 0,
                    xp: 0,
                    experiencia: 0,
                    racha: 0,
                    rachaDias: 0,
                    ultimaActividad: null
                };
                
                // Agregar progreso por materia (xp, nivel, racha por cada materia)
                materias.forEach(materia => {
                    updateData[`progreso_${materia}`] = {
                        xp: 0,
                        nivel: 1,
                        racha: 0
                    };
                });
                
                batch.update(userRef, updateData);
                processedCount++;
            });

            // Commit this batch
            await batch.commit();
            addLogEntry('info', `Procesados ${Math.min(i + batchSize, docs.length)} de ${docs.length} estudiantes...`);
        }

        // Add success log entry
        addLogEntry('success', `✓ Se restableció el progreso de ${processedCount} estudiantes exitosamente`);
        addLogEntry('success', `✓ XP, racha y nivel de todas las materias restablecidos a 0`);

        // Close modal and show success message
        closeResetProgressModalFn();
        showMessage(`Progreso restablecido para ${processedCount} estudiantes (incluyendo XP por materia)`, 'success');

        // Reload stats
        loadResetProgressStats();

        // Reload users if in users view
        if (typeof loadUsers === 'function') {
            loadUsers();
        }

    } catch (error) {
        console.error('Error resetting progress:', error);
        addLogEntry('error', `Error: ${error.message}`);
        showMessage('Error al restablecer el progreso', 'error');
    } finally {
        // Re-enable button
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i> Confirmar Restablecimiento';
        }
    }
}

// Add log entry
function addLogEntry(type, message) {
    const logContent = document.getElementById('resetLogContent');
    if (!logContent) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES');

    const icons = {
        'success': 'bi-check-circle-fill',
        'error': 'bi-x-circle-fill',
        'info': 'bi-info-circle-fill'
    };

    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `
        <i class="bi ${icons[type] || 'bi-info-circle'}"></i>
        <span>${message}</span>
        <span class="log-time">${timeStr}</span>
    `;

    logContent.appendChild(entry);
    logContent.scrollTop = logContent.scrollHeight;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeResetProgressManagement();
});

// Make functions globally available
window.loadResetProgressStats = loadResetProgressStats;
window.openResetProgressModal = openResetProgressModal;
window.closeResetProgressModalFn = closeResetProgressModalFn;
window.handleResetAllProgress = handleResetAllProgress;
