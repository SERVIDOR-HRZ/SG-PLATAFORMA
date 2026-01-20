// Calendario Estudiante - Solo Lectura
let calendarioEstCurrentMonth = new Date();
let calendarioEstCurrentWeek = new Date();
let calendarioEstAulaSeleccionada = null;
let calendarioEstAulaData = null;
let calendarioEstClases = [];
let calendarioEstAulas = [];
let currentUserEst = null;
let filtroMateriaActivo = ''; // Filtro de materia para vista semanal

// Links predeterminados por materia
const LINKS_MATERIAS = {
    'matematicas': 'https://meet.google.com/swm-cavq-xqz',
    'lectura': 'https://meet.google.com/hnq-ufiv-kjv',
    'sociales': 'https://meet.google.com/skb-jdkg-fnb',
    'naturales': 'https://meet.google.com/ubb-gpgj-jug',
    'ingles': 'https://meet.google.com/ihn-ihft-trk'
};

// Configuración de materias
const materiasConfigEst = {
    'matematicas': { nombre: 'Matemáticas', icon: 'bi-calculator-fill', color: '#2196F3' },
    'lectura': { nombre: 'Lectura Crítica', icon: 'bi-book-fill', color: '#F44336' },
    'sociales': { nombre: 'Ciencias Sociales', icon: 'bi-globe', color: '#FF9800' },
    'naturales': { nombre: 'Ciencias Naturales', icon: 'bi-tree-fill', color: '#4CAF50' },
    'ingles': { nombre: 'Inglés', icon: 'bi-translate', color: '#9C27B0' },
    'anuncios': { nombre: 'Anuncios', icon: 'bi-megaphone-fill', color: '#1a1a1a' }
};

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    checkAuthenticationEst();
    loadUserInfoEst();
    setupCalendarioEstudianteEvents();
    cargarAulasEstudiante();
});

// Verificar autenticación
function checkAuthenticationEst() {
    currentUserEst = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUserEst.id) {
        window.location.href = '../index.html';
        return;
    }
}

// Cargar info del usuario
async function loadUserInfoEst() {
    if (currentUserEst.nombre) {
        document.getElementById('userName').textContent = currentUserEst.nombre.toUpperCase();
    }
    await cargarFotoPerfilEst(currentUserEst.id);
}

