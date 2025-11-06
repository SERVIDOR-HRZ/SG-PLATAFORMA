// ImgBB API configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// Current user
let currentUser = null;
let currentWeekStart = null;
let currentWeekEnd = null;
let selectedProfesorId = null;
let selectedPagoData = null;

// Get Firebase DB reference
function getDB() {
    return window.firebaseDB;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    initializeWeek();
    setupEventListeners();
    // Solo cargar tarifas al inicio, los pagos se cargan cuando se cambia al tab
    await loadTarifas();
});

// Check authentication and permissions
async function checkAuth() {
    const sessionUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (!sessionUser.id || sessionUser.tipoUsuario !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    try {
        // Esperar a que Firebase esté listo
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

        const userDoc = await window.firebaseDB.collection('usuarios').doc(sessionUser.id).get();
        if (!userDoc.exists) {
            window.location.href = '../index.html';
            return;
        }

        currentUser = { id: userDoc.id, ...userDoc.data() };

        // Solo superusuarios pueden acceder
        if (currentUser.rol !== 'superusuario') {
            showNotification('error', 'Acceso Denegado', 'No tienes permisos para acceder a esta sección');
            setTimeout(() => {
                window.location.href = 'Panel_Admin.html';
            }, 2000);
            return;
        }

        updateUserInfo();
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = '../index.html';
    }
}

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

// Update user info in header
function updateUserInfo() {
    const userName = document.getElementById('userName');
    const userAvatarDefault = document.getElementById('userAvatarDefault');
    const userAvatarImage = document.getElementById('userAvatarImage');

    if (currentUser) {
        userName.textContent = currentUser.nombre || 'Usuario';

        if (currentUser.fotoPerfil) {
            userAvatarImage.src = currentUser.fotoPerfil;
            userAvatarImage.style.display = 'block';
            userAvatarDefault.style.display = 'none';
        }
    }
}

// Initialize week dates
function initializeWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Lunes como inicio

    currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + diff);
    currentWeekStart.setHours(0, 0, 0, 0);

    currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    updateWeekDisplay();
}

// Update week display
function updateWeekDisplay() {
    const weekRangePagos = document.getElementById('weekRangePagos');
    const options = { day: 'numeric', month: 'short' };
    const start = currentWeekStart.toLocaleDateString('es-ES', options);
    const end = currentWeekEnd.toLocaleDateString('es-ES', options);
    weekRangePagos.textContent = `${start} - ${end}`;
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'Panel_Admin.html';
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Week navigation
    document.getElementById('prevWeekPagos').addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() - 7);
        currentWeekEnd.setDate(currentWeekEnd.getDate() - 7);
        updateWeekDisplay();
        loadPagosSemana();
    });

    document.getElementById('nextWeekPagos').addEventListener('click', () => {
        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        currentWeekEnd.setDate(currentWeekEnd.getDate() + 7);
        updateWeekDisplay();
        loadPagosSemana();
    });

    // Actualizar tarifas
    document.getElementById('btnActualizarTarifas').addEventListener('click', loadTarifas);

    // Modal tarifa
    document.getElementById('closeModalTarifa').addEventListener('click', closeModalTarifa);
    document.getElementById('cancelarTarifa').addEventListener('click', closeModalTarifa);
    document.getElementById('formEditarTarifa').addEventListener('submit', handleSaveTarifa);

    // Modal pago
    document.getElementById('closeModalPago').addEventListener('click', closeModalPago);
    document.getElementById('cancelarPago').addEventListener('click', closeModalPago);
    document.getElementById('formRegistrarPago').addEventListener('submit', handleRegistrarPago);

    // File upload
    document.getElementById('comprobantePago').addEventListener('change', handleFileSelect);
    document.getElementById('removeFile').addEventListener('click', removeFile);

    // Modal comprobante
    document.getElementById('closeModalComprobante').addEventListener('click', closeModalComprobante);

    // Notification modal
    document.getElementById('notificationBtn').addEventListener('click', closeNotification);

    // Filtros historial
    document.getElementById('filtroProfesor').addEventListener('change', loadHistorial);
    document.getElementById('filtroMes').addEventListener('change', loadHistorial);
}

// Switch tabs
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    document.getElementById(`${tab}Tab`).classList.add('active');

    if (tab === 'tarifas') {
        loadTarifas();
    } else if (tab === 'pagos') {
        loadPagosSemana();
    } else if (tab === 'historial') {
        loadHistorial();
    }
}

