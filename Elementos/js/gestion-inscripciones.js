// Gestión de Inscripciones - JavaScript
// ImgBB API Configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

let metodosPago = [];
let currentMetodoId = null;
let selectedImageFile = null;
let selectedImageUrl = null;
let currentView = 'metodos-pago'; // Vista actual

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const icon = document.getElementById('notificationIcon');
    const messageEl = document.getElementById('notificationMessage');

    // Remover clases anteriores
    toast.classList.remove('success', 'error', 'warning', 'info', 'show');

    // Configurar icono según el tipo
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    icon.className = `notification-icon ${icons[type] || icons.info}`;
    messageEl.textContent = message;
    toast.classList.add(type);

    // Mostrar notificación
    setTimeout(() => toast.classList.add('show'), 100);

    // Ocultar después de 4 segundos
    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Función para cambiar entre vistas
function switchView(view) {
    currentView = view;

    // Actualizar botones del menú
    const menuItems = document.querySelectorAll('.sidebar-menu-item');
    menuItems.forEach(item => {
        if (item.getAttribute('data-view') === view) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Actualizar secciones de contenido
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar la sección correspondiente
    if (view === 'metodos-pago') {
        document.getElementById('seccionMetodosPago').classList.add('active');
    } else if (view === 'inscritos') {
        document.getElementById('seccionInscritos').classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.id || currentUser.tipoUsuario !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    // Mostrar nombre del usuario
    const userNameElement = document.getElementById('userName');
    if (userNameElement && currentUser.nombre) {
        userNameElement.textContent = currentUser.nombre.toUpperCase();
    }

    // Cargar avatar del usuario
    loadUserAvatar();

    // Inicializar eventos
    initializeEvents();

    // Cargar métodos de pago
    loadMetodosPago();

    // Inicializar vista por defecto
    switchView('metodos-pago');
});

// Inicializar eventos
function initializeEvents() {
    // Botones del menú de navegación
    const btnMetodosPago = document.getElementById('btnMetodosPago');
    const btnInscritos = document.getElementById('btnInscritos');

    if (btnMetodosPago) {
        btnMetodosPago.addEventListener('click', () => switchView('metodos-pago'));
    }

    if (btnInscritos) {
        btnInscritos.addEventListener('click', () => switchView('inscritos'));
    }

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarPanel = document.getElementById('sidebarPanel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    if (mobileMenuToggle && sidebarPanel && sidebarOverlay) {
        // Show mobile menu toggle on small screens
        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'flex';
        }

        mobileMenuToggle.addEventListener('click', function() {
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

        sidebarOverlay.addEventListener('click', function() {
            sidebarPanel.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            
            // Volver al icono de chevron derecha
            const icon = mobileMenuToggle.querySelector('i');
            icon.className = 'bi bi-chevron-right';
        });

        // Handle window resize
        window.addEventListener('resize', function() {
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

    // Botón Volver a Finanzas
    const btnBackFinanzas = document.getElementById('btnBackFinanzas');
    if (btnBackFinanzas) {
        btnBackFinanzas.addEventListener('click', function() {
            window.location.href = 'Finanzas.html';
        });
    }

    // Botón Cerrar Sesión
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', function() {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                sessionStorage.removeItem('currentUser');
                window.location.href = '../index.html';
            }
        });
    }

    // Botón Nuevo Método de Pago
    const btnNuevoMetodo = document.getElementById('btnNuevoMetodo');
    if (btnNuevoMetodo) {
        btnNuevoMetodo.addEventListener('click', openCreateModal);
    }

    // Modal events
    const closeModal = document.getElementById('closeModal');
    const btnCancelar = document.getElementById('btnCancelar');
    const metodoPagoForm = document.getElementById('metodoPagoForm');
    
    if (closeModal) closeModal.addEventListener('click', closeMetodoModal);
    if (btnCancelar) btnCancelar.addEventListener('click', closeMetodoModal);
    if (metodoPagoForm) metodoPagoForm.addEventListener('submit', handleSaveMetodo);

    // Image upload events
    const btnUploadImage = document.getElementById('btnUploadImage');
    const imagenMetodo = document.getElementById('imagenMetodo');
    const btnRemoveImage = document.getElementById('btnRemoveImage');

    if (btnUploadImage) {
        btnUploadImage.addEventListener('click', () => imagenMetodo.click());
    }
    if (imagenMetodo) {
        imagenMetodo.addEventListener('change', handleImageSelect);
    }
    if (btnRemoveImage) {
        btnRemoveImage.addEventListener('click', removeImage);
    }

    // Confirm delete modal events
    const closeConfirmModal = document.getElementById('closeConfirmModal');
    const btnCancelarDelete = document.getElementById('btnCancelarDelete');
    const btnConfirmarDelete = document.getElementById('btnConfirmarDelete');

    if (closeConfirmModal) closeConfirmModal.addEventListener('click', closeConfirmDeleteModal);
    if (btnCancelarDelete) btnCancelarDelete.addEventListener('click', closeConfirmDeleteModal);
    if (btnConfirmarDelete) btnConfirmarDelete.addEventListener('click', confirmDelete);

    // Close modals on outside click
    const metodoPagoModal = document.getElementById('metodoPagoModal');
    const confirmDeleteModal = document.getElementById('confirmDeleteModal');

    if (metodoPagoModal) {
        metodoPagoModal.addEventListener('click', function(e) {
            if (e.target === this) closeMetodoModal();
        });
    }

    if (confirmDeleteModal) {
        confirmDeleteModal.addEventListener('click', function(e) {
            if (e.target === this) closeConfirmDeleteModal();
        });
    }

    // Notification close button
    const notificationClose = document.getElementById('notificationClose');
    if (notificationClose) {
        notificationClose.addEventListener('click', function() {
            const toast = document.getElementById('notificationToast');
            if (toast) toast.classList.remove('show');
        });
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

// Función para cargar el avatar del usuario
async function loadUserAvatar() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!currentUser || !currentUser.id) return;

    try {
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const userDoc = await window.firebaseDB
            .collection('usuarios')
            .doc(currentUser.id)
            .get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const avatarContainer = document.getElementById('userAvatarContainer');
            const avatarDefault = document.getElementById('userAvatarDefault');
            const avatarImage = document.getElementById('userAvatarImage');

            if (userData.fotoPerfil && avatarImage && avatarDefault) {
                avatarImage.src = userData.fotoPerfil;
                avatarImage.style.display = 'block';
                avatarDefault.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error al cargar avatar:', error);
    }
}

// Cargar métodos de pago desde Firebase
async function loadMetodosPago() {
    try {
        await esperarFirebase();

        const loadingSpinner = document.getElementById('loadingSpinner');
        const emptyState = document.getElementById('emptyState');
        const metodosPagoGrid = document.getElementById('metodosPagoGrid');

        if (loadingSpinner) loadingSpinner.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';
        if (metodosPagoGrid) metodosPagoGrid.innerHTML = '';

        const snapshot = await window.firebaseDB
            .collection('metodosPago')
            .orderBy('fechaCreacion', 'desc')
            .get();

        metodosPago = [];
        snapshot.forEach(doc => {
            metodosPago.push({
                id: doc.id,
                ...doc.data()
            });
        });

        if (loadingSpinner) loadingSpinner.style.display = 'none';

        if (metodosPago.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
        } else {
            renderMetodosPago();
        }

    } catch (error) {
        console.error('Error al cargar métodos de pago:', error);
        const loadingSpinner = document.getElementById('loadingSpinner');
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        showNotification('Error al cargar los métodos de pago', 'error');
    }
}

// Renderizar métodos de pago
function renderMetodosPago() {
    const metodosPagoGrid = document.getElementById('metodosPagoGrid');
    if (!metodosPagoGrid) return;

    metodosPagoGrid.innerHTML = '';

    metodosPago.forEach(metodo => {
        const card = document.createElement('div');
        card.className = `metodo-pago-card ${metodo.activo ? '' : 'inactive'}`;
        
        card.innerHTML = `
            <div class="metodo-pago-header">
                <img src="${metodo.imagen}" alt="${metodo.nombre}" class="metodo-pago-logo">
                <span class="metodo-pago-status ${metodo.activo ? 'active' : 'inactive'}">
                    ${metodo.activo ? 'Activo' : 'Inactivo'}
                </span>
            </div>
            <div class="metodo-pago-body">
                <div class="metodo-pago-nombre">${metodo.nombre}</div>
                <div class="metodo-pago-cuenta">
                    <i class="bi bi-credit-card"></i>
                    ${metodo.numeroCuenta}
                </div>
            </div>
            <div class="metodo-pago-actions">
                <button class="btn-edit" onclick="editMetodo('${metodo.id}')">
                    <i class="bi bi-pencil"></i>
                    Editar
                </button>
                <button class="btn-delete" onclick="deleteMetodo('${metodo.id}', '${metodo.nombre}')">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            </div>
        `;

        metodosPagoGrid.appendChild(card);
    });
}

// Abrir modal para crear método
function openCreateModal() {
    currentMetodoId = null;
    selectedImageFile = null;
    selectedImageUrl = null;

    const modalTitle = document.getElementById('modalTitle');
    const metodoPagoForm = document.getElementById('metodoPagoForm');
    const imagePreview = document.getElementById('imagePreview');

    if (modalTitle) modalTitle.textContent = 'Nuevo Método de Pago';
    if (metodoPagoForm) metodoPagoForm.reset();
    if (imagePreview) imagePreview.style.display = 'none';

    document.getElementById('metodoPagoId').value = '';
    document.getElementById('activoMetodo').checked = true;

    const modal = document.getElementById('metodoPagoModal');
    if (modal) modal.classList.add('show');
}

// Editar método de pago
window.editMetodo = async function(metodoId) {
    try {
        await esperarFirebase();

        const metodoDoc = await window.firebaseDB
            .collection('metodosPago')
            .doc(metodoId)
            .get();

        if (!metodoDoc.exists) {
            showNotification('Método de pago no encontrado', 'error');
            return;
        }

        const metodo = metodoDoc.data();
        currentMetodoId = metodoId;
        selectedImageUrl = metodo.imagen;

        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) modalTitle.textContent = 'Editar Método de Pago';

        document.getElementById('metodoPagoId').value = metodoId;
        document.getElementById('nombreMetodo').value = metodo.nombre;
        document.getElementById('numeroCuenta').value = metodo.numeroCuenta;
        document.getElementById('activoMetodo').checked = metodo.activo;

        // Mostrar imagen actual
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        if (imagePreview && previewImg) {
            previewImg.src = metodo.imagen;
            imagePreview.style.display = 'block';
        }

        const modal = document.getElementById('metodoPagoModal');
        if (modal) modal.classList.add('show');

    } catch (error) {
        console.error('Error al cargar método:', error);
        showNotification('Error al cargar el método de pago', 'error');
    }
};

// Eliminar método de pago
window.deleteMetodo = function(metodoId, metodoNombre) {
    currentMetodoId = metodoId;
    
    const confirmMetodoNombre = document.getElementById('confirmMetodoNombre');
    if (confirmMetodoNombre) {
        confirmMetodoNombre.textContent = metodoNombre;
    }

    const modal = document.getElementById('confirmDeleteModal');
    if (modal) modal.classList.add('show');
};

// Confirmar eliminación
async function confirmDelete() {
    if (!currentMetodoId) return;

    try {
        await esperarFirebase();

        await window.firebaseDB
            .collection('metodosPago')
            .doc(currentMetodoId)
            .delete();

        closeConfirmDeleteModal();
        loadMetodosPago();
        
        showNotification('Método de pago eliminado exitosamente', 'success');

    } catch (error) {
        console.error('Error al eliminar método:', error);
        showNotification('Error al eliminar el método de pago', 'error');
    }
}

// Manejar selección de imagen
function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor selecciona un archivo de imagen válido', 'warning');
        return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('La imagen no debe superar los 5MB', 'warning');
        return;
    }

    selectedImageFile = file;

    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const imagePreview = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (previewImg) previewImg.src = e.target.result;
        if (imagePreview) imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Remover imagen
function removeImage() {
    selectedImageFile = null;
    selectedImageUrl = null;

    const imagePreview = document.getElementById('imagePreview');
    const imagenMetodo = document.getElementById('imagenMetodo');
    
    if (imagePreview) imagePreview.style.display = 'none';
    if (imagenMetodo) imagenMetodo.value = '';
}

// Guardar método de pago
async function handleSaveMetodo(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombreMetodo').value.trim();
    const numeroCuenta = document.getElementById('numeroCuenta').value.trim();
    const activo = document.getElementById('activoMetodo').checked;
    const metodoId = document.getElementById('metodoPagoId').value;

    if (!nombre || !numeroCuenta) {
        showNotification('Por favor completa todos los campos obligatorios', 'warning');
        return;
    }

    // Validar que haya una imagen (nueva o existente)
    if (!selectedImageFile && !selectedImageUrl) {
        showNotification('Por favor selecciona una imagen para el método de pago', 'warning');
        return;
    }

    try {
        await esperarFirebase();

        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Guardando...';
        }

        let imagenUrl = selectedImageUrl;

        // Si hay una nueva imagen, subirla
        if (selectedImageFile) {
            imagenUrl = await uploadImage(selectedImageFile);
        }

        const metodoData = {
            nombre,
            numeroCuenta,
            imagen: imagenUrl,
            activo,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (metodoId) {
            // Actualizar método existente
            await window.firebaseDB
                .collection('metodosPago')
                .doc(metodoId)
                .update(metodoData);
        } else {
            // Crear nuevo método
            metodoData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            await window.firebaseDB
                .collection('metodosPago')
                .add(metodoData);
        }

        closeMetodoModal();
        loadMetodosPago();
        
        showNotification(metodoId ? 'Método actualizado exitosamente' : 'Método creado exitosamente', 'success');

    } catch (error) {
        console.error('Error al guardar método:', error);
        showNotification('Error al guardar el método de pago', 'error');
    } finally {
        const btnGuardar = document.getElementById('btnGuardar');
        if (btnGuardar) {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i class="bi bi-save"></i> Guardar';
        }
    }
}

// Subir imagen a ImgBB
async function uploadImage(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error('Error al subir imagen a ImgBB');
        }
    } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
    }
}

// Cerrar modal de método
function closeMetodoModal() {
    const modal = document.getElementById('metodoPagoModal');
    if (modal) modal.classList.remove('show');
    
    currentMetodoId = null;
    selectedImageFile = null;
    selectedImageUrl = null;
}

// Cerrar modal de confirmación
function closeConfirmDeleteModal() {
    const modal = document.getElementById('confirmDeleteModal');
    if (modal) modal.classList.remove('show');
    
    currentMetodoId = null;
}
