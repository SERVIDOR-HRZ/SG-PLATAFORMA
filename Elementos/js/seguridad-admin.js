// Seguridad Admin JavaScript
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserInfo();
    setupEventListeners();
    loadDownloadsData();
});

// Variables globales
let allDownloads = [];
let filteredDownloads = [];
let currentPage = 1;
const itemsPerPage = 10;
const SUSPICIOUS_THRESHOLD = 3; // Más de 3 descargas = sospechoso

// Verificar autenticación
function checkAuthentication() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (!currentUser.id || (currentUser.tipoUsuario !== 'admin' && currentUser.tipoUsuario !== 'coordinador')) {
        window.location.href = '../index.html';
        return;
    }
}

// Cargar info del usuario
async function loadUserInfo() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    if (currentUser.nombre) {
        document.getElementById('userName').textContent = currentUser.nombre.toUpperCase();
    }
    await cargarFotoPerfil(currentUser.id);
}

// Cargar foto de perfil
async function cargarFotoPerfil(usuarioId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioId).get();
        if (usuarioDoc.exists) {
            const datos = usuarioDoc.data();
            if (datos.fotoPerfil) {
                document.getElementById('userAvatarDefault').style.display = 'none';
                const img = document.getElementById('userAvatarImage');
                img.src = datos.fotoPerfil;
                img.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Error cargando foto:', error);
    }
}

// Esperar Firebase
function esperarFirebase() {
    return new Promise(resolve => {
        const check = () => {
            if (window.firebaseDB) resolve();
            else setTimeout(check, 100);
        };
        check();
    });
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('backBtn').addEventListener('click', () => {
        window.history.back();
    });

    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    document.getElementById('filterDate').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('refreshBtn').addEventListener('click', loadDownloadsData);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
}

// Cargar datos de descargas
async function loadDownloadsData() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        // Cargar desde Firebase
        const snapshot = await db.collection('registroDescargas').orderBy('fecha', 'desc').get();
        
        allDownloads = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        calcularEstadisticas();
        applyFilters();
        mostrarUsuariosSospechosos();
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        allDownloads = [];
        calcularEstadisticas();
        applyFilters();
        mostrarUsuariosSospechosos();
    }
}

// Calcular estadísticas
function calcularEstadisticas() {
    const totalDescargas = allDownloads.length;
    
    // Contar descargas por usuario
    const descargasPorUsuario = {};
    allDownloads.forEach(d => {
        descargasPorUsuario[d.usuarioId] = (descargasPorUsuario[d.usuarioId] || 0) + 1;
    });
    
    const usuariosSospechosos = Object.values(descargasPorUsuario).filter(c => c > SUSPICIOUS_THRESHOLD).length;
    const usuariosActivos = Object.keys(descargasPorUsuario).length;
    
    // Descargas de hoy
    const hoy = new Date().toDateString();
    const descargasHoy = allDownloads.filter(d => new Date(d.fecha).toDateString() === hoy).length;
    
    document.getElementById('totalDescargas').textContent = totalDescargas;
    document.getElementById('usuariosSospechosos').textContent = usuariosSospechosos;
    document.getElementById('usuariosActivos').textContent = usuariosActivos;
    document.getElementById('descargasHoy').textContent = descargasHoy;
}

// Mostrar usuarios sospechosos
function mostrarUsuariosSospechosos() {
    const descargasPorUsuario = {};
    allDownloads.forEach(d => {
        if (!descargasPorUsuario[d.usuarioId]) {
            descargasPorUsuario[d.usuarioId] = {
                nombre: d.usuarioNombre,
                email: d.usuarioEmail,
                foto: d.usuarioFoto || '',
                count: 0,
                ultimaDescarga: d.fecha
            };
        }
        descargasPorUsuario[d.usuarioId].count++;
        // Actualizar foto si existe en algún registro
        if (d.usuarioFoto && !descargasPorUsuario[d.usuarioId].foto) {
            descargasPorUsuario[d.usuarioId].foto = d.usuarioFoto;
        }
    });

    const sospechosos = Object.entries(descargasPorUsuario)
        .filter(([_, data]) => data.count > SUSPICIOUS_THRESHOLD)
        .map(([id, data]) => ({ id, ...data }));

    const alertSection = document.getElementById('alertSection');
    const alertList = document.getElementById('alertList');

    if (sospechosos.length > 0) {
        alertSection.style.display = 'block';
        alertList.innerHTML = sospechosos.map(user => {
            const avatarContent = user.foto 
                ? `<img src="${user.foto}" alt="${user.nombre}">`
                : user.nombre.charAt(0).toUpperCase();
            return `
            <div class="alert-item">
                <div class="alert-item-info">
                    <div class="alert-avatar">${avatarContent}</div>
                    <div class="alert-details">
                        <h4>${user.nombre}</h4>
                        <p>${user.count} descargas detectadas - ${user.email || 'Sin email'}</p>
                    </div>
                </div>
                <button class="alert-action" onclick="verDetalleUsuario('${user.id}')">
                    <i class="bi bi-eye"></i> Ver Detalle
                </button>
            </div>
        `}).join('');
    } else {
        alertSection.style.display = 'none';
    }
}

