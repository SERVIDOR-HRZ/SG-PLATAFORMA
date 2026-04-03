// Registration with Classroom Assignment - Full payment flow
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('registerForm');
    const registerBtn = document.querySelector('.register-btn');

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const aulaIdParam = urlParams.get('aula');
    const codigoInvitacionParam = urlParams.get('codigo');

    // Global state
    let aulaSeleccionadaData = null;
    let metodoPagoSeleccionadoData = null;
    let selectedComprobanteFile = null;

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
        aulaId: document.getElementById('aulaId'),
        codigoInvitacion: document.getElementById('codigoInvitacion')
    };

    // Username -> email sync
    inputs.username.addEventListener('input', function () {
        let username = this.value.trim().toLowerCase();
        if (username.includes('@')) username = username.split('@')[0];
        this.value = username;
        inputs.email.value = username ? username + '@seamosgenios.com' : '';
    });

    // Validation messages
    Object.keys(inputs).forEach(key => {
        if (inputs[key] && inputs[key].tagName !== 'SELECT' && inputs[key].type !== 'hidden') {
            const validationMsg = document.createElement('div');
            validationMsg.className = 'validation-message';
            const inputGroup = inputs[key].closest('.input-group');
            if (inputGroup) inputGroup.appendChild(validationMsg);
        }
    });

    function addPasswordToggle(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
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

    function showMessage(message, type) {
        const messageDiv = document.getElementById('message');
        if (!messageDiv) return;
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        if (type === 'success') setTimeout(() => { messageDiv.style.display = 'none'; }, 5000);
    }

    function setValidation(input, isValid, message) {
        if (!input) return;
        const inputGroup = input.closest('.input-group');
        if (!inputGroup) return;
        const validationMsg = inputGroup.querySelector('.validation-message');
        if (isValid) {
            input.style.borderColor = '#4CAF50';
            if (validationMsg) { validationMsg.textContent = ''; validationMsg.style.display = 'none'; }
        } else {
            input.style.borderColor = '#ff4444';
            if (validationMsg) { validationMsg.textContent = message; validationMsg.style.display = 'block'; }
        }
        return isValid;
    }

    function validateUsername() {
        const val = inputs.username.value.trim();
        if (!val) return setValidation(inputs.username, false, 'El usuario es requerido');
        if (val.length < 3) return setValidation(inputs.username, false, 'Mínimo 3 caracteres');
        return setValidation(inputs.username, true, '');
    }
    function validateRecoveryEmail() {
        const val = inputs.emailRecuperacion.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!val) return setValidation(inputs.emailRecuperacion, false, 'El correo es requerido');
        if (!emailRegex.test(val)) return setValidation(inputs.emailRecuperacion, false, 'Correo inválido');
        return setValidation(inputs.emailRecuperacion, true, '');
    }
    function validatePassword() {
        const val = inputs.password.value;
        if (!val) return setValidation(inputs.password, false, 'La contraseña es requerida');
        if (val.length < 6) return setValidation(inputs.password, false, 'Mínimo 6 caracteres');
        return setValidation(inputs.password, true, '');
    }
    function validateConfirmPassword() {
        const val = inputs.confirmPassword.value;
        if (!val) return setValidation(inputs.confirmPassword, false, 'Confirma tu contraseña');
        if (val !== inputs.password.value) return setValidation(inputs.confirmPassword, false, 'Las contraseñas no coinciden');
        return setValidation(inputs.confirmPassword, true, '');
    }
    function validatePrimerNombre() {
        const val = inputs.primerNombre.value.trim();
        if (!val) return setValidation(inputs.primerNombre, false, 'El primer nombre es requerido');
        return setValidation(inputs.primerNombre, true, '');
    }
    function validateSegundoNombre() { return true; }
    function validatePrimerApellido() {
        const val = inputs.primerApellido.value.trim();
        if (!val) return setValidation(inputs.primerApellido, false, 'El primer apellido es requerido');
        return setValidation(inputs.primerApellido, true, '');
    }
    function validateSegundoApellido() { return true; }
    function validatePhone() {
        const val = inputs.telefono.value.trim();
        if (!val) return setValidation(inputs.telefono, false, 'El teléfono es requerido');
        return setValidation(inputs.telefono, true, '');
    }
    function validateInstitution() {
        const val = inputs.institucion.value.trim();
        if (!val) {
            const btn = document.getElementById('institucionSelector');
            if (btn) btn.style.borderColor = '#ff4444';
            return false;
        }
        const btn = document.getElementById('institucionSelector');
        if (btn) btn.style.borderColor = '#4CAF50';
        return true;
    }
    function validateDocumentNumber() {
        const val = inputs.numeroDocumento.value.trim();
        if (!val) return setValidation(inputs.numeroDocumento, false, 'El número de documento es requerido');
        return setValidation(inputs.numeroDocumento, true, '');
    }
    function validateSelect(fieldName) {
        const el = document.getElementById(fieldName);
        if (!el) return true;
        if (!el.value) { el.style.borderColor = '#ff4444'; return false; }
        el.style.borderColor = '#4CAF50';
        return true;
    }

    async function checkEmailExists(email) {
        const q = await window.firebaseDB.collection('usuarios').where('usuario', '==', email).get();
        return !q.empty;
    }
    async function checkDocumentExists(tipoDoc, numeroDoc) {
        const q = await window.firebaseDB.collection('usuarios')
            .where('tipoDocumento', '==', tipoDoc)
            .where('numeroDocumento', '==', numeroDoc).get();
        return !q.empty;
    }
    function generateRecoveryCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    }
    function waitForFirebase() {
        return new Promise((resolve) => {
            const check = () => { if (window.firebaseDB) resolve(); else setTimeout(check, 100); };
            check();
        });
    }

    // ===== VERIFY INVITATION & LOAD AULA =====
    async function verifyInvitationCode() {
        if (!aulaIdParam || !codigoInvitacionParam) {
            showMessage('Enlace de invitación inválido. Redirigiendo...', 'error');
            setTimeout(() => { window.location.href = 'registro.html'; }, 3000);
            return false;
        }
        try {
            await waitForFirebase();
            const aulaDoc = await window.firebaseDB.collection('aulas').doc(aulaIdParam).get();
            if (!aulaDoc.exists) throw new Error('El aula no existe');
            const aulaData = aulaDoc.data();
            if (aulaData.codigoInvitacion !== codigoInvitacionParam) throw new Error('Código de invitación inválido');
            if (!aulaData.invitacionActiva) throw new Error('Este enlace de invitación ha sido desactivado');

            // Store aula data globally
            aulaSeleccionadaData = { id: aulaIdParam, ...aulaData };

            // Show small badge next to document number
            const badge = document.getElementById('aulaBadge');
            const badgeGroup = document.getElementById('aulaBadgeGroup');
            const badgeNombre = document.getElementById('aulaBadgeNombre');
            if (badge && badgeNombre) {
                badgeNombre.textContent = aulaData.nombre;
                const color = aulaData.color || '#ffc107';
                badge.style.background = `${color}22`;
                badge.style.borderColor = `${color}88`;
                badge.style.color = color;
                badge.style.display = 'inline-flex';
                if (badgeGroup) badgeGroup.style.display = 'block';
            }

            // Set hidden fields
            inputs.aulaId.value = aulaIdParam;
            inputs.codigoInvitacion.value = codigoInvitacionParam;
            return true;
        } catch (error) {
            showMessage(error.message || 'Error al verificar el enlace', 'error');
            setTimeout(() => { window.location.href = 'registro.html'; }, 3000);
            return false;
        }
    }
    // Store verification promise so btnContinuarPago can await it
    const verificationPromise = verifyInvitationCode();

    // ===== PAYMENT FLOW =====
    function formatCurrency(value) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    }

    async function cargarInformacionAula() {
        // If aula data not loaded yet, wait for verification
        if (!aulaSeleccionadaData) {
            await verificationPromise;
        }
        if (!aulaSeleccionadaData) return;
        const valorTotal = aulaSeleccionadaData.precioTotal || aulaSeleccionadaData.valorTotal || aulaSeleccionadaData.precio || 0;
        const pagoInicial = aulaSeleccionadaData.cuotaInicial || aulaSeleccionadaData.pagoInicial || 0;
        const numeroCuotas = aulaSeleccionadaData.numeroCuotas || 0;
        const valorCuota = numeroCuotas > 0 ? Math.ceil((valorTotal - pagoInicial) / numeroCuotas) : 0;

        document.getElementById('aulaSeleccionadaNombre').textContent = aulaSeleccionadaData.nombre || '-';
        document.getElementById('valorTotal').textContent = formatCurrency(valorTotal);
        document.getElementById('pagoInicial').textContent = formatCurrency(pagoInicial);
        document.getElementById('numeroCuotas').textContent = numeroCuotas;
        document.getElementById('valorCuota').textContent = formatCurrency(valorCuota);

        await cargarMetodosPago();

        document.getElementById('seccionDatos').style.display = 'none';
        document.getElementById('seccionPago').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function cargarMetodosPago() {
        const grid = document.getElementById('metodosPagoGrid');
        if (!grid) return;
        grid.innerHTML = '<div style="color:rgba(255,255,255,0.7);text-align:center;padding:1rem;"><i class="bi bi-arrow-clockwise"></i> Cargando...</div>';
        try {
            await waitForFirebase();
            const snapshot = await window.firebaseDB.collection('metodosPago').get();
            grid.innerHTML = '';
            let count = 0;
            snapshot.forEach(doc => {
                const m = doc.data();
                if (m.activo !== true) return;
                count++;
                const item = document.createElement('div');
                item.className = 'metodo-pago-item';
                item.setAttribute('data-metodo-id', doc.id);
                item.setAttribute('data-metodo-nombre', m.nombre);
                item.setAttribute('data-metodo-cuenta', m.numeroCuenta || '');
                item.setAttribute('data-metodo-imagen', m.imagen || '');
                item.innerHTML = `<img src="${m.imagen}" alt="${m.nombre}" class="metodo-pago-logo" onerror="this.src='../Elementos/img/logo1.png'"><div class="metodo-pago-nombre">${m.nombre}</div>`;
                item.addEventListener('click', () => seleccionarMetodoPago(item));
                grid.appendChild(item);
            });
            if (count === 0) grid.innerHTML = '<p style="color:rgba(255,255,255,0.7);text-align:center;">No hay métodos de pago disponibles</p>';
        } catch (e) {
            grid.innerHTML = '<p style="color:#ff4444;text-align:center;">Error al cargar métodos de pago</p>';
        }
    }

    function seleccionarMetodoPago(elemento) {
        document.querySelectorAll('.metodo-pago-item').forEach(i => i.classList.remove('selected'));
        elemento.classList.add('selected');
        document.getElementById('metodoPagoEstudiante').value = elemento.getAttribute('data-metodo-nombre');
        document.getElementById('metodoPagoId').value = elemento.getAttribute('data-metodo-id');
        metodoPagoSeleccionadoData = {
            id: elemento.getAttribute('data-metodo-id'),
            nombre: elemento.getAttribute('data-metodo-nombre'),
            imagen: elemento.getAttribute('data-metodo-imagen'),
            cuenta: elemento.getAttribute('data-metodo-cuenta')
        };
    }

    async function mostrarSeccionComprobante() {
        if (!aulaSeleccionadaData || !metodoPagoSeleccionadoData) return;
        const pagoInicial = aulaSeleccionadaData.cuotaInicial || aulaSeleccionadaData.pagoInicial || 0;
        document.getElementById('pagoInicialComprobante').textContent = formatCurrency(pagoInicial);
        document.getElementById('aulaComprobante').textContent = aulaSeleccionadaData.nombre || '-';
        document.getElementById('metodoPagoNombre').textContent = metodoPagoSeleccionadoData.nombre;
        document.getElementById('metodoPagoCuenta').textContent = metodoPagoSeleccionadoData.cuenta || 'Ver datos en la app';
        const imgEl = document.getElementById('metodoPagoImagen');
        if (imgEl) { imgEl.src = metodoPagoSeleccionadoData.imagen; imgEl.style.display = 'block'; }
        document.getElementById('seccionPago').style.display = 'none';
        document.getElementById('seccionComprobante').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ===== SECTION NAVIGATION =====
    document.getElementById('btnContinuarPago').addEventListener('click', async function () {
        const validations = [
            validateUsername(), validateRecoveryEmail(), validatePassword(), validateConfirmPassword(),
            validatePrimerNombre(), validateSegundoNombre(), validatePrimerApellido(), validateSegundoApellido(),
            validatePhone(), validateInstitution(), validateDocumentNumber(),
            validateSelect('grado'), validateSelect('tipoDocumento'), validateSelect('departamento')
        ];
        if (validations.includes(false)) { showMessage('Por favor corrige los errores en el formulario', 'error'); return; }
        // Wait for verification to complete if still pending
        await verificationPromise;
        if (!inputs.aulaId.value) { showMessage('Error: No se pudo verificar el aula asignada', 'error'); return; }
        cargarInformacionAula();
    });

    document.getElementById('btnVolverDatos').addEventListener('click', function () {
        document.getElementById('seccionPago').style.display = 'none';
        document.getElementById('seccionDatos').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btnContinuarComprobante').addEventListener('click', function () {
        if (!document.getElementById('metodoPagoEstudiante').value) {
            showMessage('Por favor selecciona un método de pago', 'error'); return;
        }
        mostrarSeccionComprobante();
    });

    document.getElementById('btnVolverMetodo').addEventListener('click', function () {
        document.getElementById('seccionComprobante').style.display = 'none';
        document.getElementById('seccionPago').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ===== COMPROBANTE UPLOAD =====
    const uploadArea = document.getElementById('uploadArea');
    const comprobanteInput = document.getElementById('comprobanteInput');

    if (uploadArea && comprobanteInput) {
        uploadArea.addEventListener('click', () => comprobanteInput.click());
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('dragover'); });
        uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault(); uploadArea.classList.remove('dragover');
            if (e.dataTransfer.files[0]) handleComprobanteSelect(e.dataTransfer.files[0]);
        });
        comprobanteInput.addEventListener('change', (e) => { if (e.target.files[0]) handleComprobanteSelect(e.target.files[0]); });
    }

    document.getElementById('btnRemoveComprobante').addEventListener('click', removeComprobante);

    function handleComprobanteSelect(file) {
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
        if (!validTypes.includes(file.type)) { showMessage('Por favor selecciona PNG, JPG o PDF', 'error'); return; }
        if (file.size > 5 * 1024 * 1024) { showMessage('El archivo no puede superar 5MB', 'error'); return; }
        selectedComprobanteFile = file;
        const preview = document.getElementById('comprobantePreview');
        const img = document.getElementById('comprobanteImg');
        if (file.type !== 'application/pdf') {
            const reader = new FileReader();
            reader.onload = (e) => { img.src = e.target.result; };
            reader.readAsDataURL(file);
            img.style.display = 'block';
        } else {
            img.style.display = 'none';
        }
        uploadArea.style.display = 'none';
        preview.style.display = 'block';
    }

    function removeComprobante() {
        selectedComprobanteFile = null;
        document.getElementById('comprobantePreview').style.display = 'none';
        document.getElementById('uploadArea').style.display = 'flex';
        document.getElementById('comprobanteInput').value = '';
    }

    async function uploadImageToImgBB(file) {
        const formData = new FormData();
        formData.append('image', file);
        const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Error al subir imagen');
        const data = await response.json();
        if (!data.success) throw new Error('Error en ImgBB: ' + (data.error?.message || 'desconocido'));
        return data.data.url;
    }

    // ===== FORM SUBMISSION =====
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const validations = [
            validateUsername(), validateRecoveryEmail(), validatePassword(), validateConfirmPassword(),
            validatePrimerNombre(), validateSegundoNombre(), validatePrimerApellido(), validateSegundoApellido(),
            validatePhone(), validateInstitution(), validateDocumentNumber(),
            validateSelect('grado'), validateSelect('tipoDocumento'), validateSelect('departamento'),
            validateSelect('metodoPagoEstudiante')
        ];
        if (validations.includes(false)) { showMessage('Por favor corrige los errores en el formulario', 'error'); return; }
        if (!selectedComprobanteFile) { showMessage('Por favor selecciona un comprobante de pago', 'error'); return; }
        if (!inputs.aulaId.value || !inputs.codigoInvitacion.value) {
            showMessage('Error: No se pudo verificar el aula asignada', 'error'); return;
        }

        registerBtn.classList.add('loading');
        registerBtn.disabled = true;
        showMessage('Subiendo comprobante y creando cuenta...', 'info');

        try {
            await waitForFirebase();

            showMessage('Subiendo comprobante de pago...', 'info');
            let comprobanteUrl = null;
            try {
                comprobanteUrl = await uploadImageToImgBB(selectedComprobanteFile);
            } catch (uploadError) {
                throw new Error('Error al subir el comprobante. Por favor intenta de nuevo.');
            }

            showMessage('Creando cuenta...', 'info');

            const telefonoCompleto = document.getElementById('telefonoCompleto')?.value || inputs.telefono.value.trim();
            const nombreCompleto = [
                inputs.primerNombre.value.trim().toUpperCase(),
                inputs.segundoNombre.value.trim().toUpperCase(),
                inputs.primerApellido.value.trim().toUpperCase(),
                inputs.segundoApellido.value.trim().toUpperCase()
            ].filter(p => p.length > 0).join(' ');

            const emailVal = inputs.email.value.trim();

            const emailExists = await checkEmailExists(emailVal);
            if (emailExists) throw new Error('El correo electrónico ya está registrado');

            const documentExists = await checkDocumentExists(inputs.tipoDocumento.value, inputs.numeroDocumento.value.trim());
            if (documentExists) throw new Error('El documento ya está registrado');

            const recoveryCode = generateRecoveryCode();

            const userData = {
                email: emailVal,
                usuario: emailVal,
                emailRecuperacion: inputs.emailRecuperacion.value.trim(),
                password: inputs.password.value,
                primerNombre: inputs.primerNombre.value.trim().toUpperCase(),
                segundoNombre: inputs.segundoNombre.value.trim().toUpperCase(),
                primerApellido: inputs.primerApellido.value.trim().toUpperCase(),
                segundoApellido: inputs.segundoApellido.value.trim().toUpperCase(),
                nombre: nombreCompleto,
                telefono: telefonoCompleto,
                institucion: inputs.institucion.value.trim(),
                grado: inputs.grado.value,
                tipoDocumento: inputs.tipoDocumento.value,
                numeroDocumento: inputs.numeroDocumento.value.trim(),
                departamento: inputs.departamento.value,
                aulasAsignadas: [inputs.aulaId.value],
                tipoUsuario: 'estudiante',
                codigoRecuperacion: recoveryCode,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp(),
                activo: false,
                metodoPago: document.getElementById('metodoPagoEstudiante').value,
                metodoPagoId: document.getElementById('metodoPagoId').value,
                pagoInicial: aulaSeleccionadaData ? (aulaSeleccionadaData.cuotaInicial || aulaSeleccionadaData.pagoInicial || 0) : 0,
                valorTotal: aulaSeleccionadaData ? (aulaSeleccionadaData.precioTotal || aulaSeleccionadaData.valorTotal || 0) : 0,
                numeroCuotas: aulaSeleccionadaData ? (aulaSeleccionadaData.numeroCuotas || 0) : 0,
                estadoPago: 'pendiente',
                comprobanteUrl: comprobanteUrl
            };

            await window.firebaseDB.collection('usuarios').add(userData);
            await generateCredentialsImage(emailVal, inputs.password.value, recoveryCode, nombreCompleto);

            showMessage('¡Cuenta creada exitosamente! Se descargó una imagen con tus credenciales. Tu cuenta está pendiente de activación. Redirigiendo...', 'success');
            setTimeout(() => { window.location.href = 'login.html'; }, 5000);

        } catch (error) {
            console.error('Error creating account:', error);
            showMessage(error.message || 'Error al crear la cuenta', 'error');
        } finally {
            registerBtn.classList.remove('loading');
            registerBtn.disabled = false;
        }
    });
});

