// Perfil Coordinador JavaScript
// ImgBB API Configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize panel modal styles
    initializePanelModal();
    
    // Check if user is logged in and is coordinador
    checkAuthentication();
    
    // Initialize time display
    updateTimeDisplay();
    setInterval(updateTimeDisplay, 1000);
    
    // Load user info
    loadUserInfo();
    
    // Add event listeners
    setupEventListeners();
});

// Check if user is authenticated and is coordinador
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.id || currentUser.rol !== 'coordinador') {
        // Redirect to login if not authenticated or not coordinador
        window.location.href = 'login.html';
        return;
    }
}

// Load user information
async function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    console.log('=== INICIO CARGA DE PERFIL ===');
    console.log('Current user from session:', currentUser);
    
    if (currentUser.nombre) {
        document.getElementById('coordinadorName').textContent = currentUser.nombre.toUpperCase();
    }
    
    // Si hay email en sessionStorage, mostrarlo inmediatamente
    if (currentUser.email) {
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.value = currentUser.email;
            emailInput.placeholder = '';
            console.log('✓ Email cargado desde sessionStorage:', currentUser.email);
        }
    }

    // Cargar datos completos desde Firebase
    await cargarDatosUsuario(currentUser.id);
}

// Cargar datos del usuario desde Firebase
async function cargarDatosUsuario(usuarioId) {
    try {
        console.log('=== CARGANDO DATOS DE FIREBASE ===');
        console.log('Usuario ID:', usuarioId);
        
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            console.log('Esperando Firebase...');
            await esperarFirebase();
        }

        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioId).get();

        if (usuarioDoc.exists) {
            const datos = usuarioDoc.data();
            console.log('=== DATOS COMPLETOS DE FIREBASE ===');
            console.log(JSON.stringify(datos, null, 2));
            
            // Llenar formulario con verificación de elementos
            const campos = {
                'nombre': datos.nombre,
                'email': datos.email || datos.correo || datos.correoElectronico || datos.usuario,
                'emailRecuperacion': datos.emailRecuperacion || datos.correoRecuperacion,
                'telefono': datos.telefono,
                'fechaNacimiento': datos.fechaNacimiento,
                'tipoDocumento': datos.tipoDocumento,
                'numeroDocumento': datos.numeroDocumento,
                'institucion': datos.institucion
            };
            
            console.log('=== CAMPOS A LLENAR ===');
            console.log(JSON.stringify(campos, null, 2));
            
            // Llenar cada campo verificando que exista
            for (const [id, valor] of Object.entries(campos)) {
                const elemento = document.getElementById(id);
                if (elemento) {
                    if (valor !== undefined && valor !== null && valor !== '') {
                        elemento.value = valor;
                        // Quitar placeholder si se llenó
                        if (elemento.placeholder === 'Cargando...') {
                            elemento.placeholder = '';
                        }
                        console.log(`✓ Campo ${id} llenado con:`, valor);
                    } else {
                        console.log(`○ Campo ${id} sin valor en Firebase`);
                        // Si es un campo readonly, cambiar placeholder
                        if (elemento.readOnly) {
                            elemento.placeholder = 'No disponible';
                            elemento.value = '';
                        }
                    }
                } else {
                    console.warn(`✗ Elemento ${id} no encontrado en el DOM`);
                }
            }
            
            // Mensaje especial para el campo email si no se encontró
            if (!campos.email) {
                console.log('');
                console.log('⚠️ IMPORTANTE: El campo email no se encontró en Firebase');
                console.log('📋 Campos disponibles en el documento:', Object.keys(datos));
                console.log('💡 Verifica en Firebase Console qué campo contiene el email del coordinador');
                console.log('');
            }
            
            // Fecha de creación
            if (datos.fechaCreacion) {
                try {
                    const fecha = datos.fechaCreacion.toDate();
                    const fechaCreacionEl = document.getElementById('fechaCreacion');
                    if (fechaCreacionEl) {
                        fechaCreacionEl.value = fecha.toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        fechaCreacionEl.placeholder = '';
                        console.log('✓ Fecha de creación llenada');
                    }
                } catch (error) {
                    console.error('Error al procesar fecha de creación:', error);
                }
            }
            
            // Cargar foto de perfil
            if (datos.fotoPerfil) {
                mostrarFotoPerfil(datos.fotoPerfil);
                console.log('✓ Foto de perfil cargada');
            }
            
            console.log('=== CARGA COMPLETADA ===');
        } else {
            console.error('❌ Usuario no encontrado en Firebase con ID:', usuarioId);
            mostrarNotificacion('Usuario no encontrado en la base de datos', 'error');
        }
    } catch (error) {
        console.error('❌ Error al cargar datos del usuario:', error);
        mostrarNotificacion('Error al cargar los datos del perfil: ' + error.message, 'error');
    }
}

