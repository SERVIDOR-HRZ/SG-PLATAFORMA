// Panel de Usuario JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar
    inicializarPanelModal();
    verificarAutenticacion();
    configurarEventos();
    configurarEventosPestanas();
    configurarEventosPlaylists();
    cargarInformacionUsuario();
});

// Variables globales
let usuarioActual = null;
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
let playlistActual = null;
let cancionesTemporales = [];
let modoEdicion = false;

// Verificar autenticación
function verificarAutenticacion() {
    usuarioActual = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!usuarioActual.id) {
        window.location.href = '../index.html';
        return;
    }
}

// Configurar eventos
function configurarEventos() {
    // Botón volver
    document.getElementById('backBtn').addEventListener('click', volverAlPanel);
    
    // User menu dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    
    if (userMenuBtn && userDropdownMenu) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('active');
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('active');
            }
        });
    }
    
    // Botón cerrar sesión en dropdown
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', manejarCerrarSesion);
    }
    
    // Botón cambiar foto
    document.getElementById('cambiarFotoBtn').addEventListener('click', cambiarFotoPerfil);
    
    // Botón eliminar foto
    document.getElementById('eliminarFotoBtn').addEventListener('click', eliminarFotoPerfil);
    
    // Formulario de información
    document.getElementById('formularioUsuario').addEventListener('submit', guardarInformacion);
    
    // Botón cancelar
    document.getElementById('cancelarBtn').addEventListener('click', cargarInformacionUsuario);
    
    // Formulario de información pública
    document.getElementById('formularioPublico').addEventListener('submit', guardarInformacionPublica);
    
    // Botón cancelar público
    document.getElementById('cancelarPublicoBtn').addEventListener('click', cargarInformacionUsuario);
    
    // Formulario de contraseña
    document.getElementById('formularioPassword').addEventListener('submit', cambiarPassword);
    
    // Botones toggle password
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', toggleMostrarPassword);
    });
    
    // Contador de caracteres para biografía
    const biografiaTextarea = document.getElementById('biografia');
    const bioCharCounter = document.getElementById('bioCharCounter');
    
    biografiaTextarea.addEventListener('input', function() {
        const longitud = this.value.length;
        bioCharCounter.textContent = `${longitud} / 500 caracteres`;
        
        // Cambiar color según la longitud
        bioCharCounter.classList.remove('near-limit', 'at-limit');
        if (longitud >= 500) {
            bioCharCounter.classList.add('at-limit');
        } else if (longitud >= 450) {
            bioCharCounter.classList.add('near-limit');
        }
    });
}

// Cargar información del usuario
async function cargarInformacionUsuario() {
    try {
        mostrarCargando();

        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioActual.id).get();

        if (!usuarioDoc.exists) {
            throw new Error('Usuario no encontrado');
        }

        const datosUsuario = usuarioDoc.data();

        // Cargar datos personales en el formulario
        document.getElementById('nombre').value = datosUsuario.nombre || '';
        document.getElementById('email').value = datosUsuario.email || '';
        document.getElementById('telefono').value = datosUsuario.telefono || '';
        document.getElementById('fechaNacimiento').value = datosUsuario.fechaNacimiento || '';
        document.getElementById('documento').value = datosUsuario.documento || '';
        document.getElementById('tipoUsuario').value = datosUsuario.tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante';

        // Formatear fecha de creación
        if (datosUsuario.fechaCreacion) {
            const fecha = datosUsuario.fechaCreacion.toDate();
            const fechaFormateada = fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('fechaCreacion').value = fechaFormateada;
        }

        // Cargar información pública
        const perfilPublico = datosUsuario.perfilPublico || {};
        document.getElementById('biografia').value = perfilPublico.biografia || '';
        document.getElementById('profesion').value = perfilPublico.profesion || '';
        document.getElementById('especialidad').value = perfilPublico.especialidad || '';
        document.getElementById('ciudad').value = perfilPublico.ciudad || '';
        document.getElementById('institucionPublica').value = perfilPublico.institucion || '';
        
        // Redes sociales
        const redesSociales = perfilPublico.redesSociales || {};
        document.getElementById('linkedin').value = redesSociales.linkedin || '';
        document.getElementById('twitter').value = redesSociales.twitter || '';
        document.getElementById('instagram').value = redesSociales.instagram || '';
        document.getElementById('facebook').value = redesSociales.facebook || '';
        
        // Actualizar contador de caracteres de biografía
        const biografiaLongitud = (perfilPublico.biografia || '').length;
        document.getElementById('bioCharCounter').textContent = `${biografiaLongitud} / 500 caracteres`;

        // Cargar foto de perfil si existe
        if (datosUsuario.fotoPerfil) {
            mostrarFotoPerfil(datosUsuario.fotoPerfil);
        } else {
            mostrarAvatarPorDefecto();
        }

        // Actualizar header con nombre y foto
        actualizarHeaderUsuario(datosUsuario.nombre, datosUsuario.fotoPerfil);

        ocultarCargando();

    } catch (error) {
        console.error('Error al cargar información:', error);
        mostrarNotificacion('Error al cargar la información del usuario', 'error');
        ocultarCargando();
    }
}

