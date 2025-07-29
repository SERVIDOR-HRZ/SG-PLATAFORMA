// Tomar Prueba JavaScript
document.addEventListener('DOMContentLoaded', function () {
    // Initialize
    checkAuthentication();
    setupEventListeners();
    loadTestData();

    // Prevent navigation away from test
    preventNavigation();
});

let currentUser = null;
let currentTest = null;
let testQuestions = [];
let currentQuestionIndex = 0;
let currentSubject = null;
let currentBlock = 1;
let userAnswers = {};
let testTimer = null;
let blockStartTime = null;
let blockEndTime = null;
let autoSaveInterval = null;

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

    if (!currentUser.id || currentUser.tipoUsuario !== 'estudiante') {
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

    // Navigation controls
    document.getElementById('prevBtn').addEventListener('click', previousQuestion);
    document.getElementById('nextBtn').addEventListener('click', nextQuestion);

    // Submit test
    document.getElementById('submitTestBtn').addEventListener('click', showSubmitModal);
    document.getElementById('confirmSubmit').addEventListener('click', submitTest);
    document.getElementById('cancelSubmit').addEventListener('click', hideSubmitModal);

    // Block change modal
    document.getElementById('continueToBlock2').addEventListener('click', continueToBlock2);

    // Close modals on overlay click
    document.getElementById('blockChangeModal').addEventListener('click', function (e) {
        if (e.target === this) {
            // Don't allow closing block change modal by clicking overlay
        }
    });

    document.getElementById('submitModal').addEventListener('click', function (e) {
        if (e.target === this) {
            hideSubmitModal();
        }
    });
}

// Go back to student tests - DISABLED during test
function goBack() {
    // Función desactivada durante la prueba para evitar salidas accidentales
    // Los estudiantes deben completar la prueba o esperar a que termine el tiempo
    return false;
}

// Prevent navigation away from test
function preventNavigation() {
    let navigationBlocked = true;

    // Simple but effective approach - just push current state
    function blockBackButton() {
        history.pushState(null, null, location.href);
    }

    // Initial block
    blockBackButton();

    // Handle popstate events (back button)
    window.addEventListener('popstate', function (event) {
        if (navigationBlocked) {
            // Immediately push state again to stay on current page
            blockBackButton();

            // Show notification
            showNotification('🚫 NAVEGACIÓN BLOQUEADA: No puedes salir durante la prueba', 'error');
        }
    });

    // Continuous protection - ensure we always have a history entry
    const protectionInterval = setInterval(() => {
        if (navigationBlocked) {
            blockBackButton();
        } else {
            clearInterval(protectionInterval);
        }
    }, 2000);

    // Aggressive beforeunload protection
    window.addEventListener('beforeunload', function (e) {
        if (navigationBlocked) {
            const message = 'ADVERTENCIA: Salir de la prueba causará pérdida total del progreso. La prueba debe completarse o esperar a que termine el tiempo.';
            e.preventDefault();
            e.returnValue = message;

            // Try to block the navigation
            setTimeout(function () {
                if (navigationBlocked) {
                    blockBackButton();
                }
            }, 1);

            return message;
        }
    });

    // Block unload events
    window.addEventListener('unload', function (e) {
        if (navigationBlocked) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);

    // Block pagehide events
    window.addEventListener('pagehide', function (e) {
        if (navigationBlocked) {
            e.preventDefault();
            e.stopImmediatePropagation();
            return false;
        }
    }, true);

    // Keyboard shortcuts blocking
    document.addEventListener('keydown', function (e) {
        if (navigationBlocked) {
            // Block F5, Ctrl+R (refresh)
            if (e.key === 'F5' || (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 ACTUALIZACIÓN BLOQUEADA: No puedes actualizar durante la prueba', 'error');
                return false;
            }

            // Block Ctrl+W (close tab)
            if (e.ctrlKey && (e.key === 'w' || e.key === 'W')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 CIERRE BLOQUEADO: No puedes cerrar la pestaña durante la prueba', 'error');
                return false;
            }

            // Block Alt+F4 (close window)
            if (e.altKey && e.key === 'F4') {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 CIERRE BLOQUEADO: No puedes cerrar la ventana durante la prueba', 'error');
                return false;
            }

            // Block Ctrl+Shift+T (reopen tab)
            if (e.ctrlKey && e.shiftKey && (e.key === 't' || e.key === 'T')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }

            // Block Ctrl+N (new window)
            if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }

            // Block Ctrl+T (new tab)
            if (e.ctrlKey && (e.key === 't' || e.key === 'T')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }

            // Block Backspace navigation
            if (e.key === 'Backspace' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return false;
            }

            // Block F12 (Developer Tools)
            if (e.key === 'F12') {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 HERRAMIENTAS BLOQUEADAS: Herramientas de desarrollador deshabilitadas durante la prueba', 'error');
                return false;
            }

            // Block Ctrl+Shift+I (Developer Tools)
            if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 HERRAMIENTAS BLOQUEADAS: Herramientas de desarrollador deshabilitadas durante la prueba', 'error');
                return false;
            }

            // Block Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 CONSOLA BLOQUEADA: Consola de desarrollador deshabilitada durante la prueba', 'error');
                return false;
            }

            // Block Ctrl+Shift+C (Element Inspector)
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 INSPECTOR BLOQUEADO: Inspector de elementos deshabilitado durante la prueba', 'error');
                return false;
            }

            // Block Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 CÓDIGO BLOQUEADO: Ver código fuente deshabilitado durante la prueba', 'error');
                return false;
            }

            // Block Ctrl+Shift+K (Firefox Console)
            if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
                e.preventDefault();
                e.stopImmediatePropagation();
                showNotification('🚫 CONSOLA BLOQUEADA: Consola de desarrollador deshabilitada durante la prueba', 'error');
                return false;
            }
        }
    }, true); // Use capture phase

    // Block right-click context menu
    document.addEventListener('contextmenu', function (e) {
        if (navigationBlocked) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showNotification('🚫 MENÚ BLOQUEADO: Menú contextual deshabilitado durante la prueba', 'info');
            return false;
        }
    }, true);

    // Monitor page visibility
    document.addEventListener('visibilitychange', function () {
        if (navigationBlocked && document.hidden) {
            showNotification('⚠️ ATENCIÓN: Mantén la pestaña de la prueba activa', 'warning');
        }
    });

    // Continuous history protection
    const historyProtection = setInterval(function () {
        if (navigationBlocked) {
            blockBackButton();
        }
    }, 500);

    // Focus protection
    window.addEventListener('blur', function () {
        if (navigationBlocked) {
            setTimeout(function () {
                if (navigationBlocked) {
                    window.focus();
                    document.body.focus();
                }
            }, 100);
        }
    });

    // Override history methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
        if (navigationBlocked) {
            return originalPushState.apply(history, [null, null, location.href]);
        }
        return originalPushState.apply(history, arguments);
    };

    history.replaceState = function () {
        if (navigationBlocked) {
            return originalReplaceState.apply(history, [null, null, location.href]);
        }
        return originalReplaceState.apply(history, arguments);
    };

    // Function to disable navigation protection
    window.disableNavigationProtection = function () {
        navigationBlocked = false;
        clearInterval(protectionInterval);
        clearInterval(historyProtection);

        // Restore original history methods
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;

        console.log('Navigation protection disabled');
    };

    // Emergency disable after 4 hours (in case of issues)
    setTimeout(function () {
        if (navigationBlocked) {
            console.warn('Emergency navigation protection disable after 4 hours');
            window.disableNavigationProtection();
        }
    }, 4 * 60 * 60 * 1000); // 4 hours

    // Additional developer tools protection
    setupDeveloperToolsProtection();
}

