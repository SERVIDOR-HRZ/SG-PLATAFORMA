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

// DOM Elements
const elements = {
    searchInput: document.getElementById('searchInput'),
    userTypeFilter: document.getElementById('userTypeFilter'),
    statusFilter: document.getElementById('statusFilter'),
    usersTableBody: document.getElementById('usersTableBody'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    noResults: document.getElementById('noResults'),
    refreshBtn: document.getElementById('refreshBtn'),
    createAdminBtn: document.getElementById('createAdminBtn'),
    backBtn: document.getElementById('backBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Stats
    totalUsers: document.getElementById('totalUsers'),
    totalAdmins: document.getElementById('totalAdmins'),
    totalStudents: document.getElementById('totalStudents'),
    activeUsers: document.getElementById('activeUsers'),
    
    // Modal
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
    
    // Create Admin Modal
    createAdminModal: document.getElementById('createAdminModal'),
    closeCreateAdminModal: document.getElementById('closeCreateAdminModal'),
    cancelCreateAdmin: document.getElementById('cancelCreateAdmin'),
    createAdminForm: document.getElementById('createAdminForm'),
    adminNombre: document.getElementById('adminNombre'),
    adminUsuario: document.getElementById('adminUsuario'),
    adminPassword: document.getElementById('adminPassword'),
    toggleAdminPassword: document.getElementById('toggleAdminPassword'),
    
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
    elements.createAdminBtn.addEventListener('click', openCreateAdminModal);
    elements.backBtn.addEventListener('click', () => window.location.href = 'Panel_Admin.html');
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Modal events
    elements.closeModal.addEventListener('click', closeModal);
    elements.cancelReset.addEventListener('click', closeModal);
    elements.resetPasswordForm.addEventListener('submit', handlePasswordReset);
    
    // Password toggles
    elements.togglePassword.addEventListener('click', () => togglePasswordVisibility('newPassword', 'togglePassword'));
    elements.toggleConfirmPassword.addEventListener('click', () => togglePasswordVisibility('confirmPassword', 'toggleConfirmPassword'));
    
    // Create Admin Modal events
    elements.closeCreateAdminModal.addEventListener('click', closeCreateAdminModal);
    elements.cancelCreateAdmin.addEventListener('click', closeCreateAdminModal);
    elements.createAdminForm.addEventListener('submit', handleCreateAdmin);
    elements.toggleAdminPassword.addEventListener('click', () => togglePasswordVisibility('adminPassword', 'toggleAdminPassword'));
    
    // Confirmation Modal events
    elements.closeConfirmationModal.addEventListener('click', closeConfirmationModal);
    elements.cancelConfirmation.addEventListener('click', closeConfirmationModal);
    
    // Close modals on outside click
    elements.resetPasswordModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    elements.createAdminModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeCreateAdminModal();
        }
    });
    
    elements.confirmationModal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeConfirmationModal();
        }
    });
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
                ${user.tipoUsuario === 'estudiante' ? (user.telefono || 'No especificado') : 'N/A'}
            </td>
            <td>
                ${user.tipoUsuario === 'estudiante' ? 
                    `<div class="document-info">
                        <span class="doc-type">${user.tipoDocumento || 'N/A'}</span>
                        <span class="doc-number">${user.numeroDocumento || 'N/A'}</span>
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
                ${user.tipoUsuario === 'estudiante' ? 
                    `<div class="recovery-email">
                        ${user.emailRecuperacion || 'No especificado'}
                    </div>` : 'N/A'}
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

// Open create admin modal
function openCreateAdminModal() {
    // Clear form
    elements.adminNombre.value = '';
    elements.adminUsuario.value = '';
    elements.adminPassword.value = '';
    
    elements.createAdminModal.classList.add('show');
}

// Close create admin modal
function closeCreateAdminModal() {
    elements.createAdminModal.classList.remove('show');
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

// Handle create admin
async function handleCreateAdmin(e) {
    e.preventDefault();
    
    const nombre = elements.adminNombre.value.trim();
    const usuario = elements.adminUsuario.value.trim();
    const password = elements.adminPassword.value;
    
    // Validation
    if (!nombre || !usuario || !password) {
        showMessage('Todos los campos son obligatorios', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(usuario)) {
        showMessage('Por favor ingresa un email válido', 'error');
        return;
    }
    
    try {
        const submitBtn = elements.createAdminForm.querySelector('.create-btn');
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
        
        // Create admin user object
        const adminData = {
            nombre: nombre,
            usuario: usuario,
            password: password,
            tipoUsuario: 'admin',
            activo: true,
            codigoRecuperacion: recoveryCode,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
            fechaUltimaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Add to Firestore
        await window.firebaseDB.collection('usuarios').add(adminData);
        
        showMessage(`Administrador creado exitosamente. Código de recuperación: ${recoveryCode}`, 'success');
        closeCreateAdminModal();
        loadUsers(); // Refresh the list
        
    } catch (error) {
        console.error('Error creating admin:', error);
        showMessage('Error al crear el administrador', 'error');
    } finally {
        const submitBtn = elements.createAdminForm.querySelector('.create-btn');
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

// Global functions for onclick handlers
window.openResetPasswordModal = openResetPasswordModal;
window.toggleUserStatus = toggleUserStatus;