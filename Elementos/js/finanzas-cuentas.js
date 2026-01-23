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
        
        // Cargar cuentas primero para tener los nombres actualizados
        const cuentasSnapshot = await db.collection('cuentas_bancarias').get();
        cuentasList = [];
        cuentasSnapshot.forEach(doc => {
            cuentasList.push({ id: doc.id, ...doc.data() });
        });
        window.cuentasList = cuentasList;
        
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

    // Establecer fecha actual sin problemas de zona horaria
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    document.getElementById('fechaMovimientoForm').value = `${year}-${month}-${day}`;

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

    // Establecer fecha actual sin problemas de zona horaria
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    document.getElementById('fechaMovimientoForm').value = `${year}-${month}-${day}`;

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
        // Crear fecha correctamente sin problemas de zona horaria
        const [year, month, day] = fecha.split('-');
        const fechaCorrecta = new Date(year, month - 1, day, 12, 0, 0); // Usar mediodía para evitar problemas de zona horaria
        
        const movimientoData = {
            tipo,
            cuentaId,
            monto,
            categoria,
            descripcion,
            fecha: firebase.firestore.Timestamp.fromDate(fechaCorrecta),
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

                movimientoData.estudianteId = estudianteId;
                movimientoData.estudianteNombre = estudianteNombre;
                movimientoData.puntosOtorgados = puntos;
                movimientoData.fechaRecompensa = firebase.firestore.FieldValue.serverTimestamp();
            }
        }

        const movimientoRef = await db.collection('movimientos').add(movimientoData);

        // Otorgar recompensas si hay estudiante asociado
        if (tipo === 'ingreso' && movimientoData.estudianteId) {
            console.log('Otorgando recompensas a:', movimientoData.estudianteNombre);
            const recompensasData = {
                puntos: movimientoData.puntosOtorgados,
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
                            `Se otorgaron ${movimientoData.puntosOtorgados} monedas a ${movimientoData.estudianteNombre}`);
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

// Variable para almacenar todos los estudiantes cargados
let allEstudiantesGamificacion = [];

// Cargar instituciones en los filtros de gamificación
async function loadInstitucionesGamificacion() {
    try {
        const db = getDB();
        const institucionesSnapshot = await db.collection('instituciones').orderBy('nombre').get();
        
        const instituciones = [];
        institucionesSnapshot.forEach(doc => {
            instituciones.push({ id: doc.id, ...doc.data() });
        });

        // Poblar todos los selects de filtro de institución
        const filtroSelects = [
            'filtroInstitucionEstudiante',
            'filtroInstitucionEstudianteEdit', 
            'filtroInstitucionRecompensa'
        ];

        filtroSelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Todas las instituciones</option>';
                instituciones.forEach(inst => {
                    const option = document.createElement('option');
                    option.value = inst.nombre;
                    option.textContent = inst.nombre;
                    select.appendChild(option);
                });
            }
        });

        return instituciones;
    } catch (error) {
        console.error('Error loading instituciones:', error);
        return [];
    }
}

// Cargar estudiantes en el select
async function loadEstudiantesSelect() {
    const select = document.getElementById('estudianteCompradorForm');
    if (!select) return;
    
    select.innerHTML = '<option value="">Cargando estudiantes...</option>';

    try {
        const db = getDB();
        
        // Cargar instituciones primero
        await loadInstitucionesGamificacion();
        
        const estudiantesSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        // Filtrar y ordenar en cliente
        allEstudiantesGamificacion = [];
        estudiantesSnapshot.forEach(doc => {
            const estudiante = doc.data();
            if (estudiante.activo !== false) {
                allEstudiantesGamificacion.push({ id: doc.id, ...estudiante });
            }
        });

        // Ordenar por nombre
        allEstudiantesGamificacion.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

        // Mostrar todos los estudiantes inicialmente
        filterEstudiantesByInstitucion('');

        // Listener para filtro de institución
        const filtroInstitucion = document.getElementById('filtroInstitucionEstudiante');
        if (filtroInstitucion) {
            filtroInstitucion.removeEventListener('change', handleFiltroInstitucionChange);
            filtroInstitucion.addEventListener('change', handleFiltroInstitucionChange);
        }

        // Listener para mostrar/ocultar campos de recompensa
        select.removeEventListener('change', handleEstudianteSelectChange);
        select.addEventListener('change', handleEstudianteSelectChange);

    } catch (error) {
        console.error('Error loading estudiantes:', error);
        select.innerHTML = '<option value="">Error al cargar estudiantes</option>';
    }
}

