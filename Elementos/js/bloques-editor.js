// Bloques Editor JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Initialize
    checkAuthentication();
    initializePanelModal();
    setupEventListeners();
    loadTestData();
    
    // Inicializar foto de perfil
    if (typeof inicializarPerfilCompartido === 'function') {
        inicializarPerfilCompartido();
    }
});

let currentUser = null;
let currentTest = null;
let testBlocks = {
    bloque1: {
        matematicas: { questions: [] },
        lectura: { questions: [] },
        sociales: { questions: [] },
        ciencias: { questions: [] }
    },
    bloque2: {
        matematicas: { questions: [] },
        sociales: { questions: [] },
        ciencias: { questions: [] },
        ingles: { questions: [] }
    }
};
let currentEditingSubject = null;
let currentEditingBlock = null;

// ImgBB API configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// Subject configurations
const subjectConfig = {
    matematicas: {
        name: 'Matemáticas',
        icon: 'bi-calculator',
        color: '#007bff'
    },
    lectura: {
        name: 'Lectura',
        icon: 'bi-book',
        color: '#dc3545'
    },
    sociales: {
        name: 'Sociales',
        icon: 'bi-globe',
        color: '#fd7e14'
    },
    ciencias: {
        name: 'Ciencias',
        icon: 'bi-gear-fill',
        color: '#28a745'
    },
    ingles: {
        name: 'Inglés',
        icon: 'bi-translate',
        color: '#6f42c1'
    }
};

// Check authentication
function checkAuthentication() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (!currentUser.id || currentUser.tipoUsuario !== 'admin') {
        window.location.href = '../index.html';
        return;
    }

    // Load user info
    if (currentUser.nombre) {
        document.getElementById('userName').textContent = currentUser.nombre.toUpperCase();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    document.getElementById('backBtn').addEventListener('click', goBack);

    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Modal events
    document.getElementById('closeModal').addEventListener('click', hideSubjectModal);
    document.getElementById('cancelEdit').addEventListener('click', hideSubjectModal);
    document.getElementById('saveSubject').addEventListener('click', saveSubjectData);
    document.getElementById('addQuestionBtn').addEventListener('click', addNewQuestion);

    // Save blocks button
    document.getElementById('saveBlocksBtn').addEventListener('click', saveAllBlocks);

    // Close modal on overlay click
    document.getElementById('subjectModal').addEventListener('click', function (e) {
        if (e.target === this) {
            hideSubjectModal();
        }
    });
}

// Go back to tests
function goBack() {
    window.location.href = 'Pruebas.html';
}

