// Calendario JavaScript - Sistema por Aulas
let currentWeekStart = null;
let currentUser = null;
let userAsignaturas = [];
let historialWeekStart = null;
let historialWeekEnd = null;

// Variables para el sistema de aulas
let currentAulaId = null;
let currentAulaData = null;
let aulasDisponibles = [];
let todosLosProfesores = [];
let editingClassId = null;
let currentViewingClassId = null;

document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    loadUserInfo();
    setupEventListeners();
    loadAulasDisponibles();
});

// Funciones de notificación personalizadas
function showNotification(title, message, type = 'success') {
    return new Promise((resolve) => {
        const modal = document.getElementById('notificationModal');
        const icon = document.getElementById('notificationIcon');
        const titleEl = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');
        const btn = document.getElementById('notificationBtn');

        icon.className = 'notification-icon';
        if (type === 'error') {
            icon.classList.add('error');
            icon.innerHTML = '<i class="bi bi-x-circle"></i>';
        } else if (type === 'warning') {
            icon.classList.add('warning');
            icon.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
        } else {
            icon.innerHTML = '<i class="bi bi-check-circle"></i>';
        }

        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.add('active');

        const handleClick = () => {
            modal.classList.remove('active');
            btn.removeEventListener('click', handleClick);
            resolve(true);
        };

        btn.addEventListener('click', handleClick);
    });
}

function showConfirm(title, message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const titleEl = document.getElementById('confirmTitle');
        const messageEl = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOkBtn');
        const cancelBtn = document.getElementById('confirmCancelBtn');

        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.classList.add('active');

        const handleOk = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(true);
        };

        const handleCancel = () => {
            modal.classList.remove('active');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            resolve(false);
        };

        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
    });
}

// Check authentication
function checkAuthentication() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (!currentUser.id || currentUser.tipoUsuario !== 'admin') {
        window.location.href = '../index.html';
        return;
    }
}

// Load user info
async function loadUserInfo() {
    if (currentUser.nombre) {
        document.getElementById('userName').textContent = currentUser.nombre.toUpperCase();
    }
    await cargarFotoPerfil(currentUser.id);
}

// Cargar foto de perfil
async function cargarFotoPerfil(usuarioId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioId).get();

        if (usuarioDoc.exists) {
            const datosUsuario = usuarioDoc.data();
            if (datosUsuario.fotoPerfil) {
                const avatarDefault = document.getElementById('userAvatarDefault');
                const avatarImage = document.getElementById('userAvatarImage');

                if (avatarDefault && avatarImage) {
                    avatarDefault.style.display = 'none';
                    avatarImage.src = datosUsuario.fotoPerfil;
                    avatarImage.style.display = 'block';
                }
            }
        }
    } catch (error) {
        console.error('Error al cargar foto de perfil:', error);
    }
}

// Esperar Firebase
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

// ========== SISTEMA DE AULAS ==========

// Cargar aulas disponibles para el usuario
async function loadAulasDisponibles() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const aulasGrid = document.getElementById('aulasCalendarioGrid');
        aulasGrid.innerHTML = '<div class="loading-aulas"><i class="bi bi-arrow-clockwise spin"></i><p>Cargando aulas...</p></div>';

        // Obtener datos del usuario actual
        const usuarioDoc = await db.collection('usuarios').doc(currentUser.id).get();
        const userData = usuarioDoc.data();
        const rol = userData.rol || currentUser.rol;

        // Cargar todas las aulas
        const aulasSnapshot = await db.collection('aulas').orderBy('nombre').get();
        const todasLasAulas = [];
        aulasSnapshot.forEach(doc => {
            todasLasAulas.push({ id: doc.id, ...doc.data() });
        });

        // Filtrar aulas según permisos
        if (rol === 'superusuario') {
            aulasDisponibles = todasLasAulas;
        } else {
            // Profesores: solo aulas asignadas
            const aulasAsignadas = userData.aulasAsignadas || [];
            const aulasIdsAsignadas = aulasAsignadas.map(a => typeof a === 'object' ? a.aulaId : a);
            aulasDisponibles = todasLasAulas.filter(aula => aulasIdsAsignadas.includes(aula.id));
        }

        // Cargar profesores
        await cargarTodosLosProfesores();

        // Renderizar aulas
        renderAulasSelector();

    } catch (error) {
        console.error('Error al cargar aulas:', error);
        document.getElementById('aulasCalendarioGrid').innerHTML = `
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
    const aulasGrid = document.getElementById('aulasCalendarioGrid');

    if (aulasDisponibles.length === 0) {
        aulasGrid.innerHTML = `
            <div class="no-aulas-message">
                <i class="bi bi-door-closed"></i>
                <h3>Sin aulas asignadas</h3>
                <p>Contacta con un superusuario para que te asigne aulas</p>
            </div>
        `;
        return;
    }

    const materiasConfig = {
        'matematicas': { nombre: 'Matemáticas', icon: 'bi-calculator' },
        'lectura': { nombre: 'Lectura Crítica', icon: 'bi-book' },
        'sociales': { nombre: 'Ciencias Sociales', icon: 'bi-globe' },
        'naturales': { nombre: 'Ciencias Naturales', icon: 'bi-tree' },
        'ingles': { nombre: 'Inglés', icon: 'bi-translate' }
    };

    aulasGrid.innerHTML = aulasDisponibles.map(aula => {
        const color = aula.color || '#667eea';
        const materias = aula.materias || [];

        const materiasHTML = materias.map(materiaId => {
            const config = materiasConfig[materiaId];
            if (!config) return '';
            return `<span class="materia-tag ${materiaId}"><i class="bi ${config.icon}"></i> ${config.nombre}</span>`;
        }).join('');

        return `
            <div class="aula-card-calendario" data-aula-id="${aula.id}" onclick="seleccionarAula('${aula.id}')">
                <div class="aula-card-header" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -30)})">
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
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Seleccionar un aula
async function seleccionarAula(aulaId) {
    currentAulaId = aulaId;
    currentAulaData = aulasDisponibles.find(a => a.id === aulaId);

    if (!currentAulaData) {
        await showNotification('Error', 'Aula no encontrada', 'error');
        return;
    }

    // Obtener materias del profesor para esta aula
    await cargarMateriasDelAula();

    // Mostrar calendario y ocultar selector
    document.getElementById('aulaSelectorContainer').style.display = 'none';
    document.getElementById('calendarioContainer').style.display = 'block';

    // Actualizar info del aula actual
    document.getElementById('aulaActualNombre').textContent = currentAulaData.nombre;
    const aulaInfo = document.getElementById('aulaActualInfo');
    aulaInfo.style.background = `linear-gradient(135deg, ${currentAulaData.color || '#ff0000'}, ${adjustColor(currentAulaData.color || '#ff0000', -30)})`;

    // Inicializar calendario
    initializeCalendar();
    loadClasses();
}