// ===== COUNTRY SELECTOR =====
const countries = [
    { name: 'Colombia', code: '+57', flag: 'CO' },
    { name: 'Mexico', code: '+52', flag: 'MX' },
    { name: 'Peru', code: '+51', flag: 'PE' },
    { name: 'Argentina', code: '+54', flag: 'AR' },
    { name: 'Chile', code: '+56', flag: 'CL' },
    { name: 'Ecuador', code: '+593', flag: 'EC' },
    { name: 'Venezuela', code: '+58', flag: 'VE' },
    { name: 'Bolivia', code: '+591', flag: 'BO' },
    { name: 'Paraguay', code: '+595', flag: 'PY' },
    { name: 'Uruguay', code: '+598', flag: 'UY' },
    { name: 'Costa Rica', code: '+506', flag: 'CR' },
    { name: 'Panama', code: '+507', flag: 'PA' },
    { name: 'Guatemala', code: '+502', flag: 'GT' },
    { name: 'Honduras', code: '+504', flag: 'HN' },
    { name: 'El Salvador', code: '+503', flag: 'SV' },
    { name: 'Nicaragua', code: '+505', flag: 'NI' },
    { name: 'Espana', code: '+34', flag: 'ES' },
    { name: 'Estados Unidos', code: '+1', flag: 'US' },
    { name: 'Brasil', code: '+55', flag: 'BR' }
];

