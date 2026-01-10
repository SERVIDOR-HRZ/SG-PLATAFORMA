// ImgBB API configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// Current user
let currentUser = null;
let currentWeekStart = null;
let currentWeekEnd = null;
let selectedProfesorId = null;
let selectedPagoData = null;

// Variables para el sistema de aulas
let currentAulaId = null;
let currentAulaData = null;
let aulasDisponibles = [];

// Get Firebase DB reference
function getDB() {
    return window.firebaseDB;
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    initializeWeek();
    setupEventListeners();
    // Inicializar formateo numérico
    inicializarFormateoNumerico();
    // Cargar aulas disponibles
    await loadAulasDisponibles();
});

// ========== SISTEMA DE AULAS ==========

// Cargar aulas disponibles
async function loadAulasDisponibles() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const aulasGrid = document.getElementById('aulasFinanzasGrid');
        aulasGrid.innerHTML = '<div class="loading-aulas"><i class="bi bi-arrow-clockwise spin"></i><p>Cargando aulas...</p></div>';

        // Cargar todas las aulas (superusuario tiene acceso a todas)
        const aulasSnapshot = await db.collection('aulas').orderBy('nombre').get();
        aulasDisponibles = [];
        aulasSnapshot.forEach(doc => {
            aulasDisponibles.push({ id: doc.id, ...doc.data() });
        });

        // Renderizar selector de aulas
        renderAulasSelector();

    } catch (error) {
        console.error('Error al cargar aulas:', error);
        document.getElementById('aulasFinanzasGrid').innerHTML = `
            <div class="no-aulas-message">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar aulas</h3>
                <p>Intenta recargar la página</p>
            </div>
        `;
    }
}