// Volver al selector de aulas
function volverASelectorAulas() {
    currentAulaId = null;
    currentAulaData = null;
    userAsignaturas = [];

    document.getElementById('calendarioContainer').style.display = 'none';
    document.getElementById('aulaSelectorContainer').style.display = 'block';
}

// Cargar materias del aula según permisos del usuario
async function cargarMateriasDelAula() {
    try {
        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(currentUser.id).get();
        const userData = usuarioDoc.data();
        const rol = userData.rol || currentUser.rol;

        // Materias del aula
        const materiasAula = currentAulaData.materias || [];

        if (rol === 'superusuario') {
            userAsignaturas = materiasAula;
        } else {
            // Buscar las materias asignadas al profesor en esta aula
            const aulasAsignadas = userData.aulasAsignadas || [];
            const aulaAsignada = aulasAsignadas.find(a => {
                if (typeof a === 'object' && a.aulaId) return a.aulaId === currentAulaId;
                return a === currentAulaId;
            });

            if (aulaAsignada && typeof aulaAsignada === 'object' && aulaAsignada.materias) {
                userAsignaturas = materiasAula.filter(m => aulaAsignada.materias.includes(m));
            } else {
                userAsignaturas = materiasAula;
            }
        }

        cargarMateriasSelect();
    } catch (error) {
        console.error('Error al cargar materias del aula:', error);
        userAsignaturas = currentAulaData.materias || [];
        cargarMateriasSelect();
    }
}

// Cargar materias en el select del formulario
function cargarMateriasSelect() {
    const materiaSelect = document.getElementById('materiaSelect');
    materiaSelect.innerHTML = '<option value="">Selecciona una materia</option>';

    const materiasDisponibles = {
        'matematicas': 'Matemáticas',
        'lectura': 'Lectura Crítica',
        'sociales': 'Ciencias Sociales',
        'naturales': 'Ciencias Naturales',
        'ingles': 'Inglés'
    };

    userAsignaturas.forEach(asignaturaId => {
        const option = document.createElement('option');
        option.value = asignaturaId;
        option.textContent = materiasDisponibles[asignaturaId];
        materiaSelect.appendChild(option);
    });

    // También actualizar el filtro de materias
    cargarMateriasEnFiltro();
}

// Cargar materias en el filtro de la vista lista
function cargarMateriasEnFiltro() {
    const filtroMateria = document.getElementById('filtroMateria');
    const materiasNombres = {
        'matematicas': 'Matemáticas',
        'lectura': 'Lectura Crítica',
        'sociales': 'Ciencias Sociales',
        'naturales': 'Ciencias Naturales',
        'ingles': 'Inglés'
    };

    filtroMateria.innerHTML = '<option value="">Todas las materias</option>';

    userAsignaturas.forEach(key => {
        if (materiasNombres[key]) {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = materiasNombres[key];
            filtroMateria.appendChild(option);
        }
    });
}

// Cargar todos los profesores
async function cargarTodosLosProfesores() {
    try {
        const db = window.firebaseDB;
        const profesoresSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'admin')
            .get();

        todosLosProfesores = [];
        profesoresSnapshot.forEach(doc => {
            const profesor = doc.data();
            todosLosProfesores.push({
                id: doc.id,
                nombre: profesor.nombre,
                asignaturas: profesor.asignaturas || [],
                aulasAsignadas: profesor.aulasAsignadas || [],
                rol: profesor.rol
            });
        });
    } catch (error) {
        console.error('Error al cargar profesores:', error);
    }
}

// Cargar tutores según la materia seleccionada (filtrado por aula)
function cargarTutoresPorMateria(materia) {
    const tutorSelect = document.getElementById('tutorSelect');
    tutorSelect.innerHTML = '<option value="">Seleccionar tutor</option>';

    if (!materia || !currentAulaId) return;

    // Filtrar profesores que tienen esta materia en esta aula específica
    const profesoresFiltrados = todosLosProfesores.filter(profesor => {
        // Superusuarios pueden ser tutores de cualquier materia
        if (profesor.rol === 'superusuario') return true;

        // Verificar si el profesor tiene esta materia asignada en esta aula
        const aulasAsignadas = profesor.aulasAsignadas || [];
        const aulaAsignada = aulasAsignadas.find(a => {
            if (typeof a === 'object' && a.aulaId) return a.aulaId === currentAulaId;
            return a === currentAulaId;
        });

        if (aulaAsignada && typeof aulaAsignada === 'object' && aulaAsignada.materias) {
            return aulaAsignada.materias.includes(materia);
        }

        // Compatibilidad: si tiene la materia en asignaturas generales
        return profesor.asignaturas && profesor.asignaturas.includes(materia);
    });

    // Verificar si el usuario actual está en la lista
    const usuarioActualEnLista = profesoresFiltrados.some(p => p.id === currentUser.id);

    // Agregar usuario actual primero si está en la lista
    if (usuarioActualEnLista) {
        const optionActual = document.createElement('option');
        optionActual.value = currentUser.id;
        optionActual.textContent = `${currentUser.nombre} (Yo)`;
        optionActual.selected = true;
        tutorSelect.appendChild(optionActual);
    }

    // Agregar otros profesores
    profesoresFiltrados.forEach(profesor => {
        if (profesor.id !== currentUser.id) {
            const option = document.createElement('option');
            option.value = profesor.id;
            option.textContent = profesor.nombre;
            if (!usuarioActualEnLista && tutorSelect.options.length === 1) {
                option.selected = true;
            }
            tutorSelect.appendChild(option);
        }
    });

    if (tutorSelect.options.length === 1) {
        tutorSelect.innerHTML = '<option value="">No hay tutores disponibles para esta materia</option>';
    }
}

// Make seleccionarAula global
window.seleccionarAula = seleccionarAula;


// ========== CALENDARIO ==========

// Initialize calendar
function initializeCalendar() {
    const today = new Date();
    currentWeekStart = new Date(today.getFullYear(), today.getMonth(), 1);
    renderCalendar();
}

// Render calendar
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    updateWeekRange();

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Header
    dias.forEach(dia => {
        const cell = document.createElement('div');
        cell.className = 'calendar-header-cell';
        cell.textContent = dia;
        calendarGrid.appendChild(cell);
    });

    const year = currentWeekStart.getFullYear();
    const month = currentWeekStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        createDayCell(date, true);
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        createDayCell(date, false);
    }

    const totalCells = calendarGrid.children.length - 7;
    const remainingCells = Math.ceil((totalCells + 1) / 7) * 7 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        createDayCell(date, true);
    }
}

