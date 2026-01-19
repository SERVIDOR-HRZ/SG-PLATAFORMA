// Registration with Classroom Assignment
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.querySelector('.register-btn');
    const messageDiv = document.getElementById('message');
    const aulaInfoBanner = document.getElementById('aulaInfoBanner');
    const aulaNombreBanner = document.getElementById('aulaNombreBanner');
    const aulaDescripcionBanner = document.getElementById('aulaDescripcionBanner');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const aulaIdParam = urlParams.get('aula');
    const codigoInvitacionParam = urlParams.get('codigo');

    // Form validation - All fields
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
        departamento: document.getElementById('departamento'),
        aulaId: document.getElementById('aulaId'),
        codigoInvitacion: document.getElementById('codigoInvitacion')
    };

    // Verify invitation code and load classroom info
    async function verifyInvitationCode() {
        if (!aulaIdParam || !codigoInvitacionParam) {
            showMessage('Enlace de invitación inválido. Redirigiendo al registro normal...', 'error');
            setTimeout(() => {
                window.location.href = 'registro.html';
            }, 3000);
            return false;
        }

        try {
            await waitForFirebase();

            // Get classroom info
            const aulaDoc = await window.firebaseDB.collection('aulas').doc(aulaIdParam).get();

            if (!aulaDoc.exists) {
                throw new Error('El aula no existe');
            }

            const aulaData = aulaDoc.data();

            // Verify invitation code
            if (aulaData.codigoInvitacion !== codigoInvitacionParam) {
                throw new Error('Código de invitación inválido');
            }

            // Check if invitation is active
            if (!aulaData.invitacionActiva) {
                throw new Error('Este enlace de invitación ha sido desactivado');
            }

            // Display classroom info
            aulaNombreBanner.textContent = aulaData.nombre;
            aulaDescripcionBanner.textContent = aulaData.descripcion || 'Te registrarás en esta aula virtual';
            aulaInfoBanner.style.display = 'flex';

            // Set hidden fields
            inputs.aulaId.value = aulaIdParam;
            inputs.codigoInvitacion.value = codigoInvitacionParam;

            return true;
        } catch (error) {
            console.error('Error verifying invitation:', error);
            showMessage(error.message || 'Error al verificar el código de invitación', 'error');
            setTimeout(() => {
                window.location.href = 'registro.html';
            }, 3000);
            return false;
        }
    }

    // Initialize verification
    verifyInvitationCode();

    // Update email field when username changes
    inputs.username.addEventListener('input', function () {
        let username = this.value.trim().toLowerCase();
        if (username.includes('@')) {
            username = username.split('@')[0];
        }
        this.value = username;
        inputs.email.value = username ? username + '@seamosgenios.com' : '';
    });

    // Add validation messages
    Object.keys(inputs).forEach(key => {
        if (inputs[key].tagName !== 'SELECT' && inputs[key].type !== 'hidden') {
            const validationMsg = document.createElement('div');
            validationMsg.className = 'validation-message';
            const inputGroup = inputs[key].closest('.input-group');
            if (inputGroup) {
                inputGroup.appendChild(validationMsg);
            }
        }
    });

    // Password toggle functionality
    function addPasswordToggle(inputId) {
        const input = document.getElementById(inputId);
        const inputGroup = input.parentNode;
        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'password-toggle';
        toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
        inputGroup.style.position = 'relative';
        toggleBtn.addEventListener('click', function () {
            if (input.type === 'password') {
                input.type = 'text';
                toggleBtn.innerHTML = '<i class="bi bi-eye-slash"></i>';
            } else {
                input.type = 'password';
                toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
            }
        });
        inputGroup.appendChild(toggleBtn);
    }

    addPasswordToggle('password');
    addPasswordToggle('confirmPassword');

    // Validation functions
    const touched = {};

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
        const phoneRegex = /^[0-9]{7,15}$/;
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

        if (!value || value === '') {
            select.classList.add('invalid');
            select.classList.remove('valid');
            return false;
        }

        select.classList.add('valid');
        select.classList.remove('invalid');
        return true;
    }

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

    inputs.nombre.addEventListener('input', function () {
        touched.nombre = true;
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

    inputs.numeroDocumento.addEventListener('input', () => touched.numeroDocumento = true);
    inputs.numeroDocumento.addEventListener('blur', () => {
        if (touched.numeroDocumento) validateDocumentNumber();
    });

    inputs.grado.addEventListener('change', () => validateSelect('grado'));
    inputs.tipoDocumento.addEventListener('change', () => validateSelect('tipoDocumento'));
    inputs.departamento.addEventListener('change', () => validateSelect('departamento'));

    async function checkEmailExists(email) {
        try {
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

    function generateRecoveryCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

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

        // Verify aula assignment
        if (!inputs.aulaId.value || !inputs.codigoInvitacion.value) {
            showMessage('Error: No se pudo verificar el aula asignada', 'error');
            return;
        }

        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        showMessage('Creando cuenta...', 'info');

        try {
            await waitForFirebase();

            const telefonoCompletoInput = document.getElementById('telefonoCompleto');
            const telefonoCompleto = telefonoCompletoInput ? telefonoCompletoInput.value : inputs.telefono.value.trim();

            const formData = {
                email: inputs.email.value.trim(),
                emailRecuperacion: inputs.emailRecuperacion.value.trim(),
                password: inputs.password.value,
                nombre: inputs.nombre.value.trim().toUpperCase(),
                telefono: telefonoCompleto,
                institucion: inputs.institucion.value.trim(),
                grado: inputs.grado.value,
                tipoDocumento: inputs.tipoDocumento.value,
                numeroDocumento: inputs.numeroDocumento.value.trim(),
                departamento: inputs.departamento.value,
                aulaId: inputs.aulaId.value
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

            const recoveryCode = generateRecoveryCode();

            // Save user data with classroom assignment
            const userData = {
                email: formData.email,
                usuario: formData.email,
                emailRecuperacion: formData.emailRecuperacion,
                password: formData.password,
                nombre: formData.nombre,
                telefono: formData.telefono,
                institucion: formData.institucion,
                grado: formData.grado,
                tipoDocumento: formData.tipoDocumento,
                numeroDocumento: formData.numeroDocumento,
                departamento: formData.departamento,
                tipoUsuario: 'estudiante',
                codigoRecuperacion: recoveryCode,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                activo: false, // Inactive by default - requires admin activation
                aulasAsignadas: [formData.aulaId] // Assign classroom
            };

            await window.firebaseDB.collection('usuarios').add(userData);

            // Generate credentials image
            await generateCredentialsImage(formData.email, formData.password, recoveryCode, formData.nombre);

            showMessage('¡Cuenta creada exitosamente! Se ha descargado una imagen con tus credenciales. Tu cuenta está pendiente de activación por un administrador. Redirigiendo...', 'success');

            setTimeout(() => {
                window.location.href = 'login.html';
            }, 3000);

        } catch (error) {
            console.error('Error creating account:', error);
            showMessage(error.message || 'Error al crear la cuenta', 'error');
        } finally {
            registerBtn.classList.remove('loading');
            registerBtn.disabled = false;
        }
    });
});

// Initialize country and department selectors (reuse from registro.js)
// Country selector
const countries = [
    { name: 'Colombia', code: '+57', flag: 'CO' },
    { name: 'Mexico', code: '+52', flag: 'MX' },
    { name: 'Peru', code: '+51', flag: 'PE' },
    { name: 'Argentina', code: '+54', flag: 'AR' },
    { name: 'Chile', code: '+56', flag: 'CL' },
    { name: 'Ecuador', code: '+593', flag: 'EC' },
    { name: 'Venezuela', code: '+58', flag: 'VE' }
];

function initCountrySelector() {
    const countrySelector = document.getElementById('countrySelector');
    const countryDropdown = document.getElementById('countryDropdown');
    const countryList = document.getElementById('countryList');
    const countrySearch = document.getElementById('countrySearch');
    const codigoPaisInput = document.getElementById('codigoPais');
    const telefonoInput = document.getElementById('telefono');
    const telefonoCompletoInput = document.getElementById('telefonoCompleto');

    function renderCountries(filter = '') {
        const filteredCountries = countries.filter(country =>
            country.name.toLowerCase().includes(filter.toLowerCase()) ||
            country.code.includes(filter)
        );

        countryList.innerHTML = filteredCountries.map(country => `
            <div class="country-item" data-code="${country.code}" data-flag="${country.flag}">
                <img src="https://flagcdn.com/w40/${country.flag.toLowerCase()}.png" alt="${country.name}" class="flag-img">
                <div class="country-info">
                    <span class="country-name">${country.name}</span>
                    <span class="country-code">${country.code}</span>
                </div>
            </div>
        `).join('');

        document.querySelectorAll('.country-item').forEach(item => {
            item.addEventListener('click', function () {
                selectCountry(this.dataset.code, this.dataset.flag);
            });
        });
    }

    function selectCountry(code, flag) {
        const flagElement = countrySelector.querySelector('.flag-emoji');
        flagElement.innerHTML = `<img src="https://flagcdn.com/w40/${flag.toLowerCase()}.png" alt="" class="flag-img">`;
        countrySelector.querySelector('.country-code').textContent = code;
        codigoPaisInput.value = code;
        updateFullPhone();
        closeDropdown();
    }

    function updateFullPhone() {
        const codigo = codigoPaisInput.value;
        const numero = telefonoInput.value.trim();
        telefonoCompletoInput.value = numero ? `${codigo}${numero}` : '';
    }

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

    countrySelector.addEventListener('click', toggleDropdown);
    countrySearch.addEventListener('input', function () {
        renderCountries(this.value);
    });
    telefonoInput.addEventListener('input', updateFullPhone);

    document.addEventListener('click', function (e) {
        if (!countrySelector.contains(e.target) && !countryDropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    renderCountries();
    updateFullPhone();
}

// Department selector
const departamentos = [
    'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá',
    'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca',
    'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño',
    'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia',
    'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'
];

function initDepartamentoSelector() {
    const departamentoSelector = document.getElementById('departamentoSelector');
    const departamentoDropdown = document.getElementById('departamentoDropdown');
    const departamentoList = document.getElementById('departamentoList');
    const departamentoSearch = document.getElementById('departamentoSearch');
    const departamentoInput = document.getElementById('departamento');

    if (!departamentoSelector) return;

    function removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    function renderDepartamentos(filter = '') {
        const filteredDepartamentos = departamentos.filter(depto =>
            removeAccents(depto.toLowerCase()).includes(removeAccents(filter.toLowerCase()))
        );

        departamentoList.innerHTML = filteredDepartamentos.map(depto => `
            <div class="departamento-item" data-value="${depto}">${depto}</div>
        `).join('');

        document.querySelectorAll('.departamento-item').forEach(item => {
            item.addEventListener('click', function () {
                selectDepartamento(this.dataset.value);
            });
        });
    }

    function selectDepartamento(value) {
        const textElement = departamentoSelector.querySelector('.departamento-text');
        textElement.textContent = value;
        textElement.classList.add('selected');
        departamentoInput.value = value;
        const event = new Event('change', { bubbles: true });
        departamentoInput.dispatchEvent(event);
        closeDropdown();
    }

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

    departamentoSelector.addEventListener('click', toggleDropdown);
    departamentoSearch.addEventListener('input', function () {
        renderDepartamentos(this.value);
    });

    document.addEventListener('click', function (e) {
        if (!departamentoSelector.contains(e.target) && !departamentoDropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    renderDepartamentos();
}

// Initialize selectors
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initCountrySelector();
        initDepartamentoSelector();
    });
} else {
    initCountrySelector();
    initDepartamentoSelector();
}


// Institution selector
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
