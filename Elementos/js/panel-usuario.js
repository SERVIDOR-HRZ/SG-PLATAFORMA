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
        document.getElementById('email').value = datosUsuario.usuario || datosUsuario.email || '';
        document.getElementById('emailRecuperacion').value = datosUsuario.emailRecuperacion || '';
        document.getElementById('telefono').value = datosUsuario.telefono || '';
        document.getElementById('fechaNacimiento').value = datosUsuario.fechaNacimiento || '';
        document.getElementById('tipoDocumento').value = datosUsuario.tipoDocumento || '';
        document.getElementById('numeroDocumento').value = datosUsuario.numeroDocumento || '';
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
        const telefono = document.getElementById('telefono').value.trim();
        const emailRecuperacion = document.getElementById('emailRecuperacion').value.trim();
        const fechaNacimiento = document.getElementById('fechaNacimiento').value;
        const tipoDocumento = document.getElementById('tipoDocumento').value;
        const numeroDocumento = document.getElementById('numeroDocumento').value.trim();

        // Validaciones
        if (!nombre) {
            throw new Error('El nombre es requerido');
        }

        if (!emailRecuperacion) {
            throw new Error('El correo de recuperación es requerido');
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailRecuperacion)) {
            throw new Error('El correo de recuperación no es válido');
        }

        // Actualizar usuario (sin modificar el email/usuario)
        const db = window.firebaseDB;
        await db.collection('usuarios').doc(usuarioActual.id).update({
            nombre: nombre,
            telefono: telefono,
            emailRecuperacion: emailRecuperacion,
            fechaNacimiento: fechaNacimiento,
            tipoDocumento: tipoDocumento,
            numeroDocumento: numeroDocumento,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        });

        // Actualizar sesión
        usuarioActual.nombre = nombre;
        usuarioActual.telefono = telefono;
        usuarioActual.emailRecuperacion = emailRecuperacion;
        usuarioActual.tipoDocumento = tipoDocumento;
        usuarioActual.numeroDocumento = numeroDocumento;
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
    } else if (tabName === 'musica') {
        cargarPlaylists();
    } else if (tabName === 'recursos') {
        console.log('Cargando pestaña de recursos...');
        cargarRecursosUsuario();
    }
}

// ========================================
// GESTIÓN DE RECURSOS DEL USUARIO
// ========================================

async function cargarRecursosUsuario() {
    if (!usuarioActual || !usuarioActual.id) {
        console.warn('No hay usuario actual para cargar recursos');
        return;
    }

    try {
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        
        // Obtener datos actualizados del usuario
        const userDoc = await db.collection('usuarios').doc(usuarioActual.id).get();
        if (!userDoc.exists) {
            console.warn('Usuario no encontrado en Firebase');
            return;
        }
        
        const userData = userDoc.data();
        console.log('Datos del usuario cargados:', { 
            monedas: userData.puntosAcumulados || userData.puntos || 0,
            insignias: (userData.insignias || []).length,
            aulas: (userData.aulasAsignadas || []).length,
            historial: (userData.historialRecompensas || []).length
        });
        
        // Actualizar stats
        const monedas = userData.puntosAcumulados || userData.puntos || 0;
        const insignias = userData.insignias || [];
        const aulasAsignadas = userData.aulasAsignadas || [];
        const historialRecompensas = userData.historialRecompensas || [];
        
        document.getElementById('totalMonedasUsuario').textContent = monedas.toLocaleString('es-CO');
        document.getElementById('totalInsigniasUsuario').textContent = insignias.length;
        document.getElementById('totalAulasUsuario').textContent = aulasAsignadas.length;
        
        // Cargar insignias
        await cargarInsigniasUsuario(insignias);
        
        // Cargar aulas
        await cargarAulasUsuario(aulasAsignadas);
        
        // Cargar historial de monedas
        cargarHistorialMonedasUsuario(historialRecompensas);
        
    } catch (error) {
        console.error('Error cargando recursos:', error);
        mostrarNotificacion('Error al cargar los recursos del usuario', 'error');
    }
}

