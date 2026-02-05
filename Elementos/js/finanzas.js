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
    setupSidebarListeners();
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

    // Actualizar info del aula en el sidebar
    document.getElementById('sidebarAulaNombreText').textContent = currentAulaData.nombre;
    const sidebarAulaInfo = document.getElementById('sidebarAulaInfo');
    sidebarAulaInfo.style.display = 'block';

    // Ocultar botones de perfil/web/panel y mostrar menú de navegación
    document.getElementById('sidebarProfileActions').style.display = 'none';
    document.getElementById('sidebarMenu').style.display = 'flex';

    // Cargar datos del tab activo (cuentas por defecto)
    await loadCuentas();
}

// Volver al selector de aulas
function volverASelectorAulasFinanzas() {
    currentAulaId = null;
    currentAulaData = null;

    document.getElementById('finanzasContainer').style.display = 'none';
    document.getElementById('aulaSelectorContainer').style.display = 'block';

    // Ocultar info del aula en sidebar
    document.getElementById('sidebarAulaInfo').style.display = 'none';

    // Mostrar botones de perfil/web/panel y ocultar menú de navegación
    document.getElementById('sidebarProfileActions').style.display = 'flex';
    document.getElementById('sidebarMenu').style.display = 'none';
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
    // Botón cambiar aula en sidebar
    document.getElementById('btnCambiarAulaSidebar').addEventListener('click', volverASelectorAulasFinanzas);

    // Filtros de periodo en cuentas
    document.getElementById('filtroCuentaDashboard').addEventListener('change', () => {
        // Guardar filtro en localStorage
        const cuentaSeleccionada = document.getElementById('filtroCuentaDashboard').value;
        localStorage.setItem('filtroCuentaDashboard', cuentaSeleccionada);
        updateDashboard();
    });
    document.getElementById('filtroAnioCuentas').addEventListener('change', updateDashboard);
    document.getElementById('filtroMesCuentas').addEventListener('change', updateDashboard);

    // Cuentas bancarias
    document.getElementById('btnNuevaCuenta').addEventListener('click', openNuevaCuenta);
    document.getElementById('closeModalCuenta').addEventListener('click', closeModalCuenta);
    document.getElementById('cancelarCuenta').addEventListener('click', closeModalCuenta);
    document.getElementById('formCuenta').addEventListener('submit', handleSaveCuenta);

    // Movimientos
    document.getElementById('btnNuevoIngreso').addEventListener('click', openNuevoIngreso);
    document.getElementById('btnNuevoGasto').addEventListener('click', openNuevoGasto);
    document.getElementById('closeModalMovimiento').addEventListener('click', closeModalMovimiento);
    document.getElementById('cancelarMovimiento').addEventListener('click', closeModalMovimiento);
    document.getElementById('formMovimiento').addEventListener('submit', handleSaveMovimiento);
    
    // Botón Gestionar Inscripciones
    const btnGestionInscripciones = document.getElementById('btnGestionInscripciones');
    if (btnGestionInscripciones) {
        btnGestionInscripciones.addEventListener('click', () => {
            window.location.href = 'Gestion-Inscripciones.html';
        });
    }

    // Filtros de movimientos
    document.getElementById('filtroTipoMovimiento').addEventListener('change', () => {
        loadCategoriasFilterMovimientos();
        loadMovimientos();
    });
    document.getElementById('filtroCuentaMovimiento').addEventListener('change', () => {
        loadMovimientos();
        // Si el resumen está visible, recargarlo
        const resumenContainer = document.getElementById('categoriasResumen');
        if (resumenContainer && resumenContainer.style.display !== 'none') {
            loadResumenCategorias();
        }
    });
    document.getElementById('filtroCategoriaMovimiento').addEventListener('change', loadMovimientos);
    document.getElementById('filtroMesMovimiento').addEventListener('change', () => {
        loadMovimientos();
        // Si el resumen está visible, recargarlo
        const resumenContainer = document.getElementById('categoriasResumen');
        if (resumenContainer && resumenContainer.style.display !== 'none') {
            loadResumenCategorias();
        }
    });
    
    // Ver categorías (resumen)
    document.getElementById('btnVerCategorias').addEventListener('click', toggleResumenCategorias);
    
    // Modal nueva categoría
    document.getElementById('closeModalNuevaCategoria').addEventListener('click', closeModalNuevaCategoria);
    document.getElementById('cancelarNuevaCategoria').addEventListener('click', closeModalNuevaCategoria);
    document.getElementById('formNuevaCategoria').addEventListener('submit', handleCrearCategoria);

    // Nueva categoría desde página
    document.getElementById('btnNuevaCategoriaDesdePagina').addEventListener('click', () => {
        const tipoActivo = document.querySelector('.categoria-tab-btn-pagina.active').dataset.tipo;
        openModalNuevaCategoriaDesdeFormulario(tipoActivo);
    });

    // Tabs de categorías en página
    document.querySelectorAll('.categoria-tab-btn-pagina').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.categoria-tab-btn-pagina').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadCategoriasPagina();
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

    // Buscador de profesores en Tarifas
    document.getElementById('buscarProfesorTarifas').addEventListener('input', filtrarTablaTarifas);
    document.getElementById('btnClearSearchTarifas').addEventListener('click', () => {
        document.getElementById('buscarProfesorTarifas').value = '';
        document.getElementById('btnClearSearchTarifas').style.display = 'none';
        filtrarTablaTarifas();
    });

    // Buscador de profesores en Pagos
    document.getElementById('buscarProfesorPagos').addEventListener('input', filtrarTablaPagos);
    document.getElementById('btnClearSearchPagos').addEventListener('click', () => {
        document.getElementById('buscarProfesorPagos').value = '';
        document.getElementById('btnClearSearchPagos').style.display = 'none';
        filtrarTablaPagos();
    });

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
        // Resetear vista de movimientos
        const resumenContainer = document.getElementById('categoriasResumen');
        const btnVerCategorias = document.getElementById('btnVerCategorias');
        const movimientosList = document.getElementById('movimientosList');
        
        resumenContainer.style.display = 'none';
        movimientosList.style.display = 'grid';
        btnVerCategorias.innerHTML = '<i class="bi bi-pie-chart-fill"></i> Ver Categorías';
        btnVerCategorias.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.9), rgba(75, 0, 130, 0.9))';
        btnVerCategorias.style.borderColor = 'rgba(138, 43, 226, 0.5)';
        
        loadMovimientos();
        loadCuentasFilterMovimientos();
        loadCategoriasFilterMovimientos();
    } else if (tab === 'recompensas') {
        loadRecompensasTab();
    } else if (tab === 'categorias') {
        loadCategoriasPagina();
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
                <td colspan="7" style="text-align: center; padding: 3rem;">
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
    
    // Determinar el texto del rol
    let rolDisplay = 'Profesor';
    let rolClass = 'badge-rol-profesor';
    
    if (profesor.rol === 'superusuario') {
        rolDisplay = 'Super';
        rolClass = 'badge-rol-super';
    }

    const metodoPago = profesor.metodoPago || '';
    const numeroCuenta = profesor.numeroCuenta || '';
    const nombreCuenta = profesor.nombreCuenta || '';
    const codigoQR = profesor.codigoQR || '';

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

    const codigoQRHTML = codigoQR 
        ? `<button class="btn-icon view" onclick="verCodigoQR('${profesor.id}')" title="Ver código QR">
            <i class="bi bi-qr-code"></i>
           </button>`
        : '<span class="text-muted">Sin QR</span>';

    row.innerHTML = `
        <td>
            <div class="profesor-cell">
                ${avatarHTML}
                <div>
                    <strong>${profesor.nombre}</strong>
                    <small class="profesor-email">${emailDisplay}</small>
                </div>
            </div>
        </td>
        <td><span class="badge-rol ${rolClass}">${rolDisplay}</span></td>
        <td class="tarifa-cell">${formatNumber(tarifa)}</td>
        <td>${metodoPagoHTML}</td>
        <td>${numeroCuentaHTML}</td>
        <td>${nombreCuentaHTML}</td>
        <td>${codigoQRHTML}</td>
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
        
        // Cargar código QR si existe
        const qrPreview = document.getElementById('qrPreview');
        const qrPreviewImage = document.getElementById('qrPreviewImage');
        if (profesor.codigoQR) {
            qrPreviewImage.src = profesor.codigoQR;
            qrPreview.style.display = 'block';
        } else {
            qrPreview.style.display = 'none';
        }
        
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
    
    // Restaurar el botón de submit a su estado original
    const btnSubmit = document.querySelector('#formEditarTarifa button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="bi bi-save"></i> Guardar Cambios';
    }
    
    // Limpiar preview del QR
    const qrPreview = document.getElementById('qrPreview');
    const codigoQRInput = document.getElementById('codigoQRInput');
    if (qrPreview) qrPreview.style.display = 'none';
    if (codigoQRInput) codigoQRInput.value = '';
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

    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const originalBtnText = btnSubmit.innerHTML;

    try {
        const updateData = {
            tarifaPorHora: tarifa,
            metodoPago: metodoPago,
            numeroCuenta: numeroCuenta,
            nombreCuenta: nombreCuenta,
            tarifaActualizadaEn: firebase.firestore.FieldValue.serverTimestamp(),
            tarifaActualizadaPor: currentUser.id
        };

        // Si hay un nuevo QR cargado, subirlo
        const qrInput = document.getElementById('codigoQRInput');
        if (qrInput.files && qrInput.files[0]) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i> Subiendo QR...';
            
            const qrUrl = await subirImagenImgBB(qrInput.files[0]);
            updateData.codigoQR = qrUrl.url;
            updateData.codigoQRData = {
                url: qrUrl.url,
                deleteUrl: qrUrl.deleteUrl,
                filename: qrUrl.filename
            };
        }

        await getDB().collection('usuarios').doc(selectedProfesorId).update(updateData);

        showNotification('success', 'Información Actualizada', 'La información de pago se ha actualizado correctamente');
        
        // Restaurar botón antes de cerrar el modal
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
        
        closeModalTarifa();
        loadTarifas();
    } catch (error) {
        console.error('Error saving tarifa:', error);
        showNotification('error', 'Error', 'No se pudo actualizar la información: ' + error.message);
        
        // Restaurar botón en caso de error
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = originalBtnText;
    }
}

// Load pagos semana (filtrado por profesores del aula)
async function loadPagosSemana() {
    const pagosTableBody = document.getElementById('pagosTableBody');
    
    // Limpiar completamente la tabla antes de empezar
    pagosTableBody.innerHTML = '<tr><td colspan="10" style="text-align: center; padding: 2rem;"><div class="loading"><div class="spinner"></div><p style="color: rgba(255,255,255,0.7); margin-top: 1rem;">Cargando pagos...</p></div></td></tr>';

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
                    <td colspan="10" style="text-align: center; padding: 3rem;">
                        <div class="empty-state">
                            <i class="bi bi-person-x" style="font-size: 4rem; color: rgba(255,255,255,0.3); margin-bottom: 1rem;"></i>
                            <h3 style="color: rgba(255,255,255,0.9); margin-bottom: 0.5rem;">No hay profesores asignados a esta aula</h3>
                            <p style="color: rgba(255,255,255,0.6);">Asigna profesores al aula desde la gestión de usuarios</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Crear promesas para procesar todos los profesores en paralelo
        const profesoresPromises = profesoresDocs.map(async (doc) => {
            const profesor = { id: doc.id, ...doc.data() };

            // Ejecutar ambas consultas en paralelo
            const [clasesData, pagoExistente] = await Promise.all([
                calcularClasesSemana(profesor.id),
                verificarPagoSemana(profesor.id)
            ]);

            // Retornar profesor con sus datos de clases y pago
            return { 
                profesor, 
                clasesData, 
                pagoExistente,
                tienePagoPendiente: clasesData.totalClases > 0 && !pagoExistente
            };
        });

        // Esperar a que todas las promesas se resuelvan
        const resultados = await Promise.all(profesoresPromises);

        // Filtrar solo los que tienen pagos pendientes
        const profesoresConPagosPendientes = resultados.filter(r => r.tienePagoPendiente);

        // Limpiar la tabla completamente antes de agregar las nuevas filas
        pagosTableBody.innerHTML = '';

        // Si no hay profesores con pagos pendientes, mostrar mensaje
        if (profesoresConPagosPendientes.length === 0) {
            pagosTableBody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align: center; padding: 3rem;">
                        <div class="empty-state">
                            <i class="bi bi-check-circle" style="font-size: 4rem; color: #28a745; margin-bottom: 1rem;"></i>
                            <h3 style="color: rgba(255,255,255,0.9); margin-bottom: 0.5rem;">No hay pagos pendientes</h3>
                            <p style="color: rgba(255,255,255,0.6);">Todos los profesores con clases en esta semana ya han sido pagados</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            // Agregar todas las filas de una vez usando un fragmento de documento
            const fragment = document.createDocumentFragment();
            profesoresConPagosPendientes.forEach(({ profesor, clasesData }) => {
                const fila = createPagoRow(profesor, clasesData, null);
                fragment.appendChild(fila);
            });
            pagosTableBody.appendChild(fragment);
        }
    } catch (error) {
        console.error('Error loading pagos:', error);
        pagosTableBody.innerHTML = `
            <tr>
                <td colspan="10" style="text-align: center; padding: 3rem;">
                    <div class="empty-state">
                        <i class="bi bi-exclamation-triangle" style="font-size: 4rem; color: #ffc107; margin-bottom: 1rem;"></i>
                        <h3 style="color: rgba(255,255,255,0.9); margin-bottom: 0.5rem;">Error al cargar pagos</h3>
                        <p style="color: rgba(255,255,255,0.6);">${error.message}</p>
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

    const metodoPago = profesor.metodoPago || '';
    const numeroCuenta = profesor.numeroCuenta || '';
    const nombreCuenta = profesor.nombreCuenta || '';

    // Solo mostramos profesores pendientes, así que siempre será pendiente
    const status = 'pendiente';
    const statusText = 'Pendiente';
    row.classList.add('row-pendiente');

    const avatarHTML = avatarUrl 
        ? `<img src="${avatarUrl}" alt="${profesor.nombre}" class="table-avatar">`
        : `<div class="table-avatar-default">${profesor.nombre.charAt(0).toUpperCase()}</div>`;

    const metodoPagoHTML = metodoPago 
        ? `<span>${metodoPago}</span>`
        : '<span class="text-muted">No especificado</span>';

    const numeroCuentaHTML = numeroCuenta 
        ? `<div class="cuenta-cell-table">
            <span class="cuenta-text-table">${numeroCuenta}</span>
            <button class="btn-copy-table" onclick="copiarTexto('${numeroCuenta}', this)" title="Copiar">
                <i class="bi bi-clipboard"></i>
            </button>
           </div>`
        : '<span class="text-muted">No especificado</span>';

    const nombreCuentaHTML = nombreCuenta 
        ? `<div class="cuenta-cell-table">
            <span class="cuenta-text-table">${nombreCuenta}</span>
            <button class="btn-copy-table" onclick="copiarTexto('${nombreCuenta}', this)" title="Copiar">
                <i class="bi bi-clipboard"></i>
            </button>
           </div>`
        : '<span class="text-muted">No especificado</span>';

    // Botón de acción para registrar pago
    const accionesHTML = `
        <button class="btn-icon edit" onclick="openRegistrarPago('${profesor.id}', ${JSON.stringify(clasesData).replace(/"/g, '&quot;')}, ${tarifa})" title="Registrar pago">
            <i class="bi bi-check-circle"></i>
        </button>
    `;

    row.innerHTML = `
        <td>
            <div class="profesor-cell-pagos">
                ${avatarHTML}
                <strong class="profesor-nombre-pagos">${profesor.nombre}</strong>
            </div>
        </td>
        <td style="text-align: center;">${clasesData.totalClases}</td>
        <td style="text-align: center;">${Math.round(parseFloat(clasesData.totalHoras))}h</td>
        <td class="tarifa-cell">${formatNumber(tarifa)}</td>
        <td class="tarifa-cell" style="font-weight: bold; font-size: 1.1rem;">${formatNumber(totalPagar)}</td>
        <td>${metodoPagoHTML}</td>
        <td>${numeroCuentaHTML}</td>
        <td>${nombreCuentaHTML}</td>
        <td style="text-align: center;">
            <span class="pago-status ${status}">${statusText}</span>
        </td>
        <td class="acciones-fija" style="text-align: center;">
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

// Editar categoría (funciona desde cualquier lugar)
function editarCategoria(categoriaId, nombreActual) {
    // Determinar el tipo de categoría
    const categoria = window.categoriasList.find(cat => cat.id === categoriaId);
    if (categoria) {
        tipoCategoriasActual = categoria.tipo;
    }
    
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
        
        // Si estamos en la vista de página de categorías, recargarla
        const categoriasTab = document.getElementById('categoriasTab');
        if (categoriasTab && categoriasTab.classList.contains('active')) {
            await loadCategoriasPagina();
        }
    } catch (error) {
        console.error('Error saving categoria:', error);
        showNotification('error', 'Error', 'No se pudo guardar la categoría');
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

        // Mostrar código QR si existe
        const qrPagoContainer = document.getElementById('qrPagoContainer');
        const qrPagoImage = document.getElementById('qrPagoImage');
        
        if (profesor.codigoQR) {
            qrPagoImage.src = profesor.codigoQR;
            qrPagoContainer.style.display = 'block';
            
            // Agregar evento click para ver QR en tamaño completo
            qrPagoImage.onclick = () => verCodigoQR(profesorId);
        } else {
            qrPagoContainer.style.display = 'none';
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

// ========== FUNCIONES DE BÚSQUEDA DE PROFESORES ==========

// Filtrar tabla de Tarifas
function filtrarTablaTarifas() {
    const searchInput = document.getElementById('buscarProfesorTarifas');
    const btnClear = document.getElementById('btnClearSearchTarifas');
    const countSpan = document.getElementById('countTarifas');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Mostrar/ocultar botón de limpiar
    btnClear.style.display = searchTerm ? 'flex' : 'none';
    
    const rows = document.querySelectorAll('#tarifasTableBody tr');
    let visibleCount = 0;
    let totalCount = 0;
    
    rows.forEach(row => {
        // Ignorar filas de estado vacío o cargando
        if (row.querySelector('.empty-state') || row.querySelector('.loading')) {
            return;
        }
        
        totalCount++;
        
        const nombre = row.querySelector('.profesor-cell strong')?.textContent.toLowerCase() || '';
        const email = row.cells[1]?.textContent.toLowerCase() || '';
        
        const matches = nombre.includes(searchTerm) || email.includes(searchTerm);
        
        row.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    });
    
    // Actualizar contador solo si hay búsqueda activa
    if (searchTerm && totalCount > 0) {
        countSpan.innerHTML = `<strong>${visibleCount}</strong> de ${totalCount}`;
        countSpan.style.display = 'inline-block';
    } else {
        countSpan.textContent = '';
        countSpan.style.display = 'none';
    }
}

// Filtrar tabla de Pagos
function filtrarTablaPagos() {
    const searchInput = document.getElementById('buscarProfesorPagos');
    const btnClear = document.getElementById('btnClearSearchPagos');
    const countSpan = document.getElementById('countPagos');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Mostrar/ocultar botón de limpiar
    btnClear.style.display = searchTerm ? 'flex' : 'none';
    
    const rows = document.querySelectorAll('#pagosTableBody tr');
    let visibleCount = 0;
    let totalCount = 0;
    
    rows.forEach(row => {
        // Ignorar filas de estado vacío o cargando
        if (row.querySelector('.empty-state') || row.querySelector('.loading')) {
            return;
        }
        
        totalCount++;
        
        const nombreElement = row.querySelector('.profesor-nombre-pagos');
        const nombre = nombreElement ? nombreElement.textContent.toLowerCase() : '';
        
        const matches = nombre.includes(searchTerm);
        
        row.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    });
    
    // Actualizar contador solo si hay búsqueda activa
    if (searchTerm && totalCount > 0) {
        countSpan.innerHTML = `<strong>${visibleCount}</strong> de ${totalCount}`;
        countSpan.style.display = 'inline-block';
    } else {
        countSpan.textContent = '';
        countSpan.style.display = 'none';
    }
}

// Limpiar búsqueda al cambiar de tab o recargar datos
function limpiarBusquedaTarifas() {
    const searchInput = document.getElementById('buscarProfesorTarifas');
    const btnClear = document.getElementById('btnClearSearchTarifas');
    const countSpan = document.getElementById('countTarifas');
    
    if (searchInput) searchInput.value = '';
    if (btnClear) btnClear.style.display = 'none';
    if (countSpan) countSpan.textContent = '';
}

function limpiarBusquedaPagos() {
    const searchInput = document.getElementById('buscarProfesorPagos');
    const btnClear = document.getElementById('btnClearSearchPagos');
    const countSpan = document.getElementById('countPagos');
    
    if (searchInput) searchInput.value = '';
    if (btnClear) btnClear.style.display = 'none';
    if (countSpan) countSpan.textContent = '';
}

// Hacer funciones globales
window.filtrarTablaTarifas = filtrarTablaTarifas;
window.filtrarTablaPagos = filtrarTablaPagos;
window.limpiarBusquedaTarifas = limpiarBusquedaTarifas;
window.limpiarBusquedaPagos = limpiarBusquedaPagos;


// ========== TOGGLE RESUMEN DE CATEGORÍAS ==========

// Mostrar/Ocultar resumen de categorías
function toggleResumenCategorias() {
    const resumenContainer = document.getElementById('categoriasResumen');
    const btnVerCategorias = document.getElementById('btnVerCategorias');
    const movimientosList = document.getElementById('movimientosList');
    
    if (resumenContainer.style.display === 'none' || !resumenContainer.style.display) {
        // Mostrar resumen
        resumenContainer.style.display = 'block';
        movimientosList.style.display = 'none';
        btnVerCategorias.innerHTML = '<i class="bi bi-list-ul"></i> Ver Movimientos';
        btnVerCategorias.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.9), rgba(75, 0, 130, 0.9))';
        btnVerCategorias.style.borderColor = 'rgba(138, 43, 226, 0.5)';
        
        // Cargar resumen si no está cargado
        loadResumenCategorias();
    } else {
        // Mostrar movimientos
        resumenContainer.style.display = 'none';
        movimientosList.style.display = 'grid';
        btnVerCategorias.innerHTML = '<i class="bi bi-pie-chart-fill"></i> Ver Categorías';
        btnVerCategorias.style.background = 'linear-gradient(135deg, rgba(138, 43, 226, 0.9), rgba(75, 0, 130, 0.9))';
        btnVerCategorias.style.borderColor = 'rgba(138, 43, 226, 0.5)';
    }
}

// Cargar resumen de categorías
async function loadResumenCategorias() {
    const resumenGrid = document.getElementById('resumenCategoriasGrid');
    resumenGrid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        const filtroTipo = document.getElementById('filtroTipoMovimiento').value;
        const filtroCuenta = document.getElementById('filtroCuentaMovimiento').value;
        const filtroMes = document.getElementById('filtroMesMovimiento').value;
        
        // Obtener movimientos con los filtros aplicados
        let query = getDB().collection('movimientos');
        
        if (filtroTipo) {
            query = query.where('tipo', '==', filtroTipo);
        }
        
        if (filtroCuenta) {
            query = query.where('cuentaId', '==', filtroCuenta);
        }
        
        if (filtroMes) {
            const [year, month] = filtroMes.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            
            query = query.where('fecha', '>=', firebase.firestore.Timestamp.fromDate(startDate))
                         .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(endDate));
        }
        
        const movimientosSnapshot = await query.get();
        
        // Agrupar por categoría y tipo
        const resumenIngresos = {};
        const resumenGastos = {};
        
        movimientosSnapshot.forEach(doc => {
            const mov = doc.data();
            const categoria = mov.categoria || 'Sin categoría';
            const monto = mov.monto || 0;
            
            if (mov.tipo === 'ingreso') {
                if (!resumenIngresos[categoria]) {
                    resumenIngresos[categoria] = { total: 0, cantidad: 0 };
                }
                resumenIngresos[categoria].total += monto;
                resumenIngresos[categoria].cantidad++;
            } else if (mov.tipo === 'gasto') {
                if (!resumenGastos[categoria]) {
                    resumenGastos[categoria] = { total: 0, cantidad: 0 };
                }
                resumenGastos[categoria].total += monto;
                resumenGastos[categoria].cantidad++;
            }
        });
        
        // Renderizar resumen
        resumenGrid.innerHTML = '';
        
        // Sección de Ingresos
        if (Object.keys(resumenIngresos).length > 0) {
            const seccionIngresos = document.createElement('div');
            seccionIngresos.className = 'resumen-tipo-section';
            
            const tituloIngresos = document.createElement('h4');
            tituloIngresos.className = 'resumen-tipo-titulo';
            tituloIngresos.innerHTML = '<i class="bi bi-arrow-down-circle"></i> Ingresos por Categoría';
            tituloIngresos.style.color = '#00ff88';
            tituloIngresos.style.borderColor = 'rgba(0, 255, 136, 0.3)';
            seccionIngresos.appendChild(tituloIngresos);
            
            const categoriasIngresos = document.createElement('div');
            categoriasIngresos.className = 'categorias-resumen-items';
            categoriasIngresos.style.display = 'grid';
            categoriasIngresos.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
            categoriasIngresos.style.gap = '1rem';
            
            Object.entries(resumenIngresos).sort((a, b) => b[1].total - a[1].total).forEach(([categoria, datos]) => {
                const item = createCategoriaResumenItem(categoria, datos, 'ingreso');
                categoriasIngresos.appendChild(item);
            });
            
            seccionIngresos.appendChild(categoriasIngresos);
            resumenGrid.appendChild(seccionIngresos);
        }
        
        // Sección de Gastos
        if (Object.keys(resumenGastos).length > 0) {
            const seccionGastos = document.createElement('div');
            seccionGastos.className = 'resumen-tipo-section';
            
            const tituloGastos = document.createElement('h4');
            tituloGastos.className = 'resumen-tipo-titulo';
            tituloGastos.innerHTML = '<i class="bi bi-arrow-up-circle"></i> Gastos por Categoría';
            tituloGastos.style.color = '#ff0055';
            tituloGastos.style.borderColor = 'rgba(255, 0, 85, 0.3)';
            seccionGastos.appendChild(tituloGastos);
            
            const categoriasGastos = document.createElement('div');
            categoriasGastos.className = 'categorias-resumen-items';
            categoriasGastos.style.display = 'grid';
            categoriasGastos.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
            categoriasGastos.style.gap = '1rem';
            
            Object.entries(resumenGastos).sort((a, b) => b[1].total - a[1].total).forEach(([categoria, datos]) => {
                const item = createCategoriaResumenItem(categoria, datos, 'gasto');
                categoriasGastos.appendChild(item);
            });
            
            seccionGastos.appendChild(categoriasGastos);
            resumenGrid.appendChild(seccionGastos);
        }
        
        if (Object.keys(resumenIngresos).length === 0 && Object.keys(resumenGastos).length === 0) {
            resumenGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h3>No hay movimientos</h3>
                    <p>No se encontraron movimientos con los filtros aplicados</p>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading resumen categorias:', error);
        resumenGrid.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar resumen</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Crear item de categoría en resumen
function createCategoriaResumenItem(categoria, datos, tipo) {
    const item = document.createElement('div');
    item.className = `categoria-resumen-item ${tipo}`;
    item.style.cssText = `
        background: ${tipo === 'ingreso' ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.08), rgba(0, 255, 136, 0.03))' : 'linear-gradient(135deg, rgba(255, 0, 85, 0.08), rgba(255, 0, 85, 0.03))'};
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-radius: 16px;
        padding: 1.5rem;
        border: 1px solid ${tipo === 'ingreso' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 0, 85, 0.2)'};
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        transition: all 0.3s ease;
    `;
    
    item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
            <div style="
                width: 50px;
                height: 50px;
                border-radius: 14px;
                background: ${tipo === 'ingreso' ? 'linear-gradient(135deg, #28a745, #20c997)' : 'linear-gradient(135deg, #dc3545, #c82333)'};
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
                box-shadow: 0 6px 20px ${tipo === 'ingreso' ? 'rgba(40, 167, 69, 0.4)' : 'rgba(220, 53, 69, 0.4)'};
            ">
                <i class="bi ${tipo === 'ingreso' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle'}"></i>
            </div>
            <div style="flex: 1; min-width: 0;">
                <h5 style="
                    margin: 0 0 0.25rem 0;
                    color: rgba(255, 255, 255, 0.95);
                    font-size: 1rem;
                    font-weight: 600;
                    word-wrap: break-word;
                ">${categoria}</h5>
                <p style="
                    margin: 0;
                    color: rgba(255, 255, 255, 0.6);
                    font-size: 0.85rem;
                ">${datos.cantidad} movimiento${datos.cantidad !== 1 ? 's' : ''}</p>
            </div>
        </div>
        <div style="
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            padding: 1rem;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            text-align: center;
        ">
            <div style="
                font-size: 0.7rem;
                color: rgba(255, 255, 255, 0.6);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
                margin-bottom: 0.5rem;
            ">Total</div>
            <div style="
                font-size: 1.75rem;
                font-weight: 800;
                color: ${tipo === 'ingreso' ? '#00ff88' : '#ff0055'};
                letter-spacing: -0.5px;
                text-shadow: 0 0 30px ${tipo === 'ingreso' ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 0, 85, 0.6)'};
            ">$${formatNumber(datos.total)}</div>
        </div>
    `;
    
    item.addEventListener('mouseenter', () => {
        item.style.transform = 'translateY(-5px)';
        item.style.boxShadow = `0 8px 32px ${tipo === 'ingreso' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 0, 85, 0.3)'}`;
        item.style.borderColor = tipo === 'ingreso' ? 'rgba(0, 255, 136, 0.4)' : 'rgba(255, 0, 85, 0.4)';
    });
    
    item.addEventListener('mouseleave', () => {
        item.style.transform = 'translateY(0)';
        item.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.2)';
        item.style.borderColor = tipo === 'ingreso' ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 0, 85, 0.2)';
    });
    
    return item;
}

