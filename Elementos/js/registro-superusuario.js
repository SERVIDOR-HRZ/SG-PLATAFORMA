// Registro de Superusuario - Seamos Genios
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerSuperuserForm');
    const messageDiv = document.getElementById('message');

    // Código de acceso para crear superusuarios
    const SUPERUSER_ACCESS_CODE = 'SG-SUPER-2025-MASTER-ACCESS-KEY';

    // Initialize password toggles
    initPasswordToggles();

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
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto hide success messages
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 10000);
        }
    }

    // Generate recovery code
    function generateRecoveryCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // Validate email format
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Initialize password toggle buttons
    function initPasswordToggles() {
        const passwordInputs = ['codigoAcceso', 'password', 'confirmPassword'];
        
        passwordInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (!input) return;
            
            const wrapper = input.parentElement;
            if (!wrapper.classList.contains('password-input-wrapper')) return;
            
            // Create toggle button
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
            toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
            
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
            
            wrapper.appendChild(toggleBtn);
        });
    }

    // Handle form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form values
        const codigoAcceso = document.getElementById('codigoAcceso').value.trim();
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
        const emailRecuperacion = document.getElementById('emailRecuperacion').value.trim().toLowerCase();
        const telefono = document.getElementById('telefono').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate access code
        if (codigoAcceso !== SUPERUSER_ACCESS_CODE) {
            showMessage('❌ Código de acceso incorrecto. No tienes autorización para crear superusuarios.', 'error');
            document.getElementById('codigoAcceso').value = '';
            document.getElementById('codigoAcceso').focus();
            return;
        }
        
        // Validate all fields
        if (!nombre || !email || !emailRecuperacion || !telefono || !password || !confirmPassword) {
            showMessage('❌ Por favor completa todos los campos obligatorios', 'error');
            return;
        }
        
        // Validate email format
        if (!isValidEmail(email)) {
            showMessage('❌ Por favor ingresa un correo electrónico válido', 'error');
            return;
        }
        
        if (!isValidEmail(emailRecuperacion)) {
            showMessage('❌ Por favor ingresa un correo de recuperación válido', 'error');
            return;
        }
        
        // Validate password length
        if (password.length < 8) {
            showMessage('❌ La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        
        // Validate password match
        if (password !== confirmPassword) {
            showMessage('❌ Las contraseñas no coinciden', 'error');
            return;
        }
        
        // Add loading state
        const submitBtn = registerForm.querySelector('.register-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Creando superusuario...';
        submitBtn.disabled = true;
        showMessage('⏳ Verificando información y creando cuenta...', 'info');
        
        try {
            await waitForFirebase();
            
            // Check if email already exists
            const existingUserQuery = await window.firebaseDB.collection('usuarios')
                .where('usuario', '==', email)
                .get();
            
            if (!existingUserQuery.empty) {
                showMessage('❌ Ya existe un usuario con este correo electrónico', 'error');
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
                return;
            }
            
            // Generate recovery code
            const recoveryCode = generateRecoveryCode();
            
            // Create superuser data
            const superuserData = {
                nombre: nombre,
                usuario: email,
                password: password,
                telefono: telefono,
                emailRecuperacion: emailRecuperacion,
                tipoUsuario: 'admin',
                rol: 'superusuario',
                activo: true,
                codigoRecuperacion: recoveryCode,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                fechaUltimaActualizacion: firebase.firestore.FieldValue.serverTimestamp(),
                creadoPor: 'registro-superusuario',
                permisos: {
                    gestionUsuarios: true,
                    gestionAdministradores: true,
                    cambiarRoles: true,
                    eliminarUsuarios: true,
                    accesoTotal: true
                }
            };
            
            // Add to Firestore
            const docRef = await window.firebaseDB.collection('usuarios').add(superuserData);
            
            // Show success message with recovery code
            showMessage(
                `✅ ¡Superusuario creado exitosamente!\n\n` +
                `📧 Email: ${email}\n` +
                `🔑 Código de recuperación: ${recoveryCode}\n\n` +
                `⚠️ IMPORTANTE: Guarda este código en un lugar seguro.\n` +
                `Redirigiendo al login en 8 segundos...`,
                'success'
            );
            
            // Log creation for security
            console.log('✅ Superusuario creado:', {
                id: docRef.id,
                nombre: nombre,
                email: email,
                fecha: new Date().toISOString()
            });
            
            // Clear form
            registerForm.reset();
            
            // Redirect to login after 8 seconds
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 8000);
            
        } catch (error) {
            console.error('❌ Error al crear superusuario:', error);
            showMessage('❌ Error al crear la cuenta de superusuario. Por favor intenta nuevamente.', 'error');
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    });

    // Add input validation styling
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                this.style.borderColor = '#28a745';
            } else {
                this.style.borderColor = '#dee2e6';
            }
        });

        input.addEventListener('focus', function() {
            this.style.borderColor = '#9c27b0';
        });

        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.style.borderColor = '#dc3545';
            }
        });
    });

    // Show access code info on page load
    console.log('%c⚠️ REGISTRO DE SUPERUSUARIO', 'color: #9c27b0; font-size: 20px; font-weight: bold;');
    console.log('%cEsta página es solo para personal autorizado.', 'color: #666; font-size: 14px;');
    console.log('%cCódigo de acceso requerido para crear superusuarios.', 'color: #666; font-size: 14px;');
});
