// ========== EDICIÓN DE MOVIMIENTOS Y CATEGORÍAS ==========

// Sobrescribir la función createMovimientoItem para agregar botón de editar
(function () {
    // Esperar a que el DOM esté listo
    function init() {
        // Sobrescribir createMovimientoItem
        if (typeof window.createMovimientoItemOriginal === 'undefined') {
            window.createMovimientoItemOriginal = window.createMovimientoItem || createMovimientoItem;
        }

        window.createMovimientoItem = function (movimiento) {
            const item = document.createElement('div');
            item.className = `movimiento-item ${movimiento.tipo}`;

            const fecha = movimiento.fecha ? movimiento.fecha.toDate() : new Date();
            const fechaStr = fecha.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });

            const icon = movimiento.tipo === 'ingreso' ? 'arrow-down-circle' : 'arrow-up-circle';
            const signo = movimiento.tipo === 'ingreso' ? '+' : '-';

            // Buscar nombre de la cuenta
            const cuenta = window.cuentasList ? window.cuentasList.find(c => c.id === movimiento.cuentaId) : null;
            const nombreCuenta = cuenta ? cuenta.nombre : 'Cuenta eliminada';

            // Formatear descripción (título)
            const descripcionHTML = (movimiento.descripcion || '').replace(/\n/g, '<br>');
            
            // Formatear notas con saltos de línea
            const notasTexto = movimiento.notas || '';
            const notasHTML = notasTexto.replace(/\n/g, '<br>');
            
            // Verificar si las notas son largas (más de 100 caracteres o más de 2 líneas)
            const esNotaLarga = notasTexto.length > 100 || (notasTexto.match(/\n/g) || []).length > 1;
            
            // Generar HTML de notas con botón ver descripción si hay notas
            let notasContainerHTML = '';
            if (notasTexto) {
                notasContainerHTML = `
                    <button class="btn-ver-descripcion" data-notas="${notasTexto.replace(/"/g, '&quot;')}" data-tipo="${movimiento.tipo}">
                        <i class="bi bi-file-text"></i>
                        <span>Descripción</span>
                    </button>
                `;
            }

            // Generar HTML de comprobantes - SIEMPRE mostrar el botón
            const numComprobantes = (movimiento.comprobantes && movimiento.comprobantes.length) || 0;
            const comprobantesHTML = `
                <button class="btn-ver-comprobantes" data-comprobantes='${JSON.stringify(movimiento.comprobantes || [])}' data-movimiento-id="${movimiento.id}">
                    <i class="bi bi-images"></i>
                    <span>Comprobante</span>
                </button>
            `;

            // Contenedor de botones
            let botonesHTML = '';
            if (notasContainerHTML || comprobantesHTML) {
                botonesHTML = `
                    <div class="movimiento-botones-container">
                        ${notasContainerHTML}
                        ${comprobantesHTML}
                    </div>
                `;
            }

            item.innerHTML = `
                <div class="movimiento-info">
                    <div class="movimiento-header-card">
                        <div class="movimiento-icon">
                            <i class="bi bi-${icon}"></i>
                        </div>
                        <div class="movimiento-detalles">
                            <h4>${descripcionHTML}</h4>
                            <p><i class="bi bi-calendar3"></i> ${fechaStr}</p>
                        </div>
                    </div>
                    <span class="movimiento-categoria">${movimiento.categoria}</span>
                    ${botonesHTML}
                </div>
                <div class="movimiento-monto">
                    <span class="movimiento-monto-label">Monto</span>
                    <div class="movimiento-monto-valor">${signo}${formatNumber(movimiento.monto)}</div>
                    <div class="movimiento-monto-cuenta"><i class="bi bi-bank"></i> ${nombreCuenta}</div>
                </div>
                <div class="movimiento-actions">
                    <button class="btn-icon btn-edit-mov" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn-icon btn-delete-mov" title="Eliminar">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;

            // Event listeners para los botones
            const editBtn = item.querySelector('.btn-edit-mov');
            const deleteBtn = item.querySelector('.btn-delete-mov');
            const verDescripcionBtn = item.querySelector('.btn-ver-descripcion');
            const verComprobantesBtn = item.querySelector('.btn-ver-comprobantes');

            editBtn.addEventListener('click', () => openEditMovimiento(movimiento));
            deleteBtn.addEventListener('click', () => deleteMovimiento(movimiento.id, movimiento.tipo, movimiento.monto, movimiento.cuentaId));
            
            // Event listener para ver descripción
            if (verDescripcionBtn) {
                verDescripcionBtn.addEventListener('click', function() {
                    const notas = this.dataset.notas;
                    const tipo = this.dataset.tipo;
                    openModalDescripcion(notas, tipo);
                });
            }

            // Event listener para ver comprobantes
            if (verComprobantesBtn) {
                verComprobantesBtn.addEventListener('click', function() {
                    const comprobantes = JSON.parse(this.dataset.comprobantes);
                    const movimientoId = this.dataset.movimientoId;
                    openModalComprobantes(comprobantes, movimientoId);
                });
            }

            return item;
        };
    }

    // Abrir modal editar movimiento
    window.openEditMovimiento = async function (movimiento) {
        const modal = document.getElementById('modalEditarMovimiento');
        if (!modal) {
            console.error('Modal de edición no encontrado');
            return;
        }

        const titulo = movimiento.tipo === 'ingreso' ? 'Editar Ingreso' : 'Editar Gasto';

        document.getElementById('modalEditarMovimientoTitulo').textContent = titulo;
        document.getElementById('editingMovimientoId').value = movimiento.id;
        document.getElementById('editingMovimientoTipo').value = movimiento.tipo;
        document.getElementById('editingMovimientoCuentaIdOriginal').value = movimiento.cuentaId;
        document.getElementById('editingMovimientoMontoOriginal').value = movimiento.monto;

        // Mostrar/ocultar sección de gamificación según el tipo
        const gamificacionSection = document.getElementById('gamificacionSectionEdit');
        if (gamificacionSection) {
            if (movimiento.tipo === 'ingreso') {
                gamificacionSection.style.display = 'block';
                
                // Cargar instituciones primero
                await loadInstitucionesForEditModal();
                
                // Cargar estudiantes en el select
                await loadEstudiantesSelectEdit();
                
                // Si el movimiento ya tiene un estudiante asociado, seleccionarlo
                const selectEstudiante = document.getElementById('editEstudianteComprador');
                if (selectEstudiante && movimiento.estudianteId) {
                    selectEstudiante.value = movimiento.estudianteId;
                    // Mostrar contenedor de recompensas
                    const recompensasContainer = document.getElementById('recompensasContainerEdit');
                    if (recompensasContainer) {
                        recompensasContainer.style.display = 'block';
                    }
                }
                
                // Establecer puntos otorgados si existen
                const puntosInput = document.getElementById('editPuntosOtorgados');
                if (puntosInput) {
                    puntosInput.value = movimiento.puntosOtorgados || 0;
                }
            } else {
                gamificacionSection.style.display = 'none';
            }
        }

        // Cargar cuentas desde Firebase si no están cargadas
        const selectCuenta = document.getElementById('editCuentaMovimiento');
        selectCuenta.innerHTML = '<option value="">Seleccionar cuenta</option>';

        try {
            // Obtener cuentas directamente de Firebase para asegurar datos actualizados
            const db = getDB();
            const cuentasSnapshot = await db.collection('cuentas_bancarias').orderBy('nombre').get();

            cuentasSnapshot.forEach(doc => {
                const cuenta = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = `${cuenta.nombre} - ${formatNumber(cuenta.saldo || 0)}`;
                // Marcar como seleccionada si coincide con la cuenta del movimiento
                if (doc.id === movimiento.cuentaId) {
                    option.selected = true;
                }
                selectCuenta.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando cuentas:', error);
            // Fallback a cuentasList si existe
            if (window.cuentasList && window.cuentasList.length > 0) {
                window.cuentasList.forEach(cuenta => {
                    const option = document.createElement('option');
                    option.value = cuenta.id;
                    option.textContent = `${cuenta.nombre} - ${formatNumber(cuenta.saldo || 0)}`;
                    if (cuenta.id === movimiento.cuentaId) {
                        option.selected = true;
                    }
                    selectCuenta.appendChild(option);
                });
            }
        }

        // Cargar categorías en el select
        if (window.loadCategorias) {
            await window.loadCategorias();
        }
        const selectCategoria = document.getElementById('editCategoriaMovimiento');
        selectCategoria.innerHTML = '<option value="">Seleccionar categoría</option>';
        if (window.categoriasList) {
            const categoriasFiltradas = window.categoriasList.filter(cat => cat.tipo === movimiento.tipo);
            categoriasFiltradas.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.nombre;
                option.textContent = cat.nombre;
                if (cat.nombre === movimiento.categoria) {
                    option.selected = true;
                }
                selectCategoria.appendChild(option);
            });
        }

        // Llenar campos
        document.getElementById('editDescripcionMovimiento').value = movimiento.descripcion || '';
        document.getElementById('editNotasMovimiento').value = movimiento.notas || '';

        // Fecha - Formatear correctamente para evitar problemas de zona horaria
        const fecha = movimiento.fecha ? movimiento.fecha.toDate() : new Date();
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, '0');
        const day = String(fecha.getDate()).padStart(2, '0');
        document.getElementById('editFechaMovimiento').value = `${year}-${month}-${day}`;

        // Monto
        const montoInput = document.getElementById('editMontoMovimiento');
        delete montoInput.dataset.formateado;
        montoInput.value = movimiento.monto.toLocaleString('es-CO');

        // Mostrar comprobantes existentes si los hay
        const existingComprobantesGrid = document.getElementById('comprobantesExistentesGrid');
        const comprobantesExistentesContainer = document.getElementById('comprobantesExistentes');
        
        if (existingComprobantesGrid && comprobantesExistentesContainer) {
            if (movimiento.comprobantes && movimiento.comprobantes.length > 0) {
                comprobantesExistentesContainer.style.display = 'block';
                existingComprobantesGrid.innerHTML = '';
                
                movimiento.comprobantes.forEach((url, index) => {
                    const comprobanteItem = document.createElement('div');
                    comprobanteItem.className = 'existing-comprobante-item';
                    comprobanteItem.innerHTML = `
                        <img src="${url}" alt="Comprobante ${index + 1}" onclick="abrirImagenEnModal('${url}')">
                        <button class="remove-existing-comprobante-btn" onclick="eliminarComprobanteExistente('${movimiento.id}', ${index}, '${url}')" title="Eliminar comprobante">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                    existingComprobantesGrid.appendChild(comprobanteItem);
                });
            } else {
                comprobantesExistentesContainer.style.display = 'none';
                existingComprobantesGrid.innerHTML = '';
            }
        }

        modal.classList.add('active');

        // Inicializar formateo numérico
        setTimeout(() => {
            if (window.formatearInputNumerico && !montoInput.dataset.formateado) {
                window.formatearInputNumerico(montoInput);
                montoInput.dataset.formateado = 'true';
            }
        }, 100);
    };

    // Cerrar modal editar movimiento
    window.closeModalEditarMovimiento = function () {
        const modal = document.getElementById('modalEditarMovimiento');
        if (modal) {
            modal.classList.remove('active');
        }
        const form = document.getElementById('formEditarMovimiento');
        if (form) {
            form.reset();
        }
        // Limpiar archivos seleccionados para edición
        if (window.clearSelectedFilesEdit) {
            window.clearSelectedFilesEdit();
        }
    };

    // Guardar cambios del movimiento
    window.handleSaveEditMovimiento = async function (e) {
        e.preventDefault();

        // Obtener el botón de submit y deshabilitarlo
        const btnSubmit = e.target.querySelector('button[type="submit"]');
        const btnTextoOriginal = btnSubmit ? btnSubmit.innerHTML : '';
        
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
        }

        const movimientoId = document.getElementById('editingMovimientoId').value;
        const tipo = document.getElementById('editingMovimientoTipo').value;
        const cuentaIdOriginal = document.getElementById('editingMovimientoCuentaIdOriginal').value;
        const montoOriginal = parseFloat(document.getElementById('editingMovimientoMontoOriginal').value);

        const cuentaIdNueva = document.getElementById('editCuentaMovimiento').value;
        const montoNuevo = window.obtenerValorNumerico(document.getElementById('editMontoMovimiento'));
        const categoria = document.getElementById('editCategoriaMovimiento').value;
        const descripcion = document.getElementById('editDescripcionMovimiento').value.trim();
        const fecha = document.getElementById('editFechaMovimiento').value;
        const notas = document.getElementById('editNotasMovimiento').value.trim();

        if (!cuentaIdNueva || !montoNuevo || !categoria || !descripcion || !fecha) {
            showNotification('error', 'Error', 'Por favor completa todos los campos requeridos');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = btnTextoOriginal;
            }
            return;
        }

        try {
            const db = getDB();

            // Revertir el movimiento original en la cuenta original
            const cuentaOriginalDoc = await db.collection('cuentas_bancarias').doc(cuentaIdOriginal).get();
            let cuentaOriginalData = null;
            if (cuentaOriginalDoc.exists) {
                cuentaOriginalData = cuentaOriginalDoc.data();
                let saldoOriginal = cuentaOriginalData.saldo || 0;

                if (tipo === 'ingreso') {
                    saldoOriginal -= montoOriginal;
                } else {
                    saldoOriginal += montoOriginal;
                }

                await db.collection('cuentas_bancarias').doc(cuentaIdOriginal).update({
                    saldo: saldoOriginal,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            // Aplicar el nuevo movimiento en la cuenta nueva
            const cuentaNuevaDoc = await db.collection('cuentas_bancarias').doc(cuentaIdNueva).get();
            if (!cuentaNuevaDoc.exists) {
                showNotification('error', 'Error', 'Cuenta no encontrada');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = btnTextoOriginal;
                }
                return;
            }

            const cuentaNueva = cuentaNuevaDoc.data();
            let saldoNuevo = cuentaNueva.saldo || 0;

            if (tipo === 'ingreso') {
                saldoNuevo += montoNuevo;
            } else {
                if (saldoNuevo < montoNuevo) {
                    // Revertir el cambio en la cuenta original
                    if (cuentaOriginalData) {
                        let saldoRevertir = cuentaOriginalData.saldo || 0;
                        if (tipo === 'ingreso') {
                            saldoRevertir += montoOriginal;
                        } else {
                            saldoRevertir -= montoOriginal;
                        }
                        await db.collection('cuentas_bancarias').doc(cuentaIdOriginal).update({
                            saldo: saldoRevertir
                        });
                    }
                    showNotification('warning', 'Saldo Insuficiente', 'La cuenta no tiene saldo suficiente para este gasto');
                    if (btnSubmit) {
                        btnSubmit.disabled = false;
                        btnSubmit.innerHTML = btnTextoOriginal;
                    }
                    return;
                }
                saldoNuevo -= montoNuevo;
            }

            // Actualizar saldo de la cuenta nueva
            await db.collection('cuentas_bancarias').doc(cuentaIdNueva).update({
                saldo: saldoNuevo,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Actualizar el movimiento
            // Crear fecha correctamente sin problemas de zona horaria
            const [year, month, day] = fecha.split('-');
            const fechaCorrecta = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de zona horaria
            
            const updateData = {
                cuentaId: cuentaIdNueva,
                monto: montoNuevo,
                categoria: categoria,
                descripcion: descripcion,
                fecha: firebase.firestore.Timestamp.fromDate(fechaCorrecta),
                notas: notas,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Subir nuevos comprobantes si hay archivos seleccionados
            if (window.selectedFilesEdit && window.selectedFilesEdit.length > 0) {
                btnSubmit.innerHTML = '<i class="bi bi-hourglass-split"></i> Subiendo comprobantes...';
                try {
                    const nuevosComprobantesUrls = await window.uploadMultipleToImgBB(window.selectedFilesEdit);
                    
                    // Obtener comprobantes existentes del movimiento
                    const movimientoDoc = await db.collection('movimientos').doc(movimientoId).get();
                    const comprobantesExistentes = movimientoDoc.exists && movimientoDoc.data().comprobantes ? movimientoDoc.data().comprobantes : [];
                    
                    // Combinar comprobantes existentes con los nuevos
                    updateData.comprobantes = [...comprobantesExistentes, ...nuevosComprobantesUrls];
                } catch (errorComprobantes) {
                    console.error('Error subiendo comprobantes:', errorComprobantes);
                    showNotification('warning', 'Advertencia', 'El movimiento se guardará pero algunos comprobantes no se pudieron subir');
                }
            }

            // Agregar datos de gamificación si es un ingreso
            if (tipo === 'ingreso') {
                const estudianteId = document.getElementById('editEstudianteComprador')?.value || '';
                const puntosOtorgados = parseInt(document.getElementById('editPuntosOtorgados')?.value) || 0;

                if (estudianteId) {
                    const selectEstudiante = document.getElementById('editEstudianteComprador');
                    const estudianteNombre = selectEstudiante?.options[selectEstudiante.selectedIndex]?.dataset?.nombre || '';

                    updateData.estudianteId = estudianteId;
                    updateData.estudianteNombre = estudianteNombre;
                    updateData.puntosOtorgados = puntosOtorgados;

                    // Otorgar recompensas al estudiante si hay puntos
                    if (puntosOtorgados > 0 && window.otorgarRecompensas) {
                        const recompensasData = {
                            puntos: puntosOtorgados,
                            descripcion: descripcion
                        };
                        await window.otorgarRecompensas(estudianteId, recompensasData, movimientoId);
                    }
                } else {
                    // Limpiar datos de gamificación si no hay estudiante
                    updateData.estudianteId = null;
                    updateData.estudianteNombre = null;
                    updateData.puntosOtorgados = 0;
                }
            }

            await db.collection('movimientos').doc(movimientoId).update(updateData);

            showNotification('success', 'Movimiento Actualizado', 'El movimiento se ha actualizado correctamente');
            closeModalEditarMovimiento();
            if (window.loadCuentas) loadCuentas();
            if (window.loadMovimientos) loadMovimientos();
        } catch (error) {
            console.error('Error updating movimiento:', error);
            showNotification('error', 'Error', 'No se pudo actualizar el movimiento');
        } finally {
            // Restaurar el botón en cualquier caso
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = btnTextoOriginal;
            }
        }
    };

    // Setup event listeners para el modal de edición
    function setupEditMovimientoListeners() {
        const closeBtn = document.getElementById('closeModalEditarMovimiento');
        const cancelBtn = document.getElementById('cancelarEditarMovimiento');
        const form = document.getElementById('formEditarMovimiento');

        if (closeBtn) {
            closeBtn.addEventListener('click', closeModalEditarMovimiento);
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModalEditarMovimiento);
        }
        if (form) {
            form.addEventListener('submit', handleSaveEditMovimiento);
        }

        // Event listener para el select de estudiante en edición
        const selectEstudianteEdit = document.getElementById('editEstudianteComprador');
        if (selectEstudianteEdit) {
            selectEstudianteEdit.addEventListener('change', function() {
                const recompensasContainer = document.getElementById('recompensasContainerEdit');
                if (recompensasContainer) {
                    recompensasContainer.style.display = this.value ? 'block' : 'none';
                }
            });
        }

        // Event listener para filtro de institución en edición
        const filtroInstitucionEdit = document.getElementById('filtroInstitucionEstudianteEdit');
        if (filtroInstitucionEdit) {
            filtroInstitucionEdit.addEventListener('change', function() {
                loadEstudiantesSelectEdit(this.value);
            });
        }
    }

    // Cargar estudiantes en el select del modal de edición
    window.loadEstudiantesSelectEdit = async function(institucionFiltro = '') {
        const select = document.getElementById('editEstudianteComprador');
        if (!select) return;

        select.innerHTML = '<option value="">Cargando estudiantes...</option>';

        try {
            const db = getDB();
            const snapshot = await db.collection('usuarios')
                .where('tipoUsuario', '==', 'estudiante')
                .where('activo', '==', true)
                .get();

            const estudiantes = [];
            snapshot.forEach(doc => {
                estudiantes.push({ id: doc.id, ...doc.data() });
            });

            // Ordenar por nombre
            estudiantes.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

            // Filtrar por institución si hay filtro
            const estudiantesFiltrados = institucionFiltro 
                ? estudiantes.filter(e => e.institucion === institucionFiltro)
                : estudiantes;

            select.innerHTML = '<option value="">Sin estudiante asociado</option>';

            estudiantesFiltrados.forEach(estudiante => {
                const option = document.createElement('option');
                option.value = estudiante.id;
                option.textContent = `${estudiante.nombre || 'Sin nombre'} - ${estudiante.institucion || 'Sin institución'}`;
                option.dataset.nombre = estudiante.nombre || '';
                select.appendChild(option);
            });

            if (estudiantesFiltrados.length === 0 && institucionFiltro) {
                const emptyOption = document.createElement('option');
                emptyOption.value = '';
                emptyOption.textContent = 'No hay estudiantes en esta institución';
                emptyOption.disabled = true;
                select.appendChild(emptyOption);
            }
        } catch (error) {
            console.error('Error cargando estudiantes:', error);
            select.innerHTML = '<option value="">Sin estudiante asociado</option>';
        }
    };

    // Cargar instituciones en el filtro del modal de edición
    window.loadInstitucionesForEditModal = async function() {
        const select = document.getElementById('filtroInstitucionEstudianteEdit');
        if (!select) return;

        select.innerHTML = '<option value="">Cargando instituciones...</option>';

        try {
            const db = getDB();
            const snapshot = await db.collection('instituciones').orderBy('nombre').get();

            select.innerHTML = '<option value="">Todas las instituciones</option>';

            snapshot.forEach(doc => {
                const data = doc.data();
                const option = document.createElement('option');
                option.value = data.nombre;
                option.textContent = data.nombre;
                select.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando instituciones:', error);
            select.innerHTML = '<option value="">Todas las instituciones</option>';
        }
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            init();
            setupEditMovimientoListeners();
        });
    } else {
        init();
        setTimeout(setupEditMovimientoListeners, 100);
    }
})();


