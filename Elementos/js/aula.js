// Aula JavaScript
let currentMateria = '';
let currentUser = {};

document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserInfo();
    getCurrentMateria();
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

// Get current materia from URL
function getCurrentMateria() {
    const urlParams = new URLSearchParams(window.location.search);
    currentMateria = urlParams.get('materia');
    
    if (!currentMateria) {
        window.location.href = 'Clases.html';
        return;
    }

    // Set title
    const materias = {
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
            
            // Load content based on tab
            switch(tabName) {
                case 'anuncios':
                    loadAnuncios();
                    break;
                case 'tareas':
                    loadTareas();
                    break;
                case 'materiales':
                    loadMateriales();
                    break;
                case 'estudiantes':
                    loadEstudiantes();
                    break;
            }
        });
    });
}

// Load anuncios
async function loadAnuncios() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        const postsContainer = document.getElementById('postsContainer');
        postsContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

        const snapshot = await db.collection('anuncios')
            .where('materia', '==', currentMateria)
            .get();

        if (snapshot.empty) {
            postsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-megaphone"></i>
                    <p>No hay anuncios aún</p>
                </div>
            `;
            return;
        }

        // Sort manually by fecha
        const anuncios = [];
        snapshot.forEach(doc => {
            anuncios.push({ id: doc.id, data: doc.data() });
        });
        
        anuncios.sort((a, b) => {
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
                    <button class="post-action-btn" onclick="eliminarAnuncio('${id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
        <div class="post-content">${anuncio.contenido}</div>
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

        const snapshot = await db.collection('tareas')
            .where('materia', '==', currentMateria)
            .get();

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
        
        tareas.forEach(tarea => {
            const taskCard = createTaskCard(tarea.id, tarea.data);
            tasksContainer.appendChild(taskCard);
        });

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
function createTaskCard(id, tarea) {
    const card = document.createElement('div');
    card.className = 'task-card';
    
    const fechaEntrega = tarea.fechaEntrega ? new Date(tarea.fechaEntrega.seconds * 1000) : new Date();
    const ahora = new Date();
    let status = 'pending';
    let statusText = 'Pendiente';
    
    if (fechaEntrega < ahora) {
        status = 'overdue';
        statusText = 'Vencida';
    }

    card.innerHTML = `
        <div class="task-header">
            <div>
                <h3 class="task-title">${tarea.titulo}</h3>
            </div>
            <span class="task-status ${status}">${statusText}</span>
        </div>
        <div class="task-description">${tarea.descripcion}</div>
        <div class="task-footer">
            <div class="task-due-date">
                <i class="bi bi-calendar-event"></i>
                <span>Entrega: ${formatearFecha(fechaEntrega)}</span>
            </div>
            ${currentUser.tipoUsuario === 'admin' ? `
                <div class="task-actions">
                    <button class="post-action-btn" onclick="eliminarTarea('${id}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    return card;
}

// Load materiales
async function loadMateriales() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        const materialsContainer = document.getElementById('materialsContainer');
        materialsContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

        const snapshot = await db.collection('materiales')
            .where('materia', '==', currentMateria)
            .get();

        if (snapshot.empty) {
            materialsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-folder"></i>
                    <p>No hay materiales disponibles</p>
                </div>
            `;
            return;
        }

        // Sort manually by fecha
        const materiales = [];
        snapshot.forEach(doc => {
            materiales.push({ id: doc.id, data: doc.data() });
        });
        
        materiales.sort((a, b) => {
            const fechaA = a.data.fecha ? a.data.fecha.seconds : 0;
            const fechaB = b.data.fecha ? b.data.fecha.seconds : 0;
            return fechaB - fechaA; // Descending order
        });

        materialsContainer.innerHTML = '';
        
        materiales.forEach(material => {
            const materialCard = createMaterialCard(material.id, material.data);
            materialsContainer.appendChild(materialCard);
        });

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

// Create material card
function createMaterialCard(id, material) {
    const card = document.createElement('div');
    card.className = 'material-card';
    
    const iconClass = material.tipo === 'youtube' ? 'bi-youtube' : 
                     material.tipo === 'drive' ? 'bi-google' : 'bi-link-45deg';

    card.innerHTML = `
        <div class="material-header">
            <div class="material-icon ${material.tipo}">
                <i class="${iconClass}"></i>
            </div>
            <div class="material-content">
                <h3 class="material-title">${material.titulo}</h3>
                ${material.descripcion ? `<p class="material-description">${material.descripcion}</p>` : ''}
                <span class="material-type">${material.tipo === 'youtube' ? 'Video' : material.tipo === 'drive' ? 'Drive' : 'Enlace'}</span>
            </div>
            ${currentUser.tipoUsuario === 'admin' ? `
                <button class="post-action-btn" onclick="eliminarMaterial('${id}')">
                    <i class="bi bi-trash"></i>
                </button>
            ` : ''}
        </div>
        <div class="material-preview" id="preview-${id}">
            ${getMaterialPreview(material)}
        </div>
    `;

    return card;
}

// Get material preview
function getMaterialPreview(material) {
    if (material.tipo === 'youtube') {
        const videoId = extractYouTubeId(material.url);
        if (videoId) {
            return `
                <div class="video-container">
                    <iframe 
                        src="https://www.youtube.com/embed/${videoId}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                </div>
            `;
        }
    } else if (material.tipo === 'drive') {
        const fileId = extractDriveFileId(material.url);
        if (fileId) {
            return `
                <div class="drive-container">
                    <iframe 
                        src="https://drive.google.com/file/d/${fileId}/preview" 
                        frameborder="0" 
                        allow="autoplay">
                    </iframe>
                </div>
            `;
        }
    }
    
    // For links or if preview fails, show a button
    return `
        <div class="link-preview">
            <a href="${material.url}" target="_blank" class="open-link-btn">
                <i class="bi bi-box-arrow-up-right"></i>
                Abrir enlace
            </a>
        </div>
    `;
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

// Load estudiantes
async function loadEstudiantes() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        const studentsContainer = document.getElementById('studentsContainer');
        studentsContainer.innerHTML = '<div class="loading-spinner"><i class="bi bi-arrow-clockwise"></i></div>';

        const snapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .where('clasesPermitidas', 'array-contains', currentMateria)
            .get();

        if (snapshot.empty) {
            studentsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-people"></i>
                    <p>No hay estudiantes inscritos</p>
                </div>
            `;
            return;
        }

        studentsContainer.innerHTML = '';
        
        snapshot.forEach(doc => {
            const estudiante = doc.data();
            const studentItem = createStudentItem(estudiante);
            studentsContainer.appendChild(studentItem);
        });

    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
    }
}

// Create student item
function createStudentItem(estudiante) {
    const item = document.createElement('div');
    item.className = 'student-item';
    
    item.innerHTML = `
        <div class="student-avatar">
            ${estudiante.fotoPerfil ? `<img src="${estudiante.fotoPerfil}" alt="${estudiante.nombre}">` : '<i class="bi bi-person-fill"></i>'}
        </div>
        <div class="student-info">
            <div class="student-name">${estudiante.nombre}</div>
            <div class="student-email">${estudiante.usuario}</div>
        </div>
    `;

    return item;
}

// Setup event listeners
function setupEventListeners() {
    // Back button
    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'Clases.html';
        });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
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
            document.getElementById('createMaterialModal').classList.add('active');
        });
    }

    // Close modals
    setupModalListeners();
    
    // Forms
    setupForms();
}

// Setup modal listeners
function setupModalListeners() {
    const modals = ['createPostModal', 'createTaskModal', 'createMaterialModal'];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.close-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        cancelBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Setup forms
function setupForms() {
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

    // Create material form
    document.getElementById('createMaterialForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await crearMaterial();
    });

    // Material type change handler
    const materialType = document.getElementById('materialType');
    const urlHelp = document.getElementById('urlHelp');
    const urlHelpText = document.getElementById('urlHelpText');
    
    if (materialType && urlHelp && urlHelpText) {
        materialType.addEventListener('change', (e) => {
            const type = e.target.value;
            
            if (type === 'youtube') {
                urlHelp.style.display = 'flex';
                urlHelpText.textContent = 'Pega el enlace de YouTube (ej: https://www.youtube.com/watch?v=VIDEO_ID o https://youtu.be/VIDEO_ID)';
            } else if (type === 'drive') {
                urlHelp.style.display = 'flex';
                urlHelpText.textContent = 'Pega el enlace de Google Drive. Asegúrate de que el archivo tenga permisos de "Cualquier persona con el enlace puede ver"';
            } else if (type === 'link') {
                urlHelp.style.display = 'flex';
                urlHelpText.textContent = 'Pega cualquier enlace web';
            } else {
                urlHelp.style.display = 'none';
            }
        });
    }
}

// Crear anuncio
async function crearAnuncio() {
    try {
        const db = window.firebaseDB;
        const contenido = document.getElementById('postContent').value;

        await db.collection('anuncios').add({
            materia: currentMateria,
            contenido: contenido,
            autorId: currentUser.id,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('createPostModal').classList.remove('active');
        document.getElementById('createPostForm').reset();
        loadAnuncios();

    } catch (error) {
        console.error('Error al crear anuncio:', error);
        alert('Error al crear el anuncio');
    }
}

// Crear tarea
async function crearTarea() {
    try {
        const db = window.firebaseDB;
        const titulo = document.getElementById('taskTitle').value;
        const descripcion = document.getElementById('taskDescription').value;
        const fechaEntrega = new Date(document.getElementById('taskDueDate').value);

        await db.collection('tareas').add({
            materia: currentMateria,
            titulo: titulo,
            descripcion: descripcion,
            fechaEntrega: firebase.firestore.Timestamp.fromDate(fechaEntrega),
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('createTaskModal').classList.remove('active');
        document.getElementById('createTaskForm').reset();
        loadTareas();

    } catch (error) {
        console.error('Error al crear tarea:', error);
        alert('Error al crear la tarea');
    }
}

// Crear material
async function crearMaterial() {
    try {
        const db = window.firebaseDB;
        const titulo = document.getElementById('materialTitle').value;
        const tipo = document.getElementById('materialType').value;
        const url = document.getElementById('materialUrl').value;
        const descripcion = document.getElementById('materialDescription').value;

        await db.collection('materiales').add({
            materia: currentMateria,
            titulo: titulo,
            tipo: tipo,
            url: url,
            descripcion: descripcion,
            fecha: firebase.firestore.FieldValue.serverTimestamp()
        });

        document.getElementById('createMaterialModal').classList.remove('active');
        document.getElementById('createMaterialForm').reset();
        loadMateriales();

    } catch (error) {
        console.error('Error al crear material:', error);
        alert('Error al crear el material');
    }
}

// Eliminar anuncio
async function eliminarAnuncio(id) {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) return;

    try {
        const db = window.firebaseDB;
        await db.collection('anuncios').doc(id).delete();
        loadAnuncios();
    } catch (error) {
        console.error('Error al eliminar anuncio:', error);
        alert('Error al eliminar el anuncio');
    }
}

// Eliminar tarea
async function eliminarTarea(id) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
        const db = window.firebaseDB;
        await db.collection('tareas').doc(id).delete();
        loadTareas();
    } catch (error) {
        console.error('Error al eliminar tarea:', error);
        alert('Error al eliminar la tarea');
    }
}

// Eliminar material
async function eliminarMaterial(id) {
    if (!confirm('¿Estás seguro de eliminar este material?')) return;

    try {
        const db = window.firebaseDB;
        await db.collection('materiales').doc(id).delete();
        loadMateriales();
    } catch (error) {
        console.error('Error al eliminar material:', error);
        alert('Error al eliminar el material');
    }
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