// Setup additional developer tools protection
function setupDeveloperToolsProtection() {
    // Detect if developer tools are open
    let devtools = {
        open: false,
        orientation: null
    };

    const threshold = 160;

    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold ||
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                showNotification('🚫 HERRAMIENTAS DETECTADAS: Cierra las herramientas de desarrollador para continuar', 'error');

                // Blur the content
                document.body.style.filter = 'blur(10px)';
                document.body.style.pointerEvents = 'none';

                // Show warning overlay
                showDevToolsWarning();
            }
        } else {
            if (devtools.open) {
                devtools.open = false;
                document.body.style.filter = 'none';
                document.body.style.pointerEvents = 'auto';
                hideDevToolsWarning();
            }
        }
    }, 500);

    // Disable common inspection methods
    document.addEventListener('selectstart', function (e) {
        if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            return false;
        }
    });

    // Override console methods to prevent debugging
    const noop = () => { };
    const consoleOverrides = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];

    consoleOverrides.forEach(method => {
        if (console[method]) {
            console[method] = noop;
        }
    });

    // Disable debugger statement
    window.eval = function () {
        showNotification('🚫 EVAL BLOQUEADO: Ejecución de código dinámico no permitida', 'error');
        return null;
    };

    // Block common developer shortcuts
    document.addEventListener('keydown', function (e) {
        // Block Ctrl+Shift+E (Network tab)
        if (e.ctrlKey && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showNotification('🚫 HERRAMIENTAS BLOQUEADAS: Herramientas de red deshabilitadas', 'error');
            return false;
        }

        // Block Ctrl+Shift+M (Mobile view)
        if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showNotification('🚫 HERRAMIENTAS BLOQUEADAS: Vista móvil deshabilitada', 'error');
            return false;
        }

        // Block Ctrl+Shift+P (Command palette)
        if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            showNotification('🚫 HERRAMIENTAS BLOQUEADAS: Paleta de comandos deshabilitada', 'error');
            return false;
        }
    });
}

