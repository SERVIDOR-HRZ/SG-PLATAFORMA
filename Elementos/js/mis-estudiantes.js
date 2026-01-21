// Mis Estudiantes - Coordinador JavaScript

let todosLosEstudiantes = [];
let estudiantesFiltrados = [];
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = 'todos';
let coordinadorInstitucion = '';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Initialize time display
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
    
    // Load user info
    loadUserInfo();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load students
    loadEstudiantes();
});

// Check authentication
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.id || currentUser.rol !== 'coordinador') {
        window.location.href = 'login.html';
        return;
    }
}

// Load user info
async function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (currentUser.nombre) {
        document.getElementById('coordinadorName').textContent = currentUser.nombre.toUpperCase();
    }
    
    // Load coordinator data to get institution
    await loadCoordinadorData(currentUser.id);
}

// Load coordinator data
async function loadCoordinadorData(userId) {
    try {
        await esperarFirebase();
        
        const doc = await window.firebaseDB.collection('usuarios').doc(userId).get();
        
        if (doc.exists) {
            const data = doc.data();
            coordinadorInstitucion = data.institucion || '';
            
            if (coordinadorInstitucion) {
                document.getElementById('institutionName').textContent = coordinadorInstitucion;
            } else {
                document.getElementById('institutionName').textContent = 'Sin institución asignada';
            }
            
            // Load avatar if exists
            if (data.fotoPerfil) {
                const avatarDefault = document.getElementById('userAvatarDefault');
                const avatarImage = document.getElementById('userAvatarImage');
                
                if (avatarDefault && avatarImage) {
                    avatarDefault.style.display = 'none';
                    avatarImage.src = data.fotoPerfil;
                    avatarImage.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error loading coordinator data:', error);
    }
}

// Wait for Firebase
function esperarFirebase() {
    return new Promise(resolve => {
        const check = () => {
            if (window.firebaseDB) resolve();
            else setTimeout(check, 100);
        };
        check();
    });
}

// Update time display
function updateTimeDisplay() {
    const now = new Date();
    const hour = now.getHours();
    
    const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const timeString = now.toLocaleTimeString('en-US', timeOptions);
    
    const dateOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    };
    const dateString = now.toLocaleDateString('es-ES', dateOptions);
    
    const timeIcon = document.getElementById('timeIcon');
    if (timeIcon) {
        if (hour >= 6 && hour < 12) {
            timeIcon.className = 'bi bi-sunrise-fill';
        } else if (hour >= 12 && hour < 18) {
            timeIcon.className = 'bi bi-sun-fill';
        } else if (hour >= 18 && hour < 21) {
            timeIcon.className = 'bi bi-sunset-fill';
        } else {
            timeIcon.className = 'bi bi-moon-stars-fill';
        }
    }
    
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    
    if (timeElement) timeElement.textContent = timeString;
    if (dateElement) dateElement.textContent = dateString;
}

// Setup event listeners
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('btnPanel')?.addEventListener('click', () => {
        window.location.href = 'Panel_Coordinador.html';
    });
    
    document.getElementById('btnProfile')?.addEventListener('click', () => {
        window.location.href = 'Perfil-Coordinador.html';
    });
    
    document.getElementById('btnHome')?.addEventListener('click', () => {
        window.location.href = '../index.html';
    });
    
    document.getElementById('btnLogout')?.addEventListener('click', handleLogout);
    
    // Search
    document.getElementById('searchInput')?.addEventListener('input', handleSearch);
    
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            currentPage = 1;
            aplicarFiltros();
        });
    });
    
    // Export button
    document.getElementById('btnExport')?.addEventListener('click', exportarEstudiantes);
    
    // Pagination
    document.getElementById('btnPrevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    
    document.getElementById('btnNextPage')?.addEventListener('click', () => {
        const totalPages = Math.ceil(estudiantesFiltrados.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
    
    // Modal close
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    
    // Mobile menu
    setupMobileMenu();
}

// Setup mobile menu
function setupMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarPanel = document.getElementById('sidebarPanel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle && sidebarPanel && sidebarOverlay) {
        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'flex';
        }
        
        mobileMenuToggle.addEventListener('click', () => {
            const isActive = sidebarPanel.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            
            const icon = mobileMenuToggle.querySelector('i');
            icon.className = isActive ? 'bi bi-chevron-left' : 'bi bi-chevron-right';
        });
        
        sidebarOverlay.addEventListener('click', () => {
            sidebarPanel.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            mobileMenuToggle.querySelector('i').className = 'bi bi-chevron-right';
        });
        
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                mobileMenuToggle.style.display = 'flex';
            } else {
                mobileMenuToggle.style.display = 'none';
                sidebarPanel.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    }
}

// Load students
async function loadEstudiantes() {
    try {
        console.log('=== INICIANDO CARGA DE ESTUDIANTES ===');
        
        await esperarFirebase();
        console.log('✓ Firebase listo');
        
        if (!coordinadorInstitucion) {
            console.log('⚠️ Institución no cargada, cargando datos del coordinador...');
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            await loadCoordinadorData(currentUser.id);
        }
        
        console.log('📍 Institución del coordinador:', coordinadorInstitucion);
        
        if (!coordinadorInstitucion) {
            console.error('❌ No se pudo obtener la institución del coordinador');
            showEmptyState('No tienes una institución asignada');
            return;
        }
        
        console.log('🔍 Buscando estudiantes de la institución:', coordinadorInstitucion);
        
        // Buscar por tipoUsuario (que es el campo correcto para estudiantes)
        const snapshot = await window.firebaseDB.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .where('institucion', '==', coordinadorInstitucion)
            .get();
        
        console.log('📊 Documentos encontrados:', snapshot.size);
        
        todosLosEstudiantes = [];
        
        snapshot.forEach(doc => {
            const data = doc.data();
            console.log('👤 Estudiante:', data.nombre);
            todosLosEstudiantes.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log('✓ Total estudiantes cargados:', todosLosEstudiantes.length);
        
        // Sort by name
        todosLosEstudiantes.sort((a, b) => {
            const nameA = (a.nombre || '').toLowerCase();
            const nameB = (b.nombre || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        
        estudiantesFiltrados = [...todosLosEstudiantes];
        
        updateStats();
        renderTable();
        
        document.getElementById('loadingState').style.display = 'none';
        
        if (todosLosEstudiantes.length === 0) {
            console.log('ℹ️ No hay estudiantes en esta institución');
            showEmptyState('No hay estudiantes registrados en tu institución');
        } else {
            console.log('=== CARGA COMPLETADA EXITOSAMENTE ===');
        }
        
    } catch (error) {
        console.error('❌ Error loading students:', error);
        console.error('Detalles del error:', error.message);
        showEmptyState('Error al cargar los estudiantes: ' + error.message);
    }
}

// Update statistics
function updateStats() {
    const total = todosLosEstudiantes.length;
    
    // Calculate active and inactive students
    const activos = todosLosEstudiantes.filter(est => est.activo === true || est.activo === undefined).length;
    const inactivos = todosLosEstudiantes.filter(est => est.activo === false).length;
    
    document.getElementById('totalEstudiantes').textContent = total;
    document.getElementById('estudiantesActivos').textContent = activos;
    document.getElementById('estudiantesInactivos').textContent = inactivos;
}

// Apply filters
function aplicarFiltros() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    estudiantesFiltrados = todosLosEstudiantes.filter(estudiante => {
        // Search filter
        const matchesSearch = !searchTerm || 
            (estudiante.nombre || '').toLowerCase().includes(searchTerm) ||
            (estudiante.email || estudiante.correo || '').toLowerCase().includes(searchTerm) ||
            (estudiante.numeroDocumento || '').toLowerCase().includes(searchTerm);
        
        if (!matchesSearch) return false;
        
        // Status filter
        if (currentFilter === 'todos') return true;
        
        if (currentFilter === 'activos') {
            return estudiante.activo === true || estudiante.activo === undefined;
        }
        
        if (currentFilter === 'inactivos') {
            return estudiante.activo === false;
        }
        
        return true;
    });
    
    currentPage = 1;
    renderTable();
}

// Handle search
function handleSearch() {
    aplicarFiltros();
}

// Render table
function renderTable() {
    const tbody = document.getElementById('studentsTableBody');
    const table = document.getElementById('studentsTable');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (estudiantesFiltrados.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        paginationContainer.style.display = 'none';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const estudiantesPage = estudiantesFiltrados.slice(startIndex, endIndex);
    
    // Render rows
    tbody.innerHTML = '';
    
    estudiantesPage.forEach(estudiante => {
        const tr = document.createElement('tr');
        
        // Photo
        const tdPhoto = document.createElement('td');
        if (estudiante.fotoPerfil) {
            tdPhoto.innerHTML = `<img src="${estudiante.fotoPerfil}" alt="${estudiante.nombre}" class="student-photo">`;
        } else {
            const inicial = (estudiante.nombre || 'E')[0].toUpperCase();
            tdPhoto.innerHTML = `<div class="student-avatar">${inicial}</div>`;
        }
        tr.appendChild(tdPhoto);
        
        // Name
        const tdName = document.createElement('td');
        tdName.innerHTML = `<span class="student-name">${estudiante.nombre || 'Sin nombre'}</span>`;
        tr.appendChild(tdName);
        
        // Email
        const tdEmail = document.createElement('td');
        tdEmail.textContent = estudiante.email || estudiante.correo || 'No disponible';
        tr.appendChild(tdEmail);
        
        // Document
        const tdDoc = document.createElement('td');
        tdDoc.textContent = estudiante.numeroDocumento || 'No disponible';
        tr.appendChild(tdDoc);
        
        // Phone
        const tdPhone = document.createElement('td');
        const telefonoLimpio = limpiarTelefono(estudiante.telefono);
        tdPhone.textContent = telefonoLimpio || 'No disponible';
        tr.appendChild(tdPhone);
        
        // Registration date
        const tdDate = document.createElement('td');
        if (estudiante.fechaCreacion && estudiante.fechaCreacion.toDate) {
            const fecha = estudiante.fechaCreacion.toDate();
            tdDate.textContent = fecha.toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } else {
            tdDate.textContent = 'No disponible';
        }
        tr.appendChild(tdDate);
        
        // Status
        const tdStatus = document.createElement('td');
        const isActive = estudiante.activo === true || estudiante.activo === undefined;
        tdStatus.innerHTML = `<span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Activo' : 'Inactivo'}</span>`;
        tr.appendChild(tdStatus);
        
        // Actions
        const tdActions = document.createElement('td');
        tdActions.innerHTML = `
            <div class="action-buttons">
                <button class="action-btn btn-actions" onclick="toggleActionsMenu(event, '${estudiante.id}')" title="Acciones">
                    <i class="bi bi-three-dots-vertical"></i>
                </button>
                <div class="actions-menu" id="actionsMenu-${estudiante.id}" style="display: none;">
                    <button class="action-menu-item" onclick="verDetalleEstudiante('${estudiante.id}')">
                        <i class="bi bi-eye-fill"></i>
                        Ver Detalle
                    </button>
                    <button class="action-menu-item" onclick="toggleEstadoEstudiante('${estudiante.id}', ${isActive})">
                        <i class="bi bi-${isActive ? 'person-x' : 'person-check'}-fill"></i>
                        ${isActive ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="action-menu-item" onclick="verCodigoRecuperacion('${estudiante.id}')">
                        <i class="bi bi-key-fill"></i>
                        Ver Código Recuperación
                    </button>
                    <button class="action-menu-item" onclick="restablecerContrasena('${estudiante.id}')">
                        <i class="bi bi-shield-lock-fill"></i>
                        Restablecer Contraseña
                    </button>
                </div>
            </div>
        `;
        tr.appendChild(tdActions);
        
        tbody.appendChild(tr);
    });
    
    // Update pagination
    updatePagination();
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(estudiantesFiltrados.length / itemsPerPage);
    const paginationContainer = document.getElementById('paginationContainer');
    const btnPrev = document.getElementById('btnPrevPage');
    const btnNext = document.getElementById('btnNextPage');
    const paginationInfo = document.getElementById('paginationInfo');
    
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    paginationContainer.style.display = 'flex';
    
    btnPrev.disabled = currentPage === 1;
    btnNext.disabled = currentPage === totalPages;
    
    paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;
}

// Show empty state
function showEmptyState(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('studentsTable').style.display = 'none';
    document.getElementById('paginationContainer').style.display = 'none';
    
    const emptyState = document.getElementById('emptyState');
    emptyState.style.display = 'block';
    emptyState.querySelector('p').textContent = message;
}

// Ver detalle estudiante
window.verDetalleEstudiante = function(estudianteId) {
    const estudiante = todosLosEstudiantes.find(e => e.id === estudianteId);
    if (!estudiante) return;
    
    const modalBody = document.getElementById('modalBody');
    
    const fechaRegistro = estudiante.fechaCreacion && estudiante.fechaCreacion.toDate 
        ? estudiante.fechaCreacion.toDate().toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
        : 'No disponible';
    
    const isActive = estudiante.activo === true || estudiante.activo === undefined;
    
    modalBody.innerHTML = `
        <div style="text-align: center; margin-bottom: 2rem;">
            ${estudiante.fotoPerfil 
                ? `<img src="${estudiante.fotoPerfil}" alt="${estudiante.nombre}" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 3px solid #17a2b8;">`
                : `<div style="width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #17a2b8, #138496); display: flex; align-items: center; justify-content: center; margin: 0 auto; color: white; font-size: 3rem; font-weight: 700;">${(estudiante.nombre || 'E')[0].toUpperCase()}</div>`
            }
            <h3 style="color: white; margin-top: 1rem; font-size: 1.5rem;">${estudiante.nombre || 'Sin nombre'}</h3>
            <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}" style="margin-top: 0.5rem;">
                ${isActive ? 'Activo' : 'Inactivo'}
            </span>
        </div>
        
        <div style="display: grid; gap: 1.5rem;">
            <div style="background: rgba(23, 162, 184, 0.1); padding: 1rem; border-radius: 12px; border-left: 3px solid #17a2b8;">
                <div style="color: #17a2b8; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">EMAIL</div>
                <div style="color: white; font-size: 1rem;">${estudiante.email || estudiante.correo || 'No disponible'}</div>
            </div>
            
            <div style="background: rgba(23, 162, 184, 0.1); padding: 1rem; border-radius: 12px; border-left: 3px solid #17a2b8;">
                <div style="color: #17a2b8; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">DOCUMENTO</div>
                <div style="color: white; font-size: 1rem;">${estudiante.tipoDocumento || ''} ${estudiante.numeroDocumento || 'No disponible'}</div>
            </div>
            
            <div style="background: rgba(23, 162, 184, 0.1); padding: 1rem; border-radius: 12px; border-left: 3px solid #17a2b8;">
                <div style="color: #17a2b8; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">TELÉFONO</div>
                <div style="color: white; font-size: 1rem;">${estudiante.telefono || 'No disponible'}</div>
            </div>
            
            <div style="background: rgba(23, 162, 184, 0.1); padding: 1rem; border-radius: 12px; border-left: 3px solid #17a2b8;">
                <div style="color: #17a2b8; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">FECHA DE NACIMIENTO</div>
                <div style="color: white; font-size: 1rem;">${estudiante.fechaNacimiento || 'No disponible'}</div>
            </div>
            
            <div style="background: rgba(23, 162, 184, 0.1); padding: 1rem; border-radius: 12px; border-left: 3px solid #17a2b8;">
                <div style="color: #17a2b8; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">INSTITUCIÓN</div>
                <div style="color: white; font-size: 1rem;">${estudiante.institucion || 'No disponible'}</div>
            </div>
            
            <div style="background: rgba(23, 162, 184, 0.1); padding: 1rem; border-radius: 12px; border-left: 3px solid #17a2b8;">
                <div style="color: #17a2b8; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.25rem;">FECHA DE REGISTRO</div>
                <div style="color: white; font-size: 1rem;">${fechaRegistro}</div>
            </div>
        </div>
    `;
    
    document.getElementById('modalOverlay').classList.add('active');
};

// Close modal
function closeModal() {
    document.getElementById('modalOverlay').classList.remove('active');
}

// Export students
async function exportarEstudiantes() {
    if (estudiantesFiltrados.length === 0) {
        await mostrarAlerta('Sin Datos', 'No hay estudiantes para exportar', 'info');
        return;
    }
    
    // Create CSV content
    let csv = 'Nombre,Email,Documento,Teléfono,Fecha Nacimiento,Institución,Fecha Registro,Estado\n';
    
    estudiantesFiltrados.forEach(est => {
        const fechaRegistro = est.fechaCreacion && est.fechaCreacion.toDate 
            ? est.fechaCreacion.toDate().toLocaleDateString('es-ES')
            : 'No disponible';
        
        const estado = isNuevoEstudiante(est) ? 'Nuevo' : 'Activo';
        
        csv += `"${est.nombre || ''}","${est.email || est.correo || ''}","${est.numeroDocumento || ''}","${est.telefono || ''}","${est.fechaNacimiento || ''}","${est.institucion || ''}","${fechaRegistro}","${estado}"\n`;
    });
    
    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `estudiantes_${coordinadorInstitucion}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Handle logout
async function handleLogout() {
    const confirmed = await mostrarConfirmacion(
        'Cerrar Sesión',
        '¿Estás seguro de que deseas cerrar sesión?',
        'warning'
    );
    
    if (confirmed) {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// Toggle actions menu
window.toggleActionsMenu = function(event, estudianteId) {
    event.stopPropagation();
    
    // Close all other menus
    document.querySelectorAll('.actions-menu').forEach(menu => {
        if (menu.id !== `actionsMenu-${estudianteId}`) {
            menu.style.display = 'none';
        }
    });
    
    // Toggle current menu
    const menu = document.getElementById(`actionsMenu-${estudianteId}`);
    menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
};

// Close menus when clicking outside
document.addEventListener('click', function() {
    document.querySelectorAll('.actions-menu').forEach(menu => {
        menu.style.display = 'none';
    });
});

// Toggle student status (activate/deactivate)
window.toggleEstadoEstudiante = async function(estudianteId, currentStatus) {
    const estudiante = todosLosEstudiantes.find(e => e.id === estudianteId);
    if (!estudiante) return;
    
    const action = currentStatus ? 'desactivar' : 'activar';
    const actionTitle = currentStatus ? 'Desactivar Estudiante' : 'Activar Estudiante';
    
    // Show confirmation modal
    const confirmed = await mostrarConfirmacion(
        actionTitle,
        `¿Estás seguro de que deseas ${action} a <strong>${estudiante.nombre}</strong>?`,
        currentStatus ? 'warning' : 'success'
    );
    
    if (!confirmed) return;
    
    try {
        await esperarFirebase();
        
        await window.firebaseDB.collection('usuarios').doc(estudianteId).update({
            activo: !currentStatus
        });
        
        // Update local data
        estudiante.activo = !currentStatus;
        
        // Reload table
        renderTable();
        updateStats();
        
        mostrarNotificacion(`Estudiante ${action} correctamente`, 'success');
    } catch (error) {
        console.error('Error toggling student status:', error);
        mostrarNotificacion('Error al cambiar el estado del estudiante', 'error');
    }
};

// Ver código de recuperación
window.verCodigoRecuperacion = async function(estudianteId) {
    const estudiante = todosLosEstudiantes.find(e => e.id === estudianteId);
    if (!estudiante) return;
    
    try {
        await esperarFirebase();
        
        const doc = await window.firebaseDB.collection('usuarios').doc(estudianteId).get();
        const data = doc.data();
        
        const codigo = data.codigoRecuperacion || 'No disponible';
        
        // Show modal with code
        const modalHTML = `
            <div class="modal-overlay active" id="codigoModal" style="z-index: 3000;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header">
                        <h2 style="color: white; margin: 0;">Código de Recuperación</h2>
                        <button class="modal-close" onclick="document.getElementById('codigoModal').remove()">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="padding: 2rem;">
                        <div style="text-align: center; margin-bottom: 1.5rem;">
                            <div style="font-size: 1.1rem; color: rgba(255,255,255,0.8); margin-bottom: 0.5rem;">
                                ${estudiante.nombre}
                            </div>
                            <div style="font-size: 0.9rem; color: rgba(255,255,255,0.6);">
                                ${estudiante.email || estudiante.correo || estudiante.usuario}
                            </div>
                        </div>
                        <div style="background: rgba(23, 162, 184, 0.1); padding: 1.5rem; border-radius: 12px; border: 2px solid #17a2b8; text-align: center;">
                            <div style="color: #17a2b8; font-size: 0.9rem; font-weight: 600; margin-bottom: 0.75rem;">
                                CÓDIGO DE RECUPERACIÓN
                            </div>
                            <div style="color: white; font-size: 1.8rem; font-weight: 700; letter-spacing: 2px; font-family: monospace;">
                                ${codigo}
                            </div>
                        </div>
                        <div style="margin-top: 1.5rem; text-align: center;">
                            <button onclick="copiarCodigo('${codigo}')" style="padding: 0.75rem 1.5rem; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                <i class="bi bi-clipboard"></i> Copiar Código
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Error getting recovery code:', error);
        mostrarNotificacion('Error al obtener el código de recuperación', 'error');
    }
};

// Copiar código al portapapeles
window.copiarCodigo = function(codigo) {
    navigator.clipboard.writeText(codigo).then(() => {
        mostrarNotificacion('Código copiado al portapapeles', 'success');
    }).catch(() => {
        mostrarNotificacion('Error al copiar el código', 'error');
    });
};

// Restablecer contraseña
window.restablecerContrasena = async function(estudianteId) {
    const estudiante = todosLosEstudiantes.find(e => e.id === estudianteId);
    if (!estudiante) return;
    
    const modalHTML = `
        <div class="modal-overlay active" id="resetPasswordModal" style="z-index: 3000;">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 style="color: white; margin: 0;">Restablecer Contraseña</h2>
                    <button class="modal-close" onclick="document.getElementById('resetPasswordModal').remove()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="modal-body" style="padding: 2rem;">
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <div style="font-size: 1.1rem; color: rgba(255,255,255,0.8); margin-bottom: 0.5rem;">
                            ${estudiante.nombre}
                        </div>
                        <div style="font-size: 0.9rem; color: rgba(255,255,255,0.6);">
                            ${estudiante.email || estudiante.correo || estudiante.usuario}
                        </div>
                    </div>
                    <form id="resetPasswordForm" onsubmit="submitResetPassword(event, '${estudianteId}')">
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; color: rgba(255,255,255,0.9); font-weight: 600; margin-bottom: 0.5rem;">
                                Nueva Contraseña
                            </label>
                            <input type="password" id="newPassword" required minlength="6" 
                                style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 2px solid rgba(23,162,184,0.3); background: #000; color: white; font-size: 1rem;"
                                placeholder="Mínimo 6 caracteres">
                        </div>
                        <div style="margin-bottom: 1.5rem;">
                            <label style="display: block; color: rgba(255,255,255,0.9); font-weight: 600; margin-bottom: 0.5rem;">
                                Confirmar Contraseña
                            </label>
                            <input type="password" id="confirmPassword" required minlength="6"
                                style="width: 100%; padding: 0.75rem; border-radius: 8px; border: 2px solid rgba(23,162,184,0.3); background: #000; color: white; font-size: 1rem;"
                                placeholder="Repite la contraseña">
                        </div>
                        <div style="background: rgba(23,162,184,0.1); padding: 1rem; border-radius: 8px; border-left: 3px solid #17a2b8; margin-bottom: 1.5rem;">
                            <i class="bi bi-info-circle" style="color: #17a2b8;"></i>
                            <span style="color: rgba(255,255,255,0.8); font-size: 0.9rem; margin-left: 0.5rem;">
                                Se generará un nuevo código de recuperación automáticamente
                            </span>
                        </div>
                        <div style="display: flex; gap: 1rem;">
                            <button type="button" onclick="document.getElementById('resetPasswordModal').remove()"
                                style="flex: 1; padding: 0.75rem; background: rgba(255,255,255,0.1); color: white; border: 2px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; font-weight: 600;">
                                Cancelar
                            </button>
                            <button type="submit"
                                style="flex: 1; padding: 0.75rem; background: #17a2b8; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                                <i class="bi bi-shield-lock-fill"></i> Restablecer
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
};

// Submit reset password
window.submitResetPassword = async function(event, estudianteId) {
    event.preventDefault();
    
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (newPassword !== confirmPassword) {
        mostrarNotificacion('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        mostrarNotificacion('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        await esperarFirebase();
        
        // Generate new recovery code
        const newCode = Math.random().toString(36).substring(2, 10).toUpperCase();
        
        // Update password and recovery code
        await window.firebaseDB.collection('usuarios').doc(estudianteId).update({
            password: newPassword,
            codigoRecuperacion: newCode
        });
        
        document.getElementById('resetPasswordModal').remove();
        mostrarNotificacion('Contraseña restablecida correctamente', 'success');
        
        // Show new recovery code
        setTimeout(() => {
            verCodigoRecuperacion(estudianteId);
        }, 500);
        
    } catch (error) {
        console.error('Error resetting password:', error);
        mostrarNotificacion('Error al restablecer la contraseña', 'error');
    }
};

// Limpiar número de teléfono (remover código de país)
function limpiarTelefono(telefono) {
    if (!telefono) return '';
    
    // Remover espacios y caracteres especiales excepto números
    let limpio = telefono.toString().replace(/\s+/g, '');
    
    // Remover códigos de país comunes (+57, +1, etc.)
    limpio = limpio.replace(/^\+\d{1,3}/, '');
    
    return limpio;
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    // Remover notificaciones anteriores
    const notifAnterior = document.querySelector('.notification-toast');
    if (notifAnterior) {
        notifAnterior.remove();
    }
    
    const iconos = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    
    const colores = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    
    const notificacion = document.createElement('div');
    notificacion.className = 'notification-toast';
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #1a1a1a;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        border-left: 4px solid ${colores[tipo]};
        display: flex;
        align-items: center;
        gap: 1rem;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    notificacion.innerHTML = `
        <i class="bi ${iconos[tipo]}" style="font-size: 1.5rem; color: ${colores[tipo]};"></i>
        <span style="flex: 1; font-weight: 500;">${mensaje}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: rgba(255,255,255,0.6); cursor: pointer; font-size: 1.2rem; padding: 0; width: 24px; height: 24px;">
            <i class="bi bi-x"></i>
        </button>
    `;
    
    document.body.appendChild(notificacion);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (notificacion.parentElement) {
            notificacion.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, 5000);
}

// Agregar animaciones CSS
if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Mostrar confirmación (reemplaza confirm())
function mostrarConfirmacion(titulo, mensaje, tipo = 'warning') {
    return new Promise((resolve) => {
        const iconos = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };
        
        const colores = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        const modalHTML = `
            <div class="modal-overlay active" id="confirmModal" style="z-index: 5000;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <i class="bi ${iconos[tipo]}" style="font-size: 2rem; color: ${colores[tipo]};"></i>
                            <h2 style="color: white; margin: 0; font-size: 1.5rem;">${titulo}</h2>
                        </div>
                        <button class="modal-close" onclick="document.getElementById('confirmModal').remove(); window.confirmModalResolve(false);">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="padding: 2rem;">
                        <p style="color: rgba(255,255,255,0.9); font-size: 1.1rem; line-height: 1.6; margin: 0;">
                            ${mensaje}
                        </p>
                        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
                            <button onclick="document.getElementById('confirmModal').remove(); window.confirmModalResolve(false);"
                                style="flex: 1; padding: 0.85rem; background: rgba(255,255,255,0.1); color: white; border: 2px solid rgba(255,255,255,0.2); border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: all 0.3s ease;">
                                Cancelar
                            </button>
                            <button onclick="document.getElementById('confirmModal').remove(); window.confirmModalResolve(true);"
                                style="flex: 1; padding: 0.85rem; background: ${colores[tipo]}; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: all 0.3s ease;">
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        window.confirmModalResolve = resolve;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    });
}

// Mostrar alerta (reemplaza alert())
function mostrarAlerta(titulo, mensaje, tipo = 'info') {
    return new Promise((resolve) => {
        const iconos = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };
        
        const colores = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        
        const modalHTML = `
            <div class="modal-overlay active" id="alertModal" style="z-index: 5000;">
                <div class="modal-content" style="max-width: 500px;">
                    <div class="modal-header" style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <i class="bi ${iconos[tipo]}" style="font-size: 2rem; color: ${colores[tipo]};"></i>
                            <h2 style="color: white; margin: 0; font-size: 1.5rem;">${titulo}</h2>
                        </div>
                        <button class="modal-close" onclick="document.getElementById('alertModal').remove(); window.alertModalResolve();">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="padding: 2rem;">
                        <p style="color: rgba(255,255,255,0.9); font-size: 1.1rem; line-height: 1.6; margin: 0;">
                            ${mensaje}
                        </p>
                        <div style="margin-top: 2rem;">
                            <button onclick="document.getElementById('alertModal').remove(); window.alertModalResolve();"
                                style="width: 100%; padding: 0.85rem; background: ${colores[tipo]}; color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; transition: all 0.3s ease;">
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        window.alertModalResolve = resolve;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    });
}
