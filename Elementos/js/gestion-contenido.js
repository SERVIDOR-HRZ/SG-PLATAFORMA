// Gestión de Contenido JavaScript
// ImgBB API Configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

let db;
let currentEditingId = null;
let currentTab = 'carousel';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Initialize Firebase
    initializeFirebase();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial content
    loadCarouselItems();
});

// Check authentication
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.id || currentUser.tipoUsuario !== 'admin') {
        window.location.href = '../index.html';
        return;
    }
    
    if (currentUser.nombre) {
        document.getElementById('userName').textContent = currentUser.nombre.toUpperCase();
    }
}

// Initialize Firebase
async function initializeFirebase() {
    if (!window.firebaseDB) {
        await new Promise(resolve => {
            const check = () => {
                if (window.firebaseDB) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }
    db = window.firebaseDB;
}

// Setup event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });
    
    // Add buttons
    const addCarouselBtn = document.getElementById('addCarouselBtn');
    if (addCarouselBtn) {
        addCarouselBtn.addEventListener('click', () => openCarouselModal());
    }
    
    const addPostBtn = document.getElementById('addPostBtn');
    if (addPostBtn) {
        addPostBtn.addEventListener('click', () => openPostModal());
    }
    
    const addTestimonialBtn = document.getElementById('addTestimonialBtn');
    if (addTestimonialBtn) {
        addTestimonialBtn.addEventListener('click', () => openTestimonialModal());
    }
    
    const addVideoBtn = document.getElementById('addVideoBtn');
    if (addVideoBtn) {
        addVideoBtn.addEventListener('click', () => openVideoModal());
    }
    
    const addSimulacroBtn = document.getElementById('addSimulacroBtn');
    if (addSimulacroBtn) {
        addSimulacroBtn.addEventListener('click', () => openSimulacroModal());
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeAllModals);
    });
    
    // Forms
    const carouselForm = document.getElementById('carouselForm');
    if (carouselForm) {
        carouselForm.addEventListener('submit', handleCarouselSubmit);
    }
    
    const postForm = document.getElementById('postForm');
    if (postForm) {
        postForm.addEventListener('submit', handlePostSubmit);
    }
    
    const testimonialForm = document.getElementById('testimonialForm');
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', handleTestimonialSubmit);
    }
    
    const videoForm = document.getElementById('videoForm');
    if (videoForm) {
        videoForm.addEventListener('submit', handleVideoSubmit);
    }
    
    const simulacroForm = document.getElementById('simulacroForm');
    if (simulacroForm) {
        simulacroForm.addEventListener('submit', handleSimulacroSubmit);
    }
    
    // Badge color change listener
    const badgeColorSelect = document.getElementById('simulacroBadgeColor');
    if (badgeColorSelect) {
        badgeColorSelect.addEventListener('change', function() {
            const customColorGroup = document.getElementById('customColorGroup');
            if (this.value === 'custom') {
                customColorGroup.style.display = 'block';
            } else {
                customColorGroup.style.display = 'none';
            }
        });
    }
    
    // Image uploads
    setupImageUpload('carousel');
    setupImageUpload('post');
    setupImageUpload('simulacro');
}

// Switch tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}-tab`).classList.add('active');
    
    // Load content based on tab
    switch(tab) {
        case 'carousel':
            loadCarouselItems();
            break;
        case 'posts':
            loadPosts();
            break;
        case 'prices':
            loadPrices();
            break;
        case 'testimonials':
            loadTestimonials();
            break;
        case 'videos':
            loadVideos();
            break;
        case 'simulacros':
            loadSimulacros();
            break;
    }
}

// Image upload setup
function setupImageUpload(type) {
    const uploadArea = document.getElementById(`${type}ImageUpload`);
    const input = document.getElementById(`${type}ImageInput`);
    const preview = document.getElementById(`${type}ImagePreview`);
    
    if (!uploadArea || !input || !preview) {
        console.warn(`Image upload elements not found for type: ${type}`);
        return;
    }
    
    uploadArea.addEventListener('click', () => input.click());
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = preview.querySelector('img');
                if (img) {
                    img.src = e.target.result;
                    preview.style.display = 'block';
                    uploadArea.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    const removeBtn = preview.querySelector('.remove-image-btn');
    if (removeBtn) {
        removeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            input.value = '';
            preview.style.display = 'none';
            uploadArea.style.display = 'block';
        });
    }
}

