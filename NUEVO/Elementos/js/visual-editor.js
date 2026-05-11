/**
 * ═══════════════════════════════════════════════
 * VISUAL EDITOR — WYSIWYG Landing Page Editor
 * Seamos Genios CMS v2.0
 * ═══════════════════════════════════════════════
 * 
 * Transforms the admin into a live visual editor
 * where you click directly on landing page elements
 * to edit them. Changes sync to Firestore.
 */

import { db } from './firebase.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

// ─── EDITABLE ELEMENTS MAP ───
const EDITABLE_MAP = [
    // Hero Section
    { selector: '#hero-badge',         section: 'hero', field: 'badge',       type: 'text',   label: 'Badge Hero' },
    { selector: '#hero-title1',        section: 'hero', field: 'titleLine1',  type: 'text',   label: 'Título Línea 1' },
    { selector: '#hero-title2',        section: 'hero', field: 'titleLine2',  type: 'text',   label: 'Título Línea 2' },
    { selector: '#hero-subtitle',      section: 'hero', field: 'subtitle',    type: 'text',   label: 'Subtítulo Hero' },
    { selector: '#hero-desc',          section: 'hero', field: 'description', type: 'text',   label: 'Descripción Hero' },
    { selector: '#hero-cta1',          section: 'hero', field: 'cta1Text',    type: 'text',   label: 'CTA Principal' },
    { selector: '#hero-cta2',          section: 'hero', field: 'cta2Text',    type: 'text',   label: 'CTA Secundario' },
    { selector: '#live-count',         section: 'hero', field: 'liveCount',   type: 'number', label: 'Contador Live' },
    // About Section
    { selector: '#about .section-badge span', section: 'about', field: 'badge',       type: 'text', label: 'Badge About' },
    { selector: '#about .section-title',      section: 'about', field: 'title',       type: 'text', label: 'Título About' },
    { selector: '#about .section-description',section: 'about', field: 'description', type: 'text', label: 'Descripción About' },
    { selector: '.bento-logo-tagline',        section: 'about', field: 'tagline',     type: 'text', label: 'Tagline Logo' },
    // Stats - Bento
    { selector: '.bento-stat-number', section: 'stats', field: 'bento.$.num',   type: 'array', label: 'Número Stat' },
    { selector: '.bento-stat-label',  section: 'stats', field: 'bento.$.label', type: 'array', label: 'Label Stat' },
    // Stats - Hero
    { selector: '.stat-number',       section: 'stats', field: 'hero.$.num',    type: 'array', label: 'Hero Stat Número' },
    { selector: '.stat-label',        section: 'stats', field: 'hero.$.label',  type: 'array', label: 'Hero Stat Label' },
    // Bento Cards
    { selector: '.bento-card-title',  section: 'about', field: 'bentoCards.$.title', type: 'array', label: 'Card Título' },
    { selector: '.bento-card-desc',   section: 'about', field: 'bentoCards.$.desc',  type: 'array', label: 'Card Desc' },
    { selector: '.bento-card-tag',    section: 'about', field: 'bentoCards.$.tag',   type: 'array', label: 'Card Tag' },
    // Trust items
    { selector: '.trust-item span',   section: 'about', field: 'trust.$',       type: 'array', label: 'Item Confianza' },
];

// ─── STATE ───
let editMode = false;
let currentDevice = 'desktop';
let pendingChanges = new Map(); // key: "section.field" => value
let selectedElement = null;
let iframeDoc = null;
let iframeWin = null;

// ─── INIT ───
export function initVisualEditor() {
    const iframe = document.getElementById('ve-iframe');
    if (!iframe) return;

    // Wait for iframe load
    iframe.addEventListener('load', () => {
        try {
            iframeWin = iframe.contentWindow;
            iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            onIframeReady();
        } catch (e) {
            console.warn('Visual Editor: iframe access blocked', e);
        }
    });

    // Toolbar handlers
    setupToolbar();
    setupDeviceButtons();
    setupSectionNav();
    setupPanelHandlers();

    // Load iframe
    iframe.src = '../index.html';
    
    console.log('✨ Visual Editor initialized');
}

function onIframeReady() {
    // Hide loading overlay
    const loading = document.querySelector('.ve-loading-overlay');
    if (loading) loading.classList.add('hidden');

    // Inject edit styles
    injectEditStyles();

    // Show ready status
    updateStatus('ready', 'Listo para editar');
}

// ─── INJECT EDIT STYLES INTO IFRAME ───
function injectEditStyles() {
    if (!iframeDoc) return;

    // Inject CSS
    const link = iframeDoc.createElement('link');
    link.rel = 'stylesheet';
    link.href = '../Elementos/css/visual-editor-iframe.css';
    iframeDoc.head.appendChild(link);
}

