// Configuración de Materias por Estudiante en Aulas
// Este módulo permite personalizar qué materias puede ver cada estudiante en un aula específica

let currentAulaForConfig = null;
let estudiantesEnAulaConfig = {};

// Inicializar la configuración de materias por estudiante
function initMateriasEstudianteConfig() {
    const estudianteSelect = document.getElementById('estudianteMateriasSelect');
    if (!estudianteSelect) return;

    estudianteSelect.addEventListener('change', function() {
        const estudianteId = this.value;
        if (estudianteId) {
            mostrarConfigMateriasEstudiante(estudianteId);
        } else {
            ocultarConfigMateriasEstudiante();
        }
    });
}

// Cargar estudiantes seleccionados en el selector
function cargarEstudiantesEnSelector(aulaId, materiasAula) {
    currentAulaForConfig = { id: aulaId, materias: materiasAula };
    const estudianteSelect = document.getElementById('estudianteMateriasSelect');
    const materiasSection = document.getElementById('materiasEstudianteSection');
    
    if (!estudianteSelect || !materiasSection) return;

    // Obtener estudiantes seleccionados
    const checkboxes = document.querySelectorAll('input[name="estudianteAula"]:checked');
    
    if (checkboxes.length === 0) {
        materiasSection.style.display = 'none';
        return;
    }

    // Mostrar la sección
    materiasSection.style.display = 'block';

    // Limpiar y poblar el selector
    estudianteSelect.innerHTML = '<option value="">Seleccionar estudiante...</option>';
    
    checkboxes.forEach(checkbox => {
        const estudianteId = checkbox.value;
        const estudianteNombre = checkbox.getAttribute('data-nombre');
        const option = document.createElement('option');
        option.value = estudianteId;
        option.textContent = estudianteNombre;
        estudianteSelect.appendChild(option);
    });
}

// Mostrar configuración de materias para un estudiante específico
async function mostrarConfigMateriasEstudiante(estudianteId) {
    const configDiv = document.getElementById('materiasEstudianteConfig');
    const nombreSpan = document.getElementById('estudianteSeleccionadoNombre');
    const gridDiv = document.getElementById('materiasEstudianteGrid');
    
    if (!configDiv || !nombreSpan || !gridDiv || !currentAulaForConfig) return;

    // Obtener nombre del estudiante
    const checkbox = document.querySelector(`input[name="estudianteAula"][value="${estudianteId}"]`);
    const estudianteNombre = checkbox ? checkbox.getAttribute('data-nombre') : 'Estudiante';
    
    nombreSpan.textContent = estudianteNombre;
    configDiv.style.display = 'block';

    // Obtener materias permitidas actuales del estudiante (si existen)
    let materiasPermitidas = [];
    if (estudiantesEnAulaConfig[estudianteId]) {
        materiasPermitidas = estudiantesEnAulaConfig[estudianteId].materiasPermitidas || [];
    }

    // Renderizar checkboxes de materias
    const materiasConfig = {
        'anuncios': { nombre: 'Anuncios Generales', icon: 'bi-megaphone' },
        'matematicas': { nombre: 'Matemáticas', icon: 'bi-calculator' },
        'lectura': { nombre: 'Lectura Crítica', icon: 'bi-book' },
        'sociales': { nombre: 'Ciencias Sociales', icon: 'bi-globe' },
        'naturales': { nombre: 'Ciencias Naturales', icon: 'bi-tree' },
        'ingles': { nombre: 'Inglés', icon: 'bi-translate' }
    };

    gridDiv.innerHTML = '';
    
    currentAulaForConfig.materias.forEach(materiaId => {
        const config = materiasConfig[materiaId];
        if (!config) return;

        const isChecked = materiasPermitidas.length === 0 || materiasPermitidas.includes(materiaId);

        const label = document.createElement('label');
        label.className = 'materia-estudiante-checkbox';
        label.innerHTML = `
            <input type="checkbox" 
                   name="materiaEstudiante_${estudianteId}" 
                   value="${materiaId}" 
                   ${isChecked ? 'checked' : ''}
                   onchange="actualizarMateriasEstudiante('${estudianteId}', '${materiaId}', this.checked)">
            <div class="checkbox-content ${materiaId}">
                <i class="bi ${config.icon}"></i>
                <span>${config.nombre}</span>
            </div>
        `;
        gridDiv.appendChild(label);
    });
}

