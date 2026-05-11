import { db } from './firebase.js';
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";
import { initLivePreview, focusPreviewSection } from './live-preview.js';
import { initComponentLibrary } from './component-library.js';
import { initTutorProfiles, loadTutors, getTutors } from './tutor-profiles.js';

let cmsData = {
    hero: {},
    about: {},
    stats: { hero: [], bento: [] },
    tutors: [],
    plans: {},
    footer: {}
};

// init
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initLivePreview();
    initComponentLibrary();
    initTutorProfiles();
});


// Navigation
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('expanded');
};

window.switchSection = function(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    
    const targetSec = document.getElementById('sec-' + sectionId);
    if(targetSec) targetSec.classList.add('active');
    
    const targetNav = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if(targetNav) targetNav.classList.add('active');
    
    let label = targetNav ? targetNav.querySelector('span').textContent : 'Dashboard';
    document.getElementById('breadcrumb-section').textContent = label;
    focusPreviewSection(sectionId);
};

// Data Management
async function loadData() {
    try {
        const sectionsRefs = {
            hero: getDoc(doc(db, "sections", "hero")),
            about: getDoc(doc(db, "sections", "about")),
            plans: getDoc(doc(db, "sections", "plans")),
            footer: getDoc(doc(db, "sections", "footer")),
            stats: getDoc(doc(db, "sections", "stats"))
        };

        const [heroDoc, aboutDoc, plansDoc, footerDoc, statsDoc] = await Promise.all([
            sectionsRefs.hero, sectionsRefs.about, sectionsRefs.plans, sectionsRefs.footer, sectionsRefs.stats
        ]);

        if(heroDoc.exists()) cmsData.hero = heroDoc.data();
        if(aboutDoc.exists()) cmsData.about = aboutDoc.data();
        if(plansDoc.exists()) cmsData.plans = plansDoc.data();
        if(footerDoc.exists()) cmsData.footer = footerDoc.data();
        if(statsDoc.exists()) cmsData.stats = statsDoc.data();

        // Load Tutors via dedicated module
        cmsData.tutors = await loadTutors();

        populateFields();
        updateDashboardStats();
    } catch (e) {
        console.error("Error cargando BD", e);
        showToast("Error conectando a BD", "error");
    }
}

window.saveAllData = async function() {
    await saveSection('hero', false);
    await saveSection('about', false);
    await saveSection('plans', false);
    await saveSection('footer', false);
    await saveSection('stats', false);
    showToast("Todos los cambios guardados");
    updateDashboardStats();
};

window.saveSection = async function(sectionName, showTst=true) {
    let dataObj = {};
    if(sectionName === 'hero') { gatherHeroData(); dataObj = cmsData.hero; }
    if(sectionName === 'about') { gatherAboutData(); dataObj = cmsData.about; }
    if(sectionName === 'plans') { gatherPlansData(); dataObj = cmsData.plans; }
    if(sectionName === 'footer') { gatherFooterData(); dataObj = cmsData.footer; }
    if(sectionName === 'stats') { gatherStatsData(); dataObj = cmsData.stats; }
    
    try {
        await setDoc(doc(db, "sections", sectionName), dataObj, { merge: true });
        if(showTst) showToast(`Sección ${sectionName.toUpperCase()} guardada en la Nube`);
    } catch (e) {
        console.error(e);
        if(showTst) showToast(`Error guardando ${sectionName}`, "error");
    }
};

window.exportData = function() {
    showToast("Función exportar migrada. Revisa Firebase Console.", "error");
};
window.importData = function(event) {
    showToast("Función desactivada para nube", "error");
};

// Gather Functions
function gatherHeroData() {
    if(!document.getElementById('hero-badge')) return;
    cmsData.hero = {
        badge: document.getElementById('hero-badge').value,
        titleLine1: document.getElementById('hero-title-line1').value,
        titleLine2: document.getElementById('hero-title-line2').value,
        subtitle: document.getElementById('hero-subtitle').value,
        description: document.getElementById('hero-description').value,
        cta1Text: document.getElementById('hero-cta-primary-text').value,
        cta1Link: document.getElementById('hero-cta-primary-link').value,
        cta1Price: document.getElementById('hero-cta-price').value,
        cta2Text: document.getElementById('hero-cta-secondary-text').value,
        cta2Link: document.getElementById('hero-cta-secondary-link').value,
        countdownTitle: document.getElementById('hero-countdown-title').value,
        countdownDate: document.getElementById('hero-countdown-date').value,
        liveCount: document.getElementById('hero-live-count').value,
        liveText: document.getElementById('hero-live-text').value
    };
}