// ─── ENABLE/DISABLE EDIT MODE ───
function toggleEditMode() {
    editMode = !editMode;
    const btn = document.getElementById('ve-btn-edit');
    const indicator = document.querySelector('.ve-edit-indicator');

    if (editMode) {
        btn?.classList.add('active');
        indicator?.classList.add('visible');
        enableEditMode();
    } else {
        btn?.classList.remove('active');
        indicator?.classList.remove('visible');
        disableEditMode();
    }
}

function enableEditMode() {
    if (!iframeDoc) return;

    iframeDoc.body.classList.add('sg-edit-mode');

    // Mark all editable elements
    EDITABLE_MAP.forEach((mapping) => {
        const elements = iframeDoc.querySelectorAll(mapping.selector);
        elements.forEach((el, index) => {
            el.setAttribute('data-sg-editable', '');
            el.setAttribute('data-sg-section', mapping.section);
            el.setAttribute('data-sg-field', mapping.field.replace('$', index));
            el.setAttribute('data-sg-label', mapping.label);
            el.setAttribute('data-sg-type', mapping.type);
            el.setAttribute('data-sg-index', index);
            el.setAttribute('data-sg-placeholder', `Escribe ${mapping.label}...`);

            // Add floating label
            if (!el.querySelector('.sg-edit-label')) {
                const label = iframeDoc.createElement('span');
                label.className = 'sg-edit-label';
                label.textContent = mapping.type === 'array' 
                    ? `${mapping.label} #${index + 1}` 
                    : mapping.label;
                el.style.position = el.style.position || 'relative';
                el.appendChild(label);
            }

            // Event listeners
            el.addEventListener('click', onElementClick);
            el.addEventListener('dblclick', onElementDblClick);
            el.addEventListener('blur', onElementBlur);
            el.addEventListener('input', onElementInput);
        });
    });

    updateStatus('editing', 'Modo edición activo');
}

function disableEditMode() {
    if (!iframeDoc) return;

    iframeDoc.body.classList.remove('sg-edit-mode');

    const editables = iframeDoc.querySelectorAll('[data-sg-editable]');
    editables.forEach(el => {
        el.removeAttribute('contenteditable');
        el.classList.remove('sg-selected', 'sg-editing');
        
        // Remove labels
        const label = el.querySelector('.sg-edit-label');
        if (label) label.remove();

        // Remove listeners
        el.removeEventListener('click', onElementClick);
        el.removeEventListener('dblclick', onElementDblClick);
        el.removeEventListener('blur', onElementBlur);
        el.removeEventListener('input', onElementInput);
    });

    // Close props panel
    closePropPanel();
    updateStatus('ready', 'Edición desactivada');
}

// ─── ELEMENT INTERACTION ───
function onElementClick(e) {
    e.preventDefault();
    e.stopPropagation();

    // Deselect previous
    if (selectedElement) {
        selectedElement.classList.remove('sg-selected');
    }

    const el = e.currentTarget;
    el.classList.add('sg-selected');
    selectedElement = el;

    // Open properties panel
    openPropPanel(el);
}

function onElementDblClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const el = e.currentTarget;
    el.setAttribute('contenteditable', 'true');
    el.classList.add('sg-editing');
    el.focus();

    // Select all text for easy replacement
    const range = iframeDoc.createRange();
    range.selectNodeContents(el);
    const sel = iframeWin.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

function onElementBlur(e) {
    const el = e.currentTarget;
    el.removeAttribute('contenteditable');
    el.classList.remove('sg-editing');

    // Check if value changed - exclude the label text
    const section = el.getAttribute('data-sg-section');
    const field = el.getAttribute('data-sg-field');
    
    // Get text content excluding the edit label
    const label = el.querySelector('.sg-edit-label');
    let newValue;
    if (label) {
        const clone = el.cloneNode(true);
        const cloneLabel = clone.querySelector('.sg-edit-label');
        if (cloneLabel) cloneLabel.remove();
        newValue = clone.textContent.trim();
    } else {
        newValue = el.textContent.trim();
    }
    
    const key = `${section}.${field}`;

    // Register change
    pendingChanges.set(key, {
        section,
        field,
        value: newValue,
        type: el.getAttribute('data-sg-type'),
        index: parseInt(el.getAttribute('data-sg-index')) || 0,
        label: el.getAttribute('data-sg-label')
    });

    el.classList.add('sg-modified');

    // Update UI
    updateChangesCount();
    updatePropPanelValue(newValue);
}