// Show developer tools warning overlay
function showDevToolsWarning() {
    if (document.getElementById('devToolsWarning')) return;

    const warningHTML = `
        <div id="devToolsWarning" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(220, 53, 69, 0.95);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            font-family: Arial, sans-serif;
            text-align: center;
            backdrop-filter: blur(10px);
        ">
            <div style="
                background: rgba(255, 255, 255, 0.1);
                padding: 40px;
                border-radius: 15px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                max-width: 500px;
                margin: 20px;
            ">
                <i class="bi bi-exclamation-triangle" style="font-size: 64px; margin-bottom: 20px; color: #fff;"></i>
                <h2 style="margin: 0 0 20px 0; font-size: 28px; font-weight: bold;">⚠️ HERRAMIENTAS DETECTADAS</h2>
                <p style="margin: 0 0 20px 0; font-size: 18px; line-height: 1.5;">
                    Se han detectado herramientas de desarrollador abiertas.<br>
                    <strong>Cierra las herramientas para continuar con la prueba.</strong>
                </p>
                <p style="margin: 0; font-size: 16px; opacity: 0.9;">
                    Esta medida protege la integridad del examen.
                </p>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', warningHTML);
}

// Hide developer tools warning overlay
function hideDevToolsWarning() {
    const warning = document.getElementById('devToolsWarning');
    if (warning) {
        warning.remove();
    }
}

// Load test data
async function loadTestData() {
    try {
        const testId = sessionStorage.getItem('takingTestId');
        const blockNumber = sessionStorage.getItem('takingBlockNumber');

        if (!testId) {
            throw new Error('No se encontró el ID de la prueba');
        }

        if (!blockNumber) {
            throw new Error('No se especificó el bloque a tomar');
        }

        currentBlock = parseInt(blockNumber);

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

        // Check if block is already completed
        const studentId = currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id;
        const isCompleted = await checkBlockCompleted(testId, studentId, currentBlock);

        if (isCompleted) {
            throw new Error(`El Bloque ${currentBlock} ya ha sido completado`);
        }

        // Check if test is available for this specific block
        if (!isBlockAvailable(currentBlock)) {
            throw new Error(`El Bloque ${currentBlock} no está disponible en este momento`);
        }

        // Initialize test
        initializeTest();

        // Initialize auto-save system
        initializeAutoSave();

    } catch (error) {
        console.error('Error loading test data:', error);
        showNotification('Error al cargar la prueba: ' + error.message, 'error');

        setTimeout(() => {
            window.location.href = 'Pruebas-Estudiante.html';
        }, 3000);
    }
}

// Check if block is completed
async function checkBlockCompleted(testId, studentId, blockNumber) {
    try {
        const db = window.firebaseDB;
        const responsesSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', testId)
            .where('estudianteId', '==', studentId)
            .where('bloque', '==', blockNumber)
            .get();

        return !responsesSnapshot.empty;
    } catch (error) {
        console.error('Error checking block completion:', error);
        return false;
    }
}

// Check if specific block is available
function isBlockAvailable(blockNumber) {
    const now = new Date();
    const [year, month, day] = currentTest.fechaDisponible.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);

    // Check if it's the correct date
    if (testDate.toDateString() !== now.toDateString()) {
        return false;
    }

    // Check if current time is within the specific block time
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const blockKey = `bloque${blockNumber}`;
    const blockData = currentTest[blockKey];

    if (!blockData) {
        return false;
    }

    const [startHour, startMin] = blockData.horaInicio.split(':').map(Number);
    const [endHour, endMin] = blockData.horaFin.split(':').map(Number);
    const blockStart = startHour * 60 + startMin;
    const blockEnd = endHour * 60 + endMin;

    return currentTime >= blockStart && currentTime <= blockEnd;
}

// Initialize test
function initializeTest() {
    // Update test info
    document.getElementById('testName').textContent = currentTest.nombre;
    document.getElementById('currentBlock').textContent = `Bloque ${currentBlock}`;

    const blockInfo = currentTest[`bloque${currentBlock}`];
    if (blockInfo) {
        document.getElementById('blockTime').textContent = `${blockInfo.horaInicio} - ${blockInfo.horaFin}`;

        // Set block times for timer
        const now = new Date();
        const [year, month, day] = currentTest.fechaDisponible.split('-').map(Number);
        const [startHour, startMin] = blockInfo.horaInicio.split(':').map(Number);
        const [endHour, endMin] = blockInfo.horaFin.split(':').map(Number);

        blockStartTime = new Date(year, month - 1, day, startHour, startMin);
        blockEndTime = new Date(year, month - 1, day, endHour, endMin);
    }

    // Load questions for current block
    loadBlockQuestions();

    // Start timer
    startTimer();

    // Create subject navigation
    createSubjectNavigation();

    // Show first subject
    if (testQuestions.length > 0) {
        showSubject(Object.keys(testQuestions[0])[0]);
    } else {
        showNoQuestions();
    }
}

// Load questions for current block
function loadBlockQuestions() {
    testQuestions = [];
    userAnswers = {};

    if (!currentTest.bloques || !currentTest.bloques[`bloque${currentBlock}`]) {
        return;
    }

    const blockData = currentTest.bloques[`bloque${currentBlock}`];

    Object.keys(blockData).forEach(subject => {
        if (blockData[subject].questions && blockData[subject].questions.length > 0) {
            testQuestions.push({
                [subject]: blockData[subject].questions
            });

            // Initialize answers for this subject
            userAnswers[subject] = {};
            blockData[subject].questions.forEach((_, index) => {
                userAnswers[subject][index] = null;
            });
        }
    });
}

// Create subject navigation
function createSubjectNavigation() {
    const subjectsNav = document.getElementById('subjectsNav');
    subjectsNav.innerHTML = '';

    testQuestions.forEach(subjectData => {
        const subject = Object.keys(subjectData)[0];
        const config = subjectConfig[subject];

        if (config) {
            const button = document.createElement('button');
            button.className = `subject-btn ${subject}`;
            button.innerHTML = `
                <i class="${config.icon}"></i>
                ${config.name}
            `;
            button.addEventListener('click', () => showSubject(subject));
            subjectsNav.appendChild(button);
        }
    });
}

// Show subject questions
function showSubject(subject) {
    currentSubject = subject;
    currentQuestionIndex = 0;

    // Update active subject button
    document.querySelectorAll('.subject-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.subject-btn.${subject}`).classList.add('active');

    // Show questions
    showCurrentQuestion();

    // Show controls
    document.getElementById('questionControls').style.display = 'flex';
}