// Ocultar configuración de materias
function ocultarConfigMateriasEstudiante() {
    const configDiv = document.getElementById('materiasEstudianteConfig');
    if (configDiv) {
        configDiv.style.display = 'none';
    }
}

// Actualizar materias permitidas para un estudiante
function actualizarMateriasEstudiante(estudianteId, materiaId, isChecked) {
    if (!estudiantesEnAulaConfig[estudianteId]) {
        estudiantesEnAulaConfig[estudianteId] = {
            materiasPermitidas: []
        };
    }

    const checkboxes = document.querySelectorAll(`input[name="materiaEstudiante_${estudianteId}"]:checked`);
    const materiasSeleccionadas = Array.from(checkboxes).map(cb => cb.value);

    // Si todas las materias están seleccionadas, guardar array vacío (significa "todas")
    if (materiasSeleccionadas.length === currentAulaForConfig.materias.length) {
        estudiantesEnAulaConfig[estudianteId].materiasPermitidas = [];
    } else {
        estudiantesEnAulaConfig[estudianteId].materiasPermitidas = materiasSeleccionadas;
    }

    console.log('Materias actualizadas para', estudianteId, ':', estudiantesEnAulaConfig[estudianteId]);
}

// Obtener configuración de materias para guardar en Firebase
function obtenerConfigMateriasEstudiantes() {
    return estudiantesEnAulaConfig;
}

// Limpiar configuración
function limpiarConfigMateriasEstudiantes() {
    estudiantesEnAulaConfig = {};
    currentAulaForConfig = null;
    
    const estudianteSelect = document.getElementById('estudianteMateriasSelect');
    const configDiv = document.getElementById('materiasEstudianteConfig');
    const materiasSection = document.getElementById('materiasEstudianteSection');
    
    if (estudianteSelect) estudianteSelect.value = '';
    if (configDiv) configDiv.style.display = 'none';
    if (materiasSection) materiasSection.style.display = 'none';
}

// Cargar configuración existente de un aula
async function cargarConfigMateriasExistente(aulaId) {
    try {
        await waitForFirebase();
        const db = window.firebaseDB;

        // Obtener todos los estudiantes del aula
        const estudiantesSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        estudiantesEnAulaConfig = {};

        estudiantesSnapshot.forEach(doc => {
            const data = doc.data();
            const aulasAsignadas = data.aulasAsignadas || [];
            
            const aulaAsignada = aulasAsignadas.find(a => {
                if (typeof a === 'object' && a.aulaId) {
                    return a.aulaId === aulaId;
                }
                return a === aulaId;
            });

            if (aulaAsignada && typeof aulaAsignada === 'object' && aulaAsignada.materiasPermitidas) {
                estudiantesEnAulaConfig[doc.id] = {
                    materiasPermitidas: aulaAsignada.materiasPermitidas
                };
            }
        });

        console.log('Configuración de materias cargada:', estudiantesEnAulaConfig);
    } catch (error) {
        console.error('Error cargando configuración de materias:', error);
    }
}

// Exportar funciones globales
window.initMateriasEstudianteConfig = initMateriasEstudianteConfig;
window.cargarEstudiantesEnSelector = cargarEstudiantesEnSelector;
window.mostrarConfigMateriasEstudiante = mostrarConfigMateriasEstudiante;
window.actualizarMateriasEstudiante = actualizarMateriasEstudiante;
window.obtenerConfigMateriasEstudiantes = obtenerConfigMateriasEstudiantes;
window.limpiarConfigMateriasEstudiantes = limpiarConfigMateriasEstudiantes;
window.cargarConfigMateriasExistente = cargarConfigMateriasExistente;


// ============================================
// CONFIGURACIÓN DE MATERIAS EN EDITAR USUARIO
// ============================================

let aulasDataForEdit = [];
let materiasConfigEdit = {};

