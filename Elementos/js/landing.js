// Carousel functionality
let currentSlide = 0;
let slides = [];
let totalSlides = 0;
let indicators = [];
let carouselData = [];

// Load carousel from Firebase
async function loadCarouselFromFirebase() {
    try {
        const db = firebase.firestore();
        // Cargar todos los items y filtrar en el cliente para evitar error de índice
        const snapshot = await db.collection('carouselItems').get();

        console.log('Carousel snapshot:', snapshot.size, 'items');

        if (!snapshot.empty) {
            carouselData = [];

            // Filtrar items activos y ordenar en el cliente
            const items = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.activo === true) {
                    items.push(data);
                }
            });

            // Ordenar por orden
            items.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            carouselData = items;

            console.log('Carousel data loaded:', carouselData);

            // Update carousel HTML
            const carouselInner = document.querySelector('.carousel-inner');
            if (!carouselInner) {
                console.error('Carousel inner not found');
                return;
            }

            // Limpiar completamente el carrusel
            carouselInner.innerHTML = '';
            console.log('Carousel cleared, adding', carouselData.length, 'slides');

            carouselData.forEach((item, index) => {
                console.log(`Creating slide ${index}:`, {
                    titulo: item.titulo,
                    imagen: item.imagen,
                    activo: item.activo
                });

                const slideDiv = document.createElement('div');
                slideDiv.className = `carousel-item ${index === 0 ? 'active' : ''}`;

                // Set background image with proper styling
                if (item.imagen && item.imagen.trim() !== '') {
                    // Limpiar la URL de la imagen
                    const imageUrl = item.imagen.trim();
                    slideDiv.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("${imageUrl}")`;
                    slideDiv.style.backgroundSize = 'cover';
                    slideDiv.style.backgroundPosition = 'center';
                    slideDiv.style.backgroundRepeat = 'no-repeat';
                    console.log(`Slide ${index} background set to:`, imageUrl);
                } else {
                    slideDiv.style.backgroundImage = 'linear-gradient(135deg, #000000 0%, #8B0000 50%, #DC143C 100%)';
                    console.warn(`Slide ${index} has no image, using gradient`);
                }

                slideDiv.innerHTML = `
                    <div class="carousel-content">
                        <h1>${item.titulo || 'Sin título'}</h1>
                        <p>${item.descripcion || ''}</p>
                        ${item.textoBoton ? `<a href="${item.enlaceBoton || '#'}" class="btn-primary">${item.textoBoton}</a>` : ''}
                    </div>
                `;
                carouselInner.appendChild(slideDiv);
            });

            console.log('Carousel HTML updated');
        } else {
            console.log('No active carousel items found');
            // Si no hay items, crear un slide por defecto
            const carouselInner = document.querySelector('.carousel-inner');
            if (carouselInner) {
                carouselInner.innerHTML = `
                    <div class="carousel-item active">
                        <div class="carousel-content">
                            <h1>Bienvenido a <span class="highlight-text">Seamos Genios</span></h1>
                            <p>Tu plataforma educativa para alcanzar el éxito en el ICFES</p>
                            <a href="#simulacro" class="btn-primary">Explorar Simulacros</a>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading carousel:', error);
        // En caso de error, mostrar slide por defecto
        const carouselInner = document.querySelector('.carousel-inner');
        if (carouselInner) {
            carouselInner.innerHTML = `
                <div class="carousel-item active">
                    <div class="carousel-content">
                        <h1>Bienvenido a <span class="highlight-text">Seamos Genios</span></h1>
                        <p>Tu plataforma educativa para alcanzar el éxito en el ICFES</p>
                        <a href="#simulacro" class="btn-primary">Explorar Simulacros</a>
                    </div>
                </div>
            `;
        }
    }

    // Initialize carousel after loading
    initializeCarousel();
}

function initializeCarousel() {
    slides = document.querySelectorAll('.carousel-item');
    totalSlides = slides.length;

    console.log('Initializing carousel with', totalSlides, 'slides');

    if (totalSlides === 0) {
        console.warn('No slides found to initialize');
        return;
    }

    // Create indicators
    const indicatorsContainer = document.getElementById('carouselIndicators');
    if (!indicatorsContainer) {
        console.error('Indicators container not found');
        return;
    }

    indicatorsContainer.innerHTML = '';

    for (let i = 0; i < totalSlides; i++) {
        const indicator = document.createElement('div');
        indicator.classList.add('carousel-indicator');
        if (i === 0) indicator.classList.add('active');
        indicator.addEventListener('click', () => goToSlide(i));
        indicatorsContainer.appendChild(indicator);
    }

    indicators = document.querySelectorAll('.carousel-indicator');

    // Setup auto-advance
    setupAutoAdvance();

    console.log('Carousel initialized successfully');
}

// Setup auto-advance carousel
let autoSlideInterval;

function setupAutoAdvance() {
    // Clear any existing interval
    if (autoSlideInterval) {
        clearInterval(autoSlideInterval);
    }

    // Start auto-advance
    autoSlideInterval = setInterval(nextSlide, 5000);
}

function resetAutoSlide() {
    setupAutoAdvance();
}

function showSlide(n) {
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));

    currentSlide = (n + totalSlides) % totalSlides;

    slides[currentSlide].classList.add('active');
    indicators[currentSlide].classList.add('active');
}