// Upload image to ImgBB
async function uploadImageToImgBB(file) {
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
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
        console.error('Error uploading image:', error);
        alert('Error al subir la imagen. Por favor intenta de nuevo.');
        return null;
    } finally {
        hideLoading();
    }
}

// CAROUSEL FUNCTIONS
async function loadCarouselItems() {
    try {
        const snapshot = await db.collection('carouselItems').get();
        const grid = document.getElementById('carouselGrid');
        grid.innerHTML = '';
        
        // Ordenar en el cliente
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, data: doc.data() });
        });
        items.sort((a, b) => (a.data.orden || 0) - (b.data.orden || 0));
        
        if (items.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay slides en el carrusel</p>';
            return;
        }
        
        items.forEach(item => {
            const cardElement = createCarouselCardElement(item.id, item.data);
            grid.appendChild(cardElement);
        });
    } catch (error) {
        console.error('Error loading carousel:', error);
    }
}

function createCarouselCardElement(id, item) {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    card.innerHTML = `
        <img src="${item.imagen || '../Elementos/img/logo1.png'}" alt="${item.titulo}" class="card-image">
        <h3 class="card-title">${item.titulo}</h3>
        <p class="card-description">${item.descripcion}</p>
        <span class="status-badge ${item.activo ? 'active' : 'inactive'}">
            ${item.activo ? 'Activo' : 'Inactivo'}
        </span>
        <div class="card-actions">
            <button class="btn-icon btn-toggle ${item.activo ? '' : 'inactive'}">
                <i class="bi bi-${item.activo ? 'eye' : 'eye-slash'}"></i>
            </button>
            <button class="btn-icon btn-edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-icon btn-delete">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.btn-edit').addEventListener('click', () => editCarouselItem(id));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteCarouselItem(id));
    card.querySelector('.btn-toggle').addEventListener('click', () => toggleCarouselItem(id, item.activo));
    
    return card;
}

function openCarouselModal(id = null) {
    currentEditingId = id;
    const modal = document.getElementById('carouselModal');
    const form = document.getElementById('carouselForm');
    
    form.reset();
    document.getElementById('carouselImagePreview').style.display = 'none';
    document.getElementById('carouselImageUpload').style.display = 'block';
    
    if (id) {
        document.getElementById('carouselModalTitle').textContent = 'Editar Slide';
        loadCarouselData(id);
    } else {
        document.getElementById('carouselModalTitle').textContent = 'Agregar Slide';
    }
    
    modal.classList.add('active');
}

async function loadCarouselData(id) {
    try {
        const doc = await db.collection('carouselItems').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            console.log('Loading carousel data:', data);
            
            document.getElementById('carouselId').value = id;
            document.getElementById('carouselTitle').value = data.titulo || '';
            document.getElementById('carouselDescription').value = data.descripcion || '';
            document.getElementById('carouselButtonText').value = data.textoBoton || '';
            document.getElementById('carouselButtonLink').value = data.enlaceBoton || '';
            document.getElementById('carouselActive').checked = data.activo !== false;
            
            if (data.imagen) {
                const preview = document.getElementById('carouselImagePreview');
                const img = preview.querySelector('img');
                if (img) {
                    img.src = data.imagen;
                    preview.style.display = 'block';
                    document.getElementById('carouselImageUpload').style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error loading carousel data:', error);
        alert('Error al cargar los datos del slide');
    }
}

function editCarouselItem(id) {
    console.log('Editing carousel item:', id);
    openCarouselModal(id);
}

async function handleCarouselSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('carouselId').value;
    const titulo = document.getElementById('carouselTitle').value;
    const descripcion = document.getElementById('carouselDescription').value;
    const textoBoton = document.getElementById('carouselButtonText').value;
    const enlaceBoton = document.getElementById('carouselButtonLink').value;
    const activo = document.getElementById('carouselActive').checked;
    
    let imagenUrl = null;
    const imageInput = document.getElementById('carouselImageInput');
    
    if (imageInput.files.length > 0) {
        imagenUrl = await uploadImageToImgBB(imageInput.files[0]);
        if (!imagenUrl) return;
    } else if (id) {
        const doc = await db.collection('carouselItems').doc(id).get();
        imagenUrl = doc.data().imagen;
    }
    
    const data = {
        titulo,
        descripcion,
        textoBoton,
        enlaceBoton,
        activo,
        imagen: imagenUrl,
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (id) {
            await db.collection('carouselItems').doc(id).update(data);
        } else {
            const count = await db.collection('carouselItems').get();
            data.orden = count.size;
            data.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('carouselItems').add(data);
        }
        
        closeAllModals();
        loadCarouselItems();
        showNotification('Slide guardado exitosamente');
    } catch (error) {
        console.error('Error saving carousel:', error);
        alert('Error al guardar el slide');
    }
}

async function deleteCarouselItem(id) {
    if (!confirm('¿Estás seguro de eliminar este slide?')) return;
    
    try {
        await db.collection('carouselItems').doc(id).delete();
        loadCarouselItems();
        showNotification('Slide eliminado');
    } catch (error) {
        console.error('Error deleting carousel:', error);
    }
}

async function toggleCarouselItem(id, currentState) {
    try {
        await db.collection('carouselItems').doc(id).update({
            activo: !currentState
        });
        loadCarouselItems();
    } catch (error) {
        console.error('Error toggling carousel:', error);
    }
}

// POSTS FUNCTIONS
async function loadPosts() {
    try {
        const snapshot = await db.collection('publicaciones').orderBy('fecha', 'desc').get();
        const grid = document.getElementById('postsGrid');
        grid.innerHTML = '';
        
        if (snapshot.empty) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay publicaciones</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const post = doc.data();
            const cardElement = createPostCardElement(doc.id, post);
            grid.appendChild(cardElement);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

function createPostCardElement(id, post) {
    const fecha = post.fecha ? new Date(post.fecha.seconds * 1000).toLocaleDateString('es-ES') : 'Sin fecha';
    
    const card = document.createElement('div');
    card.className = 'content-card';
    
    card.innerHTML = `
        <img src="${post.imagen || '../Elementos/img/logo1.png'}" alt="${post.titulo}" class="card-image">
        <h3 class="card-title">${post.titulo}</h3>
        <p class="card-description">${post.contenido.substring(0, 100)}...</p>
        <small style="color: #999;">${fecha}</small>
        <div class="card-actions">
            <button class="btn-icon btn-edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-icon btn-delete">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.btn-edit').addEventListener('click', () => editPost(id));
    card.querySelector('.btn-delete').addEventListener('click', () => deletePost(id));
    
    return card;
}