// Mostrar foto de perfil
function mostrarFotoPerfil(urlFoto) {
    const fotoAvatar = document.getElementById('fotoAvatar');
    const fotoImagen = document.getElementById('fotoImagen');
    const eliminarBtn = document.getElementById('eliminarFotoBtn');

    fotoAvatar.style.display = 'none';
    fotoImagen.src = urlFoto;
    fotoImagen.style.display = 'block';
    eliminarBtn.style.display = 'inline-flex';
}

// Mostrar avatar por defecto
function mostrarAvatarPorDefecto() {
    const fotoAvatar = document.getElementById('fotoAvatar');
    const fotoImagen = document.getElementById('fotoImagen');
    const eliminarBtn = document.getElementById('eliminarFotoBtn');

    fotoAvatar.style.display = 'flex';
    fotoImagen.style.display = 'none';
    eliminarBtn.style.display = 'none';
}

// Actualizar header con nombre y foto del usuario
function actualizarHeaderUsuario(nombre, fotoPerfil) {
    // Actualizar nombre en el header
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = nombre || 'USUARIO';
    }

    // Actualizar foto en el header
    const userAvatarDefault = document.getElementById('userAvatarDefault');
    const userAvatarImage = document.getElementById('userAvatarImage');

    if (fotoPerfil && userAvatarImage && userAvatarDefault) {
        // Mostrar imagen
        userAvatarImage.src = fotoPerfil;
        userAvatarImage.style.display = 'block';
        userAvatarDefault.style.display = 'none';
    } else if (userAvatarDefault && userAvatarImage) {
        // Mostrar avatar por defecto
        userAvatarImage.style.display = 'none';
        userAvatarDefault.style.display = 'flex';
    }
}

// Cambiar foto de perfil
function cambiarFotoPerfil() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async function(event) {
        const archivo = event.target.files[0];
        if (!archivo) return;

        // Validar tamaño (máximo 5MB)
        if (archivo.size > 5 * 1024 * 1024) {
            mostrarNotificacion('La imagen no puede ser mayor a 5MB', 'error');
            return;
        }

        // Validar tipo
        if (!archivo.type.startsWith('image/')) {
            mostrarNotificacion('Solo se permiten archivos de imagen', 'error');
            return;
        }

        try {
            mostrarCargando('Subiendo imagen...');
            
            // Subir imagen a ImgBB
            const datosImagen = await subirImagenImgBB(archivo);
            
            // Guardar URL en Firebase
            const db = window.firebaseDB;
            await db.collection('usuarios').doc(usuarioActual.id).update({
                fotoPerfil: datosImagen.url,
                fotoPerfilData: {
                    url: datosImagen.url,
                    deleteUrl: datosImagen.deleteUrl,
                    filename: datosImagen.filename
                }
            });

            // Actualizar sesión
            usuarioActual.fotoPerfil = datosImagen.url;
            sessionStorage.setItem('currentUser', JSON.stringify(usuarioActual));

            // Mostrar foto
            mostrarFotoPerfil(datosImagen.url);
            
            // Actualizar header
            actualizarHeaderUsuario(usuarioActual.nombre, datosImagen.url);
            
            mostrarNotificacion('Foto de perfil actualizada correctamente', 'exito');
            ocultarCargando();

        } catch (error) {
            console.error('Error al cambiar foto:', error);
            mostrarNotificacion('Error al subir la foto: ' + error.message, 'error');
            ocultarCargando();
        }
    };

    input.click();
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

