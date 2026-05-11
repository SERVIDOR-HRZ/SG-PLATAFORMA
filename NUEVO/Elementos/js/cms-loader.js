import { db } from "./firebase.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

function setText(selector, value) {
    if (!value && value !== 0) return;
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
}

function applyCMSData(data) {
    // ─── HERO ───
    if (data.hero) {
        const h = data.hero;
        setText('#hero-badge', h.badge);
        setText('#hero-title1', h.titleLine1);
        // Note: index.html has hero-title1 and hero-title2 inside hero-title-wrapper -> h1 
        // Or wait, does index.html have titleLine2 mapping inside stats?
        setText('#hero-title2', h.titleLine2);
        
        if (h.subtitle) {
            const subEl = document.getElementById('hero-subtitle');
            if (subEl) subEl.innerHTML = h.subtitle;
        }
        if (h.description) {
            const descEl = document.getElementById('hero-desc');
            if (descEl) descEl.innerHTML = h.description;
        }
        
        if (h.cta1Text) {
            const cta1 = document.getElementById('hero-cta1');
            if (cta1) {
                cta1.innerHTML = h.cta1Text + (h.cta1Price ? ` <span class="price-tag">${h.cta1Price}</span>` : '');
            }
        }
        if (h.cta2Text) {
            const cta2 = document.getElementById('hero-cta2');
            if (cta2) {
                const svgPart = cta2.querySelector('svg')?.outerHTML || '';
                cta2.innerHTML = svgPart + ' ' + h.cta2Text;
            }
        }
        
        setText('#live-count', h.liveCount);
        
        if (h.countdownTitle) {
            const cdHeader = document.querySelector('.exam-countdown-header h3');
            if (cdHeader) cdHeader.textContent = h.countdownTitle;
        }
    }
    
    // ─── ABOUT ───
    if (data.about) {
        const a = data.about;
        const aboutBadge = document.querySelector('#about .section-badge span');
        if (aboutBadge) aboutBadge.textContent = a.badge;
        
        const aboutTitle = document.querySelector('#about .section-title');
        if (aboutTitle && a.title) aboutTitle.innerHTML = a.title;
        
        const aboutDesc = document.querySelector('#about .section-description');
        if (aboutDesc) aboutDesc.textContent = a.description;
        
        if (a.tagline) {
            const tagline = document.querySelector('.bento-logo-tagline');
            if (tagline) tagline.innerHTML = a.tagline;
        }
        
        if (a.trust && a.trust.length) {
            const trustItems = document.querySelectorAll('.trust-item span');
            a.trust.forEach((text, i) => {
                if (trustItems[i]) trustItems[i].textContent = text;
            });
        }
    }
    
    // ─── PLANS ───
    if (data.plans) {
        const p = data.plans;
        const plansBadges = document.querySelectorAll('#planes .section-badge span, #simulacros .section-badge span');
        plansBadges.forEach(b => { if (p.badge) b.textContent = p.badge; });
        
        const plansTitles = document.querySelectorAll('#planes .section-title, #simulacros .section-title');
        plansTitles.forEach(t => { if (p.title) t.innerHTML = p.title; });
    }
    
    // ─── FOOTER ───
    if (data.footer) {
        const f = data.footer;
        const footerTagline = document.querySelector('.footer-brand p, footer .tagline');
        if (footerTagline && f.tagline) footerTagline.textContent = f.tagline;
        
        const copyright = document.querySelector('.footer-bottom p, .copyright');
        if (copyright && f.copyright) copyright.textContent = f.copyright;
    }

    // ─── STATS ───
    if (data.stats) {
        const s = data.stats;
        if (s.hero) {
            const heroStatsCards = document.querySelectorAll('#hero-stats .stat-card');
            if (s.hero[0] && heroStatsCards[0]) {
                const num = heroStatsCards[0].querySelector('.stat-number');
                const lbl = heroStatsCards[0].querySelector('.stat-label');
                if (num) num.textContent = s.hero[0].num;
                if (lbl) lbl.textContent = s.hero[0].label;
            }
            if (s.hero[1] && heroStatsCards[1]) {
                const num = heroStatsCards[1].querySelector('.stat-number');
                const lbl = heroStatsCards[1].querySelector('.stat-label');
                if (num) num.textContent = s.hero[1].num;
                if (lbl) lbl.textContent = s.hero[1].label;
            }
        }

        if (s.bento) {
            const bentoStatsItems = document.querySelectorAll('.bento-stats-grid .bento-stat-item');
            s.bento.forEach((item, index) => {
                if (item && bentoStatsItems[index]) {
                    const num = bentoStatsItems[index].querySelector('.bento-stat-number');
                    const lbl = bentoStatsItems[index].querySelector('.bento-stat-label');
                    if (num) num.textContent = item.num;
                    if (lbl) lbl.textContent = item.label;
                }
            });
        }
    }
}

