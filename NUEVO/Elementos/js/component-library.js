// ═══════════════════════════════════════════════════
// COMPONENT LIBRARY — Reusable elements for all sections
// ═══════════════════════════════════════════════════

// Component definitions
const COMPONENT_CATEGORIES = [
    {
        name: 'Texto',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>',
        items: [
            {
                id: 'heading-h2',
                name: 'Título Principal',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-6 4-6 4-12"/></svg>',
                preview: '<h2 style="font-size:1.3rem;font-weight:800;margin:0;">Título de Sección</h2>',
                html: '<h2 class="section-title">Título de Sección</h2>',
                fields: { content: 'Título de Sección', tag: 'h2' }
            },
            {
                id: 'heading-h3',
                name: 'Subtítulo',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/></svg>',
                preview: '<h3 style="font-size:1rem;font-weight:600;margin:0;">Subtítulo Secundario</h3>',
                html: '<h3>Subtítulo Secundario</h3>',
                fields: { content: 'Subtítulo Secundario', tag: 'h3' }
            },
            {
                id: 'paragraph',
                name: 'Párrafo',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>',
                preview: '<p style="font-size:0.85rem;color:rgba(255,255,255,0.6);margin:0;">Texto de descripción editable para cualquier sección del sitio.</p>',
                html: '<p class="section-description">Texto de descripción editable para cualquier sección.</p>',
                fields: { content: 'Texto de descripción editable para cualquier sección.' }
            },
            {
                id: 'highlighted-text',
                name: 'Texto Destacado',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l-4 4 4 4"/><path d="M15 11l4 4-4 4"/></svg>',
                preview: '<span style="background:linear-gradient(135deg,#a78bfa,#06b6d4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:700;font-size:1rem;">Texto con gradiente</span>',
                html: '<span class="text-gradient">Texto con gradiente</span>',
                fields: { content: 'Texto con gradiente' }
            }
        ]
    },
    {
        name: 'Elementos UI',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
        items: [
            {
                id: 'badge',
                name: 'Badge / Etiqueta',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>',
                preview: '<div style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:rgba(167,139,250,0.12);border:1px solid rgba(167,139,250,0.25);border-radius:20px;font-size:0.7rem;font-weight:600;letter-spacing:0.08em;color:#a78bfa;">⭐ BADGE LABEL</div>',
                html: '<div class="section-badge"><span>BADGE LABEL</span></div>',
                fields: { content: 'BADGE LABEL', color: '#a78bfa' }
            },
            {
                id: 'cta-primary',
                name: 'Botón CTA Primario',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="4"/><path d="M12 8v8"/></svg>',
                preview: '<button style="background:linear-gradient(135deg,#a78bfa,#06b6d4);border:none;color:#fff;padding:10px 24px;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;">Botón Primario</button>',
                html: '<a href="#" class="hero-cta-primary">Botón Primario</a>',
                fields: { content: 'Botón Primario', link: '#' }
            },
            {
                id: 'cta-secondary',
                name: 'Botón Secundario',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="4"/></svg>',
                preview: '<button style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#f0f0f5;padding:10px 24px;border-radius:8px;font-weight:500;font-size:0.85rem;cursor:pointer;">Botón Secundario</button>',
                html: '<a href="#" class="hero-cta-secondary">Botón Secundario</a>',
                fields: { content: 'Botón Secundario', link: '#' }
            },
            {
                id: 'divider',
                name: 'Divisor',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="2" y1="12" x2="22" y2="12"/></svg>',
                preview: '<hr style="border:none;height:1px;background:linear-gradient(90deg,transparent,rgba(167,139,250,0.3),transparent);margin:8px 0;">',
                html: '<div class="trust-divider"></div>',
                fields: {}
            },
            {
                id: 'spacer',
                name: 'Espaciador',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
                preview: '<div style="height:32px;border:1px dashed rgba(255,255,255,0.1);border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;color:rgba(255,255,255,0.2);">32px</div>',
                html: '<div style="height:32px;"></div>',
                fields: { height: 32 }
            }
        ]
    },
    {
        name: 'Datos y Métricas',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
        items: [
            {
                id: 'stat-card',
                name: 'Tarjeta de Estadística',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
                preview: '<div style="display:flex;flex-direction:column;align-items:center;padding:12px;background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.15);border-radius:10px;"><span style="font-size:1.4rem;font-weight:800;">1400+</span><span style="font-size:0.65rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.08em;">Estudiantes</span></div>',
                html: '<div class="bento-stat-item"><span class="bento-stat-number">1400+</span><span class="bento-stat-label">Estudiantes</span></div>',
                fields: { number: '1400+', label: 'Estudiantes' }
            },
            {
                id: 'countdown',
                name: 'Countdown Timer',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                preview: '<div style="display:flex;gap:8px;"><div style="display:flex;flex-direction:column;align-items:center;"><div style="background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);border-radius:8px;padding:6px 10px;font-size:1.1rem;font-weight:700;">119</div><span style="font-size:0.55rem;color:rgba(255,255,255,0.3);margin-top:2px;">DÍAS</span></div><div style="display:flex;flex-direction:column;align-items:center;"><div style="background:rgba(167,139,250,0.1);border:1px solid rgba(167,139,250,0.2);border-radius:8px;padding:6px 10px;font-size:1.1rem;font-weight:700;">22</div><span style="font-size:0.55rem;color:rgba(255,255,255,0.3);margin-top:2px;">HRS</span></div></div>',
                html: '<div class="exam-countdown-card">...</div>',
                fields: { title: 'Examen Calendario A', date: '2026-07-26' }
            },
            {
                id: 'live-counter',
                name: 'Contador en Vivo',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
                preview: '<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:20px;font-size:0.78rem;"><div style="width:8px;height:8px;border-radius:50%;background:#10b981;animation:pulse 2s infinite;"></div><span><strong>1583</strong> estudiantes inscritos</span></div>',
                html: '<div class="live-counter-badge"><div class="live-counter-dot"></div><span class="live-counter-text"><strong>1583</strong> estudiantes inscritos</span></div>',
                fields: { count: '1583', text: 'estudiantes inscritos esta temporada' }
            },
            {
                id: 'trust-item',
                name: 'Item de Confianza',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
                preview: '<div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;color:rgba(255,255,255,0.7);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Resultados garantizados</span></div>',
                html: '<div class="trust-item"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><span>Resultados garantizados</span></div>',
                fields: { content: 'Resultados garantizados', icon: 'check' }
            }
        ]
    },
    {
        name: 'Multimedia',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
        items: [
            {
                id: 'image-frame',
                name: 'Marco de Imagen',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
                preview: '<div style="width:100%;height:80px;border-radius:10px;background:linear-gradient(135deg,rgba(167,139,250,0.1),rgba(6,182,212,0.1));border:1px dashed rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>',
                html: '<div class="bento-card" style="min-height:200px;"><img src="" alt="Imagen" style="width:100%;height:100%;object-fit:cover;border-radius:12px;"></div>',
                fields: { src: '', alt: 'Imagen' }
            },
            {
                id: 'icon-svg',
                name: 'Icono SVG',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
                preview: '<div style="display:flex;gap:12px;align-items:center;"><div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,#a78bfa,#7c3aed);display:flex;align-items:center;justify-content:center;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><span style="font-size:0.75rem;color:rgba(255,255,255,0.5);">Ícono decorativo</span></div>',
                html: '<div class="bento-card-icon"><svg>...</svg></div>',
                fields: { icon: 'star' }
            }
        ]
    },
    {
        name: 'Tarjetas',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20"/></svg>',
        items: [
            {
                id: 'feature-card',
                name: 'Tarjeta de Feature',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>',
                preview: '<div style="padding:14px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;"><div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,rgba(167,139,250,0.2),rgba(6,182,212,0.2));display:flex;align-items:center;justify-content:center;margin-bottom:10px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div><div style="font-size:0.85rem;font-weight:600;margin-bottom:4px;">Título Feature</div><div style="font-size:0.72rem;color:rgba(255,255,255,0.45);">Descripción breve de esta característica.</div></div>',
                html: '<div class="bento-card bento-card-feature"><div class="bento-card-icon"><svg>...</svg></div><h3 class="bento-card-title">Título Feature</h3><p class="bento-card-desc">Descripción breve de esta característica.</p><div class="bento-card-tag">Tag</div></div>',
                fields: { title: 'Título Feature', desc: 'Descripción breve de esta característica.', tag: 'Tag' }
            },
            {
                id: 'tutor-card',
                name: 'Tarjeta de Tutor',
                icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
                preview: '<div style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,rgba(167,139,250,0.15),rgba(6,182,212,0.15));display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><div><div style="font-size:0.82rem;font-weight:600;">Nombre Tutor</div><div style="font-size:0.65rem;color:#a78bfa;text-transform:uppercase;">ROL</div></div></div>',
                html: '<div class="tutor-card tutor-slide">...</div>',
                fields: { name: 'Nombre Tutor', role: 'ROL', image: '' }
            }
        ]
    }
];

