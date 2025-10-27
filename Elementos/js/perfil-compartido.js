// Funciones compartidas para gestión de perfil de usuario
// Este archivo se puede incluir en cualquier página que necesite mostrar foto de perfil

// Cargar foto de perfil del usuario
async function cargarFotoPerfilCompartida(usuarioId) {
    try {
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebaseCompartido();
        }

        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioId).get();

        if (usuarioDoc.exists) {
            const datosUsuario = usuarioDoc.data();
            
            if (datosUsuario.fotoPerfil) {
                mostrarFotoPerfilCompartida(datosUsuario.fotoPerfil);
            }
        }
    } catch (error) {
        console.error('Error al cargar foto de perfil:', error);
    }
}

// Mostrar foto de perfil en el avatar
function mostrarFotoPerfilCompartida(urlFoto) {
    const avatarDefault = document.getElementById('userAvatarDefault');
    const avatarImage = document.getElementById('userAvatarImage');

    if (avatarDefault && avatarImage) {
        avatarDefault.style.display = 'none';
        avatarImage.src = urlFoto;
        avatarImage.style.display = 'block';
    }
}

// Esperar a que Firebase esté listo
function esperarFirebaseCompartido() {
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

// Configurar menú desplegable de usuario
function configurarMenuUsuarioCompartido() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const userAvatar = document.getElementById('userAvatarContainer');
    
    if (userMenuBtn && userDropdownMenu) {
        userMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            userDropdownMenu.classList.toggle('active');
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            if (!userMenuBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('active');
            }
        });
    }

    // Click en avatar para ir a configuración (pero no si se hace clic en el botón del menú)
    if (userAvatar) {
        userAvatar.addEventListener('click', function(e) {
            // No redirigir si se hace clic en el botón del menú o en el dropdown
            if (userMenuBtn && (e.target === userMenuBtn || userMenuBtn.contains(e.target))) {
                return;
            }
            if (userDropdownMenu && userDropdownMenu.contains(e.target)) {
                return;
            }
            window.location.href = 'panelUsuario.html';
        });
    }

    // Botón de logout en dropdown
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    if (logoutBtnDropdown && typeof handleLogout === 'function') {
        logoutBtnDropdown.addEventListener('click', handleLogout);
    }
}

// Inicializar foto de perfil automáticamente
function inicializarPerfilCompartido() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (currentUser.id) {
        cargarFotoPerfilCompartida(currentUser.id);
    }
    
    configurarMenuUsuarioCompartido();
}

// Exportar funciones globalmente
window.cargarFotoPerfilCompartida = cargarFotoPerfilCompartida;
window.mostrarFotoPerfilCompartida = mostrarFotoPerfilCompartida;
window.esperarFirebaseCompartido = esperarFirebaseCompartido;
window.configurarMenuUsuarioCompartido = configurarMenuUsuarioCompartido;
window.inicializarPerfilCompartido = inicializarPerfilCompartido;

