// Aula JavaScript
let currentMateria = '';
let currentAulaId = '';
let currentAulaData = null;
let currentUser = {};

// ImgBB API configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

document.addEventListener('DOMContentLoaded', function () {
    checkAuthentication();
    loadUserInfo();
    getCurrentMateriaOrAula();
    setupEventListeners();
    setupTabs();
});

// Check authentication
function checkAuthentication() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (!currentUser.id) {
        window.location.href = '../index.html';
        return;
    }
}

// Get current materia or aula from URL
async function getCurrentMateriaOrAula() {
    const urlParams = new URLSearchParams(window.location.search);
    currentMateria = urlParams.get('materia');
    currentAulaId = urlParams.get('aula');

    // Si viene de un aula, cargar datos del aula
    if (currentAulaId) {
        await loadAulaData();
        return;
    }

    // Si viene de una materia directa (comportamiento anterior)
    if (!currentMateria) {
        window.location.href = 'Clases.html';
        return;
    }

    // Set title
    const materias = {
        'anuncios': 'Anuncios Generales',
        'matematicas': 'Matemáticas',
        'lectura': 'Lectura Crítica',
        'sociales': 'Ciencias Sociales',
        'naturales': 'Ciencias Naturales',
        'ingles': 'Inglés'
    };

    document.getElementById('aulaTitle').textContent = materias[currentMateria] || 'Aula';

    // Show create buttons for admin
    if (currentUser.tipoUsuario === 'admin') {
        document.getElementById('createPostContainer').style.display = 'block';
        document.getElementById('createTaskContainer').style.display = 'block';
        document.getElementById('createMaterialContainer').style.display = 'block';
        document.getElementById('estudiantesTab').style.display = 'flex';
    }

    // Load content
    loadAnuncios();
}

// Load aula data from Firebase or sessionStorage
async function loadAulaData() {
    try {
        // Intentar obtener del sessionStorage primero
        const storedAula = sessionStorage.getItem('selectedAula');
        if (storedAula) {
            currentAulaData = JSON.parse(storedAula);
        }

        // Si no hay datos en sessionStorage o el ID no coincide, cargar de Firebase
        if (!currentAulaData || currentAulaData.id !== currentAulaId) {
            await esperarFirebase();
            const aulaDoc = await window.firebaseDB.collection('aulas').doc(currentAulaId).get();

            if (!aulaDoc.exists) {
                window.location.href = 'Clases.html';
                return;
            }

            currentAulaData = {
                id: aulaDoc.id,
                ...aulaDoc.data()
            };
        }

        // Establecer el título del aula
        document.getElementById('aulaTitle').textContent = currentAulaData.nombre || 'Aula';

        // Obtener las materias visibles según el tipo de usuario
        let materiasVisibles = currentAulaData.materias || [];

        // Si es profesor (no superusuario), filtrar por las materias que tiene asignadas en esta aula
        if (currentUser.tipoUsuario === 'admin') {
            const db = window.firebaseDB;
            const usuarioDoc = await db.collection('usuarios').doc(currentUser.id).get();
            const userData = usuarioDoc.data();
            const rol = userData.rol || currentUser.rol;

            if (rol !== 'superusuario') {
                // Nuevo sistema: aulasAsignadas es un array de objetos {aulaId, materias}
                const aulasAsignadas = userData.aulasAsignadas || [];
                const aulaAsignada = aulasAsignadas.find(a => {
                    if (typeof a === 'object' && a.aulaId) {
                        return a.aulaId === currentAulaId;
                    }
                    return a === currentAulaId;
                });

                if (aulaAsignada && typeof aulaAsignada === 'object' && aulaAsignada.materias) {
                    // Filtrar solo las materias que el profesor tiene asignadas en esta aula
                    materiasVisibles = currentAulaData.materias.filter(m => aulaAsignada.materias.includes(m));
                }
            }
        }

        // Si el aula tiene materias visibles, mostrar las tarjetas de materias
        if (materiasVisibles && materiasVisibles.length > 0) {
            // Guardar las materias visibles en currentAulaData para uso posterior
            currentAulaData.materiasVisibles = materiasVisibles;
            
            // Verificar si hay una materia en la URL (para persistir al recargar)
            const urlParams = new URLSearchParams(window.location.search);
            const materiaFromUrl = urlParams.get('materia');
            
            if (materiaFromUrl && materiasVisibles.includes(materiaFromUrl)) {
                // Si hay una materia válida en la URL, entrar directamente a ella
                showMateriasCards(materiasVisibles);
                enterMateria(materiaFromUrl);
            } else {
                // Mostrar las materias como tarjetas (ocultar tabs y contenido)
                showMateriasCards(materiasVisibles);
            }
        } else {
            window.location.href = 'Clases.html';
            return;
        }

    } catch (error) {
        console.error('Error loading aula data:', error);
        window.location.href = 'Clases.html';
    }
}

// Show materias as cards (initial view when entering an aula)
function showMateriasCards(materias) {
    const materiasConfig = {
        'anuncios': { nombre: 'Anuncios Generales', descripcion: 'Comunicados y avisos importantes', icon: 'bi-megaphone', color: '#1a1a1a' },
        'matematicas': { nombre: 'Matemáticas', descripcion: 'Álgebra, geometría, cálculo y más', icon: 'bi-calculator', color: '#2196F3' },
        'lectura': { nombre: 'Lectura Crítica', descripcion: 'Comprensión lectora y análisis de textos', icon: 'bi-book', color: '#F44336' },
        'sociales': { nombre: 'Ciencias Sociales', descripcion: 'Historia, geografía y ciudadanía', icon: 'bi-globe', color: '#FF9800' },
        'naturales': { nombre: 'Ciencias Naturales', descripcion: 'Biología, química y física', icon: 'bi-tree', color: '#4CAF50' },
        'ingles': { nombre: 'Inglés', descripcion: 'Gramática, vocabulario y comprensión', icon: 'bi-translate', color: '#9C27B0' }
    };

    // Ocultar tabs y contenido
    const tabsContainer = document.querySelector('.tabs-container');
    const tabContent = document.querySelector('.tab-content');
    if (tabsContainer) tabsContainer.style.display = 'none';
    if (tabContent) tabContent.style.display = 'none';

    // Obtener orden guardado del usuario para esta aula
    const savedOrder = getSavedMateriasOrder(currentAulaId);
    let orderedMaterias = materias;

    if (savedOrder && savedOrder.length > 0) {
        // Ordenar según el orden guardado
        orderedMaterias = savedOrder.filter(m => materias.includes(m));
        // Agregar materias nuevas que no estaban en el orden guardado
        materias.forEach(m => {
            if (!orderedMaterias.includes(m)) {
                orderedMaterias.push(m);
            }
        });
    }

    // Crear el contenedor de tarjetas de materias
    const cardsHTML = `
        <div class="materias-cards-container" id="materiasCardsContainer">
            <div class="materias-cards-header">
                <h2>Selecciona una materia</h2>
                <p>Elige la materia a la que deseas acceder <span class="drag-hint"><i class="bi bi-arrows-move"></i> Arrastra para reordenar</span></p>
            </div>
            <div class="materias-cards-grid" id="materiasCardsGrid">
                ${orderedMaterias.map(materiaId => {
        const config = materiasConfig[materiaId] || { nombre: materiaId, descripcion: '', icon: 'bi-book', color: '#667eea' };
        return `
                        <div class="materia-card" data-materia="${materiaId}" draggable="true" style="--materia-color: ${config.color}">
                            <div class="drag-handle">
                                <i class="bi bi-grip-vertical"></i>
                            </div>
                            <div class="materia-card-header" style="background: linear-gradient(135deg, ${config.color}, ${adjustColorBrightness(config.color, -30)})">
                                <i class="bi ${config.icon}"></i>
                            </div>
                            <div class="materia-card-body">
                                <h3>${config.nombre}</h3>
                                <p>${config.descripcion}</p>
                            </div>
                            <div class="materia-card-footer">
                                <span class="materia-card-btn">
                                    <i class="bi bi-arrow-right-circle"></i>
                                    Entrar
                                </span>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;

    // Insertar en el main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertAdjacentHTML('beforeend', cardsHTML);

        // Agregar event listeners a las tarjetas
        document.querySelectorAll('.materia-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // No entrar si se está arrastrando
                if (card.classList.contains('dragging')) return;
                const materiaId = card.getAttribute('data-materia');
                enterMateria(materiaId);
            });
        });

        // Inicializar drag and drop
        initMateriasDragAndDrop();
    }
}

// Obtener orden guardado de materias
function getSavedMateriasOrder(aulaId) {
    try {
        const key = `materiasOrder_${currentUser.id}_${aulaId}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
}

// Guardar orden de materias
function saveMateriasOrder(aulaId, order) {
    try {
        const key = `materiasOrder_${currentUser.id}_${aulaId}`;
        localStorage.setItem(key, JSON.stringify(order));
    } catch (e) {
        console.error('Error guardando orden de materias:', e);
    }
}

// Inicializar drag and drop para las tarjetas de materias
function initMateriasDragAndDrop() {
    const grid = document.getElementById('materiasCardsGrid');
    if (!grid) return;

    let draggedCard = null;
    let draggedOverCard = null;

    const cards = grid.querySelectorAll('.materia-card');

    cards.forEach(card => {
        // Drag start
        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', card.dataset.materia);

            // Pequeño delay para que se vea el efecto
            setTimeout(() => {
                card.style.opacity = '0.5';
            }, 0);
        });

        // Drag end
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            card.style.opacity = '1';
            draggedCard = null;

            // Remover clases de todos los cards
            cards.forEach(c => {
                c.classList.remove('drag-over', 'drag-over-left', 'drag-over-right');
            });

            // Guardar el nuevo orden
            const newOrder = Array.from(grid.querySelectorAll('.materia-card')).map(c => c.dataset.materia);
            saveMateriasOrder(currentAulaId, newOrder);
        });

        // Drag over
        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            if (card !== draggedCard) {
                const rect = card.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;

                card.classList.remove('drag-over-left', 'drag-over-right');

                if (e.clientX < midX) {
                    card.classList.add('drag-over-left');
                } else {
                    card.classList.add('drag-over-right');
                }

                draggedOverCard = card;
            }
        });

        // Drag leave
        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over', 'drag-over-left', 'drag-over-right');
        });

        // Drop
        card.addEventListener('drop', (e) => {
            e.preventDefault();

            if (draggedCard && card !== draggedCard) {
                const rect = card.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;

                if (e.clientX < midX) {
                    // Insertar antes
                    grid.insertBefore(draggedCard, card);
                } else {
                    // Insertar después
                    grid.insertBefore(draggedCard, card.nextSibling);
                }
            }

            card.classList.remove('drag-over', 'drag-over-left', 'drag-over-right');
        });
    });

    // También permitir drop en el grid vacío
    grid.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    grid.addEventListener('drop', (e) => {
        e.preventDefault();
    });
}

// Adjust color brightness helper
function adjustColorBrightness(color, amount) {
    const hex = color.replace('#', '');
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Enter a specific materia (show tabs and content)
function enterMateria(materiaId) {
    currentMateria = materiaId;

    // Actualizar la URL para persistir la materia seleccionada (sin recargar la página)
    const url = new URL(window.location.href);
    url.searchParams.set('materia', materiaId);
    window.history.replaceState({}, '', url);

    const materiasConfig = {
        'anuncios': { nombre: 'Anuncios Generales', color: '#1a1a1a' },
        'matematicas': { nombre: 'Matemáticas', color: '#2196F3' },
        'lectura': { nombre: 'Lectura Crítica', color: '#F44336' },
        'sociales': { nombre: 'Ciencias Sociales', color: '#FF9800' },
        'naturales': { nombre: 'Ciencias Naturales', color: '#4CAF50' },
        'ingles': { nombre: 'Inglés', color: '#9C27B0' }
    };

    const config = materiasConfig[materiaId] || { nombre: materiaId, color: '#667eea' };

    // Guardar el color de la materia actual para uso global
    window.currentMateriaColor = config.color;

    // Actualizar título
    document.getElementById('aulaTitle').textContent = `${currentAulaData.nombre} - ${config.nombre}`;

    // Ocultar tarjetas de materias
    const cardsContainer = document.getElementById('materiasCardsContainer');
    if (cardsContainer) cardsContainer.style.display = 'none';

    // Mostrar tabs y contenido
    const tabsContainer = document.querySelector('.tabs-container');
    const tabContent = document.querySelector('.tab-content');
    const mainContent = document.querySelector('.main-content');

    // Aplicar color de la materia a los elementos principales
    if (mainContent) {
        mainContent.style.setProperty('--materia-color', config.color);
    }
    if (tabsContainer) {
        tabsContainer.style.display = 'flex';
        tabsContainer.style.setProperty('--materia-color', config.color);
    }
    if (tabContent) {
        tabContent.style.display = 'block';
        tabContent.style.setProperty('--materia-color', config.color);
    }

    // Agregar botón para volver a las materias
    addBackToMateriasButton();

    // Mostrar tarjeta de estadísticas de la materia
    showMateriaStatsCard(materiaId, config);

    // Show create buttons for admin
    if (currentUser.tipoUsuario === 'admin') {
        document.getElementById('createPostContainer').style.display = 'block';
        document.getElementById('createTaskContainer').style.display = 'block';
        document.getElementById('createMaterialContainer').style.display = 'block';
        document.getElementById('estudiantesTab').style.display = 'flex';
    }

    // Cargar contenido
    loadAnuncios();
}

// Mostrar tarjeta de estadísticas de la materia
async function showMateriaStatsCard(materiaId, config) {
    // Remover tarjeta existente si hay
    const existingCard = document.getElementById('materiaStatsCard');
    if (existingCard) existingCard.remove();

    // Obtener foto de perfil del usuario
    let userPhoto = '';
    try {
        if (window.firebaseDB) {
            const userDoc = await window.firebaseDB.collection('usuarios').doc(currentUser.id).get();
            if (userDoc.exists) {
                userPhoto = userDoc.data().fotoPerfil || '';
            }
        }
    } catch (error) {
        console.error('Error al obtener foto de perfil:', error);
    }

    // Contar tareas completadas para esta materia y aula
    let tareasCompletadas = 0;
    try {
        if (window.firebaseDB && currentUser.tipoUsuario === 'estudiante') {
            // Obtener todas las tareas de esta materia y aula
            let tareasQuery = window.firebaseDB.collection('tareas').where('materia', '==', materiaId);
            if (currentAulaId) {
                tareasQuery = tareasQuery.where('aulaId', '==', currentAulaId);
            }
            const tareasSnapshot = await tareasQuery.get();

            // Contar entregas del estudiante
            for (const tareaDoc of tareasSnapshot.docs) {
                const entregaSnapshot = await window.firebaseDB.collection('entregas')
                    .where('tareaId', '==', tareaDoc.id)
                    .where('estudianteId', '==', currentUser.id)
                    .get();

                if (!entregaSnapshot.empty) {
                    tareasCompletadas++;
                }
            }
        }
    } catch (error) {
        console.error('Error al contar tareas completadas:', error);
    }

    // Crear color más oscuro para el gradiente
    const darkerColor = adjustColorBrightness(config.color, -40);

    // Crear la tarjeta de estadísticas
    const statsCardHTML = `
        <div class="materia-stats-card" id="materiaStatsCard" style="background: linear-gradient(135deg, ${config.color}, ${darkerColor});">
            <div class="materia-stats-header">
                <div class="materia-stats-avatar">
                    ${userPhoto ? `<img src="${userPhoto}" alt="Foto de perfil">` : '<i class="bi bi-person-fill"></i>'}
                </div>
                <div class="materia-stats-info">
                    <h2>¡Hola, ${currentUser.nombre || 'Usuario'}!</h2>
                    <p><i class="bi bi-book"></i> ${config.nombre} - ${currentAulaData?.nombre || 'Aula'}</p>
                </div>
                <div class="materia-energy-badge">
                    <i class="bi bi-lightning-fill"></i>
                    <span>5/5</span>
                </div>
                <div class="materia-monedas-badge">
                    <i class="bi bi-coin"></i>
                    <span id="monedasHeader">0</span>
                </div>
            </div>
            <div class="materia-stats-boxes">
                <div class="materia-stat-box">
                    <div class="stat-icon">
                        <i class="bi bi-check-circle-fill"></i>
                    </div>
                    <div class="stat-content">
                        <span class="stat-value">${tareasCompletadas}</span>
                        <span class="stat-label">Tareas Completadas</span>
                    </div>
                </div>
            </div>
            <div class="materia-level-container">
                <div class="level-info">
                    <span class="level-label">Nivel</span>
                    <span class="level-value">0</span>
                </div>
                <div class="level-progress-bar">
                    <div class="level-progress-fill" style="width: 0%;"></div>
                </div>
                <span class="level-progress-text">0 / 100 XP</span>
            </div>
        </div>
    `;

    // Insertar antes de los tabs
    const tabsContainer = document.querySelector('.tabs-container');
    if (tabsContainer) {
        tabsContainer.insertAdjacentHTML('beforebegin', statsCardHTML);
    }
}

// Add button to go back to materias selection
function addBackToMateriasButton() {
    // Botón deshabilitado - ya no se muestra
    // Remover botón existente si hay
    const existingBtn = document.getElementById('backToMateriasBtn');
    if (existingBtn) existingBtn.remove();
}

// Go back to materias selection
function backToMateriasSelection() {
    // Actualizar título
    document.getElementById('aulaTitle').textContent = currentAulaData.nombre || 'Aula';

    // Ocultar tabs y contenido
    const tabsContainer = document.querySelector('.tabs-container');
    const tabContent = document.querySelector('.tab-content');
    if (tabsContainer) tabsContainer.style.display = 'none';
    if (tabContent) tabContent.style.display = 'none';

    // Ocultar tarjeta de estadísticas
    const statsCard = document.getElementById('materiaStatsCard');
    if (statsCard) statsCard.remove();

    // Mostrar tarjetas de materias
    const cardsContainer = document.getElementById('materiasCardsContainer');
    if (cardsContainer) {
        cardsContainer.style.display = 'block';
    }

    // Limpiar materia actual
    currentMateria = '';
    
    // Limpiar el parámetro materia de la URL
    const url = new URL(window.location.href);
    url.searchParams.delete('materia');
    window.history.replaceState({}, '', url);
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

// Setup tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');

            // Remove active class from all tabs
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            // Add active class to clicked tab
            btn.classList.add('active');
            document.getElementById(`${tabName}Pane`).classList.add('active');

            // Load content based on tab
            switch (tabName) {
                case 'anuncios':
                    loadAnuncios();
                    break;
                case 'desafios':
                    loadDesafios();
                    break;
                case 'tareas':
                    loadTareas();
                    break;
                case 'materiales':
                    loadMateriales();
                    break;
                case 'foro':
                    loadForo();
                    break;
                case 'estudiantes':
                    loadEstudiantes();
                    break;
                case 'notas':
                    loadNotas();
                    break;
            }
        });
    });
    
    // Setup desafíos submenu
    setupDesafiosSubmenu();
}

// Setup desafíos submenu (Retos / Tienda)
function setupDesafiosSubmenu() {
    const submenuBtns = document.querySelectorAll('.desafios-submenu-btn');
    
    submenuBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const subtab = btn.getAttribute('data-subtab');
            
            // Remove active from all submenu buttons
            submenuBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.desafios-subtab').forEach(s => s.classList.remove('active'));
            
            // Add active to clicked
            btn.classList.add('active');
            document.getElementById(`${subtab}Subtab`).classList.add('active');
        });
    });
    
    // Botón iniciar desafío
    const iniciarDesafioBtn = document.getElementById('iniciarDesafioBtn');
    if (iniciarDesafioBtn) {
        iniciarDesafioBtn.addEventListener('click', () => {
            // Redirigir a la página de desafíos con la materia actual
            window.location.href = `Desafios.html?materia=${currentMateria}&aula=${currentAulaId}`;
        });
    }
}

// Load desafios
function loadDesafios() {
    const desafiosContainer = document.getElementById('desafiosContainer');
    // Los desafíos se cargarán aquí cuando estén disponibles
    desafiosContainer.innerHTML = '';
}

// Load foro
function loadForo() {
    const foroContainer = document.getElementById('foroContainer');
    foroContainer.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-chat-dots"></i>
            <p>Próximamente: Foro</p>
        </div>
    `;
}

// Load notas
function loadNotas() {
    const notasContainer = document.getElementById('notasContainer');
    notasContainer.innerHTML = `
        <div class="empty-state">
            <i class="bi bi-journal-text"></i>
            <p>Próximamente: Notas</p>
        </div>
    `;
}

// Load anuncios
async function loadAnuncios() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

        // Construir query base
        let query = db.collection('anuncios').where('materia', '==', currentMateria);

        // Si hay un aula seleccionada, filtrar también por aulaId
        if (currentAulaId) {
            query = query.where('aulaId', '==', currentAulaId);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-megaphone"></i>
                    <p>No hay anuncios aún</p>
                </div>
            `;
            return;
        }

        // Sort manually by tipo (clases primero) y luego por fecha
        const anuncios = [];
        snapshot.forEach(doc => {
            anuncios.push({ id: doc.id, data: doc.data() });
        });

        anuncios.sort((a, b) => {
            // Primero ordenar por tipo (clases primero)
            const tipoA = a.data.tipo === 'clase' ? 0 : 1;
            const tipoB = b.data.tipo === 'clase' ? 0 : 1;

            if (tipoA !== tipoB) {
                return tipoA - tipoB;
            }

            // Luego ordenar por fecha (más reciente primero)
            const fechaA = a.data.fecha ? a.data.fecha.seconds : 0;
            const fechaB = b.data.fecha ? b.data.fecha.seconds : 0;
            return fechaB - fechaA; // Descending order
        });

        postsContainer.innerHTML = '';

        for (const anuncio of anuncios) {
            const postCard = await createPostCard(anuncio.id, anuncio.data);
            postsContainer.appendChild(postCard);
        }

    } catch (error) {
        console.error('Error al cargar anuncios:', error);
        document.getElementById('postsContainer').innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error al cargar anuncios</p>
            </div>
        `;
    }
}