// Manejar cambio en filtro de institución
function handleFiltroInstitucionChange(e) {
    filterEstudiantesByInstitucion(e.target.value);
}

// Manejar cambio en select de estudiante
function handleEstudianteSelectChange() {
    const recompensasContainer = document.getElementById('recompensasContainer');
    if (recompensasContainer) {
        recompensasContainer.style.display = this.value ? 'block' : 'none';
    }
}

// Filtrar estudiantes por institución
function filterEstudiantesByInstitucion(institucion, selectId = 'estudianteCompradorForm') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="">Sin estudiante asociado</option>';

    const estudiantesFiltrados = institucion 
        ? allEstudiantesGamificacion.filter(e => e.institucion === institucion)
        : allEstudiantesGamificacion;

    estudiantesFiltrados.forEach(estudiante => {
        const option = document.createElement('option');
        option.value = estudiante.id;
        option.textContent = `${estudiante.nombre} - ${estudiante.institucion || 'Sin institución'}`;
        option.dataset.nombre = estudiante.nombre || '';
        option.dataset.institucion = estudiante.institucion || '';
        option.dataset.email = estudiante.usuario || estudiante.email || '';
        option.dataset.monedas = estudiante.puntosAcumulados || estudiante.puntos || 0;
        option.dataset.insignias = estudiante.insignias ? estudiante.insignias.length : 0;
        option.dataset.foto = estudiante.fotoPerfil || '';
        select.appendChild(option);
    });
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
        // Leer de ambos campos para obtener el valor actual correcto
        const puntosActuales = estudiante.puntos || estudiante.puntosAcumulados || 0;
        const historialRecompensas = estudiante.historialRecompensas || [];
        const nuevosPuntos = puntosActuales + (recompensasData.puntos || 0);

        // Preparar datos de actualización - actualizar AMBOS campos para consistencia
        const updateData = {
            puntos: nuevosPuntos,
            puntosAcumulados: nuevosPuntos
        };

        // Agregar al historial
        const nuevoHistorial = {
            fecha: new Date(),
            puntos: recompensasData.puntos || 0,
            movimientoId: movimientoId,
            descripcion: recompensasData.descripcion || ''
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
window.loadInstitucionesGamificacion = loadInstitucionesGamificacion;
window.filterEstudiantesByInstitucion = filterEstudiantesByInstitucion;



// ============================================
// SECCIÓN: OTORGAR MONEDAS A ESTUDIANTES
// ============================================

// Variable para almacenar todos los usuarios cargados (estudiantes, admins, superusuarios)
let todosLosEstudiantesRecompensa = [];

// Cargar la pestaña de recompensas
async function loadRecompensasTab() {
    await loadInstitucionesGamificacion();
    await cargarYRenderizarUsuarios();
    await loadRecompensasHistorial();
    initRecompensasEvents();
    initLimpiarHistorialEvent();
}

// Cargar y renderizar usuarios en lista (estudiantes, admins, superusuarios)
async function cargarYRenderizarUsuarios() {
    const container = document.getElementById('estudiantesListaRecompensa');
    if (!container) return;

    // Solo cargar de Firebase si no tenemos datos
    if (todosLosEstudiantesRecompensa.length === 0) {
        container.innerHTML = '<div class="loading-estudiantes"><i class="bi bi-arrow-clockwise spin"></i><p>Cargando usuarios...</p></div>';

        try {
            const db = getDB();
            
            // Cargar TODOS los usuarios activos (estudiantes, admins, superusuarios)
            const snapshot = await db.collection('usuarios')
                .where('activo', '==', true)
                .get();

            todosLosEstudiantesRecompensa = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                todosLosEstudiantesRecompensa.push({ id: doc.id, ...data });
            });

            // Ordenar por nombre
            todosLosEstudiantesRecompensa.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            container.innerHTML = '<div class="empty-estudiantes"><i class="bi bi-exclamation-circle"></i><p>Error al cargar usuarios</p></div>';
            return;
        }
    }

    renderizarListaEstudiantes();
}