// ========== MODAL VER DESCRIPCIÓN ==========

// Abrir modal de descripción
window.openModalDescripcion = function(notas, tipo) {
    const modal = document.getElementById('modalVerDescripcion');
    const modalContent = modal?.querySelector('.modal-content');
    const descripcionContent = document.getElementById('descripcionContent');
    
    if (modal && modalContent && descripcionContent) {
        // Remover clases anteriores
        modalContent.classList.remove('ingreso', 'gasto');
        
        // Agregar clase según el tipo
        if (tipo === 'ingreso' || tipo === 'gasto') {
            modalContent.classList.add(tipo);
        }
        
        descripcionContent.textContent = notas || 'No hay descripción disponible';
        modal.classList.add('active');
    }
};

// Cerrar modal de descripción
window.closeModalDescripcion = function() {
    const modal = document.getElementById('modalVerDescripcion');
    if (modal) {
        modal.classList.remove('active');
        // Limpiar clases después de cerrar
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            setTimeout(() => {
                modalContent.classList.remove('ingreso', 'gasto');
            }, 300);
        }
    }
};

// Setup event listener para cerrar modal
(function setupModalDescripcionListeners() {
    const closeBtn = document.getElementById('closeModalDescripcion');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModalDescripcion);
    }
    
    // Cerrar al hacer clic fuera del modal
    const modal = document.getElementById('modalVerDescripcion');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModalDescripcion();
            }
        });
    }
})();


