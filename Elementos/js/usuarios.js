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
let currentDashboardView = 'dashboard'; // dashboard, profesores, estudiantes

// Security code for creating superusers
const SUPERUSER_SECURITY_CODE = 'SG-PG-2025-OWH346OU6634OSDFS4YE431FSD325';

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    userTypeFilter: document.getElementById('userTypeFilter'),
    statusFilter: document.getElementById('statusFilter'),
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
    const studentFields = document.querySelector('.student-fields');
    const adminFields = document.querySelectorAll('.admin-fields');
    const roleSelection = document.getElementById('roleSelectionCreate');
    const createButton = elements.createButtonText;
    const isSuperuser = window.currentUserRole === 'superusuario';
    const usuarioInput = elements.createUsuario;
    const usuarioLabel = document.getElementById('createUsuarioLabel');
    const usuarioHint = document.getElementById('createUsuarioHint');

    if (selectedType === 'estudiante') {
        studentFields.style.display = 'block';
        adminFields.forEach(field => field.style.display = 'none');
        roleSelection.style.display = 'none';
        createButton.textContent = 'Crear Estudiante';
        // Cambiar placeholder para estudiantes
        usuarioInput.placeholder = 'nombre.usuario';
        usuarioInput.type = 'text';
        if (usuarioLabel) usuarioLabel.textContent = 'Nombre de Usuario *';
        if (usuarioHint) usuarioHint.style.display = 'block';
    } else {
        studentFields.style.display = 'none';
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

    // Apply dashboard view filter
    switch (currentDashboardView) {
        case 'profesores':
            baseUsers = baseUsers.filter(user =>
                (user.tipoUsuario === 'admin' || user.rol === 'admin') &&
                user.rol !== 'superusuario'
            );
            break;
        case 'estudiantes':
            baseUsers = baseUsers.filter(user => user.tipoUsuario === 'estudiante');
            break;
        case 'superusuarios':
            baseUsers = baseUsers.filter(user => user.rol === 'superusuario');
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
            // Show all users
            break;
    }

    // Apply existing filters (search, type, status)
    filteredUsers = baseUsers.filter(user => {
        const searchTerm = elements.searchInput.value.toLowerCase();
        const typeFilter = elements.userTypeFilter.value;
        const statusFilter = elements.statusFilter.value;

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
            (typeFilter === 'admin' && user.tipoUsuario === 'admin' && user.rol !== 'superusuario') ||
            (typeFilter === 'estudiante' && user.tipoUsuario === 'estudiante');

        // Status filter
        const matchesStatus = !statusFilter || user.activo.toString() === statusFilter;

        return matchesSearch && matchesType && matchesStatus;
    });

    updateStats();
    renderUsers();
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
        case 'dashboard':
        default:
            tableHeader.textContent = 'Lista de Usuarios';
            if (createUserBtn) createUserBtn.innerHTML = '<i class="bi bi-person-plus-fill"></i> Crear Usuario';
            break;
    }

    // Update column visibility based on view
    updateColumnVisibility(view);
}

