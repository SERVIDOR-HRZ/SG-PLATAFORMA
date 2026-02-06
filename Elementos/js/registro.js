// Registration functionality - Only Students, Firestore only
// ImgBB API Configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.querySelector('.register-btn');
    const messageDiv = document.getElementById('message');

    // Form validation - All new fields
    const inputs = {
        username: document.getElementById('username'),
        email: document.getElementById('email'),
        emailRecuperacion: document.getElementById('emailRecuperacion'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        primerNombre: document.getElementById('primerNombre'),
        segundoNombre: document.getElementById('segundoNombre'),
        primerApellido: document.getElementById('primerApellido'),
        segundoApellido: document.getElementById('segundoApellido'),
        telefono: document.getElementById('telefono'),
        institucion: document.getElementById('institucion'),
        grado: document.getElementById('grado'),
        tipoDocumento: document.getElementById('tipoDocumento'),
        numeroDocumento: document.getElementById('numeroDocumento'),
        departamento: document.getElementById('departamento'),
        aula: document.getElementById('aula')
    };

    // Update email field when username changes
    inputs.username.addEventListener('input', function () {
        let username = this.value.trim();

        // Convertir a minúsculas
        username = username.toLowerCase();

        // Si el usuario pega un correo completo, extraer solo la parte antes del @
        if (username.includes('@')) {
            username = username.split('@')[0];
        }

        // Actualizar el campo con el usuario en minúsculas
        this.value = username;

        inputs.email.value = username ? username + '@seamosgenios.com' : '';
    });

    // Add validation messages to all inputs except selects and hidden fields
    Object.keys(inputs).forEach(key => {
        if (inputs[key].tagName !== 'SELECT' && inputs[key].type !== 'hidden') {
            const validationMsg = document.createElement('div');
            validationMsg.className = 'validation-message';
            // Buscar el .input-group más cercano para agregar el mensaje
            const inputGroup = inputs[key].closest('.input-group');
            if (inputGroup) {
                inputGroup.appendChild(validationMsg);
            } else {
                inputs[key].parentNode.appendChild(validationMsg);
            }
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
        toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
        toggleBtn.setAttribute('aria-label', 'Mostrar contraseña');

        // Style the input group as relative
        inputGroup.style.position = 'relative';

        // Add click event
        toggleBtn.addEventListener('click', function () {
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

    // Add password toggles
    addPasswordToggle('password');
    addPasswordToggle('confirmPassword');

    // Track if user has interacted with fields
    const touched = {};

    // Real-time validation
    inputs.username.addEventListener('input', () => {
        touched.username = true;
        if (inputs.username.classList.contains('invalid') || inputs.username.classList.contains('valid')) {
            validateUsername();
        }
    });
    inputs.username.addEventListener('blur', () => {
        if (touched.username) validateUsername();
    });

    inputs.emailRecuperacion.addEventListener('input', () => touched.emailRecuperacion = true);
    inputs.emailRecuperacion.addEventListener('blur', () => {
        if (touched.emailRecuperacion) validateRecoveryEmail();
    });

    inputs.password.addEventListener('input', () => touched.password = true);
    inputs.password.addEventListener('blur', () => {
        if (touched.password) validatePassword();
    });

    inputs.confirmPassword.addEventListener('input', () => touched.confirmPassword = true);
    inputs.confirmPassword.addEventListener('blur', () => {
        if (touched.confirmPassword) validateConfirmPassword();
    });

    inputs.primerNombre.addEventListener('input', function () {
        touched.primerNombre = true;
        // Convertir automáticamente a mayúsculas mientras escribe
        const cursorPosition = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(cursorPosition, cursorPosition);
    });
    inputs.primerNombre.addEventListener('blur', () => {
        if (touched.primerNombre) validatePrimerNombre();
    });

    inputs.segundoNombre.addEventListener('input', function () {
        touched.segundoNombre = true;
        // Convertir automáticamente a mayúsculas mientras escribe
        const cursorPosition = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(cursorPosition, cursorPosition);
    });
    inputs.segundoNombre.addEventListener('blur', () => {
        if (touched.segundoNombre) validateSegundoNombre();
    });

    inputs.primerApellido.addEventListener('input', function () {
        touched.primerApellido = true;
        // Convertir automáticamente a mayúsculas mientras escribe
        const cursorPosition = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(cursorPosition, cursorPosition);
    });
    inputs.primerApellido.addEventListener('blur', () => {
        if (touched.primerApellido) validatePrimerApellido();
    });

    inputs.segundoApellido.addEventListener('input', function () {
        touched.segundoApellido = true;
        // Convertir automáticamente a mayúsculas mientras escribe
        const cursorPosition = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(cursorPosition, cursorPosition);
    });
    inputs.segundoApellido.addEventListener('blur', () => {
        if (touched.segundoApellido) validateSegundoApellido();
    });

    inputs.telefono.addEventListener('input', () => touched.telefono = true);
    inputs.telefono.addEventListener('blur', () => {
        if (touched.telefono) validatePhone();
    });

    inputs.institucion.addEventListener('input', () => touched.institucion = true);
    inputs.institucion.addEventListener('change', () => {
        touched.institucion = true;
        validateInstitution();
    });
    inputs.institucion.addEventListener('blur', () => {
        if (touched.institucion) validateInstitution();
    });

    inputs.numeroDocumento.addEventListener('input', () => touched.numeroDocumento = true);
    inputs.numeroDocumento.addEventListener('blur', () => {
        if (touched.numeroDocumento) validateDocumentNumber();
    });

    inputs.grado.addEventListener('change', () => validateSelect('grado'));
    inputs.tipoDocumento.addEventListener('change', () => validateSelect('tipoDocumento'));
    inputs.departamento.addEventListener('change', () => validateSelect('departamento'));
    inputs.aula.addEventListener('change', () => validateSelect('aula'));

    // Validación para método de pago
    const metodoPagoInput = document.getElementById('metodoPagoEstudiante');
    if (metodoPagoInput) {
        // No necesitamos evento change porque se maneja con clicks en las tarjetas
    }

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

    function validateUsername() {
        let username = inputs.username.value.trim();
        const validationMsg = inputs.username.closest('.input-group').querySelector('.validation-message');

        // Si el usuario contiene @, extraer solo la parte antes del @ (por si acaso)
        if (username.includes('@')) {
            username = username.split('@')[0];
            inputs.username.value = username;
        }

        // Username validation (alphanumeric, dots, underscores, hyphens)
        const usernameRegex = /^[a-zA-Z0-9._-]+$/;

        if (username.length === 0) {
            inputs.username.classList.add('invalid');
            inputs.username.classList.remove('valid');
            validationMsg.textContent = 'El usuario es requerido';
            validationMsg.classList.add('show');
            return false;
        }

        if (username.length < 3) {
            inputs.username.classList.add('invalid');
            inputs.username.classList.remove('valid');
            validationMsg.textContent = 'El usuario debe tener al menos 3 caracteres';
            validationMsg.classList.add('show');
            return false;
        }

        if (!usernameRegex.test(username)) {
            inputs.username.classList.add('invalid');
            inputs.username.classList.remove('valid');
            validationMsg.textContent = 'Solo letras, números, puntos, guiones y guiones bajos';
            validationMsg.classList.add('show');
            return false;
        }

        inputs.username.classList.add('valid');
        inputs.username.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateRecoveryEmail() {
        const email = inputs.emailRecuperacion.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const validationMsg = inputs.emailRecuperacion.closest('.input-group').querySelector('.validation-message');

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
        const validationMsg = inputs.password.closest('.input-group').querySelector('.validation-message');

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
        const validationMsg = inputs.confirmPassword.closest('.input-group').querySelector('.validation-message');

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

    function validatePrimerNombre() {
        const nombre = inputs.primerNombre.value.trim();
        const validationMsg = inputs.primerNombre.closest('.input-group').querySelector('.validation-message');

        if (nombre.length < 2) {
            inputs.primerNombre.classList.add('invalid');
            inputs.primerNombre.classList.remove('valid');
            validationMsg.textContent = 'El primer nombre debe tener al menos 2 caracteres';
            validationMsg.classList.add('show');
            return false;
        }

        inputs.primerNombre.classList.add('valid');
        inputs.primerNombre.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateSegundoNombre() {
        const nombre = inputs.segundoNombre.value.trim();
        const validationMsg = inputs.segundoNombre.closest('.input-group').querySelector('.validation-message');

        // El segundo nombre es opcional, pero si se ingresa debe ser válido
        if (nombre.length > 0 && nombre.length < 2) {
            inputs.segundoNombre.classList.add('invalid');
            inputs.segundoNombre.classList.remove('valid');
            validationMsg.textContent = 'El segundo nombre debe tener al menos 2 caracteres';
            validationMsg.classList.add('show');
            return false;
        }

        if (nombre.length > 0) {
            inputs.segundoNombre.classList.add('valid');
            inputs.segundoNombre.classList.remove('invalid');
        } else {
            inputs.segundoNombre.classList.remove('valid', 'invalid');
        }
        validationMsg.classList.remove('show');
        return true;
    }

    function validatePrimerApellido() {
        const apellido = inputs.primerApellido.value.trim();
        const validationMsg = inputs.primerApellido.closest('.input-group').querySelector('.validation-message');

        if (apellido.length < 2) {
            inputs.primerApellido.classList.add('invalid');
            inputs.primerApellido.classList.remove('valid');
            validationMsg.textContent = 'El primer apellido debe tener al menos 2 caracteres';
            validationMsg.classList.add('show');
            return false;
        }

        inputs.primerApellido.classList.add('valid');
        inputs.primerApellido.classList.remove('invalid');
        validationMsg.classList.remove('show');
        return true;
    }

    function validateSegundoApellido() {
        const apellido = inputs.segundoApellido.value.trim();
        const validationMsg = inputs.segundoApellido.closest('.input-group').querySelector('.validation-message');

        // El segundo apellido es opcional, pero si se ingresa debe ser válido
        if (apellido.length > 0 && apellido.length < 2) {
            inputs.segundoApellido.classList.add('invalid');
            inputs.segundoApellido.classList.remove('valid');
            validationMsg.textContent = 'El segundo apellido debe tener al menos 2 caracteres';
            validationMsg.classList.add('show');
            return false;
        }

        if (apellido.length > 0) {
            inputs.segundoApellido.classList.add('valid');
            inputs.segundoApellido.classList.remove('invalid');
        } else {
            inputs.segundoApellido.classList.remove('valid', 'invalid');
        }
        validationMsg.classList.remove('show');
        return true;
    }

    function validatePhone() {
        const phone = inputs.telefono.value.trim();
        const phoneRegex = /^[0-9]{7,15}$/; // Permitir entre 7 y 15 dígitos
        const validationMsg = inputs.telefono.closest('.input-group').querySelector('.validation-message');

        if (!phoneRegex.test(phone)) {
            inputs.telefono.classList.add('invalid');
            inputs.telefono.classList.remove('valid');
            validationMsg.textContent = 'Ingresa un teléfono válido (7-15 dígitos)';
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
        const institucionSelector = document.getElementById('institucionSelector');

        if (!institution || institution.length < 2) {
            if (institucionSelector) {
                institucionSelector.classList.add('invalid');
                institucionSelector.classList.remove('valid');
            }
            return false;
        }

        if (institucionSelector) {
            institucionSelector.classList.add('valid');
            institucionSelector.classList.remove('invalid');
        }
        return true;
    }

    function validateDocumentNumber() {
        const docNumber = inputs.numeroDocumento.value.trim();
        const validationMsg = inputs.numeroDocumento.closest('.input-group').querySelector('.validation-message');

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
        // Para método de pago, validar el input oculto
        if (fieldName === 'metodoPagoEstudiante') {
            const metodoPagoInput = document.getElementById('metodoPagoEstudiante');
            if (!metodoPagoInput || !metodoPagoInput.value) {
                return false;
            }
            return true;
        }

        const select = inputs[fieldName];
        if (!select) return false;
        
        const value = select.value;

        // Para departamento, validar el selector personalizado
        if (fieldName === 'departamento') {
            const departamentoSelector = document.getElementById('departamentoSelector');
            if (!value || value === '') {
                if (departamentoSelector) {
                    departamentoSelector.classList.add('invalid');
                    departamentoSelector.classList.remove('valid');
                }
                return false;
            }
            if (departamentoSelector) {
                departamentoSelector.classList.add('valid');
                departamentoSelector.classList.remove('invalid');
            }
            return true;
        }

        // Para otros selects normales
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
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate all fields including payment method
        const validations = [
            validateUsername(),
            validateRecoveryEmail(),
            validatePassword(),
            validateConfirmPassword(),
            validatePrimerNombre(),
            validateSegundoNombre(),
            validatePrimerApellido(),
            validateSegundoApellido(),
            validatePhone(),
            validateInstitution(),
            validateDocumentNumber(),
            validateSelect('grado'),
            validateSelect('tipoDocumento'),
            validateSelect('departamento'),
            validateSelect('aula'),
            validateSelect('metodoPagoEstudiante')
        ];

        if (validations.includes(false)) {
            showMessage('Por favor corrige los errores en el formulario', 'error');
            return;
        }

        // Validar que haya un comprobante seleccionado
        if (!selectedComprobanteFile) {
            showMessage('Por favor selecciona un comprobante de pago', 'error');
            return;
        }

        // Add loading state
        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        showMessage('Subiendo comprobante y creando cuenta...', 'info');

        try {
            // Wait for Firebase to be ready
            await waitForFirebase();

            // SUBIR COMPROBANTE A IMGBB PRIMERO
            let comprobanteUrl = null;
            try {
                showMessage('Subiendo comprobante de pago...', 'info');
                comprobanteUrl = await uploadImageToImgBB(selectedComprobanteFile);
                console.log('Comprobante subido exitosamente:', comprobanteUrl);
            } catch (uploadError) {
                console.error('Error al subir comprobante:', uploadError);
                throw new Error('Error al subir el comprobante de pago. Por favor intenta de nuevo.');
            }

            showMessage('Creando cuenta...', 'info');

            // Obtener teléfono completo con código de país
            const telefonoCompletoInput = document.getElementById('telefonoCompleto');
            const telefonoCompleto = telefonoCompletoInput ? telefonoCompletoInput.value : inputs.telefono.value.trim();

            // Construir nombre completo
            const nombreCompleto = [
                inputs.primerNombre.value.trim().toUpperCase(),
                inputs.segundoNombre.value.trim().toUpperCase(),
                inputs.primerApellido.value.trim().toUpperCase(),
                inputs.segundoApellido.value.trim().toUpperCase()
            ].filter(part => part.length > 0).join(' ');

            const formData = {
                email: inputs.email.value.trim(),
                emailRecuperacion: inputs.emailRecuperacion.value.trim(),
                password: inputs.password.value,
                primerNombre: inputs.primerNombre.value.trim().toUpperCase(),
                segundoNombre: inputs.segundoNombre.value.trim().toUpperCase(),
                primerApellido: inputs.primerApellido.value.trim().toUpperCase(),
                segundoApellido: inputs.segundoApellido.value.trim().toUpperCase(),
                nombreCompleto: nombreCompleto,
                telefono: telefonoCompleto, // Guardar teléfono con código de país
                institucion: inputs.institucion.value.trim(),
                grado: inputs.grado.value,
                tipoDocumento: inputs.tipoDocumento.value,
                numeroDocumento: inputs.numeroDocumento.value.trim(),
                departamento: inputs.departamento.value,
                aula: inputs.aula.value
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
                primerNombre: formData.primerNombre,
                segundoNombre: formData.segundoNombre,
                primerApellido: formData.primerApellido,
                segundoApellido: formData.segundoApellido,
                nombre: formData.nombreCompleto, // Nombre completo concatenado
                telefono: formData.telefono,
                institucion: formData.institucion,
                grado: formData.grado,
                tipoDocumento: formData.tipoDocumento,
                numeroDocumento: formData.numeroDocumento,
                departamento: formData.departamento,
                aulasAsignadas: [formData.aula], // Guardar aula como array
                tipoUsuario: 'estudiante', // Solo estudiantes
                codigoRecuperacion: recoveryCode, // CÓDIGO DE RECUPERACIÓN
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                activo: false, // CUENTA INACTIVA POR DEFECTO
                // Información de pago
                metodoPago: document.getElementById('metodoPagoEstudiante').value,
                metodoPagoId: document.getElementById('metodoPagoId').value,
                pagoInicial: aulaSeleccionadaData ? (aulaSeleccionadaData.cuotaInicial || aulaSeleccionadaData.pagoInicial || 0) : 0,
                valorTotal: aulaSeleccionadaData ? (aulaSeleccionadaData.precioTotal || aulaSeleccionadaData.valorTotal || aulaSeleccionadaData.precio || 0) : 0,
                numeroCuotas: aulaSeleccionadaData ? (aulaSeleccionadaData.numeroCuotas || 0) : 0,
                estadoPago: 'pendiente', // Estado inicial del pago
                comprobanteUrl: comprobanteUrl // URL del comprobante subido a ImgBB
            };

            await window.firebaseDB.collection('usuarios').add(userData);

            // Generar y descargar imagen con credenciales
            await generateCredentialsImage(formData.email, formData.password, recoveryCode, formData.nombreCompleto);

            showMessage(`¡Cuenta creada exitosamente! Se ha descargado una imagen con tus credenciales. Tu cuenta está pendiente de activación. Redirigiendo...`, 'success');

            // Redirect after successful registration
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 5000);

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

    // ========== GESTIÓN DE SECCIONES DE REGISTRO ==========

    // Variables globales para la información del aula
    let aulaSeleccionadaData = null;

    // Botón continuar a pago
    const btnContinuarPago = document.getElementById('btnContinuarPago');
    if (btnContinuarPago) {
        btnContinuarPago.addEventListener('click', function() {
            // Validar todos los campos de la sección de datos
            const validations = [
                validateUsername(),
                validateRecoveryEmail(),
                validatePassword(),
                validateConfirmPassword(),
                validatePrimerNombre(),
                validateSegundoNombre(),
                validatePrimerApellido(),
                validateSegundoApellido(),
                validatePhone(),
                validateInstitution(),
                validateDocumentNumber(),
                validateSelect('grado'),
                validateSelect('tipoDocumento'),
                validateSelect('departamento'),
                validateSelect('aula')
            ];

            if (validations.includes(false)) {
                showMessage('Por favor corrige los errores en el formulario', 'error');
                return;
            }

            // Obtener el aula seleccionada
            const aulaId = inputs.aula.value;
            if (!aulaId) {
                showMessage('Por favor selecciona un calendario', 'error');
                return;
            }

            // Cargar información del aula
            cargarInformacionAula(aulaId);
        });
    }

    // Botón volver a datos
    const btnVolverDatos = document.getElementById('btnVolverDatos');
    if (btnVolverDatos) {
        btnVolverDatos.addEventListener('click', function() {
            const seccionDatos = document.getElementById('seccionDatos');
            const seccionPago = document.getElementById('seccionPago');
            
            if (seccionPago) seccionPago.style.display = 'none';
            if (seccionDatos) seccionDatos.style.display = 'block';
            
            // Scroll to top para ver la sección de datos
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Botón continuar a comprobante
    const btnContinuarComprobante = document.getElementById('btnContinuarComprobante');
    if (btnContinuarComprobante) {
        btnContinuarComprobante.addEventListener('click', function() {
            // Validar que se haya seleccionado un método de pago
            const metodoPagoInput = document.getElementById('metodoPagoEstudiante');
            if (!metodoPagoInput || !metodoPagoInput.value) {
                showMessage('Por favor selecciona un método de pago', 'error');
                return;
            }

            // Cargar información en la sección de comprobante
            mostrarSeccionComprobante();
        });
    }

    // Botón volver a método de pago
    const btnVolverMetodo = document.getElementById('btnVolverMetodo');
    if (btnVolverMetodo) {
        btnVolverMetodo.addEventListener('click', function() {
            const seccionPago = document.getElementById('seccionPago');
            const seccionComprobante = document.getElementById('seccionComprobante');
            
            if (seccionComprobante) seccionComprobante.style.display = 'none';
            if (seccionPago) seccionPago.style.display = 'block';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // Manejo de subida de comprobante
    const uploadArea = document.getElementById('uploadArea');
    const comprobanteInput = document.getElementById('comprobanteInput');
    const btnRemoveComprobante = document.getElementById('btnRemoveComprobante');
    let selectedComprobanteFile = null;

    if (uploadArea && comprobanteInput) {
        // Click en el área de subida
        uploadArea.addEventListener('click', () => comprobanteInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) handleComprobanteSelect(file);
        });

        // Selección de archivo
        comprobanteInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleComprobanteSelect(file);
        });
    }

    if (btnRemoveComprobante) {
        btnRemoveComprobante.addEventListener('click', removeComprobante);
    }

    // Función para manejar selección de comprobante
    function handleComprobanteSelect(file) {
        // Validar tipo de archivo
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            showMessage('Por favor selecciona un archivo PNG, JPG o PDF', 'error');
            return;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('El archivo no debe superar los 5MB', 'error');
            return;
        }

        selectedComprobanteFile = file;

        // Mostrar preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const comprobantePreview = document.getElementById('comprobantePreview');
            const comprobanteImg = document.getElementById('comprobanteImg');
            const uploadArea = document.getElementById('uploadArea');
            
            if (comprobanteImg && comprobantePreview && uploadArea) {
                comprobanteImg.src = e.target.result;
                comprobantePreview.style.display = 'block';
                uploadArea.style.display = 'none';
            }
        };
        reader.readAsDataURL(file);
    }

    // Función para remover comprobante
    function removeComprobante() {
        selectedComprobanteFile = null;
        const comprobantePreview = document.getElementById('comprobantePreview');
        const uploadArea = document.getElementById('uploadArea');
        const comprobanteInput = document.getElementById('comprobanteInput');
        
        if (comprobantePreview) comprobantePreview.style.display = 'none';
        if (uploadArea) uploadArea.style.display = 'flex';
        if (comprobanteInput) comprobanteInput.value = '';
    }

    // Función para mostrar sección de comprobante
    async function mostrarSeccionComprobante() {
        try {
            // Obtener datos del método de pago seleccionado
            const metodoPagoId = document.getElementById('metodoPagoId').value;
            
            if (!metodoPagoId) {
                showMessage('Error: No se encontró el método de pago seleccionado', 'error');
                return;
            }

            await waitForFirebase();

            // Obtener datos completos del método de pago desde Firebase
            const metodoDoc = await window.firebaseDB.collection('metodosPago').doc(metodoPagoId).get();
            
            if (!metodoDoc.exists) {
                showMessage('Error al cargar información del método de pago', 'error');
                return;
            }

            const metodoData = metodoDoc.data();

            // Mostrar información en la sección de comprobante
            document.getElementById('pagoInicialComprobante').textContent = document.getElementById('pagoInicial').textContent;
            document.getElementById('aulaComprobante').textContent = document.getElementById('aulaSeleccionadaNombre').textContent;
            document.getElementById('metodoPagoImagen').src = metodoData.imagen;
            document.getElementById('metodoPagoNombre').textContent = metodoData.nombre;
            document.getElementById('metodoPagoCuenta').textContent = metodoData.numeroCuenta || 'No disponible';

            // Cambiar a la sección de comprobante
            const seccionPago = document.getElementById('seccionPago');
            const seccionComprobante = document.getElementById('seccionComprobante');
            
            if (seccionPago) seccionPago.style.display = 'none';
            if (seccionComprobante) seccionComprobante.style.display = 'block';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error loading payment method info:', error);
            showMessage('Error al cargar información del método de pago', 'error');
        }
    }

    // Cargar información del aula seleccionada
    async function cargarInformacionAula(aulaId) {
        try {
            await waitForFirebase();

            // Buscar el aula en el array de aulas cargadas
            const aulaData = aulas.find(a => a.id === aulaId);
            
            if (!aulaData) {
                showMessage('No se pudo cargar la información del calendario', 'error');
                return;
            }

            // Obtener datos completos del aula desde Firebase
            const aulaDoc = await window.firebaseDB.collection('aulas').doc(aulaId).get();
            
            if (!aulaDoc.exists) {
                showMessage('El calendario seleccionado no existe', 'error');
                return;
            }

            const aulaCompleta = aulaDoc.data();
            aulaSeleccionadaData = {
                id: aulaId,
                ...aulaCompleta
            };

            console.log('Datos del aula cargada:', aulaSeleccionadaData);

            // Mostrar información en la sección de pago
            document.getElementById('aulaSeleccionadaNombre').textContent = aulaCompleta.nombre || 'Sin nombre';
            
            // Obtener valores con diferentes nombres de campo posibles
            const valorTotal = aulaCompleta.precioTotal || aulaCompleta.valorTotal || aulaCompleta.precio || aulaCompleta.valor || 0;
            const pagoInicial = aulaCompleta.cuotaInicial || aulaCompleta.pagoInicial || aulaCompleta.inicial || 0;
            const numeroCuotas = aulaCompleta.numeroCuotas || aulaCompleta.cuotas || 0;
            const valorCuota = numeroCuotas > 0 ? Math.ceil((valorTotal - pagoInicial) / numeroCuotas) : 0;

            console.log('Datos del aula completa:', aulaCompleta);
            console.log('Valores calculados:', { valorTotal, pagoInicial, numeroCuotas, valorCuota });

            document.getElementById('valorTotal').textContent = formatCurrency(valorTotal);
            document.getElementById('pagoInicial').textContent = formatCurrency(pagoInicial);
            document.getElementById('numeroCuotas').textContent = numeroCuotas;
            document.getElementById('valorCuota').textContent = formatCurrency(valorCuota);

            // Cargar métodos de pago disponibles
            await cargarMetodosPago();

            // Cambiar a la sección de pago - OCULTAR datos y MOSTRAR pago
            const seccionDatos = document.getElementById('seccionDatos');
            const seccionPago = document.getElementById('seccionPago');
            
            if (seccionDatos) seccionDatos.style.display = 'none';
            if (seccionPago) seccionPago.style.display = 'block';

            // Scroll to top para ver la sección de pago
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (error) {
            console.error('Error loading aula information:', error);
            showMessage('Error al cargar la información del calendario', 'error');
        }
    }

    // Cargar métodos de pago desde Firebase
    async function cargarMetodosPago() {
        try {
            await waitForFirebase();

            const metodosPagoGrid = document.getElementById('metodosPagoGrid');
            if (!metodosPagoGrid) return;

            // Mostrar loading
            metodosPagoGrid.innerHTML = '<div class="metodos-loading"><i class="bi bi-arrow-clockwise"></i><br>Cargando métodos de pago...</div>';

            // Obtener TODOS los métodos de pago desde Firebase (sin orderBy para evitar necesitar índice)
            const snapshot = await window.firebaseDB
                .collection('metodosPago')
                .get();

            if (snapshot.empty) {
                metodosPagoGrid.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center;">No hay métodos de pago disponibles</p>';
                return;
            }

            // Limpiar el grid
            metodosPagoGrid.innerHTML = '';

            // Filtrar y renderizar solo los métodos activos
            let metodosCargados = 0;
            snapshot.forEach(doc => {
                const metodo = doc.data();
                
                // Solo mostrar métodos activos
                if (metodo.activo !== true) return;
                
                metodosCargados++;
                
                const metodoItem = document.createElement('div');
                metodoItem.className = 'metodo-pago-item';
                metodoItem.setAttribute('data-metodo-id', doc.id);
                metodoItem.setAttribute('data-metodo-nombre', metodo.nombre);
                metodoItem.setAttribute('data-metodo-cuenta', metodo.numeroCuenta || '');
                metodoItem.setAttribute('data-metodo-imagen', metodo.imagen || '');

                metodoItem.innerHTML = `
                    <img src="${metodo.imagen}" alt="${metodo.nombre}" class="metodo-pago-logo" onerror="this.src='../Elementos/img/logo1.png'">
                    <div class="metodo-pago-nombre">${metodo.nombre}</div>
                `;

                // Agregar evento de clic
                metodoItem.addEventListener('click', function() {
                    seleccionarMetodoPago(this);
                });

                metodosPagoGrid.appendChild(metodoItem);
            });

            // Si no hay métodos activos
            if (metodosCargados === 0) {
                metodosPagoGrid.innerHTML = '<p style="color: rgba(255,255,255,0.7); text-align: center;">No hay métodos de pago activos disponibles</p>';
            }

        } catch (error) {
            console.error('Error loading payment methods:', error);
            const metodosPagoGrid = document.getElementById('metodosPagoGrid');
            if (metodosPagoGrid) {
                metodosPagoGrid.innerHTML = '<p style="color: #ff4444; text-align: center;">Error al cargar métodos de pago: ' + error.message + '</p>';
            }
        }
    }

    // Seleccionar método de pago
    let metodoPagoSeleccionadoData = null;

    function seleccionarMetodoPago(elemento) {
        // Remover selección de todos los métodos
        document.querySelectorAll('.metodo-pago-item').forEach(item => {
            item.classList.remove('selected');
        });

        // Marcar el método seleccionado
        elemento.classList.add('selected');

        // Guardar el método seleccionado en el input oculto
        const metodoPagoInput = document.getElementById('metodoPagoEstudiante');
        const metodoPagoIdInput = document.getElementById('metodoPagoId');
        const metodoNombre = elemento.getAttribute('data-metodo-nombre');
        const metodoId = elemento.getAttribute('data-metodo-id');
        
        if (metodoPagoInput) {
            metodoPagoInput.value = metodoNombre;
        }
        
        if (metodoPagoIdInput) {
            metodoPagoIdInput.value = metodoId;
        }

        // Guardar datos completos del método para la siguiente sección
        metodoPagoSeleccionadoData = {
            id: metodoId,
            nombre: metodoNombre,
            imagen: elemento.querySelector('.metodo-pago-logo').src,
            cuenta: elemento.querySelector('.metodo-pago-cuenta') ? elemento.querySelector('.metodo-pago-cuenta').textContent : ''
        };
    }

    // Función para formatear moneda
    function formatCurrency(value) {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }
});


// Country selector functionality
const countries = [
    { name: 'Colombia', code: '+57', flag: 'CO', emoji: '\uD83C\uDDE8\uD83C\uDDF4' },
    { name: 'Mexico', code: '+52', flag: 'MX', emoji: '\uD83C\uDDF2\uD83C\uDDFD' },
    { name: 'Peru', code: '+51', flag: 'PE', emoji: '\uD83C\uDDF5\uD83C\uDDEA' },
    { name: 'Argentina', code: '+54', flag: 'AR', emoji: '\uD83C\uDDE6\uD83C\uDDF7' },
    { name: 'Chile', code: '+56', flag: 'CL', emoji: '\uD83C\uDDE8\uD83C\uDDF1' },
    { name: 'Ecuador', code: '+593', flag: 'EC', emoji: '\uD83C\uDDEA\uD83C\uDDE8' },
    { name: 'Venezuela', code: '+58', flag: 'VE', emoji: '\uD83C\uDDFB\uD83C\uDDEA' },
    { name: 'Bolivia', code: '+591', flag: 'BO', emoji: '\uD83C\uDDE7\uD83C\uDDF4' },
    { name: 'Paraguay', code: '+595', flag: 'PY', emoji: '\uD83C\uDDF5\uD83C\uDDFE' },
    { name: 'Uruguay', code: '+598', flag: 'UY', emoji: '\uD83C\uDDFA\uD83C\uDDFE' },
    { name: 'Costa Rica', code: '+506', flag: 'CR', emoji: '\uD83C\uDDE8\uD83C\uDDF7' },
    { name: 'Panama', code: '+507', flag: 'PA', emoji: '\uD83C\uDDF5\uD83C\uDDE6' },
    { name: 'Guatemala', code: '+502', flag: 'GT', emoji: '\uD83C\uDDEC\uD83C\uDDF9' },
    { name: 'Honduras', code: '+504', flag: 'HN', emoji: '\uD83C\uDDED\uD83C\uDDF3' },
    { name: 'El Salvador', code: '+503', flag: 'SV', emoji: '\uD83C\uDDF8\uD83C\uDDFB' },
    { name: 'Nicaragua', code: '+505', flag: 'NI', emoji: '\uD83C\uDDF3\uD83C\uDDEE' },
    { name: 'Republica Dominicana', code: '+1', flag: 'DO', emoji: '\uD83C\uDDE9\uD83C\uDDF4' },
    { name: 'Cuba', code: '+53', flag: 'CU', emoji: '\uD83C\uDDE8\uD83C\uDDFA' },
    { name: 'Puerto Rico', code: '+1', flag: 'PR', emoji: '\uD83C\uDDF5\uD83C\uDDF7' },
    { name: 'Espana', code: '+34', flag: 'ES', emoji: '\uD83C\uDDEA\uD83C\uDDF8' },
    { name: 'Estados Unidos', code: '+1', flag: 'US', emoji: '\uD83C\uDDFA\uD83C\uDDF8' },
    { name: 'Brasil', code: '+55', flag: 'BR', emoji: '\uD83C\uDDE7\uD83C\uDDF7' }
];

function initCountrySelector() {
    const countrySelector = document.getElementById('countrySelector');
    const countryDropdown = document.getElementById('countryDropdown');
    const countryList = document.getElementById('countryList');
    const countrySearch = document.getElementById('countrySearch');
    const codigoPaisInput = document.getElementById('codigoPais');
    const telefonoInput = document.getElementById('telefono');
    const telefonoCompletoInput = document.getElementById('telefonoCompleto');

    // Renderizar lista de países
    function renderCountries(filter = '') {
        const filteredCountries = countries.filter(country =>
            country.name.toLowerCase().includes(filter.toLowerCase()) ||
            country.code.includes(filter)
        );

        countryList.innerHTML = filteredCountries.map(country => `
            <div class="country-item" data-code="${country.code}" data-flag="${country.flag}" data-emoji="${country.emoji}" data-name="${country.name}">
                <img src="https://flagcdn.com/w40/${country.flag.toLowerCase()}.png" alt="${country.name}" class="flag-img">
                <div class="country-info">
                    <span class="country-name">${country.name}</span>
                    <span class="country-code">${country.code}</span>
                </div>
            </div>
        `).join('');

        // Agregar event listeners a los items
        document.querySelectorAll('.country-item').forEach(item => {
            item.addEventListener('click', function () {
                selectCountry(
                    this.dataset.code,
                    this.dataset.emoji,
                    this.dataset.name
                );
            });
        });
    }

    // Seleccionar país
    function selectCountry(code, emoji, name) {
        const flagElement = countrySelector.querySelector('.flag-emoji');
        // Buscar el país para obtener su código de bandera
        const country = countries.find(c => c.code === code);
        if (country) {
            flagElement.innerHTML = `<img src="https://flagcdn.com/w40/${country.flag.toLowerCase()}.png" alt="${country.name}" class="flag-img">`;
        }
        countrySelector.querySelector('.country-code').textContent = code;
        codigoPaisInput.value = code;

        // Actualizar teléfono completo
        updateFullPhone();

        // Cerrar dropdown
        closeDropdown();
    }

    // Actualizar teléfono completo
    function updateFullPhone() {
        const codigo = codigoPaisInput.value;
        const numero = telefonoInput.value.trim();
        telefonoCompletoInput.value = numero ? `${codigo}${numero}` : '';
    }

    // Abrir/cerrar dropdown
    function toggleDropdown() {
        const isOpen = countryDropdown.style.display === 'block';
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function openDropdown() {
        countryDropdown.style.display = 'block';
        countrySelector.classList.add('active');
        countrySearch.value = '';
        renderCountries();
        countrySearch.focus();
    }

    function closeDropdown() {
        countryDropdown.style.display = 'none';
        countrySelector.classList.remove('active');
    }

    // Event listeners
    countrySelector.addEventListener('click', toggleDropdown);

    countrySearch.addEventListener('input', function () {
        renderCountries(this.value);
    });

    telefonoInput.addEventListener('input', updateFullPhone);

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (!countrySelector.contains(e.target) && !countryDropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    // Inicializar
    renderCountries();
    updateFullPhone();
}

// Inicializar selector de país cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCountrySelector);
} else {
    initCountrySelector();
}


// Departamento selector functionality
const departamentos = [
    'Amazonas',
    'Antioquia',
    'Arauca',
    'Atlántico',
    'Bogotá D.C.',
    'Bolívar',
    'Boyacá',
    'Caldas',
    'Caquetá',
    'Casanare',
    'Cauca',
    'Cesar',
    'Chocó',
    'Córdoba',
    'Cundinamarca',
    'Guainía',
    'Guaviare',
    'Huila',
    'La Guajira',
    'Magdalena',
    'Meta',
    'Nariño',
    'Norte de Santander',
    'Putumayo',
    'Quindío',
    'Risaralda',
    'San Andrés y Providencia',
    'Santander',
    'Sucre',
    'Tolima',
    'Valle del Cauca',
    'Vaupés',
    'Vichada'
];

function initDepartamentoSelector() {
    const departamentoSelector = document.getElementById('departamentoSelector');
    const departamentoDropdown = document.getElementById('departamentoDropdown');
    const departamentoList = document.getElementById('departamentoList');
    const departamentoSearch = document.getElementById('departamentoSearch');
    const departamentoInput = document.getElementById('departamento');

    if (!departamentoSelector) return;

    // Función para quitar acentos
    function removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // Renderizar lista de departamentos
    function renderDepartamentos(filter = '') {
        const filteredDepartamentos = departamentos.filter(depto =>
            removeAccents(depto.toLowerCase()).includes(removeAccents(filter.toLowerCase()))
        );

        departamentoList.innerHTML = filteredDepartamentos.map(depto => `
            <div class="departamento-item" data-value="${depto}">
                ${depto}
            </div>
        `).join('');

        // Agregar event listeners a los items
        document.querySelectorAll('.departamento-item').forEach(item => {
            item.addEventListener('click', function () {
                selectDepartamento(this.dataset.value);
            });
        });
    }

    // Seleccionar departamento
    function selectDepartamento(value) {
        const textElement = departamentoSelector.querySelector('.departamento-text');
        textElement.textContent = value;
        textElement.classList.add('selected');
        departamentoInput.value = value;

        // Disparar evento change para validación
        const event = new Event('change', { bubbles: true });
        departamentoInput.dispatchEvent(event);

        // Marcar como válido
        departamentoSelector.classList.add('valid');
        departamentoSelector.classList.remove('invalid');

        // Cerrar dropdown
        closeDropdown();
    }

    // Abrir/cerrar dropdown
    function toggleDropdown() {
        const isOpen = departamentoDropdown.style.display === 'block';
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }

    function openDropdown() {
        departamentoDropdown.style.display = 'block';
        departamentoSelector.classList.add('active');
        departamentoSearch.value = '';
        renderDepartamentos();
        departamentoSearch.focus();
    }

    function closeDropdown() {
        departamentoDropdown.style.display = 'none';
        departamentoSelector.classList.remove('active');
    }

    // Event listeners
    departamentoSelector.addEventListener('click', toggleDropdown);

    departamentoSearch.addEventListener('input', function () {
        renderDepartamentos(this.value);
    });

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (!departamentoSelector.contains(e.target) && !departamentoDropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    // Inicializar
    renderDepartamentos();
}

// Inicializar selector de departamento cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDepartamentoSelector);
} else {
    initDepartamentoSelector();
}


// Institucion selector functionality
let instituciones = [];

// Load instituciones from Firebase
async function loadInstitucionesFromFirebase() {
    try {
        // Wait for Firebase to be ready
        const checkFirebase = () => {
            return new Promise((resolve) => {
                const check = () => {
                    if (window.firebaseDB) {
                        resolve();
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        };

        await checkFirebase();

        const snapshot = await window.firebaseDB.collection('instituciones').orderBy('nombre').get();
        instituciones = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            instituciones.push({
                name: data.nombre,
                fullName: data.descripcion || data.nombre,
                logo: data.logoUrl || '../Elementos/img/logo1.png'
            });
        });

        // If no instituciones in Firebase, use defaults
        if (instituciones.length === 0) {
            instituciones = [
                {
                    name: 'IETAC',
                    fullName: 'Institución Educativa Técnico Agropecuario Claret Tierradentro Córdoba',
                    logo: '../Elementos/img/logo1.png'
                },
                {
                    name: 'SEAMOSGENIOS',
                    fullName: 'Seamos Genios - Plataforma Educativa',
                    logo: '../Elementos/img/logo1.png'
                }
            ];
        }

        // Re-render the list
        renderInstitucionesList();

    } catch (error) {
        console.error('Error loading instituciones from Firebase:', error);
        // Use defaults on error
        instituciones = [
            {
                name: 'IETAC',
                fullName: 'Institución Educativa Técnico Agropecuario Claret Tierradentro Córdoba',
                logo: '../Elementos/img/logo1.png'
            },
            {
                name: 'SEAMOSGENIOS',
                fullName: 'Seamos Genios - Plataforma Educativa',
                logo: '../Elementos/img/logo1.png'
            }
        ];
        renderInstitucionesList();
    }
}

// Global variables for institucion selector
let institucionSelectorEl = null;
let institucionDropdownEl = null;
let institucionInputEl = null;

// Render instituciones list
function renderInstitucionesList() {
    const institucionList = document.getElementById('institucionList');
    if (!institucionList) return;

    institucionList.innerHTML = instituciones.map(inst => `
        <div class="institucion-item" data-value="${inst.name}">
            <img src="${inst.logo}" alt="${inst.name}" class="institucion-logo" onerror="this.src='../Elementos/img/logo1.png'">
            <div class="institucion-info">
                <div class="institucion-name">${inst.name}</div>
                <div class="institucion-description">${inst.fullName}</div>
            </div>
        </div>
    `).join('');

    // Add event listeners to items
    document.querySelectorAll('.institucion-item').forEach(item => {
        item.addEventListener('click', function () {
            selectInstitucionValue(this.dataset.value);
        });
    });
}

// Select institucion value
function selectInstitucionValue(value) {
    if (!institucionSelectorEl || !institucionInputEl) return;

    const textElement = institucionSelectorEl.querySelector('.institucion-text');
    if (textElement) {
        textElement.textContent = value;
        textElement.classList.add('selected');
    }
    institucionInputEl.value = value;

    // Trigger change event for validation
    const event = new Event('change', { bubbles: true });
    institucionInputEl.dispatchEvent(event);

    // Mark as valid
    institucionSelectorEl.classList.add('valid');
    institucionSelectorEl.classList.remove('invalid');

    // Close dropdown
    closeInstitucionDropdown();
}

// Open institucion dropdown
function openInstitucionDropdown() {
    if (institucionDropdownEl && institucionSelectorEl) {
        institucionDropdownEl.style.display = 'block';
        institucionSelectorEl.classList.add('active');
    }
}

// Close institucion dropdown
function closeInstitucionDropdown() {
    if (institucionDropdownEl && institucionSelectorEl) {
        institucionDropdownEl.style.display = 'none';
        institucionSelectorEl.classList.remove('active');
    }
}

// Toggle institucion dropdown
function toggleInstitucionDropdown() {
    if (institucionDropdownEl) {
        const isOpen = institucionDropdownEl.style.display === 'block';
        if (isOpen) {
            closeInstitucionDropdown();
        } else {
            openInstitucionDropdown();
        }
    }
}

function initInstitucionSelector() {
    institucionSelectorEl = document.getElementById('institucionSelector');
    institucionDropdownEl = document.getElementById('institucionDropdown');
    institucionInputEl = document.getElementById('institucion');

    if (!institucionSelectorEl) return;

    // Load instituciones from Firebase
    loadInstitucionesFromFirebase();

    // Event listeners
    institucionSelectorEl.addEventListener('click', toggleInstitucionDropdown);

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
        if (!institucionSelectorEl.contains(e.target) && !institucionDropdownEl.contains(e.target)) {
            closeInstitucionDropdown();
        }
    });
}

// Inicializar selector de institución cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstitucionSelector);
} else {
    initInstitucionSelector();
}


// Aula selector functionality
let aulas = [];

// Load aulas from Firebase
async function loadAulasFromFirebase() {
    try {
        // Wait for Firebase to be ready
        const checkFirebase = () => {
            return new Promise((resolve) => {
                const check = () => {
                    if (window.firebaseDB) {
                        resolve();
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        };

        await checkFirebase();

        const snapshot = await window.firebaseDB.collection('aulas').orderBy('nombre').get();
        aulas = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            aulas.push({
                id: doc.id,
                nombre: data.nombre
            });
        });

        // Populate aula select
        populateAulaSelect();

    } catch (error) {
        console.error('Error loading aulas from Firebase:', error);
        aulas = [];
        populateAulaSelect();
    }
}

// Populate aula select
function populateAulaSelect() {
    const aulaSelect = document.getElementById('aula');
    if (!aulaSelect) return;

    aulaSelect.innerHTML = '<option value="">Seleccione Calendario</option>';
    
    aulas.forEach(aula => {
        const option = document.createElement('option');
        option.value = aula.id;
        option.textContent = aula.nombre;
        aulaSelect.appendChild(option);
    });
}

// Initialize aula selector
function initAulaSelector() {
    loadAulasFromFirebase();
}

// Inicializar selector de aula cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAulaSelector);
} else {
    initAulaSelector();
}


// Función para generar imagen con credenciales
async function generateCredentialsImage(email, password, recoveryCode, nombre) {
    return new Promise((resolve) => {
        // Crear canvas
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        // Fondo degradado
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);

        // Título
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Seamos Genios', 400, 80);

        ctx.font = '24px Arial';
        ctx.fillText('Credenciales de Acceso', 400, 120);

        // Contenedor blanco
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.roundRect(50, 160, 700, 380, 15);
        ctx.fill();

        // Información del usuario
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';

        // Nombre
        ctx.fillText('Nombre:', 100, 220);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#555555';
        ctx.fillText(nombre.toUpperCase(), 100, 250);

        // Usuario
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Usuario:', 100, 300);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#555555';
        ctx.fillText(email, 100, 330);

        // Contraseña
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Contraseña:', 100, 380);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#555555';
        ctx.fillText(password, 100, 410);

        // Código de recuperación
        ctx.fillStyle = '#333333';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('Código de Recuperación:', 100, 460);
        ctx.font = '18px Arial';
        ctx.fillStyle = '#d32f2f';
        ctx.fillText(recoveryCode, 100, 490);

        // Nota importante
        ctx.fillStyle = '#666666';
        ctx.font = 'italic 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Guarda esta imagen en un lugar seguro', 400, 560);

        // Convertir canvas a blob y descargar
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `credenciales_${email.split('@')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            resolve();
        });
    });
}



// Función para subir imagen a ImgBB
async function uploadImageToImgBB(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error('Error al subir imagen a ImgBB');
        }
    } catch (error) {
        console.error('Error al subir imagen:', error);
        throw error;
    }
}