// ========== MODAL VER COMPROBANTES ==========

// Abrir modal de comprobantes
window.openModalComprobantes = function(comprobantes, movimientoId) {
    const modal = document.getElementById('modalVerComprobantes');
    const gallery = document.getElementById('comprobantesGallery');
    
    if (modal && gallery) {
        if (!comprobantes || comprobantes.length === 0) {
            gallery.innerHTML = `
                <div class="comprobantes-gallery-empty">
                    <i class="bi bi-images"></i>
                    <p>No hay comprobantes disponibles</p>
                </div>
            `;
        } else {
            gallery.innerHTML = comprobantes.map((url, index) => `
                <div class="comprobante-gallery-item" onclick="abrirImagenEnModal('${url}')">
                    <img src="${url}" alt="Comprobante ${index + 1}">
                    <div class="overlay">
                        <i class="bi bi-zoom-in"></i>
                    </div>
                </div>
            `).join('');
        }
        
        modal.classList.add('active');
    }
};

// Función para abrir imagen en modal emergente
window.abrirImagenEnModal = function(url) {
    // Crear modal emergente si no existe
    let modalImagen = document.getElementById('modalImagenComprobante');
    
    if (!modalImagen) {
        modalImagen = document.createElement('div');
        modalImagen.id = 'modalImagenComprobante';
        modalImagen.className = 'modal-imagen-comprobante';
        modalImagen.innerHTML = `
            <div class="modal-imagen-overlay" onclick="cerrarModalImagen()"></div>
            <div class="modal-imagen-contenido">
                <button class="modal-imagen-close" onclick="cerrarModalImagen()">
                    <i class="bi bi-x-lg"></i>
                </button>
                <img id="imagenComprobanteGrande" src="" alt="Comprobante">
                <button id="descargarComprobante" class="btn-descargar-comprobante" onclick="descargarImagenComprobante()">
                    <i class="bi bi-download"></i>
                    Descargar
                </button>
            </div>
        `;
        document.body.appendChild(modalImagen);
    }
    
    // Actualizar imagen y guardar URL
    document.getElementById('imagenComprobanteGrande').src = url;
    modalImagen.dataset.imageUrl = url;
    
    // Mostrar modal
    modalImagen.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Función para descargar imagen
window.descargarImagenComprobante = async function() {
    const modalImagen = document.getElementById('modalImagenComprobante');
    const url = modalImagen.dataset.imageUrl;
    
    if (!url) return;
    
    const btnDescargar = document.getElementById('descargarComprobante');
    const textoOriginal = btnDescargar.innerHTML;
    
    try {
        btnDescargar.innerHTML = '<i class="bi bi-hourglass-split"></i> Descargando...';
        btnDescargar.disabled = true;
        
        // Descargar la imagen usando fetch
        const response = await fetch(url);
        const blob = await response.blob();
        
        // Crear un enlace temporal para descargar
        const urlBlob = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = urlBlob;
        
        // Generar nombre de archivo con fecha
        const fecha = new Date().toISOString().split('T')[0];
        const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        a.download = `comprobante_${fecha}_${hora}.jpg`;
        
        document.body.appendChild(a);
        a.click();
        
        // Limpiar
        window.URL.revokeObjectURL(urlBlob);
        document.body.removeChild(a);
        
        btnDescargar.innerHTML = '<i class="bi bi-check-circle"></i> Descargado';
        
        setTimeout(() => {
            btnDescargar.innerHTML = textoOriginal;
            btnDescargar.disabled = false;
        }, 2000);
        
    } catch (error) {
        console.error('Error al descargar imagen:', error);
        btnDescargar.innerHTML = '<i class="bi bi-x-circle"></i> Error';
        
        setTimeout(() => {
            btnDescargar.innerHTML = textoOriginal;
            btnDescargar.disabled = false;
        }, 2000);
    }
};

// Función para cerrar modal de imagen
window.cerrarModalImagen = function() {
    const modalImagen = document.getElementById('modalImagenComprobante');
    if (modalImagen) {
        modalImagen.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Función para abrir el modal de edición y agregar comprobantes
window.abrirEditarParaAgregarComprobantes = async function(movimientoId) {
    // Cerrar modal de comprobantes
    closeModalComprobantes();
    
    // Buscar el movimiento en la lista
    try {
        const db = getDB();
        const movimientoDoc = await db.collection('movimientos').doc(movimientoId).get();
        if (movimientoDoc.exists) {
            const movimiento = { id: movimientoDoc.id, ...movimientoDoc.data() };
            openEditMovimiento(movimiento);
        }
    } catch (error) {
        console.error('Error al abrir edición:', error);
        showNotification('error', 'Error', 'No se pudo abrir el editor');
    }
};

// Cerrar modal de comprobantes
window.closeModalComprobantes = function() {
    const modal = document.getElementById('modalVerComprobantes');
    if (modal) {
        modal.classList.remove('active');
    }
};

// Setup event listener para cerrar modal de comprobantes
(function setupModalComprobantesListeners() {
    const closeBtn = document.getElementById('closeModalComprobantes');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModalComprobantes);
    }
    
    // Cerrar al hacer clic fuera del modal
    const modal = document.getElementById('modalVerComprobantes');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModalComprobantes();
            }
        });
    }
})();

