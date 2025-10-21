// Panel de Usuario JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar
    inicializarPanelModal();
    verificarAutenticacion();
    configurarEventos();
    cargarInformacionUsuario();
});

// Variables globales
let usuarioActual = null;
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

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
    
    // Botón cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', manejarCerrarSesion);
    
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

// Hacer función global
window.cerrarNotificacion = cerrarNotificacion;