function openPostModal(id = null) {
    currentEditingId = id;
    const modal = document.getElementById('postModal');
    const form = document.getElementById('postForm');
    
    form.reset();
    document.getElementById('postImagePreview').style.display = 'none';
    document.getElementById('postImageUpload').style.display = 'block';
    
    if (id) {
        document.getElementById('postModalTitle').textContent = 'Editar Publicación';
        loadPostData(id);
    } else {
        document.getElementById('postModalTitle').textContent = 'Nueva Publicación';
    }
    
    modal.classList.add('active');
}

async function loadPostData(id) {
    try {
        const doc = await db.collection('publicaciones').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('postId').value = id;
            document.getElementById('postTitle').value = data.titulo;
            document.getElementById('postContent').value = data.contenido;
            document.getElementById('postCategory').value = data.categoria || '';
            
            if (data.imagen) {
                const preview = document.getElementById('postImagePreview');
                preview.querySelector('img').src = data.imagen;
                preview.style.display = 'block';
                document.getElementById('postImageUpload').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading post data:', error);
    }
}

async function editPost(id) {
    openPostModal(id);
}

async function handlePostSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('postId').value;
    const titulo = document.getElementById('postTitle').value;
    const contenido = document.getElementById('postContent').value;
    const categoria = document.getElementById('postCategory').value;
    
    let imagenUrl = null;
    const imageInput = document.getElementById('postImageInput');
    
    if (imageInput.files.length > 0) {
        imagenUrl = await uploadImageToImgBB(imageInput.files[0]);
        if (!imagenUrl) return;
    } else if (id) {
        const doc = await db.collection('publicaciones').doc(id).get();
        imagenUrl = doc.data().imagen;
    }
    
    const data = {
        titulo,
        contenido,
        categoria,
        imagen: imagenUrl
    };
    
    try {
        if (id) {
            await db.collection('publicaciones').doc(id).update(data);
        } else {
            data.fecha = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('publicaciones').add(data);
        }
        
        closeAllModals();
        loadPosts();
        showNotification('Publicación guardada exitosamente');
    } catch (error) {
        console.error('Error saving post:', error);
        alert('Error al guardar la publicación');
    }
}