function initCountrySelector() {
    const countrySelector = document.getElementById('countrySelector');
    const countryDropdown = document.getElementById('countryDropdown');
    const countryList = document.getElementById('countryList');
    const countrySearch = document.getElementById('countrySearch');
    const codigoPaisInput = document.getElementById('codigoPais');
    const telefonoInput = document.getElementById('telefono');
    const telefonoCompletoInput = document.getElementById('telefonoCompleto');
    if (!countrySelector) return;

    function renderCountries(filter = '') {
        const filtered = countries.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()) || c.code.includes(filter));
        countryList.innerHTML = filtered.map(c => `
            <div class="country-item" data-code="${c.code}" data-flag="${c.flag}" data-name="${c.name}">
                <img src="https://flagcdn.com/w40/${c.flag.toLowerCase()}.png" alt="${c.name}" class="flag-img">
                <div class="country-info"><span class="country-name">${c.name}</span><span class="country-code">${c.code}</span></div>
            </div>`).join('');
        document.querySelectorAll('.country-item').forEach(item => {
            item.addEventListener('click', function () { selectCountry(this.dataset.code, this.dataset.flag, this.dataset.name); });
        });
    }
    function selectCountry(code, flag, name) {
        countrySelector.querySelector('.flag-emoji').innerHTML = `<img src="https://flagcdn.com/w40/${flag.toLowerCase()}.png" alt="${name}" class="flag-img">`;
        countrySelector.querySelector('.country-code').textContent = code;
        codigoPaisInput.value = code;
        updateFullPhone();
        countryDropdown.style.display = 'none';
        countrySelector.classList.remove('active');
    }
    function updateFullPhone() {
        const codigo = codigoPaisInput.value;
        const numero = telefonoInput.value.trim();
        telefonoCompletoInput.value = numero ? `${codigo}${numero}` : '';
    }
    countrySelector.addEventListener('click', function () {
        const isOpen = countryDropdown.style.display === 'block';
        countryDropdown.style.display = isOpen ? 'none' : 'block';
        countrySelector.classList.toggle('active', !isOpen);
        if (!isOpen) { countrySearch.value = ''; renderCountries(); countrySearch.focus(); }
    });
    countrySearch.addEventListener('input', function () { renderCountries(this.value); });
    telefonoInput.addEventListener('input', updateFullPhone);
    document.addEventListener('click', function (e) {
        if (!countrySelector.contains(e.target) && !countryDropdown.contains(e.target)) {
            countryDropdown.style.display = 'none'; countrySelector.classList.remove('active');
        }
    });
    renderCountries();
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initCountrySelector); }
else { initCountrySelector(); }