async function loadSections() {
    try {
        const refs = {
            hero: getDoc(doc(db, "sections", "hero")),
            about: getDoc(doc(db, "sections", "about")),
            plans: getDoc(doc(db, "sections", "plans")),
            footer: getDoc(doc(db, "sections", "footer")),
            stats: getDoc(doc(db, "sections", "stats"))
        };

        const [heroDoc, aboutDoc, plansDoc, footerDoc, statsDoc] = await Promise.all([
            refs.hero, refs.about, refs.plans, refs.footer, refs.stats
        ]);

        const data = {};
        if (heroDoc.exists()) data.hero = heroDoc.data();
        if (aboutDoc.exists()) data.about = aboutDoc.data();
        if (plansDoc.exists()) data.plans = plansDoc.data();
        if (footerDoc.exists()) data.footer = footerDoc.data();
        if (statsDoc.exists()) data.stats = statsDoc.data();

        applyCMSData(data);
    } catch (error) {
        console.error("Error loading sections from CMS:", error);
    }
}

async function loadTutors() {
    const container = document.querySelector('.tutors-slider-track');
    if (!container) return;

    try {
        const tutorsSnapshot = await getDocs(collection(db, "tutors"));
        if (tutorsSnapshot.empty) {
            console.log("No tutors found in CMS.");
            return;
        }

        // Clear existing static content if any (we could leave one as a template but let's build from JS)
        container.innerHTML = '';

        tutorsSnapshot.forEach((doc) => {
            const data = doc.data();
            
            const badgeClassStr = data.badgeClass ? ` ${data.badgeClass}` : '';
            
            // Build the achievements HTML
            let achievementsHtml = '';
            if (data.achievements?.length > 0) {
                achievementsHtml = data.achievements.map((ach) => `
                    <div class="achievement-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        <span>${ach}</span>
                    </div>
                `).join('');
            }

            const tutorCard = `
                <div class="tutor-card tutor-slide">
                    <div class="tutor-badge${badgeClassStr}">${data.badge || ''}</div>
                    <div class="tutor-image">
                        <img src="${data.imgUrl || ''}" alt="${data.name || ''}">
                        <div class="tutor-overlay"></div>
                    </div>
                    <div class="tutor-content">
                        <h3 class="tutor-name">${data.name || ''}</h3>
                        <div class="tutor-role">${data.role || ''}</div>

                        <div class="tutor-info-grid">
                            <div class="info-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                                    <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                                </svg>
                                <div>
                                    <div class="info-label">Universidad / Especialidad</div>
                                    <div class="info-value">${data.university || ''}</div>
                                </div>
                            </div>
                        </div>

                        <div class="tutor-achievements">
                            ${achievementsHtml}
                        </div>

                        <a href="${data.profileUrl || '#'}" class="tutor-profile-btn" style="display:inline-flex;text-decoration:none;">
                            Ver Perfil Completo
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                        </a>
                    </div>
                </div>
            `;
            container.insertAdjacentHTML('beforeend', tutorCard);
        });

    } catch (error) {
        console.error("Error loading tutors from CMS:", error);
    }
}

