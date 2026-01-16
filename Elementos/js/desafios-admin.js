// Desafios Admin - Gestión de niveles de desafíos
// Sistema con múltiples tipos de preguntas: texto, imagen, video

let desafiosNiveles = [];
let currentMateriaDesafio = 'matematicas';
let currentPreviewIndex = 0;
let preguntasData = []; // Array para almacenar las preguntas agregadas

// ImgBB API Configuration
const IMGBB_API_KEY_DESAFIOS = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL_DESAFIOS = 'https://api.imgbb.com/1/upload';

const materiasConfig = {
    matematicas: { nombre: 'Matemáticas', icon: 'bi-calculator', color: '#2196F3' },
    lectura: { nombre: 'Lectura Crítica', icon: 'bi-book', color: '#E53935' },
    sociales: { nombre: 'Ciencias Sociales', icon: 'bi-globe', color: '#FF9800' },
    naturales: { nombre: 'Ciencias Naturales', icon: 'bi-tree', color: '#4CAF50' },
    ingles: { nombre: 'Inglés', icon: 'bi-translate', color: '#9C27B0' }
};

const tiposPregunta = {
    texto: {
        nombre: 'Pregunta de Texto',
        descripcion: 'Opciones de texto A, B, C, D',
        icon: 'bi-fonts'
    },
    imagen: {
        nombre: 'Pregunta con Imagen',
        descripcion: 'Pregunta + imagen ilustrativa',
        icon: 'bi-image'
    },
    seleccionImagen: {
        nombre: 'Selección de Imagen',
        descripcion: 'Seleccionar la imagen correcta',
        icon: 'bi-images'
    },
    imagenOpciones: {
        nombre: 'Imagen + Opciones Imagen',
        descripcion: 'Pregunta con imagen y opciones de imagen',
        icon: 'bi-card-image'
    },
    video: {
        nombre: 'Pregunta con Video',
        descripcion: 'Video de YouTube o Drive + Entendí/No entendí',
        icon: 'bi-play-circle'
    }
};

