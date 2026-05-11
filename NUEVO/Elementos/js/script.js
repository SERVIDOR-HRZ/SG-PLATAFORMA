// Elements
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const overlay = document.querySelector('.overlay');
const closeMenu = document.querySelector('.close-menu');

// Toggle menu
function toggleMenu() {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    overlay.classList.toggle('active');
    document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : 'auto';
}

// Close menu
function closeMenuFunc() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Event listeners
hamburger.addEventListener('click', toggleMenu);
overlay.addEventListener('click', closeMenuFunc);
closeMenu.addEventListener('click', closeMenuFunc);

// Close menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        
        if (targetId && targetId.startsWith('#') && targetId !== '#') {
            e.preventDefault();
            closeMenuFunc();

            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                const offset = 80;
                const top = targetSection.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: top,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// Animated Counter for Stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target + (element.parentElement.querySelector('.stat-label').textContent.includes('%') ? '%' : '+');
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start) + (element.parentElement.querySelector('.stat-label').textContent.includes('%') ? '%' : '+');
        }
    }, 16);
}

// Intersection Observer for Stats Animation
const observerOptions = {
    threshold: 0.5,
    rootMargin: '0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statNumbers = entry.target.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-target'));
                animateCounter(stat, target);
            });
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe stats section
const statsSection = document.querySelector('.hero-stats');
if (statsSection) {
    observer.observe(statsSection);
}

// ============================================
// CONTENIDO SECTION - TABS & CAROUSEL
// ============================================

// Tabs Functionality
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs and contents
        tabBtns.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        // Add active class to clicked tab
        btn.classList.add('active');

        // Show corresponding content
        const tabId = btn.getAttribute('data-tab');
        const content = document.getElementById(`${tabId}-content`);
        if (content) {
            content.classList.add('active');
        }
    });
});

// Carousel Functionality
class Carousel {
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('.carousel-track');
        this.prevBtn = container.querySelector('.carousel-prev');
        this.nextBtn = container.querySelector('.carousel-next');
        this.dotsContainer = container.parentElement.querySelector('.carousel-dots');

        this.cards = Array.from(this.track.querySelectorAll('.video-card'));
        this.currentIndex = 0;
        this.cardWidth = 0;
        this.gap = 32; // 2rem in pixels

        this.init();
    }

    init() {
        this.createDots();
        this.updateCardWidth();
        this.updateCarousel();
        this.attachEvents();

        // Update on window resize
        window.addEventListener('resize', () => {
            this.updateCardWidth();
            this.updateCarousel();
        });
    }

    updateCardWidth() {
        if (this.cards.length > 0) {
            this.cardWidth = this.cards[0].offsetWidth;
        }
    }

    createDots() {
        if (!this.dotsContainer) return;

        this.dotsContainer.innerHTML = '';
        this.cards.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('carousel-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(index));
            this.dotsContainer.appendChild(dot);
        });
    }

    updateDots() {
        if (!this.dotsContainer) return;

        const dots = this.dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });
    }

    updateCarousel() {
        const offset = -(this.currentIndex * (this.cardWidth + this.gap));
        this.track.style.transform = `translateX(${offset}px)`;

        // Update buttons state
        this.prevBtn.disabled = this.currentIndex === 0;
        this.nextBtn.disabled = this.currentIndex >= this.cards.length - 1;

        this.updateDots();
    }

    goToSlide(index) {
        this.currentIndex = Math.max(0, Math.min(index, this.cards.length - 1));
        this.updateCarousel();
    }

    next() {
        if (this.currentIndex < this.cards.length - 1) {
            this.currentIndex++;
            this.updateCarousel();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateCarousel();
        }
    }

    attachEvents() {
        this.prevBtn.addEventListener('click', () => this.prev());
        this.nextBtn.addEventListener('click', () => this.next());

        // Touch/Swipe support
        let startX = 0;
        let currentX = 0;
        let isDragging = false;

        this.track.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            isDragging = true;
        });

        this.track.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX;
        });

        this.track.addEventListener('touchend', () => {
            if (!isDragging) return;

            const diff = startX - currentX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }

            isDragging = false;
        });

        // Mouse drag support
        let mouseStartX = 0;
        let mouseCurrentX = 0;
        let isMouseDragging = false;

        this.track.addEventListener('mousedown', (e) => {
            mouseStartX = e.clientX;
            isMouseDragging = true;
            this.track.style.cursor = 'grabbing';
        });

        this.track.addEventListener('mousemove', (e) => {
            if (!isMouseDragging) return;
            mouseCurrentX = e.clientX;
        });

        this.track.addEventListener('mouseup', () => {
            if (!isMouseDragging) return;

            const diff = mouseStartX - mouseCurrentX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    this.next();
                } else {
                    this.prev();
                }
            }

            isMouseDragging = false;
            this.track.style.cursor = 'grab';
        });

        this.track.addEventListener('mouseleave', () => {
            if (isMouseDragging) {
                isMouseDragging = false;
                this.track.style.cursor = 'grab';
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.prev();
            } else if (e.key === 'ArrowRight') {
                this.next();
            }
        });
    }
}

