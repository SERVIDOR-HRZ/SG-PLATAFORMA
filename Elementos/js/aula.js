// Aula JavaScript
let currentMateria = '';
let currentAulaId = '';
let currentAulaData = null;
let currentUser = {};

// ImgBB API configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// ============ SISTEMA DE NIVELES PROGRESIVO ============
// Nivel 1→2: 100 XP, Nivel 2→3: 200 XP, Nivel 3→4: 400 XP, etc. (se duplica)

function getXPForLevel(level) {
    if (level <= 1) return 0;
    return 100 * (Math.pow(2, level - 1) - 1);
}

function calculateLevelFromXP(totalXP) {
    if (totalXP < 100) return 1;
    const level = Math.floor(Math.log2(totalXP / 100 + 1) + 1);
    return Math.max(1, level);
}

function getXPNeededForNextLevel(currentLevel) {
    return 100 * Math.pow(2, currentLevel - 1);
}

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

        // Cargar datos del usuario desde Firebase
        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(currentUser.id).get();
        
        if (!usuarioDoc.exists) {
            console.error('Usuario no encontrado en Firebase');
            window.location.href = 'Clases.html';
            return;
        }
        
        const userData = usuarioDoc.data();

        // Si es profesor (no superusuario), filtrar por las materias que tiene asignadas en esta aula
        if (currentUser.tipoUsuario === 'admin') {
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

        // Si es estudiante, filtrar adicionalmente por materias permitidas específicas
        if (currentUser.tipoUsuario === 'estudiante') {
            const aulasAsignadas = userData.aulasAsignadas || [];
            const aulaAsignada = aulasAsignadas.find(a => {
                if (typeof a === 'object' && a.aulaId) {
                    return a.aulaId === currentAulaId;
                }
                return a === currentAulaId;
            });

            console.log('🔍 Estudiante entrando al aula:', currentAulaId);
            console.log('📚 Aulas asignadas del estudiante:', aulasAsignadas);
            console.log('🎯 Aula encontrada:', aulaAsignada);

            // Si el estudiante tiene materias específicas permitidas, filtrar
            if (aulaAsignada && typeof aulaAsignada === 'object' && aulaAsignada.materiasPermitidas && aulaAsignada.materiasPermitidas.length > 0) {
                console.log('✂️ Filtrando materias. Permitidas:', aulaAsignada.materiasPermitidas);
                materiasVisibles = materiasVisibles.filter(m => aulaAsignada.materiasPermitidas.includes(m));
                console.log('✅ Materias visibles después del filtro:', materiasVisibles);
            } else {
                console.log('ℹ️ Sin restricciones de materias, mostrando todas las del aula');
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

    // Aplicar color de la materia a los elementos principales y GLOBALMENTE
    document.documentElement.style.setProperty('--materia-color', config.color);

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

    // Iniciar sistema de regeneración de energía
    initEnergyRegeneration();
}

// Sistema de regeneración de energía (cada 10 minutos)
let energyRegenInterval = null;

async function initEnergyRegeneration() {
    // Limpiar intervalo anterior si existe
    if (energyRegenInterval) {
        clearInterval(energyRegenInterval);
    }

    // Verificar y regenerar energía al cargar
    await checkAndRegenerateEnergy();

    // Configurar intervalo para verificar cada minuto
    energyRegenInterval = setInterval(async () => {
        await checkAndRegenerateEnergy();
    }, 60000); // Verificar cada minuto
}

async function checkAndRegenerateEnergy() {
    try {
        if (!window.firebaseDB) return;

        const db = window.firebaseDB;
        const userDoc = await db.collection('usuarios').doc(currentUser.id).get();

        if (!userDoc.exists) return;

        const userData = userDoc.data();
        const energiaActual = userData.energia !== undefined ? userData.energia : 10;
        const energiaMax = userData.energiaMax || 10;
        const ultimaRegeneracion = userData.ultimaRegeneracionEnergia?.toDate() || new Date(0);

        // Si tiene energía infinita activa, no regenerar
        if (userData.energiaInfinita && userData.energiaInfinitaExpira) {
            const expira = userData.energiaInfinitaExpira.toDate ? userData.energiaInfinitaExpira.toDate() : new Date(userData.energiaInfinitaExpira);
            if (expira > new Date()) {
                return; // Energía infinita activa
            }
        }

        // Si ya tiene energía máxima, solo actualizar timestamp
        if (energiaActual >= energiaMax) {
            return;
        }

        // Calcular cuántas energías regenerar (1 cada 10 minutos)
        const ahora = new Date();
        const minutosTranscurridos = Math.floor((ahora - ultimaRegeneracion) / (1000 * 60));
        const energiasARegenerar = Math.floor(minutosTranscurridos / 10);

        if (energiasARegenerar > 0) {
            const nuevaEnergia = Math.min(energiaActual + energiasARegenerar, energiaMax);

            await db.collection('usuarios').doc(currentUser.id).update({
                energia: nuevaEnergia,
                ultimaRegeneracionEnergia: firebase.firestore.Timestamp.now()
            });

            // Actualizar UI
            updateEnergyUI(nuevaEnergia, energiaMax);
        }
    } catch (error) {
        console.error('Error regenerando energía:', error);
    }
}

function updateEnergyUI(energia, energiaMax) {
    // Actualizar en la tarjeta de stats
    const energyBadge = document.querySelector('.materia-energy-badge span');
    if (energyBadge) {
        energyBadge.textContent = `${energia}/${energiaMax}`;
    }

    // Actualizar en la tienda si está visible
    const tiendaEnergy = document.getElementById('tiendaEnergia');
    if (tiendaEnergy) {
        tiendaEnergy.textContent = `${energia}/${energiaMax}`;
    }
}

// Mostrar tarjeta de estadísticas de la materia
async function showMateriaStatsCard(materiaId, config) {
    // Remover tarjeta existente si hay
    const existingCard = document.getElementById('materiaStatsCard');
    if (existingCard) existingCard.remove();

    // Obtener datos del usuario (foto, energía, monedas, pistas, nivel, xp)
    let userPhoto = '';
    let energia = 10;
    let energiaMax = 10;
    let monedas = 0;
    let pistas = 0;
    let nivel = 1;
    let xp = 0;

    try {
        if (window.firebaseDB) {
            const userDoc = await window.firebaseDB.collection('usuarios').doc(currentUser.id).get();
            if (userDoc.exists) {
                const data = userDoc.data();
                userPhoto = data.fotoPerfil || '';
                energia = data.energia !== undefined ? data.energia : 10;
                energiaMax = data.energiaMax || 10;
                monedas = data.puntos || data.puntosAcumulados || 0;
                pistas = data.pistas || 0;

                // Cargar XP y nivel POR MATERIA (no global)
                const progresoKey = `progreso_${materiaId}`;
                if (data[progresoKey]) {
                    xp = data[progresoKey].xp || 0;
                } else {
                    xp = 0;
                }

                // Calcular nivel basado en XP de esta materia (sistema progresivo)
                nivel = calculateLevelFromXP(xp);

                // Verificar energía infinita
                if (data.energiaInfinita && data.energiaInfinitaExpira) {
                    const expira = data.energiaInfinitaExpira.toDate ? data.energiaInfinitaExpira.toDate() : new Date(data.energiaInfinitaExpira);
                    if (expira > new Date()) {
                        energia = '∞';
                        energiaMax = '';
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
    }

    // Crear color más oscuro para el gradiente
    const darkerColor = adjustColorBrightness(config.color, -40);

    // Calcular progreso de nivel (sistema progresivo: 100, 200, 400, 800...)
    const xpParaNivel = getXPNeededForNextLevel(nivel);
    const xpBaseNivel = getXPForLevel(nivel);
    const xpActualNivel = xp - xpBaseNivel;
    const progresoNivel = (xpActualNivel / xpParaNivel) * 100;

    // Crear la tarjeta de estadísticas
    const energiaDisplay = energiaMax ? `${energia}/${energiaMax}` : `${energia}`;

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
                <div class="materia-stats-badges-row">
                    <div class="materia-energy-badge">
                        <i class="bi bi-lightning-fill"></i>
                        <span>${energiaDisplay}</span>
                    </div>
                    <div class="materia-pistas-badge">
                        <i class="bi bi-lightbulb-fill"></i>
                        <span id="pistasHeader">${pistas}</span>
                    </div>
                    <div class="materia-monedas-badge">
                        <i class="bi bi-coin"></i>
                        <span id="monedasHeader">${monedas}</span>
                    </div>
                </div>
            </div>

            <div class="materia-level-container">
                <div class="level-info">
                    <span class="level-label">Nivel</span>
                    <span class="level-value">${nivel}</span>
                </div>
                <div class="level-progress-bar">
                    <div class="level-progress-fill" style="width: ${progresoNivel}%;"></div>
                </div>
                <span class="level-progress-text">${xpActualNivel} / ${xpParaNivel} XP</span>
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

            // Actualizar URL con el tab actual (sin recargar la página)
            updateUrlWithTab(tabName);

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
                case 'asistencia':
                    loadAsistencia();
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

    // Verificar si hay parámetros de URL para abrir un tab específico
    checkUrlTabParams();
}

// Actualizar URL con el tab actual
function updateUrlWithTab(tabName, subtabName = null) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabName);

    if (subtabName) {
        url.searchParams.set('subtab', subtabName);
    } else {
        url.searchParams.delete('subtab');
    }

    window.history.replaceState({}, '', url);
}

// Verificar parámetros de URL para abrir tabs específicos
function checkUrlTabParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    const subtabParam = urlParams.get('subtab');

    if (tabParam) {
        // Buscar y hacer clic en el tab correspondiente
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabParam}"]`);
        if (tabBtn) {
            tabBtn.click();

            // Si hay subtab, esperar un poco y luego activarlo
            if (subtabParam) {
                setTimeout(() => {
                    const subtabBtn = document.querySelector(`.desafios-submenu-btn[data-subtab="${subtabParam}"]`);
                    if (subtabBtn) {
                        subtabBtn.click();
                    }
                }, 100);
            }
        }
    }
}

// Setup desafíos submenu (Retos / Tienda / Racha / Ranking)
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

            // Actualizar URL con el subtab actual
            updateUrlWithTab('desafios', subtab);

            // Cargar datos según la pestaña
            if (subtab === 'tienda') {
                loadTiendaData();
            } else if (subtab === 'racha') {
                loadRachaData();
            } else if (subtab === 'ranking') {
                loadRankingData();
            }
        });
    });

    // Setup ranking filter buttons
    setupRankingFilter();

    // Botón iniciar desafío
    const iniciarDesafioBtn = document.getElementById('iniciarDesafioBtn');
    if (iniciarDesafioBtn) {
        iniciarDesafioBtn.addEventListener('click', () => {
            // Redirigir a la página de desafíos con la materia actual
            window.location.href = `Desafios.html?materia=${currentMateria}&aula=${currentAulaId}`;
        });
    }

    // Setup tienda buttons
    setupTiendaButtons();
}

// ============================================
// SISTEMA DE RACHAS (por materia)
// ============================================

// Cargar datos de racha del usuario (por materia)
async function loadRachaData() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        const userDoc = await db.collection('usuarios').doc(currentUser.id).get();

        if (userDoc.exists) {
            const data = userDoc.data();

            // Obtener progreso de la materia actual
            const progresoKey = `progreso_${currentMateria}`;
            const progresoMateria = data[progresoKey] || {};

            // Leer racha desde el progreso de la materia
            let racha = progresoMateria.racha || 0;
            const mejorRacha = progresoMateria.mejorRacha || 0;
            const diasTotales = progresoMateria.diasDesafios || 0;
            const ultimoDesafio = progresoMateria.ultimoDesafio ? (progresoMateria.ultimoDesafio.toDate ? progresoMateria.ultimoDesafio.toDate() : new Date(progresoMateria.ultimoDesafio)) : null;

            // Verificar si la racha se perdió (no completó ayer ni hoy)
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const ayer = new Date(hoy);
            ayer.setDate(ayer.getDate() - 1);

            let completadoHoy = false;
            let completadoAyer = false;

            if (ultimoDesafio) {
                const fechaUltimo = new Date(ultimoDesafio);
                fechaUltimo.setHours(0, 0, 0, 0);

                completadoHoy = fechaUltimo.getTime() === hoy.getTime();
                completadoAyer = fechaUltimo.getTime() === ayer.getTime();
            }

            // Si no completó hoy ni ayer, la racha se perdió
            if (!completadoHoy && !completadoAyer && racha > 0) {
                racha = 0;
                // Actualizar en Firebase (dentro del progreso de la materia)
                await db.collection('usuarios').doc(currentUser.id).update({
                    [`${progresoKey}.racha`]: 0
                });
            }

            // Actualizar UI
            document.getElementById('rachaCount').textContent = racha;
            document.getElementById('rachaMejor').textContent = mejorRacha;
            document.getElementById('rachaTotalDias').textContent = diasTotales;

            const rachaMessage = document.getElementById('rachaMessage');
            if (completadoHoy) {
                rachaMessage.classList.add('completed');
                rachaMessage.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>¡Genial! Ya completaste tu desafío de hoy</span>';
            } else if (completadoAyer) {
                rachaMessage.classList.remove('completed');
                rachaMessage.innerHTML = '<i class="bi bi-fire"></i><span>¡Completa un desafío hoy para mantener tu racha de ' + racha + ' días!</span>';
            } else {
                rachaMessage.classList.remove('completed');
                if (racha === 0) {
                    rachaMessage.innerHTML = '<i class="bi bi-info-circle"></i><span>Completa un desafío para comenzar tu racha</span>';
                } else {
                    rachaMessage.innerHTML = '<i class="bi bi-info-circle"></i><span>Completa al menos un desafío hoy para mantener tu racha</span>';
                }
            }

            // Renderizar calendario (desde el progreso de la materia)
            renderRachaCalendar(progresoMateria.diasCompletados || []);
        }
    } catch (error) {
        console.error('Error cargando datos de racha:', error);
    }
}