// Create post card
async function createPostCard(id, anuncio) {
    const card = document.createElement('div');
    card.className = 'post-card';

    // Agregar clase de materia para el borde de color
    const materiaClase = anuncio.materia || currentMateria;
    if (materiaClase) {
        card.classList.add(`materia-${materiaClase}`);
    }

    // Agregar clase si el anuncio está cancelado
    if (anuncio.cancelada === true) {
        card.classList.add('cancelled');
    }

    // Get author info
    let authorName = 'Usuario';
    let authorPhoto = '';

    try {
        const db = window.firebaseDB;
        const authorDoc = await db.collection('usuarios').doc(anuncio.autorId).get();
        if (authorDoc.exists) {
            const authorData = authorDoc.data();
            authorName = authorData.nombre;
            authorPhoto = authorData.fotoPerfil || '';
        }
    } catch (error) {
        console.error('Error al obtener autor:', error);
    }

    const fecha = anuncio.fecha ? new Date(anuncio.fecha.seconds * 1000) : new Date();
    const fechaStr = formatearFecha(fecha);

    // Build media HTML (images and videos in grid)
    let mediaHTML = '';
    let mediaItems = [];

    // Add image if exists
    if (anuncio.imagenUrl) {
        mediaItems.push(`
            <div class="post-image" onclick="openMediaModal('${anuncio.imagenUrl}', 'image')">
                <img src="${anuncio.imagenUrl}" alt="Imagen del anuncio">
                <div class="media-overlay">
                    <i class="bi bi-zoom-in"></i>
                </div>
            </div>
        `);
    }

    // Add video if exists
    if (anuncio.videoTipo && anuncio.videoUrl) {
        if (anuncio.videoTipo === 'youtube') {
            const videoId = extractYouTubeId(anuncio.videoUrl);
            if (videoId) {
                mediaItems.push(`
                    <div class="post-video">
                        <div class="video-container-small" onclick="openMediaModal('${videoId}', 'youtube')">
                            <iframe 
                                src="https://www.youtube.com/embed/${videoId}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                            <div class="media-overlay">
                                <i class="bi bi-play-circle"></i>
                            </div>
                        </div>
                    </div>
                `);
            }
        } else if (anuncio.videoTipo === 'drive') {
            const fileId = extractDriveFileId(anuncio.videoUrl);
            if (fileId) {
                mediaItems.push(`
                    <div class="post-video">
                        <div class="drive-container-small" onclick="openMediaModal('${fileId}', 'drive')">
                            <iframe 
                                src="https://drive.google.com/file/d/${fileId}/preview" 
                                frameborder="0" 
                                allow="autoplay">
                            </iframe>
                            <div class="media-overlay">
                                <i class="bi bi-play-circle"></i>
                            </div>
                        </div>
                    </div>
                `);
            }
        }
    }

    // Wrap media items in grid container if there are any
    if (mediaItems.length > 0) {
        mediaHTML = `<div class="post-media-container">${mediaItems.join('')}</div>`;
    }

    // Build class meeting button if exists
    let meetingButtonHTML = '';
    if (anuncio.enlaceClase) {
        // Obtener la materia del anuncio o usar la materia actual
        const materiaClase = anuncio.materia || currentMateria;
        meetingButtonHTML = `
            <div class="post-meeting-button">
                <a href="${anuncio.enlaceClase}" target="_blank" class="btn-join-meeting ${materiaClase}">
                    <i class="bi bi-camera-video-fill"></i>
                    Unirme a la reunión
                </a>
            </div>
        `;
    }

    card.innerHTML = `
        <div class="post-header">
            <div class="post-avatar">
                ${authorPhoto ? `<img src="${authorPhoto}" alt="${authorName}">` : '<i class="bi bi-person-fill"></i>'}
            </div>
            <div class="post-info">
                <div class="post-author">${authorName}</div>
                <div class="post-date">${fechaStr}</div>
            </div>
            ${currentUser.tipoUsuario === 'admin' ? `
                <div class="post-actions">
                    <button class="post-action-btn" onclick="editarAnuncio('${id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="post-action-btn" onclick="eliminarAnuncio('${id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
        ${anuncio.titulo ? `<h3 class="post-title">${anuncio.titulo}</h3>` : ''}
        <div class="post-content">${convertirEnlacesAClickeables(anuncio.contenido)}</div>
        ${mediaHTML}
        ${meetingButtonHTML}
    `;

    return card;
}

// Load tareas
async function loadTareas() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const tasksContainer = document.getElementById('tasksContainer');
        tasksContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

        // Construir query base
        let query = db.collection('tareas').where('materia', '==', currentMateria);

        // Si hay un aula seleccionada, filtrar también por aulaId
        if (currentAulaId) {
            query = query.where('aulaId', '==', currentAulaId);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-clipboard-check"></i>
                    <p>No hay tareas asignadas</p>
                </div>
            `;
            return;
        }

        // Sort manually by fechaEntrega
        const tareas = [];
        snapshot.forEach(doc => {
            tareas.push({ id: doc.id, data: doc.data() });
        });

        tareas.sort((a, b) => {
            const fechaA = a.data.fechaEntrega ? a.data.fechaEntrega.seconds : 0;
            const fechaB = b.data.fechaEntrega ? b.data.fechaEntrega.seconds : 0;
            return fechaA - fechaB; // Ascending order
        });

        tasksContainer.innerHTML = '';

        for (const tarea of tareas) {
            const taskCard = await createTaskCard(tarea.id, tarea.data);
            tasksContainer.appendChild(taskCard);
        }

    } catch (error) {
        console.error('Error al cargar tareas:', error);
        document.getElementById('tasksContainer').innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error al cargar tareas</p>
            </div>
        `;
    }
}

// Create task card
async function createTaskCard(id, tarea) {
    const card = document.createElement('div');
    card.className = 'task-card';

    const fechaEntrega = tarea.fechaEntrega ? new Date(tarea.fechaEntrega.seconds * 1000) : new Date();
    const ahora = new Date();
    let status = 'pending';
    let statusText = 'Pendiente';

    // Check if student has submitted
    let isSubmitted = false;
    let submissionStatus = '';

    if (currentUser.tipoUsuario === 'estudiante') {
        const db = window.firebaseDB;
        const submissionSnapshot = await db.collection('entregas')
            .where('tareaId', '==', id)
            .where('estudianteId', '==', currentUser.id)
            .get();

        if (!submissionSnapshot.empty) {
            isSubmitted = true;
            status = 'completed';
            statusText = 'Entregada';

            // Check if graded
            const submissionData = submissionSnapshot.docs[0].data();
            if (submissionData.calificacion !== undefined) {
                const maxPoints = tarea.puntos || 100;
                const percentage = (submissionData.calificacion / maxPoints) * 100;

                // Determine color based on percentage
                let bgColor, textColor;
                if (percentage >= 90) {
                    // Excelente: Verde oscuro
                    bgColor = '#d4edda';
                    textColor = '#155724';
                } else if (percentage >= 70) {
                    // Bueno: Verde claro
                    bgColor = '#d1ecf1';
                    textColor = '#0c5460';
                } else if (percentage >= 50) {
                    // Regular: Amarillo
                    bgColor = '#fff3cd';
                    textColor = '#856404';
                } else {
                    // Malo: Rojo
                    bgColor = '#f8d7da';
                    textColor = '#721c24';
                }

                submissionStatus = `<span class="submissions-count" style="background: ${bgColor}; color: ${textColor}; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: 600;">Calificación: ${submissionData.calificacion}/${maxPoints}</span>`;
            }
        } else if (fechaEntrega < ahora) {
            status = 'overdue';
            statusText = 'Vencida';
        }
    } else if (currentUser.tipoUsuario === 'admin') {
        // Count submissions for admin
        const db = window.firebaseDB;
        const submissionsSnapshot = await db.collection('entregas')
            .where('tareaId', '==', id)
            .get();

        const submissionsCount = submissionsSnapshot.size;
        submissionStatus = `<span class="submissions-count">${submissionsCount} entrega(s)</span>`;

        if (fechaEntrega < ahora) {
            status = 'overdue';
            statusText = 'Vencida';
        }
    }

    // Build media HTML (images and videos in grid)
    let mediaHTML = '';
    let mediaItems = [];

    // Add image if exists
    if (tarea.imagenUrl) {
        mediaItems.push(`
            <div class="task-image" onclick="openMediaModal('${tarea.imagenUrl}', 'image')">
                <img src="${tarea.imagenUrl}" alt="Imagen de la tarea">
                <div class="media-overlay">
                    <i class="bi bi-zoom-in"></i>
                </div>
            </div>
        `);
    }

    // Add video if exists
    if (tarea.videoTipo && tarea.videoUrl) {
        if (tarea.videoTipo === 'youtube') {
            const videoId = extractYouTubeId(tarea.videoUrl);
            if (videoId) {
                mediaItems.push(`
                    <div class="task-video">
                        <div class="video-container-small" onclick="openMediaModal('${videoId}', 'youtube')">
                            <iframe 
                                src="https://www.youtube.com/embed/${videoId}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                            <div class="media-overlay">
                                <i class="bi bi-play-circle"></i>
                            </div>
                        </div>
                    </div>
                `);
            }
        } else if (tarea.videoTipo === 'drive') {
            const fileId = extractDriveFileId(tarea.videoUrl);
            if (fileId) {
                mediaItems.push(`
                    <div class="task-video">
                        <div class="drive-container-small" onclick="openMediaModal('${fileId}', 'drive')">
                            <iframe 
                                src="https://drive.google.com/file/d/${fileId}/preview" 
                                frameborder="0" 
                                allow="autoplay">
                            </iframe>
                            <div class="media-overlay">
                                <i class="bi bi-play-circle"></i>
                            </div>
                        </div>
                    </div>
                `);
            }
        }
    }

    // Wrap media items in grid container if there are any
    if (mediaItems.length > 0) {
        mediaHTML = `<div class="task-media-container">${mediaItems.join('')}</div>`;
    }

    // No external Drive links for tasks
    let driveFilesHTML = '';

    card.innerHTML = `
        <div class="task-header">
            <div>
                <h3 class="task-title">${tarea.titulo}</h3>
                ${tarea.puntos ? `<span class="task-points">${tarea.puntos} puntos</span>` : ''}
            </div>
            <div class="task-status-container">
                <span class="task-status ${status}">${statusText}</span>
                ${submissionStatus}
            </div>
        </div>
        <div class="task-description">${tarea.descripcion}</div>
        ${mediaHTML}
        ${driveFilesHTML}
        <div class="task-footer">
            <div class="task-due-date">
                <i class="bi bi-calendar-event"></i>
                <span>Entrega: ${formatearFecha(fechaEntrega)}</span>
            </div>
            <div class="task-actions">
                ${currentUser.tipoUsuario === 'estudiante' && !isSubmitted ? `
                    <button class="submit-task-btn" onclick="openSubmitTaskModal('${id}', '${tarea.titulo}')">
                        <i class="bi bi-send"></i>
                        Entregar Tarea
                    </button>
                ` : ''}
                ${currentUser.tipoUsuario === 'admin' ? `
                    <button class="view-submissions-btn" onclick="viewSubmissions('${id}', '${tarea.titulo}')">
                        <i class="bi bi-eye"></i>
                        Ver Entregas
                    </button>
                    <button class="post-action-btn" onclick="editarTarea('${id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="post-action-btn" onclick="eliminarTarea('${id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `;

    return card;
}

// Load materiales organized by topics
async function loadMateriales() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const materialsContainer = document.getElementById('materialsContainer');
        materialsContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

        // Load topics first
        let topicsQuery = db.collection('temas').where('materia', '==', currentMateria);
        if (currentAulaId) {
            topicsQuery = topicsQuery.where('aulaId', '==', currentAulaId);
        }
        const topicsSnapshot = await topicsQuery.get();

        // Load materials
        let materialsQuery = db.collection('materiales').where('materia', '==', currentMateria);
        if (currentAulaId) {
            materialsQuery = materialsQuery.where('aulaId', '==', currentAulaId);
        }
        const materialsSnapshot = await materialsQuery.get();

        // Organize topics
        const topics = [];
        topicsSnapshot.forEach(doc => {
            topics.push({ id: doc.id, ...doc.data() });
        });
        topics.sort((a, b) => {
            const orderA = a.orden || 0;
            const orderB = b.orden || 0;
            return orderB - orderA; // Orden descendente: los más recientes primero
        });

        // Organize materials by topic
        const materialsByTopic = {};
        const uncategorizedMaterials = [];

        materialsSnapshot.forEach(doc => {
            const material = { id: doc.id, ...doc.data() };
            if (material.temaId) {
                if (!materialsByTopic[material.temaId]) {
                    materialsByTopic[material.temaId] = [];
                }
                materialsByTopic[material.temaId].push(material);
            } else {
                uncategorizedMaterials.push(material);
            }
        });

        // Sort materials within each topic by orden (or fecha if no orden)
        Object.keys(materialsByTopic).forEach(topicId => {
            materialsByTopic[topicId].sort((a, b) => {
                // Primero por orden si existe
                const ordenA = a.orden !== undefined ? a.orden : 999999;
                const ordenB = b.orden !== undefined ? b.orden : 999999;
                if (ordenA !== ordenB) return ordenA - ordenB;
                // Si no hay orden, por fecha descendente
                const fechaA = a.fecha ? a.fecha.seconds : 0;
                const fechaB = b.fecha ? b.fecha.seconds : 0;
                return fechaB - fechaA;
            });
        });

        uncategorizedMaterials.sort((a, b) => {
            const ordenA = a.orden !== undefined ? a.orden : 999999;
            const ordenB = b.orden !== undefined ? b.orden : 999999;
            if (ordenA !== ordenB) return ordenA - ordenB;
            const fechaA = a.fecha ? a.fecha.seconds : 0;
            const fechaB = b.fecha ? b.fecha.seconds : 0;
            return fechaB - fechaA;
        });

        // Check if there's any content
        if (topics.length === 0 && uncategorizedMaterials.length === 0) {
            materialsContainer.innerHTML = `
                <div class="no-topics-state">
                    <i class="bi bi-folder-plus"></i>
                    <h3>No hay materiales aún</h3>
                    <p>${currentUser.tipoUsuario === 'admin' ? 'Crea un tema y agrega materiales para comenzar' : 'El profesor aún no ha agregado materiales'}</p>
                </div>
            `;
            return;
        }

        materialsContainer.innerHTML = '';

        // Render topics with their materials
        topics.forEach(topic => {
            const topicMaterials = materialsByTopic[topic.id] || [];
            const topicElement = createTopicElement(topic, topicMaterials);
            materialsContainer.appendChild(topicElement);
        });

        // Render uncategorized materials if any
        if (uncategorizedMaterials.length > 0) {
            const uncategorizedSection = document.createElement('div');
            uncategorizedSection.className = 'uncategorized-section';
            uncategorizedSection.innerHTML = `
                <div class="uncategorized-header">
                    <i class="bi bi-inbox"></i>
                    <span>Materiales sin tema</span>
                </div>
            `;

            // Contenedor para materiales sin categoría con drag & drop
            const uncategorizedMaterialsContainer = document.createElement('div');
            uncategorizedMaterialsContainer.className = 'topic-materials';
            uncategorizedMaterialsContainer.id = 'topic-materials-uncategorized';

            uncategorizedMaterials.forEach(material => {
                const materialCard = createMaterialCard(material.id, material);
                uncategorizedMaterialsContainer.appendChild(materialCard);
            });

            uncategorizedSection.appendChild(uncategorizedMaterialsContainer);
            materialsContainer.appendChild(uncategorizedSection);
        }

        // Inicializar drag & drop para materiales (solo admin)
        if (currentUser.tipoUsuario === 'admin') {
            initMaterialsDragAndDrop();
        }

    } catch (error) {
        console.error('Error al cargar materiales:', error);
        document.getElementById('materialsContainer').innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error al cargar materiales</p>
            </div>
        `;
    }
}

// Create topic element with collapsible content
function createTopicElement(topic, materials) {
    const container = document.createElement('div');
    container.className = 'topic-container';
    container.id = `topic-${topic.id}`;

    // Check if topic should be collapsed (from localStorage)
    const collapsedTopics = JSON.parse(localStorage.getItem('collapsedTopics') || '{}');
    if (collapsedTopics[topic.id]) {
        container.classList.add('collapsed');
    }

    const materialsCount = materials.length;
    const countText = materialsCount === 1 ? '1 material' : `${materialsCount} materiales`;

    container.innerHTML = `
        <div class="topic-header" onclick="toggleTopic('${topic.id}')">
            <button class="topic-toggle" onclick="event.stopPropagation(); toggleTopic('${topic.id}')">
                <i class="bi bi-chevron-down"></i>
            </button>
            <div class="topic-icon">
                <i class="bi bi-folder-fill"></i>
            </div>
            <div class="topic-info">
                <h3 class="topic-title">${topic.nombre}</h3>
                ${topic.descripcion ? `<p class="topic-description">${topic.descripcion}</p>` : ''}
            </div>
            <span class="topic-count">${countText}</span>
            ${currentUser.tipoUsuario === 'admin' ? `
                <div class="topic-actions" onclick="event.stopPropagation()">
                    <button class="topic-action-btn" onclick="editarTema('${topic.id}')" title="Editar tema">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="topic-action-btn delete" onclick="eliminarTema('${topic.id}')" title="Eliminar tema">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
        <div class="topic-content">
            <div class="topic-materials" id="topic-materials-${topic.id}">
                ${materials.length === 0 ? `
                    <div class="topic-empty">
                        <i class="bi bi-file-earmark-plus"></i>
                        <p>No hay materiales en este tema</p>
                    </div>
                ` : ''}
            </div>
        </div>
    `;

    // Add material cards
    if (materials.length > 0) {
        const materialsContainer = container.querySelector(`#topic-materials-${topic.id}`);
        materials.forEach(material => {
            const materialCard = createMaterialCard(material.id, material);
            materialsContainer.appendChild(materialCard);
        });
    }

    return container;
}

// Setup materials search functionality
function setupMaterialsSearch() {
    const searchInput = document.getElementById('materialsSearchInput');
    const clearBtn = document.getElementById('clearMaterialsSearch');

    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = query ? 'flex' : 'none';
        }

        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterMaterials(query);
        }, 300);
    });

    // Clear search
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterMaterials('');
            searchInput.focus();
        });
    }

    // Clear on Escape key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            filterMaterials('');
        }
    });
}