async function deletePost(id) {
    if (!confirm('¿Estás seguro de eliminar esta publicación?')) return;
    
    try {
        await db.collection('publicaciones').doc(id).delete();
        loadPosts();
        showNotification('Publicación eliminada');
    } catch (error) {
        console.error('Error deleting post:', error);
    }
}

// PRICES FUNCTIONS
async function loadPrices() {
    const grid = document.getElementById('pricesGrid');
    grid.innerHTML = `
        <div class="price-card">
            <span class="price-badge basic">Básico</span>
            <h3 class="card-title">Simulacro Básico</h3>
            <div class="price-amount" contenteditable="true" data-plan="basico">$50.000 COP</div>
            <button class="btn-primary" onclick="updatePrice('basico')">
                <i class="bi bi-save"></i> Actualizar
            </button>
        </div>
        <div class="price-card featured">
            <span class="price-badge premium">Premium</span>
            <h3 class="card-title">Simulacro Premium</h3>
            <div class="price-amount" contenteditable="true" data-plan="premium">$80.000 COP</div>
            <button class="btn-primary" onclick="updatePrice('premium')">
                <i class="bi bi-save"></i> Actualizar
            </button>
        </div>
        <div class="price-card">
            <span class="price-badge intensive">Intensivo</span>
            <h3 class="card-title">Simulacro Intensivo</h3>
            <div class="price-amount" contenteditable="true" data-plan="intensivo">$65.000 COP</div>
            <button class="btn-primary" onclick="updatePrice('intensivo')">
                <i class="bi bi-save"></i> Actualizar
            </button>
        </div>
    `;
    
    // Load current prices from Firebase
    try {
        const doc = await db.collection('configuracion').doc('precios').get();
        if (doc.exists) {
            const precios = doc.data();
            if (precios.basico) {
                document.querySelector('[data-plan="basico"]').textContent = precios.basico;
            }
            if (precios.premium) {
                document.querySelector('[data-plan="premium"]').textContent = precios.premium;
            }
            if (precios.intensivo) {
                document.querySelector('[data-plan="intensivo"]').textContent = precios.intensivo;
            }
        }
    } catch (error) {
        console.error('Error loading prices:', error);
    }
}

async function updatePrice(plan) {
    const priceElement = document.querySelector(`[data-plan="${plan}"]`);
    const newPrice = priceElement.textContent.trim();
    
    try {
        await db.collection('configuracion').doc('precios').set({
            [plan]: newPrice
        }, { merge: true });
        
        showNotification('Precio actualizado exitosamente');
    } catch (error) {
        console.error('Error updating price:', error);
        alert('Error al actualizar el precio');
    }
}

// Make updatePrice global
window.updatePrice = updatePrice;

// TESTIMONIALS FUNCTIONS
async function loadTestimonials() {
    try {
        const snapshot = await db.collection('testimonios').orderBy('fecha', 'desc').get();
        const grid = document.getElementById('testimonialsGrid');
        grid.innerHTML = '';
        
        if (snapshot.empty) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay testimonios</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const testimonial = doc.data();
            const cardElement = createTestimonialCardElement(doc.id, testimonial);
            grid.appendChild(cardElement);
        });
    } catch (error) {
        console.error('Error loading testimonials:', error);
    }
}

