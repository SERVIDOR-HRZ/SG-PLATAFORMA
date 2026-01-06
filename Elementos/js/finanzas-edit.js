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
            
            // Generar HTML de notas con botón ver más si es necesario
            let notasContainerHTML = '';
            if (notasTexto) {
                const uniqueId = `notas-${movimiento.id}`;
                notasContainerHTML = `
                    <div class="movimiento-notas-container">
                        <p class="movimiento-notas" id="${uniqueId}">${notasHTML}</p>
                        ${esNotaLarga ? `
                            <button class="btn-ver-mas" data-target="${uniqueId}">
                                <span>Ver más</span>
                                <i class="bi bi-chevron-down"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
            }

            item.innerHTML = `
                <div class="movimiento-info">
                    <div class="movimiento-icon">
                        <i class="bi bi-${icon}"></i>
                    </div>
                    <div class="movimiento-detalles">
                        <h4>${descripcionHTML}</h4>
                        <span class="movimiento-categoria">${movimiento.categoria}</span>
                        <span class="movimiento-fecha">${fechaStr}</span>
                        ${notasContainerHTML}
                    </div>
                </div>
                <div class="movimiento-monto">
                    <div class="movimiento-monto-valor">${signo}${formatNumber(movimiento.monto)}</div>
                    <div class="movimiento-monto-cuenta">${nombreCuenta}</div>
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
            const verMasBtn = item.querySelector('.btn-ver-mas');

            editBtn.addEventListener('click', () => openEditMovimiento(movimiento));
            deleteBtn.addEventListener('click', () => deleteMovimiento(movimiento.id, movimiento.tipo, movimiento.monto, movimiento.cuentaId));
            
            // Event listener para ver más
            if (verMasBtn) {
                verMasBtn.addEventListener('click', function() {
                    const targetId = this.dataset.target;
                    const notasEl = document.getElementById(targetId);
                    const spanText = this.querySelector('span');
                    
                    if (notasEl.classList.contains('expanded')) {
                        notasEl.classList.remove('expanded');
                        spanText.textContent = 'Ver más';
                        this.classList.remove('expanded');
                    } else {
                        notasEl.classList.add('expanded');
                        spanText.textContent = 'Ver menos';
                        this.classList.add('expanded');
                    }
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

        // Fecha
        const fecha = movimiento.fecha ? movimiento.fecha.toDate() : new Date();
        document.getElementById('editFechaMovimiento').value = fecha.toISOString().split('T')[0];

        // Monto
        const montoInput = document.getElementById('editMontoMovimiento');
        delete montoInput.dataset.formateado;
        montoInput.value = movimiento.monto.toLocaleString('es-CO');

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
            await db.collection('movimientos').doc(movimientoId).update({
                cuentaId: cuentaIdNueva,
                monto: montoNuevo,
                categoria: categoria,
                descripcion: descripcion,
                fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
                notas: notas,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

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
    }

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