// Filter materials based on search query
function filterMaterials(query) {
    const materialsContainer = document.getElementById('materialsContainer');
    if (!materialsContainer) return;

    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // Remove existing search results info
    const existingInfo = materialsContainer.querySelector('.search-results-info');
    if (existingInfo) existingInfo.remove();

    const existingNoResults = materialsContainer.querySelector('.no-search-results');
    if (existingNoResults) existingNoResults.remove();

    // If no query, show all
    if (!normalizedQuery) {
        // Show all topics
        materialsContainer.querySelectorAll('.topic-container').forEach(topic => {
            topic.classList.remove('hidden-by-search', 'topic-match');
            // Remove highlight from topic title
            removeTopicHighlight(topic);
            // Show all materials in topic
            topic.querySelectorAll('.material-card').forEach(card => {
                card.classList.remove('hidden-by-search');
                // Remove highlights
                removeHighlights(card);
            });
        });

        // Show uncategorized section
        const uncategorized = materialsContainer.querySelector('.uncategorized-section');
        if (uncategorized) {
            uncategorized.classList.remove('hidden-by-search');
            uncategorized.querySelectorAll('.material-card').forEach(card => {
                card.classList.remove('hidden-by-search');
                removeHighlights(card);
            });
        }
        return;
    }

    let totalMatches = 0;
    let topicsMatched = 0;

    // Filter topics and their materials
    materialsContainer.querySelectorAll('.topic-container').forEach(topic => {
        let topicHasMatches = false;
        let materialMatches = 0;

        // Check if topic title matches
        const topicTitle = topic.querySelector('.topic-title')?.textContent || '';
        const topicDesc = topic.querySelector('.topic-description')?.textContent || '';
        const normalizedTopicTitle = topicTitle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedTopicDesc = topicDesc.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const topicMatches = normalizedTopicTitle.includes(normalizedQuery) || normalizedTopicDesc.includes(normalizedQuery);

        if (topicMatches) {
            // Topic title matches - show all materials in this topic
            topicHasMatches = true;
            topicsMatched++;
            topic.classList.add('topic-match');
            highlightTopicTitle(topic, query);

            // Show all materials in this topic
            topic.querySelectorAll('.material-card').forEach(card => {
                card.classList.remove('hidden-by-search');
                materialMatches++;
                // Also highlight if material matches
                const title = card.querySelector('.material-title')?.textContent || '';
                const description = card.querySelector('.material-description')?.textContent || '';
                const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const normalizedDesc = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                if (normalizedTitle.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery)) {
                    highlightText(card, query);
                } else {
                    removeHighlights(card);
                }
            });
        } else {
            // Topic doesn't match - check individual materials
            topic.classList.remove('topic-match');
            removeTopicHighlight(topic);

            topic.querySelectorAll('.material-card').forEach(card => {
                const title = card.querySelector('.material-title')?.textContent || '';
                const description = card.querySelector('.material-description')?.textContent || '';

                const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                const normalizedDesc = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

                const matches = normalizedTitle.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery);

                if (matches) {
                    card.classList.remove('hidden-by-search');
                    topicHasMatches = true;
                    materialMatches++;
                    highlightText(card, query);
                } else {
                    card.classList.add('hidden-by-search');
                    removeHighlights(card);
                }
            });
        }

        totalMatches += materialMatches;

        // Show/hide topic based on matches
        if (topicHasMatches) {
            topic.classList.remove('hidden-by-search');
            // Expand topic if it has matches
            topic.classList.remove('collapsed');
        } else {
            topic.classList.add('hidden-by-search');
        }
    });

    // Filter uncategorized materials
    const uncategorized = materialsContainer.querySelector('.uncategorized-section');
    if (uncategorized) {
        let uncategorizedHasMatches = false;

        uncategorized.querySelectorAll('.material-card').forEach(card => {
            const title = card.querySelector('.material-title')?.textContent || '';
            const description = card.querySelector('.material-description')?.textContent || '';

            const normalizedTitle = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const normalizedDesc = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

            const matches = normalizedTitle.includes(normalizedQuery) || normalizedDesc.includes(normalizedQuery);

            if (matches) {
                card.classList.remove('hidden-by-search');
                uncategorizedHasMatches = true;
                totalMatches++;
                highlightText(card, query);
            } else {
                card.classList.add('hidden-by-search');
                removeHighlights(card);
            }
        });

        if (uncategorizedHasMatches) {
            uncategorized.classList.remove('hidden-by-search');
        } else {
            uncategorized.classList.add('hidden-by-search');
        }
    }

    // Show results info or no results message
    if (totalMatches > 0 || topicsMatched > 0) {
        const resultsInfo = document.createElement('div');
        resultsInfo.className = 'search-results-info';
        let resultText = '';
        if (topicsMatched > 0 && totalMatches > 0) {
            resultText = `${topicsMatched} ${topicsMatched === 1 ? 'tema' : 'temas'} y ${totalMatches} ${totalMatches === 1 ? 'material' : 'materiales'}`;
        } else if (topicsMatched > 0) {
            resultText = `${topicsMatched} ${topicsMatched === 1 ? 'tema' : 'temas'}`;
        } else {
            resultText = `${totalMatches} ${totalMatches === 1 ? 'resultado' : 'resultados'}`;
        }
        resultsInfo.innerHTML = `
            <div class="results-count">
                <i class="bi bi-search"></i>
                <span>${resultText} para "<span class="search-term">${escapeHtml(query)}</span>"</span>
            </div>
        `;
        materialsContainer.insertBefore(resultsInfo, materialsContainer.firstChild);
    } else {
        const noResults = document.createElement('div');
        noResults.className = 'no-search-results';
        noResults.innerHTML = `
            <i class="bi bi-search"></i>
            <h3>No se encontraron resultados</h3>
            <p>No hay materiales que coincidan con "${escapeHtml(query)}"</p>
        `;
        materialsContainer.appendChild(noResults);
    }
}

// Highlight matching text
function highlightText(card, query) {
    const titleEl = card.querySelector('.material-title');
    const descEl = card.querySelector('.material-description');

    if (titleEl) {
        titleEl.innerHTML = highlightMatches(titleEl.textContent, query);
    }
    if (descEl) {
        descEl.innerHTML = highlightMatches(descEl.textContent, query);
    }
}

// Remove highlights from card
function removeHighlights(card) {
    const titleEl = card.querySelector('.material-title');
    const descEl = card.querySelector('.material-description');

    if (titleEl) {
        titleEl.innerHTML = titleEl.textContent;
    }
    if (descEl) {
        descEl.innerHTML = descEl.textContent;
    }
}

// Highlight matches in text
function highlightMatches(text, query) {
    if (!query) return escapeHtml(text);

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');

    return escapeHtml(text).replace(regex, '<span class="search-highlight">$1</span>');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle topic collapse/expand
function toggleTopic(topicId) {
    const container = document.getElementById(`topic-${topicId}`);
    if (!container) return;

    container.classList.toggle('collapsed');

    // Save state to localStorage
    const collapsedTopics = JSON.parse(localStorage.getItem('collapsedTopics') || '{}');
    collapsedTopics[topicId] = container.classList.contains('collapsed');
    localStorage.setItem('collapsedTopics', JSON.stringify(collapsedTopics));
}

// Load topics into select dropdown
async function loadTopicsIntoSelect(selectId, selectedTopicId = null) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const select = document.getElementById(selectId);
        if (!select) return;

        // Keep the first option
        select.innerHTML = '<option value="">Selecciona un tema</option>';

        let query = db.collection('temas').where('materia', '==', currentMateria);
        if (currentAulaId) {
            query = query.where('aulaId', '==', currentAulaId);
        }

        const snapshot = await query.get();

        const topics = [];
        snapshot.forEach(doc => {
            topics.push({ id: doc.id, ...doc.data() });
        });

        topics.sort((a, b) => (a.orden || 0) - (b.orden || 0));

        topics.forEach(topic => {
            const option = document.createElement('option');
            option.value = topic.id;
            option.textContent = topic.nombre;
            if (selectedTopicId && topic.id === selectedTopicId) {
                option.selected = true;
            }
            select.appendChild(option);
        });

    } catch (error) {
        console.error('Error loading topics:', error);
    }
}

// Open create topic modal
function openTopicModal() {
    const modal = document.getElementById('createTopicModal');
    // Aplicar color de la materia al modal
    if (window.currentMateriaColor) {
        modal.style.setProperty('--materia-color', window.currentMateriaColor);
    }
    modal.classList.add('active');
    document.getElementById('topicName').focus();
}

// Close create topic modal
function closeTopicModal() {
    document.getElementById('createTopicModal').classList.remove('active');
    document.getElementById('createTopicForm').reset();
}