// Eliminar foto de perfil
async function eliminarFotoPerfil() {
    const confirmado = await mostrarModalConfirmacion(
        '¿Estás seguro de que deseas eliminar tu foto de perfil?',
        'Eliminar Foto'
    );

    if (!confirmado) return;

    try {
        mostrarCargando('Eliminando foto...');

        const db = window.firebaseDB;
        await db.collection('usuarios').doc(usuarioActual.id).update({
            fotoPerfil: firebase.firestore.FieldValue.delete(),
            fotoPerfilData: firebase.firestore.FieldValue.delete()
        });

        // Actualizar sesión
        delete usuarioActual.fotoPerfil;
        sessionStorage.setItem('currentUser', JSON.stringify(usuarioActual));

        // Mostrar avatar por defecto
        mostrarAvatarPorDefecto();
        
        // Actualizar header
        actualizarHeaderUsuario(usuarioActual.nombre, null);
        
        mostrarNotificacion('Foto de perfil eliminada correctamente', 'exito');
        ocultarCargando();

    } catch (error) {
        console.error('Error al eliminar foto:', error);
        mostrarNotificacion('Error al eliminar la foto', 'error');
        ocultarCargando();
    }
}

// Guardar información
async function guardarInformacion(event) {
    event.preventDefault();

    try {
        mostrarCargando('Guardando cambios...');

        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const fechaNacimiento = document.getElementById('fechaNacimiento').value;

        // Validaciones
        if (!nombre) {
            throw new Error('El nombre es requerido');
        }

        if (!email) {
            throw new Error('El email es requerido');
        }

        // Verificar si el email ya existe en otro usuario
        const db = window.firebaseDB;
        const emailQuery = await db.collection('usuarios')
            .where('email', '==', email)
            .get();

        if (!emailQuery.empty) {
            const usuarioConEmail = emailQuery.docs[0];
            if (usuarioConEmail.id !== usuarioActual.id) {
                throw new Error('El email ya está en uso por otro usuario');
            }
        }

        // Actualizar usuario
        await db.collection('usuarios').doc(usuarioActual.id).update({
            nombre: nombre,
            email: email,
            telefono: telefono,
            fechaNacimiento: fechaNacimiento,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        });

        // Actualizar sesión
        usuarioActual.nombre = nombre;
        usuarioActual.email = email;
        usuarioActual.telefono = telefono;
        sessionStorage.setItem('currentUser', JSON.stringify(usuarioActual));

        // Actualizar header con el nuevo nombre
        actualizarHeaderUsuario(nombre, usuarioActual.fotoPerfil);

        mostrarNotificacion('Información actualizada correctamente', 'exito');
        ocultarCargando();

    } catch (error) {
        console.error('Error al guardar información:', error);
        mostrarNotificacion(error.message || 'Error al guardar la información', 'error');
        ocultarCargando();
    }
}

