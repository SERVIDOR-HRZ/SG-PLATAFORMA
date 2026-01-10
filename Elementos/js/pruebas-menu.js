// Pruebas Menu Type Selector JavaScript
// Maneja la selección entre Prueba, Minisimulacro y Reto

let currentTestType = 'prueba'; // Por defecto

document.addEventListener('DOMContentLoaded', function() {
    initializeTypeTabs();
    initializeTypeToggleButtons();
});

function initializeTypeTabs() {
    const typeTabs = document.querySelectorAll('.type-tab');
    
    // Solo para administradores
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (currentUser.tipoUsuario !== 'admin') {
        const tabsContainer = document.getElementById('typeTabs');
        if (tabsContainer) tabsContainer.style.display = 'none';
        return;
    }
    
    typeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const type = tab.dataset.type;
            selectType(type);
            
            // Actualizar tabs activos
            typeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
}

function initializeTypeToggleButtons() {
    // Para el modal de crear
    const createToggleBtns = document.querySelectorAll('#testTypeGroup .type-toggle-btn');
    const testTypeInput = document.getElementById('testType');
    
    createToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            createToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (testTypeInput) {
                testTypeInput.value = btn.dataset.value;
            }
        });
    });
    
    // Para el modal de editar
    const editToggleBtns = document.querySelectorAll('#editTestTypeGroup .type-toggle-btn');
    const editTestTypeInput = document.getElementById('editTestType');
    
    editToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            editToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            if (editTestTypeInput) {
                editTestTypeInput.value = btn.dataset.value;
            }
        });
    });
}

function selectType(type) {
    currentTestType = type;
    
    const createBtnText = document.getElementById('createBtnText');
    const testsContainer = document.getElementById('testsContainer');
    const testsContainerTitle = testsContainer ? testsContainer.querySelector('h2') : null;
    const testTypeGroup = document.getElementById('testTypeGroup');
    const editTestTypeGroup = document.getElementById('editTestTypeGroup');
    const createTestBtn = document.getElementById('createTestBtn');
    const actionButtons = document.querySelector('.action-buttons');
    const desafiosAdminView = document.getElementById('desafiosAdminView');
    
    // Actualizar textos según el tipo
    const typeLabels = {
        'prueba': { btn: 'Crear Nueva Prueba', title: 'Pruebas Creadas' },
        'minisimulacro': { btn: 'Crear Nuevo Minisimulacro', title: 'Minisimulacros Creados' },
        'reto': { btn: 'Crear Nuevo Nivel', title: 'Desafíos' }
    };
    
    const labels = typeLabels[type];
    
    // Mostrar/ocultar vistas según el tipo
    if (type === 'reto') {
        // Mostrar vista de desafíos
        if (testsContainer) testsContainer.style.display = 'none';
        if (actionButtons) actionButtons.style.display = 'none';
        if (desafiosAdminView) {
            desafiosAdminView.style.display = 'block';
            // Inicializar desafíos admin si existe la función
            if (typeof initDesafiosAdmin === 'function') {
                initDesafiosAdmin();
            }
        }
    } else {
        // Mostrar vista de pruebas/minisimulacros
        if (testsContainer) testsContainer.style.display = 'block';
        if (actionButtons) actionButtons.style.display = 'flex';
        if (desafiosAdminView) desafiosAdminView.style.display = 'none';
        
        if (createBtnText) {
            createBtnText.textContent = labels.btn;
        }
        
        if (testsContainerTitle) {
            const icons = {
                'prueba': 'bi-clipboard-check',
                'minisimulacro': 'bi-lightning',
                'reto': 'bi-trophy'
            };
            testsContainerTitle.innerHTML = `<i class="bi ${icons[type]}"></i> ${labels.title}`;
        }
        
        // Mostrar/ocultar selector de tipo en modales
        if (testTypeGroup) testTypeGroup.style.display = 'block';
        if (editTestTypeGroup) editTestTypeGroup.style.display = 'block';
        
        // Pre-seleccionar el tipo actual en los toggles
        setTypeToggle('testTypeGroup', type);
        setTypeToggle('editTestTypeGroup', type);
        
        // Cargar datos según el tipo
        loadTestsByType(type);
    }
}

function setTypeToggle(groupId, type) {
    const group = document.getElementById(groupId);
    if (!group) return;
    
    const btns = group.querySelectorAll('.type-toggle-btn');
    const input = group.querySelector('input[type="hidden"]');
    
    btns.forEach(btn => {
        if (btn.dataset.value === type) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    if (input) {
        input.value = type;
    }
}

function loadTestsByType(type) {
    console.log('Cargando datos para:', type);
    // Re-renderizar la lista con el filtro aplicado
    if (typeof renderTestsList === 'function') {
        renderTestsList();
    }
}

function getCurrentTestType() {
    return currentTestType;
}

window.getCurrentTestType = getCurrentTestType;
window.selectType = selectType;
window.setTypeToggle = setTypeToggle;