// Mostrar foto de perfil
function mostrarFotoPerfil(urlFoto) {
    // Sidebar avatar
    const avatarDefault = document.getElementById('userAvatarDefault');
    const avatarImage = document.getElementById('userAvatarImage');
    
    if (avatarDefault && avatarImage) {
        avatarDefault.style.display = 'none';
        avatarImage.src = urlFoto;
        avatarImage.style.display = 'block';
        avatarImage.style.position = 'absolute';
    }
    
    // Foto perfil preview
    const fotoAvatar = document.getElementById('fotoAvatar');
    const fotoImagen = document.getElementById('fotoImagen');
    
    if (fotoAvatar && fotoImagen) {
        fotoAvatar.style.display = 'none';
        fotoImagen.src = urlFoto;
        fotoImagen.style.display = 'block';
    }
    
    // Mostrar botón eliminar
    const eliminarBtn = document.getElementById('eliminarFotoBtn');
    if (eliminarBtn) {
        eliminarBtn.style.display = 'flex';
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
        timeIcon.className = '';
        
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
    
    // Update display
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');
    
    if (timeElement) timeElement.textContent = timeString;
    if (dateElement) dateElement.textContent = dateString;
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }
    
    // Panel button
    const btnPanel = document.getElementById('btnPanel');
    if (btnPanel) {
        btnPanel.addEventListener('click', () => {
            window.location.href = 'Panel_Coordinador.html';
        });
    }
    
    // Home button
    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
        btnHome.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
    
    // Cambiar foto button
    const cambiarFotoBtn = document.getElementById('cambiarFotoBtn');
    const fotoInput = document.getElementById('fotoInput');
    if (cambiarFotoBtn && fotoInput) {
        cambiarFotoBtn.addEventListener('click', () => {
            fotoInput.click();
        });
        
        fotoInput.addEventListener('change', handleFotoChange);
    }
    
    // Eliminar foto button
    const eliminarFotoBtn = document.getElementById('eliminarFotoBtn');
    if (eliminarFotoBtn) {
        eliminarFotoBtn.addEventListener('click', handleEliminarFoto);
    }
    
    // Formulario usuario
    const formularioUsuario = document.getElementById('formularioUsuario');
    if (formularioUsuario) {
        formularioUsuario.addEventListener('submit', handleGuardarCambios);
    }
    
    // Cancelar button
    const cancelarBtn = document.getElementById('cancelarBtn');
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', () => {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            cargarDatosUsuario(currentUser.id);
        });
    }
    
    // Mobile menu toggle
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
            
            const icon = mobileMenuToggle.querySelector('i');
            icon.className = 'bi bi-chevron-right';
        });
        
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                mobileMenuToggle.style.display = 'flex';
            } else {
                mobileMenuToggle.style.display = 'none';
                sidebarPanel.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                
                const icon = mobileMenuToggle.querySelector('i');
                icon.className = 'bi bi-chevron-right';
            }
        });
    }
}

// Handle foto change
async function handleFotoChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
        mostrarNotificacion('La imagen es demasiado grande. El tamaño máximo es 5MB.', 'error');
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        mostrarNotificacion('Por favor selecciona un archivo de imagen válido.', 'error');
        return;
    }
    
    try {
        // Mostrar loading
        const cambiarFotoBtn = document.getElementById('cambiarFotoBtn');
        const originalText = cambiarFotoBtn.innerHTML;
        cambiarFotoBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Subiendo...';
        cambiarFotoBtn.disabled = true;
        
        // Esperar Firebase
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const db = window.firebaseDB;
        
        // Subir imagen a ImgBB
        const datosImagen = await subirImagenImgBB(file);
        
        // Actualizar en Firestore
        await db.collection('usuarios').doc(currentUser.id).update({
            fotoPerfil: datosImagen.url,
            fotoPerfilData: {
                url: datosImagen.url,
                deleteUrl: datosImagen.deleteUrl,
                filename: datosImagen.filename
            }
        });
        
        // Actualizar sesión
        currentUser.fotoPerfil = datosImagen.url;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Mostrar foto
        mostrarFotoPerfil(datosImagen.url);
        
        // Restaurar botón
        cambiarFotoBtn.innerHTML = originalText;
        cambiarFotoBtn.disabled = false;
        
        mostrarNotificacion('Foto de perfil actualizada correctamente', 'success');
        
    } catch (error) {
        console.error('Error al subir foto:', error);
        mostrarNotificacion('Error al subir la foto: ' + error.message, 'error');
        
        const cambiarFotoBtn = document.getElementById('cambiarFotoBtn');
        cambiarFotoBtn.innerHTML = '<i class="bi bi-camera-fill"></i> Cambiar Foto';
        cambiarFotoBtn.disabled = false;
    }
}