function nextSlide() {
    showSlide(currentSlide + 1);
}

function prevSlide() {
    showSlide(currentSlide - 1);
}

function goToSlide(n) {
    showSlide(n);
}

// Auto advance carousel
// Setup carousel controls after DOM is loaded
function setupCarouselControls() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            resetAutoSlide();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            resetAutoSlide();
        });
    }
}

// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');

function toggleMenu() {
    navMenu.classList.toggle('active');
    menuToggle.classList.toggle('active');
    mobileMenuOverlay.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
}

function closeMenu() {
    navMenu.classList.remove('active');
    menuToggle.classList.remove('active');
    mobileMenuOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

menuToggle.addEventListener('click', toggleMenu);
mobileMenuOverlay.addEventListener('click', closeMenu);

// Close menu when clicking on a link
document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Posts functionality with Firebase
const db = firebase.firestore();
const auth = firebase.auth();
let currentUser = null;

// Check authentication state
auth.onAuthStateChanged((user) => {
    currentUser = user;
    updateLoginButton();
});

// Check session storage for logged in user
function checkUserSession() {
    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            currentUser = user;
            updateLoginButton();
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Update login button based on session
function updateLoginButton() {
    const btnLogin = document.getElementById('btnLogin');
    if (!btnLogin) return;

    const userData = sessionStorage.getItem('currentUser');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            btnLogin.textContent = 'Ir al Panel';
            btnLogin.onclick = (e) => {
                e.preventDefault();
                if (user.tipoUsuario === 'admin') {
                    window.location.href = 'Secciones/Panel_Admin.html';
                } else {
                    window.location.href = 'Secciones/Panel_Estudiantes.html';
                }
            };
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Check session on page load
checkUserSession();

// Wait for Firebase to be ready and load content
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (typeof firebase !== 'undefined' && firebase.firestore) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Load all dynamic content when page loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM loaded, initializing...');

    // Setup carousel controls first
    setupCarouselControls();

    // Wait for Firebase and load content
    await waitForFirebase();
    console.log('Firebase ready');

    await loadCarouselFromFirebase();
    await loadPosts();
    await loadSimulacrosFromFirebase();
    await loadTestimonialsFromFirebase();
    await loadVideosFromFirebase();

    console.log('All content loaded');
});

// Load posts from Firebase
async function loadPosts() {
    const postsGrid = document.getElementById('postsGrid');
    postsGrid.innerHTML = '';

    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('publicaciones')
            .orderBy('fecha', 'desc')
            .limit(6)
            .get();

        if (snapshot.empty) {
            postsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">No hay publicaciones disponibles</p>';
            return;
        }

        snapshot.forEach(doc => {
            const post = {
                id: doc.id,
                ...doc.data(),
                likes: 0,
                comments: 0
            };
            const postCard = createPostCard(post);
            postsGrid.appendChild(postCard);
        });
    } catch (error) {
        console.error('Error loading posts:', error);
        postsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #666;">Error al cargar publicaciones</p>';
    }
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.classList.add('post-card');

    const isLiked = false; // Check if user has liked this post
    const imagen = post.imagen || post.image || 'Elementos/img/logo1.png';
    const titulo = post.titulo || post.title || 'Sin título';
    const contenido = post.contenido || post.content || '';

    card.innerHTML = `
        <img src="${imagen}" alt="${titulo}" class="post-image">
        <div class="post-content">
            <h3>${titulo}</h3>
            <p>${contenido.substring(0, 150)}${contenido.length > 150 ? '...' : ''}</p>
            <div class="post-actions">
                <div class="post-action ${isLiked ? 'liked' : ''}" data-post-id="${post.id}" onclick="handleLike('${post.id}')">
                    <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
                    <span>${post.likes || 0}</span>
                </div>
                <div class="post-action" onclick="openPostModal('${post.id}')">
                    <i class="bi bi-chat"></i>
                    <span>${post.comments || 0}</span>
                </div>
            </div>
        </div>
    `;

    return card;
}

