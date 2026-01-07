// Desafios.js - Sistema de desafíos estilo Duolingo

let currentUser = null;
let currentMateria = '';
let currentNivel = 1;
let nivelDesbloqueado = 1
let currentPreguntaIndex = 0;
let preguntasActuales = [];
let respuestasCorrectas = 0;
let selectedOption = null;

// Preguntas por materia
const preguntasPorMateria = {
    matematicas: [
        { pregunta: "¿Cuánto es 15 + 27?", opciones: ["40", "42", "44", "38"], correcta: 1 },
        { pregunta: "¿Cuál es el resultado de 8 × 7?", opciones: ["54", "56", "58", "52"], correcta: 1 },
        { pregunta: "Si tengo 100 y gasto 35, ¿cuánto me queda?", opciones: ["75", "60", "65", "55"], correcta: 2 },
        { pregunta: "¿Cuánto es 144 ÷ 12?", opciones: ["10", "11", "12", "14"], correcta: 2 },
        { pregunta: "¿Cuál es el valor de 5²?", opciones: ["10", "15", "20", "25"], correcta: 3 },
        { pregunta: "¿Cuánto es 3 × 9?", opciones: ["24", "27", "30", "21"], correcta: 1 },
        { pregunta: "¿Cuál es la raíz cuadrada de 81?", opciones: ["7", "8", "9", "10"], correcta: 2 }
    ],
    lectura: [
        { pregunta: "¿Qué tipo de palabra es 'rápidamente'?", opciones: ["Sustantivo", "Adjetivo", "Adverbio", "Verbo"], correcta: 2 },
        { pregunta: "¿Cuál es el sinónimo de 'feliz'?", opciones: ["Triste", "Contento", "Enojado", "Cansado"], correcta: 1 },
        { pregunta: "¿Qué signo se usa para hacer una pregunta?", opciones: ["Punto", "Coma", "Signos de interrogación", "Dos puntos"], correcta: 2 },
        { pregunta: "¿Cuál es el antónimo de 'grande'?", opciones: ["Enorme", "Gigante", "Pequeño", "Alto"], correcta: 2 },
        { pregunta: "¿Qué es un sustantivo?", opciones: ["Una acción", "Un nombre", "Una cualidad", "Una cantidad"], correcta: 1 }
    ],
    sociales: [
        { pregunta: "¿Cuál es el continente más grande?", opciones: ["África", "América", "Asia", "Europa"], correcta: 2 },
        { pregunta: "¿Cuántos océanos hay en la Tierra?", opciones: ["3", "4", "5", "6"], correcta: 2 },
        { pregunta: "¿Qué es la democracia?", opciones: ["Gobierno de uno", "Gobierno del pueblo", "Gobierno militar", "Sin gobierno"], correcta: 1 },
        { pregunta: "¿Cuál es la capital de Colombia?", opciones: ["Medellín", "Cali", "Bogotá", "Barranquilla"], correcta: 2 },
        { pregunta: "¿En qué año llegó Colón a América?", opciones: ["1490", "1491", "1492", "1493"], correcta: 2 }
    ],
    naturales: [
        { pregunta: "¿Cuál es el planeta más cercano al Sol?", opciones: ["Venus", "Mercurio", "Tierra", "Marte"], correcta: 1 },
        { pregunta: "¿Qué gas necesitan las plantas para la fotosíntesis?", opciones: ["Oxígeno", "Nitrógeno", "CO₂", "Hidrógeno"], correcta: 2 },
        { pregunta: "¿Cuántos huesos tiene el cuerpo humano adulto?", opciones: ["106", "156", "206", "256"], correcta: 2 },
        { pregunta: "¿Qué órgano bombea la sangre?", opciones: ["Pulmones", "Hígado", "Corazón", "Riñones"], correcta: 2 },
        { pregunta: "¿Cuál es el estado del agua a 0°C?", opciones: ["Líquido", "Sólido", "Gaseoso", "Plasma"], correcta: 1 }
    ],
    ingles: [
        { pregunta: "What is 'perro' in English?", opciones: ["Cat", "Dog", "Bird", "Fish"], correcta: 1 },
        { pregunta: "How do you say 'buenos días'?", opciones: ["Good night", "Good afternoon", "Good morning", "Good evening"], correcta: 2 },
        { pregunta: "What color is the sky?", opciones: ["Green", "Red", "Blue", "Yellow"], correcta: 2 },
        { pregunta: "Complete: She ___ a student.", opciones: ["am", "is", "are", "be"], correcta: 1 },
        { pregunta: "What is the plural of 'child'?", opciones: ["Childs", "Children", "Childes", "Child"], correcta: 1 }
    ]
};

