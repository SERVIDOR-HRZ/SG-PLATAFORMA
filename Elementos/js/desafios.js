// Desafios.js - Sistema de desafíos con niveles dinámicos desde Firebase

let currentUser = null;
let currentMateria = '';
let currentAulaId = '';
let currentNivel = 1;
let nivelDesbloqueado = 1;
let currentPreguntaIndex = 0;
let preguntasActuales = [];
let respuestasCorrectas = 0;
let selectedOption = null;
let nivelesData = [];
let energyTimerInterval = null;
let ultimaRegeneracionGlobal = null;
let currentNivelData = null; // Datos del nivel actual (recompensas, etc.)

let userGameData = {
    energia: 10,
    energiaMax: 10,
    monedas: 0,
    pistas: 0,
    xp: 0,
    nivel: 1,
    nivelesCompletados: {},
    energiaInfinita: false
};

// ============ SISTEMA DE NIVELES PROGRESIVO ============
// Nivel 1→2: 100 XP, Nivel 2→3: 200 XP, Nivel 3→4: 400 XP, etc. (se duplica)

// Calcular XP total necesario para alcanzar un nivel
function getXPForLevel(level) {
    if (level <= 1) return 0;
    // Suma de serie geométrica: 100 * (2^(n-1) - 1) / (2 - 1) = 100 * (2^(n-1) - 1)
    return 100 * (Math.pow(2, level - 1) - 1);
}

// Calcular nivel basado en XP total
function calculateLevelFromXP(totalXP) {
    if (totalXP < 100) return 1;
    // Resolver: 100 * (2^(n-1) - 1) <= totalXP
    // 2^(n-1) <= totalXP/100 + 1
    // n-1 <= log2(totalXP/100 + 1)
    // n <= log2(totalXP/100 + 1) + 1
    const level = Math.floor(Math.log2(totalXP / 100 + 1) + 1);
    return Math.max(1, level);
}

// Obtener XP actual dentro del nivel (para la barra de progreso)
function getXPInCurrentLevel(totalXP) {
    const currentLevel = calculateLevelFromXP(totalXP);
    const xpForCurrentLevel = getXPForLevel(currentLevel);
    return totalXP - xpForCurrentLevel;
}

// Obtener XP necesario para el siguiente nivel
function getXPNeededForNextLevel(currentLevel) {
    return 100 * Math.pow(2, currentLevel - 1);
}

// Colores por materia
const coloresMaterias = {
    matematicas: { main: '#2196F3', dark: '#1976D2', bg: '#1a3a5c', bgLight: '#234b73' },
    lectura: { main: '#E53935', dark: '#C62828', bg: '#4a2020', bgLight: '#5c2828' },
    sociales: { main: '#FF9800', dark: '#F57C00', bg: '#4a3518', bgLight: '#5c4220' },
    naturales: { main: '#4CAF50', dark: '#388E3C', bg: '#1a3a1c', bgLight: '#234b25' },
    ingles: { main: '#9C27B0', dark: '#7B1FA2', bg: '#3a1a4a', bgLight: '#4b2360' }
};

// Patrón del camino
const pathPattern = [0, -0.6, 0, 0.6, 0, 0.6, 0, -0.6, 0, -0.6];

document.addEventListener('DOMContentLoaded', initDesafios);
window.addEventListener('resize', debounce(redrawLines, 150));

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function initDesafios() {
    const userStr = sessionStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = '../index.html';
        return;
    }
    currentUser = JSON.parse(userStr);

    const urlParams = new URLSearchParams(window.location.search);
    currentMateria = urlParams.get('materia') || 'matematicas';
    currentAulaId = urlParams.get('aula') || '';

    // Aplicar colores de la materia
    const colores = coloresMaterias[currentMateria] || coloresMaterias.matematicas;
    document.documentElement.style.setProperty('--materia-color', colores.main);
    document.documentElement.style.setProperty('--materia-dark', colores.dark);
    document.documentElement.style.setProperty('--bg-dark', colores.bg);
    document.documentElement.style.setProperty('--bg-light', colores.bgLight);
    document.body.style.background = `linear-gradient(180deg, ${colores.bg} 0%, ${colores.bgLight} 50%, ${colores.bg} 100%)`;

    const nombreMateria = currentMateria.charAt(0).toUpperCase() + currentMateria.slice(1);
    document.getElementById('materiaTitle').textContent = nombreMateria;

    // Esperar Firebase
    await esperarFirebase();

    // Cargar datos del usuario
    await loadUserGameData();

    // Cargar niveles desde Firebase
    await loadNiveles();

    // Actualizar UI
    updateHeaderStats();

    // Generar camino
    generatePath();

    setupEventListeners();
}

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

async function loadUserGameData() {
    try {
        const db = window.firebaseDB;
        const userDoc = await db.collection('usuarios').doc(currentUser.id).get();

        if (userDoc.exists) {
            const data = userDoc.data();
            userGameData.monedas = data.puntos || data.puntosAcumulados || 0;
            userGameData.pistas = data.pistas || 0;
            userGameData.energia = data.energia !== undefined ? data.energia : 10;
            userGameData.energiaMax = data.energiaMax || 10;

            // Cargar XP y nivel POR MATERIA
            const progresoKey = `progreso_${currentMateria}`;
            if (data[progresoKey]) {
                userGameData.xp = data[progresoKey].xp || 0;
                userGameData.nivelesCompletados = data[progresoKey].nivelesCompletados || {};
                nivelDesbloqueado = data[progresoKey].nivelDesbloqueado || 1;
            } else {
                userGameData.xp = 0;
                userGameData.nivelesCompletados = {};
                nivelDesbloqueado = 1;
            }

            // Calcular nivel basado en XP de esta materia (sistema progresivo)
            userGameData.nivel = calculateLevelFromXP(userGameData.xp);

            // Debug: mostrar datos cargados
            console.log(`Datos del usuario para ${currentMateria}:`, {
                monedas: userGameData.monedas,
                xp: userGameData.xp,
                nivel: userGameData.nivel,
                energia: userGameData.energia,
                nivelDesbloqueado: nivelDesbloqueado
            });

            // Guardar última regeneración para el timer
            ultimaRegeneracionGlobal = data.ultimaRegeneracionEnergia?.toDate() || new Date();

            // Verificar energía infinita
            userGameData.energiaInfinita = false;
            userGameData.energiaInfinitaExpira = null;
            if (data.energiaInfinita && data.energiaInfinitaExpira) {
                const expira = data.energiaInfinitaExpira.toDate ? data.energiaInfinitaExpira.toDate() : new Date(data.energiaInfinitaExpira);
                if (expira > new Date()) {
                    userGameData.energiaInfinita = true;
                    userGameData.energiaInfinitaExpira = expira;
                }
            }

            // Verificar y regenerar energía si es necesario
            await checkAndRegenerateEnergy(data);

            // Iniciar timer de energía
            startEnergyTimer();
        }
    } catch (error) {
        console.error('Error cargando datos del usuario:', error);
    }
}