// ========== MANEJO DE ARCHIVOS MÚLTIPLES ==========

// Variables globales para almacenar archivos
let selectedFiles = [];
let selectedFilesEdit = [];

// Inicializar variables globales inmediatamente
if (typeof window !== 'undefined') {
    window.selectedFiles = selectedFiles;
    window.selectedFilesEdit = selectedFilesEdit;
}

// Setup listeners para upload de archivos
(function setupFileUploadListeners() {
    // Esperar a que el DOM esté listo
    const initListeners = () => {
        // Para nuevo movimiento
        const fileInput = document.getElementById('comprobantesMovimientoForm');
        if (fileInput) {
            fileInput.addEventListener('change', function(e) {
                handleFilesSelect(e.target.files, 'filesPreviewGrid', window.selectedFiles);
            });
        }
        
        // Para editar movimiento
        const fileInputEdit = document.getElementById('editComprobantesMovimiento');
        if (fileInputEdit) {
            fileInputEdit.addEventListener('change', function(e) {
                handleFilesSelect(e.target.files, 'editFilesPreviewGrid', window.selectedFilesEdit);
            });
        }
    };
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initListeners);
    } else {
        initListeners();
    }
})();

// Manejar selección de archivos
function handleFilesSelect(files, previewGridId, filesArray) {
    const previewGrid = document.getElementById(previewGridId);
    if (!previewGrid) return;
    
    // Limpiar array antes de agregar nuevos archivos
    filesArray.length = 0;
    
    // Agregar nuevos archivos al array
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            filesArray.push(file);
        }
    });
    
    // Actualizar referencia global
    if (previewGridId === 'filesPreviewGrid') {
        window.selectedFiles = filesArray;
    } else {
        window.selectedFilesEdit = filesArray;
    }
    
    console.log('Archivos seleccionados:', filesArray.length, 'para', previewGridId);
    
    // Mostrar previsualizaciones
    renderFilePreviews(previewGridId, filesArray);
}