const coloresMaterias = {
    matematicas: { main: '#2196F3', dark: '#1976D2', bg: '#1a3a5c', bgLight: '#234b73' },
    lectura: { main: '#E53935', dark: '#C62828', bg: '#4a2020', bgLight: '#5c2828' },
    sociales: { main: '#FF9800', dark: '#F57C00', bg: '#4a3518', bgLight: '#5c4220' },
    naturales: { main: '#4CAF50', dark: '#388E3C', bg: '#1a3a1c', bgLight: '#234b25' },
    ingles: { main: '#9C27B0', dark: '#7B1FA2', bg: '#3a1a4a', bgLight: '#4b2360' }
};

// Patrón del camino (porcentaje desde el centro: -1 = izq, 0 = centro, 1 = der)
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
    
    // Aplicar colores de la materia
    const colores = coloresMaterias[currentMateria] || coloresMaterias.matematicas;
    document.documentElement.style.setProperty('--materia-color', colores.main);
    document.documentElement.style.setProperty('--materia-dark', colores.dark);
    document.documentElement.style.setProperty('--bg-dark', colores.bg);
    document.documentElement.style.setProperty('--bg-light', colores.bgLight);
    document.body.style.background = `linear-gradient(180deg, ${colores.bg} 0%, ${colores.bgLight} 50%, ${colores.bg} 100%)`;
    
    const nombreMateria = currentMateria.charAt(0).toUpperCase() + currentMateria.slice(1);
    document.getElementById('materiaTitle').textContent = nombreMateria;
    
    generatePath();
    setupEventListeners();
}

function generatePath() {
    const container = document.getElementById('pathContainer');
    container.innerHTML = '';
    
    const totalNiveles = 500;
    
    // Crear contenedor de nodos
    const nodesContainer = document.createElement('div');
    nodesContainer.className = 'nodes-container';
    nodesContainer.id = 'nodesContainer';
    
    let nodeIndex = 0;
    
    // Generar nodos con cofres intercalados
    for (let nivel = 1; nivel <= totalNiveles; nivel++) {
        // Crear nodo de nivel normal
        const patternIndex = nodeIndex % pathPattern.length;
        const offsetPercent = pathPattern[patternIndex];
        
        const row = document.createElement('div');
        row.className = 'level-row';
        row.dataset.offset = offsetPercent;
        
        const node = createLevelNode(nivel, false);
        row.appendChild(node);
        nodesContainer.appendChild(row);
        nodeIndex++;
        
        // Después de cada 10 niveles, agregar un cofre
        if (nivel % 10 === 0) {
            const chestPatternIndex = nodeIndex % pathPattern.length;
            const chestOffset = pathPattern[chestPatternIndex];
            
            const chestRow = document.createElement('div');
            chestRow.className = 'level-row';
            chestRow.dataset.offset = chestOffset;
            
            const chestNode = createChestNode(nivel); // El cofre se desbloquea al completar el nivel 10, 20, etc.
            chestRow.appendChild(chestNode);
            nodesContainer.appendChild(chestRow);
            nodeIndex++;
        }
    }
    
    container.appendChild(nodesContainer);
    
    // Dibujar líneas después de renderizar
    setTimeout(drawLines, 100);
}

