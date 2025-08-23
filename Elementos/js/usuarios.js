// Users Management JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Load user info
    loadUserInfo();
    
    // Initialize page
    initializePage();
    
    // Load users
    loadUsers();
});

let allUsers = [];
let filteredUsers = [];
let currentUserForReset = null;
let currentUserForEdit = null;

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
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Export elements
    exportBtn: document.getElementById('exportBtn'),
    exportMenu: document.getElementById('exportMenu'),
    exportDropdown: document.querySelector('.export-dropdown'),
    
    // Stats
    totalUsers: document.getElementById('totalUsers'),
    totalAdmins: document.getElementById('totalAdmins'),
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
    
    if (!currentUser.id || currentUser.tipoUsuario !== 'admin') {
        window.location.href = '../index.html';
        return;
    }
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
    // Event listeners
    elements.searchInput.addEventListener('input', handleSearch);
    elements.userTypeFilter.addEventListener('change', handleFilter);
    elements.statusFilter.addEventListener('change', handleFilter);
    elements.refreshBtn.addEventListener('click', loadUsers);
    elements.createUserBtn.addEventListener('click', openCreateUserModal);
    elements.backBtn.addEventListener('click', () => window.location.href = 'Panel_Admin.html');
    elements.logoutBtn.addEventListener('click', handleLogout);
    
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
    
    // Edit User Modal events
    elements.closeEditUserModal.addEventListener('click', closeEditUserModal);
    elements.cancelEditUser.addEventListener('click', closeEditUserModal);
    elements.editUserForm.addEventListener('submit', handleEditUser);
    
    // Confirmation Modal events
    elements.closeConfirmationModal.addEventListener('click', closeConfirmationModal);
    elements.cancelConfirmation.addEventListener('click', closeConfirmationModal);
    
    // User type radio buttons change event
    const userTypeRadios = document.querySelectorAll('input[name="tipoUsuario"]');
    userTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleUserTypeChange);
    });
    
    // Close modals on outside click
    elements.resetPasswordModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    elements.createUserModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeCreateUserModal();
        }
    });
    
    elements.editUserModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeEditUserModal();
        }
    });
    
    elements.confirmationModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeConfirmationModal();
        }
    });
}

// Handle user type change in create modal
function handleUserTypeChange() {
    const selectedType = document.querySelector('input[name="tipoUsuario"]:checked').value;
    const studentFields = document.querySelector('.student-fields');
    const createButton = elements.createButtonText;
    
    if (selectedType === 'estudiante') {
        studentFields.style.display = 'block';
        createButton.textContent = 'Crear Estudiante';
    } else {
        studentFields.style.display = 'none';
        createButton.textContent = 'Crear Administrador';
    }
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
        
        filteredUsers = [...allUsers];
        updateStats();
        renderUsers();
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showMessage('Error al cargar usuarios', 'error');
        showLoading(false);
    }
}

