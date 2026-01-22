// Bloques Editor JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Initialize
    checkAuthentication();
    initializePanelModal();
    setupEventListeners();
    loadTestData();

    // Inicializar foto de perfil y menú desplegable
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

// Show LaTeX help modal
function showLatexHelp() {
    const modalHTML = `
        <div class="modal-overlay" id="latexHelpModal">
            <div class="modal modal-lg">
                <div class="modal-header" style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);">
                    <h3>Ayuda - Fórmulas Matemáticas con LaTeX</h3>
                    <button class="close-btn" onclick="hideLatexHelp()">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
                    <div class="latex-help-content">
                        <h4>¿Cómo usar fórmulas matemáticas?</h4>
                        <p>Puedes escribir fórmulas matemáticas usando LaTeX en cualquier texto (preguntas, opciones, párrafos).</p>
                        
                        <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; margin: 15px 0;">
                            <strong>💡 Nota Importante:</strong> Solo necesitas escribir las <strong>fórmulas matemáticas</strong>, 
                            no el documento completo de LaTeX. El sistema limpia automáticamente comandos como 
                            <code>\\documentclass</code>, <code>\\usepackage</code>, <code>\\begin{document}</code>, etc.
                        </div>
                        
                        <h4>Sintaxis Básica:</h4>
                        <ul>
                            <li><strong>Fórmula en línea:</strong> Usa <code>$formula$</code> o <code>\\(formula\\)</code></li>
                            <li><strong>Fórmula centrada:</strong> Usa <code>$$formula$$</code> o <code>\\[formula\\]</code></li>
                        </ul>

                        <h4>Ejemplos Comunes:</h4>
                        <div class="latex-examples">
                            <div class="latex-example-item">
                                <strong>Fracciones:</strong>
                                <div class="latex-example-code">$\\frac{a}{b}$</div>
                                <div class="latex-example-result">Resultado: $\\frac{a}{b}$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Exponentes:</strong>
                                <div class="latex-example-code">$x^2$ o $a^{n+1}$</div>
                                <div class="latex-example-result">Resultado: $x^2$ o $a^{n+1}$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Subíndices:</strong>
                                <div class="latex-example-code">$x_1$ o $a_{n-1}$</div>
                                <div class="latex-example-result">Resultado: $x_1$ o $a_{n-1}$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Raíces:</strong>
                                <div class="latex-example-code">$\\sqrt{x}$ o $\\sqrt[3]{8}$</div>
                                <div class="latex-example-result">Resultado: $\\sqrt{x}$ o $\\sqrt[3]{8}$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Ecuaciones:</strong>
                                <div class="latex-example-code">$$ax^2 + bx + c = 0$$</div>
                                <div class="latex-example-result">Resultado: $$ax^2 + bx + c = 0$$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Símbolos griegos:</strong>
                                <div class="latex-example-code">$\\alpha$, $\\beta$, $\\pi$, $\\theta$</div>
                                <div class="latex-example-result">Resultado: $\\alpha$, $\\beta$, $\\pi$, $\\theta$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Operadores:</strong>
                                <div class="latex-example-code">$\\times$, $\\div$, $\\pm$, $\\leq$, $\\geq$</div>
                                <div class="latex-example-result">Resultado: $\\times$, $\\div$, $\\pm$, $\\leq$, $\\geq$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Sumatorias e integrales:</strong>
                                <div class="latex-example-code">$$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$</div>
                                <div class="latex-example-result">Resultado: $$\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Matrices:</strong>
                                <div class="latex-example-code">$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$</div>
                                <div class="latex-example-result">Resultado: $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$</div>
                            </div>

                            <div class="latex-example-item">
                                <strong>Fracciones complejas:</strong>
                                <div class="latex-example-code">$$\\frac{\\dfrac{3}{4} + \\dfrac{5}{6}}{\\dfrac{7}{8} - \\dfrac{1}{2}}$$</div>
                                <div class="latex-example-result">Resultado: $$\\frac{\\dfrac{3}{4} + \\dfrac{5}{6}}{\\dfrac{7}{8} - \\dfrac{1}{2}}$$</div>
                            </div>
                        </div>

                        <h4>Consejos:</h4>
                        <ul>
                            <li>Usa <code>$</code> para fórmulas pequeñas dentro del texto</li>
                            <li>Usa <code>$$</code> para fórmulas grandes y centradas</li>
                            <li>Las fórmulas se renderizan automáticamente al guardar</li>
                            <li>Puedes combinar texto normal con fórmulas: "La ecuación $x^2 + y^2 = r^2$ representa un círculo"</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="hideLatexHelp()">Entendido</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('latexHelpModal');
    setTimeout(() => modal.classList.add('active'), 10);

    // Renderizar las fórmulas de ejemplo
    setTimeout(() => {
        const modalBody = modal.querySelector('.modal-body');
        renderMathInElement(modalBody);
    }, 100);
}

// Hide LaTeX help modal
function hideLatexHelp() {
    const modal = document.getElementById('latexHelpModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Make function global
window.hideLatexHelp = hideLatexHelp;

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

    // Check which blocks are enabled
    const hasBlock1 = currentTest.bloque1 && currentTest.bloque1.horaInicio && currentTest.bloque1.horaFin;
    const hasBlock2 = currentTest.bloque2 && currentTest.bloque2.horaInicio && currentTest.bloque2.horaFin;

    // Update block times and visibility
    const block1Card = document.getElementById('block1Card');
    const block2Card = document.getElementById('block2Card');

    if (hasBlock1) {
        block1Card.style.display = 'block';
        document.getElementById('block1Time').textContent =
            `${currentTest.bloque1.horaInicio} - ${currentTest.bloque1.horaFin}`;
    } else {
        block1Card.style.display = 'none';
    }

    if (hasBlock2) {
        block2Card.style.display = 'block';
        document.getElementById('block2Time').textContent =
            `${currentTest.bloque2.horaInicio} - ${currentTest.bloque2.horaFin}`;
    } else {
        block2Card.style.display = 'none';
    }
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
async function editSubject(subject, block) {
    currentEditingSubject = subject;
    currentEditingBlock = block;

    const config = subjectConfig[subject];
    const blockKey = `bloque${block}`;

    // Update modal header
    document.getElementById('modalSubjectName').textContent = config.name;
    document.getElementById('modalBlockInfo').textContent = `Bloque ${block}`;

    // Update modal header color based on subject
    const modalHeader = document.querySelector('.modal-header');
    modalHeader.className = `modal-header ${subject}`;

    // Update subject icon
    const iconElement = document.getElementById('modalSubjectIcon');
    iconElement.className = `subject-icon-large ${subject}`;
    iconElement.innerHTML = `<i class="${config.icon}"></i>`;

    // Add LaTeX guide button for mathematics
    const panelHeaderActions = document.querySelector('.panel-right .panel-header-actions');
    const existingLatexBtn = document.getElementById('latexGuideBtn');
    if (existingLatexBtn) {
        existingLatexBtn.remove();
    }
    
    if (subject === 'matematicas') {
        const latexBtn = document.createElement('button');
        latexBtn.id = 'latexGuideBtn';
        latexBtn.className = 'btn btn-sm btn-latex-guide';
        latexBtn.innerHTML = '<i class="bi bi-book"></i> Guía LaTeX';
        latexBtn.onclick = showLatexGuide;
        panelHeaderActions.insertBefore(latexBtn, panelHeaderActions.firstChild);
    }

    // Load questions
    loadQuestionsInModal();

    // Load question bank
    await loadQuestionBank();

    // Setup bank search events
    setupBankSearchEvents();

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
                <p>Agrega preguntas o bloques de lectura para esta materia</p>
            </div>
        `;
        // Refresh bank when questions list is empty
        refreshBankQuestions();
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

    // Renderizar fórmulas LaTeX después de cargar las preguntas
    setTimeout(() => renderMathInElement(container), 100);
    
    // Refresh bank questions to update "already added" status
    refreshBankQuestions();
}