// Show current question
function showCurrentQuestion() {
    const questionContainer = document.getElementById('questionContainer');

    if (!currentSubject || !testQuestions.find(q => q[currentSubject])) {
        return;
    }

    const subjectQuestions = testQuestions.find(q => q[currentSubject])[currentSubject];
    const question = subjectQuestions[currentQuestionIndex];
    const config = subjectConfig[currentSubject];

    questionContainer.innerHTML = `
        <div class="question-layout">
            <div class="question-selector">
                <div class="selector-header">
                    <div class="selector-subject">
                        <div class="subject-icon ${currentSubject}">
                            <i class="${config.icon}"></i>
                        </div>
                        <span>${config.name}</span>
                    </div>
                    <div class="selector-info">
                        ${subjectQuestions.length} pregunta${subjectQuestions.length !== 1 ? 's' : ''}
                    </div>
                </div>
                <div class="questions-grid">
                    ${createQuestionsSelector(subjectQuestions.length)}
                </div>
            </div>
            
            <div class="question-content active">
                <div class="question-header">
                    <div class="question-subject">
                        <div class="subject-icon ${currentSubject}">
                            <i class="${config.icon}"></i>
                        </div>
                        ${config.name}
                    </div>
                    <div class="question-number-badge">
                        Pregunta ${currentQuestionIndex + 1} de ${subjectQuestions.length}
                    </div>
                </div>
                
                ${createQuestionMediaHTML(question.images || [], question.videos || [])}
                
                <div class="question-text">
                    ${question.text || 'Pregunta sin texto'}
                </div>
                
                ${question.type === 'multiple' ? createMultipleChoiceHTML(question) : createOpenAnswerHTML(question)}
            </div>
        </div>
    `;

    // Update navigation info
    document.getElementById('questionNumber').textContent = currentQuestionIndex + 1;
    document.getElementById('totalQuestions').textContent = subjectQuestions.length;

    // Update navigation buttons
    updateNavigationButtons();

    // Update progress
    updateProgress();

    // Load saved answer
    loadSavedAnswer();
}

// Create multiple choice HTML
function createMultipleChoiceHTML(question) {
    if (!question.options || question.options.length === 0) {
        return '<p>Esta pregunta no tiene opciones configuradas.</p>';
    }

    let html = '<div class="question-options">';

    question.options.forEach((option, index) => {
        html += `
            <div class="option-item" onclick="selectOption(${index})">
                <input type="radio" name="question_${currentQuestionIndex}" value="${index}" id="option_${index}">
                <div class="option-content">
                    <div class="option-text">${option.text || `Opción ${index + 1}`}</div>
                    ${createOptionImagesHTML(option.images || [])}
                </div>
            </div>
        `;
    });

    html += '</div>';
    return html;
}

// Create question images HTML for student view
function createQuestionImagesHTML(images) {
    if (!images || images.length === 0) return '';

    let html = '<div class="question-images">';
    images.forEach(image => {
        html += `<img src="${image.url}" alt="Imagen de pregunta" class="question-image" onclick="showImageModal('${image.url}')">`;
    });
    html += '</div>';
    return html;
}

// Create question videos HTML for student view
function createQuestionVideosHTML(videos) {
    if (!videos || videos.length === 0) return '';

    let html = '<div class="question-videos">';
    videos.forEach(video => {
        html += `
            <div class="video-item">
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
        `;
    });
    html += '</div>';
    return html;
}

// Create questions selector grid
function createQuestionsSelector(totalQuestions) {
    let html = '';
    for (let i = 0; i < totalQuestions; i++) {
        const isAnswered = userAnswers[currentSubject] && userAnswers[currentSubject][i] !== null && userAnswers[currentSubject][i] !== undefined && userAnswers[currentSubject][i] !== '';
        const isActive = i === currentQuestionIndex;

        html += `
            <button class="question-btn ${isActive ? 'active' : ''} ${isAnswered ? 'answered' : ''}" 
                    onclick="goToQuestion(${i})" 
                    title="Pregunta ${i + 1}${isAnswered ? ' (Respondida)' : ''}">
                ${i + 1}
            </button>
        `;
    }
    return html;
}

// Go to specific question
function goToQuestion(questionIndex) {
    currentQuestionIndex = questionIndex;
    showCurrentQuestion();
}

// Create combined media HTML for student view (images and videos side by side)
function createQuestionMediaHTML(images, videos) {
    if ((!images || images.length === 0) && (!videos || videos.length === 0)) return '';

    let html = '<div class="question-media-container">';

    // Add images section
    if (images && images.length > 0) {
        html += '<div class="media-section images-section">';
        html += '<h5 class="media-section-title"><i class="bi bi-image"></i> Imágenes</h5>';
        html += '<div class="question-images">';
        images.forEach(image => {
            html += `<img src="${image.url}" alt="Imagen de pregunta" class="question-image" onclick="showImageModal('${image.url}')">`;
        });
        html += '</div></div>';
    }

    // Add videos section
    if (videos && videos.length > 0) {
        html += '<div class="media-section videos-section">';
        html += '<h5 class="media-section-title"><i class="bi bi-youtube"></i> Videos</h5>';
        html += '<div class="question-videos">';
        videos.forEach(video => {
            html += `
                <div class="video-item">
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
            `;
        });
        html += '</div></div>';
    }

    html += '</div>';
    return html;
}

// Create option images HTML for student view
function createOptionImagesHTML(images) {
    if (!images || images.length === 0) return '';

    let html = '<div class="option-images">';
    images.forEach(image => {
        html += `<img src="${image.url}" alt="Imagen de opción" class="option-image" onclick="showImageModal('${image.url}')">`;
    });
    html += '</div>';
    return html;
}

// Create open answer HTML
function createOpenAnswerHTML(question) {
    return `
        <div class="open-answer">
            <textarea 
                id="openAnswer" 
                placeholder="Escribe tu respuesta aquí..."
                onchange="saveOpenAnswer(this.value)"
            ></textarea>
        </div>
    `;
}