// Guardar información pública
async function guardarInformacionPublica(event) {
    event.preventDefault();

    try {
        mostrarCargando('Guardando información pública...');

        const biografia = document.getElementById('biografia').value.trim();
        const profesion = document.getElementById('profesion').value.trim();
        const especialidad = document.getElementById('especialidad').value.trim();
        const ciudad = document.getElementById('ciudad').value.trim();
        const institucion = document.getElementById('institucionPublica').value.trim();
        
        const linkedin = document.getElementById('linkedin').value.trim();
        const twitter = document.getElementById('twitter').value.trim();
        const instagram = document.getElementById('instagram').value.trim();
        const facebook = document.getElementById('facebook').value.trim();

        // Crear objeto de perfil público
        const perfilPublico = {
            biografia: biografia,
            profesion: profesion,
            especialidad: especialidad,
            ciudad: ciudad,
            institucion: institucion,
            redesSociales: {
                linkedin: linkedin,
                twitter: twitter,
                instagram: instagram,
                facebook: facebook
            }
        };

        // Actualizar en Firebase
        const db = window.firebaseDB;
        await db.collection('usuarios').doc(usuarioActual.id).update({
            perfilPublico: perfilPublico,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        });

        mostrarNotificacion('Información pública actualizada correctamente', 'exito');
        ocultarCargando();

    } catch (error) {
        console.error('Error al guardar información pública:', error);
        mostrarNotificacion(error.message || 'Error al guardar la información pública', 'error');
        ocultarCargando();
    }
}

// Cambiar contraseña
async function cambiarPassword(event) {
    event.preventDefault();

    try {
        const passwordActual = document.getElementById('passwordActual').value;
        const passwordNueva = document.getElementById('passwordNueva').value;
        const passwordConfirmar = document.getElementById('passwordConfirmar').value;

        // Validaciones
        if (!passwordActual || !passwordNueva || !passwordConfirmar) {
            throw new Error('Todos los campos son requeridos');
        }

        if (passwordNueva.length < 6) {
            throw new Error('La nueva contraseña debe tener al menos 6 caracteres');
        }

        if (passwordNueva !== passwordConfirmar) {
            throw new Error('Las contraseñas nuevas no coinciden');
        }

        if (passwordActual === passwordNueva) {
            throw new Error('La nueva contraseña debe ser diferente a la actual');
        }

        mostrarCargando('Cambiando contraseña...');

        // Verificar contraseña actual
        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioActual.id).get();
        const datosUsuario = usuarioDoc.data();

        if (datosUsuario.password !== passwordActual) {
            throw new Error('La contraseña actual es incorrecta');
        }

        // Actualizar contraseña
        await db.collection('usuarios').doc(usuarioActual.id).update({
            password: passwordNueva,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        });

        // Limpiar formulario
        document.getElementById('formularioPassword').reset();

        mostrarNotificacion('Contraseña actualizada correctamente', 'exito');
        ocultarCargando();

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        mostrarNotificacion(error.message || 'Error al cambiar la contraseña', 'error');
        ocultarCargando();
    }
}

// Toggle mostrar contraseña
function toggleMostrarPassword(event) {
    const boton = event.currentTarget;
    const targetId = boton.getAttribute('data-target');
    const input = document.getElementById(targetId);
    const icono = boton.querySelector('i');

    if (input.type === 'password') {
        input.type = 'text';
        icono.classList.remove('bi-eye');
        icono.classList.add('bi-eye-slash');
    } else {
        input.type = 'password';
        icono.classList.remove('bi-eye-slash');
        icono.classList.add('bi-eye');
    }
}

// Volver al panel
function volverAlPanel() {
    if (usuarioActual.tipoUsuario === 'admin') {
        window.location.href = 'Panel_Admin.html';
    } else {
        window.location.href = 'Panel_Estudiantes.html';
    }
}