// ===== DEPARTAMENTO SELECTOR =====
const departamentos = ['Amazonas','Antioquia','Arauca','Atlántico','Bogotá D.C.','Bolívar','Boyacá','Caldas','Caquetá','Casanare','Cauca','Cesar','Chocó','Córdoba','Cundinamarca','Guainía','Guaviare','Huila','La Guajira','Magdalena','Meta','Nariño','Norte de Santander','Putumayo','Quindío','Risaralda','San Andrés y Providencia','Santander','Sucre','Tolima','Valle del Cauca','Vaupés','Vichada'];

function initDepartamentoSelector() {
    const sel = document.getElementById('departamentoSelector');
    const drop = document.getElementById('departamentoDropdown');
    const list = document.getElementById('departamentoList');
    const search = document.getElementById('departamentoSearch');
    const input = document.getElementById('departamento');
    if (!sel) return;
    function removeAccents(str) { return str.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    function renderDepartamentos(filter = '') {
        const filtered = departamentos.filter(d => removeAccents(d.toLowerCase()).includes(removeAccents(filter.toLowerCase())));
        list.innerHTML = filtered.map(d => `<div class="departamento-item" data-value="${d}">${d}</div>`).join('');
        document.querySelectorAll('.departamento-item').forEach(item => {
            item.addEventListener('click', function () {
                sel.querySelector('.departamento-text').textContent = this.dataset.value;
                input.value = this.dataset.value;
                drop.style.display = 'none'; sel.classList.remove('active');
            });
        });
    }
    sel.addEventListener('click', function () {
        const isOpen = drop.style.display === 'block';
        drop.style.display = isOpen ? 'none' : 'block';
        sel.classList.toggle('active', !isOpen);
        if (!isOpen) { search.value = ''; renderDepartamentos(); search.focus(); }
    });
    search.addEventListener('input', function () { renderDepartamentos(this.value); });
    document.addEventListener('click', function (e) {
        if (!sel.contains(e.target) && !drop.contains(e.target)) { drop.style.display = 'none'; sel.classList.remove('active'); }
    });
    renderDepartamentos();
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDepartamentoSelector); }
else { initDepartamentoSelector(); }

