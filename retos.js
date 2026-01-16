// Retos.js - Sistema de retos globales con LocalStorage

// ============ VARIABLES GLOBALES ============
let currentNivel = 1;
let nivelDesbloqueado = 1;
let currentPreguntaIndex = 0;
let preguntasActuales = [];
let respuestasCorrectas = 0;
let selectedOption = null;
let nivelesData = [];
let energyTimerInterval = null;
let currentNivelData = null;
let editingNivelId = null;

// Datos del usuario
let userGameData = {
    energia: 10,
    energiaMax: 10,
    monedas: 0,
    pistas: 3,
    xp: 0,
    nivel: 1,
    nivelesCompletados: {},
    ultimaRegeneracion: null
};

// Patrón del camino (zigzag)
const pathPattern = [0, -0.6, 0, 0.6, 0, 0.6, 0, -0.6, 0, -0.6];

// ============ SISTEMA DE NIVELES PROGRESIVO ============
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

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', initRetos);
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

function initRetos() {
    // Cargar datos del localStorage
    loadUserData();
    loadNiveles();
    
    // Verificar y regenerar energía
    checkAndRegenerateEnergy();
    
    // Actualizar UI
    updateHeaderStats();
    generatePath();
    
    // Iniciar timer de energía
    startEnergyTimer();
    
    // Setup event listeners
    setupEventListeners();
    
    // Crear modal de zoom para imágenes
    createImageZoomModal();
}

// ============ MODAL ZOOM IMÁGENES ============
function createImageZoomModal() {
    // Verificar si ya existe
    if (document.getElementById('imageZoomModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'imageZoomModal';
    modal.className = 'image-zoom-modal';
    modal.innerHTML = `
        <button class="image-zoom-close" onclick="closeImageZoom()">
            <i class="bi bi-x-lg"></i>
        </button>
        <img id="zoomImage" src="" alt="Imagen ampliada">
    `;
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeImageZoom();
    });
    document.body.appendChild(modal);
}