function handleLike(postId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para dar like');
        window.location.href = 'Secciones/login.html';
        return;
    }

    // Toggle like functionality
    const postAction = document.querySelector(`[data-post-id="${postId}"]`);
    const icon = postAction.querySelector('i');
    const likeCount = postAction.querySelector('span');

    if (postAction.classList.contains('liked')) {
        postAction.classList.remove('liked');
        icon.classList.remove('bi-heart-fill');
        icon.classList.add('bi-heart');
        likeCount.textContent = parseInt(likeCount.textContent) - 1;
    } else {
        postAction.classList.add('liked');
        icon.classList.remove('bi-heart');
        icon.classList.add('bi-heart-fill');
        likeCount.textContent = parseInt(likeCount.textContent) + 1;
    }

    // Save to Firebase
    // db.collection('postLikes').doc(`${currentUser.uid}_${postId}`).set({...})
}

async function openPostModal(postId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para comentar');
        window.location.href = 'Secciones/login.html';
        return;
    }

    try {
        const db = firebase.firestore();
        const doc = await db.collection('publicaciones').doc(postId).get();

        if (!doc.exists) {
            alert('Publicación no encontrada');
            return;
        }

        const post = doc.data();
        const modal = document.getElementById('postModal');
        const modalContent = document.getElementById('modalPostContent');

        modalContent.innerHTML = `
            <h2>${post.titulo}</h2>
            <img src="${post.imagen || 'Elementos/img/logo1.png'}" alt="${post.titulo}" style="width: 100%; border-radius: 10px; margin: 1rem 0;">
            <p>${post.contenido}</p>
            <div style="margin-top: 2rem;">
                <h3>Comentarios</h3>
                <div id="commentsSection" style="margin-top: 1rem;">
                    <p style="color: #666;">No hay comentarios aún. ¡Sé el primero en comentar!</p>
                </div>
                <div style="margin-top: 1.5rem;">
                    <textarea id="commentInput" placeholder="Escribe tu comentario..." style="width: 100%; padding: 1rem; border: 2px solid #ddd; border-radius: 10px; min-height: 100px; font-family: inherit;"></textarea>
                    <button onclick="submitComment('${postId}')" style="margin-top: 1rem; background: linear-gradient(135deg, #DC143C, #8B0000); color: white; padding: 0.7rem 2rem; border: none; border-radius: 25px; cursor: pointer; font-weight: 600;">Publicar Comentario</button>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    } catch (error) {
        console.error('Error loading post:', error);
        alert('Error al cargar la publicación');
    }
}

function submitComment(postId) {
    const commentInput = document.getElementById('commentInput');
    const comment = commentInput.value.trim();

    if (!comment) {
        alert('Por favor escribe un comentario');
        return;
    }

    // Save comment to Firebase
    // db.collection('comments').add({...})

    alert('Comentario publicado exitosamente');
    commentInput.value = '';
    document.getElementById('postModal').style.display = 'none';
}

// Close modal
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('postModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('postModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(section);
});

// Header scroll effect
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        header.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
    }

    lastScroll = currentScroll;
});

console.log('Landing page loaded successfully');


// Ranking Data with Pagination
const rankingData = [
    { nombre: "THOMAS ALEJANDRO LÓPEZ GODOY", municipio: "Aguazul - Casanare", matematicas: 100, lectura: 100, sociales: 83, ciencias: 100, ingles: 100, total: 480 },
    { nombre: "SANTIAGO ANDRÉS CAMACHO VEGA", municipio: "Bucaramanga - Santander", matematicas: 100, lectura: 100, sociales: 100, ciencias: 81, ingles: 100, total: 478 },
    { nombre: "CARLOS ORLANDO RUIZ ORTIZ", municipio: "Popayán - Cauca", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 100, total: 477 },
    { nombre: "LICETH DANIELA CALDERÓN SAMBONI", municipio: "San Agustín - Huila", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 100, total: 477 },
    { nombre: "DIEGO ALEJANDRO URBANO", municipio: "Aguachica - Cesar", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 100, total: 477 },
    { nombre: "NANCY MILEIDY PUENTES MONROY", municipio: "Ibagué - Tolima", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 100, total: 477 },
    { nombre: "ADRIANA ESTEFANIA MAYA MAYA", municipio: "Túquerres - Nariño", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 100, total: 477 },
    { nombre: "HELLEN DANIELA MANTILLA CORZO", municipio: "Bucaramanga - Santander", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 100, total: 477 },
    { nombre: "CRISTHIAN YESID COLINA CARDENAS", municipio: "Aguazul - Casanare", matematicas: 100, lectura: 100, sociales: 76, ciencias: 100, ingles: 100, total: 472 },
    { nombre: "JOSEPH ALEXANDER PABON ACOSTA", municipio: "Cali - Valle del Cauca", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 83, total: 470 },
    { nombre: "ILSER URREA MORENO", municipio: "Florencia - Caquetá", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 78, total: 468 },
    { nombre: "VALENTINA RODRIGUEZ LOPEZ", municipio: "Barranquilla - Atlántico", matematicas: 100, lectura: 100, sociales: 100, ciencias: 79, ingles: 77, total: 467 },
    { nombre: "ANTONELLA MATEUS BURGOS", municipio: "Barranquilla - Atlántico", matematicas: 100, lectura: 100, sociales: 76, ciencias: 100, ingles: 85, total: 467 },
    { nombre: "GUSTAVO CHANTRE RIVERA", municipio: "Popayán - Cauca", matematicas: 100, lectura: 80, sociales: 100, ciencias: 100, ingles: 68, total: 465 },
    { nombre: "MARIO RICARDO URUETA ESPAÑA", municipio: "Cartagena de Indias - Bolívar", matematicas: 100, lectura: 80, sociales: 83, ciencias: 100, ingles: 100, total: 457 },
    { nombre: "VALENTINA ARCINIEGAS ZAPATA", municipio: "La Tebaida - Quindío", matematicas: 100, lectura: 100, sociales: 80, ciencias: 81, ingles: 100, total: 455 },
    { nombre: "LUCY CATALINA SAMBONI ARTUNDUAGA", municipio: "Bogotá D.C.", matematicas: 100, lectura: 80, sociales: 81, ciencias: 100, ingles: 100, total: 455 },
    { nombre: "KEVIN DARIO SANCHEZ JAIMES", municipio: "Bucaramanga - Santander", matematicas: 100, lectura: 100, sociales: 83, ciencias: 81, ingles: 86, total: 453 },
    { nombre: "VALENTINA OCAMPO ORDOÑEZ", municipio: "Palmira - Valle del Cauca", matematicas: 100, lectura: 80, sociales: 100, ciencias: 79, ingles: 100, total: 453 },
    { nombre: "MARIA JOSÉ ERAZO TORRES", municipio: "Armenia - Quindío", matematicas: 100, lectura: 79, sociales: 82, ciencias: 100, ingles: 82, total: 448 },
    { nombre: "JOHAN SAMUEL LOZANO MORALES", municipio: "Armenia - Quindío", matematicas: 86, lectura: 100, sociales: 76, ciencias: 100, ingles: 79, total: 448 },
    { nombre: "PAULA SOFÍA LOPEZ GARCÍA", municipio: "Sogamoso - Boyacá", matematicas: 79, lectura: 82, sociales: 100, ciencias: 100, ingles: 79, total: 447 },
    { nombre: "PEDRO IGNACIO BERNAL ORDUZ", municipio: "Duitama - Boyacá", matematicas: 100, lectura: 80, sociales: 73, ciencias: 100, ingles: 100, total: 446 },
    { nombre: "JHOSEP HERNEY VARGAS VARGAS", municipio: "Aguachica - Cesar", matematicas: 100, lectura: 78, sociales: 79, ciencias: 100, ingles: 81, total: 443 },
    { nombre: "JOEL ANDRES PASTOR MORALES", municipio: "Sincelejo - Sucre", matematicas: 100, lectura: 100, sociales: 73, ciencias: 80, ingles: 84, total: 440 },
    { nombre: "ANGIE SOFÍA GRANADOS OCHOA", municipio: "Piedecuesta - Santander", matematicas: 80, lectura: 76, sociales: 100, ciencias: 100, ingles: 75, total: 440 },
    { nombre: "VALERIA OCAMPO SERPA", municipio: "Turbaco - Bolívar", matematicas: 100, lectura: 76, sociales: 76, ciencias: 100, ingles: 84, total: 438 },
    { nombre: "VALERIE JULIETTE ARDILA GUTIERREZ", municipio: "Bucaramanga - Santander", matematicas: 83, lectura: 100, sociales: 82, ciencias: 79, ingles: 100, total: 435 },
    { nombre: "SEBASTIAN MARTÍNEZ PIAMBA", municipio: "Jamundí - Valle del Cauca", matematicas: 84, lectura: 79, sociales: 100, ciencias: 79, ingles: 100, total: 433 },
    { nombre: "BELLAIRIS GIRALDO SALAZAR", municipio: "Barrancabermeja - Santander", matematicas: 85, lectura: 81, sociales: 100, ciencias: 82, ingles: 81, total: 433 },
    { nombre: "SHARLENE TAPIA RODRÍGUEZ", municipio: "Sahagún - Córdoba", matematicas: 79, lectura: 77, sociales: 100, ciencias: 81, ingles: 100, total: 427 },
    { nombre: "LUIS SANTIAGO DE BRIGARD DE LA HOZ", municipio: "Valledupar - Cesar", matematicas: 85, lectura: 79, sociales: 100, ciencias: 80, ingles: 73, total: 425 },
    { nombre: "DANIELA SILVA MIRANDA", municipio: "Sabanagrande - Atlántico", matematicas: 80, lectura: 82, sociales: 100, ciencias: 79, ingles: 82, total: 425 },
    { nombre: "CHIUDACCHANG COLLAZOS TRUJILLO", municipio: "Santander De Quilichao - Cauca", matematicas: 86, lectura: 76, sociales: 80, ciencias: 100, ingles: 79, total: 425 },
    { nombre: "DANNA SOFIA BUITRON VASQUEZ", municipio: "Popayán - Cauca", matematicas: 82, lectura: 100, sociales: 80, ciencias: 78, ingles: 79, total: 423 },
    { nombre: "MARÍA FERNANDA ÁVILA BENITO REVOLLO", municipio: "Sincelejo - Sucre", matematicas: 80, lectura: 81, sociales: 100, ciencias: 78, ingles: 78, total: 421 },
    { nombre: "DARLY SARAY PÉREZ JAIMES", municipio: "Bucaramanga - Santander", matematicas: 100, lectura: 80, sociales: 77, ciencias: 74, ingles: 100, total: 420 },
    { nombre: "LUIS DAVID RECALDE CASTELLANOS", municipio: "Bogotá D.C.", matematicas: 100, lectura: 80, sociales: 76, ciencias: 80, ingles: 85, total: 420 },
    { nombre: "BELEN PAULINA PALACIOS PALACIOS", municipio: "Cuaspud - Nariño", matematicas: 100, lectura: 80, sociales: 79, ciencias: 78, ingles: 81, total: 420 },
    { nombre: "MARÍA ISABEL GARCÍA NOVA", municipio: "Bucaramanga - Santander", matematicas: 82, lectura: 100, sociales: 77, ciencias: 79, ingles: 78, total: 420 },
    { nombre: "JERONIMO OSORIO DIETES", municipio: "Yopal - Casanare", matematicas: 83, lectura: 77, sociales: 100, ciencias: 76, ingles: 82, total: 419 },
    { nombre: "JHEAN CARLOS MARÍN LEÓN", municipio: "Cali - Valle del Cauca", matematicas: 100, lectura: 80, sociales: 83, ciencias: 77, ingles: 66, total: 418 },
    { nombre: "BRAYAN JAVIER CHINGAL INGUILAN", municipio: "Pasto - Nariño", matematicas: 84, lectura: 80, sociales: 81, ciencias: 81, ingles: 100, total: 415 },
    { nombre: "WILBERT GABRIEL CÁCERES GONZÁLEZ", municipio: "Chinácota - Norte de Santander", matematicas: 85, lectura: 74, sociales: 73, ciencias: 100, ingles: 79, total: 413 },
    { nombre: "EMANUEL AGUILAR OSPINA", municipio: "Calarcá - Quindío", matematicas: 100, lectura: 73, sociales: 76, ciencias: 81, ingles: 74, total: 409 },
    { nombre: "ISABELLA MARTÍNEZ ALMANZA", municipio: "Cereté - Córdoba", matematicas: 75, lectura: 71, sociales: 100, ciencias: 74, ingles: 100, total: 408 },
    { nombre: "THOMAS LOPEZ MANCERA", municipio: "Cúcuta - Norte de Santander", matematicas: 100, lectura: 74, sociales: 78, ciencias: 75, ingles: 75, total: 406 },
    { nombre: "ÁNGELA SOFÍA DÍAZ JARABA", municipio: "Sahagún - Córdoba", matematicas: 100, lectura: 74, sociales: 74, ciencias: 77, ingles: 73, total: 404 },
    { nombre: "JUAN DAVID GARZON CASTILLO", municipio: "Chocontá - Cundinamarca", matematicas: 100, lectura: 72, sociales: 74, ciencias: 77, ingles: 76, total: 402 },
    { nombre: "ANGHELO CORRALES GAMBOA", municipio: "Armenia - Quindío", matematicas: 100, lectura: 75, sociales: 68, ciencias: 77, ingles: 83, total: 401 },
    { nombre: "LAURA YISETH VALDERRAMA CARREÑO", municipio: "Duitama - Boyacá", matematicas: 85, lectura: 82, sociales: 77, ciencias: 74, ingles: 84, total: 399 }
];

let currentPage = 1;
const rowsPerPage = 10;
const totalPages = Math.ceil(rankingData.length / rowsPerPage);

function loadRankingTable(page) {
    const tbody = document.getElementById('rankingTableBody');
    tbody.innerHTML = '';

    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = rankingData.slice(start, end);

    pageData.forEach((student, index) => {
        const position = start + index + 1;
        const row = document.createElement('tr');

        let rankClass = '';
        let badgeHTML = '';

        if (position === 1) {
            rankClass = 'top-1';
            badgeHTML = `<div class="rank-badge gold"><i class="bi bi-trophy-fill"></i><span>${position}</span></div>`;
        } else if (position === 2) {
            rankClass = 'top-2';
            badgeHTML = `<div class="rank-badge silver"><i class="bi bi-trophy-fill"></i><span>${position}</span></div>`;
        } else if (position === 3) {
            rankClass = 'top-3';
            badgeHTML = `<div class="rank-badge bronze"><i class="bi bi-trophy-fill"></i><span>${position}</span></div>`;
        } else {
            badgeHTML = `<div class="rank-number">${position}</div>`;
        }

        row.className = `rank-row ${rankClass}`;
        row.innerHTML = `
            <td class="rank-position">${badgeHTML}</td>
            <td class="student-name">${student.nombre}</td>
            <td>${student.municipio}</td>
            <td>${student.matematicas}</td>
            <td>${student.lectura}</td>
            <td>${student.sociales}</td>
            <td>${student.ciencias}</td>
            <td>${student.ingles}</td>
            <td class="total-score"><strong>${student.total}</strong></td>
        `;

        tbody.appendChild(row);
    });

    // Update pagination info
    document.getElementById('paginationInfo').textContent = `Página ${page} de ${totalPages}`;

    // Update button states
    document.getElementById('prevPage').disabled = page === 1;
    document.getElementById('nextPage').disabled = page === totalPages;
}

// Pagination event listeners
document.getElementById('prevPage').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        loadRankingTable(currentPage);
    }
});

document.getElementById('nextPage').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage++;
        loadRankingTable(currentPage);
    }
});

// Load initial ranking data
loadRankingTable(currentPage);


// Load simulacros from Firebase
async function loadSimulacrosFromFirebase() {
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('simulacros').get();

        if (!snapshot.empty) {
            const simulacroGrid = document.querySelector('.simulacro-grid');
            if (!simulacroGrid) {
                console.warn('Simulacro grid not found');
                return;
            }

            simulacroGrid.innerHTML = '';

            // Filtrar simulacros activos y ordenar
            const simulacros = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.activo === true) {
                    simulacros.push(data);
                }
            });

            // Ordenar por orden
            simulacros.sort((a, b) => (a.orden || 0) - (b.orden || 0));

            simulacros.forEach(simulacro => {
                const card = document.createElement('div');
                card.className = 'simulacro-card';
                if (simulacro.destacado) {
                    card.classList.add('featured');
                }

                // Determinar el color del badge
                let badgeClass = 'basic';
                let badgeStyle = '';
                if (simulacro.badgeColor === 'custom' && simulacro.customColor) {
                    badgeStyle = `style="background: ${simulacro.customColor};"`;
                } else {
                    const badgeColorMap = {
                        'basic': '',
                        'premium': 'gold',
                        'intensive': '',
                        'custom': ''
                    };
                    badgeClass = badgeColorMap[simulacro.badgeColor] || '';
                }

                // Determinar el color del precio
                const precioColorMap = {
                    'red': '',
                    'gold': 'featured-price',
                    'blue': 'blue-price',
                    'green': 'green-price'
                };
                const precioClass = precioColorMap[simulacro.precioColor] || '';

                // Crear lista de características
                const caracteristicas = simulacro.caracteristicas || [];
                const caracteristicasHTML = caracteristicas.map(car =>
                    `<li><i class="bi bi-check-circle"></i> ${car}</li>`
                ).join('');

                // Imagen opcional
                const imagenHTML = simulacro.imagen ?
                    `<img src="${simulacro.imagen}" alt="${simulacro.titulo}" class="simulacro-image">` : '';

                card.innerHTML = `
                    ${imagenHTML}
                    <div class="simulacro-badge ${badgeClass}" ${badgeStyle}>${simulacro.badge}</div>
                    <h3>${simulacro.titulo}</h3>
                    <p>${simulacro.descripcion}</p>
                    <ul>
                        ${caracteristicasHTML}
                    </ul>
                    <div class="price-tag ${precioClass}" style="cursor: pointer;">${simulacro.precio}</div>
                `;

                // Agregar evento click al precio para WhatsApp
                const priceTag = card.querySelector('.price-tag');
                priceTag.addEventListener('click', () => {
                    contactarWhatsApp(simulacro);
                });

                simulacroGrid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading simulacros:', error);
    }
}

// Load testimonials from Firebase
async function loadTestimonialsFromFirebase() {
    try {
        const db = firebase.firestore();
        const snapshot = await db.collection('testimonios')
            .orderBy('fecha', 'desc')
            .limit(3)
            .get();

        if (!snapshot.empty) {
            const testimonialsGrid = document.querySelector('.testimonials-grid');
            testimonialsGrid.innerHTML = '';

            snapshot.forEach(doc => {
                const testimonial = doc.data();
                const stars = Array(testimonial.calificacion).fill('<i class="bi bi-star-fill"></i>').join('');

                const card = document.createElement('div');
                card.className = 'testimonial-card';
                card.innerHTML = `
                    <div class="testimonial-stars">
                        ${stars}
                    </div>
                    <p>"${testimonial.texto}"</p>
                    <div class="testimonial-author">
                        <strong>${testimonial.autor}</strong>
                        <span>Estudiante</span>
                    </div>
                `;
                testimonialsGrid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading testimonials:', error);
    }
}

// Load videos from Firebase
async function loadVideosFromFirebase() {
    try {
        const db = firebase.firestore();
        // Cargar todos y filtrar en el cliente para evitar error de índice
        const snapshot = await db.collection('videos').get();

        if (!snapshot.empty) {
            const videosGrid = document.querySelector('.videos-grid');
            videosGrid.innerHTML = '';

            // Filtrar videos activos y ordenar
            const videos = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.activo === true) {
                    videos.push(data);
                }
            });

            // Ordenar y limitar a 6
            videos.sort((a, b) => (a.orden || 0) - (b.orden || 0));
            const limitedVideos = videos.slice(0, 6);

            limitedVideos.forEach(video => {
                const card = document.createElement('div');
                card.className = 'video-card';
                card.style.cursor = 'pointer';

                // Get video thumbnail
                let thumbnailUrl = video.thumbnail;
                let videoId = null;

                // Check if it's a YouTube URL
                if (video.url && (video.url.includes('youtube.com') || video.url.includes('youtu.be'))) {
                    videoId = extractYouTubeId(video.url);
                    if (videoId && !thumbnailUrl) {
                        thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    }
                }

                // Create thumbnail with play button
                const videoContent = `
                    <div class="video-thumbnail" style="background-image: url('${thumbnailUrl || 'https://via.placeholder.com/640x360/8B0000/FFFFFF?text=Video'}');">
                        <div class="video-play-overlay">
                            <i class="bi bi-play-circle-fill"></i>
                        </div>
                    </div>
                `;

                card.innerHTML = `
                    ${videoContent}
                    <div class="video-info">
                        <h4>${video.titulo}</h4>
                        ${video.descripcion ? `<p>${video.descripcion}</p>` : ''}
                    </div>
                `;

                // Add click event to open modal
                card.addEventListener('click', () => {
                    openVideoModal(video);
                });

                videosGrid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Error loading videos:', error);
    }
}

// Extract YouTube video ID from URL
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Extract Google Drive video ID
function extractDriveId(url) {
    const regExp = /\/file\/d\/([^\/]+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}

// Open video in modal
function openVideoModal(video) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('videoPlayerModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'videoPlayerModal';
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-content">
                <button class="video-modal-close">&times;</button>
                <div class="video-modal-body">
                    <div id="videoPlayerContainer"></div>
                    <div class="video-modal-info">
                        <h3 id="videoModalTitle"></h3>
                        <p id="videoModalDescription"></p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal events
        modal.querySelector('.video-modal-close').addEventListener('click', closeVideoModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideoModal();
            }
        });
    }

    // Set video content
    const container = document.getElementById('videoPlayerContainer');
    const title = document.getElementById('videoModalTitle');
    const description = document.getElementById('videoModalDescription');

    title.textContent = video.titulo;
    description.textContent = video.descripcion || '';

    // Determine video type and create embed
    let embedHTML = '';

    if (video.url.includes('youtube.com') || video.url.includes('youtu.be')) {
        const videoId = extractYouTubeId(video.url);
        embedHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else if (video.url.includes('drive.google.com')) {
        const driveId = extractDriveId(video.url);
        if (driveId) {
            embedHTML = `
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://drive.google.com/file/d/${driveId}/preview" 
                    frameborder="0" 
                    allow="autoplay" 
                    allowfullscreen>
                </iframe>
            `;
        }
    } else if (video.url.includes('vimeo.com')) {
        const vimeoId = video.url.split('/').pop();
        embedHTML = `
            <iframe 
                width="100%" 
                height="100%" 
                src="https://player.vimeo.com/video/${vimeoId}?autoplay=1" 
                frameborder="0" 
                allow="autoplay; fullscreen; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else {
        // Generic video player
        embedHTML = `
            <video width="100%" height="100%" controls autoplay>
                <source src="${video.url}" type="video/mp4">
                Tu navegador no soporta el elemento de video.
            </video>
        `;
    }

    container.innerHTML = embedHTML;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close video modal