function gatherAboutData() {
    if(!document.getElementById('about-badge')) return;
    cmsData.about = {
        badge: document.getElementById('about-badge').value,
        title: document.getElementById('about-title').value,
        description: document.getElementById('about-description').value,
        tagline: document.getElementById('about-tagline').value,
        trust: [
            document.getElementById('trust-1').value,
            document.getElementById('trust-2').value,
            document.getElementById('trust-3').value,
            document.getElementById('trust-4').value
        ]
    };
}

function gatherPlansData() {
    if(!document.getElementById('plans-badge')) return;
    cmsData.plans = {
        badge: document.getElementById('plans-badge').value,
        title: document.getElementById('plans-title').value,
        desc: document.getElementById('plans-desc').value,
        priceFrom: document.getElementById('plans-price-from').value,
        whatsappText: document.getElementById('plans-whatsapp-text').value,
        whatsappNum: document.getElementById('plans-whatsapp-num').value
    };
}

function gatherFooterData() {
    if(!document.getElementById('footer-tagline')) return;
    cmsData.footer = {
        tagline: document.getElementById('footer-tagline').value,
        copyright: document.getElementById('footer-copyright').value,
        instagram: document.getElementById('social-instagram').value,
        tiktok: document.getElementById('social-tiktok').value,
        whatsapp: document.getElementById('social-whatsapp').value
    };
}

function gatherStatsData() {
    if(!document.getElementById('stat-hero-1-num')) return;
    cmsData.stats = {
        hero: [
            { num: document.getElementById('stat-hero-1-num').value, label: document.getElementById('stat-hero-1-label').value },
            { num: document.getElementById('stat-hero-2-num').value, label: document.getElementById('stat-hero-2-label').value }
        ],
        bento: [
            { num: document.getElementById('stat-bento-1-num').value, label: document.getElementById('stat-bento-1-label').value },
            { num: document.getElementById('stat-bento-2-num').value, label: document.getElementById('stat-bento-2-label').value },
            { num: document.getElementById('stat-bento-3-num').value, label: document.getElementById('stat-bento-3-label').value },
            { num: document.getElementById('stat-bento-4-num').value, label: document.getElementById('stat-bento-4-label').value }
        ]
    };
}