// Renderizar selector de aulas
function renderAulasSelector() {
    const aulasGrid = document.getElementById('aulasFinanzasGrid');

    if (aulasDisponibles.length === 0) {
        aulasGrid.innerHTML = `
            <div class="no-aulas-message">
                <i class="bi bi-door-closed"></i>
                <h3>No hay aulas registradas</h3>
                <p>Crea aulas desde el panel de administración</p>
            </div>
        `;
        return;
    }

    const materiasConfig = {
        'anuncios': { nombre: 'Anuncios Generales', icon: 'bi-megaphone' },
        'matematicas': { nombre: 'Matemáticas', icon: 'bi-calculator' },
        'lectura': { nombre: 'Lectura Crítica', icon: 'bi-book' },
        'sociales': { nombre: 'Ciencias Sociales', icon: 'bi-globe' },
        'naturales': { nombre: 'Ciencias Naturales', icon: 'bi-tree' },
        'ingles': { nombre: 'Inglés', icon: 'bi-translate' }
    };

    aulasGrid.innerHTML = aulasDisponibles.map(aula => {
        const color = aula.color || '#ff0000';
        const materias = aula.materias || [];

        const materiasHTML = materias.map(materiaId => {
            const config = materiasConfig[materiaId];
            if (!config) return '';
            return `<span class="materia-tag ${materiaId}"><i class="bi ${config.icon}"></i> ${config.nombre}</span>`;
        }).join('');

        return `
            <div class="aula-card-finanzas" data-aula-id="${aula.id}" onclick="seleccionarAulaFinanzas('${aula.id}')">
                <div class="aula-card-header" style="background: linear-gradient(135deg, ${color}, ${adjustColorFinanzas(color, -30)})">
                    <i class="bi bi-door-open-fill"></i>
                    <h3>${aula.nombre}</h3>
                </div>
                <div class="aula-card-body">
                    ${aula.descripcion ? `<p>${aula.descripcion}</p>` : ''}
                    <div class="aula-materias-tags">
                        ${materiasHTML || '<span class="text-muted">Sin materias</span>'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Ajustar brillo del color
function adjustColorFinanzas(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Seleccionar un aula
async function seleccionarAulaFinanzas(aulaId) {
    currentAulaId = aulaId;
    currentAulaData = aulasDisponibles.find(a => a.id === aulaId);

    if (!currentAulaData) {
        showNotification('error', 'Error', 'Aula no encontrada');
        return;
    }

    // Mostrar contenedor de finanzas y ocultar selector
    document.getElementById('aulaSelectorContainer').style.display = 'none';
    document.getElementById('finanzasContainer').style.display = 'block';

    // Actualizar info del aula actual
    document.getElementById('aulaActualNombre').textContent = currentAulaData.nombre;
    const aulaInfo = document.getElementById('aulaActualInfo');
    aulaInfo.style.background = `linear-gradient(135deg, ${currentAulaData.color || '#ff0000'}, ${adjustColorFinanzas(currentAulaData.color || '#ff0000', -30)})`;

    // Cargar datos del tab activo (cuentas por defecto)
    await loadCuentas();
}

// Volver al selector de aulas
function volverASelectorAulasFinanzas() {
    currentAulaId = null;
    currentAulaData = null;

    document.getElementById('finanzasContainer').style.display = 'none';
    document.getElementById('aulaSelectorContainer').style.display = 'block';
}

// Hacer funciones globales
window.seleccionarAulaFinanzas = seleccionarAulaFinanzas;
window.volverASelectorAulasFinanzas = volverASelectorAulasFinanzas;

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

    // Botón cambiar aula
    document.getElementById('btnCambiarAula').addEventListener('click', volverASelectorAulasFinanzas);

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Cuentas bancarias
    document.getElementById('btnNuevaCuenta').addEventListener('click', openNuevaCuenta);
    document.getElementById('closeModalCuenta').addEventListener('click', closeModalCuenta);
    document.getElementById('cancelarCuenta').addEventListener('click', closeModalCuenta);
    document.getElementById('formCuenta').addEventListener('submit', handleSaveCuenta);
    
    // Filtros de cuentas
    document.getElementById('filtroTipoCuenta').addEventListener('change', aplicarFiltrosCuentas);
    document.getElementById('filtroBuscarCuenta').addEventListener('input', aplicarFiltrosCuentas);
    document.getElementById('btnLimpiarFiltros').addEventListener('click', limpiarFiltrosCuentas);

    // Movimientos
    document.getElementById('btnNuevoIngreso').addEventListener('click', openNuevoIngreso);
    document.getElementById('btnNuevoGasto').addEventListener('click', openNuevoGasto);
    document.getElementById('closeModalMovimiento').addEventListener('click', closeModalMovimiento);
    document.getElementById('cancelarMovimiento').addEventListener('click', closeModalMovimiento);
    document.getElementById('formMovimiento').addEventListener('submit', handleSaveMovimiento);

    // Filtros de movimientos
    document.getElementById('filtroTipoMovimiento').addEventListener('change', () => {
        loadCategoriasFilterMovimientos();
        loadMovimientos();
    });
    document.getElementById('filtroCuentaMovimiento').addEventListener('change', loadMovimientos);
    document.getElementById('filtroCategoriaMovimiento').addEventListener('change', loadMovimientos);
    document.getElementById('filtroMesMovimiento').addEventListener('change', loadMovimientos);
    
    // Gestionar categorías
    document.getElementById('btnGestionarCategorias').addEventListener('click', openGestionarCategorias);
    document.getElementById('closeModalCategorias').addEventListener('click', closeGestionarCategorias);
    document.getElementById('cerrarCategorias').addEventListener('click', closeGestionarCategorias);
    
    // Modal nueva categoría
    document.getElementById('closeModalNuevaCategoria').addEventListener('click', closeModalNuevaCategoria);
    document.getElementById('cancelarNuevaCategoria').addEventListener('click', closeModalNuevaCategoria);
    document.getElementById('formNuevaCategoria').addEventListener('submit', handleCrearCategoria);

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

    if (tab === 'cuentas') {
        loadCuentas();
    } else if (tab === 'tarifas') {
        loadTarifas();
    } else if (tab === 'pagos') {
        loadPagosSemana();
    } else if (tab === 'historial') {
        loadHistorial();
    } else if (tab === 'movimientos') {
        loadMovimientos();
        loadCuentasFilterMovimientos();
        loadCategoriasFilterMovimientos();
    } else if (tab === 'recompensas') {
        loadRecompensasTab();
    }
}

// Load tarifas (filtrado por profesores del aula)
async function loadTarifas() {
    const tarifasTableBody = document.getElementById('tarifasTableBody');
    tarifasTableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;"><div class="loading"><div class="spinner"></div></div></td></tr>';

    try {
        // Obtener todos los profesores (usuarios admin con rol profesor)
        const profesoresSnapshot = await getDB().collection('usuarios')
            .where('tipoUsuario', '==', 'admin')
            .get();

        // Filtrar solo los que tienen rol profesor y están asignados al aula
        const profesoresDocs = profesoresSnapshot.docs.filter(doc => {
            const data = doc.data();
            if (data.rol !== 'profesor' && data.rol !== 'admin' && data.rol !== 'superusuario') {
                return false;
            }
            
            // Si hay un aula seleccionada, filtrar por profesores asignados a esa aula
            if (currentAulaId) {
                // Superusuarios siempre tienen acceso
                if (data.rol === 'superusuario') return true;
                
                const aulasAsignadas = data.aulasAsignadas || [];
                return aulasAsignadas.some(a => {
                    if (typeof a === 'object' && a.aulaId) return a.aulaId === currentAulaId;
                    return a === currentAulaId;
                });
            }
            
            return true;
        });

        if (profesoresDocs.length === 0) {
            tarifasTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem;">
                        <div class="empty-state">
                            <i class="bi bi-person-x"></i>
                            <h3>No hay profesores asignados a esta aula</h3>
                            <p>Asigna profesores al aula desde la gestión de usuarios</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tarifasTableBody.innerHTML = '';

        for (const doc of profesoresDocs) {
            const profesor = { id: doc.id, ...doc.data() };
            const tarifaRow = createTarifaRow(profesor);
            tarifasTableBody.appendChild(tarifaRow);
        }
    } catch (error) {
        console.error('Error loading tarifas:', error);
        tarifasTableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem;">
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h3>Error al cargar tarifas</h3>
                        <p>${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Create tarifa row
function createTarifaRow(profesor) {
    const row = document.createElement('tr');

    const tarifa = profesor.tarifaPorHora || 0;
    const avatarUrl = profesor.fotoPerfil || '';
    const emailDisplay = profesor.email || profesor.usuario || 'Sin email';
    const rolDisplay = profesor.rol === 'profesor' ? 'Profesor' : profesor.rol === 'admin' ? 'Administrador' : 'Docente';

    const metodoPago = profesor.metodoPago || '';
    const numeroCuenta = profesor.numeroCuenta || '';
    const nombreCuenta = profesor.nombreCuenta || '';

    const avatarHTML = avatarUrl 
        ? `<img src="${avatarUrl}" alt="${profesor.nombre}" class="table-avatar">`
        : `<div class="table-avatar-default">${profesor.nombre.charAt(0).toUpperCase()}</div>`;

    const metodoPagoHTML = metodoPago 
        ? `<span>${metodoPago}</span>`
        : '<span class="text-muted">No especificado</span>';

    const numeroCuentaHTML = numeroCuenta 
        ? `<div class="cuenta-cell">
            <span class="cuenta-text">${numeroCuenta}</span>
            <button class="btn-copy" onclick="copiarTexto('${numeroCuenta}', this)" title="Copiar">
                <i class="bi bi-clipboard"></i>
            </button>
           </div>`
        : '<span class="text-muted">No especificado</span>';

    const nombreCuentaHTML = nombreCuenta 
        ? `<div class="cuenta-cell">
            <span class="cuenta-text">${nombreCuenta}</span>
            <button class="btn-copy" onclick="copiarTexto('${nombreCuenta}', this)" title="Copiar">
                <i class="bi bi-clipboard"></i>
            </button>
           </div>`
        : '<span class="text-muted">No especificado</span>';

    row.innerHTML = `
        <td>
            <div class="profesor-cell">
                ${avatarHTML}
                <div>
                    <strong>${profesor.nombre}</strong>
                </div>
            </div>
        </td>
        <td>${emailDisplay}</td>
        <td><span class="badge-rol">${rolDisplay}</span></td>
        <td class="tarifa-cell">${formatNumber(tarifa)}</td>
        <td>${metodoPagoHTML}</td>
        <td>${numeroCuentaHTML}</td>
        <td>${nombreCuentaHTML}</td>
        <td>
            <button class="btn-icon edit" onclick="openEditTarifa('${profesor.id}')" title="Editar tarifa">
                <i class="bi bi-pencil"></i>
            </button>
        </td>
    `;

    return row;
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
        document.getElementById('tarifaHora').value = (profesor.tarifaPorHora || 0).toLocaleString('es-CO');
        document.getElementById('metodoPago').value = profesor.metodoPago || '';
        document.getElementById('numeroCuenta').value = profesor.numeroCuenta || '';
        document.getElementById('nombreCuenta').value = profesor.nombreCuenta || '';
        
        // Inicializar formateo numérico
        setTimeout(() => inicializarFormateoNumerico(), 100);

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

    const tarifa = obtenerValorNumerico(document.getElementById('tarifaHora'));
    const metodoPago = document.getElementById('metodoPago').value;
    const numeroCuenta = document.getElementById('numeroCuenta').value.trim();
    const nombreCuenta = document.getElementById('nombreCuenta').value.trim();

    if (tarifa < 0) {
        showNotification('error', 'Error', 'La tarifa no puede ser negativa');
        return;
    }

    try {
        await getDB().collection('usuarios').doc(selectedProfesorId).update({
            tarifaPorHora: tarifa,
            metodoPago: metodoPago,
            numeroCuenta: numeroCuenta,
            nombreCuenta: nombreCuenta,
            tarifaActualizadaEn: firebase.firestore.FieldValue.serverTimestamp(),
            tarifaActualizadaPor: currentUser.id
        });

        showNotification('success', 'Información Actualizada', 'La información de pago se ha actualizado correctamente');
        closeModalTarifa();
        loadTarifas();
    } catch (error) {
        console.error('Error saving tarifa:', error);
        showNotification('error', 'Error', 'No se pudo actualizar la información');
    }
}

// Load pagos semana (filtrado por profesores del aula)
async function loadPagosSemana() {
    const pagosTableBody = document.getElementById('pagosTableBody');
    pagosTableBody.innerHTML = '<tr><td colspan="11" style="text-align: center; padding: 2rem;"><div class="loading"><div class="spinner"></div></div></td></tr>';

    try {
        // Obtener todos los profesores (usuarios admin con rol profesor)
        const profesoresSnapshot = await getDB().collection('usuarios')
            .where('tipoUsuario', '==', 'admin')
            .get();

        // Filtrar solo los que tienen rol profesor y están asignados al aula
        const profesoresDocs = profesoresSnapshot.docs.filter(doc => {
            const data = doc.data();
            if (data.rol !== 'profesor' && data.rol !== 'admin' && data.rol !== 'superusuario') {
                return false;
            }
            
            // Si hay un aula seleccionada, filtrar por profesores asignados a esa aula
            if (currentAulaId) {
                // Superusuarios siempre tienen acceso
                if (data.rol === 'superusuario') return true;
                
                const aulasAsignadas = data.aulasAsignadas || [];
                return aulasAsignadas.some(a => {
                    if (typeof a === 'object' && a.aulaId) return a.aulaId === currentAulaId;
                    return a === currentAulaId;
                });
            }
            
            return true;
        });

        if (profesoresDocs.length === 0) {
            pagosTableBody.innerHTML = `
                <tr>
                    <td colspan="11" style="text-align: center; padding: 3rem;">
                        <div class="empty-state">
                            <i class="bi bi-person-x"></i>
                            <h3>No hay profesores asignados a esta aula</h3>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        pagosTableBody.innerHTML = '';

        for (const doc of profesoresDocs) {
            const profesor = { id: doc.id, ...doc.data() };

            // Calcular clases de la semana
            const clasesData = await calcularClasesSemana(profesor.id);

            // Verificar si ya existe un pago para esta semana
            const pagoExistente = await verificarPagoSemana(profesor.id);

            const pagoRow = createPagoRow(profesor, clasesData, pagoExistente);
            pagosTableBody.appendChild(pagoRow);
        }
    } catch (error) {
        console.error('Error loading pagos:', error);
        pagosTableBody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align: center; padding: 3rem;">
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle"></i>
                        <h3>Error al cargar pagos</h3>
                        <p>${error.message}</p>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Calcular clases de la semana (filtrado por aula)
async function calcularClasesSemana(profesorId) {
    try {
        let totalClases = 0;
        let totalMinutos = 0;
        let clasesDetalle = []; // Array para guardar detalles de cada clase

        // Buscar en la colección 'clases_programadas'
        try {
            // Construir query base
            let query = getDB().collection('clases_programadas')
                .where('tutorId', '==', profesorId);
            
            // Si hay un aula seleccionada, filtrar por ella
            if (currentAulaId) {
                query = query.where('aulaId', '==', currentAulaId);
            }

            const clasesSnapshot = await query.get();

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
                    
                    const duracion = clase.duracion || 0;
                    if (duracion) {
                        totalMinutos += duracion;
                    }
                    
                    // Guardar detalle de la clase
                    clasesDetalle.push({
                        fecha: fechaClase,
                        horaInicio: clase.horaInicio || '',
                        horaFin: clase.horaFin || '',
                        titulo: clase.titulo || clase.materia || 'Clase',
                        descripcion: clase.descripcion || '',
                        duracion: duracion,
                        materia: clase.materia || ''
                    });
                }
            });
        } catch (error) {
            console.error('Error buscando clases:', error);
        }

        // Ordenar clases por fecha
        clasesDetalle.sort((a, b) => a.fecha - b.fecha);

        const totalHoras = totalMinutos / 60;

        return {
            totalClases,
            totalHoras: totalHoras.toFixed(2),
            totalMinutos,
            clasesDetalle
        };
    } catch (error) {
        console.error('Error calculando clases:', error);
        return { totalClases: 0, totalHoras: 0, totalMinutos: 0, clasesDetalle: [] };
    }
}

