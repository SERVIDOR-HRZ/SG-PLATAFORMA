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
            
            showMessage(`¡Contraseña cambiada exitosamente! Tu nuevo código de recuperación es: ${newRecoveryCode}. Redirigiendo al login...`, 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
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