function onElementInput(e) {
    // Live update props panel
    const el = e.currentTarget;
    const input = document.getElementById('ve-prop-value');
    if (!input) return;
    
    // Get text excluding the edit label
    const editLabel = el.querySelector('.sg-edit-label');
    if (editLabel) {
        const clone = el.cloneNode(true);
        const cloneLabel = clone.querySelector('.sg-edit-label');
        if (cloneLabel) cloneLabel.remove();
        input.value = clone.textContent.trim();
    } else {
        input.value = el.textContent.trim();
    }
}

// ─── PROPERTIES PANEL ───
function openPropPanel(el) {
    const panel = document.querySelector('.ve-props-panel');
    if (!panel) return;

    const section = el.getAttribute('data-sg-section');
    const field = el.getAttribute('data-sg-field');
    const label = el.getAttribute('data-sg-label');
    const type = el.getAttribute('data-sg-type');
    
    // Get text content excluding the edit label
    const editLabel = el.querySelector('.sg-edit-label');
    let value;
    if (editLabel) {
        const clone = el.cloneNode(true);
        const cloneLabel = clone.querySelector('.sg-edit-label');
        if (cloneLabel) cloneLabel.remove();
        value = clone.textContent.trim();
    } else {
        value = el.textContent.trim();
    }

    // Populate panel
    panel.querySelector('.ve-prop-element-name').textContent = label;
    panel.querySelector('.ve-prop-path').textContent = `sections/${section} → ${field}`;

    const valueInput = document.getElementById('ve-prop-value');
    if (valueInput) {
        valueInput.value = value;
        valueInput.setAttribute('data-section', section);
        valueInput.setAttribute('data-field', field);
    }

    const typeLabel = panel.querySelector('.ve-prop-type');
    if (typeLabel) typeLabel.textContent = type;

    panel.classList.add('open');
}

function closePropPanel() {
    const panel = document.querySelector('.ve-props-panel');
    if (panel) panel.classList.remove('open');
    
    if (selectedElement) {
        selectedElement.classList.remove('sg-selected');
        selectedElement = null;
    }
}

function updatePropPanelValue(val) {
    const input = document.getElementById('ve-prop-value');
    if (input) input.value = val;
}

function setupPanelHandlers() {
    // Close panel
    document.querySelector('.ve-props-close')?.addEventListener('click', closePropPanel);

    // Apply value from panel input
    document.getElementById('ve-prop-apply')?.addEventListener('click', () => {
        const input = document.getElementById('ve-prop-value');
        if (!input || !selectedElement) return;

        const newVal = input.value;

        // Save the label element before modifying content
        const existingLabel = selectedElement.querySelector('.sg-edit-label');
        const labelText = selectedElement.getAttribute('data-sg-label');

        // Update only text content, preserving child elements like the label
        // Remove all text nodes, then re-add the value
        const childNodes = Array.from(selectedElement.childNodes);
        childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                node.remove();
            }
        });
        // If label was removed (when textContent kills everything), re-add it
        if (!selectedElement.querySelector('.sg-edit-label') && iframeDoc) {
            selectedElement.textContent = newVal;
            const labelEl = iframeDoc.createElement('span');
            labelEl.className = 'sg-edit-label';
            labelEl.textContent = labelText;
            selectedElement.appendChild(labelEl);
        } else {
            // Insert text before the label
            const textNode = iframeDoc.createTextNode(newVal);
            if (existingLabel) {
                selectedElement.insertBefore(textNode, existingLabel);
            } else {
                selectedElement.insertBefore(textNode, selectedElement.firstChild);
            }
        }

        // Register change
        const section = input.getAttribute('data-section');
        const field = input.getAttribute('data-field');
        const key = `${section}.${field}`;
        pendingChanges.set(key, {
            section, field, value: newVal,
            type: selectedElement.getAttribute('data-sg-type'),
            index: parseInt(selectedElement.getAttribute('data-sg-index')) || 0,
            label: labelText
        });

        selectedElement.classList.add('sg-modified');
        updateChangesCount();
    });

    // Save from panel
    document.getElementById('ve-prop-save')?.addEventListener('click', saveAllChanges);
}