// Select option
function selectOption(optionIndex) {
    // Update radio button
    document.getElementById(`option_${optionIndex}`).checked = true;

    // Update visual selection
    document.querySelectorAll('.option-item').forEach(item => {
        item.classList.remove('selected');
    });
    document.querySelectorAll('.option-item')[optionIndex].classList.add('selected');

    // Save answer
    userAnswers[currentSubject][currentQuestionIndex] = optionIndex;

    // Update progress
    updateProgress();
    updateSubjectCompletion();
}

// Save open answer
function saveOpenAnswer(answer) {
    userAnswers[currentSubject][currentQuestionIndex] = answer.trim();
    updateProgress();
    updateSubjectCompletion();
}

// Load saved answer
function loadSavedAnswer() {
    const savedAnswer = userAnswers[currentSubject][currentQuestionIndex];

    if (savedAnswer !== null && savedAnswer !== undefined) {
        const subjectQuestions = testQuestions.find(q => q[currentSubject])[currentSubject];
        const question = subjectQuestions[currentQuestionIndex];

        if (question.type === 'multiple') {
            // Load multiple choice answer
            const optionElement = document.getElementById(`option_${savedAnswer}`);
            if (optionElement) {
                optionElement.checked = true;
                document.querySelectorAll('.option-item')[savedAnswer].classList.add('selected');
            }
        } else {
            // Load open answer
            const textArea = document.getElementById('openAnswer');
            if (textArea) {
                textArea.value = savedAnswer;
            }
        }
    }
}

// Previous question
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showCurrentQuestion();
    }
}

// Next question
function nextQuestion() {
    const subjectQuestions = testQuestions.find(q => q[currentSubject])[currentSubject];

    if (currentQuestionIndex < subjectQuestions.length - 1) {
        currentQuestionIndex++;
        showCurrentQuestion();
    }
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const subjectQuestions = testQuestions.find(q => q[currentSubject])[currentSubject];

    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === subjectQuestions.length - 1;
}

// Update progress
function updateProgress() {
    let totalQuestions = 0;
    let answeredQuestions = 0;

    Object.keys(userAnswers).forEach(subject => {
        Object.keys(userAnswers[subject]).forEach(questionIndex => {
            totalQuestions++;
            const answer = userAnswers[subject][questionIndex];
            if (answer !== null && answer !== undefined && answer !== '') {
                answeredQuestions++;
            }
        });
    });

    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    document.getElementById('progressFill').style.width = `${progressPercentage}%`;
    document.getElementById('progressText').textContent = `${answeredQuestions} de ${totalQuestions} preguntas completadas`;

    // Show submit button if all questions are answered
    if (answeredQuestions === totalQuestions && totalQuestions > 0) {
        document.getElementById('submitContainer').style.display = 'block';
    } else {
        document.getElementById('submitContainer').style.display = 'none';
    }
}

// Update subject completion
function updateSubjectCompletion() {
    Object.keys(userAnswers).forEach(subject => {
        const subjectAnswers = userAnswers[subject];
        let completed = true;

        Object.keys(subjectAnswers).forEach(questionIndex => {
            const answer = subjectAnswers[questionIndex];
            if (answer === null || answer === undefined || answer === '') {
                completed = false;
            }
        });

        const subjectBtn = document.querySelector(`.subject-btn.${subject}`);
        if (subjectBtn) {
            if (completed) {
                subjectBtn.classList.add('completed');
            } else {
                subjectBtn.classList.remove('completed');
            }
        }
    });
}

// Start timer
function startTimer() {
    if (!blockEndTime) return;

    testTimer = setInterval(() => {
        const now = new Date();
        const timeLeft = blockEndTime - now;

        if (timeLeft <= 0) {
            // Time's up
            clearInterval(testTimer);
            handleTimeUp();
            return;
        }

        // Update timer display
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

        const timerDisplay = document.getElementById('timerDisplay');
        timerDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Add warning classes
        const timerElement = document.querySelector('.test-timer');
        if (timeLeft <= 5 * 60 * 1000) { // 5 minutes
            timerElement.classList.add('timer-critical');
        } else if (timeLeft <= 15 * 60 * 1000) { // 15 minutes
            timerElement.classList.add('timer-warning');
        }

        // Check if it's time for block 2
        if (currentBlock === 1 && now >= blockEndTime) {
            clearInterval(testTimer);
            showBlockChangeModal();
        }
    }, 1000);
}

// Handle time up
function handleTimeUp() {
    if (currentBlock === 1 && currentTest.bloque2) {
        showTimeUpModal();
    } else {
        // Auto-submit test for block 2 or single block tests
        submitTest();
    }
}

// Show time up modal
function showTimeUpModal() {
    // Auto-submit current block first
    submitCurrentBlock();

    // Create time up modal
    const modalHTML = `
        <div class="modal-overlay" id="timeUpModal">
            <div class="modal">
                <div class="modal-header">
                    <h3>Tiempo Agotado</h3>
                </div>
                <div class="modal-body">
                    <div class="time-up-info">
                        <i class="bi bi-clock-history" style="font-size: 48px; color: #ffc107; margin-bottom: 20px;"></i>
                        <h4>El tiempo del Bloque ${currentBlock} ha terminado</h4>
                        <p>Tus respuestas han sido guardadas automáticamente.</p>
                        ${currentTest.bloque2 ? `
                            <div class="next-block-info">
                                <strong>Próximo bloque disponible:</strong><br>
                                Bloque 2: ${currentTest.bloque2.horaInicio} - ${currentTest.bloque2.horaFin}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" id="acceptTimeUp">
                        <i class="bi bi-check-circle"></i>
                        Aceptar
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.getElementById('timeUpModal').classList.add('active');

    // Handle accept button
    document.getElementById('acceptTimeUp').addEventListener('click', () => {
        // Clear session data
        sessionStorage.removeItem('takingTestId');
        sessionStorage.removeItem('takingBlockNumber');

        // Redirect to student tests selection
        window.location.href = 'Pruebas-Estudiante.html';
    });

    // Prevent closing modal by clicking overlay
    document.getElementById('timeUpModal').addEventListener('click', function (e) {
        if (e.target === this) {
            // Don't allow closing time up modal by clicking overlay
        }
    });
}