// Load tarifas
async function loadTarifas() {
    const tarifasGrid = document.getElementById('tarifasGrid');
    tarifasGrid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        // Obtener todos los profesores (usuarios admin con rol profesor)
        const profesoresSnapshot = await getDB().collection('usuarios')
            .where('tipoUsuario', '==', 'admin')
            .get();

        // Filtrar solo los que tienen rol profesor
        const profesoresDocs = profesoresSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.rol === 'profesor' || data.rol === 'admin';
        });

        if (profesoresDocs.length === 0) {
            tarifasGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-person-x"></i>
                    <h3>No hay profesores registrados</h3>
                    <p>Registra profesores para asignarles tarifas</p>
                </div>
            `;
            return;
        }

        tarifasGrid.innerHTML = '';

        for (const doc of profesoresDocs) {
            const profesor = { id: doc.id, ...doc.data() };
            const tarifaCard = createTarifaCard(profesor);
            tarifasGrid.appendChild(tarifaCard);
        }
    } catch (error) {
        console.error('Error loading tarifas:', error);
        tarifasGrid.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar tarifas</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Create tarifa card
function createTarifaCard(profesor) {
    const card = document.createElement('div');
    card.className = 'tarifa-card';

    const tarifa = profesor.tarifaPorHora || 0;
    const avatarUrl = profesor.fotoPerfil || '';

    const avatarHTML = avatarUrl
        ? `<img src="${avatarUrl}" alt="${profesor.nombre}" class="profesor-avatar">`
        : `<div class="profesor-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.8rem; font-weight: bold; width: 70px; height: 70px; border-radius: 50%; border: 3px solid #e8ebff; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15); flex-shrink: 0;">${profesor.nombre.charAt(0).toUpperCase()}</div>`;

    const emailDisplay = profesor.email || profesor.usuario || 'Sin email';
    const rolDisplay = profesor.rol === 'profesor' ? 'Profesor' : profesor.rol === 'admin' ? 'Administrador' : 'Docente';

    card.innerHTML = `
        <div class="profesor-header">
            ${avatarHTML}
            <div class="profesor-info">
                <h3>${profesor.nombre}</h3>
                <p class="profesor-email">${emailDisplay}</p>
                <span class="profesor-rol-badge">${rolDisplay}</span>
            </div>
        </div>
        <div class="tarifa-info">
            <div class="tarifa-label">Tarifa por Hora</div>
            <div class="tarifa-valor">$${formatNumber(tarifa)}</div>
        </div>
        <div class="tarifa-actions">
            <button class="btn-primary" onclick="openEditTarifa('${profesor.id}')">
                <i class="bi bi-pencil"></i>
                Editar Tarifa
            </button>
        </div>
    `;

    return card;
}

// Open edit tarifa modal
async function openEditTarifa(profesorId) {
    try {
        const profesorDoc = await getDB().collection('usuarios').doc(profesorId).get();
        if (!profesorDoc.exists) return;

        const profesor = { id: profesorDoc.id, ...profesorDoc.data() };
        selectedProfesorId = profesorId;

        const avatarUrl = profesor.fotoPerfil || '';
        const avatarContainer = document.getElementById('modalProfesorAvatar');

        if (avatarUrl) {
            avatarContainer.src = avatarUrl;
            avatarContainer.style.display = 'block';
        } else {
            avatarContainer.style.display = 'none';
            // Crear avatar con inicial si no hay foto
            const avatarParent = avatarContainer.parentElement;
            const existingInitial = avatarParent.querySelector('.avatar-initial');
            if (existingInitial) existingInitial.remove();

            const initialDiv = document.createElement('div');
            initialDiv.className = 'avatar-initial';
            initialDiv.style.cssText = 'width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;';
            initialDiv.textContent = profesor.nombre.charAt(0).toUpperCase();
            avatarParent.insertBefore(initialDiv, avatarContainer);
        }
        document.getElementById('modalProfesorNombre').textContent = profesor.nombre;
        document.getElementById('modalProfesorEmail').textContent = profesor.email;
        document.getElementById('tarifaHora').value = profesor.tarifaPorHora || 0;

        document.getElementById('modalEditarTarifa').classList.add('active');
    } catch (error) {
        console.error('Error opening edit tarifa:', error);
        showNotification('error', 'Error', 'No se pudo cargar la información del profesor');
    }
}

// Close modal tarifa
function closeModalTarifa() {
    document.getElementById('modalEditarTarifa').classList.remove('active');
    document.getElementById('formEditarTarifa').reset();
    selectedProfesorId = null;
}

// Handle save tarifa
async function handleSaveTarifa(e) {
    e.preventDefault();

    const tarifa = parseFloat(document.getElementById('tarifaHora').value);

    if (tarifa < 0) {
        showNotification('error', 'Error', 'La tarifa no puede ser negativa');
        return;
    }

    try {
        await getDB().collection('usuarios').doc(selectedProfesorId).update({
            tarifaPorHora: tarifa,
            tarifaActualizadaEn: firebase.firestore.FieldValue.serverTimestamp(),
            tarifaActualizadaPor: currentUser.id
        });

        showNotification('success', 'Tarifa Actualizada', 'La tarifa por hora se ha actualizado correctamente');
        closeModalTarifa();
        loadTarifas();
    } catch (error) {
        console.error('Error saving tarifa:', error);
        showNotification('error', 'Error', 'No se pudo actualizar la tarifa');
    }
}

// Load pagos semana
async function loadPagosSemana() {
    const pagosGrid = document.getElementById('pagosGrid');
    pagosGrid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        // Obtener todos los profesores (usuarios admin con rol profesor)
        const profesoresSnapshot = await getDB().collection('usuarios')
            .where('tipoUsuario', '==', 'admin')
            .get();

        // Filtrar solo los que tienen rol profesor
        const profesoresDocs = profesoresSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.rol === 'profesor' || data.rol === 'admin';
        });

        if (profesoresDocs.length === 0) {
            pagosGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-person-x"></i>
                    <h3>No hay profesores registrados</h3>
                </div>
            `;
            return;
        }

        pagosGrid.innerHTML = '';

        for (const doc of profesoresDocs) {
            const profesor = { id: doc.id, ...doc.data() };

            // Calcular clases de la semana
            const clasesData = await calcularClasesSemana(profesor.id);

            // Verificar si ya existe un pago para esta semana
            const pagoExistente = await verificarPagoSemana(profesor.id);

            const pagoCard = createPagoCard(profesor, clasesData, pagoExistente);
            pagosGrid.appendChild(pagoCard);
        }
    } catch (error) {
        console.error('Error loading pagos:', error);
        pagosGrid.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar pagos</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Calcular clases de la semana
async function calcularClasesSemana(profesorId) {
    try {
        let totalClases = 0;
        let totalMinutos = 0;

        // Buscar en la colección 'clases_programadas'
        try {
            const clasesSnapshot = await getDB().collection('clases_programadas')
                .where('tutorId', '==', profesorId)
                .get();

            clasesSnapshot.forEach(doc => {
                const clase = doc.data();

                // Solo contar clases confirmadas
                if (clase.estado !== 'confirmada') {
                    return;
                }

                // Verificar si la clase está en el rango de la semana
                let fechaClase;
                if (clase.fecha && clase.fecha.toDate) {
                    fechaClase = clase.fecha.toDate();
                } else if (clase.fecha) {
                    fechaClase = new Date(clase.fecha + 'T00:00:00');
                } else {
                    return;
                }

                if (fechaClase >= currentWeekStart && fechaClase <= currentWeekEnd) {
                    totalClases++;

                    if (clase.duracion) {
                        totalMinutos += clase.duracion;
                    }
                }
            });
        } catch (error) {
            console.error('Error buscando clases:', error);
        }

        const totalHoras = totalMinutos / 60;

        return {
            totalClases,
            totalHoras: totalHoras.toFixed(2),
            totalMinutos
        };
    } catch (error) {
        console.error('Error calculando clases:', error);
        return { totalClases: 0, totalHoras: 0, totalMinutos: 0 };
    }
}

// Verificar pago de la semana
async function verificarPagoSemana(profesorId) {
    try {
        const pagosSnapshot = await getDB().collection('pagos')
            .where('profesorId', '==', profesorId)
            .where('semanaInicio', '==', firebase.firestore.Timestamp.fromDate(currentWeekStart))
            .where('semanaFin', '==', firebase.firestore.Timestamp.fromDate(currentWeekEnd))
            .limit(1)
            .get();

        if (!pagosSnapshot.empty) {
            return { id: pagosSnapshot.docs[0].id, ...pagosSnapshot.docs[0].data() };
        }

        return null;
    } catch (error) {
        console.error('Error verificando pago:', error);
        return null;
    }
}

// Create pago card
function createPagoCard(profesor, clasesData, pagoExistente) {
    const card = document.createElement('div');
    card.className = 'pago-card';

    const tarifa = profesor.tarifaPorHora || 0;
    const totalPagar = tarifa * parseFloat(clasesData.totalHoras);
    const avatarUrl = profesor.fotoPerfil || '';

    const status = pagoExistente ? 'pagado' : 'pendiente';
    const statusText = pagoExistente ? 'Pagado' : 'Pendiente';

    const avatarHTML = avatarUrl
        ? `<img src="${avatarUrl}" alt="${profesor.nombre}" class="profesor-avatar">`
        : `<div class="profesor-avatar" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold; width: 60px; height: 60px; border-radius: 50%; border: 3px solid #e8ebff; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15); flex-shrink: 0;">${profesor.nombre.charAt(0).toUpperCase()}</div>`;

    const emailDisplay = profesor.email || profesor.usuario || 'Sin email';

    card.innerHTML = `
        <div class="pago-header">
            <div class="pago-profesor">
                ${avatarHTML}
                <div class="profesor-info">
                    <h3>${profesor.nombre}</h3>
                    <p class="profesor-email">${emailDisplay}</p>
                </div>
            </div>
            <span class="pago-status ${status}">${statusText}</span>
        </div>
        <div class="pago-detalles">
            <div class="detalle-item">
                <div class="detalle-label">Clases Dictadas</div>
                <div class="detalle-valor">${clasesData.totalClases}</div>
            </div>
            <div class="detalle-item">
                <div class="detalle-label">Horas Totales</div>
                <div class="detalle-valor">${clasesData.totalHoras}h</div>
            </div>
            <div class="detalle-item">
                <div class="detalle-label">Tarifa/Hora</div>
                <div class="detalle-valor">$${formatNumber(tarifa)}</div>
            </div>
        </div>
        <div class="pago-total">
            <span class="pago-total-label">Total a Pagar:</span>
            <span class="pago-total-valor">$${formatNumber(totalPagar)}</span>
        </div>
        <div class="pago-actions">
            ${!pagoExistente && clasesData.totalClases > 0 ? `
                <button class="btn-primary" onclick="openRegistrarPago('${profesor.id}', ${JSON.stringify(clasesData).replace(/"/g, '&quot;')}, ${tarifa})">
                    <i class="bi bi-check-circle"></i>
                    Registrar Pago
                </button>
            ` : ''}
            ${pagoExistente ? `
                <button class="btn-icon view" onclick="verComprobante('${pagoExistente.comprobanteUrl}')">
                    <i class="bi bi-eye"></i>
                </button>
            ` : ''}
        </div>
    `;

    return card;
}