function createLevelNode(nivel, isChest = false) {
    const node = document.createElement('div');
    node.className = 'level-node';
    node.dataset.nivel = nivel;
    
    if (nivel < nivelDesbloqueado) {
        node.classList.add('completed');
    } else if (nivel === nivelDesbloqueado) {
        node.classList.add('available');
    } else {
        node.classList.add('locked');
    }
    
    node.innerHTML = `
        <span class="node-number">${nivel}</span>
        <span class="node-check"><i class="bi bi-check-lg"></i></span>
        <span class="node-icon"><i class="bi bi-lock-fill"></i></span>
    `;
    
    if (nivel <= nivelDesbloqueado) {
        node.addEventListener('click', () => openDesafioModal(nivel));
    }
    
    return node;
}

function createChestNode(afterLevel) {
    const node = document.createElement('div');
    node.className = 'level-node chest';
    node.dataset.chestAfter = afterLevel;
    
    // El cofre se desbloquea cuando completas el nivel anterior (afterLevel)
    // Se puede abrir cuando nivelDesbloqueado > afterLevel
    if (nivelDesbloqueado > afterLevel) {
        node.classList.add('available');
    } else {
        node.classList.add('locked');
    }
    
    node.innerHTML = `
        <i class="bi bi-gift-fill chest-icon"></i>
        <span class="chest-coins">+100 <i class="bi bi-coin"></i></span>
    `;
    
    if (nivelDesbloqueado > afterLevel) {
        node.addEventListener('click', () => openChestModal(afterLevel));
    }
    
    return node;
}

function openChestModal(nivel) {
    currentNivel = nivel;
    document.getElementById('desafioTitulo').textContent = `¡Cofre de Recompensa!`;
    document.getElementById('desafioModal').querySelector('.desafio-icon').innerHTML = '<i class="bi bi-box2-heart-fill"></i>';
    document.getElementById('desafioModal').querySelector('.desafio-icon').style.background = 'linear-gradient(180deg, #FFD700 0%, #FFA000 100%)';
    document.getElementById('desafioModal').querySelector('.desafio-descripcion').textContent = '¡Felicidades! Has alcanzado un cofre de recompensa. Ábrelo para obtener tus monedas.';
    document.getElementById('desafioModal').querySelector('.desafio-recompensas').innerHTML = `
        <div class="recompensa"><i class="bi bi-coin"></i> +100 Monedas</div>
    `;
    document.getElementById('desafioModal').querySelector('.desafio-costo').style.display = 'none';
    document.getElementById('startDesafio').innerHTML = '<i class="bi bi-box-arrow-in-down"></i> Abrir Cofre';
    document.getElementById('desafioModal').classList.add('active');
}

function drawLines() {
    // Eliminar SVG anterior
    const oldSvg = document.querySelector('.path-svg');
    if (oldSvg) oldSvg.remove();
    
    const container = document.getElementById('pathContainer');
    const nodesContainer = document.getElementById('nodesContainer');
    const rows = nodesContainer.querySelectorAll('.level-row');
    
    if (rows.length < 2) return;
    
    const containerRect = container.getBoundingClientRect();
    
    // Crear SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('path-svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', nodesContainer.offsetHeight);
    
    // Dibujar líneas entre nodos
    for (let i = 0; i < rows.length - 1; i++) {
        const currentNode = rows[i].querySelector('.level-node');
        const nextNode = rows[i + 1].querySelector('.level-node');
        
        const currentRect = currentNode.getBoundingClientRect();
        const nextRect = nextNode.getBoundingClientRect();
        
        // Calcular posiciones relativas al contenedor
        const x1 = currentRect.left + currentRect.width / 2 - containerRect.left;
        const y1 = currentRect.top + currentRect.height - containerRect.top;
        const x2 = nextRect.left + nextRect.width / 2 - containerRect.left;
        const y2 = nextRect.top - containerRect.top;
        
        // Crear path con curva
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const midY = (y1 + y2) / 2;
        const d = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
        path.setAttribute('d', d);
        path.classList.add('path-line');
        
        // Estado de la línea
        const nivel = i + 1;
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

function setupEventListeners() {
    document.getElementById('backBtn').addEventListener('click', () => {
        const aulaId = new URLSearchParams(window.location.search).get('aula');
        window.location.href = `Aula.html?aula=${aulaId}&materia=${currentMateria}`;
    });
    
    document.getElementById('closeDesafioModal').addEventListener('click', closeDesafioModal);
    document.getElementById('cancelDesafio').addEventListener('click', closeDesafioModal);
    document.getElementById('startDesafio').addEventListener('click', startDesafio);
    
    document.getElementById('closePreguntaModal').addEventListener('click', closePreguntaModal);
    document.getElementById('verificarBtn').addEventListener('click', verificarRespuesta);
    
    document.getElementById('continuarBtn').addEventListener('click', closeResultadoModal);
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });
}