// Aplicar filtros
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const dateFilter = document.getElementById('filterDate').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // Contar descargas por usuario
    const descargasPorUsuario = {};
    allDownloads.forEach(d => {
        descargasPorUsuario[d.usuarioId] = (descargasPorUsuario[d.usuarioId] || 0) + 1;
    });

    filteredDownloads = allDownloads.filter(download => {
        // Filtro de estado
        const isSuspicious = descargasPorUsuario[download.usuarioId] > SUSPICIOUS_THRESHOLD;
        if (statusFilter === 'sospechoso' && !isSuspicious) return false;
        if (statusFilter === 'normal' && isSuspicious) return false;

        // Filtro de fecha
        const downloadDate = new Date(download.fecha);
        const now = new Date();
        if (dateFilter === 'hoy') {
            if (downloadDate.toDateString() !== now.toDateString()) return false;
        } else if (dateFilter === 'semana') {
            const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            if (downloadDate < weekAgo) return false;
        } else if (dateFilter === 'mes') {
            const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
            if (downloadDate < monthAgo) return false;
        }

        // Filtro de búsqueda
        if (searchTerm) {
            const searchFields = [
                download.usuarioNombre,
                download.usuarioEmail,
                download.documento,
                download.aula
            ].join(' ').toLowerCase();
            if (!searchFields.includes(searchTerm)) return false;
        }

        return true;
    });

    currentPage = 1;
    renderTable();
}

