// Carousel functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-item');
const totalSlides = slides.length;

// Create indicators
const indicatorsContainer = document.getElementById('carouselIndicators');
for (let i = 0; i < totalSlides; i++) {
    const indicator = document.createElement('div');
    indicator.classList.add('carousel-indicator');
    if (i === 0) indicator.classList.add('active');
    indicator.addEventListener('click', () => goToSlide(i));
    indicatorsContainer.appendChild(indicator);
}

const indicators = document.querySelectorAll('.carousel-indicator');

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
let autoSlide = setInterval(nextSlide, 5000);

// Reset auto advance on manual navigation
function resetAutoSlide() {
    clearInterval(autoSlide);
    autoSlide = setInterval(nextSlide, 5000);
}

document.getElementById('nextBtn').addEventListener('click', () => {
    nextSlide();
    resetAutoSlide();
});

document.getElementById('prevBtn').addEventListener('click', () => {
    prevSlide();
    resetAutoSlide();
});

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
    loadPosts();
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

// Sample posts data (you can replace this with Firebase data)
const samplePosts = [
    {
        id: 1,
        title: "Nuevos Cursos Disponibles",
        content: "Descubre nuestros nuevos cursos de matemáticas avanzadas y preparación ICFES.",
        image: "Elementos/img/logo1.png",
        likes: 45,
        comments: 12,
        timestamp: new Date()
    },
    {
        id: 2,
        title: "Consejos para el Examen",
        content: "Tips importantes para mejorar tu rendimiento en las pruebas.",
        image: "Elementos/img/logo1.png",
        likes: 67,
        comments: 23,
        timestamp: new Date()
    },
    {
        id: 3,
        title: "Historias de Éxito",
        content: "Conoce las historias de nuestros estudiantes destacados.",
        image: "Elementos/img/logo1.png",
        likes: 89,
        comments: 34,
        timestamp: new Date()
    }
];

function loadPosts() {
    const postsGrid = document.getElementById('postsGrid');
    postsGrid.innerHTML = '';

    samplePosts.forEach(post => {
        const postCard = createPostCard(post);
        postsGrid.appendChild(postCard);
    });
}

function createPostCard(post) {
    const card = document.createElement('div');
    card.classList.add('post-card');
    
    const isLiked = false; // Check if user has liked this post
    
    card.innerHTML = `
        <img src="${post.image}" alt="${post.title}" class="post-image">
        <div class="post-content">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <div class="post-actions">
                <div class="post-action ${isLiked ? 'liked' : ''}" data-post-id="${post.id}" onclick="handleLike(${post.id})">
                    <i class="bi ${isLiked ? 'bi-heart-fill' : 'bi-heart'}"></i>
                    <span>${post.likes}</span>
                </div>
                <div class="post-action" onclick="openPostModal(${post.id})">
                    <i class="bi bi-chat"></i>
                    <span>${post.comments}</span>
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

function openPostModal(postId) {
    if (!currentUser) {
        alert('Debes iniciar sesión para comentar');
        window.location.href = 'Secciones/login.html';
        return;
    }
    
    const post = samplePosts.find(p => p.id === postId);
    const modal = document.getElementById('postModal');
    const modalContent = document.getElementById('modalPostContent');
    
    modalContent.innerHTML = `
        <h2>${post.title}</h2>
        <img src="${post.image}" alt="${post.title}" style="width: 100%; border-radius: 10px; margin: 1rem 0;">
        <p>${post.content}</p>
        <div style="margin-top: 2rem;">
            <h3>Comentarios</h3>
            <div id="commentsSection" style="margin-top: 1rem;">
                <p style="color: #666;">No hay comentarios aún. ¡Sé el primero en comentar!</p>
            </div>
            <div style="margin-top: 1.5rem;">
                <textarea id="commentInput" placeholder="Escribe tu comentario..." style="width: 100%; padding: 1rem; border: 2px solid #ddd; border-radius: 10px; min-height: 100px; font-family: inherit;"></textarea>
                <button onclick="submitComment(${postId})" style="margin-top: 1rem; background: linear-gradient(135deg, #DC143C, #8B0000); color: white; padding: 0.7rem 2rem; border: none; border-radius: 25px; cursor: pointer; font-weight: 600;">Publicar Comentario</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
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