// Submit current block when time is up
async function submitCurrentBlock() {
    try {
        // Clear timer
        if (testTimer) {
            clearInterval(testTimer);
        }

        // Evaluate answers automatically
        const evaluatedAnswers = evaluateAnswers();

        // Calculate statistics
        const stats = calculateStats(evaluatedAnswers);

        // Prepare submission data
        const submissionData = {
            pruebaId: currentTest.id,
            estudianteId: currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id,
            estudianteNombre: currentUser.nombre,
            bloque: currentBlock,
            respuestas: userAnswers,
            respuestasEvaluadas: evaluatedAnswers,
            estadisticas: stats,
            fechaEnvio: firebase.firestore.Timestamp.now(),
            tiempoTotal: 0, // Time is up
            completado: true,
            tiempoAgotado: true // Flag to indicate time was up
        };

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

        // Save submission
        await db.collection('respuestas').add(submissionData);

        // Clear saved answers since time is up
        clearSavedAnswers();

        // Disable navigation protection since time is up
        if (window.disableNavigationProtection) {
            window.disableNavigationProtection();
        }

    } catch (error) {
        console.error('Error submitting block when time up:', error);
    }
}

// Show block change modal (kept for compatibility but not used)
function showBlockChangeModal() {
    if (!currentTest.bloque2) return;

    document.getElementById('nextBlockTime').textContent = `${currentTest.bloque2.horaInicio} - ${currentTest.bloque2.horaFin}`;
    document.getElementById('blockChangeModal').classList.add('active');
}

// Continue to block 2
function continueToBlock2() {
    document.getElementById('blockChangeModal').classList.remove('active');

    currentBlock = 2;

    // Update UI
    document.getElementById('currentBlock').textContent = 'Bloque 2';
    document.getElementById('blockTime').textContent = `${currentTest.bloque2.horaInicio} - ${currentTest.bloque2.horaFin}`;

    // Update block times
    const now = new Date();
    const [year, month, day] = currentTest.fechaDisponible.split('-').map(Number);
    const [startHour, startMin] = currentTest.bloque2.horaInicio.split(':').map(Number);
    const [endHour, endMin] = currentTest.bloque2.horaFin.split(':').map(Number);

    blockStartTime = new Date(year, month - 1, day, startHour, startMin);
    blockEndTime = new Date(year, month - 1, day, endHour, endMin);

    // Load block 2 questions
    loadBlockQuestions();

    // Recreate subject navigation
    createSubjectNavigation();

    // Start timer for block 2
    startTimer();

    // Show first subject of block 2
    if (testQuestions.length > 0) {
        showSubject(Object.keys(testQuestions[0])[0]);
    } else {
        showNoQuestions();
    }
}

// Show no questions
function showNoQuestions() {
    const questionContainer = document.getElementById('questionContainer');
    questionContainer.innerHTML = `
        <div class="no-questions">
            <i class="bi bi-question-circle"></i>
            <h3>No hay preguntas disponibles</h3>
            <p>Este bloque no tiene preguntas configuradas.</p>
        </div>
    `;

    document.getElementById('questionControls').style.display = 'none';
}

// Show submit modal
function showSubmitModal() {
    // Create answers summary
    const summaryContainer = document.getElementById('answersSummary');
    let summaryHTML = '';

    Object.keys(userAnswers).forEach(subject => {
        const config = subjectConfig[subject];
        const subjectAnswers = userAnswers[subject];
        const totalQuestions = Object.keys(subjectAnswers).length;
        let answeredCount = 0;

        Object.keys(subjectAnswers).forEach(questionIndex => {
            const answer = subjectAnswers[questionIndex];
            if (answer !== null && answer !== undefined && answer !== '') {
                answeredCount++;
            }
        });

        summaryHTML += `
            <div class="summary-item">
                <div class="summary-subject">
                    <i class="${config.icon}"></i>
                    ${config.name}
                </div>
                <div class="summary-count">${answeredCount}/${totalQuestions} respondidas</div>
            </div>
        `;
    });

    summaryContainer.innerHTML = summaryHTML;
    document.getElementById('submitModal').classList.add('active');
}

// Hide submit modal
function hideSubmitModal() {
    document.getElementById('submitModal').classList.remove('active');
}

// Submit test
async function submitTest() {
    try {
        // Clear timer
        if (testTimer) {
            clearInterval(testTimer);
        }

        // Evaluate answers automatically
        const evaluatedAnswers = evaluateAnswers();

        // Calculate statistics
        const stats = calculateStats(evaluatedAnswers);

        // Prepare submission data
        const submissionData = {
            pruebaId: currentTest.id,
            estudianteId: currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id,
            estudianteNombre: currentUser.nombre,
            bloque: currentBlock,
            respuestas: userAnswers,
            respuestasEvaluadas: evaluatedAnswers,
            estadisticas: stats,
            fechaEnvio: firebase.firestore.Timestamp.now(),
            tiempoTotal: blockEndTime ? Math.max(0, blockEndTime - new Date()) : 0,
            completado: true
        };

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

        // Save submission
        await db.collection('respuestas').add(submissionData);

        // Clear saved answers since test is completed
        clearSavedAnswers();

        // Clear session data
        sessionStorage.removeItem('takingTestId');
        sessionStorage.removeItem('takingBlockNumber');

        // Disable navigation protection since test is completed
        if (window.disableNavigationProtection) {
            window.disableNavigationProtection();
        }

        // Show success message
        showNotification(`Bloque ${currentBlock} enviado exitosamente`, 'success');

        // Redirect to student tests
        setTimeout(() => {
            window.location.href = 'Pruebas-Estudiante.html';
        }, 2000);

    } catch (error) {
        console.error('Error submitting test:', error);
        showNotification('Error al enviar la prueba: ' + error.message, 'error');
    }
}