// Initialize panel modal
function initializePanelModal() {
    const modalStyles = `
        <style id="panel-modal-styles">
        .panel-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }
        
        .panel-modal-overlay.active {
            opacity: 1;
            visibility: visible;
        }
        
        .panel-modal {
            background: white;
            border-radius: 12px;
            padding: 0;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            transform: scale(0.8);
            transition: all 0.3s ease;
            overflow: hidden;
        }
        
        .panel-modal-overlay.active .panel-modal {
            transform: scale(1);
        }
        
        .panel-modal-body {
            padding: 30px;
            text-align: center;
        }
        
        .panel-modal-icon {
            font-size: 48px;
            color: #ffc107;
            margin-bottom: 20px;
            display: block;
        }
        
        .panel-modal-message {
            font-size: 18px;
            color: #333;
            margin: 0 0 30px 0;
            line-height: 1.5;
        }
        
        .panel-modal-footer {
            display: flex;
            gap: 10px;
            justify-content: center;
        }
        
        .panel-modal-btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .panel-btn-cancel {
            background: #f5f5f5;
            color: #333;
            border: 1px solid #ddd;
        }
        
        .panel-btn-cancel:hover {
            background: #e9e9e9;
            transform: translateY(-1px);
        }
        
        .panel-btn-confirm {
            background: #dc3545;
            color: white;
        }
        
        .panel-btn-confirm:hover {
            background: #c82333;
            transform: translateY(-1px);
        }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', modalStyles);
}

// Show delete video modal
function showDeleteVideoModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="deleteVideoModalOverlay">
                <div class="panel-modal">
                    <div class="panel-modal-body">
                        <i class="bi bi-exclamation-triangle panel-modal-icon" style="color: #ffc107;"></i>
                        <p class="panel-modal-message">¿Estás seguro de que deseas eliminar este video?</p>
                        <div class="panel-modal-footer">
                            <button class="panel-modal-btn panel-btn-cancel" id="deleteVideoModalCancel">
                                <i class="bi bi-x-lg"></i>
                                Cancelar
                            </button>
                            <button class="panel-modal-btn panel-btn-confirm" id="deleteVideoModalConfirm">
                                <i class="bi bi-trash"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('deleteVideoModalOverlay');
        const confirmBtn = document.getElementById('deleteVideoModalConfirm');
        const cancelBtn = document.getElementById('deleteVideoModalCancel');
        
        setTimeout(() => overlay.classList.add('active'), 10);

        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(false);
            }
        });

        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                resolve(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// Show delete question modal
function showDeleteQuestionModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="deleteQuestionModalOverlay">
                <div class="panel-modal">
                    <div class="panel-modal-body">
                        <i class="bi bi-exclamation-triangle panel-modal-icon" style="color: #dc3545;"></i>
                        <p class="panel-modal-message">¿Estás seguro de que deseas eliminar esta pregunta?</p>
                        <div class="panel-modal-footer">
                            <button class="panel-modal-btn panel-btn-cancel" id="deleteQuestionModalCancel">
                                <i class="bi bi-x-lg"></i>
                                Cancelar
                            </button>
                            <button class="panel-modal-btn panel-btn-confirm" id="deleteQuestionModalConfirm">
                                <i class="bi bi-trash"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('deleteQuestionModalOverlay');
        const confirmBtn = document.getElementById('deleteQuestionModalConfirm');
        const cancelBtn = document.getElementById('deleteQuestionModalCancel');
        
        setTimeout(() => overlay.classList.add('active'), 10);

        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(false);
            }
        });

        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                resolve(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// Show logout modal
function showLogoutModal() {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="panelModalOverlay">
                <div class="panel-modal">
                    <div class="panel-modal-body">
                        <i class="bi bi-exclamation-triangle panel-modal-icon"></i>
                        <p class="panel-modal-message">¿Estás seguro de que deseas cerrar sesión?</p>
                        <div class="panel-modal-footer">
                            <button class="panel-modal-btn panel-btn-cancel" id="panelModalCancel">
                                <i class="bi bi-x-lg"></i>
                                No
                            </button>
                            <button class="panel-modal-btn panel-btn-confirm" id="panelModalConfirm">
                                <i class="bi bi-check-lg"></i>
                                Sí
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('panelModalOverlay');
        const confirmBtn = document.getElementById('panelModalConfirm');
        const cancelBtn = document.getElementById('panelModalCancel');
        
        setTimeout(() => overlay.classList.add('active'), 10);

        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(false);
            }
        });
    });
}

// Close modal
function closeModal(overlay) {
    overlay.classList.remove('active');
    setTimeout(() => {
        if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
    }, 300);
}

// Handle logout
async function handleLogout() {
    const confirmed = await showLogoutModal();
    
    if (confirmed) {
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('editingTestId');
        window.location.href = '../index.html';
    }
}

// Load test data
async function loadTestData() {
    try {
        console.log('loadTestData called');
        showLoadingOverlay();

        const testId = sessionStorage.getItem('editingTestId');
        console.log('Retrieved testId from sessionStorage:', testId);
        
        if (!testId) {
            console.error('No testId found in sessionStorage');
            throw new Error('No se encontró el ID de la prueba');
        }

        // Wait for Firebase to be initialized
        if (!window.firebaseDB) {
            await new Promise(resolve => {
                const checkDB = () => {
                    if (window.firebaseDB) {
                        resolve();
                    } else {
                        setTimeout(checkDB, 100);
                    }
                };
                checkDB();
            });
        }

        const db = window.firebaseDB;
        const testDoc = await db.collection('pruebas').doc(testId).get();

        if (!testDoc.exists) {
            throw new Error('La prueba no existe');
        }

        currentTest = { id: testDoc.id, ...testDoc.data() };

        // Load existing blocks data if available
        if (currentTest.bloques) {
            testBlocks = currentTest.bloques;
        }

        // Update UI
        updateTestInfo();
        updateQuestionsCount();

        hideLoadingOverlay();

    } catch (error) {
        console.error('Error loading test data:', error);
        showNotification('Error al cargar los datos de la prueba: ' + error.message, 'error');
        hideLoadingOverlay();
        
        // Redirect back to tests after error
        setTimeout(() => {
            window.location.href = 'Pruebas.html';
        }, 3000);
    }
}

// Update test info
function updateTestInfo() {
    document.getElementById('testName').textContent = currentTest.nombre;
    
    // Format date
    const [year, month, day] = currentTest.fechaDisponible.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    const formattedDate = testDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('testDate').textContent = `Fecha: ${formattedDate}`;

    // Update block times
    document.getElementById('block1Time').textContent = 
        `${currentTest.bloque1?.horaInicio || 'N/A'} - ${currentTest.bloque1?.horaFin || 'N/A'}`;
    document.getElementById('block2Time').textContent = 
        `${currentTest.bloque2?.horaInicio || 'N/A'} - ${currentTest.bloque2?.horaFin || 'N/A'}`;
}

// Update questions count
function updateQuestionsCount() {
    // Block 1
    Object.keys(testBlocks.bloque1).forEach(subject => {
        const items = testBlocks.bloque1[subject].questions;
        // Contar solo las preguntas reales (no párrafos ni títulos)
        const count = items.filter(item => 
            item.type === 'multiple' || item.type === 'short' || item.type === 'open'
        ).length;
        const element = document.getElementById(`${subject}-block1-count`);
        const subjectCard = document.querySelector(`[data-block="1"] .subject-card.${subject}`);
        
        if (element) {
            element.textContent = `${count} pregunta${count !== 1 ? 's' : ''}`;
        }
        
        // Add visual indicators
        if (subjectCard) {
            if (items.length > 0) {
                subjectCard.classList.add('has-questions');
                subjectCard.classList.remove('no-questions');
            } else {
                subjectCard.classList.add('no-questions');
                subjectCard.classList.remove('has-questions');
            }
        }
    });

    // Block 2
    Object.keys(testBlocks.bloque2).forEach(subject => {
        const items = testBlocks.bloque2[subject].questions;
        // Contar solo las preguntas reales (no párrafos ni títulos)
        const count = items.filter(item => 
            item.type === 'multiple' || item.type === 'short' || item.type === 'open'
        ).length;
        const element = document.getElementById(`${subject}-block2-count`);
        const subjectCard = document.querySelector(`[data-block="2"] .subject-card.${subject}`);
        
        if (element) {
            element.textContent = `${count} pregunta${count !== 1 ? 's' : ''}`;
        }
        
        // Add visual indicators
        if (subjectCard) {
            if (items.length > 0) {
                subjectCard.classList.add('has-questions');
                subjectCard.classList.remove('no-questions');
            } else {
                subjectCard.classList.add('no-questions');
                subjectCard.classList.remove('has-questions');
            }
        }
    });
}

// Edit subject
function editSubject(subject, block) {
    currentEditingSubject = subject;
    currentEditingBlock = block;

    const config = subjectConfig[subject];
    const blockKey = `bloque${block}`;

    // Update modal header
    document.getElementById('modalTitle').textContent = `Editar ${config.name}`;
    document.getElementById('modalSubjectName').textContent = config.name;
    document.getElementById('modalBlockInfo').textContent = `Bloque ${block}`;

    // Update subject icon
    const iconElement = document.getElementById('modalSubjectIcon');
    iconElement.className = `subject-icon-large ${subject}`;
    iconElement.innerHTML = `<i class="${config.icon}"></i>`;

    // Load questions
    loadQuestionsInModal();

    // Show modal
    document.getElementById('subjectModal').classList.add('active');
}

// Load questions in modal
function loadQuestionsInModal() {
    const container = document.getElementById('questionsContainer');
    const blockKey = `bloque${currentEditingBlock}`;
    const questions = testBlocks[blockKey][currentEditingSubject].questions;

    if (questions.length === 0) {
        container.innerHTML = `
            <div class="empty-questions">
                <i class="bi bi-question-circle"></i>
                <h4>No hay elementos</h4>
                <p>Agrega preguntas o textos de lectura para esta materia</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    let questionNumber = 1;
    questions.forEach((question, index) => {
        const questionElement = createQuestionElement(question, index, questionNumber);
        container.appendChild(questionElement);
        // Solo incrementar el número si es una pregunta real
        if (question.type === 'multiple' || question.type === 'short' || question.type === 'open') {
            questionNumber++;
        }
    });
}