// Manejar cerrar sesión
async function manejarCerrarSesion() {
    const confirmado = await mostrarModalLogout();
    
    if (confirmado) {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}

// Mostrar cargando
function mostrarCargando(texto = 'Cargando...') {
    const overlay = document.getElementById('loadingOverlay');
    const textoElement = overlay.querySelector('.loading-texto');
    if (textoElement) {
        textoElement.textContent = texto;
    }
    overlay.style.display = 'flex';
}

// Ocultar cargando
function ocultarCargando() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'none';
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo = 'info') {
    const iconos = {
        exito: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        advertencia: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };

    const titulos = {
        exito: '¡Éxito!',
        error: 'Error',
        advertencia: 'Advertencia',
        info: 'Información'
    };

    const notificacionHTML = `
        <div class="notificacion ${tipo}" id="notificacion">
            <div class="notificacion-icono">
                <i class="${iconos[tipo]}"></i>
            </div>
            <div class="notificacion-contenido">
                <div class="notificacion-titulo">${titulos[tipo]}</div>
                <p class="notificacion-mensaje">${mensaje}</p>
            </div>
            <button class="notificacion-cerrar" onclick="cerrarNotificacion()">
                <i class="bi bi-x"></i>
            </button>
        </div>
    `;

    // Eliminar notificación anterior si existe
    const notificacionAnterior = document.getElementById('notificacion');
    if (notificacionAnterior) {
        notificacionAnterior.remove();
    }

    document.body.insertAdjacentHTML('beforeend', notificacionHTML);

    // Auto cerrar después de 5 segundos
    setTimeout(() => {
        cerrarNotificacion();
    }, 5000);
}

// Cerrar notificación
function cerrarNotificacion() {
    const notificacion = document.getElementById('notificacion');
    if (notificacion) {
        notificacion.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notificacion.remove();
        }, 300);
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