// ─── Init ───
export function initComponentLibrary() {
    const btn = document.getElementById('library-toggle-btn');
    const closeBtn = document.getElementById('library-close-btn');
    const searchInput = document.getElementById('library-search');

    if (btn) btn.addEventListener('click', toggleLibrary);
    if (closeBtn) closeBtn.addEventListener('click', () => setLibraryVisible(false));
    if (searchInput) searchInput.addEventListener('input', (e) => filterComponents(e.target.value));

    renderLibrary();
}

let libraryVisible = false;

export function toggleLibrary() {
    setLibraryVisible(!libraryVisible);
}

function setLibraryVisible(visible) {
    libraryVisible = visible;
    const drawer = document.getElementById('component-library-drawer');
    const btn = document.getElementById('library-toggle-btn');
    if (visible) {
        drawer?.classList.add('open');
        btn?.classList.add('active');
    } else {
        drawer?.classList.remove('open');
        btn?.classList.remove('active');
    }
}

// ─── Render library categories and items ───
function renderLibrary() {
    const container = document.getElementById('library-categories');
    if (!container) return;

    container.innerHTML = COMPONENT_CATEGORIES.map(cat => `
        <div class="lib-category">
            <button class="lib-category-header" onclick="this.parentElement.classList.toggle('expanded')">
                <div class="lib-category-label">
                    ${cat.icon}
                    <span>${cat.name}</span>
                </div>
                <svg class="lib-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="lib-category-items">
                ${cat.items.map(item => `
                    <div class="lib-item" draggable="true" data-component-id="${item.id}" title="${item.name}">
                        <div class="lib-item-icon">${item.icon}</div>
                        <div class="lib-item-info">
                            <span class="lib-item-name">${item.name}</span>
                        </div>
                        <button class="lib-item-insert" onclick="window._insertComponent('${item.id}')" title="Insertar código">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        </button>
                    </div>
                    <div class="lib-item-preview">${item.preview}</div>
                `).join('')}
            </div>
        </div>
    `).join('');

    // Expand first category
    const firstCat = container.querySelector('.lib-category');
    if (firstCat) firstCat.classList.add('expanded');
}