// Renderizar tabla
async function renderTable() {
    const tbody = document.getElementById('downloadsTableBody');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageData = filteredDownloads.slice(start, end);

    // Contar descargas por usuario
    const descargasPorUsuario = {};
    allDownloads.forEach(d => {
        descargasPorUsuario[d.usuarioId] = (descargasPorUsuario[d.usuarioId] || 0) + 1;
    });

    // Cargar fotos y estado de usuarios
    const usuariosIds = [...new Set(pageData.map(d => d.usuarioId))];
    const fotosUsuarios = await cargarFotosUsuarios(usuariosIds);
    const estadoUsuarios = await cargarEstadoUsuarios(usuariosIds);

    tbody.innerHTML = pageData.map(download => {
        const userDownloads = descargasPorUsuario[download.usuarioId];
        const isSuspicious = userDownloads > SUSPICIOUS_THRESHOLD;
        const isInactive = estadoUsuarios[download.usuarioId] === false;
        const fecha = new Date(download.fecha);
        const fechaStr = fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
        const horaStr = fecha.toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        const deviceIcon = download.tipoDispositivo === 'mobile' ? 'bi-phone' : 
                          download.tipoDispositivo === 'tablet' ? 'bi-tablet' : 'bi-laptop';

        const fotoUsuario = fotosUsuarios[download.usuarioId];
        const avatarHTML = fotoUsuario 
            ? `<img src="${fotoUsuario}" alt="${download.usuarioNombre}" class="user-cell-avatar-img">`
            : `<div class="user-cell-avatar">${download.usuarioNombre.charAt(0).toUpperCase()}</div>`;
        
        return `
            <tr class="${isInactive ? 'user-inactive' : ''}">
                <td>
                    <div class="user-cell">
                        ${avatarHTML}
                        <div class="user-cell-info">
                            <span class="user-cell-name">${download.usuarioNombre}</span>
                            <span class="user-cell-email">${download.usuarioEmail || 'Sin email'}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="documento-cell">
                        <i class="bi bi-file-earmark-pdf"></i>
                        <span class="documento-nombre" title="${download.documento}">${download.documento}</span>
                    </div>
                </td>
                <td>
                    <span class="aula-nombre">${download.aula || 'Sin aula'}</span>
                </td>
                <td>
                    <span class="materia-text">${download.materia || 'N/A'}</span>
                </td>
                <td>
                    <div class="fecha-cell">
                        <span class="fecha-dia">${fechaStr}</span>
                        <span class="fecha-hora">${horaStr}</span>
                    </div>
                </td>
                <td>
                    <div class="device-cell">
                        <i class="bi ${deviceIcon}"></i>
                        <span>${download.dispositivo}</span>
                    </div>
                </td>
                <td><code>${download.ip}</code></td>
                <td>
                    <span class="downloads-count ${isSuspicious ? 'high' : ''}">
                        ${isSuspicious ? '<i class="bi bi-exclamation-triangle"></i>' : ''}
                        ${userDownloads}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${isInactive ? 'inactivo' : (isSuspicious ? 'sospechoso' : 'normal')}">
                        ${isInactive ? 'Inactivo' : (isSuspicious ? 'Sospechoso' : 'Normal')}
                    </span>
                </td>
                <td>
                    <div class="actions-cell">
                        <button class="action-btn ${isInactive ? 'activate-btn' : 'disable-btn'}" onclick="toggleUsuarioEstado('${download.usuarioId}', '${download.usuarioNombre.replace(/'/g, "\\'")}', ${isInactive})" title="${isInactive ? 'Activar usuario' : 'Desactivar usuario'}">
                            <i class="bi bi-${isInactive ? 'person-check' : 'person-slash'}"></i>
                        </button>
                        <button class="action-btn clear-btn" onclick="limpiarHistorialUsuario('${download.usuarioId}', '${download.usuarioNombre.replace(/'/g, "\\'")}')" title="Limpiar historial de descargas">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    // Actualizar paginación
    const totalPages = Math.ceil(filteredDownloads.length / itemsPerPage);
    document.getElementById('paginationInfo').textContent = 
        `Mostrando ${start + 1}-${Math.min(end, filteredDownloads.length)} de ${filteredDownloads.length}`;
    document.getElementById('currentPage').textContent = currentPage;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
}

// Cargar fotos de usuarios desde Firebase
async function cargarFotosUsuarios(usuariosIds) {
    const fotos = {};
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        // Primero intentar obtener fotos de los registros de descarga
        filteredDownloads.forEach(d => {
            if (d.usuarioFoto && d.usuarioId) {
                fotos[d.usuarioId] = d.usuarioFoto;
            }
        });
        
        // Para los que no tienen foto en el registro, buscar en usuarios
        for (const id of usuariosIds) {
            if (!id || fotos[id]) continue;
            try {
                const doc = await db.collection('usuarios').doc(id).get();
                if (doc.exists && doc.data().fotoPerfil) {
                    fotos[id] = doc.data().fotoPerfil;
                }
            } catch (e) {
                console.log('No se pudo cargar foto para:', id);
            }
        }
    } catch (error) {
        console.error('Error cargando fotos:', error);
    }
    return fotos;
}

// Cargar estado de usuarios desde Firebase
async function cargarEstadoUsuarios(usuariosIds) {
    const estados = {};
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        for (const id of usuariosIds) {
            if (!id) continue;
            try {
                const doc = await db.collection('usuarios').doc(id).get();
                if (doc.exists) {
                    estados[id] = doc.data().activo;
                }
            } catch (e) {
                console.log('No se pudo cargar estado para:', id);
            }
        }
    } catch (error) {
        console.error('Error cargando estados:', error);
    }
    return estados;
}

// Cambiar página
function changePage(direction) {
    const totalPages = Math.ceil(filteredDownloads.length / itemsPerPage);
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    renderTable();
}

// Ver detalle de usuario
async function verDetalleUsuario(usuarioId) {
    const userDownloads = allDownloads.filter(d => d.usuarioId === usuarioId);
    if (userDownloads.length === 0) return;

    const user = userDownloads[0];
    const isSuspicious = userDownloads.length > SUSPICIOUS_THRESHOLD;

    // Obtener foto del usuario
    let userFoto = user.usuarioFoto || '';
    if (!userFoto) {
        try {
            await esperarFirebase();
            const db = window.firebaseDB;
            const userDoc = await db.collection('usuarios').doc(usuarioId).get();
            if (userDoc.exists && userDoc.data().fotoPerfil) {
                userFoto = userDoc.data().fotoPerfil;
            }
        } catch (e) {
            console.log('No se pudo cargar foto del usuario');
        }
    }

    const avatarHTML = userFoto 
        ? `<img src="${userFoto}" alt="${user.usuarioNombre}">`
        : user.usuarioNombre.charAt(0).toUpperCase();

    const modal = document.getElementById('userDetailModal');
    const body = document.getElementById('userDetailBody');

    body.innerHTML = `
        <div class="user-detail-header">
            <div class="user-detail-avatar">${avatarHTML}</div>
            <div class="user-detail-info">
                <h2>${user.usuarioNombre}</h2>
                <p>${user.usuarioEmail || 'Sin email'}</p>
                <span class="status-badge ${isSuspicious ? 'sospechoso' : 'normal'}">
                    ${isSuspicious ? 'Usuario Sospechoso' : 'Usuario Normal'}
                </span>
            </div>
        </div>

        <div class="detail-section">
            <h4><i class="bi bi-bar-chart"></i> Estadísticas</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Total Descargas</label>
                    <span>${userDownloads.length}</span>
                </div>
                <div class="detail-item">
                    <label>Última Descarga</label>
                    <span>${new Date(userDownloads[0].fecha).toLocaleString('es-ES')}</span>
                </div>
                <div class="detail-item">
                    <label>Dispositivo más usado</label>
                    <span>${getMostUsedDevice(userDownloads)}</span>
                </div>
                <div class="detail-item">
                    <label>IP más frecuente</label>
                    <span>${getMostUsedIP(userDownloads)}</span>
                </div>
            </div>
        </div>

        <div class="detail-section">
            <h4><i class="bi bi-clock-history"></i> Historial de Descargas</h4>
            <div class="downloads-history">
                ${userDownloads.slice(0, 10).map(d => `
                    <div class="download-item">
                        <div class="download-item-info">
                            <span class="download-item-name">${d.documento}</span>
                            <span class="download-item-date">${new Date(d.fecha).toLocaleString('es-ES')} - ${d.aula}${d.materia ? ' • ' + d.materia : ''}</span>
                        </div>
                        <span><i class="bi bi-${d.tipoDispositivo === 'mobile' ? 'phone' : 'laptop'}"></i></span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;

    modal.classList.add('active');
}

// Obtener dispositivo más usado
function getMostUsedDevice(downloads) {
    const devices = {};
    downloads.forEach(d => {
        devices[d.dispositivo] = (devices[d.dispositivo] || 0) + 1;
    });
    return Object.entries(devices).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
}

// Obtener IP más usada
function getMostUsedIP(downloads) {
    const ips = {};
    downloads.forEach(d => {
        ips[d.ip] = (ips[d.ip] || 0) + 1;
    });
    return Object.entries(ips).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
}

// Cerrar modal
function closeUserModal() {
    document.getElementById('userDetailModal').classList.remove('active');
}

// Exportar a CSV
function exportToCSV() {
    const headers = ['Usuario', 'Email', 'Documento', 'Aula', 'Fecha', 'Hora', 'Dispositivo', 'IP', 'Estado'];
    
    const descargasPorUsuario = {};
    allDownloads.forEach(d => {
        descargasPorUsuario[d.usuarioId] = (descargasPorUsuario[d.usuarioId] || 0) + 1;
    });

    const rows = filteredDownloads.map(d => {
        const fecha = new Date(d.fecha);
        const isSuspicious = descargasPorUsuario[d.usuarioId] > SUSPICIOUS_THRESHOLD;
        return [
            d.usuarioNombre,
            d.usuarioEmail,
            d.documento,
            d.aula,
            fecha.toLocaleDateString('es-ES'),
            fecha.toLocaleTimeString('es-ES'),
            d.dispositivo,
            d.ip,
            isSuspicious ? 'Sospechoso' : 'Normal'
        ];
    });

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `registro_descargas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', function(e) {
    const modal = document.getElementById('userDetailModal');
    if (e.target === modal) {
        closeUserModal();
    }
});

// Cerrar con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeUserModal();
        closeConfirmModal();
    }
});