// Open registrar pago modal
async function openRegistrarPago(profesorId, clasesData, tarifa) {
    try {
        const profesorDoc = await getDB().collection('usuarios').doc(profesorId).get();
        if (!profesorDoc.exists) return;

        const profesor = { id: profesorDoc.id, ...profesorDoc.data() };
        selectedPagoData = {
            profesorId,
            clasesData,
            tarifa,
            profesor
        };

        const avatarUrl = profesor.fotoPerfil || '';
        const avatarContainer = document.getElementById('modalPagoProfesorAvatar');

        if (avatarUrl) {
            avatarContainer.src = avatarUrl;
            avatarContainer.style.display = 'block';
        } else {
            avatarContainer.style.display = 'none';
            // Crear avatar con inicial si no hay foto
            const avatarParent = avatarContainer.parentElement;
            const existingInitial = avatarParent.querySelector('.avatar-initial');
            if (existingInitial) existingInitial.remove();

            const initialDiv = document.createElement('div');
            initialDiv.className = 'avatar-initial';
            initialDiv.style.cssText = 'width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;';
            initialDiv.textContent = profesor.nombre.charAt(0).toUpperCase();
            avatarParent.insertBefore(initialDiv, avatarContainer);
        }
        document.getElementById('modalPagoProfesorNombre').textContent = profesor.nombre;
        document.getElementById('modalPagoProfesorEmail').textContent = profesor.email;

        document.getElementById('resumenClases').textContent = clasesData.totalClases;
        document.getElementById('resumenHoras').textContent = `${clasesData.totalHoras}h`;
        document.getElementById('resumenTarifa').textContent = `$${formatNumber(tarifa)}`;

        const total = tarifa * parseFloat(clasesData.totalHoras);
        document.getElementById('resumenTotal').textContent = `$${formatNumber(total)}`;

        document.getElementById('modalRegistrarPago').classList.add('active');
    } catch (error) {
        console.error('Error opening registrar pago:', error);
        showNotification('error', 'Error', 'No se pudo cargar la información del pago');
    }
}

