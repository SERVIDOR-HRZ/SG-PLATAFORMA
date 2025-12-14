// Password recovery functionality
document.addEventListener('DOMContentLoaded', function() {
    const step1Form = document.getElementById('recoveryStep1');
    const step2Form = document.getElementById('recoveryStep2');
    const messageDiv = document.getElementById('recoveryMessage');
    const backToStep1Link = document.getElementById('backToStep1');
    
    let currentUserData = null;

    // Wait for Firebase to be ready
    function waitForFirebase() {
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

    // Show message function
    function showMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }
    }

    // Add password toggle functionality
    function addPasswordToggle(inputId) {
        const input = document.getElementById(inputId);
        const inputGroup = input.parentNode;
        
        // Create toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '👁️';
        toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
        
        // Style the input group as relative
        inputGroup.style.position = 'relative';
        
        // Add click event
        toggleBtn.addEventListener('click', function() {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '🙈';
                toggleBtn.setAttribute('aria-label', 'Ocultar contraseña');
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '👁️';
                toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');
            }
        });
        
        inputGroup.appendChild(toggleBtn);
    }

    // Add password toggles
    addPasswordToggle('newPassword');
    addPasswordToggle('confirmNewPassword');

    // Update email field when username changes
    const usernameRecoveryInput = document.getElementById('usernameRecovery');
    const emailRecoveryInput = document.getElementById('emailRecovery');
    
    if (usernameRecoveryInput && emailRecoveryInput) {
        usernameRecoveryInput.addEventListener('input', function() {
            let username = this.value.trim();
            
            // Convertir a minúsculas
            username = username.toLowerCase();
            
            // Si el usuario pega un correo completo, extraer solo la parte antes del @
            if (username.includes('@')) {
                username = username.split('@')[0];
            }
            
            // Actualizar el campo con el usuario en minúsculas
            this.value = username;
            
            emailRecoveryInput.value = username ? username + '@seamosgenios.com' : '';
        });
    }

    // Switch between steps
    function showStep(stepNumber) {
        document.querySelectorAll('.recovery-step').forEach(step => {
            step.classList.remove('active');
        });
        
        if (stepNumber === 1) {
            step1Form.classList.add('active');
        } else if (stepNumber === 2) {
            step2Form.classList.add('active');
        }
    }

    // Validate recovery code and email
    async function validateRecoveryCode(email, code) {
        try {
            await waitForFirebase();
            
            const userQuery = await window.firebaseDB.collection('usuarios')
                .where('usuario', '==', email)
                .where('codigoRecuperacion', '==', code.toUpperCase())
                .get();
            
            if (userQuery.empty) {
                throw new Error('Correo electrónico o código de recuperación incorrecto');
            }
            
            return {
                docId: userQuery.docs[0].id,
                userData: userQuery.docs[0].data()
            };
            
        } catch (error) {
            throw error;
        }
    }

    // Update password and regenerate recovery code
    async function updatePassword(docId, newPassword) {
        try {
            await waitForFirebase();
            
            // Generate new recovery code
            const newRecoveryCode = generateRecoveryCode();
            
            await window.firebaseDB.collection('usuarios').doc(docId).update({
                password: newPassword,
                codigoRecuperacion: newRecoveryCode, // Regenerate code after use
                fechaUltimaRecuperacion: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            
            return newRecoveryCode;
            
        } catch (error) {
            throw error;
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

    // Generate credentials image with dark theme
    async function generateCredentialsImage(email, newPassword, recoveryCode, nombre) {
        return new Promise((resolve) => {
            // Crear canvas
            const canvas = document.createElement('canvas');
            canvas.width = 800;
            canvas.height = 650;
            const ctx = canvas.getContext('2d');
            
            // Fondo oscuro con degradado sutil
            const gradient = ctx.createLinearGradient(0, 0, 0, 650);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(0.5, '#2d2d2d');
            gradient.addColorStop(1, '#1a1a1a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 800, 650);
            
            // Borde rojo superior
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(0, 0, 800, 8);
            
            // Logo/Icono (simulado con texto)
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🎓', 400, 90);
            
            // Título principal
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 42px Arial';
            ctx.fillText('Seamos Genios', 400, 150);
            
            // Subtítulo
            ctx.fillStyle = '#ff0000';
            ctx.font = 'bold 26px Arial';
            ctx.fillText('Recuperar Contraseña', 400, 190);
            
            // Contenedor con borde rojo
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 3;
            ctx.strokeRect(60, 230, 680, 340);
            
            // Fondo semi-transparente para el contenedor
            ctx.fillStyle = 'rgba(45, 45, 45, 0.8)';
            ctx.fillRect(60, 230, 680, 340);
            
            // Información del usuario
            ctx.textAlign = 'left';
            
            // Nombre
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px Arial';
            ctx.fillText('Nombre:', 100, 280);
            ctx.font = '20px Arial';
            ctx.fillStyle = '#e0e0e0';
            ctx.fillText(nombre.toUpperCase(), 100, 315);
            
            // Usuario
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px Arial';
            ctx.fillText('Usuario:', 100, 365);
            ctx.font = '20px Arial';
            ctx.fillStyle = '#e0e0e0';
            ctx.fillText(email, 100, 400);
            
            // Nueva Contraseña
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px Arial';
            ctx.fillText('Nueva Contraseña:', 100, 450);
            ctx.font = '20px Arial';
            ctx.fillStyle = '#4CAF50';
            ctx.fillText(newPassword, 100, 485);
            
            // Nuevo Código de recuperación
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 22px Arial';
            ctx.fillText('Nuevo Código de Recuperación:', 100, 535);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = '#ff0000';
            ctx.fillText(recoveryCode, 100, 570);
            
            // Nota importante
            ctx.fillStyle = '#ffcccc';
            ctx.font = 'italic 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ Guarda esta imagen en un lugar seguro', 400, 620);
            
            // Convertir canvas a blob y descargar
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `recuperacion_${email.split('@')[0]}_${new Date().getTime()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                resolve();
            });
        });
    }

    // Validate password
    function validatePassword(password) {
        return password.length >= 6;
    }

    // Validate password confirmation
    function validatePasswordConfirmation(password, confirmPassword) {
        return password === confirmPassword;
    }

    // Handle step 1 form submission (verify code)
    step1Form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('emailRecovery').value.trim();
        const code = document.getElementById('recoveryCode').value.trim();
        
        if (!email || !code) {
            showMessage('Por favor completa todos los campos', 'error');
            return;
        }
        
        if (code.length !== 8) {
            showMessage('El código de recuperación debe tener 8 caracteres', 'error');
            return;
        }
        
        const submitBtn = step1Form.querySelector('.recovery-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        showMessage('Verificando código...', 'info');
        
        try {
            const result = await validateRecoveryCode(email, code);
            currentUserData = result;
            
            showMessage('Código verificado correctamente', 'success');
            
            setTimeout(() => {
                showStep(2);
                messageDiv.style.display = 'none';
            }, 1500);
            
        } catch (error) {
            console.error('Recovery error:', error);
            showMessage(error.message || 'Error al verificar el código', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    // Handle step 2 form submission (change password)
    step2Form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
        if (!validatePassword(newPassword)) {
            showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (!validatePasswordConfirmation(newPassword, confirmNewPassword)) {
            showMessage('Las contraseñas no coinciden', 'error');
            return;
        }
        
        const submitBtn = step2Form.querySelector('.recovery-btn');
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;
        showMessage('Cambiando contraseña...', 'info');
        
        try {
            const newRecoveryCode = await updatePassword(currentUserData.docId, newPassword);
            
            // Generar y descargar imagen con las credenciales
            const email = currentUserData.userData.usuario || currentUserData.userData.email;
            const nombre = currentUserData.userData.nombre || 'Usuario';
            
            showMessage('Generando imagen con tus nuevas credenciales...', 'info');
            
            await generateCredentialsImage(email, newPassword, newRecoveryCode, nombre);
            
            showMessage(`¡Contraseña cambiada exitosamente! Se ha descargado una imagen con tus nuevas credenciales. Redirigiendo al login...`, 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 5000);
            
        } catch (error) {
            console.error('Password update error:', error);
            showMessage(error.message || 'Error al cambiar la contraseña', 'error');
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });

    // Handle back to step 1
    backToStep1Link.addEventListener('click', function(e) {
        e.preventDefault();
        showStep(1);
        currentUserData = null;
        messageDiv.style.display = 'none';
        
        // Clear step 2 form
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    });

    // Format recovery code input
    document.getElementById('recoveryCode').addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase();
    });

    // Add real-time validation for passwords in step 2
    document.getElementById('newPassword').addEventListener('blur', function() {
        const password = this.value;
        if (password && !validatePassword(password)) {
            this.classList.add('invalid');
            this.classList.remove('valid');
        } else if (password) {
            this.classList.add('valid');
            this.classList.remove('invalid');
        }
    });

    document.getElementById('confirmNewPassword').addEventListener('blur', function() {
        const password = document.getElementById('newPassword').value;
        const confirmPassword = this.value;
        
        if (confirmPassword && !validatePasswordConfirmation(password, confirmPassword)) {
            this.classList.add('invalid');
            this.classList.remove('valid');
        } else if (confirmPassword) {
            this.classList.add('valid');
            this.classList.remove('invalid');
        }
    });
});