// Deshabilitar usuario
function deshabilitarUsuario(usuarioId, usuarioNombre) {
    const modal = document.getElementById('confirmModal');
    const body = document.getElementById('confirmBody');
    
    body.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-icon">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h3>¿Deshabilitar usuario?</h3>
            <p>Estás a punto de deshabilitar a <strong>${usuarioNombre}</strong>. El usuario no podrá acceder al sistema hasta que sea habilitado nuevamente.</p>
            <div class="confirm-actions">
                <button class="btn-cancel" onclick="closeConfirmModal()">Cancelar</button>
                <button class="btn-confirm" onclick="confirmarDeshabilitarUsuario('${usuarioId}')">
                    <i class="bi bi-person-slash"></i> Deshabilitar
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Toggle estado de usuario (activar/desactivar)
function toggleUsuarioEstado(usuarioId, usuarioNombre, estaInactivo) {
    const modal = document.getElementById('confirmModal');
    const body = document.getElementById('confirmBody');
    
    if (estaInactivo) {
        // Activar usuario
        body.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-icon activate">
                    <i class="bi bi-person-check-fill"></i>
                </div>
                <h3>¿Activar usuario?</h3>
                <p>Estás a punto de activar a <strong>${usuarioNombre}</strong>. El usuario podrá acceder nuevamente al sistema.</p>
                <div class="confirm-actions">
                    <button class="btn-cancel" onclick="closeConfirmModal()">Cancelar</button>
                    <button class="btn-confirm activate" onclick="confirmarToggleUsuario('${usuarioId}', true)">
                        <i class="bi bi-person-check"></i> Activar
                    </button>
                </div>
            </div>
        `;
    } else {
        // Desactivar usuario
        body.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-icon">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                </div>
                <h3>¿Desactivar usuario?</h3>
                <p>Estás a punto de desactivar a <strong>${usuarioNombre}</strong>. El usuario no podrá acceder al sistema hasta que sea activado nuevamente.</p>
                <div class="confirm-actions">
                    <button class="btn-cancel" onclick="closeConfirmModal()">Cancelar</button>
                    <button class="btn-confirm" onclick="confirmarToggleUsuario('${usuarioId}', false)">
                        <i class="bi bi-person-slash"></i> Desactivar
                    </button>
                </div>
            </div>
        `;
    }
    
    modal.classList.add('active');
}

// Confirmar toggle de estado
async function confirmarToggleUsuario(usuarioId, activar) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        await db.collection('usuarios').doc(usuarioId).update({
            activo: activar,
            fechaUltimaActualizacion: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeConfirmModal();
        mostrarNotificacion(activar ? 'Usuario activado correctamente' : 'Usuario desactivado correctamente', 'success');
        loadDownloadsData();
        
    } catch (error) {
        console.error('Error al cambiar estado del usuario:', error);
        mostrarNotificacion('Error al cambiar estado del usuario', 'error');
    }
}

// Limpiar historial de descargas de un usuario
function limpiarHistorialUsuario(usuarioId, usuarioNombre) {
    const modal = document.getElementById('confirmModal');
    const body = document.getElementById('confirmBody');
    
    // Contar descargas del usuario
    const descargasUsuario = allDownloads.filter(d => d.usuarioId === usuarioId).length;
    
    body.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-icon delete">
                <i class="bi bi-trash-fill"></i>
            </div>
            <h3>¿Limpiar historial?</h3>
            <p>Estás a punto de eliminar <strong>${descargasUsuario} registro(s)</strong> de descargas de <strong>${usuarioNombre}</strong>.</p>
            <p style="color: #ff0000; font-size: 0.85rem; margin-top: 0.5rem;"><i class="bi bi-exclamation-circle"></i> Esta acción no se puede deshacer.</p>
            <div class="confirm-actions">
                <button class="btn-cancel" onclick="closeConfirmModal()">Cancelar</button>
                <button class="btn-confirm delete" onclick="confirmarLimpiarHistorial('${usuarioId}')">
                    <i class="bi bi-trash"></i> Eliminar Historial
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Confirmar limpiar historial
async function confirmarLimpiarHistorial(usuarioId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        // Obtener todos los registros del usuario
        const snapshot = await db.collection('registroDescargas')
            .where('usuarioId', '==', usuarioId)
            .get();
        
        // Eliminar cada registro
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        closeConfirmModal();
        mostrarNotificacion(`Se eliminaron ${snapshot.docs.length} registro(s) de descargas`, 'success');
        loadDownloadsData();
        
    } catch (error) {
        console.error('Error al limpiar historial:', error);
        mostrarNotificacion('Error al limpiar historial', 'error');
    }
}

// Confirmar deshabilitar usuario
async function confirmarDeshabilitarUsuario(usuarioId) {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        await db.collection('usuarios').doc(usuarioId).update({
            activo: false,
            fechaUltimaActualizacion: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeConfirmModal();
        mostrarNotificacion('Usuario deshabilitado correctamente', 'success');
        loadDownloadsData();
        
    } catch (error) {
        console.error('Error al deshabilitar usuario:', error);
        mostrarNotificacion('Error al deshabilitar usuario', 'error');
    }
}

// Cerrar modal de confirmación
function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

// Mostrar notificación
function mostrarNotificacion(mensaje, tipo) {
    const notif = document.createElement('div');
    notif.className = `notificacion ${tipo}`;
    notif.innerHTML = `
        <i class="bi bi-${tipo === 'success' ? 'check-circle' : 'x-circle'}"></i>
        <span>${mensaje}</span>
    `;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}