// Sistema de regeneración de energía (1 cada 10 minutos)
async function checkAndRegenerateEnergy(userData) {
    try {
        // Si tiene energía infinita activa, no regenerar
        if (userGameData.energiaInfinita) return;

        const energiaActual = userGameData.energia;
        const energiaMax = userGameData.energiaMax;

        // Si ya tiene energía máxima, no hacer nada
        if (energiaActual >= energiaMax) return;

        const ultimaRegeneracion = userData.ultimaRegeneracionEnergia?.toDate() || new Date(0);
        const ahora = new Date();
        const minutosTranscurridos = Math.floor((ahora - ultimaRegeneracion) / (1000 * 60));
        const energiasARegenerar = Math.floor(minutosTranscurridos / 10);

        if (energiasARegenerar > 0) {
            const nuevaEnergia = Math.min(energiaActual + energiasARegenerar, energiaMax);
            userGameData.energia = nuevaEnergia;
            ultimaRegeneracionGlobal = ahora;

            const db = window.firebaseDB;
            await db.collection('usuarios').doc(currentUser.id).update({
                energia: nuevaEnergia,
                ultimaRegeneracionEnergia: firebase.firestore.Timestamp.now()
            });
        }
    } catch (error) {
        console.error('Error regenerando energía:', error);
    }
}

// Timer de energía - muestra cuenta regresiva para la próxima regeneración
function startEnergyTimer() {
    // Limpiar intervalo anterior si existe
    if (energyTimerInterval) {
        clearInterval(energyTimerInterval);
    }

    // Actualizar inmediatamente
    updateEnergyTimer();

    // Actualizar cada segundo
    energyTimerInterval = setInterval(updateEnergyTimer, 1000);
}