function openDesafioModal(nivel) {
    currentNivel = nivel;
    document.getElementById('desafioTitulo').textContent = `Nivel ${nivel}`;
    document.getElementById('desafioModal').classList.add('active');
}

function closeDesafioModal() {
    document.getElementById('desafioModal').classList.remove('active');
}

function startDesafio() {
    closeDesafioModal();
    
    const preguntas = preguntasPorMateria[currentMateria] || preguntasPorMateria.matematicas;
    preguntasActuales = shuffleArray([...preguntas]).slice(0, 5);
    currentPreguntaIndex = 0;
    respuestasCorrectas = 0;
    
    showPregunta();
}

function showPregunta() {
    const pregunta = preguntasActuales[currentPreguntaIndex];
    
    const progreso = (currentPreguntaIndex / preguntasActuales.length) * 100;
    document.getElementById('progresoFill').style.width = `${progreso}%`;
    document.getElementById('preguntaNumero').textContent = `${currentPreguntaIndex + 1}/${preguntasActuales.length}`;
    
    document.getElementById('preguntaTexto').textContent = pregunta.pregunta;
    
    const opcionesContainer = document.getElementById('opcionesContainer');
    opcionesContainer.innerHTML = '';
    
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

function showResultado() {
    const porcentaje = (respuestasCorrectas / preguntasActuales.length) * 100;
    
    const resultadoIcon = document.getElementById('resultadoIcon');
    const resultadoTitulo = document.getElementById('resultadoTitulo');
    const resultadoMensaje = document.getElementById('resultadoMensaje');
    
    resultadoIcon.className = 'resultado-icon';
    
    if (porcentaje >= 80) {
        resultadoIcon.classList.add('success');
        resultadoIcon.innerHTML = '<i class="bi bi-trophy-fill"></i>';
        resultadoTitulo.textContent = '¡Increíble!';
        resultadoMensaje.textContent = 'Has dominado este nivel';
    } else if (porcentaje >= 50) {
        resultadoIcon.classList.add('partial');
        resultadoIcon.innerHTML = '<i class="bi bi-star-half"></i>';
        resultadoTitulo.textContent = '¡Buen trabajo!';
        resultadoMensaje.textContent = 'Sigue practicando para mejorar';
    } else {
        resultadoIcon.classList.add('fail');
        resultadoIcon.innerHTML = '<i class="bi bi-emoji-frown"></i>';
        resultadoTitulo.textContent = '¡No te rindas!';
        resultadoMensaje.textContent = 'Inténtalo de nuevo';
    }
    
    const monedasGanadas = respuestasCorrectas * 2;
    const xpGanado = respuestasCorrectas * 4;
    
    document.getElementById('respuestasCorrectas').textContent = respuestasCorrectas;
    document.getElementById('monedasGanadas').textContent = monedasGanadas;
    document.getElementById('xpGanado').textContent = xpGanado;
    
    document.getElementById('resultadoModal').classList.add('active');
}

function closeResultadoModal() {
    document.getElementById('resultadoModal').classList.remove('active');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