function closeVideoModal() {
    const modal = document.getElementById('videoPlayerModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('videoPlayerContainer').innerHTML = '';
        document.body.style.overflow = '';
    }
}

// Close modal with ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideoModal();
    }
});

// Función para contactar por WhatsApp
function contactarWhatsApp(simulacro) {
    const phoneNumber = '573042797630'; // Número de WhatsApp sin el símbolo +

    // Crear el mensaje con la información del simulacro
    let mensaje = `¡Hola! 👋\n\n`;
    mensaje += `Estoy interesado en el simulacro:\n\n`;
    mensaje += `📚 *${simulacro.titulo}*\n`;
    mensaje += `💰 Precio: ${simulacro.precio}\n\n`;

    if (simulacro.descripcion) {
        mensaje += `📝 ${simulacro.descripcion}\n\n`;
    }

    if (simulacro.caracteristicas && simulacro.caracteristicas.length > 0) {
        mensaje += `✅ Características:\n`;
        simulacro.caracteristicas.forEach(car => {
            mensaje += `• ${car}\n`;
        });
        mensaje += `\n`;
    }

    mensaje += `Me gustaría obtener más información sobre este simulacro.\n\n`;
    mensaje += `Página: ${window.location.href}`;

    // Codificar el mensaje para URL
    const mensajeCodificado = encodeURIComponent(mensaje);

    // Crear la URL de WhatsApp
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${mensajeCodificado}`;

    // Abrir WhatsApp en una nueva ventana
    window.open(whatsappURL, '_blank');
}