// ─── SAVE TO FIRESTORE ───
async function saveAllChanges() {
    if (pendingChanges.size === 0) {
        showAutoSaveToast('Sin cambios pendientes');
        return;
    }

    const saveBtn = document.getElementById('ve-btn-save');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.innerHTML = `<svg width="14" height="14" class="ve-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg> Guardando...`;
    }

    try {
        // Group changes by section
        const sectionChanges = {};
        pendingChanges.forEach((change) => {
            if (!sectionChanges[change.section]) {
                sectionChanges[change.section] = {};
            }

            // Handle array fields  
            if (change.field.includes('.')) {
                const parts = change.field.split('.');
                // e.g., "bento.0.num" → need to reconstruct
                // For now, store as flat key
                sectionChanges[change.section][change.field] = change.value;
            } else {
                sectionChanges[change.section][change.field] = change.value;
            }
        });

        // Save each section
        for (const [sectionName, data] of Object.entries(sectionChanges)) {
            // Get existing data first
            const docRef = doc(db, 'sections', sectionName);
            const snap = await getDoc(docRef);
            const existing = snap.exists() ? snap.data() : {};

            // Merge changes
            const merged = { ...existing };
            for (const [field, value] of Object.entries(data)) {
                if (field.includes('.')) {
                    // Handle nested paths like "bento.0.num"
                    setNestedValue(merged, field, value);
                } else {
                    merged[field] = value;
                }
            }

            merged.lastModified = new Date().toISOString();
            await setDoc(docRef, merged, { merge: true });
        }

        // Success
        pendingChanges.clear();
        updateChangesCount();
        showAutoSaveToast(`✓ ${Object.keys(sectionChanges).length} sección(es) guardada(s)`);

        // Remove modified indicators
        if (iframeDoc) {
            iframeDoc.querySelectorAll('.sg-modified').forEach(el => {
                el.classList.remove('sg-modified');
            });
        }

        updateStatus('saved', 'Todo guardado');
        setTimeout(() => updateStatus('editing', 'Modo edición activo'), 3000);

    } catch (error) {
        console.error('Visual Editor save error:', error);
        showAutoSaveToast('❌ Error al guardar: ' + error.message);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Guardar`;
        }
    }
}

// Helper: set nested value like "bento.0.num" on an object
function setNestedValue(obj, path, value) {
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length - 1; i++) {
        const key = isNaN(parts[i]) ? parts[i] : parseInt(parts[i]);
        if (typeof key === 'number') {
            if (!Array.isArray(current)) return;
            if (!current[key]) current[key] = {};
            current = current[key];
        } else {
            if (!current[key]) current[key] = {};
            current = current[key];
        }
    }
    
    const lastKey = parts[parts.length - 1];
    current[isNaN(lastKey) ? lastKey : parseInt(lastKey)] = value;
}

// ─── TOOLBAR ───
function setupToolbar() {
    document.getElementById('ve-btn-edit')?.addEventListener('click', toggleEditMode);
    document.getElementById('ve-btn-save')?.addEventListener('click', saveAllChanges);
    
    document.getElementById('ve-btn-refresh')?.addEventListener('click', () => {
        const iframe = document.getElementById('ve-iframe');
        if (iframe) {
            iframe.src = iframe.src;
            const loading = document.querySelector('.ve-loading-overlay');
            if (loading) loading.classList.remove('hidden');
            editMode = false;
            document.getElementById('ve-btn-edit')?.classList.remove('active');
        }
    });
}

function setupDeviceButtons() {
    document.querySelectorAll('.ve-device-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const device = btn.getAttribute('data-device');
            currentDevice = device;

            // Update active state
            document.querySelectorAll('.ve-device-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Resize iframe wrapper
            const wrapper = document.querySelector('.ve-iframe-wrapper');
            if (wrapper) {
                wrapper.className = 've-iframe-wrapper';
                if (device !== 'desktop') {
                    wrapper.classList.add(`device-${device}`);
                }
            }
        });
    });
}

function setupSectionNav() {
    document.querySelectorAll('.ve-section-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const sectionId = pill.getAttribute('data-scroll-to');
            if (!iframeDoc || !sectionId) return;

            // Scroll iframe to section
            const target = iframeDoc.querySelector(sectionId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.classList.add('sg-section-highlight');
                setTimeout(() => target.classList.remove('sg-section-highlight'), 2000);
            }

            // Update active pill
            document.querySelectorAll('.ve-section-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
        });
    });
}

// ─── STATUS UPDATES ───
function updateStatus(state, text) {
    const badge = document.querySelector('.ve-status-badge');
    if (!badge) return;

    badge.className = `ve-status-badge ${state}`;
    badge.innerHTML = `<span class="ve-status-dot"></span> ${text}`;
}

function updateChangesCount() {
    const counter = document.querySelector('.ve-changes-count');
    if (!counter) return;

    const count = pendingChanges.size;
    counter.textContent = count;
    counter.classList.toggle('zero', count === 0);

    // Pulse save button if there are changes
    const saveBtn = document.getElementById('ve-btn-save');
    if (saveBtn) saveBtn.classList.toggle('has-changes', count > 0);
}

function showAutoSaveToast(message) {
    const toast = document.querySelector('.ve-autosave-toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ─── EXPOSE ───
window.SG_VisualEditor = {
    init: initVisualEditor,
    toggleEdit: toggleEditMode,
    saveAll: saveAllChanges
};