// Create question element
function createQuestionElement(question, index, questionNumber) {
    const div = document.createElement('div');
    div.dataset.questionIndex = index;

    // Diferentes estilos según el tipo
    if (question.type === 'reading') {
        // Texto de lectura (título + párrafo juntos)
        div.className = 'question-item reading-item';
        div.innerHTML = `
            <div class="question-header">
                <div class="question-number reading-badge">
                    <i class="bi bi-book-half"></i>
                    Texto de Lectura
                </div>
                <div class="question-actions">
                    <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${index})">
                        <i class="bi bi-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
            <div class="question-content">
                <div class="reading-title-section">
                    <label class="reading-label">
                        <i class="bi bi-type-h1"></i>
                        Título:
                    </label>
                    <input type="text" class="title-input" placeholder="Ej: Comprensión de Lectura, Según el texto responde..." 
                           value="${question.title || ''}"
                           onchange="updateReadingTitle(${index}, this.value)">
                </div>
                <div class="reading-paragraph-section">
                    <label class="reading-label">
                        <i class="bi bi-text-paragraph"></i>
                        Texto:
                    </label>
                    <div class="question-text-container">
                        ${createQuestionMediaHTML(question.images || [], question.videos || [], index)}
                        <textarea class="question-text paragraph-text" placeholder="Escribe el texto de lectura aquí..." 
                                  onchange="updateQuestionText(${index}, this.value)">${question.text || ''}</textarea>
                        <div class="media-controls">
                            <button class="btn btn-sm btn-info" onclick="addImageToQuestion(${index})">
                                <i class="bi bi-image"></i>
                                Agregar Imagen
                            </button>
                            <button class="btn btn-sm btn-warning" onclick="addVideoToQuestion(${index})">
                                <i class="bi bi-youtube"></i>
                                Agregar Video
                            </button>
                        </div>
                    </div>
                </div>
                <div class="reading-context-section">
                    <label class="reading-label">
                        <i class="bi bi-eye"></i>
                        Mostrar como contexto en:
                    </label>
                    <div class="context-questions-selector" id="contextSelector_${index}">
                        ${createContextQuestionsSelector(index)}
                    </div>
                </div>
            </div>
        `;
    } else {
        // Pregunta normal (multiple choice)
        div.className = 'question-item';
        div.innerHTML = `
            <div class="question-header">
                <div class="question-number">Pregunta ${questionNumber}</div>
                <div class="question-type">Selección Múltiple</div>
                <div class="question-actions">
                    <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${index})">
                        <i class="bi bi-trash"></i>
                        Eliminar
                    </button>
                </div>
            </div>
            <div class="question-content">
                <div class="question-text-container">
                    ${createQuestionMediaHTML(question.images || [], question.videos || [], index)}
                    <textarea class="question-text" placeholder="Escribe tu pregunta aquí..." 
                              onchange="updateQuestionText(${index}, this.value)">${question.text || ''}</textarea>
                    <div class="media-controls">
                        <button class="btn btn-sm btn-info" onclick="addImageToQuestion(${index})">
                            <i class="bi bi-image"></i>
                            Agregar Imagen
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="addVideoToQuestion(${index})">
                            <i class="bi bi-youtube"></i>
                            Agregar Video
                        </button>
                    </div>
                </div>
                ${createOptionsHTML(question.options || [], index)}
            </div>
        `;
    }

    return div;
}

