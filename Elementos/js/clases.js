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
        id: 'anuncios',
        nombre: 'Anuncios Generales',
        descripcion: 'Comunicados y avisos importantes',
        icon: 'bi-megaphone'
    },
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
    let materiasProfesorPorAula = {}; // Para guardar qué materias puede enseñar el profesor en cada aula
    
    if (currentUser.tipoUsuario === 'estudiante') {
        // Usar aulasAsignadas para filtrar (nuevo sistema)
        const aulasAsignadas = userData.aulasAsignadas || [];
        
        console.log('=== DEBUG ESTUDIANTE ===');
        console.log('Aulas asignadas del estudiante:', aulasAsignadas);
        console.log('Aulas disponibles:', aulas.map(a => ({ id: a.id, nombre: a.nombre })));
        
        // Filtrar solo las aulas que el estudiante tiene asignadas
        // Soportar tanto el formato antiguo (string) como el nuevo (objeto con aulaId)
        aulasPermitidas = aulas.filter(aula => {
            return aulasAsignadas.some(asignacion => {
                if (typeof asignacion === 'string') {
                    return asignacion === aula.id;
                } else if (typeof asignacion === 'object' && asignacion.aulaId) {
                    return asignacion.aulaId === aula.id;
                }
                return false;
            });
        });
        
        console.log('Aulas permitidas después del filtro:', aulasPermitidas.map(a => ({ id: a.id, nombre: a.nombre })));
        
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
            // Nuevo sistema: aulasAsignadas es un array de objetos {aulaId, materias}
            const aulasAsignadas = userData.aulasAsignadas || [];
            
            if (aulasAsignadas.length === 0) {
                clasesGrid.innerHTML = `
                    <div class="no-access-message">
                        <i class="bi bi-info-circle"></i>
                        <h2>Sin aulas asignadas</h2>
                        <p>Contacta con un superusuario para que te asigne las aulas y materias que enseñas</p>
                    </div>
                `;
                return;
            }
            
            // Crear mapa de materias por aula para el profesor
            aulasAsignadas.forEach(asignacion => {
                if (typeof asignacion === 'object' && asignacion.aulaId) {
                    materiasProfesorPorAula[asignacion.aulaId] = asignacion.materias || [];
                } else if (typeof asignacion === 'string') {
                    // Compatibilidad con formato antiguo (solo ID de aula)
                    materiasProfesorPorAula[asignacion] = [];
                }
            });
            
            // Filtrar solo las aulas asignadas al profesor
            const aulasIdsAsignadas = Object.keys(materiasProfesorPorAula);
            aulasPermitidas = aulas.filter(aula => aulasIdsAsignadas.includes(aula.id));
        }
    }
    
    clasesGrid.innerHTML = '';
    
    // Renderizar las aulas como cards
    aulasPermitidas.forEach(aula => {
        const aulaCard = createAulaCard(aula, userData, currentUser, materiasProfesorPorAula);
        clasesGrid.appendChild(aulaCard);
    });
}

// Create aula card
function createAulaCard(aula, userData, currentUser, materiasProfesorPorAula = {}) {
    const card = document.createElement('div');
    card.className = 'aula-selector-card';
    
    const color = aula.color || '#667eea';
    const materias = aula.materias || [];
    
    // Para estudiantes: verificar si tiene materias personalizadas para esta aula
    // Para profesores: mostrar solo las materias que tienen asignadas en esta aula
    let materiasVisibles = materias;
    
    if (currentUser.tipoUsuario === 'estudiante') {
        // Buscar si el estudiante tiene materias personalizadas para esta aula
        const aulasAsignadas = userData.aulasAsignadas || [];
        const aulaAsignada = aulasAsignadas.find(asignacion => {
            if (typeof asignacion === 'string') {
                return asignacion === aula.id;
            } else if (typeof asignacion === 'object' && asignacion.aulaId) {
                return asignacion.aulaId === aula.id;
            }
            return false;
        });
        
        console.log(`=== AULA: ${aula.nombre} ===`);
        console.log('Asignación encontrada:', aulaAsignada);
        
        // Si tiene materias personalizadas, filtrar
        if (aulaAsignada && typeof aulaAsignada === 'object' && aulaAsignada.materiasPermitidas && aulaAsignada.materiasPermitidas.length > 0) {
            materiasVisibles = materias.filter(m => aulaAsignada.materiasPermitidas.includes(m));
            console.log('Materias personalizadas:', aulaAsignada.materiasPermitidas);
            console.log('Materias visibles después del filtro:', materiasVisibles);
        } else {
            console.log('Sin personalización, mostrando todas las materias del aula');
        }
        // Si no tiene personalizadas, mostrar todas las materias del aula
    } else if (currentUser.tipoUsuario === 'admin' && userData.rol !== 'superusuario') {
        // Usar el nuevo sistema de materias por aula para profesores
        const materiasAsignadas = materiasProfesorPorAula[aula.id] || [];
        if (materiasAsignadas.length > 0) {
            // Filtrar solo las materias que el profesor tiene asignadas en esta aula
            materiasVisibles = materias.filter(m => materiasAsignadas.includes(m));
        } else {
            // Si no hay materias específicas, mostrar todas las del aula (compatibilidad)
            materiasVisibles = materias;
        }
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
    // Si es admin/profesor, verificar si es superusuario o tiene aulas asignadas
    else if (currentUser.tipoUsuario === 'admin') {
        const rol = userData.rol || currentUser.rol;

        // Superusuarios ven todas las aulas
        if (rol === 'superusuario') {
            renderClases(materiasDisponibles);
        }
        // Profesores solo ven las materias de sus aulas asignadas
        else {
            // Nuevo sistema: aulasAsignadas es un array de objetos {aulaId, materias}
            const aulasAsignadas = userData.aulasAsignadas || [];
            
            // Extraer todas las materias únicas de las aulas asignadas
            const materiasUnicas = new Set();
            aulasAsignadas.forEach(asignacion => {
                if (typeof asignacion === 'object' && asignacion.materias) {
                    asignacion.materias.forEach(m => materiasUnicas.add(m));
                }
            });

            if (materiasUnicas.size === 0) {
                clasesGrid.innerHTML = `
                    <div class="no-access-message">
                        <i class="bi bi-info-circle"></i>
                        <h2>Sin aulas asignadas</h2>
                        <p>Contacta con un superusuario para que te asigne las aulas y materias que enseñas</p>
                    </div>
                `;
                return;
            }

            // Filtrar solo las materias del profesor
            const materiasProfesor = materiasDisponibles.filter(m => materiasUnicas.has(m.id));
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