// Create day cell
function createDayCell(date, isOtherMonth) {
    const calendarGrid = document.getElementById('calendarGrid');
    const cell = document.createElement('div');
    cell.className = 'calendar-cell';

    if (isOtherMonth) cell.classList.add('other-month');

    const today = new Date();
    if (date.toDateString() === today.toDateString()) cell.classList.add('today');

    const dateStr = date.toISOString().split('T')[0];
    cell.dataset.date = dateStr;

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    cell.appendChild(dayNumber);

    const classesContainer = document.createElement('div');
    classesContainer.className = 'classes-container';
    classesContainer.dataset.date = dateStr;
    cell.appendChild(classesContainer);

    cell.addEventListener('click', (e) => {
        if (e.target === cell || e.target === dayNumber || e.target === classesContainer) {
            openNewClassModal(date);
        }
    });

    calendarGrid.appendChild(cell);
}

// Update week range
function updateWeekRange() {
    const options = { month: 'long', year: 'numeric' };
    const monthStr = currentWeekStart.toLocaleDateString('es-ES', options);
    const monthCapitalized = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
    document.getElementById('weekRange').textContent = monthCapitalized;
}

// Load classes (filtradas por aula)
async function loadClasses() {
    if (!currentAulaId) return;

    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const year = currentWeekStart.getFullYear();
        const month = currentWeekStart.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];

        // Obtener clases filtradas por aula
        const clasesSnapshot = await db.collection('clases_programadas')
            .where('aulaId', '==', currentAulaId)
            .get();

        document.querySelectorAll('.class-card-mini').forEach(el => el.remove());

        const clases = [];
        clasesSnapshot.forEach(doc => {
            const clase = doc.data();
            clase.id = doc.id;
            if (clase.fecha >= startDate && clase.fecha <= endDate) {
                clases.push(clase);
            }
        });

        clases.sort((a, b) => {
            if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
            const horaA = a.horaInicio || a.hora || '00:00';
            const horaB = b.horaInicio || b.hora || '00:00';
            return horaA < horaB ? -1 : 1;
        });

        clases.forEach(clase => renderClassInCalendar(clase));

        const simulatedSnapshot = {
            empty: clases.length === 0,
            size: clases.length,
            forEach: (callback) => {
                clases.forEach((clase) => {
                    callback({ id: clase.id, data: () => { const d = { ...clase }; delete d.id; return d; } });
                });
            }
        };

        renderClassList(simulatedSnapshot);

    } catch (error) {
        console.error('Error al cargar clases:', error);
    }
}

// Render class in calendar
function renderClassInCalendar(clase) {
    const dateStr = clase.fecha;
    const container = document.querySelector(`.classes-container[data-date="${dateStr}"]`);

    if (container) {
        const classCard = document.createElement('div');
        classCard.className = 'class-card-mini';
        classCard.dataset.materia = clase.materia;
        classCard.dataset.claseId = clase.id;

        const horaDisplay = clase.horaInicio || clase.hora || '';

        classCard.innerHTML = `
            <div class="class-time">${horaDisplay}</div>
            <div class="class-title">${clase.titulo}</div>
        `;

        classCard.addEventListener('click', (e) => {
            e.stopPropagation();
            viewClassModal(clase.id);
        });

        container.appendChild(classCard);
    }
}

