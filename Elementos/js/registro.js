// Registration functionality - Only Students, Firestore only
document.addEventListener('DOMContentLoaded', function() {
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
        nombre: document.getElementById('nombre'),
        telefono: document.getElementById('telefono'),
        institucion: document.getElementById('institucion'),
        grado: document.getElementById('grado'),
        tipoDocumento: document.getElementById('tipoDocumento'),
        numeroDocumento: document.getElementById('numeroDocumento'),
        departamento: document.getElementById('departamento')
    };

    // Update email field when username changes
    inputs.username.addEventListener('input', function() {
        let username = this.value.trim();
        
        // Si el usuario pega un correo completo, extraer solo la parte antes del @
        if (username.includes('@')) {
            username = username.split('@')[0];
            this.value = username; // Actualizar el campo con solo el usuario
        }
        
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
    
    inputs.nombre.addEventListener('input', function() {
        touched.nombre = true;
        // Convertir automáticamente a mayúsculas mientras escribe
        const cursorPosition = this.selectionStart;
        this.value = this.value.toUpperCase();
        this.setSelectionRange(cursorPosition, cursorPosition);
    });
    inputs.nombre.addEventListener('blur', () => {
        if (touched.nombre) validateName();
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

    function validateName() {
        const name = inputs.nombre.value.trim();
        const validationMsg = inputs.nombre.closest('.input-group').querySelector('.validation-message');
        
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
        const select = inputs[fieldName];
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
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all fields
        const validations = [
            validateUsername(),
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
            
            // Obtener teléfono completo con código de país
            const telefonoCompletoInput = document.getElementById('telefonoCompleto');
            const telefonoCompleto = telefonoCompletoInput ? telefonoCompletoInput.value : inputs.telefono.value.trim();
            
            const formData = {
                email: inputs.email.value.trim(),
                emailRecuperacion: inputs.emailRecuperacion.value.trim(),
                password: inputs.password.value,
                nombre: inputs.nombre.value.trim().toUpperCase(), // Convertir nombre a mayúsculas
                telefono: telefonoCompleto, // Guardar teléfono con código de país
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
                window.location.href = 'login.html';
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
            item.addEventListener('click', function() {
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
    
    countrySearch.addEventListener('input', function() {
        renderCountries(this.value);
    });
    
    telefonoInput.addEventListener('input', updateFullPhone);
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
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
            item.addEventListener('click', function() {
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
    
    departamentoSearch.addEventListener('input', function() {
        renderDepartamentos(this.value);
    });
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
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
const instituciones = [
    {
        name: 'IETAC',
        fullName: 'Institución Educativa Técnico Agropecuario Claret Tierradentro Córdoba',
        logo: '../data/LOGOINSTITUCION.png'
    },
    {
        name: 'SEAMOSGENIOS',
        fullName: 'Seamos Genios - Plataforma Educativa',
        logo: '../Elementos/img/logo1.png'
    }
];

function initInstitucionSelector() {
    const institucionSelector = document.getElementById('institucionSelector');
    const institucionDropdown = document.getElementById('institucionDropdown');
    const institucionList = document.getElementById('institucionList');
    const institucionInput = document.getElementById('institucion');
    
    if (!institucionSelector) return;
    
    // Renderizar lista de instituciones
    function renderInstituciones() {
        institucionList.innerHTML = instituciones.map(inst => `
            <div class="institucion-item" data-value="${inst.name}">
                <img src="${inst.logo}" alt="${inst.name}" class="institucion-logo">
                <div class="institucion-info">
                    <div class="institucion-name">${inst.name}</div>
                    <div class="institucion-description">${inst.fullName}</div>
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners a los items
        document.querySelectorAll('.institucion-item').forEach(item => {
            item.addEventListener('click', function() {
                selectInstitucion(this.dataset.value);
            });
        });
    }
    
    // Seleccionar institución
    function selectInstitucion(value) {
        const textElement = institucionSelector.querySelector('.institucion-text');
        textElement.textContent = value;
        textElement.classList.add('selected');
        institucionInput.value = value;
        
        // Disparar evento change para validación
        const event = new Event('change', { bubbles: true });
        institucionInput.dispatchEvent(event);
        
        // Marcar como válido
        institucionSelector.classList.add('valid');
        institucionSelector.classList.remove('invalid');
        
        // Cerrar dropdown
        closeDropdown();
    }
    
    // Abrir/cerrar dropdown
    function toggleDropdown() {
        const isOpen = institucionDropdown.style.display === 'block';
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    }
    
    function openDropdown() {
        institucionDropdown.style.display = 'block';
        institucionSelector.classList.add('active');
    }
    
    function closeDropdown() {
        institucionDropdown.style.display = 'none';
        institucionSelector.classList.remove('active');
    }
    
    // Event listeners
    institucionSelector.addEventListener('click', toggleDropdown);
    
    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (!institucionSelector.contains(e.target) && !institucionDropdown.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Inicializar
    renderInstituciones();
}

// Inicializar selector de institución cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstitucionSelector);
} else {
    initInstitucionSelector();
}
