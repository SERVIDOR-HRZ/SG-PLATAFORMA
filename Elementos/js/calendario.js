// Calendario JavaScript
let currentWeekStart = null;
let currentUser = null;
let userAsignaturas = [];

document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    loadUserInfo();
    setupEventListeners();
    initializeCalendar();
});

// Funciones de notificación personalizadas
function showNotification(title, message, type = 'success') {
    return new Promise((resolve) => {
        const modal = document.getElementById('notificationModal');
        const icon = document.getElementById('notificationIcon');
        const titleEl = document.getElementById('notificationTitle');
        const messageEl = document.getElementById('notificationMessage');
        const btn = document.getElementById('notificationBtn');

        // Configurar icono según tipo
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
    await cargarAsignaturasProfesor();
}

// Cargar asignaturas del profesor
async function cargarAsignaturasProfesor() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const usuarioDoc = await db.collection('usuarios').doc(currentUser.id).get();
        const userData = usuarioDoc.data();
        const rol = userData.rol || currentUser.rol;

        // Si es superusuario, puede crear clases para todas las materias
        if (rol === 'superusuario') {
            userAsignaturas = ['matematicas', 'lectura', 'sociales', 'naturales', 'ingles'];
        } else {
            // Si es profesor, solo sus asignaturas
            userAsignaturas = userData.asignaturas || [];
        }

        // Cargar materias en el select
        cargarMateriasSelect();

        // Cargar todos los profesores
        await cargarTodosLosProfesores();

    } catch (error) {
        console.error('Error al cargar asignaturas:', error);
    }
}

// Cargar todos los profesores (para filtrar después)
let todosLosProfesores = [];

async function cargarTodosLosProfesores() {
    try {
        const db = window.firebaseDB;

        // Obtener todos los usuarios tipo admin (profesores)
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
                rol: profesor.rol
            });
        });

        console.log('Profesores cargados:', todosLosProfesores);

    } catch (error) {
        console.error('Error al cargar profesores:', error);
    }
}

// Cargar tutores según la materia seleccionada
function cargarTutoresPorMateria(materia) {
    const tutorSelect = document.getElementById('tutorSelect');
    tutorSelect.innerHTML = '<option value="">Seleccionar tutor</option>';

    if (!materia) {
        return;
    }

    // Filtrar profesores que tienen esta materia específica en sus asignaturas
    // Ya NO incluimos superusuarios automáticamente, deben tener la materia asignada
    const profesoresFiltrados = todosLosProfesores.filter(profesor => {
        return profesor.asignaturas && profesor.asignaturas.includes(materia);
    });

    console.log('Profesores con materia', materia, ':', profesoresFiltrados);

    // Verificar si el usuario actual tiene esta materia
    const usuarioActualTieneMateria = profesoresFiltrados.some(p => p.id === currentUser.id);

    // Agregar opción del usuario actual primero si tiene la materia
    if (usuarioActualTieneMateria) {
        const optionActual = document.createElement('option');
        optionActual.value = currentUser.id;
        optionActual.textContent = `${currentUser.nombre} (Yo)`;
        optionActual.selected = true;
        tutorSelect.appendChild(optionActual);
    }

    // Agregar otros profesores que tienen esta materia
    profesoresFiltrados.forEach(profesor => {
        if (profesor.id !== currentUser.id) {
            const option = document.createElement('option');
            option.value = profesor.id;
            option.textContent = profesor.nombre;

            // Si el usuario actual no tiene la materia, seleccionar el primero disponible
            if (!usuarioActualTieneMateria && tutorSelect.options.length === 1) {
                option.selected = true;
            }

            tutorSelect.appendChild(option);
        }
    });

    // Si no hay tutores disponibles para esta materia
    if (tutorSelect.options.length === 1) {
        tutorSelect.innerHTML = '<option value="">No hay tutores disponibles para esta materia</option>';
    }
}

// Cargar materias en el select
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

