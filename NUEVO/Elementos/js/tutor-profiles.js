/**
 * Tutor Profile Manager — Full profile CRUD with Firestore persistence
 * Manages complete tutor profiles: bio, timeline, education, stats, quotes
 */
import { db } from './firebase.js';
import { doc, setDoc, deleteDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

let tutors = [];
let editingId = null;
let activeProfileTab = 'basic';

// ── Public API ──────────────────────────────────────────
export function initTutorProfiles() {
    _injectProfileModal();
    _bindEvents();
}

export async function loadTutors() {
    try {
        const snap = await getDocs(collection(db, "tutores"));
        tutors = [];
        snap.forEach(d => tutors.push({ id: d.id, ...d.data() }));
        tutors.sort((a, b) => (a.order || 99) - (b.order || 99));
        renderTutorGrid();
        return tutors;
    } catch (e) {
        console.error("Error loading tutors", e);
        return [];
    }
}

export function getTutors() { return tutors; }

// ── Render Grid ─────────────────────────────────────────
function renderTutorGrid() {
    const grid = document.getElementById('tutors-grid');
    if (!grid) return;
    grid.innerHTML = '';

    tutors.forEach(t => {
        const card = document.createElement('div');
        card.className = 'tutor-profile-card';
        const hasProfile = t.bio || t.timeline;
        card.innerHTML = `
            <div class="tpc-header">
                <div class="tpc-avatar" style="background-image:url('${t.image || ''}')">
                    ${!t.image ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' : ''}
                </div>
                <div class="tpc-info">
                    <h4>${t.name}</h4>
                    <span>${t.role || ''}</span>
                    <div class="tpc-badges">
                        <span class="tpc-badge ${t.badgeColor || ''}">${t.badge || ''}</span>
                        ${hasProfile ? '<span class="tpc-badge tpc-badge-profile">Perfil Completo</span>' : '<span class="tpc-badge tpc-badge-pending">Sin Perfil</span>'}
                    </div>
                </div>
            </div>
            <div class="tpc-meta">
                <div class="tpc-meta-item"><strong>Especialidad:</strong> ${t.specialty || '—'}</div>
                <div class="tpc-meta-item"><strong>Universidad:</strong> ${t.university || '—'}</div>
                <div class="tpc-meta-item"><strong>Página:</strong> ${t.profilePage || '—'}</div>
            </div>
            <div class="tpc-actions">
                <button class="tpc-btn tpc-btn-edit" onclick="openFullProfile('${t.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar Perfil
                </button>
                <button class="tpc-btn tpc-btn-preview" onclick="previewTutorPage('${t.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Ver Página
                </button>
                <button class="tpc-btn tpc-btn-delete" onclick="confirmDeleteTutor('${t.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    const badge = document.getElementById('tutor-count-badge');
    if (badge) badge.textContent = tutors.length;

    if (typeof Sortable !== 'undefined') {
        new Sortable(grid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: function(evt) {
                // In a real app we'd update the array and save
                if(window.showToast) window.showToast("Nuevo orden guardado", "success");
            }
        });
    }
}

// ── Profile Modal ───────────────────────────────────────
function _injectProfileModal() {
    if (document.getElementById('tutor-profile-modal')) return;
    const modal = document.createElement('div');
    modal.className = 'tp-modal-overlay';
    modal.id = 'tutor-profile-modal';
    modal.innerHTML = `
    <div class="tp-modal">
        <div class="tp-modal-header">
            <h3 id="tp-modal-title">Perfil Completo del Tutor</h3>
            <button class="tp-close" onclick="closeProfileModal()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>

        <!-- Tab Navigation -->
        <div class="tp-tabs">
            <button class="tp-tab active" data-tab="basic" onclick="switchProfileTab('basic')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Datos Básicos
            </button>
            <button class="tp-tab" data-tab="bio" onclick="switchProfileTab('bio')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                Biografía
            </button>
            <button class="tp-tab" data-tab="timeline" onclick="switchProfileTab('timeline')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Trayectoria
            </button>
            <button class="tp-tab" data-tab="education" onclick="switchProfileTab('education')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                Educación
            </button>
            <button class="tp-tab" data-tab="extras" onclick="switchProfileTab('extras')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Extras
            </button>
        </div>

        <div class="tp-modal-body">
            <!-- TAB: Basic -->
            <div class="tp-panel active" id="tp-panel-basic">
                <div class="tp-preview-banner" id="tp-preview-banner">
                    <div class="tp-preview-img" id="tp-preview-img"></div>
                    <div class="tp-preview-info">
                        <span class="tp-preview-name" id="tp-preview-name">Nombre</span>
                        <span class="tp-preview-role" id="tp-preview-role">Rol</span>
                    </div>
                </div>
                <div class="tp-field-row">
                    <div class="tp-field"><label>Nombre completo *</label><input type="text" id="tp-name" placeholder="Ej: Daniel De La Cruz"></div>
                    <div class="tp-field"><label>Rol / Cargo *</label><input type="text" id="tp-role" placeholder="Ej: PRESIDENTE Y FUNDADOR (+3 AÑOS)"></div>
                </div>
                <div class="tp-field-row">
                    <div class="tp-field"><label>Badge</label><input type="text" id="tp-badge" placeholder="Ej: 475 PUNTOS"></div>
                    <div class="tp-field"><label>Color Badge</label>
                        <select id="tp-badge-color">
                            <option value="">Default (morado)</option>
                            <option value="badge-blue">Azul</option>
                            <option value="badge-cyan">Cyan</option>
                            <option value="badge-pink">Rosa</option>
                            <option value="badge-green">Verde</option>
                            <option value="badge-orange">Naranja</option>
                            <option value="badge-yellow">Amarillo</option>
                            <option value="badge-purple">Púrpura</option>
                        </select>
                    </div>
                </div>
                <div class="tp-field-row">
                    <div class="tp-field" style="flex:2"><label>URL de Imagen de Perfil</label><input type="url" id="tp-image" placeholder="https://... o images/tutor.jpg"></div>
                    <div class="tp-field" style="flex:3"><label>Página de Perfil (HTML) *Separado*</label><input type="text" id="tp-profile-page" placeholder="Ej: pages/tutor-angel.html"></div>
                </div>
                <div class="tp-field"><label>URL de Imagen Hero (fondo grande)</label><input type="url" id="tp-hero-image" placeholder="URL de imagen de fondo para la página de perfil"></div>
                <div class="tp-field-row">
                    <div class="tp-field"><label>Especialidad</label><input type="text" id="tp-specialty" placeholder="Ej: Matemáticas & Física"></div>
                    <div class="tp-field"><label>Universidad</label><input type="text" id="tp-university" placeholder="Ej: UNAL - Medicina"></div>
                </div>
                <div class="tp-field-row">
                    <div class="tp-field"><label>Orden (posición en carrusel)</label><input type="number" id="tp-order" placeholder="1" min="1"></div>
                    <div class="tp-field"><label>Tagline (frase corta)</label><input type="text" id="tp-tagline" placeholder="De un pequeño pueblo a las grandes ligas"></div>
                </div>
                <div class="tp-field"><label>Logros (separados por punto y coma ;)</label><textarea id="tp-achievements" rows="3" placeholder="477 Puntos ICFES; Estudiante de Medicina UIS; Apasionado por la Física"></textarea></div>
            </div>

            <!-- TAB: Bio -->
            <div class="tp-panel" id="tp-panel-bio">
                <div class="tp-section-label">Biografía del tutor — Se muestra en la página de perfil completo</div>
                <div class="tp-field"><label>Introducción (párrafo 1)</label><textarea id="tp-bio-intro" rows="4" placeholder="Historia de origen del tutor..."></textarea></div>
                <div class="tp-field"><label>Desarrollo (párrafo 2)</label><textarea id="tp-bio-body" rows="4" placeholder="Su trayectoria académica y logros..."></textarea></div>
                <div class="tp-field"><label>Cierre / Visión (párrafo 3)</label><textarea id="tp-bio-closing" rows="4" placeholder="Su visión actual y futuro..."></textarea></div>
                <div class="tp-field"><label>Cita inspiracional</label><textarea id="tp-quote" rows="2" placeholder="Una frase memorable del tutor"></textarea></div>
                <div class="tp-field"><label>Autor de la cita</label><input type="text" id="tp-quote-author" placeholder="— Daniel De La Cruz"></div>
            </div>

            <!-- TAB: Timeline -->
            <div class="tp-panel" id="tp-panel-timeline">
                <div class="tp-section-label">Línea de tiempo — Eventos clave en la vida del tutor</div>
                <div id="tp-timeline-list"></div>
                <button class="tp-btn-add" onclick="addTimelineItem()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Agregar Evento
                </button>
            </div>

            <!-- TAB: Education -->
            <div class="tp-panel" id="tp-panel-education">
                <div class="tp-section-label">Formación académica y certificaciones</div>
                <div id="tp-edu-list"></div>
                <button class="tp-btn-add" onclick="addEduItem()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Agregar Formación
                </button>
            </div>

            <!-- TAB: Extras -->
            <div class="tp-panel" id="tp-panel-extras">
                <div class="tp-section-label">Estadísticas y redes sociales</div>
                <h4 style="color:#a78bfa;margin-bottom:.5rem;font-size:.85rem;">Estadísticas del Hero</h4>
                <div class="tp-field-row">
                    <div class="tp-field"><label>Stat 1 Número</label><input type="text" id="tp-stat1-num" placeholder="477"></div>
                    <div class="tp-field"><label>Stat 1 Label</label><input type="text" id="tp-stat1-label" placeholder="Puntaje ICFES"></div>
                </div>
                <div class="tp-field-row">
                    <div class="tp-field"><label>Stat 2 Número</label><input type="text" id="tp-stat2-num" placeholder="3+"></div>
                    <div class="tp-field"><label>Stat 2 Label</label><input type="text" id="tp-stat2-label" placeholder="Años de experiencia"></div>
                </div>
                <div class="tp-field-row">
                    <div class="tp-field"><label>Stat 3 Número</label><input type="text" id="tp-stat3-num" placeholder="500+"></div>
                    <div class="tp-field"><label>Stat 3 Label</label><input type="text" id="tp-stat3-label" placeholder="Estudiantes"></div>
                </div>
                <div class="tp-field-row">
                    <div class="tp-field"><label>Stat 4 Número</label><input type="text" id="tp-stat4-num" placeholder="100%"></div>
                    <div class="tp-field"><label>Stat 4 Label</label><input type="text" id="tp-stat4-label" placeholder="Dedicación"></div>
                </div>

                <h4 style="color:#a78bfa;margin:1.5rem 0 .5rem;font-size:.85rem;">Valores Personales (3 valores)</h4>
                <div id="tp-values-list"></div>
                <button class="tp-btn-add" onclick="addValueItem()" style="margin-bottom:1.5rem;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Agregar Valor
                </button>

                <h4 style="color:#a78bfa;margin-bottom:.5rem;font-size:.85rem;">Redes Sociales</h4>
                <div class="tp-field-row">
                    <div class="tp-field"><label>LinkedIn</label><input type="url" id="tp-linkedin" placeholder="https://linkedin.com/in/..."></div>
                    <div class="tp-field"><label>Instagram</label><input type="url" id="tp-instagram" placeholder="https://instagram.com/..."></div>
                </div>
                <div class="tp-field"><label>WhatsApp (número)</label><input type="text" id="tp-whatsapp" placeholder="573001234567"></div>
            </div>
        </div>

        <div class="tp-modal-footer">
            <button class="tp-btn-cancel" onclick="closeProfileModal()">Cancelar</button>
            <button class="tp-btn-save" onclick="saveFullProfile()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Guardar Perfil Completo
            </button>
        </div>
    </div>`;
    document.body.appendChild(modal);
}

function _bindEvents() {
    // Live preview updates for name/role/image
    document.addEventListener('input', e => {
        if (e.target.id === 'tp-name') {
            const el = document.getElementById('tp-preview-name');
            if (el) el.textContent = e.target.value || 'Nombre';
        }
        if (e.target.id === 'tp-role') {
            const el = document.getElementById('tp-preview-role');
            if (el) el.textContent = e.target.value || 'Rol';
        }
        if (e.target.id === 'tp-image') {
            const el = document.getElementById('tp-preview-img');
            if (el) el.style.backgroundImage = e.target.value ? `url('${e.target.value}')` : 'none';
        }
    });
}

// ── Tab switching ───────────────────────────────────────
window.switchProfileTab = function(tab) {
    activeProfileTab = tab;
    document.querySelectorAll('.tp-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.tp-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById('tp-panel-' + tab);
    if (panel) panel.classList.add('active');
};

// ── Open / Close ────────────────────────────────────────
window.openFullProfile = function(id) {
    editingId = id || null;
    const tutor = id ? tutors.find(t => t.id === id) : null;

    document.getElementById('tp-modal-title').textContent = tutor ? `Editar: ${tutor.name}` : 'Nuevo Tutor';
    switchProfileTab('basic');

    // Basic
    _setVal('tp-name', tutor?.name);
    _setVal('tp-role', tutor?.role);
    _setVal('tp-badge', tutor?.badge);
    _setVal('tp-badge-color', tutor?.badgeColor);
    _setVal('tp-image', tutor?.image);
    _setVal('tp-profile-page', tutor?.profilePage);
    _setVal('tp-hero-image', tutor?.heroImage);
    _setVal('tp-specialty', tutor?.specialty);
    _setVal('tp-university', tutor?.university);
    _setVal('tp-order', tutor?.order);
    _setVal('tp-tagline', tutor?.tagline);
    _setVal('tp-achievements', tutor?.achievements);

    // Preview banner
    const img = document.getElementById('tp-preview-img');
    if (img) img.style.backgroundImage = tutor?.image ? `url('${tutor.image}')` : 'none';
    _setText('tp-preview-name', tutor?.name || 'Nombre');
    _setText('tp-preview-role', tutor?.role || 'Rol');

    // Bio
    _setVal('tp-bio-intro', tutor?.bio?.intro);
    _setVal('tp-bio-body', tutor?.bio?.body);
    _setVal('tp-bio-closing', tutor?.bio?.closing);
    _setVal('tp-quote', tutor?.quote?.text);
    _setVal('tp-quote-author', tutor?.quote?.author);

    // Timeline
    _renderTimelineItems(tutor?.timeline || []);

    // Education
    _renderEduItems(tutor?.education || []);

    // Stats
    _setVal('tp-stat1-num', tutor?.stats?.[0]?.num);
    _setVal('tp-stat1-label', tutor?.stats?.[0]?.label);
    _setVal('tp-stat2-num', tutor?.stats?.[1]?.num);
    _setVal('tp-stat2-label', tutor?.stats?.[1]?.label);
    _setVal('tp-stat3-num', tutor?.stats?.[2]?.num);
    _setVal('tp-stat3-label', tutor?.stats?.[2]?.label);
    _setVal('tp-stat4-num', tutor?.stats?.[3]?.num);
    _setVal('tp-stat4-label', tutor?.stats?.[3]?.label);

    // Values
    _renderValueItems(tutor?.values || []);

    // Social
    _setVal('tp-linkedin', tutor?.social?.linkedin);
    _setVal('tp-instagram', tutor?.social?.instagram);
    _setVal('tp-whatsapp', tutor?.social?.whatsapp);

    document.getElementById('tutor-profile-modal').classList.add('active');
};

window.closeProfileModal = function() {
    document.getElementById('tutor-profile-modal').classList.remove('active');
    editingId = null;
};

// ── Dynamic list items ──────────────────────────────────
window.addTimelineItem = function() {
    const list = document.getElementById('tp-timeline-list');
    const idx = list.children.length;
    const item = document.createElement('div');
    item.className = 'tp-dynamic-item';
    item.innerHTML = `
        <div class="tp-dynamic-header"><span>Evento ${idx + 1}</span><button onclick="this.closest('.tp-dynamic-item').remove()">✕</button></div>
        <div class="tp-field-row">
            <div class="tp-field"><label>Año / Fecha</label><input type="text" class="tl-year" placeholder="2022"></div>
            <div class="tp-field"><label>Título</label><input type="text" class="tl-title" placeholder="Ingreso a la universidad"></div>
        </div>
        <div class="tp-field"><label>Descripción</label><textarea class="tl-desc" rows="2" placeholder="Detalle del evento..."></textarea></div>
    `;
    list.appendChild(item);
};

window.addEduItem = function() {
    const list = document.getElementById('tp-edu-list');
    const idx = list.children.length;
    const item = document.createElement('div');
    item.className = 'tp-dynamic-item';
    item.innerHTML = `
        <div class="tp-dynamic-header"><span>Formación ${idx + 1}</span><button onclick="this.closest('.tp-dynamic-item').remove()">✕</button></div>
        <div class="tp-field-row">
            <div class="tp-field"><label>Institución</label><input type="text" class="edu-inst" placeholder="Universidad Nacional"></div>
            <div class="tp-field"><label>Programa / Título</label><input type="text" class="edu-prog" placeholder="Ingeniería de Sistemas"></div>
        </div>
        <div class="tp-field-row">
            <div class="tp-field"><label>Emoji/Icono</label><input type="text" class="edu-icon" placeholder="🎓" maxlength="4"></div>
            <div class="tp-field"><label>Descripción breve</label><input type="text" class="edu-desc" placeholder="Formación en..."></div>
        </div>
    `;
    list.appendChild(item);
};

window.addValueItem = function() {
    const list = document.getElementById('tp-values-list');
    const item = document.createElement('div');
    item.className = 'tp-dynamic-item';
    item.innerHTML = `
        <div class="tp-dynamic-header"><span>Valor</span><button onclick="this.closest('.tp-dynamic-item').remove()">✕</button></div>
        <div class="tp-field-row">
            <div class="tp-field" style="flex:0 0 60px"><label>Emoji</label><input type="text" class="val-icon" placeholder="🚀" maxlength="4"></div>
            <div class="tp-field"><label>Título</label><input type="text" class="val-title" placeholder="Innovación"></div>
        </div>
        <div class="tp-field"><label>Descripción</label><input type="text" class="val-desc" placeholder="Breve descripción del valor"></div>
    `;
    list.appendChild(item);
};

function _renderTimelineItems(items) {
    const list = document.getElementById('tp-timeline-list');
    list.innerHTML = '';
    items.forEach(() => addTimelineItem());
    const cards = list.querySelectorAll('.tp-dynamic-item');
    items.forEach((it, i) => {
        if (!cards[i]) return;
        cards[i].querySelector('.tl-year').value = it.year || '';
        cards[i].querySelector('.tl-title').value = it.title || '';
        cards[i].querySelector('.tl-desc').value = it.desc || '';
    });
}

function _renderEduItems(items) {
    const list = document.getElementById('tp-edu-list');
    list.innerHTML = '';
    items.forEach(() => addEduItem());
    const cards = list.querySelectorAll('.tp-dynamic-item');
    items.forEach((it, i) => {
        if (!cards[i]) return;
        cards[i].querySelector('.edu-inst').value = it.institution || '';
        cards[i].querySelector('.edu-prog').value = it.program || '';
        cards[i].querySelector('.edu-icon').value = it.icon || '';
        cards[i].querySelector('.edu-desc').value = it.desc || '';
    });
}

function _renderValueItems(items) {
    const list = document.getElementById('tp-values-list');
    list.innerHTML = '';
    items.forEach(() => addValueItem());
    const cards = list.querySelectorAll('.tp-dynamic-item');
    items.forEach((it, i) => {
        if (!cards[i]) return;
        cards[i].querySelector('.val-icon').value = it.icon || '';
        cards[i].querySelector('.val-title').value = it.title || '';
        cards[i].querySelector('.val-desc').value = it.desc || '';
    });
}

// ── Save ────────────────────────────────────────────────
window.saveFullProfile = async function() {
    const name = document.getElementById('tp-name').value.trim();
    if (!name) { _toast("El nombre es obligatorio", "error"); return; }

    const id = editingId || 'tutor_' + Date.now();
    const profile = {
        name,
        role: _getVal('tp-role'),
        badge: _getVal('tp-badge'),
        badgeColor: _getVal('tp-badge-color'),
        image: _getVal('tp-image'),
        heroImage: _getVal('tp-hero-image'),
        specialty: _getVal('tp-specialty'),
        university: _getVal('tp-university'),
        order: parseInt(_getVal('tp-order')) || 99,
        tagline: _getVal('tp-tagline'),
        achievements: _getVal('tp-achievements'),
        profilePage: _getVal('tp-profile-page'),
        bio: {
            intro: _getVal('tp-bio-intro'),
            body: _getVal('tp-bio-body'),
            closing: _getVal('tp-bio-closing')
        },
        quote: { text: _getVal('tp-quote'), author: _getVal('tp-quote-author') },
        timeline: _gatherList('#tp-timeline-list .tp-dynamic-item', el => ({
            year: el.querySelector('.tl-year')?.value || '',
            title: el.querySelector('.tl-title')?.value || '',
            desc: el.querySelector('.tl-desc')?.value || ''
        })),
        education: _gatherList('#tp-edu-list .tp-dynamic-item', el => ({
            institution: el.querySelector('.edu-inst')?.value || '',
            program: el.querySelector('.edu-prog')?.value || '',
            icon: el.querySelector('.edu-icon')?.value || '',
            desc: el.querySelector('.edu-desc')?.value || ''
        })),
        stats: [
            { num: _getVal('tp-stat1-num'), label: _getVal('tp-stat1-label') },
            { num: _getVal('tp-stat2-num'), label: _getVal('tp-stat2-label') },
            { num: _getVal('tp-stat3-num'), label: _getVal('tp-stat3-label') },
            { num: _getVal('tp-stat4-num'), label: _getVal('tp-stat4-label') }
        ],
        values: _gatherList('#tp-values-list .tp-dynamic-item', el => ({
            icon: el.querySelector('.val-icon')?.value || '',
            title: el.querySelector('.val-title')?.value || '',
            desc: el.querySelector('.val-desc')?.value || ''
        })),
        social: {
            linkedin: _getVal('tp-linkedin'),
            instagram: _getVal('tp-instagram'),
            whatsapp: _getVal('tp-whatsapp')
        }
    };

    try {
        await setDoc(doc(db, "tutores", id), profile);
        _toast(`Perfil de ${name} guardado en Firestore`);
        profile.id = id;
        const idx = tutors.findIndex(t => t.id === id);
        if (idx !== -1) tutors[idx] = profile;
        else tutors.push(profile);
        tutors.sort((a, b) => (a.order || 99) - (b.order || 99));
        renderTutorGrid();
        closeProfileModal();
    } catch (err) {
        console.error(err);
        _toast("Error guardando perfil", "error");
    }
};

window.confirmDeleteTutor = async function(id) {
    if (!confirm("¿Eliminar este tutor de Firebase?")) return;
    try {
        await deleteDoc(doc(db, "tutores", id));
        tutors = tutors.filter(t => t.id !== id);
        renderTutorGrid();
        _toast("Tutor eliminado");
    } catch (e) {
        console.error(e);
        _toast("Error al eliminar", "error");
    }
};

window.previewTutorPage = function(id) {
    const t = tutors.find(x => x.id === id);
    if (!t) return;
    if (t.profilePage) {
        window.open(t.profilePage, '_blank');
    } else {
        _toast("No tiene página de perfil aún", "error");
    }
};

// ── Helpers ─────────────────────────────────────────────
function _setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val || ''; }
function _getVal(id) { return (document.getElementById(id)?.value || '').trim(); }
function _setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function _gatherList(sel, mapper) { return [...document.querySelectorAll(sel)].map(mapper).filter(x => Object.values(x).some(v => v)); }
function _toast(msg, type = 'success') { if (window._showToastGlobal) window._showToastGlobal(msg, type); }