// Render class list
function renderClassList(clasesSnapshot) {
    const classesList = document.getElementById('classesList');
    classesList.innerHTML = '';

    if (clasesSnapshot.empty) {
        classesList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-x"></i>
                <h3>No hay clases programadas</h3>
                <p>Comienza programando tu primera clase en esta aula</p>
            </div>
        `;
        return;
    }

    const materiasNombres = {
        'matematicas': 'Matemáticas',
        'lectura': 'Lectura Crítica',
        'sociales': 'Ciencias Sociales',
        'naturales': 'Ciencias Naturales',
        'ingles': 'Inglés'
    };

    const tipologiasNombres = {
        'practica_libre': 'Práctica (Libre)',
        'practica_simulacro': 'Práctica (Simulacro)',
        'teorica_obligatorio': 'Teórica (Obligatorio)',
        'teorica_practica_libre': 'Teórica-Práctica (Libre)',
        'na': 'N/A'
    };

    clasesSnapshot.forEach(doc => {
        const clase = doc.data();
        clase.id = doc.id;

        const classCard = document.createElement('div');
        classCard.className = 'class-card-full';
        classCard.dataset.materia = clase.materia;
        classCard.dataset.estado = clase.estado || 'pendiente';

        const fecha = new Date(clase.fecha + 'T00:00:00');
        const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const horaDisplay = clase.horaInicio && clase.horaFin
            ? `${clase.horaInicio} - ${clase.horaFin}`
            : clase.hora || 'No especificada';

        classCard.innerHTML = `
            <div class="materia-badge-large materia-${clase.materia}">
                <i class="bi bi-book-fill"></i>
                ${materiasNombres[clase.materia]}
            </div>
            <div class="class-card-header">
                <div class="class-info">
                    <h3>${clase.titulo}</h3>
                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem;">
                        ${clase.tipologia ? `<span class="class-badge">${tipologiasNombres[clase.tipologia] || clase.tipologia}</span>` : ''}
                        ${clase.estado ? `<span class="class-badge ${clase.estado}">${clase.estado === 'confirmada' ? 'Confirmada' : clase.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}</span>` : '<span class="class-badge pendiente">Pendiente</span>'}
                    </div>
                    <div class="class-meta">
                        ${clase.tutorNombre ? `<div class="class-meta-item"><i class="bi bi-person"></i><span>Tutor: ${clase.tutorNombre}</span></div>` : ''}
                        <div class="class-meta-item"><i class="bi bi-calendar"></i><span>${fechaStr}</span></div>
                        <div class="class-meta-item"><i class="bi bi-clock"></i><span>${horaDisplay} (${clase.duracion} min)</span></div>
                        ${clase.unidad ? `<div class="class-meta-item"><i class="bi bi-folder"></i><span>${clase.unidad}</span></div>` : ''}
                        ${clase.tema ? `<div class="class-meta-item"><i class="bi bi-tag"></i><span>${clase.tema}</span></div>` : ''}
                    </div>
                </div>
                <div class="class-actions">
                    ${getClassStatusButtons(clase)}
                    <button class="btn-icon" onclick="editClass('${clase.id}')"><i class="bi bi-pencil"></i></button>
                    <button class="btn-icon delete" onclick="deleteClass('${clase.id}')"><i class="bi bi-trash"></i></button>
                </div>
            </div>
            ${getClassStatusBadgeHTML(clase)}
            ${clase.descripcion ? `<div class="class-description"><i class="bi bi-chat-left-text"></i> ${clase.descripcion}</div>` : ''}
            ${clase.enlace ? `<div class="class-link"><i class="bi bi-link-45deg"></i><a href="${clase.enlace}" target="_blank">Enlace de clase</a></div>` : ''}
        `;

        classesList.appendChild(classCard);
    });
}

// Get class status badge HTML
function getClassStatusBadgeHTML(clase) {
    const estado = clase.estado || 'pendiente';
    const statusConfig = {
        'confirmada': { icon: 'check-circle-fill', text: 'Confirmada' },
        'cancelada': { icon: 'x-circle-fill', text: 'Cancelada' },
        'pendiente': { icon: 'clock-fill', text: 'Pendiente' }
    };
    const config = statusConfig[estado];
    return `<div class="class-status-badge-compact ${estado}"><i class="bi bi-${config.icon}"></i><span>${config.text}</span></div>`;
}

// Get class status buttons
function getClassStatusButtons(clase) {
    const estado = clase.estado || 'pendiente';

    if (estado === 'confirmada') {
        return `<button class="btn-status confirmed" title="Clase Confirmada" disabled><i class="bi bi-check-circle-fill"></i></button>`;
    } else if (estado === 'cancelada') {
        return `<button class="btn-status cancelled" title="Clase Cancelada" disabled><i class="bi bi-x-circle-fill"></i></button>`;
    } else {
        return `
            <button class="btn-status confirm" onclick="confirmClass('${clase.id}')" title="Confirmar Clase"><i class="bi bi-check-circle"></i></button>
            <button class="btn-status cancel" onclick="cancelClass('${clase.id}')" title="Cancelar Clase"><i class="bi bi-x-circle"></i></button>
        `;
    }
}

// Aplicar filtros
function aplicarFiltros() {
    const filtroMateria = document.getElementById('filtroMateria').value;
    const filtroEstado = document.getElementById('filtroEstado').value;
    const classCards = document.querySelectorAll('.class-card-full');

    classCards.forEach(card => {
        const materia = card.dataset.materia;
        const estado = card.dataset.estado || '';
        const matchMateria = !filtroMateria || materia === filtroMateria;
        const matchEstado = !filtroEstado || estado === filtroEstado;
        card.style.display = (matchMateria && matchEstado) ? 'block' : 'none';
    });

    const visibleCards = Array.from(classCards).filter(card => card.style.display !== 'none');
    const classesList = document.getElementById('classesList');
    const existingEmpty = classesList.querySelector('.empty-state-filter');
    if (existingEmpty) existingEmpty.remove();

    if (visibleCards.length === 0 && classCards.length > 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state empty-state-filter';
        emptyDiv.innerHTML = `<i class="bi bi-funnel"></i><h3>No se encontraron clases</h3><p>Intenta con otros filtros</p>`;
        classesList.appendChild(emptyDiv);
    }
}


// ========== MODAL Y FORMULARIO ==========

// Open new class modal
function openNewClassModal(date = null) {
    editingClassId = null;
    document.getElementById('formNuevaClase').reset();
    document.getElementById('tutorSelect').innerHTML = '<option value="">Primero selecciona una materia</option>';

    // Mostrar info del aula
    const aulaSelectGroup = document.getElementById('aulaSelectGroup');
    const aulaSelect = document.getElementById('aulaSelect');
    if (currentAulaData) {
        aulaSelectGroup.style.display = 'block';
        aulaSelect.innerHTML = `<option value="${currentAulaId}">${currentAulaData.nombre}</option>`;
    }

    // Resetear time pickers
    const horaInicioEl = document.getElementById('horaInicioClase');
    const horaFinEl = document.getElementById('horaFinClase');
    horaInicioEl.dataset.timeValue = '';
    horaInicioEl.querySelector('span').textContent = 'Seleccionar hora';
    horaInicioEl.classList.add('empty');
    horaFinEl.dataset.timeValue = '';
    horaFinEl.querySelector('span').textContent = 'Seleccionar hora';
    horaFinEl.classList.add('empty');

    document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Programar Nueva Clase';
    const submitBtn = document.querySelector('#modalNuevaClase button[type="submit"]');
    submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Programar Clase';

    const modal = document.getElementById('modalNuevaClase');
    modal.classList.add('active');

    if (date) {
        document.getElementById('fechaClase').value = date.toISOString().split('T')[0];
    }
}

// Edit class
async function editClass(claseId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const claseDoc = await db.collection('clases_programadas').doc(claseId).get();

        if (!claseDoc.exists) {
            await showNotification('Error', 'Clase no encontrada', 'error');
            return;
        }

        const clase = claseDoc.data();
        editingClassId = claseId;

        // Mostrar info del aula
        const aulaSelectGroup = document.getElementById('aulaSelectGroup');
        const aulaSelect = document.getElementById('aulaSelect');
        if (currentAulaData) {
            aulaSelectGroup.style.display = 'block';
            aulaSelect.innerHTML = `<option value="${currentAulaId}">${currentAulaData.nombre}</option>`;
        }

        document.getElementById('materiaSelect').value = clase.materia;
        cargarTutoresPorMateria(clase.materia);

        setTimeout(() => {
            document.getElementById('tutorSelect').value = clase.tutorId || currentUser.id;
        }, 100);

        document.getElementById('tipologiaClase').value = clase.tipologia || '';
        document.getElementById('unidadClase').value = clase.unidad || '';
        document.getElementById('temaClase').value = clase.tema || '';
        document.getElementById('tituloClase').value = clase.titulo;
        document.getElementById('descripcionClase').value = clase.descripcion || '';
        document.getElementById('fechaClase').value = clase.fecha;
        document.getElementById('duracionClase').value = clase.duracion;
        document.getElementById('enlaceClase').value = clase.enlace || '';

        const horaInicioEl = document.getElementById('horaInicioClase');
        const horaFinEl = document.getElementById('horaFinClase');

        if (clase.horaInicio) {
            const horaInicioFormateada = convertirHora24a12(clase.horaInicio);
            horaInicioEl.dataset.timeValue = horaInicioFormateada;
            horaInicioEl.querySelector('span').textContent = horaInicioFormateada;
            horaInicioEl.classList.remove('empty');
        }

        if (clase.horaFin) {
            const horaFinFormateada = convertirHora24a12(clase.horaFin);
            horaFinEl.dataset.timeValue = horaFinFormateada;
            horaFinEl.querySelector('span').textContent = horaFinFormateada;
            horaFinEl.classList.remove('empty');
        }

        calcularDuracion();

        document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Editar Clase';
        const submitBtn = document.querySelector('#modalNuevaClase button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Clase';

        document.getElementById('modalNuevaClase').classList.add('active');

    } catch (error) {
        console.error('Error al cargar clase:', error);
        await showNotification('Error', 'Error al cargar los datos de la clase', 'error');
    }
}

window.editClass = editClass;

// View class modal (solo lectura)
async function viewClassModal(claseId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const claseDoc = await db.collection('clases_programadas').doc(claseId).get();

        if (!claseDoc.exists) {
            await showNotification('Error', 'Clase no encontrada', 'error');
            return;
        }

        const clase = claseDoc.data();
        currentViewingClassId = claseId;

        const materiasNombres = {
            'matematicas': 'Matematicas',
            'lectura': 'Lectura Critica',
            'sociales': 'Ciencias Sociales',
            'naturales': 'Ciencias Naturales',
            'ingles': 'Ingles'
        };

        const tipologiasNombres = {
            'practica_libre': 'Practica (Libre)',
            'practica_simulacro': 'Practica (Simulacro)',
            'teorica_obligatorio': 'Teorica (Obligatorio)',
            'teorica_practica_libre': 'Teorica-Practica (Libre)',
            'na': 'N/A'
        };

        document.getElementById('verClaseTitulo').textContent = clase.titulo;

        const materiaBadge = document.getElementById('verClaseMateriaBadge');
        materiaBadge.className = 'clase-detalle-badge ' + clase.materia;
        document.getElementById('verClaseMateria').textContent = materiasNombres[clase.materia] || clase.materia;

        document.getElementById('verClaseTipologia').textContent = tipologiasNombres[clase.tipologia] || clase.tipologia || '-';
        document.getElementById('verClaseUnidad').textContent = clase.unidad || '-';
        document.getElementById('verClaseTema').textContent = clase.tema || '-';
        document.getElementById('verClaseTutor').textContent = clase.tutorNombre || '-';

        const fecha = new Date(clase.fecha + 'T00:00:00');
        const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        document.getElementById('verClaseFecha').textContent = fechaStr;

        const horaDisplay = clase.horaInicio && clase.horaFin ? clase.horaInicio + ' - ' + clase.horaFin : '-';
        document.getElementById('verClaseHorario').textContent = horaDisplay;

        document.getElementById('verClaseDuracion').textContent = clase.duracion ? clase.duracion + ' minutos' : '-';

        const descripcionContainer = document.getElementById('verClaseDescripcionContainer');
        if (clase.descripcion) {
            descripcionContainer.style.display = 'flex';
            document.getElementById('verClaseDescripcion').textContent = clase.descripcion;
        } else {
            descripcionContainer.style.display = 'none';
        }

        const enlaceContainer = document.getElementById('verClaseEnlaceContainer');
        if (clase.enlace) {
            enlaceContainer.style.display = 'flex';
            const enlaceEl = document.getElementById('verClaseEnlace');
            enlaceEl.href = clase.enlace;
            enlaceEl.textContent = clase.enlace;
        } else {
            enlaceContainer.style.display = 'none';
        }

        const estado = clase.estado || 'pendiente';
        const estadoBadge = document.getElementById('verClaseEstado');
        estadoBadge.className = 'estado-badge ' + estado;
        estadoBadge.textContent = estado === 'confirmada' ? 'Confirmada' : estado === 'cancelada' ? 'Cancelada' : 'Pendiente';

        const btnEditar = document.getElementById('btnEditarDesdeVer');
        btnEditar.style.display = currentUser.tipoUsuario === 'admin' ? 'inline-flex' : 'none';

        document.getElementById('modalVerClase').classList.add('active');

    } catch (error) {
        console.error('Error al cargar clase:', error);
        await showNotification('Error', 'Error al cargar los datos de la clase', 'error');
    }
}

window.viewClassModal = viewClassModal;

function closeModalVerClase() {
    currentViewingClassId = null;
    document.getElementById('modalVerClase').classList.remove('active');
}

// Conversiones de hora
function convertirHora24a12(hora24) {
    const [hora, min] = hora24.split(':').map(Number);
    const period = hora >= 12 ? 'PM' : 'AM';
    let hora12 = hora % 12;
    if (hora12 === 0) hora12 = 12;
    return `${hora12.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${period}`;
}

function convertirHora24aMinutos(hora24) {
    const [hora, min] = hora24.split(':').map(Number);
    return hora * 60 + min;
}

function convertirHora12a24(hora12) {
    const [time, period] = hora12.split(' ');
    let [hora, min] = time.split(':').map(Number);

    if (period === 'PM' && hora !== 12) hora += 12;
    else if (period === 'AM' && hora === 12) hora = 0;

    return `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
}

function convertirHoraAMinutos(horaStr) {
    const [time, period] = horaStr.split(' ');
    let [hora, min] = time.split(':').map(Number);

    if (period === 'PM' && hora !== 12) hora += 12;
    else if (period === 'AM' && hora === 12) hora = 0;

    return hora * 60 + min;
}

function convertirMinutosAHora(minutos) {
    let hora = Math.floor(minutos / 60);
    const min = minutos % 60;
    const period = hora >= 12 ? 'PM' : 'AM';

    if (hora > 12) hora -= 12;
    else if (hora === 0) hora = 12;

    return `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')} ${period}`;
}

function calcularDuracion() {
    const horaInicioEl = document.getElementById('horaInicioClase');
    const horaFinEl = document.getElementById('horaFinClase');

    const horaInicio = horaInicioEl.dataset.timeValue;
    const horaFin = horaFinEl.dataset.timeValue;

    if (horaInicio && horaFin) {
        const minutosInicio = convertirHoraAMinutos(horaInicio);
        const minutosFin = convertirHoraAMinutos(horaFin);
        let duracion = minutosFin - minutosInicio;
        if (duracion < 0) duracion += 24 * 60;
        document.getElementById('duracionClase').value = duracion;
    }
}

// Handle form submit
async function handleFormSubmit(e) {
    e.preventDefault();

    if (!currentAulaId) {
        await showNotification('Error', 'Debes seleccionar un aula primero', 'error');
        return;
    }

    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const materia = document.getElementById('materiaSelect').value;
        const tipologia = document.getElementById('tipologiaClase').value;
        const unidad = document.getElementById('unidadClase').value;
        const tema = document.getElementById('temaClase').value;
        const titulo = document.getElementById('tituloClase').value;
        const descripcion = document.getElementById('descripcionClase').value;
        const tutorId = document.getElementById('tutorSelect').value;
        const fecha = document.getElementById('fechaClase').value;

        const horaInicioEl = document.getElementById('horaInicioClase');
        const horaFinEl = document.getElementById('horaFinClase');
        const horaInicio12 = horaInicioEl.dataset.timeValue;
        const horaFin12 = horaFinEl.dataset.timeValue;

        const horaInicio = horaInicio12 ? convertirHora12a24(horaInicio12) : '';
        const horaFin = horaFin12 ? convertirHora12a24(horaFin12) : '';
        const duracion = document.getElementById('duracionClase').value;
        const enlace = document.getElementById('enlaceClase').value;

        if (!materia || !tipologia || !titulo || !tutorId || !fecha || !horaInicio || !horaFin) {
            await showNotification('Campos Requeridos', 'Por favor completa todos los campos requeridos (*)', 'warning');
            return;
        }

        if (horaFin <= horaInicio) {
            await showNotification('Error de Horario', 'La hora de fin debe ser mayor que la hora de inicio', 'error');
            return;
        }

        let tutorNombre = currentUser.nombre;
        if (tutorId !== currentUser.id) {
            const tutorDoc = await db.collection('usuarios').doc(tutorId).get();
            if (tutorDoc.exists) tutorNombre = tutorDoc.data().nombre;
        }

        const claseData = {
            aulaId: currentAulaId,
            aulaNombre: currentAulaData.nombre,
            materia: materia,
            tipologia: tipologia,
            unidad: unidad || '',
            tema: tema || '',
            titulo: titulo,
            descripcion: descripcion || '',
            tutorId: tutorId,
            tutorNombre: tutorNombre,
            fecha: fecha,
            horaInicio: horaInicio,
            horaFin: horaFin,
            duracion: parseInt(duracion),
            enlace: enlace || '',
            profesorId: currentUser.id,
            profesorNombre: currentUser.nombre,
            estado: 'pendiente'
        };

        if (editingClassId) {
            claseData.actualizadoEn = new Date().toISOString();
            await db.collection('clases_programadas').doc(editingClassId).update(claseData);
            await actualizarAnuncioClase(editingClassId, claseData);
            await showNotification('¡Éxito!', 'Clase actualizada exitosamente', 'success');
            editingClassId = null;
        } else {
            claseData.creadoEn = new Date().toISOString();
            await db.collection('clases_programadas').add(claseData);
            await crearAnuncioClase(claseData);
            await showNotification('¡Éxito!', 'Clase programada exitosamente', 'success');
        }

        document.getElementById('modalNuevaClase').classList.remove('active');
        document.getElementById('formNuevaClase').reset();

        document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Programar Nueva Clase';
        const submitBtn = document.querySelector('#modalNuevaClase button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Programar Clase';

        await loadClasses();

    } catch (error) {
        console.error('Error al procesar clase:', error);
        await showNotification('Error', 'Error al procesar la clase: ' + error.message, 'error');
    }
}

// Confirm class
async function confirmClass(classId) {
    const confirmed = await showConfirm('Confirmar Clase', '¿Confirmas que esta clase se realizó correctamente?');

    if (confirmed) {
        try {
            await window.firebaseDB.collection('clases_programadas').doc(classId).update({
                estado: 'confirmada',
                confirmadaEn: firebase.firestore.FieldValue.serverTimestamp(),
                confirmadaPor: currentUser.id
            });
            await showNotification('Clase Confirmada', 'La clase ha sido confirmada exitosamente');
            loadClasses();
        } catch (error) {
            console.error('Error confirming class:', error);
            await showNotification('Error', 'No se pudo confirmar la clase', 'error');
        }
    }
}

// Cancel class
async function cancelClass(classId) {
    const confirmed = await showConfirm('Cancelar Clase', '¿Estás seguro de que deseas cancelar esta clase?');

    if (confirmed) {
        try {
            const claseDoc = await window.firebaseDB.collection('clases_programadas').doc(classId).get();
            const claseData = claseDoc.data();

            await window.firebaseDB.collection('clases_programadas').doc(classId).update({
                estado: 'cancelada',
                canceladaEn: firebase.firestore.FieldValue.serverTimestamp(),
                canceladaPor: currentUser.id
            });

            await actualizarAnuncioCancelacion(claseData);
            await showNotification('Clase Cancelada', 'La clase ha sido cancelada');
            loadClasses();
        } catch (error) {
            console.error('Error cancelling class:', error);
            await showNotification('Error', 'No se pudo cancelar la clase', 'error');
        }
    }
}

// Delete class
async function deleteClass(claseId) {
    const confirmed = await showConfirm('Eliminar Clase', '¿Estás seguro de que deseas eliminar esta clase?');

    if (!confirmed) return;

    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const claseDoc = await db.collection('clases_programadas').doc(claseId).get();

        if (claseDoc.exists) {
            const clase = claseDoc.data();
            await db.collection('clases_programadas').doc(claseId).delete();
            await eliminarAnuncioClase(clase);
        }

        loadClasses();
        await showNotification('¡Éxito!', 'Clase eliminada exitosamente', 'success');

    } catch (error) {
        console.error('Error al eliminar clase:', error);
        await showNotification('Error', 'Error al eliminar la clase', 'error');
    }
}

window.deleteClass = deleteClass;
window.confirmClass = confirmClass;
window.cancelClass = cancelClass;

// View class details
function viewClassDetails(clase) {
    const materiasNombres = {
        'matematicas': 'Matemáticas',
        'lectura': 'Lectura Crítica',
        'sociales': 'Ciencias Sociales',
        'naturales': 'Ciencias Naturales',
        'ingles': 'Inglés'
    };

    const fecha = new Date(clase.fecha + 'T00:00:00');
    const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    let mensaje = `📚 ${clase.titulo}\n\n`;
    mensaje += `Materia: ${materiasNombres[clase.materia]}\n`;
    mensaje += `Fecha: ${fechaStr}\n`;
    mensaje += `Hora: ${clase.horaInicio} - ${clase.horaFin}\n`;
    mensaje += `Duración: ${clase.duracion} minutos\n`;

    if (clase.descripcion) mensaje += `\nDescripción:\n${clase.descripcion}\n`;
    if (clase.enlace) mensaje += `\nEnlace: ${clase.enlace}`;

    alert(mensaje);
}


// ========== ANUNCIOS ==========

// Crear anuncio de clase
async function crearAnuncioClase(clase) {
    try {
        const db = window.firebaseDB;

        const fecha = new Date(clase.fecha + 'T00:00:00');
        const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const tipologiasNombres = {
            'practica_libre': 'Práctica (Libre)',
            'practica_simulacro': 'Práctica (Simulacro)',
            'teorica_obligatorio': 'Teórica (Obligatorio)',
            'teorica_practica_libre': 'Teórica-Práctica (Libre)',
            'na': 'N/A'
        };

        const horaDisplay = clase.horaInicio && clase.horaFin ? `${clase.horaInicio} - ${clase.horaFin}` : '';

        let contenido = `Se ha programado una nueva clase para el ${fechaStr} de ${horaDisplay}.\n\n`;
        if (clase.tipologia) contenido += `📋 Tipología: ${tipologiasNombres[clase.tipologia] || clase.tipologia}\n`;
        if (clase.unidad) contenido += `📁 Unidad: ${clase.unidad}\n`;
        if (clase.tema) contenido += `🏷️ Tema: ${clase.tema}\n`;
        if (clase.tutorNombre) contenido += `👨‍🏫 Tutor: ${clase.tutorNombre}\n`;
        contenido += `⏱️ Duración: ${clase.duracion} minutos`;
        if (clase.descripcion) contenido += `\n\n${clase.descripcion}`;

        const anuncio = {
            aulaId: clase.aulaId,
            materia: clase.materia,
            titulo: `📅 Clase Programada: ${clase.titulo}`,
            contenido: contenido,
            profesorId: clase.profesorId,
            profesorNombre: clase.profesorNombre,
            autorId: clase.profesorId,
            fecha: firebase.firestore.Timestamp.now(),
            tipo: 'clase',
            enlaceClase: clase.enlace || null
        };

        await db.collection('anuncios').add(anuncio);
    } catch (error) {
        console.error('Error al crear anuncio:', error);
    }
}

// Actualizar anuncio de clase
async function actualizarAnuncioClase(claseId, clase) {
    try {
        const db = window.firebaseDB;

        const fecha = new Date(clase.fecha + 'T00:00:00');
        const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const tipologiasNombres = {
            'practica_libre': 'Práctica (Libre)',
            'practica_simulacro': 'Práctica (Simulacro)',
            'teorica_obligatorio': 'Teórica (Obligatorio)',
            'teorica_practica_libre': 'Teórica-Práctica (Libre)',
            'na': 'N/A'
        };

        const horaDisplay = clase.horaInicio && clase.horaFin ? `${clase.horaInicio} - ${clase.horaFin}` : '';

        let contenido = `Se ha programado una nueva clase para el ${fechaStr} de ${horaDisplay}.\n\n`;
        if (clase.tipologia) contenido += `📋 Tipología: ${tipologiasNombres[clase.tipologia] || clase.tipologia}\n`;
        if (clase.unidad) contenido += `📁 Unidad: ${clase.unidad}\n`;
        if (clase.tema) contenido += `🏷️ Tema: ${clase.tema}\n`;
        if (clase.tutorNombre) contenido += `👨‍🏫 Tutor: ${clase.tutorNombre}\n`;
        contenido += `⏱️ Duración: ${clase.duracion} minutos`;
        if (clase.descripcion) contenido += `\n\n${clase.descripcion}`;

        const anunciosSnapshot = await db.collection('anuncios')
            .where('aulaId', '==', clase.aulaId)
            .where('materia', '==', clase.materia)
            .where('tipo', '==', 'clase')
            .get();

        let anuncioId = null;
        anunciosSnapshot.forEach(doc => {
            const anuncio = doc.data();
            if (anuncio.titulo.includes(clase.titulo)) anuncioId = doc.id;
        });

        if (anuncioId) {
            await db.collection('anuncios').doc(anuncioId).update({
                titulo: `📅 Clase Programada: ${clase.titulo}`,
                contenido: contenido,
                materia: clase.materia,
                enlaceClase: clase.enlace || null
            });
        } else {
            await crearAnuncioClase(clase);
        }
    } catch (error) {
        console.error('Error al actualizar anuncio:', error);
    }
}

// Actualizar anuncio cuando se cancela una clase
async function actualizarAnuncioCancelacion(clase) {
    try {
        const db = window.firebaseDB;

        const fecha = new Date(clase.fecha + 'T00:00:00');
        const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const horaDisplay = clase.horaInicio && clase.horaFin ? `${clase.horaInicio} - ${clase.horaFin}` : '';

        const anunciosSnapshot = await db.collection('anuncios')
            .where('aulaId', '==', clase.aulaId)
            .where('materia', '==', clase.materia)
            .where('tipo', '==', 'clase')
            .get();

        let anuncioId = null;
        anunciosSnapshot.forEach(doc => {
            const anuncio = doc.data();
            if (anuncio.titulo.includes(clase.titulo)) anuncioId = doc.id;
        });

        const contenidoCancelacion = `⚠️ CLASE CANCELADA ⚠️\n\nLa clase programada para el ${fechaStr} de ${horaDisplay} ha sido cancelada.\n\n📚 Clase: ${clase.titulo}\n\nDisculpa las molestias.`;

        if (anuncioId) {
            await db.collection('anuncios').doc(anuncioId).update({
                titulo: `❌ CANCELADA: ${clase.titulo}`,
                contenido: contenidoCancelacion,
                cancelada: true,
                fechaCancelacion: firebase.firestore.Timestamp.now()
            });
        } else {
            await db.collection('anuncios').add({
                aulaId: clase.aulaId,
                materia: clase.materia,
                titulo: `❌ CANCELADA: ${clase.titulo}`,
                contenido: contenidoCancelacion,
                profesorId: clase.profesorId,
                profesorNombre: clase.profesorNombre,
                autorId: clase.profesorId,
                fecha: firebase.firestore.Timestamp.now(),
                tipo: 'clase',
                cancelada: true,
                fechaCancelacion: firebase.firestore.Timestamp.now()
            });
        }
    } catch (error) {
        console.error('Error al actualizar anuncio de cancelación:', error);
    }
}

// Eliminar anuncio de clase
async function eliminarAnuncioClase(clase) {
    try {
        const db = window.firebaseDB;

        const anunciosSnapshot = await db.collection('anuncios')
            .where('aulaId', '==', clase.aulaId)
            .where('materia', '==', clase.materia)
            .where('tipo', '==', 'clase')
            .get();

        anunciosSnapshot.forEach(async (doc) => {
            const anuncio = doc.data();
            if (anuncio.titulo.includes(clase.titulo)) {
                await db.collection('anuncios').doc(doc.id).delete();
            }
        });
    } catch (error) {
        console.error('Error al eliminar anuncio:', error);
    }
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'Panel_Admin.html';
    });

    // Cambiar aula
    document.getElementById('btnCambiarAula').addEventListener('click', volverASelectorAulas);

    // Inicializar time pickers
    if (typeof attachTimePicker === 'function') {
        attachTimePicker('horaInicioClase');
        attachTimePicker('horaFinClase');
    }

    document.getElementById('horaInicioClase').addEventListener('change', calcularDuracion);
    document.getElementById('horaFinClase').addEventListener('change', calcularDuracion);

    // Cargar tutores cuando cambia la materia
    document.getElementById('materiaSelect').addEventListener('change', (e) => {
        cargarTutoresPorMateria(e.target.value);
    });

    // View toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (view === 'calendario') {
                document.getElementById('calendarView').style.display = 'block';
                document.getElementById('listView').style.display = 'none';
            } else {
                document.getElementById('calendarView').style.display = 'none';
                document.getElementById('listView').style.display = 'block';
            }
        });
    });

    // Month navigation
    document.getElementById('prevWeek').addEventListener('click', () => {
        currentWeekStart.setMonth(currentWeekStart.getMonth() - 1);
        renderCalendar();
        loadClasses();
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        currentWeekStart.setMonth(currentWeekStart.getMonth() + 1);
        renderCalendar();
        loadClasses();
    });

    // Filtros
    document.getElementById('filtroMateria').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);

    // Modal controls
    document.getElementById('btnNuevaClaseLista').addEventListener('click', () => openNewClassModal());

    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelarClase').addEventListener('click', closeModal);

    document.getElementById('modalNuevaClase').addEventListener('click', (e) => {
        if (e.target.id === 'modalNuevaClase') closeModal();
    });

    // Modal Ver Clase (solo lectura)
    document.getElementById('closeModalVerClase').addEventListener('click', closeModalVerClase);
    document.getElementById('cerrarVerClase').addEventListener('click', closeModalVerClase);
    document.getElementById('btnEditarDesdeVer').addEventListener('click', () => {
        const claseIdParaEditar = currentViewingClassId;
        document.getElementById('modalVerClase').classList.remove('active');
        currentViewingClassId = null;
        if (claseIdParaEditar) {
            editClass(claseIdParaEditar);
        }
    });
    document.getElementById('modalVerClase').addEventListener('click', (e) => {
        if (e.target.id === 'modalVerClase') closeModalVerClase();
    });

    // Form submit
    document.getElementById('formNuevaClase').addEventListener('submit', handleFormSubmit);

    // Historial de pagos
    document.getElementById('btnHistorialPagos').addEventListener('click', openHistorialPagos);
    document.getElementById('closeModalHistorial').addEventListener('click', closeHistorialPagos);
    document.getElementById('prevWeekHistorial').addEventListener('click', () => {
        historialWeekStart.setDate(historialWeekStart.getDate() - 7);
        historialWeekEnd.setDate(historialWeekEnd.getDate() - 7);
        updateHistorialWeekDisplay();
        loadHistorialPagos();
    });
    document.getElementById('nextWeekHistorial').addEventListener('click', () => {
        historialWeekStart.setDate(historialWeekStart.getDate() + 7);
        historialWeekEnd.setDate(historialWeekEnd.getDate() + 7);
        updateHistorialWeekDisplay();
        loadHistorialPagos();
    });
    document.getElementById('closeModalComprobanteCalendario').addEventListener('click', closeComprobanteCalendario);

    document.getElementById('modalHistorialPagos').addEventListener('click', (e) => {
        if (e.target.id === 'modalHistorialPagos') closeHistorialPagos();
    });

    document.getElementById('modalVerComprobanteCalendario').addEventListener('click', (e) => {
        if (e.target.id === 'modalVerComprobanteCalendario') closeComprobanteCalendario();
    });
}

