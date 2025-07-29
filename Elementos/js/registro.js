// Registration functionality - Only Students, Firestore only
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.querySelector('.register-btn');
    const messageDiv = document.getElementById('message');

    // Form validation - All new fields
    const inputs = {
        email: document.getElementById('email'),
        emailRecuperacion: document.getElementById('emailRecuperacion'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        nombre: document.getElementById('nombre'),
        telefono: document.getElementById('telefono'),
        institucion: document.getElementById('institucion'),
        grado: document.getElementById('grado'),
        tipoDocumento: document.getElementById('tipoDocumento'),
        numeroDocumento: document.getElementById('numeroDocumento'),
        departamento: document.getElementById('departamento'),
        terms: document.getElementById('terms')
    };

    // Add validation messages to all inputs except terms and selects
    Object.keys(inputs).forEach(key => {
        if (key !== 'terms' && inputs[key].tagName !== 'SELECT') {
            const validationMsg = document.createElement('div');
            validationMsg.className = 'validation-message';
            inputs[key].parentNode.appendChild(validationMsg);
        }
    });

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
    addPasswordToggle('password');
    addPasswordToggle('confirmPassword');

    // Real-time validation
    inputs.email.addEventListener('blur', () => validateSeamosGeniosEmail());
    inputs.emailRecuperacion.addEventListener('blur', () => validateRecoveryEmail());
    inputs.password.addEventListener('blur', () => validatePassword());
    inputs.confirmPassword.addEventListener('blur', () => validateConfirmPassword());
    inputs.nombre.addEventListener('blur', () => validateName());
    inputs.telefono.addEventListener('blur', () => validatePhone());
    inputs.institucion.addEventListener('blur', () => validateInstitution());
    inputs.numeroDocumento.addEventListener('blur', () => validateDocumentNumber());
    inputs.grado.addEventListener('change', () => validateSelect('grado'));
    inputs.tipoDocumento.addEventListener('change', () => validateSelect('tipoDocumento'));
    inputs.departamento.addEventListener('change', () => validateSelect('departamento'));

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

    function validateSeamosGeniosEmail() {
        const email = inputs.email.value.trim();
        const validationMsg = inputs.email.parentNode.querySelector('.validation-message');
        
        // Must be @seamosgenios.com domain
        const seamosGeniosRegex = /^[a-zA-Z0-9._%+-]+@seamosgenios\.com$/;
        
        if (!seamosGeniosRegex.test(email)) {
            inputs.email.classList.add('invalid');
            inputs.email.classList.remove('valid');
            validationMsg.textContent = 'Debe ser un correo @seamosgenios.com';
            validationMsg.classList.add('show');
            return false;
        }
        
        inputs.email.classList.add('valid');
        inputs.email.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateRecoveryEmail() {
        const email = inputs.emailRecuperacion.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validationMsg = inputs.emailRecuperacion.parentNode.querySelector('.validation-message');
        
        if (!emailRegex.test(email)) {
            inputs.emailRecuperacion.classList.add('invalid');
            inputs.emailRecuperacion.classList.remove('valid');
            validationMsg.textContent = 'Ingresa un correo electrónico válido';
            validationMsg.classList.add('show');
            return false;
        }
        
        inputs.emailRecuperacion.classList.add('valid');
        inputs.emailRecuperacion.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validatePassword() {
        const password = inputs.password.value;
        const validationMsg = inputs.password.parentNode.querySelector('.validation-message');
        
        if (password.length < 6) {
            inputs.password.classList.add('invalid');
            inputs.password.classList.remove('valid');
            validationMsg.textContent = 'La contraseña debe tener al menos 6 caracteres';
            validationMsg.classList.add('show');
            return false;
        }
        
        inputs.password.classList.add('valid');
        inputs.password.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateConfirmPassword() {
        const password = inputs.password.value;
        const confirmPassword = inputs.confirmPassword.value;
        const validationMsg = inputs.confirmPassword.parentNode.querySelector('.validation-message');
        
        if (password !== confirmPassword) {
            inputs.confirmPassword.classList.add('invalid');
            inputs.confirmPassword.classList.remove('valid');
            validationMsg.textContent = 'Las contraseñas no coinciden';
            validationMsg.classList.add('show');
            return false;
        }
        
        inputs.confirmPassword.classList.add('valid');
        inputs.confirmPassword.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateName() {
        const name = inputs.nombre.value.trim();
        const validationMsg = inputs.nombre.parentNode.querySelector('.validation-message');
        
        if (name.length < 2) {
            inputs.nombre.classList.add('invalid');
            inputs.nombre.classList.remove('valid');
            validationMsg.textContent = 'El nombre debe tener al menos 2 caracteres';
            validationMsg.classList.add('show');
            return false;
        }
        
        inputs.nombre.classList.add('valid');
        inputs.nombre.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validatePhone() {
        const phone = inputs.telefono.value.trim();
        const phoneRegex = /^[0-9]{10}$/;
        const validationMsg = inputs.telefono.parentNode.querySelector('.validation-message');
        
        if (!phoneRegex.test(phone)) {
            inputs.telefono.classList.add('invalid');
            inputs.telefono.classList.remove('valid');
            validationMsg.textContent = 'Ingresa un teléfono válido (10 dígitos)';
            validationMsg.classList.add('show');
            return false;
        }
        
        inputs.telefono.classList.add('valid');
        inputs.telefono.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateInstitution() {
        const institution = inputs.institucion.value.trim();
        const validationMsg = inputs.institucion.parentNode.querySelector('.validation-message');
        
        if (institution.length < 2) {
            inputs.institucion.classList.add('invalid');
            inputs.institucion.classList.remove('valid');
            validationMsg.textContent = 'La institución debe tener al menos 2 caracteres';
            validationMsg.classList.add('show');
            return false;
        }
        
        inputs.institucion.classList.add('valid');
        inputs.institucion.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateDocumentNumber() {
        const docNumber = inputs.numeroDocumento.value.trim();
        const validationMsg = inputs.numeroDocumento.parentNode.querySelector('.validation-message');
        
        if (docNumber.length < 5) {
            inputs.numeroDocumento.classList.add('invalid');
            inputs.numeroDocumento.classList.remove('valid');
            validationMsg.textContent = 'El número de documento debe tener al menos 5 caracteres';
            validationMsg.classList.add('show');
            return false;
        }
        
        inputs.numeroDocumento.classList.add('valid');
        inputs.numeroDocumento.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateSelect(fieldName) {
        const select = inputs[fieldName];
        const value = select.value;
        
        if (!value || value === '') {
            select.classList.add('invalid');
            select.classList.remove('valid');
            return false;
        }
        
        select.classList.add('valid');
        select.classList.remove('invalid');
        return true;
    }

    async function checkEmailExists(email) {
        try {
            if (!window.firebaseDB) {
                console.error('Firebase not initialized');
                return false;
            }
            
            const querySnapshot = await window.firebaseDB.collection('usuarios')
                .where('usuario', '==', email)
                .get();
            
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking email:', error);
            return false;
        }
    }

    async function checkDocumentExists(tipoDoc, numeroDoc) {
        try {
            if (!window.firebaseDB) {
                console.error('Firebase not initialized');
                return false;
            }
            
            const querySnapshot = await window.firebaseDB.collection('usuarios')
                .where('tipoDocumento', '==', tipoDoc)
                .where('numeroDocumento', '==', numeroDoc)
                .get();
            
            return !querySnapshot.empty;
        } catch (error) {
            console.error('Error checking document:', error);
            return false;
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

    // Handle form submission
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all fields
        const validations = [
            validateSeamosGeniosEmail(),
            validateRecoveryEmail(),
            validatePassword(),
            validateConfirmPassword(),
            validateName(),
            validatePhone(),
            validateInstitution(),
            validateDocumentNumber(),
            validateSelect('grado'),
            validateSelect('tipoDocumento'),
            validateSelect('departamento')
        ];
        
        const isTermsAccepted = inputs.terms.checked;
        
        if (!isTermsAccepted) {
            showMessage('Debes aceptar los términos y condiciones', 'error');
            return;
        }
        
        if (validations.includes(false)) {
            showMessage('Por favor corrige los errores en el formulario', 'error');
            return;
        }
        
        // Add loading state
        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        showMessage('Creando cuenta...', 'info');
        
        try {
            // Wait for Firebase to be ready
            await waitForFirebase();
            
            const formData = {
                email: inputs.email.value.trim(),
                emailRecuperacion: inputs.emailRecuperacion.value.trim(),
                password: inputs.password.value,
                nombre: inputs.nombre.value.trim(),
                telefono: inputs.telefono.value.trim(),
                institucion: inputs.institucion.value.trim(),
                grado: inputs.grado.value,
                tipoDocumento: inputs.tipoDocumento.value,
                numeroDocumento: inputs.numeroDocumento.value.trim(),
                departamento: inputs.departamento.value
            };
            
            // Check if email already exists
            const emailExists = await checkEmailExists(formData.email);
            if (emailExists) {
                throw new Error('El correo electrónico ya está registrado');
            }
            
            // Check if document already exists
            const documentExists = await checkDocumentExists(formData.tipoDocumento, formData.numeroDocumento);
            if (documentExists) {
                throw new Error('El documento ya está registrado');
            }
            
            // Generate recovery code
            const recoveryCode = generateRecoveryCode();
            
            // Save user data to Firestore - INACTIVE by default
            const userData = {
                email: formData.email,
                usuario: formData.email, // Usuario es el correo electrónico
                emailRecuperacion: formData.emailRecuperacion,
                password: formData.password, // En producción, deberías hashear la contraseña
                nombre: formData.nombre,
                telefono: formData.telefono,
                institucion: formData.institucion,
                grado: formData.grado,
                tipoDocumento: formData.tipoDocumento,
                numeroDocumento: formData.numeroDocumento,
                departamento: formData.departamento,
                tipoUsuario: 'estudiante', // Solo estudiantes
                codigoRecuperacion: recoveryCode, // CÓDIGO DE RECUPERACIÓN
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                activo: false // CUENTA INACTIVA POR DEFECTO
            };
            
            await window.firebaseDB.collection('usuarios').add(userData);
            
            showMessage(`¡Cuenta creada exitosamente! Tu código de recuperación es: ${recoveryCode}. Guárdalo en un lugar seguro. Tu cuenta está pendiente de activación. Redirigiendo...`, 'success');
            
            // Redirect after successful registration
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 3000);
            
        } catch (error) {
            console.error('Error creating account:', error);
            
            let errorMessage = error.message || 'Error al crear la cuenta';
            showMessage(errorMessage, 'error');
        } finally {
            // Remove loading state
            registerBtn.classList.remove('loading');
            registerBtn.disabled = false;
        }
    });
});