// Create options HTML
function createOptionsHTML(options, questionIndex) {
    let html = '<div class="options-container">';
    
    options.forEach((option, optionIndex) => {
        html += `
            <div class="option-item">
                <div class="option-controls">
                    <input type="radio" name="correct_${questionIndex}" 
                           ${option.isCorrect ? 'checked' : ''} 
                           onchange="setCorrectOption(${questionIndex}, ${optionIndex})">
                    <div class="option-content-editor">
                        <input type="text" value="${option.text || ''}" 
                               placeholder="Opción ${optionIndex + 1}"
                               onchange="updateOptionText(${questionIndex}, ${optionIndex}, this.value)">
                        ${createOptionImagesHTML(option.images || [], questionIndex, optionIndex)}
                    </div>
                    <div class="option-buttons">
                        ${(option.images && option.images.length > 0) ? `
                            <button class="btn btn-sm btn-danger" onclick="removeImageFromOption(${questionIndex}, ${optionIndex}, 0)">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-info" onclick="addImageToOption(${questionIndex}, ${optionIndex})">
                                <i class="bi bi-image"></i>
                            </button>
                        `}
                        ${options.length > 2 ? `
                            <button class="btn btn-sm btn-danger" onclick="deleteOption(${questionIndex}, ${optionIndex})">
                                <i class="bi bi-x"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });

    html += `
        <button class="btn btn-sm btn-primary add-option-btn" onclick="addOption(${questionIndex})">
            <i class="bi bi-plus"></i>
            Agregar Opción
        </button>
    </div>`;

    return html;
}

// Add new question
function addNewQuestion() {
    showQuestionTypeModal();
}