// Renderizar previsualizaciones de archivos
function renderFilePreviews(previewGridId, filesArray) {
    const previewGrid = document.getElementById(previewGridId);
    if (!previewGrid) return;
    
    if (filesArray.length === 0) {
        previewGrid.style.display = 'none';
        previewGrid.innerHTML = '';
        return;
    }
    
    previewGrid.style.display = 'grid';
    previewGrid.innerHTML = '';
    
    filesArray.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const previewItem = document.createElement('div');
            previewItem.className = 'file-preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <button class="remove-file-btn" onclick="removeFilePreview(${index}, '${previewGridId}', ${previewGridId === 'filesPreviewGrid' ? 'selectedFiles' : 'selectedFilesEdit'})">
                    <i class="bi bi-x"></i>
                </button>
            `;
            previewGrid.appendChild(previewItem);
        };
        reader.readAsDataURL(file);
    });
}

// Remover archivo de la previsualización
window.removeFilePreview = function(index, previewGridId, filesArrayName) {
    const filesArray = filesArrayName === 'selectedFiles' ? window.selectedFiles : window.selectedFilesEdit;
    filesArray.splice(index, 1);
    
    // Actualizar referencia global
    if (filesArrayName === 'selectedFiles') {
        window.selectedFiles = filesArray;
    } else {
        window.selectedFilesEdit = filesArray;
    }
    
    renderFilePreviews(previewGridId, filesArray);
};

// Limpiar archivos seleccionados
function clearSelectedFiles() {
    selectedFiles.length = 0;
    window.selectedFiles = [];
    const previewGrid = document.getElementById('filesPreviewGrid');
    if (previewGrid) {
        previewGrid.style.display = 'none';
        previewGrid.innerHTML = '';
    }
    const fileInput = document.getElementById('comprobantesMovimientoForm');
    if (fileInput) {
        fileInput.value = '';
    }
}

function clearSelectedFilesEdit() {
    selectedFilesEdit.length = 0;
    window.selectedFilesEdit = [];
    const previewGrid = document.getElementById('editFilesPreviewGrid');
    if (previewGrid) {
        previewGrid.style.display = 'none';
        previewGrid.innerHTML = '';
    }
    const fileInput = document.getElementById('editComprobantesMovimiento');
    if (fileInput) {
        fileInput.value = '';
    }
}

// Exportar funciones de limpieza como globales
window.clearSelectedFiles = clearSelectedFiles;
window.clearSelectedFilesEdit = clearSelectedFilesEdit;

// Función para eliminar comprobante existente
window.eliminarComprobanteExistente = async function(movimientoId, index, url) {
    if (!confirm('¿Estás seguro de que deseas eliminar este comprobante?')) {
        return;
    }
    
    try {
        const db = getDB();
        
        // Obtener el movimiento actual
        const movimientoDoc = await db.collection('movimientos').doc(movimientoId).get();
        if (!movimientoDoc.exists) {
            showNotification('error', 'Error', 'Movimiento no encontrado');
            return;
        }
        
        const movimiento = movimientoDoc.data();
        const comprobantes = movimiento.comprobantes || [];
        
        // Eliminar el comprobante del array
        comprobantes.splice(index, 1);
        
        // Actualizar en Firebase
        await db.collection('movimientos').doc(movimientoId).update({
            comprobantes: comprobantes,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Actualizar la vista
        const existingComprobantesGrid = document.getElementById('comprobantesExistentesGrid');
        const comprobantesExistentesContainer = document.getElementById('comprobantesExistentes');
        
        if (existingComprobantesGrid && comprobantesExistentesContainer) {
            if (comprobantes.length === 0) {
                comprobantesExistentesContainer.style.display = 'none';
                existingComprobantesGrid.innerHTML = '';
            } else {
                // Re-renderizar los comprobantes restantes
                existingComprobantesGrid.innerHTML = '';
                comprobantes.forEach((url, idx) => {
                    const comprobanteItem = document.createElement('div');
                    comprobanteItem.className = 'existing-comprobante-item';
                    comprobanteItem.innerHTML = `
                        <img src="${url}" alt="Comprobante ${idx + 1}" onclick="abrirImagenEnModal('${url}')">
                        <button class="remove-existing-comprobante-btn" onclick="eliminarComprobanteExistente('${movimientoId}', ${idx}, '${url}')" title="Eliminar comprobante">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                    existingComprobantesGrid.appendChild(comprobanteItem);
                });
            }
        }
        
        showNotification('success', 'Comprobante Eliminado', 'El comprobante se ha eliminado correctamente');
        
        // Recargar movimientos si la función existe
        if (window.loadMovimientos) {
            window.loadMovimientos();
        }
        
    } catch (error) {
        console.error('Error eliminando comprobante:', error);
        showNotification('error', 'Error', 'No se pudo eliminar el comprobante');
    }
};