function createTestimonialCardElement(id, testimonial) {
    const stars = '★'.repeat(testimonial.calificacion) + '☆'.repeat(5 - testimonial.calificacion);
    
    const card = document.createElement('div');
    card.className = 'content-card';
    
    card.innerHTML = `
        <div style="color: #ffc107; font-size: 1.5rem; margin-bottom: 0.5rem;">${stars}</div>
        <p class="card-description">"${testimonial.texto}"</p>
        <h4 class="card-title">${testimonial.autor}</h4>
        <div class="card-actions">
            <button class="btn-icon btn-edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-icon btn-delete">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.btn-edit').addEventListener('click', () => editTestimonial(id));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteTestimonial(id));
    
    return card;
}

function openTestimonialModal(id = null) {
    currentEditingId = id;
    const modal = document.getElementById('testimonialModal');
    const form = document.getElementById('testimonialForm');
    
    form.reset();
    
    if (id) {
        document.getElementById('testimonialModalTitle').textContent = 'Editar Testimonio';
        loadTestimonialData(id);
    } else {
        document.getElementById('testimonialModalTitle').textContent = 'Agregar Testimonio';
    }
    
    modal.classList.add('active');
}

async function loadTestimonialData(id) {
    try {
        const doc = await db.collection('testimonios').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('testimonialId').value = id;
            document.getElementById('testimonialAuthor').value = data.autor;
            document.getElementById('testimonialText').value = data.texto;
            document.getElementById('testimonialRating').value = data.calificacion;
        }
    } catch (error) {
        console.error('Error loading testimonial data:', error);
    }
}

async function editTestimonial(id) {
    openTestimonialModal(id);
}

async function handleTestimonialSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('testimonialId').value;
    const autor = document.getElementById('testimonialAuthor').value;
    const texto = document.getElementById('testimonialText').value;
    const calificacion = parseInt(document.getElementById('testimonialRating').value);
    
    const data = {
        autor,
        texto,
        calificacion
    };
    
    try {
        if (id) {
            await db.collection('testimonios').doc(id).update(data);
        } else {
            data.fecha = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('testimonios').add(data);
        }
        
        closeAllModals();
        loadTestimonials();
        showNotification('Testimonio guardado exitosamente');
    } catch (error) {
        console.error('Error saving testimonial:', error);
        alert('Error al guardar el testimonio');
    }
}

async function deleteTestimonial(id) {
    if (!confirm('¿Estás seguro de eliminar este testimonio?')) return;
    
    try {
        await db.collection('testimonios').doc(id).delete();
        loadTestimonials();
        showNotification('Testimonio eliminado');
    } catch (error) {
        console.error('Error deleting testimonial:', error);
    }
}

// UTILITY FUNCTIONS
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showNotification(message) {
    // Simple alert for now, can be enhanced with a toast notification
    alert(message);
}

function handleLogout() {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
        sessionStorage.removeItem('currentUser');
        window.location.href = '../index.html';
    }
}


// VIDEOS FUNCTIONS
async function loadVideos() {
    try {
        const snapshot = await db.collection('videos').get();
        const grid = document.getElementById('videosAdminGrid');
        grid.innerHTML = '';
        
        // Ordenar en el cliente
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, data: doc.data() });
        });
        items.sort((a, b) => (a.data.orden || 0) - (b.data.orden || 0));
        
        if (items.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay videos</p>';
            return;
        }
        
        items.forEach(item => {
            const cardElement = createVideoCardElement(item.id, item.data);
            grid.appendChild(cardElement);
        });
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

function createVideoCardElement(id, video) {
    const card = document.createElement('div');
    card.className = 'content-card';
    
    // Obtener el embed URL del video
    const embedUrl = getVideoEmbedUrl(video.url);
    
    card.innerHTML = `
        <div class="video-card-preview" data-video-url="${video.url}">
            <iframe src="${embedUrl}" allowfullscreen></iframe>
            <div class="video-play-icon">
                <i class="bi bi-play-fill"></i>
            </div>
        </div>
        <h3 class="card-title">${video.titulo}</h3>
        <p class="card-description">${video.descripcion || 'Sin descripción'}</p>
        <span class="status-badge ${video.activo ? 'active' : 'inactive'}">
            ${video.activo ? 'Activo' : 'Inactivo'}
        </span>
        <div class="card-actions">
            <button class="btn-icon btn-toggle ${video.activo ? '' : 'inactive'}">
                <i class="bi bi-${video.activo ? 'eye' : 'eye-slash'}"></i>
            </button>
            <button class="btn-icon btn-edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-icon btn-delete">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.video-card-preview').addEventListener('click', () => openVideoPlayer(video.titulo, video.url));
    card.querySelector('.btn-edit').addEventListener('click', (e) => {
        e.stopPropagation();
        editVideo(id);
    });
    card.querySelector('.btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteVideo(id);
    });
    card.querySelector('.btn-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleVideo(id, video.activo);
    });
    
    return card;
}