// Cargar aulas y materias en el modal de editar usuario
async function cargarAulasMateriasEdit(estudianteId, aulasAsignadas) {
    console.log('🔄 Cargando configuración de materias para estudiante:', estudianteId);
    console.log('📚 Aulas asignadas recibidas:', aulasAsignadas);
    
    try {
        await waitForFirebase();
        const db = window.firebaseDB;
        
        // Obtener todas las aulas
        const aulasSnapshot = await db.collection('aulas').get();
        aulasDataForEdit = [];
        
        aulasSnapshot.forEach(doc => {
            aulasDataForEdit.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('🏫 Aulas cargadas desde Firebase:', aulasDataForEdit.length);

        // Inicializar configuración de materias
        materiasConfigEdit = {};
        
        // Cargar configuración existente del estudiante
        aulasAsignadas.forEach(aulaAsignada => {
            let aulaId, materiasPermitidas;
            
            if (typeof aulaAsignada === 'object' && aulaAsignada.aulaId) {
                aulaId = aulaAsignada.aulaId;
                materiasPermitidas = aulaAsignada.materiasPermitidas || [];
                console.log(`  ✅ Aula ${aulaId} con materias personalizadas:`, materiasPermitidas);
            } else {
                aulaId = aulaAsignada;
                materiasPermitidas = [];
                console.log(`  ℹ️ Aula ${aulaId} sin personalización (verá todas)`);
            }
            
            materiasConfigEdit[aulaId] = {
                personalizar: materiasPermitidas.length > 0,
                materiasPermitidas: materiasPermitidas
            };
        });

        console.log('⚙️ Configuración de materias inicializada:', materiasConfigEdit);

        // Renderizar la UI
        renderAulasMateriasEdit();
        
        // Mostrar la sección siempre que haya aulas disponibles (no solo si hay asignadas)
        // La visibilidad se controlará dinámicamente según las aulas seleccionadas
        const section = document.getElementById('materiasAulaEditSection');
        if (section) {
            // Mostrar si hay aulas asignadas O si hay aulas disponibles para seleccionar
            const hasAulasAvailable = aulasDataForEdit.length > 0;
            console.log('👁️ Mostrando sección de materias:', hasAulasAvailable);
            if (hasAulasAvailable) {
                section.style.display = 'block';
                // Actualizar la UI según las aulas actualmente seleccionadas
                actualizarMateriasEditUI();
            }
        } else {
            console.log('❌ Sección materiasAulaEditSection no encontrada en el DOM');
        }
        
    } catch (error) {
        console.error('❌ Error cargando aulas y materias:', error);
    }
}

// Renderizar las aulas con sus materias
function renderAulasMateriasEdit() {
    const container = document.getElementById('aulasMateriasEditContainer');
    if (!container) {
        console.log('❌ Container aulasMateriasEditContainer no encontrado');
        return;
    }
    
    container.innerHTML = '';
    
    // Obtener aulas seleccionadas
    const aulasCheckboxes = document.querySelectorAll('input[name="aulaPermisoEdit"]:checked');
    const aulasSeleccionadas = Array.from(aulasCheckboxes).map(cb => cb.value);
    
    console.log('📋 Renderizando materias para aulas:', aulasSeleccionadas);
    console.log('📦 Aulas disponibles:', aulasDataForEdit.map(a => a.id));
    console.log('⚙️ Configuración actual:', materiasConfigEdit);
    
    if (aulasSeleccionadas.length === 0) {
        container.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">Selecciona al menos un aula para personalizar las materias</p>';
        return;
    }
    
    const materiasConfig = {
        'anuncios': { nombre: 'Anuncios', icon: 'bi-megaphone', class: 'anuncios' },
        'matematicas': { nombre: 'Matemáticas', icon: 'bi-calculator', class: 'matematicas' },
        'lectura': { nombre: 'Lectura', icon: 'bi-book', class: 'lectura' },
        'sociales': { nombre: 'Sociales', icon: 'bi-globe', class: 'sociales' },
        'naturales': { nombre: 'Naturales', icon: 'bi-tree', class: 'naturales' },
        'ingles': { nombre: 'Inglés', icon: 'bi-translate', class: 'ingles' }
    };
    
    aulasSeleccionadas.forEach(aulaId => {
        const aula = aulasDataForEdit.find(a => a.id === aulaId);
        if (!aula) return;
        
        const config = materiasConfigEdit[aulaId] || { personalizar: false, materiasPermitidas: [] };
        const materiasAula = aula.materias || [];
        
        const card = document.createElement('div');
        card.className = 'aula-materias-config-card';
        if (config.personalizar) card.classList.add('selected');
        
        // Header con nombre del aula y badges de materias
        const badgesHTML = materiasAula.map(m => {
            const mConfig = materiasConfig[m];
            return mConfig ? `<span class="aula-materia-badge ${mConfig.class}">${mConfig.nombre}</span>` : '';
        }).join('');
        
        card.innerHTML = `
            <div class="aula-materias-header">
                <div class="aula-materias-title">
                    <i class="bi bi-door-open-fill"></i>
                    <h5>${aula.nombre}</h5>
                </div>
                <div class="aula-materias-badges">
                    ${badgesHTML}
                </div>
            </div>
            
            <div class="aula-materias-toggle">
                <input type="checkbox" 
                       id="personalizar_${aulaId}" 
                       ${config.personalizar ? 'checked' : ''}
                       onchange="togglePersonalizarMaterias('${aulaId}', this.checked)">
                <label for="personalizar_${aulaId}">Personalizar materias para esta aula</label>
            </div>
            
            <div class="aula-materias-grid ${!config.personalizar ? 'disabled' : ''}" id="materias_grid_${aulaId}">
                ${materiasAula.map(materiaId => {
                    const mConfig = materiasConfig[materiaId];
                    if (!mConfig) return '';
                    
                    const isChecked = !config.personalizar || config.materiasPermitidas.length === 0 || config.materiasPermitidas.includes(materiaId);
                    
                    return `
                        <label class="materia-estudiante-checkbox">
                            <input type="checkbox" 
                                   name="materia_${aulaId}" 
                                   value="${materiaId}" 
                                   ${isChecked ? 'checked' : ''}
                                   ${!config.personalizar ? 'disabled' : ''}
                                   onchange="actualizarMateriaAulaEdit('${aulaId}', '${materiaId}', this.checked)">
                            <div class="checkbox-content ${mConfig.class}">
                                <i class="bi ${mConfig.icon}"></i>
                                <span>${mConfig.nombre}</span>
                            </div>
                        </label>
                    `;
                }).join('')}
            </div>
            
            <div class="aula-materias-info ${config.personalizar ? '' : 'warning'}">
                <i class="bi ${config.personalizar ? 'bi-check-circle' : 'bi-info-circle'}"></i>
                <span>${config.personalizar ? 
                    'Materias personalizadas. El estudiante solo verá las materias seleccionadas.' : 
                    'Sin personalizar. El estudiante verá todas las materias del aula.'
                }</span>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Toggle personalización de materias para un aula
function togglePersonalizarMaterias(aulaId, personalizar) {
    if (!materiasConfigEdit[aulaId]) {
        materiasConfigEdit[aulaId] = { personalizar: false, materiasPermitidas: [] };
    }
    
    materiasConfigEdit[aulaId].personalizar = personalizar;
    
    // Habilitar/deshabilitar checkboxes
    const grid = document.getElementById(`materias_grid_${aulaId}`);
    const checkboxes = document.querySelectorAll(`input[name="materia_${aulaId}"]`);
    
    if (grid) {
        if (personalizar) {
            grid.classList.remove('disabled');
        } else {
            grid.classList.add('disabled');
            // Marcar todas las materias cuando se desactiva la personalización
            checkboxes.forEach(cb => {
                cb.checked = true;
                cb.disabled = true;
            });
            materiasConfigEdit[aulaId].materiasPermitidas = [];
        }
    }
    
    checkboxes.forEach(cb => cb.disabled = !personalizar);
    
    // Actualizar el card
    const card = grid.closest('.aula-materias-config-card');
    if (card) {
        if (personalizar) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    }
    
    // Actualizar mensaje
    const info = card.querySelector('.aula-materias-info');
    if (info) {
        if (personalizar) {
            info.className = 'aula-materias-info';
            info.innerHTML = '<i class="bi bi-check-circle"></i><span>Materias personalizadas. El estudiante solo verá las materias seleccionadas.</span>';
        } else {
            info.className = 'aula-materias-info warning';
            info.innerHTML = '<i class="bi bi-info-circle"></i><span>Sin personalizar. El estudiante verá todas las materias del aula.</span>';
        }
    }
}

// Actualizar materia seleccionada para un aula
function actualizarMateriaAulaEdit(aulaId, materiaId, isChecked) {
    if (!materiasConfigEdit[aulaId]) {
        materiasConfigEdit[aulaId] = { personalizar: true, materiasPermitidas: [] };
    }
    
    const checkboxes = document.querySelectorAll(`input[name="materia_${aulaId}"]:checked`);
    const materiasSeleccionadas = Array.from(checkboxes).map(cb => cb.value);
    
    materiasConfigEdit[aulaId].materiasPermitidas = materiasSeleccionadas;
    
    console.log('Materias actualizadas para aula', aulaId, ':', materiasSeleccionadas);
}

// Obtener configuración final para guardar
function obtenerAulasConMaterias() {
    const aulasCheckboxes = document.querySelectorAll('input[name="aulaPermisoEdit"]:checked');
    const aulasAsignadas = [];
    
    console.log('=== OBTENER AULAS CON MATERIAS ===');
    console.log('Checkboxes de aulas seleccionadas:', aulasCheckboxes.length);
    console.log('Configuración actual de materias:', materiasConfigEdit);
    
    aulasCheckboxes.forEach(checkbox => {
        const aulaId = checkbox.value;
        const config = materiasConfigEdit[aulaId];
        
        console.log(`Procesando aula ${aulaId}:`, config);
        
        if (config && config.personalizar && config.materiasPermitidas.length > 0) {
            // Guardar con materias personalizadas
            const aulaConMaterias = {
                aulaId: aulaId,
                materiasPermitidas: config.materiasPermitidas
            };
            aulasAsignadas.push(aulaConMaterias);
            console.log(`  → Guardando con materias personalizadas:`, aulaConMaterias);
        } else {
            // Guardar sin personalización (verá todas las materias)
            aulasAsignadas.push(aulaId);
            console.log(`  → Guardando sin personalización (solo ID):`, aulaId);
        }
    });
    
    console.log('Resultado final de aulasAsignadas:', aulasAsignadas);
    return aulasAsignadas;
}

// Limpiar configuración al cerrar modal
function limpiarConfigEdit() {
    materiasConfigEdit = {};
    aulasDataForEdit = [];
    
    const section = document.getElementById('materiasAulaEditSection');
    if (section) section.style.display = 'none';
    
    const container = document.getElementById('aulasMateriasEditContainer');
    if (container) container.innerHTML = '';
}

// Actualizar la UI cuando cambian las aulas seleccionadas
function actualizarMateriasEditUI() {
    const aulasCheckboxes = document.querySelectorAll('input[name="aulaPermisoEdit"]:checked');
    const section = document.getElementById('materiasAulaEditSection');
    
    console.log('🔄 Actualizando UI de materias. Aulas seleccionadas:', aulasCheckboxes.length);
    
    if (aulasCheckboxes.length > 0) {
        if (section) {
            console.log('✅ Mostrando sección de materias');
            section.style.display = 'block';
        } else {
            console.log('❌ Sección materiasAulaEditSection no encontrada');
        }
        renderAulasMateriasEdit();
    } else {
        if (section) {
            console.log('ℹ️ Ocultando sección de materias (no hay aulas seleccionadas)');
            section.style.display = 'none';
        }
    }
}

// Exportar funciones
window.cargarAulasMateriasEdit = cargarAulasMateriasEdit;
window.togglePersonalizarMaterias = togglePersonalizarMaterias;
window.actualizarMateriaAulaEdit = actualizarMateriaAulaEdit;
window.obtenerAulasConMaterias = obtenerAulasConMaterias;
window.limpiarConfigEdit = limpiarConfigEdit;
window.actualizarMateriasEditUI = actualizarMateriasEditUI;
