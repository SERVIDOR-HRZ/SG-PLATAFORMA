// Desafios Admin - Gestión de niveles de desafíos
// Mínimo 5 preguntas, se pueden agregar más

let desafiosNiveles = [];
let currentMateriaDesafio = 'matematicas';
let currentPreviewIndex = 0;
let currentPreguntasCount = 5; // Número actual de preguntas

const materiasConfig = {
    matematicas: { nombre: 'Matemáticas', icon: 'bi-calculator', color: '#2196F3' },
    lectura: { nombre: 'Lectura Crítica', icon: 'bi-book', color: '#E53935' },
    sociales: { nombre: 'Ciencias Sociales', icon: 'bi-globe', color: '#FF9800' },
    naturales: { nombre: 'Ciencias Naturales', icon: 'bi-tree', color: '#4CAF50' },
    ingles: { nombre: 'Inglés', icon: 'bi-translate', color: '#9C27B0' }
};

// ============ SISTEMA DE MODALES PERSONALIZADOS ============

// Inicializar estilos de modales
function initDesafiosModalStyles() {
    if (document.getElementById('desafios-modal-styles')) return;
    
    const styles = `
        <style id="desafios-modal-styles">
            .desafios-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                backdrop-filter: blur(4px);
            }
            
            .desafios-modal-overlay.active {
                opacity: 1;
                visibility: visible;
            }
            
            .desafios-modal-box {
                background: white;
                border-radius: 16px;
                max-width: 400px;
                width: 90%;
                transform: scale(0.9);
                transition: transform 0.3s ease;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                overflow: hidden;
            }
            
            .desafios-modal-overlay.active .desafios-modal-box {
                transform: scale(1);
            }
            
            .desafios-modal-header {
                padding: 20px 24px;
                border-bottom: 1px solid #eee;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .desafios-modal-header.success { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; }
            .desafios-modal-header.error { background: linear-gradient(135deg, #f44336, #d32f2f); color: white; }
            .desafios-modal-header.warning { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; }
            .desafios-modal-header.info { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; }
            .desafios-modal-header.confirm { background: linear-gradient(135deg, #9c27b0, #7b1fa2); color: white; }
            
            .desafios-modal-header i {
                font-size: 24px;
            }
            
            .desafios-modal-header h4 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
            }
            
            .desafios-modal-body {
                padding: 24px;
            }
            
            .desafios-modal-body p {
                margin: 0;
                color: #555;
                font-size: 15px;
                line-height: 1.6;
            }
            
            .desafios-modal-footer {
                padding: 16px 24px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
                background: #f8f9fa;
            }
            
            .desafios-modal-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 8px;
                transition: all 0.2s ease;
            }
            
            .desafios-modal-btn-cancel {
                background: #e0e0e0;
                color: #555;
            }
            
            .desafios-modal-btn-cancel:hover {
                background: #d0d0d0;
            }
            
            .desafios-modal-btn-confirm {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
            }
            
            .desafios-modal-btn-confirm:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
            }
            
            .desafios-modal-btn-danger {
                background: linear-gradient(135deg, #f44336, #d32f2f);
                color: white;
            }
            
            .desafios-modal-btn-danger:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4);
            }
            
            .desafios-modal-btn-primary {
                background: linear-gradient(135deg, #2196F3, #1976D2);
                color: white;
            }
            
            .desafios-modal-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
            }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
}

// Mostrar modal de alerta (reemplaza alert)
function showDesafiosAlert(title, message, type = 'info') {
    initDesafiosModalStyles();
    
    const icons = {
        success: 'bi-check-circle-fill',
        error: 'bi-x-circle-fill',
        warning: 'bi-exclamation-triangle-fill',
        info: 'bi-info-circle-fill'
    };
    
    const modalHTML = `
        <div class="desafios-modal-overlay" id="desafiosAlertModal">
            <div class="desafios-modal-box">
                <div class="desafios-modal-header ${type}">
                    <i class="bi ${icons[type] || icons.info}"></i>
                    <h4>${title}</h4>
                </div>
                <div class="desafios-modal-body">
                    <p>${message}</p>
                </div>
                <div class="desafios-modal-footer">
                    <button class="desafios-modal-btn desafios-modal-btn-primary" id="desafiosAlertOk">
                        <i class="bi bi-check-lg"></i>
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    const overlay = document.getElementById('desafiosAlertModal');
    const okBtn = document.getElementById('desafiosAlertOk');
    
    setTimeout(() => overlay.classList.add('active'), 10);
    
    const closeModal = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };
    
    okBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
}