function getVideoEmbedUrl(url) {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = extractYouTubeId(url);
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
        const vimeoId = url.split('/').pop();
        return `https://player.vimeo.com/video/${vimeoId}`;
    }
    
    // Si es un enlace directo de video
    return url;
}

function openVideoPlayer(titulo, url) {
    const modal = document.getElementById('videoPlayerModal');
    const titleElement = document.getElementById('videoPlayerTitle');
    const iframe = document.getElementById('videoPlayerIframe');
    
    titleElement.textContent = titulo;
    iframe.src = getVideoEmbedUrl(url) + '?autoplay=1';
    
    modal.classList.add('active');
    
    // Cerrar modal
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => {
        modal.classList.remove('active');
        iframe.src = '';
    };
}

function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function openVideoModal(id = null) {
    currentEditingId = id;
    const modal = document.getElementById('videoModal');
    const form = document.getElementById('videoForm');
    
    form.reset();
    
    if (id) {
        document.getElementById('videoModalTitle').textContent = 'Editar Video';
        loadVideoData(id);
    } else {
        document.getElementById('videoModalTitle').textContent = 'Agregar Video';
    }
    
    modal.classList.add('active');
}

async function loadVideoData(id) {
    try {
        const doc = await db.collection('videos').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            console.log('Loading video data:', data);
            
            document.getElementById('videoId').value = id;
            document.getElementById('videoTitle').value = data.titulo || '';
            document.getElementById('videoDescription').value = data.descripcion || '';
            document.getElementById('videoUrl').value = data.url || '';
            document.getElementById('videoActive').checked = data.activo !== false;
        }
    } catch (error) {
        console.error('Error loading video data:', error);
        alert('Error al cargar los datos del video');
    }
}

function editVideo(id) {
    console.log('Editing video:', id);
    openVideoModal(id);
}

async function handleVideoSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('videoId').value;
    const titulo = document.getElementById('videoTitle').value;
    const descripcion = document.getElementById('videoDescription').value;
    const url = document.getElementById('videoUrl').value;
    const activo = document.getElementById('videoActive').checked;
    
    const data = {
        titulo,
        descripcion,
        url,
        activo,
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (id) {
            await db.collection('videos').doc(id).update(data);
        } else {
            const count = await db.collection('videos').get();
            data.orden = count.size;
            data.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('videos').add(data);
        }
        
        closeAllModals();
        loadVideos();
        showNotification('Video guardado exitosamente');
    } catch (error) {
        console.error('Error saving video:', error);
        alert('Error al guardar el video');
    }
}

async function deleteVideo(id) {
    if (!confirm('¿Estás seguro de eliminar este video?')) return;
    
    try {
        await db.collection('videos').doc(id).delete();
        loadVideos();
        showNotification('Video eliminado');
    } catch (error) {
        console.error('Error deleting video:', error);
    }
}

async function toggleVideo(id, currentState) {
    try {
        await db.collection('videos').doc(id).update({
            activo: !currentState
        });
        loadVideos();
    } catch (error) {
        console.error('Error toggling video:', error);
    }
}