// Función para escapar HTML y evitar XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ SISTEMA DE MODALES PERSONALIZADOS ============

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
            
            .desafios-modal-header i { font-size: 24px; }
            .desafios-modal-header h4 { margin: 0; font-size: 18px; font-weight: 600; }
            .desafios-modal-body { padding: 24px; }
            .desafios-modal-body p { margin: 0; color: #555; font-size: 15px; line-height: 1.6; }
            .desafios-modal-footer { padding: 16px 24px; display: flex; gap: 12px; justify-content: flex-end; background: #f8f9fa; }
            
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
            
            .desafios-modal-btn-cancel { background: #e0e0e0; color: #555; }
            .desafios-modal-btn-cancel:hover { background: #d0d0d0; }
            .desafios-modal-btn-confirm { background: linear-gradient(135deg, #4CAF50, #45a049); color: white; }
            .desafios-modal-btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4); }
            .desafios-modal-btn-danger { background: linear-gradient(135deg, #f44336, #d32f2f); color: white; }
            .desafios-modal-btn-danger:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(244, 67, 54, 0.4); }
            .desafios-modal-btn-primary { background: linear-gradient(135deg, #2196F3, #1976D2); color: white; }
            .desafios-modal-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4); }
        </style>
    `;
    document.head.insertAdjacentHTML('beforeend', styles);
}

function showDesafiosAlert(title, message, type = 'info') {
    initDesafiosModalStyles();
    const icons = { success: 'bi-check-circle-fill', error: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };
    
    const modalHTML = `
        <div class="desafios-modal-overlay" id="desafiosAlertModal">
            <div class="desafios-modal-box">
                <div class="desafios-modal-header ${type}">
                    <i class="bi ${icons[type] || icons.info}"></i>
                    <h4>${title}</h4>
                </div>
                <div class="desafios-modal-body"><p>${message}</p></div>
                <div class="desafios-modal-footer">
                    <button class="desafios-modal-btn desafios-modal-btn-primary" id="desafiosAlertOk">
                        <i class="bi bi-check-lg"></i> Aceptar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const overlay = document.getElementById('desafiosAlertModal');
    setTimeout(() => overlay.classList.add('active'), 10);
    
    const closeModal = () => {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    };
    
    document.getElementById('desafiosAlertOk').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
}

function showDesafiosConfirm(title, message, type = 'confirm') {
    initDesafiosModalStyles();
    
    return new Promise((resolve) => {
        const icons = { confirm: 'bi-question-circle-fill', warning: 'bi-exclamation-triangle-fill', danger: 'bi-trash-fill' };
        
        const modalHTML = `
            <div class="desafios-modal-overlay" id="desafiosConfirmModal">
                <div class="desafios-modal-box">
                    <div class="desafios-modal-header ${type}">
                        <i class="bi ${icons[type] || icons.confirm}"></i>
                        <h4>${title}</h4>
                    </div>
                    <div class="desafios-modal-body"><p>${message}</p></div>
                    <div class="desafios-modal-footer">
                        <button class="desafios-modal-btn desafios-modal-btn-cancel" id="desafiosConfirmCancel">
                            <i class="bi bi-x-lg"></i> Cancelar
                        </button>
                        <button class="desafios-modal-btn ${type === 'danger' ? 'desafios-modal-btn-danger' : 'desafios-modal-btn-confirm'}" id="desafiosConfirmOk">
                            <i class="bi bi-check-lg"></i> Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const overlay = document.getElementById('desafiosConfirmModal');
        setTimeout(() => overlay.classList.add('active'), 10);
        
        const closeModal = (result) => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            resolve(result);
        };
        
        document.getElementById('desafiosConfirmOk').addEventListener('click', () => closeModal(true));
        document.getElementById('desafiosConfirmCancel').addEventListener('click', () => closeModal(false));
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(false); });
    });
}

// ============ UPLOAD DE IMÁGENES A IMGBB ============

async function uploadImageToImgBBDesafios(file) {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
        const response = await fetch(`${IMGBB_API_URL_DESAFIOS}?key=${IMGBB_API_KEY_DESAFIOS}`, {
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
        console.error('Error uploading to ImgBB:', error);
        throw error;
    }
}

// ============ INICIALIZACIÓN ============

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
    const materiasMenu = document.getElementById('materiasMenu');
    if (materiasMenu) {
        materiasMenu.querySelectorAll('.materia-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                materiasMenu.querySelectorAll('.materia-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentMateriaDesafio = this.dataset.materia;
                const materiaTitle = document.getElementById('materiaTitle');
                if (materiaTitle) {
                    materiaTitle.textContent = materiasConfig[currentMateriaDesafio]?.nombre || currentMateriaDesafio;
                }
                loadDesafiosNiveles();
            });
        });
    }

    const createNivelBtn = document.getElementById('createNivelBtn');
    if (createNivelBtn) createNivelBtn.addEventListener('click', showCreateNivelModal);

    const closeNivelModal = document.getElementById('closeNivelModal');
    if (closeNivelModal) closeNivelModal.addEventListener('click', hideNivelModal);

    const cancelNivel = document.getElementById('cancelNivel');
    if (cancelNivel) cancelNivel.addEventListener('click', hideNivelModal);

    const nivelForm = document.getElementById('nivelForm');
    if (nivelForm) nivelForm.addEventListener('submit', handleSaveNivel);

    setupNivelTabs();
    
    const descripcionInput = document.getElementById('nivelDescripcion');
    if (descripcionInput) descripcionInput.addEventListener('input', updateDescripcionCounter);
    
    const numeroInput = document.getElementById('nivelNumero');
    if (numeroInput) numeroInput.addEventListener('input', validateNumeroNivel);
    
    // Preview navigation
    const prevBtn = document.getElementById('prevPreviewBtn');
    const nextBtn = document.getElementById('nextPreviewBtn');
    
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
    document.querySelectorAll('.nivel-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.nivel-tab[data-tab="${tabName}"]`)?.classList.add('active');
    
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
    if (textarea && counter) counter.textContent = `${textarea.value.length}/500`;
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
    const badge = document.getElementById('preguntasCount');
    if (badge) {
        const count = preguntasData.length;
        badge.textContent = count;
        badge.className = 'tab-badge' + (count >= 5 ? ' complete' : count > 0 ? ' partial' : '');
    }
}


// ============ PREVIEW ============

function updatePreview() {
    const screen = document.getElementById('previewScreen');
    const indicator = document.getElementById('previewIndicator');
    const prevBtn = document.getElementById('prevPreviewBtn');
    const nextBtn = document.getElementById('nextPreviewBtn');
    
    if (!screen) return;
    
    if (preguntasData.length === 0) {
        screen.innerHTML = `
            <div class="preview-empty">
                <i class="bi bi-question-circle"></i>
                <p>No hay preguntas agregadas</p>
                <span>Agrega al menos 5 preguntas para crear el nivel</span>
            </div>
        `;
        if (indicator) indicator.textContent = 'Sin preguntas';
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        return;
    }
    
    if (currentPreviewIndex >= preguntasData.length) {
        currentPreviewIndex = preguntasData.length - 1;
    }
    
    const pregunta = preguntasData[currentPreviewIndex];
    const tema = document.getElementById('nivelTema')?.value || 'Sin tema';
    const config = materiasConfig[currentMateriaDesafio];
    const letras = ['A', 'B', 'C', 'D'];
    
    let preguntaHTML = '';
    let opcionesHTML = '';
    
    // Renderizar según el tipo de pregunta
    switch (pregunta.tipo) {
        case 'texto':
            preguntaHTML = `<p>${pregunta.pregunta || 'Pregunta sin texto'}</p>`;
            opcionesHTML = (pregunta.opciones || []).map((op, idx) => `
                <div class="preview-option ${idx === pregunta.correcta ? 'correct' : ''}">
                    <span class="option-letter">${letras[idx]}</span>
                    <span class="option-text">${op || `Opción ${letras[idx]}`}</span>
                    ${idx === pregunta.correcta ? '<i class="bi bi-check-circle-fill"></i>' : ''}
                </div>
            `).join('');
            break;
            
        case 'imagen':
            preguntaHTML = `
                <p>${pregunta.pregunta || 'Pregunta sin texto'}</p>
                ${pregunta.imagenPregunta ? `<img src="${pregunta.imagenPregunta}" class="preview-question-image" alt="Imagen de la pregunta">` : '<div class="preview-no-image"><i class="bi bi-image"></i> Sin imagen</div>'}
            `;
            opcionesHTML = (pregunta.opciones || []).map((op, idx) => `
                <div class="preview-option ${idx === pregunta.correcta ? 'correct' : ''}">
                    <span class="option-letter">${letras[idx]}</span>
                    <span class="option-text">${op || `Opción ${letras[idx]}`}</span>
                    ${idx === pregunta.correcta ? '<i class="bi bi-check-circle-fill"></i>' : ''}
                </div>
            `).join('');
            break;
            
        case 'seleccionImagen':
            preguntaHTML = `<p>${pregunta.pregunta || 'Selecciona la imagen correcta'}</p>`;
            opcionesHTML = `<div class="preview-options-images">
                ${(pregunta.opcionesImagenes || []).map((img, idx) => `
                    <div class="preview-option-image ${idx === pregunta.correcta ? 'correct' : ''}">
                        ${img ? `<img src="${img}" alt="Opción ${letras[idx]}">` : `<div class="no-image"><i class="bi bi-image"></i></div>`}
                        <span class="option-letter">${letras[idx]}</span>
                        ${idx === pregunta.correcta ? '<i class="bi bi-check-circle-fill check-icon"></i>' : ''}
                    </div>
                `).join('')}
            </div>`;
            break;
            
        case 'imagenOpciones':
            preguntaHTML = `
                <p>${pregunta.pregunta || 'Pregunta sin texto'}</p>
                ${pregunta.imagenPregunta ? `<img src="${pregunta.imagenPregunta}" class="preview-question-image" alt="Imagen de la pregunta">` : '<div class="preview-no-image"><i class="bi bi-image"></i> Sin imagen</div>'}
            `;
            opcionesHTML = `<div class="preview-options-images">
                ${(pregunta.opcionesImagenes || []).map((img, idx) => `
                    <div class="preview-option-image ${idx === pregunta.correcta ? 'correct' : ''}">
                        ${img ? `<img src="${img}" alt="Opción ${letras[idx]}">` : `<div class="no-image"><i class="bi bi-image"></i></div>`}
                        <span class="option-letter">${letras[idx]}</span>
                        ${idx === pregunta.correcta ? '<i class="bi bi-check-circle-fill check-icon"></i>' : ''}
                    </div>
                `).join('')}
            </div>`;
            break;
            
        case 'video':
            const videoUrl = pregunta.videoUrl || '';
            let videoEmbed = '';
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                const videoId = extractYouTubeId(videoUrl);
                videoEmbed = videoId ? `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>` : '';
            } else if (videoUrl.includes('drive.google.com')) {
                const driveId = extractDriveId(videoUrl);
                videoEmbed = driveId ? `<iframe src="https://drive.google.com/file/d/${driveId}/preview" frameborder="0" allowfullscreen></iframe>` : '';
            }
            
            preguntaHTML = `
                <p>${pregunta.pregunta || 'Mira el video y responde'}</p>
                <div class="preview-video-container">
                    ${videoEmbed || '<div class="preview-no-video"><i class="bi bi-play-circle"></i> Sin video</div>'}
                </div>
            `;
            opcionesHTML = `
                <div class="preview-video-options">
                    <div class="preview-option video-option ${pregunta.correcta === 0 ? 'correct' : ''}">
                        <i class="bi bi-check-circle-fill"></i>
                        <span>Entendí</span>
                    </div>
                    <div class="preview-option video-option ${pregunta.correcta === 1 ? 'correct' : ''}">
                        <i class="bi bi-x-circle-fill"></i>
                        <span>No entendí</span>
                    </div>
                </div>
            `;
            break;
    }
    
    // Pista
    let pistaHTML = '';
    if (pregunta.pista) {
        pistaHTML = `
            <div class="preview-pista-card">
                <div class="preview-pista-icon"><i class="bi bi-lightbulb-fill"></i></div>
                <div class="preview-pista-content">
                    <div class="preview-pista-label">Pista</div>
                    <div class="preview-pista-text">${pregunta.pista}</div>
                </div>
            </div>
        `;
    }
    
    screen.innerHTML = `
        <div class="preview-tema">
            <i class="bi bi-bookmark-fill"></i>
            <span>${tema}</span>
        </div>
        <div class="preview-tipo-badge" style="background: ${config.color}">
            <i class="bi ${tiposPregunta[pregunta.tipo]?.icon || 'bi-question'}"></i>
            <span>${tiposPregunta[pregunta.tipo]?.nombre || pregunta.tipo}</span>
        </div>
        <div class="preview-progress">
            <div class="preview-progress-bar">
                <div class="preview-progress-fill" style="width: ${((currentPreviewIndex + 1) / preguntasData.length) * 100}%"></div>
            </div>
            <span>${currentPreviewIndex + 1}/${preguntasData.length}</span>
        </div>
        <div class="preview-question">${preguntaHTML}</div>
        <div class="preview-options">${opcionesHTML}</div>
        ${pistaHTML}
    `;
    
    if (indicator) indicator.textContent = `Pregunta ${currentPreviewIndex + 1} de ${preguntasData.length}`;
    if (prevBtn) prevBtn.disabled = currentPreviewIndex === 0;
    if (nextBtn) nextBtn.disabled = currentPreviewIndex >= preguntasData.length - 1;
}

function navigatePreview(direction) {
    const newIndex = currentPreviewIndex + direction;
    if (newIndex >= 0 && newIndex < preguntasData.length) {
        currentPreviewIndex = newIndex;
        updatePreview();
    }
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function extractDriveId(url) {
    const regExp = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// ============ CARGA DE NIVELES ============

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
        <div class="nivel-card" data-id="${nivel.id}" style="--nivel-color: ${config.color}" onclick="showNivelPreview('${nivel.id}')">
            <div class="nivel-header">
                <div class="nivel-number">
                    <i class="bi bi-trophy-fill"></i>
                    <span>Nivel ${nivel.numero}</span>
                </div>
                <div class="nivel-actions" onclick="event.stopPropagation()">
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
                <h4 class="nivel-tema">${nivel.tema || 'Sin tema'}</h4>
                <p class="nivel-descripcion">${nivel.descripcion || 'Sin descripción'}</p>
                <div class="nivel-stats">
                    <span><i class="bi bi-question-circle"></i> ${nivel.preguntas?.length || 0} preguntas</span>
                    <span><i class="bi bi-coin"></i> +${nivel.recompensaMonedas || 10}</span>
                    <span><i class="bi bi-star"></i> +${nivel.recompensaXP || 20} XP</span>
                </div>
                <div class="nivel-preview-hint">
                    <i class="bi bi-eye"></i> Clic para ver vista previa
                </div>
            </div>
        </div>
    `).join('');
}


// ============ MODAL DE CREAR/EDITAR NIVEL ============

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
    
    switchNivelTab('general');
    updateDescripcionCounter();
    validateNumeroNivel();
    
    currentPreviewIndex = 0;
    preguntasData = [];
    
    renderPreguntasContainer();
    updatePreguntasCount();
    modal.classList.add('active');
}

function hideNivelModal() {
    const modal = document.getElementById('nivelModal');
    if (modal) modal.classList.remove('active');
}

// ============ SISTEMA DE PREGUNTAS ============

function renderPreguntasContainer() {
    const container = document.getElementById('preguntasContainer');
    if (!container) return;
    
    container.innerHTML = `
        <div class="preguntas-toolbar">
            <div class="preguntas-info">
                <i class="bi bi-info-circle-fill"></i>
                <span>Mínimo <strong>5 preguntas</strong> requeridas. Puedes agregar diferentes tipos.</span>
            </div>
            <div class="add-pregunta-dropdown">
                <button type="button" class="btn-add-pregunta-main" id="addPreguntaBtn">
                    <i class="bi bi-plus"></i>
                    Agregar
                    <i class="bi bi-chevron-down chevron"></i>
                </button>
                <div class="add-pregunta-menu" id="addPreguntaMenu">
                    <div class="add-pregunta-option" data-tipo="texto">
                        <div class="option-icon"><span class="icon-tt">Tt</span></div>
                        <div class="option-info">
                            <strong>Pregunta de Texto</strong>
                            <span>Opciones de texto A, B, C, D</span>
                        </div>
                    </div>
                    <div class="add-pregunta-option" data-tipo="imagen">
                        <div class="option-icon"><i class="bi bi-image"></i></div>
                        <div class="option-info">
                            <strong>Pregunta con Imagen</strong>
                            <span>Pregunta + imagen ilustrativa</span>
                        </div>
                    </div>
                    <div class="add-pregunta-option" data-tipo="seleccionImagen">
                        <div class="option-icon"><i class="bi bi-images"></i></div>
                        <div class="option-info">
                            <strong>Selección de Imagen</strong>
                            <span>Seleccionar la imagen correcta</span>
                        </div>
                    </div>
                    <div class="add-pregunta-option" data-tipo="imagenOpciones">
                        <div class="option-icon"><i class="bi bi-card-image"></i></div>
                        <div class="option-info">
                            <strong>Imagen + Opciones Imagen</strong>
                            <span>Pregunta con imagen y opciones de imagen</span>
                        </div>
                    </div>
                    <div class="add-pregunta-option" data-tipo="video">
                        <div class="option-icon"><i class="bi bi-play-circle"></i></div>
                        <div class="option-info">
                            <strong>Pregunta con Video</strong>
                            <span>Video de YouTube o Drive + Entendí/No entendí</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="preguntas-list" id="preguntasList">
            ${preguntasData.length === 0 ? `
                <div class="preguntas-empty">
                    <i class="bi bi-collection"></i>
                    <h4>Sin preguntas</h4>
                    <p>Haz clic en "+ Agregar" para añadir preguntas al nivel</p>
                </div>
            ` : ''}
        </div>
        <div class="preguntas-footer">
            <span class="preguntas-count-label">
                <i class="bi bi-list-check"></i>
                <span id="preguntasCountLabel">${preguntasData.length} de 5 preguntas mínimas</span>
            </span>
        </div>
    `;
    
    // Setup dropdown
    const addBtn = document.getElementById('addPreguntaBtn');
    const menu = document.getElementById('addPreguntaMenu');
    
    if (addBtn && menu) {
        addBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
            addBtn.classList.toggle('active');
        });
        
        document.addEventListener('click', () => {
            menu.classList.remove('active');
            addBtn.classList.remove('active');
        });
        
        menu.querySelectorAll('.add-pregunta-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const tipo = option.dataset.tipo;
                addPregunta(tipo);
                menu.classList.remove('active');
                addBtn.classList.remove('active');
            });
        });
    }
    
    // Render existing questions
    if (preguntasData.length > 0) {
        renderPreguntasList();
    }
}

function renderPreguntasList() {
    const list = document.getElementById('preguntasList');
    if (!list) return;
    
    if (preguntasData.length === 0) {
        list.innerHTML = `
            <div class="preguntas-empty">
                <i class="bi bi-collection"></i>
                <h4>Sin preguntas</h4>
                <p>Haz clic en "+ Agregar" para añadir preguntas al nivel</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = preguntasData.map((p, index) => renderPreguntaCard(p, index)).join('');
    
    // Update count label
    const countLabel = document.getElementById('preguntasCountLabel');
    if (countLabel) {
        const count = preguntasData.length;
        countLabel.textContent = count >= 5 
            ? `${count} preguntas ✓` 
            : `${count} de 5 preguntas mínimas`;
    }
    
    // Setup image uploads
    setupImageUploads();
}

function renderPreguntaCard(pregunta, index) {
    const tipoInfo = tiposPregunta[pregunta.tipo] || { nombre: 'Pregunta', icon: 'bi-question' };
    const letras = ['A', 'B', 'C', 'D'];
    const config = materiasConfig[currentMateriaDesafio];
    
    let contenidoHTML = '';
    
    switch (pregunta.tipo) {
        case 'texto':
            contenidoHTML = `
                <div class="pregunta-field">
                    <label>Texto de la pregunta *</label>
                    <input type="text" class="pregunta-input" data-index="${index}" data-field="pregunta" 
                           value="${escapeHtml(pregunta.pregunta || '')}" placeholder="Escribe la pregunta...">
                </div>
                <div class="opciones-grid">
                    ${[0,1,2,3].map(i => `
                        <div class="opcion-field">
                            <label><span class="option-badge">${letras[i]}</span> Opción ${letras[i]} *</label>
                            <input type="text" class="pregunta-input" data-index="${index}" data-field="opcion" data-opcion="${i}"
                                   value="${escapeHtml(pregunta.opciones?.[i] || '')}" placeholder="Opción ${letras[i]}">
                        </div>
                    `).join('')}
                </div>
                <div class="pregunta-row">
                    <div class="pregunta-field">
                        <label><i class="bi bi-check2-circle"></i> Respuesta correcta *</label>
                        <select class="pregunta-input" data-index="${index}" data-field="correcta">
                            <option value="">Seleccionar...</option>
                            ${[0,1,2,3].map(i => `<option value="${i}" ${pregunta.correcta === i ? 'selected' : ''}>${letras[i]}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pregunta-field">
                        <label><i class="bi bi-lightbulb"></i> Pista (opcional)</label>
                        <input type="text" class="pregunta-input" data-index="${index}" data-field="pista"
                               value="${escapeHtml(pregunta.pista || '')}" placeholder="Pista para el estudiante...">
                    </div>
                </div>
            `;
            break;
            
        case 'imagen':
            contenidoHTML = `
                <div class="pregunta-field">
                    <label>Texto de la pregunta *</label>
                    <input type="text" class="pregunta-input" data-index="${index}" data-field="pregunta" 
                           value="${escapeHtml(pregunta.pregunta || '')}" placeholder="Escribe la pregunta...">
                </div>
                <div class="pregunta-field">
                    <label><i class="bi bi-image"></i> Imagen de la pregunta</label>
                    <div class="image-upload-zone" data-index="${index}" data-field="imagenPregunta">
                        ${pregunta.imagenPregunta ? `
                            <div class="image-preview">
                                <img src="${pregunta.imagenPregunta}" alt="Preview">
                                <button type="button" class="remove-image-btn" onclick="removeImage(${index}, 'imagenPregunta')">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                        ` : `
                            <div class="upload-placeholder">
                                <i class="bi bi-cloud-upload"></i>
                                <span>Clic para subir imagen</span>
                                <input type="file" accept="image/*" class="image-input" data-index="${index}" data-field="imagenPregunta">
                            </div>
                        `}
                    </div>
                </div>
                <div class="opciones-grid">
                    ${[0,1,2,3].map(i => `
                        <div class="opcion-field">
                            <label><span class="option-badge">${letras[i]}</span> Opción ${letras[i]} *</label>
                            <input type="text" class="pregunta-input" data-index="${index}" data-field="opcion" data-opcion="${i}"
                                   value="${escapeHtml(pregunta.opciones?.[i] || '')}" placeholder="Opción ${letras[i]}">
                        </div>
                    `).join('')}
                </div>
                <div class="pregunta-row">
                    <div class="pregunta-field">
                        <label><i class="bi bi-check2-circle"></i> Respuesta correcta *</label>
                        <select class="pregunta-input" data-index="${index}" data-field="correcta">
                            <option value="">Seleccionar...</option>
                            ${[0,1,2,3].map(i => `<option value="${i}" ${pregunta.correcta === i ? 'selected' : ''}>${letras[i]}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pregunta-field">
                        <label><i class="bi bi-lightbulb"></i> Pista (opcional)</label>
                        <input type="text" class="pregunta-input" data-index="${index}" data-field="pista"
                               value="${escapeHtml(pregunta.pista || '')}" placeholder="Pista para el estudiante...">
                    </div>
                </div>
            `;
            break;
            
        case 'seleccionImagen':
            contenidoHTML = `
                <div class="pregunta-field">
                    <label>Texto de la pregunta *</label>
                    <input type="text" class="pregunta-input" data-index="${index}" data-field="pregunta" 
                           value="${escapeHtml(pregunta.pregunta || '')}" placeholder="Selecciona la imagen correcta...">
                </div>
                <div class="opciones-imagenes-grid">
                    ${[0,1,2,3].map(i => `
                        <div class="opcion-imagen-field">
                            <label><span class="option-badge">${letras[i]}</span></label>
                            <div class="image-upload-zone small" data-index="${index}" data-field="opcionImagen" data-opcion="${i}">
                                ${pregunta.opcionesImagenes?.[i] ? `
                                    <div class="image-preview">
                                        <img src="${pregunta.opcionesImagenes[i]}" alt="Opción ${letras[i]}">
                                        <button type="button" class="remove-image-btn" onclick="removeOpcionImage(${index}, ${i})">
                                            <i class="bi bi-x"></i>
                                        </button>
                                    </div>
                                ` : `
                                    <div class="upload-placeholder small">
                                        <i class="bi bi-plus"></i>
                                        <input type="file" accept="image/*" class="image-input" data-index="${index}" data-field="opcionImagen" data-opcion="${i}">
                                    </div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="pregunta-row">
                    <div class="pregunta-field">
                        <label><i class="bi bi-check2-circle"></i> Imagen correcta *</label>
                        <select class="pregunta-input" data-index="${index}" data-field="correcta">
                            <option value="">Seleccionar...</option>
                            ${[0,1,2,3].map(i => `<option value="${i}" ${pregunta.correcta === i ? 'selected' : ''}>${letras[i]}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pregunta-field">
                        <label><i class="bi bi-lightbulb"></i> Pista (opcional)</label>
                        <input type="text" class="pregunta-input" data-index="${index}" data-field="pista"
                               value="${escapeHtml(pregunta.pista || '')}" placeholder="Pista para el estudiante...">
                    </div>
                </div>
            `;
            break;
            
        case 'imagenOpciones':
            contenidoHTML = `
                <div class="pregunta-field">
                    <label>Texto de la pregunta *</label>
                    <input type="text" class="pregunta-input" data-index="${index}" data-field="pregunta" 
                           value="${escapeHtml(pregunta.pregunta || '')}" placeholder="Escribe la pregunta...">
                </div>
                <div class="pregunta-field">
                    <label><i class="bi bi-image"></i> Imagen de la pregunta</label>
                    <div class="image-upload-zone" data-index="${index}" data-field="imagenPregunta">
                        ${pregunta.imagenPregunta ? `
                            <div class="image-preview">
                                <img src="${pregunta.imagenPregunta}" alt="Preview">
                                <button type="button" class="remove-image-btn" onclick="removeImage(${index}, 'imagenPregunta')">
                                    <i class="bi bi-x"></i>
                                </button>
                            </div>
                        ` : `
                            <div class="upload-placeholder">
                                <i class="bi bi-cloud-upload"></i>
                                <span>Clic para subir imagen</span>
                                <input type="file" accept="image/*" class="image-input" data-index="${index}" data-field="imagenPregunta">
                            </div>
                        `}
                    </div>
                </div>
                <div class="opciones-imagenes-grid">
                    ${[0,1,2,3].map(i => `
                        <div class="opcion-imagen-field">
                            <label><span class="option-badge">${letras[i]}</span></label>
                            <div class="image-upload-zone small" data-index="${index}" data-field="opcionImagen" data-opcion="${i}">
                                ${pregunta.opcionesImagenes?.[i] ? `
                                    <div class="image-preview">
                                        <img src="${pregunta.opcionesImagenes[i]}" alt="Opción ${letras[i]}">
                                        <button type="button" class="remove-image-btn" onclick="removeOpcionImage(${index}, ${i})">
                                            <i class="bi bi-x"></i>
                                        </button>
                                    </div>
                                ` : `
                                    <div class="upload-placeholder small">
                                        <i class="bi bi-plus"></i>
                                        <input type="file" accept="image/*" class="image-input" data-index="${index}" data-field="opcionImagen" data-opcion="${i}">
                                    </div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="pregunta-row">
                    <div class="pregunta-field">
                        <label><i class="bi bi-check2-circle"></i> Imagen correcta *</label>
                        <select class="pregunta-input" data-index="${index}" data-field="correcta">
                            <option value="">Seleccionar...</option>
                            ${[0,1,2,3].map(i => `<option value="${i}" ${pregunta.correcta === i ? 'selected' : ''}>${letras[i]}</option>`).join('')}
                        </select>
                    </div>
                    <div class="pregunta-field">
                        <label><i class="bi bi-lightbulb"></i> Pista (opcional)</label>
                        <input type="text" class="pregunta-input" data-index="${index}" data-field="pista"
                               value="${escapeHtml(pregunta.pista || '')}" placeholder="Pista para el estudiante...">
                    </div>
                </div>
            `;
            break;
            
        case 'video':
            const tieneOpciones = pregunta.opciones && pregunta.opciones.some(o => o);
            contenidoHTML = `
                <div class="pregunta-field">
                    <label>Texto de la pregunta</label>
                    <input type="text" class="pregunta-input" data-index="${index}" data-field="pregunta" 
                           value="${escapeHtml(pregunta.pregunta || '')}" placeholder="Mira el video...">
                </div>
                <div class="pregunta-field">
                    <label><i class="bi bi-play-circle"></i> URL del Video (YouTube o Google Drive) *</label>
                    <input type="url" class="pregunta-input" data-index="${index}" data-field="videoUrl" 
                           value="${escapeHtml(pregunta.videoUrl || '')}" placeholder="https://www.youtube.com/watch?v=... o https://drive.google.com/file/d/...">
                    <span class="field-hint">Pega el enlace de YouTube o Google Drive</span>
                </div>
                <div class="pregunta-field">
                    <label><i class="bi bi-ui-radios"></i> Tipo de respuesta</label>
                    <div class="video-tipo-select">
                        <label class="video-tipo-label ${!tieneOpciones ? 'selected' : ''}">
                            <input type="radio" name="video_tipo_${index}" value="entendido" ${!tieneOpciones ? 'checked' : ''} 
                                   class="video-tipo-input" data-index="${index}">
                            <i class="bi bi-check-circle"></i>
                            <span>Solo "Entendido"</span>
                        </label>
                        <label class="video-tipo-label ${tieneOpciones ? 'selected' : ''}">
                            <input type="radio" name="video_tipo_${index}" value="opciones" ${tieneOpciones ? 'checked' : ''}
                                   class="video-tipo-input" data-index="${index}">
                            <i class="bi bi-list-ul"></i>
                            <span>Opciones A, B, C, D</span>
                        </label>
                    </div>
                </div>
                <div class="video-opciones-container" id="videoOpcionesContainer_${index}" style="${tieneOpciones ? '' : 'display: none;'}">
                    <div class="opciones-grid">
                        ${[0,1,2,3].map(i => `
                            <div class="opcion-field">
                                <label><span class="option-badge">${letras[i]}</span> Opción ${letras[i]}</label>
                                <input type="text" class="pregunta-input" data-index="${index}" data-field="opcion" data-opcion="${i}"
                                       value="${escapeHtml(pregunta.opciones?.[i] || '')}" placeholder="Opción ${letras[i]}">
                            </div>
                        `).join('')}
                    </div>
                    <div class="pregunta-field">
                        <label><i class="bi bi-check2-circle"></i> Respuesta correcta *</label>
                        <select class="pregunta-input" data-index="${index}" data-field="correcta">
                            <option value="">Seleccionar...</option>
                            ${[0,1,2,3].map(i => `<option value="${i}" ${pregunta.correcta === i ? 'selected' : ''}>${letras[i]}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="pregunta-field">
                    <label><i class="bi bi-lightbulb"></i> Pista (opcional)</label>
                    <input type="text" class="pregunta-input" data-index="${index}" data-field="pista"
                           value="${escapeHtml(pregunta.pista || '')}" placeholder="Pista para el estudiante...">
                </div>
            `;
            break;
    }
    
    return `
        <div class="pregunta-card" data-index="${index}" data-tipo="${pregunta.tipo}">
            <div class="pregunta-card-header">
                <div class="pregunta-card-info">
                    <span class="pregunta-number">${index + 1}</span>
                    <div class="pregunta-tipo-badge" style="background: ${config.color}">
                        <i class="bi ${tipoInfo.icon}"></i>
                        <span>${tipoInfo.nombre}</span>
                    </div>
                </div>
                <div class="pregunta-card-actions">
                    <button type="button" class="btn-move-pregunta" onclick="movePregunta(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover arriba">
                        <i class="bi bi-chevron-up"></i>
                    </button>
                    <button type="button" class="btn-move-pregunta" onclick="movePregunta(${index}, 1)" ${index === preguntasData.length - 1 ? 'disabled' : ''} title="Mover abajo">
                        <i class="bi bi-chevron-down"></i>
                    </button>
                    <button type="button" class="btn-delete-pregunta" onclick="deletePregunta(${index})" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
            <div class="pregunta-card-body">
                ${contenidoHTML}
            </div>
        </div>
    `;
}


// ============ FUNCIONES DE PREGUNTAS ============

function addPregunta(tipo) {
    const nuevaPregunta = {
        tipo: tipo,
        pregunta: '',
        pista: ''
    };
    
    switch (tipo) {
        case 'texto':
        case 'imagen':
            nuevaPregunta.opciones = ['', '', '', ''];
            nuevaPregunta.correcta = null;
            if (tipo === 'imagen') nuevaPregunta.imagenPregunta = '';
            break;
        case 'seleccionImagen':
            nuevaPregunta.opcionesImagenes = ['', '', '', ''];
            nuevaPregunta.correcta = null;
            break;
        case 'imagenOpciones':
            nuevaPregunta.imagenPregunta = '';
            nuevaPregunta.opcionesImagenes = ['', '', '', ''];
            nuevaPregunta.correcta = null;
            break;
        case 'video':
            nuevaPregunta.videoUrl = '';
            nuevaPregunta.correcta = 0;
            break;
    }
    
    preguntasData.push(nuevaPregunta);
    renderPreguntasList();
    updatePreguntasCount();
    
    // Scroll to new question
    setTimeout(() => {
        const newCard = document.querySelector(`.pregunta-card[data-index="${preguntasData.length - 1}"]`);
        if (newCard) newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function deletePregunta(index) {
    preguntasData.splice(index, 1);
    renderPreguntasList();
    updatePreguntasCount();
}

function movePregunta(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= preguntasData.length) return;
    
    // Save current values before moving
    saveCurrentPreguntaValues();
    
    const temp = preguntasData[index];
    preguntasData[index] = preguntasData[newIndex];
    preguntasData[newIndex] = temp;
    
    renderPreguntasList();
}

function saveCurrentPreguntaValues() {
    document.querySelectorAll('.pregunta-input').forEach(input => {
        const index = parseInt(input.dataset.index);
        const field = input.dataset.field;
        
        if (isNaN(index) || !preguntasData[index]) return;
        
        if (field === 'opcion') {
            const opcionIndex = parseInt(input.dataset.opcion);
            if (!preguntasData[index].opciones) preguntasData[index].opciones = ['', '', '', ''];
            preguntasData[index].opciones[opcionIndex] = input.value;
        } else if (field === 'correcta') {
            if (input.type === 'radio') {
                if (input.checked) preguntasData[index].correcta = parseInt(input.value);
            } else {
                preguntasData[index].correcta = input.value !== '' ? parseInt(input.value) : null;
            }
        } else {
            preguntasData[index][field] = input.value;
        }
    });
}

function removeImage(index, field) {
    preguntasData[index][field] = '';
    renderPreguntasList();
}

function removeOpcionImage(index, opcionIndex) {
    if (!preguntasData[index].opcionesImagenes) {
        preguntasData[index].opcionesImagenes = ['', '', '', ''];
    }
    preguntasData[index].opcionesImagenes[opcionIndex] = '';
    renderPreguntasList();
}

function setupImageUploads() {
    document.querySelectorAll('.image-input').forEach(input => {
        input.addEventListener('change', async function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            const index = parseInt(this.dataset.index);
            const field = this.dataset.field;
            const opcion = this.dataset.opcion;
            
            // Show loading
            const zone = this.closest('.image-upload-zone');
            zone.innerHTML = `
                <div class="upload-loading">
                    <i class="bi bi-arrow-clockwise spin"></i>
                    <span>Subiendo...</span>
                </div>
            `;
            
            try {
                const imageUrl = await uploadImageToImgBBDesafios(file);
                
                if (field === 'opcionImagen') {
                    if (!preguntasData[index].opcionesImagenes) {
                        preguntasData[index].opcionesImagenes = ['', '', '', ''];
                    }
                    preguntasData[index].opcionesImagenes[parseInt(opcion)] = imageUrl;
                } else {
                    preguntasData[index][field] = imageUrl;
                }
                
                renderPreguntasList();
                showDesafiosAlert('¡Imagen subida!', 'La imagen se ha subido correctamente.', 'success');
            } catch (error) {
                console.error('Error uploading image:', error);
                showDesafiosAlert('Error', 'No se pudo subir la imagen. Intenta de nuevo.', 'error');
                renderPreguntasList();
            }
        });
    });
    
    // Click on upload zones
    document.querySelectorAll('.upload-placeholder').forEach(placeholder => {
        placeholder.addEventListener('click', function() {
            const input = this.querySelector('.image-input');
            if (input) input.click();
        });
    });
    
    // Input change listeners for text fields
    document.querySelectorAll('.pregunta-input').forEach(input => {
        if (input.type === 'file') return;
        
        input.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            const field = this.dataset.field;
            
            if (isNaN(index) || !preguntasData[index]) return;
            
            if (field === 'opcion') {
                const opcionIndex = parseInt(this.dataset.opcion);
                if (!preguntasData[index].opciones) preguntasData[index].opciones = ['', '', '', ''];
                preguntasData[index].opciones[opcionIndex] = this.value;
            } else if (field === 'correcta') {
                if (this.type === 'radio') {
                    preguntasData[index].correcta = parseInt(this.value);
                    // Update visual selection
                    document.querySelectorAll(`[name="${this.name}"]`).forEach(radio => {
                        radio.closest('.video-option-label')?.classList.remove('selected');
                    });
                    this.closest('.video-option-label')?.classList.add('selected');
                } else {
                    preguntasData[index].correcta = this.value !== '' ? parseInt(this.value) : null;
                }
            } else {
                preguntasData[index][field] = this.value;
            }
        });
        
        input.addEventListener('input', function() {
            const index = parseInt(this.dataset.index);
            const field = this.dataset.field;
            
            if (isNaN(index) || !preguntasData[index]) return;
            
            if (field === 'opcion') {
                const opcionIndex = parseInt(this.dataset.opcion);
                if (!preguntasData[index].opciones) preguntasData[index].opciones = ['', '', '', ''];
                preguntasData[index].opciones[opcionIndex] = this.value;
            } else if (field !== 'correcta') {
                preguntasData[index][field] = this.value;
            }
        });
    });
    
    // Video tipo toggle (Entendido vs Opciones A,B,C,D)
    document.querySelectorAll('.video-tipo-input').forEach(input => {
        input.addEventListener('change', function() {
            const index = parseInt(this.dataset.index);
            const tipo = this.value;
            const container = document.getElementById(`videoOpcionesContainer_${index}`);
            
            // Update visual selection
            document.querySelectorAll(`[name="${this.name}"]`).forEach(radio => {
                radio.closest('.video-tipo-label')?.classList.remove('selected');
            });
            this.closest('.video-tipo-label')?.classList.add('selected');
            
            if (tipo === 'opciones') {
                container.style.display = '';
                // Initialize opciones array if needed
                if (!preguntasData[index].opciones) {
                    preguntasData[index].opciones = ['', '', '', ''];
                }
            } else {
                container.style.display = 'none';
                // Clear opciones when switching to "Entendido"
                preguntasData[index].opciones = null;
                preguntasData[index].correcta = 0;
            }
        });
    });
}

// ============ GUARDAR NIVEL ============

async function handleSaveNivel(e) {
    e.preventDefault();
    
    // Save current values
    saveCurrentPreguntaValues();

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

        if (preguntasData.length < 5) {
            throw new Error('Debe haber al menos 5 preguntas');
        }

        // Validate each question
        for (let i = 0; i < preguntasData.length; i++) {
            const p = preguntasData[i];
            
            switch (p.tipo) {
                case 'texto':
                    if (!p.pregunta) throw new Error(`La pregunta ${i + 1} no tiene texto`);
                    if (!p.opciones || p.opciones.some(o => !o)) throw new Error(`La pregunta ${i + 1} tiene opciones vacías`);
                    if (p.correcta === null || p.correcta === undefined) throw new Error(`La pregunta ${i + 1} no tiene respuesta correcta`);
                    break;
                case 'imagen':
                    if (!p.pregunta) throw new Error(`La pregunta ${i + 1} no tiene texto`);
                    if (!p.opciones || p.opciones.some(o => !o)) throw new Error(`La pregunta ${i + 1} tiene opciones vacías`);
                    if (p.correcta === null || p.correcta === undefined) throw new Error(`La pregunta ${i + 1} no tiene respuesta correcta`);
                    break;
                case 'seleccionImagen':
                    if (!p.pregunta) throw new Error(`La pregunta ${i + 1} no tiene texto`);
                    if (!p.opcionesImagenes || p.opcionesImagenes.filter(img => img).length < 2) {
                        throw new Error(`La pregunta ${i + 1} necesita al menos 2 imágenes de opciones`);
                    }
                    if (p.correcta === null || p.correcta === undefined) throw new Error(`La pregunta ${i + 1} no tiene respuesta correcta`);
                    break;
                case 'imagenOpciones':
                    if (!p.pregunta) throw new Error(`La pregunta ${i + 1} no tiene texto`);
                    if (!p.opcionesImagenes || p.opcionesImagenes.filter(img => img).length < 2) {
                        throw new Error(`La pregunta ${i + 1} necesita al menos 2 imágenes de opciones`);
                    }
                    if (p.correcta === null || p.correcta === undefined) throw new Error(`La pregunta ${i + 1} no tiene respuesta correcta`);
                    break;
                case 'video':
                    if (!p.videoUrl) throw new Error(`La pregunta ${i + 1} no tiene URL de video`);
                    if (p.correcta === null || p.correcta === undefined) throw new Error(`La pregunta ${i + 1} no tiene respuesta esperada`);
                    break;
            }
        }

        const nivelData = {
            materia: currentMateriaDesafio,
            numero,
            tema,
            descripcion,
            preguntas: preguntasData,
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

// ============ EDITAR NIVEL ============

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
    
    const temaInput = document.getElementById('nivelTema');
    if (temaInput) temaInput.value = nivel.tema || '';

    switchNivelTab('general');
    updateDescripcionCounter();
    validateNumeroNivel();
    
    currentPreviewIndex = 0;
    
    // Load existing questions - convert old format if needed
    preguntasData = (nivel.preguntas || []).map(p => {
        // If old format (no tipo), convert to new format
        if (!p.tipo) {
            return {
                tipo: 'texto',
                pregunta: p.pregunta || '',
                opciones: p.opciones || ['', '', '', ''],
                correcta: p.correcta,
                pista: p.pista || ''
            };
        }
        return { ...p };
    });

    renderPreguntasContainer();
    updatePreguntasCount();
    document.getElementById('nivelModal').classList.add('active');
}

// ============ ELIMINAR NIVEL ============

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

// ============ CLONAR NIVEL ============

async function cloneNivel(nivelId) {
    const nivel = desafiosNiveles.find(n => n.id === nivelId);
    if (!nivel) return;

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

        const preguntasClonadas = (nivel.preguntas || []).map(p => ({ ...p }));

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

// ============ VISTA PREVIA DE NIVEL EXISTENTE ============

let currentNivelPreviewIndex = 0;
let currentNivelPreviewData = null;

function showNivelPreview(nivelId) {
    const nivel = desafiosNiveles.find(n => n.id === nivelId);
    if (!nivel || !nivel.preguntas || nivel.preguntas.length === 0) {
        showDesafiosAlert('Sin preguntas', 'Este nivel no tiene preguntas configuradas.', 'warning');
        return;
    }
    
    currentNivelPreviewData = nivel;
    currentNivelPreviewIndex = 0;
    
    createNivelPreviewModal();
    
    const modal = document.getElementById('nivelPreviewModal');
    if (modal) {
        updateNivelPreviewContent();
        modal.classList.add('active');
    }
}

function createNivelPreviewModal() {
    if (document.getElementById('nivelPreviewModal')) return;
    
    const modalHTML = `
        <div class="modal-overlay" id="nivelPreviewModal">
            <div class="modal nivel-preview-modal">
                <div class="modal-header">
                    <h3><i class="bi bi-eye"></i> <span id="previewNivelTitle">Vista Previa</span></h3>
                    <button class="close-btn" onclick="closeNivelPreviewModal()">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="nivel-preview-container">
                        <div class="nivel-preview-screen" id="nivelPreviewScreen"></div>
                        <div class="nivel-preview-navigation">
                            <button type="button" class="preview-nav-btn" id="prevNivelPreviewBtn" onclick="navigateNivelPreview(-1)">
                                <i class="bi bi-chevron-left"></i>
                            </button>
                            <span class="preview-indicator" id="nivelPreviewIndicator">Pregunta 1 de 5</span>
                            <button type="button" class="preview-nav-btn" id="nextNivelPreviewBtn" onclick="navigateNivelPreview(1)">
                                <i class="bi bi-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeNivelPreviewModal()">Cerrar</button>
                    <button type="button" class="btn btn-primary" onclick="closeNivelPreviewModal(); editNivel(currentNivelPreviewData.id)">
                        <i class="bi bi-pencil"></i> Editar Nivel
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function updateNivelPreviewContent() {
    if (!currentNivelPreviewData) return;
    
    const nivel = currentNivelPreviewData;
    const preguntas = nivel.preguntas || [];
    const i = currentNivelPreviewIndex;
    const pregunta = preguntas[i];
    
    if (!pregunta) return;
    
    const screen = document.getElementById('nivelPreviewScreen');
    const indicator = document.getElementById('nivelPreviewIndicator');
    const prevBtn = document.getElementById('prevNivelPreviewBtn');
    const nextBtn = document.getElementById('nextNivelPreviewBtn');
    const title = document.getElementById('previewNivelTitle');
    
    const config = materiasConfig[currentMateriaDesafio];
    const letras = ['A', 'B', 'C', 'D'];
    const tipo = pregunta.tipo || 'texto';
    const tipoInfo = tiposPregunta[tipo] || { nombre: 'Pregunta', icon: 'bi-question' };
    
    if (title) title.textContent = `Nivel ${nivel.numero} - ${nivel.tema || 'Sin tema'}`;
    
    let preguntaHTML = '';
    let opcionesHTML = '';
    
    // Render based on question type
    switch (tipo) {
        case 'texto':
            preguntaHTML = `<p>${pregunta.pregunta || 'Sin texto'}</p>`;
            opcionesHTML = (pregunta.opciones || []).map((op, idx) => `
                <div class="preview-option ${idx === pregunta.correcta ? 'correct' : ''}">
                    <span class="option-letter">${letras[idx]}</span>
                    <span class="option-text">${op}</span>
                    ${idx === pregunta.correcta ? '<i class="bi bi-check-circle-fill option-check"></i>' : ''}
                </div>
            `).join('');
            break;
            
        case 'imagen':
            preguntaHTML = `
                <p>${pregunta.pregunta || 'Sin texto'}</p>
                ${pregunta.imagenPregunta ? `<img src="${pregunta.imagenPregunta}" class="preview-question-image" alt="Imagen">` : ''}
            `;
            opcionesHTML = (pregunta.opciones || []).map((op, idx) => `
                <div class="preview-option ${idx === pregunta.correcta ? 'correct' : ''}">
                    <span class="option-letter">${letras[idx]}</span>
                    <span class="option-text">${op}</span>
                    ${idx === pregunta.correcta ? '<i class="bi bi-check-circle-fill option-check"></i>' : ''}
                </div>
            `).join('');
            break;
            
        case 'seleccionImagen':
        case 'imagenOpciones':
            preguntaHTML = `
                <p>${pregunta.pregunta || 'Sin texto'}</p>
                ${tipo === 'imagenOpciones' && pregunta.imagenPregunta ? `<img src="${pregunta.imagenPregunta}" class="preview-question-image" alt="Imagen">` : ''}
            `;
            opcionesHTML = `<div class="preview-options-images">
                ${(pregunta.opcionesImagenes || []).map((img, idx) => `
                    <div class="preview-option-image ${idx === pregunta.correcta ? 'correct' : ''}">
                        ${img ? `<img src="${img}" alt="Opción ${letras[idx]}">` : `<div class="no-image"><i class="bi bi-image"></i></div>`}
                        <span class="option-letter">${letras[idx]}</span>
                        ${idx === pregunta.correcta ? '<i class="bi bi-check-circle-fill check-icon"></i>' : ''}
                    </div>
                `).join('')}
            </div>`;
            break;
            
        case 'video':
            const videoUrl = pregunta.videoUrl || '';
            let videoEmbed = '';
            if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
                const videoId = extractYouTubeId(videoUrl);
                videoEmbed = videoId ? `<iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>` : '';
            } else if (videoUrl.includes('drive.google.com')) {
                const driveId = extractDriveId(videoUrl);
                videoEmbed = driveId ? `<iframe src="https://drive.google.com/file/d/${driveId}/preview" frameborder="0" allowfullscreen></iframe>` : '';
            }
            
            preguntaHTML = `
                <p>${pregunta.pregunta || 'Mira el video'}</p>
                <div class="preview-video-container">${videoEmbed || '<div class="preview-no-video"><i class="bi bi-play-circle"></i></div>'}</div>
            `;
            opcionesHTML = `
                <div class="preview-video-options">
                    <div class="preview-option video-option ${pregunta.correcta === 0 ? 'correct' : ''}">
                        <i class="bi bi-check-circle-fill"></i><span>Entendí</span>
                    </div>
                    <div class="preview-option video-option ${pregunta.correcta === 1 ? 'correct' : ''}">
                        <i class="bi bi-x-circle-fill"></i><span>No entendí</span>
                    </div>
                </div>
            `;
            break;
    }
    
    let pistaHTML = pregunta.pista ? `
        <div class="preview-pista-card">
            <div class="preview-pista-icon"><i class="bi bi-lightbulb-fill"></i></div>
            <div class="preview-pista-content">
                <div class="preview-pista-label">Pista</div>
                <div class="preview-pista-text">${pregunta.pista}</div>
            </div>
        </div>
    ` : '';
    
    screen.innerHTML = `
        <div class="nivel-preview-header">
            <div class="nivel-badge" style="--preview-color: ${config.color}">
                <i class="bi ${config.icon}"></i>
                <span>Nivel ${nivel.numero}</span>
            </div>
            <div class="nivel-tema"><i class="bi bi-bookmark-fill"></i> ${nivel.tema || 'Sin tema'}</div>
        </div>
        <div class="preview-tipo-badge" style="background: ${config.color}">
            <i class="bi ${tipoInfo.icon}"></i>
            <span>${tipoInfo.nombre}</span>
        </div>
        <div class="preview-progress">
            <div class="preview-progress-bar">
                <div class="preview-progress-fill" style="width: ${((i + 1) / preguntas.length) * 100}%; background: linear-gradient(90deg, ${config.color}, color-mix(in srgb, ${config.color} 70%, white))"></div>
            </div>
            <span>${i + 1}/${preguntas.length}</span>
        </div>
        <div class="preview-question">${preguntaHTML}</div>
        <div class="preview-options">${opcionesHTML}</div>
        ${pistaHTML}
    `;
    
    if (indicator) indicator.textContent = `Pregunta ${i + 1} de ${preguntas.length}`;
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = i >= preguntas.length - 1;
}

function navigateNivelPreview(direction) {
    if (!currentNivelPreviewData) return;
    const preguntas = currentNivelPreviewData.preguntas || [];
    const newIndex = currentNivelPreviewIndex + direction;
    if (newIndex >= 0 && newIndex < preguntas.length) {
        currentNivelPreviewIndex = newIndex;
        updateNivelPreviewContent();
    }
}

function closeNivelPreviewModal() {
    const modal = document.getElementById('nivelPreviewModal');
    if (modal) modal.classList.remove('active');
}