// Update column visibility based on dashboard view
function updateColumnVisibility(view) {
    const table = document.getElementById('usersTable');
    // All column selectors
    const rolColumn = document.querySelector('th:nth-child(3)'); // Rol column
    const estadoColumn = document.querySelector('th:nth-child(4)'); // Estado column
    const puntosColumn = document.querySelector('th:nth-child(5)'); // Puntos column
    const insigniasColumn = document.querySelector('th:nth-child(6)'); // Insignias column
    const materiasColumn = document.querySelector('th:nth-child(7)'); // Materias Acceso column
    const telefonoColumn = document.querySelector('th:nth-child(8)'); // Teléfono column
    const documentoColumn = document.querySelector('th:nth-child(9)'); // Documento column
    const institucionColumn = document.querySelector('th:nth-child(10)'); // Institución column
    const gradoColumn = document.querySelector('th:nth-child(11)'); // Grado column
    const departamentoColumn = document.querySelector('th:nth-child(12)'); // Departamento column
    const emailRecuperacionColumn = document.querySelector('th:nth-child(13)'); // Email Recuperación column
    const codigoRecuperacionColumn = document.querySelector('th:nth-child(14)'); // Código Recuperación column
    const fechaColumn = document.querySelector('th:nth-child(15)'); // Fecha Registro column
    const accionesColumn = document.querySelector('th:nth-child(16)'); // Acciones column

    // Hide gamification columns for profesores, superusuarios, and estudiantes (since we have dedicated insignias view)
    const shouldHideGamification = view === 'profesores' || view === 'superusuarios' || view === 'estudiantes';

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
        if (materiasColumn) materiasColumn.style.display = 'none';
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
        if (materiasColumn) materiasColumn.style.display = 'none';
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
        if (materiasColumn) materiasColumn.style.display = '';
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

    // Update all table rows
    const tableRows = document.querySelectorAll('#usersTable tbody tr');
    tableRows.forEach(row => {
        // All cell selectors
        const rolCell = row.querySelector('td:nth-child(3)');
        const estadoCell = row.querySelector('td:nth-child(4)');
        const puntosCell = row.querySelector('td:nth-child(5)');
        const insigniasCell = row.querySelector('td:nth-child(6)');
        const materiasCell = row.querySelector('td:nth-child(7)');
        const telefonoCell = row.querySelector('td:nth-child(8)');
        const documentoCell = row.querySelector('td:nth-child(9)');
        const institucionCell = row.querySelector('td:nth-child(10)');
        const gradoCell = row.querySelector('td:nth-child(11)');
        const departamentoCell = row.querySelector('td:nth-child(12)');
        const emailRecuperacionCell = row.querySelector('td:nth-child(13)');
        const codigoRecuperacionCell = row.querySelector('td:nth-child(14)');
        const fechaCell = row.querySelector('td:nth-child(15)');
        const accionesCell = row.querySelector('td:nth-child(16)');

        if (isRecoveryView) {
            // Hide most cells for recovery view, but keep Rol visible
            if (rolCell) rolCell.style.display = ''; // Show Rol cell
            if (estadoCell) estadoCell.style.display = 'none';
            if (puntosCell) puntosCell.style.display = 'none';
            if (insigniasCell) insigniasCell.style.display = 'none';
            if (materiasCell) materiasCell.style.display = 'none';
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
            if (materiasCell) materiasCell.style.display = 'none';
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
            if (materiasCell) materiasCell.style.display = '';
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
        user.rol !== 'superusuario'
    ).length;
    const totalStudentsCount = currentUsers.filter(user => user.tipoUsuario === 'estudiante').length;
    const totalSuperusersCount = currentUsers.filter(user => user.rol === 'superusuario').length;
    const activeUsersCount = currentUsers.filter(user => user.activo === true).length;

    // Update stats based on current dashboard view
    switch (currentDashboardView) {
        case 'profesores':
            elements.totalUsers.textContent = totalAdminsCount;
            elements.totalAdmins.textContent = totalAdminsCount;
            elements.totalSuperusers.textContent = '0';
            elements.totalStudents.textContent = '0';
            elements.activeUsers.textContent = currentUsers.filter(user => user.activo === true).length;
            break;
        case 'estudiantes':
            elements.totalUsers.textContent = totalStudentsCount;
            elements.totalAdmins.textContent = '0';
            elements.totalSuperusers.textContent = '0';
            elements.totalStudents.textContent = totalStudentsCount;
            elements.activeUsers.textContent = currentUsers.filter(user => user.activo === true).length;
            break;
        case 'superusuarios':
            elements.totalUsers.textContent = totalSuperusersCount;
            elements.totalAdmins.textContent = '0';
            elements.totalSuperusers.textContent = totalSuperusersCount;
            elements.totalStudents.textContent = '0';
            elements.activeUsers.textContent = currentUsers.filter(user => user.activo === true).length;
            break;
        case 'dashboard':
        default:
            // Show global statistics
            const globalTotalAdmins = allUsers.filter(user =>
                (user.tipoUsuario === 'admin' || user.rol === 'admin') &&
                user.rol !== 'superusuario'
            ).length;
            const globalTotalSuperusers = allUsers.filter(user => user.rol === 'superusuario').length;
            const globalTotalStudents = allUsers.filter(user => user.tipoUsuario === 'estudiante').length;
            const globalActiveUsers = allUsers.filter(user => user.activo === true).length;

            elements.totalUsers.textContent = allUsers.length;
            elements.totalAdmins.textContent = globalTotalAdmins;
            elements.totalSuperusers.textContent = globalTotalSuperusers;
            elements.totalStudents.textContent = globalTotalStudents;
            elements.activeUsers.textContent = globalActiveUsers;
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
        if (user.tipoUsuario === 'admin' || user.rol === 'admin' || user.rol === 'superusuario') {
            if (user.rol === 'superusuario') {
                userBadge = 'SUPER';
                badgeClass = 'superusuario';
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
                `<div class="puntos-cell-simple">
                        <strong>${user.puntos || user.puntosAcumulados || 0}</strong>
                    </div>` : 'N/A'}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' && user.insignias && user.insignias.length > 0 ?
                `<div class="insignias-cell-simple">
                        <strong>${user.insignias.length}</strong>
                        <small class="insignias-preview-icons" data-insignias='${JSON.stringify(user.insignias)}'></small>
                    </div>` :
                (user.tipoUsuario === 'estudiante' ? '<span class="text-muted">0</span>' : 'N/A')}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' && user.clasesPermitidas && user.clasesPermitidas.length > 0 ?
                `<div class="materias-cell">
                        ${user.clasesPermitidas.map(materia => {
                    const materiasConfig = {
                        'matematicas': { inicial: 'MAT', color: '#667eea' },
                        'lectura': { inicial: 'LEC', color: '#dc3545' },
                        'sociales': { inicial: 'SOC', color: '#ffc107' },
                        'naturales': { inicial: 'CIE', color: '#28a745' },
                        'ingles': { inicial: 'ING', color: '#9c27b0' }
                    };
                    const config = materiasConfig[materia] || { inicial: 'N/A', color: '#6c757d' };
                    return `<span class="materia-badge" style="background: ${config.color};" title="${materia.charAt(0).toUpperCase() + materia.slice(1)}">${config.inicial}</span>`;
                }).join('')}
                    </div>` :
                (user.tipoUsuario === 'estudiante' ? '<span class="text-muted">Sin acceso</span>' :
                    (user.tipoUsuario === 'admin' && user.asignaturas && user.asignaturas.length > 0 ?
                        `<div class="materias-cell">
                            ${user.asignaturas.map(materia => {
                            const materiasConfig = {
                                'matematicas': { inicial: 'MAT', color: '#667eea' },
                                'lectura': { inicial: 'LEC', color: '#dc3545' },
                                'sociales': { inicial: 'SOC', color: '#ffc107' },
                                'ciencias': { inicial: 'CIE', color: '#28a745' },
                                'ingles': { inicial: 'ING', color: '#9c27b0' }
                            };
                            const config = materiasConfig[materia] || { inicial: 'N/A', color: '#6c757d' };
                            return `<span class="materia-badge" style="background: ${config.color};" title="${materia.charAt(0).toUpperCase() + materia.slice(1)}">${config.inicial}</span>`;
                        }).join('')}
                        </div>` :
                        (user.tipoUsuario === 'admin' ? '<span class="text-muted">Sin asignaturas</span>' : 'N/A')))}
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
                ${user.tipoUsuario === 'estudiante' ? (user.institucion || 'No especificada') : 'N/A'}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' ? (user.grado || 'No especificado') : 'N/A'}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' ? (user.departamento || 'No especificado') : 'N/A'}
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

    handleUserTypeChange();
    elements.createUserModal.classList.add('show');
}

// Close create user modal
function closeCreateUserModal() {
    elements.createUserModal.classList.remove('show');
}

// Toggle security code section based on role selection
function toggleSecurityCodeSection() {
    const superuserRadio = document.querySelector('input[name="rolUsuario"][value="superusuario"]');
    const securityCodeSection = elements.securityCodeSectionCreate;
    const adminFields = document.querySelectorAll('.admin-fields');

    if (superuserRadio && superuserRadio.checked) {
        // Show security code section for superusers
        securityCodeSection.style.display = 'block';
        
        // Hide subject selection for superusers (they have access to all)
        adminFields.forEach(field => {
            if (field.querySelector('h4') && field.querySelector('h4').textContent.includes('Asignaturas')) {
                field.style.display = 'none';
            }
        });
    } else {
        // Hide security code section for regular admins
        securityCodeSection.style.display = 'none';
        
        // Show subject selection for regular admins/professors
        adminFields.forEach(field => {
            if (field.querySelector('h4') && field.querySelector('h4').textContent.includes('Asignaturas')) {
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
        // Hide subject selection for superusers (they have access to all)
        adminEditFields.forEach(field => {
            if (field.querySelector('h4') && field.querySelector('h4').textContent.includes('Asignaturas')) {
                field.style.display = 'none';
            }
        });
    } else {
        // Show subject selection for regular admins/professors
        adminEditFields.forEach(field => {
            if (field.querySelector('h4') && field.querySelector('h4').textContent.includes('Asignaturas')) {
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
    elements.editUsuario.value = user.usuario || user.email || '';
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

    // Show/hide student fields
    const studentFields = document.querySelectorAll('.student-edit-fields');
    const adminEditFields = document.querySelectorAll('.admin-edit-fields');

    if (user.tipoUsuario === 'estudiante') {
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

        // Load clases permisos
        const clasesPermitidas = user.clasesPermitidas || [];
        const checkboxes = document.querySelectorAll('input[name="clasePermiso"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = clasesPermitidas.includes(checkbox.value);
        });
    } else {
        studentFields.forEach(field => field.style.display = 'none');
        adminEditFields.forEach(field => field.style.display = 'block');

        // Load asignaturas del profesor
        const asignaturas = user.asignaturas || [];
        const asignaturasCheckboxes = document.querySelectorAll('input[name="asignaturaProfesorEdit"]');
        asignaturasCheckboxes.forEach(checkbox => {
            checkbox.checked = asignaturas.includes(checkbox.value);
        });
    }

    // Update subject section visibility based on role
    toggleSubjectSectionEdit();

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

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario) || !emailRegex.test(emailRecuperacion)) {
        showMessage('Por favor ingresa emails válidos', 'error');
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
        const submitBtn = elements.createUserForm.querySelector('.create-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        await waitForFirebase();

        // Check if user already exists
        const existingUserQuery = await window.firebaseDB.collection('usuarios')
            .where('usuario', '==', usuario)
            .get();

        if (!existingUserQuery.empty) {
            showMessage('Ya existe un usuario con este email', 'error');
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
                return;
            }
            if (securityCode !== SUPERUSER_SECURITY_CODE) {
                showMessage('Código de seguridad incorrecto', 'error');
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
            userData.clasesPermitidas = []; // Initialize empty, admin can edit later
        }

        // Add admin-specific fields (asignaturas)
        if (tipoUsuario === 'admin') {
            const asignaturasCheckboxes = document.querySelectorAll('input[name="asignaturaProfesor"]:checked');
            const asignaturas = Array.from(asignaturasCheckboxes).map(cb => cb.value);
            userData.asignaturas = asignaturas; // Array de asignaturas que puede enseñar
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
        const submitBtn = elements.createUserForm.querySelector('.create-btn');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

// Handle edit user
async function handleEditUser(e) {
    e.preventDefault();

    if (!currentUserForEdit) return;

    const nombre = elements.editNombre.value.trim();
    const usuario = elements.editUsuario.value.trim();
    const telefono = elements.editTelefono.value.trim();
    const emailRecuperacion = elements.editEmailRecuperacion.value.trim();

    // Basic validation
    if (!nombre || !usuario || !telefono || !emailRecuperacion) {
        showMessage('Todos los campos básicos son obligatorios', 'error');
        return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario) || !emailRegex.test(emailRecuperacion)) {
        showMessage('Por favor ingresa emails válidos', 'error');
        return;
    }

    try {
        const submitBtn = elements.editUserForm.querySelector('.save-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        await waitForFirebase();

        // Check if email is being changed and if it already exists
        if (usuario !== currentUserForEdit.usuario) {
            const existingUserQuery = await window.firebaseDB.collection('usuarios')
                .where('usuario', '==', usuario)
                .get();

            if (!existingUserQuery.empty) {
                showMessage('Ya existe un usuario con este email', 'error');
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

            // Get selected clases permisos
            const clasesPermitidas = [];
            const checkboxes = document.querySelectorAll('input[name="clasePermiso"]:checked');
            checkboxes.forEach(checkbox => {
                clasesPermitidas.push(checkbox.value);
            });
            updateData.clasesPermitidas = clasesPermitidas;
        }

        // Update admin-specific fields (asignaturas)
        if (currentUserForEdit.tipoUsuario === 'admin') {
            const asignaturasCheckboxes = document.querySelectorAll('input[name="asignaturaProfesorEdit"]:checked');
            const asignaturas = Array.from(asignaturasCheckboxes).map(cb => cb.value);
            updateData.asignaturas = asignaturas; // Array de asignaturas que puede enseñar
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
        const submitBtn = elements.editUserForm.querySelector('.save-btn');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
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

// Show message
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    elements.messageContainer.appendChild(messageDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
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

    // Filter data based on type
    switch (type) {
        case 'all':
            dataToExport = allUsers;
            filename = 'todos_los_usuarios';
            break;
        case 'estudiante':
            dataToExport = allUsers.filter(user => user.tipoUsuario === 'estudiante');
            filename = 'estudiantes';
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
        showMessage(`No hay ${type === 'all' ? 'usuarios' : type === 'admin' ? 'profesores' : 'estudiantes'} para exportar`, 'error');
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

    showMessage(`Exportación completada: ${dataToExport.length} registros exportados`, 'success');
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
        confirmBtn.innerHTML = '<i class="bi bi-trash"></i><span>Eliminar Definitivamente</span>';
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

// Update dashboard view to handle insignias
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

    // Always hide insignias management when switching views
    const usersTableContainer = document.getElementById('usersTableContainer');
    const insigniasManagement = document.getElementById('insigniasManagement');
    
    if (usersTableContainer) usersTableContainer.style.display = 'block';
    if (insigniasManagement) insigniasManagement.style.display = 'none';
    
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