// Clean LaTeX document code (remove document structure, keep only math)
function cleanLatexCode(text) {
    if (!text) return text;

    // Si contiene comandos de documento LaTeX, extraer solo el contenido matemático
    if (text.includes('\\documentclass') || text.includes('\\begin{document}')) {
        // Extraer contenido entre \begin{document} y \end{document}
        const docMatch = text.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
        if (docMatch) {
            text = docMatch[1];
        }

        // Remover comandos de paquetes y configuración
        text = text.replace(/\\documentclass\{[^}]*\}/g, '');
        text = text.replace(/\\usepackage(\[[^\]]*\])?\{[^}]*\}/g, '');
        text = text.replace(/\\begin\{document\}/g, '');
        text = text.replace(/\\end\{document\}/g, '');

        // Limpiar espacios extra
        text = text.trim();
    }

    return text;
}

// Render LaTeX formulas with MathJax
function renderMathInElement(element) {
    if (window.MathJax && window.MathJax.typesetPromise) {
        try {
            // Limpiar código LaTeX antes de renderizar
            const textNodes = getTextNodes(element);
            textNodes.forEach(node => {
                if (node.nodeValue) {
                    node.nodeValue = cleanLatexCode(node.nodeValue);
                }
            });

            // Typeset the element with MathJax
            window.MathJax.typesetPromise([element]).catch((err) => {
                console.log('MathJax typeset error:', err);
            });
        } catch (e) {
            console.log('MathJax not ready yet:', e);
        }
    } else {
        // Retry after a short delay if MathJax is not ready
        setTimeout(() => renderMathInElement(element), 100);
    }
}

// Get all text nodes in an element
function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
    );

    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }

    return textNodes;
}

// Create question element
function createQuestionElement(question, index, questionNumber) {
    const div = document.createElement('div');
    div.dataset.questionIndex = index;

    // Diferentes estilos según el tipo
    if (question.type === 'reading') {
        // Texto de lectura (título + párrafo juntos)
        div.className = `question-item reading-item ${currentEditingSubject}`;
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
                           value="${(question.title || '').replace(/"/g, '&quot;')}"
                           onchange="updateReadingTitle(${index}, this.value)">
                </div>
                <div class="reading-paragraph-section">
                    <label class="reading-label">
                        <i class="bi bi-text-paragraph"></i>
                        Texto:
                    </label>
                    <div class="question-text-container">
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
                        ${createQuestionMediaHTML(question.images || [], question.videos || [], index)}
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
        div.className = `question-item ${currentEditingSubject}`;
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
            ${createSaber11SelectorsHTML(question, index)}
            <div class="question-content">
                <div class="question-text-container">
                    ${createQuestionMediaHTML(question.images || [], question.videos || [], index)}
                    <label class="question-label">
                        <i class="bi bi-question-circle"></i>
                        Pregunta:
                    </label>
                    <textarea class="question-text" id="questionText_${index}" placeholder="Escribe tu pregunta aquí... Usa $formula$ para matemáticas" 
                              oninput="updateLatexPreviewRealtime(${index}, 'question', this.value)"
                              onchange="updateQuestionText(${index}, this.value)">${question.text || ''}</textarea>
                    <div class="latex-controls">
                        <button class="btn btn-sm btn-latex-preview" onclick="toggleLatexPreview(${index}, 'question')">
                            <i class="bi bi-eye"></i>
                            Vista Previa Fórmula
                        </button>
                    </div>
                    <div class="latex-preview-container" id="latexPreview_question_${index}" style="display: none;">
                        <div class="latex-preview-header">
                            <i class="bi bi-calculator"></i>
                            <span>Vista Previa:</span>
                        </div>
                        <div class="latex-preview-content" id="latexPreviewContent_question_${index}"></div>
                    </div>
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

