import { db } from './firebase.js';
import { collection, doc, getDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // Initialise UI Interactivity
    if (typeof initMenuToggle !== 'undefined') initMenuToggle();
    if (typeof initScrollEffects !== 'undefined') initScrollEffects();
    
    // Fetch Data from Firestore
    fetchInitialData();
});

async function fetchInitialData() {
    try {
        const refs = {
            hero: getDoc(doc(db, "sections", "hero")),
            about: getDoc(doc(db, "sections", "about")),
            plans: getDoc(doc(db, "sections", "plans")),
            footer: getDoc(doc(db, "sections", "footer"))
        };

        const results = await Promise.all([
            refs.hero, refs.about, refs.plans, refs.footer
        ]);

        const cmsData = {
            hero: results[0].exists() ? results[0].data() : null,
            about: results[1].exists() ? results[1].data() : null,
            plans: results[2].exists() ? results[2].data() : null,
            footer: results[3].exists() ? results[3].data() : null
        };
        
        populateUI(cmsData);
        await populateTutors();
    } catch(err) {
        console.error("Error al cargar datos desde Firebase:", err);
    }
}

async function populateTutors() {
    try {
        const querySnapshot = await getDocs(collection(db, "tutores"));
        const tutoresList = document.querySelector('.tutors-grid');
        
        // If the section exists, we empty it completely to inject dynamic DB content.
        if (tutoresList && !querySnapshot.empty) {
            tutoresList.innerHTML = ''; // Clear default hardcoded tutors that were static
            querySnapshot.forEach((doc) => {
                const tutor = doc.data();
                const avatarHtml = tutor.image 
                    ? `<img src="${tutor.image}" alt="${tutor.name}" class="w-full h-full object-cover">`
                    : `<i data-lucide="user" class="w-12 h-12 text-gray-400 relative top-6"></i>`;
                
                const card = document.createElement("div");
                card.className = "tutor-glass-card group text-left overflow-hidden rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md transition-all hover:bg-white/10 fade-in-up";
                card.innerHTML = `
                    <div class="h-48 w-full bg-gray-900 border-b border-white/10 relative overflow-hidden flex justify-center items-start">
                        ${avatarHtml}
                        <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    </div>
                    <div class="p-6">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="text-xl font-bold text-white">${tutor.name}</h3>
                            ${tutor.badge ? `<span class="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30 uppercase">${tutor.badge}</span>` : ''}
                        </div>
                        <p class="text-sm font-medium text-purple-400 mb-4">${tutor.role}</p>
                        
                        <div class="space-y-2 text-sm text-gray-300">
                            <p class="flex items-center gap-2"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> ${tutor.specialty || '-'}</p>
                            <p class="flex items-center gap-2"><svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14v7"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 9v7"/></svg> ${tutor.university || '-'}</p>
                            ${tutor.achievements ? `<p class="flex items-center gap-2"><svg width="16" height="16" fill="none" class="text-yellow-500" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg> ${tutor.achievements}</p>` : ''}
                        </div>
                    </div>
                `;
                tutoresList.appendChild(card);
            });
        }
    } catch(err) {
        console.error("Error populating Tutors:", err);
    }
}

function safeSetQuery(selector, value, isHTML = false) {
    const el = document.querySelector(selector);
    if (!el || !value) return;
    if (isHTML) {
        el.innerHTML = value;
    } else {
        el.textContent = value;
    }
}

function safeSetAttr(selector, attr, value) {
    const el = document.querySelector(selector);
    if (!el || !value) return;
    el.setAttribute(attr, value);
}

function populateUI(cmsData) {
    try {
        if(cmsData.hero) {
            safeSetQuery('.hero-badge span', cmsData.hero.badge);
            safeSetQuery('.title-line', cmsData.hero.titleLine1);
            safeSetQuery('.title-highlight', cmsData.hero.titleLine2);
            safeSetQuery('.hero-subtitle', cmsData.hero.subtitle, true);
            safeSetQuery('.hero-description', cmsData.hero.description, true);
            safeSetQuery('.hero-cta-primary span', cmsData.hero.cta1Text);
            safeSetAttr('.hero-cta-primary', 'href', cmsData.hero.cta1Link);
            safeSetQuery('.hero-cta-secondary span', cmsData.hero.cta2Text);
            safeSetAttr('.hero-cta-secondary', 'href', cmsData.hero.cta2Link);
        }

        if(cmsData.about) {
            safeSetQuery('.section-badge span:first-child', cmsData.about.badge);
            const titles = document.querySelectorAll('.section-title');
            if (titles.length >= 2) titles[1].textContent = cmsData.about.title; 
            safeSetQuery('.section-subtitle', cmsData.about.subtitle, true);
        }
    } catch(err) {
        console.error("Error populating UI:", err);
    }
}