// Evaluate answers automatically
function evaluateAnswers() {
    const evaluatedAnswers = {};

    Object.keys(userAnswers).forEach(subject => {
        evaluatedAnswers[subject] = {};
        const subjectQuestions = testQuestions.find(q => q[subject])[subject];

        Object.keys(userAnswers[subject]).forEach(questionIndex => {
            const userAnswer = userAnswers[subject][questionIndex];
            const question = subjectQuestions[parseInt(questionIndex)];

            let isCorrect = false;
            let correctAnswer = null;

            if (question.type === 'multiple') {
                // Find correct option
                const correctOptionIndex = question.options.findIndex(option => option.isCorrect);
                correctAnswer = correctOptionIndex;

                // Check if user answer matches correct answer
                isCorrect = parseInt(userAnswer) === correctOptionIndex;
            } else {
                // For open questions, we can't automatically evaluate
                // Mark as correct for now (teacher will review manually)
                isCorrect = userAnswer && userAnswer.trim().length > 0;
                correctAnswer = 'Respuesta abierta - Requiere revisión manual';
            }

            evaluatedAnswers[subject][questionIndex] = {
                respuestaUsuario: userAnswer,
                respuestaCorrecta: correctAnswer,
                esCorrecta: isCorrect,
                tipoRespuesta: question.type,
                textoPregunta: question.text
            };
        });
    });

    return evaluatedAnswers;
}