// ===== INSTITUCION SELECTOR =====
let instituciones = [];
let institucionSelectorEl = null, institucionDropdownEl = null, institucionInputEl = null;

async function loadInstitucionesFromFirebase() {
    const checkFirebase = () => new Promise(resolve => { const c = () => { if (window.firebaseDB) resolve(); else setTimeout(c, 100); }; c(); });
    await checkFirebase();
    try {
        const snapshot = await window.firebaseDB.collection('instituciones').orderBy('nombre').get();
        instituciones = [];
        snapshot.forEach(doc => {
            const d = doc.data();
            instituciones.push({ name: d.nombre, fullName: d.descripcion || d.nombre, logo: d.logoUrl || '../Elementos/img/logo1.png' });
        });
        if (instituciones.length === 0) instituciones = [{ name: 'SEAMOSGENIOS', fullName: 'Seamos Genios', logo: '../Elementos/img/logo1.png' }];
    } catch (e) {
        instituciones = [{ name: 'SEAMOSGENIOS', fullName: 'Seamos Genios', logo: '../Elementos/img/logo1.png' }];
    }
    renderInstitucionesList();
}

function renderInstitucionesList() {
    const list = document.getElementById('institucionList');
    if (!list) return;
    list.innerHTML = instituciones.map(inst => `
        <div class="institucion-item" data-value="${inst.name}">
            <img src="${inst.logo}" alt="${inst.name}" class="institucion-logo" onerror="this.src='../Elementos/img/logo1.png'">
            <div class="institucion-info"><div class="institucion-name">${inst.name}</div><div class="institucion-description">${inst.fullName}</div></div>
        </div>`).join('');
    document.querySelectorAll('.institucion-item').forEach(item => {
        item.addEventListener('click', function () {
            if (!institucionSelectorEl || !institucionInputEl) return;
            institucionSelectorEl.querySelector('.institucion-text').textContent = this.dataset.value;
            institucionInputEl.value = this.dataset.value;
            institucionDropdownEl.style.display = 'none'; institucionSelectorEl.classList.remove('active');
        });
    });
}

