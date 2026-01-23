// Login functionality with Firebase Firestore
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.querySelector('.login-btn');
    const registerLink = document.getElementById('registerLink');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    // Wait for Firebase to be ready
    function waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseDB && typeof firebase !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    // Show message function
    function showMessage(message, type) {
        // Create message element if it doesn't exist
        let messageDiv = document.getElementById('loginMessage');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'loginMessage';
            messageDiv.className = 'message';
            loginForm.appendChild(messageDiv);
        }
        
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }
    }

    // Authenticate user with Firestore - Auto detect user type
    async function authenticateUserAuto(email, password) {
        try {
            await waitForFirebase();
            
            // Check if user exists with correct credentials (any type)
            const userQuery = await window.firebaseDB.collection('usuarios')
                .where('usuario', '==', email)
                .where('password', '==', password)
                .get();
            
            if (userQuery.empty) {
                throw new Error('Credenciales incorrectas');
            }
            
            // Get user data
            const userData = userQuery.docs[0].data();
            
            // Check if account is active
            if (!userData.activo) {
                throw new Error('Tu cuenta está pendiente de activación. Contacta al administrador.');
            }
            
            // Store user session
            sessionStorage.setItem('currentUser', JSON.stringify({
                id: userQuery.docs[0].id,
                nombre: userData.nombre,
                email: userData.email,
                tipoUsuario: userData.tipoUsuario,
                rol: userData.rol || userData.tipoUsuario, // Asegurar que rol esté presente
                numeroDocumento: userData.numeroDocumento,
                numeroIdentidad: userData.numeroIdentidad
            }));
            
            // Log para debug
            console.log('Usuario guardado en sessionStorage:', {
                tipoUsuario: userData.tipoUsuario,
                rol: userData.rol || userData.tipoUsuario
            });
            
            return userData;
            
        } catch (error) {
            throw error;
        }
    }

    // Update email field when username changes
    const usernameInput = document.getElementById('username');
    const usuarioInput = document.getElementById('usuario');
    
    if (usernameInput && usuarioInput) {
        usernameInput.addEventListener('input', function() {
            let username = this.value.trim();
            
            // Si el usuario pega un correo completo, extraer solo la parte antes del @
            if (username.includes('@')) {
                username = username.split('@')[0];
            }
            
            // Convertir a minúsculas para evitar problemas de mayúsculas
            username = username.toLowerCase();
            
            // Actualizar el campo con el usuario en minúsculas
            this.value = username;
            
            usuarioInput.value = username ? username + '@seamosgenios.com' : '';
        });
    }

    // Handle form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('usuario').value.trim();
        const password = document.getElementById('password').value;
        
        // Basic validation
        if (!email || !password) {
            showMessage('Por favor completa todos los campos', 'error');
            return;
        }
        
        // Add loading state
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        showMessage('Iniciando sesión...', 'info');
        
        try {
            // Try to authenticate user (will detect type automatically)
            const userData = await authenticateUserAuto(email, password);
            
            showMessage('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
            
            // Redirect based on user type and role
            setTimeout(() => {
                // Check if we're in the Secciones folder
                const isInSecciones = window.location.pathname.includes('/Secciones/');
                
                // Coordinador va al panel de coordinadores
                if (userData.rol === 'coordinador') {
                    window.location.href = isInSecciones ? 'Panel_Coordinador.html' : 'Secciones/Panel_Coordinador.html';
                }
                // Superusuario y admin van al panel de administración
                else if (userData.tipoUsuario === 'admin' || userData.rol === 'superusuario' || userData.rol === 'admin') {
                    window.location.href = isInSecciones ? 'Panel_Admin.html' : 'Secciones/Panel_Admin.html';
                } else {
                    window.location.href = isInSecciones ? 'Panel_Estudiantes.html' : 'Secciones/Panel_Estudiantes.html';
                }
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            showMessage(error.message || 'Error al iniciar sesión', 'error');
        } finally {
            // Remove loading state
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });

    // Handle register link (solo si existe)
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            const isInSecciones = window.location.pathname.includes('/Secciones/');
            window.location.href = isInSecciones ? 'registro.html' : 'Secciones/registro.html';
        });
    }

    // Handle forgot password link
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            const isInSecciones = window.location.pathname.includes('/Secciones/');
            window.location.href = isInSecciones ? 'recuperar-password.html' : 'Secciones/recuperar-password.html';
        });
    }

    // Add password toggle functionality
    function addPasswordToggle(inputId) {
        const input = document.getElementById(inputId);
        if (!input) {
            console.warn(`Input with id '${inputId}' not found`);
            return;
        }
        
        const inputGroup = input.parentNode;
        if (!inputGroup) {
            console.warn(`Parent node for input '${inputId}' not found`);
            return;
        }
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
        toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
        
        // Style the input group as relative
        inputGroup.style.position = 'relative';
        
        // Add click event
        toggleBtn.addEventListener('click', function() {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '<i class="bi bi-eye-slash"></i>';
                toggleBtn.setAttribute('aria-label', 'Ocultar contraseña');
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
                toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
            }
        });
        
        inputGroup.appendChild(toggleBtn);
    }

    // Add password toggle to login
    addPasswordToggle('password');

    // Add input validation
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
    inputs.forEach(input => {
        // Skip hidden inputs
        if (input.type === 'hidden') return;
        
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#ff0000';
            } else {
                this.style.borderColor = '#e0e0e0';
            }
        });

        input.addEventListener('focus', function() {
            this.style.borderColor = '#ff0000';
        });
    });
});