// Inicializar modal del panel
function inicializarPanelModal() {
    const estilosModal = `
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
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', estilosModal);
}

// Mostrar modal de confirmación
function mostrarModalConfirmacion(mensaje, titulo = 'Confirmar') {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="panelModalOverlay">
                <div class="panel-modal">
                    <div class="panel-modal-body">
                        <i class="bi bi-exclamation-triangle panel-modal-icon"></i>
                        <p class="panel-modal-message">${mensaje}</p>
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
        
        setTimeout(() => overlay.classList.add('active'), 10);

        confirmBtn.addEventListener('click', () => {
            cerrarModal(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            cerrarModal(overlay);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cerrarModal(overlay);
                resolve(false);
            }
        });
    });
}

// Mostrar modal de logout
function mostrarModalLogout() {
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
        
        setTimeout(() => overlay.classList.add('active'), 10);

        confirmBtn.addEventListener('click', () => {
            cerrarModal(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            cerrarModal(overlay);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                cerrarModal(overlay);
                resolve(false);
            }
        });
    });
}

// Cerrar modal
function cerrarModal(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}

// ========================================
// GESTIÓN DE PESTAÑAS
// ========================================

function configurarEventosPestanas() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            cambiarPestana(tabName);
        });
    });
}

function cambiarPestana(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Actualizar contenido
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelector(`[data-content="${tabName}"]`).classList.add('active');
    
    // Cargar datos según la pestaña
    if (tabName === 'playlists') {
        cargarPlaylists();
    }
}

// ========================================
// GESTIÓN DE PLAYLISTS
// ========================================

function configurarEventosPlaylists() {
    // Verificar si los elementos existen antes de agregar event listeners
    const crearPlaylistBtn = document.getElementById('crearPlaylistBtn');
    if (crearPlaylistBtn) {
        crearPlaylistBtn.addEventListener('click', abrirModalNuevaPlaylist);
    }
    
    // Modal de playlist
    const closePlaylistModal = document.getElementById('closePlaylistModal');
    if (closePlaylistModal) {
        closePlaylistModal.addEventListener('click', cerrarModalPlaylist);
    }
    
    const cancelarPlaylistBtn = document.getElementById('cancelarPlaylistBtn');
    if (cancelarPlaylistBtn) {
        cancelarPlaylistBtn.addEventListener('click', cerrarModalPlaylist);
    }
    
    const guardarPlaylistBtn = document.getElementById('guardarPlaylistBtn');
    if (guardarPlaylistBtn) {
        guardarPlaylistBtn.addEventListener('click', guardarPlaylist);
    }
    
    // Agregar canción
    const agregarCancionBtn = document.getElementById('agregarCancionBtn');
    if (agregarCancionBtn) {
        agregarCancionBtn.addEventListener('click', mostrarFormularioCancion);
    }
    
    const confirmarAgregarCancion = document.getElementById('confirmarAgregarCancion');
    if (confirmarAgregarCancion) {
        confirmarAgregarCancion.addEventListener('click', agregarCancion);
    }
    
    const cancelarAgregarCancion = document.getElementById('cancelarAgregarCancion');
    if (cancelarAgregarCancion) {
        cancelarAgregarCancion.addEventListener('click', ocultarFormularioCancion);
    }
    
    // Modal de confirmación
    const cancelarEliminarBtn = document.getElementById('cancelarEliminarBtn');
    if (cancelarEliminarBtn) {
        cancelarEliminarBtn.addEventListener('click', cerrarModalConfirmar);
    }
}

async function cargarPlaylists() {
    const container = document.getElementById('playlistsLista');
    
    try {
        const db = window.firebaseDB;
        // Consulta sin orderBy para evitar necesidad de índice compuesto
        const playlistsSnapshot = await db.collection('playlists')
            .where('usuarioId', '==', usuarioActual.id)
            .get();
        
        if (playlistsSnapshot.empty) {
            container.innerHTML = `
                <div class="playlists-vacio">
                    <i class="bi bi-music-note-list"></i>
                    <h3>No tienes playlists creadas</h3>
                    <p>Crea tu primera playlist personalizada de YouTube para escuchar mientras estudias</p>
                </div>
            `;
            return;
        }
        
        // Ordenar las playlists en el cliente por fecha de creación (más reciente primero)
        const playlists = [];
        playlistsSnapshot.forEach(doc => {
            playlists.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Ordenar por fecha de creación descendente
        playlists.sort((a, b) => {
            const fechaA = a.fechaCreacion ? a.fechaCreacion.toMillis() : 0;
            const fechaB = b.fechaCreacion ? b.fechaCreacion.toMillis() : 0;
            return fechaB - fechaA;
        });
        
        container.innerHTML = '';
        
        playlists.forEach(playlist => {
            const playlistCard = crearTarjetaPlaylist(playlist.id, playlist);
            container.appendChild(playlistCard);
        });
        
    } catch (error) {
        console.error('Error al cargar playlists:', error);
        container.innerHTML = `
            <div class="playlists-vacio">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar playlists</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function crearTarjetaPlaylist(id, playlist) {
    const div = document.createElement('div');
    div.className = 'playlist-card';
    div.innerHTML = `
        <div class="playlist-header">
            <div class="playlist-icon">
                <i class="bi bi-music-note-beamed"></i>
            </div>
            <div class="playlist-info">
                <h3 class="playlist-nombre">${playlist.nombre}</h3>
                <p class="playlist-descripcion">${playlist.descripcion || 'Sin descripción'}</p>
            </div>
        </div>
        <div class="playlist-meta">
            <div class="playlist-stats">
                <div class="playlist-stat">
                    <i class="bi bi-list-music"></i>
                    <span>${playlist.canciones ? playlist.canciones.length : 0} canciones</span>
                </div>
            </div>
            <div class="playlist-acciones">
                <button class="btn-icon btn-play" title="Reproducir" data-id="${id}">
                    <i class="bi bi-play-fill"></i>
                </button>
                <button class="btn-icon btn-edit" title="Editar" data-id="${id}">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-icon btn-delete" title="Eliminar" data-id="${id}">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </div>
        </div>
    `;
    
    // Event listeners
    div.querySelector('.btn-play').addEventListener('click', (e) => {
        e.stopPropagation();
        reproducirPlaylist(id, playlist);
    });
    
    div.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        editarPlaylist(id, playlist);
    });
    
    div.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmarEliminarPlaylist(id, playlist.nombre);
    });
    
    return div;
}

function abrirModalNuevaPlaylist() {
    modoEdicion = false;
    playlistActual = null;
    cancionesTemporales = [];
    
    document.getElementById('playlistModalTitulo').textContent = 'Crear Nueva Playlist';
    document.getElementById('playlistNombre').value = '';
    document.getElementById('playlistDescripcion').value = '';
    
    actualizarListaCanciones();
    ocultarFormularioCancion();
    
    document.getElementById('playlistModal').classList.add('active');
}