// Create options HTML - Professional Design with Textarea
function createOptionsHTML(options, questionIndex) {
    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    let html = '<div class="options-container-modern">';

    options.forEach((option, optionIndex) => {
        const letter = optionLetters[optionIndex] || (optionIndex + 1);
        const hasImage = option.images && option.images.length > 0;
        
        html += `
            <div class="option-card-modern ${option.isCorrect ? 'correct-option-modern' : ''}" data-option-index="${optionIndex}">
                <div class="option-header-modern">
                    <div class="option-selector-modern">
                        <input type="radio" 
                               name="correct_${questionIndex}" 
                               id="radio_${questionIndex}_${optionIndex}"
                               ${option.isCorrect ? 'checked' : ''} 
                               onchange="setCorrectOption(${questionIndex}, ${optionIndex})"
                               class="option-radio-modern">
                        <label for="radio_${questionIndex}_${optionIndex}" class="option-radio-label">
                            <span class="radio-custom"></span>
                            <span class="option-letter-modern">${letter}</span>
                        </label>
                    </div>
                    <div class="option-actions-modern">
                        ${hasImage ? `
                            <button class="btn-icon-modern btn-danger-modern" 
                                    onclick="removeImageFromOption(${questionIndex}, ${optionIndex}, 0)" 
                                    title="Eliminar imagen">
                                <i class="bi bi-trash"></i>
                            </button>
                        ` : `
                            <button class="btn-icon-modern btn-info-modern" 
                                    onclick="addImageToOption(${questionIndex}, ${optionIndex})" 
                                    title="Agregar imagen">
                                <i class="bi bi-image"></i>
                            </button>
                        `}
                        ${options.length > 2 ? `
                            <button class="btn-icon-modern btn-delete-modern" 
                                    onclick="deleteOption(${questionIndex}, ${optionIndex})" 
                                    title="Eliminar opción">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="option-content-modern">
                    ${hasImage ? createOptionImagesHTML(option.images || [], questionIndex, optionIndex) : ''}
                    <textarea class="option-textarea-modern" id="optionText_${questionIndex}_${optionIndex}"
                              placeholder="Escribe la opción ${letter} aquí... Usa $formula$ para matemáticas"
                              oninput="updateLatexPreviewRealtime(${questionIndex}, 'option', this.value, ${optionIndex})"
                              onchange="updateOptionText(${questionIndex}, ${optionIndex}, this.value)"
                              rows="2">${option.text || ''}</textarea>
                    <button class="btn-latex-preview-small" onclick="toggleLatexPreview(${questionIndex}, 'option', ${optionIndex})" title="Vista previa fórmula">
                        <i class="bi bi-eye"></i>
                    </button>
                    <div class="latex-preview-container-small" id="latexPreview_option_${questionIndex}_${optionIndex}" style="display: none;">
                        <div class="latex-preview-content" id="latexPreviewContent_option_${questionIndex}_${optionIndex}"></div>
                    </div>
                </div>
            </div>
        `;
    });

    html += `
        <button class="btn-add-option-modern" onclick="addOption(${questionIndex})">
            <i class="bi bi-plus-circle"></i>
            <span>Agregar Opción</span>
        </button>
    </div>`;

    return html;
}

// ========== SABER 11 STRUCTURE FUNCTIONS ==========

// Variables globales para el modal Saber 11
let currentSaber11QuestionIndex = null;
let tempSaber11Data = null;

// Create Saber 11 selectors HTML with button to open modal
function createSaber11SelectorsHTML(question, index) {
    const saber11 = question.saber11 || {};
    const estructura = window.SABER11_ESTRUCTURA ? window.SABER11_ESTRUCTURA[currentEditingSubject] : null;

    if (!estructura) {
        return '<div class="saber11-warning"><i class="bi bi-exclamation-triangle"></i> Estructura Saber 11 no disponible para esta materia</div>';
    }

    // Contar elementos seleccionados
    const componentesCount = (saber11.componentes || []).length;
    const competenciasCount = (saber11.competencias || []).length;
    const temasCount = (saber11.temas || []).length;
    
    let afirmacionesCount = 0;
    if (saber11.afirmaciones) {
        Object.values(saber11.afirmaciones).forEach(arr => {
            afirmacionesCount += arr.length;
        });
    }

    const hasClassification = componentesCount > 0 || competenciasCount > 0 || afirmacionesCount > 0 || temasCount > 0;

    return `
        <div class="saber11-compact-selector">
            <button class="btn-saber11-open ${hasClassification ? 'has-data' : ''}" onclick="openSaber11Modal(${index})">
                <div class="saber11-btn-icon">
                    <i class="bi bi-mortarboard-fill"></i>
                </div>
                <div class="saber11-btn-content">
                    <span class="saber11-btn-title">Clasificación Saber 11</span>
                    ${hasClassification ? `
                        <span class="saber11-btn-summary">
                            ${componentesCount > 0 ? `${componentesCount} componente${componentesCount !== 1 ? 's' : ''}` : ''}
                            ${competenciasCount > 0 ? `${componentesCount > 0 ? ' • ' : ''}${competenciasCount} competencia${competenciasCount !== 1 ? 's' : ''}` : ''}
                            ${afirmacionesCount > 0 ? `${(componentesCount > 0 || competenciasCount > 0) ? ' • ' : ''}${afirmacionesCount} afirmación${afirmacionesCount !== 1 ? 'es' : ''}` : ''}
                            ${temasCount > 0 ? `${(componentesCount > 0 || competenciasCount > 0 || afirmacionesCount > 0) ? ' • ' : ''}${temasCount} tema${temasCount !== 1 ? 's' : ''}` : ''}
                        </span>
                    ` : '<span class="saber11-btn-empty">Sin clasificación</span>'}
                </div>
                <i class="bi bi-chevron-right saber11-btn-arrow"></i>
            </button>
        </div>
    `;
}

// Open Saber 11 Modal
function openSaber11Modal(index) {
    currentSaber11QuestionIndex = index;
    const blockKey = `bloque${currentEditingBlock}`;
    const question = testBlocks[blockKey][currentEditingSubject].questions[index];
    
    // Clonar datos actuales
    tempSaber11Data = JSON.parse(JSON.stringify(question.saber11 || {}));
    
    // Cargar contenido del modal
    loadSaber11ModalContent();
    
    // Mostrar modal
    document.getElementById('saber11Modal').classList.add('active');
}

// Load Saber 11 Modal Content
function loadSaber11ModalContent() {
    const estructura = window.SABER11_ESTRUCTURA ? window.SABER11_ESTRUCTURA[currentEditingSubject] : null;
    
    if (!estructura) {
        document.getElementById('saber11ModalContent').innerHTML = `
            <div class="saber11-error">
                <i class="bi bi-exclamation-triangle"></i>
                <p>Estructura Saber 11 no disponible para esta materia</p>
            </div>
        `;
        return;
    }

    const config = subjectConfig[currentEditingSubject];
    document.getElementById('saber11ModalSubject').textContent = `Pregunta ${currentSaber11QuestionIndex + 1} - ${config.name}`;

    const componentes = estructura.componentes || [];
    const competencias = estructura.competencias || [];

    // Obtener todos los temas disponibles
    let allTemas = [];
    competencias.forEach(comp => {
        if (comp.afirmaciones) {
            comp.afirmaciones.forEach(af => {
                if (af.temas) {
                    af.temas.forEach(t => {
                        if (!allTemas.find(existing => existing.nombre === t.nombre && existing.categoria === t.categoria)) {
                            allTemas.push(t);
                        }
                    });
                }
            });
        }
    });

    // Agrupar temas por categoría
    const temasPorCategoria = {};
    allTemas.forEach(t => {
        if (!temasPorCategoria[t.categoria]) {
            temasPorCategoria[t.categoria] = [];
        }
        temasPorCategoria[t.categoria].push(t);
    });

    const selectedComponentes = tempSaber11Data.componentes || [];
    const selectedCompetencias = tempSaber11Data.competencias || [];
    const selectedTemas = tempSaber11Data.temas || [];
    const afirmacionesSeleccionadas = tempSaber11Data.afirmaciones || {};

    const html = `
        <div class="saber11-modal-section">
            <div class="saber11-section-header">
                <i class="bi bi-layers"></i>
                <h4>Componentes</h4>
                <span class="required-badge">Obligatorio</span>
            </div>
            <div class="saber11-checkboxes-grid">
                ${componentes.map(c => `
                    <label class="saber11-checkbox-card ${selectedComponentes.includes(c) ? 'selected' : ''}">
                        <input type="checkbox" 
                               value="${c}" 
                               ${selectedComponentes.includes(c) ? 'checked' : ''}
                               onchange="toggleModalComponente('${c}', this.checked)">
                        <span>${c}</span>
                    </label>
                `).join('')}
            </div>
        </div>

        <div class="saber11-modal-section">
            <div class="saber11-section-header">
                <i class="bi bi-lightbulb"></i>
                <h4>Competencias</h4>
                <span class="required-badge">Obligatorio</span>
            </div>
            <div class="saber11-checkboxes-grid">
                ${competencias.map(c => `
                    <label class="saber11-checkbox-card ${selectedCompetencias.includes(c.id) ? 'selected' : ''}">
                        <input type="checkbox" 
                               value="${c.id}" 
                               ${selectedCompetencias.includes(c.id) ? 'checked' : ''}
                               onchange="toggleModalCompetencia('${c.id}', this.checked)">
                        <div class="competencia-card-content">
                            <span class="competencia-nombre">${c.nombre}</span>
                            <span class="competencia-descripcion">${c.descripcion}</span>
                        </div>
                    </label>
                `).join('')}
            </div>
        </div>

        <div class="saber11-modal-section" id="afirmacionesModalSection">
            ${createModalAfirmacionesHTML(selectedCompetencias, competencias, afirmacionesSeleccionadas)}
        </div>

        <div class="saber11-modal-section">
            <div class="saber11-section-header">
                <i class="bi bi-book"></i>
                <h4>Temas Asociados</h4>
                <span class="required-badge">Obligatorio</span>
            </div>
            ${Object.keys(temasPorCategoria).map(categoria => `
                <div class="saber11-categoria-section">
                    <div class="saber11-categoria-header">
                        <i class="bi bi-folder2-open"></i>
                        <span>${categoria}</span>
                    </div>
                    <div class="saber11-temas-grid">
                        ${temasPorCategoria[categoria].map(t => {
                            const temaValue = `${t.categoria}|${t.nombre}`;
                            const isSelected = selectedTemas.includes(temaValue);
                            return `
                                <label class="saber11-tema-card ${isSelected ? 'selected' : ''}">
                                    <input type="checkbox" 
                                           value="${temaValue}" 
                                           ${isSelected ? 'checked' : ''}
                                           onchange="toggleModalTema('${temaValue}', this.checked)">
                                    <div class="tema-card-content">
                                        <span class="tema-nombre">${t.nombre}</span>
                                        ${t.tip ? `<span class="tema-tip"><i class="bi bi-lightbulb-fill"></i> ${t.tip}</span>` : ''}
                                    </div>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    document.getElementById('saber11ModalContent').innerHTML = html;
}

// Create modal afirmaciones HTML
function createModalAfirmacionesHTML(selectedCompetencias, competencias, afirmacionesSeleccionadas) {
    if (!selectedCompetencias || selectedCompetencias.length === 0) {
        return `
            <div class="saber11-section-header">
                <i class="bi bi-check2-square"></i>
                <h4>Afirmaciones</h4>
                <span class="required-badge">Obligatorio</span>
            </div>
            <div class="saber11-empty-message">
                <i class="bi bi-info-circle"></i>
                <p>Selecciona al menos una competencia para ver las afirmaciones disponibles</p>
            </div>
        `;
    }

    let html = `
        <div class="saber11-section-header">
            <i class="bi bi-check2-square"></i>
            <h4>Afirmaciones</h4>
            <span class="required-badge">Obligatorio</span>
        </div>
    `;

    selectedCompetencias.forEach(compId => {
        const competencia = competencias.find(c => c.id === compId);
        if (!competencia) return;

        const afirmaciones = competencia.afirmaciones || [];
        const selectedAfirmaciones = afirmacionesSeleccionadas[compId] || [];

        html += `
            <div class="saber11-competencia-afirmaciones">
                <div class="competencia-afirmaciones-header">
                    <i class="bi bi-lightbulb-fill"></i>
                    <span>${competencia.nombre}</span>
                </div>
                <div class="saber11-afirmaciones-list">
                    ${afirmaciones.map(a => `
                        <label class="saber11-afirmacion-card ${selectedAfirmaciones.includes(a.id) ? 'selected' : ''}">
                            <input type="checkbox" 
                                   value="${a.id}" 
                                   ${selectedAfirmaciones.includes(a.id) ? 'checked' : ''}
                                   onchange="toggleModalAfirmacion('${compId}', '${a.id}', this.checked)">
                            <span>${a.descripcion}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    });

    return html;
}

// Toggle functions for modal
function toggleModalComponente(componenteId, isChecked) {
    if (!tempSaber11Data.componentes) {
        tempSaber11Data.componentes = [];
    }

    if (isChecked) {
        if (!tempSaber11Data.componentes.includes(componenteId)) {
            tempSaber11Data.componentes.push(componenteId);
        }
    } else {
        const idx = tempSaber11Data.componentes.indexOf(componenteId);
        if (idx > -1) {
            tempSaber11Data.componentes.splice(idx, 1);
        }
    }
}

function toggleModalCompetencia(competenciaId, isChecked) {
    if (!tempSaber11Data.competencias) {
        tempSaber11Data.competencias = [];
    }

    if (isChecked) {
        if (!tempSaber11Data.competencias.includes(competenciaId)) {
            tempSaber11Data.competencias.push(competenciaId);
        }
    } else {
        const idx = tempSaber11Data.competencias.indexOf(competenciaId);
        if (idx > -1) {
            tempSaber11Data.competencias.splice(idx, 1);
        }
        // Limpiar afirmaciones de esta competencia
        if (tempSaber11Data.afirmaciones) {
            delete tempSaber11Data.afirmaciones[competenciaId];
        }
    }

    // Recargar sección de afirmaciones
    const estructura = window.SABER11_ESTRUCTURA[currentEditingSubject];
    const competencias = estructura.competencias || [];
    const afirmacionesSection = document.getElementById('afirmacionesModalSection');
    afirmacionesSection.innerHTML = createModalAfirmacionesHTML(
        tempSaber11Data.competencias || [],
        competencias,
        tempSaber11Data.afirmaciones || {}
    );
}

function toggleModalAfirmacion(competenciaId, afirmacionId, isChecked) {
    if (!tempSaber11Data.afirmaciones) {
        tempSaber11Data.afirmaciones = {};
    }

    if (!tempSaber11Data.afirmaciones[competenciaId]) {
        tempSaber11Data.afirmaciones[competenciaId] = [];
    }

    if (isChecked) {
        if (!tempSaber11Data.afirmaciones[competenciaId].includes(afirmacionId)) {
            tempSaber11Data.afirmaciones[competenciaId].push(afirmacionId);
        }
    } else {
        const idx = tempSaber11Data.afirmaciones[competenciaId].indexOf(afirmacionId);
        if (idx > -1) {
            tempSaber11Data.afirmaciones[competenciaId].splice(idx, 1);
        }
    }
}

function toggleModalTema(temaValue, isChecked) {
    if (!tempSaber11Data.temas) {
        tempSaber11Data.temas = [];
    }

    if (isChecked) {
        if (!tempSaber11Data.temas.includes(temaValue)) {
            tempSaber11Data.temas.push(temaValue);
        }
    } else {
        const idx = tempSaber11Data.temas.indexOf(temaValue);
        if (idx > -1) {
            tempSaber11Data.temas.splice(idx, 1);
        }
    }
}

// Save Saber 11 classification
function saveSaber11Classification() {
    if (currentSaber11QuestionIndex === null) return;

    // Validar que se haya seleccionado al menos un elemento de cada categoría
    const componentes = tempSaber11Data.componentes || [];
    const competencias = tempSaber11Data.competencias || [];
    const temas = tempSaber11Data.temas || [];
    
    // Contar afirmaciones totales
    let totalAfirmaciones = 0;
    if (tempSaber11Data.afirmaciones) {
        Object.values(tempSaber11Data.afirmaciones).forEach(arr => {
            totalAfirmaciones += arr.length;
        });
    }

    // Validaciones
    const errores = [];
    
    if (componentes.length === 0) {
        errores.push('Debes seleccionar al menos un <strong>Componente</strong>');
    }
    
    if (competencias.length === 0) {
        errores.push('Debes seleccionar al menos una <strong>Competencia</strong>');
    }
    
    if (totalAfirmaciones === 0) {
        errores.push('Debes seleccionar al menos una <strong>Afirmación</strong>');
    }
    
    if (temas.length === 0) {
        errores.push('Debes seleccionar al menos un <strong>Tema Asociado</strong>');
    }

    // Si hay errores, mostrar notificación y no guardar
    if (errores.length > 0) {
        showValidationModal(errores);
        return;
    }

    // Si todo está bien, guardar
    const blockKey = `bloque${currentEditingBlock}`;
    const question = testBlocks[blockKey][currentEditingSubject].questions[currentSaber11QuestionIndex];
    
    question.saber11 = JSON.parse(JSON.stringify(tempSaber11Data));
    
    closeSaber11Modal();
    loadQuestionsInModal();
    
    showNotification('Clasificación Saber 11 guardada correctamente', 'success');
}

// Show validation modal
function showValidationModal(errores) {
    const modalHTML = `
        <div class="modal-overlay validation-modal-overlay" id="validationModalOverlay">
            <div class="modal validation-modal">
                <div class="modal-header validation-modal-header">
                    <div class="validation-icon-container">
                        <i class="bi bi-exclamation-triangle-fill"></i>
                    </div>
                    <h3>Clasificación Incompleta</h3>
                    <button class="close-btn" onclick="closeValidationModal()">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="modal-body validation-modal-body">
                    <p class="validation-message">Para guardar la clasificación Saber 11, debes completar todos los campos obligatorios:</p>
                    <ul class="validation-errors-list">
                        ${errores.map(error => `<li><i class="bi bi-x-circle-fill"></i> ${error}</li>`).join('')}
                    </ul>
                    <div class="validation-help">
                        <i class="bi bi-info-circle-fill"></i>
                        <span>Selecciona al menos un elemento de cada categoría para continuar.</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="closeValidationModal()">
                        <i class="bi bi-check-lg"></i>
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('validationModalOverlay');
    setTimeout(() => modal.classList.add('active'), 10);
}

// Close validation modal
function closeValidationModal() {
    const modal = document.getElementById('validationModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Make function global
window.closeValidationModal = closeValidationModal;

// Close Saber 11 Modal
function closeSaber11Modal() {
    document.getElementById('saber11Modal').classList.remove('active');
    currentSaber11QuestionIndex = null;
    tempSaber11Data = null;
}

// Setup Saber 11 Modal event listeners
document.addEventListener('DOMContentLoaded', function() {
    const closeSaber11Btn = document.getElementById('closeSaber11Modal');
    const cancelSaber11Btn = document.getElementById('cancelSaber11');
    const saveSaber11Btn = document.getElementById('saveSaber11');
    const saber11Modal = document.getElementById('saber11Modal');

    if (closeSaber11Btn) {
        closeSaber11Btn.addEventListener('click', closeSaber11Modal);
    }

    if (cancelSaber11Btn) {
        cancelSaber11Btn.addEventListener('click', closeSaber11Modal);
    }

    if (saveSaber11Btn) {
        saveSaber11Btn.addEventListener('click', saveSaber11Classification);
    }

    if (saber11Modal) {
        saber11Modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeSaber11Modal();
            }
        });
    }
});

// Make functions global
window.openSaber11Modal = openSaber11Modal;
window.toggleModalComponente = toggleModalComponente;
window.toggleModalCompetencia = toggleModalCompetencia;
window.toggleModalAfirmacion = toggleModalAfirmacion;
window.toggleModalTema = toggleModalTema;

// Get tip for tema
function getTipForTema(temaValue, allTemas) {
    if (!temaValue) return '';
    const [categoria, nombre] = temaValue.split('|');
    const tema = allTemas.find(t => t.categoria === categoria && t.nombre === nombre);
    return tema ? tema.tip : '';
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
                            <h4>Bloque de Lectura</h4>
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
                ],
                // Estructura Saber 11 - Selección múltiple en todo
                saber11: {
                    componentes: [],       // Array de componentes seleccionados
                    competencias: [],      // Array de IDs de competencias seleccionadas
                    afirmaciones: {},      // Objeto: { competenciaId: [array de afirmacionIds] }
                    temas: []              // Array de temas seleccionados: ["categoria|nombre", ...]
                }
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
        
        // Refresh bank questions to update "already added" status
        refreshBankQuestions();
        
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
    
    // Recargar la vista para actualizar los estilos visuales
    loadQuestionsInModal();
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
async function saveSubjectData() {
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

            // Validar clasificación Saber 11
            const saber11 = question.saber11 || {};
            const componentes = saber11.componentes || [];
            const competencias = saber11.competencias || [];
            const temas = saber11.temas || [];
            
            let totalAfirmaciones = 0;
            if (saber11.afirmaciones) {
                Object.values(saber11.afirmaciones).forEach(arr => {
                    totalAfirmaciones += arr.length;
                });
            }
            
            if (componentes.length === 0 || competencias.length === 0 || 
                totalAfirmaciones === 0 || temas.length === 0) {
                showNotification(`La pregunta ${questionNumber} no tiene clasificación Saber 11 completa. Debes completar: Componente, Competencia, Afirmación y Tema.`, 'error');
                return;
            }

            questionNumber++;
        }
    }

    // Save questions to bank
    try {
        showLoadingOverlay();
        await saveQuestionsToBank();
        hideLoadingOverlay();
    } catch (error) {
        console.error('Error saving to bank:', error);
        hideLoadingOverlay();
    }

    updateQuestionsCount();
    hideSubjectModal();
    showNotification('Materia guardada correctamente', 'success');
}

// Save all blocks
async function saveAllBlocks() {
    try {
        // Validar que todas las preguntas tengan clasificación Saber 11
        const preguntasSinClasificacion = [];
        
        Object.keys(testBlocks).forEach(bloqueKey => {
            const bloque = testBlocks[bloqueKey];
            Object.keys(bloque).forEach(materia => {
                const questions = bloque[materia].questions || [];
                questions.forEach((question, index) => {
                    // Solo validar preguntas normales, no bloques de lectura
                    if (question.type !== 'reading') {
                        const saber11 = question.saber11 || {};
                        const componentes = saber11.componentes || [];
                        const competencias = saber11.competencias || [];
                        const temas = saber11.temas || [];
                        
                        let totalAfirmaciones = 0;
                        if (saber11.afirmaciones) {
                            Object.values(saber11.afirmaciones).forEach(arr => {
                                totalAfirmaciones += arr.length;
                            });
                        }
                        
                        if (componentes.length === 0 || competencias.length === 0 || 
                            totalAfirmaciones === 0 || temas.length === 0) {
                            preguntasSinClasificacion.push({
                                bloque: bloqueKey,
                                materia: materia,
                                numero: index + 1
                            });
                        }
                    }
                });
            });
        });
        
        // Si hay preguntas sin clasificación, mostrar error
        if (preguntasSinClasificacion.length > 0) {
            const errores = preguntasSinClasificacion.map(p => 
                `<strong>${p.bloque}</strong> - ${p.materia} - Pregunta ${p.numero}`
            );
            
            showValidationModal([
                'Las siguientes preguntas no tienen clasificación Saber 11 completa:',
                ...errores.slice(0, 10), // Mostrar máximo 10
                ...(errores.length > 10 ? [`... y ${errores.length - 10} más`] : [])
            ]);
            return;
        }
        
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

    input.onchange = async function (event) {
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
    document.getElementById('videoUrl').addEventListener('input', function () {
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

    input.onchange = async function (event) {
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
    document.getElementById('imageModal').addEventListener('click', function (e) {
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

// ========== QUESTION BANK FUNCTIONS ==========

let selectedBankQuestions = [];
let currentBankQuestions = []; // Store current bank questions

// Load question bank (now integrated in main modal)
async function loadQuestionBankIntegrated() {
    try {
        // Load questions from bank
        await loadQuestionBank();

        // Setup search events
        setupBankSearchEvents();
    } catch (error) {
        console.error('Error loading question bank:', error);
        showNotification('Error al cargar el banco de preguntas: ' + error.message, 'error');
    }
}

// Setup bank search events
function setupBankSearchEvents() {
    // Search input
    const searchInput = document.getElementById('bankSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterBankQuestions);
    }
}

// Load question bank from Firebase
async function loadQuestionBank() {
    try {
        const db = window.firebaseDB;

        // Get all questions for this subject from the question bank
        const bankRef = db.collection('bancoPreguntas').doc(currentEditingSubject);
        const bankDoc = await bankRef.get();

        let bankQuestions = [];
        if (bankDoc.exists) {
            bankQuestions = bankDoc.data().questions || [];
        }

        // Store questions globally
        currentBankQuestions = bankQuestions;

        // Display questions
        displayBankQuestions(bankQuestions);

    } catch (error) {
        console.error('Error loading question bank:', error);
        throw error;
    }
}

// Refresh bank questions display (updates "already added" status)
function refreshBankQuestions() {
    if (currentBankQuestions && currentBankQuestions.length > 0) {
        displayBankQuestions(currentBankQuestions);
    }
}

// Display bank questions
function displayBankQuestions(questions) {
    const container = document.getElementById('bankQuestionsContainer');
    selectedBankQuestions = [];

    if (!questions || questions.length === 0) {
        container.innerHTML = `
            <div class="bank-empty-state">
                <i class="bi bi-inbox"></i>
                <h4>No hay preguntas en el banco</h4>
                <p>Las preguntas que guardes se agregarán automáticamente al banco para reutilizarlas en otras pruebas</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    questions.forEach((question, index) => {
        const questionElement = createBankQuestionElement(question, index);
        container.appendChild(questionElement);
    });

    // Render LaTeX
    setTimeout(() => renderMathInElement(container), 100);
}

// Create bank question element
function createBankQuestionElement(question, index) {
    const div = document.createElement('div');
    div.className = 'bank-question-item';
    div.dataset.questionIndex = index;

    // Check if question is already added to current test
    const blockKey = `bloque${currentEditingBlock}`;
    const currentQuestions = testBlocks[blockKey][currentEditingSubject].questions;
    const isAlreadyAdded = isQuestionAlreadyInTest(question, currentQuestions);

    // Get Saber 11 info if available
    const saber11Info = createBankSaber11Info(question);

    if (question.type === 'reading') {
        div.innerHTML = `
            <div class="bank-question-header">
                <span class="bank-question-type-badge reading">
                    <i class="bi bi-book-half"></i>
                    Bloque de Lectura
                </span>
                <div class="bank-question-actions">
                    <button class="bank-delete-btn" onclick="event.stopPropagation(); deleteBankQuestion(${index})" title="Eliminar del banco">
                        <i class="bi bi-trash"></i>
                    </button>
                    <span class="bank-add-icon">
                        <i class="${isAlreadyAdded ? 'bi bi-check-circle-fill' : 'bi bi-plus-circle'}"></i>
                    </span>
                </div>
            </div>
            <div class="bank-reading-title">
                <i class="bi bi-type-h1"></i>
                ${question.title || 'Sin título'}
            </div>
            <div class="bank-reading-text">
                ${question.text ? escapeHtml(question.text.substring(0, 200) + (question.text.length > 200 ? '...' : '')) : 'Sin texto'}
            </div>
            ${createBankQuestionMediaPreview(question)}
            ${isAlreadyAdded ? '<div class="bank-already-added-badge"><i class="bi bi-check-circle-fill"></i> Ya agregada</div>' : ''}
        `;
    } else {
        div.innerHTML = `
            <div class="bank-question-header">
                <div class="bank-question-header-left">
                    <span class="bank-question-type-badge multiple">
                        <i class="bi bi-ui-checks"></i>
                        Selección Múltiple
                    </span>
                    ${saber11Info}
                </div>
                <div class="bank-question-actions">
                    <button class="bank-delete-btn" onclick="event.stopPropagation(); deleteBankQuestion(${index})" title="Eliminar del banco">
                        <i class="bi bi-trash"></i>
                    </button>
                    <span class="bank-add-icon">
                        <i class="${isAlreadyAdded ? 'bi bi-check-circle-fill' : 'bi bi-plus-circle'}"></i>
                    </span>
                </div>
            </div>
            <div class="bank-question-text">
                ${escapeHtml(question.text || 'Sin pregunta')}
            </div>
            ${createBankQuestionMediaPreview(question)}
            ${createBankOptionsPreview(question.options || [])}
            ${isAlreadyAdded ? '<div class="bank-already-added-badge"><i class="bi bi-check-circle-fill"></i> Ya agregada</div>' : ''}
        `;
    }

    // Mark as already added if it is
    if (isAlreadyAdded) {
        div.classList.add('already-added');
    }

    // Click on card to add question directly
    div.addEventListener('click', async function (e) {
        // Prevent if already added
        if (div.classList.contains('already-added')) {
            showNotification('Esta pregunta ya está agregada a la prueba', 'warning');
            return;
        }

        // Prevent double-click issues
        if (div.classList.contains('adding')) return;
        
        div.classList.add('adding');
        
        try {
            // Get the question data
            const questionData = currentBankQuestions[index];
            if (!questionData) {
                throw new Error('Pregunta no encontrada');
            }

            // Create a deep copy of the question
            const questionCopy = JSON.parse(JSON.stringify(questionData));

            // Add to current test
            await addBankQuestionToTest(questionCopy);

            // Visual feedback - mark as permanently added
            div.classList.remove('adding');
            div.classList.add('already-added');
            
            // Update icon
            const addIcon = div.querySelector('.bank-add-icon i');
            if (addIcon) {
                addIcon.className = 'bi bi-check-circle-fill';
            }

            // Add badge
            const badge = document.createElement('div');
            badge.className = 'bank-already-added-badge';
            badge.innerHTML = '<i class="bi bi-check-circle-fill"></i> Ya agregada';
            div.appendChild(badge);

            showNotification('Pregunta agregada exitosamente', 'success');

        } catch (error) {
            console.error('Error adding question:', error);
            showNotification('Error al agregar la pregunta: ' + error.message, 'error');
            div.classList.remove('adding');
        }
    });

    return div;
}

// Check if question is already in test
function isQuestionAlreadyInTest(bankQuestion, testQuestions) {
    return testQuestions.some(testQ => {
        // Compare by text and type
        if (testQ.type !== bankQuestion.type) return false;
        
        if (bankQuestion.type === 'reading') {
            return testQ.title === bankQuestion.title && testQ.text === bankQuestion.text;
        } else {
            return testQ.text === bankQuestion.text;
        }
    });
}

// Create Saber 11 info for bank question
function createBankSaber11Info(question) {
    if (!question.saber11) {
        return '';
    }

    const saber11 = question.saber11;
    const componentes = saber11.componentes || [];
    const competencias = saber11.competencias || [];
    const temas = saber11.temas || [];
    
    // Contar afirmaciones
    let totalAfirmaciones = 0;
    if (saber11.afirmaciones) {
        Object.values(saber11.afirmaciones).forEach(arr => {
            totalAfirmaciones += arr.length;
        });
    }

    if (componentes.length === 0 && competencias.length === 0 && totalAfirmaciones === 0 && temas.length === 0) {
        return '';
    }

    // Crear badges para cada categoría
    let badges = '';
    
    if (componentes.length > 0) {
        badges += `
            <span class="bank-saber11-badge componente" title="Componentes: ${componentes.join(', ')}">
                <i class="bi bi-layers-fill"></i>
                ${componentes.length} Comp.
            </span>
        `;
    }
    
    if (competencias.length > 0) {
        badges += `
            <span class="bank-saber11-badge competencia" title="Competencias: ${competencias.join(', ')}">
                <i class="bi bi-star-fill"></i>
                ${competencias.length} Compet.
            </span>
        `;
    }
    
    if (totalAfirmaciones > 0) {
        badges += `
            <span class="bank-saber11-badge afirmacion" title="${totalAfirmaciones} Afirmaciones">
                <i class="bi bi-check2-circle"></i>
                ${totalAfirmaciones} Afirm.
            </span>
        `;
    }
    
    if (temas.length > 0) {
        badges += `
            <span class="bank-saber11-badge tema" title="Temas: ${temas.join(', ')}">
                <i class="bi bi-bookmark-fill"></i>
                ${temas.length} Temas
            </span>
        `;
    }

    return `<div class="bank-saber11-info">${badges}</div>`;
}

// Create bank question media preview
function createBankQuestionMediaPreview(question) {
    if ((!question.images || question.images.length === 0) &&
        (!question.videos || question.videos.length === 0)) {
        return '';
    }

    let html = '<div class="bank-question-media">';

    if (question.images && question.images.length > 0) {
        question.images.slice(0, 2).forEach(image => {
            html += `<img src="${image.url}" alt="Imagen">`;
        });
        if (question.images.length > 2) {
            html += `<span>+${question.images.length - 2} más</span>`;
        }
    }

    if (question.videos && question.videos.length > 0) {
        html += `<span><i class="bi bi-youtube"></i> ${question.videos.length} video(s)</span>`;
    }

    html += '</div>';
    return html;
}

// Create bank options preview
function createBankOptionsPreview(options) {
    if (!options || options.length === 0) return '';

    let html = '<div class="bank-question-options">';

    options.forEach(option => {
        const isCorrect = option.isCorrect;
        html += `
            <div class="bank-option-item ${isCorrect ? 'correct' : ''}">
                ${isCorrect ? '<i class="bi bi-check-circle-fill bank-option-icon"></i>' : ''}
                <span>${escapeHtml(option.text || 'Sin texto')}</span>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

// Toggle bank question selection
function toggleBankQuestionSelection(index) {
    const questionItem = document.querySelector(`.bank-question-item[data-question-index="${index}"]`);
    const checkbox = questionItem.querySelector('input[type="checkbox"]');

    if (checkbox.checked) {
        questionItem.classList.add('selected');
        if (!selectedBankQuestions.includes(index)) {
            selectedBankQuestions.push(index);
        }
    } else {
        questionItem.classList.remove('selected');
        const idx = selectedBankQuestions.indexOf(index);
        if (idx > -1) {
            selectedBankQuestions.splice(idx, 1);
        }
    }

    // Update button text
    updateAddButtonText();
}

// Update add button text
// Filter bank questions
function filterBankQuestions() {
    const searchTerm = document.getElementById('bankSearchInput').value.toLowerCase();
    const questionItems = document.querySelectorAll('.bank-question-item');

    questionItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Add selected questions to test (now with direct click on bank questions)
async function addBankQuestionToTest(questionData) {
    try {
        // Add the question to the current test
        const blockKey = `bloque${currentEditingBlock}`;
        testBlocks[blockKey][currentEditingSubject].questions.push(questionData);

        // Reload questions in modal
        loadQuestionsInModal();

        // Update counter
        updateQuestionsCounter();

        showNotification('Pregunta agregada correctamente', 'success');
    } catch (error) {
        console.error('Error adding question:', error);
        showNotification('Error al agregar la pregunta: ' + error.message, 'error');
    }
}

// Delete question from bank
async function deleteBankQuestion(index) {
    if (!confirm('¿Estás seguro de eliminar esta pregunta del banco? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        showLoadingOverlay();

        const db = window.firebaseDB;
        const bankRef = db.collection('bancoPreguntas').doc(currentEditingSubject);

        // Remove question from array
        currentBankQuestions.splice(index, 1);

        // Update Firebase
        await bankRef.set({
            questions: currentBankQuestions
        }, { merge: true });

        // Reload bank display
        displayBankQuestions(currentBankQuestions);

        showNotification('Pregunta eliminada del banco', 'success');
        hideLoadingOverlay();
    } catch (error) {
        console.error('Error deleting question:', error);
        showNotification('Error al eliminar la pregunta: ' + error.message, 'error');
        hideLoadingOverlay();
    }
}

// Update questions counter
function updateQuestionsCounter() {
    const blockKey = `bloque${currentEditingBlock}`;
    const count = testBlocks[blockKey][currentEditingSubject].questions.length;
    const counterElement = document.getElementById('questionsCountDisplay');
    if (counterElement) {
        counterElement.textContent = `${count} pregunta${count !== 1 ? 's' : ''}`;
    }
}

// Question bank functions removed - now integrated in main modal

// Save questions to bank (called when saving subject)
async function saveQuestionsToBank() {
    try {
        const db = window.firebaseDB;
        const blockKey = `bloque${currentEditingBlock}`;
        const questions = testBlocks[blockKey][currentEditingSubject].questions;

        if (questions.length === 0) {
            return; // No questions to save
        }

        // Get existing bank
        const bankRef = db.collection('bancoPreguntas').doc(currentEditingSubject);
        const bankDoc = await bankRef.get();

        let existingQuestions = [];
        if (bankDoc.exists) {
            existingQuestions = bankDoc.data().questions || [];
        }

        // Add new questions to bank (avoid duplicates by checking text)
        questions.forEach(question => {
            const isDuplicate = existingQuestions.some(existing =>
                existing.text === question.text &&
                existing.type === question.type
            );

            if (!isDuplicate) {
                existingQuestions.push(JSON.parse(JSON.stringify(question)));
            }
        });

        // Save to Firebase
        await bankRef.set({
            materia: currentEditingSubject,
            questions: existingQuestions,
            fechaActualizacion: firebase.firestore.Timestamp.now()
        });

    } catch (error) {
        console.error('Error saving to question bank:', error);
        // Don't throw error, just log it
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
// Escape HTML to prevent issues with special characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle LaTeX preview
function toggleLatexPreview(questionIndex, type, optionIndex = null) {
    let textareaId, previewId, contentId;
    
    if (type === 'question') {
        textareaId = `questionText_${questionIndex}`;
        previewId = `latexPreview_question_${questionIndex}`;
        contentId = `latexPreviewContent_question_${questionIndex}`;
    } else if (type === 'option') {
        textareaId = `optionText_${questionIndex}_${optionIndex}`;
        previewId = `latexPreview_option_${questionIndex}_${optionIndex}`;
        contentId = `latexPreviewContent_option_${questionIndex}_${optionIndex}`;
    }
    
    const textarea = document.getElementById(textareaId);
    const preview = document.getElementById(previewId);
    const content = document.getElementById(contentId);
    
    if (!textarea || !preview || !content) return;
    
    if (preview.style.display === 'none') {
        // Mostrar vista previa
        const text = textarea.value;
        
        // Insertar el texto directamente (IGUAL QUE EN LA GUÍA)
        content.innerHTML = text;
        preview.style.display = 'block';
        
        // Renderizar LaTeX (EXACTAMENTE IGUAL QUE EN LA GUÍA)
        setTimeout(() => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                // Clear any previous MathJax processing
                window.MathJax.typesetClear([content]);
                
                // Render LaTeX content
                window.MathJax.typesetPromise([content]).then(() => {
                    console.log('LaTeX preview rendered successfully');
                }).catch((err) => {
                    console.error('MathJax error:', err);
                });
            }
        }, 100);
    } else {
        // Ocultar vista previa
        preview.style.display = 'none';
    }
}

// Debounce timer for realtime preview
let latexPreviewTimers = {};

// Update LaTeX preview in realtime
function updateLatexPreviewRealtime(questionIndex, type, text, optionIndex = null) {
    let previewId, contentId, timerId;
    
    if (type === 'question') {
        previewId = `latexPreview_question_${questionIndex}`;
        contentId = `latexPreviewContent_question_${questionIndex}`;
        timerId = `question_${questionIndex}`;
    } else if (type === 'option') {
        previewId = `latexPreview_option_${questionIndex}_${optionIndex}`;
        contentId = `latexPreviewContent_option_${questionIndex}_${optionIndex}`;
        timerId = `option_${questionIndex}_${optionIndex}`;
    }
    
    const preview = document.getElementById(previewId);
    const content = document.getElementById(contentId);
    
    if (!preview || !content || preview.style.display === 'none') return;
    
    // Clear previous timer
    if (latexPreviewTimers[timerId]) {
        clearTimeout(latexPreviewTimers[timerId]);
    }
    
    // Set new timer for debounced update
    latexPreviewTimers[timerId] = setTimeout(() => {
        // Insertar el texto directamente (IGUAL QUE EN LA GUÍA)
        content.innerHTML = text;
        
        // Renderizar LaTeX (EXACTAMENTE IGUAL QUE EN LA GUÍA)
        if (window.MathJax && window.MathJax.typesetPromise) {
            // Clear any previous MathJax processing
            window.MathJax.typesetClear([content]);
            
            // Render LaTeX content
            window.MathJax.typesetPromise([content]).then(() => {
                console.log('LaTeX preview updated successfully');
            }).catch((err) => {
                console.error('MathJax error:', err);
            });
        }
    }, 500); // Update after 500ms of no typing
}