// Update statistics
function updateStats() {
    const totalUsersCount = allUsers.length;
    const totalAdminsCount = allUsers.filter(user => user.tipoUsuario === 'admin').length;
    const totalStudentsCount = allUsers.filter(user => user.tipoUsuario === 'estudiante').length;
    const activeUsersCount = allUsers.filter(user => user.activo === true).length;
    
    elements.totalUsers.textContent = totalUsersCount;
    elements.totalAdmins.textContent = totalAdminsCount;
    elements.totalStudents.textContent = totalStudentsCount;
    elements.activeUsers.textContent = activeUsersCount;
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
        
        row.innerHTML = `
            <td>
                <div class="user-email">
                    <strong>${user.usuario || user.email}</strong>
                </div>
            </td>
            <td>
                <div class="user-name">
                    ${user.nombre || 'No especificado'}
                </div>
            </td>
            <td>
                <span class="user-type-badge ${user.tipoUsuario}">
                    ${user.tipoUsuario === 'admin' ? 'ADM' : 'EST'}
                </span>
            </td>
            <td>
                <span class="status-badge ${user.activo ? 'active' : 'inactive'}">
                    ${user.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                ${user.telefono || 'No especificado'}
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
                <div class="recovery-email">
                    ${user.emailRecuperacion || 'No especificado'}
                </div>
            </td>
            <td>
                <div class="recovery-code">
                    <strong>${user.codigoRecuperacion || 'No disponible'}</strong>
                </div>
            </td>
            <td>
                ${creationDate}
            </td>
            <td>
                <div class="action-buttons">
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
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
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
    const userTypeFilter = elements.userTypeFilter.value;
    const statusFilter = elements.statusFilter.value;
    
    filteredUsers = allUsers.filter(user => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (user.nombre && user.nombre.toLowerCase().includes(searchTerm)) ||
            (user.usuario && user.usuario.toLowerCase().includes(searchTerm)) ||
            (user.email && user.email.toLowerCase().includes(searchTerm)) ||
            (user.institucion && user.institucion.toLowerCase().includes(searchTerm)) ||
            (user.telefono && user.telefono.includes(searchTerm)) ||
            (user.numeroDocumento && user.numeroDocumento.includes(searchTerm)) ||
            (user.tipoDocumento && user.tipoDocumento.toLowerCase().includes(searchTerm)) ||
            (user.grado && user.grado.toLowerCase().includes(searchTerm)) ||
            (user.departamento && user.departamento.toLowerCase().includes(searchTerm)) ||
            (user.emailRecuperacion && user.emailRecuperacion.toLowerCase().includes(searchTerm));
        
        // User type filter
        const matchesUserType = !userTypeFilter || user.tipoUsuario === userTypeFilter;
        
        // Status filter
        const matchesStatus = !statusFilter || user.activo.toString() === statusFilter;
        
        return matchesSearch && matchesUserType && matchesStatus;
    });
    
    renderUsers();
}

// Open create user modal
function openCreateUserModal() {
    // Clear form
    elements.createUserForm.reset();
    
    // Set default user type to student
    document.querySelector('input[name="tipoUsuario"][value="estudiante"]').checked = true;
    handleUserTypeChange();
    
    elements.createUserModal.classList.add('show');
}

// Close create user modal
function closeCreateUserModal() {
    elements.createUserModal.classList.remove('show');
}

// Open edit user modal
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    currentUserForEdit = user;
    
    // Fill form with user data
    elements.editNombre.value = user.nombre || '';
    elements.editUsuario.value = user.usuario || user.email || '';
    elements.editTelefono.value = user.telefono || '';
    elements.editEmailRecuperacion.value = user.emailRecuperacion || '';
    
    // Set user type badge
    const isAdmin = user.tipoUsuario === 'admin';
    elements.editUserTypeBadge.className = `user-type-badge-display ${user.tipoUsuario}`;
    elements.editUserTypeBadge.querySelector('i').className = isAdmin ? 'bi bi-person-badge-fill' : 'bi bi-person-fill';
    elements.editUserTypeText.textContent = isAdmin ? 'Administrador' : 'Estudiante';
    
    // Show/hide student fields
    const studentFields = document.querySelector('.student-edit-fields');
    if (user.tipoUsuario === 'estudiante') {
        studentFields.style.display = 'block';
        elements.editInstitucion.value = user.institucion || '';
        elements.editGrado.value = user.grado || '';
        elements.editTipoDocumento.value = user.tipoDocumento || '';
        elements.editNumeroDocumento.value = user.numeroDocumento || '';
        elements.editDepartamento.value = user.departamento || '';
    } else {
        studentFields.style.display = 'none';
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
    elements.modalUserType.textContent = user.tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante';
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
    const usuario = elements.createUsuario.value.trim();
    const password = elements.createPassword.value;
    const telefono = elements.createTelefono.value.trim();
    const emailRecuperacion = elements.createEmailRecuperacion.value.trim();
    
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
        
        // Create user data object
        const userData = {
            nombre: nombre,
            usuario: usuario,
            password: password,
            telefono: telefono,
            emailRecuperacion: emailRecuperacion,
            tipoUsuario: tipoUsuario,
            activo: true,
            codigoRecuperacion: recoveryCode,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaUltimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add student-specific fields
        if (tipoUsuario === 'estudiante') {
            userData.institucion = elements.createInstitucion.value.trim();
            userData.grado = elements.createGrado.value;
            userData.tipoDocumento = elements.createTipoDocumento.value;
            userData.numeroDocumento = elements.createNumeroDocumento.value.trim();
            userData.departamento = elements.createDepartamento.value;
        }
        
        // Add to Firestore
        await window.firebaseDB.collection('usuarios').add(userData);
        
        showMessage(`${tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante'} creado exitosamente. Código de recuperación: ${recoveryCode}`, 'success');
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
            fechaUltimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
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
    
    try {
        const submitBtn = elements.resetPasswordForm.querySelector('.reset-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        
        await waitForFirebase();
        
        // Generate new recovery code
        const newRecoveryCode = generateRecoveryCode();
        
        // Update password and recovery code
        await window.firebaseDB.collection('usuarios').doc(currentUserForReset.id).update({
            password: newPassword,
            codigoRecuperacion: newRecoveryCode,
            fechaUltimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showMessage(`Contraseña restablecida exitosamente. Nuevo código de recuperación: ${newRecoveryCode}`, 'success');
        closeModal();
        loadUsers(); // Refresh the list
        
    } catch (error) {
        console.error('Error resetting password:', error);
        showMessage('Error al restablecer la contraseña', 'error');
    } finally {
        const submitBtn = elements.resetPasswordForm.querySelector('.reset-btn');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
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
                fechaUltimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
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
    switch(type) {
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
            filename = 'administradores';
            break;
        default:
            dataToExport = allUsers;
            filename = 'usuarios';
    }
    
    if (dataToExport.length === 0) {
        showMessage(`No hay ${type === 'all' ? 'usuarios' : type === 'admin' ? 'administradores' : 'estudiantes'} para exportar`, 'error');
        return;
    }
    
    // Prepare data for Excel
    const excelData = dataToExport.map(user => {
        const baseData = {
            'Usuario': user.usuario || user.email || '',
            'Nombre': user.nombre || '',
            'Tipo': user.tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante',
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
        {wch: 25}, // Usuario
        {wch: 20}, // Nombre
        {wch: 15}, // Tipo
        {wch: 10}, // Estado
        {wch: 15}, // Teléfono
        {wch: 25}, // Email Recuperación
        {wch: 20}, // Código Recuperación
        {wch: 15}, // Fecha Registro
        {wch: 25}, // Institución
        {wch: 12}, // Grado
        {wch: 15}, // Tipo Documento
        {wch: 18}, // Número Documento
        {wch: 20}  // Departamento
    ];
    ws['!cols'] = colWidths;
    
    // Generate filename with current date
    const currentDate = new Date().toLocaleDateString('es-ES').replace(/\//g, '-');
    const finalFilename = `${filename}_${currentDate}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, finalFilename);
    
    showMessage(`Exportación completada: ${dataToExport.length} registros exportados`, 'success');
}

// Global functions for onclick handlers
window.openResetPasswordModal = openResetPasswordModal;
window.toggleUserStatus = toggleUserStatus;
window.openEditUserModal = openEditUserModal;