// Initialize carousel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        new Carousel(carouselContainer);
    }
});

// Auto-play carousel (optional)
let autoplayInterval;
const startAutoplay = () => {
    const carouselContainer = document.querySelector('.carousel-container');
    if (!carouselContainer) return;

    autoplayInterval = setInterval(() => {
        const nextBtn = carouselContainer.querySelector('.carousel-next');
        const prevBtn = carouselContainer.querySelector('.carousel-prev');

        if (!nextBtn.disabled) {
            nextBtn.click();
        } else {
            prevBtn.click();
        }
    }, 5000); // Change slide every 5 seconds
};

const stopAutoplay = () => {
    if (autoplayInterval) {
        clearInterval(autoplayInterval);
    }
};

// Uncomment to enable autoplay
// startAutoplay();

// Stop autoplay on user interaction
document.querySelector('.carousel-container')?.addEventListener('mouseenter', stopAutoplay);
document.querySelector('.carousel-container')?.addEventListener('touchstart', stopAutoplay);

// ============================================
// PDF VIEWER - SIMPLE VERSION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.getElementById('pdf-viewer-iframe');
    const currentTitle = document.getElementById('current-pdf-title');
    const currentDesc = document.getElementById('current-pdf-desc');

    if (!iframe) return;

    // Helper function to load PDF
    const loadPdf = (pdfUrl) => {
        const isMobile = window.innerWidth <= 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
            iframe.src = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
        } else {
            iframe.src = pdfUrl + '#toolbar=0&navpanes=0&scrollbar=1&view=FitH';
        }
    };

    // Load initial PDF
    loadPdf('https://editorialsumma.com/storage/2021/02/Simulacro-Nerdos-2020.pdf');

    // PDF Selector functionality
    const pdfItems = document.querySelectorAll('.pdf-list-item:not(.pdf-list-placeholder)');

    pdfItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            pdfItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update PDF
            const pdfUrl = item.getAttribute('data-pdf');
            const title = item.getAttribute('data-title');
            const desc = item.getAttribute('data-desc');

            loadPdf(pdfUrl);
            currentTitle.textContent = title;
            currentDesc.textContent = desc;
        });
    });

    // Download PDF
    document.getElementById('download-pdf')?.addEventListener('click', () => {
        const currentPdf = iframe.src.split('#')[0];
        const link = document.createElement('a');
        link.href = currentPdf;
        link.download = currentTitle.textContent + '.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});


// ============================================
// CONTACT FORM FUNCTIONALITY
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contacto-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Get form data
            const formData = {
                nombre: document.getElementById('nombre').value,
                email: document.getElementById('email').value,
                telefono: document.getElementById('telefono').value,
                asunto: document.getElementById('asunto').value,
                mensaje: document.getElementById('mensaje').value
            };

            // Get submit button
            const submitBtn = contactForm.querySelector('.form-submit-btn');
            const originalHTML = submitBtn.innerHTML;

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg><span>Enviando...</span>';

            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                // Show success state
                submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg><span>¡Mensaje Enviado!</span>';
                submitBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

                // Reset form
                contactForm.reset();

                // Reset button after 3 seconds
                setTimeout(() => {
                    submitBtn.innerHTML = originalHTML;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 3000);

                // Log form data (replace with actual submission)
                console.log('Form submitted:', formData);

                // You can add your actual form submission logic here
                // Example: send to an API endpoint
                // fetch('/api/contact', {
                //     method: 'POST',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify(formData)
                // });

            }, 1500);
        });
    }
});

// Add spin animation for loading icon
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// ============================================
// EXAM COUNTDOWN — Calendario A (26 Jul 2026)
// ============================================
function initExamCountdown() {
    const daysEl = document.getElementById('exam-days');
    const hoursEl = document.getElementById('exam-hours');
    const minsEl = document.getElementById('exam-mins');
    const secsEl = document.getElementById('exam-secs');

    if (!daysEl) return;

    // Examen Calendario A: 26 de julio de 2026 a las 7:00 AM Colombia (UTC-5)
    const examDate = new Date('2026-07-26T07:00:00-05:00');

    function updateCountdown() {
        const now = new Date();
        const diff = examDate - now;

        if (diff <= 0) {
            daysEl.textContent = '00';
            hoursEl.textContent = '00';
            minsEl.textContent = '00';
            secsEl.textContent = '00';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        daysEl.textContent = String(days).padStart(2, '0');
        hoursEl.textContent = String(hours).padStart(2, '0');
        minsEl.textContent = String(mins).padStart(2, '0');
        secsEl.textContent = String(secs).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

initExamCountdown();

// ============================================
// FAQ ACCORDION
// ============================================
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    if (question && answer) {
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all others
            faqItems.forEach(other => {
                other.classList.remove('active');
                const otherAnswer = other.querySelector('.faq-answer');
                if (otherAnswer) otherAnswer.style.maxHeight = '0';
            });

            // Toggle current
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    }
});

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            revealObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
});

// Observe ALL reveal variants
document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
    revealObserver.observe(el);
});