// Cargar foto de perfil
async function cargarFotoPerfilEst(usuarioId) {
    try {
        await esperarFirebaseEst();
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

// Volver al panel principal
function volverAlPanel() {
    window.location.href = 'Panel_Estudiantes.html';
}

// Volver al selector de aulas
function volverASelectorAulasEst() {
    calendarioEstAulaSeleccionada = null;
    calendarioEstAulaData = null;
    
    document.getElementById('aulaSelectorEstudiante').style.display = 'block';
    document.getElementById('calendarioVistaContainer').style.display = 'none';
}

// Cargar aulas del estudiante
async function cargarAulasEstudiante() {
    const grid = document.getElementById('aulasEstudianteGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="loading-calendario"><i class="bi bi-arrow-clockwise"></i><p>Cargando aulas...</p></div>';

    try {
        await esperarFirebaseEst();
        const db = window.firebaseDB;

        if (!currentUserEst || !currentUserEst.id) {
            currentUserEst = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        }

        if (!currentUserEst.id) {
            grid.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">No se pudo cargar la información del usuario</p>';
            return;
        }

        // Obtener aulas asignadas al estudiante
        const usuarioDoc = await db.collection('usuarios').doc(currentUserEst.id).get();
        if (!usuarioDoc.exists) {
            grid.innerHTML = '<p style="text-align:center;color:#999;padding:2rem;">Usuario no encontrado</p>';
            return;
        }

        const userData = usuarioDoc.data();
        const aulasAsignadas = userData.aulasAsignadas || userData.aulas || [];

        if (aulasAsignadas.length === 0) {
            grid.innerHTML = `
                <div style="text-align:center;padding:3rem;color:#666;grid-column:1/-1;">
                    <i class="bi bi-door-closed" style="font-size:4rem;color:#ddd;display:block;margin-bottom:1rem;"></i>
                    <h4 style="margin-bottom:0.5rem;">Sin aulas asignadas</h4>
                    <p style="color:#999;">Contacta con tu coordinador para que te asigne a un aula</p>
                </div>
            `;
            return;
        }

        // Cargar información de las aulas
        calendarioEstAulas = [];
        for (const aulaRef of aulasAsignadas) {
            const aulaId = typeof aulaRef === 'object' ? aulaRef.aulaId : aulaRef;
            const aulaDoc = await db.collection('aulas').doc(aulaId).get();
            if (aulaDoc.exists) {
                calendarioEstAulas.push({ id: aulaDoc.id, ...aulaDoc.data() });
            }
        }

        // Ordenar aulas por nombre descendente (Z-A) para que coincida con otras secciones
        calendarioEstAulas.sort((a, b) => {
            const nombreA = (a.nombre || '').toUpperCase();
            const nombreB = (b.nombre || '').toUpperCase();
            return nombreB.localeCompare(nombreA);
        });

        renderAulasEstudiante();

    } catch (error) {
        console.error('Error al cargar aulas:', error);
        grid.innerHTML = '<p style="text-align:center;color:#dc3545;padding:2rem;">Error al cargar las aulas</p>';
    }
}

// Renderizar selector de aulas (estilo admin)
function renderAulasEstudiante() {
    const grid = document.getElementById('aulasEstudianteGrid');
    if (!grid || calendarioEstAulas.length === 0) return;

    grid.innerHTML = calendarioEstAulas.map(aula => {
        const color = aula.color || '#ff0000';
        const materias = aula.materias || [];
        
        const materiasHTML = materias.slice(0, 5).map(materiaId => {
            const config = materiasConfigEst[materiaId];
            if (!config) return '';
            return `<span class="materia-mini-tag ${materiaId}">${config.nombre}</span>`;
        }).join('');

        return `
            <div class="aula-card-est" onclick="seleccionarAulaEstudiante('${aula.id}')">
                <div class="aula-card-est-header" style="background: linear-gradient(135deg, ${color}, ${adjustColorEst(color, -30)})">
                    <i class="bi bi-door-open-fill"></i>
                    <h4>${aula.nombre}</h4>
                </div>
                <div class="aula-card-est-body">
                    <p>${aula.descripcion || 'Aula virtual de clases'}</p>
                    <div class="aula-materias-preview">
                        ${materiasHTML || '<span style="color:#999;font-size:0.85rem;">Sin materias asignadas</span>'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Ajustar brillo del color
function adjustColorEst(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Seleccionar aula
async function seleccionarAulaEstudiante(aulaId) {
    calendarioEstAulaSeleccionada = aulaId;
    calendarioEstAulaData = calendarioEstAulas.find(a => a.id === aulaId);

    if (!calendarioEstAulaData) {
        console.error('Aula no encontrada');
        return;
    }

    // Ocultar selector, mostrar calendario
    document.getElementById('aulaSelectorEstudiante').style.display = 'none';
    document.getElementById('calendarioVistaContainer').style.display = 'block';

    // Actualizar info del aula actual
    document.getElementById('aulaActualNombreEst').textContent = calendarioEstAulaData.nombre;
    const aulaInfo = document.getElementById('aulaActualInfoEst');
    if (aulaInfo) {
        aulaInfo.style.background = `linear-gradient(135deg, ${calendarioEstAulaData.color || '#ff0000'}, ${adjustColorEst(calendarioEstAulaData.color || '#ff0000', -30)})`;
    }

    // Cargar clases del aula
    await cargarClasesAulaEstudiante(aulaId);
}


// Cargar clases del aula
async function cargarClasesAulaEstudiante(aulaId) {
    try {
        await esperarFirebaseEst();
        const db = window.firebaseDB;

        const clasesSnapshot = await db.collection('clases_programadas')
            .where('aulaId', '==', aulaId)
            .get();

        calendarioEstClases = [];
        clasesSnapshot.forEach(doc => {
            calendarioEstClases.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar por fecha y hora
        calendarioEstClases.sort((a, b) => {
            if (a.fecha !== b.fecha) return a.fecha < b.fecha ? -1 : 1;
            const horaA = a.horaInicio || a.hora || '00:00';
            const horaB = b.horaInicio || b.hora || '00:00';
            return horaA < horaB ? -1 : 1;
        });

        // Renderizar según vista activa
        const vistaActiva = document.querySelector('.vista-btn.active');
        if (vistaActiva && vistaActiva.dataset.vista === 'semanal') {
            renderCalendarioSemanalEst();
        } else {
            renderCalendarioMensualEst();
        }

    } catch (error) {
        console.error('Error al cargar clases:', error);
    }
}

// Renderizar calendario mensual
function renderCalendarioMensualEst() {
    const grid = document.getElementById('calendarioGridEst');
    const navTitle = document.getElementById('calendarioNavTitle');
    if (!grid) return;

    // Actualizar título
    const options = { month: 'long', year: 'numeric' };
    const monthStr = calendarioEstCurrentMonth.toLocaleDateString('es-ES', options);
    if (navTitle) {
        navTitle.textContent = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
    }

    grid.innerHTML = '';

    // Headers de días (Lunes a Domingo)
    const dias = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
    dias.forEach(dia => {
        const header = document.createElement('div');
        header.className = 'dia-header';
        header.textContent = dia;
        grid.appendChild(header);
    });

    const year = calendarioEstCurrentMonth.getFullYear();
    const month = calendarioEstCurrentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Ajustar para que Lunes sea el primer día (0=Domingo, 1=Lunes, etc.)
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1; // Convertir Domingo (0) a 6, y restar 1 al resto

    // Días del mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const date = new Date(year, month - 1, day);
        crearCeldaDiaEst(date, true, grid);
    }

    // Días del mes actual
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        crearCeldaDiaEst(date, false, grid);
    }

    // Días del mes siguiente
    const totalCells = grid.children.length;
    const remainingCells = Math.ceil(totalCells / 7) * 7 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(year, month + 1, day);
        crearCeldaDiaEst(date, true, grid);
    }

    // Mostrar vista mensual, ocultar semanal
    document.getElementById('calendarioMensualEst').style.display = 'block';
    document.getElementById('calendarioSemanalEst').classList.remove('active');
}

// Crear celda de día
function crearCeldaDiaEst(date, isOtherMonth, grid) {
    const cell = document.createElement('div');
    cell.className = 'dia-celda';
    if (isOtherMonth) cell.classList.add('otro-mes');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    if (compareDate.getTime() === today.getTime()) {
        cell.classList.add('hoy');
    }

    // Formatear fecha correctamente sin problemas de zona horaria
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const dayNumber = document.createElement('div');
    dayNumber.className = 'dia-numero';
    dayNumber.textContent = date.getDate();
    cell.appendChild(dayNumber);

    const clasesContainer = document.createElement('div');
    clasesContainer.className = 'clases-dia';

    // Filtrar clases de este día
    const clasesDelDia = calendarioEstClases.filter(c => c.fecha === dateStr);
    clasesDelDia.forEach(clase => {
        const claseEl = document.createElement('div');
        claseEl.className = `clase-mini-est ${clase.materia}`;
        claseEl.innerHTML = `<span class="hora">${clase.horaInicio || clase.hora || ''}</span> ${clase.titulo}`;
        claseEl.onclick = (e) => {
            e.stopPropagation();
            mostrarDetalleClaseEst(clase);
        };
        clasesContainer.appendChild(claseEl);
    });

    cell.appendChild(clasesContainer);
    grid.appendChild(cell);
}

// Renderizar calendario semanal
function renderCalendarioSemanalEst() {
    const grid = document.getElementById('semanaGridEst');
    const navTitle = document.getElementById('calendarioNavTitleSemanal');
    if (!grid) return;

    // Calcular inicio y fin de semana
    const startOfWeek = new Date(calendarioEstCurrentWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio
    startOfWeek.setDate(diff);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Actualizar título
    const formatDate = (d) => d.getDate() + ' De ' + d.toLocaleDateString('es-ES', { month: 'short' }).charAt(0).toUpperCase() + d.toLocaleDateString('es-ES', { month: 'short' }).slice(1);
    if (navTitle) {
        navTitle.textContent = `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
    }

    grid.innerHTML = '';

    const diasNombres = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + i);
        
        // Formatear fecha correctamente sin problemas de zona horaria
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const todayCompare = new Date(today);
        todayCompare.setHours(0, 0, 0, 0);
        const currentCompare = new Date(currentDate);
        currentCompare.setHours(0, 0, 0, 0);
        const isToday = currentCompare.getTime() === todayCompare.getTime();

        const card = document.createElement('div');
        card.className = `dia-semana-card ${isToday ? 'hoy' : ''}`;

        const header = document.createElement('div');
        header.className = 'dia-semana-header';
        header.innerHTML = `
            <div class="dia-nombre">${diasNombres[i]}</div>
            <div class="dia-num">${currentDate.getDate()}</div>
        `;
        card.appendChild(header);

        const body = document.createElement('div');
        body.className = 'dia-semana-body';

        // Filtrar clases de este día y por materia si hay filtro activo
        let clasesDelDia = calendarioEstClases.filter(c => c.fecha === dateStr);
        if (filtroMateriaActivo) {
            clasesDelDia = clasesDelDia.filter(c => c.materia === filtroMateriaActivo);
        }
        
        if (clasesDelDia.length === 0) {
            body.innerHTML = '<div class="sin-clases"><i class="bi bi-calendar-x"></i>Sin clases</div>';
        } else {
            clasesDelDia.forEach(clase => {
                const claseCard = document.createElement('div');
                claseCard.className = `clase-semanal-card ${clase.materia}`;
                claseCard.innerHTML = `
                    <div class="clase-hora">${clase.horaInicio || clase.hora || ''}</div>
                    <div class="clase-titulo">${clase.titulo}</div>
                `;
                claseCard.onclick = () => mostrarDetalleClaseEst(clase);
                body.appendChild(claseCard);
            });
        }

        card.appendChild(body);
        grid.appendChild(card);
    }

    // Mostrar vista semanal, ocultar mensual
    document.getElementById('calendarioMensualEst').style.display = 'none';
    document.getElementById('calendarioSemanalEst').classList.add('active');
}

// Filtrar por materia en vista semanal
function filtrarPorMateria(materia) {
    filtroMateriaActivo = materia;
    renderCalendarioSemanalEst();
}

// Toggle panel de links
function toggleLinksPanel() {
    const body = document.getElementById('linksMateriasBody');
    const btn = document.getElementById('btnToggleLinks');
    body.classList.toggle('collapsed');
    btn.classList.toggle('collapsed');
}


// Mostrar detalle de clase
function mostrarDetalleClaseEst(clase) {
    const modal = document.getElementById('modalClaseDetalleEst');
    if (!modal) return;

    const materiaInfo = materiasConfigEst[clase.materia] || { nombre: clase.materia, icon: 'bi-book' };

    // Header
    const header = modal.querySelector('.modal-clase-header');
    header.className = `modal-clase-header ${clase.materia}`;
    header.querySelector('h3').textContent = clase.titulo;
    header.querySelector('.materia-nombre').innerHTML = `<i class="bi ${materiaInfo.icon}"></i> ${materiaInfo.nombre}`;

    // Body
    const body = modal.querySelector('.modal-clase-body');
    
    // Parsear fecha correctamente sin problemas de zona horaria
    const [year, month, day] = clase.fecha.split('-').map(Number);
    const fecha = new Date(year, month - 1, day);
    const fechaStr = fecha.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });

    const horaDisplay = clase.horaInicio && clase.horaFin 
        ? `${clase.horaInicio} - ${clase.horaFin}` 
        : clase.hora || 'No especificada';

    const estadoClass = clase.estado || 'pendiente';
    const estadoText = estadoClass === 'confirmada' ? 'Confirmada' : estadoClass === 'cancelada' ? 'Cancelada' : 'Pendiente';
    const estadoIcon = estadoClass === 'confirmada' ? 'check-circle-fill' : estadoClass === 'cancelada' ? 'x-circle-fill' : 'clock-fill';

    // Determinar enlace a mostrar (personalizado o predeterminado de la materia)
    let enlaceClase = (clase.enlace || LINKS_MATERIAS[clase.materia] || '').trim();
    const esPredeterminado = !clase.enlace && LINKS_MATERIAS[clase.materia];
    const tieneEnlaceValido = enlaceClase && enlaceClase.length > 0 && enlaceClase !== 'undefined' && enlaceClase !== 'null';
    
    // Color del botón según la materia
    const colorMateria = materiaInfo.color || '#667eea';

    body.innerHTML = `
        <div class="detalle-item">
            <i class="bi bi-calendar-event"></i>
            <div class="detalle-contenido">
                <div class="detalle-label">Fecha</div>
                <div class="detalle-valor">${fechaStr}</div>
            </div>
        </div>
        <div class="detalle-item">
            <i class="bi bi-clock"></i>
            <div class="detalle-contenido">
                <div class="detalle-label">Horario</div>
                <div class="detalle-valor">${horaDisplay} ${clase.duracion ? `(${clase.duracion} min)` : ''}</div>
            </div>
        </div>
        ${clase.tutorNombre ? `
        <div class="detalle-item">
            <i class="bi bi-person"></i>
            <div class="detalle-contenido">
                <div class="detalle-label">Tutor</div>
                <div class="detalle-valor">${clase.tutorNombre}</div>
            </div>
        </div>
        ` : ''}
        ${clase.unidad ? `
        <div class="detalle-item">
            <i class="bi bi-folder"></i>
            <div class="detalle-contenido">
                <div class="detalle-label">Unidad</div>
                <div class="detalle-valor">${clase.unidad}</div>
            </div>
        </div>
        ` : ''}
        ${clase.tema ? `
        <div class="detalle-item">
            <i class="bi bi-tag"></i>
            <div class="detalle-contenido">
                <div class="detalle-label">Tema</div>
                <div class="detalle-valor">${clase.tema}</div>
            </div>
        </div>
        ` : ''}
        ${clase.descripcion ? `
        <div class="detalle-item">
            <i class="bi bi-chat-left-text"></i>
            <div class="detalle-contenido">
                <div class="detalle-label">Descripción</div>
                <div class="detalle-valor">${clase.descripcion}</div>
            </div>
        </div>
        ` : ''}
        ${tieneEnlaceValido ? `
        <div class="detalle-item enlace-clase-item" style="background: ${colorMateria}10;">
            <i class="bi bi-camera-video-fill" style="color: ${colorMateria};"></i>
            <div class="detalle-contenido">
                <div class="detalle-label">Enlace de Clase ${esPredeterminado ? '<span class="badge-predeterminado">(Link de la materia)</span>' : ''}</div>
                <div class="detalle-valor">
                    <a href="${enlaceClase}" target="_blank" class="btn-unirse-clase" style="background: linear-gradient(135deg, ${colorMateria}, ${colorMateria}dd); color: white !important;">
                        <i class="bi bi-box-arrow-up-right"></i> Unirse a la clase
                    </a>
                </div>
            </div>
        </div>
        ` : ''}
        <div class="detalle-item">
            <i class="bi bi-${estadoIcon}"></i>
            <div class="detalle-contenido">
                <div class="detalle-label">Estado</div>
                <div class="detalle-valor">
                    <span class="estado-badge-modal ${estadoClass}">
                        <i class="bi bi-${estadoIcon}"></i> ${estadoText}
                    </span>
                </div>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Cerrar modal
function cerrarModalClaseEst() {
    const modal = document.getElementById('modalClaseDetalleEst');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Navegación del calendario
function navegarCalendarioEst(direccion) {
    const vistaActiva = document.querySelector('.vista-btn.active');
    const esSemanal = vistaActiva && vistaActiva.dataset.vista === 'semanal';

    if (esSemanal) {
        calendarioEstCurrentWeek.setDate(calendarioEstCurrentWeek.getDate() + (direccion * 7));
        renderCalendarioSemanalEst();
    } else {
        calendarioEstCurrentMonth.setMonth(calendarioEstCurrentMonth.getMonth() + direccion);
        renderCalendarioMensualEst();
    }
}

// Cambiar vista
function cambiarVistaCalendarioEst(vista) {
    document.querySelectorAll('.vista-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.vista === vista);
    });

    if (vista === 'semanal') {
        calendarioEstCurrentWeek = new Date();
        renderCalendarioSemanalEst();
    } else {
        calendarioEstCurrentMonth = new Date();
        renderCalendarioMensualEst();
    }
}

// Setup eventos
function setupCalendarioEstudianteEvents() {
    // Botón volver al panel
    const btnVolver = document.getElementById('btnVolverPanelEst');
    if (btnVolver) {
        btnVolver.onclick = volverAlPanel;
    }

    // Botón cambiar aula
    const btnCambiarAula = document.getElementById('btnCambiarAulaEst');
    if (btnCambiarAula) {
        btnCambiarAula.onclick = volverASelectorAulasEst;
    }

    // Navegación
    const btnPrev = document.getElementById('btnPrevCalEst');
    const btnNext = document.getElementById('btnNextCalEst');
    if (btnPrev) btnPrev.onclick = () => navegarCalendarioEst(-1);
    if (btnNext) btnNext.onclick = () => navegarCalendarioEst(1);

    // Toggle vista
    document.querySelectorAll('.vista-btn').forEach(btn => {
        btn.onclick = () => cambiarVistaCalendarioEst(btn.dataset.vista);
    });

    // Cerrar modal
    const btnCerrarModal = document.getElementById('btnCerrarModalClaseEst');
    if (btnCerrarModal) {
        btnCerrarModal.onclick = cerrarModalClaseEst;
    }

    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('modalClaseDetalleEst');
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) cerrarModalClaseEst();
        };
    }
}

// Esperar Firebase
function esperarFirebaseEst() {
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

// Hacer funciones globales
window.initCalendarioEstudiante = initCalendarioEstudiante;
window.volverAlPanel = volverAlPanel;
window.volverASelectorAulasEst = volverASelectorAulasEst;
window.seleccionarAulaEstudiante = seleccionarAulaEstudiante;
window.mostrarDetalleClaseEst = mostrarDetalleClaseEst;
window.cerrarModalClaseEst = cerrarModalClaseEst;
window.navegarCalendarioEst = navegarCalendarioEst;
window.cambiarVistaCalendarioEst = cambiarVistaCalendarioEst;
window.filtrarPorMateria = filtrarPorMateria;
window.toggleLinksPanel = toggleLinksPanel;