async function editarPlaylist(id, playlist) {
    modoEdicion = true;
    playlistActual = { id, ...playlist };
    cancionesTemporales = [...(playlist.canciones || [])];
    
    document.getElementById('playlistModalTitulo').textContent = 'Editar Playlist';
    document.getElementById('playlistNombre').value = playlist.nombre;
    document.getElementById('playlistDescripcion').value = playlist.descripcion || '';
    
    actualizarListaCanciones();
    ocultarFormularioCancion();
    
    document.getElementById('playlistModal').classList.add('active');
}

function cerrarModalPlaylist() {
    document.getElementById('playlistModal').classList.remove('active');
    playlistActual = null;
    cancionesTemporales = [];
    modoEdicion = false;
}

function mostrarFormularioCancion() {
    document.getElementById('agregarCancionForm').style.display = 'block';
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoUrl').focus();
}

function ocultarFormularioCancion() {
    document.getElementById('agregarCancionForm').style.display = 'none';
    document.getElementById('videoUrl').value = '';
}

function agregarCancion() {
    const urlInput = document.getElementById('videoUrl');
    const url = urlInput.value.trim();
    
    if (!url) {
        mostrarNotificacion('Por favor ingresa una URL de YouTube', 'advertencia');
        return;
    }
    
    // Extraer ID del video
    const videoId = extraerVideoId(url);
    
    if (!videoId) {
        mostrarNotificacion('URL de YouTube inválida', 'error');
        return;
    }
    
    // Verificar si ya existe
    if (cancionesTemporales.some(c => c.id === videoId)) {
        mostrarNotificacion('Esta canción ya está en la playlist', 'advertencia');
        return;
    }
    
    // Agregar canción
    cancionesTemporales.push({
        id: videoId,
        title: `Video de YouTube ${videoId}`,
        url: `https://www.youtube.com/watch?v=${videoId}`
    });
    
    actualizarListaCanciones();
    ocultarFormularioCancion();
    mostrarNotificacion('Canción agregada correctamente', 'exito');
}