// Hacer funciones globales
window.toggleResumenCategorias = toggleResumenCategorias;
window.loadResumenCategorias = loadResumenCategorias;


// ========== VISTA DE CATEGORÍAS EN PÁGINA COMPLETA ==========

// Cargar categorías en la página completa
async function loadCategoriasPagina() {
    const categoriasGrid = document.getElementById('categoriasGridPagina');
    const tipoActivo = document.querySelector('.categoria-tab-btn-pagina.active').dataset.tipo;
    
    categoriasGrid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    
    try {
        await window.loadCategorias();
        
        const categoriasFiltradas = window.categoriasList.filter(cat => cat.tipo === tipoActivo);
        
        // Obtener estadísticas de uso
        const estadisticas = await window.getEstadisticasPorCategoria(tipoActivo);
        
        categoriasGrid.innerHTML = '';
        
        if (categoriasFiltradas.length === 0) {
            const emptyMsg = document.createElement('div');
            emptyMsg.className = 'empty-state';
            emptyMsg.style.gridColumn = '1 / -1';
            emptyMsg.innerHTML = `
                <i class="bi bi-inbox"></i>
                <h3>No hay categorías de ${tipoActivo === 'ingreso' ? 'ingresos' : 'gastos'}</h3>
                <p>Crea tu primera categoría usando el botón "Nueva Categoría" arriba</p>
            `;
            categoriasGrid.appendChild(emptyMsg);
            return;
        }
        
        // Renderizar categorías
        categoriasFiltradas.forEach(categoria => {
            const stats = estadisticas[categoria.nombre] || { total: 0, cantidad: 0 };
            const categoriaCard = createCategoriaCardPagina(categoria, stats, tipoActivo);
            categoriasGrid.appendChild(categoriaCard);
        });
        
    } catch (error) {
        console.error('Error loading categorias:', error);
        categoriasGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar categorías</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Crear card de categoría para página
function createCategoriaCardPagina(categoria, stats, tipo) {
    const card = document.createElement('div');
    card.className = `categoria-card-pagina ${tipo}`;
    
    const iconClass = tipo === 'ingreso' ? 'bi-arrow-down-circle' : 'bi-arrow-up-circle';
    
    card.innerHTML = `
        <div class="categoria-card-header">
            <div class="categoria-card-icon">
                <i class="bi ${iconClass}"></i>
            </div>
            <div class="categoria-card-info">
                <h4>${categoria.nombre}</h4>
                <p>${stats.cantidad} movimiento${stats.cantidad !== 1 ? 's' : ''}</p>
            </div>
        </div>
        
        <div class="categoria-card-stats">
            <div class="categoria-stat-row">
                <span class="categoria-stat-label">Movimientos:</span>
                <span class="categoria-stat-value">${stats.cantidad}</span>
            </div>
            <div class="categoria-stat-row">
                <span class="categoria-stat-label">Total:</span>
                <span class="categoria-stat-value total">$${formatNumber(stats.total)}</span>
            </div>
        </div>
        
        <div class="categoria-card-actions">
            <button class="btn-icon edit" title="Editar categoría">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-icon delete" title="Eliminar categoría">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    const editBtn = card.querySelector('.btn-icon.edit');
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        editarCategoria(categoria.id, categoria.nombre);
    });
    
    const deleteBtn = card.querySelector('.btn-icon.delete');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCategoriaPagina(categoria.id, categoria.nombre, stats.cantidad);
    });
    
    return card;
}

// Eliminar categoría desde página
async function deleteCategoriaPagina(categoriaId, nombreCategoria, cantidadMovimientos) {
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
        await loadCategoriasPagina();
        loadCategoriasFilterMovimientos();
    } catch (error) {
        console.error('Error deleting categoria:', error);
        showNotification('error', 'Error', 'No se pudo eliminar la categoría');
    }
}

// Hacer funciones globales
window.loadCategoriasPagina = loadCategoriasPagina;
window.deleteCategoriaPagina = deleteCategoriaPagina;


// ========== SIDEBAR LISTENERS ==========

function setupSidebarListeners() {
    // Profile button
    const btnProfile = document.getElementById('btnProfile');
    if (btnProfile) {
        btnProfile.addEventListener('click', () => {
            window.location.href = 'panelUsuario.html';
        });
    }
    
    // Home button
    const btnHome = document.getElementById('btnHome');
    if (btnHome) {
        btnHome.addEventListener('click', () => {
            window.location.href = '../index.html';
        });
    }
    
    // Panel button
    const btnPanel = document.getElementById('btnPanel');
    if (btnPanel) {
        btnPanel.addEventListener('click', () => {
            window.location.href = 'Panel_Admin.html';
        });
    }
    
    // Logout button
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', handleLogout);
    }

    // Sidebar menu items (tabs de finanzas)
    const menuItems = document.querySelectorAll('.sidebar-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const tab = item.dataset.tab;
            
            // Actualizar estado activo en el menú
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            // Cambiar tab
            switchTab(tab);
            
            // Cerrar menú en móvil
            if (window.innerWidth <= 768) {
                const sidebarPanel = document.getElementById('sidebarPanel');
                const sidebarOverlay = document.getElementById('sidebarOverlay');
                const mobileMenuToggle = document.getElementById('mobileMenuToggle');
                
                sidebarPanel.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                
                const icon = mobileMenuToggle.querySelector('i');
                icon.className = 'bi bi-chevron-right';
            }
        });
    });
    
    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebarPanel = document.getElementById('sidebarPanel');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (mobileMenuToggle && sidebarPanel && sidebarOverlay) {
        // Show mobile menu toggle on small screens
        if (window.innerWidth <= 768) {
            mobileMenuToggle.style.display = 'flex';
        }
        
        mobileMenuToggle.addEventListener('click', () => {
            const isActive = sidebarPanel.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
            mobileMenuToggle.classList.toggle('active');
            
            // Cambiar icono entre chevron derecha y chevron izquierda
            const icon = mobileMenuToggle.querySelector('i');
            if (isActive) {
                icon.className = 'bi bi-chevron-left';
            } else {
                icon.className = 'bi bi-chevron-right';
            }
        });
        
        sidebarOverlay.addEventListener('click', () => {
            sidebarPanel.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            mobileMenuToggle.classList.remove('active');
            
            // Volver al icono de chevron derecha
            const icon = mobileMenuToggle.querySelector('i');
            icon.className = 'bi bi-chevron-right';
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                mobileMenuToggle.style.display = 'flex';
            } else {
                mobileMenuToggle.style.display = 'none';
                sidebarPanel.classList.remove('active');
                sidebarOverlay.classList.remove('active');
                mobileMenuToggle.classList.remove('active');
                
                // Asegurar que el icono sea chevron derecha
                const icon = mobileMenuToggle.querySelector('i');
                icon.className = 'bi bi-chevron-right';
            }
        });
    }
}

// Handle logout
async function handleLogout() {
    const confirmed = await showLogoutModal();
    
    if (confirmed) {
        // Clear session storage
        sessionStorage.removeItem('currentUser');
        
        // Redirect to login
        window.location.href = '../index.html';
    }
}

// Show logout confirmation modal
function showLogoutModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="panelModalOverlay" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            ">
                <div class="panel-modal" style="
                    background: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                    transform: scale(0.8);
                    transition: all 0.3s ease;
                    overflow: hidden;
                ">
                    <div class="panel-modal-body" style="
                        padding: 30px;
                        text-align: center;
                    ">
                        <i class="bi bi-exclamation-triangle" style="
                            font-size: 48px;
                            color: #ffc107;
                            margin-bottom: 20px;
                            display: block;
                        "></i>
                        <p style="
                            font-size: 18px;
                            color: #333;
                            margin: 0 0 30px 0;
                            line-height: 1.5;
                        ">¿Estás seguro de que deseas cerrar sesión?</p>
                        <div style="
                            display: flex;
                            gap: 10px;
                            justify-content: center;
                        ">
                            <button id="panelModalCancel" style="
                                padding: 12px 24px;
                                border: 1px solid #ddd;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                min-width: 100px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                background: #f5f5f5;
                                color: #333;
                            ">
                                <i class="bi bi-x-lg"></i>
                                No
                            </button>
                            <button id="panelModalConfirm" style="
                                padding: 12px 24px;
                                border: none;
                                border-radius: 8px;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: all 0.2s ease;
                                min-width: 100px;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                gap: 8px;
                                background: #dc3545;
                                color: white;
                            ">
                                <i class="bi bi-check-lg"></i>
                                Sí
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('panelModalOverlay');
        const confirmBtn = document.getElementById('panelModalConfirm');
        const cancelBtn = document.getElementById('panelModalCancel');
        
        // Show modal with animation
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
            overlay.querySelector('.panel-modal').style.transform = 'scale(1)';
        }, 10);

        // Handle confirm
        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        // Handle cancel
        cancelBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(false);
        });

        // Handle overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(false);
            }
        });

        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                resolve(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// Close modal
function closeModal(overlay) {
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    overlay.querySelector('.panel-modal').style.transform = 'scale(0.8)';
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}


// ========== FUNCIONES DE CÓDIGO QR ==========

// Subir imagen a ImgBB
async function subirImagenImgBB(archivo) {
    try {
        const formData = new FormData();
        formData.append('image', archivo);
        formData.append('key', IMGBB_API_KEY);

        const respuesta = await fetch(IMGBB_API_URL, {
            method: 'POST',
            body: formData
        });

        const resultado = await respuesta.json();
        
        if (resultado.success) {
            return {
                url: resultado.data.url,
                deleteUrl: resultado.data.delete_url,
                filename: resultado.data.image.filename
            };
        } else {
            throw new Error(resultado.error?.message || 'Error al subir imagen');
        }
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        throw error;
    }
}

// Event listeners para el código QR
document.addEventListener('DOMContentLoaded', () => {
    // Botón subir QR
    const btnSubirQR = document.getElementById('btnSubirQR');
    const codigoQRInput = document.getElementById('codigoQRInput');
    
    if (btnSubirQR && codigoQRInput) {
        btnSubirQR.addEventListener('click', () => {
            codigoQRInput.click();
        });
        
        codigoQRInput.addEventListener('change', handleQRUpload);
    }
    
    // Botón eliminar QR
    const btnEliminarQR = document.getElementById('btnEliminarQR');
    if (btnEliminarQR) {
        btnEliminarQR.addEventListener('click', handleEliminarQR);
    }
    
    // Cerrar modal QR
    const closeModalQR = document.getElementById('closeModalQR');
    if (closeModalQR) {
        closeModalQR.addEventListener('click', () => {
            document.getElementById('modalVerQR').classList.remove('active');
        });
    }
});

// Manejar subida de QR
async function handleQRUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validar tamaño (5MB máximo)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('error', 'Error', 'La imagen es demasiado grande. El tamaño máximo es 5MB.');
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showNotification('error', 'Error', 'Por favor selecciona un archivo de imagen válido.');
        return;
    }
    
    try {
        // Mostrar preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const qrPreviewImage = document.getElementById('qrPreviewImage');
            const qrPreview = document.getElementById('qrPreview');
            qrPreviewImage.src = e.target.result;
            qrPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
        
        showNotification('success', 'Imagen Cargada', 'La imagen se subirá al guardar la tarifa');
    } catch (error) {
        console.error('Error al cargar QR:', error);
        showNotification('error', 'Error', 'No se pudo cargar la imagen');
    }
}

// Eliminar QR
async function handleEliminarQR() {
    if (!confirm('¿Estás seguro de que deseas eliminar el código QR?')) {
        return;
    }
    
    try {
        if (!selectedProfesorId) {
            showNotification('error', 'Error', 'No se ha seleccionado un profesor');
            return;
        }
        
        await getDB().collection('usuarios').doc(selectedProfesorId).update({
            codigoQR: firebase.firestore.FieldValue.delete(),
            codigoQRData: firebase.firestore.FieldValue.delete()
        });
        
        // Limpiar preview
        const qrPreview = document.getElementById('qrPreview');
        const codigoQRInput = document.getElementById('codigoQRInput');
        qrPreview.style.display = 'none';
        codigoQRInput.value = '';
        
        showNotification('success', 'QR Eliminado', 'El código QR se ha eliminado correctamente');
        loadTarifas();
    } catch (error) {
        console.error('Error al eliminar QR:', error);
        showNotification('error', 'Error', 'No se pudo eliminar el código QR');
    }
}

// Ver código QR
async function verCodigoQR(profesorId) {
    try {
        const profesorDoc = await getDB().collection('usuarios').doc(profesorId).get();
        if (!profesorDoc.exists) return;
        
        const profesor = profesorDoc.data();
        
        if (!profesor.codigoQR) {
            showNotification('error', 'Sin Código QR', 'Este profesor no tiene un código QR registrado');
            return;
        }
        
        // Llenar modal
        const qrImage = document.getElementById('qrImage');
        const qrProfesorInfo = document.getElementById('qrProfesorInfo');
        
        qrImage.src = profesor.codigoQR;
        
        // Información del profesor
        const avatarUrl = profesor.fotoPerfil || '';
        const avatarHTML = avatarUrl 
            ? `<img src="${avatarUrl}" alt="${profesor.nombre}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">`
            : `<div style="width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #ff0000, #cc0000); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; font-weight: bold;">${profesor.nombre.charAt(0).toUpperCase()}</div>`;
        
        qrProfesorInfo.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);">
                ${avatarHTML}
                <div>
                    <h4 style="margin: 0; color: rgba(255, 255, 255, 0.95); font-size: 1.1rem;">${profesor.nombre}</h4>
                    <p style="margin: 0; color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">${profesor.email || 'Sin email'}</p>
                    ${profesor.metodoPago ? `<p style="margin: 0.25rem 0 0 0; color: rgba(255, 255, 255, 0.7); font-size: 0.85rem;"><i class="bi bi-credit-card"></i> ${profesor.metodoPago}</p>` : ''}
                </div>
            </div>
        `;
        
        // Mostrar modal
        document.getElementById('modalVerQR').classList.add('active');
    } catch (error) {
        console.error('Error al ver QR:', error);
        showNotification('error', 'Error', 'No se pudo cargar el código QR');
    }
}

// Hacer funciones globales
window.verCodigoQR = verCodigoQR;
window.handleQRUpload = handleQRUpload;
window.handleEliminarQR = handleEliminarQR;