function closeModal() {
    editingClassId = null;
    document.getElementById('modalNuevaClase').classList.remove('active');
    document.getElementById('formNuevaClase').reset();
    document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Programar Nueva Clase';
    const submitBtn = document.querySelector('#modalNuevaClase button[type="submit"]');
    submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Programar Clase';
}

// ========== HISTORIAL DE PAGOS ==========

function initializeHistorialWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    historialWeekStart = new Date(today);
    historialWeekStart.setDate(today.getDate() + diff);
    historialWeekStart.setHours(0, 0, 0, 0);

    historialWeekEnd = new Date(historialWeekStart);
    historialWeekEnd.setDate(historialWeekStart.getDate() + 6);
    historialWeekEnd.setHours(23, 59, 59, 999);
}

function updateHistorialWeekDisplay() {
    const weekRangeHistorial = document.getElementById('weekRangeHistorial');
    const options = { day: 'numeric', month: 'short' };
    const start = historialWeekStart.toLocaleDateString('es-ES', options);
    const end = historialWeekEnd.toLocaleDateString('es-ES', options);
    weekRangeHistorial.textContent = `${start} - ${end}`;
}

async function openHistorialPagos() {
    initializeHistorialWeek();
    updateHistorialWeekDisplay();
    document.getElementById('modalHistorialPagos').classList.add('active');
    await loadHistorialPagos();
}