// Populate Functions
function populateFields() {
    if(cmsData.hero && document.getElementById('hero-badge')) {
        document.getElementById('hero-badge').value = cmsData.hero.badge || '';
        document.getElementById('hero-title-line1').value = cmsData.hero.titleLine1 || '';
        document.getElementById('hero-title-line2').value = cmsData.hero.titleLine2 || '';
        document.getElementById('hero-subtitle').value = cmsData.hero.subtitle || '';
        document.getElementById('hero-description').value = cmsData.hero.description || '';
        document.getElementById('hero-cta-primary-text').value = cmsData.hero.cta1Text || '';
        document.getElementById('hero-cta-primary-link').value = cmsData.hero.cta1Link || '';
        document.getElementById('hero-cta-price').value = cmsData.hero.cta1Price || '';
        document.getElementById('hero-cta-secondary-text').value = cmsData.hero.cta2Text || '';
        document.getElementById('hero-cta-secondary-link').value = cmsData.hero.cta2Link || '';
        document.getElementById('hero-countdown-title').value = cmsData.hero.countdownTitle || '';
        document.getElementById('hero-countdown-date').value = cmsData.hero.countdownDate || '';
        document.getElementById('hero-live-count').value = cmsData.hero.liveCount || '';
        document.getElementById('hero-live-text').value = cmsData.hero.liveText || '';
    }

    if(cmsData.about && document.getElementById('about-badge')) {
        document.getElementById('about-badge').value = cmsData.about.badge || '';
        document.getElementById('about-title').value = cmsData.about.title || '';
        document.getElementById('about-description').value = cmsData.about.description || '';
        document.getElementById('about-tagline').value = cmsData.about.tagline || '';
        if(cmsData.about.trust) {
            document.getElementById('trust-1').value = cmsData.about.trust[0] || '';
            document.getElementById('trust-2').value = cmsData.about.trust[1] || '';
            document.getElementById('trust-3').value = cmsData.about.trust[2] || '';
            document.getElementById('trust-4').value = cmsData.about.trust[3] || '';
        }
    }

    if(cmsData.plans && document.getElementById('plans-badge')) {
        document.getElementById('plans-badge').value = cmsData.plans.badge || '';
        document.getElementById('plans-title').value = cmsData.plans.title || '';
        document.getElementById('plans-desc').value = cmsData.plans.desc || '';
        document.getElementById('plans-price-from').value = cmsData.plans.priceFrom || '';
        document.getElementById('plans-whatsapp-text').value = cmsData.plans.whatsappText || '';
        document.getElementById('plans-whatsapp-num').value = cmsData.plans.whatsappNum || '';
    }

    if(cmsData.footer && document.getElementById('footer-tagline')) {
        document.getElementById('footer-tagline').value = cmsData.footer.tagline || '';
        document.getElementById('footer-copyright').value = cmsData.footer.copyright || '';
        document.getElementById('social-instagram').value = cmsData.footer.instagram || '';
        document.getElementById('social-tiktok').value = cmsData.footer.tiktok || '';
        document.getElementById('social-whatsapp').value = cmsData.footer.whatsapp || '';
    }

    if(cmsData.stats && document.getElementById('stat-hero-1-num')) {
        if(cmsData.stats.hero) {
            document.getElementById('stat-hero-1-num').value = cmsData.stats.hero[0]?.num || '';
            document.getElementById('stat-hero-1-label').value = cmsData.stats.hero[0]?.label || '';
            document.getElementById('stat-hero-2-num').value = cmsData.stats.hero[1]?.num || '';
            document.getElementById('stat-hero-2-label').value = cmsData.stats.hero[1]?.label || '';
        }
        if(cmsData.stats.bento) {
            document.getElementById('stat-bento-1-num').value = cmsData.stats.bento[0]?.num || '';
            document.getElementById('stat-bento-1-label').value = cmsData.stats.bento[0]?.label || '';
            document.getElementById('stat-bento-2-num').value = cmsData.stats.bento[1]?.num || '';
            document.getElementById('stat-bento-2-label').value = cmsData.stats.bento[1]?.label || '';
            document.getElementById('stat-bento-3-num').value = cmsData.stats.bento[2]?.num || '';
            document.getElementById('stat-bento-3-label').value = cmsData.stats.bento[2]?.label || '';
            document.getElementById('stat-bento-4-num').value = cmsData.stats.bento[3]?.num || '';
            document.getElementById('stat-bento-4-label').value = cmsData.stats.bento[3]?.label || '';
        }
    }
}

// Tutors Modal Logic
let editingTutorId = null;

function renderTutors() {
    const grid = document.getElementById('tutors-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    cmsData.tutors.forEach(tutor => {
        const card = document.createElement('div');
        card.className = 'tutor-card';
        card.innerHTML = `
            <div class="tutor-card-header">
                <div class="tutor-card-avatar" style="background-image: url('${tutor.image}')">
                    ${!tutor.image ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' : ''}
                </div>
                <div class="tutor-card-info">
                    <h4>${tutor.name}</h4>
                    <p>${tutor.role}</p>
                </div>
                <div class="tutor-card-actions">
                    <button type="button" class="tutor-action-btn edit" onclick="editTutor('${tutor.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button type="button" class="tutor-action-btn delete" onclick="deleteTutor('${tutor.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            </div>
            <div class="tutor-card-body">
                <p><strong>Especialidad:</strong> ${tutor.specialty}</p>
                <p><strong>Universidad:</strong> ${tutor.university}</p>
            </div>
        `;
        grid.appendChild(card);
    });
    
    const badge = document.getElementById('tutor-count-badge');
    if(badge) badge.textContent = cmsData.tutors.length;
}