// Subir imagen a ImgBB
async function subirImagenImgBB(archivo) {
    try {
        const formData = new FormData();
        formData.append('image', archivo);
        formData.append('key', IMGBB_API_KEY);

        const respuesta = await fetch(IMGBB_API_URL, {
            method: 'POST',
            body: formData
        });

        const resultado = await respuesta.json();
        
        if (resultado.success) {
            return {
                url: resultado.data.url,
                deleteUrl: resultado.data.delete_url,
                filename: resultado.data.image.filename
            };
        } else {
            throw new Error(resultado.error?.message || 'Error al subir imagen');
        }
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        throw error;
    }
}

// Handle eliminar foto
async function handleEliminarFoto() {
    if (!confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?')) {
        return;
    }
    
    try {
        // Mostrar loading
        const eliminarBtn = document.getElementById('eliminarFotoBtn');
        const originalText = eliminarBtn.innerHTML;
        eliminarBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Eliminando...';
        eliminarBtn.disabled = true;
        
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const db = window.firebaseDB;
        
        // Eliminar de Firestore
        await db.collection('usuarios').doc(currentUser.id).update({
            fotoPerfil: firebase.firestore.FieldValue.delete(),
            fotoPerfilData: firebase.firestore.FieldValue.delete()
        });
        
        // Actualizar sesión
        delete currentUser.fotoPerfil;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Ocultar imagen y mostrar avatar por defecto
        const avatarDefault = document.getElementById('userAvatarDefault');
        const avatarImage = document.getElementById('userAvatarImage');
        const fotoAvatar = document.getElementById('fotoAvatar');
        const fotoImagen = document.getElementById('fotoImagen');
        
        if (avatarDefault && avatarImage) {
            avatarDefault.style.display = 'flex';
            avatarImage.style.display = 'none';
        }
        
        if (fotoAvatar && fotoImagen) {
            fotoAvatar.style.display = 'flex';
            fotoImagen.style.display = 'none';
        }
        
        // Ocultar botón eliminar
        eliminarBtn.style.display = 'none';
        eliminarBtn.innerHTML = originalText;
        eliminarBtn.disabled = false;
        
        mostrarNotificacion('Foto de perfil eliminada correctamente', 'success');
        
    } catch (error) {
        console.error('Error al eliminar foto:', error);
        mostrarNotificacion('Error al eliminar la foto: ' + error.message, 'error');
        
        const eliminarBtn = document.getElementById('eliminarFotoBtn');
        eliminarBtn.innerHTML = '<i class="bi bi-trash-fill"></i> Eliminar Foto';
        eliminarBtn.disabled = false;
    }
}

// Handle guardar cambios
async function handleGuardarCambios(event) {
    event.preventDefault();
    
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        const db = window.firebaseDB;
        
        // Mostrar loading en botón
        const submitBtn = event.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Guardando...';
        submitBtn.disabled = true;
        
        // Obtener datos del formulario
        const datosActualizados = {
            nombre: document.getElementById('nombre').value,
            emailRecuperacion: document.getElementById('emailRecuperacion').value,
            telefono: document.getElementById('telefono').value,
            fechaNacimiento: document.getElementById('fechaNacimiento').value,
            tipoDocumento: document.getElementById('tipoDocumento').value,
            numeroDocumento: document.getElementById('numeroDocumento').value
        };
        
        // Actualizar en Firestore
        await db.collection('usuarios').doc(currentUser.id).update(datosActualizados);
        
        // Actualizar sessionStorage
        currentUser.nombre = datosActualizados.nombre;
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Actualizar nombre en sidebar
        document.getElementById('coordinadorName').textContent = datosActualizados.nombre.toUpperCase();
        
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Mostrar notificación de éxito
        mostrarNotificacion('Cambios guardados correctamente', 'success');
        
    } catch (error) {
        console.error('Error al guardar cambios:', error);
        
        // Restaurar botón
        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Guardar Cambios';
        submitBtn.disabled = false;
        
        mostrarNotificacion('Error al guardar los cambios: ' + error.message, 'error');
    }
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'success') {
    // Remover notificación existente si hay
    const existente = document.querySelector('.notificacion-toast');
    if (existente) {
        existente.remove();
    }
    
    const colores = {
        success: '#28a745',
        error: '#dc3545',
        info: '#17a2b8'
    };
    
    const iconos = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        info: 'bi-info-circle-fill'
    };
    
    const notificacion = document.createElement('div');
    notificacion.className = 'notificacion-toast';
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colores[tipo]};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-family: 'Montserrat', sans-serif;
        font-weight: 600;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    
    notificacion.innerHTML = `
        <i class="bi ${iconos[tipo]}" style="font-size: 1.5rem;"></i>
        <span>${mensaje}</span>
    `;
    
    // Agregar animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
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
    
    document.body.appendChild(notificacion);
    
    // Auto-remover después de 3 segundos
    setTimeout(() => {
        notificacion.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notificacion.remove();
        }, 300);
    }, 3000);
}


// Initialize panel modal styles
function initializePanelModal() {
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
        
        .spin {
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
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
        
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);

        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(false);
            }
        });

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
        window.location.href = 'login.html';
    }
}
