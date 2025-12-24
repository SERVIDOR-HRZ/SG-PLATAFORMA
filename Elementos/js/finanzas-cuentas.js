// ========== GESTIÓN DE CUENTAS BANCARIAS ==========

let editingCuentaId = null;
let cuentasList = [];
let categoriasList = [];

// Cargar cuentas bancarias
async function loadCuentas() {
    const cuentasGrid = document.getElementById('cuentasGrid');
    cuentasGrid.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const db = getDB();
        const cuentasSnapshot = await db.collection('cuentas_bancarias')
            .orderBy('createdAt', 'desc')
            .get();

        if (cuentasSnapshot.empty) {
            cuentasGrid.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-bank"></i>
                    <h3>No hay cuentas registradas</h3>
                    <p>Agrega tu primera cuenta bancaria para comenzar</p>
                </div>
            `;
            updateDashboard();
            return;
        }

        cuentasGrid.innerHTML = '';
        cuentasList = [];

        cuentasSnapshot.forEach(doc => {
            const cuenta = { id: doc.id, ...doc.data() };
            cuentasList.push(cuenta);
        });

        // Cargar tipos disponibles en el filtro
        cargarTiposCuentasDisponibles();
        
        // Aplicar filtros y renderizar
        aplicarFiltrosCuentas();
        updateDashboard();
    } catch (error) {
        console.error('Error loading cuentas:', error);
        cuentasGrid.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar cuentas</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Cargar tipos de cuentas disponibles en el filtro
function cargarTiposCuentasDisponibles() {
    const filtroTipo = document.getElementById('filtroTipoCuenta');
    
    // Obtener tipos únicos de las cuentas existentes
    const tiposUnicos = [...new Set(cuentasList.map(cuenta => cuenta.tipo))].sort();
    
    // Limpiar y agregar opción "Todos"
    filtroTipo.innerHTML = '<option value="">Todos los tipos</option>';
    
    // Agregar solo los tipos que existen
    tiposUnicos.forEach(tipo => {
        const option = document.createElement('option');
        option.value = tipo;
        option.textContent = tipo;
        filtroTipo.appendChild(option);
    });
}

// Aplicar filtros a las cuentas
function aplicarFiltrosCuentas() {
    const cuentasGrid = document.getElementById('cuentasGrid');
    const filtroTipo = document.getElementById('filtroTipoCuenta').value;
    const filtroBuscar = document.getElementById('filtroBuscarCuenta').value.toLowerCase();

    cuentasGrid.innerHTML = '';

    const cuentasFiltradas = cuentasList.filter(cuenta => {
        const matchTipo = !filtroTipo || cuenta.tipo === filtroTipo;
        const matchBuscar = !filtroBuscar || 
            cuenta.nombre.toLowerCase().includes(filtroBuscar) ||
            (cuenta.numeroCuenta && cuenta.numeroCuenta.includes(filtroBuscar));
        
        return matchTipo && matchBuscar;
    });

    if (cuentasFiltradas.length === 0) {
        cuentasGrid.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-funnel"></i>
                <h3>No se encontraron cuentas</h3>
                <p>Intenta con otros filtros</p>
            </div>
        `;
        return;
    }

    cuentasFiltradas.forEach(cuenta => {
        const cuentaCard = createCuentaCard(cuenta);
        cuentasGrid.appendChild(cuentaCard);
    });
}

// Limpiar filtros
function limpiarFiltrosCuentas() {
    document.getElementById('filtroTipoCuenta').value = '';
    document.getElementById('filtroBuscarCuenta').value = '';
    aplicarFiltrosCuentas();
}

// Crear tarjeta de cuenta
function createCuentaCard(cuenta) {
    const card = document.createElement('div');
    card.className = 'cuenta-card';

    // Iconos y colores específicos por banco
    const iconMap = {
        'Nequi': 'phone-fill',
        'Daviplata': 'phone-fill',
        'Bancolombia': 'bank',
        'Davivienda': 'bank',
        'Banco de Bogotá': 'bank',
        'BBVA': 'bank',
        'Banco Popular': 'bank',
        'Banco de Occidente': 'bank',
        'Banco AV Villas': 'bank',
        'Banco Caja Social': 'bank',
        'Scotiabank Colpatria': 'bank',
        'Efectivo': 'cash-stack',
        'Otro': 'wallet2'
    };

    const colorMap = {
        'Nequi': '#6B1B9A',
        'Daviplata': '#E53935',
        'Bancolombia': '#FFD600',
        'Davivienda': '#D32F2F',
        'Banco de Bogotá': '#1565C0',
        'BBVA': '#004481',
        'Banco Popular': '#FF6F00',
        'Banco de Occidente': '#0277BD',
        'Banco AV Villas': '#2E7D32',
        'Banco Caja Social': '#388E3C',
        'Scotiabank Colpatria': '#C62828',
        'Efectivo': '#43A047',
        'Otro': cuenta.color || '#667eea'
    };

    const icon = iconMap[cuenta.tipo] || 'bank';
    const color = colorMap[cuenta.tipo] || cuenta.color || '#ff0000';
    const iconHTML = `<i class="bi bi-${icon}"></i>`;
    
    // Aplicar color del borde
    card.style.borderColor = color;

    card.innerHTML = `
        <div class="cuenta-header">
            <div class="cuenta-tipo">
                <div class="cuenta-icon" style="background: linear-gradient(135deg, ${color}, ${adjustColor(color, -20)});">
                    ${iconHTML}
                </div>
                <div class="cuenta-info">
                    <h4>${cuenta.nombre}</h4>
                    <p>${cuenta.tipo}</p>
                </div>
            </div>
            <div class="cuenta-actions">
                <button class="btn-icon edit" type="button" title="Editar cuenta">
                    <i class="bi bi-pencil-fill"></i>
                </button>
                <button class="btn-icon delete" type="button" title="Eliminar cuenta">
                    <i class="bi bi-trash-fill"></i>
                </button>
            </div>
        </div>
        <div class="cuenta-saldo">
            <div class="cuenta-saldo-label">Saldo Actual</div>
            <div class="cuenta-saldo-valor">$${formatNumber(cuenta.saldo || 0)}</div>
        </div>
        ${cuenta.numeroCuenta ? `<div class="cuenta-numero"><i class="bi bi-credit-card"></i> ${cuenta.numeroCuenta}</div>` : ''}
        ${cuenta.notas ? `<div class="cuenta-notas-box"><i class="bi bi-sticky"></i> ${cuenta.notas}</div>` : ''}
    `;

    // Agregar event listeners después de crear el HTML
    const editBtn = card.querySelector('.btn-icon.edit');
    const deleteBtn = card.querySelector('.btn-icon.delete');
    
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            openEditCuenta(cuenta.id);
        });
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            deleteCuenta(cuenta.id);
        });
    }

    return card;
}