window.openTutorModal = function() {
    editingTutorId = null;
    document.getElementById('tutor-modal-title').textContent = 'Añadir Tutor';
    document.getElementById('tutor-name').value = '';
    document.getElementById('tutor-role').value = '';
    document.getElementById('tutor-badge-text').value = '';
    document.getElementById('tutor-badge-color').value = '';
    document.getElementById('tutor-image').value = '';
    document.getElementById('tutor-specialty').value = '';
    document.getElementById('tutor-university').value = '';
    document.getElementById('tutor-achievements').value = '';
    
    updateTutorPreview('');
    document.getElementById('tutor-modal').classList.add('active');
};

window.closeTutorModal = function() {
    document.getElementById('tutor-modal').classList.remove('active');
};

window.editTutor = function(id) {
    const tutor = cmsData.tutors.find(t => t.id === id);
    if(!tutor) return;
    
    editingTutorId = id;
    document.getElementById('tutor-modal-title').textContent = 'Editar Tutor';
    document.getElementById('tutor-name').value = tutor.name || '';
    document.getElementById('tutor-role').value = tutor.role || '';
    document.getElementById('tutor-badge-text').value = tutor.badge || '';
    document.getElementById('tutor-badge-color').value = tutor.badgeColor || '';
    document.getElementById('tutor-image').value = tutor.image || '';
    document.getElementById('tutor-specialty').value = tutor.specialty || '';
    document.getElementById('tutor-university').value = tutor.university || '';
    document.getElementById('tutor-achievements').value = tutor.achievements || '';
    
    updateTutorPreview(tutor.image);
    document.getElementById('tutor-modal').classList.add('active');
};

window.saveTutor = async function() {
    const name = document.getElementById('tutor-name').value;
    if(!name) { showToast("El nombre es obligatorio", "error"); return; }
    
    const tutorIdStr = editingTutorId ? editingTutorId : "tutor_" + Date.now();
    const tutorObj = {
        name: name,
        role: document.getElementById('tutor-role').value,
        badge: document.getElementById('tutor-badge-text').value,
        badgeColor: document.getElementById('tutor-badge-color').value,
        image: document.getElementById('tutor-image').value,
        specialty: document.getElementById('tutor-specialty').value,
        university: document.getElementById('tutor-university').value,
        achievements: document.getElementById('tutor-achievements').value
    };
    
    try {
        await setDoc(doc(db, "tutores", tutorIdStr), tutorObj);
        showToast("Tutor actualizado en Firestore");
        // Update local object
        tutorObj.id = tutorIdStr;
        if(editingTutorId) {
            const idx = cmsData.tutors.findIndex(t => t.id === editingTutorId);
            if(idx !== -1) cmsData.tutors[idx] = tutorObj;
        } else {
            cmsData.tutors.push(tutorObj);
        }
        renderTutors();
        updateDashboardStats();
        closeTutorModal();
    } catch(err) {
        showToast("Error subiendo el tutor", "error");
        console.error(err);
    }
};

window.deleteTutor = async function(id) {
    if(confirm("¿Seguro que deseas eliminar este tutor de Firebase?")) {
        try {
            await deleteDoc(doc(db, "tutores", id));
            cmsData.tutors = cmsData.tutors.filter(t => t.id !== id);
            renderTutors();
            updateDashboardStats();
            showToast("Tutor eliminado de Firebase");
        } catch(e) {
            showToast("Error al eliminar", "error");
            console.error(e);
        }
    }
};

function updateTutorPreview(url) {
    const preview = document.getElementById('tutor-avatar-preview');
    if (!preview) return;
    if(url && url.startsWith('http')) {
        preview.style.backgroundImage = `url('${url}')`;
        preview.innerHTML = '';
    } else {
        preview.style.backgroundImage = 'none';
        preview.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
    }
}

function updateDashboardStats() {
    if(document.getElementById('dash-tutors')) {
        document.getElementById('dash-tutors').textContent = cmsData.tutors.length;
    }
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = type === 'success' ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
    
    toast.innerHTML = `${icon}<span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Expose showToast globally for sub-modules
window._showToastGlobal = showToast;
