// Gestión de Inscripciones - JavaScript
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

    // Botón Mi Perfil
    const btnProfile = document.getElementById('btnProfile');
    if (btnProfile) {
        btnProfile.addEventListener('click', function() {
            if (currentUser.rol === 'coordinador') {
                window.location.href = 'Perfil-Coordinador.html';
            } else {
                window.location.href = 'panelUsuario.html';
            }
        });
    }

    // Botón Web Principal
    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
        btnHome.addEventListener('click', function() {
            window.location.href = '../index.html';
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

    // Botón Nueva Inscripción
    const btnNuevaInscripcion = document.getElementById('btnNuevaInscripcion');
    if (btnNuevaInscripcion) {
        btnNuevaInscripcion.addEventListener('click', function() {
            alert('Funcionalidad en desarrollo');
        });
    }

    // Responsive - Mostrar/ocultar mobile menu toggle
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            if (mobileMenuToggle) {
                mobileMenuToggle.style.display = 'flex';
            }
        } else {
            if (mobileMenuToggle) {
                mobileMenuToggle.style.display = 'none';
            }
            sidebarPanel.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            if (mobileMenuToggle) {
                mobileMenuToggle.classList.remove('active');
            }
        }
    }

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
});

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