function extraerVideoId(url) {
    // Patrones comunes de URLs de YouTube
    const patterns = [
        // https://www.youtube.com/watch?v=VIDEO_ID
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
        // https://youtu.be/VIDEO_ID
        /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
        // https://www.youtube.com/embed/VIDEO_ID
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        // https://www.youtube.com/v/VIDEO_ID
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
        // Solo el ID de 11 caracteres
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

function actualizarListaCanciones() {
    const container = document.getElementById('cancionesLista');
    
    if (cancionesTemporales.length === 0) {
        container.innerHTML = `
            <div class="lista-vacia">
                <i class="bi bi-music-note"></i>
                <p>No hay canciones en esta playlist</p>
                <small>Agrega canciones usando el botón de arriba</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    cancionesTemporales.forEach((cancion, index) => {
        const item = crearItemCancion(cancion, index);
        container.appendChild(item);
    });
}

function crearItemCancion(cancion, index) {
    const div = document.createElement('div');
    div.className = 'cancion-item';
    div.innerHTML = `
        <i class="bi bi-grip-vertical cancion-handle"></i>
        <div class="cancion-thumbnail">
            <i class="bi bi-youtube"></i>
        </div>
        <div class="cancion-info">
            <div class="cancion-titulo">${cancion.title}</div>
            <div class="cancion-id">ID: ${cancion.id}</div>
        </div>
        <div class="cancion-acciones">
            <button class="btn-icon btn-delete" title="Eliminar">
                <i class="bi bi-trash-fill"></i>
            </button>
        </div>
    `;
    
    div.querySelector('.btn-delete').addEventListener('click', () => {
        eliminarCancion(index);
    });
    
    return div;
}

function eliminarCancion(index) {
    cancionesTemporales.splice(index, 1);
    actualizarListaCanciones();
    mostrarNotificacion('Canción eliminada', 'exito');
}

async function guardarPlaylist() {
    const nombre = document.getElementById('playlistNombre').value.trim();
    const descripcion = document.getElementById('playlistDescripcion').value.trim();
    
    if (!nombre) {
        mostrarNotificacion('El nombre de la playlist es requerido', 'advertencia');
        return;
    }
    
    if (cancionesTemporales.length === 0) {
        mostrarNotificacion('Debes agregar al menos una canción', 'advertencia');
        return;
    }
    
    try {
        mostrarCargando('Guardando playlist...');
        
        const db = window.firebaseDB;
        const playlistData = {
            nombre: nombre,
            descripcion: descripcion,
            canciones: cancionesTemporales,
            usuarioId: usuarioActual.id,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        };
        
        if (modoEdicion && playlistActual) {
            // Actualizar playlist existente
            await db.collection('playlists').doc(playlistActual.id).update(playlistData);
            mostrarNotificacion('Playlist actualizada correctamente', 'exito');
        } else {
            // Crear nueva playlist
            playlistData.fechaCreacion = firebase.firestore.Timestamp.now();
            await db.collection('playlists').add(playlistData);
            mostrarNotificacion('Playlist creada correctamente', 'exito');
        }
        
        cerrarModalPlaylist();
        cargarPlaylists();
        ocultarCargando();
        
    } catch (error) {
        console.error('Error al guardar playlist:', error);
        mostrarNotificacion('Error al guardar la playlist', 'error');
        ocultarCargando();
    }
}

function confirmarEliminarPlaylist(id, nombre) {
    document.getElementById('confirmarEliminarMensaje').textContent = 
        `¿Estás seguro de eliminar la playlist "${nombre}"?`;
    
    document.getElementById('confirmarEliminarModal').classList.add('active');
    
    document.getElementById('confirmarEliminarBtn').onclick = () => {
        eliminarPlaylist(id);
        cerrarModalConfirmar();
    };
}

async function eliminarPlaylist(id) {
    try {
        mostrarCargando('Eliminando playlist...');
        
        const db = window.firebaseDB;
        await db.collection('playlists').doc(id).delete();
        
        mostrarNotificacion('Playlist eliminada correctamente', 'exito');
        cargarPlaylists();
        ocultarCargando();
        
    } catch (error) {
        console.error('Error al eliminar playlist:', error);
        mostrarNotificacion('Error al eliminar la playlist', 'error');
        ocultarCargando();
    }
}

function cerrarModalConfirmar() {
    document.getElementById('confirmarEliminarModal').classList.remove('active');
}

function reproducirPlaylist(id, playlist) {
    if (!playlist.canciones || playlist.canciones.length === 0) {
        mostrarNotificacion('Esta playlist no tiene canciones', 'advertencia');
        return;
    }
    
    // Guardar la playlist en sessionStorage para que el reproductor pueda acceder
    sessionStorage.setItem('playlistActiva', JSON.stringify({
        id: id,
        nombre: playlist.nombre,
        canciones: playlist.canciones
    }));
    
    // Mostrar el mini reproductor
    if (window.mostrarReproductor) {
        window.mostrarReproductor();
    }
    
    // Esperar a que el reproductor esté listo
    const esperarReproductor = setInterval(() => {
        if (window.musicPlayer) {
            clearInterval(esperarReproductor);
            
            // Cambiar a la playlist seleccionada
            window.musicPlayer.cambiarPlaylist(playlist.canciones);
            
            // Auto-reproducir después de un momento
            setTimeout(() => {
                if (window.musicPlayer.isPlayerReady && !window.musicPlayer.isPlaying) {
                    window.musicPlayer.togglePlayPause();
                }
            }, 1500);
            
            mostrarNotificacion(`Reproduciendo: ${playlist.nombre}`, 'exito');
        }
    }, 100);
    
    // Timeout de seguridad
    setTimeout(() => {
        clearInterval(esperarReproductor);
        if (!window.musicPlayer) {
            mostrarNotificacion('Error al cargar el reproductor de música', 'error');
        }
    }, 5000);
}

// Hacer funciones globales
window.cerrarNotificacion = cerrarNotificacion;