// Auto-add reveal to key elements that don't already have it
document.querySelectorAll('.section-header, .trust-stats-bar, .dashboard-showcase, .simulacro-cards-grid, .simulacro-pack, .guarantee-section, .payment-process, .comparison-table').forEach(el => {
    if (!el.classList.contains('reveal') && !el.classList.contains('reveal-scale') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right')) {
        el.classList.add('reveal');
        revealObserver.observe(el);
    }
});

// ============================================
// CLEAN URL HASH TRACKING
// ============================================
const sections = document.querySelectorAll('section[id]');
const hashObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            if (id && window.history.replaceState) {
                window.history.replaceState(null, '', '#' + id);
            }
        }
    });
}, {
    threshold: 0.3,
    rootMargin: '-80px 0px -40% 0px'
});

sections.forEach(sec => hashObserver.observe(sec));

// ============================================
// DYNAMIC NUMBER COUNTER
// ============================================
const animateNumbers = (entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.getAttribute('data-target'));
            if (!target) return;

            let current = 0;
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    el.innerText = Math.ceil(current) + '+';
                    requestAnimationFrame(updateCounter);
                } else {
                    el.innerText = target + '+';
                }
            };

            updateCounter();
            observer.unobserve(el);
        }
    });
};

const numberObserver = new IntersectionObserver(animateNumbers, {
    threshold: 0.5
});

document.querySelectorAll('.stat-number').forEach(el => {
    numberObserver.observe(el);
});

// ============================================
// LIVE COUNTER (Simulated)
// ============================================
const liveCountEl = document.getElementById('live-count');
if (liveCountEl) {
    let currentCount = parseInt(liveCountEl.textContent);

    setInterval(() => {
        // Randomly increment by 0 or 1
        if (Math.random() > 0.4) {
            currentCount++;
            liveCountEl.textContent = currentCount;
        }
    }, 30000); // Every 30 seconds
}

// ============================================
// SMOOTH SCROLL FOR HERO CTAs
// ============================================
document.querySelectorAll('.hero-cta-primary, .hero-cta-secondary, .nav-cta-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const href = btn.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const offset = 80; // Account for sticky navbar
                const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    });
});

// ============================================
// TUTOR PROFILE MODAL LOGIC
// ============================================
function openTutorModal(tutorId) {
    const modal = document.getElementById(`tutorModal-${tutorId}`);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeTutorModal(tutorId) {
    const modal = document.getElementById(`tutorModal-${tutorId}`);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}

// Close modal when clicking outside the container
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('tutor-modal-overlay')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// ============================================
// TUTOR PROFILE CAROUSEL
// ============================================
let tpCurrentSlide = 0;
let tpAutoplayTimer = null;

function moveCarousel(direction) {
    const track = document.getElementById('tpCarouselTrack');
    if (!track) return;

    const slides = track.querySelectorAll('.tp-carousel-slide');
    const totalSlides = slides.length;

    tpCurrentSlide += direction;

    // Wrap around
    if (tpCurrentSlide < 0) tpCurrentSlide = totalSlides - 1;
    if (tpCurrentSlide >= totalSlides) tpCurrentSlide = 0;

    updateCarouselPosition();
    resetAutoplay();
}

function goToSlide(index) {
    tpCurrentSlide = index;
    updateCarouselPosition();
    resetAutoplay();
}

function updateCarouselPosition() {
    const track = document.getElementById('tpCarouselTrack');
    if (!track) return;

    track.style.transform = `translateX(-${tpCurrentSlide * 100}%)`;

    // Update dots
    const dots = document.querySelectorAll('#tpCarouselDots .tp-dot');
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === tpCurrentSlide);
    });
}

// Auto-play carousel
function startTpAutoplay() {
    tpAutoplayTimer = setInterval(() => moveCarousel(1), 5000);
}

function resetAutoplay() {
    if (tpAutoplayTimer) clearInterval(tpAutoplayTimer);
    startTpAutoplay();
}

// Start autoplay when modal opens
const tpObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.target.id && mutation.target.id.startsWith('tutorModal-')) {
            if (mutation.target.classList.contains('active')) {
                tpCurrentSlide = 0;
                updateCarouselPosition();
                startTpAutoplay();
            } else {
                if (tpAutoplayTimer) clearInterval(tpAutoplayTimer);
            }
        }
    });
});

document.querySelectorAll('.tutor-modal-overlay').forEach(modal => {
    tpObserver.observe(modal, { attributes: true, attributeFilter: ['class'] });
});

// Swipe support for tutor carousel
(function() {
    const carousel = document.getElementById('tpCarousel');
    if (!carousel) return;

    let startX = 0;
    let currentX = 0;
    let swiping = false;

    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        swiping = true;
    }, { passive: true });

    carousel.addEventListener('touchmove', (e) => {
        if (!swiping) return;
        currentX = e.touches[0].clientX;
    }, { passive: true });

    carousel.addEventListener('touchend', () => {
        if (!swiping) return;
        const diff = startX - currentX;
        if (Math.abs(diff) > 50) {
            moveCarousel(diff > 0 ? 1 : -1);
        }
        swiping = false;
    });
})();
