// ═══════════════════════════════════════════════════
// CMS PREVIEW RECEIVER — Listens for postMessage updates from admin.html
// Injected into index.html to enable live preview
// ═══════════════════════════════════════════════════

(function() {
    'use strict';
    
    window.addEventListener('message', function(event) {
        const data = event.data.payload;
        if (data === undefined) return;

        if (event.data.type === 'SG_CMS_FOCUS_SECTION') {
            const sectionTarget = data;
            const allTargets = ['nav', 'section', 'footer'];
            const map = {
                'dashboard': ['nav', 'section', 'footer'], 
                'hero-editor': ['nav', '#inicio'],
                'about-editor': ['#about'],
                'stats-editor': ['#testimonios', '#resultados', '#comparacion'],
                'tutors-editor': ['#nosotros'],
                'plans-editor': ['#planes', '#simulacros'],
                'media-manager': ['#contenido'], 
                'footer-editor': ['#contacto', 'footer'],
                'settings': ['nav', 'section', 'footer']
            };
            const toShow = map[sectionTarget] || map['dashboard'];
            
            const elements = document.querySelectorAll(allTargets.join(', '));
            elements.forEach(el => {
                const shouldShow = toShow.some(s => el.matches(s));
                if (shouldShow) {
                    el.style.display = '';
                } else {
                    el.style.display = 'none';
                }
            });
            window.scrollTo({top: 0, behavior: 'instant'});
            return;
        }

        if (event.data.type !== 'SG_CMS_UPDATE') return;

        // ─── HERO ───
        if (data.hero) {
            const h = data.hero;
            setText('#hero-badge', h.badge);
            setText('#hero-title1', h.titleLine1);
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
            const plansBadge = document.querySelector('#planes .section-badge span, #simulacros .section-badge span');
            if (plansBadge && p.badge) plansBadge.textContent = p.badge;
            
            const plansTitle = document.querySelector('#planes .section-title, #simulacros .section-title');
            if (plansTitle && p.title) plansTitle.innerHTML = p.title;
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

        // Flash effect to show update
        document.body.style.transition = 'box-shadow 0.3s ease';
        document.body.style.boxShadow = 'inset 0 0 30px rgba(167,139,250,0.08)';
        setTimeout(() => { document.body.style.boxShadow = 'none'; }, 400);
    });
    
    function setText(selector, value) {
        if (!value && value !== 0) return;
        const el = document.querySelector(selector);
        if (el) el.textContent = value;
    }
})();