// Calculate statistics
function calculateStats(evaluatedAnswers) {
    let totalQuestions = 0;
    let correctAnswers = 0;
    let multipleChoiceCorrect = 0;
    let multipleChoiceTotal = 0;
    let openAnswers = 0;

    const subjectStats = {};

    Object.keys(evaluatedAnswers).forEach(subject => {
        let subjectTotal = 0;
        let subjectCorrect = 0;

        Object.keys(evaluatedAnswers[subject]).forEach(questionIndex => {
            const answer = evaluatedAnswers[subject][questionIndex];
            totalQuestions++;
            subjectTotal++;

            if (answer.tipoRespuesta === 'multiple') {
                multipleChoiceTotal++;
                if (answer.esCorrecta) {
                    correctAnswers++;
                    subjectCorrect++;
                    multipleChoiceCorrect++;
                }
            } else {
                openAnswers++;
                if (answer.esCorrecta) {
                    correctAnswers++;
                    subjectCorrect++;
                }
            }
        });

        subjectStats[subject] = {
            total: subjectTotal,
            correctas: subjectCorrect,
            porcentaje: subjectTotal > 0 ? Math.round((subjectCorrect / subjectTotal) * 100) : 0
        };
    });

    return {
        totalPreguntas: totalQuestions,
        respuestasCorrectas: correctAnswers,
        porcentajeGeneral: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
        seleccionMultiple: {
            total: multipleChoiceTotal,
            correctas: multipleChoiceCorrect,
            porcentaje: multipleChoiceTotal > 0 ? Math.round((multipleChoiceCorrect / multipleChoiceTotal) * 100) : 0
        },
        respuestasAbiertas: openAnswers,
        estadisticasPorMateria: subjectStats,
        bloque: currentBlock,
        fechaEvaluacion: new Date().toISOString()
    };
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

    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 10000;
                transform: translateX(400px);
                transition: all 0.3s ease;
                max-width: 400px;
            }
            .notification.show {
                transform: translateX(0);
            }
            .notification-success { background: #28a745; }
            .notification-error { background: #dc3545; }
            .notification-info { background: #17a2b8; }
            .notification-warning { background: #ffc107; color: #333; }
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
            }
        `;
        document.head.appendChild(styles);
    }

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

// Make functions globally accessible
window.selectOption = selectOption;
window.saveOpenAnswer = saveOpenAnswer;
// 

// Initialize auto-save system
function initializeAutoSave() {
    // Load saved answers from localStorage
    loadSavedAnswersFromStorage();

    // Start auto-save interval for localStorage only (every 10 seconds)
    autoSaveInterval = setInterval(() => {
        saveAnswersToLocalStorage();
    }, 10000);

    // Setup auto-save events
    setupAutoSaveEvents();

    console.log('Auto-save system initialized');
}

// Load saved answers from localStorage
function loadSavedAnswersFromStorage() {
    try {
        const testId = sessionStorage.getItem('takingTestId');
        const studentId = currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id;
        const storageKey = `test_answers_${testId}_${studentId}_block${currentBlock}`;

        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            const parsedData = JSON.parse(savedData);

            // Verify the data is for the current test and block
            if (parsedData.testId === testId && parsedData.block === currentBlock) {
                // Merge saved answers with current userAnswers
                Object.keys(parsedData.answers).forEach(subject => {
                    if (userAnswers[subject]) {
                        Object.keys(parsedData.answers[subject]).forEach(questionIndex => {
                            const savedAnswer = parsedData.answers[subject][questionIndex];
                            if (savedAnswer !== null && savedAnswer !== undefined && savedAnswer !== '') {
                                userAnswers[subject][questionIndex] = savedAnswer;
                            }
                        });
                    }
                });

                showNotification('💾 Respuestas anteriores restauradas automáticamente', 'success');
                console.log('Answers loaded from localStorage:', parsedData);
            }
        }
    } catch (error) {
        console.error('Error loading saved answers:', error);
    }
}

// Save answers to localStorage
// Save answers to localStorage only (frequent saves)
function saveAnswersToLocalStorage() {
    try {
        const testId = sessionStorage.getItem('takingTestId');
        const studentId = currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id;
        const storageKey = `test_answers_${testId}_${studentId}_block${currentBlock}`;

        const dataToSave = {
            testId: testId,
            studentId: studentId,
            block: currentBlock,
            answers: userAnswers,
            timestamp: new Date().toISOString(),
            currentSubject: currentSubject,
            currentQuestionIndex: currentQuestionIndex
        };

        localStorage.setItem(storageKey, JSON.stringify(dataToSave));
        console.log('Answers auto-saved to localStorage');

    } catch (error) {
        console.error('Error saving answers to localStorage:', error);
    }
}

// Save answers to both localStorage and Firebase (critical saves)
function saveAnswersToStorageAndFirebase() {
    // Save to localStorage first (immediate)
    saveAnswersToLocalStorage();

    // Then sync with Firebase (background)
    syncAnswersWithFirebase();
}

// Setup auto-save events
function setupAutoSaveEvents() {
    // Save when user selects an option (localStorage only - frequent)
    const originalSelectOption = window.selectOption;
    window.selectOption = function (optionIndex) {
        originalSelectOption(optionIndex);
        saveAnswersToLocalStorage();
    };

    // Save when user types in open answer (localStorage only - frequent)
    const originalSaveOpenAnswer = window.saveOpenAnswer;
    window.saveOpenAnswer = function (answer) {
        originalSaveOpenAnswer(answer);
        saveAnswersToLocalStorage();
    };

    // Save when user changes subject or question (localStorage only - frequent)
    const originalShowSubject = showSubject;
    window.showSubject = function (subject) {
        saveAnswersToLocalStorage();
        originalShowSubject(subject);
    };

    const originalGoToQuestion = goToQuestion;
    window.goToQuestion = function (questionIndex) {
        saveAnswersToLocalStorage();
        originalGoToQuestion(questionIndex);
    };

    // CRITICAL SAVES - Save to both localStorage and Firebase
    // Save before page unload (critical - might be leaving)
    window.addEventListener('beforeunload', function () {
        saveAnswersToStorageAndFirebase();
    });

    // Save when page becomes hidden (critical - might be switching tabs/apps)
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            saveAnswersToStorageAndFirebase();
        }
    });

    // Save when page loses focus (critical - might be switching windows)
    window.addEventListener('blur', function () {
        saveAnswersToStorageAndFirebase();
    });

    // Save on page refresh attempt (critical)
    window.addEventListener('pagehide', function () {
        saveAnswersToStorageAndFirebase();
    });
}

// Sync answers with Firebase (background save)
async function syncAnswersWithFirebase() {
    try {
        if (!window.firebaseDB) return;

        const testId = sessionStorage.getItem('takingTestId');
        const studentId = currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id;

        // Create a draft submission
        const draftData = {
            pruebaId: testId,
            estudianteId: studentId,
            estudianteNombre: currentUser.nombre,
            bloque: currentBlock,
            respuestas: userAnswers,
            fechaGuardado: firebase.firestore.Timestamp.now(),
            esBorrador: true, // Flag to indicate this is a draft
            completado: false
        };

        const db = window.firebaseDB;
        const draftId = `draft_${testId}_${studentId}_block${currentBlock}`;

        // Save as draft (upsert)
        await db.collection('borradores').doc(draftId).set(draftData);

        console.log('Answers synced with Firebase as draft');

    } catch (error) {
        console.error('Error syncing with Firebase:', error);
        // Don't show error to user, this is background sync
    }
}

// Clear saved answers (called when test is submitted successfully)
function clearSavedAnswers() {
    try {
        const testId = sessionStorage.getItem('takingTestId');
        const studentId = currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id;
        const storageKey = `test_answers_${testId}_${studentId}_block${currentBlock}`;

        // Clear from localStorage
        localStorage.removeItem(storageKey);

        // Clear auto-save interval
        if (autoSaveInterval) {
            clearInterval(autoSaveInterval);
            autoSaveInterval = null;
        }

        // Clear draft from Firebase
        clearDraftFromFirebase();

        console.log('Saved answers cleared');

    } catch (error) {
        console.error('Error clearing saved answers:', error);
    }
}

// Clear draft from Firebase
async function clearDraftFromFirebase() {
    try {
        if (!window.firebaseDB) return;

        const testId = sessionStorage.getItem('takingTestId');
        const studentId = currentUser.numeroDocumento || currentUser.numeroIdentidad || currentUser.id;
        const draftId = `draft_${testId}_${studentId}_block${currentBlock}`;

        const db = window.firebaseDB;
        await db.collection('borradores').doc(draftId).delete();

        console.log('Draft cleared from Firebase');

    } catch (error) {
        console.error('Error clearing draft from Firebase:', error);
    }
}

// Recovery function - can be called manually if needed
function recoverAnswersFromStorage() {
    loadSavedAnswersFromStorage();

    // Update UI
    if (currentSubject) {
        showCurrentQuestion();
        updateProgress();
        updateSubjectCompletion();
    }

    showNotification('🔄 Respuestas recuperadas del almacenamiento local', 'info');
}

// Make recovery function globally accessible
window.recoverAnswers = recoverAnswersFromStorage;