// Mostrar modal de confirmación (reemplaza confirm)
function showDesafiosConfirm(title, message, type = 'confirm') {
    initDesafiosModalStyles();
    
    return new Promise((resolve) => {
        const icons = {
            confirm: 'bi-question-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            danger: 'bi-trash-fill'
        };
        
        const modalHTML = `
            <div class="desafios-modal-overlay" id="desafiosConfirmModal">
                <div class="desafios-modal-box">
                    <div class="desafios-modal-header ${type}">
                        <i class="bi ${icons[type] || icons.confirm}"></i>
                        <h4>${title}</h4>
                    </div>
                    <div class="desafios-modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="desafios-modal-footer">
                        <button class="desafios-modal-btn desafios-modal-btn-cancel" id="desafiosConfirmCancel">
                            <i class="bi bi-x-lg"></i>
                            Cancelar
                        </button>
                        <button class="desafios-modal-btn ${type === 'danger' ? 'desafios-modal-btn-danger' : 'desafios-modal-btn-confirm'}" id="desafiosConfirmOk">
                            <i class="bi bi-check-lg"></i>
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('desafiosConfirmModal');
        const okBtn = document.getElementById('desafiosConfirmOk');
        const cancelBtn = document.getElementById('desafiosConfirmCancel');
        
        setTimeout(() => overlay.classList.add('active'), 10);
        
        const closeModal = (result) => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            resolve(result);
        };
        
        okBtn.addEventListener('click', () => closeModal(true));
        cancelBtn.addEventListener('click', () => closeModal(false));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal(false);
        });
        
        // ESC para cancelar
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleEsc);
                closeModal(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('desafiosAdminView')) {
        initDesafiosAdmin();
    }
});

function initDesafiosAdmin() {
    setupDesafiosEventListeners();
    loadDesafiosNiveles();
}

function setupDesafiosEventListeners() {
    // Menú de materias (botones)
    const materiasMenu = document.getElementById('materiasMenu');
    if (materiasMenu) {
        materiasMenu.querySelectorAll('.materia-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                // Remover active de todos
                materiasMenu.querySelectorAll('.materia-btn').forEach(b => b.classList.remove('active'));
                // Agregar active al clickeado
                this.classList.add('active');
                // Cambiar materia
                currentMateriaDesafio = this.dataset.materia;
                // Actualizar título
                const materiaTitle = document.getElementById('materiaTitle');
                if (materiaTitle) {
                    materiaTitle.textContent = materiasConfig[currentMateriaDesafio]?.nombre || currentMateriaDesafio;
                }
                loadDesafiosNiveles();
            });
        });
    }

    const createNivelBtn = document.getElementById('createNivelBtn');
    if (createNivelBtn) {
        createNivelBtn.addEventListener('click', showCreateNivelModal);
    }

    const closeNivelModal = document.getElementById('closeNivelModal');
    if (closeNivelModal) {
        closeNivelModal.addEventListener('click', hideNivelModal);
    }

    const cancelNivel = document.getElementById('cancelNivel');
    if (cancelNivel) {
        cancelNivel.addEventListener('click', hideNivelModal);
    }

    const nivelForm = document.getElementById('nivelForm');
    if (nivelForm) {
        nivelForm.addEventListener('submit', handleSaveNivel);
    }

    // Tab navigation
    setupNivelTabs();
    
    // Description counter
    const descripcionInput = document.getElementById('nivelDescripcion');
    if (descripcionInput) {
        descripcionInput.addEventListener('input', updateDescripcionCounter);
    }
    
    // Numero validation
    const numeroInput = document.getElementById('nivelNumero');
    if (numeroInput) {
        numeroInput.addEventListener('input', validateNumeroNivel);
    }
    
    // Preview navigation - prevent form submit
    const prevBtn = document.getElementById('prevPreviewBtn');
    const nextBtn = document.getElementById('nextPreviewBtn');
    
    // Remover listeners anteriores clonando los elementos
    if (prevBtn) {
        const newPrevBtn = prevBtn.cloneNode(true);
        prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
        newPrevBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            navigatePreview(-1);
            return false;
        });
    }
    if (nextBtn) {
        const newNextBtn = nextBtn.cloneNode(true);
        nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
        newNextBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            navigatePreview(1);
            return false;
        });
    }
}

function setupNivelTabs() {
    const tabs = document.querySelectorAll('.nivel-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            switchNivelTab(tabName);
        });
    });
}

function switchNivelTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nivel-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.nivel-tab[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.nivel-tab-content').forEach(c => c.classList.remove('active'));
    
    if (tabName === 'general') {
        document.getElementById('tabGeneral')?.classList.add('active');
    } else if (tabName === 'preguntas') {
        document.getElementById('tabPreguntas')?.classList.add('active');
        updatePreguntasCount();
    } else if (tabName === 'preview') {
        document.getElementById('tabPreview')?.classList.add('active');
        currentPreviewIndex = 0;
        updatePreview();
    }
}

function updateDescripcionCounter() {
    const textarea = document.getElementById('nivelDescripcion');
    const counter = document.getElementById('descripcionCounter');
    if (textarea && counter) {
        counter.textContent = `${textarea.value.length}/500`;
    }
}

function validateNumeroNivel() {
    const input = document.getElementById('nivelNumero');
    const validation = document.getElementById('numeroValidation');
    const nivelId = document.getElementById('nivelId')?.value;
    
    if (!input || !validation) return;
    
    const numero = parseInt(input.value);
    const existe = desafiosNiveles.find(n => n.numero === numero && n.id !== nivelId);
    
    if (existe) {
        validation.innerHTML = '<i class="bi bi-x-circle-fill" style="color: #ff4444;"></i>';
        input.classList.add('invalid');
        input.classList.remove('valid');
    } else if (numero >= 1 && numero <= 1000) {
        validation.innerHTML = '<i class="bi bi-check-circle-fill" style="color: #00c853;"></i>';
        input.classList.add('valid');
        input.classList.remove('invalid');
    } else {
        validation.innerHTML = '';
        input.classList.remove('valid', 'invalid');
    }
}

function updatePreguntasCount() {
    let count = 0;
    for (let i = 0; i < currentPreguntasCount; i++) {
        const pregunta = document.querySelector(`input[name="pregunta_${i}"]`)?.value;
        const opciones = [
            document.querySelector(`input[name="opcion_${i}_0"]`)?.value,
            document.querySelector(`input[name="opcion_${i}_1"]`)?.value,
            document.querySelector(`input[name="opcion_${i}_2"]`)?.value,
            document.querySelector(`input[name="opcion_${i}_3"]`)?.value
        ];
        const correcta = document.querySelector(`select[name="correcta_${i}"]`)?.value;
        
        if (pregunta && opciones.every(o => o) && correcta !== '') {
            count++;
        }
    }
    
    const badge = document.getElementById('preguntasCount');
    if (badge) {
        badge.textContent = `${count}/${currentPreguntasCount}`;
        badge.className = 'tab-badge' + (count === currentPreguntasCount ? ' complete' : count > 0 ? ' partial' : '');
    }
}

function updatePreview() {
    const screen = document.getElementById('previewScreen');
    const indicator = document.getElementById('previewIndicator');
    const prevBtn = document.getElementById('prevPreviewBtn');
    const nextBtn = document.getElementById('nextPreviewBtn');
    
    if (!screen) return;
    
    // Asegurar que el índice esté dentro del rango
    if (currentPreviewIndex >= currentPreguntasCount) {
        currentPreviewIndex = currentPreguntasCount - 1;
    }
    
    const i = currentPreviewIndex;
    const tema = document.getElementById('nivelTema')?.value || 'Sin tema';
    const pregunta = document.querySelector(`input[name="pregunta_${i}"]`)?.value || 'Pregunta sin texto';
    const opciones = [
        document.querySelector(`input[name="opcion_${i}_0"]`)?.value || 'Opción A',
        document.querySelector(`input[name="opcion_${i}_1"]`)?.value || 'Opción B',
        document.querySelector(`input[name="opcion_${i}_2"]`)?.value || 'Opción C',
        document.querySelector(`input[name="opcion_${i}_3"]`)?.value || 'Opción D'
    ];
    const correctaVal = document.querySelector(`select[name="correcta_${i}"]`)?.value;
    const correcta = correctaVal !== '' ? parseInt(correctaVal) : -1;
    const pista = document.querySelector(`input[name="pista_${i}"]`)?.value || '';
    
    const letras = ['A', 'B', 'C', 'D'];
    
    // Pista estilo Duolingo/Desafios (amarillo bonito)
    let pistaHTML = '';
    if (pista) {
        pistaHTML = `
            <div class="preview-pista-card">
                <div class="preview-pista-icon">
                    <i class="bi bi-lightbulb-fill"></i>
                </div>
                <div class="preview-pista-title">
                    <i class="bi bi-lightbulb"></i> Pista
                </div>
                <div class="preview-pista-text">
                    ${pista}
                </div>
            </div>
        `;
    } else {
        pistaHTML = `<div class="preview-no-hint"><i class="bi bi-lightbulb"></i> Sin pista configurada</div>`;
    }
    
    screen.innerHTML = `
        <div class="preview-tema">
            <i class="bi bi-bookmark-fill"></i>
            <span>${tema}</span>
        </div>
        <div class="preview-progress">
            <div class="preview-progress-bar">
                <div class="preview-progress-fill" style="width: ${((i + 1) / currentPreguntasCount) * 100}%"></div>
            </div>
            <span>${i + 1}/${currentPreguntasCount}</span>
        </div>
        <div class="preview-question">
            <p>${pregunta}</p>
        </div>
        <div class="preview-options">
            ${opciones.map((op, idx) => `
                <div class="preview-option ${idx === correcta ? 'correct' : ''}">
                    <span class="option-letter">${letras[idx]}</span>
                    <span class="option-text">${op}</span>
                    ${idx === correcta ? '<i class="bi bi-check-circle-fill"></i>' : ''}
                </div>
            `).join('')}
        </div>
        ${pistaHTML}
    `;
    
    if (indicator) indicator.textContent = `Pregunta ${i + 1} de ${currentPreguntasCount}`;
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = i >= currentPreguntasCount - 1;
}

function navigatePreview(direction) {
    const newIndex = currentPreviewIndex + direction;
    if (newIndex >= 0 && newIndex < currentPreguntasCount) {
        currentPreviewIndex = newIndex;
        updatePreview();
    }
}

async function loadDesafiosNiveles() {
    const container = document.getElementById('desafiosNivelesList');
    if (!container) return;

    container.innerHTML = `
        <div class="loading-niveles">
            <i class="bi bi-arrow-clockwise spin"></i>
            <p>Cargando niveles...</p>
        </div>
    `;

    try {
        if (!window.firebaseDB) {
            await new Promise(resolve => {
                const check = () => {
                    if (window.firebaseDB) resolve();
                    else setTimeout(check, 100);
                };
                check();
            });
        }

        const db = window.firebaseDB;

        // Obtener TODOS los documentos y filtrar en cliente (evita índices)
        const snapshot = await db.collection('desafios_niveles').get();

        desafiosNiveles = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.materia === currentMateriaDesafio) {
                desafiosNiveles.push({ id: doc.id, ...data });
            }
        });

        desafiosNiveles.sort((a, b) => (a.numero || 0) - (b.numero || 0));
        renderDesafiosNiveles();
    } catch (error) {
        console.error('Error cargando niveles:', error);
        desafiosNiveles = [];
        renderDesafiosNiveles();
    }
}

function renderDesafiosNiveles() {
    const container = document.getElementById('desafiosNivelesList');
    if (!container) return;

    if (desafiosNiveles.length === 0) {
        container.innerHTML = `
            <div class="empty-niveles">
                <i class="bi bi-trophy"></i>
                <h3>No hay niveles creados</h3>
                <p>Crea el primer nivel para ${materiasConfig[currentMateriaDesafio]?.nombre || currentMateriaDesafio}</p>
            </div>
        `;
        return;
    }

    const config = materiasConfig[currentMateriaDesafio];

    container.innerHTML = desafiosNiveles.map(nivel => `
        <div class="nivel-card" data-id="${nivel.id}" style="--nivel-color: ${config.color}">
            <div class="nivel-header">
                <div class="nivel-number">
                    <i class="bi bi-trophy-fill"></i>
                    <span>Nivel ${nivel.numero}</span>
                </div>
                <div class="nivel-actions">
                    <button class="btn-clone-nivel" onclick="cloneNivel('${nivel.id}')" title="Clonar nivel">
                        <i class="bi bi-copy"></i>
                    </button>
                    <button class="btn-edit-nivel" onclick="editNivel('${nivel.id}')" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-delete-nivel" onclick="deleteNivel('${nivel.id}')" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="nivel-body">
                <p class="nivel-descripcion">${nivel.descripcion || 'Sin descripción'}</p>
                <div class="nivel-stats">
                    <span><i class="bi bi-question-circle"></i> ${nivel.preguntas?.length || 5} preguntas</span>
                    <span><i class="bi bi-coin"></i> +${nivel.recompensaMonedas || 10} monedas</span>
                    <span><i class="bi bi-star"></i> +${nivel.recompensaXP || 20} XP</span>
                </div>
            </div>
        </div>
    `).join('');
}

function showCreateNivelModal() {
    const modal = document.getElementById('nivelModal');
    if (!modal) return;

    document.getElementById('nivelForm').reset();
    document.getElementById('nivelId').value = '';
    document.getElementById('nivelModalTitle').textContent = 'Crear Nuevo Nivel';
    document.getElementById('nivelButtonText').textContent = 'Crear Nivel';

    const siguienteNumero = desafiosNiveles.length > 0
        ? Math.max(...desafiosNiveles.map(n => n.numero)) + 1
        : 1;
    document.getElementById('nivelNumero').value = siguienteNumero;
    
    // Reset to first tab
    switchNivelTab('general');
    
    // Reset counters and validation
    updateDescripcionCounter();
    validateNumeroNivel();
    
    // Reset preview and preguntas count
    currentPreviewIndex = 0;
    currentPreguntasCount = 5;

    createQuestions();
    updatePreguntasCount();
    modal.classList.add('active');
}

function hideNivelModal() {
    const modal = document.getElementById('nivelModal');
    if (modal) modal.classList.remove('active');
}

function createQuestions(existingQuestions = null) {
    const container = document.getElementById('preguntasContainer');
    container.innerHTML = '';
    
    // Determinar cuántas preguntas crear
    const numPreguntas = existingQuestions ? existingQuestions.length : 5;
    currentPreguntasCount = Math.max(5, numPreguntas); // Mínimo 5

    for (let i = 0; i < currentPreguntasCount; i++) {
        addPreguntaHTML(i, existingQuestions ? existingQuestions[i] : null);
    }
    
    // Agregar botón para añadir más preguntas
    addAddPreguntaButton();
}

function addPreguntaHTML(index, p = null) {
    const container = document.getElementById('preguntasContainer');
    const isComplete = p?.pregunta && p?.opciones?.every(o => o) && p?.correcta !== undefined;
    const canDelete = index >= 5; // Solo se pueden eliminar las preguntas después de la 5

    const preguntaDiv = document.createElement('div');
    preguntaDiv.className = `pregunta-item ${isComplete ? 'complete' : ''}`;
    preguntaDiv.dataset.index = index;
    
    preguntaDiv.innerHTML = `
        <div class="pregunta-header-simple">
            <div class="pregunta-header-left">
                <span class="pregunta-number">${index + 1}</span>
                <h5>Pregunta ${index + 1}</h5>
                <span class="pregunta-status ${isComplete ? 'complete' : 'incomplete'}">
                    <i class="bi ${isComplete ? 'bi-check-circle-fill' : 'bi-circle'}"></i>
                </span>
            </div>
            ${canDelete ? `
                <button type="button" class="btn-delete-pregunta" onclick="deletePregunta(${index})" title="Eliminar pregunta">
                    <i class="bi bi-trash"></i>
                </button>
            ` : ''}
        </div>
        <div class="pregunta-body">
            <div class="form-group">
                <label>Texto de la pregunta *</label>
                <input type="text" name="pregunta_${index}" required placeholder="Escribe la pregunta..." value="${p?.pregunta || ''}" oninput="onPreguntaInput(${index})">
            </div>
            <div class="opciones-grid">
                <div class="form-group">
                    <label><span class="option-badge">A</span> Opción A *</label>
                    <input type="text" name="opcion_${index}_0" required placeholder="Opción A" value="${p?.opciones?.[0] || ''}" oninput="onPreguntaInput(${index})">
                </div>
                <div class="form-group">
                    <label><span class="option-badge">B</span> Opción B *</label>
                    <input type="text" name="opcion_${index}_1" required placeholder="Opción B" value="${p?.opciones?.[1] || ''}" oninput="onPreguntaInput(${index})">
                </div>
                <div class="form-group">
                    <label><span class="option-badge">C</span> Opción C *</label>
                    <input type="text" name="opcion_${index}_2" required placeholder="Opción C" value="${p?.opciones?.[2] || ''}" oninput="onPreguntaInput(${index})">
                </div>
                <div class="form-group">
                    <label><span class="option-badge">D</span> Opción D *</label>
                    <input type="text" name="opcion_${index}_3" required placeholder="Opción D" value="${p?.opciones?.[3] || ''}" oninput="onPreguntaInput(${index})">
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label><i class="bi bi-check2-circle"></i> Respuesta correcta *</label>
                    <select name="correcta_${index}" required onchange="onPreguntaInput(${index})">
                        <option value="">Seleccionar...</option>
                        <option value="0" ${p?.correcta === 0 ? 'selected' : ''}>A</option>
                        <option value="1" ${p?.correcta === 1 ? 'selected' : ''}>B</option>
                        <option value="2" ${p?.correcta === 2 ? 'selected' : ''}>C</option>
                        <option value="3" ${p?.correcta === 3 ? 'selected' : ''}>D</option>
                    </select>
                </div>
                <div class="form-group">
                    <label><i class="bi bi-lightbulb"></i> Pista (opcional)</label>
                    <input type="text" name="pista_${index}" placeholder="Pista para el estudiante..." value="${p?.pista || ''}">
                </div>
            </div>
        </div>
    `;
    
    // Insertar antes del botón de agregar si existe
    const addBtn = container.querySelector('.add-pregunta-container');
    if (addBtn) {
        container.insertBefore(preguntaDiv, addBtn);
    } else {
        container.appendChild(preguntaDiv);
    }
}

function addAddPreguntaButton() {
    const container = document.getElementById('preguntasContainer');
    
    // Remover botón existente si hay
    const existingBtn = container.querySelector('.add-pregunta-container');
    if (existingBtn) existingBtn.remove();
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'add-pregunta-container';
    btnContainer.innerHTML = `
        <button type="button" class="btn-add-pregunta" onclick="addNewPregunta()">
            <i class="bi bi-plus-circle"></i>
            Agregar Pregunta
        </button>
        <span class="preguntas-count-info">
            <i class="bi bi-info-circle"></i>
            ${currentPreguntasCount} preguntas (mínimo 5)
        </span>
    `;
    container.appendChild(btnContainer);
}

function addNewPregunta() {
    const newIndex = currentPreguntasCount;
    currentPreguntasCount++;
    addPreguntaHTML(newIndex, null);
    addAddPreguntaButton(); // Actualizar el contador
    updatePreguntasCount();
    
    // Scroll al nuevo elemento
    const newItem = document.querySelector(`.pregunta-item[data-index="${newIndex}"]`);
    if (newItem) {
        newItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function deletePregunta(index) {
    if (currentPreguntasCount <= 5) {
        showDesafiosAlert('No se puede eliminar', 'Debe haber al menos 5 preguntas.', 'warning');
        return;
    }
    
    // Eliminar el elemento
    const item = document.querySelector(`.pregunta-item[data-index="${index}"]`);
    if (item) item.remove();
    
    currentPreguntasCount--;
    
    // Reindexar todas las preguntas
    reindexPreguntas();
    addAddPreguntaButton();
    updatePreguntasCount();
}

function reindexPreguntas() {
    const items = document.querySelectorAll('.pregunta-item');
    items.forEach((item, newIndex) => {
        const oldIndex = parseInt(item.dataset.index);
        item.dataset.index = newIndex;
        
        // Actualizar número visual
        const numberSpan = item.querySelector('.pregunta-number');
        if (numberSpan) numberSpan.textContent = newIndex + 1;
        
        const h5 = item.querySelector('h5');
        if (h5) h5.textContent = `Pregunta ${newIndex + 1}`;
        
        // Actualizar nombres de inputs
        const inputs = item.querySelectorAll('input, select');
        inputs.forEach(input => {
            const name = input.name;
            if (name) {
                input.name = name.replace(/_\d+/, `_${newIndex}`);
                const oninput = input.getAttribute('oninput');
                if (oninput) input.setAttribute('oninput', oninput.replace(/\d+/, newIndex));
                const onchange = input.getAttribute('onchange');
                if (onchange) input.setAttribute('onchange', onchange.replace(/\d+/, newIndex));
            }
        });
        
        // Actualizar botón de eliminar
        const deleteBtn = item.querySelector('.btn-delete-pregunta');
        if (deleteBtn) {
            if (newIndex < 5) {
                deleteBtn.remove(); // No se pueden eliminar las primeras 5
            } else {
                deleteBtn.setAttribute('onclick', `deletePregunta(${newIndex})`);
            }
        } else if (newIndex >= 5) {
            // Agregar botón de eliminar si no existe y es >= 5
            const headerLeft = item.querySelector('.pregunta-header-simple');
            if (headerLeft && !headerLeft.querySelector('.btn-delete-pregunta')) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-delete-pregunta';
                btn.setAttribute('onclick', `deletePregunta(${newIndex})`);
                btn.title = 'Eliminar pregunta';
                btn.innerHTML = '<i class="bi bi-trash"></i>';
                headerLeft.appendChild(btn);
            }
        }
    });
}

// Alias para compatibilidad
function createFiveQuestions(existingQuestions = null) {
    createQuestions(existingQuestions);
}

function onPreguntaInput(index) {
    updatePreguntaStatus(index);
    updatePreguntasCount();
}

function updatePreguntaStatus(index) {
    const item = document.querySelector(`.pregunta-item[data-index="${index}"]`);
    if (!item) return;
    
    const pregunta = document.querySelector(`input[name="pregunta_${index}"]`)?.value;
    const opciones = [
        document.querySelector(`input[name="opcion_${index}_0"]`)?.value,
        document.querySelector(`input[name="opcion_${index}_1"]`)?.value,
        document.querySelector(`input[name="opcion_${index}_2"]`)?.value,
        document.querySelector(`input[name="opcion_${index}_3"]`)?.value
    ];
    const correcta = document.querySelector(`select[name="correcta_${index}"]`)?.value;
    
    const isComplete = pregunta && opciones.every(o => o) && correcta !== '';
    
    item.classList.toggle('complete', isComplete);
    
    const status = item.querySelector('.pregunta-status');
    if (status) {
        status.className = `pregunta-status ${isComplete ? 'complete' : 'incomplete'}`;
        status.innerHTML = `<i class="bi ${isComplete ? 'bi-check-circle-fill' : 'bi-circle'}"></i>`;
    }
}

async function handleSaveNivel(e) {
    e.preventDefault();

    const submitBtn = document.querySelector('button[form="nivelForm"]') || document.querySelector('#nivelButtonText')?.parentElement;
    let originalText = '';

    if (submitBtn) {
        originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
    }

    try {
        const nivelId = document.getElementById('nivelId').value;
        const numero = parseInt(document.getElementById('nivelNumero').value);
        const tema = document.getElementById('nivelTema')?.value || '';
        const descripcion = document.getElementById('nivelDescripcion').value;
        const recompensaMonedas = parseInt(document.getElementById('nivelRecompensaMonedas').value) || 10;
        const recompensaXP = parseInt(document.getElementById('nivelRecompensaXP').value) || 20;

        if (numero < 1 || numero > 1000) {
            throw new Error('El número de nivel debe estar entre 1 y 1000');
        }

        const existeNumero = desafiosNiveles.find(n => n.numero === numero && n.id !== nivelId);
        if (existeNumero) {
            throw new Error(`Ya existe un nivel ${numero} para esta materia`);
        }

        const preguntas = [];
        for (let i = 0; i < currentPreguntasCount; i++) {
            const preguntaText = document.querySelector(`input[name="pregunta_${i}"]`)?.value;
            const opciones = [
                document.querySelector(`input[name="opcion_${i}_0"]`)?.value,
                document.querySelector(`input[name="opcion_${i}_1"]`)?.value,
                document.querySelector(`input[name="opcion_${i}_2"]`)?.value,
                document.querySelector(`input[name="opcion_${i}_3"]`)?.value
            ];
            const correctaValue = document.querySelector(`select[name="correcta_${i}"]`)?.value;
            const correcta = correctaValue !== '' ? parseInt(correctaValue) : NaN;
            const pista = document.querySelector(`input[name="pista_${i}"]`)?.value || '';

            if (!preguntaText || opciones.some(o => !o) || isNaN(correcta)) {
                throw new Error(`La pregunta ${i + 1} está incompleta`);
            }

            preguntas.push({ pregunta: preguntaText, opciones, correcta, pista });
        }

        if (preguntas.length < 5) {
            throw new Error('Debe haber al menos 5 preguntas');
        }

        const nivelData = {
            materia: currentMateriaDesafio,
            numero,
            tema,
            descripcion,
            preguntas,
            recompensaMonedas,
            recompensaXP,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        };

        const db = window.firebaseDB;

        if (nivelId) {
            await db.collection('desafios_niveles').doc(nivelId).update(nivelData);
            showDesafiosAlert('¡Nivel Actualizado!', 'El nivel se ha actualizado correctamente.', 'success');
        } else {
            nivelData.fechaCreacion = firebase.firestore.Timestamp.now();
            await db.collection('desafios_niveles').add(nivelData);
            showDesafiosAlert('¡Nivel Creado!', 'El nuevo nivel se ha creado correctamente.', 'success');
        }

        hideNivelModal();
        loadDesafiosNiveles();

    } catch (error) {
        console.error('Error guardando nivel:', error);
        showDesafiosAlert('Error', error.message || 'Error al guardar el nivel', 'error');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }
}

async function editNivel(nivelId) {
    const nivel = desafiosNiveles.find(n => n.id === nivelId);
    if (!nivel) return;

    document.getElementById('nivelId').value = nivelId;
    document.getElementById('nivelModalTitle').textContent = 'Editar Nivel';
    document.getElementById('nivelButtonText').textContent = 'Guardar Cambios';
    document.getElementById('nivelNumero').value = nivel.numero;
    document.getElementById('nivelDescripcion').value = nivel.descripcion || '';
    document.getElementById('nivelRecompensaMonedas').value = nivel.recompensaMonedas || 10;
    document.getElementById('nivelRecompensaXP').value = nivel.recompensaXP || 20;
    
    // Set tema if exists
    const temaInput = document.getElementById('nivelTema');
    if (temaInput) {
        temaInput.value = nivel.tema || '';
    }

    // Reset to first tab
    switchNivelTab('general');
    
    // Update counters and validation
    updateDescripcionCounter();
    validateNumeroNivel();
    
    // Reset preview
    currentPreviewIndex = 0;

    createFiveQuestions(nivel.preguntas);
    updatePreguntasCount();
    document.getElementById('nivelModal').classList.add('active');
}

async function deleteNivel(nivelId) {
    const nivel = desafiosNiveles.find(n => n.id === nivelId);
    if (!nivel) return;

    const confirmed = await showDesafiosConfirm(
        'Eliminar Nivel',
        `¿Estás seguro de eliminar el <strong>Nivel ${nivel.numero}</strong>? Esta acción no se puede deshacer.`,
        'danger'
    );
    
    if (!confirmed) return;

    try {
        await window.firebaseDB.collection('desafios_niveles').doc(nivelId).delete();
        showDesafiosAlert('¡Eliminado!', 'El nivel ha sido eliminado correctamente.', 'success');
        loadDesafiosNiveles();
    } catch (error) {
        showDesafiosAlert('Error', 'No se pudo eliminar el nivel.', 'error');
    }
}

// Clonar un nivel existente
async function cloneNivel(nivelId) {
    const nivel = desafiosNiveles.find(n => n.id === nivelId);
    if (!nivel) return;

    // Calcular el siguiente número de nivel disponible
    const siguienteNumero = desafiosNiveles.length > 0
        ? Math.max(...desafiosNiveles.map(n => n.numero)) + 1
        : 1;

    const confirmed = await showDesafiosConfirm(
        'Clonar Nivel',
        `¿Deseas clonar el <strong>Nivel ${nivel.numero}</strong> como <strong>Nivel ${siguienteNumero}</strong>?<br><br>Se copiarán todas las preguntas y configuraciones.`,
        'confirm'
    );
    
    if (!confirmed) return;

    try {
        const db = window.firebaseDB;

        // Crear copia profunda de las preguntas
        const preguntasClonadas = nivel.preguntas.map(p => ({
            pregunta: p.pregunta,
            opciones: [...p.opciones],
            correcta: p.correcta,
            pista: p.pista || ''
        }));

        const nuevoNivel = {
            materia: nivel.materia,
            numero: siguienteNumero,
            tema: nivel.tema ? `${nivel.tema} (copia)` : '',
            descripcion: nivel.descripcion ? `${nivel.descripcion} (copia)` : '',
            preguntas: preguntasClonadas,
            recompensaMonedas: nivel.recompensaMonedas || 10,
            recompensaXP: nivel.recompensaXP || 20,
            fechaCreacion: firebase.firestore.Timestamp.now(),
            fechaActualizacion: firebase.firestore.Timestamp.now()
        };

        await db.collection('desafios_niveles').add(nuevoNivel);
        showDesafiosAlert(
            '¡Nivel Clonado!', 
            `El <strong>Nivel ${siguienteNumero}</strong> ha sido creado como copia del Nivel ${nivel.numero}.`, 
            'success'
        );
        loadDesafiosNiveles();

    } catch (error) {
        console.error('Error clonando nivel:', error);
        showDesafiosAlert('Error', 'No se pudo clonar el nivel.', 'error');
    }
}
