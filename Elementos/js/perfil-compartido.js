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
    
    console.log('Configurando menú de usuario...');
    console.log('userMenuBtn:', userMenuBtn);
    console.log('userDropdownMenu:', userDropdownMenu);
    
    if (userMenuBtn && userDropdownMenu) {
        // Remover listeners previos si existen
        const newUserMenuBtn = userMenuBtn.cloneNode(true);
        userMenuBtn.parentNode.replaceChild(newUserMenuBtn, userMenuBtn);
        
        newUserMenuBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            console.log('Click en botón de menú');
            userDropdownMenu.classList.toggle('active');
            console.log('Dropdown active:', userDropdownMenu.classList.contains('active'));
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function(e) {
            const isClickInsideMenu = newUserMenuBtn.contains(e.target) || userDropdownMenu.contains(e.target);
            if (!isClickInsideMenu && userDropdownMenu.classList.contains('active')) {
                console.log('Click fuera del menú, cerrando...');
                userDropdownMenu.classList.remove('active');
            }
        });
    } else {
        console.error('No se encontraron elementos del menú de usuario');
    }

    // Click en avatar para ir a configuración (pero no si se hace clic en el botón del menú)
    if (userAvatar) {
        userAvatar.addEventListener('click', function(e) {
            // No redirigir si se hace clic en el botón del menú o en el dropdown
            const userMenuBtnElement = document.getElementById('userMenuBtn');
            const userDropdownMenuElement = document.getElementById('userDropdownMenu');
            
            if (userMenuBtnElement && (e.target === userMenuBtnElement || userMenuBtnElement.contains(e.target))) {
                return;
            }
            if (userDropdownMenuElement && userDropdownMenuElement.contains(e.target)) {
                return;
            }
            window.location.href = 'panelUsuario.html';
        });
    }

    // Botón de logout en dropdown
    // Nota: El evento de logout se configura en el archivo específico de cada página
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