// Ajustar color (oscurecer o aclarar)
function adjustColor(color, amount) {
    const clamp = (val) => Math.min(Math.max(val, 0), 255);
    const num = parseInt(color.replace('#', ''), 16);
    const r = clamp((num >> 16) + amount);
    const g = clamp(((num >> 8) & 0x00FF) + amount);
    const b = clamp((num & 0x0000FF) + amount);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

// Actualizar dashboard
async function updateDashboard() {
    try {
        const db = getDB();
        
        // Calcular saldo total
        let saldoTotal = 0;
        cuentasList.forEach(cuenta => {
            saldoTotal += cuenta.saldo || 0;
        });

        document.getElementById('saldoTotal').textContent = `$${formatNumber(saldoTotal)}`;
        document.getElementById('totalCuentas').textContent = cuentasList.length;

        // Calcular ingresos y gastos del mes actual
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const movimientosSnapshot = await db.collection('movimientos')
            .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(startOfMonth))
            .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(endOfMonth))
            .get();

        let ingresosMes = 0;
        let gastosMes = 0;

        movimientosSnapshot.forEach(doc => {
            const mov = doc.data();
            if (mov.tipo === 'ingreso') {
                ingresosMes += mov.monto || 0;
            } else if (mov.tipo === 'gasto') {
                gastosMes += mov.monto || 0;
            }
        });

        document.getElementById('ingresosMes').textContent = `$${formatNumber(ingresosMes)}`;
        document.getElementById('gastosMes').textContent = `$${formatNumber(gastosMes)}`;

    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Abrir modal nueva cuenta
function openNuevaCuenta() {
    editingCuentaId = null;
    document.getElementById('modalCuentaTitulo').textContent = 'Nueva Cuenta Bancaria';
    document.getElementById('formCuenta').reset();
    
    // Limpiar el dataset de formateado para permitir reinicialización
    const saldoInput = document.getElementById('saldoInicialForm');
    if (saldoInput) {
        delete saldoInput.dataset.formateado;
    }
    
    document.getElementById('modalCuenta').classList.add('active');
    
    // Inicializar formateo numérico
    setTimeout(() => inicializarFormateoNumerico(), 100);
}

// Abrir modal editar cuenta
async function openEditCuenta(cuentaId) {
    try {
        const db = getDB();
        const cuentaDoc = await db.collection('cuentas_bancarias').doc(cuentaId).get();
        
        if (!cuentaDoc.exists) {
            showNotification('error', 'Error', 'Cuenta no encontrada');
            return;
        }

        const cuenta = cuentaDoc.data();
        editingCuentaId = cuentaId;

        document.getElementById('modalCuentaTitulo').textContent = 'Editar Cuenta Bancaria';
        document.getElementById('nombreCuentaForm').value = cuenta.nombre || '';
        document.getElementById('tipoCuentaForm').value = cuenta.tipo || '';
        document.getElementById('numeroCuentaForm').value = cuenta.numeroCuenta || '';
        document.getElementById('colorCuentaForm').value = cuenta.color || '#ff0000';
        document.getElementById('notasCuentaForm').value = cuenta.notas || '';
        
        // Limpiar el dataset de formateado para permitir reinicialización
        const saldoInput = document.getElementById('saldoInicialForm');
        if (saldoInput) {
            delete saldoInput.dataset.formateado;
        }
        
        document.getElementById('modalCuenta').classList.add('active');
        
        // Inicializar formateo numérico primero
        setTimeout(() => {
            inicializarFormateoNumerico();
            // Luego establecer el valor formateado
            const saldoInput = document.getElementById('saldoInicialForm');
            if (saldoInput && cuenta.saldo !== undefined) {
                saldoInput.value = cuenta.saldo.toLocaleString('es-CO');
            }
        }, 100);
    } catch (error) {
        console.error('Error loading cuenta:', error);
        showNotification('error', 'Error', 'No se pudo cargar la cuenta');
    }
}

// Cerrar modal cuenta
function closeModalCuenta() {
    document.getElementById('modalCuenta').classList.remove('active');
    document.getElementById('formCuenta').reset();
    editingCuentaId = null;
}

// Guardar cuenta
async function handleSaveCuenta(e) {
    e.preventDefault();

    const nombre = document.getElementById('nombreCuentaForm').value.trim();
    const tipo = document.getElementById('tipoCuentaForm').value;
    const numeroCuenta = document.getElementById('numeroCuentaForm').value.trim();
    const saldo = obtenerValorNumerico(document.getElementById('saldoInicialForm'));
    const color = document.getElementById('colorCuentaForm').value;
    const notas = document.getElementById('notasCuentaForm').value.trim();

    if (!nombre || !tipo) {
        showNotification('error', 'Error', 'Por favor completa todos los campos requeridos');
        return;
    }

    try {
        const db = getDB();
        const cuentaData = {
            nombre,
            tipo,
            numeroCuenta,
            saldo,
            color,
            notas,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingCuentaId) {
            // Editar cuenta existente
            await db.collection('cuentas_bancarias').doc(editingCuentaId).update(cuentaData);
            showNotification('success', 'Cuenta Actualizada', 'La cuenta se ha actualizado correctamente');
        } else {
            // Crear nueva cuenta
            cuentaData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('cuentas_bancarias').add(cuentaData);
            showNotification('success', 'Cuenta Creada', 'La cuenta se ha creado correctamente');
        }

        closeModalCuenta();
        loadCuentas();
    } catch (error) {
        console.error('Error saving cuenta:', error);
        showNotification('error', 'Error', 'No se pudo guardar la cuenta');
    }
}

// Eliminar cuenta
async function deleteCuenta(cuentaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const db = getDB();
        
        // Verificar si hay movimientos asociados
        const movimientosSnapshot = await db.collection('movimientos')
            .where('cuentaId', '==', cuentaId)
            .limit(1)
            .get();

        if (!movimientosSnapshot.empty) {
            showNotification('warning', 'No se puede eliminar', 'Esta cuenta tiene movimientos asociados. Elimina primero los movimientos.');
            return;
        }

        await db.collection('cuentas_bancarias').doc(cuentaId).delete();
        showNotification('success', 'Cuenta Eliminada', 'La cuenta se ha eliminado correctamente');
        loadCuentas();
    } catch (error) {
        console.error('Error deleting cuenta:', error);
        showNotification('error', 'Error', 'No se pudo eliminar la cuenta');
    }
}

