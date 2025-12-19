// Clases JavaScript
document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    loadUserInfo();
    loadAulasAndClases();
    setupEventListeners();
});

// Check authentication
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (!currentUser.id) {
        window.location.href = '../index.html';
        return;
    }
}

// Load user info
async function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (currentUser.nombre) {
        document.getElementById('userName').textContent = currentUser.nombre.toUpperCase();
    }

    await cargarFotoPerfil(currentUser.id);
}

// Cargar foto de perfil
async function cargarFotoPerfil(usuarioId) {
    try {
        if (!window.firebaseDB) {
            await esperarFirebase();
        }

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

// Definir todas las materias disponibles
const materiasDisponibles = [
    {
        id: 'matematicas',
        nombre: 'Matemáticas',
        descripcion: 'Álgebra, geometría, cálculo y más',
        icon: 'bi-calculator'
    },
    {
        id: 'lectura',
        nombre: 'Lectura Crítica',
        descripcion: 'Comprensión lectora y análisis de textos',
        icon: 'bi-book'
    },
    {
        id: 'sociales',
        nombre: 'Ciencias Sociales',
        descripcion: 'Historia, geografía y ciudadanía',
        icon: 'bi-globe'
    },
    {
        id: 'naturales',
        nombre: 'Ciencias Naturales',
        descripcion: 'Biología, química y física',
        icon: 'bi-tree'
    },
    {
        id: 'ingles',
        nombre: 'Inglés',
        descripcion: 'Gramática, vocabulario y comprensión',
        icon: 'bi-translate'
    }
];

// Load aulas and clases
async function loadAulasAndClases() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

        const clasesGrid = document.getElementById('clasesGrid');
        clasesGrid.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i><p>Cargando aulas...</p></div>';

        // Obtener datos del usuario actual
        const usuarioDoc = await db.collection('usuarios').doc(currentUser.id).get();
        const userData = usuarioDoc.data();

        // Cargar aulas desde Firebase
        const aulasSnapshot = await db.collection('aulas').orderBy('nombre').get();
        const aulas = [];
        aulasSnapshot.forEach(doc => {
            aulas.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Si hay aulas creadas, mostrar selector de aulas
        if (aulas.length > 0) {
            await renderAulasSelector(aulas, userData, currentUser);
        } else {
            // Si no hay aulas, mostrar las materias directamente (comportamiento anterior)
            await loadClasesDirectas(userData, currentUser);
        }

    } catch (error) {
        console.error('Error al cargar aulas:', error);
        document.getElementById('clasesGrid').innerHTML = `
            <div class="no-access-message">
                <i class="bi bi-exclamation-triangle"></i>
                <h2>Error al cargar aulas</h2>
                <p>Intenta recargar la página</p>
            </div>
        `;
    }
}

// Render aulas selector
async function renderAulasSelector(aulas, userData, currentUser) {
    const clasesGrid = document.getElementById('clasesGrid');
    
    // Filtrar aulas según permisos del usuario
    let aulasPermitidas = aulas;
    
    if (currentUser.tipoUsuario === 'estudiante') {
        // Usar aulasAsignadas para filtrar (nuevo sistema)
        const aulasAsignadas = userData.aulasAsignadas || [];
        
        // Filtrar solo las aulas que el estudiante tiene asignadas
        aulasPermitidas = aulas.filter(aula => aulasAsignadas.includes(aula.id));
        
        if (aulasPermitidas.length === 0) {
            clasesGrid.innerHTML = `
                <div class="no-access-message">
                    <i class="bi bi-lock"></i>
                    <h2>Sin acceso a aulas</h2>
                    <p>Contacta con un administrador para que te asigne aulas virtuales</p>
                </div>
            `;
            return;
        }
    } else if (currentUser.tipoUsuario === 'admin') {
        const rol = userData.rol || currentUser.rol;
        
        // Superusuarios ven todas las aulas
        if (rol !== 'superusuario') {
            const asignaturas = userData.asignaturas || [];
            
            if (asignaturas.length === 0) {
                clasesGrid.innerHTML = `
                    <div class="no-access-message">
                        <i class="bi bi-info-circle"></i>
                        <h2>Sin asignaturas asignadas</h2>
                        <p>Contacta con un superusuario para que te asigne las asignaturas que enseñas</p>
                    </div>
                `;
                return;
            }
            
            // Filtrar aulas que tengan al menos una asignatura del profesor
            aulasPermitidas = aulas.filter(aula => {
                const materiasAula = aula.materias || [];
                return materiasAula.some(m => asignaturas.includes(m));
            });
        }
    }
    
    clasesGrid.innerHTML = '';
    
    // Renderizar las aulas como cards
    aulasPermitidas.forEach(aula => {
        const aulaCard = createAulaCard(aula, userData, currentUser);
        clasesGrid.appendChild(aulaCard);
    });
}

// Create aula card
function createAulaCard(aula, userData, currentUser) {
    const card = document.createElement('div');
    card.className = 'aula-selector-card';
    
    const color = aula.color || '#667eea';
    const materias = aula.materias || [];
    
    // Para estudiantes: mostrar todas las materias del aula (ya tienen acceso completo al aula)
    // Para profesores: filtrar por sus asignaturas
    let materiasVisibles = materias;
    if (currentUser.tipoUsuario === 'admin' && userData.rol !== 'superusuario') {
        const asignaturas = userData.asignaturas || [];
        materiasVisibles = materias.filter(m => asignaturas.includes(m));
    }
    
    const materiasHTML = materiasVisibles.map(materiaId => {
        const materia = materiasDisponibles.find(m => m.id === materiaId);
        if (!materia) return '';
        return `<span class="aula-materia-tag ${materiaId}">
            <i class="bi ${materia.icon}"></i>
            ${materia.nombre}
        </span>`;
    }).join('');
    
    card.innerHTML = `
        <div class="aula-selector-header" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -30)});">
            <i class="bi bi-door-open-fill aula-selector-icon"></i>
            <h3 class="aula-selector-title">${aula.nombre}</h3>
        </div>
        <div class="aula-selector-body">
            ${aula.descripcion ? `<p class="aula-selector-description">${aula.descripcion}</p>` : ''}
            <div class="aula-selector-materias">
                ${materiasHTML || '<span class="text-muted">Sin materias disponibles</span>'}
            </div>
            <div class="aula-selector-info">
                ${aula.institucion ? `<span><i class="bi bi-building"></i> ${aula.institucion}</span>` : ''}
                ${aula.grado ? `<span><i class="bi bi-mortarboard"></i> ${aula.grado}</span>` : ''}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => {
        // Guardar el aula seleccionada y redirigir
        sessionStorage.setItem('selectedAula', JSON.stringify({
            id: aula.id,
            nombre: aula.nombre,
            materias: materiasVisibles,
            color: color
        }));
        window.location.href = `Aula.html?aula=${aula.id}`;
    });
    
    return card;
}

// Adjust color brightness
function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Load clases directas (comportamiento anterior cuando no hay aulas)
async function loadClasesDirectas(userData, currentUser) {
    const clasesGrid = document.getElementById('clasesGrid');
    
    // Si es estudiante, verificar permisos
    if (currentUser.tipoUsuario === 'estudiante') {
        const clasesPermitidas = userData.clasesPermitidas || [];

        if (clasesPermitidas.length === 0) {
            clasesGrid.innerHTML = `
                <div class="no-access-message">
                    <i class="bi bi-lock"></i>
                    <h2>Sin acceso a aulas</h2>
                    <p>Contacta con un administrador para obtener acceso a las aulas virtuales</p>
                </div>
            `;
            return;
        }

        // Filtrar solo las materias permitidas
        const materiasPermitidas = materiasDisponibles.filter(m => clasesPermitidas.includes(m.id));
        renderClases(materiasPermitidas);
    }
    // Si es admin/profesor, verificar si es superusuario o tiene asignaturas asignadas
    else if (currentUser.tipoUsuario === 'admin') {
        const rol = userData.rol || currentUser.rol;

        // Superusuarios ven todas las aulas
        if (rol === 'superusuario') {
            renderClases(materiasDisponibles);
        }
        // Profesores solo ven sus asignaturas
        else {
            const asignaturas = userData.asignaturas || [];

            if (asignaturas.length === 0) {
                clasesGrid.innerHTML = `
                    <div class="no-access-message">
                        <i class="bi bi-info-circle"></i>
                        <h2>Sin asignaturas asignadas</h2>
                        <p>Contacta con un superusuario para que te asigne las asignaturas que enseñas</p>
                    </div>
                `;
                return;
            }

            // Filtrar solo las asignaturas del profesor
            const materiasProfesor = materiasDisponibles.filter(m => asignaturas.includes(m.id));
            renderClases(materiasProfesor);
        }
    }
    // Fallback: mostrar todas
    else {
        renderClases(materiasDisponibles);
    }
}

// Render clases
function renderClases(materias) {
    const clasesGrid = document.getElementById('clasesGrid');
    clasesGrid.innerHTML = '';

    materias.forEach(materia => {
        const claseCard = document.createElement('div');
        claseCard.className = 'clase-card';
        claseCard.setAttribute('data-materia', materia.id);
        claseCard.innerHTML = `
            <div class="clase-header">
                <i class="${materia.icon} clase-icon"></i>
                <h3 class="clase-title">${materia.nombre}</h3>
            </div>
            <div class="clase-body">
                <p class="clase-description">${materia.descripcion}</p>
                <div class="clase-stats">
                    <div class="stat-item">
                        <i class="bi bi-megaphone"></i>
                        <span id="anuncios-${materia.id}">0 anuncios</span>
                    </div>
                    <div class="stat-item">
                        <i class="bi bi-clipboard-check"></i>
                        <span id="tareas-${materia.id}">0 tareas</span>
                    </div>
                </div>
            </div>
        `;

        claseCard.addEventListener('click', () => {
            window.location.href = `Aula.html?materia=${materia.id}`;
        });

        clasesGrid.appendChild(claseCard);

        // Cargar estadísticas
        loadClaseStats(materia.id);
    });
}

// Load clase stats
async function loadClaseStats(materiaId) {
    try {
        const db = window.firebaseDB;

        // Contar anuncios
        const anunciosSnapshot = await db.collection('anuncios')
            .where('materia', '==', materiaId)
            .get();

        const anunciosCount = anunciosSnapshot.size;
        const anunciosElement = document.getElementById(`anuncios-${materiaId}`);
        if (anunciosElement) {
            anunciosElement.textContent = `${anunciosCount} ${anunciosCount === 1 ? 'anuncio' : 'anuncios'}`;
        }

        // Contar tareas
        const tareasSnapshot = await db.collection('tareas')
            .where('materia', '==', materiaId)
            .get();

        const tareasCount = tareasSnapshot.size;
        const tareasElement = document.getElementById(`tareas-${materiaId}`);
        if (tareasElement) {
            tareasElement.textContent = `${tareasCount} ${tareasCount === 1 ? 'tarea' : 'tareas'}`;
        }

    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            if (currentUser.tipoUsuario === 'admin') {
                window.location.href = 'Panel_Admin.html';
            } else {
                window.location.href = 'Panel_Estudiantes.html';
            }
        });
    }

    // User menu dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');

    if (userMenuBtn && userDropdownMenu) {
        userMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('active');
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function (e) {
            if (!userMenuBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.remove('active');
            }
        });
    }

    // Logout button en dropdown
    const logoutBtnDropdown = document.getElementById('logoutBtnDropdown');
    if (logoutBtnDropdown) {
        logoutBtnDropdown.addEventListener('click', () => {
            sessionStorage.removeItem('currentUser');
            window.location.href = '../index.html';
        });
    }
}