// Initialize calendar
function initializeCalendar() {
    // Establecer el mes actual
    const today = new Date();
    currentWeekStart = new Date(today.getFullYear(), today.getMonth(), 1);

    renderCalendar();
    loadClasses();
}

// Render calendar
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';

    // Actualizar título del mes
    updateWeekRange();

    // Días de la semana
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Header
    dias.forEach(dia => {
        const cell = document.createElement('div');
        cell.className = 'calendar-header-cell';
        cell.textContent = dia;
        calendarGrid.appendChild(cell);
    });

    // Obtener primer y último día del mes
    const year = currentWeekStart.getFullYear();
    const month = currentWeekStart.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Ajustar primer día (0 = Domingo, 1 = Lunes, etc.)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Convertir para que Lunes sea 0

    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        createDayCell(date, true);
    }

    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        createDayCell(date, false);
    }

    // Días del mes siguiente para completar la cuadrícula
    const totalCells = calendarGrid.children.length - 7; // Restar header
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

    if (isOtherMonth) {
        cell.classList.add('other-month');
    }

    // Verificar si es hoy
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        cell.classList.add('today');
    }

    const dateStr = date.toISOString().split('T')[0];
    cell.dataset.date = dateStr;

    // Número del día
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    cell.appendChild(dayNumber);

    // Contenedor de clases
    const classesContainer = document.createElement('div');
    classesContainer.className = 'classes-container';
    classesContainer.dataset.date = dateStr;
    cell.appendChild(classesContainer);

    // Click para crear nueva clase
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

    // Capitalizar primera letra
    const monthCapitalized = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);

    document.getElementById('weekRange').textContent = monthCapitalized;
}

// Load classes
async function loadClasses() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        // Calcular rango de fechas del mes
        const year = currentWeekStart.getFullYear();
        const month = currentWeekStart.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDate = firstDay.toISOString().split('T')[0];
        const endDate = lastDay.toISOString().split('T')[0];

        console.log('Cargando clases del mes:', startDate, 'a', endDate);

        // Obtener todas las clases y filtrar manualmente
        const clasesSnapshot = await db.collection('clases_programadas').get();

        console.log('Total de clases en BD:', clasesSnapshot.size);

        // Limpiar clases anteriores
        document.querySelectorAll('.class-card-mini').forEach(el => el.remove());

        // Filtrar y ordenar clases del mes
        const clases = [];
        clasesSnapshot.forEach(doc => {
            const clase = doc.data();
            clase.id = doc.id;

            console.log('Clase encontrada:', clase.fecha, clase.titulo);

            // Filtrar por rango de fechas
            if (clase.fecha >= startDate && clase.fecha <= endDate) {
                clases.push(clase);
                console.log('Clase incluida en el mes:', clase.titulo);
            }
        });

        console.log('Clases del mes actual:', clases.length);

        // Ordenar por fecha y hora
        clases.sort((a, b) => {
            // Comparar fechas
            if (a.fecha !== b.fecha) {
                return a.fecha < b.fecha ? -1 : 1;
            }

            // Comparar horas (usar horaInicio si existe, sino hora)
            const horaA = a.horaInicio || a.hora || '00:00';
            const horaB = b.horaInicio || b.hora || '00:00';

            return horaA < horaB ? -1 : 1;
        });

        // Renderizar clases
        clases.forEach(clase => {
            renderClassInCalendar(clase);
        });

        // Renderizar lista (crear snapshot simulado)
        const simulatedSnapshot = {
            empty: clases.length === 0,
            size: clases.length,
            forEach: (callback) => {
                clases.forEach((clase, index) => {
                    callback({
                        id: clase.id,
                        data: () => {
                            const claseData = { ...clase };
                            delete claseData.id;
                            return claseData;
                        }
                    });
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

    console.log('Renderizando clase en calendario:', dateStr, clase.titulo);

    // Buscar contenedor de clases para esa fecha
    const container = document.querySelector(`.classes-container[data-date="${dateStr}"]`);

    if (container) {
        console.log('Contenedor encontrado para:', dateStr);

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
            // Si es admin, abrir para editar
            if (currentUser.tipoUsuario === 'admin') {
                editClass(clase.id);
            } else {
                viewClassDetails(clase);
            }
        });

        container.appendChild(classCard);
    } else {
        console.log('Contenedor NO encontrado para:', dateStr);
    }
}

// Cargar materias en el filtro
function cargarMateriasEnFiltro() {
    const filtroMateria = document.getElementById('filtroMateria');
    const materiasNombres = {
        'matematicas': 'Matemáticas',
        'lectura': 'Lectura Crítica',
        'sociales': 'Ciencias Sociales',
        'naturales': 'Ciencias Naturales',
        'ingles': 'Inglés'
    };

    // Limpiar opciones existentes excepto "Todas"
    filtroMateria.innerHTML = '<option value="">Todas las materias</option>';

    // Agregar materias
    Object.keys(materiasNombres).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = materiasNombres[key];
        filtroMateria.appendChild(option);
    });
}