// Show question type selection modal - Multiple choice or reading text (title + paragraph)
function showQuestionTypeModal() {
    const modalHTML = `
        <div class="modal-overlay" id="questionTypeModal">
            <div class="modal modal-sm">
                <div class="modal-header">
                    <h3>Seleccionar Tipo de Elemento</h3>
                    <button class="close-btn" onclick="hideQuestionTypeModal()">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="question-type-grid">
                        <button class="question-type-card" onclick="createQuestion('multiple')">
                            <i class="bi bi-ui-checks"></i>
                            <h4>Pregunta</h4>
                            <p>Pregunta de selección múltiple</p>
                        </button>
                        <button class="question-type-card" onclick="createQuestion('reading')">
                            <i class="bi bi-book-half"></i>
                            <h4>Texto de Lectura</h4>
                            <p>Título + Párrafo de contexto</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('questionTypeModal').classList.add('active');
}

// Hide question type modal
function hideQuestionTypeModal() {
    const modal = document.getElementById('questionTypeModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Create question based on type
function createQuestion(type) {
    const blockKey = `bloque${currentEditingBlock}`;

    switch (type) {
        case 'multiple':
            const newQuestion = {
                type: 'multiple',
                text: '',
                images: [],
                videos: [],
                options: [
                    { text: '', isCorrect: true, images: [] },
                    { text: '', isCorrect: false, images: [] },
                    { text: '', isCorrect: false, images: [] },
                    { text: '', isCorrect: false, images: [] }
                ]
            };
            testBlocks[blockKey][currentEditingSubject].questions.push(newQuestion);
            break;
            
        case 'reading':
            // Crear título y párrafo juntos como un grupo
            const readingGroup = {
                type: 'reading',
                title: '',
                text: '',
                images: [],
                videos: [],
                showInQuestions: [] // Array de índices de preguntas donde se mostrará
            };
            testBlocks[blockKey][currentEditingSubject].questions.push(readingGroup);
            break;
            
        case 'short':
            const shortQuestion = {
                type: 'short',
                text: '',
                images: [],
                videos: [],
                correctAnswer: '',
                caseSensitive: false
            };
            testBlocks[blockKey][currentEditingSubject].questions.push(shortQuestion);
            break;
            
        case 'open':
            const openQuestion = {
                type: 'open',
                text: '',
                images: [],
                videos: []
            };
            testBlocks[blockKey][currentEditingSubject].questions.push(openQuestion);
            break;
    }

    hideQuestionTypeModal();
    loadQuestionsInModal();
}

// Update question text
function updateQuestionText(index, text) {
    const blockKey = `bloque${currentEditingBlock}`;
    testBlocks[blockKey][currentEditingSubject].questions[index].text = text;
}

// Update reading title
function updateReadingTitle(index, title) {
    const blockKey = `bloque${currentEditingBlock}`;
    testBlocks[blockKey][currentEditingSubject].questions[index].title = title;
}

// Create context questions selector
function createContextQuestionsSelector(readingIndex) {
    const blockKey = `bloque${currentEditingBlock}`;
    const allItems = testBlocks[blockKey][currentEditingSubject].questions;
    const reading = allItems[readingIndex];
    
    let html = '<div class="context-checkboxes">';
    let questionNumber = 0;
    
    // Buscar preguntas que vienen DESPUÉS de este texto de lectura
    for (let i = readingIndex + 1; i < allItems.length; i++) {
        const item = allItems[i];
        
        // Si es otra lectura, detener
        if (item.type === 'reading') {
            break;
        }
        
        // Si es una pregunta
        if (item.type === 'multiple' || item.type === 'short' || item.type === 'open') {
            questionNumber++;
            const isChecked = reading.showInQuestions && reading.showInQuestions.includes(i);
            
            html += `
                <label class="context-checkbox-item">
                    <input type="checkbox" 
                           ${isChecked ? 'checked' : ''}
                           onchange="toggleContextQuestion(${readingIndex}, ${i}, this.checked)">
                    <span>Pregunta ${questionNumber}</span>
                </label>
            `;
        }
    }
    
    if (questionNumber === 0) {
        html += '<p class="no-questions-message">No hay preguntas después de este texto. Agrega preguntas para poder seleccionarlas.</p>';
    }
    
    html += '</div>';
    return html;
}

// Toggle context question
function toggleContextQuestion(readingIndex, questionIndex, isChecked) {
    const blockKey = `bloque${currentEditingBlock}`;
    const reading = testBlocks[blockKey][currentEditingSubject].questions[readingIndex];
    
    if (!reading.showInQuestions) {
        reading.showInQuestions = [];
    }
    
    if (isChecked) {
        // Agregar si no existe
        if (!reading.showInQuestions.includes(questionIndex)) {
            reading.showInQuestions.push(questionIndex);
        }
    } else {
        // Remover si existe
        const idx = reading.showInQuestions.indexOf(questionIndex);
        if (idx > -1) {
            reading.showInQuestions.splice(idx, 1);
        }
    }
}

// Change question type
function changeQuestionType(index) {
    const blockKey = `bloque${currentEditingBlock}`;
    const question = testBlocks[blockKey][currentEditingSubject].questions[index];
    
    if (question.type === 'multiple') {
        question.type = 'open';
        delete question.options;
    } else {
        question.type = 'multiple';
        question.options = [
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
        ];
    }
    
    loadQuestionsInModal();
}

// Delete question
async function deleteQuestion(index) {
    const confirmed = await showDeleteQuestionModal();
    
    if (confirmed) {
        const blockKey = `bloque${currentEditingBlock}`;
        testBlocks[blockKey][currentEditingSubject].questions.splice(index, 1);
        loadQuestionsInModal();
        showNotification('Pregunta eliminada correctamente', 'success');
    }
}

// Update option text
function updateOptionText(questionIndex, optionIndex, text) {
    const blockKey = `bloque${currentEditingBlock}`;
    testBlocks[blockKey][currentEditingSubject].questions[questionIndex].options[optionIndex].text = text;
}

// Set correct option
function setCorrectOption(questionIndex, optionIndex) {
    const blockKey = `bloque${currentEditingBlock}`;
    const options = testBlocks[blockKey][currentEditingSubject].questions[questionIndex].options;
    
    options.forEach((option, index) => {
        option.isCorrect = index === optionIndex;
    });
}

// Add option
function addOption(questionIndex) {
    const blockKey = `bloque${currentEditingBlock}`;
    const options = testBlocks[blockKey][currentEditingSubject].questions[questionIndex].options;
    
    options.push({ text: '', isCorrect: false, images: [] });
    loadQuestionsInModal();
}

// Delete option
function deleteOption(questionIndex, optionIndex) {
    const blockKey = `bloque${currentEditingBlock}`;
    const options = testBlocks[blockKey][currentEditingSubject].questions[questionIndex].options;
    
    if (options.length > 2) {
        options.splice(optionIndex, 1);
        loadQuestionsInModal();
    } else {
        showNotification('Mínimo 2 opciones por pregunta', 'warning');
    }
}

// Hide subject modal
function hideSubjectModal() {
    document.getElementById('subjectModal').classList.remove('active');
}

// Save subject data
function saveSubjectData() {
    // Validate questions
    const blockKey = `bloque${currentEditingBlock}`;
    const questions = testBlocks[blockKey][currentEditingSubject].questions;
    
    let questionNumber = 1;
    for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        
        if (question.type === 'reading') {
            // Validar texto de lectura
            if (!question.title || !question.title.trim()) {
                showNotification('El título del texto de lectura no puede estar vacío', 'error');
                return;
            }
            if (!question.text || !question.text.trim()) {
                showNotification('El texto de lectura no puede estar vacío', 'error');
                return;
            }
        } else if (question.type === 'multiple') {
            // Validar pregunta
            if (!question.text.trim()) {
                showNotification(`La pregunta ${questionNumber} no puede estar vacía`, 'error');
                return;
            }
            
            if (!question.options || question.options.length < 2) {
                showNotification(`La pregunta ${questionNumber} debe tener al menos 2 opciones`, 'error');
                return;
            }
            
            let hasCorrect = false;
            let hasText = false;
            
            for (const option of question.options) {
                if (option.text.trim()) hasText = true;
                if (option.isCorrect) hasCorrect = true;
            }
            
            if (!hasText) {
                showNotification(`La pregunta ${questionNumber} debe tener al menos una opción con texto`, 'error');
                return;
            }
            
            if (!hasCorrect) {
                showNotification(`La pregunta ${questionNumber} debe tener una respuesta correcta marcada`, 'error');
                return;
            }
            
            questionNumber++;
        }
    }
    
    updateQuestionsCount();
    hideSubjectModal();
    showNotification('Materia guardada correctamente', 'success');
}

// Save all blocks
async function saveAllBlocks() {
    try {
        showLoadingOverlay();

        const db = window.firebaseDB;
        await db.collection('pruebas').doc(currentTest.id).update({
            bloques: testBlocks,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        });

        showNotification('Bloques guardados exitosamente', 'success');
        hideLoadingOverlay();

    } catch (error) {
        console.error('Error saving blocks:', error);
        showNotification('Error al guardar los bloques: ' + error.message, 'error');
        hideLoadingOverlay();
    }
}

// Show loading overlay
function showLoadingOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `<div class="loading-spinner"></div>`;
    document.body.appendChild(overlay);
}

// Hide loading overlay
function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="bi bi-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Get notification icon
function getNotificationIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        info: 'info-circle',
        warning: 'exclamation-triangle'
    };
    return icons[type] || 'info-circle';
}

// ========== IMAGE HANDLING FUNCTIONS ==========

// Create question images HTML
function createQuestionImagesHTML(images, questionIndex) {
    if (!images || images.length === 0) return '';
    
    let html = '<div class="question-images">';
    images.forEach((image, imageIndex) => {
        html += `
            <div class="image-item">
                <img src="${image.url}" alt="Imagen de pregunta" class="question-image" 
                     onclick="showImageModal('${image.url}')">
                <button class="btn btn-sm btn-danger image-delete-btn" 
                        onclick="removeImageFromQuestion(${questionIndex}, ${imageIndex})">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Create option images HTML
function createOptionImagesHTML(images, questionIndex, optionIndex) {
    if (!images || images.length === 0) return '';
    
    let html = '<div class="option-images">';
    images.forEach((image, imageIndex) => {
        html += `
            <div class="image-item">
                <img src="${image.url}" alt="Imagen de opción" class="option-image" 
                     onclick="showImageModal('${image.url}')">
                <button class="btn btn-sm btn-danger image-delete-btn" 
                        onclick="removeImageFromOption(${questionIndex}, ${optionIndex}, ${imageIndex})">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Upload image to ImgBB
async function uploadImageToImgBB(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('key', IMGBB_API_KEY);

        const response = await fetch(IMGBB_API_URL, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            return {
                url: result.data.url,
                deleteUrl: result.data.delete_url,
                filename: result.data.image.filename
            };
        } else {
            throw new Error(result.error?.message || 'Error al subir imagen');
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Add image to question
async function addImageToQuestion(questionIndex) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('La imagen no puede ser mayor a 5MB', 'error');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Solo se permiten archivos de imagen', 'error');
            return;
        }

        try {
            showLoadingOverlay();
            const imageData = await uploadImageToImgBB(file);
            
            const blockKey = `bloque${currentEditingBlock}`;
            const question = testBlocks[blockKey][currentEditingSubject].questions[questionIndex];
            
            if (!question.images) {
                question.images = [];
            }
            
            question.images.push(imageData);
            loadQuestionsInModal();
            showNotification('Imagen agregada correctamente', 'success');
            
        } catch (error) {
            showNotification('Error al subir imagen: ' + error.message, 'error');
        } finally {
            hideLoadingOverlay();
        }
    };

    input.click();
}

// ========== MEDIA HANDLING FUNCTIONS ==========

// Create combined media HTML (images and videos side by side)
function createQuestionMediaHTML(images, videos, questionIndex) {
    if ((!images || images.length === 0) && (!videos || videos.length === 0)) return '';
    
    let html = '<div class="question-media-container">';
    
    // Add images section
    if (images && images.length > 0) {
        html += '<div class="media-section images-section">';
        html += '<h5 class="media-section-title"><i class="bi bi-image"></i> Imágenes</h5>';
        html += '<div class="question-images">';
        images.forEach((image, imageIndex) => {
            html += `
                <div class="image-item">
                    <img src="${image.url}" alt="Imagen de pregunta" class="question-image" 
                         onclick="showImageModal('${image.url}')">
                    <button class="btn btn-sm btn-danger image-delete-btn" 
                            onclick="removeImageFromQuestion(${questionIndex}, ${imageIndex})">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
        });
        html += '</div></div>';
    }
    
    // Add videos section
    if (videos && videos.length > 0) {
        html += '<div class="media-section videos-section">';
        html += '<h5 class="media-section-title"><i class="bi bi-youtube"></i> Videos</h5>';
        html += '<div class="question-videos">';
        videos.forEach((video, videoIndex) => {
            html += `
                <div class="video-item">
                    <div class="video-preview">
                        <iframe 
                            src="https://www.youtube.com/embed/${video.videoId}" 
                            frameborder="0" 
                            allowfullscreen
                            class="question-video">
                        </iframe>
                        <div class="video-info">
                            <span class="video-title">${video.title || 'Video de YouTube'}</span>
                        </div>
                    </div>
                    <button class="btn btn-sm btn-danger video-delete-btn" 
                            onclick="removeVideoFromQuestion(${questionIndex}, ${videoIndex})">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
        });
        html += '</div></div>';
    }
    
    html += '</div>';
    return html;
}

// ========== VIDEO HANDLING FUNCTIONS ==========

// Create question videos HTML
function createQuestionVideosHTML(videos, questionIndex) {
    if (!videos || videos.length === 0) return '';
    
    let html = '<div class="question-videos">';
    videos.forEach((video, videoIndex) => {
        html += `
            <div class="video-item">
                <div class="video-preview">
                    <iframe 
                        src="https://www.youtube.com/embed/${video.videoId}" 
                        frameborder="0" 
                        allowfullscreen
                        class="question-video">
                    </iframe>
                    <div class="video-info">
                        <span class="video-title">${video.title || 'Video de YouTube'}</span>
                    </div>
                </div>
                <button class="btn btn-sm btn-danger video-delete-btn" 
                        onclick="removeVideoFromQuestion(${questionIndex}, ${videoIndex})">
                    <i class="bi bi-x"></i>
                </button>
            </div>
        `;
    });
    html += '</div>';
    return html;
}

// Extract YouTube video ID from URL and convert to embed format
function extractYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

// Convert YouTube URL to embed format automatically
function convertToYouTubeEmbed(url) {
    if (!url) return url;
    
    // If it's already an embed URL, return as is
    if (url.includes('youtube.com/embed/')) {
        return url;
    }
    
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
}

// Add video to question
function addVideoToQuestion(questionIndex) {
    // Create modal for video URL input
    const modalHTML = `
        <div class="modal-overlay" id="videoModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Agregar Video de YouTube</h3>
                    <button class="close-btn" onclick="hideVideoModal()">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="video-input-container">
                        <label for="videoUrl">URL del video de YouTube:</label>
                        <input type="url" id="videoUrl" placeholder="https://www.youtube.com/watch?v=... o https://www.youtube.com/embed/..." class="form-control">
                        <small class="form-text">Pega aquí el enlace del video de YouTube. Se convertirá automáticamente al formato embed.</small>
                        
                        <div class="video-preview-container" id="videoPreviewContainer" style="display: none;">
                            <h5>Vista previa:</h5>
                            <iframe id="videoPreview" frameborder="0" allowfullscreen></iframe>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="hideVideoModal()">Cancelar</button>
                    <button type="button" class="btn btn-primary" onclick="previewVideo()">Vista Previa</button>
                    <button type="button" class="btn btn-success" onclick="confirmAddVideo(${questionIndex})" id="confirmVideoBtn" disabled>Agregar Video</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('videoModal').classList.add('active');

    // Add event listener for URL input with auto-conversion
    document.getElementById('videoUrl').addEventListener('input', function() {
        let url = this.value.trim();
        
        // Auto-convert to embed format if it's a valid YouTube URL
        if (url && !url.includes('youtube.com/embed/')) {
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
                const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                this.value = embedUrl;
                url = embedUrl;
                showNotification('URL convertida automáticamente al formato embed', 'info');
            }
        }
        
        const videoId = extractYouTubeVideoId(url);
        const confirmBtn = document.getElementById('confirmVideoBtn');
        
        if (videoId) {
            confirmBtn.disabled = false;
        } else {
            confirmBtn.disabled = true;
            document.getElementById('videoPreviewContainer').style.display = 'none';
        }
    });
}

// Preview video
function previewVideo() {
    let url = document.getElementById('videoUrl').value.trim();
    
    // Auto-convert to embed format if needed
    url = convertToYouTubeEmbed(url);
    document.getElementById('videoUrl').value = url;
    
    const videoId = extractYouTubeVideoId(url);
    
    if (!videoId) {
        showNotification('URL de YouTube no válida', 'error');
        return;
    }
    
    const previewContainer = document.getElementById('videoPreviewContainer');
    const previewIframe = document.getElementById('videoPreview');
    
    previewIframe.src = `https://www.youtube.com/embed/${videoId}`;
    previewContainer.style.display = 'block';
    
    showNotification('Vista previa cargada', 'success');
}

// Confirm add video
function confirmAddVideo(questionIndex) {
    let url = document.getElementById('videoUrl').value.trim();
    
    // Auto-convert to embed format if needed
    url = convertToYouTubeEmbed(url);
    
    const videoId = extractYouTubeVideoId(url);
    
    if (!videoId) {
        showNotification('URL de YouTube no válida', 'error');
        return;
    }
    
    const blockKey = `bloque${currentEditingBlock}`;
    const question = testBlocks[blockKey][currentEditingSubject].questions[questionIndex];
    
    if (!question.videos) {
        question.videos = [];
    }
    
    // Check if video already exists
    const existingVideo = question.videos.find(v => v.videoId === videoId);
    if (existingVideo) {
        showNotification('Este video ya está agregado a la pregunta', 'warning');
        return;
    }
    
    const videoData = {
        videoId: videoId,
        url: url,
        title: `Video de YouTube`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`
    };
    
    question.videos.push(videoData);
    loadQuestionsInModal();
    hideVideoModal();
    showNotification('Video agregado correctamente', 'success');
}

// Hide video modal
function hideVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Remove video from question
async function removeVideoFromQuestion(questionIndex, videoIndex) {
    const confirmed = await showDeleteVideoModal();
    
    if (confirmed) {
        const blockKey = `bloque${currentEditingBlock}`;
        const question = testBlocks[blockKey][currentEditingSubject].questions[questionIndex];
        
        if (question.videos && question.videos[videoIndex]) {
            question.videos.splice(videoIndex, 1);
            loadQuestionsInModal();
            showNotification('Video eliminado correctamente', 'success');
        }
    }
}

// Add image to option
async function addImageToOption(questionIndex, optionIndex) {
    const blockKey = `bloque${currentEditingBlock}`;
    const option = testBlocks[blockKey][currentEditingSubject].questions[questionIndex].options[optionIndex];
    
    // Check if option already has an image
    if (option.images && option.images.length > 0) {
        showNotification('Solo se permite una imagen por opción', 'warning');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;

    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('La imagen no puede ser mayor a 5MB', 'error');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Solo se permiten archivos de imagen', 'error');
            return;
        }

        try {
            showLoadingOverlay();
            const imageData = await uploadImageToImgBB(file);
            
            if (!option.images) {
                option.images = [];
            }
            
            // Replace existing image or add new one (max 1)
            option.images = [imageData];
            loadQuestionsInModal();
            showNotification('Imagen agregada correctamente', 'success');
            
        } catch (error) {
            showNotification('Error al subir imagen: ' + error.message, 'error');
        } finally {
            hideLoadingOverlay();
        }
    };

    input.click();
}

// Show delete image confirmation modal
function showDeleteImageModal(message) {
    return new Promise((resolve) => {
        const modalHTML = `
            <div class="panel-modal-overlay" id="deleteImageModal">
                <div class="panel-modal">
                    <div class="panel-modal-body">
                        <i class="bi bi-exclamation-triangle panel-modal-icon" style="color: #dc3545;"></i>
                        <p class="panel-modal-message">${message}</p>
                        <div class="panel-modal-footer">
                            <button class="panel-modal-btn panel-btn-cancel" id="deleteImageCancel">
                                <i class="bi bi-x-lg"></i>
                                Cancelar
                            </button>
                            <button class="panel-modal-btn panel-btn-confirm" id="deleteImageConfirm">
                                <i class="bi bi-trash"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        const overlay = document.getElementById('deleteImageModal');
        const confirmBtn = document.getElementById('deleteImageConfirm');
        const cancelBtn = document.getElementById('deleteImageCancel');
        
        setTimeout(() => overlay.classList.add('active'), 10);

        confirmBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(true);
        });

        cancelBtn.addEventListener('click', () => {
            closeModal(overlay);
            resolve(false);
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay);
                resolve(false);
            }
        });

        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                closeModal(overlay);
                resolve(false);
                document.removeEventListener('keydown', handleEsc);
            }
        };
        document.addEventListener('keydown', handleEsc);
    });
}