function closeHistorialPagos() {
    document.getElementById('modalHistorialPagos').classList.remove('active');
}

async function loadHistorialPagos() {
    const historialContent = document.getElementById('historialPagosContent');
    historialContent.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const startDateStr = historialWeekStart.toISOString().split('T')[0];
        const endDateStr = historialWeekEnd.toISOString().split('T')[0];

        const pagosSnapshot = await db.collection('pagos_profesores')
            .where('profesorId', '==', currentUser.id)
            .get();

        const pagos = [];
        pagosSnapshot.forEach(doc => {
            const pago = doc.data();
            pago.id = doc.id;

            let fechaPago = '';
            if (pago.fechaPago) {
                if (pago.fechaPago.toDate) {
                    fechaPago = pago.fechaPago.toDate().toISOString().split('T')[0];
                } else if (typeof pago.fechaPago === 'string') {
                    fechaPago = pago.fechaPago.split('T')[0];
                }
            }

            if (fechaPago >= startDateStr && fechaPago <= endDateStr) {
                pagos.push(pago);
            }
        });

        if (pagos.length === 0) {
            historialContent.innerHTML = `
                <div class="historial-empty">
                    <i class="bi bi-cash-stack"></i>
                    <h4>Sin pagos esta semana</h4>
                    <p>No hay registros de pagos para este período</p>
                </div>
            `;
            return;
        }

        pagos.sort((a, b) => {
            const fechaA = a.fechaPago?.toDate ? a.fechaPago.toDate() : new Date(a.fechaPago);
            const fechaB = b.fechaPago?.toDate ? b.fechaPago.toDate() : new Date(b.fechaPago);
            return fechaB - fechaA;
        });

        historialContent.innerHTML = pagos.map(pago => {
            const fechaPago = pago.fechaPago?.toDate ? pago.fechaPago.toDate() : new Date(pago.fechaPago);
            const fechaStr = fechaPago.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

            return `
                <div class="historial-pago-card">
                    <div class="historial-pago-header">
                        <div class="historial-pago-info">
                            <h4>Pago por Clases</h4>
                            <div class="historial-pago-fecha"><i class="bi bi-calendar-check"></i>${fechaStr}</div>
                        </div>
                        <div class="historial-pago-monto">
                            <div class="monto-label">Monto</div>
                            <div class="monto-valor">$${(pago.monto || 0).toLocaleString()}</div>
                        </div>
                    </div>
                    <div class="historial-pago-detalles">
                        <div class="historial-detalle-item">
                            <div class="label">Clases</div>
                            <div class="value">${pago.cantidadClases || 0}</div>
                        </div>
                        <div class="historial-detalle-item">
                            <div class="label">Período</div>
                            <div class="value">${pago.periodo || 'N/A'}</div>
                        </div>
                    </div>
                    ${pago.notas ? `<div class="historial-pago-notas"><strong>Notas:</strong> ${pago.notas}</div>` : ''}
                    ${pago.comprobanteUrl ? `
                        <div class="historial-pago-actions">
                            <button class="btn-ver-comprobante" onclick="verComprobanteCalendario('${pago.comprobanteUrl}')">
                                <i class="bi bi-receipt"></i>
                                Ver Comprobante
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Error al cargar historial de pagos:', error);
        historialContent.innerHTML = `
            <div class="historial-empty">
                <i class="bi bi-exclamation-triangle"></i>
                <h4>Error al cargar</h4>
                <p>No se pudo cargar el historial de pagos</p>
            </div>
        `;
    }
}

function verComprobanteCalendario(url) {
    document.getElementById('comprobanteImageCalendario').src = url;
    document.getElementById('comprobanteLinkCalendario').href = url;
    document.getElementById('modalVerComprobanteCalendario').classList.add('active');
}

function closeComprobanteCalendario() {
    document.getElementById('modalVerComprobanteCalendario').classList.remove('active');
}

window.verComprobanteCalendario = verComprobanteCalendario;