// Close modal pago
function closeModalPago() {
    document.getElementById('modalRegistrarPago').classList.remove('active');
    document.getElementById('formRegistrarPago').reset();
    removeFile();
    selectedPagoData = null;
}

// Handle file select
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showNotification('error', 'Error', 'Por favor selecciona una imagen válida');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImage').src = e.target.result;
        document.getElementById('filePreview').style.display = 'block';
        document.querySelector('.file-upload-label').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

// Remove file
function removeFile() {
    document.getElementById('comprobantePago').value = '';
    document.getElementById('filePreview').style.display = 'none';
    document.querySelector('.file-upload-label').style.display = 'flex';
}

// Handle registrar pago
async function handleRegistrarPago(e) {
    e.preventDefault();

    const fileInput = document.getElementById('comprobantePago');
    const notas = document.getElementById('notasPago').value;

    if (!fileInput.files[0]) {
        showNotification('error', 'Error', 'Debes subir un comprobante de pago');
        return;
    }

    const btnConfirmar = document.getElementById('btnConfirmarPago');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="bi bi-hourglass-split"></i> Subiendo...';

    try {
        // Subir imagen a ImgBB
        const comprobanteUrl = await uploadToImgBB(fileInput.files[0]);

        if (!comprobanteUrl) {
            throw new Error('No se pudo subir el comprobante');
        }

        // Calcular total
        const total = selectedPagoData.tarifa * parseFloat(selectedPagoData.clasesData.totalHoras);

        // Guardar pago en Firestore
        await getDB().collection('pagos').add({
            profesorId: selectedPagoData.profesorId,
            profesorNombre: selectedPagoData.profesor.nombre,
            profesorEmail: selectedPagoData.profesor.email,
            semanaInicio: firebase.firestore.Timestamp.fromDate(currentWeekStart),
            semanaFin: firebase.firestore.Timestamp.fromDate(currentWeekEnd),
            clasesTotales: selectedPagoData.clasesData.totalClases,
            horasTotales: parseFloat(selectedPagoData.clasesData.totalHoras),
            tarifaPorHora: selectedPagoData.tarifa,
            totalPagado: total,
            comprobanteUrl: comprobanteUrl,
            notas: notas,
            pagadoPor: currentUser.id,
            pagadoPorNombre: currentUser.nombre,
            fechaPago: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('success', 'Pago Registrado', 'El pago se ha registrado correctamente');
        closeModalPago();
        loadPagosSemana();
    } catch (error) {
        console.error('Error registrando pago:', error);
        showNotification('error', 'Error', 'No se pudo registrar el pago: ' + error.message);
    } finally {
        btnConfirmar.disabled = false;
        btnConfirmar.innerHTML = '<i class="bi bi-check-circle"></i> Confirmar Pago';
    }
}

// Upload to ImgBB
async function uploadToImgBB(file) {
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
        console.error('Error uploading to ImgBB:', error);
        throw error;
    }
}

// Load historial
async function loadHistorial() {
    const historialList = document.getElementById('historialList');
    historialList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const filtroProfesor = document.getElementById('filtroProfesor').value;
        const filtroMes = document.getElementById('filtroMes').value;

        let query = getDB().collection('pagos').orderBy('fechaPago', 'desc');

        if (filtroProfesor) {
            query = query.where('profesorId', '==', filtroProfesor);
        }

        if (filtroMes) {
            const [year, month] = filtroMes.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);

            query = query
                .where('fechaPago', '>=', firebase.firestore.Timestamp.fromDate(startDate))
                .where('fechaPago', '<=', firebase.firestore.Timestamp.fromDate(endDate));
        }

        const pagosSnapshot = await query.get();

        if (pagosSnapshot.empty) {
            historialList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h3>No hay pagos registrados</h3>
                    <p>Los pagos realizados aparecerán aquí</p>
                </div>
            `;
            return;
        }

        historialList.innerHTML = '';

        pagosSnapshot.forEach(doc => {
            const pago = { id: doc.id, ...doc.data() };
            const historialItem = createHistorialItem(pago);
            historialList.appendChild(historialItem);
        });

        // Cargar profesores para el filtro si no está cargado
        if (document.getElementById('filtroProfesor').options.length === 1) {
            await loadProfesoresFilter();
        }
    } catch (error) {
        console.error('Error loading historial:', error);
        historialList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar historial</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Create historial item
function createHistorialItem(pago) {
    const item = document.createElement('div');
    item.className = 'historial-item';

    const fecha = pago.fechaPago ? pago.fechaPago.toDate() : new Date();
    const dia = fecha.getDate();
    const mes = fecha.toLocaleDateString('es-ES', { month: 'short' });
    const semanaInicio = pago.semanaInicio ? pago.semanaInicio.toDate() : new Date();
    const semanaFin = pago.semanaFin ? pago.semanaFin.toDate() : new Date();

    item.innerHTML = `
        <div class="historial-info">
            <div class="historial-fecha">
                <div class="historial-dia">${dia}</div>
                <div class="historial-mes">${mes}</div>
            </div>
            <div class="historial-detalles">
                <h4>${pago.profesorNombre}</h4>
                <p>Semana: ${semanaInicio.toLocaleDateString('es-ES')} - ${semanaFin.toLocaleDateString('es-ES')}</p>
                <p>${pago.clasesTotales} clases • ${pago.horasTotales}h • $${formatNumber(pago.tarifaPorHora)}/h</p>
            </div>
        </div>
        <div class="historial-monto">$${formatNumber(pago.totalPagado)}</div>
        <div class="historial-actions">
            <button class="btn-icon view" onclick="verComprobante('${pago.comprobanteUrl}')">
                <i class="bi bi-eye"></i>
            </button>
        </div>
    `;

    return item;
}

// Load profesores filter
async function loadProfesoresFilter() {
    try {
        const profesoresSnapshot = await getDB().collection('usuarios')
            .where('tipoUsuario', '==', 'admin')
            .get();

        const filtroProfesor = document.getElementById('filtroProfesor');

        // Filtrar y ordenar profesores
        const profesores = [];
        profesoresSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.rol === 'profesor' || data.rol === 'admin') {
                profesores.push({ id: doc.id, ...data });
            }
        });

        profesores.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        profesores.forEach(profesor => {
            const option = document.createElement('option');
            option.value = profesor.id;
            option.textContent = profesor.nombre;
            filtroProfesor.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading profesores filter:', error);
    }
}

// Ver comprobante
function verComprobante(url) {
    document.getElementById('comprobanteImage').src = url;
    document.getElementById('comprobanteLink').href = url;
    document.getElementById('modalVerComprobante').classList.add('active');
}

// Close modal comprobante
function closeModalComprobante() {
    document.getElementById('modalVerComprobante').classList.remove('active');
}

// Show notification
function showNotification(type, title, message) {
    const modal = document.getElementById('notificationModal');
    const icon = document.getElementById('notificationIcon');
    const titleEl = document.getElementById('notificationTitle');
    const messageEl = document.getElementById('notificationMessage');

    icon.className = `notification-icon ${type}`;

    if (type === 'success') {
        icon.innerHTML = '<i class="bi bi-check-circle"></i>';
    } else if (type === 'error') {
        icon.innerHTML = '<i class="bi bi-x-circle"></i>';
    } else if (type === 'warning') {
        icon.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
    }

    titleEl.textContent = title;
    messageEl.textContent = message;

    modal.classList.add('active');
}

// Close notification
function closeNotification() {
    document.getElementById('notificationModal').classList.remove('active');
}

// Format number
function formatNumber(num) {
    return new Intl.NumberFormat('es-CO').format(Math.round(num));
}

// Make functions global
window.openEditTarifa = openEditTarifa;
window.openRegistrarPago = openRegistrarPago;
window.verComprobante = verComprobante;