// SIMULACROS FUNCTIONS
async function loadSimulacros() {
    try {
        const snapshot = await db.collection('simulacros').get();
        const grid = document.getElementById('simulacrosGrid');
        grid.innerHTML = '';
        
        // Ordenar en el cliente
        const items = [];
        snapshot.forEach(doc => {
            items.push({ id: doc.id, data: doc.data() });
        });
        items.sort((a, b) => (a.data.orden || 0) - (b.data.orden || 0));
        
        if (items.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay simulacros configurados</p>';
            return;
        }
        
        items.forEach(item => {
            const cardElement = createSimulacroAdminCardElement(item.id, item.data);
            grid.appendChild(cardElement);
        });
    } catch (error) {
        console.error('Error loading simulacros:', error);
    }
}

function createSimulacroAdminCardElement(id, simulacro) {
    const card = document.createElement('div');
    card.className = 'simulacro-admin-card';
    if (simulacro.destacado) {
        card.classList.add('featured');
    }
    
    // Determinar el color del badge
    let badgeClass = 'basic';
    let badgeStyle = '';
    if (simulacro.badgeColor === 'custom' && simulacro.customColor) {
        badgeStyle = `style="background: ${simulacro.customColor};"`;
    } else {
        badgeClass = simulacro.badgeColor || 'basic';
    }
    
    // Determinar el color del precio
    const precioClass = simulacro.precioColor || 'red';
    
    // Crear lista de características
    const caracteristicas = simulacro.caracteristicas || [];
    const caracteristicasHTML = caracteristicas.map(car => 
        `<li><i class="bi bi-check-circle"></i> ${car}</li>`
    ).join('');
    
    // Imagen opcional
    const imagenHTML = simulacro.imagen ? 
        `<img src="${simulacro.imagen}" alt="${simulacro.titulo}" class="simulacro-admin-image">` : '';
    
    card.innerHTML = `
        ${imagenHTML}
        <span class="simulacro-admin-badge ${badgeClass}" ${badgeStyle}>${simulacro.badge}</span>
        <h3 class="simulacro-admin-title">${simulacro.titulo}</h3>
        <p class="simulacro-admin-description">${simulacro.descripcion}</p>
        <ul class="simulacro-admin-features">
            ${caracteristicasHTML}
        </ul>
        <div class="simulacro-admin-price ${precioClass}">${simulacro.precio}</div>
        <span class="status-badge ${simulacro.activo ? 'active' : 'inactive'}">
            ${simulacro.activo ? 'Activo' : 'Inactivo'}
        </span>
        <div class="card-actions">
            <button class="btn-icon btn-toggle ${simulacro.activo ? '' : 'inactive'}">
                <i class="bi bi-${simulacro.activo ? 'eye' : 'eye-slash'}"></i>
            </button>
            <button class="btn-icon btn-edit">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn-icon btn-delete">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;
    
    // Add event listeners
    card.querySelector('.btn-edit').addEventListener('click', () => editSimulacro(id));
    card.querySelector('.btn-delete').addEventListener('click', () => deleteSimulacro(id));
    card.querySelector('.btn-toggle').addEventListener('click', () => toggleSimulacro(id, simulacro.activo));
    
    return card;
}

function openSimulacroModal(id = null) {
    currentEditingId = id;
    const modal = document.getElementById('simulacroModal');
    const form = document.getElementById('simulacroForm');
    
    form.reset();
    document.getElementById('simulacroImagePreview').style.display = 'none';
    document.getElementById('simulacroImageUpload').style.display = 'block';
    document.getElementById('customColorGroup').style.display = 'none';
    
    if (id) {
        document.getElementById('simulacroModalTitle').textContent = 'Editar Simulacro';
        loadSimulacroData(id);
    } else {
        document.getElementById('simulacroModalTitle').textContent = 'Agregar Simulacro';
    }
    
    modal.classList.add('active');
}

async function loadSimulacroData(id) {
    try {
        const doc = await db.collection('simulacros').doc(id).get();
        if (doc.exists) {
            const data = doc.data();
            console.log('Loading simulacro data:', data);
            
            document.getElementById('simulacroId').value = id;
            document.getElementById('simulacroBadge').value = data.badge || '';
            document.getElementById('simulacroBadgeColor').value = data.badgeColor || 'basic';
            document.getElementById('simulacroTitulo').value = data.titulo || '';
            document.getElementById('simulacroDescripcion').value = data.descripcion || '';
            document.getElementById('simulacroPrecio').value = data.precio || '';
            document.getElementById('simulacroPrecioColor').value = data.precioColor || 'red';
            document.getElementById('simulacroDestacado').checked = data.destacado || false;
            document.getElementById('simulacroActivo').checked = data.activo !== false;
            
            // Características
            if (data.caracteristicas && Array.isArray(data.caracteristicas)) {
                document.getElementById('simulacroCaracteristicas').value = data.caracteristicas.join('\n');
            }
            
            // Color personalizado
            if (data.badgeColor === 'custom') {
                document.getElementById('customColorGroup').style.display = 'block';
                document.getElementById('simulacroCustomColor').value = data.customColor || '#ff0000';
            }
            
            // Imagen
            if (data.imagen) {
                const preview = document.getElementById('simulacroImagePreview');
                const img = preview.querySelector('img');
                if (img) {
                    img.src = data.imagen;
                    preview.style.display = 'block';
                    document.getElementById('simulacroImageUpload').style.display = 'none';
                }
            }
        }
    } catch (error) {
        console.error('Error loading simulacro data:', error);
        alert('Error al cargar los datos del simulacro');
    }
}

function editSimulacro(id) {
    console.log('Editing simulacro:', id);
    openSimulacroModal(id);
}

async function handleSimulacroSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('simulacroId').value;
    const badge = document.getElementById('simulacroBadge').value;
    const badgeColor = document.getElementById('simulacroBadgeColor').value;
    const customColor = document.getElementById('simulacroCustomColor').value;
    const titulo = document.getElementById('simulacroTitulo').value;
    const descripcion = document.getElementById('simulacroDescripcion').value;
    const precio = document.getElementById('simulacroPrecio').value;
    const precioColor = document.getElementById('simulacroPrecioColor').value;
    const destacado = document.getElementById('simulacroDestacado').checked;
    const activo = document.getElementById('simulacroActivo').checked;
    
    // Procesar características
    const caracteristicasText = document.getElementById('simulacroCaracteristicas').value;
    const caracteristicas = caracteristicasText.split('\n').filter(line => line.trim() !== '');
    
    let imagenUrl = null;
    const imageInput = document.getElementById('simulacroImageInput');
    
    if (imageInput.files.length > 0) {
        imagenUrl = await uploadImageToImgBB(imageInput.files[0]);
        if (!imagenUrl) return;
    } else if (id) {
        const doc = await db.collection('simulacros').doc(id).get();
        imagenUrl = doc.data().imagen || null;
    }
    
    const data = {
        badge,
        badgeColor,
        titulo,
        descripcion,
        caracteristicas,
        precio,
        precioColor,
        destacado,
        activo,
        imagen: imagenUrl,
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    if (badgeColor === 'custom') {
        data.customColor = customColor;
    }
    
    try {
        if (id) {
            await db.collection('simulacros').doc(id).update(data);
        } else {
            const count = await db.collection('simulacros').get();
            data.orden = count.size;
            data.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('simulacros').add(data);
        }
        
        closeAllModals();
        loadSimulacros();
        showNotification('Simulacro guardado exitosamente');
    } catch (error) {
        console.error('Error saving simulacro:', error);
        alert('Error al guardar el simulacro');
    }
}

async function deleteSimulacro(id) {
    if (!confirm('¿Estás seguro de eliminar este simulacro?')) return;
    
    try {
        await db.collection('simulacros').doc(id).delete();
        loadSimulacros();
        showNotification('Simulacro eliminado');
    } catch (error) {
        console.error('Error deleting simulacro:', error);
    }
}

async function toggleSimulacro(id, currentState) {
    try {
        await db.collection('simulacros').doc(id).update({
            activo: !currentState
        });
        loadSimulacros();
    } catch (error) {
        console.error('Error toggling simulacro:', error);
    }
}