// Remove image from question
async function removeImageFromQuestion(questionIndex, imageIndex) {
    const confirmed = await showDeleteImageModal('¿Estás seguro de que deseas eliminar esta imagen de la pregunta?');
    
    if (confirmed) {
        const blockKey = `bloque${currentEditingBlock}`;
        const question = testBlocks[blockKey][currentEditingSubject].questions[questionIndex];
        
        if (question.images && question.images[imageIndex]) {
            question.images.splice(imageIndex, 1);
            loadQuestionsInModal();
            showNotification('Imagen eliminada correctamente', 'success');
        }
    }
}

// Remove image from option
async function removeImageFromOption(questionIndex, optionIndex, imageIndex) {
    const confirmed = await showDeleteImageModal('¿Estás seguro de que deseas eliminar esta imagen de la opción?');
    
    if (confirmed) {
        const blockKey = `bloque${currentEditingBlock}`;
        const option = testBlocks[blockKey][currentEditingSubject].questions[questionIndex].options[optionIndex];
        
        if (option.images && option.images[imageIndex]) {
            option.images.splice(imageIndex, 1);
            loadQuestionsInModal();
            showNotification('Imagen eliminada correctamente', 'success');
        }
    }
}

// Show image modal
function showImageModal(imageUrl) {
    // Remove existing modal if any
    const existingModal = document.getElementById('imageModal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
        <div class="image-modal" id="imageModal">
            <button class="image-modal-close" onclick="hideImageModal()">
                <i class="bi bi-x"></i>
            </button>
            <img src="${imageUrl}" alt="Imagen ampliada">
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Show modal with animation
    setTimeout(() => {
        document.getElementById('imageModal').classList.add('active');
    }, 10);

    // Close modal on overlay click
    document.getElementById('imageModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideImageModal();
        }
    });

    // Close modal on ESC key
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            hideImageModal();
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