// Aplicar filtros a la lista
function aplicarFiltros() {
    const filtroMateria = document.getElementById('filtroMateria').value;
    const filtroEstado = document.getElementById('filtroEstado').value;
    const classCards = document.querySelectorAll('.class-card-full');

    classCards.forEach(card => {
        const materia = card.dataset.materia;
        const estado = card.dataset.estado || '';

        const matchMateria = !filtroMateria || materia === filtroMateria;
        const matchEstado = !filtroEstado || estado === filtroEstado;

        if (matchMateria && matchEstado) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });

    // Mostrar mensaje si no hay resultados
    const visibleCards = Array.from(classCards).filter(card => card.style.display !== 'none');
    const classesList = document.getElementById('classesList');
    
    const existingEmpty = classesList.querySelector('.empty-state-filter');
    if (existingEmpty) {
        existingEmpty.remove();
    }

    if (visibleCards.length === 0 && classCards.length > 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state empty-state-filter';
        emptyDiv.innerHTML = `
            <i class="bi bi-funnel"></i>
            <h3>No se encontraron clases</h3>
            <p>Intenta con otros filtros</p>
        `;
        classesList.appendChild(emptyDiv);
    }
}

// Render class list
function renderClassList(clasesSnapshot) {
    const classesList = document.getElementById('classesList');
    classesList.innerHTML = '';

    // Cargar materias en el filtro
    cargarMateriasEnFiltro();

    if (clasesSnapshot.empty) {
        classesList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-calendar-x"></i>
                <h3>No hay clases programadas</h3>
                <p>Comienza programando tu primera clase</p>
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
                        ${clase.tutorNombre ? `
                        <div class="class-meta-item">
                            <i class="bi bi-person"></i>
                            <span>Tutor: ${clase.tutorNombre}</span>
                        </div>
                        ` : ''}
                        <div class="class-meta-item">
                            <i class="bi bi-calendar"></i>
                            <span>${fechaStr}</span>
                        </div>
                        <div class="class-meta-item">
                            <i class="bi bi-clock"></i>
                            <span>${horaDisplay} (${clase.duracion} min)</span>
                        </div>
                        ${clase.unidad ? `
                        <div class="class-meta-item">
                            <i class="bi bi-folder"></i>
                            <span>${clase.unidad}</span>
                        </div>
                        ` : ''}
                        ${clase.tema ? `
                        <div class="class-meta-item">
                            <i class="bi bi-tag"></i>
                            <span>${clase.tema}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
                <div class="class-actions">
                    ${getClassStatusButtons(clase)}
                    <button class="btn-icon" onclick="editClass('${clase.id}')">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteClass('${clase.id}')">
                        <i class="bi bi-trash"></i>
                    </button>
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
    
    return `
        <div class="class-status-badge-compact ${estado}">
            <i class="bi bi-${config.icon}"></i>
            <span>${config.text}</span>
        </div>
    `;
}

// Get class status badge (mantener para compatibilidad)
function getClassStatusBadge(clase) {
    return getClassStatusBadgeHTML(clase);
}

// Get class status buttons
function getClassStatusButtons(clase) {
    const estado = clase.estado || 'pendiente';
    
    if (estado === 'confirmada') {
        return `
            <button class="btn-status confirmed" title="Clase Confirmada" disabled>
                <i class="bi bi-check-circle-fill"></i>
            </button>
        `;
    } else if (estado === 'cancelada') {
        return `
            <button class="btn-status cancelled" title="Clase Cancelada" disabled>
                <i class="bi bi-x-circle-fill"></i>
            </button>
        `;
    } else {
        return `
            <button class="btn-status confirm" onclick="confirmClass('${clase.id}')" title="Confirmar Clase">
                <i class="bi bi-check-circle"></i>
            </button>
            <button class="btn-status cancel" onclick="cancelClass('${clase.id}')" title="Cancelar Clase">
                <i class="bi bi-x-circle"></i>
            </button>
        `;
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
    const confirmed = await showConfirm('Cancelar Clase', '¿Estás seguro de que deseas cancelar esta clase? Se actualizará el anuncio en el aula.');
    
    if (confirmed) {
        try {
            // Obtener datos de la clase
            const claseDoc = await window.firebaseDB.collection('clases_programadas').doc(classId).get();
            const claseData = claseDoc.data();
            
            // Actualizar estado de la clase
            await window.firebaseDB.collection('clases_programadas').doc(classId).update({
                estado: 'cancelada',
                canceladaEn: firebase.firestore.FieldValue.serverTimestamp(),
                canceladaPor: currentUser.id
            });
            
            // Actualizar el anuncio para indicar que la clase fue cancelada
            await actualizarAnuncioCancelacion(claseData);
            
            await showNotification('Clase Cancelada', 'La clase ha sido cancelada y se ha notificado en el aula');
            loadClasses();
        } catch (error) {
            console.error('Error cancelling class:', error);
            await showNotification('Error', 'No se pudo cancelar la clase', 'error');
        }
    }
}

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
    mensaje += `Hora: ${clase.hora}\n`;
    mensaje += `Duración: ${clase.duracion} minutos\n`;

    if (clase.descripcion) {
        mensaje += `\nDescripción:\n${clase.descripcion}\n`;
    }

    if (clase.enlace) {
        mensaje += `\nEnlace: ${clase.enlace}`;
    }

    alert(mensaje);
}

// Edit class
let editingClassId = null;

async function editClass(claseId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        // Obtener datos de la clase
        const claseDoc = await db.collection('clases_programadas').doc(claseId).get();

        if (!claseDoc.exists) {
            await showNotification('Error', 'Clase no encontrada', 'error');
            return;
        }

        const clase = claseDoc.data();
        editingClassId = claseId;

        // Llenar el formulario con los datos actuales
        document.getElementById('materiaSelect').value = clase.materia;

        // Cargar tutores para esta materia
        cargarTutoresPorMateria(clase.materia);

        // Esperar un momento para que se carguen los tutores
        setTimeout(() => {
            document.getElementById('tutorSelect').value = clase.tutorId || currentUser.id;
        }, 100);

        document.getElementById('tipologiaClase').value = clase.tipologia || '';
        document.getElementById('unidadClase').value = clase.unidad || '';
        document.getElementById('temaClase').value = clase.tema || '';
        document.getElementById('tituloClase').value = clase.titulo;
        document.getElementById('descripcionClase').value = clase.descripcion || '';
        document.getElementById('fechaClase').value = clase.fecha;
        document.getElementById('horaInicioClase').value = clase.horaInicio || clase.hora || '';
        document.getElementById('horaFinClase').value = clase.horaFin || '';
        document.getElementById('duracionClase').value = clase.duracion;
        document.getElementById('enlaceClase').value = clase.enlace || '';

        // Calcular duración si no existe horaFin
        if (clase.horaInicio && !clase.horaFin && clase.duracion) {
            const [hora, min] = clase.horaInicio.split(':').map(Number);
            const minutosInicio = hora * 60 + min;
            const minutosFin = minutosInicio + clase.duracion;
            const horaFin = Math.floor(minutosFin / 60);
            const minFin = minutosFin % 60;
            document.getElementById('horaFinClase').value = `${horaFin.toString().padStart(2, '0')}:${minFin.toString().padStart(2, '0')}`;
        }

        // Cambiar el título del modal
        document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Editar Clase';

        // Cambiar el texto del botón
        const submitBtn = document.querySelector('#formNuevaClase button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Actualizar Clase';

        // Abrir modal
        document.getElementById('modalNuevaClase').classList.add('active');

    } catch (error) {
        console.error('Error al cargar clase:', error);
        await showNotification('Error', 'Error al cargar los datos de la clase', 'error');
    }
}

// Make editClass global
window.editClass = editClass;

// Open new class modal
function openNewClassModal(date = null) {
    // Reset editing mode
    editingClassId = null;

    // Resetear el formulario
    document.getElementById('formNuevaClase').reset();

    // Limpiar selector de tutores
    document.getElementById('tutorSelect').innerHTML = '<option value="">Primero selecciona una materia</option>';

    // Restaurar título y botón del modal
    document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Programar Nueva Clase';
    const submitBtn = document.querySelector('#formNuevaClase button[type="submit"]');
    submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Programar Clase';

    const modal = document.getElementById('modalNuevaClase');
    modal.classList.add('active');

    // Pre-llenar fecha si se proporciona
    if (date) {
        document.getElementById('fechaClase').value = date.toISOString().split('T')[0];
    }
}

// Calcular duración automáticamente
function calcularDuracion() {
    const horaInicio = document.getElementById('horaInicioClase').value;
    const horaFin = document.getElementById('horaFinClase').value;

    if (horaInicio && horaFin) {
        const [horaI, minI] = horaInicio.split(':').map(Number);
        const [horaF, minF] = horaFin.split(':').map(Number);

        const minutosInicio = horaI * 60 + minI;
        const minutosFin = horaF * 60 + minF;

        let duracion = minutosFin - minutosInicio;

        // Si la hora fin es menor que la hora inicio, asumimos que cruza medianoche
        if (duracion < 0) {
            duracion += 24 * 60;
        }

        document.getElementById('duracionClase').value = duracion;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = 'Panel_Admin.html';
    });

    // Calcular duración cuando cambian las horas
    document.getElementById('horaInicioClase').addEventListener('change', calcularDuracion);
    document.getElementById('horaFinClase').addEventListener('change', calcularDuracion);

    // Cargar tutores cuando cambia la materia
    document.getElementById('materiaSelect').addEventListener('change', (e) => {
        const materia = e.target.value;
        cargarTutoresPorMateria(materia);
    });

    // View toggle
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;

            // Toggle active class
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle views
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

    // Filtros de lista
    document.getElementById('filtroMateria').addEventListener('change', aplicarFiltros);
    document.getElementById('filtroEstado').addEventListener('change', aplicarFiltros);

    // Modal controls
    document.getElementById('btnNuevaClaseLista').addEventListener('click', () => {
        openNewClassModal();
    });

    document.getElementById('closeModal').addEventListener('click', () => {
        editingClassId = null;
        document.getElementById('modalNuevaClase').classList.remove('active');
        document.getElementById('formNuevaClase').reset();

        // Restaurar título y botón del modal
        document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Programar Nueva Clase';
        const submitBtn = document.querySelector('#formNuevaClase button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Programar Clase';
    });

    document.getElementById('cancelarClase').addEventListener('click', () => {
        editingClassId = null;
        document.getElementById('modalNuevaClase').classList.remove('active');
        document.getElementById('formNuevaClase').reset();

        // Restaurar título y botón del modal
        document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Programar Nueva Clase';
        const submitBtn = document.querySelector('#formNuevaClase button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Programar Clase';
    });

    // Close modal on outside click
    document.getElementById('modalNuevaClase').addEventListener('click', (e) => {
        if (e.target.id === 'modalNuevaClase') {
            editingClassId = null;
            document.getElementById('modalNuevaClase').classList.remove('active');
            document.getElementById('formNuevaClase').reset();

            // Restaurar título y botón del modal
            document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Programar Nueva Clase';
            const submitBtn = document.querySelector('#formNuevaClase button[type="submit"]');
            submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Programar Clase';
        }
    });

    // Form submit
    document.getElementById('formNuevaClase').addEventListener('submit', handleFormSubmit);
}

// Handle form submit
async function handleFormSubmit(e) {
    e.preventDefault();

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
        const horaInicio = document.getElementById('horaInicioClase').value;
        const horaFin = document.getElementById('horaFinClase').value;
        const duracion = document.getElementById('duracionClase').value;
        const enlace = document.getElementById('enlaceClase').value;

        // Validar campos requeridos
        if (!materia || !tipologia || !titulo || !tutorId || !fecha || !horaInicio || !horaFin) {
            await showNotification('Campos Requeridos', 'Por favor completa todos los campos requeridos (*)', 'warning');
            return;
        }

        // Validar que la hora fin sea mayor que la hora inicio
        if (horaFin <= horaInicio) {
            await showNotification('Error de Horario', 'La hora de fin debe ser mayor que la hora de inicio', 'error');
            return;
        }

        // Obtener nombre del tutor
        let tutorNombre = currentUser.nombre;
        if (tutorId !== currentUser.id) {
            const tutorDoc = await db.collection('usuarios').doc(tutorId).get();
            if (tutorDoc.exists) {
                tutorNombre = tutorDoc.data().nombre;
            }
        }

        const claseData = {
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
            estado: 'pendiente' // Estado inicial: pendiente de confirmación
        };

        if (editingClassId) {
            // Modo edición
            console.log('Actualizando clase:', editingClassId);

            claseData.actualizadoEn = new Date().toISOString();

            await db.collection('clases_programadas').doc(editingClassId).update(claseData);
            console.log('Clase actualizada');

            // Actualizar anuncio en el aula
            await actualizarAnuncioClase(editingClassId, claseData);

            await showNotification('¡Éxito!', 'Clase actualizada exitosamente', 'success');
            editingClassId = null;

        } else {
            // Modo creación
            console.log('Creando clase:', claseData);

            claseData.creadoEn = new Date().toISOString();

            const docRef = await db.collection('clases_programadas').add(claseData);
            console.log('Clase creada con ID:', docRef.id);

            // Crear anuncio en el aula
            await crearAnuncioClase(claseData);

            await showNotification('¡Éxito!', 'Clase programada exitosamente', 'success');
        }

        // Cerrar modal y recargar
        document.getElementById('modalNuevaClase').classList.remove('active');
        document.getElementById('formNuevaClase').reset();

        // Restaurar título y botón del modal
        document.querySelector('#modalNuevaClase .modal-header h3').textContent = 'Programar Nueva Clase';
        const submitBtn = document.querySelector('#formNuevaClase button[type="submit"]');
        submitBtn.innerHTML = '<i class="bi bi-check-circle"></i> Programar Clase';

        // Recargar clases
        await loadClasses();

    } catch (error) {
        console.error('Error al procesar clase:', error);
        await showNotification('Error', 'Error al procesar la clase: ' + error.message, 'error');
    }
}

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

        const horaDisplay = clase.horaInicio && clase.horaFin
            ? `${clase.horaInicio} - ${clase.horaFin}`
            : clase.hora || '';

        let contenido = `Se ha programado una nueva clase para el ${fechaStr} de ${horaDisplay}.\n\n`;

        if (clase.tipologia) {
            contenido += `📋 Tipología: ${tipologiasNombres[clase.tipologia] || clase.tipologia}\n`;
        }

        if (clase.unidad) {
            contenido += `📁 Unidad: ${clase.unidad}\n`;
        }

        if (clase.tema) {
            contenido += `🏷️ Tema: ${clase.tema}\n`;
        }

        if (clase.tutorNombre) {
            contenido += `👨‍🏫 Tutor: ${clase.tutorNombre}\n`;
        }

        contenido += `⏱️ Duración: ${clase.duracion} minutos\n`;

        if (clase.descripcion) {
            contenido += `\n${clase.descripcion}`;
        }

        if (clase.enlace) {
            contenido += `\n\n🔗 Enlace de la clase: ${clase.enlace}`;
            contenido += `\n\n👉 Haz clic en el enlace de arriba para unirte a la clase virtual.`;
        }

        const anuncio = {
            materia: clase.materia,
            titulo: `📅 Clase Programada: ${clase.titulo}`,
            contenido: contenido,
            profesorId: clase.profesorId,
            profesorNombre: clase.profesorNombre,
            autorId: clase.profesorId,
            fecha: firebase.firestore.Timestamp.now(),
            tipo: 'clase',
            enlaceClase: clase.enlace || null,
            claseId: null
        };

        const docRef = await db.collection('anuncios').add(anuncio);
        console.log('Anuncio creado con ID:', docRef.id);

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

        const horaDisplay = clase.horaInicio && clase.horaFin
            ? `${clase.horaInicio} - ${clase.horaFin}`
            : clase.hora || '';

        let contenido = `Se ha programado una nueva clase para el ${fechaStr} de ${horaDisplay}.\n\n`;

        if (clase.tipologia) {
            contenido += `📋 Tipología: ${tipologiasNombres[clase.tipologia] || clase.tipologia}\n`;
        }

        if (clase.unidad) {
            contenido += `📁 Unidad: ${clase.unidad}\n`;
        }

        if (clase.tema) {
            contenido += `🏷️ Tema: ${clase.tema}\n`;
        }

        if (clase.tutorNombre) {
            contenido += `👨‍🏫 Tutor: ${clase.tutorNombre}\n`;
        }

        contenido += `⏱️ Duración: ${clase.duracion} minutos\n`;

        if (clase.descripcion) {
            contenido += `\n${clase.descripcion}`;
        }

        if (clase.enlace) {
            contenido += `\n\n🔗 Enlace de la clase: ${clase.enlace}`;
            contenido += `\n\n👉 Haz clic en el enlace de arriba para unirte a la clase virtual.`;
        }

        // Buscar el anuncio asociado a esta clase
        const anunciosSnapshot = await db.collection('anuncios')
            .where('materia', '==', clase.materia)
            .where('tipo', '==', 'clase')
            .where('profesorId', '==', clase.profesorId)
            .get();

        // Buscar el anuncio que corresponde a esta clase por el título
        let anuncioId = null;
        anunciosSnapshot.forEach(doc => {
            const anuncio = doc.data();
            if (anuncio.titulo.includes(clase.titulo)) {
                anuncioId = doc.id;
            }
        });

        if (anuncioId) {
            // Actualizar el anuncio existente
            const anuncioActualizado = {
                titulo: `📅 Clase Programada: ${clase.titulo}`,
                contenido: contenido,
                materia: clase.materia,
                enlaceClase: clase.enlace || null
            };

            await db.collection('anuncios').doc(anuncioId).update(anuncioActualizado);
            console.log('Anuncio actualizado:', anuncioId);
        } else {
            // Si no se encuentra el anuncio, crear uno nuevo
            console.log('Anuncio no encontrado, creando uno nuevo');
            await crearAnuncioClase(clase);
        }

    } catch (error) {
        console.error('Error al actualizar anuncio:', error);
    }
}

// Delete class
async function deleteClass(claseId) {
    const confirmed = await showConfirm(
        'Eliminar Clase',
        '¿Estás seguro de que deseas eliminar esta clase? También se eliminará el anuncio en el aula.'
    );

    if (!confirmed) {
        return;
    }

    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        // Obtener datos de la clase antes de eliminarla
        const claseDoc = await db.collection('clases_programadas').doc(claseId).get();

        if (claseDoc.exists) {
            const clase = claseDoc.data();

            // Eliminar la clase
            await db.collection('clases_programadas').doc(claseId).delete();
            console.log('Clase eliminada:', claseId);

            // Buscar y eliminar el anuncio asociado
            await eliminarAnuncioClase(clase);
        }

        loadClasses();
        await showNotification('¡Éxito!', 'Clase y anuncio eliminados exitosamente', 'success');

    } catch (error) {
        console.error('Error al eliminar clase:', error);
        await showNotification('Error', 'Error al eliminar la clase', 'error');
    }
}

// Actualizar anuncio cuando se cancela una clase
async function actualizarAnuncioCancelacion(clase) {
    try {
        const db = window.firebaseDB;

        const fecha = new Date(clase.fecha + 'T00:00:00');
        const fechaStr = fecha.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

        const horaDisplay = clase.horaInicio && clase.horaFin
            ? `${clase.horaInicio} - ${clase.horaFin}`
            : clase.hora || '';

        // Buscar el anuncio asociado a esta clase
        const anunciosSnapshot = await db.collection('anuncios')
            .where('materia', '==', clase.materia)
            .where('tipo', '==', 'clase')
            .where('profesorId', '==', clase.profesorId)
            .get();

        // Buscar el anuncio que corresponde a esta clase por el título
        let anuncioId = null;
        anunciosSnapshot.forEach(doc => {
            const anuncio = doc.data();
            if (anuncio.titulo.includes(clase.titulo)) {
                anuncioId = doc.id;
            }
        });

        if (anuncioId) {
            // Actualizar el anuncio existente con información de cancelación
            const contenidoCancelacion = `⚠️ CLASE CANCELADA ⚠️\n\nLa clase programada para el ${fechaStr} de ${horaDisplay} ha sido cancelada.\n\n📚 Clase: ${clase.titulo}\n\nDisculpa las molestias. Te notificaremos cuando se reprograme.`;

            await db.collection('anuncios').doc(anuncioId).update({
                titulo: `❌ CANCELADA: ${clase.titulo}`,
                contenido: contenidoCancelacion,
                cancelada: true,
                fechaCancelacion: firebase.firestore.Timestamp.now()
            });

            console.log('Anuncio actualizado con cancelación:', anuncioId);
        } else {
            // Si no se encuentra el anuncio, crear uno nuevo de cancelación
            console.log('Anuncio no encontrado, creando anuncio de cancelación');
            
            const contenidoCancelacion = `⚠️ CLASE CANCELADA ⚠️\n\nLa clase programada para el ${fechaStr} de ${horaDisplay} ha sido cancelada.\n\n📚 Clase: ${clase.titulo}\n\nDisculpa las molestias. Te notificaremos cuando se reprograme.`;

            const anuncioCancelacion = {
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
            };

            await db.collection('anuncios').add(anuncioCancelacion);
            console.log('Anuncio de cancelación creado');
        }

    } catch (error) {
        console.error('Error al actualizar anuncio de cancelación:', error);
    }
}

// Eliminar anuncio de clase
async function eliminarAnuncioClase(clase) {
    try {
        const db = window.firebaseDB;

        // Buscar el anuncio asociado a esta clase
        const anunciosSnapshot = await db.collection('anuncios')
            .where('materia', '==', clase.materia)
            .where('tipo', '==', 'clase')
            .where('profesorId', '==', clase.profesorId)
            .get();

        // Buscar el anuncio que corresponde a esta clase por el título
        anunciosSnapshot.forEach(async (doc) => {
            const anuncio = doc.data();
            // Verificar si el título contiene el título de la clase
            if (anuncio.titulo.includes(clase.titulo)) {
                await db.collection('anuncios').doc(doc.id).delete();
                console.log('Anuncio eliminado:', doc.id);
            }
        });

    } catch (error) {
        console.error('Error al eliminar anuncio:', error);
    }
}

// Make deleteClass global
window.deleteClass = deleteClass;

// Make confirmClass and cancelClass global
window.confirmClass = confirmClass;
window.cancelClass = cancelClass;