// Subir múltiples imágenes a ImgBB
async function uploadMultipleToImgBB(files) {
    const uploadPromises = files.map(file => uploadToImgBB(file));
    return Promise.all(uploadPromises);
}

// Función auxiliar para subir una imagen (ya existe en finanzas.js, pero la redefinimos por si acaso)
async function uploadToImgBB(file) {
    try {
        const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
        const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
        
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${IMGBB_API_URL}?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.success) {
            return data.data.url;
        } else {
            throw new Error('Error al subir imagen a ImgBB');
        }
    } catch (error) {
        console.error('Error uploading to ImgBB:', error);
        throw error;
    }
}

// Exportar funciones como globales
window.uploadMultipleToImgBB = uploadMultipleToImgBB;
window.uploadToImgBB = uploadToImgBB;


// ========== NUEVOS FILTROS CON BOTONES ==========

// Inicializar filtros con botones
(function initFiltrosBotones() {
    const initListeners = () => {
        // Botones de tipo de movimiento
        const btnTodosTipos = document.getElementById('btnTodosTipos');
        const btnFiltroIngresos = document.getElementById('btnFiltroIngresos');
        const btnFiltroGastos = document.getElementById('btnFiltroGastos');
        const filtroTipoSelect = document.getElementById('filtroTipoMovimiento');
        
        if (btnTodosTipos && btnFiltroIngresos && btnFiltroGastos && filtroTipoSelect) {
            [btnTodosTipos, btnFiltroIngresos, btnFiltroGastos].forEach(btn => {
                btn.addEventListener('click', function() {
                    // Remover active de todos
                    document.querySelectorAll('.btn-filtro-tipo').forEach(b => b.classList.remove('active'));
                    // Agregar active al clickeado
                    this.classList.add('active');
                    // Actualizar select oculto
                    const tipo = this.dataset.tipo;
                    filtroTipoSelect.value = tipo;
                    // Disparar evento change
                    filtroTipoSelect.dispatchEvent(new Event('change'));
                    
                    // Si el resumen de categorías está visible, recargarlo
                    const resumenContainer = document.getElementById('categoriasResumen');
                    if (resumenContainer && resumenContainer.style.display !== 'none') {
                        if (typeof window.loadResumenCategorias === 'function') {
                            window.loadResumenCategorias();
                        }
                    }
                });
            });
        }
        
        // Cargar cuentas en el select
        loadCuentasFilterMovimientos();
        
        // El input de fecha ya no necesita JavaScript adicional
        // Se maneja automáticamente con el input type="month"
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initListeners);
    } else {
        initListeners();
    }
})();

// Cargar cuentas en el select de filtro
async function loadCuentasFilterMovimientos() {
    try {
        const db = getDB();
        const cuentasSnapshot = await db.collection('cuentas_bancarias').orderBy('nombre').get();
        const filtroCuentaSelect = document.getElementById('filtroCuentaMovimiento');
        
        if (!filtroCuentaSelect) return;
        
        // Limpiar select excepto la primera opción
        filtroCuentaSelect.innerHTML = '<option value="">Todas las cuentas</option>';
        
        // Agregar cuentas
        cuentasSnapshot.forEach(doc => {
            const cuenta = { id: doc.id, ...doc.data() };
            const option = document.createElement('option');
            option.value = cuenta.id;
            option.textContent = cuenta.nombre;
            filtroCuentaSelect.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error cargando cuentas:', error);
    }
}

// Exportar función para que pueda ser llamada desde otros archivos
window.loadCuentasFilterMovimientos = loadCuentasFilterMovimientos;