// Hide image modal
function hideImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Make functions globally accessible
window.editSubject = editSubject;
window.addNewQuestion = addNewQuestion;
window.updateQuestionText = updateQuestionText;
window.updateReadingTitle = updateReadingTitle;
window.toggleContextQuestion = toggleContextQuestion;
window.changeQuestionType = changeQuestionType;
window.deleteQuestion = deleteQuestion;
window.updateOptionText = updateOptionText;
window.setCorrectOption = setCorrectOption;
window.addOption = addOption;
window.deleteOption = deleteOption;
window.addImageToQuestion = addImageToQuestion;
window.addImageToOption = addImageToOption;
window.removeImageFromQuestion = removeImageFromQuestion;
window.removeImageFromOption = removeImageFromOption;
window.showImageModal = showImageModal;
window.hideImageModal = hideImageModal;
window.showDeleteImageModal = showDeleteImageModal;
window.addVideoToQuestion = addVideoToQuestion;
window.removeVideoFromQuestion = removeVideoFromQuestion;
window.previewVideo = previewVideo;
window.confirmAddVideo = confirmAddVideo;
window.hideVideoModal = hideVideoModal;
window.convertToYouTubeEmbed = convertToYouTubeEmbed;
window.showDeleteQuestionModal = showDeleteQuestionModal;
window.showDeleteVideoModal = showDeleteVideoModal;