// ─── Filter ───
function filterComponents(query) {
    const q = query.toLowerCase().trim();
    document.querySelectorAll('.lib-item').forEach(item => {
        const name = item.querySelector('.lib-item-name')?.textContent.toLowerCase() || '';
        const matches = !q || name.includes(q);
        item.style.display = matches ? '' : 'none';
        const preview = item.nextElementSibling;
        if (preview?.classList.contains('lib-item-preview')) {
            preview.style.display = matches ? '' : 'none';
        }
    });

    // Show/hide empty categories
    document.querySelectorAll('.lib-category').forEach(cat => {
        const visibleItems = cat.querySelectorAll('.lib-item:not([style*="display: none"])');
        cat.style.display = visibleItems.length > 0 ? '' : 'none';
        if (q && visibleItems.length > 0) cat.classList.add('expanded');
    });
}

// ─── Insert Component ───
window._insertComponent = function(componentId) {
    let comp = null;
    for (const cat of COMPONENT_CATEGORIES) {
        comp = cat.items.find(i => i.id === componentId);
        if (comp) break;
    }
    if (!comp) return;

    // Show insert modal
    showInsertModal(comp);
};

function showInsertModal(comp) {
    const modal = document.getElementById('component-insert-modal');
    if (!modal) return;

    const title = modal.querySelector('.modal-header h3');
    const body = modal.querySelector('.modal-body');

    title.textContent = `Insertar: ${comp.name}`;

    let fieldsHtml = `<div class="lib-insert-preview">${comp.preview}</div>`;

    if (comp.fields.content !== undefined) {
        fieldsHtml += `<div class="field-group"><label>Contenido</label><input type="text" class="field-input" id="insert-content" value="${comp.fields.content}"></div>`;
    }
    if (comp.fields.link !== undefined) {
        fieldsHtml += `<div class="field-group"><label>Enlace (href)</label><input type="text" class="field-input" id="insert-link" value="${comp.fields.link}"></div>`;
    }
    if (comp.fields.number !== undefined) {
        fieldsHtml += `<div class="field-group"><label>Número</label><input type="text" class="field-input" id="insert-number" value="${comp.fields.number}"></div>`;
    }
    if (comp.fields.label !== undefined) {
        fieldsHtml += `<div class="field-group"><label>Etiqueta</label><input type="text" class="field-input" id="insert-label" value="${comp.fields.label}"></div>`;
    }
    if (comp.fields.title !== undefined) {
        fieldsHtml += `<div class="field-group"><label>Título</label><input type="text" class="field-input" id="insert-title" value="${comp.fields.title}"></div>`;
    }
    if (comp.fields.desc !== undefined) {
        fieldsHtml += `<div class="field-group"><label>Descripción</label><textarea class="field-textarea" id="insert-desc" rows="2">${comp.fields.desc}</textarea></div>`;
    }
    if (comp.fields.tag !== undefined && comp.id !== 'heading-h2') {
        fieldsHtml += `<div class="field-group"><label>Tag</label><input type="text" class="field-input" id="insert-tag" value="${comp.fields.tag}"></div>`;
    }
    if (comp.fields.src !== undefined) {
        fieldsHtml += `<div class="field-group"><label>URL de imagen</label><input type="url" class="field-input" id="insert-src" value="${comp.fields.src}" placeholder="https://..."></div>`;
    }
    if (comp.fields.height !== undefined) {
        fieldsHtml += `<div class="field-group"><label>Altura (px)</label><input type="number" class="field-input" id="insert-height" value="${comp.fields.height}"></div>`;
    }

    fieldsHtml += `
        <div class="field-group">
            <label>Insertar en sección</label>
            <select class="field-input" id="insert-target-section">
                <option value="hero">Hero</option>
                <option value="about">Quiénes Somos</option>
                <option value="plans">Planes & Precios</option>
                <option value="footer">Footer</option>
            </select>
        </div>
    `;

    fieldsHtml += `
        <div class="lib-insert-code">
            <label style="font-size:0.68rem;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;display:block;">HTML generado</label>
            <pre style="font-size:0.72rem;background:rgba(0,0,0,0.3);padding:10px;border-radius:6px;overflow-x:auto;color:rgba(255,255,255,0.5);max-height:100px;"><code>${escapeHtml(comp.html)}</code></pre>
        </div>
    `;

    body.innerHTML = fieldsHtml;

    // Store component reference
    modal._currentComp = comp;
    modal.classList.add('active');
}

window._closeInsertModal = function() {
    document.getElementById('component-insert-modal')?.classList.remove('active');
};

window._confirmInsert = function() {
    const modal = document.getElementById('component-insert-modal');
    if (!modal || !modal._currentComp) return;

    const comp = modal._currentComp;
    const section = document.getElementById('insert-target-section')?.value || 'hero';

    // Emit custom event with the component data
    const detail = {
        componentId: comp.id,
        html: comp.html,
        section: section,
        fields: {}
    };

    // Gather modified field values
    const contentEl = document.getElementById('insert-content');
    if (contentEl) detail.fields.content = contentEl.value;
    const linkEl = document.getElementById('insert-link');
    if (linkEl) detail.fields.link = linkEl.value;
    const numberEl = document.getElementById('insert-number');
    if (numberEl) detail.fields.number = numberEl.value;
    const labelEl = document.getElementById('insert-label');
    if (labelEl) detail.fields.label = labelEl.value;

    window.dispatchEvent(new CustomEvent('sg-component-insert', { detail }));

    window._showToastGlobal?.(`Componente "${comp.name}" registrado para ${section.toUpperCase()}`);
    modal.classList.remove('active');
};

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