// Create new topic
async function crearTema() {
    try {
        const submitBtn = document.querySelector('#createTopicForm .submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Creando...';

        const db = window.firebaseDB;
        const nombre = document.getElementById('topicName').value.trim();
        const descripcion = document.getElementById('topicDescription').value.trim();

        if (!nombre) {
            showAlertModal('Error', 'El nombre del tema es requerido');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        // Get current max order
        let query = db.collection('temas').where('materia', '==', currentMateria);
        if (currentAulaId) {
            query = query.where('aulaId', '==', currentAulaId);
        }
        const snapshot = await query.get();

        let maxOrder = 0;
        snapshot.forEach(doc => {
            const orden = doc.data().orden || 0;
            if (orden > maxOrder) maxOrder = orden;
        });

        const newTopicRef = await db.collection('temas').add({
            materia: currentMateria,
            aulaId: currentAulaId || null,
            nombre: nombre,
            descripcion: descripcion || null,
            orden: maxOrder + 1,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeTopicModal();
        showAlertModal('Éxito', 'Tema creado correctamente');
        loadMateriales();

        // Reload topics in select and select the new topic if material modal is open
        const materialModal = document.getElementById('createMaterialModal');
        if (materialModal && materialModal.classList.contains('active')) {
            await loadTopicsIntoSelect('materialTopic', newTopicRef.id);
        } else {
            loadTopicsIntoSelect('materialTopic');
        }

    } catch (error) {
        console.error('Error al crear tema:', error);
        showAlertModal('Error', 'Error al crear el tema');
    } finally {
        const submitBtn = document.querySelector('#createTopicForm .submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Crear Tema';
        }
    }
}

// Edit topic
async function editarTema(topicId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const doc = await db.collection('temas').doc(topicId).get();
        if (!doc.exists) {
            showAlertModal('Error', 'Tema no encontrado');
            return;
        }

        const topic = doc.data();

        document.getElementById('editTopicId').value = topicId;
        document.getElementById('editTopicName').value = topic.nombre || '';
        document.getElementById('editTopicDescription').value = topic.descripcion || '';

        const modal = document.getElementById('editTopicModal');
        // Aplicar color de la materia al modal
        if (window.currentMateriaColor) {
            modal.style.setProperty('--materia-color', window.currentMateriaColor);
        }
        modal.classList.add('active');

    } catch (error) {
        console.error('Error al cargar tema:', error);
        showAlertModal('Error', 'Error al cargar el tema');
    }
}

// Close edit topic modal
function closeEditTopicModal() {
    document.getElementById('editTopicModal').classList.remove('active');
    document.getElementById('editTopicForm').reset();
}

// Save edited topic
async function guardarTema() {
    try {
        const submitBtn = document.querySelector('#editTopicForm .submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Guardando...';

        const db = window.firebaseDB;
        const topicId = document.getElementById('editTopicId').value;
        const nombre = document.getElementById('editTopicName').value.trim();
        const descripcion = document.getElementById('editTopicDescription').value.trim();

        if (!nombre) {
            showAlertModal('Error', 'El nombre del tema es requerido');
            return;
        }

        await db.collection('temas').doc(topicId).update({
            nombre: nombre,
            descripcion: descripcion || null
        });

        closeEditTopicModal();
        showAlertModal('Éxito', 'Tema actualizado correctamente');
        loadMateriales();
        loadTopicsIntoSelect('materialTopic');
        loadTopicsIntoSelect('editMaterialTopic');

    } catch (error) {
        console.error('Error al guardar tema:', error);
        showAlertModal('Error', 'Error al guardar el tema');
    } finally {
        const submitBtn = document.querySelector('#editTopicForm .submit-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Guardar Cambios';
        }
    }
}

// Delete topic
function eliminarTema(topicId) {
    showConfirmModal(
        'Eliminar Tema',
        '¿Estás seguro de que deseas eliminar este tema? Los materiales dentro del tema quedarán sin categoría.',
        async () => {
            try {
                const db = window.firebaseDB;

                // Update materials to remove topic reference
                const materialsSnapshot = await db.collection('materiales')
                    .where('temaId', '==', topicId)
                    .get();

                const batch = db.batch();
                materialsSnapshot.forEach(doc => {
                    batch.update(doc.ref, { temaId: null });
                });

                // Delete the topic
                batch.delete(db.collection('temas').doc(topicId));

                await batch.commit();

                showAlertModal('Éxito', 'Tema eliminado correctamente');
                loadMateriales();
                loadTopicsIntoSelect('materialTopic');
                loadTopicsIntoSelect('editMaterialTopic');

            } catch (error) {
                console.error('Error al eliminar tema:', error);
                showAlertModal('Error', 'Error al eliminar el tema');
            }
        }
    );
}

// Create material card
function createMaterialCard(id, material) {
    const card = document.createElement('div');
    card.className = 'material-card';

    // Format date
    let fechaStr = '';
    if (material.fecha) {
        const fecha = new Date(material.fecha.seconds * 1000);
        fechaStr = formatearFecha(fecha);
    }

    // Build media HTML (images and videos in grid)
    let mediaHTML = '';
    let mediaItems = [];

    // Add images if exist
    if (material.imageUrls && material.imageUrls.length > 0) {
        material.imageUrls.forEach(imageUrl => {
            mediaItems.push(`
                <div class="material-image" onclick="openMediaModal('${imageUrl}', 'image')">
                    <img src="${imageUrl}" alt="Imagen del material">
                    <div class="media-overlay">
                        <i class="bi bi-zoom-in"></i>
                    </div>
                </div>
            `);
        });
    }

    // Add videos if exist
    if (material.videos && material.videos.length > 0) {
        material.videos.forEach(video => {
            if (video.tipo === 'youtube') {
                const videoId = extractYouTubeId(video.url);
                if (videoId) {
                    mediaItems.push(`
                        <div class="material-video">
                            <div class="video-container-medium" onclick="openMediaModal('${videoId}', 'youtube')">
                                <iframe 
                                    src="https://www.youtube.com/embed/${videoId}" 
                                    frameborder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowfullscreen>
                                </iframe>
                                <div class="media-overlay">
                                    <i class="bi bi-play-circle"></i>
                                </div>
                            </div>
                        </div>
                    `);
                }
            } else if (video.tipo === 'drive') {
                const fileId = extractDriveFileId(video.url);
                if (fileId) {
                    mediaItems.push(`
                        <div class="material-video">
                            <div class="drive-container-medium" onclick="openMediaModal('${fileId}', 'drive')">
                                <iframe 
                                    src="https://drive.google.com/file/d/${fileId}/preview" 
                                    frameborder="0" 
                                    allow="autoplay">
                                </iframe>
                                <div class="media-overlay">
                                    <i class="bi bi-play-circle"></i>
                                </div>
                            </div>
                        </div>
                    `);
                }
            }
        });
    }

    // Add drive files as small thumbnails (like images and videos)
    if (material.driveFiles && material.driveFiles.length > 0) {
        material.driveFiles.forEach(file => {
            const fileId = file.fileId || extractDriveFileId(file.url);
            const folderId = extractDriveFolderId(file.url);
            const fileInfo = file.tipo ? file : detectExternalLinkType(file.url);

            // Create embed URL based on file type
            let embedUrl = '';
            let modalType = 'driveFile';

            // Escape the URL for onclick
            const escapedUrl = file.url.replace(/'/g, "\\'");

            // Handle external links (GitHub, Notion, Figma, etc.)
            if (fileInfo.isExternal || file.isExternal) {
                mediaItems.push(`
                    <div class="material-external-link" onclick="openExternalLink('${escapedUrl}')">
                        <div class="external-link-card">
                            <div class="external-link-icon" style="background-color: ${getFileTypeColor(fileInfo.tipo)}">
                                <i class="bi ${fileInfo.icono}"></i>
                            </div>
                            <div class="external-link-info">
                                <span class="external-link-name">${fileInfo.nombre}</span>
                                <span class="external-link-url">${truncateUrl(file.url, 40)}</span>
                            </div>
                            <div class="external-link-arrow">
                                <i class="bi bi-box-arrow-up-right"></i>
                            </div>
                        </div>
                    </div>
                `);
                return;
            }

            // Handle Canva files
            if (fileInfo.tipo === 'canva') {
                const canvaEmbedUrl = fileInfo.canvaEmbedUrl || file.canvaEmbedUrl;
                const escapedCanvaUrl = (canvaEmbedUrl || file.url).replace(/'/g, "\\'");
                
                mediaItems.push(`
                    <div class="material-canva-file" onclick="openCanvaModal('${escapedCanvaUrl}', '${escapedUrl}', '${fileInfo.nombre}')">
                        <div class="canva-container-medium">
                            <div class="canva-preview-placeholder">
                                <i class="bi bi-palette"></i>
                                <span>Canva</span>
                            </div>
                            <div class="media-overlay">
                                <i class="bi bi-eye"></i>
                            </div>
                            <div class="canva-file-label">
                                <i class="bi bi-palette" style="color: #00c4cc"></i>
                                <span>${fileInfo.nombre}</span>
                            </div>
                        </div>
                    </div>
                `);
                return;
            }

            if (fileInfo.tipo === 'doc') {
                embedUrl = `https://docs.google.com/document/d/${fileId}/preview`;
            } else if (fileInfo.tipo === 'sheet') {
                embedUrl = `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
            } else if (fileInfo.tipo === 'slide') {
                embedUrl = `https://docs.google.com/presentation/d/${fileId}/preview`;
            } else if (fileInfo.tipo === 'folder') {
                // Carpetas de Drive - mostrar como tarjeta especial
                const folderIdExtracted = folderId || fileId;
                mediaItems.push(`
                    <div class="material-drive-folder" onclick="openDriveFolderModal('${folderIdExtracted}', '${escapedUrl}')">
                        <div class="drive-folder-card">
                            <div class="drive-folder-icon">
                                <i class="bi bi-folder-fill"></i>
                            </div>
                            <div class="drive-folder-info">
                                <span class="drive-folder-name">${fileInfo.nombre || 'Carpeta de Drive'}</span>
                                <span class="drive-folder-hint">Click para ver contenido</span>
                            </div>
                            <div class="drive-folder-arrow">
                                <i class="bi bi-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                `);
                return;
            } else {
                // PDF and other files
                embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            }

            const escapedEmbedUrl = embedUrl.replace(/'/g, "\\'");

            mediaItems.push(`
                <div class="material-drive-file">
                    <div class="drive-file-container-medium" onclick="openDriveFileModal('${escapedEmbedUrl}', '${escapedUrl}', '${fileInfo.nombre}', '${fileInfo.tipo}')">
                        <iframe 
                            src="${embedUrl}" 
                            frameborder="0">
                        </iframe>
                        <div class="media-overlay">
                            <i class="bi ${fileInfo.icono}"></i>
                        </div>
                        <div class="drive-file-label">
                            <i class="bi ${fileInfo.icono}" style="color: ${getFileTypeColor(fileInfo.tipo)}"></i>
                            <span>${fileInfo.nombre}</span>
                        </div>
                    </div>
                </div>
            `);
        });
    }

    // Wrap media items in grid container if there are any
    if (mediaItems.length > 0) {
        mediaHTML = `<div class="material-media-container">${mediaItems.join('')}</div>`;
    }

    // No external Drive links - files are shown as embedded thumbnails only
    let driveFilesHTML = '';

    // Agregar atributos para drag & drop
    card.setAttribute('data-material-id', id);
    card.setAttribute('data-topic-id', material.temaId || '');
    if (currentUser.tipoUsuario === 'admin') {
        card.setAttribute('draggable', 'true');
    }

    card.innerHTML = `
        <div class="material-header">
            <div class="material-content">
                <h3 class="material-title">${material.titulo}</h3>
                ${material.descripcion ? `<p class="material-description">${material.descripcion}</p>` : ''}
                ${fechaStr ? `<span class="material-date"><i class="bi bi-calendar3"></i> ${fechaStr}</span>` : ''}
            </div>
            ${currentUser.tipoUsuario === 'admin' ? `
                <div class="material-actions">
                    <button class="material-drag-handle" title="Arrastrar para reordenar">
                        <i class="bi bi-grip-vertical"></i>
                    </button>
                    <button class="post-action-btn" onclick="editarMaterial('${id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="post-action-btn" onclick="eliminarMaterial('${id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
        ${mediaHTML}
        ${driveFilesHTML}
    `;

    return card;
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Extract Google Drive file ID from URL
function extractDriveFileId(url) {
    const patterns = [
        /\/file\/d\/([^\/]+)/,
        /id=([^&]+)/,
        /^([a-zA-Z0-9_-]+)$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Extract Google Drive folder ID from URL
function extractDriveFolderId(url) {
    const patterns = [
        /\/folders\/([^\/\?]+)/,
        /\/drive\/folders\/([^\/\?]+)/,
        /folderId=([^&]+)/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

// Open Drive folder modal with professional view
function openDriveFolderModal(folderId, originalUrl) {
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('mediaModalContent');

    // Crear URL de embed para la carpeta - Grid por defecto (vista de miniaturas)
    const gridUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;

    modalContent.innerHTML = `
        <div class="drive-folder-fullscreen">
            <div class="drive-folder-fullscreen-header">
                <div class="drive-folder-fullscreen-info">
                    <i class="bi bi-folder-fill" style="color: #ffc107; font-size: 1.8rem;"></i>
                    <div class="drive-folder-title-section">
                        <span class="drive-folder-title">Carpeta de Google Drive</span>
                        <span class="drive-folder-subtitle">Haz clic en un archivo para abrirlo</span>
                    </div>
                </div>
                <div class="drive-folder-actions">
                    <div class="drive-folder-view-toggle">
                        <button class="view-toggle-btn" onclick="switchFolderView('list', '${folderId}')" title="Vista de lista">
                            <i class="bi bi-list-ul"></i>
                        </button>
                        <button class="view-toggle-btn active" onclick="switchFolderView('grid', '${folderId}')" title="Vista de cuadrícula">
                            <i class="bi bi-grid-3x3-gap"></i>
                        </button>
                    </div>
                    <a href="${originalUrl}" target="_blank" class="drive-folder-open-btn">
                        <i class="bi bi-box-arrow-up-right"></i>
                        Abrir en Drive
                    </a>
                </div>
            </div>
            <div class="drive-folder-fullscreen-content" id="driveFolderContent">
                <div class="drive-folder-loading">
                    <i class="bi bi-arrow-clockwise"></i>
                    <span>Cargando contenido...</span>
                </div>
                <iframe 
                    id="driveFolderIframe"
                    src="${gridUrl}" 
                    frameborder="0"
                    onload="hideFolderLoading()">
                </iframe>
            </div>
            <div class="drive-folder-footer">
                <i class="bi bi-info-circle"></i>
                <span>Los archivos se abrirán en una nueva pestaña.</span>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Switch folder view between list and grid
function switchFolderView(view, folderId) {
    const iframe = document.getElementById('driveFolderIframe');
    const buttons = document.querySelectorAll('.view-toggle-btn');

    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-toggle-btn').classList.add('active');

    if (view === 'grid') {
        iframe.src = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
    } else {
        iframe.src = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    }
}

// Hide folder loading indicator
function hideFolderLoading() {
    const loading = document.querySelector('.drive-folder-loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Convertir enlaces en texto a enlaces clickeables
function convertirEnlacesAClickeables(texto) {
    if (!texto) return '';

    // Escapar HTML para prevenir XSS
    const escapeHtml = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    // Escapar el texto primero
    let textoEscapado = escapeHtml(texto);

    // Patrón para detectar URLs (http, https, www)
    const urlPattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

    // Reemplazar URLs con enlaces clickeables
    textoEscapado = textoEscapado.replace(urlPattern, (match) => {
        let url = match;
        let displayUrl = match;

        // Si no tiene protocolo, agregarlo
        if (!url.match(/^https?:\/\//i)) {
            url = 'https://' + url;
        }

        // Limpiar caracteres al final
        url = url.replace(/[.,;:!?)\]]+$/, '');
        displayUrl = displayUrl.replace(/[.,;:!?)\]]+$/, '');

        // Acortar URL para mostrar si es muy larga
        if (displayUrl.length > 50) {
            displayUrl = displayUrl.substring(0, 47) + '...';
        }

        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="content-link" title="${url}">${displayUrl}</a>`;
    });

    // Restaurar saltos de línea
    textoEscapado = textoEscapado.replace(/\n/g, '<br>');

    return textoEscapado;
}

// Load estudiantes
async function loadEstudiantes() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const studentsContainer = document.getElementById('studentsContainer');
        studentsContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

        let snapshot;

        // Si hay un aula seleccionada, buscar estudiantes con esa aula asignada
        if (currentAulaId) {
            snapshot = await db.collection('usuarios')
                .where('tipoUsuario', '==', 'estudiante')
                .where('aulasAsignadas', 'array-contains', currentAulaId)
                .get();
        } else {
            // Fallback al sistema antiguo (por materia)
            snapshot = await db.collection('usuarios')
                .where('tipoUsuario', '==', 'estudiante')
                .where('clasesPermitidas', 'array-contains', currentMateria)
                .get();
        }

        if (snapshot.empty) {
            studentsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-people"></i>
                    <p>No hay estudiantes inscritos en esta aula</p>
                </div>
            `;
            return;
        }

        studentsContainer.innerHTML = '';

        // Ordenar estudiantes por nombre
        const estudiantes = [];
        snapshot.forEach(doc => {
            estudiantes.push({ id: doc.id, ...doc.data() });
        });

        estudiantes.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        // Mostrar contador de estudiantes
        const countInfo = document.createElement('div');
        countInfo.className = 'students-count-info';
        countInfo.id = 'studentsCountInfo';
        countInfo.innerHTML = `<i class="bi bi-people-fill"></i> ${estudiantes.length} estudiante${estudiantes.length !== 1 ? 's' : ''}`;
        studentsContainer.appendChild(countInfo);

        estudiantes.forEach(estudiante => {
            const studentItem = createStudentItem(estudiante);
            studentsContainer.appendChild(studentItem);
        });

        // Inicializar búsqueda de estudiantes
        setupStudentsSearch();

    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        document.getElementById('studentsContainer').innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error al cargar estudiantes</p>
            </div>
        `;
    }
}

// Create student item
function createStudentItem(estudiante) {
    const item = document.createElement('div');
    item.className = 'student-item';
    item.setAttribute('data-nombre', (estudiante.nombre || '').toLowerCase());
    item.setAttribute('data-email', (estudiante.usuario || '').toLowerCase());

    item.innerHTML = `
        <div class="student-avatar">
            ${estudiante.fotoPerfil ? `<img src="${estudiante.fotoPerfil}" alt="${estudiante.nombre}">` : '<i class="bi bi-person-fill"></i>'}
        </div>
        <div class="student-info">
            <div class="student-name">${estudiante.nombre}</div>
            <div class="student-email">${estudiante.usuario}</div>
        </div>
    `;

    return item;
}

// Setup students search functionality
function setupStudentsSearch() {
    const searchInput = document.getElementById('studentsSearchInput');
    const clearBtn = document.getElementById('clearStudentsSearch');

    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        // Show/hide clear button
        if (clearBtn) {
            clearBtn.style.display = query ? 'flex' : 'none';
        }

        // Debounce search
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterStudents(query);
        }, 200);
    });

    // Clear search
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            filterStudents('');
            searchInput.focus();
        });
    }

    // Clear on Escape key
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchInput.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            filterStudents('');
        }
    });
}

// Filter students based on search query
function filterStudents(query) {
    const studentsContainer = document.getElementById('studentsContainer');
    if (!studentsContainer) return;

    const normalizedQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const studentItems = studentsContainer.querySelectorAll('.student-item');
    let visibleCount = 0;

    studentItems.forEach(item => {
        const nombre = (item.getAttribute('data-nombre') || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const email = (item.getAttribute('data-email') || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const matches = nombre.includes(normalizedQuery) || email.includes(normalizedQuery);

        if (matches || !normalizedQuery) {
            item.classList.remove('hidden-by-search');
            visibleCount++;
        } else {
            item.classList.add('hidden-by-search');
        }
    });

    // Update count info
    const countInfo = document.getElementById('studentsCountInfo');
    if (countInfo) {
        if (normalizedQuery) {
            countInfo.innerHTML = `<i class="bi bi-search"></i> ${visibleCount} resultado${visibleCount !== 1 ? 's' : ''} para "${query}"`;
        } else {
            countInfo.innerHTML = `<i class="bi bi-people-fill"></i> ${studentItems.length} estudiante${studentItems.length !== 1 ? 's' : ''}`;
        }
    }

    // Show no results message if needed
    const existingNoResults = studentsContainer.querySelector('.no-students-results');
    if (existingNoResults) existingNoResults.remove();

    if (visibleCount === 0 && normalizedQuery) {
        const noResults = document.createElement('div');
        noResults.className = 'no-students-results';
        noResults.innerHTML = `
            <i class="bi bi-search"></i>
            <p>No se encontraron estudiantes con "${query}"</p>
        `;
        studentsContainer.appendChild(noResults);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            // Si estamos dentro de una materia, volver a la selección de materias
            if (currentMateria) {
                backToMateriasSelection();
            } else {
                // Si estamos en la selección de materias, ir a Clases.html
                window.location.href = 'Clases.html';
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

    // Create post button
    const createPostBtn = document.getElementById('createPostBtn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            document.getElementById('createPostModal').classList.add('active');
        });
    }

    // Create task button
    const createTaskBtn = document.getElementById('createTaskBtn');
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', () => {
            document.getElementById('createTaskModal').classList.add('active');
        });
    }

    // Create material button
    const createMaterialBtn = document.getElementById('createMaterialBtn');
    if (createMaterialBtn) {
        createMaterialBtn.addEventListener('click', () => {
            loadTopicsIntoSelect('materialTopic');
            const modal = document.getElementById('createMaterialModal');
            // Aplicar color de la materia al modal
            if (window.currentMateriaColor) {
                modal.style.setProperty('--materia-color', window.currentMateriaColor);
            }
            modal.classList.add('active');
        });
    }

    // Create topic button
    const createTopicBtn = document.getElementById('createTopicBtn');
    if (createTopicBtn) {
        createTopicBtn.addEventListener('click', () => {
            openTopicModal();
        });
    }

    // Quick add topic button (in material modal)
    const quickAddTopicBtn = document.getElementById('quickAddTopicBtn');
    if (quickAddTopicBtn) {
        quickAddTopicBtn.addEventListener('click', () => {
            openTopicModal();
        });
    }

    // Materials search
    setupMaterialsSearch();

    // Close modals
    setupModalListeners();

    // Forms
    setupForms();
}

// Setup modal listeners
function setupModalListeners() {
    const modals = ['createPostModal', 'createTaskModal', 'createMaterialModal', 'submitTaskModal', 'viewSubmissionsModal', 'createTopicModal', 'editTopicModal'];

    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Setup forms
function setupForms() {
    // Image preview handler for posts
    const postImage = document.getElementById('postImage');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewImg = document.getElementById('imagePreviewImg');
    const removeImageBtn = document.getElementById('removeImageBtn');

    if (postImage) {
        postImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreviewImg.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeImageBtn) {
        removeImageBtn.addEventListener('click', () => {
            postImage.value = '';
            imagePreview.style.display = 'none';
            imagePreviewImg.src = '';
        });
    }

    // Image preview handler for tasks
    const taskImage = document.getElementById('taskImage');
    const taskImagePreview = document.getElementById('taskImagePreview');
    const taskImagePreviewImg = document.getElementById('taskImagePreviewImg');
    const removeTaskImageBtn = document.getElementById('removeTaskImageBtn');

    if (taskImage) {
        taskImage.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    taskImagePreviewImg.src = e.target.result;
                    taskImagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (removeTaskImageBtn) {
        removeTaskImageBtn.addEventListener('click', () => {
            taskImage.value = '';
            taskImagePreview.style.display = 'none';
            taskImagePreviewImg.src = '';
        });
    }

    // Video type change handler for posts
    const postVideoType = document.getElementById('postVideoType');
    const postVideoUrlGroup = document.getElementById('postVideoUrlGroup');
    const postVideoHelp = document.getElementById('postVideoHelp');
    const postVideoHelpText = document.getElementById('postVideoHelpText');

    if (postVideoType) {
        postVideoType.addEventListener('change', (e) => {
            const type = e.target.value;

            if (type === 'youtube') {
                postVideoUrlGroup.style.display = 'block';
                postVideoHelp.style.display = 'flex';
                postVideoHelpText.textContent = 'Pega el enlace de YouTube (ej: https://www.youtube.com/watch?v=VIDEO_ID)';
            } else if (type === 'drive') {
                postVideoUrlGroup.style.display = 'block';
                postVideoHelp.style.display = 'flex';
                postVideoHelpText.textContent = 'Pega el enlace de Google Drive. Asegúrate de que el archivo tenga permisos públicos';
            } else {
                postVideoUrlGroup.style.display = 'none';
                postVideoHelp.style.display = 'none';
            }
        });
    }

    // Video type change handler for tasks
    const taskVideoType = document.getElementById('taskVideoType');
    const taskVideoUrlGroup = document.getElementById('taskVideoUrlGroup');
    const taskVideoHelp = document.getElementById('taskVideoHelp');
    const taskVideoHelpText = document.getElementById('taskVideoHelpText');

    if (taskVideoType) {
        taskVideoType.addEventListener('change', (e) => {
            const type = e.target.value;

            if (type === 'youtube') {
                taskVideoUrlGroup.style.display = 'block';
                taskVideoHelp.style.display = 'flex';
                taskVideoHelpText.textContent = 'Pega el enlace de YouTube (ej: https://www.youtube.com/watch?v=VIDEO_ID)';
            } else if (type === 'drive') {
                taskVideoUrlGroup.style.display = 'block';
                taskVideoHelp.style.display = 'flex';
                taskVideoHelpText.textContent = 'Pega el enlace de Google Drive. Asegúrate de que el archivo tenga permisos públicos';
            } else {
                taskVideoUrlGroup.style.display = 'none';
                taskVideoHelp.style.display = 'none';
            }
        });
    }

    // Create post form
    document.getElementById('createPostForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await crearAnuncio();
    });

    // Create task form
    document.getElementById('createTaskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await crearTarea();
    });

    // Submit task form
    document.getElementById('submitTaskForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitTask();
    });

    // Edit forms
    document.getElementById('editPostForm').addEventListener('submit', actualizarAnuncio);
    document.getElementById('editTaskForm').addEventListener('submit', actualizarTarea);
    document.getElementById('editMaterialForm').addEventListener('submit', actualizarMaterial);

    // Topic forms
    document.getElementById('createTopicForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await crearTema();
    });

    document.getElementById('editTopicForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await guardarTema();
    });

    // Edit post video type change handler
    const editPostVideoType = document.getElementById('editPostVideoType');
    if (editPostVideoType) {
        editPostVideoType.addEventListener('change', (e) => {
            const type = e.target.value;
            const urlGroup = document.getElementById('editPostVideoUrlGroup');

            if (type === 'youtube' || type === 'drive') {
                urlGroup.style.display = 'block';
            } else {
                urlGroup.style.display = 'none';
            }
        });
    }

    // Create material form
    document.getElementById('createMaterialForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await crearMaterial();
    });

    // Material images upload handler
    window.currentMaterialVideos = [];

    const uploadMaterialImagesBtn = document.getElementById('uploadMaterialImagesBtn');
    const materialImages = document.getElementById('materialImages');
    const materialImagesPreview = document.getElementById('materialImagesPreview');

    if (uploadMaterialImagesBtn && materialImages) {
        uploadMaterialImagesBtn.addEventListener('click', () => {
            materialImages.click();
        });

        materialImages.addEventListener('change', (e) => {
            materialImagesPreview.innerHTML = '';
            const files = e.target.files;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="remove-preview-btn" onclick="removeMaterialImage(${i})">
                            <i class="bi bi-x"></i>
                        </button>
                    `;
                    materialImagesPreview.appendChild(previewItem);
                };

                reader.readAsDataURL(file);
            }
        });
    }

    // Material videos handler
    const addMaterialVideoBtn = document.getElementById('addMaterialVideoBtn');
    const materialVideoType = document.getElementById('materialVideoType');
    const materialVideoUrl = document.getElementById('materialVideoUrl');
    const materialVideosPreview = document.getElementById('materialVideosPreview');

    if (addMaterialVideoBtn) {
        addMaterialVideoBtn.addEventListener('click', () => {
            const tipo = materialVideoType.value;
            const url = materialVideoUrl.value;

            if (!tipo || !url) {
                showAlertModal('Error', 'Selecciona el tipo de video e ingresa la URL');
                return;
            }

            // Add to array
            window.currentMaterialVideos.push({ tipo, url });

            // Add to preview
            const previewItem = document.createElement('div');
            previewItem.className = 'video-preview-item';
            previewItem.innerHTML = `
                <i class="bi bi-${tipo === 'youtube' ? 'youtube' : 'google'}"></i>
                <span>${tipo === 'youtube' ? 'YouTube' : 'Drive'}: ${url.substring(0, 40)}...</span>
                <button type="button" class="remove-preview-btn" onclick="removeMaterialVideo(${window.currentMaterialVideos.length - 1})">
                    <i class="bi bi-x"></i>
                </button>
            `;
            materialVideosPreview.appendChild(previewItem);

            // Clear inputs
            materialVideoType.value = '';
            materialVideoUrl.value = '';
        });
    }

    // Edit material images upload handler
    const uploadEditMaterialImagesBtn = document.getElementById('uploadEditMaterialImagesBtn');
    const editMaterialNewImages = document.getElementById('editMaterialNewImages');
    const editMaterialNewImagesPreview = document.getElementById('editMaterialNewImagesPreview');

    if (uploadEditMaterialImagesBtn && editMaterialNewImages) {
        uploadEditMaterialImagesBtn.addEventListener('click', () => {
            editMaterialNewImages.click();
        });

        editMaterialNewImages.addEventListener('change', (e) => {
            editMaterialNewImagesPreview.innerHTML = '';
            const files = e.target.files;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="remove-preview-btn" onclick="removeEditMaterialNewImage(${i})">
                            <i class="bi bi-x"></i>
                        </button>
                    `;
                    editMaterialNewImagesPreview.appendChild(previewItem);
                };

                reader.readAsDataURL(file);
            }
        });
    }

    // Edit material videos handler
    const addEditMaterialVideoBtn = document.getElementById('addEditMaterialVideoBtn');
    const editMaterialVideoType = document.getElementById('editMaterialVideoType');
    const editMaterialVideoUrl = document.getElementById('editMaterialVideoUrl');
    const editMaterialNewVideosPreview = document.getElementById('editMaterialNewVideosPreview');

    if (addEditMaterialVideoBtn) {
        addEditMaterialVideoBtn.addEventListener('click', () => {
            const tipo = editMaterialVideoType.value;
            const url = editMaterialVideoUrl.value;

            if (!tipo || !url) {
                showAlertModal('Error', 'Selecciona el tipo de video e ingresa la URL');
                return;
            }

            // Initialize array if needed
            if (!window.editMaterialNewVideos) {
                window.editMaterialNewVideos = [];
            }

            // Add to array
            window.editMaterialNewVideos.push({ tipo, url });

            // Add to preview
            const previewItem = document.createElement('div');
            previewItem.className = 'video-preview-item';
            previewItem.innerHTML = `
                <i class="bi bi-${tipo === 'youtube' ? 'youtube' : 'google'}"></i>
                <span>${tipo === 'youtube' ? 'YouTube' : 'Drive'}: ${url.substring(0, 40)}...</span>
                <button type="button" class="remove-preview-btn" onclick="removeEditMaterialNewVideo(${window.editMaterialNewVideos.length - 1})">
                    <i class="bi bi-x"></i>
                </button>
            `;
            editMaterialNewVideosPreview.appendChild(previewItem);

            // Clear inputs
            editMaterialVideoType.value = '';
            editMaterialVideoUrl.value = '';
        });
    }

    // Material Drive Files handler (also supports Canva)
    window.currentMaterialDriveFiles = [];
    const addMaterialDriveFileBtn = document.getElementById('addMaterialDriveFileBtn');
    const materialDriveFileUrl = document.getElementById('materialDriveFileUrl');
    const materialDriveFilesPreview = document.getElementById('materialDriveFilesPreview');

    if (addMaterialDriveFileBtn) {
        addMaterialDriveFileBtn.addEventListener('click', () => {
            const url = materialDriveFileUrl.value.trim();

            if (!url) {
                showAlertModal('Error', 'Ingresa la URL del enlace');
                return;
            }

            // Validate URL format (accept any valid URL)
            if (!isValidUrl(url)) {
                showAlertModal('Error', 'Ingresa una URL válida');
                return;
            }

            // Detect file type from URL (supports Drive, Canva, and external links)
            const fileInfo = detectExternalLinkType(url);

            // Add to array
            window.currentMaterialDriveFiles.push({ url, ...fileInfo });

            // Add to preview
            renderDriveFilePreview(materialDriveFilesPreview, window.currentMaterialDriveFiles, 'removeMaterialDriveFile');

            // Clear input
            materialDriveFileUrl.value = '';
        });
    }

    // Edit Material Drive Files handler
    window.editMaterialNewDriveFiles = [];
    const addEditMaterialDriveFileBtn = document.getElementById('addEditMaterialDriveFileBtn');
    const editMaterialDriveFileUrl = document.getElementById('editMaterialDriveFileUrl');
    const editMaterialNewDriveFilesPreview = document.getElementById('editMaterialNewDriveFilesPreview');

    if (addEditMaterialDriveFileBtn) {
        addEditMaterialDriveFileBtn.addEventListener('click', () => {
            const url = editMaterialDriveFileUrl.value.trim();

            if (!url) {
                showAlertModal('Error', 'Ingresa la URL del enlace');
                return;
            }

            // Validate URL format (accept any valid URL)
            if (!isValidUrl(url)) {
                showAlertModal('Error', 'Ingresa una URL válida');
                return;
            }

            // Detect file type from URL (supports Drive, Canva, and external links)
            const fileInfo = detectExternalLinkType(url);

            // Add to array
            window.editMaterialNewDriveFiles.push({ url, ...fileInfo });

            // Add to preview
            renderDriveFilePreview(editMaterialNewDriveFilesPreview, window.editMaterialNewDriveFiles, 'removeEditMaterialNewDriveFile');

            // Clear input
            editMaterialDriveFileUrl.value = '';
        });
    }

    // Edit post image upload handler
    const uploadEditPostImageBtn = document.getElementById('uploadEditPostImageBtn');
    const editPostNewImage = document.getElementById('editPostNewImage');
    const editPostNewImagePreview = document.getElementById('editPostNewImagePreview');

    if (uploadEditPostImageBtn && editPostNewImage) {
        uploadEditPostImageBtn.addEventListener('click', () => {
            editPostNewImage.click();
        });

        editPostNewImage.addEventListener('change', (e) => {
            editPostNewImagePreview.innerHTML = '';
            const file = e.target.files[0];

            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="remove-preview-btn" onclick="clearEditPostNewImage()">
                            <i class="bi bi-x"></i>
                        </button>
                    `;
                    editPostNewImagePreview.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Edit task image upload handler
    const uploadEditTaskImageBtn = document.getElementById('uploadEditTaskImageBtn');
    const editTaskNewImage = document.getElementById('editTaskNewImage');
    const editTaskNewImagePreview = document.getElementById('editTaskNewImagePreview');

    if (uploadEditTaskImageBtn && editTaskNewImage) {
        uploadEditTaskImageBtn.addEventListener('click', () => {
            editTaskNewImage.click();
        });

        editTaskNewImage.addEventListener('change', (e) => {
            editTaskNewImagePreview.innerHTML = '';
            const file = e.target.files[0];

            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewItem = document.createElement('div');
                    previewItem.className = 'preview-item';
                    previewItem.innerHTML = `
                        <img src="${e.target.result}" alt="Preview">
                        <button type="button" class="remove-preview-btn" onclick="clearEditTaskNewImage()">
                            <i class="bi bi-x"></i>
                        </button>
                    `;
                    editTaskNewImagePreview.appendChild(previewItem);
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Remove new image from edit material preview
function removeEditMaterialNewImage(index) {
    const editMaterialNewImages = document.getElementById('editMaterialNewImages');
    const dt = new DataTransfer();
    const files = editMaterialNewImages.files;

    for (let i = 0; i < files.length; i++) {
        if (i !== index) {
            dt.items.add(files[i]);
        }
    }

    editMaterialNewImages.files = dt.files;

    // Trigger change event to update preview
    const event = new Event('change');
    editMaterialNewImages.dispatchEvent(event);
}

// Upload image to ImgBB
async function uploadImageToImgBB(file) {
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
            throw new Error('Error al subir imagen');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Crear anuncio
async function crearAnuncio() {
    const submitBtn = document.querySelector('#createPostForm .submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Publicando...';

        const db = window.firebaseDB;
        const titulo = document.getElementById('postTitle').value;
        const contenido = document.getElementById('postContent').value;
        const imageFile = document.getElementById('postImage').files[0];
        const videoType = document.getElementById('postVideoType').value;
        const videoUrl = document.getElementById('postVideoUrl').value;

        const anuncioData = {
            materia: currentMateria,
            aulaId: currentAulaId || null, // Agregar ID del aula
            titulo: titulo,
            contenido: contenido,
            autorId: currentUser.id,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Upload image if provided
        if (imageFile) {
            submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Subiendo imagen...';
            const imageUrl = await uploadImageToImgBB(imageFile);
            anuncioData.imagenUrl = imageUrl;
        }

        // Add video if provided
        if (videoType && videoUrl) {
            anuncioData.videoTipo = videoType;
            anuncioData.videoUrl = videoUrl;
        }

        await db.collection('anuncios').add(anuncioData);

        document.getElementById('createPostModal').classList.remove('active');
        document.getElementById('createPostForm').reset();
        document.getElementById('imagePreview').style.display = 'none';
        document.getElementById('postVideoUrlGroup').style.display = 'none';
        loadAnuncios();

    } catch (error) {
        console.error('Error al crear anuncio:', error);
        alert('Error al crear el anuncio: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Crear tarea
async function crearTarea() {
    const submitBtn = document.querySelector('#createTaskForm .submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Creando...';

        const db = window.firebaseDB;
        const titulo = document.getElementById('taskTitle').value;
        const descripcion = document.getElementById('taskDescription').value;
        const puntos = document.getElementById('taskPoints').value;
        const fechaEntrega = new Date(document.getElementById('taskDueDate').value);
        const imageFile = document.getElementById('taskImage').files[0];
        const videoType = document.getElementById('taskVideoType').value;
        const videoUrl = document.getElementById('taskVideoUrl').value;
        const driveUrl = document.getElementById('taskDriveUrl').value;

        const tareaData = {
            materia: currentMateria,
            aulaId: currentAulaId || null, // Agregar ID del aula
            titulo: titulo,
            descripcion: descripcion,
            fechaEntrega: firebase.firestore.Timestamp.fromDate(fechaEntrega),
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (puntos) {
            tareaData.puntos = parseInt(puntos);
        }

        // Upload image if provided
        if (imageFile) {
            submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Subiendo imagen...';
            const imageUrl = await uploadImageToImgBB(imageFile);
            tareaData.imagenUrl = imageUrl;
        }

        // Add video if provided
        if (videoType && videoUrl) {
            tareaData.videoTipo = videoType;
            tareaData.videoUrl = videoUrl;
        }

        // Add Drive URL if provided
        if (driveUrl) {
            tareaData.driveUrl = driveUrl;
        }

        await db.collection('tareas').add(tareaData);

        document.getElementById('createTaskModal').classList.remove('active');
        document.getElementById('createTaskForm').reset();
        document.getElementById('taskImagePreview').style.display = 'none';
        document.getElementById('taskVideoUrlGroup').style.display = 'none';
        loadTareas();

    } catch (error) {
        console.error('Error al crear tarea:', error);
        alert('Error al crear la tarea: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Open submit task modal
function openSubmitTaskModal(taskId, taskTitle) {
    document.getElementById('submitTaskId').value = taskId;
    document.getElementById('submitTaskModal').classList.add('active');
}

// Close submit task modal
function closeSubmitTaskModal() {
    document.getElementById('submitTaskModal').classList.remove('active');
    document.getElementById('submitTaskForm').reset();
}

// Submit task (student)
async function submitTask() {
    const submitBtn = document.querySelector('#submitTaskForm .submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Enviando...';

        const db = window.firebaseDB;
        const taskId = document.getElementById('submitTaskId').value;
        const comment = document.getElementById('submissionComment').value;
        const driveUrl = document.getElementById('submissionDriveUrl').value;

        await db.collection('entregas').add({
            tareaId: taskId,
            estudianteId: currentUser.id,
            estudianteNombre: currentUser.nombre,
            comentario: comment,
            driveUrl: driveUrl,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });

        closeSubmitTaskModal();
        loadTareas();
        showAlertModal('Éxito', '¡Tarea entregada exitosamente!');

    } catch (error) {
        console.error('Error al entregar tarea:', error);
        showAlertModal('Error', 'Error al entregar la tarea: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// View submissions (teacher)
async function viewSubmissions(taskId, taskTitle) {
    try {
        const db = window.firebaseDB;

        // Get task details to get max points
        const taskDoc = await db.collection('tareas').doc(taskId).get();
        const taskData = taskDoc.data();
        const maxPoints = taskData.puntos || 100;

        const submissionsSnapshot = await db.collection('entregas')
            .where('tareaId', '==', taskId)
            .get();

        const submissionsContainer = document.getElementById('submissionsContainer');

        if (submissionsSnapshot.empty) {
            submissionsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <p>No hay entregas aún</p>
                </div>
            `;
        } else {
            submissionsContainer.innerHTML = '<h4 style="margin-bottom: 1rem;">Entregas para: ' + taskTitle + '</h4>';

            submissionsSnapshot.forEach(doc => {
                const submission = doc.data();
                const submissionId = doc.id;
                const fecha = submission.fecha ? new Date(submission.fecha.seconds * 1000) : new Date();

                const submissionCard = document.createElement('div');
                submissionCard.className = 'submission-card';

                // Build grade section
                let gradeSection = '';
                if (submission.calificacion !== undefined) {
                    const percentage = (submission.calificacion / maxPoints) * 100;

                    // Determine grade class based on percentage
                    let gradeClass;
                    if (percentage >= 90) {
                        gradeClass = 'grade-excellent';
                    } else if (percentage >= 70) {
                        gradeClass = 'grade-good';
                    } else if (percentage >= 50) {
                        gradeClass = 'grade-regular';
                    } else {
                        gradeClass = 'grade-poor';
                    }

                    gradeSection = `
                        <div class="submission-grade">
                            <div class="current-grade ${gradeClass}">
                                <i class="bi bi-check-circle-fill"></i>
                                <span>Calificación: ${submission.calificacion} / ${maxPoints}</span>
                            </div>
                            <button class="grade-btn" onclick="editGrade('${submissionId}', ${submission.calificacion}, ${maxPoints})">
                                <i class="bi bi-pencil"></i>
                                Editar
                            </button>
                        </div>
                    `;
                } else {
                    gradeSection = `
                        <div class="submission-grade">
                            <label>Calificar:</label>
                            <div class="grade-input-group">
                                <input type="number" 
                                       class="grade-input" 
                                       id="grade-${submissionId}" 
                                       min="0" 
                                       max="${maxPoints}" 
                                       placeholder="0">
                                <span class="grade-max">/ ${maxPoints}</span>
                                <button class="grade-btn" onclick="saveGrade('${submissionId}', ${maxPoints})">
                                    Guardar
                                </button>
                            </div>
                        </div>
                    `;
                }

                submissionCard.innerHTML = `
                    <div class="submission-header">
                        <div class="submission-student">
                            <i class="bi bi-person-circle"></i>
                            <span>${submission.estudianteNombre}</span>
                        </div>
                        <div class="submission-date">
                            <i class="bi bi-clock"></i>
                            <span>${formatearFecha(fecha)}</span>
                        </div>
                    </div>
                    ${submission.comentario ? `<div class="submission-comment">${submission.comentario}</div>` : ''}
                    <div class="submission-link">
                        <a href="${submission.driveUrl}" target="_blank" class="drive-file-link">
                            <i class="bi bi-google"></i>
                            <span>Ver entrega en Drive</span>
                            <i class="bi bi-box-arrow-up-right"></i>
                        </a>
                    </div>
                    ${gradeSection}
                `;
                submissionsContainer.appendChild(submissionCard);
            });
        }

        document.getElementById('viewSubmissionsModal').classList.add('active');

    } catch (error) {
        console.error('Error al cargar entregas:', error);
        showAlertModal('Error', 'Error al cargar las entregas');
    }
}

// Save grade
async function saveGrade(submissionId, maxPoints) {
    try {
        const gradeInput = document.getElementById(`grade-${submissionId}`);
        const grade = parseFloat(gradeInput.value);

        if (isNaN(grade)) {
            showAlertModal('Error', 'Por favor ingresa una calificación válida');
            return;
        }

        if (grade < 0 || grade > maxPoints) {
            showAlertModal('Error', `La calificación debe estar entre 0 y ${maxPoints}`);
            return;
        }

        const db = window.firebaseDB;
        await db.collection('entregas').doc(submissionId).update({
            calificacion: grade,
            fechaCalificacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        showAlertModal('Éxito', 'Calificación guardada exitosamente');

        // Reload submissions to show updated grade
        const modal = document.getElementById('viewSubmissionsModal');
        const taskId = gradeInput.closest('.submission-card').dataset.taskId;
        closeSubmissionsModal();

        // Reload the current task's submissions
        loadTareas();

    } catch (error) {
        console.error('Error al guardar calificación:', error);
        showAlertModal('Error', 'Error al guardar la calificación');
    }
}

// Edit grade
async function editGrade(submissionId, currentGrade, maxPoints) {
    const newGrade = prompt(`Ingresa la nueva calificación (0-${maxPoints}):`, currentGrade);

    if (newGrade === null) return; // User cancelled

    const grade = parseFloat(newGrade);

    if (isNaN(grade)) {
        showAlertModal('Error', 'Por favor ingresa una calificación válida');
        return;
    }

    if (grade < 0 || grade > maxPoints) {
        showAlertModal('Error', `La calificación debe estar entre 0 y ${maxPoints}`);
        return;
    }

    try {
        const db = window.firebaseDB;
        await db.collection('entregas').doc(submissionId).update({
            calificacion: grade,
            fechaCalificacion: firebase.firestore.FieldValue.serverTimestamp()
        });

        showAlertModal('Éxito', 'Calificación actualizada exitosamente');
        closeSubmissionsModal();
        loadTareas();

    } catch (error) {
        console.error('Error al actualizar calificación:', error);
        showAlertModal('Error', 'Error al actualizar la calificación');
    }
}

// Close submissions modal
function closeSubmissionsModal() {
    document.getElementById('viewSubmissionsModal').classList.remove('active');
}

// ========== MODAL UTILITIES ==========

// Show confirmation modal
function showConfirmModal(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.add('active');

    const confirmBtn = document.getElementById('confirmBtn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', () => {
        closeConfirmModal();
        onConfirm();
    });
}

// Close confirmation modal
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

// Show alert modal
function showAlertModal(title, message) {
    document.getElementById('alertTitle').textContent = title;
    document.getElementById('alertMessage').textContent = message;
    document.getElementById('alertModal').classList.add('active');
}

// Close alert modal
function closeAlertModal() {
    document.getElementById('alertModal').classList.remove('active');
}

// ========== EDIT ANUNCIO ==========

// Global variable to track if media should be removed
let removePostImage = false;
let removePostVideo = false;

// Open edit post modal
async function editarAnuncio(id) {
    try {
        const db = window.firebaseDB;
        const doc = await db.collection('anuncios').doc(id).get();

        if (!doc.exists) {
            showAlertModal('Error', 'No se encontró el anuncio');
            return;
        }

        const data = doc.data();
        document.getElementById('editPostId').value = id;
        document.getElementById('editPostTitle').value = data.titulo || '';
        document.getElementById('editPostContent').value = data.contenido || '';

        // Store current data
        window.editPostCurrentImage = data.imagenUrl || null;
        window.editPostCurrentVideoType = data.videoTipo || null;
        window.editPostCurrentVideoUrl = data.videoUrl || null;

        // Display current image
        const currentImageContainer = document.getElementById('editPostCurrentImageContainer');
        currentImageContainer.innerHTML = '';

        if (window.editPostCurrentImage) {
            const imageItem = document.createElement('div');
            imageItem.className = 'current-media-item';
            imageItem.innerHTML = `
                <img src="${window.editPostCurrentImage}" alt="Imagen actual">
                <button type="button" class="remove-current-btn" onclick="removeEditPostCurrentImage()">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            `;
            currentImageContainer.appendChild(imageItem);
        } else {
            currentImageContainer.innerHTML = '<p class="no-media-text">No hay imagen</p>';
        }

        // Display current video
        const currentVideoContainer = document.getElementById('editPostCurrentVideoContainer');
        currentVideoContainer.innerHTML = '';

        if (window.editPostCurrentVideoType && window.editPostCurrentVideoUrl) {
            const videoItem = document.createElement('div');
            videoItem.className = 'current-media-item';
            videoItem.innerHTML = `
                <div class="video-info">
                    <i class="bi bi-${window.editPostCurrentVideoType === 'youtube' ? 'youtube' : 'google'}"></i>
                    <span>${window.editPostCurrentVideoType === 'youtube' ? 'YouTube' : 'Drive'}: ${window.editPostCurrentVideoUrl.substring(0, 50)}...</span>
                </div>
                <button type="button" class="remove-current-btn" onclick="removeEditPostCurrentVideo()">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            `;
            currentVideoContainer.appendChild(videoItem);
        } else {
            currentVideoContainer.innerHTML = '<p class="no-media-text">No hay video</p>';
        }

        // Clear new media previews
        document.getElementById('editPostNewImagePreview').innerHTML = '';
        document.getElementById('editPostVideoType').value = '';
        document.getElementById('editPostVideoUrl').value = '';

        document.getElementById('editPostModal').classList.add('active');
    } catch (error) {
        console.error('Error al cargar anuncio:', error);
        showAlertModal('Error', 'Error al cargar el anuncio');
    }
}

// Remove current post image
function removeEditPostCurrentImage() {
    window.editPostCurrentImage = null;
    const currentImageContainer = document.getElementById('editPostCurrentImageContainer');
    currentImageContainer.innerHTML = '<p class="no-media-text">No hay imagen</p>';
}

// Remove current post video
function removeEditPostCurrentVideo() {
    window.editPostCurrentVideoType = null;
    window.editPostCurrentVideoUrl = null;
    const currentVideoContainer = document.getElementById('editPostCurrentVideoContainer');
    currentVideoContainer.innerHTML = '<p class="no-media-text">No hay video</p>';
}

// Close edit post modal
function closeEditPostModal() {
    document.getElementById('editPostModal').classList.remove('active');
    document.getElementById('editPostForm').reset();
    window.editPostCurrentImage = null;
    window.editPostCurrentVideoType = null;
    window.editPostCurrentVideoUrl = null;
}

// Update post
async function actualizarAnuncio(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Guardando...';

        const db = window.firebaseDB;
        const id = document.getElementById('editPostId').value;
        const titulo = document.getElementById('editPostTitle').value;
        const contenido = document.getElementById('editPostContent').value;
        const newImageFile = document.getElementById('editPostNewImage').files[0];
        const newVideoType = document.getElementById('editPostVideoType').value;
        const newVideoUrl = document.getElementById('editPostVideoUrl').value;

        const updateData = {
            titulo: titulo,
            contenido: contenido
        };

        // Handle image
        let finalImageUrl = window.editPostCurrentImage;

        if (newImageFile) {
            // Upload new image
            submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Subiendo imagen...';
            const formData = new FormData();
            formData.append('image', newImageFile);
            const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                finalImageUrl = data.data.url;
            }
        }

        if (finalImageUrl) {
            updateData.imagenUrl = finalImageUrl;
        } else {
            updateData.imagenUrl = firebase.firestore.FieldValue.delete();
        }

        // Handle video
        let finalVideoType = window.editPostCurrentVideoType;
        let finalVideoUrl = window.editPostCurrentVideoUrl;

        if (newVideoType && newVideoUrl) {
            finalVideoType = newVideoType;
            finalVideoUrl = newVideoUrl;
        }

        if (finalVideoType && finalVideoUrl) {
            updateData.videoTipo = finalVideoType;
            updateData.videoUrl = finalVideoUrl;
        } else {
            updateData.videoTipo = firebase.firestore.FieldValue.delete();
            updateData.videoUrl = firebase.firestore.FieldValue.delete();
        }

        await db.collection('anuncios').doc(id).update(updateData);

        closeEditPostModal();
        showAlertModal('Éxito', 'Anuncio actualizado correctamente');
        loadAnuncios();

    } catch (error) {
        console.error('Error al actualizar anuncio:', error);
        showAlertModal('Error', 'Error al actualizar el anuncio');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ========== EDIT TAREA ==========

// Open edit task modal
async function editarTarea(id) {
    try {
        const db = window.firebaseDB;
        const doc = await db.collection('tareas').doc(id).get();

        if (!doc.exists) {
            showAlertModal('Error', 'No se encontró la tarea');
            return;
        }

        const data = doc.data();
        document.getElementById('editTaskId').value = id;
        document.getElementById('editTaskTitle').value = data.titulo || '';
        document.getElementById('editTaskDescription').value = data.descripcion || '';
        document.getElementById('editTaskPoints').value = data.puntos || '';
        document.getElementById('editTaskDriveUrl').value = data.driveUrl || '';

        if (data.fechaEntrega) {
            const fecha = new Date(data.fechaEntrega.seconds * 1000);
            const fechaLocal = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000);
            document.getElementById('editTaskDueDate').value = fechaLocal.toISOString().slice(0, 16);
        }

        // Store current data
        window.editTaskCurrentImage = data.imagenUrl || null;
        window.editTaskCurrentVideoType = data.videoTipo || null;
        window.editTaskCurrentVideoUrl = data.videoUrl || null;

        // Display current image
        const currentImageContainer = document.getElementById('editTaskCurrentImageContainer');
        currentImageContainer.innerHTML = '';

        if (window.editTaskCurrentImage) {
            const imageItem = document.createElement('div');
            imageItem.className = 'current-media-item';
            imageItem.innerHTML = `
                <img src="${window.editTaskCurrentImage}" alt="Imagen actual">
                <button type="button" class="remove-current-btn" onclick="removeEditTaskCurrentImage()">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            `;
            currentImageContainer.appendChild(imageItem);
        } else {
            currentImageContainer.innerHTML = '<p class="no-media-text">No hay imagen</p>';
        }

        // Display current video
        const currentVideoContainer = document.getElementById('editTaskCurrentVideoContainer');
        currentVideoContainer.innerHTML = '';

        if (window.editTaskCurrentVideoType && window.editTaskCurrentVideoUrl) {
            const videoItem = document.createElement('div');
            videoItem.className = 'current-media-item';
            videoItem.innerHTML = `
                <div class="video-info">
                    <i class="bi bi-${window.editTaskCurrentVideoType === 'youtube' ? 'youtube' : 'google'}"></i>
                    <span>${window.editTaskCurrentVideoType === 'youtube' ? 'YouTube' : 'Drive'}: ${window.editTaskCurrentVideoUrl.substring(0, 50)}...</span>
                </div>
                <button type="button" class="remove-current-btn" onclick="removeEditTaskCurrentVideo()">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            `;
            currentVideoContainer.appendChild(videoItem);
        } else {
            currentVideoContainer.innerHTML = '<p class="no-media-text">No hay video</p>';
        }

        // Clear new media previews
        document.getElementById('editTaskNewImagePreview').innerHTML = '';
        document.getElementById('editTaskVideoType').value = '';
        document.getElementById('editTaskVideoUrl').value = '';

        document.getElementById('editTaskModal').classList.add('active');
    } catch (error) {
        console.error('Error al cargar tarea:', error);
        showAlertModal('Error', 'Error al cargar la tarea');
    }
}

// Remove current task image
function removeEditTaskCurrentImage() {
    window.editTaskCurrentImage = null;
    const currentImageContainer = document.getElementById('editTaskCurrentImageContainer');
    currentImageContainer.innerHTML = '<p class="no-media-text">No hay imagen</p>';
}

// Remove current task video
function removeEditTaskCurrentVideo() {
    window.editTaskCurrentVideoType = null;
    window.editTaskCurrentVideoUrl = null;
    const currentVideoContainer = document.getElementById('editTaskCurrentVideoContainer');
    currentVideoContainer.innerHTML = '<p class="no-media-text">No hay video</p>';
}

// Close edit task modal
function closeEditTaskModal() {
    document.getElementById('editTaskModal').classList.remove('active');
    document.getElementById('editTaskForm').reset();
    window.editTaskCurrentImage = null;
    window.editTaskCurrentVideoType = null;
    window.editTaskCurrentVideoUrl = null;
}

// Update task
async function actualizarTarea(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Guardando...';

        const db = window.firebaseDB;
        const id = document.getElementById('editTaskId').value;
        const titulo = document.getElementById('editTaskTitle').value;
        const descripcion = document.getElementById('editTaskDescription').value;
        const puntos = document.getElementById('editTaskPoints').value;
        const fechaEntrega = new Date(document.getElementById('editTaskDueDate').value);
        const driveUrl = document.getElementById('editTaskDriveUrl').value;
        const newImageFile = document.getElementById('editTaskNewImage').files[0];
        const newVideoType = document.getElementById('editTaskVideoType').value;
        const newVideoUrl = document.getElementById('editTaskVideoUrl').value;

        const updateData = {
            titulo: titulo,
            descripcion: descripcion,
            fechaEntrega: firebase.firestore.Timestamp.fromDate(fechaEntrega)
        };

        if (puntos) {
            updateData.puntos = parseInt(puntos);
        }

        // Handle image
        let finalImageUrl = window.editTaskCurrentImage;

        if (newImageFile) {
            // Upload new image
            submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Subiendo imagen...';
            const formData = new FormData();
            formData.append('image', newImageFile);
            const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (data.success) {
                finalImageUrl = data.data.url;
            }
        }

        if (finalImageUrl) {
            updateData.imagenUrl = finalImageUrl;
        } else {
            updateData.imagenUrl = firebase.firestore.FieldValue.delete();
        }

        // Handle video
        let finalVideoType = window.editTaskCurrentVideoType;
        let finalVideoUrl = window.editTaskCurrentVideoUrl;

        if (newVideoType && newVideoUrl) {
            finalVideoType = newVideoType;
            finalVideoUrl = newVideoUrl;
        }

        if (finalVideoType && finalVideoUrl) {
            updateData.videoTipo = finalVideoType;
            updateData.videoUrl = finalVideoUrl;
        } else {
            updateData.videoTipo = firebase.firestore.FieldValue.delete();
            updateData.videoUrl = firebase.firestore.FieldValue.delete();
        }

        // Handle Drive URL
        if (driveUrl) {
            updateData.driveUrl = driveUrl;
        } else {
            updateData.driveUrl = firebase.firestore.FieldValue.delete();
        }

        await db.collection('tareas').doc(id).update(updateData);

        closeEditTaskModal();
        showAlertModal('Éxito', 'Tarea actualizada correctamente');
        loadTareas();

    } catch (error) {
        console.error('Error al actualizar tarea:', error);
        showAlertModal('Error', 'Error al actualizar la tarea');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// ========== EDIT MATERIAL ==========

// Open edit material modal
async function editarMaterial(id) {
    try {
        const db = window.firebaseDB;
        const doc = await db.collection('materiales').doc(id).get();

        if (!doc.exists) {
            showAlertModal('Error', 'No se encontró el material');
            return;
        }

        const data = doc.data();
        document.getElementById('editMaterialId').value = id;
        document.getElementById('editMaterialTitle').value = data.titulo || '';
        document.getElementById('editMaterialDescription').value = data.descripcion || '';

        // Load topics and select current one
        await loadTopicsIntoSelect('editMaterialTopic', data.temaId || null);

        // Store current data
        window.editMaterialCurrentImages = data.imageUrls || [];
        window.editMaterialCurrentVideos = data.videos || [];
        window.editMaterialCurrentDriveFiles = data.driveFiles || [];
        window.editMaterialNewVideos = [];
        window.editMaterialNewDriveFiles = [];

        // Display current images
        const currentImagesContainer = document.getElementById('editMaterialCurrentImages');
        currentImagesContainer.innerHTML = '';

        if (window.editMaterialCurrentImages.length > 0) {
            window.editMaterialCurrentImages.forEach((imageUrl, index) => {
                const imageItem = document.createElement('div');
                imageItem.className = 'current-media-item';
                imageItem.innerHTML = `
                    <img src="${imageUrl}" alt="Imagen ${index + 1}">
                    <button type="button" class="remove-current-btn" onclick="removeEditMaterialCurrentImage(${index})">
                        <i class="bi bi-trash"></i>
                        Eliminar
                    </button>
                `;
                currentImagesContainer.appendChild(imageItem);
            });
        } else {
            currentImagesContainer.innerHTML = '<p class="no-media-text">No hay imágenes</p>';
        }

        // Display current videos
        const currentVideosContainer = document.getElementById('editMaterialCurrentVideos');
        currentVideosContainer.innerHTML = '';

        if (window.editMaterialCurrentVideos.length > 0) {
            window.editMaterialCurrentVideos.forEach((video, index) => {
                const videoItem = document.createElement('div');
                videoItem.className = 'current-media-item';
                videoItem.innerHTML = `
                    <div class="video-info">
                        <i class="bi bi-${video.tipo === 'youtube' ? 'youtube' : 'google'}"></i>
                        <span>${video.tipo === 'youtube' ? 'YouTube' : 'Drive'}: ${video.url.substring(0, 50)}...</span>
                    </div>
                    <button type="button" class="remove-current-btn" onclick="removeEditMaterialCurrentVideo(${index})">
                        <i class="bi bi-trash"></i>
                        Eliminar
                    </button>
                `;
                currentVideosContainer.appendChild(videoItem);
            });
        } else {
            currentVideosContainer.innerHTML = '<p class="no-media-text">No hay videos</p>';
        }

        // Display current drive files
        const currentDriveFilesContainer = document.getElementById('editMaterialCurrentDriveFiles');
        currentDriveFilesContainer.innerHTML = '';

        if (window.editMaterialCurrentDriveFiles.length > 0) {
            renderCurrentDriveFiles(currentDriveFilesContainer, window.editMaterialCurrentDriveFiles, 'removeEditMaterialCurrentDriveFile');
        } else {
            currentDriveFilesContainer.innerHTML = '<p class="no-media-text">No hay archivos de Drive / Canva</p>';
        }

        // Clear new media previews
        document.getElementById('editMaterialNewImagesPreview').innerHTML = '';
        document.getElementById('editMaterialNewVideosPreview').innerHTML = '';
        document.getElementById('editMaterialNewDriveFilesPreview').innerHTML = '';

        document.getElementById('editMaterialModal').classList.add('active');
    } catch (error) {
        console.error('Error al cargar material:', error);
        showAlertModal('Error', 'Error al cargar el material');
    }
}

// Close edit material modal
function closeEditMaterialModal() {
    document.getElementById('editMaterialModal').classList.remove('active');
    document.getElementById('editMaterialForm').reset();
    window.editMaterialCurrentImages = [];
    window.editMaterialCurrentVideos = [];
    window.editMaterialCurrentDriveFiles = [];
    window.editMaterialNewVideos = [];
    window.editMaterialNewDriveFiles = [];
}

// Update material
async function actualizarMaterial(e) {
    e.preventDefault();
    const submitBtn = e.target.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Guardando...';

        const db = window.firebaseDB;
        const id = document.getElementById('editMaterialId').value;
        const temaId = document.getElementById('editMaterialTopic').value;
        const titulo = document.getElementById('editMaterialTitle').value;
        const descripcion = document.getElementById('editMaterialDescription').value;

        if (!temaId) {
            showAlertModal('Error', 'Debes seleccionar un tema');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        // Upload new images
        const newImageUrls = [];
        const newImageFiles = document.getElementById('editMaterialNewImages').files;

        if (newImageFiles.length > 0) {
            for (let i = 0; i < newImageFiles.length; i++) {
                const file = newImageFiles[i];
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.success) {
                    newImageUrls.push(data.data.url);
                }
            }
        }

        // Combine current and new images
        const allImageUrls = [...window.editMaterialCurrentImages, ...newImageUrls];

        // Combine current and new videos
        const allVideos = [...window.editMaterialCurrentVideos, ...window.editMaterialNewVideos];

        // Combine current and new drive files
        const allDriveFiles = [...(window.editMaterialCurrentDriveFiles || []), ...(window.editMaterialNewDriveFiles || [])];

        await db.collection('materiales').doc(id).update({
            temaId: temaId,
            titulo: titulo,
            descripcion: descripcion,
            imageUrls: allImageUrls,
            videos: allVideos,
            driveFiles: allDriveFiles
        });

        closeEditMaterialModal();
        showAlertModal('Éxito', 'Material actualizado correctamente');
        loadMateriales();

    } catch (error) {
        console.error('Error al actualizar material:', error);
        showAlertModal('Error', 'Error al actualizar el material');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
}

// Crear material
async function crearMaterial() {
    try {
        const submitBtn = document.querySelector('#createMaterialForm .submit-btn');
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Creando...';

        const db = window.firebaseDB;
        const temaId = document.getElementById('materialTopic').value;
        const titulo = document.getElementById('materialTitle').value;
        const descripcion = document.getElementById('materialDescription').value;

        if (!temaId) {
            showAlertModal('Error', 'Debes seleccionar un tema');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
            return;
        }

        // Upload images
        const imageUrls = [];
        const imageFiles = document.getElementById('materialImages').files;

        if (imageFiles.length > 0) {
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const formData = new FormData();
                formData.append('image', file);

                const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                if (data.success) {
                    imageUrls.push(data.data.url);
                }
            }
        }

        // Get videos
        const videos = window.currentMaterialVideos || [];

        // Get drive files
        const driveFiles = window.currentMaterialDriveFiles || [];

        await db.collection('materiales').add({
            materia: currentMateria,
            aulaId: currentAulaId || null,
            temaId: temaId,
            titulo: titulo,
            descripcion: descripcion,
            imageUrls: imageUrls,
            videos: videos,
            driveFiles: driveFiles,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('createMaterialModal').classList.remove('active');
        document.getElementById('createMaterialForm').reset();
        document.getElementById('materialImagesPreview').innerHTML = '';
        document.getElementById('materialVideosPreview').innerHTML = '';
        document.getElementById('materialDriveFilesPreview').innerHTML = '';
        window.currentMaterialVideos = [];
        window.currentMaterialDriveFiles = [];

        showAlertModal('Éxito', 'Material creado correctamente');
        loadMateriales();

    } catch (error) {
        console.error('Error al crear material:', error);
        showAlertModal('Error', 'Error al crear el material');
    } finally {
        const submitBtn = document.querySelector('#createMaterialForm .submit-btn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-lg"></i> Agregar Material';
    }
}

// Eliminar anuncio
function eliminarAnuncio(id) {
    showConfirmModal(
        'Eliminar Anuncio',
        '¿Estás seguro de que deseas eliminar este anuncio? Esta acción no se puede deshacer.',
        async () => {
            try {
                const db = window.firebaseDB;
                await db.collection('anuncios').doc(id).delete();
                showAlertModal('Éxito', 'Anuncio eliminado correctamente');
                loadAnuncios();
            } catch (error) {
                console.error('Error al eliminar anuncio:', error);
                showAlertModal('Error', 'Error al eliminar el anuncio');
            }
        }
    );
}

// Eliminar tarea
function eliminarTarea(id) {
    showConfirmModal(
        'Eliminar Tarea',
        '¿Estás seguro de que deseas eliminar esta tarea? Se eliminarán también todas las entregas asociadas.',
        async () => {
            try {
                const db = window.firebaseDB;
                await db.collection('tareas').doc(id).delete();

                // Delete associated submissions
                const submissions = await db.collection('entregas').where('tareaId', '==', id).get();
                const batch = db.batch();
                submissions.forEach(doc => batch.delete(doc.ref));
                await batch.commit();

                showAlertModal('Éxito', 'Tarea eliminada correctamente');
                loadTareas();
            } catch (error) {
                console.error('Error al eliminar tarea:', error);
                showAlertModal('Error', 'Error al eliminar la tarea');
            }
        }
    );
}

// Eliminar material
function eliminarMaterial(id) {
    showConfirmModal(
        'Eliminar Material',
        '¿Estás seguro de que deseas eliminar este material? Esta acción no se puede deshacer.',
        async () => {
            try {
                const db = window.firebaseDB;
                await db.collection('materiales').doc(id).delete();
                showAlertModal('Éxito', 'Material eliminado correctamente');
                loadMateriales();
            } catch (error) {
                console.error('Error al eliminar material:', error);
                showAlertModal('Error', 'Error al eliminar el material');
            }
        }
    );
}

// Remove material image from preview
function removeMaterialImage(index) {
    const materialImages = document.getElementById('materialImages');
    const dt = new DataTransfer();
    const files = materialImages.files;

    for (let i = 0; i < files.length; i++) {
        if (i !== index) {
            dt.items.add(files[i]);
        }
    }

    materialImages.files = dt.files;

    // Trigger change event to update preview
    const event = new Event('change');
    materialImages.dispatchEvent(event);
}

// Remove material video from preview
function removeMaterialVideo(index) {
    window.currentMaterialVideos.splice(index, 1);

    // Rebuild preview
    const materialVideosPreview = document.getElementById('materialVideosPreview');
    materialVideosPreview.innerHTML = '';

    window.currentMaterialVideos.forEach((video, i) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'video-preview-item';
        previewItem.innerHTML = `
            <i class="bi bi-${video.tipo === 'youtube' ? 'youtube' : 'google'}"></i>
            <span>${video.tipo === 'youtube' ? 'YouTube' : 'Drive'}: ${video.url.substring(0, 40)}...</span>
            <button type="button" class="remove-preview-btn" onclick="removeMaterialVideo(${i})">
                <i class="bi bi-x"></i>
            </button>
        `;
        materialVideosPreview.appendChild(previewItem);
    });
}

// Remove current image from edit material
function removeEditMaterialCurrentImage(index) {
    window.editMaterialCurrentImages.splice(index, 1);

    // Rebuild display
    const currentImagesContainer = document.getElementById('editMaterialCurrentImages');
    currentImagesContainer.innerHTML = '';

    if (window.editMaterialCurrentImages.length > 0) {
        window.editMaterialCurrentImages.forEach((imageUrl, i) => {
            const imageItem = document.createElement('div');
            imageItem.className = 'current-media-item';
            imageItem.innerHTML = `
                <img src="${imageUrl}" alt="Imagen ${i + 1}">
                <button type="button" class="remove-current-btn" onclick="removeEditMaterialCurrentImage(${i})">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            `;
            currentImagesContainer.appendChild(imageItem);
        });
    } else {
        currentImagesContainer.innerHTML = '<p class="no-media-text">No hay imágenes</p>';
    }
}

// Remove current video from edit material
function removeEditMaterialCurrentVideo(index) {
    window.editMaterialCurrentVideos.splice(index, 1);

    // Rebuild display
    const currentVideosContainer = document.getElementById('editMaterialCurrentVideos');
    currentVideosContainer.innerHTML = '';

    if (window.editMaterialCurrentVideos.length > 0) {
        window.editMaterialCurrentVideos.forEach((video, i) => {
            const videoItem = document.createElement('div');
            videoItem.className = 'current-media-item';
            videoItem.innerHTML = `
                <div class="video-info">
                    <i class="bi bi-${video.tipo === 'youtube' ? 'youtube' : 'google'}"></i>
                    <span>${video.tipo === 'youtube' ? 'YouTube' : 'Drive'}: ${video.url.substring(0, 50)}...</span>
                </div>
                <button type="button" class="remove-current-btn" onclick="removeEditMaterialCurrentVideo(${i})">
                    <i class="bi bi-trash"></i>
                    Eliminar
                </button>
            `;
            currentVideosContainer.appendChild(videoItem);
        });
    } else {
        currentVideosContainer.innerHTML = '<p class="no-media-text">No hay videos</p>';
    }
}

// Remove new video from edit material
function removeEditMaterialNewVideo(index) {
    window.editMaterialNewVideos.splice(index, 1);

    // Rebuild preview
    const newVideosPreview = document.getElementById('editMaterialNewVideosPreview');
    newVideosPreview.innerHTML = '';

    window.editMaterialNewVideos.forEach((video, i) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'video-preview-item';
        previewItem.innerHTML = `
            <i class="bi bi-${video.tipo === 'youtube' ? 'youtube' : 'google'}"></i>
            <span>${video.tipo === 'youtube' ? 'YouTube' : 'Drive'}: ${video.url.substring(0, 40)}...</span>
            <button type="button" class="remove-preview-btn" onclick="removeEditMaterialNewVideo(${i})">
                <i class="bi bi-x"></i>
            </button>
        `;
        newVideosPreview.appendChild(previewItem);
    });
}

// Detect Drive file type from URL (also supports Canva)
function detectDriveFileType(url) {
    const fileId = extractDriveFileId(url);
    let tipo = 'default';
    let nombre = 'Archivo de Drive';
    let icono = 'bi-file-earmark';

    // Check if it's a Canva URL
    if (url.includes('canva.com')) {
        const canvaInfo = extractCanvaInfo(url);
        return {
            tipo: 'canva',
            nombre: canvaInfo.nombre || 'Diseño de Canva',
            icono: 'bi-palette',
            fileId: canvaInfo.id,
            canvaUrl: url,
            canvaEmbedUrl: canvaInfo.embedUrl
        };
    }

    // Try to detect type from URL patterns
    if (url.includes('/document/') || url.includes('document/d/')) {
        tipo = 'doc';
        nombre = 'Documento de Google';
        icono = 'bi-file-earmark-word';
    } else if (url.includes('/spreadsheets/') || url.includes('spreadsheets/d/')) {
        tipo = 'sheet';
        nombre = 'Hoja de cálculo';
        icono = 'bi-file-earmark-excel';
    } else if (url.includes('/presentation/') || url.includes('presentation/d/')) {
        tipo = 'slide';
        nombre = 'Presentación';
        icono = 'bi-file-earmark-slides';
    } else if (url.includes('/file/d/') || url.includes('uc?id=')) {
        // Could be PDF or other file
        tipo = 'pdf';
        nombre = 'Archivo PDF';
        icono = 'bi-file-earmark-pdf';
    } else if (url.includes('/folders/') || url.includes('folders/')) {
        tipo = 'folder';
        nombre = 'Carpeta de Drive';
        icono = 'bi-folder';
    }

    return { tipo, nombre, icono, fileId };
}

// Extract Canva info from URL
function extractCanvaInfo(url) {
    let id = null;
    let nombre = 'Diseño de Canva';
    let embedUrl = null;

    // Patterns for different Canva URL formats
    // https://www.canva.com/design/DESIGN_ID/view
    // https://www.canva.com/design/DESIGN_ID/SHARE_CODE/view
    // https://www.canva.com/design/DESIGN_ID/edit
    const designPattern = /canva\.com\/design\/([^\/]+)/;
    const match = url.match(designPattern);

    if (match && match[1]) {
        id = match[1];
        // Create embed URL for Canva
        // Canva embed format: https://www.canva.com/design/DESIGN_ID/view?embed
        embedUrl = `https://www.canva.com/design/${id}/view?embed`;
    }

    // Try to detect type from URL
    if (url.includes('/presentation/') || url.includes('presentacion')) {
        nombre = 'Presentación de Canva';
    } else if (url.includes('/infographic/') || url.includes('infografia')) {
        nombre = 'Infografía de Canva';
    } else if (url.includes('/poster/') || url.includes('cartel')) {
        nombre = 'Póster de Canva';
    } else if (url.includes('/document/') || url.includes('documento')) {
        nombre = 'Documento de Canva';
    } else if (url.includes('/whiteboard/') || url.includes('pizarra')) {
        nombre = 'Pizarra de Canva';
    } else if (url.includes('/video/')) {
        nombre = 'Video de Canva';
    }

    return { id, nombre, embedUrl };
}

// Get color for file type
function getFileTypeColor(tipo) {
    const colors = {
        'pdf': '#d32f2f',
        'doc': '#1976d2',
        'sheet': '#388e3c',
        'slide': '#f57c00',
        'folder': '#ffc107',
        'canva': '#00c4cc',
        'github': '#24292e',
        'gitlab': '#fc6d26',
        'bitbucket': '#0052cc',
        'notion': '#000000',
        'figma': '#f24e1e',
        'miro': '#ffd02f',
        'trello': '#0079bf',
        'youtube': '#ff0000',
        'vimeo': '#1ab7ea',
        'external': '#667eea',
        'default': '#757575'
    };
    return colors[tipo] || colors['default'];
}

// Validate URL format
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Detect external link type (supports Drive, Canva, GitHub, and any external URL)
function detectExternalLinkType(url) {
    // First check if it's a Drive URL
    if (url.includes('drive.google.com')) {
        return detectDriveFileType(url);
    }
    
    // Check if it's a Canva URL
    if (url.includes('canva.com')) {
        return detectDriveFileType(url);
    }
    
    // Check for GitHub
    if (url.includes('github.com')) {
        return {
            tipo: 'github',
            nombre: extractGitHubInfo(url),
            icono: 'bi-github',
            isExternal: true
        };
    }
    
    // Check for GitLab
    if (url.includes('gitlab.com')) {
        return {
            tipo: 'gitlab',
            nombre: 'Repositorio GitLab',
            icono: 'bi-git',
            isExternal: true
        };
    }
    
    // Check for Bitbucket
    if (url.includes('bitbucket.org')) {
        return {
            tipo: 'bitbucket',
            nombre: 'Repositorio Bitbucket',
            icono: 'bi-git',
            isExternal: true
        };
    }
    
    // Check for Notion
    if (url.includes('notion.so') || url.includes('notion.site')) {
        return {
            tipo: 'notion',
            nombre: 'Página de Notion',
            icono: 'bi-journal-text',
            isExternal: true
        };
    }
    
    // Check for Figma
    if (url.includes('figma.com')) {
        return {
            tipo: 'figma',
            nombre: 'Diseño de Figma',
            icono: 'bi-vector-pen',
            isExternal: true
        };
    }
    
    // Check for Miro
    if (url.includes('miro.com')) {
        return {
            tipo: 'miro',
            nombre: 'Tablero de Miro',
            icono: 'bi-easel',
            isExternal: true
        };
    }
    
    // Check for Trello
    if (url.includes('trello.com')) {
        return {
            tipo: 'trello',
            nombre: 'Tablero de Trello',
            icono: 'bi-kanban',
            isExternal: true
        };
    }
    
    // Check for YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return {
            tipo: 'youtube',
            nombre: 'Video de YouTube',
            icono: 'bi-youtube',
            isExternal: true
        };
    }
    
    // Check for Vimeo
    if (url.includes('vimeo.com')) {
        return {
            tipo: 'vimeo',
            nombre: 'Video de Vimeo',
            icono: 'bi-play-circle',
            isExternal: true
        };
    }
    
    // Generic external link
    const domain = extractDomain(url);
    return {
        tipo: 'external',
        nombre: `Enlace externo (${domain})`,
        icono: 'bi-link-45deg',
        isExternal: true
    };
}

// Extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    } catch (_) {
        return 'enlace';
    }
}

// Extract GitHub info from URL
function extractGitHubInfo(url) {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        
        if (pathParts.length >= 2) {
            const user = pathParts[0];
            const repo = pathParts[1];
            return `GitHub: ${user}/${repo}`;
        }
        return 'Repositorio GitHub';
    } catch (_) {
        return 'Repositorio GitHub';
    }
}

// Render Drive file preview
function renderDriveFilePreview(container, files, removeFunction) {
    container.innerHTML = '';

    files.forEach((file, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'drive-file-preview-item';
        previewItem.innerHTML = `
            <div class="drive-file-icon ${file.tipo}">
                <i class="bi ${file.icono}"></i>
            </div>
            <div class="drive-file-info">
                <div class="drive-file-name">${file.nombre}</div>
                <div class="drive-file-type">${file.url.substring(0, 50)}...</div>
            </div>
            <div class="drive-file-actions">
                <button type="button" class="drive-file-remove-btn" onclick="${removeFunction}(${index})" title="Eliminar">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
        container.appendChild(previewItem);
    });
}

// Remove material drive file
function removeMaterialDriveFile(index) {
    window.currentMaterialDriveFiles.splice(index, 1);
    const container = document.getElementById('materialDriveFilesPreview');
    renderDriveFilePreview(container, window.currentMaterialDriveFiles, 'removeMaterialDriveFile');
}

// Remove edit material new drive file
function removeEditMaterialNewDriveFile(index) {
    window.editMaterialNewDriveFiles.splice(index, 1);
    const container = document.getElementById('editMaterialNewDriveFilesPreview');
    renderDriveFilePreview(container, window.editMaterialNewDriveFiles, 'removeEditMaterialNewDriveFile');
}

// Remove edit material current drive file
function removeEditMaterialCurrentDriveFile(index) {
    window.editMaterialCurrentDriveFiles.splice(index, 1);
    const container = document.getElementById('editMaterialCurrentDriveFiles');

    if (window.editMaterialCurrentDriveFiles.length > 0) {
        renderCurrentDriveFiles(container, window.editMaterialCurrentDriveFiles, 'removeEditMaterialCurrentDriveFile');
    } else {
        container.innerHTML = '<p class="no-media-text">No hay archivos de Drive / Canva</p>';
    }
}

// Render current drive files for edit modal
function renderCurrentDriveFiles(container, files, removeFunction) {
    container.innerHTML = '';

    files.forEach((file, index) => {
        const fileInfo = typeof file === 'string' ? detectExternalLinkType(file) : (file.tipo ? file : detectExternalLinkType(file.url));
        const url = typeof file === 'string' ? file : file.url;

        const fileItem = document.createElement('div');
        fileItem.className = 'drive-file-preview-item';
        fileItem.innerHTML = `
            <div class="drive-file-icon ${fileInfo.tipo}">
                <i class="bi ${fileInfo.icono}"></i>
            </div>
            <div class="drive-file-info">
                <div class="drive-file-name">${fileInfo.nombre}</div>
                <div class="drive-file-type">${url.substring(0, 50)}...</div>
            </div>
            <div class="drive-file-actions">
                <button type="button" class="drive-file-remove-btn" onclick="${removeFunction}(${index})" title="Eliminar">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
        container.appendChild(fileItem);
    });
}

// Clear edit post new image
function clearEditPostNewImage() {
    document.getElementById('editPostNewImage').value = '';
    document.getElementById('editPostNewImagePreview').innerHTML = '';
}

// Clear edit task new image
function clearEditTaskNewImage() {
    document.getElementById('editTaskNewImage').value = '';
    document.getElementById('editTaskNewImagePreview').innerHTML = '';
}

// Formatear fecha
function formatearFecha(fecha) {
    const opciones = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return fecha.toLocaleDateString('es-ES', opciones);
}

// Open media modal
function openMediaModal(src, type) {
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('mediaModalContent');

    if (type === 'image') {
        modalContent.innerHTML = `
            <img src="${src}" alt="Imagen" style="max-width: 100%; max-height: 90vh; border-radius: 8px;">
        `;
    } else if (type === 'youtube') {
        modalContent.innerHTML = `
            <div class="video-container-fullscreen">
                <iframe 
                    src="https://www.youtube.com/embed/${src}?autoplay=1" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                </iframe>
            </div>
        `;
    } else if (type === 'drive') {
        modalContent.innerHTML = `
            <div class="drive-container-fullscreen">
                <iframe 
                    src="https://drive.google.com/file/d/${src}/preview" 
                    frameborder="0" 
                    allow="autoplay">
                </iframe>
            </div>
        `;
    }

    modal.classList.add('active');
}

// Close media modal
function closeMediaModal() {
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('mediaModalContent');
    modal.classList.remove('active');
    modalContent.innerHTML = '';
}

// Open Drive file modal for full preview
function openDriveFileModal(embedUrl, originalUrl, fileName, fileType) {
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('mediaModalContent');

    modalContent.innerHTML = `
        <div class="drive-file-fullscreen">
            <div class="drive-file-fullscreen-header">
                <div class="drive-file-fullscreen-info">
                    <i class="bi ${getFileTypeIcon(fileType)}" style="color: ${getFileTypeColor(fileType)}"></i>
                    <span>${fileName}</span>
                </div>
            </div>
            <div class="drive-file-fullscreen-content">
                <iframe 
                    src="${embedUrl}" 
                    frameborder="0"
                    allowfullscreen>
                </iframe>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Get file type icon
function getFileTypeIcon(tipo) {
    const icons = {
        'pdf': 'bi-file-earmark-pdf',
        'doc': 'bi-file-earmark-word',
        'sheet': 'bi-file-earmark-excel',
        'slide': 'bi-file-earmark-slides',
        'folder': 'bi-folder',
        'canva': 'bi-palette',
        'default': 'bi-file-earmark'
    };
    return icons[tipo] || icons['default'];
}

// Open Canva modal - shows preview card with link (Canva doesn't allow iframe embedding)
function openCanvaModal(embedUrl, originalUrl, fileName) {
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('mediaModalContent');

    modalContent.innerHTML = `
        <div class="canva-fullscreen canva-preview-mode">
            <div class="canva-preview-card">
                <div class="canva-preview-icon">
                    <i class="bi bi-palette"></i>
                </div>
                <div class="canva-preview-info">
                    <h3 class="canva-preview-title">${fileName}</h3>
                    <p class="canva-preview-description">Este diseño está alojado en Canva. Haz clic en el botón para verlo.</p>
                </div>
                <a href="${originalUrl}" target="_blank" class="canva-preview-btn">
                    <i class="bi bi-box-arrow-up-right"></i>
                    Abrir en Canva
                </a>
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Hide Canva loading indicator
function hideCanvaLoading() {
    const loading = document.querySelector('.canva-loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

// Open external link in new tab
function openExternalLink(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
}

// Truncate URL for display
function truncateUrl(url, maxLength) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
}




// Highlight topic title
function highlightTopicTitle(topic, query) {
    const titleEl = topic.querySelector('.topic-title');
    const descEl = topic.querySelector('.topic-description');

    if (titleEl) {
        titleEl.innerHTML = highlightMatches(titleEl.textContent, query);
    }
    if (descEl) {
        descEl.innerHTML = highlightMatches(descEl.textContent, query);
    }
}

// Remove highlight from topic title
function removeTopicHighlight(topic) {
    const titleEl = topic.querySelector('.topic-title');
    const descEl = topic.querySelector('.topic-description');

    if (titleEl) {
        titleEl.innerHTML = titleEl.textContent;
    }
    if (descEl) {
        descEl.innerHTML = descEl.textContent;
    }
}


// ==========================================
// DRAG AND DROP PARA MATERIALES
// ==========================================

// Inicializar drag and drop para materiales
function initMaterialsDragAndDrop() {
    const materialsContainers = document.querySelectorAll('.topic-materials');

    materialsContainers.forEach(container => {
        const cards = container.querySelectorAll('.material-card');

        cards.forEach(card => {
            // Drag start
            card.addEventListener('dragstart', handleMaterialDragStart);

            // Drag end
            card.addEventListener('dragend', handleMaterialDragEnd);

            // Drag over
            card.addEventListener('dragover', handleMaterialDragOver);

            // Drag leave
            card.addEventListener('dragleave', handleMaterialDragLeave);

            // Drop
            card.addEventListener('drop', handleMaterialDrop);
        });

        // También permitir drop en el contenedor vacío
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        });

        container.addEventListener('drop', handleContainerDrop);
    });
}

let draggedMaterialCard = null;

function handleMaterialDragStart(e) {
    draggedMaterialCard = this;
    this.classList.add('material-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.getAttribute('data-material-id'));

    // Pequeño delay para que se vea el efecto
    setTimeout(() => {
        this.style.opacity = '0.5';
    }, 0);
}

function handleMaterialDragEnd(e) {
    this.classList.remove('material-dragging');
    this.style.opacity = '1';
    draggedMaterialCard = null;

    // Remover clases de todos los cards
    document.querySelectorAll('.material-card').forEach(card => {
        card.classList.remove('material-drag-over', 'material-drag-over-top', 'material-drag-over-bottom');
    });
}

function handleMaterialDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (this !== draggedMaterialCard && draggedMaterialCard) {
        const rect = this.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;

        this.classList.remove('material-drag-over-top', 'material-drag-over-bottom');

        if (e.clientY < midY) {
            this.classList.add('material-drag-over-top');
        } else {
            this.classList.add('material-drag-over-bottom');
        }
    }
}

function handleMaterialDragLeave(e) {
    this.classList.remove('material-drag-over', 'material-drag-over-top', 'material-drag-over-bottom');
}

function handleMaterialDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    if (draggedMaterialCard && this !== draggedMaterialCard) {
        const rect = this.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const container = this.parentElement;

        if (e.clientY < midY) {
            // Insertar antes
            container.insertBefore(draggedMaterialCard, this);
        } else {
            // Insertar después
            container.insertBefore(draggedMaterialCard, this.nextSibling);
        }

        // Guardar el nuevo orden
        saveMaterialsOrder(container);
    }

    this.classList.remove('material-drag-over', 'material-drag-over-top', 'material-drag-over-bottom');
}

function handleContainerDrop(e) {
    e.preventDefault();

    if (draggedMaterialCard) {
        const container = e.currentTarget;
        const cards = container.querySelectorAll('.material-card');

        // Si el contenedor está vacío o se suelta al final
        if (cards.length === 0 || !e.target.classList.contains('material-card')) {
            container.appendChild(draggedMaterialCard);
            saveMaterialsOrder(container);
        }
    }
}

// Guardar el orden de los materiales en Firebase
async function saveMaterialsOrder(container) {
    try {
        const db = window.firebaseDB;
        const cards = container.querySelectorAll('.material-card');
        const batch = db.batch();

        cards.forEach((card, index) => {
            const materialId = card.getAttribute('data-material-id');
            if (materialId) {
                const materialRef = db.collection('materiales').doc(materialId);
                batch.update(materialRef, { orden: index });
            }
        });

        await batch.commit();
        console.log('Orden de materiales guardado correctamente');

    } catch (error) {
        console.error('Error al guardar el orden de materiales:', error);
        showAlertModal('Error', 'No se pudo guardar el nuevo orden de los materiales');
    }
}
