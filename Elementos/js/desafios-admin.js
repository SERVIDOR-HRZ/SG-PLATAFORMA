// Desafios Admin - Gestión de niveles de desafíos
// Cada nivel tiene exactamente 5 preguntas

let desafiosNiveles = [];
let currentMateriaDesafio = 'matematicas';

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
    const materiaSelect = document.getElementById('desafioMateriaSelect');
    if (materiaSelect) {
        materiaSelect.addEventListener('change', function () {
            currentMateriaDesafio = this.value;
            loadDesafiosNiveles();
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
                    <span><i class="bi bi-question-circle"></i> 5 preguntas</span>
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

    createFiveQuestions();
    modal.classList.add('active');
}

function hideNivelModal() {
    const modal = document.getElementById('nivelModal');
    if (modal) modal.classList.remove('active');
}

function createFiveQuestions(existingQuestions = null) {
    const container = document.getElementById('preguntasContainer');
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const p = existingQuestions ? existingQuestions[i] : null;

        container.innerHTML += `
            <div class="pregunta-item" data-index="${i}">
                <div class="pregunta-header-simple">
                    <h5><i class="bi bi-question-circle"></i> Pregunta ${i + 1}</h5>
                </div>
                <div class="pregunta-body">
                    <div class="form-group">
                        <label>Texto de la pregunta *</label>
                        <input type="text" name="pregunta_${i}" required placeholder="Escribe la pregunta..." value="${p?.pregunta || ''}">
                    </div>
                    <div class="opciones-grid">
                        <div class="form-group">
                            <label>Opción A *</label>
                            <input type="text" name="opcion_${i}_0" required placeholder="Opción A" value="${p?.opciones?.[0] || ''}">
                        </div>
                        <div class="form-group">
                            <label>Opción B *</label>
                            <input type="text" name="opcion_${i}_1" required placeholder="Opción B" value="${p?.opciones?.[1] || ''}">
                        </div>
                        <div class="form-group">
                            <label>Opción C *</label>
                            <input type="text" name="opcion_${i}_2" required placeholder="Opción C" value="${p?.opciones?.[2] || ''}">
                        </div>
                        <div class="form-group">
                            <label>Opción D *</label>
                            <input type="text" name="opcion_${i}_3" required placeholder="Opción D" value="${p?.opciones?.[3] || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Respuesta correcta *</label>
                            <select name="correcta_${i}" required>
                                <option value="">Seleccionar...</option>
                                <option value="0" ${p?.correcta === 0 ? 'selected' : ''}>A</option>
                                <option value="1" ${p?.correcta === 1 ? 'selected' : ''}>B</option>
                                <option value="2" ${p?.correcta === 2 ? 'selected' : ''}>C</option>
                                <option value="3" ${p?.correcta === 3 ? 'selected' : ''}>D</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Pista (opcional)</label>
                            <input type="text" name="pista_${i}" placeholder="Pista para el estudiante..." value="${p?.pista || ''}">
                        </div>
                    </div>
                </div>
            </div>
        `;
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
        for (let i = 0; i < 5; i++) {
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

        const nivelData = {
            materia: currentMateriaDesafio,
            numero,
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

    createFiveQuestions(nivel.preguntas);
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