async function cargarInsigniasUsuario(insigniasIds) {
    const container = document.getElementById('insigniasUsuarioGrid');
    const noInsignias = document.getElementById('noInsigniasUsuario');
    
    if (!container) {
        console.error('Contenedor de insignias no encontrado');
        return;
    }
    
    console.log('IDs de insignias del usuario:', insigniasIds);
    
    if (!insigniasIds || insigniasIds.length === 0) {
        container.innerHTML = '';
        if (noInsignias) noInsignias.style.display = 'block';
        return;
    }
    
    if (noInsignias) noInsignias.style.display = 'none';
    container.innerHTML = '<div class="loading-recursos"><i class="bi bi-arrow-clockwise spin"></i><p>Cargando insignias...</p></div>';
    
    try {
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        const insigniasSnapshot = await db.collection('insignias').get();
        
        const todasInsignias = {};
        insigniasSnapshot.forEach(doc => {
            todasInsignias[doc.id] = { id: doc.id, ...doc.data() };
        });
        
        console.log('Insignias disponibles en Firebase:', Object.keys(todasInsignias));
        console.log('Datos de insignias en Firebase:', Object.values(todasInsignias).map(i => ({ id: i.id, nombre: i.nombre, icono: i.icono })));
        console.log('Buscando insignias con IDs:', insigniasIds);
        
        let html = '';
        let insigniasEncontradas = 0;
        insigniasIds.forEach(insigniaRef => {
            // La insignia puede ser un string (ID) o un objeto {id, nombre}
            const insigniaId = typeof insigniaRef === 'object' ? insigniaRef.id : insigniaRef;
            const insigniaNombre = typeof insigniaRef === 'object' ? insigniaRef.nombre : null;
            
            console.log('Buscando insignia con ID:', insigniaId, '- Encontrada:', !!todasInsignias[insigniaId]);
            
            let insignia = todasInsignias[insigniaId];
            
            // Si no encontramos por ID, buscar por nombre
            if (!insignia && insigniaNombre) {
                console.log('Buscando insignia por nombre:', insigniaNombre);
                insignia = Object.values(todasInsignias).find(i => i.nombre === insigniaNombre);
                if (insignia) {
                    console.log('Insignia encontrada por nombre:', insignia);
                }
            }
            
            if (insignia) {
                insigniasEncontradas++;
                const color = insignia.color || '#667eea';
                // Asegurar que el ícono tenga el prefijo bi-
                let icono = insignia.icono || 'award-fill';
                if (!icono.startsWith('bi-')) {
                    icono = 'bi-' + icono;
                }
                console.log('Insignia encontrada:', { nombre: insignia.nombre, icono: insignia.icono, iconoUsado: icono });
                html += `
                    <div class="insignia-usuario-card">
                        <div class="insignia-usuario-icon" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -30)});">
                            <i class="bi ${icono}"></i>
                        </div>
                        <p class="insignia-nombre">${insignia.nombre || 'Insignia'}</p>
                        <span class="insignia-categoria">${getCategoriaName(insignia.categoria)}</span>
                    </div>
                `;
            } else if (typeof insigniaRef === 'object' && insigniaRef.nombre) {
                // Si no encontramos la insignia en Firebase pero tenemos datos del objeto
                insigniasEncontradas++;
                const color = insigniaRef.color || '#667eea';
                // Asegurar que el ícono tenga el prefijo bi-
                let icono = insigniaRef.icono || 'award-fill';
                if (!icono.startsWith('bi-')) {
                    icono = 'bi-' + icono;
                }
                html += `
                    <div class="insignia-usuario-card">
                        <div class="insignia-usuario-icon" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -30)});">
                            <i class="bi ${icono}"></i>
                        </div>
                        <p class="insignia-nombre">${insigniaRef.nombre || 'Insignia'}</p>
                        <span class="insignia-categoria">${getCategoriaName(insigniaRef.categoria)}</span>
                    </div>
                `;
            }
        });
        
        console.log('Insignias encontradas:', insigniasEncontradas, 'de', insigniasIds.length);
        
        if (html) {
            container.innerHTML = html;
        } else {
            container.innerHTML = '';
            if (noInsignias) noInsignias.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error cargando insignias:', error);
        container.innerHTML = '<div class="no-recursos"><i class="bi bi-exclamation-circle"></i><p>Error al cargar insignias</p></div>';
    }
}

async function cargarAulasUsuario(aulasIds) {
    const container = document.getElementById('aulasUsuarioGrid');
    const noAulas = document.getElementById('noAulasUsuario');
    
    if (!container) {
        console.error('Contenedor de aulas no encontrado');
        return;
    }
    
    if (!aulasIds || aulasIds.length === 0) {
        container.innerHTML = '';
        if (noAulas) noAulas.style.display = 'block';
        return;
    }
    
    if (noAulas) noAulas.style.display = 'none';
    container.innerHTML = '<div class="loading-recursos"><i class="bi bi-arrow-clockwise spin"></i><p>Cargando aulas...</p></div>';
    
    try {
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        
        let html = '';
        for (const aulaRef of aulasIds) {
            // El aula puede ser un string (ID) o un objeto {aulaId, materias}
            const aulaId = typeof aulaRef === 'object' ? aulaRef.aulaId : aulaRef;
            
            const aulaDoc = await db.collection('aulas').doc(aulaId).get();
            if (aulaDoc.exists) {
                const aula = aulaDoc.data();
                const color = aula.color || '#667eea';
                const materias = aula.materias || [];
                
                const materiasHTML = materias.map(m => {
                    const config = getMateriasConfig()[m];
                    if (!config) return '';
                    return `<span class="materia-mini-tag ${m}"><i class="bi ${config.icon}"></i> ${config.nombre}</span>`;
                }).join('');
                
                html += `
                    <div class="aula-usuario-card">
                        <div class="aula-usuario-header" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -30)});">
                            <i class="bi bi-door-open-fill"></i>
                            <h4>${aula.nombre || 'Aula'}</h4>
                        </div>
                        <div class="aula-usuario-body">
                            ${aula.descripcion ? `<p>${aula.descripcion}</p>` : ''}
                            <div class="aula-materias-tags">
                                ${materiasHTML || '<span class="text-muted">Sin materias</span>'}
                            </div>
                        </div>
                    </div>
                `;
            }
        }
        
        if (html) {
            container.innerHTML = html;
        } else {
            container.innerHTML = '';
            if (noAulas) noAulas.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error cargando aulas:', error);
        container.innerHTML = '<div class="no-recursos"><i class="bi bi-exclamation-circle"></i><p>Error al cargar aulas</p></div>';
    }
}

function cargarHistorialMonedasUsuario(historial) {
    const container = document.getElementById('historialMonedasUsuario');
    const noHistorial = document.getElementById('noHistorialMonedas');
    
    if (!container) {
        console.error('Contenedor de historial de monedas no encontrado');
        return;
    }
    
    console.log('Cargando historial de monedas:', historial?.length || 0, 'registros');
    
    if (!historial || historial.length === 0) {
        container.innerHTML = '';
        if (noHistorial) noHistorial.style.display = 'block';
        return;
    }
    
    if (noHistorial) noHistorial.style.display = 'none';
    
    // Ordenar por fecha descendente
    const historialOrdenado = [...historial].sort((a, b) => {
        let fechaA, fechaB;
        try {
            fechaA = a.fecha?.toDate ? a.fecha.toDate() : (a.fecha ? new Date(a.fecha) : new Date(0));
            fechaB = b.fecha?.toDate ? b.fecha.toDate() : (b.fecha ? new Date(b.fecha) : new Date(0));
        } catch (e) {
            fechaA = new Date(0);
            fechaB = new Date(0);
        }
        return fechaB - fechaA;
    }).slice(0, 20); // Mostrar últimos 20
    
    let html = '';
    historialOrdenado.forEach(item => {
        let fecha;
        try {
            fecha = item.fecha?.toDate ? item.fecha.toDate() : (item.fecha ? new Date(item.fecha) : new Date());
        } catch (e) {
            fecha = new Date();
        }
        const fechaStr = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
        const puntos = item.puntos || 0;
        const esPositivo = puntos >= 0;
        const signo = esPositivo ? '+' : '';
        const iconClass = esPositivo ? 'bi-plus-circle' : 'bi-dash-circle';
        const colorClass = esPositivo ? 'positivo' : 'negativo';
        
        html += `
            <div class="historial-moneda-item">
                <div class="historial-moneda-icon ${colorClass}">
                    <i class="bi ${iconClass}"></i>
                </div>
                <div class="historial-moneda-info">
                    <p class="descripcion">${item.descripcion || 'Movimiento de monedas'}</p>
                    <span class="fecha">${fechaStr}</span>
                </div>
                <div class="historial-moneda-cantidad ${colorClass}">
                    <i class="bi bi-coin"></i>
                    ${signo}${puntos}
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Funciones auxiliares para recursos
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getCategoriaName(categoria) {
    const categorias = {
        'matematicas': 'Matemáticas',
        'lectura': 'Lectura Crítica',
        'sociales': 'Ciencias Sociales',
        'ciencias': 'Ciencias Naturales',
        'ingles': 'Inglés'
    };
    return categorias[categoria] || categoria || 'General';
}

function getMateriasConfig() {
    return {
        'anuncios': { nombre: 'Anuncios', icon: 'bi-megaphone' },
        'matematicas': { nombre: 'Matemáticas', icon: 'bi-calculator' },
        'lectura': { nombre: 'Lectura', icon: 'bi-book' },
        'sociales': { nombre: 'Sociales', icon: 'bi-globe' },
        'naturales': { nombre: 'Naturales', icon: 'bi-tree' },
        'ingles': { nombre: 'Inglés', icon: 'bi-translate' }
    };
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

// ========================================
// SISTEMA DE PLAYLIST PERSONALIZADA DE MÚSICA
// ========================================

let playlistPersonal = [];
const PLAYLIST_POR_DEFECTO = [
    { id: 'QzlcxmVBIFo', title: 'Música para Estudiar y Concentrarse' },
    { id: 'lFcSrYw-ARY', title: 'Sonidos Relajantes de la Naturaleza' },
    { id: 'hHW1oY26kxQ', title: 'Música Instrumental Suave' },
    { id: '5qap5aO4i9A', title: 'Música Clásica para Estudiar' },
    { id: 'M4QVjBzuVdc', title: 'Música Ambiental Relajante' },
    { id: 'DWcJFNfaw9c', title: 'Sonidos del Océano' },
    { id: 'UfcAVejslrU', title: 'Música para Concentración Profunda' },
    { id: 'kK42LZqO0wA', title: 'Piano Suave para Estudiar' },
    { id: 'jfKfPfyJRdk', title: 'Música Lo-Fi para Estudiar' },
    { id: 'n61ULEU7CO0', title: 'Música de Fondo para Concentración' }
];

// Configurar eventos de música
document.addEventListener('DOMContentLoaded', function() {
    configurarEventosMusica();
});

function configurarEventosMusica() {
    const formularioAgregarCancion = document.getElementById('formularioAgregarCancion');
    if (formularioAgregarCancion) {
        formularioAgregarCancion.addEventListener('submit', agregarCancionPersonalizada);
    }
    
    const probarVideoBtn = document.getElementById('probarVideoBtn');
    if (probarVideoBtn) {
        probarVideoBtn.addEventListener('click', probarVideoAntesDeSumar);
    }
    
    const restaurarPlaylistBtn = document.getElementById('restaurarPlaylistBtn');
    if (restaurarPlaylistBtn) {
        restaurarPlaylistBtn.addEventListener('click', restaurarPlaylistPorDefecto);
    }
    
    const guardarPlaylistBtn = document.getElementById('guardarPlaylistBtn');
    if (guardarPlaylistBtn) {
        guardarPlaylistBtn.addEventListener('click', guardarPlaylistPersonalizada);
    }
    
    // Cargar playlist cuando se active la pestaña de música
    const tabMusica = document.querySelector('[data-tab="musica"]');
    if (tabMusica) {
        tabMusica.addEventListener('click', function() {
            cargarPlaylistPersonalizada();
        });
    }
}

// Cargar playlist personalizada del usuario
async function cargarPlaylistPersonalizada() {
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        const usuarioId = usuarioActual.id || usuarioActual.numeroDocumento;
        
        const playlistDoc = await db.collection('playlistsPersonales').doc(usuarioId).get();
        
        if (playlistDoc.exists) {
            const data = playlistDoc.data();
            playlistPersonal = data.canciones || PLAYLIST_POR_DEFECTO;
        } else {
            playlistPersonal = [...PLAYLIST_POR_DEFECTO];
        }
        
        renderizarPlaylist();
        
    } catch (error) {
        console.error('Error al cargar playlist:', error);
        playlistPersonal = [...PLAYLIST_POR_DEFECTO];
        renderizarPlaylist();
    }
}

// Extraer ID de video de YouTube de una URL
function extraerYouTubeID(url) {
    const patrones = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];
    
    for (const patron of patrones) {
        const match = url.match(patron);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// Verificar si un video de YouTube se puede reproducir como embebido y obtener información
async function verificarYVerificarVideoYouTube(videoId) {
    try {
        console.log('📋 Paso 1: Verificando con oEmbed API...');
        
        // PASO 1: Verificar con oEmbed primero (más rápido y confiable)
        let infoVideo = null;
        try {
            const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
            const response = await fetch(oEmbedUrl);
            
            if (!response.ok) {
                console.log('❌ Video no encontrado o privado en oEmbed');
                return null;
            }
            
            const data = await response.json();
            infoVideo = {
                title: data.title || 'Video de YouTube',
                author: data.author_name || '',
                thumbnail: data.thumbnail_url || ''
            };
            console.log('✅ Video encontrado en oEmbed:', infoVideo.title);
        } catch (e) {
            console.log('❌ Error con oEmbed - Video probablemente no existe:', e);
            return null;
        }
        
        console.log('📋 Paso 2: Verificando si se puede embeber...');
        
        // PASO 2: Verificar si realmente se puede embeber
        const puedeEmbeber = await verificarVideoEmbebible(videoId);
        
        if (!puedeEmbeber) {
            console.log('❌ Video NO se puede embeber - Tiene restricciones');
            return null;
        }
        
        console.log('✅ Verificación completa - Video aprobado');
        return infoVideo;
        
    } catch (error) {
        console.error('❌ Error general en verificación:', error);
        return null;
    }
}

// Verificar si un video se puede embeber en iframe usando método directo
function verificarVideoEmbebible(videoId) {
    return new Promise((resolve) => {
        console.log('🔍 Probando carga de iframe para video:', videoId);
        
        // Crear un iframe temporal para probar
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        iframe.style.width = '200px';
        iframe.style.height = '200px';
        iframe.style.zIndex = '-1';
        iframe.id = 'temp-yt-check-' + Date.now();
        
        // Importante: Usar parámetros que fuerzan la carga real del player
        // autoplay=1 y mute=1 para que intente reproducir y así detectar restricciones
        iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&enablejsapi=0&modestbranding=1&rel=0`;
        
        let resuelto = false;
        let cargaDetectada = false;
        
        // Timeout MÁS ESTRICTO de 5 segundos - Si no carga, definitivamente rechazar
        const timeout = setTimeout(() => {
            if (!resuelto) {
                console.log('❌ TIMEOUT - El video tardó demasiado en cargar (5 seg) - RECHAZADO');
                resuelto = true;
                limpiar();
                resolve(false);
            }
        }, 5000);
        
        function limpiar() {
            try {
                clearTimeout(timeout);
                if (iframe && iframe.parentNode) {
                    document.body.removeChild(iframe);
                }
            } catch (e) {
                // Ignorar errores de limpieza
            }
        }
        
        // Detectar cuando el iframe carga
        iframe.addEventListener('load', function() {
            if (!resuelto) {
                cargaDetectada = true;
                console.log('⏳ Iframe cargado, esperando confirmación...');
                
                // Esperar 2 segundos adicionales para ver si realmente se reproduce
                // Los videos con restricciones fallan aquí
                setTimeout(() => {
                    if (!resuelto) {
                        console.log('✅ Video APROBADO - Se cargó correctamente');
                        resuelto = true;
                        limpiar();
                        resolve(true);
                    }
                }, 2000);
            }
        });
        
        // Detectar errores explícitos
        iframe.addEventListener('error', function(e) {
            console.log('❌ ERROR explícito al cargar iframe - RECHAZADO');
            if (!resuelto) {
                resuelto = true;
                limpiar();
                resolve(false);
            }
        });
        
        // Agregar al DOM para iniciar la carga
        try {
            document.body.appendChild(iframe);
            console.log('📺 Iframe agregado al DOM');
        } catch (e) {
            console.log('❌ Error al agregar iframe al DOM - RECHAZADO');
            resuelto = true;
            limpiar();
            resolve(false);
        }
    });
}

// Probar video antes de agregarlo
function probarVideoAntesDeSumar() {
    const youtubeUrl = document.getElementById('youtubeUrl').value.trim();
    
    if (!youtubeUrl) {
        mostrarNotificacion('Por favor ingresa una URL de YouTube primero', 'advertencia');
        return;
    }
    
    const videoId = extraerYouTubeID(youtubeUrl);
    
    if (!videoId) {
        mostrarNotificacion('URL de YouTube inválida. Por favor verifica el enlace.', 'error');
        return;
    }
    
    // Abrir modal de vista previa
    const tituloCancion = document.getElementById('tituloCancion').value.trim();
    const titulo = tituloCancion || 'Vista Previa - Verifica que el video se reproduzca';
    
    previewCancion(videoId, titulo);
    
    // Mostrar mensaje informativo
    setTimeout(() => {
        mostrarNotificacion('💡 Si el video se reproduce correctamente, puedes agregarlo a tu playlist. Si muestra error, busca otro video.', 'info');
    }, 500);
}

// Agregar canción personalizada
async function agregarCancionPersonalizada(e) {
    e.preventDefault();
    
    const youtubeUrl = document.getElementById('youtubeUrl').value.trim();
    const tituloCancion = document.getElementById('tituloCancion').value.trim();
    
    const videoId = extraerYouTubeID(youtubeUrl);
    
    if (!videoId) {
        mostrarNotificacion('URL de YouTube inválida. Por favor verifica el enlace.', 'error');
        return;
    }
    
    // Verificar límite de canciones
    if (playlistPersonal.length >= 20) {
        mostrarNotificacion('Has alcanzado el límite de 20 canciones', 'advertencia');
        return;
    }
    
    // Verificar si ya existe
    if (playlistPersonal.some(cancion => cancion.id === videoId)) {
        mostrarNotificacion('Esta canción ya está en tu playlist', 'advertencia');
        return;
    }
    
    try {
        mostrarCargando('Verificando video... Esto puede tomar unos segundos');
        
        console.log('🔍 Iniciando verificación para video:', videoId);
        
        // Verificar si el video se puede reproducir y obtener información
        const infoVideo = await verificarYVerificarVideoYouTube(videoId);
        
        if (!infoVideo) {
            ocultarCargando();
            console.log('❌ Video rechazado por verificación');
            console.log('💡 TIP: Abre la consola del navegador (F12) para ver detalles de la verificación');
            mostrarNotificacion('❌ Este video NO se puede agregar. El propietario no permite reproducción embebida, el video no existe, o está restringido. 💡 Usa el botón "Probar" para verificar antes de agregar.', 'error');
            return;
        }
        
        console.log('✅ Video aprobado:', infoVideo.title);
        
        // Usar el título detectado o el ingresado por el usuario
        const tituloFinal = tituloCancion || infoVideo.title || `Canción ${playlistPersonal.length + 1}`;
        
        // Agregar canción
        const nuevaCancion = {
            id: videoId,
            title: tituloFinal
        };
        
        playlistPersonal.push(nuevaCancion);
        renderizarPlaylist();
        
        // Limpiar formulario
        document.getElementById('formularioAgregarCancion').reset();
        
        ocultarCargando();
        mostrarNotificacion(`✅ Canción agregada: ${tituloFinal}. No olvides guardar los cambios.`, 'exito');
        
    } catch (error) {
        console.error('❌ Error al verificar video:', error);
        ocultarCargando();
        mostrarNotificacion('Error al verificar el video. Por favor intenta nuevamente.', 'error');
    }
}

// Renderizar playlist
function renderizarPlaylist() {
    const playlistItems = document.getElementById('playlistItems');
    const playlistCount = document.getElementById('playlistCount');
    const playlistEmpty = document.getElementById('playlistEmpty');
    
    if (!playlistItems || !playlistCount) return;
    
    playlistCount.textContent = `(${playlistPersonal.length} cancion${playlistPersonal.length !== 1 ? 'es' : ''})`;
    
    if (playlistPersonal.length === 0) {
        playlistItems.innerHTML = `
            <div class="playlist-empty">
                <i class="bi bi-music-note-beamed"></i>
                <p>No hay canciones en tu playlist</p>
                <p class="text-muted">Agrega tu primera canción usando el formulario arriba</p>
            </div>
        `;
        return;
    }
    
    if (playlistEmpty) {
        playlistEmpty.style.display = 'none';
    }
    
    playlistItems.innerHTML = playlistPersonal.map((cancion, index) => `
        <div class="playlist-item">
            <div class="playlist-item-number">${index + 1}</div>
            <div class="playlist-item-info">
                <div class="playlist-item-titulo">${cancion.title}</div>
                <div class="playlist-item-youtube">
                    <i class="bi bi-youtube"></i>
                    ID: <span class="playlist-item-id">${cancion.id}</span>
                </div>
            </div>
            <div class="playlist-item-acciones">
                <button class="btn-icon-small btn-play" onclick="previewCancion('${cancion.id}', '${cancion.title.replace(/'/g, "\\'")}')" title="Vista previa">
                    <i class="bi bi-play-fill"></i>
                </button>
                <button class="btn-icon-small btn-move-up" onclick="moverCancionArriba(${index})" 
                        ${index === 0 ? 'disabled' : ''} title="Subir">
                    <i class="bi bi-arrow-up"></i>
                </button>
                <button class="btn-icon-small btn-move-down" onclick="moverCancionAbajo(${index})" 
                        ${index === playlistPersonal.length - 1 ? 'disabled' : ''} title="Bajar">
                    <i class="bi bi-arrow-down"></i>
                </button>
                <button class="btn-icon-small btn-delete" onclick="eliminarCancionPersonalizada(${index})" title="Eliminar">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Mover canción arriba
function moverCancionArriba(index) {
    if (index === 0) return;
    
    const temp = playlistPersonal[index];
    playlistPersonal[index] = playlistPersonal[index - 1];
    playlistPersonal[index - 1] = temp;
    
    renderizarPlaylist();
    mostrarNotificacion('Orden modificado. No olvides guardar los cambios.', 'info');
}

// Mover canción abajo
function moverCancionAbajo(index) {
    if (index === playlistPersonal.length - 1) return;
    
    const temp = playlistPersonal[index];
    playlistPersonal[index] = playlistPersonal[index + 1];
    playlistPersonal[index + 1] = temp;
    
    renderizarPlaylist();
    mostrarNotificacion('Orden modificado. No olvides guardar los cambios.', 'info');
}

// Eliminar canción
function eliminarCancionPersonalizada(index) {
    const cancion = playlistPersonal[index];
    
    if (confirm(`¿Eliminar "${cancion.title}" de tu playlist?`)) {
        playlistPersonal.splice(index, 1);
        renderizarPlaylist();
        mostrarNotificacion('Canción eliminada. No olvides guardar los cambios.', 'info');
    }
}

// Preview de canción (reproduce en modal embebido)
function previewCancion(videoId, titulo) {
    const modal = document.getElementById('modalReproductorPreview');
    const videoContainer = document.getElementById('videoPreviewContainer');
    const modalTitulo = document.getElementById('modalReproductorTitulo');
    
    // Establecer título
    if (titulo) {
        modalTitulo.textContent = titulo;
    } else {
        modalTitulo.textContent = 'Vista Previa de Canción';
    }
    
    // Mostrar loading
    videoContainer.innerHTML = `
        <div class="video-loading">
            <div class="loading-spinner"></div>
            <p>Cargando video...</p>
        </div>
    `;
    
    // Mostrar modal
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Crear iframe después de un momento
    setTimeout(() => {
        videoContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    }, 300);
}

// Cerrar modal reproductor
function cerrarModalReproductor() {
    const modal = document.getElementById('modalReproductorPreview');
    const videoContainer = document.getElementById('videoPreviewContainer');
    
    // Ocultar modal con animación
    modal.classList.remove('active');
    
    setTimeout(() => {
        modal.style.display = 'none';
        // Detener reproducción eliminando iframe
        videoContainer.innerHTML = `
            <div class="video-loading">
                <div class="loading-spinner"></div>
                <p>Cargando video...</p>
            </div>
        `;
    }, 300);
}

// Configurar event listeners para el modal reproductor
document.addEventListener('DOMContentLoaded', function() {
    const cerrarBtn1 = document.getElementById('cerrarReproductorPreview');
    const cerrarBtn2 = document.getElementById('cerrarPreviewBtn');
    const modal = document.getElementById('modalReproductorPreview');
    
    if (cerrarBtn1) {
        cerrarBtn1.addEventListener('click', cerrarModalReproductor);
    }
    
    if (cerrarBtn2) {
        cerrarBtn2.addEventListener('click', cerrarModalReproductor);
    }
    
    // Cerrar al hacer clic fuera del modal
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                cerrarModalReproductor();
            }
        });
    }
    
    // Cerrar con tecla ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('modalReproductorPreview');
            if (modal && modal.style.display === 'flex') {
                cerrarModalReproductor();
            }
        }
    });
});

// Guardar playlist personalizada
async function guardarPlaylistPersonalizada() {
    try {
        mostrarCargando('Guardando playlist...');
        
        if (!window.firebaseDB) {
            await esperarFirebase();
        }
        
        const db = window.firebaseDB;
        const usuarioId = usuarioActual.id || usuarioActual.numeroDocumento;
        
        const playlistData = {
            canciones: playlistPersonal,
            usuarioId: usuarioId,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        };
        
        await db.collection('playlistsPersonales').doc(usuarioId).set(playlistData);
        
        // Actualizar el music player si está activo
        if (window.musicPlayer && typeof window.musicPlayer.actualizarPlaylist === 'function') {
            window.musicPlayer.actualizarPlaylist(playlistPersonal);
        }
        
        mostrarNotificacion('Playlist guardada correctamente', 'exito');
        ocultarCargando();
        
    } catch (error) {
        console.error('Error al guardar playlist:', error);
        mostrarNotificacion('Error al guardar la playlist', 'error');
        ocultarCargando();
    }
}

// Restaurar playlist por defecto
function restaurarPlaylistPorDefecto() {
    if (confirm('¿Restaurar la playlist por defecto? Esto eliminará todas tus canciones personalizadas.')) {
        playlistPersonal = [...PLAYLIST_POR_DEFECTO];
        renderizarPlaylist();
        mostrarNotificacion('Playlist restaurada. No olvides guardar los cambios.', 'info');
    }
}

// Esperar a que Firebase esté listo
function esperarFirebase() {
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

// Hacer funciones globales para que se puedan llamar desde onclick en HTML
window.moverCancionArriba = moverCancionArriba;
window.moverCancionAbajo = moverCancionAbajo;
window.eliminarCancionPersonalizada = eliminarCancionPersonalizada;
window.previewCancion = previewCancion;
window.cerrarModalReproductor = cerrarModalReproductor;