// Verificar pago de la semana (compatible con pagos antiguos sin aulaId)
async function verificarPagoSemana(profesorId) {
    try {
        // Buscar pagos de esta semana para este profesor
        const pagosSnapshot = await getDB().collection('pagos')
            .where('profesorId', '==', profesorId)
            .where('semanaInicio', '==', firebase.firestore.Timestamp.fromDate(currentWeekStart))
            .where('semanaFin', '==', firebase.firestore.Timestamp.fromDate(currentWeekEnd))
            .get();

        // Filtrar por aula en cliente (para compatibilidad con pagos antiguos)
        let pagoEncontrado = null;
        pagosSnapshot.forEach(doc => {
            const pago = doc.data();
            // Si hay aula seleccionada, verificar que coincida o que no tenga aulaId (pago antiguo)
            if (currentAulaId) {
                if (pago.aulaId === currentAulaId || !pago.aulaId) {
                    pagoEncontrado = { id: doc.id, ...pago };
                }
            } else {
                pagoEncontrado = { id: doc.id, ...pago };
            }
        });

        return pagoEncontrado;
    } catch (error) {
        console.error('Error verificando pago:', error);
        return null;
    }
}

// Create pago row
function createPagoRow(profesor, clasesData, pagoExistente) {
    const row = document.createElement('tr');

    const tarifa = profesor.tarifaPorHora || 0;
    const totalPagar = tarifa * parseFloat(clasesData.totalHoras);
    const avatarUrl = profesor.fotoPerfil || '';
    const emailDisplay = profesor.email || profesor.usuario || 'Sin email';

    const metodoPago = profesor.metodoPago || '';
    const numeroCuenta = profesor.numeroCuenta || '';
    const nombreCuenta = profesor.nombreCuenta || '';

    // Determinar estado y clase de fila
    let status = 'sin-clases';
    let statusText = 'Sin clases';
    let rowClass = '';
    
    if (pagoExistente) {
        status = 'pagado';
        statusText = 'Pagado';
        rowClass = 'row-pagado';
    } else if (clasesData.totalClases > 0) {
        status = 'pendiente';
        statusText = 'Pendiente';
        rowClass = 'row-pendiente';
    }

    const avatarHTML = avatarUrl 
        ? `<img src="${avatarUrl}" alt="${profesor.nombre}" class="table-avatar">`
        : `<div class="table-avatar-default">${profesor.nombre.charAt(0).toUpperCase()}</div>`;

    const metodoPagoHTML = metodoPago 
        ? `<span>${metodoPago}</span>`
        : '<span class="text-muted">No especificado</span>';

    const numeroCuentaHTML = numeroCuenta 
        ? `<div class="cuenta-cell">
            <span class="cuenta-text">${numeroCuenta}</span>
            <button class="btn-copy" onclick="copiarTexto('${numeroCuenta}', this)" title="Copiar">
                <i class="bi bi-clipboard"></i>
            </button>
           </div>`
        : '<span class="text-muted">No especificado</span>';

    const nombreCuentaHTML = nombreCuenta 
        ? `<div class="cuenta-cell">
            <span class="cuenta-text">${nombreCuenta}</span>
            <button class="btn-copy" onclick="copiarTexto('${nombreCuenta}', this)" title="Copiar">
                <i class="bi bi-clipboard"></i>
            </button>
           </div>`
        : '<span class="text-muted">No especificado</span>';

    // Botones de acción
    let accionesHTML = '';
    if (!pagoExistente && clasesData.totalClases > 0) {
        accionesHTML = `
            <button class="btn-icon edit" onclick="openRegistrarPago('${profesor.id}', ${JSON.stringify(clasesData).replace(/"/g, '&quot;')}, ${tarifa})" title="Registrar pago">
                <i class="bi bi-check-circle"></i>
            </button>
        `;
    } else if (pagoExistente) {
        accionesHTML = `
            <button class="btn-icon view" onclick="verComprobante('${pagoExistente.comprobanteUrl}')" title="Ver comprobante">
                <i class="bi bi-eye"></i>
            </button>
        `;
    } else {
        accionesHTML = '<span class="text-muted">Sin clases</span>';
    }

    // Agregar clase a la fila según el estado
    if (rowClass) {
        row.classList.add(rowClass);
    }

    row.innerHTML = `
        <td>
            <div class="profesor-cell">
                ${avatarHTML}
                <div>
                    <strong>${profesor.nombre}</strong>
                </div>
            </div>
        </td>
        <td>${emailDisplay}</td>
        <td style="text-align: center;">${clasesData.totalClases}</td>
        <td style="text-align: center;">${clasesData.totalHoras}h</td>
        <td class="tarifa-cell">${formatNumber(tarifa)}</td>
        <td class="tarifa-cell" style="font-weight: bold; font-size: 1.1rem;">${formatNumber(totalPagar)}</td>
        <td>${metodoPagoHTML}</td>
        <td>${numeroCuentaHTML}</td>
        <td>${nombreCuentaHTML}</td>
        <td style="text-align: center;">
            <span class="pago-status ${status}">${statusText}</span>
        </td>
        <td style="text-align: center;">
            ${accionesHTML}
        </td>
    `;

    return row;
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
    const cuentaId = document.getElementById('cuentaPagoForm').value;

    if (!fileInput.files[0]) {
        showNotification('error', 'Error', 'Debes subir un comprobante de pago');
        return;
    }

    if (!cuentaId) {
        showNotification('error', 'Error', 'Debes seleccionar una cuenta para realizar el pago');
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

        // Verificar saldo de la cuenta
        const cuentaDoc = await getDB().collection('cuentas_bancarias').doc(cuentaId).get();
        if (!cuentaDoc.exists) {
            throw new Error('Cuenta no encontrada');
        }

        const cuenta = cuentaDoc.data();
        if (cuenta.saldo < total) {
            throw new Error('Saldo insuficiente en la cuenta seleccionada');
        }

        // Descontar saldo de la cuenta
        const nuevoSaldo = cuenta.saldo - total;
        await getDB().collection('cuentas_bancarias').doc(cuentaId).update({
            saldo: nuevoSaldo,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Registrar el gasto en movimientos
        await getDB().collection('movimientos').add({
            tipo: 'gasto',
            cuentaId: cuentaId,
            monto: total,
            categoria: 'Pago a Profesores',
            descripcion: `Pago a ${selectedPagoData.profesor.nombre} - Semana ${currentWeekStart.toLocaleDateString('es-ES')}`,
            fecha: firebase.firestore.Timestamp.now(),
            notas: `${selectedPagoData.clasesData.totalClases} clases, ${selectedPagoData.clasesData.totalHoras}h`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Guardar pago en Firestore
        await getDB().collection('pagos').add({
            profesorId: selectedPagoData.profesorId,
            profesorNombre: selectedPagoData.profesor.nombre || '',
            profesorEmail: selectedPagoData.profesor.email || selectedPagoData.profesor.usuario || '',
            metodoPago: selectedPagoData.profesor.metodoPago || '',
            semanaInicio: firebase.firestore.Timestamp.fromDate(currentWeekStart),
            semanaFin: firebase.firestore.Timestamp.fromDate(currentWeekEnd),
            clasesTotales: selectedPagoData.clasesData.totalClases,
            horasTotales: parseFloat(selectedPagoData.clasesData.totalHoras),
            tarifaPorHora: selectedPagoData.tarifa,
            totalPagado: total,
            comprobanteUrl: comprobanteUrl,
            cuentaId: cuentaId,
            cuentaNombre: cuenta.nombre,
            cuentaTipo: cuenta.tipo || '',
            aulaId: currentAulaId || null,
            aulaNombre: currentAulaData ? currentAulaData.nombre : '',
            notas: notas || '',
            pagadoPor: currentUser.id,
            pagadoPorNombre: currentUser.nombre || '',
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

// Load historial (filtrado por aula - incluye pagos antiguos sin aulaId)
async function loadHistorial() {
    const historialList = document.getElementById('historialList');
    historialList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const filtroProfesor = document.getElementById('filtroProfesor').value;
        const filtroMes = document.getElementById('filtroMes').value;

        // Obtener todos los pagos y filtrar en cliente para evitar índices compuestos
        const pagosSnapshot = await getDB().collection('pagos')
            .orderBy('fechaPago', 'desc')
            .limit(500)
            .get();

        // Filtrar en cliente
        let pagos = [];
        pagosSnapshot.forEach(doc => {
            const pago = { id: doc.id, ...doc.data() };
            
            // Filtrar por aula si hay una seleccionada
            // IMPORTANTE: Incluir pagos antiguos que no tienen aulaId (compatibilidad)
            if (currentAulaId && pago.aulaId && pago.aulaId !== currentAulaId) return;
            
            // Aplicar filtro de profesor
            if (filtroProfesor && pago.profesorId !== filtroProfesor) return;
            
            // Aplicar filtro de mes
            if (filtroMes) {
                const [year, month] = filtroMes.split('-');
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);
                const pagoFecha = pago.fechaPago ? pago.fechaPago.toDate() : new Date();
                
                if (pagoFecha < startDate || pagoFecha > endDate) return;
            }
            
            pagos.push(pago);
        });

        if (pagos.length === 0) {
            historialList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h3>No hay pagos registrados</h3>
                    <p>Los pagos realizados aparecerán aquí</p>
                </div>
            `;
            return;
        }

        // Obtener tipos de cuenta para pagos que no lo tienen
        const cuentasCache = {};
        for (const pago of pagos) {
            if (!pago.cuentaTipo && pago.cuentaId && !cuentasCache[pago.cuentaId]) {
                try {
                    const cuentaDoc = await getDB().collection('cuentas_bancarias').doc(pago.cuentaId).get();
                    if (cuentaDoc.exists) {
                        cuentasCache[pago.cuentaId] = cuentaDoc.data().tipo || '';
                    }
                } catch (e) {
                    console.log('No se pudo obtener cuenta:', pago.cuentaId);
                }
            }
            // Asignar el tipo de cuenta al pago
            if (!pago.cuentaTipo && pago.cuentaId && cuentasCache[pago.cuentaId]) {
                pago.cuentaTipo = cuentasCache[pago.cuentaId];
            }
        }

        historialList.innerHTML = '';

        pagos.forEach(pago => {
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
    
    // Formatear rango de semana más corto
    const semanaInicioStr = semanaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const semanaFinStr = semanaFin.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    
    // Mostrar tipo de cuenta (Nequi, Daviplata, etc.)
    const metodoPagoDisplay = pago.cuentaTipo || pago.metodoPago || 'No especificado';

    item.innerHTML = `
        <div class="historial-header">
            <div class="historial-fecha">
                <div class="historial-fecha-icon">
                    <div class="historial-dia">${dia}</div>
                    <div class="historial-mes">${mes}</div>
                </div>
                <div class="historial-semana">${semanaInicioStr} - ${semanaFinStr}</div>
            </div>
            <div class="historial-status">
                <i class="bi bi-check-circle-fill"></i> Pagado
            </div>
        </div>
        <div class="historial-body">
            <div class="historial-info">
                <div class="historial-avatar-default">
                    <i class="bi bi-person-fill"></i>
                </div>
                <div class="historial-detalles">
                    <h4>${pago.profesorNombre}</h4>
                    <p><i class="bi bi-envelope"></i> ${pago.profesorEmail || 'Sin email'}</p>
                </div>
            </div>
            <div class="historial-stats">
                <div class="historial-stat">
                    <span class="historial-stat-label">Clases</span>
                    <span class="historial-stat-value">${pago.clasesTotales}</span>
                </div>
                <div class="historial-stat">
                    <span class="historial-stat-label">Horas</span>
                    <span class="historial-stat-value">${pago.horasTotales}h</span>
                </div>
                <div class="historial-stat">
                    <span class="historial-stat-label">Tarifa/h</span>
                    <span class="historial-stat-value">$${formatNumber(pago.tarifaPorHora)}</span>
                </div>
            </div>
            <div class="historial-monto-container">
                <span class="historial-monto-label">Total Pagado</span>
                <span class="historial-monto">$${formatNumber(pago.totalPagado)}</span>
            </div>
        </div>
        <div class="historial-footer">
            <div class="historial-metodo">
                <i class="bi bi-credit-card-2-front"></i>
                <strong>${metodoPagoDisplay}</strong>
            </div>
            <div class="historial-actions">
                <button class="btn-icon view" onclick="verComprobante('${pago.comprobanteUrl}')" title="Ver comprobante">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
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

// Copiar texto al portapapeles
function copiarTexto(texto, boton) {
    navigator.clipboard.writeText(texto).then(() => {
        // Cambiar el icono y texto del botón temporalmente
        const iconoOriginal = boton.innerHTML;
        boton.innerHTML = '<i class="bi bi-check"></i>';
        boton.classList.add('copied');
        
        setTimeout(() => {
            boton.innerHTML = iconoOriginal;
            boton.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Error al copiar:', err);
        showNotification('error', 'Error', 'No se pudo copiar el texto');
    });
}

// Make functions global
window.openEditTarifa = openEditTarifa;
window.openRegistrarPago = openRegistrarPago;
window.verComprobante = verComprobante;
window.copiarTexto = copiarTexto;


// ========== INTEGRACIÓN CON CUENTAS BANCARIAS ==========

// Cargar cuentas en select de pago
async function loadCuentasPagoSelect(totalPago) {
    try {
        const db = getDB();
        const cuentasSnapshot = await db.collection('cuentas_bancarias')
            .orderBy('saldo', 'desc')
            .get();

        const select = document.getElementById('cuentaPagoForm');
        select.innerHTML = '<option value="">Seleccionar cuenta</option>';

        cuentasSnapshot.forEach(doc => {
            const cuenta = { id: doc.id, ...doc.data() };
            const option = document.createElement('option');
            option.value = cuenta.id;
            option.textContent = `${cuenta.nombre} - Saldo: $${formatNumber(cuenta.saldo)}`;
            option.dataset.saldo = cuenta.saldo;
            select.appendChild(option);
        });

        // Listener para mostrar advertencia si el saldo es insuficiente
        const existingListener = select.onchange;
        select.onchange = function() {
            const selectedOption = this.options[this.selectedIndex];
            const saldoInfo = document.getElementById('saldoCuentaInfo');
            
            if (selectedOption.value) {
                const saldo = parseFloat(selectedOption.dataset.saldo);
                if (saldo < totalPago) {
                    saldoInfo.textContent = `⚠️ Saldo insuficiente. Faltan $${formatNumber(totalPago - saldo)}`;
                    saldoInfo.className = 'form-help warning';
                } else {
                    saldoInfo.textContent = `✓ Saldo suficiente. Quedarán $${formatNumber(saldo - totalPago)}`;
                    saldoInfo.className = 'form-help success';
                }
            } else {
                saldoInfo.textContent = '';
            }
        };

    } catch (error) {
        console.error('Error loading cuentas:', error);
    }
}

// Modificar la función openRegistrarPago original para incluir cuentas
const originalOpenRegistrarPago = window.openRegistrarPago;
window.openRegistrarPago = async function(profesorId, clasesData, tarifa) {
    await originalOpenRegistrarPago(profesorId, clasesData, tarifa);
    const total = tarifa * parseFloat(clasesData.totalHoras);
    await loadCuentasPagoSelect(total);
};

// ========== GESTIÓN DE CATEGORÍAS ==========

let tipoCategoriasActual = 'ingreso';
let contextoCreacionCategoria = null; // 'modal' o 'formulario'

// Abrir modal gestionar categorías
async function openGestionarCategorias() {
    tipoCategoriasActual = 'ingreso';
    document.getElementById('modalGestionarCategorias').classList.add('active');
    
    // Setup tabs
    document.querySelectorAll('.categoria-tab-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.addEventListener('click', () => {
            document.querySelectorAll('.categoria-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tipoCategoriasActual = btn.dataset.tipo;
            loadCategoriasModal();
        });
    });
    
    document.querySelector('.categoria-tab-btn[data-tipo="ingreso"]').classList.add('active');
    
    await loadCategoriasModal();
}

// Cerrar modal gestionar categorías
function closeGestionarCategorias() {
    document.getElementById('modalGestionarCategorias').classList.remove('active');
    // Recargar movimientos para actualizar filtros
    loadCategoriasFilterMovimientos();
}

// Cargar categorías en el modal
async function loadCategoriasModal() {
    const categoriasListModal = document.getElementById('categoriasListModal');
    categoriasListModal.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        await window.loadCategorias();
        
        const categoriasFiltradas = window.categoriasList.filter(cat => cat.tipo === tipoCategoriasActual);
        
        categoriasListModal.innerHTML = '';
        
        // Botón para agregar nueva categoría
        const btnNuevaCategoria = document.createElement('div');
        btnNuevaCategoria.className = 'categoria-item nueva';
        btnNuevaCategoria.innerHTML = `
            <div class="categoria-info">
                <i class="bi bi-plus-circle"></i>
                <span>Crear nueva categoría</span>
            </div>
        `;
        btnNuevaCategoria.addEventListener('click', () => crearCategoriaDesdModal());
        categoriasListModal.appendChild(btnNuevaCategoria);
        
        if (categoriasFiltradas.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-state-small';
            emptyMsg.innerHTML = `
                <p>No hay categorías de ${tipoCategoriasActual === 'ingreso' ? 'ingresos' : 'gastos'} creadas</p>
            `;
            categoriasListModal.appendChild(emptyMsg);
            return;
        }
        
        // Obtener estadísticas de uso
        const estadisticas = await window.getEstadisticasPorCategoria(tipoCategoriasActual);
        
        categoriasFiltradas.forEach(categoria => {
            const stats = estadisticas[categoria.nombre] || { total: 0, cantidad: 0 };
            const categoriaItem = document.createElement('div');
            categoriaItem.className = 'categoria-item';
            categoriaItem.innerHTML = `
                <div class="categoria-info">
                    <i class="bi bi-tag"></i>
                    <div>
                        <strong>${categoria.nombre}</strong>
                        <small>${stats.cantidad} movimiento${stats.cantidad !== 1 ? 's' : ''} - Total: ${formatNumber(stats.total)}</small>
                    </div>
                </div>
                <div class="categoria-actions">
                    <button class="btn-icon edit" title="Editar categoría">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon delete" title="Eliminar categoría">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
            
            const editBtn = categoriaItem.querySelector('.btn-icon.edit');
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                editarCategoria(categoria.id, categoria.nombre);
            });
            
            const deleteBtn = categoriaItem.querySelector('.btn-icon.delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteCategoria(categoria.id, categoria.nombre, stats.cantidad);
            });
            
            categoriasListModal.appendChild(categoriaItem);
        });
        
    } catch (error) {
        console.error('Error loading categorias:', error);
        categoriasListModal.innerHTML = `
            <div class="empty-state-small">
                <p>Error al cargar categorías</p>
            </div>
        `;
    }
}

// Crear categoría desde el modal
function crearCategoriaDesdModal() {
    const titulo = tipoCategoriasActual === 'ingreso' ? 'Nueva Categoría de Ingreso' : 'Nueva Categoría de Gasto';
    document.getElementById('modalNuevaCategoriaTitulo').textContent = titulo;
    document.getElementById('nombreNuevaCategoria').value = '';
    document.getElementById('editingCategoriaId').value = '';
    document.getElementById('btnCategoriaTxt').textContent = 'Crear Categoría';
    document.getElementById('modalNuevaCategoria').classList.add('active');
    
    // Focus en el input
    setTimeout(() => {
        document.getElementById('nombreNuevaCategoria').focus();
    }, 100);
}

// Editar categoría desde el modal
function editarCategoria(categoriaId, nombreActual) {
    const titulo = tipoCategoriasActual === 'ingreso' ? 'Editar Categoría de Ingreso' : 'Editar Categoría de Gasto';
    document.getElementById('modalNuevaCategoriaTitulo').textContent = titulo;
    document.getElementById('nombreNuevaCategoria').value = nombreActual;
    document.getElementById('editingCategoriaId').value = categoriaId;
    document.getElementById('btnCategoriaTxt').textContent = 'Guardar Cambios';
    document.getElementById('modalNuevaCategoria').classList.add('active');
    
    // Focus en el input
    setTimeout(() => {
        document.getElementById('nombreNuevaCategoria').focus();
    }, 100);
}

// Cerrar modal nueva categoría
function closeModalNuevaCategoria() {
    document.getElementById('modalNuevaCategoria').classList.remove('active');
    document.getElementById('formNuevaCategoria').reset();
    document.getElementById('editingCategoriaId').value = '';
}

// Manejar creación/edición de categoría
async function handleCrearCategoria(e) {
    e.preventDefault();
    
    const nombreCategoria = document.getElementById('nombreNuevaCategoria').value.trim();
    const editingId = document.getElementById('editingCategoriaId').value;
    
    if (!nombreCategoria) {
        showNotification('error', 'Error', 'Por favor ingresa un nombre para la categoría');
        return;
    }
    
    // Verificar si ya existe (excepto si es la misma que estamos editando)
    await window.loadCategorias();
    const existe = window.categoriasList.some(cat => 
        cat.nombre.toLowerCase() === nombreCategoria.toLowerCase() && 
        cat.tipo === tipoCategoriasActual &&
        cat.id !== editingId
    );
    
    if (existe) {
        showNotification('warning', 'Categoría Existente', 'Ya existe una categoría con ese nombre');
        return;
    }

    try {
        const db = getDB();
        
        if (editingId) {
            // Actualizar categoría existente
            const categoriaAnterior = window.categoriasList.find(cat => cat.id === editingId);
            const nombreAnterior = categoriaAnterior ? categoriaAnterior.nombre : '';
            
            await db.collection('categorias_financieras').doc(editingId).update({
                nombre: nombreCategoria,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Actualizar movimientos que usan esta categoría
            if (nombreAnterior && nombreAnterior !== nombreCategoria) {
                const movimientosSnapshot = await db.collection('movimientos')
                    .where('categoria', '==', nombreAnterior)
                    .get();
                
                const batch = db.batch();
                movimientosSnapshot.forEach(doc => {
                    batch.update(doc.ref, { categoria: nombreCategoria });
                });
                await batch.commit();
            }
            
            showNotification('success', 'Categoría Actualizada', 'La categoría se ha actualizado correctamente');
        } else {
            // Crear nueva categoría
            await db.collection('categorias_financieras').add({
                nombre: nombreCategoria,
                tipo: tipoCategoriasActual,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showNotification('success', 'Categoría Creada', 'La categoría se ha creado correctamente');
        }

        closeModalNuevaCategoria();
        
        // Si se creó desde el formulario de movimiento, recargar y seleccionar
        if (contextoCreacionCategoria === 'formulario') {
            await window.loadCategoriasSelect(tipoCategoriasActual);
            document.getElementById('categoriaMovimientoForm').value = nombreCategoria;
            contextoCreacionCategoria = null;
        } else {
            // Si se creó desde el modal de gestión, recargar la lista
            await loadCategoriasModal();
        }
        
        // Recargar filtros
        loadCategoriasFilterMovimientos();
    } catch (error) {
        console.error('Error saving categoria:', error);
        showNotification('error', 'Error', 'No se pudo guardar la categoría');
    }
}

// Eliminar categoría
async function deleteCategoria(categoriaId, nombreCategoria, cantidadMovimientos) {
    if (cantidadMovimientos > 0) {
        if (!confirm(`Esta categoría tiene ${cantidadMovimientos} movimiento${cantidadMovimientos !== 1 ? 's' : ''} asociado${cantidadMovimientos !== 1 ? 's' : ''}. ¿Estás seguro de que deseas eliminarla? Los movimientos no se eliminarán, pero quedarán sin categoría.`)) {
            return;
        }
    } else {
        if (!confirm(`¿Estás seguro de que deseas eliminar la categoría "${nombreCategoria}"?`)) {
            return;
        }
    }

    try {
        const db = getDB();
        await db.collection('categorias_financieras').doc(categoriaId).delete();
        
        showNotification('success', 'Categoría Eliminada', 'La categoría se ha eliminado correctamente');
        await loadCategoriasModal();
        loadCategoriasFilterMovimientos();
    } catch (error) {
        console.error('Error deleting categoria:', error);
        showNotification('error', 'Error', 'No se pudo eliminar la categoría');
    }
}

// Cargar categorías en filtro de movimientos
async function loadCategoriasFilterMovimientos() {
    const select = document.getElementById('filtroCategoriaMovimiento');
    const filtroTipo = document.getElementById('filtroTipoMovimiento').value;
    
    select.innerHTML = '<option value="">Todas las categorías</option>';
    
    await window.loadCategorias();
    
    let categoriasFiltradas = window.categoriasList;
    if (filtroTipo) {
        categoriasFiltradas = categoriasFiltradas.filter(cat => cat.tipo === filtroTipo);
    }
    
    categoriasFiltradas.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.nombre;
        option.textContent = cat.nombre;
        select.appendChild(option);
    });
}

// Abrir modal nueva categoría desde formulario
function openModalNuevaCategoriaDesdeFormulario(tipo) {
    contextoCreacionCategoria = 'formulario';
    tipoCategoriasActual = tipo;
    
    const titulo = tipo === 'ingreso' ? 'Nueva Categoría de Ingreso' : 'Nueva Categoría de Gasto';
    document.getElementById('modalNuevaCategoriaTitulo').textContent = titulo;
    document.getElementById('nombreNuevaCategoria').value = '';
    document.getElementById('modalNuevaCategoria').classList.add('active');
    
    // Focus en el input
    setTimeout(() => {
        document.getElementById('nombreNuevaCategoria').focus();
    }, 100);
}

// Make functions global
window.openGestionarCategorias = openGestionarCategorias;
window.closeGestionarCategorias = closeGestionarCategorias;
window.loadCategoriasFilterMovimientos = loadCategoriasFilterMovimientos;
window.openModalNuevaCategoriaDesdeFormulario = openModalNuevaCategoriaDesdeFormulario;
window.editarCategoria = editarCategoria;

// Función para copiar al portapapeles
function copiarAlPortapapeles(texto, mensaje) {
    navigator.clipboard.writeText(texto).then(() => {
        showNotification('success', 'Copiado', mensaje || 'Texto copiado al portapapeles');
    }).catch(err => {
        console.error('Error al copiar:', err);
        showNotification('error', 'Error', 'No se pudo copiar al portapapeles');
    });
}

// Actualizar openRegistrarPago para incluir datos de pago
const originalOpenRegistrarPagoFunc = openRegistrarPago;
window.openRegistrarPago = async function(profesorId, clasesData, tarifa) {
    try {
        const profesorDoc = await getDB().collection('usuarios').doc(profesorId).get();
        if (!profesorDoc.exists) return;

        const profesor = { id: profesorDoc.id, ...profesorDoc.data() };
        
        // Recalcular clases para obtener los detalles completos con fechas válidas
        const clasesDataCompleto = await calcularClasesSemana(profesorId);
        
        selectedPagoData = {
            profesorId,
            clasesData: clasesDataCompleto,
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
            const avatarParent = avatarContainer.parentElement;
            const existingInitial = avatarParent.querySelector('.avatar-initial');
            if (existingInitial) existingInitial.remove();
            
            const initialDiv = document.createElement('div');
            initialDiv.className = 'avatar-initial';
            initialDiv.style.cssText = 'width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #ff0000 0%, #cc0000 100%); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;';
            initialDiv.textContent = profesor.nombre.charAt(0).toUpperCase();
            avatarParent.insertBefore(initialDiv, avatarContainer);
        }
        
        document.getElementById('modalPagoProfesorNombre').textContent = profesor.nombre;
        document.getElementById('modalPagoProfesorEmail').textContent = profesor.email;

        document.getElementById('resumenClases').textContent = clasesDataCompleto.totalClases;
        document.getElementById('resumenHoras').textContent = `${clasesDataCompleto.totalHoras}h`;
        document.getElementById('resumenTarifa').textContent = `${formatNumber(tarifa)}`;

        const total = tarifa * parseFloat(clasesDataCompleto.totalHoras);
        document.getElementById('resumenTotal').textContent = `${formatNumber(total)}`;

        // Llenar datos de pago del profesor
        const metodoPago = profesor.metodoPago || '';
        const numeroCuenta = profesor.numeroCuenta || '';
        const nombreCuenta = profesor.nombreCuenta || '';

        const metodoPagoEl = document.getElementById('profesorMetodoPago');
        const numeroCuentaEl = document.getElementById('profesorNumeroCuenta');
        const nombreCuentaEl = document.getElementById('profesorNombreCuenta');
        const btnCopyNumero = document.getElementById('btnCopyNumeroCuenta');
        const btnCopyNombre = document.getElementById('btnCopyNombreCuenta');

        if (metodoPago) {
            metodoPagoEl.textContent = metodoPago;
            metodoPagoEl.classList.remove('no-especificado');
        } else {
            metodoPagoEl.textContent = 'No especificado';
            metodoPagoEl.classList.add('no-especificado');
        }

        if (numeroCuenta) {
            numeroCuentaEl.textContent = numeroCuenta;
            numeroCuentaEl.classList.remove('no-especificado');
            btnCopyNumero.style.display = 'flex';
            btnCopyNumero.onclick = () => copiarAlPortapapeles(numeroCuenta, 'Número de cuenta copiado');
        } else {
            numeroCuentaEl.textContent = 'No especificado';
            numeroCuentaEl.classList.add('no-especificado');
            btnCopyNumero.style.display = 'none';
        }

        if (nombreCuenta) {
            nombreCuentaEl.textContent = nombreCuenta;
            nombreCuentaEl.classList.remove('no-especificado');
            btnCopyNombre.style.display = 'flex';
            btnCopyNombre.onclick = () => copiarAlPortapapeles(nombreCuenta, 'Nombre de cuenta copiado');
        } else {
            nombreCuentaEl.textContent = 'No especificado';
            nombreCuentaEl.classList.add('no-especificado');
            btnCopyNombre.style.display = 'none';
        }

        // Generar descripción predeterminada con detalles de clases
        generarDescripcionPago(clasesDataCompleto);

        // Cargar cuentas para pagar
        const totalPago = total;
        await loadCuentasPagoSelect(totalPago);

        document.getElementById('modalRegistrarPago').classList.add('active');
    } catch (error) {
        console.error('Error opening registrar pago:', error);
        showNotification('error', 'Error', 'No se pudo cargar la información del pago');
    }
};

// Función para generar la descripción predeterminada del pago
function generarDescripcionPago(clasesData) {
    const notasPagoEl = document.getElementById('notasPago');
    const clasesDetalleContainer = document.getElementById('clasesDetalleContainer');
    
    // Calcular número de semana del año
    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };
    
    const weekNum = getWeekNumber(currentWeekStart);
    const options = { day: 'numeric', month: 'short' };
    const startStr = currentWeekStart.toLocaleDateString('es-ES', options);
    const endStr = currentWeekEnd.toLocaleDateString('es-ES', options);
    
    // Generar descripción base
    let descripcion = `${clasesData.totalHoras} Horas Totales - Semana ${weekNum} - ${startStr} al ${endStr}`;
    
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    // Si hay detalles de clases, agregarlos
    if (clasesData.clasesDetalle && clasesData.clasesDetalle.length > 0) {
        descripcion += '\n\n';
        
        clasesData.clasesDetalle.forEach((clase, index) => {
            const fecha = clase.fecha;
            if (!fecha || typeof fecha.getDay !== 'function') return;
            
            const diaSemana = diasSemana[fecha.getDay()];
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = meses[fecha.getMonth()];
            
            const horaInicio = clase.horaInicio || '';
            const horaFin = clase.horaFin || '';
            const horario = horaInicio && horaFin ? `(${horaInicio} - ${horaFin})` : '';
            
            const duracionHoras = (clase.duracion / 60).toFixed(1);
            const duracionTexto = duracionHoras == 1 ? '1 hora' : `${duracionHoras} horas`;
            
            const titulo = clase.titulo || clase.materia || 'Clase';
            
            descripcion += `${diaSemana} ${dia} ${mes} ${horario}: ${titulo} (${duracionTexto})`;
            
            if (index < clasesData.clasesDetalle.length - 1) {
                descripcion += '\n';
            }
        });
    }
    
    // Establecer la descripción en el textarea
    notasPagoEl.value = descripcion;
    
    // Mostrar detalles visuales de las clases si existe el contenedor
    if (clasesDetalleContainer && clasesData.clasesDetalle && clasesData.clasesDetalle.length > 0) {
        let detalleHTML = '';
        clasesData.clasesDetalle.forEach(clase => {
            const fecha = clase.fecha;
            if (!fecha || typeof fecha.getDay !== 'function') return;
            
            const diaSemana = diasSemana[fecha.getDay()];
            const dia = fecha.getDate().toString().padStart(2, '0');
            const mes = meses[fecha.getMonth()];
            
            const horaInicio = clase.horaInicio || '';
            const horaFin = clase.horaFin || '';
            const horario = horaInicio && horaFin ? `${horaInicio} - ${horaFin}` : 'Sin horario';
            
            const duracionHoras = (clase.duracion / 60).toFixed(1);
            const duracionTexto = duracionHoras == 1 ? '1 hora' : `${duracionHoras} horas`;
            
            const titulo = clase.titulo || clase.materia || 'Clase';
            
            detalleHTML += `
                <div class="clase-detalle-item">
                    <span class="clase-fecha">${diaSemana} ${dia} ${mes}</span>
                    <span class="clase-horario">(${horario})</span>: 
                    <span class="clase-titulo">${titulo}</span>
                    <span class="clase-duracion"> - ${duracionTexto}</span>
                </div>
            `;
        });
        
        clasesDetalleContainer.innerHTML = detalleHTML;
        clasesDetalleContainer.style.display = 'block';
    } else if (clasesDetalleContainer) {
        clasesDetalleContainer.style.display = 'none';
    }
}

window.copiarAlPortapapeles = copiarAlPortapapeles;
