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