// Alias para compatibilidad
async function cargarYRenderizarEstudiantes() {
    return cargarYRenderizarUsuarios();
}

// Renderizar lista de usuarios con filtros aplicados
function renderizarListaEstudiantes() {
    const container = document.getElementById('estudiantesListaRecompensa');
    if (!container) return;

    const tipoUsuarioFiltro = document.getElementById('filtroTipoUsuarioRecompensa')?.value || '';
    const institucionFiltro = document.getElementById('filtroInstitucionRecompensa')?.value || '';
    const busqueda = document.getElementById('buscarEstudianteRecompensa')?.value?.trim().toLowerCase() || '';

    // Aplicar filtros
    let usuariosFiltrados = [...todosLosEstudiantesRecompensa];
    
    // Filtrar por tipo de usuario
    if (tipoUsuarioFiltro) {
        if (tipoUsuarioFiltro === 'superusuario') {
            usuariosFiltrados = usuariosFiltrados.filter(e => e.rol === 'superusuario');
        } else if (tipoUsuarioFiltro === 'admin') {
            usuariosFiltrados = usuariosFiltrados.filter(e => e.tipoUsuario === 'admin' && e.rol !== 'superusuario');
        } else {
            usuariosFiltrados = usuariosFiltrados.filter(e => e.tipoUsuario === tipoUsuarioFiltro);
        }
    }
    
    if (institucionFiltro) {
        usuariosFiltrados = usuariosFiltrados.filter(e => e.institucion === institucionFiltro);
    }
    
    if (busqueda) {
        usuariosFiltrados = usuariosFiltrados.filter(e => 
            (e.nombre || '').toLowerCase().includes(busqueda) ||
            (e.usuario || '').toLowerCase().includes(busqueda)
        );
    }

    if (usuariosFiltrados.length === 0) {
        container.innerHTML = '<div class="empty-estudiantes"><i class="bi bi-person-x"></i><p>No se encontraron usuarios</p></div>';
        return;
    }

    container.innerHTML = usuariosFiltrados.map(est => {
        // Leer de ambos campos para consistencia
        const monedas = est.puntos || est.puntosAcumulados || 0;
        const foto = est.fotoPerfil ? `<img src="${est.fotoPerfil}" alt="${est.nombre}">` : `<i class="bi bi-person-fill"></i>`;
        
        // Determinar el tipo de usuario para mostrar
        let tipoLabel = 'Estudiante';
        let tipoClass = 'tipo-estudiante';
        if (est.rol === 'superusuario') {
            tipoLabel = 'Super Admin';
            tipoClass = 'tipo-superadmin';
        } else if (est.tipoUsuario === 'admin') {
            tipoLabel = 'Admin';
            tipoClass = 'tipo-admin';
        }
        
        return `
            <div class="estudiante-item" data-id="${est.id}">
                <div class="estudiante-avatar-mini">${foto}</div>
                <div class="estudiante-info-mini">
                    <span class="estudiante-nombre-mini">${est.nombre || 'Sin nombre'}</span>
                    <span class="estudiante-institucion-mini">
                        <span class="tipo-usuario-badge ${tipoClass}">${tipoLabel}</span>
                        ${est.institucion || ''}
                    </span>
                </div>
                <div class="estudiante-monedas-actual">
                    <i class="bi bi-coin"></i>
                    <span id="monedas-display-${est.id}">${monedas}</span>
                </div>
                <div class="dar-monedas-control">
                    <button class="btn-menos-monedas" onclick="ajustarMonedas('${est.id}', -10)">
                        <i class="bi bi-dash"></i>
                    </button>
                    <input type="number" id="monedas-${est.id}" class="input-monedas" value="10" min="1" max="1000">
                    <button class="btn-mas-monedas" onclick="ajustarMonedas('${est.id}', 10)">
                        <i class="bi bi-plus"></i>
                    </button>
                    <button class="btn-dar-monedas" onclick="otorgarMonedasRapido('${est.id}', '${(est.nombre || '').replace(/'/g, "\\'")}')">
                        <i class="bi bi-plus-circle"></i>
                        Dar
                    </button>
                    <button class="btn-quitar-monedas" onclick="quitarMonedasRapido('${est.id}', '${(est.nombre || '').replace(/'/g, "\\'")}')">
                        <i class="bi bi-dash-circle"></i>
                        Quitar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Ajustar cantidad de monedas con botones +/-
function ajustarMonedas(estudianteId, delta) {
    const input = document.getElementById(`monedas-${estudianteId}`);
    if (input) {
        let valor = parseInt(input.value) || 10;
        valor = Math.max(1, Math.min(1000, valor + delta));
        input.value = valor;
    }
}

// Otorgar monedas rápidamente
async function otorgarMonedasRapido(estudianteId, estudianteNombre) {
    const input = document.getElementById(`monedas-${estudianteId}`);
    const monedas = parseInt(input?.value) || 10;

    if (monedas <= 0) {
        showNotification('error', 'Error', 'La cantidad debe ser mayor a 0');
        return;
    }

    // Deshabilitar botón mientras procesa
    const btn = input?.parentElement?.querySelector('.btn-dar-monedas');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i>';
    }

    try {
        const recompensasData = {
            puntos: monedas,
            descripcion: 'Recompensa otorgada manualmente'
        };

        const success = await otorgarRecompensas(estudianteId, `recompensa_manual_${Date.now()}`, recompensasData);

        if (success) {
            showNotification('success', '¡Listo!', `+${monedas} monedas para ${estudianteNombre}`);
            
            // Actualizar monedas en la lista sin recargar todo - actualizar ambos campos
            const estudianteIndex = todosLosEstudiantesRecompensa.findIndex(e => e.id === estudianteId);
            if (estudianteIndex !== -1) {
                const actual = todosLosEstudiantesRecompensa[estudianteIndex].puntos || todosLosEstudiantesRecompensa[estudianteIndex].puntosAcumulados || 0;
                todosLosEstudiantesRecompensa[estudianteIndex].puntos = actual + monedas;
                todosLosEstudiantesRecompensa[estudianteIndex].puntosAcumulados = actual + monedas;
            }
            
            // Re-renderizar lista y historial
            renderizarListaEstudiantes();
            await loadRecompensasHistorial();
        } else {
            showNotification('error', 'Error', 'No se pudieron otorgar las monedas');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Ocurrió un error');
    }

    // Restaurar botón
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-send-check"></i> Dar';
    }
}

// Quitar monedas rápidamente
async function quitarMonedasRapido(estudianteId, estudianteNombre) {
    const input = document.getElementById(`monedas-${estudianteId}`);
    const monedas = parseInt(input?.value) || 10;

    if (monedas <= 0) {
        showNotification('error', 'Error', 'La cantidad debe ser mayor a 0');
        return;
    }

    // Verificar que el estudiante tenga suficientes monedas
    const estudiante = todosLosEstudiantesRecompensa.find(e => e.id === estudianteId);
    const monedasActuales = estudiante?.puntos || estudiante?.puntosAcumulados || 0;
    
    if (monedasActuales < monedas) {
        showNotification('error', 'Error', `${estudianteNombre} solo tiene ${monedasActuales} monedas`);
        return;
    }

    // Deshabilitar botón mientras procesa
    const btn = input?.parentElement?.querySelector('.btn-quitar-monedas');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="bi bi-arrow-clockwise spin"></i>';
    }

    try {
        const db = getDB();
        
        // Actualizar AMBOS campos en Firebase para consistencia
        await db.collection('usuarios').doc(estudianteId).update({
            puntos: firebase.firestore.FieldValue.increment(-monedas),
            puntosAcumulados: firebase.firestore.FieldValue.increment(-monedas),
            historialRecompensas: firebase.firestore.FieldValue.arrayUnion({
                fecha: new Date(),
                puntos: -monedas,
                tipo: 'descuento',
                descripcion: 'Monedas descontadas manualmente',
                movimientoId: `descuento_manual_${Date.now()}`
            })
        });

        showNotification('success', '¡Listo!', `-${monedas} monedas para ${estudianteNombre}`);
        
        // Actualizar monedas en la lista sin recargar todo
        const estudianteIndex = todosLosEstudiantesRecompensa.findIndex(e => e.id === estudianteId);
        if (estudianteIndex !== -1) {
            const actual = todosLosEstudiantesRecompensa[estudianteIndex].puntos || todosLosEstudiantesRecompensa[estudianteIndex].puntosAcumulados || 0;
            todosLosEstudiantesRecompensa[estudianteIndex].puntos = Math.max(0, actual - monedas);
            todosLosEstudiantesRecompensa[estudianteIndex].puntosAcumulados = Math.max(0, actual - monedas);
        }
        
        // Re-renderizar lista y historial
        renderizarListaEstudiantes();
        await loadRecompensasHistorial();
        
    } catch (error) {
        console.error('Error:', error);
        showNotification('error', 'Error', 'Ocurrió un error al quitar monedas');
    }

    // Restaurar botón
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-dash-circle"></i> Quitar';
    }
}

// Exponer funciones globalmente
window.ajustarMonedas = ajustarMonedas;
window.otorgarMonedasRapido = otorgarMonedasRapido;
window.quitarMonedasRapido = quitarMonedasRapido;

// Cargar historial de recompensas recientes (todos los usuarios)
async function loadRecompensasHistorial() {
    const container = document.getElementById('recompensasHistorialList');
    if (!container) return;

    container.innerHTML = '<div class="loading-historial"><i class="bi bi-arrow-clockwise spin"></i> Cargando...</div>';

    try {
        const db = getDB();
        
        // Obtener TODOS los usuarios con historial de recompensas
        const usuariosSnapshot = await db.collection('usuarios').get();

        let todasLasRecompensas = [];

        usuariosSnapshot.forEach(doc => {
            const data = doc.data();
            const historial = data.historialRecompensas || [];
            
            // Determinar tipo de usuario
            let tipoUsuario = 'Estudiante';
            if (data.rol === 'superusuario') {
                tipoUsuario = 'Super Admin';
            } else if (data.tipoUsuario === 'admin') {
                tipoUsuario = 'Admin';
            }
            
            historial.forEach(item => {
                todasLasRecompensas.push({
                    estudianteId: doc.id,
                    estudianteNombre: data.nombre || 'Usuario',
                    estudianteFoto: data.fotoPerfil || null,
                    tipoUsuario: tipoUsuario,
                    puntos: item.puntos || 0,
                    descripcion: item.descripcion || 'Sin descripción',
                    fecha: item.fecha?.toDate ? item.fecha.toDate() : (item.fecha ? new Date(item.fecha) : new Date()),
                    tipo: item.tipo || (item.puntos >= 0 ? 'recompensa' : 'descuento')
                });
            });
        });

        // Ordenar por fecha descendente y tomar los últimos 30
        todasLasRecompensas.sort((a, b) => b.fecha - a.fecha);
        todasLasRecompensas = todasLasRecompensas.slice(0, 30);

        if (todasLasRecompensas.length === 0) {
            container.innerHTML = `
                <div class="empty-historial">
                    <i class="bi bi-inbox"></i>
                    <p>No hay recompensas recientes</p>
                </div>
            `;
            return;
        }

        let html = '';
        todasLasRecompensas.forEach(item => {
            const fecha = item.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
            const esDescuento = item.puntos < 0;
            const iconClass = esDescuento ? 'bi-dash-circle' : 'bi-coin';
            const colorClass = esDescuento ? 'descuento' : 'recompensa';
            const signo = esDescuento ? '' : '+';
            
            html += `
                <div class="recompensa-item ${colorClass}">
                    <div class="recompensa-icon ${colorClass}">
                        <i class="bi ${iconClass}"></i>
                    </div>
                    <div class="recompensa-info">
                        <div class="estudiante-nombre">${item.estudianteNombre}</div>
                        <div class="recompensa-motivo">${item.descripcion}</div>
                        <div class="recompensa-fecha">${fecha}</div>
                    </div>
                    <div class="recompensa-monedas ${colorClass}">
                        <i class="bi bi-coin"></i>
                        ${signo}${item.puntos}
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('Error cargando historial de recompensas:', error);
        container.innerHTML = `
            <div class="empty-historial">
                <i class="bi bi-exclamation-circle"></i>
                <p>Error al cargar historial</p>
            </div>
        `;
    }
}

// Inicializar eventos de la pestaña de recompensas
function initRecompensasEvents() {
    const filtroTipoUsuario = document.getElementById('filtroTipoUsuarioRecompensa');
    const filtroInstitucion = document.getElementById('filtroInstitucionRecompensa');
    const buscarInput = document.getElementById('buscarEstudianteRecompensa');

    if (filtroTipoUsuario) {
        filtroTipoUsuario.removeEventListener('change', renderizarListaEstudiantes);
        filtroTipoUsuario.addEventListener('change', renderizarListaEstudiantes);
    }

    if (filtroInstitucion) {
        filtroInstitucion.removeEventListener('change', renderizarListaEstudiantes);
        filtroInstitucion.addEventListener('change', renderizarListaEstudiantes);
    }

    if (buscarInput) {
        buscarInput.removeEventListener('input', renderizarListaEstudiantes);
        buscarInput.addEventListener('input', renderizarListaEstudiantes);
    }
}

// Exponer funciones globalmente
window.loadRecompensasTab = loadRecompensasTab;
window.loadRecompensasHistorial = loadRecompensasHistorial;

// Limpiar historial de recompensas de todos los estudiantes
async function limpiarHistorialRecompensas() {
    // Mostrar modal de confirmación
    document.getElementById('modalConfirmarLimpiarHistorial').classList.add('active');
}

// Ejecutar limpieza del historial
async function ejecutarLimpiezaHistorial() {
    // Cerrar modal
    document.getElementById('modalConfirmarLimpiarHistorial').classList.remove('active');

    const container = document.getElementById('recompensasHistorialList');
    if (container) {
        container.innerHTML = '<div class="loading-historial"><i class="bi bi-arrow-clockwise spin"></i> Limpiando historial...</div>';
    }

    try {
        const db = getDB();
        
        // Obtener todos los estudiantes
        const estudiantesSnapshot = await db.collection('usuarios')
            .where('tipoUsuario', '==', 'estudiante')
            .get();

        // Crear batch para actualizar múltiples documentos
        const batch = db.batch();
        let count = 0;

        estudiantesSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.historialRecompensas && data.historialRecompensas.length > 0) {
                batch.update(doc.ref, { historialRecompensas: [] });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            showNotification('success', '¡Historial Limpiado!', `Se limpió el historial de ${count} estudiante(s)`);
        } else {
            showNotification('info', 'Sin cambios', 'No había historial que limpiar');
        }

        // Recargar historial
        await loadRecompensasHistorial();

    } catch (error) {
        console.error('Error limpiando historial:', error);
        showNotification('error', 'Error', 'No se pudo limpiar el historial');
        await loadRecompensasHistorial();
    }
}

// Cerrar modal de confirmación
function cerrarModalConfirmarLimpiar() {
    document.getElementById('modalConfirmarLimpiarHistorial').classList.remove('active');
}

// Inicializar evento del botón limpiar historial
function initLimpiarHistorialEvent() {
    const btnLimpiar = document.getElementById('btnLimpiarHistorialRecompensas');
    if (btnLimpiar) {
        btnLimpiar.addEventListener('click', limpiarHistorialRecompensas);
    }

    // Eventos del modal de confirmación
    const btnConfirmar = document.getElementById('confirmarLimpiarHistorial');
    const btnCancelar = document.getElementById('cancelarLimpiarHistorial');
    const btnCerrar = document.getElementById('closeModalConfirmarLimpiar');

    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', ejecutarLimpiezaHistorial);
    }
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cerrarModalConfirmarLimpiar);
    }
    if (btnCerrar) {
        btnCerrar.addEventListener('click', cerrarModalConfirmarLimpiar);
    }
}

window.limpiarHistorialRecompensas = limpiarHistorialRecompensas;