// ========== GESTIÓN DE MOVIMIENTOS (INGRESOS Y GASTOS) ==========

let tipoMovimientoActual = null;

// Cargar movimientos
async function loadMovimientos() {
    const movimientosList = document.getElementById('movimientosList');
    movimientosList.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    try {
        const db = getDB();
        const filtroTipo = document.getElementById('filtroTipoMovimiento').value;
        const filtroCuenta = document.getElementById('filtroCuentaMovimiento').value;
        const filtroCategoria = document.getElementById('filtroCategoriaMovimiento').value;
        const filtroMes = document.getElementById('filtroMesMovimiento').value;

        // Obtener todos los movimientos y filtrar en cliente para evitar índices compuestos
        const movimientosSnapshot = await db.collection('movimientos')
            .orderBy('fecha', 'desc')
            .limit(500)
            .get();

        // Filtrar en cliente
        let movimientos = [];
        movimientosSnapshot.forEach(doc => {
            const mov = { id: doc.id, ...doc.data() };
            
            // Aplicar filtros
            if (filtroTipo && mov.tipo !== filtroTipo) return;
            if (filtroCuenta && mov.cuentaId !== filtroCuenta) return;
            if (filtroCategoria && mov.categoria !== filtroCategoria) return;
            
            if (filtroMes) {
                const [year, month] = filtroMes.split('-');
                const startDate = new Date(year, month - 1, 1);
                const endDate = new Date(year, month, 0, 23, 59, 59);
                const movFecha = mov.fecha ? mov.fecha.toDate() : new Date();
                
                if (movFecha < startDate || movFecha > endDate) return;
            }
            
            movimientos.push(mov);
        });

        if (movimientos.length === 0) {
            movimientosList.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-inbox"></i>
                    <h3>No hay movimientos registrados</h3>
                    <p>Los ingresos y gastos aparecerán aquí</p>
                </div>
            `;
            return;
        }

        // Calcular resumen por categorías
        calcularResumenCategorias(movimientos);

        movimientosList.innerHTML = '';

        // Limitar a 100 resultados
        movimientos.slice(0, 100).forEach(movimiento => {
            const movimientoItem = createMovimientoItem(movimiento);
            movimientosList.appendChild(movimientoItem);
        });

    } catch (error) {
        console.error('Error loading movimientos:', error);
        movimientosList.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-exclamation-triangle"></i>
                <h3>Error al cargar movimientos</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Calcular resumen por categorías
function calcularResumenCategorias(movimientos) {
    const resumenContainer = document.getElementById('categoriasResumen');
    const resumenGrid = document.getElementById('resumenCategoriasGrid');
    
    if (movimientos.length === 0) {
        resumenContainer.style.display = 'none';
        return;
    }
    
    // Agrupar por categoría y tipo
    const resumenIngresos = {};
    const resumenGastos = {};
    
    movimientos.forEach(mov => {
        const categoria = mov.categoria || 'Sin categoría';
        const monto = mov.monto || 0;
        
        if (mov.tipo === 'ingreso') {
            if (!resumenIngresos[categoria]) {
                resumenIngresos[categoria] = { total: 0, cantidad: 0 };
            }
            resumenIngresos[categoria].total += monto;
            resumenIngresos[categoria].cantidad += 1;
        } else if (mov.tipo === 'gasto') {
            if (!resumenGastos[categoria]) {
                resumenGastos[categoria] = { total: 0, cantidad: 0 };
            }
            resumenGastos[categoria].total += monto;
            resumenGastos[categoria].cantidad += 1;
        }
    });
    
    // Limpiar grid
    resumenGrid.innerHTML = '';
    
    // Mostrar ingresos
    if (Object.keys(resumenIngresos).length > 0) {
        const ingresosSection = document.createElement('div');
        ingresosSection.className = 'resumen-tipo-section';
        ingresosSection.innerHTML = `
            <h4 class="resumen-tipo-titulo ingreso">
                <i class="bi bi-arrow-down-circle"></i>
                Ingresos
            </h4>
        `;
        
        const ingresosCards = document.createElement('div');
        ingresosCards.className = 'resumen-cards';
        
        let totalIngresos = 0;
        Object.entries(resumenIngresos).forEach(([categoria, datos]) => {
            totalIngresos += datos.total;
            const card = document.createElement('div');
            card.className = 'resumen-categoria-card ingreso';
            card.innerHTML = `
                <div class="resumen-categoria-info">
                    <i class="bi bi-tag-fill"></i>
                    <div>
                        <h5>${categoria}</h5>
                        <small>${datos.cantidad} movimiento${datos.cantidad !== 1 ? 's' : ''}</small>
                    </div>
                </div>
                <div class="resumen-categoria-monto">
                    ${formatNumber(datos.total)}
                </div>
            `;
            ingresosCards.appendChild(card);
        });
        
        // Card de total
        const totalCard = document.createElement('div');
        totalCard.className = 'resumen-categoria-card total ingreso';
        totalCard.innerHTML = `
            <div class="resumen-categoria-info">
                <i class="bi bi-calculator"></i>
                <div>
                    <h5>Total Ingresos</h5>
                </div>
            </div>
            <div class="resumen-categoria-monto">
                ${formatNumber(totalIngresos)}
            </div>
        `;
        ingresosCards.appendChild(totalCard);
        
        ingresosSection.appendChild(ingresosCards);
        resumenGrid.appendChild(ingresosSection);
    }
    
    // Mostrar gastos
    if (Object.keys(resumenGastos).length > 0) {
        const gastosSection = document.createElement('div');
        gastosSection.className = 'resumen-tipo-section';
        gastosSection.innerHTML = `
            <h4 class="resumen-tipo-titulo gasto">
                <i class="bi bi-arrow-up-circle"></i>
                Gastos
            </h4>
        `;
        
        const gastosCards = document.createElement('div');
        gastosCards.className = 'resumen-cards';
        
        let totalGastos = 0;
        Object.entries(resumenGastos).forEach(([categoria, datos]) => {
            totalGastos += datos.total;
            const card = document.createElement('div');
            card.className = 'resumen-categoria-card gasto';
            card.innerHTML = `
                <div class="resumen-categoria-info">
                    <i class="bi bi-tag-fill"></i>
                    <div>
                        <h5>${categoria}</h5>
                        <small>${datos.cantidad} movimiento${datos.cantidad !== 1 ? 's' : ''}</small>
                    </div>
                </div>
                <div class="resumen-categoria-monto">
                    ${formatNumber(datos.total)}
                </div>
            `;
            gastosCards.appendChild(card);
        });
        
        // Card de total
        const totalCard = document.createElement('div');
        totalCard.className = 'resumen-categoria-card total gasto';
        totalCard.innerHTML = `
            <div class="resumen-categoria-info">
                <i class="bi bi-calculator"></i>
                <div>
                    <h5>Total Gastos</h5>
                </div>
            </div>
            <div class="resumen-categoria-monto">
                ${formatNumber(totalGastos)}
            </div>
        `;
        gastosCards.appendChild(totalCard);
        
        gastosSection.appendChild(gastosCards);
        resumenGrid.appendChild(gastosSection);
    }
    
    // Mostrar el resumen
    resumenContainer.style.display = 'block';
    
    // Setup botón cerrar
    const btnCerrar = document.getElementById('btnCerrarResumen');
    btnCerrar.onclick = () => {
        resumenContainer.style.display = 'none';
    };
}

// Crear item de movimiento
function createMovimientoItem(movimiento) {
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
    const cuenta = cuentasList.find(c => c.id === movimiento.cuentaId);
    const nombreCuenta = cuenta ? cuenta.nombre : 'Cuenta eliminada';

    item.innerHTML = `
        <div class="movimiento-info">
            <div class="movimiento-icon">
                <i class="bi bi-${icon}"></i>
            </div>
            <div class="movimiento-detalles">
                <h4>${movimiento.descripcion}</h4>
                <p>${movimiento.categoria}</p>
                <span class="movimiento-fecha">${fechaStr}</span>
                ${movimiento.notas ? `<p style="margin-top: 0.5rem; font-size: 0.8rem; color: #999;">${movimiento.notas}</p>` : ''}
            </div>
        </div>
        <div class="movimiento-monto">
            <div class="movimiento-monto-valor">${signo}$${formatNumber(movimiento.monto)}</div>
            <div class="movimiento-monto-cuenta">${nombreCuenta}</div>
        </div>
        <div class="movimiento-actions">
            <button class="btn-icon" style="background: #dc3545;" onclick="deleteMovimiento('${movimiento.id}', '${movimiento.tipo}', ${movimiento.monto}, '${movimiento.cuentaId}')" title="Eliminar">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    `;

    return item;
}

// Abrir modal nuevo ingreso
async function openNuevoIngreso() {
    tipoMovimientoActual = 'ingreso';
    document.getElementById('modalMovimientoTitulo').textContent = 'Nuevo Ingreso';
    document.getElementById('tipoMovimientoForm').value = 'ingreso';
    
    // Cargar categorías de ingresos
    await loadCategoriasSelect('ingreso');

    // Establecer fecha actual
    document.getElementById('fechaMovimientoForm').valueAsDate = new Date();

    // Limpiar el dataset de formateado
    const montoInput = document.getElementById('montoMovimientoForm');
    if (montoInput) {
        delete montoInput.dataset.formateado;
        montoInput.value = '';
    }

    // Mostrar sección de gamificación para ingresos
    document.getElementById('gamificacionSection').style.display = 'block';
    await loadEstudiantesSelect();
    
    // Limpiar campos de gamificación
    document.getElementById('estudianteCompradorForm').value = '';
    document.getElementById('puntosOtorgadosForm').value = '0';
    document.getElementById('insigniaForm').value = '';
    document.getElementById('mensajeRecompensaForm').value = '';
    document.getElementById('recompensasContainer').style.display = 'none';

    loadCuentasSelect();
    document.getElementById('modalMovimiento').classList.add('active');
    
    // Inicializar formateo numérico
    setTimeout(() => inicializarFormateoNumerico(), 100);
}

// Abrir modal nuevo gasto
async function openNuevoGasto() {
    tipoMovimientoActual = 'gasto';
    document.getElementById('modalMovimientoTitulo').textContent = 'Nuevo Gasto';
    document.getElementById('tipoMovimientoForm').value = 'gasto';
    
    // Ocultar sección de gamificación para gastos
    document.getElementById('gamificacionSection').style.display = 'none';
    
    // Cargar categorías de gastos
    await loadCategoriasSelect('gasto');

    // Establecer fecha actual
    document.getElementById('fechaMovimientoForm').valueAsDate = new Date();

    // Limpiar el dataset de formateado
    const montoInput = document.getElementById('montoMovimientoForm');
    if (montoInput) {
        delete montoInput.dataset.formateado;
        montoInput.value = '';
    }

    loadCuentasSelect();
    document.getElementById('modalMovimiento').classList.add('active');
    
    // Inicializar formateo numérico
    setTimeout(() => inicializarFormateoNumerico(), 100);
}

// Cargar cuentas en select
function loadCuentasSelect() {
    const select = document.getElementById('cuentaMovimientoForm');
    select.innerHTML = '<option value="">Seleccionar cuenta</option>';

    cuentasList.forEach(cuenta => {
        const option = document.createElement('option');
        option.value = cuenta.id;
        option.textContent = `${cuenta.nombre} - $${formatNumber(cuenta.saldo)}`;
        select.appendChild(option);
    });
}

// Cerrar modal movimiento
function closeModalMovimiento() {
    document.getElementById('modalMovimiento').classList.remove('active');
    document.getElementById('formMovimiento').reset();
    tipoMovimientoActual = null;
}

// Guardar movimiento
async function handleSaveMovimiento(e) {
    e.preventDefault();

    // Obtener el botón de submit y deshabilitarlo
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    const btnTextoOriginal = btnSubmit ? btnSubmit.innerHTML : '';
    
    if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="bi bi-hourglass-split"></i> Registrando...';
    }

    const tipo = document.getElementById('tipoMovimientoForm').value;
    const cuentaId = document.getElementById('cuentaMovimientoForm').value;
    const monto = obtenerValorNumerico(document.getElementById('montoMovimientoForm'));
    const categoria = document.getElementById('categoriaMovimientoForm').value;
    const descripcion = document.getElementById('descripcionMovimientoForm').value.trim();
    const fecha = document.getElementById('fechaMovimientoForm').value;
    const notas = document.getElementById('notasMovimientoForm').value.trim();

    if (!tipo || !cuentaId || !monto || !categoria || !descripcion || !fecha) {
        showNotification('error', 'Error', 'Por favor completa todos los campos requeridos');
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = btnTextoOriginal;
        }
        return;
    }

    try {
        const db = getDB();
        
        // Obtener cuenta actual
        const cuentaDoc = await db.collection('cuentas_bancarias').doc(cuentaId).get();
        if (!cuentaDoc.exists) {
            showNotification('error', 'Error', 'Cuenta no encontrada');
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = btnTextoOriginal;
            }
            return;
        }

        const cuenta = cuentaDoc.data();
        let nuevoSaldo = cuenta.saldo || 0;

        // Calcular nuevo saldo
        if (tipo === 'ingreso') {
            nuevoSaldo += monto;
        } else if (tipo === 'gasto') {
            if (nuevoSaldo < monto) {
                showNotification('warning', 'Saldo Insuficiente', 'La cuenta no tiene saldo suficiente para este gasto');
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = btnTextoOriginal;
                }
                return;
            }
            nuevoSaldo -= monto;
        }

        // Crear movimiento
        const movimientoData = {
            tipo,
            cuentaId,
            monto,
            categoria,
            descripcion,
            fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha)),
            notas,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Agregar datos de gamificación si es un ingreso con estudiante
        if (tipo === 'ingreso') {
            const estudianteId = document.getElementById('estudianteCompradorForm').value;
            if (estudianteId) {
                const estudianteSelect = document.getElementById('estudianteCompradorForm');
                const estudianteNombre = estudianteSelect.options[estudianteSelect.selectedIndex].dataset.nombre;
                const puntos = parseInt(document.getElementById('puntosOtorgadosForm').value) || 0;
                const insignia = document.getElementById('insigniaForm').value;
                const mensaje = document.getElementById('mensajeRecompensaForm').value.trim();

                movimientoData.estudianteId = estudianteId;
                movimientoData.estudianteNombre = estudianteNombre;
                movimientoData.puntosOtorgados = puntos;
                movimientoData.insignia = insignia || null;
                movimientoData.mensajeRecompensa = mensaje || null;
                movimientoData.fechaRecompensa = firebase.firestore.FieldValue.serverTimestamp();
            }
        }

        const movimientoRef = await db.collection('movimientos').add(movimientoData);

        // Otorgar recompensas si hay estudiante asociado
        if (tipo === 'ingreso' && movimientoData.estudianteId) {
            console.log('Otorgando recompensas a:', movimientoData.estudianteNombre);
            const recompensasData = {
                puntos: movimientoData.puntosOtorgados,
                insignia: movimientoData.insignia,
                mensaje: movimientoData.mensajeRecompensa,
                descripcion: descripcion
            };
            
            try {
                const recompensasOtorgadas = await otorgarRecompensas(
                    movimientoData.estudianteId,
                    movimientoRef.id,
                    recompensasData
                );

                if (recompensasOtorgadas) {
                    console.log('Recompensas otorgadas exitosamente');
                    if (window.showNotification) {
                        showNotification('success', '¡Recompensas Otorgadas!', 
                            `Se otorgaron ${movimientoData.puntosOtorgados} puntos a ${movimientoData.estudianteNombre}`);
                    }
                } else {
                    console.error('No se pudieron otorgar las recompensas');
                }
            } catch (errorRecompensas) {
                console.error('Error al otorgar recompensas:', errorRecompensas);
            }
        }

        // Actualizar saldo de la cuenta
        await db.collection('cuentas_bancarias').doc(cuentaId).update({
            saldo: nuevoSaldo,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showNotification('success', 'Movimiento Registrado', 'El movimiento se ha registrado correctamente');
        closeModalMovimiento();
        loadCuentas();
        loadMovimientos();
    } catch (error) {
        console.error('Error saving movimiento:', error);
        showNotification('error', 'Error', 'No se pudo registrar el movimiento');
    } finally {
        // Restaurar el botón en cualquier caso
        if (btnSubmit) {
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = btnTextoOriginal;
        }
    }
}

// Eliminar movimiento
async function deleteMovimiento(movimientoId, tipo, monto, cuentaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este movimiento? Se revertirá el cambio en el saldo de la cuenta.')) {
        return;
    }

    try {
        const db = getDB();
        
        // Obtener cuenta
        const cuentaDoc = await db.collection('cuentas_bancarias').doc(cuentaId).get();
        if (cuentaDoc.exists) {
            const cuenta = cuentaDoc.data();
            let nuevoSaldo = cuenta.saldo || 0;

            // Revertir el movimiento
            if (tipo === 'ingreso') {
                nuevoSaldo -= monto;
            } else if (tipo === 'gasto') {
                nuevoSaldo += monto;
            }

            // Actualizar saldo
            await db.collection('cuentas_bancarias').doc(cuentaId).update({
                saldo: nuevoSaldo,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }

        // Eliminar movimiento
        await db.collection('movimientos').doc(movimientoId).delete();

        showNotification('success', 'Movimiento Eliminado', 'El movimiento se ha eliminado y el saldo se ha revertido');
        loadCuentas();
        loadMovimientos();
    } catch (error) {
        console.error('Error deleting movimiento:', error);
        showNotification('error', 'Error', 'No se pudo eliminar el movimiento');
    }
}

// Cargar cuentas en filtro de movimientos
async function loadCuentasFilterMovimientos() {
    const select = document.getElementById('filtroCuentaMovimiento');
    select.innerHTML = '<option value="">Todas las cuentas</option>';

    cuentasList.forEach(cuenta => {
        const option = document.createElement('option');
        option.value = cuenta.id;
        option.textContent = cuenta.nombre;
        select.appendChild(option);
    });
}

// Formatear input numérico con separadores de miles
function formatearInputNumerico(input) {
    // Cambiar tipo a text si es number
    if (input.type === 'number') {
        input.type = 'text';
    }
    
    // Remover listeners anteriores si existen
    const newInput = input.cloneNode(true);
    input.parentNode.replaceChild(newInput, input);
    
    newInput.addEventListener('input', function(e) {
        // Guardar la posición del cursor
        let cursorPos = this.selectionStart;
        let oldValue = this.value;
        
        // Remover todo excepto números
        let value = this.value.replace(/\D/g, '');
        
        // Si está vacío, dejar vacío
        if (!value) {
            this.value = '';
            return;
        }
        
        // Formatear con puntos de miles
        let formatted = parseInt(value).toLocaleString('es-CO');
        
        // Calcular nueva posición del cursor
        let diff = formatted.length - oldValue.length;
        let newCursorPos = cursorPos + diff;
        
        // Actualizar el valor
        this.value = formatted;
        
        // Restaurar posición del cursor
        if (newCursorPos < 0) newCursorPos = 0;
        if (newCursorPos > formatted.length) newCursorPos = formatted.length;
        
        try {
            this.setSelectionRange(newCursorPos, newCursorPos);
        } catch (e) {
            // Ignorar error si no se puede establecer la selección
        }
    });
    
    // Al hacer blur, asegurar que el valor esté formateado
    newInput.addEventListener('blur', function() {
        let value = this.value.replace(/\D/g, '');
        if (value) {
            this.value = parseInt(value).toLocaleString('es-CO');
        } else {
            this.value = '';
        }
    });
    
    return newInput;
}

// Obtener valor numérico sin formato
function obtenerValorNumerico(input) {
    const value = input.value.replace(/\D/g, '');
    return value ? parseInt(value) : 0;
}

// Inicializar formateo de inputs numéricos
function inicializarFormateoNumerico() {
    // Inputs de cuentas
    const saldoInicialInput = document.getElementById('saldoInicialForm');
    if (saldoInicialInput && !saldoInicialInput.dataset.formateado) {
        formatearInputNumerico(saldoInicialInput);
        saldoInicialInput.dataset.formateado = 'true';
    }
    
    // Inputs de movimientos
    const montoMovimientoInput = document.getElementById('montoMovimientoForm');
    if (montoMovimientoInput && !montoMovimientoInput.dataset.formateado) {
        formatearInputNumerico(montoMovimientoInput);
        montoMovimientoInput.dataset.formateado = 'true';
    }
    
    // Input de tarifa
    const tarifaHoraInput = document.getElementById('tarifaHora');
    if (tarifaHoraInput && !tarifaHoraInput.dataset.formateado) {
        formatearInputNumerico(tarifaHoraInput);
        tarifaHoraInput.dataset.formateado = 'true';
    }
}

// ========== GESTIÓN DE CATEGORÍAS ==========

// Cargar categorías desde Firebase
async function loadCategorias() {
    try {
        const db = getDB();
        const categoriasSnapshot = await db.collection('categorias_financieras')
            .orderBy('nombre')
            .get();

        categoriasList = [];
        categoriasSnapshot.forEach(doc => {
            categoriasList.push({ id: doc.id, ...doc.data() });
        });

        // Hacer disponible globalmente
        window.categoriasList = categoriasList;
        
        return categoriasList;
    } catch (error) {
        console.error('Error loading categorias:', error);
        window.categoriasList = [];
        return [];
    }
}

// Cargar categorías en el select del formulario
async function loadCategoriasSelect(tipo) {
    await loadCategorias();
    
    const categoriaSelect = document.getElementById('categoriaMovimientoForm');
    
    // Usar window.categoriasList que se carga en loadCategorias
    const todasCategorias = window.categoriasList || [];
    const categoriasFiltradas = todasCategorias.filter(cat => cat.tipo === tipo);
    
    categoriaSelect.innerHTML = '<option value="">Seleccionar categoría</option>';
    
    categoriasFiltradas.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.nombre;
        option.textContent = cat.nombre;
        categoriaSelect.appendChild(option);
    });
    
    // Agregar opción para crear nueva categoría
    const optionNueva = document.createElement('option');
    optionNueva.value = '__nueva__';
    optionNueva.textContent = '+ Crear nueva categoría';
    optionNueva.style.fontWeight = 'bold';
    optionNueva.style.color = '#667eea';
    categoriaSelect.appendChild(optionNueva);
    
    // Remover listeners anteriores clonando el elemento
    const newSelect = categoriaSelect.cloneNode(true);
    categoriaSelect.parentNode.replaceChild(newSelect, categoriaSelect);
    
    // Listener para detectar cuando se selecciona "crear nueva"
    newSelect.addEventListener('change', function() {
        if (this.value === '__nueva__') {
            crearNuevaCategoria(tipo);
        }
    });
}

// Crear nueva categoría (usa el modal global)
function crearNuevaCategoria(tipo) {
    // Resetear el select
    document.getElementById('categoriaMovimientoForm').value = '';
    
    // Configurar el contexto y tipo para el modal
    if (window.openModalNuevaCategoriaDesdeFormulario) {
        window.openModalNuevaCategoriaDesdeFormulario(tipo);
    }
}

// Obtener estadísticas por categoría
async function getEstadisticasPorCategoria(tipo, mes = null) {
    try {
        const db = getDB();
        let query = db.collection('movimientos').where('tipo', '==', tipo);
        
        if (mes) {
            const [year, month] = mes.split('-');
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0, 23, 59, 59);
            
            query = query
                .where('fecha', '>=', firebase.firestore.Timestamp.fromDate(startDate))
                .where('fecha', '<=', firebase.firestore.Timestamp.fromDate(endDate));
        }
        
        const movimientosSnapshot = await query.get();
        
        const estadisticas = {};
        
        movimientosSnapshot.forEach(doc => {
            const mov = doc.data();
            const categoria = mov.categoria || 'Sin categoría';
            
            if (!estadisticas[categoria]) {
                estadisticas[categoria] = {
                    total: 0,
                    cantidad: 0
                };
            }
            
            estadisticas[categoria].total += mov.monto || 0;
            estadisticas[categoria].cantidad += 1;
        });
        
        return estadisticas;
    } catch (error) {
        console.error('Error getting estadisticas:', error);
        return {};
    }
}

// Make functions global
window.openNuevaCuenta = openNuevaCuenta;
window.openEditCuenta = openEditCuenta;
window.deleteCuenta = deleteCuenta;
window.openNuevoIngreso = openNuevoIngreso;
window.openNuevoGasto = openNuevoGasto;
window.deleteMovimiento = deleteMovimiento;
window.loadCuentas = loadCuentas;
window.loadMovimientos = loadMovimientos;
window.aplicarFiltrosCuentas = aplicarFiltrosCuentas;
window.limpiarFiltrosCuentas = limpiarFiltrosCuentas;
window.cargarTiposCuentasDisponibles = cargarTiposCuentasDisponibles;
window.inicializarFormateoNumerico = inicializarFormateoNumerico;
window.obtenerValorNumerico = obtenerValorNumerico;
window.loadCategorias = loadCategorias;
window.loadCategoriasSelect = loadCategoriasSelect;
window.getEstadisticasPorCategoria = getEstadisticasPorCategoria;
window.calcularResumenCategorias = calcularResumenCategorias;

// ========== SISTEMA DE GAMIFICACIÓN ==========

// Cargar estudiantes en el select
async function loadEstudiantesSelect() {
    const select = document.getElementById('estudianteCompradorForm');
    select.innerHTML = '<option value="">Sin estudiante asociado</option>';

    try {
        const db = getDB();
        const estudiantesSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        // Filtrar y ordenar en cliente
        const estudiantes = [];
        estudiantesSnapshot.forEach(doc => {
            const estudiante = doc.data();
            if (estudiante.activo !== false) { // Incluir activos y sin definir
                estudiantes.push({ id: doc.id, ...estudiante });
            }
        });

        // Ordenar por nombre
        estudiantes.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        // Agregar al select
        estudiantes.forEach(estudiante => {
            const option = document.createElement('option');
            option.value = estudiante.id;
            option.textContent = `${estudiante.nombre} - ${estudiante.usuario}`;
            option.dataset.nombre = estudiante.nombre;
            select.appendChild(option);
        });

        // Listener para mostrar/ocultar campos de recompensa
        select.addEventListener('change', function() {
            const recompensasContainer = document.getElementById('recompensasContainer');
            if (this.value) {
                recompensasContainer.style.display = 'block';
            } else {
                recompensasContainer.style.display = 'none';
            }
        });

    } catch (error) {
        console.error('Error loading estudiantes:', error);
    }
}

// Otorgar recompensas al estudiante
async function otorgarRecompensas(estudianteId, movimientoId, recompensasData) {
    try {
        const db = getDB();
        const estudianteRef = db.collection('usuarios').doc(estudianteId);
        const estudianteDoc = await estudianteRef.get();

        if (!estudianteDoc.exists) {
            console.error('Estudiante no encontrado');
            return false;
        }

        const estudiante = estudianteDoc.data();
        const puntosActuales = estudiante.puntosAcumulados || 0;
        const insigniasActuales = estudiante.insignias || [];
        const historialRecompensas = estudiante.historialRecompensas || [];

        // Preparar datos de actualización
        const updateData = {
            puntosAcumulados: puntosActuales + (recompensasData.puntos || 0)
        };

        // Agregar insignia si existe
        if (recompensasData.insignia) {
            const insigniasMap = {
                'primera-compra': { nombre: 'Primera Compra', icono: '🎉' },
                'comprador-frecuente': { nombre: 'Comprador Frecuente', icono: '⭐' },
                'gran-compra': { nombre: 'Gran Compra', icono: '💎' },
                'cliente-vip': { nombre: 'Cliente VIP', icono: '👑' },
                'apoyo-especial': { nombre: 'Apoyo Especial', icono: '🏆' },
                'benefactor': { nombre: 'Benefactor', icono: '🌟' }
            };

            const insigniaInfo = insigniasMap[recompensasData.insignia];
            if (insigniaInfo) {
                const nuevaInsignia = {
                    tipo: recompensasData.insignia,
                    nombre: insigniaInfo.nombre,
                    icono: insigniaInfo.icono,
                    fecha: new Date(),
                    movimientoId: movimientoId,
                    mensaje: recompensasData.mensaje || ''
                };
                insigniasActuales.push(nuevaInsignia);
                updateData.insignias = insigniasActuales;
            }
        }

        // Agregar al historial
        const nuevoHistorial = {
            fecha: new Date(),
            puntos: recompensasData.puntos || 0,
            insignia: recompensasData.insignia || null,
            movimientoId: movimientoId,
            descripcion: recompensasData.descripcion || '',
            mensaje: recompensasData.mensaje || ''
        };
        historialRecompensas.push(nuevoHistorial);
        updateData.historialRecompensas = historialRecompensas;

        // Actualizar estudiante
        await estudianteRef.update(updateData);

        return true;
    } catch (error) {
        console.error('Error otorgando recompensas:', error);
        return false;
    }
}

window.loadEstudiantesSelect = loadEstudiantesSelect;
window.otorgarRecompensas = otorgarRecompensas;


