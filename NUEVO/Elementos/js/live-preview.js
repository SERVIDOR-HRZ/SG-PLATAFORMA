// ═══════════════════════════════════════════════════
// LIVE PREVIEW MODULE — Real-time iframe preview
// ═══════════════════════════════════════════════════

const PREVIEW_ORIGIN = window.location.origin;
let previewFrame = null;
let previewVisible = false;
let previewDebounce = null;

// ─── Init ───
export function initLivePreview() {
    previewFrame = document.getElementById('live-preview-frame');
    const toggleBtn = document.getElementById('preview-toggle-btn');
    const closeBtn = document.getElementById('preview-close-btn');
    const refreshBtn = document.getElementById('preview-refresh-btn');
    const deviceBtns = document.querySelectorAll('.preview-device-btn');

    if (toggleBtn) toggleBtn.addEventListener('click', togglePreview);
    if (closeBtn) closeBtn.addEventListener('click', () => setPreviewVisible(false));
    if (refreshBtn) refreshBtn.addEventListener('click', refreshPreview);

    deviceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            deviceBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const device = btn.dataset.device;
            setPreviewDevice(device);
        });
    });

    // Listen for all input/textarea changes in editor
    document.addEventListener('input', (e) => {
        if (e.target.closest('.content-section') && (e.target.matches('.field-input') || e.target.matches('.field-textarea'))) {
            schedulePreviewUpdate();
        }
    });
}

// ─── Toggle ───
export function togglePreview() {
    setPreviewVisible(!previewVisible);
}

export function setPreviewVisible(visible) {
    previewVisible = visible;
    const panel = document.getElementById('preview-panel');
    const mainContent = document.getElementById('main-content');
    const toggleBtn = document.getElementById('preview-toggle-btn');

    if (visible) {
        panel.classList.add('open');
        mainContent.classList.add('preview-active');
        toggleBtn?.classList.add('active');
        if (previewFrame && !previewFrame.src) {
            previewFrame.src = '../index.html';
        }
        previewFrame?.addEventListener('load', onPreviewLoad, { once: true });
    } else {
        panel.classList.remove('open');
        mainContent.classList.remove('preview-active');
        toggleBtn?.classList.remove('active');
    }
}

function onPreviewLoad() {
    pushCurrentDataToPreview();
    const activeSection = document.querySelector('.nav-item.active')?.dataset?.section || 'dashboard';
    focusPreviewSection(activeSection);
}

// ─── Device Modes ───
function setPreviewDevice(device) {
    const wrapper = document.getElementById('preview-frame-wrapper');
    if (!wrapper) return;
    wrapper.className = 'preview-frame-wrapper';
    wrapper.classList.add(`preview-${device}`);
}

// ─── Refresh ───
export function refreshPreview() {
    if (previewFrame) {
        previewFrame.contentWindow?.location.reload();
        previewFrame.addEventListener('load', onPreviewLoad, { once: true });
    }
}

// ─── Schedule debounced update ───
function schedulePreviewUpdate() {
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(() => {
        pushCurrentDataToPreview();
    }, 300);
}

// ─── Push data to iframe ───
export function pushCurrentDataToPreview() {
    if (!previewFrame || !previewFrame.contentWindow) return;

    const data = gatherAllPreviewData();
    try {
        previewFrame.contentWindow.postMessage({
            type: 'SG_CMS_UPDATE',
            payload: data
        }, '*');
    } catch (e) {
        // Cross-origin or iframe not ready — try direct DOM manipulation
        tryDirectDOMUpdate(data);
    }
}

// ─── Focus Section ───
export function focusPreviewSection(sectionId) {
    if (!previewFrame || !previewFrame.contentWindow) return;
    try {
        previewFrame.contentWindow.postMessage({
            type: 'SG_CMS_FOCUS_SECTION',
            payload: sectionId
        }, '*');
    } catch (e) {
        // cross-origin ignore
    }
}

// ─── Gather all editable field data ───
function gatherAllPreviewData() {
    const get = (id) => document.getElementById(id)?.value || '';

    return {
        hero: {
            badge: get('hero-badge'),
            titleLine1: get('hero-title-line1'),
            titleLine2: get('hero-title-line2'),
            subtitle: get('hero-subtitle'),
            description: get('hero-description'),
            cta1Text: get('hero-cta-primary-text'),
            cta1Price: get('hero-cta-price'),
            cta2Text: get('hero-cta-secondary-text'),
            countdownTitle: get('hero-countdown-title'),
            liveCount: get('hero-live-count'),
            liveText: get('hero-live-text')
        },
        about: {
            badge: get('about-badge'),
            title: get('about-title'),
            description: get('about-description'),
            tagline: get('about-tagline'),
            trust: [get('trust-1'), get('trust-2'), get('trust-3'), get('trust-4')]
        },
        plans: {
            badge: get('plans-badge'),
            title: get('plans-title'),
            desc: get('plans-desc'),
            priceFrom: get('plans-price-from')
        },
        footer: {
            tagline: get('footer-tagline'),
            copyright: get('footer-copyright')
        }
    };
}

// ─── Direct DOM update fallback (same-origin iframe) ───
function tryDirectDOMUpdate(data) {
    try {
        const doc = previewFrame.contentDocument;
        if (!doc) return;

        // Hero
        const setBadge = doc.getElementById('hero-badge');
        if (setBadge) setBadge.textContent = data.hero.badge;

        const t1 = doc.getElementById('hero-title1');
        if (t1) t1.textContent = data.hero.titleLine1;

        const t2 = doc.getElementById('hero-title2');
        if (t2) t2.textContent = data.hero.titleLine2;

        const sub = doc.getElementById('hero-subtitle');
        if (sub) sub.textContent = data.hero.subtitle;

        const desc = doc.getElementById('hero-desc');
        if (desc) desc.textContent = data.hero.description;

        const lc = doc.getElementById('live-count');
        if (lc) lc.textContent = data.hero.liveCount;

        // About section
        const aboutTitle = doc.querySelector('#about .section-title');
        if (aboutTitle && data.about.title) {
            aboutTitle.innerHTML = data.about.title;
        }

        const aboutDesc = doc.querySelector('#about .section-description');
        if (aboutDesc) aboutDesc.textContent = data.about.description;

        // Trust bar items
        const trustItems = doc.querySelectorAll('.trust-item span');
        data.about.trust.forEach((text, i) => {
            if (trustItems[i]) trustItems[i].textContent = text;
        });

    } catch (e) {
        console.warn('Direct DOM update failed:', e);
    }
}