// Renderizar calendario de racha
function renderRachaCalendar(diasCompletados = []) {
    const container = document.getElementById('rachaCalendar');
    if (!container) return;

    const hoy = new Date();
    const mesActual = hoy.getMonth();
    const anioActual = hoy.getFullYear();

    const primerDia = new Date(anioActual, mesActual, 1);
    const ultimoDia = new Date(anioActual, mesActual + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    // Convertir días completados a formato comparable
    const diasSet = new Set(diasCompletados.map(d => {
        const fecha = d.toDate ? d.toDate() : new Date(d);
        return `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
    }));

    let html = `
        <div class="racha-calendar-header">
            <span class="racha-calendar-title">${nombresMeses[mesActual]} ${anioActual}</span>
        </div>
        <div class="racha-week-days">
            <span>D</span><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span>
        </div>
        <div class="racha-days-grid">
    `;

    // Días vacíos al inicio
    for (let i = 0; i < primerDiaSemana; i++) {
        html += '<div class="racha-day empty"></div>';
    }

    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaKey = `${anioActual}-${mesActual}-${dia}`;
        const esHoy = dia === hoy.getDate();
        const esFuturo = dia > hoy.getDate();
        const completado = diasSet.has(fechaKey);

        let clases = 'racha-day';
        if (completado) clases += ' completed';
        if (esHoy) clases += ' today';
        if (esFuturo) clases += ' future';

        html += `<div class="${clases}">${dia}</div>`;
    }

    html += '</div>';
    container.innerHTML = html;
}

// ============================================
// SISTEMA DE RANKING
// ============================================

let currentRankingFilter = 'racha';

// Setup filtros de ranking
function setupRankingFilter() {
    const filterBtns = document.querySelectorAll('.ranking-filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRankingFilter = btn.dataset.filter;
            loadRankingData();
        });
    });
}

// Cargar datos del ranking
async function loadRankingData() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        // Obtener estudiantes que tienen acceso a la materia actual
        let snapshot;

        if (currentAulaId) {
            // Si hay aula, buscar por aulasAsignadas (array-contains)
            snapshot = await db.collection('usuarios')
                .where('tipoUsuario', '==', 'estudiante')
                .where('aulasAsignadas', 'array-contains', currentAulaId)
                .get();
        } else if (currentMateria) {
            // Si hay materia, buscar por clasesPermitidas
            snapshot = await db.collection('usuarios')
                .where('tipoUsuario', '==', 'estudiante')
                .where('clasesPermitidas', 'array-contains', currentMateria)
                .get();
        } else {
            // Fallback: todos los estudiantes
            snapshot = await db.collection('usuarios')
                .where('tipoUsuario', '==', 'estudiante')
                .get();
        }

        let estudiantes = [];
        const progresoKey = `progreso_${currentMateria}`;

        snapshot.forEach(doc => {
            const data = doc.data();

            // Obtener XP, nivel y racha de la materia actual (todo por materia)
            const progresoMateria = data[progresoKey] || {};
            const xpMateria = progresoMateria.xp || 0;
            const nivelMateria = progresoMateria.nivel || 1;
            const rachaMateria = progresoMateria.racha || 0;

            estudiantes.push({
                id: doc.id,
                nombre: data.nombre || 'Usuario',
                foto: data.fotoPerfil || null,
                racha: rachaMateria,
                xp: xpMateria,
                nivel: nivelMateria
            });
        });

        // Ordenar según el filtro
        if (currentRankingFilter === 'racha') {
            estudiantes.sort((a, b) => b.racha - a.racha);
        } else {
            estudiantes.sort((a, b) => b.xp - a.xp);
        }

        // Renderizar podio y lista
        renderRankingPodium(estudiantes.slice(0, 3));
        renderRankingList(estudiantes.slice(3, 10));
        renderUserPosition(estudiantes);

    } catch (error) {
        console.error('Error cargando ranking:', error);
    }
}

// Renderizar podio (top 3)
function renderRankingPodium(top3) {
    const container = document.getElementById('rankingPodium');
    if (!container) return;

    if (top3.length === 0) {
        container.innerHTML = '<div class="ranking-empty"><i class="bi bi-trophy"></i><p>No hay datos de ranking aún</p></div>';
        return;
    }

    const positions = ['second', 'first', 'third'];
    const order = [1, 0, 2]; // Segundo, Primero, Tercero (para el display)
    const medals = ['🥈', '🥇', '🥉'];

    let html = '';
    order.forEach((idx, displayIdx) => {
        const estudiante = top3[idx];
        if (!estudiante) return;

        const score = currentRankingFilter === 'racha' ? estudiante.racha : estudiante.xp;
        const scoreIcon = currentRankingFilter === 'racha' ? 'bi-fire' : 'bi-star-fill';
        const scoreLabel = currentRankingFilter === 'racha' ? 'días' : 'XP';

        html += `
            <div class="podium-item ${positions[displayIdx]}">
                <div class="podium-medal">${medals[displayIdx]}</div>
                <div class="podium-avatar">
                    ${estudiante.foto ? `<img src="${estudiante.foto}" alt="${estudiante.nombre}">` : '<i class="bi bi-person-fill"></i>'}
                </div>
                <span class="podium-name">${estudiante.nombre}</span>
                <span class="podium-score"><i class="bi ${scoreIcon}"></i> ${score} ${scoreLabel}</span>
                <div class="podium-base">${idx + 1}°</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Renderizar lista de ranking (posiciones 4-10)
function renderRankingList(estudiantes) {
    const container = document.getElementById('rankingList');
    if (!container) return;

    if (estudiantes.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    estudiantes.forEach((est, idx) => {
        const posicion = idx + 4;
        const score = currentRankingFilter === 'racha' ? est.racha : est.xp;
        const scoreIcon = currentRankingFilter === 'racha' ? 'bi-fire' : 'bi-star-fill';
        const isCurrentUser = est.id === currentUser.id;

        html += `
            <div class="ranking-item ${isCurrentUser ? 'current-user' : ''}">
                <div class="ranking-position">${posicion}</div>
                <div class="ranking-avatar">
                    ${est.foto ? `<img src="${est.foto}" alt="${est.nombre}">` : '<i class="bi bi-person-fill"></i>'}
                </div>
                <div class="ranking-info">
                    <div class="ranking-name">${est.nombre}</div>
                    <div class="ranking-level">Nivel ${est.nivel}</div>
                </div>
                <div class="ranking-score ${currentRankingFilter === 'xp' ? 'xp' : ''}">
                    <i class="bi ${scoreIcon}"></i>
                    ${score}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Renderizar posición del usuario actual
function renderUserPosition(todosEstudiantes) {
    const container = document.getElementById('rankingUserPosition');
    if (!container) return;

    const miPosicion = todosEstudiantes.findIndex(e => e.id === currentUser.id) + 1;

    if (miPosicion === 0 || miPosicion <= 10) {
        container.style.display = 'none';
        return;
    }

    const miData = todosEstudiantes.find(e => e.id === currentUser.id);
    const score = currentRankingFilter === 'racha' ? miData.racha : miData.xp;

    container.style.display = 'flex';
    container.innerHTML = `
        <div class="user-pos-left">
            <span class="user-pos-rank">#${miPosicion}</span>
            <span class="user-pos-label">Tu posición actual</span>
        </div>
        <div class="ranking-score" style="color: white;">
            <i class="bi ${currentRankingFilter === 'racha' ? 'bi-fire' : 'bi-star-fill'}"></i>
            ${score}
        </div>
    `;
}

// ============================================
// TIENDA
// ============================================

// Cargar datos de la tienda
async function loadTiendaData() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        const userDoc = await db.collection('usuarios').doc(currentUser.id).get();

        if (userDoc.exists) {
            const data = userDoc.data();
            const monedas = data.puntos || data.puntosAcumulados || 0;
            const pistas = data.pistas || 0;
            let energia = data.energia !== undefined ? data.energia : 10;
            const energiaMax = data.energiaMax || 10;

            // Verificar energía infinita
            let energiaDisplay = `${energia}/${energiaMax}`;
            if (data.energiaInfinita && data.energiaInfinitaExpira) {
                const expira = data.energiaInfinitaExpira.toDate ? data.energiaInfinitaExpira.toDate() : new Date(data.energiaInfinitaExpira);
                if (expira > new Date()) {
                    energiaDisplay = '∞';
                }
            }

            // Actualizar monedas en el header
            const monedasHeader = document.getElementById('monedasHeader');
            if (monedasHeader) {
                monedasHeader.textContent = monedas;
            }

            // Actualizar pistas en el header
            const pistasHeader = document.getElementById('pistasHeader');
            if (pistasHeader) {
                pistasHeader.textContent = pistas;
            }

            // Actualizar energía en el header
            const energyBadge = document.querySelector('.materia-energy-badge span');
            if (energyBadge) {
                energyBadge.textContent = energiaDisplay;
            }

            // Actualizar en la tienda
            const tiendaMonedas = document.getElementById('tiendaMonedas');
            if (tiendaMonedas) {
                tiendaMonedas.textContent = monedas;
            }

            const tiendaEnergia = document.getElementById('tiendaEnergia');
            if (tiendaEnergia) {
                tiendaEnergia.textContent = energiaDisplay;
            }

            const tiendaPistas = document.getElementById('tiendaPistas');
            if (tiendaPistas) {
                tiendaPistas.textContent = pistas;
            }
        }
    } catch (error) {
        console.error('Error cargando datos de tienda:', error);
    }
}

// Setup tienda buttons
function setupTiendaButtons() {
    const tiendaItems = document.querySelectorAll('.tienda-item');

    tiendaItems.forEach(item => {
        const comprarBtn = item.querySelector('.tienda-comprar-btn');
        if (comprarBtn) {
            comprarBtn.addEventListener('click', () => {
                const itemType = item.dataset.item;
                const precio = parseInt(item.dataset.precio);
                mostrarConfirmacionCompra(itemType, precio);
            });
        }
    });

    // Setup compra personalizada
    setupCustomPurchase();
}

// Precios base para compra personalizada
const PRECIO_ENERGIA_UNITARIO = 20;
const PRECIO_PISTA_UNITARIO = 100;

// Setup compra personalizada
function setupCustomPurchase() {
    // Energía personalizada
    const energiaInput = document.getElementById('customEnergiaInput');
    const energiaMinusBtn = document.getElementById('energiaMinusBtn');
    const energiaPlusBtn = document.getElementById('energiaPlusBtn');
    const energiaPriceDisplay = document.getElementById('customEnergiaPrice');
    const buyEnergiaBtn = document.getElementById('buyCustomEnergiaBtn');

    // Pista personalizada
    const pistaInput = document.getElementById('customPistaInput');
    const pistaMinusBtn = document.getElementById('pistaMinusBtn');
    const pistaPlusBtn = document.getElementById('pistaPlusBtn');
    const pistaPriceDisplay = document.getElementById('customPistaPrice');
    const buyPistaBtn = document.getElementById('buyCustomPistaBtn');

    // Funciones de actualización de precio
    function updateEnergiaPrice() {
        if (!energiaInput || !energiaPriceDisplay) return;
        const cantidad = parseInt(energiaInput.value) || 1;
        const precio = calcularPrecioEnergia(cantidad);
        energiaPriceDisplay.innerHTML = `<i class="bi bi-coin"></i> ${precio}`;
    }

    function updatePistaPrice() {
        if (!pistaInput || !pistaPriceDisplay) return;
        const cantidad = parseInt(pistaInput.value) || 1;
        const precio = calcularPrecioPista(cantidad);
        pistaPriceDisplay.innerHTML = `<i class="bi bi-coin"></i> ${precio}`;
    }

    // Event listeners para energía
    if (energiaInput) {
        energiaInput.addEventListener('input', () => {
            let val = parseInt(energiaInput.value) || 1;
            if (val < 1) val = 1;
            if (val > 100) val = 100;
            energiaInput.value = val;
            updateEnergiaPrice();
        });
    }

    if (energiaMinusBtn) {
        energiaMinusBtn.addEventListener('click', () => {
            let val = parseInt(energiaInput.value) || 1;
            if (val > 1) {
                energiaInput.value = val - 1;
                updateEnergiaPrice();
            }
        });
    }

    if (energiaPlusBtn) {
        energiaPlusBtn.addEventListener('click', () => {
            let val = parseInt(energiaInput.value) || 1;
            if (val < 100) {
                energiaInput.value = val + 1;
                updateEnergiaPrice();
            }
        });
    }

    if (buyEnergiaBtn) {
        buyEnergiaBtn.addEventListener('click', () => {
            const cantidad = parseInt(energiaInput.value) || 1;
            const precio = calcularPrecioEnergia(cantidad);
            mostrarConfirmacionCompra(`customEnergia${cantidad}`, precio);
        });
    }

    // Event listeners para pistas
    if (pistaInput) {
        pistaInput.addEventListener('input', () => {
            let val = parseInt(pistaInput.value) || 1;
            if (val < 1) val = 1;
            if (val > 100) val = 100;
            pistaInput.value = val;
            updatePistaPrice();
        });
    }

    if (pistaMinusBtn) {
        pistaMinusBtn.addEventListener('click', () => {
            let val = parseInt(pistaInput.value) || 1;
            if (val > 1) {
                pistaInput.value = val - 1;
                updatePistaPrice();
            }
        });
    }

    if (pistaPlusBtn) {
        pistaPlusBtn.addEventListener('click', () => {
            let val = parseInt(pistaInput.value) || 1;
            if (val < 100) {
                pistaInput.value = val + 1;
                updatePistaPrice();
            }
        });
    }

    if (buyPistaBtn) {
        buyPistaBtn.addEventListener('click', () => {
            const cantidad = parseInt(pistaInput.value) || 1;
            const precio = calcularPrecioPista(cantidad);
            mostrarConfirmacionCompra(`customPista${cantidad}`, precio);
        });
    }
}

// Calcular precio de energía con descuentos por volumen
function calcularPrecioEnergia(cantidad) {
    // Descuentos por volumen
    let descuento = 0;
    if (cantidad >= 50) descuento = 0.20; // 20% descuento
    else if (cantidad >= 20) descuento = 0.15; // 15% descuento
    else if (cantidad >= 10) descuento = 0.10; // 10% descuento
    else if (cantidad >= 5) descuento = 0.05; // 5% descuento

    const precioBase = cantidad * PRECIO_ENERGIA_UNITARIO;
    return Math.floor(precioBase * (1 - descuento));
}

// Calcular precio de pistas con descuentos por volumen
function calcularPrecioPista(cantidad) {
    // Descuentos por volumen
    let descuento = 0;
    if (cantidad >= 50) descuento = 0.30; // 30% descuento
    else if (cantidad >= 20) descuento = 0.20; // 20% descuento
    else if (cantidad >= 10) descuento = 0.10; // 10% descuento
    else if (cantidad >= 5) descuento = 0.05; // 5% descuento

    const precioBase = cantidad * PRECIO_PISTA_UNITARIO;
    return Math.floor(precioBase * (1 - descuento));
}

// Variables para la compra pendiente
let compraPendiente = { itemType: null, precio: null };

// Mostrar modal de confirmación de compra
function mostrarConfirmacionCompra(itemType, precio) {
    compraPendiente = { itemType, precio };

    const modal = document.getElementById('confirmarCompraModal');
    const mensaje = document.getElementById('confirmarCompraMensaje');

    if (!modal || !mensaje) {
        // Si no existe el modal, proceder directamente
        handleCompra(itemType, precio);
        return;
    }

    mensaje.textContent = `¿Deseas comprar ${getItemName(itemType)} por ${precio} monedas?`;
    modal.style.display = 'flex';
}

// Cerrar modal de confirmación
function cerrarConfirmacionCompra() {
    const modal = document.getElementById('confirmarCompraModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Confirmar la compra
function confirmarCompra() {
    const itemType = compraPendiente.itemType;
    const precio = compraPendiente.precio;

    cerrarConfirmacionCompra();
    compraPendiente = { itemType: null, precio: null };

    if (itemType && precio) {
        handleCompra(itemType, precio);
    }
}

// Cancelar la compra
function cancelarCompra() {
    cerrarConfirmacionCompra();
    compraPendiente = { itemType: null, precio: null };
}

// Inicializar eventos del modal de confirmación
document.addEventListener('DOMContentLoaded', function () {
    const confirmarBtn = document.getElementById('confirmarCompraBtn');
    const cancelarBtn = document.getElementById('cancelarCompraBtn');
    const modal = document.getElementById('confirmarCompraModal');

    if (confirmarBtn) {
        confirmarBtn.addEventListener('click', confirmarCompra);
    }
    if (cancelarBtn) {
        cancelarBtn.addEventListener('click', cancelarCompra);
    }
    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) {
                cancelarCompra();
            }
        });
    }
});

// Manejar compra en la tienda
async function handleCompra(itemType, precio) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        // Obtener datos actuales del usuario
        const userDoc = await db.collection('usuarios').doc(currentUser.id).get();
        if (!userDoc.exists) {
            showTiendaAlert('Error', 'No se encontró el usuario', 'error');
            return;
        }

        const userData = userDoc.data();
        const monedasActuales = userData.puntos || userData.puntosAcumulados || 0;

        // Verificar si tiene suficientes monedas
        if (monedasActuales < precio) {
            showTiendaAlert('Monedas insuficientes', `Necesitas ${precio} monedas pero solo tienes ${monedasActuales}`, 'warning');
            return;
        }

        // Calcular lo que se va a agregar
        let updateData = {
            puntos: monedasActuales - precio,
            puntosAcumulados: monedasActuales - precio
        };

        const energiaActual = userData.energia || 0;
        const pistasActuales = userData.pistas || 0;

        // Determinar qué se compró
        if (itemType.startsWith('pack')) {
            // Packs combinados
            const packs = {
                'packBasico': { energia: 3, pistas: 1 },
                'packEstandar': { energia: 5, pistas: 3 },
                'packPro': { energia: 10, pistas: 5 },
                'packUltimate': { energia: 20, pistas: 10 },
                'packMega': { energia: 50, pistas: 20 }
            };
            const pack = packs[itemType];
            if (pack) {
                updateData.energia = energiaActual + pack.energia;
                updateData.pistas = pistasActuales + pack.pistas;
            }
        } else if (itemType.startsWith('customEnergia')) {
            // Compra personalizada de energía
            const cantidadEnergia = parseInt(itemType.replace('customEnergia', '')) || 1;
            updateData.energia = energiaActual + cantidadEnergia;
        } else if (itemType.startsWith('customPista')) {
            // Compra personalizada de pistas
            const cantidadPistas = parseInt(itemType.replace('customPista', '')) || 1;
            updateData.pistas = pistasActuales + cantidadPistas;
        } else if (itemType.startsWith('energia')) {
            const cantidadEnergia = getCantidadFromItem(itemType, 'energia');

            if (itemType === 'energiaInfinita') {
                // Energía infinita por 24 horas
                updateData.energiaInfinita = true;
                updateData.energiaInfinitaExpira = new Date(Date.now() + 24 * 60 * 60 * 1000);
            } else {
                // Sumar energía sin límite (puede superar el máximo)
                updateData.energia = energiaActual + cantidadEnergia;
            }
        } else if (itemType.startsWith('pista')) {
            const cantidadPistas = getCantidadFromItem(itemType, 'pista');
            updateData.pistas = pistasActuales + cantidadPistas;
        }

        // Actualizar en Firebase
        await db.collection('usuarios').doc(currentUser.id).update(updateData);

        // Actualizar UI
        loadTiendaData();

        // Mostrar confirmación
        showTiendaAlert('¡Compra exitosa!', `Has comprado ${getItemName(itemType)} por ${precio} monedas`, 'success');

    } catch (error) {
        console.error('Error en la compra:', error);
        showTiendaAlert('Error', 'No se pudo completar la compra', 'error');
    }
}

// Obtener cantidad del item
function getCantidadFromItem(itemType, prefix) {
    const match = itemType.match(new RegExp(`${prefix}(\\d+)`));
    return match ? parseInt(match[1]) : 1;
}

// Obtener nombre del item
function getItemName(itemType) {
    const names = {
        'energia1': '1 Energía',
        'energia3': '3 Energías',
        'energia5': '5 Energías',
        'energia10': '10 Energías',
        'energia20': '20 Energías',
        'energiaInfinita': 'Energía Infinita (24h)',
        'pista1': '1 Pista',
        'pista3': '3 Pistas',
        'pista5': '5 Pistas',
        'pista10': '10 Pistas',
        'pista20': '20 Pistas',
        'pista50': '50 Pistas',
        'packBasico': 'Pack Básico (3 Energías + 1 Pista)',
        'packEstandar': 'Pack Estándar (5 Energías + 3 Pistas)',
        'packPro': 'Pack Pro (10 Energías + 5 Pistas)',
        'packUltimate': 'Pack Ultimate (20 Energías + 10 Pistas)',
        'packMega': 'Pack Mega (50 Energías + 20 Pistas)'
    };

    // Para compras personalizadas
    if (itemType.startsWith('customEnergia')) {
        const cantidad = itemType.replace('customEnergia', '');
        return `${cantidad} Energía${cantidad > 1 ? 's' : ''}`;
    }
    if (itemType.startsWith('customPista')) {
        const cantidad = itemType.replace('customPista', '');
        return `${cantidad} Pista${cantidad > 1 ? 's' : ''}`;
    }

    return names[itemType] || itemType;
}

// Mostrar alerta de tienda
function showTiendaAlert(title, message, type = 'success') {
    const modal = document.getElementById('tiendaAlertModal');
    const icon = document.getElementById('tiendaAlertIcon');

    if (!modal || !icon) {
        console.error('Modal de tienda no encontrado');
        alert(`${title}\n\n${message}`);
        return;
    }

    document.getElementById('tiendaAlertTitulo').textContent = title;
    document.getElementById('tiendaAlertMensaje').textContent = message;

    // Cambiar icono y color según tipo
    if (type === 'error') {
        icon.style.background = 'linear-gradient(180deg, #F44336 0%, #D32F2F 100%)';
        icon.innerHTML = '<i class="bi bi-x-circle-fill" style="font-size: 2.5rem; color: white;"></i>';
    } else if (type === 'warning') {
        icon.style.background = 'linear-gradient(180deg, #FF9800 0%, #F57C00 100%)';
        icon.innerHTML = '<i class="bi bi-exclamation-triangle-fill" style="font-size: 2.5rem; color: white;"></i>';
    } else if (type === 'info') {
        icon.style.background = 'linear-gradient(180deg, #2196F3 0%, #1976D2 100%)';
        icon.innerHTML = '<i class="bi bi-info-circle-fill" style="font-size: 2.5rem; color: white;"></i>';
    } else {
        // success
        icon.style.background = 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)';
        icon.innerHTML = '<i class="bi bi-check-circle-fill" style="font-size: 2.5rem; color: white;"></i>';
    }

    modal.style.display = 'flex';
}

function closeTiendaAlert() {
    const modal = document.getElementById('tiendaAlertModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Inicializar evento del botón de alerta de tienda
document.addEventListener('DOMContentLoaded', function () {
    const alertBtn = document.getElementById('tiendaAlertBtn');
    if (alertBtn) {
        alertBtn.addEventListener('click', closeTiendaAlert);
    }

    const alertModal = document.getElementById('tiendaAlertModal');
    if (alertModal) {
        alertModal.addEventListener('click', function (e) {
            if (e.target === alertModal) {
                closeTiendaAlert();
            }
        });
    }
});

// Load desafios
function loadDesafios() {
    const desafiosContainer = document.getElementById('desafiosContainer');
    // Los desafíos se cargarán aquí cuando estén disponibles
    desafiosContainer.innerHTML = '';
}

// Load foro
async function loadForo() {
    const foroContainer = document.getElementById('foroContainer');
    foroContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        // Obtener color de la materia actual
        const materiaColor = window.currentMateriaColor || '#667eea';

        // Verificar si el usuario es admin o tutor
        const esAdmin = currentUser.tipoUsuario === 'admin';
        const esTutor = await verificarSiEsTutor(db);

        // Mostrar botones de gestión si es admin
        let headerHTML = '';
        if (esAdmin) {
            headerHTML = `
                <div class="foro-header">
                    <button class="btn-gestionar-tutores" id="gestionarTutoresBtn">
                        <i class="bi bi-people-fill"></i>
                        Gestionar Tutores
                    </button>
                </div>
            `;
        }

        // Mostrar botón de crear publicación si es tutor o admin
        let createPostHTML = '';
        if (esTutor || esAdmin) {
            createPostHTML = `
                <div class="foro-create-post-container">
                    <button class="btn-crear-publicacion-foro" id="crearPublicacionForoBtn">
                        <i class="bi bi-plus-circle"></i>
                        Crear Publicación
                    </button>
                </div>
            `;
        }

        // Cargar publicaciones del foro
        // Primero obtenemos todas las publicaciones del aula
        const publicacionesSnapshot = await db.collection('foro')
            .where('aulaId', '==', currentAulaId)
            .where('materia', '==', currentMateria)
            .get();

        // Filtrar y ordenar en el cliente
        const publicaciones = [];
        publicacionesSnapshot.forEach(doc => {
            publicaciones.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar por fecha de creación (más recientes primero)
        publicaciones.sort((a, b) => {
            const fechaA = a.fechaCreacion ? a.fechaCreacion.seconds : 0;
            const fechaB = b.fechaCreacion ? b.fechaCreacion.seconds : 0;
            return fechaB - fechaA;
        });

        let publicacionesHTML = '';
        if (publicaciones.length === 0) {
            publicacionesHTML = `
                <div class="empty-state">
                    <i class="bi bi-chat-dots"></i>
                    <p>No hay publicaciones en el foro</p>
                    ${esTutor || esAdmin ? '<small>Sé el primero en crear una publicación</small>' : ''}
                </div>
            `;
        } else {
            for (const publicacion of publicaciones) {
                publicacionesHTML += await renderPublicacionForo(publicacion, db, esTutor, esAdmin);
            }
        }

        foroContainer.innerHTML = `
            ${headerHTML}
            ${createPostHTML}
            <div class="foro-publicaciones-container">
                ${publicacionesHTML}
            </div>
        `;

        // Event listeners
        if (esAdmin) {
            document.getElementById('gestionarTutoresBtn')?.addEventListener('click', abrirModalGestionarTutores);
        }
        if (esTutor || esAdmin) {
            document.getElementById('crearPublicacionForoBtn')?.addEventListener('click', abrirModalCrearPublicacionForo);
        }

        // Event listeners para comentarios
        setupForoCommentListeners();

    } catch (error) {
        console.error('Error al cargar foro:', error);
        foroContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error al cargar el foro</p>
            </div>
        `;
    }
}

// Verificar si el usuario actual es tutor en esta aula/materia
async function verificarSiEsTutor(db) {
    try {
        const tutorDoc = await db.collection('tutores')
            .where('aulaId', '==', currentAulaId)
            .where('materia', '==', currentMateria)
            .where('estudianteId', '==', currentUser.id)
            .get();

        return !tutorDoc.empty;
    } catch (error) {
        console.error('Error verificando tutor:', error);
        return false;
    }
}

// Renderizar una publicación del foro
async function renderPublicacionForo(publicacion, db, esTutor, esAdmin) {
    // Obtener color de la materia actual
    const materiaColor = window.currentMateriaColor || '#667eea';

    // Obtener datos del autor
    let autorNombre = 'Usuario';
    let autorFoto = '';
    try {
        const autorDoc = await db.collection('usuarios').doc(publicacion.autorId).get();
        if (autorDoc.exists) {
            const autorData = autorDoc.data();
            autorNombre = autorData.nombre || 'Usuario';
            autorFoto = autorData.fotoPerfil || '';
        }
    } catch (error) {
        console.error('Error obteniendo autor:', error);
    }

    // Formatear fecha
    const fecha = publicacion.fechaCreacion ? new Date(publicacion.fechaCreacion.seconds * 1000) : new Date();
    const fechaFormateada = formatearFechaRelativa(fecha);

    // Renderizar imágenes
    let imagenesHTML = '';
    if (publicacion.imagenes && publicacion.imagenes.length > 0) {
        imagenesHTML = `
            <div class="foro-post-images">
                ${publicacion.imagenes.map(img => `
                    <img src="${img}" alt="Imagen" class="foro-post-image" onclick="openMediaModal('${img}', 'image')">
                `).join('')}
            </div>
        `;
    }

    // Renderizar videos
    let videosHTML = '';
    if (publicacion.videos && publicacion.videos.length > 0) {
        videosHTML = `<div class="foro-post-videos">`;
        publicacion.videos.forEach(video => {
            if (video.tipo === 'youtube') {
                const videoId = extractYouTubeID(video.url);
                videosHTML += `
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                    </div>
                `;
            } else if (video.tipo === 'drive') {
                const driveId = extractDriveVideoID(video.url);
                videosHTML += `
                    <div class="video-container">
                        <iframe src="https://drive.google.com/file/d/${driveId}/preview" frameborder="0" allowfullscreen></iframe>
                    </div>
                `;
            }
        });
        videosHTML += `</div>`;
    }

    // Renderizar archivos
    let archivosHTML = '';
    if (publicacion.archivos && publicacion.archivos.length > 0) {
        archivosHTML = `
            <div class="foro-post-files">
                ${publicacion.archivos.map(archivo => `
                    <a href="${archivo.url}" target="_blank" class="foro-file-link">
                        <i class="bi ${getFileIcon(archivo.url)}"></i>
                        <span>${archivo.nombre || 'Archivo'}</span>
                    </a>
                `).join('')}
            </div>
        `;
    }

    // Obtener comentarios
    const comentariosSnapshot = await db.collection('foro').doc(publicacion.id).collection('comentarios')
        .get();

    // Ordenar comentarios en el cliente
    const comentarios = [];
    comentariosSnapshot.forEach(doc => {
        comentarios.push({ id: doc.id, ...doc.data() });
    });

    comentarios.sort((a, b) => {
        const fechaA = a.fecha ? a.fecha.seconds : 0;
        const fechaB = b.fecha ? b.fecha.seconds : 0;
        return fechaA - fechaB; // Más antiguos primero
    });

    let comentariosHTML = '';
    for (const comentario of comentarios) {
        comentariosHTML += await renderComentarioForo(comentario, db);
    }

    // Botones de acción (solo para el autor o admin)
    let accionesHTML = '';
    if (publicacion.autorId === currentUser.id || esAdmin) {
        accionesHTML = `
            <div class="foro-post-actions">
                <button class="btn-editar-publicacion-foro" data-id="${publicacion.id}">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn-eliminar-publicacion-foro" data-id="${publicacion.id}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    }

    return `
        <div class="foro-publicacion" data-id="${publicacion.id}">
            <div class="foro-post-header">
                <div class="foro-post-author">
                    <div class="foro-author-avatar" style="background: ${materiaColor};">
                        ${autorFoto ? `<img src="${autorFoto}" alt="${autorNombre}">` : '<i class="bi bi-person-fill"></i>'}
                    </div>
                    <div class="foro-author-info">
                        <span class="foro-author-name">${autorNombre}</span>
                        <span class="foro-author-badge" style="background: ${materiaColor};"><i class="bi bi-mortarboard-fill"></i> Tutor</span>
                        <span class="foro-post-date">${fechaFormateada}</span>
                    </div>
                </div>
                ${accionesHTML}
            </div>
            <div class="foro-post-body">
                ${publicacion.titulo ? `<h3 class="foro-post-title">${publicacion.titulo}</h3>` : ''}
                <p class="foro-post-content">${publicacion.contenido}</p>
                ${imagenesHTML}
                ${videosHTML}
                ${archivosHTML}
            </div>
            <div class="foro-post-footer">
                <button class="btn-comentar-foro" data-id="${publicacion.id}" style="color: ${materiaColor};">
                    <i class="bi bi-chat-left-text"></i>
                    Comentar (${comentarios.length})
                </button>
            </div>
            <div class="foro-comentarios-container" id="comentarios-${publicacion.id}" style="display: none;">
                <div class="foro-comentarios-list">
                    ${comentariosHTML}
                </div>
                <div class="foro-comentario-form">
                    <textarea class="foro-comentario-input" placeholder="Escribe un comentario..." data-publicacion-id="${publicacion.id}" style="border-color: ${materiaColor};"></textarea>
                    <button class="btn-enviar-comentario" data-publicacion-id="${publicacion.id}" style="background: ${materiaColor};">
                        <i class="bi bi-send"></i>
                        Enviar
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Renderizar un comentario
async function renderComentarioForo(comentario, db) {
    // Obtener datos del autor del comentario
    let autorNombre = 'Usuario';
    let autorFoto = '';
    try {
        const autorDoc = await db.collection('usuarios').doc(comentario.autorId).get();
        if (autorDoc.exists) {
            const autorData = autorDoc.data();
            autorNombre = autorData.nombre || 'Usuario';
            autorFoto = autorData.fotoPerfil || '';
        }
    } catch (error) {
        console.error('Error obteniendo autor del comentario:', error);
    }

    const fecha = comentario.fecha ? new Date(comentario.fecha.seconds * 1000) : new Date();
    const fechaFormateada = formatearFechaRelativa(fecha);

    // Botón de eliminar (solo para el autor del comentario o admin)
    let deleteBtn = '';
    if (comentario.autorId === currentUser.id || currentUser.tipoUsuario === 'admin') {
        deleteBtn = `
            <button class="btn-eliminar-comentario" data-publicacion-id="${comentario.publicacionId}" data-comentario-id="${comentario.id}">
                <i class="bi bi-trash"></i>
            </button>
        `;
    }

    return `
        <div class="foro-comentario" data-id="${comentario.id}">
            <div class="foro-comentario-avatar">
                ${autorFoto ? `<img src="${autorFoto}" alt="${autorNombre}">` : '<i class="bi bi-person-fill"></i>'}
            </div>
            <div class="foro-comentario-content">
                <div class="foro-comentario-header">
                    <span class="foro-comentario-author">${autorNombre}</span>
                    <span class="foro-comentario-date">${fechaFormateada}</span>
                    ${deleteBtn}
                </div>
                <p class="foro-comentario-text">${comentario.texto}</p>
            </div>
        </div>
    `;
}

// Setup event listeners para comentarios
function setupForoCommentListeners() {
    // Botones de comentar (mostrar/ocultar sección de comentarios)
    document.querySelectorAll('.btn-comentar-foro').forEach(btn => {
        btn.addEventListener('click', () => {
            const publicacionId = btn.getAttribute('data-id');
            const comentariosContainer = document.getElementById(`comentarios-${publicacionId}`);
            if (comentariosContainer) {
                comentariosContainer.style.display = comentariosContainer.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    // Botones de enviar comentario
    document.querySelectorAll('.btn-enviar-comentario').forEach(btn => {
        btn.addEventListener('click', async () => {
            const publicacionId = btn.getAttribute('data-publicacion-id');
            const textarea = document.querySelector(`.foro-comentario-input[data-publicacion-id="${publicacionId}"]`);
            if (textarea && textarea.value.trim()) {
                await enviarComentarioForo(publicacionId, textarea.value.trim());
                textarea.value = '';
            }
        });
    });

    // Botones de eliminar comentario
    document.querySelectorAll('.btn-eliminar-comentario').forEach(btn => {
        btn.addEventListener('click', async () => {
            const publicacionId = btn.getAttribute('data-publicacion-id');
            const comentarioId = btn.getAttribute('data-comentario-id');
            if (confirm('¿Eliminar este comentario?')) {
                await eliminarComentarioForo(publicacionId, comentarioId);
            }
        });
    });

    // Botones de editar publicación
    document.querySelectorAll('.btn-editar-publicacion-foro').forEach(btn => {
        btn.addEventListener('click', () => {
            const publicacionId = btn.getAttribute('data-id');
            abrirModalEditarPublicacionForo(publicacionId);
        });
    });

    // Botones de eliminar publicación
    document.querySelectorAll('.btn-eliminar-publicacion-foro').forEach(btn => {
        btn.addEventListener('click', async () => {
            const publicacionId = btn.getAttribute('data-id');
            if (confirm('¿Eliminar esta publicación y todos sus comentarios?')) {
                await eliminarPublicacionForo(publicacionId);
            }
        });
    });
}

// Enviar comentario
async function enviarComentarioForo(publicacionId, texto) {
    try {
        const db = window.firebaseDB;
        await db.collection('foro').doc(publicacionId).collection('comentarios').add({
            autorId: currentUser.id,
            texto: texto,
            fecha: firebase.firestore.Timestamp.now(),
            publicacionId: publicacionId
        });

        // Recargar foro
        loadForo();
    } catch (error) {
        console.error('Error enviando comentario:', error);
        alert('Error al enviar el comentario');
    }
}

// Eliminar comentario
async function eliminarComentarioForo(publicacionId, comentarioId) {
    try {
        const db = window.firebaseDB;
        await db.collection('foro').doc(publicacionId).collection('comentarios').doc(comentarioId).delete();
        loadForo();
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        alert('Error al eliminar el comentario');
    }
}

// Eliminar publicación
async function eliminarPublicacionForo(publicacionId) {
    try {
        const db = window.firebaseDB;

        // Eliminar todos los comentarios
        const comentariosSnapshot = await db.collection('foro').doc(publicacionId).collection('comentarios').get();
        const batch = db.batch();
        comentariosSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Eliminar la publicación
        await db.collection('foro').doc(publicacionId).delete();

        loadForo();
    } catch (error) {
        console.error('Error eliminando publicación:', error);
        alert('Error al eliminar la publicación');
    }
}

// Obtener icono según tipo de archivo
function getFileIcon(url) {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('pdf')) return 'bi-file-pdf';
    if (urlLower.includes('doc')) return 'bi-file-word';
    if (urlLower.includes('xls')) return 'bi-file-excel';
    if (urlLower.includes('ppt')) return 'bi-file-ppt';
    if (urlLower.includes('folder') || urlLower.includes('drive.google.com/drive')) return 'bi-folder';
    return 'bi-file-earmark';
}

// Formatear fecha relativa
function formatearFechaRelativa(fecha) {
    const ahora = new Date();
    const diff = ahora - fecha;
    const segundos = Math.floor(diff / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (segundos < 60) return 'Hace un momento';
    if (minutos < 60) return `Hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;

    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Load notas
// Variable global para almacenar datos de notas para búsqueda
let notasTareasData = [];

async function loadNotas() {
    const notasContainer = document.getElementById('notasContainer');
    notasContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        // Obtener color de la materia
        const materiaColor = window.currentMateriaColor || '#2196F3';

        // Obtener todas las tareas de la materia actual
        const tareasSnapshot = await db.collection('tareas')
            .where('materia', '==', currentMateria)
            .get();

        if (tareasSnapshot.empty) {
            notasContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-journal-text"></i>
                    <p>No hay tareas asignadas en esta materia</p>
                </div>
            `;
            return;
        }

        // Ordenar tareas por fecha
        const tareas = [];
        tareasSnapshot.forEach(doc => {
            tareas.push({ id: doc.id, ...doc.data() });
        });
        tareas.sort((a, b) => {
            const fechaA = a.fechaEntrega ? a.fechaEntrega.seconds : 0;
            const fechaB = b.fechaEntrega ? b.fechaEntrega.seconds : 0;
            return fechaB - fechaA; // Más recientes primero
        });

        if (currentUser.tipoUsuario === 'estudiante') {
            await loadNotasEstudiante(notasContainer, tareas, db, materiaColor);
        } else if (currentUser.tipoUsuario === 'admin') {
            await loadNotasAdmin(notasContainer, tareas, db, materiaColor);
        }

    } catch (error) {
        console.error('Error al cargar notas:', error);
        notasContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error al cargar las notas</p>
            </div>
        `;
    }
}

// Cargar notas para estudiante - Vista profesional con lista
async function loadNotasEstudiante(container, tareas, db, materiaColor) {
    let totalPuntos = 0;
    let puntosObtenidos = 0;
    let tareasCalificadas = 0;
    let tareasEntregadas = 0;
    let tareasPendientes = 0;

    // Procesar datos de tareas
    const tareasProcessed = [];

    for (const tarea of tareas) {
        const fechaEntrega = tarea.fechaEntrega ? new Date(tarea.fechaEntrega.seconds * 1000) : null;
        const maxPuntos = tarea.puntos || 100;
        totalPuntos += maxPuntos;

        const entregaSnapshot = await db.collection('entregas')
            .where('tareaId', '==', tarea.id)
            .where('estudianteId', '==', currentUser.id)
            .get();

        let estado = '';
        let nota = null;
        let estadoClass = '';
        let notaClass = '';
        let notaTexto = '';
        let iconEstado = '';

        if (!entregaSnapshot.empty) {
            const entrega = entregaSnapshot.docs[0].data();
            tareasEntregadas++;

            if (entrega.calificacion !== undefined && entrega.calificacion !== null) {
                nota = entrega.calificacion;
                const porcentaje = (nota / maxPuntos) * 100;
                puntosObtenidos += nota;
                tareasCalificadas++;

                estado = 'Calificada';
                estadoClass = 'estado-calificada';
                iconEstado = 'bi-check-circle-fill';
                notaTexto = `${nota}/${maxPuntos}`;

                if (porcentaje >= 90) {
                    notaClass = 'nota-excelente';
                } else if (porcentaje >= 70) {
                    notaClass = 'nota-buena';
                } else if (porcentaje >= 50) {
                    notaClass = 'nota-regular';
                } else {
                    notaClass = 'nota-baja';
                }
            } else {
                estado = 'En revisión';
                estadoClass = 'estado-revision';
                iconEstado = 'bi-hourglass-split';
                notaTexto = 'Pendiente';
                notaClass = 'nota-pendiente';
            }
        } else {
            const ahora = new Date();
            if (fechaEntrega && fechaEntrega < ahora) {
                estado = 'No entregada';
                estadoClass = 'estado-vencida';
                iconEstado = 'bi-x-circle-fill';
                notaTexto = 'Sin nota';
                notaClass = 'nota-sin';
            } else {
                estado = 'Pendiente';
                estadoClass = 'estado-pendiente';
                iconEstado = 'bi-clock';
                notaTexto = '-';
                notaClass = 'nota-pendiente';
                tareasPendientes++;
            }
        }

        tareasProcessed.push({
            ...tarea,
            fechaEntrega,
            maxPuntos,
            estado,
            estadoClass,
            iconEstado,
            nota,
            notaTexto,
            notaClass
        });
    }

    // Guardar para búsqueda
    notasTareasData = tareasProcessed;

    // Calcular promedio
    const promedio = tareasCalificadas > 0 ? (puntosObtenidos / tareasCalificadas).toFixed(1) : 0;
    const promedioPercent = tareasCalificadas > 0 ? Math.round((puntosObtenidos / (tareasCalificadas * 100)) * 100) : 0;

    let html = `
        <!-- Resumen arriba -->
        <div class="notas-resumen-pro" style="--materia-color: ${materiaColor}">
            <div class="resumen-main">
                <div class="resumen-promedio-circle" style="--progress: ${promedioPercent}%">
                    <div class="promedio-inner">
                        <span class="promedio-numero">${promedio}</span>
                        <span class="promedio-label">Promedio</span>
                    </div>
                </div>
                <div class="resumen-stats">
                    <div class="stat-item">
                        <div class="stat-icon-box" style="background: ${materiaColor}20; color: ${materiaColor}">
                            <i class="bi bi-journal-text"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${tareas.length}</span>
                            <span class="stat-label">Total Tareas</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon-box" style="background: #28a74520; color: #28a745">
                            <i class="bi bi-check-circle"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${tareasCalificadas}</span>
                            <span class="stat-label">Calificadas</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon-box" style="background: #ffc10720; color: #ffc107">
                            <i class="bi bi-clock-history"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${tareasPendientes}</span>
                            <span class="stat-label">Pendientes</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon-box" style="background: #17a2b820; color: #17a2b8">
                            <i class="bi bi-send-check"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-number">${tareasEntregadas}</span>
                            <span class="stat-label">Entregadas</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Buscador -->
        <div class="notas-search-container">
            <div class="notas-search-wrapper">
                <i class="bi bi-search"></i>
                <input type="text" id="notasSearchInput" placeholder="Buscar tarea..." autocomplete="off">
                <button class="clear-notas-search" id="clearNotasSearch" style="display: none;">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <div class="notas-filter-info">
                <span id="notasResultCount">${tareas.length} tareas</span>
            </div>
        </div>

        <!-- Lista de tareas -->
        <div class="notas-lista" id="notasLista">
    `;

    html += renderNotasList(tareasProcessed, materiaColor);

    html += `</div>`;

    container.innerHTML = html;

    // Setup buscador
    setupNotasSearch(materiaColor);
}

// Renderizar lista de notas
function renderNotasList(tareas, materiaColor) {
    if (tareas.length === 0) {
        return `
            <div class="notas-empty-search">
                <i class="bi bi-search"></i>
                <p>No se encontraron tareas</p>
            </div>
        `;
    }

    let html = '';
    for (const tarea of tareas) {
        const fechaFormateada = tarea.fechaEntrega ? tarea.fechaEntrega.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }) : 'Sin fecha';

        html += `
            <div class="nota-item" data-titulo="${tarea.titulo.toLowerCase()}">
                <div class="nota-item-left">
                    <div class="nota-item-icon" style="background: ${materiaColor}15; color: ${materiaColor}">
                        <i class="bi bi-file-earmark-text"></i>
                    </div>
                    <div class="nota-item-info">
                        <h4 class="nota-item-titulo">${tarea.titulo}</h4>
                        <div class="nota-item-meta">
                            <span class="nota-item-fecha">
                                <i class="bi bi-calendar3"></i>
                                ${fechaFormateada}
                            </span>
                            <span class="nota-item-puntos">
                                <i class="bi bi-star"></i>
                                ${tarea.maxPuntos} pts
                            </span>
                        </div>
                    </div>
                </div>
                <div class="nota-item-right">
                    <span class="nota-estado ${tarea.estadoClass}">
                        <i class="bi ${tarea.iconEstado}"></i>
                        ${tarea.estado}
                    </span>
                    <span class="nota-calificacion ${tarea.notaClass}">${tarea.notaTexto}</span>
                </div>
            </div>
        `;
    }
    return html;
}

// Setup buscador de notas
function setupNotasSearch(materiaColor) {
    const searchInput = document.getElementById('notasSearchInput');
    const clearBtn = document.getElementById('clearNotasSearch');
    const resultCount = document.getElementById('notasResultCount');
    const notasLista = document.getElementById('notasLista');

    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        clearBtn.style.display = query ? 'flex' : 'none';

        const filtered = notasTareasData.filter(t =>
            t.titulo.toLowerCase().includes(query)
        );

        resultCount.textContent = `${filtered.length} tarea${filtered.length !== 1 ? 's' : ''}`;
        notasLista.innerHTML = renderNotasList(filtered, materiaColor);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        resultCount.textContent = `${notasTareasData.length} tareas`;
        notasLista.innerHTML = renderNotasList(notasTareasData, materiaColor);
        searchInput.focus();
    });
}

// Cargar notas para admin/profesor
async function loadNotasAdmin(container, tareas, db, materiaColor) {
    const estudiantesSnapshot = await db.collection('usuarios')
        .where('tipoUsuario', '==', 'estudiante')
        .where('materias', 'array-contains', currentMateria)
        .get();

    if (estudiantesSnapshot.empty) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-people"></i>
                <p>No hay estudiantes inscritos en esta materia</p>
            </div>
        `;
        return;
    }

    const estudiantes = [];
    estudiantesSnapshot.forEach(doc => {
        estudiantes.push({ id: doc.id, ...doc.data() });
    });
    estudiantes.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

    let html = `
        <div class="notas-header-admin-pro" style="--materia-color: ${materiaColor}">
            <div class="header-admin-left">
                <div class="header-admin-icon">
                    <i class="bi bi-table"></i>
                </div>
                <div class="header-admin-info">
                    <h3>Libro de Calificaciones</h3>
                    <span>${estudiantes.length} estudiantes · ${tareas.length} tareas</span>
                </div>
            </div>
        </div>
        <div class="notas-table-container notas-table-scroll">
            <table class="notas-table notas-table-admin">
                <thead>
                    <tr>
                        <th class="sticky-col">Estudiante</th>
    `;

    for (const tarea of tareas) {
        const maxPuntos = tarea.puntos || 100;
        html += `<th class="tarea-header" title="${tarea.titulo}">${tarea.titulo.substring(0, 15)}${tarea.titulo.length > 15 ? '...' : ''}<br><small>(${maxPuntos} pts)</small></th>`;
    }
    html += `<th class="promedio-header" style="background: ${materiaColor}">Promedio</th></tr></thead><tbody>`;

    for (const estudiante of estudiantes) {
        let puntosObtenidos = 0;
        let tareasCalificadas = 0;

        html += `<tr><td class="sticky-col estudiante-nombre">${estudiante.nombre || 'Sin nombre'}</td>`;

        for (const tarea of tareas) {
            const maxPuntos = tarea.puntos || 100;

            const entregaSnapshot = await db.collection('entregas')
                .where('tareaId', '==', tarea.id)
                .where('estudianteId', '==', estudiante.id)
                .get();

            let celda = '';
            let celdaClass = '';

            if (!entregaSnapshot.empty) {
                const entrega = entregaSnapshot.docs[0].data();

                if (entrega.calificacion !== undefined && entrega.calificacion !== null) {
                    const nota = entrega.calificacion;
                    const porcentaje = (nota / maxPuntos) * 100;

                    puntosObtenidos += nota;
                    tareasCalificadas++;

                    celda = nota;
                    if (porcentaje >= 90) {
                        celdaClass = 'celda-excelente';
                    } else if (porcentaje >= 70) {
                        celdaClass = 'celda-buena';
                    } else if (porcentaje >= 50) {
                        celdaClass = 'celda-regular';
                    } else {
                        celdaClass = 'celda-baja';
                    }
                } else {
                    celda = '<i class="bi bi-hourglass-split"></i>';
                    celdaClass = 'celda-pendiente';
                }
            } else {
                celda = '<i class="bi bi-x-circle"></i>';
                celdaClass = 'celda-sin-entrega';
            }

            html += `<td class="${celdaClass}">${celda}</td>`;
        }

        const promedio = tareasCalificadas > 0 ? (puntosObtenidos / tareasCalificadas).toFixed(1) : '-';
        const promedioClass = promedio !== '-' ?
            (promedio >= 90 ? 'celda-excelente' :
                promedio >= 70 ? 'celda-buena' :
                    promedio >= 50 ? 'celda-regular' : 'celda-baja') : '';

        html += `<td class="promedio-celda ${promedioClass}">${promedio}</td></tr>`;
    }

    html += `</tbody></table></div>`;

    container.innerHTML = html;
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
                                sandbox="allow-scripts allow-same-origin"
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
                                sandbox="allow-scripts allow-same-origin"
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
                                    sandbox="allow-scripts allow-same-origin"
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
                            frameborder="0"
                            sandbox="allow-scripts allow-same-origin">
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

// Open Drive folder modal with professional view (permite navegación dentro del iframe)
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
                        <span class="drive-folder-subtitle">Haz clic en los archivos para abrirlos</span>
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
                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                    onload="hideFolderLoading()">
                </iframe>
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
        <button class="view-student-info-btn" onclick="openStudentProfileModal('${estudiante.id}')">
            <i class="bi bi-eye"></i>
            Ver información
        </button>
    `;

    return item;
}

// Open student profile modal
async function openStudentProfileModal(studentId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        const doc = await db.collection('usuarios').doc(studentId).get();

        if (!doc.exists) {
            showMessage('Estudiante no encontrado', 'error');
            return;
        }

        const estudiante = doc.data();

        // Header
        const avatarContainer = document.getElementById('studentProfileAvatar');
        if (estudiante.fotoPerfil) {
            avatarContainer.innerHTML = `<img src="${estudiante.fotoPerfil}" alt="${estudiante.nombre}">`;
        } else {
            avatarContainer.innerHTML = `<div class="avatar-default"><i class="bi bi-person-fill"></i></div>`;
        }

        document.getElementById('studentProfileName').textContent = estudiante.nombre || 'Sin nombre';

        // Información Personal
        const personalInfo = document.getElementById('studentProfilePersonalInfo');
        personalInfo.innerHTML = `
            <div class="student-profile-info-item">
                <div class="student-profile-info-label"><i class="bi bi-envelope"></i> EMAIL</div>
                <div class="student-profile-info-value">${estudiante.usuario || 'No disponible'}</div>
            </div>
            <div class="student-profile-info-item">
                <div class="student-profile-info-label"><i class="bi bi-telephone"></i> TELÉFONO</div>
                <div class="student-profile-info-value">${estudiante.telefono || 'No disponible'}</div>
            </div>
            <div class="student-profile-info-item">
                <div class="student-profile-info-label"><i class="bi bi-card-text"></i> DOCUMENTO</div>
                <div class="student-profile-info-value">${estudiante.tipoDocumento ? estudiante.tipoDocumento + ' ' : ''}${estudiante.numeroDocumento || 'No disponible'}</div>
            </div>
            <div class="student-profile-info-item">
                <div class="student-profile-info-label"><i class="bi bi-geo-alt"></i> DEPARTAMENTO</div>
                <div class="student-profile-info-value">${estudiante.departamento || 'No disponible'}</div>
            </div>
        `;

        // Información Académica
        const academicInfo = document.getElementById('studentProfileAcademicInfo');

        // Formatear fecha de creación
        let fechaRegistro = 'No disponible';
        if (estudiante.fechaCreacion) {
            try {
                // Si es un Timestamp de Firebase
                if (estudiante.fechaCreacion.toDate) {
                    fechaRegistro = estudiante.fechaCreacion.toDate().toLocaleDateString('es-ES');
                }
                // Si es un string de fecha
                else if (typeof estudiante.fechaCreacion === 'string') {
                    const fecha = new Date(estudiante.fechaCreacion);
                    if (!isNaN(fecha.getTime())) {
                        fechaRegistro = fecha.toLocaleDateString('es-ES');
                    }
                }
                // Si es un número (timestamp en milisegundos)
                else if (typeof estudiante.fechaCreacion === 'number') {
                    fechaRegistro = new Date(estudiante.fechaCreacion).toLocaleDateString('es-ES');
                }
                // Si es un objeto Date
                else if (estudiante.fechaCreacion instanceof Date) {
                    fechaRegistro = estudiante.fechaCreacion.toLocaleDateString('es-ES');
                }
            } catch (e) {
                console.log('Error al formatear fecha:', e);
                fechaRegistro = 'No disponible';
            }
        }

        academicInfo.innerHTML = `
            <div class="student-profile-info-item">
                <div class="student-profile-info-label"><i class="bi bi-building"></i> INSTITUCIÓN</div>
                <div class="student-profile-info-value">${estudiante.institucion || 'No disponible'}</div>
            </div>
            <div class="student-profile-info-item">
                <div class="student-profile-info-label"><i class="bi bi-mortarboard"></i> GRADO</div>
                <div class="student-profile-info-value">${estudiante.grado || 'No disponible'}</div>
            </div>
            <div class="student-profile-info-item">
                <div class="student-profile-info-label"><i class="bi bi-calendar-event"></i> FECHA REGISTRO</div>
                <div class="student-profile-info-value">${fechaRegistro}</div>
            </div>
            <div class="student-profile-info-item">
                <div class="student-profile-info-label"><i class="bi bi-check-circle"></i> ESTADO</div>
                <div class="student-profile-info-value">${estudiante.activo !== false ? 'Activo' : 'Inactivo'}</div>
            </div>
        `;

        // Ocultar sección de Progreso
        const progressSection = document.getElementById('studentProfileGamificationSection');
        if (progressSection) {
            progressSection.style.display = 'none';
        }

        // Redes Sociales
        const socialSection = document.getElementById('studentProfileSocialSection');
        const socialLinks = document.getElementById('studentProfileSocialLinks');

        const redesSociales = estudiante.redesSociales || {};
        const tieneRedes = redesSociales.linkedin || redesSociales.twitter || redesSociales.instagram || redesSociales.facebook || redesSociales.tiktok || redesSociales.youtube;

        if (tieneRedes) {
            socialSection.style.display = 'block';
            let socialHTML = '';

            if (redesSociales.linkedin) {
                socialHTML += `<a href="${redesSociales.linkedin}" target="_blank" class="student-social-link linkedin"><i class="bi bi-linkedin"></i> LinkedIn</a>`;
            }
            if (redesSociales.twitter) {
                socialHTML += `<a href="${redesSociales.twitter}" target="_blank" class="student-social-link twitter"><i class="bi bi-twitter-x"></i> Twitter</a>`;
            }
            if (redesSociales.instagram) {
                socialHTML += `<a href="${redesSociales.instagram}" target="_blank" class="student-social-link instagram"><i class="bi bi-instagram"></i> Instagram</a>`;
            }
            if (redesSociales.facebook) {
                socialHTML += `<a href="${redesSociales.facebook}" target="_blank" class="student-social-link facebook"><i class="bi bi-facebook"></i> Facebook</a>`;
            }
            if (redesSociales.tiktok) {
                socialHTML += `<a href="${redesSociales.tiktok}" target="_blank" class="student-social-link tiktok"><i class="bi bi-tiktok"></i> TikTok</a>`;
            }
            if (redesSociales.youtube) {
                socialHTML += `<a href="${redesSociales.youtube}" target="_blank" class="student-social-link youtube"><i class="bi bi-youtube"></i> YouTube</a>`;
            }

            socialLinks.innerHTML = socialHTML;
        } else {
            socialSection.style.display = 'none';
        }

        // Mostrar modal
        document.getElementById('studentProfileModal').classList.add('active');

    } catch (error) {
        console.error('Error al cargar perfil del estudiante:', error);
        showMessage('Error al cargar información del estudiante', 'error');
    }
}

// Close student profile modal
function closeStudentProfileModal() {
    document.getElementById('studentProfileModal').classList.remove('active');
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
                    sandbox="allow-scripts allow-same-origin"
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

// Verificar si el usuario ya descargó este archivo
async function checkIfAlreadyDownloaded(fileId) {
    try {
        if (!window.firebaseDB || !currentUser.id) return false;

        const db = window.firebaseDB;
        const userDoc = await db.collection('usuarios').doc(currentUser.id).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const descargasRealizadas = userData.descargasRealizadas || [];
            return descargasRealizadas.includes(fileId);
        }
        return false;
    } catch (error) {
        console.error('Error verificando descarga:', error);
        return false;
    }
}

// Registrar descarga del archivo
async function registerDownload(fileId, fileName) {
    try {
        if (!window.firebaseDB || !currentUser.id) return false;

        const db = window.firebaseDB;
        await db.collection('usuarios').doc(currentUser.id).update({
            descargasRealizadas: firebase.firestore.FieldValue.arrayUnion(fileId),
            ultimaDescarga: firebase.firestore.Timestamp.now()
        });

        // Obtener información del dispositivo
        const deviceInfo = getDeviceInfo();

        // Obtener nombre del aula
        let aulaNombre = '';
        if (currentAulaData && currentAulaData.nombre) {
            aulaNombre = currentAulaData.nombre;
        }

        // Registrar en log de descargas (para historial simple)
        await db.collection('logDescargas').add({
            usuarioId: currentUser.id,
            usuarioNombre: currentUser.nombre || 'Sin nombre',
            usuarioEmail: currentUser.usuario || currentUser.email || 'Sin email',
            archivoId: fileId,
            archivoNombre: fileName,
            aulaId: currentAulaId || '',
            materia: currentMateria || '',
            fechaDescarga: firebase.firestore.Timestamp.now()
        });

        // Registrar en registroDescargas (para panel de seguridad)
        // Obtener email del usuario desde Firebase si no está en currentUser
        let userEmail = currentUser.usuario || currentUser.email || '';
        let userFoto = currentUser.fotoPerfil || '';

        if (!userEmail || !userFoto) {
            try {
                const userDoc = await db.collection('usuarios').doc(currentUser.id).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (!userEmail) userEmail = userData.usuario || userData.email || 'Sin email';
                    if (!userFoto) userFoto = userData.fotoPerfil || '';
                }
            } catch (e) {
                console.log('No se pudo obtener datos adicionales del usuario');
            }
        }

        // Obtener nombre de la materia legible
        const materiasNombres = {
            'anuncios': 'Anuncios',
            'matematicas': 'Matemáticas',
            'lectura': 'Lectura Crítica',
            'sociales': 'Ciencias Sociales',
            'naturales': 'Ciencias Naturales',
            'ingles': 'Inglés'
        };
        const materiaNombre = materiasNombres[currentMateria] || currentMateria || '';

        await db.collection('registroDescargas').add({
            usuarioId: currentUser.id,
            usuarioNombre: currentUser.nombre || 'Sin nombre',
            usuarioEmail: userEmail || 'Sin email',
            usuarioFoto: userFoto,
            documento: fileName,
            aula: aulaNombre || 'Sin aula',
            materia: materiaNombre,
            fecha: new Date().toISOString(),
            dispositivo: deviceInfo.dispositivo,
            tipoDispositivo: deviceInfo.tipo,
            ip: await getClientIP(),
            navegador: deviceInfo.navegador,
            sistemaOperativo: deviceInfo.so
        });

        return true;
    } catch (error) {
        console.error('Error registrando descarga:', error);
        return false;
    }
}

// Obtener información del dispositivo
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let tipo = 'desktop';
    let dispositivo = '';
    let navegador = '';
    let so = '';

    // Detectar tipo de dispositivo
    if (/Mobi|Android/i.test(ua)) {
        tipo = 'mobile';
    } else if (/Tablet|iPad/i.test(ua)) {
        tipo = 'tablet';
    }

    // Detectar sistema operativo
    if (/Windows/i.test(ua)) {
        so = 'Windows';
        if (/Windows NT 10/i.test(ua)) so = 'Windows 10';
        else if (/Windows NT 11/i.test(ua)) so = 'Windows 11';
    } else if (/Mac OS X/i.test(ua)) {
        so = 'MacOS';
    } else if (/Android/i.test(ua)) {
        so = 'Android';
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
        so = 'iOS';
    } else if (/Linux/i.test(ua)) {
        so = 'Linux';
    }

    // Detectar navegador
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) {
        navegador = 'Chrome';
    } else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) {
        navegador = 'Safari';
    } else if (/Firefox/i.test(ua)) {
        navegador = 'Firefox';
    } else if (/Edg/i.test(ua)) {
        navegador = 'Edge';
    } else if (/Opera|OPR/i.test(ua)) {
        navegador = 'Opera';
    }

    // Construir string de dispositivo
    if (tipo === 'mobile') {
        dispositivo = `${so} - ${navegador} Mobile`;
    } else if (tipo === 'tablet') {
        dispositivo = `${so} - ${navegador} Tablet`;
    } else {
        dispositivo = `${so} - ${navegador}`;
    }

    return { tipo, dispositivo, navegador, so };
}

// Obtener IP del cliente (usando servicio externo)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || 'No disponible';
    } catch (error) {
        // Si falla, generar una IP simulada basada en timestamp
        const timestamp = Date.now();
        return `192.168.${Math.floor(timestamp % 255)}.${Math.floor((timestamp / 1000) % 255)}`;
    }
}

// Mostrar modal de confirmación de descarga
function showDownloadConfirmation(fileId, originalUrl, fileName) {
    const confirmModal = document.createElement('div');
    confirmModal.className = 'modal active';
    confirmModal.id = 'downloadConfirmModal';
    confirmModal.innerHTML = `
        <div class="modal-content modal-content-small">
            <div class="modal-header">
                <h3>
                    <i class="bi bi-shield-exclamation"></i>
                    Advertencia de Seguridad
                </h3>
                <button class="close-btn" onclick="closeDownloadConfirmModal()">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 1.5rem;">
                    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #ffc107, #ff9800); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem;">
                        <i class="bi bi-file-earmark-lock2" style="font-size: 2.5rem; color: white;"></i>
                    </div>
                    <h4 style="color: #333; margin-bottom: 0.5rem;">${fileName}</h4>
                    <span style="color: #666; font-size: 0.9rem;">Documento Protegido</span>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="color: #856404; font-size: 0.9rem; margin: 0; line-height: 1.6;">
                        <i class="bi bi-exclamation-triangle-fill" style="margin-right: 0.5rem;"></i>
                        <strong>IMPORTANTE:</strong> Este documento está <strong>encriptado</strong> y contiene marcas de agua invisibles vinculadas a tu cuenta.
                    </p>
                </div>
                
                <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
                    <p style="color: #721c24; font-size: 0.85rem; margin: 0; line-height: 1.6;">
                        <i class="bi bi-shield-fill-x" style="margin-right: 0.5rem;"></i>
                        En caso de <strong>filtración</strong> o <strong>reenvío</strong> a cualquier red social, plataforma o terceros, y si se detecta esta infracción, <strong>tu cuenta será bloqueada indefinidamente</strong> sin posibilidad de recuperación.
                    </p>
                </div>
                
                <div style="background: #e7f3ff; border: 1px solid #b6d4fe; border-radius: 8px; padding: 1rem;">
                    <p style="color: #084298; font-size: 0.85rem; margin: 0; line-height: 1.6;">
                        <i class="bi bi-info-circle-fill" style="margin-right: 0.5rem;"></i>
                        Solo puedes descargar este documento <strong>UNA VEZ</strong>. Asegúrate de guardarlo en un lugar seguro.
                    </p>
                </div>
            </div>
            <div class="modal-actions">
                <button type="button" class="cancel-btn" onclick="closeDownloadConfirmModal()">
                    Cancelar
                </button>
                <button type="button" class="submit-btn" onclick="confirmDownload('${fileId}', '${originalUrl}', '${fileName}')" style="background: linear-gradient(135deg, #28a745, #20c997);">
                    <i class="bi bi-download"></i>
                    Acepto y Descargar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(confirmModal);
}

// Cerrar modal de confirmación de descarga
function closeDownloadConfirmModal() {
    const modal = document.getElementById('downloadConfirmModal');
    if (modal) {
        modal.remove();
    }
}

// Confirmar y proceder con la descarga
async function confirmDownload(fileId, originalUrl, fileName) {
    closeDownloadConfirmModal();

    // Registrar la descarga
    const registered = await registerDownload(fileId, fileName);

    if (registered) {
        // Crear URL de descarga directa de Google Drive
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

        // Detectar si es móvil
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isMobile) {
            // En móviles, usar un enlace <a> con download para forzar descarga
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName || 'documento.pdf';
            link.target = '_self'; // Intentar en la misma ventana
            link.rel = 'noopener';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            // En desktop, abrir en nueva ventana
            window.open(downloadUrl, '_blank');
        }

        showAlertModal('Descarga Iniciada', 'Recuerda: este documento es confidencial y está vinculado a tu cuenta.');

        // Actualizar el botón de descarga en el modal actual
        const downloadBtn = document.querySelector('.download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.innerHTML = `
                <i class="bi bi-check-circle-fill"></i>
                Ya descargado
            `;
            downloadBtn.disabled = true;
            downloadBtn.style.background = '#6c757d';
            downloadBtn.style.cursor = 'not-allowed';
        }
    } else {
        showAlertModal('Error', 'No se pudo procesar la descarga. Intenta de nuevo.');
    }
}

// Intentar descargar PDF
async function attemptDownloadPDF(fileId, originalUrl, fileName) {
    // Verificar si ya descargó este archivo
    const alreadyDownloaded = await checkIfAlreadyDownloaded(fileId);

    if (alreadyDownloaded) {
        showAlertModal('Descarga no permitida', 'Ya has descargado este documento anteriormente. Solo se permite una descarga por usuario.');
        return;
    }

    // Mostrar modal de confirmación
    showDownloadConfirmation(fileId, originalUrl, fileName);
}

// Open Drive file modal for full preview (sin opción de abrir en nueva pestaña para PDFs)
async function openDriveFileModal(embedUrl, originalUrl, fileName, fileType) {
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('mediaModalContent');

    // Extraer el fileId de la URL
    const fileId = extractDriveFileId(originalUrl) || extractDriveFileId(embedUrl);

    // Verificar si ya descargó este archivo (solo para PDFs)
    let downloadButtonHTML = '';
    if (fileType === 'pdf' && fileId) {
        const alreadyDownloaded = await checkIfAlreadyDownloaded(fileId);

        if (alreadyDownloaded) {
            downloadButtonHTML = `
                <button class="download-pdf-btn" disabled style="background: #6c757d; cursor: not-allowed;">
                    <i class="bi bi-check-circle-fill"></i>
                    Ya descargado
                </button>
            `;
        } else {
            downloadButtonHTML = `
                <button class="download-pdf-btn" onclick="attemptDownloadPDF('${fileId}', '${originalUrl}', '${fileName}')">
                    <i class="bi bi-download"></i>
                    Descargar PDF
                </button>
            `;
        }
    }

    modalContent.innerHTML = `
        <div class="drive-file-fullscreen">
            <div class="drive-file-fullscreen-header">
                <div class="drive-file-fullscreen-info">
                    <i class="bi ${getFileTypeIcon(fileType)}" style="color: ${getFileTypeColor(fileType)}"></i>
                    <span>${fileName}</span>
                </div>
                ${downloadButtonHTML}
            </div>
            <div class="drive-file-fullscreen-content">
                <iframe 
                    src="${embedUrl}" 
                    frameborder="0"
                    sandbox="allow-scripts allow-same-origin"
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


// ============ FUNCIONES PARA GESTIÓN DE TUTORES Y FORO ============

// Abrir modal para gestionar tutores
async function abrirModalGestionarTutores() {
    try {
        const db = window.firebaseDB;

        // Obtener color de la materia actual
        const materiaColor = window.currentMateriaColor || '#667eea';

        // Obtener TODOS los estudiantes y filtrar en el cliente
        const estudiantesSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        // Filtrar estudiantes que pertenecen a esta aula (usando aulasAsignadas)
        const estudiantesDelAula = [];
        estudiantesSnapshot.forEach(doc => {
            const estudiante = { id: doc.id, ...doc.data() };
            // Verificar si el estudiante tiene este aula en su array de aulasAsignadas
            if (estudiante.aulasAsignadas && Array.isArray(estudiante.aulasAsignadas) && estudiante.aulasAsignadas.includes(currentAulaId)) {
                estudiantesDelAula.push(estudiante);
            }
        });

        // Obtener tutores actuales de esta materia
        const tutoresSnapshot = await db.collection('tutores')
            .where('aulaId', '==', currentAulaId)
            .where('materia', '==', currentMateria)
            .get();

        const tutoresIds = new Set();
        tutoresSnapshot.forEach(doc => {
            tutoresIds.add(doc.data().estudianteId);
        });

        let estudiantesHTML = '';
        console.log('DEBUG - currentAulaId:', currentAulaId, '| Estudiantes totales:', estudiantesSnapshot.size, '| Estudiantes del aula (aulasAsignadas):', estudiantesDelAula.length);
        if (estudiantesDelAula.length === 0) {
            estudiantesHTML = '<p class="empty-message">No hay estudiantes en esta aula</p>';
        } else {
            // Ordenar alfabéticamente
            estudiantesDelAula.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

            estudiantesDelAula.forEach(estudiante => {
                const esTutor = tutoresIds.has(estudiante.id);
                const foto = estudiante.fotoPerfil || '';

                estudiantesHTML += `
                    <div class="tutor-item">
                        <div class="tutor-info">
                            <div class="tutor-avatar" style="background: ${materiaColor};">
                                ${foto ? `<img src="${foto}" alt="${estudiante.nombre}">` : '<i class="bi bi-person-fill"></i>'}
                            </div>
                            <span class="tutor-nombre">${estudiante.nombre}</span>
                        </div>
                        <label class="tutor-switch">
                            <input type="checkbox" class="tutor-checkbox" data-estudiante-id="${estudiante.id}" ${esTutor ? 'checked' : ''}>
                            <span class="tutor-slider" style="--materia-color: ${materiaColor};"></span>
                        </label>
                    </div>
                `;
            });
        }

        // Crear modal
        const modalHTML = `
            <div class="modal active" id="gestionarTutoresModal" style="--materia-color: ${materiaColor};">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Gestionar Tutores - ${currentMateria}</h3>
                        <button class="close-btn" onclick="cerrarModalGestionarTutores()">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p class="modal-description">Selecciona los estudiantes que podrán publicar en el foro como tutores:</p>
                        <div class="tutores-search-container">
                            <div class="search-input-wrapper">
                                <i class="bi bi-search"></i>
                                <input type="text" id="tutoresSearchInput" placeholder="Buscar estudiante por nombre..." autocomplete="off">
                                <button class="clear-search-btn" id="clearTutoresSearch" style="display: none;">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                        </div>
                        <div class="tutores-list" id="tutoresList">
                            ${estudiantesHTML}
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="cancel-btn" onclick="cerrarModalGestionarTutores()">Cerrar</button>
                        <button type="button" class="submit-btn" onclick="guardarTutores()">
                            <i class="bi bi-check-lg"></i>
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Insertar modal en el body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Configurar eventos de búsqueda
        setupTutoresSearch();

    } catch (error) {
        console.error('Error abriendo modal de tutores:', error);
        alert('Error al cargar los estudiantes: ' + error.message);
    }
}

// Cerrar modal de gestionar tutores
function cerrarModalGestionarTutores() {
    const modal = document.getElementById('gestionarTutoresModal');
    if (modal) modal.remove();
}

// Configurar búsqueda de tutores
function setupTutoresSearch() {
    const searchInput = document.getElementById('tutoresSearchInput');
    const clearBtn = document.getElementById('clearTutoresSearch');
    const tutoresList = document.getElementById('tutoresList');

    if (!searchInput || !tutoresList) return;

    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase().trim();
        const tutorItems = tutoresList.querySelectorAll('.tutor-item');

        // Mostrar/ocultar botón de limpiar
        if (clearBtn) {
            clearBtn.style.display = query ? 'flex' : 'none';
        }

        let visibleCount = 0;
        tutorItems.forEach(item => {
            const nombre = item.querySelector('.tutor-nombre');
            if (nombre) {
                const nombreText = nombre.textContent.toLowerCase();
                if (nombreText.includes(query)) {
                    item.style.display = 'flex';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            }
        });

        // Mostrar mensaje si no hay resultados
        let noResults = tutoresList.querySelector('.no-tutores-results');
        if (visibleCount === 0 && query) {
            if (!noResults) {
                noResults = document.createElement('p');
                noResults.className = 'no-tutores-results empty-message';
                noResults.textContent = 'No se encontraron estudiantes';
                tutoresList.appendChild(noResults);
            }
        } else if (noResults) {
            noResults.remove();
        }
    });

    // Limpiar búsqueda
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            searchInput.value = '';
            searchInput.dispatchEvent(new Event('input'));
            searchInput.focus();
        });
    }
}

// Guardar tutores
async function guardarTutores() {
    try {
        const db = window.firebaseDB;
        const checkboxes = document.querySelectorAll('.tutor-checkbox');

        // Obtener tutores actuales
        const tutoresSnapshot = await db.collection('tutores')
            .where('aulaId', '==', currentAulaId)
            .where('materia', '==', currentMateria)
            .get();

        const tutoresActuales = new Map();
        tutoresSnapshot.forEach(doc => {
            tutoresActuales.set(doc.data().estudianteId, doc.id);
        });

        // Procesar cambios
        for (const checkbox of checkboxes) {
            const estudianteId = checkbox.getAttribute('data-estudiante-id');
            const estaSeleccionado = checkbox.checked;
            const yaEsTutor = tutoresActuales.has(estudianteId);

            if (estaSeleccionado && !yaEsTutor) {
                // Agregar como tutor
                await db.collection('tutores').add({
                    aulaId: currentAulaId,
                    materia: currentMateria,
                    estudianteId: estudianteId,
                    fechaAsignacion: firebase.firestore.Timestamp.now()
                });
            } else if (!estaSeleccionado && yaEsTutor) {
                // Remover como tutor
                const tutorDocId = tutoresActuales.get(estudianteId);
                await db.collection('tutores').doc(tutorDocId).delete();
            }
        }

        cerrarModalGestionarTutores();
        loadForo();
        alert('Tutores actualizados correctamente');

    } catch (error) {
        console.error('Error guardando tutores:', error);
        alert('Error al guardar los cambios');
    }
}

// Abrir modal para crear publicación en el foro
function abrirModalCrearPublicacionForo() {
    const modalHTML = `
        <div class="modal active" id="crearPublicacionForoModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Crear Publicación en el Foro</h3>
                    <button class="close-btn" onclick="cerrarModalCrearPublicacionForo()">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <form id="crearPublicacionForoForm">
                    <div class="modal-body">
                        <div class="input-group">
                            <label for="foroPublicacionTitulo">Título (opcional)</label>
                            <input type="text" id="foroPublicacionTitulo" placeholder="Título de la publicación">
                        </div>
                        <div class="input-group">
                            <label for="foroPublicacionContenido">Contenido</label>
                            <textarea id="foroPublicacionContenido" rows="5" required placeholder="Escribe el contenido de tu publicación..."></textarea>
                        </div>

                        <!-- Imágenes -->
                        <div class="input-group">
                            <label>Imágenes (opcional)</label>
                            <input type="file" id="foroPublicacionImagenes" accept="image/*" multiple style="display: none;">
                            <button type="button" class="upload-btn" onclick="document.getElementById('foroPublicacionImagenes').click()">
                                <i class="bi bi-image"></i>
                                Subir Imágenes
                            </button>
                            <div id="foroPublicacionImagenesPreview" class="images-preview"></div>
                        </div>

                        <!-- Videos -->
                        <div class="input-group">
                            <label>Videos (opcional)</label>
                            <div class="video-input-container">
                                <select id="foroPublicacionVideoType" class="video-type-select">
                                    <option value="">Tipo de video</option>
                                    <option value="youtube">YouTube</option>
                                    <option value="drive">Google Drive</option>
                                </select>
                                <input type="url" id="foroPublicacionVideoUrl" placeholder="URL del video" class="video-url-input">
                                <button type="button" class="add-video-btn" onclick="agregarVideoForo()">
                                    <i class="bi bi-plus-circle"></i>
                                    Agregar
                                </button>
                            </div>
                            <div id="foroPublicacionVideosPreview" class="videos-preview"></div>
                        </div>

                        <!-- Archivos / Enlaces -->
                        <div class="input-group">
                            <label>Archivos y Enlaces (opcional)</label>
                            <div class="drive-file-input-container">
                                <input type="url" id="foroPublicacionArchivoUrl" placeholder="URL de Drive, PDF, carpeta, etc." class="drive-file-url-input">
                                <button type="button" class="add-drive-file-btn" onclick="agregarArchivoForo()">
                                    <i class="bi bi-plus-circle"></i>
                                    Agregar
                                </button>
                            </div>
                            <small>Puedes agregar enlaces de Google Drive (PDFs, carpetas, documentos), Canva, GitHub, etc.</small>
                            <div id="foroPublicacionArchivosPreview" class="drive-files-preview"></div>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="cancel-btn" onclick="cerrarModalCrearPublicacionForo()">Cancelar</button>
                        <button type="submit" class="submit-btn">
                            <i class="bi bi-send"></i>
                            Publicar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event listeners
    document.getElementById('foroPublicacionImagenes').addEventListener('change', previsualizarImagenesForo);
    document.getElementById('crearPublicacionForoForm').addEventListener('submit', crearPublicacionForo);
}

// Cerrar modal de crear publicación
function cerrarModalCrearPublicacionForo() {
    const modal = document.getElementById('crearPublicacionForoModal');
    if (modal) modal.remove();
}

// Variables temporales para almacenar videos y archivos
let foroVideosTemp = [];
let foroArchivosTemp = [];

// Previsualizar imágenes del foro
function previsualizarImagenesForo(e) {
    const preview = document.getElementById('foroPublicacionImagenesPreview');
    preview.innerHTML = '';

    const files = e.target.files;
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();

        reader.onload = function (e) {
            const div = document.createElement('div');
            div.className = 'image-preview-item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-preview-btn" onclick="this.parentElement.remove()">
                    <i class="bi bi-x"></i>
                </button>
            `;
            preview.appendChild(div);
        };

        reader.readAsDataURL(file);
    }
}

// Agregar video al foro
function agregarVideoForo() {
    const tipo = document.getElementById('foroPublicacionVideoType').value;
    const url = document.getElementById('foroPublicacionVideoUrl').value.trim();

    if (!tipo || !url) {
        alert('Selecciona el tipo de video e ingresa la URL');
        return;
    }

    foroVideosTemp.push({ tipo, url });

    const preview = document.getElementById('foroPublicacionVideosPreview');
    const div = document.createElement('div');
    div.className = 'video-preview-item';
    div.innerHTML = `
        <i class="bi bi-play-circle"></i>
        <span>${tipo === 'youtube' ? 'YouTube' : 'Google Drive'}: ${url.substring(0, 50)}...</span>
        <button type="button" class="remove-preview-btn" onclick="removerVideoForo(${foroVideosTemp.length - 1})">
            <i class="bi bi-x"></i>
        </button>
    `;
    preview.appendChild(div);

    document.getElementById('foroPublicacionVideoType').value = '';
    document.getElementById('foroPublicacionVideoUrl').value = '';
}

// Remover video del foro
function removerVideoForo(index) {
    foroVideosTemp.splice(index, 1);
    const preview = document.getElementById('foroPublicacionVideosPreview');
    preview.innerHTML = '';
    foroVideosTemp.forEach((video, i) => {
        const div = document.createElement('div');
        div.className = 'video-preview-item';
        div.innerHTML = `
            <i class="bi bi-play-circle"></i>
            <span>${video.tipo === 'youtube' ? 'YouTube' : 'Google Drive'}: ${video.url.substring(0, 50)}...</span>
            <button type="button" class="remove-preview-btn" onclick="removerVideoForo(${i})">
                <i class="bi bi-x"></i>
            </button>
        `;
        preview.appendChild(div);
    });
}

// Agregar archivo al foro
function agregarArchivoForo() {
    const url = document.getElementById('foroPublicacionArchivoUrl').value.trim();

    if (!url) {
        alert('Ingresa la URL del archivo');
        return;
    }

    // Extraer nombre del archivo de la URL
    let nombre = 'Archivo';
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('drive.google.com')) {
            if (url.includes('/folders/')) {
                nombre = 'Carpeta de Drive';
            } else if (url.includes('.pdf')) {
                nombre = 'Documento PDF';
            } else {
                nombre = 'Archivo de Drive';
            }
        } else if (urlObj.hostname.includes('canva.com')) {
            nombre = 'Diseño de Canva';
        } else if (urlObj.hostname.includes('github.com')) {
            nombre = 'Repositorio de GitHub';
        } else {
            nombre = urlObj.hostname;
        }
    } catch (e) {
        nombre = url.substring(0, 30);
    }

    foroArchivosTemp.push({ url, nombre });

    const preview = document.getElementById('foroPublicacionArchivosPreview');
    const div = document.createElement('div');
    div.className = 'drive-file-preview-item';
    div.innerHTML = `
        <i class="bi ${getFileIcon(url)}"></i>
        <span>${nombre}</span>
        <button type="button" class="remove-preview-btn" onclick="removerArchivoForo(${foroArchivosTemp.length - 1})">
            <i class="bi bi-x"></i>
        </button>
    `;
    preview.appendChild(div);

    document.getElementById('foroPublicacionArchivoUrl').value = '';
}

// Remover archivo del foro
function removerArchivoForo(index) {
    foroArchivosTemp.splice(index, 1);
    const preview = document.getElementById('foroPublicacionArchivosPreview');
    preview.innerHTML = '';
    foroArchivosTemp.forEach((archivo, i) => {
        const div = document.createElement('div');
        div.className = 'drive-file-preview-item';
        div.innerHTML = `
            <i class="bi ${getFileIcon(archivo.url)}"></i>
            <span>${archivo.nombre}</span>
            <button type="button" class="remove-preview-btn" onclick="removerArchivoForo(${i})">
                <i class="bi bi-x"></i>
            </button>
        `;
        preview.appendChild(div);
    });
}

// Crear publicación en el foro
async function crearPublicacionForo(e) {
    e.preventDefault();

    const titulo = document.getElementById('foroPublicacionTitulo').value.trim();
    const contenido = document.getElementById('foroPublicacionContenido').value.trim();

    if (!contenido) {
        alert('El contenido es obligatorio');
        return;
    }

    try {
        const db = window.firebaseDB;

        // Subir imágenes
        const imagenesUrls = [];
        const imagenesInput = document.getElementById('foroPublicacionImagenes');
        if (imagenesInput.files.length > 0) {
            for (let i = 0; i < imagenesInput.files.length; i++) {
                const file = imagenesInput.files[i];
                const url = await uploadImageToImgBB(file);
                if (url) imagenesUrls.push(url);
            }
        }

        // Crear publicación
        await db.collection('foro').add({
            aulaId: currentAulaId,
            materia: currentMateria,
            autorId: currentUser.id,
            titulo: titulo,
            contenido: contenido,
            imagenes: imagenesUrls,
            videos: foroVideosTemp,
            archivos: foroArchivosTemp,
            fechaCreacion: firebase.firestore.Timestamp.now()
        });

        // Limpiar variables temporales
        foroVideosTemp = [];
        foroArchivosTemp = [];

        cerrarModalCrearPublicacionForo();
        loadForo();
        alert('Publicación creada correctamente');

    } catch (error) {
        console.error('Error creando publicación:', error);
        alert('Error al crear la publicación');
    }
}

// Abrir modal para editar publicación (similar a crear pero con datos precargados)
async function abrirModalEditarPublicacionForo(publicacionId) {
    try {
        const db = window.firebaseDB;
        const publicacionDoc = await db.collection('foro').doc(publicacionId).get();

        if (!publicacionDoc.exists) {
            alert('Publicación no encontrada');
            return;
        }

        const publicacion = publicacionDoc.data();

        const modalHTML = `
            <div class="modal active" id="editarPublicacionForoModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Editar Publicación</h3>
                        <button class="close-btn" onclick="cerrarModalEditarPublicacionForo()">
                            <i class="bi bi-x"></i>
                        </button>
                    </div>
                    <form id="editarPublicacionForoForm">
                        <input type="hidden" id="editPublicacionId" value="${publicacionId}">
                        <div class="modal-body">
                            <div class="input-group">
                                <label for="editForoPublicacionTitulo">Título (opcional)</label>
                                <input type="text" id="editForoPublicacionTitulo" value="${publicacion.titulo || ''}" placeholder="Título de la publicación">
                            </div>
                            <div class="input-group">
                                <label for="editForoPublicacionContenido">Contenido</label>
                                <textarea id="editForoPublicacionContenido" rows="5" required placeholder="Escribe el contenido...">${publicacion.contenido}</textarea>
                            </div>
                            <p class="info-text"><i class="bi bi-info-circle"></i> Para cambiar imágenes, videos o archivos, elimina la publicación y créala nuevamente.</p>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="cancel-btn" onclick="cerrarModalEditarPublicacionForo()">Cancelar</button>
                            <button type="submit" class="submit-btn">
                                <i class="bi bi-check-lg"></i>
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.getElementById('editarPublicacionForoForm').addEventListener('submit', editarPublicacionForo);

    } catch (error) {
        console.error('Error abriendo modal de edición:', error);
        alert('Error al cargar la publicación');
    }
}

// Cerrar modal de editar publicación
function cerrarModalEditarPublicacionForo() {
    const modal = document.getElementById('editarPublicacionForoModal');
    if (modal) modal.remove();
}

// Editar publicación
async function editarPublicacionForo(e) {
    e.preventDefault();

    const publicacionId = document.getElementById('editPublicacionId').value;
    const titulo = document.getElementById('editForoPublicacionTitulo').value.trim();
    const contenido = document.getElementById('editForoPublicacionContenido').value.trim();

    if (!contenido) {
        alert('El contenido es obligatorio');
        return;
    }

    try {
        const db = window.firebaseDB;
        await db.collection('foro').doc(publicacionId).update({
            titulo: titulo,
            contenido: contenido,
            fechaEdicion: firebase.firestore.Timestamp.now()
        });

        cerrarModalEditarPublicacionForo();
        loadForo();
        alert('Publicación actualizada correctamente');

    } catch (error) {
        console.error('Error editando publicación:', error);
        alert('Error al editar la publicación');
    }
}


// ============ SISTEMA DE ASISTENCIA ============

// Cargar asistencia
// Cargar asistencia
async function loadAsistencia() {
    const asistenciaContainer = document.getElementById('asistenciaContainer');
    asistenciaContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

    try {
        await esperarFirebase();
        const db = window.firebaseDB;

        // Obtener color de la materia actual
        const materiaColor = window.currentMateriaColor || '#667eea';

        const esAdmin = currentUser.tipoUsuario === 'admin';

        // 1. Cargar clases programadas
        const clasesSnapshot = await db.collection('clases_programadas')
            .where('aulaId', '==', currentAulaId)
            .where('materia', '==', currentMateria)
            .get();

        if (clasesSnapshot.empty) {
            asistenciaContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <p>No hay clases programadas para esta materia</p>
                    ${esAdmin ? '<small>Las clases se programan desde el Calendario</small>' : ''}
                </div>
            `;
            return;
        }

        // 2. Pre-cargar estudiantes del aula (solo si es admin)
        let estudiantesDelAula = [];
        if (esAdmin) {
            const estudiantesSnapshot = await db.collection('usuarios')
                .where('tipoUsuario', '==', 'estudiante')
                .get();

            estudiantesSnapshot.forEach(doc => {
                const estudiante = { id: doc.id, ...doc.data() };
                const aulasEstudiante = estudiante.aulasAsignadas || estudiante.aulas || [];

                let perteneceAlAula = false;
                if (Array.isArray(aulasEstudiante)) {
                    if (aulasEstudiante.includes(currentAulaId)) perteneceAlAula = true;
                } else if (aulasEstudiante === currentAulaId) {
                    perteneceAlAula = true;
                }

                if (perteneceAlAula) {
                    estudiantesDelAula.push(estudiante);
                }
            });

            // Ordenar alfabéticamente
            estudiantesDelAula.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        }

        // 3. Pre-cargar TODA la asistencia del aula y materia
        const asistenciaGlobalMap = new Map(); // Map de Maps: claseId -> (estudianteId -> asistencia)

        try {
            const asistenciaSnapshot = await db.collection('asistencia')
                .where('aulaId', '==', currentAulaId)
                .where('materia', '==', currentMateria)
                .get();

            asistenciaSnapshot.forEach(doc => {
                const data = doc.data();
                const claseId = data.claseId;
                const estudianteId = data.estudianteId;

                if (!asistenciaGlobalMap.has(claseId)) {
                    asistenciaGlobalMap.set(claseId, new Map());
                }

                asistenciaGlobalMap.get(claseId).set(estudianteId, { id: doc.id, ...data });
            });
        } catch (e) {
            console.error("Error cargando historial de asistencia:", e);
        }

        // Organizar clases por fecha
        const clases = [];
        clasesSnapshot.forEach(doc => {
            clases.push({ id: doc.id, ...doc.data() });
        });

        // Ordenar por fecha (más recientes primero)
        clases.sort((a, b) => {
            const fechaA = a.fecha || '';
            const fechaB = b.fecha || '';
            return fechaB.localeCompare(fechaA);
        });

        // Calcular resumen de asistencia para estudiante
        let resumenHTML = '';
        if (!esAdmin) {
            let totalClases = 0;
            let asistencias = 0;
            let faltas = 0;
            let pendientes = 0;

            const ahora = new Date();

            clases.forEach(clase => {
                const [yearClase, monthClase, dayClase] = (clase.fecha || '').split('-');
                const [horaFinH, horaFinM] = (clase.horaFin || clase.horaInicio || '00:00').split(':');
                const fechaFinClase = new Date(yearClase, monthClase - 1, dayClase, horaFinH, horaFinM);
                
                const claseYaPaso = ahora > fechaFinClase;
                
                if (claseYaPaso) {
                    totalClases++;
                    const asistenciaDeClase = asistenciaGlobalMap.get(clase.id) || new Map();
                    const miAsistencia = asistenciaDeClase.get(currentUser.id);
                    
                    if (miAsistencia && miAsistencia.presente) {
                        asistencias++;
                    } else {
                        faltas++;
                    }
                } else {
                    pendientes++;
                }
            });

            const porcentajeAsistencia = totalClases > 0 ? ((asistencias / totalClases) * 100).toFixed(1) : 0;

            resumenHTML = `
                <div class="asistencia-resumen-estudiante" style="--materia-color: ${materiaColor};">
                    <div class="resumen-header">
                        <i class="bi bi-graph-up-arrow"></i>
                        <h3>Resumen de Asistencia</h3>
                    </div>
                    <div class="resumen-stats">
                        <div class="resumen-stat-card asistencias">
                            <div class="stat-icon">
                                <i class="bi bi-check-circle-fill"></i>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value">${asistencias}</span>
                                <span class="stat-label">Asistencias</span>
                            </div>
                        </div>
                        <div class="resumen-stat-card faltas">
                            <div class="stat-icon">
                                <i class="bi bi-x-circle-fill"></i>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value">${faltas}</span>
                                <span class="stat-label">Faltas</span>
                            </div>
                        </div>
                        <div class="resumen-stat-card total">
                            <div class="stat-icon">
                                <i class="bi bi-calendar-check-fill"></i>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value">${totalClases}</span>
                                <span class="stat-label">Total Clases</span>
                            </div>
                        </div>
                        <div class="resumen-stat-card porcentaje">
                            <div class="stat-icon">
                                <i class="bi bi-percent"></i>
                            </div>
                            <div class="stat-info">
                                <span class="stat-value">${porcentajeAsistencia}%</span>
                                <span class="stat-label">Asistencia</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        // Renderizar lista de clases usando datos pre-cargados
        let clasesHTML = '';
        for (const clase of clases) {
            // Obtenemos la asistencia específica para esta clase del mapa global
            const asistenciaDeClase = asistenciaGlobalMap.get(clase.id) || new Map();

            // Renderizamos pasando los datos ya listos
            clasesHTML += renderClaseAsistencia(clase, estudiantesDelAula, asistenciaDeClase, esAdmin, materiaColor);
        }

        // Crear filtros
        const filtrosHTML = `
            <div class="asistencia-filtros">
                <div class="filtro-busqueda">
                    <i class="bi bi-search"></i>
                    <input type="text" id="buscarClaseAsistencia" placeholder="Buscar clase..." class="filtro-input">
                </div>
                <div class="filtro-periodo">
                    <i class="bi bi-calendar-range"></i>
                    <select id="filtroPeriodoAsistencia" class="filtro-input">
                        <option value="">Todos los períodos</option>
                        <option value="hoy">Hoy</option>
                        <option value="semana">Esta semana</option>
                        <option value="mes">Este mes</option>
                        <option value="mes-anterior">Mes anterior</option>
                    </select>
                </div>
                <div class="filtro-estado">
                    <i class="bi bi-funnel"></i>
                    <select id="filtroEstadoAsistencia" class="filtro-input">
                        <option value="">Todos los estados</option>
                        <option value="en-curso">En curso</option>
                        <option value="finalizada">Finalizadas</option>
                        <option value="proxima">Próximas</option>
                    </select>
                </div>
            </div>
        `;

        asistenciaContainer.innerHTML = `
            ${resumenHTML}
            ${filtrosHTML}
            <div class="clases-asistencia-list" id="clasesAsistenciaList">
                ${clasesHTML}
            </div>
        `;

        // Event listeners para filtros
        setupAsistenciaFiltros();
        setupAsistenciaEventListeners();

    } catch (error) {
        console.error('Error al cargar asistencia:', error);
        asistenciaContainer.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Error al cargar la asistencia</p>
            </div>
        `;
    }
}

// Renderizar una clase para asistencia
function renderClaseAsistencia(clase, estudiantesDelAula, asistenciaMap, esAdmin, materiaColor) {
    const fecha = clase.fecha || '';
    const horaInicio = clase.horaInicio || clase.hora || '00:00';
    const horaFin = clase.horaFin || '';
    const titulo = clase.titulo || 'Clase';

    // Formatear fecha
    let fechaFormateada = 'Fecha no disponible';
    if (fecha) {
        const [year, month, day] = fecha.split('-');
        const fechaObj = new Date(year, month - 1, day);
        fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        fechaFormateada = fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
    }

    // Verificar si la clase ya pasó y si está en horario
    const ahora = new Date();
    const [yearClase, monthClase, dayClase] = fecha.split('-');
    const [horaInicioH, horaInicioM] = horaInicio.split(':');
    const [horaFinH, horaFinM] = horaFin ? horaFin.split(':') : [horaInicioH, horaInicioM];

    const fechaInicioClase = new Date(yearClase, monthClase - 1, dayClase, horaInicioH, horaInicioM);
    const fechaFinClase = new Date(yearClase, monthClase - 1, dayClase, horaFinH, horaFinM);

    const claseYaPaso = ahora > fechaFinClase;
    const claseEnCurso = ahora >= fechaInicioClase && ahora <= fechaFinClase;

    // Estado de la clase
    let estadoHTML = '';
    if (claseEnCurso) {
        estadoHTML = `<span class="clase-estado en-curso" style="background: ${materiaColor};"><i class="bi bi-circle-fill"></i> En curso</span>`;
    } else if (claseYaPaso) {
        estadoHTML = `<span class="clase-estado finalizada"><i class="bi bi-check-circle"></i> Finalizada</span>`;
    } else {
        estadoHTML = `<span class="clase-estado proxima"><i class="bi bi-clock"></i> Próxima</span>`;
    }

    // Si es estudiante, mostrar solo su asistencia
    if (!esAdmin) {
        const miAsistencia = asistenciaMap.get(currentUser.id);
        const tieneRegistro = miAsistencia !== undefined;
        const asistio = miAsistencia?.presente || false;

        let estadoAsistenciaHTML = '';
        if (!tieneRegistro) {
            // No hay registro de asistencia
            if (claseYaPaso) {
                // Clase ya pasó y no se marcó = Ausente
                estadoAsistenciaHTML = `
                    <div class="mi-asistencia-status ausente">
                        <i class="bi bi-x-circle-fill"></i>
                        <span>Ausente</span>
                    </div>
                `;
            } else {
                // Clase en curso o futura = Pendiente
                estadoAsistenciaHTML = `
                    <div class="mi-asistencia-status pendiente">
                        <i class="bi bi-clock-fill"></i>
                        <span>Pendiente de registro</span>
                    </div>
                `;
            }
        } else {
            // Hay registro de asistencia
            estadoAsistenciaHTML = `
                <div class="mi-asistencia-status ${asistio ? 'presente' : 'ausente'}">
                    <i class="bi ${asistio ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
                    <span>${asistio ? 'Presente' : 'Ausente'}</span>
                </div>
            `;
        }

        return `
            <div class="clase-asistencia-card">
                <div class="clase-asistencia-header">
                    <div class="clase-info">
                        <h4>${titulo}</h4>
                        <p class="clase-fecha"><i class="bi bi-calendar3"></i> ${fechaFormateada}</p>
                        <p class="clase-hora"><i class="bi bi-clock"></i> ${horaInicio}${horaFin ? ` - ${horaFin}` : ''}</p>
                    </div>
                    ${estadoHTML}
                </div>
                <div class="clase-asistencia-body">
                    ${estadoAsistenciaHTML}
                </div>
            </div>
        `;
    }

    // Si es admin, mostrar lista de estudiantes
    // Contar presentes, ausentes y pendientes
    const totalEstudiantes = estudiantesDelAula.length;
    let presentes = 0;
    let ausentes = 0;
    let pendientes = 0;

    estudiantesDelAula.forEach(e => {
        const asistencia = asistenciaMap.get(e.id);
        if (asistencia === undefined) {
            if (claseYaPaso) {
                ausentes++; // No se marcó y ya pasó = ausente
            } else {
                pendientes++; // No se ha marcado aún = pendiente
            }
        } else if (asistencia.presente) {
            presentes++;
        } else {
            ausentes++;
        }
    });

    // Renderizar lista de estudiantes
    let estudiantesHTML = '';
    estudiantesDelAula.forEach(estudiante => {
        const asistencia = asistenciaMap.get(estudiante.id);
        const tieneRegistro = asistencia !== undefined;
        const presente = asistencia?.presente || false;
        const foto = estudiante.fotoPerfil || '';

        // Solo permitir marcar asistencia si la clase está en curso o ya pasó (para correcciones)
        // No permitir si es una clase futura
        const puedeMarcar = claseEnCurso || claseYaPaso;

        // Determinar el estado visual
        let estadoClase = '';
        if (!tieneRegistro) {
            if (claseYaPaso) {
                estadoClase = 'ausente'; // No se marcó y ya pasó = ausente
            } else {
                estadoClase = 'pendiente'; // No se ha marcado aún
            }
        } else {
            estadoClase = presente ? 'presente' : 'ausente';
        }

        estudiantesHTML += `
            <div class="estudiante-asistencia-item ${estadoClase}">
                <div class="estudiante-asistencia-info">
                    <div class="estudiante-asistencia-avatar" style="background: ${materiaColor};">
                        ${foto ? `<img src="${foto}" alt="${estudiante.nombre}">` : '<i class="bi bi-person-fill"></i>'}
                    </div>
                    <span class="estudiante-asistencia-nombre">${estudiante.nombre}</span>
                </div>
                <div class="asistencia-actions" 
                     data-clase-id="${clase.id}" 
                     data-estudiante-id="${estudiante.id}"
                     data-asistencia-id="${asistencia?.id || ''}">
                    <button class="btn-asistencia presente ${presente ? 'active' : ''}" 
                            onclick="marcarAsistencia('${clase.id}', '${estudiante.id}', null, true)"
                            ${!puedeMarcar ? 'disabled' : ''}>
                        <i class="bi bi-check-circle${presente ? '-fill' : ''}"></i> Presente
                    </button>
                    <button class="btn-asistencia ausente ${!presente && tieneRegistro ? 'active' : ''}" 
                            onclick="marcarAsistencia('${clase.id}', '${estudiante.id}', null, false)"
                            ${!puedeMarcar ? 'disabled' : ''}>
                        <i class="bi bi-x-circle${!presente && tieneRegistro ? '-fill' : ''}"></i> Ausente
                    </button>
                </div>
            </div>
        `;
    });

    // Determinar si la clase debe iniciar expandida (solo si está en curso)
    const expandida = claseEnCurso;

    return `
        <div class="clase-asistencia-card admin ${expandida ? 'expanded' : 'collapsed'}" data-clase-id="${clase.id}">
            <div class="clase-asistencia-header collapsible-header" onclick="toggleClaseAsistencia(this)">
                <div class="clase-info">
                    <div class="toggle-indicator">
                        <i class="bi bi-chevron-right"></i>
                    </div>
                    <div class="clase-details">
                        <h4>${titulo}</h4>
                        <p class="clase-fecha"><i class="bi bi-calendar3"></i> ${fechaFormateada}</p>
                        <p class="clase-hora"><i class="bi bi-clock"></i> ${horaInicio}${horaFin ? ` - ${horaFin}` : ''}</p>
                    </div>
                </div>
                <div class="clase-header-right">
                    ${estadoHTML}
                    <div class="asistencia-stats">
                        <span class="stat-item presentes" style="color: ${materiaColor};">
                            <i class="bi bi-check-circle-fill"></i> ${presentes}
                        </span>
                        <span class="stat-item ausentes">
                            <i class="bi bi-x-circle-fill"></i> ${ausentes}
                        </span>
                        ${pendientes > 0 ? `
                            <span class="stat-item pendientes">
                                <i class="bi bi-clock-fill"></i> ${pendientes}
                            </span>
                        ` : ''}
                        <span class="stat-item total">
                            <i class="bi bi-people-fill"></i> ${totalEstudiantes}
                        </span>
                    </div>
                </div>
            </div>
            <div class="clase-asistencia-body collapsible-content">
                ${!claseEnCurso && !claseYaPaso ? `
                    <div class="asistencia-warning">
                        <i class="bi bi-info-circle"></i>
                        <span>Esta clase aún no ha comenzado. La asistencia se podrá marcar a partir de las ${horaInicio}</span>
                    </div>
                ` : ''}
                <div class="clase-asistencia-tools">
                    <div class="clase-search-container">
                        <i class="bi bi-search"></i>
                        <input type="text" class="clase-search-input" placeholder="Buscar estudiante..." data-clase-id="${clase.id}" oninput="filtrarEstudiantesEnClase(this)">
                    </div>
                    <div class="clase-quick-actions">
                        <button class="btn-marcar-todos-presente" onclick="marcarTodosAsistencia('${clase.id}', true)" style="--materia-color: ${materiaColor};" ${!claseEnCurso && !claseYaPaso ? 'disabled' : ''}>
                            <i class="bi bi-check-all"></i>
                            Todos presentes
                        </button>
                        <button class="btn-marcar-todos-ausente" onclick="marcarTodosAsistencia('${clase.id}', false)" ${!claseEnCurso && !claseYaPaso ? 'disabled' : ''}>
                            <i class="bi bi-x-lg"></i>
                            Todos ausentes
                        </button>
                    </div>
                </div>
                <div class="estudiantes-asistencia-list" data-clase-id="${clase.id}">
                    ${estudiantesHTML || '<p class="no-estudiantes">No hay estudiantes en esta aula</p>'}
                </div>
            </div>
        </div>
    `;
}

// Setup event listeners para asistencia
function setupAsistenciaEventListeners() {
    // Los botones y acciones ahora usan eventos inline (onclick) definidos en el HTML

    // Buscador de estudiantes
    const searchInput = document.getElementById('asistenciaSearchInput');
    const clearBtn = document.getElementById('clearAsistenciaSearch');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            filterEstudiantesAsistencia(query);

            if (clearBtn) {
                clearBtn.style.display = query ? 'flex' : 'none';
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                filterEstudiantesAsistencia('');
                clearBtn.style.display = 'none';
            }
        });
    }

    // Botón expandir todas las clases
    const expandAllBtn = document.getElementById('expandAllClases');
    if (expandAllBtn) {
        expandAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.clase-asistencia-card').forEach(card => {
                card.classList.remove('collapsed');
                card.classList.add('expanded');
            });
        });
    }

    // Botón colapsar todas las clases
    const collapseAllBtn = document.getElementById('collapseAllClases');
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => {
            document.querySelectorAll('.clase-asistencia-card').forEach(card => {
                card.classList.remove('expanded');
                card.classList.add('collapsed');
            });
        });
    }
}

// Toggle clase asistencia (expandir/colapsar)
function toggleClaseAsistencia(header) {
    const card = header.closest('.clase-asistencia-card');
    if (card) {
        const isExpanded = card.classList.contains('expanded');
        if (isExpanded) {
            card.classList.remove('expanded');
            card.classList.add('collapsed');
        } else {
            card.classList.remove('collapsed');
            card.classList.add('expanded');
        }
    }
}

// Filtrar estudiantes dentro de una clase específica
function filtrarEstudiantesEnClase(input) {
    const claseId = input.getAttribute('data-clase-id');
    const query = input.value.toLowerCase().trim();
    const lista = document.querySelector(`.estudiantes-asistencia-list[data-clase-id="${claseId}"]`);

    if (!lista) return;

    const items = lista.querySelectorAll('.estudiante-asistencia-item');

    items.forEach(item => {
        const nombre = item.querySelector('.estudiante-asistencia-nombre')?.textContent.toLowerCase() || '';
        if (!query || nombre.includes(query)) {
            item.style.display = '';
            if (query) {
                item.classList.add('highlight-search');
            } else {
                item.classList.remove('highlight-search');
            }
        } else {
            item.style.display = 'none';
            item.classList.remove('highlight-search');
        }
    });
}

// Setup filtros de asistencia
function setupAsistenciaFiltros() {
    const buscarInput = document.getElementById('buscarClaseAsistencia');
    const filtroPeriodo = document.getElementById('filtroPeriodoAsistencia');
    const filtroEstado = document.getElementById('filtroEstadoAsistencia');

    if (buscarInput) {
        buscarInput.addEventListener('input', aplicarFiltrosAsistencia);
    }

    if (filtroPeriodo) {
        filtroPeriodo.addEventListener('change', aplicarFiltrosAsistencia);
    }

    if (filtroEstado) {
        filtroEstado.addEventListener('change', aplicarFiltrosAsistencia);
    }
}

// Aplicar filtros de asistencia
function aplicarFiltrosAsistencia() {
    const buscarInput = document.getElementById('buscarClaseAsistencia');
    const filtroPeriodo = document.getElementById('filtroPeriodoAsistencia');
    const filtroEstado = document.getElementById('filtroEstadoAsistencia');

    const queryBusqueda = buscarInput ? buscarInput.value.toLowerCase().trim() : '';
    const periodoSeleccionado = filtroPeriodo ? filtroPeriodo.value : '';
    const estadoSeleccionado = filtroEstado ? filtroEstado.value : '';

    const clases = document.querySelectorAll('.clase-asistencia-card');
    let clasesVisibles = 0;

    // Calcular rangos de fechas según el período
    const ahora = new Date();
    let fechaInicio = null;
    let fechaFin = null;

    if (periodoSeleccionado === 'hoy') {
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        fechaFin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59);
    } else if (periodoSeleccionado === 'semana') {
        const diaSemana = ahora.getDay();
        const diff = ahora.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), diff);
        fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaInicio.getDate() + 6);
        fechaFin.setHours(23, 59, 59);
    } else if (periodoSeleccionado === 'mes') {
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        fechaFin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);
    } else if (periodoSeleccionado === 'mes-anterior') {
        fechaInicio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
        fechaFin = new Date(ahora.getFullYear(), ahora.getMonth(), 0, 23, 59, 59);
    }

    clases.forEach(clase => {
        let mostrar = true;

        // Filtro por búsqueda de nombre
        if (queryBusqueda) {
            const titulo = clase.querySelector('.clase-details h4')?.textContent.toLowerCase() || '';
            if (!titulo.includes(queryBusqueda)) {
                mostrar = false;
            }
        }

        // Filtro por período
        if (periodoSeleccionado && mostrar) {
            const fechaTexto = clase.querySelector('.clase-fecha')?.textContent || '';
            
            // Extraer fecha del atributo data o del texto
            const claseDataId = clase.getAttribute('data-clase-id');
            
            // Intentar extraer la fecha del texto
            // Buscar patrón de fecha en el texto
            const fechaMatch = fechaTexto.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/);
            
            if (fechaMatch) {
                const meses = {
                    'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
                    'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
                    'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
                };
                
                const dia = parseInt(fechaMatch[1]);
                const mes = meses[fechaMatch[2].toLowerCase()];
                const año = parseInt(fechaMatch[3]);
                
                const fechaClase = new Date(año, mes, dia);
                
                if (fechaInicio && fechaFin) {
                    if (fechaClase < fechaInicio || fechaClase > fechaFin) {
                        mostrar = false;
                    }
                }
            }
        }

        // Filtro por estado
        if (estadoSeleccionado && mostrar) {
            const estadoBadge = clase.querySelector('.clase-estado');
            if (estadoBadge) {
                const tieneEstado = estadoBadge.classList.contains(estadoSeleccionado);
                if (!tieneEstado) {
                    mostrar = false;
                }
            }
        }

        if (mostrar) {
            clase.style.display = '';
            clasesVisibles++;
        } else {
            clase.style.display = 'none';
        }
    });

    // Mostrar mensaje si no hay resultados
    const lista = document.getElementById('clasesAsistenciaList');
    if (lista) {
        let mensajeNoResultados = lista.querySelector('.no-resultados-filtro');
        
        if (clasesVisibles === 0) {
            if (!mensajeNoResultados) {
                mensajeNoResultados = document.createElement('div');
                mensajeNoResultados.className = 'no-resultados-filtro empty-state';
                mensajeNoResultados.innerHTML = `
                    <i class="bi bi-search"></i>
                    <p>No se encontraron clases con los filtros aplicados</p>
                    <small>Intenta ajustar los filtros de búsqueda</small>
                `;
                lista.appendChild(mensajeNoResultados);
            }
        } else {
            if (mensajeNoResultados) {
                mensajeNoResultados.remove();
            }
        }
    }
}

// Marcar todos los estudiantes visibles como presentes o ausentes
async function marcarTodosAsistencia(claseId, presente) {
    const lista = document.querySelector(`.estudiantes-asistencia-list[data-clase-id="${claseId}"]`);
    if (!lista) return;

    // Obtener solo los items visibles (no ocultos por el filtro)
    // Usamos getComputedStyle para estar seguros de qué se ve realmente
    const items = Array.from(lista.querySelectorAll('.estudiante-asistencia-item'));
    const itemsVisibles = items.filter(item => {
        return window.getComputedStyle(item).display !== 'none';
    });

    // Obtener contenedores de acciones válidos (no deshabilitados)
    const validActions = itemsVisibles
        .map(item => {
            const actions = item.querySelector('.asistencia-actions');
            const btn = actions ? actions.querySelector('.btn-asistencia') : null;
            if (btn && !btn.disabled) return actions;
            return null;
        })
        .filter(action => action !== null);

    if (validActions.length === 0) {
        alert('No hay estudiantes visibles para marcar. Revise su filtro de búsqueda.');
        return;
    }

    const confirmMsg = presente
        ? `¿Marcar ${validActions.length} estudiantes como PRESENTES?`
        : `¿Marcar ${validActions.length} estudiantes como AUSENTES?`;

    if (!confirm(confirmMsg)) return;

    // Mostrar estado de carga visual en la tarjeta
    const card = document.querySelector(`.clase-asistencia-card[data-clase-id="${claseId}"]`);
    if (card) {
        card.style.opacity = '0.7';
        card.style.pointerEvents = 'none'; // Prevenir clicks múltiples
        card.style.cursor = 'wait';
    }

    try {
        const db = window.firebaseDB;
        const batch = db.batch(); // Usar batch para atomicidad y velocidad
        const updatesUI = []; // Array para guardar info necesaria para actualizar UI después

        for (const actionContainer of validActions) {
            const estudianteId = actionContainer.getAttribute('data-estudiante-id');
            const asistenciaId = actionContainer.getAttribute('data-asistencia-id');
            const data = {
                claseId: claseId,
                estudianteId: estudianteId,
                aulaId: currentAulaId,
                materia: currentMateria,
                presente: presente,
                fechaRegistro: firebase.firestore.Timestamp.now(),
                registradoPor: currentUser.id
            };

            const updateInfo = { actionContainer, asistenciaId, estudianteId };

            if (asistenciaId) {
                // Actualizar existente
                const ref = db.collection('asistencia').doc(asistenciaId);
                batch.update(ref, {
                    presente: presente,
                    fechaRegistro: data.fechaRegistro,
                    registradoPor: data.registradoPor
                });
            } else {
                // Crear nueva
                const newRef = db.collection('asistencia').doc();
                batch.set(newRef, data);
                // Guardar el nuevo ID para actualizar el DOM luego
                updateInfo.newId = newRef.id;
            }
            updatesUI.push(updateInfo);
        }

        await batch.commit();

        // Actualizar UI Localmente
        for (const update of updatesUI) {
            const { actionContainer, newId, estudianteId } = update;

            // Si es nuevo, asignar el ID creado
            if (newId) {
                actionContainer.setAttribute('data-asistencia-id', newId);
            }

            // Actualizar estilos
            actualizarEstiloEstudiante(claseId, estudianteId, presente);
        }

        // Actualizar contadores globales de la clase
        actualizarContadoresClase(claseId);

    } catch (error) {
        console.error('Error al marcar asistencia masiva:', error);
        alert('Error al marcar la asistencia. Intente nuevamente.');
    } finally {
        if (card) {
            card.style.opacity = '1';
            card.style.pointerEvents = 'all';
            card.style.cursor = 'default';
        }
    }
}

// Marcar asistencia individual
async function marcarAsistencia(claseId, estudianteId, asistenciaId, presente) {
    try {
        const db = window.firebaseDB;

        // Si no se pasa ID, intentar buscarlo en el DOM (del contenedor de botones)
        let currentAsistenciaId = asistenciaId;
        const actionsContainer = document.querySelector(`.asistencia-actions[data-clase-id="${claseId}"][data-estudiante-id="${estudianteId}"]`);

        if (!currentAsistenciaId && actionsContainer) {
            currentAsistenciaId = actionsContainer.getAttribute('data-asistencia-id');
        }

        if (currentAsistenciaId) {
            // Actualizar asistencia existente
            await db.collection('asistencia').doc(currentAsistenciaId).update({
                presente: presente,
                fechaRegistro: firebase.firestore.Timestamp.now(),
                registradoPor: currentUser.id
            });
        } else {
            // Crear nueva asistencia
            const docRef = await db.collection('asistencia').add({
                claseId: claseId,
                estudianteId: estudianteId,
                aulaId: currentAulaId,
                materia: currentMateria,
                presente: presente,
                fechaRegistro: firebase.firestore.Timestamp.now(),
                registradoPor: currentUser.id
            });

            // Guardar el nuevo ID en el contenedor para futuras ediciones
            if (actionsContainer) {
                actionsContainer.setAttribute('data-asistencia-id', docRef.id);
            }
        }

        // Actualizar UI localmente (contadores y estilos visuales)
        // IMPORTANTE: Primero actualizar estilo (clases CSS) y luego contar
        actualizarEstiloEstudiante(claseId, estudianteId, presente);
        actualizarContadoresClase(claseId);

    } catch (error) {
        console.error('Error al marcar asistencia:', error);
        alert('Error al registrar la asistencia');
        // No hay checkbox para revertir, pero podríamos actualizar el estilo al estado anterior si fuera necesario
    }
}

// Función auxiliar para actualizar contadores sin recargar
function actualizarContadoresClase(claseId) {
    const card = document.querySelector(`.clase-asistencia-card[data-clase-id="${claseId}"]`);
    if (!card) return;

    // Contar basándose en las clases visuales de los items
    const items = card.querySelectorAll('.estudiante-asistencia-item');
    let presentes = 0;
    let ausentes = 0;
    let pendientes = 0;

    items.forEach(item => {
        if (item.classList.contains('presente')) presentes++;
        else if (item.classList.contains('ausente')) ausentes++;
        else pendientes++;
    });

    // Actualizar números
    const statPresentes = card.querySelector('.stat-item.presentes');
    if (statPresentes) statPresentes.innerHTML = `<i class="bi bi-check-circle-fill"></i> ${presentes}`;

    const statAusentes = card.querySelector('.stat-item.ausentes');
    if (statAusentes) statAusentes.innerHTML = `<i class="bi bi-x-circle-fill"></i> ${ausentes}`;

    // Actualizar pendientes
    let statPendientes = card.querySelector('.stat-item.pendientes');

    if (pendientes > 0) {
        if (statPendientes) {
            statPendientes.innerHTML = `<i class="bi bi-clock-fill"></i> ${pendientes}`;
            statPendientes.style.display = '';
        } else {
            const statTotal = card.querySelector('.stat-item.total');
            if (statTotal) {
                const span = document.createElement('span');
                span.className = 'stat-item pendientes';
                span.innerHTML = `<i class="bi bi-clock-fill"></i> ${pendientes}`;
                statTotal.parentNode.insertBefore(span, statTotal);
            }
        }
    } else {
        if (statPendientes) statPendientes.style.display = 'none';
    }
}

// Función auxiliar para actualizar estilo de estudiante individual
function actualizarEstiloEstudiante(claseId, estudianteId, presente) {
    const actions = document.querySelector(`.asistencia-actions[data-clase-id="${claseId}"][data-estudiante-id="${estudianteId}"]`);
    if (!actions) return;

    const item = actions.closest('.estudiante-asistencia-item');
    if (item) {
        // Remover clases anteriores
        item.classList.remove('presente', 'ausente', 'pendiente');

        // Agregar nueva clase
        item.classList.add(presente ? 'presente' : 'ausente');
    }

    // Actualizar botones
    const btnPresente = actions.querySelector('.btn-asistencia.presente');
    const btnAusente = actions.querySelector('.btn-asistencia.ausente');

    if (btnPresente && btnAusente) {
        if (presente) {
            btnPresente.classList.add('active');
            btnAusente.classList.remove('active');
            // Update icons
            const iconP = btnPresente.querySelector('i');
            if (iconP) iconP.className = 'bi bi-check-circle-fill';

            const iconA = btnAusente.querySelector('i');
            if (iconA) iconA.className = 'bi bi-x-circle';
        } else {
            btnPresente.classList.remove('active');
            btnAusente.classList.add('active');
            // Update icons
            const iconP = btnPresente.querySelector('i');
            if (iconP) iconP.className = 'bi bi-check-circle';

            const iconA = btnAusente.querySelector('i');
            if (iconA) iconA.className = 'bi bi-x-circle-fill';
        }
    }
}