async function loadSimulacros() {
    try {
        const simDoc = await getDoc(doc(db, "landings", "simulacros_view"));
        if (!simDoc.exists()) return;
        
        const data = simDoc.data();

        // 1. Requisitos
        if (data.requisitos && data.requisitos.length) {
            const reqList = document.querySelector('.simulacros-requirements .requirement-list');
            if (reqList) {
                reqList.innerHTML = data.requisitos.map(r => `
                    <li>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <span>${r}</span>
                    </li>
                `).join('');
            }
        }

        // 2. Qué necesitas
        if (data.que_necesitas && data.que_necesitas.length) {
            const needsList = document.querySelectorAll('.simulacros-requirements .requirement-list')[1];
            if (needsList) {
                needsList.innerHTML = data.que_necesitas.map(n => `
                    <li>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                        </svg>
                        <span>${n}</span>
                    </li>
                `).join('');
            }
        }

        // 3. Paso a paso
        if (data.paso_a_paso && data.paso_a_paso.length) {
            const howSteps = document.querySelector('.how-steps-container');
            if (howSteps) {
                const icons = [
                    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>',
                    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line>',
                    '<path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>'
                ];
                let stepsHtml = '';
                data.paso_a_paso.forEach((step, idx) => {
                    const isLast = idx === data.paso_a_paso.length - 1;
                    stepsHtml += `
                        <div class="how-step">
                            <div class="how-step-number">${idx + 1}</div>
                            <div class="how-step-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    ${icons[idx % icons.length]}
                                </svg>
                            </div>
                            <h4>${step.titulo}</h4>
                            <p>${step.descripcion}</p>
                        </div>
                    `;
                    if (!isLast) {
                        stepsHtml += `
                            <div class="how-step-connector">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </div>
                        `;
                    }
                });
                howSteps.innerHTML = stepsHtml;
            }
        }

        // 4. Simulacros Cards
        if (data.simulacros && data.simulacros.length) {
            const grid = document.querySelector('.simulacros-grid');
            if (grid) {
                grid.innerHTML = data.simulacros.sort((a,b) => a.order - b.order).map(sim => {
                    const cssClass = sim.popular ? ' simulacro-popular' : (sim.free ? ' simulacro-free' : '');
                    const tagHtml = sim.popular ? '<div class="simulacro-popular-tag">MÁS VENDIDO</div>' : (sim.free ? '<div class="simulacro-free-tag">PRUEBA GRATIS</div>' : '');
                    const priceHtml = sim.free 
                        ? '<span class="price-amount">GRATIS</span>'
                        : `<span class="price-amount">$ ${data.costo_inversion || sim.price}</span><span class="price-per">COP</span>`;
                    const btnClass = sim.free ? ' btn-free' : '';
                    const btnIcon = sim.free
                        ? '<path d="M5 12h14M12 5l7 7-7 7"></path>'
                        : '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"></path>';
                    const btnText = sim.free ? 'Probar Gratis' : 'Inscribirme';
                    
                    return `
                        <div class="simulacro-card${cssClass}">
                            ${tagHtml}
                            <div class="simulacro-header">
                                <div class="simulacro-edition">${sim.edition}</div>
                                <div class="simulacro-number">${sim.number}</div>
                                <div class="simulacro-type">${sim.type}</div>
                            </div>
                            <div class="simulacro-body">
                                <button class="sim-features-toggle" onclick="this.classList.toggle('open'); this.nextElementSibling.classList.toggle('features-open');">
                                    <span>Ver características</span>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div class="simulacro-includes">
                                    ${sim.features.map(f => `
                                        <div class="include-item">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                            <span>${f}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="simulacro-price-tag">
                                    ${priceHtml}
                                </div>
                                <a href="${sim.whatsappLink}" target="_blank" class="simulacro-buy-btn${btnClass}">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="${sim.free ? 'none' : 'currentColor'}" stroke="${sim.free ? 'currentColor' : 'none'}" stroke-width="${sim.free ? '2' : '0'}">
                                        ${btnIcon}
                                    </svg>
                                    <span>${btnText}</span>
                                </a>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

    } catch (error) {
        console.error("Error loading simulacros info from CMS:", error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadSections();
    loadTutors();
    loadSimulacros();
});