function openImageZoom(src) {
    const modal = document.getElementById('imageZoomModal');
    const img = document.getElementById('zoomImage');
    if (modal && img) {
        img.src = src;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeImageZoom() {
    const modal = document.getElementById('imageZoomModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Cerrar modal de zoom con Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeImageZoom();
    }
});

// ============ LOCALSTORAGE ============
function loadUserData() {
    const savedData = localStorage.getItem('retos_userData');
    if (savedData) {
        const data = JSON.parse(savedData);
        userGameData = { ...userGameData, ...data };
        nivelDesbloqueado = data.nivelDesbloqueado || 1;
        userGameData.nivel = calculateLevelFromXP(userGameData.xp);
    }
}

function saveUserData() {
    const dataToSave = {
        ...userGameData,
        nivelDesbloqueado: nivelDesbloqueado
    };
    localStorage.setItem('retos_userData', JSON.stringify(dataToSave));
}

function loadNiveles() {
    const savedNiveles = localStorage.getItem('retos_niveles');
    if (savedNiveles) {
        nivelesData = JSON.parse(savedNiveles);
        nivelesData.sort((a, b) => a.numero - b.numero);
    } else {
        // Crear niveles de ejemplo si no hay ninguno
        nivelesData = [];
    }
}

function saveNiveles() {
    localStorage.setItem('retos_niveles', JSON.stringify(nivelesData));
}

// ============ ENERGÍA ============
function checkAndRegenerateEnergy() {
    if (userGameData.energia >= userGameData.energiaMax) return;
    
    const ultimaRegen = userGameData.ultimaRegeneracion ? new Date(userGameData.ultimaRegeneracion) : new Date(0);
    const ahora = new Date();
    const minutosTranscurridos = Math.floor((ahora - ultimaRegen) / (1000 * 60));
    const energiasARegenerar = Math.floor(minutosTranscurridos / 10);
    
    if (energiasARegenerar > 0) {
        userGameData.energia = Math.min(userGameData.energia + energiasARegenerar, userGameData.energiaMax);
        userGameData.ultimaRegeneracion = ahora.toISOString();
        saveUserData();
    }
}

function startEnergyTimer() {
    if (energyTimerInterval) clearInterval(energyTimerInterval);
    updateEnergyTimer();
    energyTimerInterval = setInterval(updateEnergyTimer, 1000);
}

function updateEnergyTimer() {
    const timerElement = document.getElementById('energyTimer');
    const timerText = document.getElementById('timerText');
    
    if (!timerElement || !timerText) return;
    
    if (userGameData.energia >= userGameData.energiaMax) {
        timerElement.style.display = 'none';
        return;
    }
    
    const ahora = new Date();
    const ultimaRegen = userGameData.ultimaRegeneracion ? new Date(userGameData.ultimaRegeneracion) : ahora;
    const tiempoTranscurrido = ahora - ultimaRegen;
    const tiempoParaProxima = (10 * 60 * 1000) - (tiempoTranscurrido % (10 * 60 * 1000));
    
    if (tiempoParaProxima <= 0 || tiempoTranscurrido >= 10 * 60 * 1000) {
        regenerateOneEnergy();
        return;
    }
    
    timerElement.style.display = 'flex';
    const minutosRestantes = Math.floor(tiempoParaProxima / (1000 * 60));
    const segundosRestantes = Math.floor((tiempoParaProxima % (1000 * 60)) / 1000);
    timerText.textContent = `${minutosRestantes.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
}

function regenerateOneEnergy() {
    if (userGameData.energia >= userGameData.energiaMax) return;
    userGameData.energia++;
    userGameData.ultimaRegeneracion = new Date().toISOString();
    saveUserData();
    updateHeaderStats();
}

// ============ UI UPDATES ============
function updateHeaderStats() {
    document.getElementById('energiaActual').textContent = userGameData.energia;
    document.getElementById('monedasActual').textContent = userGameData.monedas;
    // El nivel mostrado es el nivel desbloqueado actual (el nodo en el que está)
    document.getElementById('nivelActual').textContent = nivelDesbloqueado;
    document.getElementById('pistasActual').textContent = userGameData.pistas;
    
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
}

// ============ GENERAR CAMINO ============
function generatePath() {
    const container = document.getElementById('pathContainer');
    container.innerHTML = '';
    
    if (nivelesData.length === 0) {
        container.innerHTML = `
            <div class="no-niveles-message">
                <i class="bi bi-emoji-frown"></i>
                <h3>No hay niveles disponibles</h3>
                <p>Crea tu primer nivel usando el botón de configuración.</p>
                <button class="create-first-btn" onclick="openAdminModal()">
                    <i class="bi bi-plus-circle"></i> Crear Nivel
                </button>
            </div>
        `;
        return;
    }
    
    const nodesContainer = document.createElement('div');
    nodesContainer.className = 'nodes-container';
    nodesContainer.id = 'nodesContainer';
    
    let nodeIndex = 0;
    
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
    
    const chestKey = `chest_${afterLevel}`;
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

// ============ DIBUJAR LÍNEAS ============
function drawLines() {
    const container = document.getElementById('pathContainer');
    const nodesContainer = document.getElementById('nodesContainer');
    if (!nodesContainer) return;
    
    const existingSvg = container.querySelector('.path-svg');
    if (existingSvg) existingSvg.remove();
    
    const nodes = nodesContainer.querySelectorAll('.level-node');
    if (nodes.length < 2) return;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('path-svg');
    svg.style.width = '100%';
    svg.style.height = nodesContainer.offsetHeight + 'px';
    
    // Agregar definiciones de gradientes
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Gradiente para líneas completadas
    const gradCompleted = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradCompleted.setAttribute('id', 'gradientCompleted');
    gradCompleted.setAttribute('gradientUnits', 'userSpaceOnUse');
    gradCompleted.innerHTML = `
        <stop offset="0%" stop-color="#7ED321"/>
        <stop offset="50%" stop-color="#58CC02"/>
        <stop offset="100%" stop-color="#46A302"/>
    `;
    defs.appendChild(gradCompleted);
    
    // Gradiente para líneas disponibles
    const gradAvailable = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradAvailable.setAttribute('id', 'gradientAvailable');
    gradAvailable.setAttribute('gradientUnits', 'userSpaceOnUse');
    gradAvailable.innerHTML = `
        <stop offset="0%" stop-color="#BA68C8"/>
        <stop offset="50%" stop-color="#9C27B0"/>
        <stop offset="100%" stop-color="#7B1FA2"/>
    `;
    defs.appendChild(gradAvailable);
    
    svg.appendChild(defs);
    
    for (let i = 0; i < nodes.length - 1; i++) {
        const node1 = nodes[i];
        const node2 = nodes[i + 1];
        
        const rect1 = node1.getBoundingClientRect();
        const rect2 = node2.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const x1 = rect1.left - containerRect.left + rect1.width / 2;
        const y1 = rect1.top - containerRect.top + rect1.height / 2;
        const x2 = rect2.left - containerRect.left + rect2.width / 2;
        const y2 = rect2.top - containerRect.top + rect2.height / 2;
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.classList.add('path-line');
        
        if (node2.classList.contains('completed')) {
            line.classList.add('completed');
        } else if (node2.classList.contains('available')) {
            line.classList.add('available');
        } else {
            line.classList.add('locked');
        }
        
        svg.appendChild(line);
    }
    
    container.insertBefore(svg, nodesContainer);
}

function redrawLines() {
    drawLines();
}


// ============ EVENT LISTENERS ============
function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', () => {
        window.history.back();
    });
    
    // Admin button
    document.getElementById('adminBtn').addEventListener('click', openAdminModal);
    document.getElementById('closeAdminModal').addEventListener('click', closeAdminModal);
    
    // Admin tabs
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => switchAdminTab(tab.dataset.tab));
    });
    
    // Form nivel
    document.getElementById('formNivel').addEventListener('submit', handleSaveNivel);
    document.getElementById('addPreguntaBtn').addEventListener('click', addPreguntaForm);
    
    // Desafio modal
    document.getElementById('closeDesafioModal').addEventListener('click', closeDesafioModal);
    document.getElementById('cancelDesafio').addEventListener('click', closeDesafioModal);
    document.getElementById('startDesafio').addEventListener('click', startDesafio);
    
    // Pregunta modal
    document.getElementById('closePreguntaModal').addEventListener('click', closePreguntaModal);
    document.getElementById('verificarBtn').addEventListener('click', verificarRespuesta);
    
    // Resultado modal
    document.getElementById('continuarBtn').addEventListener('click', closeResultadoModal);
    
    // Alert modal
    document.getElementById('alertBtn').addEventListener('click', closeAlertModal);
    
    // Pista modal
    document.getElementById('closePistaModal').addEventListener('click', closePistaModal);
    
    // Reset modal
    document.getElementById('resetProgressBtn').addEventListener('click', openResetModal);
    document.getElementById('cancelResetBtn').addEventListener('click', closeResetModal);
    document.getElementById('resetConfirmInput').addEventListener('input', checkResetConfirmation);
    document.getElementById('confirmResetBtn').addEventListener('click', confirmReset);
}

// ============ ADMIN MODAL ============
function openAdminModal() {
    editingNivelId = null;
    resetNivelForm();
    updateNivelesLista();
    document.getElementById('adminModal').classList.add('active');
}

function closeAdminModal() {
    document.getElementById('adminModal').classList.remove('active');
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    
    document.querySelector(`.admin-tab[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName === 'crear' ? 'tabCrear' : 'tabLista').classList.add('active');
    
    if (tabName === 'lista') {
        updateNivelesLista();
    }
}

function resetNivelForm() {
    document.getElementById('formNivel').reset();
    document.getElementById('nivelNumero').value = nivelesData.length + 1;
    document.getElementById('nivelMonedas').value = 10;
    document.getElementById('nivelXP').value = 20;
    document.getElementById('preguntasContainer').innerHTML = '';
    addPreguntaForm(); // Agregar una pregunta por defecto
}

function addPreguntaForm() {
    const container = document.getElementById('preguntasContainer');
    const index = container.children.length + 1;
    
    const preguntaHTML = `
        <div class="pregunta-item" data-index="${index}">
            <div class="pregunta-item-header">
                <span>Pregunta ${index}</span>
                <button type="button" class="remove-pregunta-btn" onclick="removePregunta(this)">
                    <i class="bi bi-x"></i>
                </button>
            </div>
            <input type="text" placeholder="Escribe la pregunta..." class="pregunta-texto-input" required>
            <div class="opciones-inputs">
                <div class="opcion-input-row">
                    <span class="opcion-label">A</span>
                    <input type="text" placeholder="Opción A" class="opcion-input" required>
                    <input type="radio" name="correcta_${index}" value="0" required>
                </div>
                <div class="opcion-input-row">
                    <span class="opcion-label">B</span>
                    <input type="text" placeholder="Opción B" class="opcion-input" required>
                    <input type="radio" name="correcta_${index}" value="1">
                </div>
                <div class="opcion-input-row">
                    <span class="opcion-label">C</span>
                    <input type="text" placeholder="Opción C" class="opcion-input" required>
                    <input type="radio" name="correcta_${index}" value="2">
                </div>
                <div class="opcion-input-row">
                    <span class="opcion-label">D</span>
                    <input type="text" placeholder="Opción D" class="opcion-input" required>
                    <input type="radio" name="correcta_${index}" value="3">
                </div>
            </div>
            <input type="text" placeholder="Pista (opcional)" class="pista-input">
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', preguntaHTML);
}

function removePregunta(btn) {
    const container = document.getElementById('preguntasContainer');
    if (container.children.length > 1) {
        btn.closest('.pregunta-item').remove();
        // Renumerar preguntas
        container.querySelectorAll('.pregunta-item').forEach((item, i) => {
            item.querySelector('.pregunta-item-header span').textContent = `Pregunta ${i + 1}`;
            item.dataset.index = i + 1;
            item.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.name = `correcta_${i + 1}`;
            });
        });
    }
}

function handleSaveNivel(e) {
    e.preventDefault();
    
    const numero = parseInt(document.getElementById('nivelNumero').value);
    const tema = document.getElementById('nivelTema').value.trim();
    const descripcion = document.getElementById('nivelDescripcion').value.trim();
    const monedas = parseInt(document.getElementById('nivelMonedas').value) || 10;
    const xp = parseInt(document.getElementById('nivelXP').value) || 20;
    
    // Recopilar preguntas
    const preguntas = [];
    document.querySelectorAll('.pregunta-item').forEach(item => {
        const preguntaTexto = item.querySelector('.pregunta-texto-input').value.trim();
        const opciones = [];
        item.querySelectorAll('.opcion-input').forEach(input => {
            opciones.push(input.value.trim());
        });
        const correctaRadio = item.querySelector('input[type="radio"]:checked');
        const correcta = correctaRadio ? parseInt(correctaRadio.value) : 0;
        const pista = item.querySelector('.pista-input').value.trim();
        
        if (preguntaTexto && opciones.every(o => o)) {
            preguntas.push({
                pregunta: preguntaTexto,
                opciones: opciones,
                correcta: correcta,
                pista: pista || null
            });
        }
    });
    
    if (preguntas.length === 0) {
        showAlert('Error', 'Debes agregar al menos una pregunta completa.');
        return;
    }
    
    const nivelData = {
        id: editingNivelId || `nivel_${Date.now()}`,
        numero: numero,
        tema: tema,
        descripcion: descripcion || 'Responde correctamente las preguntas para ganar recompensas.',
        recompensaMonedas: monedas,
        recompensaXP: xp,
        preguntas: preguntas
    };
    
    if (editingNivelId) {
        // Editar nivel existente
        const index = nivelesData.findIndex(n => n.id === editingNivelId);
        if (index !== -1) {
            nivelesData[index] = nivelData;
        }
    } else {
        // Verificar si ya existe un nivel con ese número
        const existente = nivelesData.find(n => n.numero === numero);
        if (existente) {
            showAlert('Error', `Ya existe un nivel con el número ${numero}.`);
            return;
        }
        nivelesData.push(nivelData);
    }
    
    nivelesData.sort((a, b) => a.numero - b.numero);
    saveNiveles();
    
    showAlert('¡Éxito!', editingNivelId ? 'Nivel actualizado correctamente.' : 'Nivel creado correctamente.');
    
    editingNivelId = null;
    resetNivelForm();
    generatePath();
    switchAdminTab('lista');
}

function updateNivelesLista() {
    const lista = document.getElementById('nivelesLista');
    
    if (nivelesData.length === 0) {
        lista.innerHTML = `
            <div class="niveles-empty">
                <i class="bi bi-inbox"></i>
                <p>No hay niveles creados</p>
            </div>
        `;
        return;
    }
    
    lista.innerHTML = nivelesData.map(nivel => `
        <div class="nivel-item" data-id="${nivel.id}">
            <div class="nivel-item-info">
                <div class="nivel-item-numero">Nivel ${nivel.numero}</div>
                <div class="nivel-item-tema">${nivel.tema || 'Sin tema'}</div>
                <div class="nivel-item-preguntas">${nivel.preguntas.length} preguntas</div>
            </div>
            <div class="nivel-item-actions">
                <button class="nivel-edit-btn" onclick="editNivel('${nivel.id}')">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="nivel-delete-btn" onclick="deleteNivel('${nivel.id}')">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function editNivel(nivelId) {
    const nivel = nivelesData.find(n => n.id === nivelId);
    if (!nivel) return;
    
    editingNivelId = nivelId;
    
    document.getElementById('nivelNumero').value = nivel.numero;
    document.getElementById('nivelTema').value = nivel.tema || '';
    document.getElementById('nivelDescripcion').value = nivel.descripcion || '';
    document.getElementById('nivelMonedas').value = nivel.recompensaMonedas || 10;
    document.getElementById('nivelXP').value = nivel.recompensaXP || 20;
    
    // Cargar preguntas
    const container = document.getElementById('preguntasContainer');
    container.innerHTML = '';
    
    nivel.preguntas.forEach((pregunta, index) => {
        addPreguntaForm();
        const item = container.lastElementChild;
        item.querySelector('.pregunta-texto-input').value = pregunta.pregunta;
        item.querySelectorAll('.opcion-input').forEach((input, i) => {
            input.value = pregunta.opciones[i] || '';
        });
        const radioToCheck = item.querySelector(`input[type="radio"][value="${pregunta.correcta}"]`);
        if (radioToCheck) radioToCheck.checked = true;
        if (pregunta.pista) {
            item.querySelector('.pista-input').value = pregunta.pista;
        }
    });
    
    switchAdminTab('crear');
}

function deleteNivel(nivelId) {
    if (!confirm('¿Estás seguro de eliminar este nivel?')) return;
    
    nivelesData = nivelesData.filter(n => n.id !== nivelId);
    saveNiveles();
    updateNivelesLista();
    generatePath();
}

// ============ DESAFIO MODAL ============
function openDesafioModal(nivelData, numero) {
    currentNivel = numero;
    currentNivelData = nivelData;
    preguntasActuales = nivelData.preguntas || [];
    
    const modal = document.getElementById('desafioModal');
    document.getElementById('desafioTitulo').textContent = `Nivel ${numero}`;
    modal.querySelector('.desafio-descripcion').textContent = nivelData.descripcion || 'Responde correctamente las preguntas para ganar recompensas.';
    
    const monedasRecompensa = nivelData.recompensaMonedas || 10;
    const xpRecompensa = nivelData.recompensaXP || 20;
    
    modal.querySelector('.desafio-recompensas').innerHTML = `
        <div class="recompensa"><i class="bi bi-coin"></i> +${monedasRecompensa} Monedas</div>
        <div class="recompensa"><i class="bi bi-star-fill"></i> +${xpRecompensa} XP</div>
    `;
    
    document.getElementById('startDesafio').dataset.isChest = 'false';
    document.getElementById('startDesafio').dataset.nivelId = nivelData.id;
    
    modal.classList.add('active');
}

function openChestModal(nivel) {
    currentNivel = nivel;
    
    const modal = document.getElementById('desafioModal');
    document.getElementById('desafioTitulo').textContent = '¡Cofre de Recompensa!';
    modal.querySelector('.desafio-icon').innerHTML = '<i class="bi bi-box2-heart-fill"></i>';
    modal.querySelector('.desafio-descripcion').textContent = '¡Felicidades! Has alcanzado un cofre de recompensa.';
    modal.querySelector('.desafio-recompensas').innerHTML = `
        <div class="recompensa"><i class="bi bi-coin"></i> +100 Monedas</div>
    `;
    modal.querySelector('.desafio-costo').style.display = 'none';
    document.getElementById('startDesafio').innerHTML = '<i class="bi bi-box-arrow-in-down"></i> Abrir Cofre';
    document.getElementById('startDesafio').dataset.isChest = 'true';
    
    modal.classList.add('active');
}

function closeDesafioModal() {
    document.getElementById('desafioModal').classList.remove('active');
    // Restaurar icono y costo
    const modal = document.getElementById('desafioModal');
    modal.querySelector('.desafio-icon').innerHTML = '<i class="bi bi-trophy-fill"></i>';
    modal.querySelector('.desafio-costo').style.display = 'flex';
    document.getElementById('startDesafio').innerHTML = '<i class="bi bi-play-fill"></i> Comenzar';
}

function startDesafio() {
    const startBtn = document.getElementById('startDesafio');
    const isChest = startBtn.dataset.isChest === 'true';
    
    if (isChest) {
        openChest();
        return;
    }
    
    if (userGameData.energia < 1) {
        showAlert('¡Sin Energía!', 'No tienes suficiente energía. Espera 10 minutos para regenerar 1 energía.');
        return;
    }
    
    if (!preguntasActuales || preguntasActuales.length === 0) {
        showAlert('Error', 'Este nivel no tiene preguntas configuradas.');
        return;
    }
    
    // Consumir energía
    userGameData.energia--;
    userGameData.ultimaRegeneracion = new Date().toISOString();
    saveUserData();
    updateHeaderStats();
    
    closeDesafioModal();
    
    currentPreguntaIndex = 0;
    respuestasCorrectas = 0;
    
    showPregunta();
}

function openChest() {
    const chestKey = `chest_${currentNivel}`;
    
    userGameData.monedas += 100;
    userGameData.nivelesCompletados[chestKey] = true;
    saveUserData();
    
    closeDesafioModal();
    showChestResult();
    generatePath();
    updateHeaderStats();
}

function showChestResult() {
    const resultadoIcon = document.getElementById('resultadoIcon');
    resultadoIcon.className = 'resultado-icon success';
    resultadoIcon.innerHTML = '<i class="bi bi-gift-fill"></i>';
    
    document.getElementById('resultadoTitulo').textContent = '¡Cofre Abierto!';
    document.getElementById('resultadoMensaje').textContent = 'Has obtenido tu recompensa';
    document.getElementById('resultadoStars').style.display = 'none';
    
    document.getElementById('resultadoStats').innerHTML = `
        <div class="resultado-stat">
            <i class="bi bi-coin"></i>
            <span>+100 Monedas</span>
        </div>
    `;
    
    document.getElementById('resultadoModal').classList.add('active');
}


// ============ PREGUNTA MODAL ============
function showPregunta() {
    const pregunta = preguntasActuales[currentPreguntaIndex];
    
    // Mostrar tema
    const temaElement = document.getElementById('preguntaTema');
    if (temaElement && currentNivelData) {
        const tema = currentNivelData.tema || '';
        if (tema) {
            temaElement.style.display = 'flex';
            temaElement.querySelector('span').textContent = tema;
        } else {
            temaElement.style.display = 'none';
        }
    }
    
    // Progreso
    const progreso = ((currentPreguntaIndex + 1) / preguntasActuales.length) * 100;
    document.getElementById('progresoFill').style.width = `${progreso}%`;
    document.getElementById('preguntaNumero').textContent = `${currentPreguntaIndex + 1}/${preguntasActuales.length}`;
    
    document.getElementById('preguntaTexto').textContent = pregunta.pregunta;
    
    const opcionesContainer = document.getElementById('opcionesContainer');
    opcionesContainer.innerHTML = '';
    
    // Botón de pista
    if (pregunta.pista) {
        const pistaBtn = document.createElement('button');
        pistaBtn.type = 'button';
        if (userGameData.pistas > 0) {
            pistaBtn.className = 'pista-btn';
            pistaBtn.innerHTML = `
                <div class="pista-btn-left">
                    <div class="pista-btn-icon"><i class="bi bi-lightbulb-fill"></i></div>
                    <span class="pista-btn-text">Usar Pista</span>
                </div>
                <div class="pista-btn-count">
                    <i class="bi bi-lightbulb"></i> ${userGameData.pistas}
                </div>
            `;
            pistaBtn.addEventListener('click', () => usarPista(pregunta.pista));
        } else {
            pistaBtn.className = 'pista-btn pista-btn-no-hints';
            pistaBtn.innerHTML = `
                <div class="pista-btn-left">
                    <div class="pista-btn-icon"><i class="bi bi-lightbulb"></i></div>
                    <span class="pista-btn-text">Sin pistas</span>
                </div>
            `;
        }
        opcionesContainer.appendChild(pistaBtn);
    }
    
    // Opciones
    const letras = ['A', 'B', 'C', 'D'];
    
    // Detectar si alguna opción tiene imagen (contiene <img o es una URL de imagen)
    const hasImages = pregunta.opciones.some(opcion => 
        opcion.includes('<img') || 
        /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(opcion) ||
        opcion.includes('data:image')
    );
    
    // Agregar clase si hay imágenes
    if (hasImages) {
        opcionesContainer.classList.add('has-images');
    } else {
        opcionesContainer.classList.remove('has-images');
    }
    
    pregunta.opciones.forEach((opcion, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opcion-btn';
        
        // Verificar si la opción contiene una imagen
        const isImageOption = opcion.includes('<img') || 
            /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(opcion) ||
            opcion.includes('data:image');
        
        if (isImageOption) {
            btn.classList.add('has-image');
            
            // Extraer la URL de la imagen y el texto
            let imgSrc = '';
            let textoOpcion = opcion;
            
            if (opcion.includes('<img')) {
                // Extraer src del tag img
                const srcMatch = opcion.match(/src=["']([^"']+)["']/);
                if (srcMatch) {
                    imgSrc = srcMatch[1];
                }
                // Extraer texto fuera del tag img
                textoOpcion = opcion.replace(/<img[^>]*>/gi, '').trim();
            } else if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(opcion)) {
                // Es una URL directa de imagen
                imgSrc = opcion;
                textoOpcion = '';
            } else if (opcion.includes('data:image')) {
                imgSrc = opcion;
                textoOpcion = '';
            }
            
            btn.innerHTML = `
                <div class="opcion-content">
                    <span class="opcion-letra">${letras[index]}</span>
                    <div class="opcion-image-container">
                        <img src="${imgSrc}" alt="Opción ${letras[index]}" onclick="event.stopPropagation(); openImageZoom('${imgSrc.replace(/'/g, "\\'")}')">
                        <span class="zoom-icon"><i class="bi bi-zoom-in"></i></span>
                    </div>
                    ${textoOpcion ? `<span class="opcion-texto">${textoOpcion}</span>` : ''}
                </div>
            `;
        } else {
            btn.innerHTML = `
                <span class="opcion-letra">${letras[index]}</span>
                <span class="opcion-texto">${opcion}</span>
            `;
        }
        
        btn.dataset.index = index;
        btn.addEventListener('click', () => selectOption(btn, index));
        opcionesContainer.appendChild(btn);
    });
    
    selectedOption = null;
    const verificarBtn = document.getElementById('verificarBtn');
    verificarBtn.disabled = true;
    verificarBtn.textContent = 'CONTINUAR';
    verificarBtn.classList.remove('next');
    
    document.getElementById('preguntaModal').classList.add('active');
}

function selectOption(btn, index) {
    const verificarBtn = document.getElementById('verificarBtn');
    if (verificarBtn.classList.contains('next')) return;
    
    document.querySelectorAll('.opcion-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedOption = index;
    verificarBtn.disabled = false;
}

function verificarRespuesta() {
    const verificarBtn = document.getElementById('verificarBtn');
    
    if (verificarBtn.classList.contains('next')) {
        // Siguiente pregunta
        currentPreguntaIndex++;
        if (currentPreguntaIndex < preguntasActuales.length) {
            showPregunta();
        } else {
            closePreguntaModal();
            showResultado();
        }
        return;
    }
    
    const pregunta = preguntasActuales[currentPreguntaIndex];
    const esCorrecta = selectedOption === pregunta.correcta;
    
    // Marcar opciones
    document.querySelectorAll('.opcion-btn').forEach((btn, i) => {
        if (i === pregunta.correcta) {
            btn.classList.add('correct');
        } else if (i === selectedOption && !esCorrecta) {
            btn.classList.add('incorrect');
        }
        btn.style.pointerEvents = 'none';
    });
    
    if (esCorrecta) {
        respuestasCorrectas++;
    }
    
    // Cambiar botón a "Siguiente"
    verificarBtn.textContent = currentPreguntaIndex < preguntasActuales.length - 1 ? 'SIGUIENTE' : 'VER RESULTADO';
    verificarBtn.classList.add('next');
}

function closePreguntaModal() {
    document.getElementById('preguntaModal').classList.remove('active');
}

// ============ PISTAS ============
function usarPista(pista) {
    if (userGameData.pistas <= 0) return;
    
    userGameData.pistas--;
    saveUserData();
    updateHeaderStats();
    
    // Ocultar botón de pista
    const pistaBtn = document.querySelector('.pista-btn');
    if (pistaBtn) pistaBtn.style.display = 'none';
    
    // Mostrar modal de pista
    document.getElementById('pistaModalText').textContent = pista;
    document.getElementById('pistaModal').classList.add('active');
}

function closePistaModal() {
    document.getElementById('pistaModal').classList.remove('active');
}

// ============ RESULTADO ============
function showResultado() {
    const totalPreguntas = preguntasActuales.length;
    const porcentaje = (respuestasCorrectas / totalPreguntas) * 100;
    
    // Calcular estrellas
    let stars = 0;
    if (porcentaje >= 100) stars = 3;
    else if (porcentaje >= 70) stars = 2;
    else if (porcentaje >= 50) stars = 1;
    
    const resultadoIcon = document.getElementById('resultadoIcon');
    const resultadoStars = document.getElementById('resultadoStars');
    
    resultadoStars.style.display = 'flex';
    resultadoStars.innerHTML = `
        <i class="bi bi-star-fill ${stars >= 1 ? 'active' : ''}"></i>
        <i class="bi bi-star-fill ${stars >= 2 ? 'active' : ''}"></i>
        <i class="bi bi-star-fill ${stars >= 3 ? 'active' : ''}"></i>
    `;
    
    let monedasGanadas = 0;
    let xpGanado = 0;
    
    if (stars > 0) {
        // Nivel completado
        resultadoIcon.className = 'resultado-icon success';
        resultadoIcon.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
        document.getElementById('resultadoTitulo').textContent = stars === 3 ? '¡Perfecto!' : stars === 2 ? '¡Muy bien!' : '¡Bien!';
        document.getElementById('resultadoMensaje').textContent = 'Has completado el reto';
        
        monedasGanadas = currentNivelData.recompensaMonedas || 10;
        xpGanado = currentNivelData.recompensaXP || 20;
        
        // Bonus por estrellas
        if (stars === 3) {
            monedasGanadas = Math.floor(monedasGanadas * 1.5);
            xpGanado = Math.floor(xpGanado * 1.5);
        } else if (stars === 2) {
            monedasGanadas = Math.floor(monedasGanadas * 1.2);
            xpGanado = Math.floor(xpGanado * 1.2);
        }
        
        // Actualizar datos
        userGameData.monedas += monedasGanadas;
        userGameData.xp += xpGanado;
        userGameData.nivel = calculateLevelFromXP(userGameData.xp);
        
        // Guardar nivel completado
        const prevStars = userGameData.nivelesCompletados[currentNivelData.id]?.stars || 0;
        if (stars > prevStars) {
            userGameData.nivelesCompletados[currentNivelData.id] = { stars: stars, completedAt: new Date().toISOString() };
        }
        
        // Desbloquear siguiente nivel
        if (currentNivel >= nivelDesbloqueado) {
            nivelDesbloqueado = currentNivel + 1;
        }
        
        saveUserData();
        
    } else {
        // Nivel fallido
        resultadoIcon.className = 'resultado-icon fail';
        resultadoIcon.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
        document.getElementById('resultadoTitulo').textContent = '¡Sigue intentando!';
        document.getElementById('resultadoMensaje').textContent = 'Necesitas al menos 50% para pasar';
    }
    
    document.getElementById('respuestasCorrectas').textContent = respuestasCorrectas;
    document.getElementById('monedasGanadas').textContent = monedasGanadas;
    document.getElementById('xpGanado').textContent = xpGanado;
    
    document.getElementById('resultadoStats').innerHTML = `
        <div class="resultado-stat">
            <i class="bi bi-check-circle"></i>
            <span>${respuestasCorrectas}/${totalPreguntas} Correctas</span>
        </div>
        ${monedasGanadas > 0 ? `
        <div class="resultado-stat">
            <i class="bi bi-coin"></i>
            <span>+${monedasGanadas} Monedas</span>
        </div>
        <div class="resultado-stat">
            <i class="bi bi-star-fill"></i>
            <span>+${xpGanado} XP</span>
        </div>
        ` : ''}
    `;
    
    document.getElementById('resultadoModal').classList.add('active');
    
    updateHeaderStats();
    generatePath();
}

function closeResultadoModal() {
    document.getElementById('resultadoModal').classList.remove('active');
}

// ============ ALERTS ============
function showAlert(titulo, mensaje) {
    document.getElementById('alertTitulo').textContent = titulo;
    document.getElementById('alertMensaje').textContent = mensaje;
    document.getElementById('alertModal').classList.add('active');
}

function closeAlertModal() {
    document.getElementById('alertModal').classList.remove('active');
}

// ============ RESET ============
function openResetModal() {
    document.getElementById('resetConfirmInput').value = '';
    document.getElementById('confirmResetBtn').disabled = true;
    document.getElementById('resetModal').classList.add('active');
}

function closeResetModal() {
    document.getElementById('resetModal').classList.remove('active');
}

function checkResetConfirmation() {
    const input = document.getElementById('resetConfirmInput').value;
    document.getElementById('confirmResetBtn').disabled = input !== 'REINICIAR';
}

function confirmReset() {
    // Reiniciar datos del usuario
    userGameData = {
        energia: 10,
        energiaMax: 10,
        monedas: 0,
        pistas: 3,
        xp: 0,
        nivel: 1,
        nivelesCompletados: {},
        ultimaRegeneracion: null
    };
    nivelDesbloqueado = 1;
    
    saveUserData();
    closeResetModal();
    updateHeaderStats();
    generatePath();
    
    showAlert('¡Reiniciado!', 'Tu progreso ha sido reiniciado correctamente.');
}