function initInstitucionSelector() {
    institucionSelectorEl = document.getElementById('institucionSelector');
    institucionDropdownEl = document.getElementById('institucionDropdown');
    institucionInputEl = document.getElementById('institucion');
    if (!institucionSelectorEl) return;
    loadInstitucionesFromFirebase();
    institucionSelectorEl.addEventListener('click', function () {
        const isOpen = institucionDropdownEl.style.display === 'block';
        institucionDropdownEl.style.display = isOpen ? 'none' : 'block';
        institucionSelectorEl.classList.toggle('active', !isOpen);
    });
    document.addEventListener('click', function (e) {
        if (!institucionSelectorEl.contains(e.target) && !institucionDropdownEl.contains(e.target)) {
            institucionDropdownEl.style.display = 'none'; institucionSelectorEl.classList.remove('active');
        }
    });
}

if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initInstitucionSelector); }
else { initInstitucionSelector(); }

// ===== GENERATE CREDENTIALS IMAGE =====
async function generateCredentialsImage(email, password, recoveryCode, nombre) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 800; canvas.height = 600;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#667eea'); gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
        ctx.fillText('Seamos Genios', 400, 80);
        ctx.font = '24px Arial'; ctx.fillText('Credenciales de Acceso', 400, 120);
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        if (ctx.roundRect) { ctx.roundRect(50, 160, 700, 380, 15); ctx.fill(); }
        else { ctx.fillRect(50, 160, 700, 380); }
        ctx.fillStyle = '#333333'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'left';
        ctx.fillText('Nombre:', 100, 220);
        ctx.font = '18px Arial'; ctx.fillStyle = '#555555'; ctx.fillText(nombre.toUpperCase(), 100, 250);
        ctx.fillStyle = '#333333'; ctx.font = 'bold 20px Arial'; ctx.fillText('Usuario:', 100, 300);
        ctx.font = '18px Arial'; ctx.fillStyle = '#555555'; ctx.fillText(email, 100, 330);
        ctx.fillStyle = '#333333'; ctx.font = 'bold 20px Arial'; ctx.fillText('Contraseña:', 100, 380);
        ctx.font = '18px Arial'; ctx.fillStyle = '#555555'; ctx.fillText(password, 100, 410);
        ctx.fillStyle = '#333333'; ctx.font = 'bold 20px Arial'; ctx.fillText('Código de Recuperación:', 100, 460);
        ctx.font = '18px Arial'; ctx.fillStyle = '#d32f2f'; ctx.fillText(recoveryCode, 100, 490);
        ctx.fillStyle = '#666666'; ctx.font = 'italic 14px Arial'; ctx.textAlign = 'center';
        ctx.fillText('⚠️ Guarda esta imagen en un lugar seguro', 400, 560);
        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = `credenciales_${email.split('@')[0]}.png`;
            document.body.appendChild(link); link.click();
            document.body.removeChild(link); URL.revokeObjectURL(url);
            resolve();
        });
    });
}