function updateEnergyTimer() {
    const timerElement = document.getElementById('energyTimer');
    const timerText = document.getElementById('timerText');

    if (!timerElement || !timerText) return;

    // Si tiene energía infinita, mostrar tiempo restante
    if (userGameData.energiaInfinita && userGameData.energiaInfinitaExpira) {
        const ahora = new Date();
        const tiempoRestante = userGameData.energiaInfinitaExpira - ahora;

        // Si expiró, desactivar energía infinita
        if (tiempoRestante <= 0) {
            userGameData.energiaInfinita = false;
            userGameData.energiaInfinitaExpira = null;
            updateHeaderStats();
            return;
        }

        // Mostrar timer con tiempo restante de energía infinita
        timerElement.style.display = 'flex';
        timerElement.classList.add('infinite-timer');

        const horas = Math.floor(tiempoRestante / (1000 * 60 * 60));
        const minutos = Math.floor((tiempoRestante % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((tiempoRestante % (1000 * 60)) / 1000);

        if (horas > 0) {
            timerText.textContent = `${horas}h ${minutos.toString().padStart(2, '0')}m`;
        } else {
            timerText.textContent = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
        }
        return;
    }

    // Quitar clase de infinito si no tiene
    timerElement.classList.remove('infinite-timer');

    // Si tiene energía máxima, ocultar timer
    if (userGameData.energia >= userGameData.energiaMax) {
        timerElement.style.display = 'none';
        return;
    }

    // Calcular tiempo restante para la próxima regeneración
    const ahora = new Date();
    const ultimaRegen = ultimaRegeneracionGlobal || ahora;
    const tiempoTranscurrido = ahora - ultimaRegen;
    const tiempoParaProxima = (10 * 60 * 1000) - (tiempoTranscurrido % (10 * 60 * 1000));

    // Si ya pasó el tiempo, regenerar
    if (tiempoParaProxima <= 0 || tiempoTranscurrido >= 10 * 60 * 1000) {
        regenerateOneEnergy();
        return;
    }

    // Mostrar timer
    timerElement.style.display = 'flex';

    const minutosRestantes = Math.floor(tiempoParaProxima / (1000 * 60));
    const segundosRestantes = Math.floor((tiempoParaProxima % (1000 * 60)) / 1000);

    timerText.textContent = `${minutosRestantes.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
}

async function regenerateOneEnergy() {
    if (userGameData.energia >= userGameData.energiaMax) return;

    userGameData.energia++;
    ultimaRegeneracionGlobal = new Date();

    try {
        const db = window.firebaseDB;
        await db.collection('usuarios').doc(currentUser.id).update({
            energia: userGameData.energia,
            ultimaRegeneracionEnergia: firebase.firestore.Timestamp.now()
        });
    } catch (error) {
        console.error('Error actualizando energía:', error);
    }

    updateHeaderStats();
}

async function loadNiveles() {
    try {
        const db = window.firebaseDB;

        // Obtener TODOS los niveles y filtrar en cliente (evita índices)
        const nivelesSnapshot = await db.collection('desafios_niveles').get();

        nivelesData = [];
        nivelesSnapshot.forEach(doc => {
            const data = doc.data();
            // Filtrar por materia en el cliente
            if (data.materia === currentMateria) {
                nivelesData.push({
                    id: doc.id,
                    ...data
                });
            }
        });

        // Ordenar en el cliente por número
        nivelesData.sort((a, b) => (a.numero || 0) - (b.numero || 0));

        console.log(`Cargados ${nivelesData.length} niveles para ${currentMateria}`);
    } catch (error) {
        console.error('Error cargando niveles:', error);
        nivelesData = [];
    }
}

function updateHeaderStats() {
    // Mostrar energía (infinita o normal)
    const energiaDisplay = userGameData.energiaInfinita ? '∞' : userGameData.energia;
    document.getElementById('energiaActual').textContent = energiaDisplay;
    document.getElementById('monedasActual').textContent = userGameData.monedas;
    document.getElementById('nivelActual').textContent = userGameData.nivel;

    // Mostrar pistas
    const pistasElement = document.getElementById('pistasActual');
    if (pistasElement) {
        pistasElement.textContent = userGameData.pistas;
    }

    // Actualizar badge de pistas
    const hintsBadge = document.getElementById('hintsBadge');
    if (hintsBadge) {
        if (userGameData.pistas <= 0) {
            hintsBadge.classList.add('empty');
            hintsBadge.classList.remove('has-hints');
        } else {
            hintsBadge.classList.remove('empty');
            hintsBadge.classList.add('has-hints');
        }
    }

    // Actualizar badge de energía con clase especial si es infinita
    const energyBadge = document.getElementById('energyBadge');
    if (energyBadge) {
        if (userGameData.energiaInfinita) {
            energyBadge.classList.add('infinite');
        } else {
            energyBadge.classList.remove('infinite');
        }
    }

    // Actualizar visibilidad del timer - mostrar si tiene energía infinita o si necesita regenerar
    const timerElement = document.getElementById('energyTimer');
    if (timerElement) {
        if (userGameData.energiaInfinita) {
            // Mostrar timer con tiempo restante de energía infinita
            timerElement.style.display = 'flex';
        } else if (userGameData.energia >= userGameData.energiaMax) {
            timerElement.style.display = 'none';
        } else {
            timerElement.style.display = 'flex';
        }
    }
}

function generatePath() {
    const container = document.getElementById('pathContainer');
    container.innerHTML = '';

    // Si no hay niveles creados, mostrar mensaje
    if (nivelesData.length === 0) {
        container.innerHTML = `
            <div class="no-niveles-message">
                <i class="bi bi-emoji-frown"></i>
                <h3>No hay niveles disponibles</h3>
                <p>Aún no se han creado desafíos para esta materia.</p>
            </div>
        `;
        return;
    }

    const nodesContainer = document.createElement('div');
    nodesContainer.className = 'nodes-container';
    nodesContainer.id = 'nodesContainer';

    let nodeIndex = 0;

    // Generar nodos basados en los niveles de Firebase
    nivelesData.forEach((nivel, index) => {
        const patternIndex = nodeIndex % pathPattern.length;
        const offsetPercent = pathPattern[patternIndex];

        const row = document.createElement('div');
        row.className = 'level-row';
        row.dataset.offset = offsetPercent;

        const node = createLevelNode(nivel, index + 1);
        row.appendChild(node);
        nodesContainer.appendChild(row);
        nodeIndex++;

        // Cofre cada 10 niveles
        if ((index + 1) % 10 === 0) {
            const chestPatternIndex = nodeIndex % pathPattern.length;
            const chestOffset = pathPattern[chestPatternIndex];

            const chestRow = document.createElement('div');
            chestRow.className = 'level-row';
            chestRow.dataset.offset = chestOffset;

            const chestNode = createChestNode(index + 1);
            chestRow.appendChild(chestNode);
            nodesContainer.appendChild(chestRow);
            nodeIndex++;
        }
    });

    container.appendChild(nodesContainer);

    setTimeout(drawLines, 100);
}

function createLevelNode(nivelData, numero) {
    const node = document.createElement('div');
    node.className = 'level-node';
    node.dataset.nivel = numero;
    node.dataset.nivelId = nivelData.id;

    const completedData = userGameData.nivelesCompletados[nivelData.id];
    const isCompleted = !!completedData;
    const isAvailable = numero <= nivelDesbloqueado;

    // Obtener estrellas (puede ser un número o true para compatibilidad)
    let stars = 0;
    if (completedData) {
        stars = typeof completedData === 'object' ? (completedData.stars || 1) : 1;
    }

    if (isCompleted) {
        node.classList.add('completed');
        node.dataset.stars = stars;
    } else if (isAvailable) {
        node.classList.add('available');
    } else {
        node.classList.add('locked');
    }

    // Generar HTML de estrellas
    const starsHTML = isCompleted ? `
        <div class="node-stars" data-stars="${stars}">
            <i class="bi bi-star-fill ${stars >= 1 ? 'active' : ''}"></i>
            <i class="bi bi-star-fill ${stars >= 2 ? 'active' : ''}"></i>
            <i class="bi bi-star-fill ${stars >= 3 ? 'active' : ''}"></i>
        </div>
    ` : '';

    node.innerHTML = `
        <span class="node-number">${numero}</span>
        <span class="node-check"><i class="bi bi-check-lg"></i></span>
        <span class="node-icon"><i class="bi bi-lock-fill"></i></span>
        ${starsHTML}
    `;

    if (isAvailable) {
        node.addEventListener('click', () => openDesafioModal(nivelData, numero));
    }

    return node;
}

function createChestNode(afterLevel) {
    const node = document.createElement('div');
    node.className = 'level-node chest';
    node.dataset.chestAfter = afterLevel;

    const chestKey = `chest_${currentMateria}_${afterLevel}`;
    const isOpened = userGameData.nivelesCompletados[chestKey];
    const isAvailable = nivelDesbloqueado > afterLevel && !isOpened;

    if (isOpened) {
        node.classList.add('completed');
    } else if (isAvailable) {
        node.classList.add('available');
    } else {
        node.classList.add('locked');
    }

    node.innerHTML = `
        <i class="bi bi-gift-fill chest-icon"></i>
        <span class="chest-coins">+100 <i class="bi bi-coin"></i></span>
    `;

    if (isAvailable) {
        node.addEventListener('click', () => openChestModal(afterLevel));
    }

    return node;
}


async function openChestModal(nivel) {
    currentNivel = nivel;

    const modal = document.getElementById('desafioModal');
    document.getElementById('desafioTitulo').textContent = `¡Cofre de Recompensa!`;
    modal.querySelector('.desafio-icon').innerHTML = '<i class="bi bi-box2-heart-fill"></i>';
    modal.querySelector('.desafio-icon').style.background = 'linear-gradient(180deg, #FFD700 0%, #FFA000 100%)';
    modal.querySelector('.desafio-descripcion').textContent = '¡Felicidades! Has alcanzado un cofre de recompensa. Ábrelo para obtener tus monedas.';
    modal.querySelector('.desafio-recompensas').innerHTML = `
        <div class="recompensa"><i class="bi bi-coin"></i> +100 Monedas</div>
    `;
    modal.querySelector('.desafio-costo').style.display = 'none';
    document.getElementById('startDesafio').innerHTML = '<i class="bi bi-box-arrow-in-down"></i> Abrir Cofre';
    document.getElementById('startDesafio').dataset.isChest = 'true';
    modal.classList.add('active');
}

async function openDesafioModal(nivelData, numero) {
    currentNivel = numero;
    currentNivelData = nivelData; // Guardar datos del nivel para usar en recompensas
    preguntasActuales = nivelData.preguntas || [];

    const modal = document.getElementById('desafioModal');
    document.getElementById('desafioTitulo').textContent = `Nivel ${numero}`;

    // Restaurar estilo del ícono
    const colores = coloresMaterias[currentMateria] || coloresMaterias.matematicas;
    modal.querySelector('.desafio-icon').innerHTML = '<i class="bi bi-trophy-fill"></i>';
    modal.querySelector('.desafio-icon').style.background = `linear-gradient(180deg, ${colores.main} 0%, ${colores.dark} 100%)`;

    modal.querySelector('.desafio-descripcion').textContent = nivelData.descripcion || 'Responde correctamente las preguntas para ganar monedas y experiencia.';

    const monedasRecompensa = nivelData.recompensaMonedas || 10;
    const xpRecompensa = nivelData.recompensaXP || 20;

    modal.querySelector('.desafio-recompensas').innerHTML = `
        <div class="recompensa"><i class="bi bi-coin"></i> +${monedasRecompensa} Monedas</div>
        <div class="recompensa"><i class="bi bi-star-fill"></i> +${xpRecompensa} XP</div>
    `;

    modal.querySelector('.desafio-costo').style.display = 'flex';
    modal.querySelector('.desafio-costo').innerHTML = `
        <i class="bi bi-lightning-fill"></i>
        <span>Costo: 1 Energía</span>
    `;

    document.getElementById('startDesafio').innerHTML = '<i class="bi bi-play-fill"></i> Comenzar';
    document.getElementById('startDesafio').dataset.isChest = 'false';
    document.getElementById('startDesafio').dataset.nivelId = nivelData.id;

    modal.classList.add('active');
}

function closeDesafioModal() {
    document.getElementById('desafioModal').classList.remove('active');
}

async function startDesafio() {
    const startBtn = document.getElementById('startDesafio');
    const isChest = startBtn.dataset.isChest === 'true';

    if (isChest) {
        await openChest();
        return;
    }

    // Verificar energía (si no tiene energía infinita)
    if (!userGameData.energiaInfinita && userGameData.energia < 1) {
        showAlertWithShop('¡Sin Energía!', 'No tienes suficiente energía para jugar. Puedes comprar más en la tienda o esperar 10 minutos para regenerar 1 energía.', 'energy');
        return;
    }

    // Verificar que hay preguntas
    if (!preguntasActuales || preguntasActuales.length === 0) {
        showAlert('Error', 'Este nivel no tiene preguntas configuradas.');
        return;
    }

    // Consumir energía (solo si no tiene energía infinita)
    if (!userGameData.energiaInfinita) {
        userGameData.energia--;
        await updateUserEnergy();
    }
    updateHeaderStats();

    closeDesafioModal();

    currentPreguntaIndex = 0;
    respuestasCorrectas = 0;

    showPregunta();
}

async function openChest() {
    const chestKey = `chest_${currentMateria}_${currentNivel}`;

    // Dar recompensa
    userGameData.monedas += 100;
    userGameData.nivelesCompletados[chestKey] = true;

    // Guardar en Firebase
    await saveUserProgress();

    closeDesafioModal();

    // Mostrar resultado
    showChestResult();

    // Regenerar camino
    generatePath();
    updateHeaderStats();
}

function showChestResult() {
    const resultadoIcon = document.getElementById('resultadoIcon');
    resultadoIcon.className = 'resultado-icon success';
    resultadoIcon.innerHTML = '<i class="bi bi-gift-fill"></i>';

    document.getElementById('resultadoTitulo').textContent = '¡Cofre Abierto!';
    document.getElementById('resultadoMensaje').textContent = 'Has obtenido tu recompensa';

    document.getElementById('resultadoStats').innerHTML = `
        <div class="resultado-stat">
            <i class="bi bi-coin"></i>
            <span>+100 Monedas</span>
        </div>
    `;

    document.getElementById('resultadoModal').classList.add('active');
}

function showPregunta() {
    const pregunta = preguntasActuales[currentPreguntaIndex];

    // Calcular progreso: (pregunta actual) / total * 100
    // Para que en 5/5 muestre 100%, usamos (índice + 1) / total
    const progreso = ((currentPreguntaIndex + 1) / preguntasActuales.length) * 100;
    document.getElementById('progresoFill').style.width = `${progreso}%`;
    document.getElementById('preguntaNumero').textContent = `${currentPreguntaIndex + 1}/${preguntasActuales.length}`;

    document.getElementById('preguntaTexto').textContent = pregunta.pregunta;

    const opcionesContainer = document.getElementById('opcionesContainer');
    opcionesContainer.innerHTML = '';

    // Agregar botón de pista si hay pista disponible
    if (pregunta.pista) {
        const pistaBtn = document.createElement('button');
        if (userGameData.pistas > 0) {
            pistaBtn.className = 'pista-btn';
            pistaBtn.innerHTML = `
                <div class="pista-btn-left">
                    <div class="pista-btn-icon">
                        <i class="bi bi-lightbulb-fill"></i>
                    </div>
                    <span class="pista-btn-text">Usar Pista</span>
                </div>
                <div class="pista-btn-count">
                    <i class="bi bi-lightbulb"></i>
                    ${userGameData.pistas}
                </div>
            `;
            pistaBtn.addEventListener('click', () => usarPista(pregunta.pista));
        } else {
            pistaBtn.className = 'pista-btn pista-btn-no-hints';
            pistaBtn.innerHTML = `
                <div class="pista-btn-left">
                    <div class="pista-btn-icon">
                        <i class="bi bi-lightbulb"></i>
                    </div>
                    <span class="pista-btn-text">Sin pistas</span>
                </div>
                <div class="pista-btn-shop">
                    <i class="bi bi-shop"></i>
                    Comprar
                </div>
            `;
            pistaBtn.addEventListener('click', () => {
                showAlertWithShop('¡Sin Pistas!', 'No tienes pistas disponibles. Puedes comprar más en la tienda para ayudarte con las preguntas difíciles.', 'hints');
            });
        }
        opcionesContainer.appendChild(pistaBtn);
    }

    // Contenedor para la pista mostrada
    const pistaContainer = document.createElement('div');
    pistaContainer.className = 'pista-mostrada';
    pistaContainer.id = 'pistaMostrada';
    pistaContainer.style.display = 'none';
    opcionesContainer.appendChild(pistaContainer);

    const letras = ['A', 'B', 'C', 'D'];
    pregunta.opciones.forEach((opcion, index) => {
        const btn = document.createElement('button');
        btn.className = 'opcion-btn';
        btn.innerHTML = `
            <span class="opcion-letra">${letras[index]}</span>
            <span class="opcion-texto">${opcion}</span>
        `;
        btn.dataset.index = index;
        btn.addEventListener('click', () => selectOption(btn, index));
        opcionesContainer.appendChild(btn);
    });

    selectedOption = null;
    const verificarBtn = document.getElementById('verificarBtn');
    verificarBtn.disabled = true;
    verificarBtn.textContent = 'VERIFICAR';
    verificarBtn.classList.remove('next');

    document.getElementById('preguntaModal').classList.add('active');
}

async function usarPista(pista) {
    if (userGameData.pistas <= 0) return;

    userGameData.pistas--;
    await updateUserPistas();

    // Mostrar la pista en un modal emergente
    showPistaModal(pista);

    // Ocultar botón de pista
    const pistaBtn = document.querySelector('.pista-btn');
    if (pistaBtn) pistaBtn.style.display = 'none';
    
    // Actualizar contador de pistas en el header
    updateHeaderStats();
}

function showPistaModal(pista) {
    // Crear el modal de pista si no existe
    let pistaModal = document.getElementById('pistaModal');
    
    if (!pistaModal) {
        pistaModal = document.createElement('div');
        pistaModal.className = 'modal';
        pistaModal.id = 'pistaModal';
        pistaModal.innerHTML = `
            <div class="modal-content modal-pista">
                <div class="pista-modal-icon">
                    <i class="bi bi-lightbulb-fill"></i>
                </div>
                <h3 class="pista-modal-title">💡 Pista</h3>
                <p class="pista-modal-text" id="pistaModalText"></p>
                <button class="pista-modal-btn" id="closePistaModal">
                    <i class="bi bi-check-lg"></i>
                    Entendido
                </button>
            </div>
        `;
        document.body.appendChild(pistaModal);
        
        // Event listener para cerrar
        document.getElementById('closePistaModal').addEventListener('click', closePistaModal);
    }
    
    // Mostrar la pista
    document.getElementById('pistaModalText').textContent = pista;
    pistaModal.classList.add('active');
}

function closePistaModal() {
    const pistaModal = document.getElementById('pistaModal');
    if (pistaModal) {
        pistaModal.classList.remove('active');
    }
}

function selectOption(btn, index) {
    if (document.querySelector('.opcion-btn.correct') || document.querySelector('.opcion-btn.incorrect')) return;

    document.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedOption = index;
    document.getElementById('verificarBtn').disabled = false;
}

function verificarRespuesta() {
    const verificarBtn = document.getElementById('verificarBtn');

    if (verificarBtn.classList.contains('next')) {
        nextPregunta();
        return;
    }

    const pregunta = preguntasActuales[currentPreguntaIndex];
    const opciones = document.querySelectorAll('.opcion-btn');

    opciones.forEach((btn, index) => {
        if (index === pregunta.correcta) {
            btn.classList.add('correct');
        } else if (index === selectedOption && selectedOption !== pregunta.correcta) {
            btn.classList.add('incorrect');
        }
    });

    if (selectedOption === pregunta.correcta) {
        respuestasCorrectas++;
    }

    verificarBtn.textContent = currentPreguntaIndex < preguntasActuales.length - 1 ? 'CONTINUAR' : 'VER RESULTADO';
    verificarBtn.classList.add('next');
    verificarBtn.disabled = false;
}

function nextPregunta() {
    currentPreguntaIndex++;

    if (currentPreguntaIndex < preguntasActuales.length) {
        showPregunta();
    } else {
        closePreguntaModal();
        showResultado();
    }
}

function closePreguntaModal() {
    document.getElementById('preguntaModal').classList.remove('active');
}

async function showResultado() {
    const porcentaje = (respuestasCorrectas / preguntasActuales.length) * 100;
    const nivelId = document.getElementById('startDesafio').dataset.nivelId;

    const resultadoIcon = document.getElementById('resultadoIcon');
    const resultadoTitulo = document.getElementById('resultadoTitulo');
    const resultadoMensaje = document.getElementById('resultadoMensaje');

    resultadoIcon.className = 'resultado-icon';

    // Obtener recompensas configuradas del nivel
    const monedasBase = currentNivelData?.recompensaMonedas || 10;
    const xpBase = currentNivelData?.recompensaXP || 20;

    // Calcular estrellas basado en respuestas correctas
    // 5/5 = 3 estrellas, 4/5 = 2 estrellas, 3/5 = 1 estrella, menos = 0 estrellas
    let stars = 0;
    if (porcentaje === 100) {
        stars = 3;
    } else if (porcentaje >= 80) {
        stars = 2;
    } else if (porcentaje >= 60) {
        stars = 1;
    }

    // Verificar si es la primera vez que se completa este nivel
    const previousData = userGameData.nivelesCompletados[nivelId];
    const isFirstCompletion = !previousData;
    const previousStars = previousData && typeof previousData === 'object' ? (previousData.stars || 0) : (previousData ? 1 : 0);

    // Debug: verificar estado
    console.log('=== DEBUG RECOMPENSAS ===');
    console.log('nivelId:', nivelId);
    console.log('nivelesCompletados:', userGameData.nivelesCompletados);
    console.log('previousData:', previousData);
    console.log('isFirstCompletion:', isFirstCompletion);
    console.log('previousStars:', previousStars);
    console.log('stars actuales:', stars);
    console.log('========================');

    // Solo dar recompensas la primera vez que se aprueba el nivel
    let monedasGanadas = 0;
    let xpGanado = 0;
    let mejoroEstrellas = false;

    if (porcentaje >= 60) {
        if (isFirstCompletion) {
            // Primera vez: dar recompensas completas proporcionales
            monedasGanadas = Math.floor(monedasBase * (respuestasCorrectas / preguntasActuales.length));
            xpGanado = Math.floor(xpBase * (respuestasCorrectas / preguntasActuales.length));
            
            // Actualizar datos del usuario
            userGameData.monedas += monedasGanadas;
            userGameData.xp += xpGanado;
        } else if (stars > previousStars) {
            // Ya completado pero mejoró estrellas: solo actualizar estrellas, SIN recompensas
            mejoroEstrellas = true;
            // NO dar recompensas por mejorar estrellas
        }
        // Si ya completó: no dar recompensas

        // Guardar con estrellas - solo actualizar si obtiene más estrellas que antes
        if (isFirstCompletion || stars > previousStars) {
            userGameData.nivelesCompletados[nivelId] = {
                completed: true,
                stars: stars,
                bestScore: respuestasCorrectas,
                completedAt: isFirstCompletion ? new Date().toISOString() : (previousData?.completedAt || new Date().toISOString())
            };
        }

        // Desbloquear siguiente nivel
        if (currentNivel >= nivelDesbloqueado) {
            nivelDesbloqueado = currentNivel + 1;
        }

        resultadoIcon.classList.add('success');
        resultadoIcon.innerHTML = '<i class="bi bi-trophy-fill"></i>';
        
        if (isFirstCompletion) {
            resultadoTitulo.textContent = stars === 3 ? '¡Perfecto!' : stars === 2 ? '¡Excelente!' : '¡Bien hecho!';
            resultadoMensaje.textContent = 'Has completado este nivel';
        } else if (mejoroEstrellas) {
            resultadoTitulo.textContent = '¡Mejoraste!';
            resultadoMensaje.textContent = `Subiste de ${previousStars} a ${stars} estrellas`;
        } else {
            resultadoTitulo.textContent = '¡Nivel completado!';
            resultadoMensaje.textContent = 'Ya habías completado este nivel';
        }
    } else if (porcentaje >= 40) {
        resultadoIcon.classList.add('partial');
        resultadoIcon.innerHTML = '<i class="bi bi-star-half"></i>';
        resultadoTitulo.textContent = '¡Buen intento!';
        resultadoMensaje.textContent = 'Necesitas 60% para aprobar';
    } else {
        resultadoIcon.classList.add('fail');
        resultadoIcon.innerHTML = '<i class="bi bi-emoji-frown"></i>';
        resultadoTitulo.textContent = '¡No te rindas!';
        resultadoMensaje.textContent = 'Inténtalo de nuevo';
    }

    // Generar HTML de estrellas para el resultado
    const starsHTML = `
        <div class="resultado-stars">
            <i class="bi bi-star-fill ${stars >= 1 ? 'active' : ''}"></i>
            <i class="bi bi-star-fill ${stars >= 2 ? 'active' : ''}"></i>
            <i class="bi bi-star-fill ${stars >= 3 ? 'active' : ''}"></i>
        </div>
    `;

    // Mostrar recompensas (o mensaje de que ya se completó)
    let recompensasHTML = '';
    if (monedasGanadas > 0 || xpGanado > 0) {
        recompensasHTML = `
            <div class="resultado-stat">
                <i class="bi bi-coin"></i>
                <span>+${monedasGanadas} Monedas</span>
            </div>
            <div class="resultado-stat">
                <i class="bi bi-star-fill"></i>
                <span>+${xpGanado} XP</span>
            </div>
        `;
    } else if (porcentaje >= 60 && !isFirstCompletion) {
        if (mejoroEstrellas) {
            recompensasHTML = `
                <div class="resultado-stat no-reward">
                    <i class="bi bi-arrow-up-circle"></i>
                    <span>¡Mejoraste a ${stars} estrellas!</span>
                </div>
            `;
        } else {
            recompensasHTML = `
                <div class="resultado-stat no-reward">
                    <i class="bi bi-info-circle"></i>
                    <span>Sin recompensas (nivel ya completado)</span>
                </div>
            `;
        }
    }

    document.getElementById('resultadoStats').innerHTML = `
        ${starsHTML}
        <div class="resultado-stat">
            <i class="bi bi-check-circle"></i>
            <span>${respuestasCorrectas}/${preguntasActuales.length} Correctas</span>
        </div>
        ${recompensasHTML}
    `;

    // Guardar progreso (solo actualiza racha si aprobó Y es primera vez o mejoró)
    await saveUserProgress(porcentaje >= 60 && (isFirstCompletion || mejoroEstrellas));

    // Actualizar UI
    updateHeaderStats();
    generatePath();

    document.getElementById('resultadoModal').classList.add('active');
}

function closeResultadoModal() {
    document.getElementById('resultadoModal').classList.remove('active');
}


// ============ FIREBASE OPERATIONS ============

async function saveUserProgress(aprobo = false) {
    try {
        const db = window.firebaseDB;
        const progresoKey = `progreso_${currentMateria}`;

        // Calcular nivel basado en XP de esta materia (sistema progresivo)
        const nuevoNivel = calculateLevelFromXP(userGameData.xp);
        userGameData.nivel = nuevoNivel;

        // Obtener datos actuales del usuario
        const userDoc = await db.collection('usuarios').doc(currentUser.id).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        const progresoActual = userData[progresoKey] || {};

        // Preparar datos del progreso de esta materia
        let progresoData = {
            xp: userGameData.xp,
            nivel: nuevoNivel,
            nivelesCompletados: userGameData.nivelesCompletados,
            nivelDesbloqueado: nivelDesbloqueado,
            // Mantener racha existente
            racha: progresoActual.racha || 0,
            mejorRacha: progresoActual.mejorRacha || 0,
            ultimoDesafio: progresoActual.ultimoDesafio || null,
            diasDesafios: progresoActual.diasDesafios || 0,
            diasCompletados: progresoActual.diasCompletados || []
        };

        // Solo actualizar racha si aprobó el nivel (>=60%)
        if (aprobo) {
            // Calcular actualización de racha (por materia)
            const rachaUpdate = calcularActualizacionRacha(progresoActual);
            progresoData = { ...progresoData, ...rachaUpdate };
            
            console.log(`Racha de ${currentMateria} actualizada:`, rachaUpdate);
        }

        // Preparar datos para actualizar
        let updateData = {
            puntos: userGameData.monedas,
            puntosAcumulados: userGameData.monedas,
            [progresoKey]: progresoData
        };

        // Guardar en Firebase
        await db.collection('usuarios').doc(currentUser.id).update(updateData);

        console.log(`Progreso guardado para ${currentMateria}:`, {
            xp: userGameData.xp,
            nivel: nuevoNivel,
            nivelDesbloqueado: nivelDesbloqueado,
            aprobo: aprobo
        });
    } catch (error) {
        console.error('Error guardando progreso:', error);
    }
}

// Calcular actualización de racha (por materia)
function calcularActualizacionRacha(progresoMateria) {
    const ahora = new Date();
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    // Obtener datos de racha de esta materia
    let rachaActual = progresoMateria.racha || 0;
    let mejorRacha = progresoMateria.mejorRacha || 0;
    let diasDesafios = progresoMateria.diasDesafios || 0;
    let diasCompletados = progresoMateria.diasCompletados || [];
    
    // Convertir último desafío a fecha
    let ultimoDesafio = null;
    if (progresoMateria.ultimoDesafio) {
        ultimoDesafio = progresoMateria.ultimoDesafio.toDate ? progresoMateria.ultimoDesafio.toDate() : new Date(progresoMateria.ultimoDesafio);
    }
    
    // Normalizar fecha del último desafío (solo día, sin hora)
    let fechaUltimoDesafio = null;
    if (ultimoDesafio) {
        fechaUltimoDesafio = new Date(ultimoDesafio.getFullYear(), ultimoDesafio.getMonth(), ultimoDesafio.getDate());
    }
    
    // Verificar si ya completó un desafío hoy en esta materia
    const yaCompletoHoy = fechaUltimoDesafio && fechaUltimoDesafio.getTime() === hoy.getTime();
    
    if (!yaCompletoHoy) {
        // Es el primer desafío del día en esta materia
        
        // Verificar si la racha continúa (completó ayer) o se reinicia
        const completoAyer = fechaUltimoDesafio && fechaUltimoDesafio.getTime() === ayer.getTime();
        
        if (completoAyer || rachaActual === 0) {
            // Continúa la racha o empieza una nueva
            rachaActual++;
        } else if (fechaUltimoDesafio && fechaUltimoDesafio.getTime() < ayer.getTime()) {
            // Perdió la racha (no completó ayer)
            rachaActual = 1; // Reinicia con 1 (el de hoy)
        } else {
            // Primera vez
            rachaActual = 1;
        }
        
        // Actualizar mejor racha si es necesario
        if (rachaActual > mejorRacha) {
            mejorRacha = rachaActual;
        }
        
        // Incrementar días totales
        diasDesafios++;
        
        // Agregar hoy a los días completados (para el calendario)
        diasCompletados.push(firebase.firestore.Timestamp.fromDate(hoy));
        
        // Limitar a los últimos 60 días para no sobrecargar
        if (diasCompletados.length > 60) {
            diasCompletados = diasCompletados.slice(-60);
        }
    }
    
    return {
        racha: rachaActual,
        mejorRacha: mejorRacha,
        diasDesafios: diasDesafios,
        diasCompletados: diasCompletados,
        ultimoDesafio: firebase.firestore.Timestamp.fromDate(ahora)
    };
}

async function updateUserEnergy() {
    try {
        const db = window.firebaseDB;

        // Solo actualizar la energía, NO el timestamp de regeneración
        // El timestamp solo se actualiza cuando se REGENERA energía, no cuando se gasta
        await db.collection('usuarios').doc(currentUser.id).update({
            energia: userGameData.energia
        });
    } catch (error) {
        console.error('Error actualizando energía:', error);
    }
}

async function updateUserPistas() {
    try {
        const db = window.firebaseDB;
        await db.collection('usuarios').doc(currentUser.id).update({
            pistas: userGameData.pistas
        });
    } catch (error) {
        console.error('Error actualizando pistas:', error);
    }
}

// ============ DRAWING FUNCTIONS ============

function drawLines() {
    const oldSvg = document.querySelector('.path-svg');
    if (oldSvg) oldSvg.remove();

    const container = document.getElementById('pathContainer');
    const nodesContainer = document.getElementById('nodesContainer');

    if (!nodesContainer) return;

    const rows = nodesContainer.querySelectorAll('.level-row');

    if (rows.length < 2) return;

    const containerRect = container.getBoundingClientRect();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('path-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', nodesContainer.offsetHeight);

    for (let i = 0; i < rows.length - 1; i++) {
        const currentNode = rows[i].querySelector('.level-node');
        const nextNode = rows[i + 1].querySelector('.level-node');

        if (!currentNode || !nextNode) continue;

        const currentRect = currentNode.getBoundingClientRect();
        const nextRect = nextNode.getBoundingClientRect();

        const x1 = currentRect.left + currentRect.width / 2 - containerRect.left;
        const y1 = currentRect.top + currentRect.height - containerRect.top;
        const x2 = nextRect.left + nextRect.width / 2 - containerRect.left;
        const y2 = nextRect.top - containerRect.top;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midY = (y1 + y2) / 2;
        const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
        path.setAttribute('d', d);
        path.classList.add('path-line');

        const nivel = parseInt(currentNode.dataset.nivel) || i + 1;
        if (nivel < nivelDesbloqueado) {
            path.classList.add('completed');
        } else if (nivel === nivelDesbloqueado) {
            path.classList.add('available');
        } else {
            path.classList.add('locked');
        }

        svg.appendChild(path);
    }

    container.insertBefore(svg, nodesContainer);
}

function redrawLines() {
    drawLines();
}

// ============ EVENT LISTENERS ============

function setupEventListeners() {
    document.getElementById('backBtn').addEventListener('click', () => {
        if (currentAulaId) {
            window.location.href = `Aula.html?aula=${currentAulaId}&materia=${currentMateria}`;
        } else {
            window.location.href = 'Clases.html';
        }
    });

    document.getElementById('closeDesafioModal').addEventListener('click', closeDesafioModal);
    document.getElementById('cancelDesafio').addEventListener('click', closeDesafioModal);
    document.getElementById('startDesafio').addEventListener('click', startDesafio);

    document.getElementById('closePreguntaModal').addEventListener('click', closePreguntaModal);
    document.getElementById('verificarBtn').addEventListener('click', verificarRespuesta);

    document.getElementById('continuarBtn').addEventListener('click', closeResultadoModal);

    // Modal de alerta
    document.getElementById('alertBtn').addEventListener('click', closeAlertModal);

    // Botón de reinicio de progreso
    document.getElementById('resetProgressBtn').addEventListener('click', openResetModal);
    document.getElementById('cancelResetBtn').addEventListener('click', closeResetModal);
    document.getElementById('confirmResetBtn').addEventListener('click', confirmResetProgress);

    // Validar input de confirmación
    document.getElementById('resetConfirmInput').addEventListener('input', validateResetInput);
}

// ============ UTILITY FUNCTIONS ============

function showAlert(title, message, type = 'warning') {
    const modal = document.getElementById('alertModal');
    const icon = document.getElementById('alertIcon');

    document.getElementById('alertTitulo').textContent = title;
    document.getElementById('alertMensaje').textContent = message;

    // Cambiar icono según tipo
    icon.className = 'alert-icon';
    if (type === 'error') {
        icon.classList.add('error');
        icon.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
    } else if (type === 'info') {
        icon.classList.add('info');
        icon.innerHTML = '<i class="bi bi-info-circle-fill"></i>';
    } else {
        icon.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
    }

    // Restaurar botón normal
    const alertBtn = document.getElementById('alertBtn');
    alertBtn.textContent = 'Entendido';
    alertBtn.onclick = closeAlertModal;
    
    // Ocultar botón de tienda si existe
    const tiendaBtn = document.getElementById('alertTiendaBtn');
    if (tiendaBtn) tiendaBtn.style.display = 'none';

    modal.classList.add('active');
}

// Mostrar alerta con opción de ir a la tienda
function showAlertWithShop(title, message, type = 'warning') {
    const modal = document.getElementById('alertModal');
    const icon = document.getElementById('alertIcon');

    document.getElementById('alertTitulo').textContent = title;
    document.getElementById('alertMensaje').textContent = message;

    // Cambiar icono según tipo
    icon.className = 'alert-icon';
    if (type === 'energy') {
        icon.classList.add('energy');
        icon.innerHTML = '<i class="bi bi-lightning-fill"></i>';
    } else if (type === 'hints') {
        icon.classList.add('hints');
        icon.innerHTML = '<i class="bi bi-lightbulb-fill"></i>';
    } else {
        icon.innerHTML = '<i class="bi bi-exclamation-triangle-fill"></i>';
    }

    // Cambiar botón principal a "Cerrar"
    const alertBtn = document.getElementById('alertBtn');
    alertBtn.textContent = 'Cerrar';
    alertBtn.onclick = closeAlertModal;
    
    // Mostrar/crear botón de tienda
    let tiendaBtn = document.getElementById('alertTiendaBtn');
    if (!tiendaBtn) {
        tiendaBtn = document.createElement('button');
        tiendaBtn.id = 'alertTiendaBtn';
        tiendaBtn.className = 'tienda-btn';
        alertBtn.parentNode.insertBefore(tiendaBtn, alertBtn);
    }
    
    tiendaBtn.innerHTML = '<i class="bi bi-shop"></i> Ir a la Tienda';
    tiendaBtn.style.display = 'inline-flex';
    tiendaBtn.onclick = () => {
        closeAlertModal();
        closeDesafioModal();
        goToShop();
    };

    modal.classList.add('active');
}

function goToShop() {
    // Redirigir al aula con la tienda abierta
    window.location.href = `Aula.html?aula=${currentAulaId}&materia=${currentMateria}&tab=desafios&subtab=tienda`;
}

function closeAlertModal() {
    document.getElementById('alertModal').classList.remove('active');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// ============ RESET PROGRESS FUNCTIONS ============

function openResetModal() {
    const modal = document.getElementById('resetModal');
    const input = document.getElementById('resetConfirmInput');
    const confirmBtn = document.getElementById('confirmResetBtn');

    // Limpiar input y deshabilitar botón
    input.value = '';
    input.classList.remove('valid');
    confirmBtn.disabled = true;

    modal.classList.add('active');
}

function closeResetModal() {
    document.getElementById('resetModal').classList.remove('active');
}

function validateResetInput() {
    const input = document.getElementById('resetConfirmInput');
    const confirmBtn = document.getElementById('confirmResetBtn');
    const value = input.value.trim().toUpperCase();

    if (value === 'REINICIAR') {
        input.classList.add('valid');
        confirmBtn.disabled = false;
    } else {
        input.classList.remove('valid');
        confirmBtn.disabled = true;
    }
}

async function confirmResetProgress() {
    const input = document.getElementById('resetConfirmInput');
    if (input.value.trim().toUpperCase() !== 'REINICIAR') return;

    try {
        const db = window.firebaseDB;
        const progresoKey = `progreso_${currentMateria}`;

        // Reiniciar progreso de esta materia incluyendo la racha (por materia)
        await db.collection('usuarios').doc(currentUser.id).update({
            [progresoKey]: {
                xp: 0,
                nivel: 1,
                nivelesCompletados: {},
                nivelDesbloqueado: 1,
                // Racha por materia
                racha: 0,
                mejorRacha: 0,
                ultimoDesafio: null,
                diasDesafios: 0,
                diasCompletados: []
            }
        });

        // Actualizar datos locales
        userGameData.xp = 0;
        userGameData.nivel = 1;
        userGameData.nivelesCompletados = {};
        nivelDesbloqueado = 1;

        // Cerrar modal
        closeResetModal();

        // Actualizar UI
        updateHeaderStats();
        generatePath();

        // Mostrar mensaje de éxito
        showAlert('Progreso Reiniciado', `Tu progreso y racha en ${currentMateria} han sido reiniciados. ¡Buena suerte empezando de nuevo!`, 'info');

        console.log(`Progreso de ${currentMateria} reiniciado completamente`);
    } catch (error) {
        console.error('Error reiniciando progreso:', error);
        showAlert('Error', 'No se pudo reiniciar el progreso. Intenta de nuevo.', 'error');
    }
}
