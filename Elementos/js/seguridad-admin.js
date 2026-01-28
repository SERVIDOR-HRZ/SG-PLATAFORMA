// Seguridad Admin JavaScript - Versión Profesional
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    loadUserInfo();
    setupEventListeners();
    setupTabNavigation();
    updateDateTime();
    loadDownloadsData();
    setInterval(updateDateTime, 1000);
});

// Variables globales
let allDownloads = [];
let filteredDownloads = [];
let currentPage = 1;
const itemsPerPage = 10;
const SUSPICIOUS_IP_THRESHOLD = 3; // Más de 3 IPs diferentes = sospechoso (reducir falsos positivos)
const SUSPICIOUS_DOWNLOADS_THRESHOLD = 15; // Más de 15 descargas = sospechoso
const MAX_SUSPICIOUS_PER_MONTH = 1; // Máximo 1 usuario sospechoso por mes

// Actualizar fecha y hora
function updateDateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    document.getElementById('currentTime').textContent = timeStr;
    document.getElementById('currentDate').textContent = dateStr;
    
    // Actualizar icono según hora
    const hour = now.getHours();
    const icon = document.getElementById('timeIcon');
    if (hour >= 6 && hour < 12) {
        icon.className = 'bi bi-sunrise-fill';
    } else if (hour >= 12 && hour < 18) {
        icon.className = 'bi bi-sun-fill';
    } else if (hour >= 18 && hour < 21) {
        icon.className = 'bi bi-sunset-fill';
    } else {
        icon.className = 'bi bi-moon-stars-fill';
    }
}

// Setup navegación de tabs
function setupTabNavigation() {
    const tabs = document.querySelectorAll('.menu-tab');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Remover active de todos
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Activar el seleccionado
            tab.classList.add('active');
            document.getElementById(`${targetTab}-content`).classList.add('active');
        });
    });
}

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
    // Sidebar buttons
    document.getElementById('btnBack').addEventListener('click', () => {
        window.history.back();
    });
    
    document.getElementById('btnHome').addEventListener('click', () => {
        window.location.href = '../index.html';
    });
    
    document.getElementById('btnProfile').addEventListener('click', () => {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
        if (currentUser.tipoUsuario === 'coordinador') {
            window.location.href = 'Perfil-Coordinador.html';
        }
    });
    
    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '../index.html';
    });
    
    // Mobile menu
    const mobileToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebarPanel');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });
        
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            mobileToggle.classList.remove('active');
        });
    }

    // Filtros y búsqueda
    document.getElementById('filterStatus').addEventListener('change', applyFilters);
    document.getElementById('filterDate').addEventListener('change', applyFilters);
    document.getElementById('searchInput').addEventListener('input', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    
    // Botones de acción
    document.getElementById('refreshBtn').addEventListener('click', loadDownloadsData);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('clearAllBtn').addEventListener('click', limpiarTodoElHistorial);
    
    // Paginación
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('filterStatus').value = 'todos';
    document.getElementById('filterDate').value = 'todos';
    document.getElementById('searchInput').value = '';
    applyFilters();
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
    
    // Contar descargas por usuario y contar IPs diferentes por usuario
    const descargasPorUsuario = {};
    const ipsPorUsuario = {};
    const sosPorUsuario = {};
    
    allDownloads.forEach(d => {
        descargasPorUsuario[d.usuarioId] = (descargasPorUsuario[d.usuarioId] || 0) + 1;
        
        // Guardar IPs únicas por usuario
        if (!ipsPorUsuario[d.usuarioId]) {
            ipsPorUsuario[d.usuarioId] = new Set();
        }
        ipsPorUsuario[d.usuarioId].add(d.ip);
        
        // Detectar SO sospechoso
        if (d.sistemaOperativo && d.sistemaOperativo.toLowerCase().includes('linux')) {
            sosPorUsuario[d.usuarioId] = true;
        }
    });
    
    // Contar usuarios sospechosos con criterios más estrictos
    let usuariosSospechosos = 0;
    Object.keys(ipsPorUsuario).forEach(usuarioId => {
        const cantidadIPs = ipsPorUsuario[usuarioId].size;
        const cantidadDescargas = descargasPorUsuario[usuarioId];
        const soSospechoso = sosPorUsuario[usuarioId];
        
        if ((cantidadIPs > SUSPICIOUS_IP_THRESHOLD && cantidadDescargas > SUSPICIOUS_DOWNLOADS_THRESHOLD) || soSospechoso) {
            usuariosSospechosos++;
        }
    });
    
    // Limitar a 1 sospechoso por mes
    usuariosSospechosos = Math.min(usuariosSospechosos, MAX_SUSPICIOUS_PER_MONTH);
    
    const usuariosActivos = Object.keys(descargasPorUsuario).length;
    
    // Descargas de hoy
    const hoy = new Date().toDateString();
    const descargasHoy = allDownloads.filter(d => new Date(d.fecha).toDateString() === hoy).length;
    
    // Actualizar UI
    document.getElementById('totalDescargas').textContent = totalDescargas;
    document.getElementById('usuariosSospechosos').textContent = usuariosSospechosos;
    document.getElementById('usuariosActivos').textContent = usuariosActivos;
    document.getElementById('descargasHoy').textContent = descargasHoy;
    document.getElementById('badgeSospechosos').textContent = usuariosSospechosos;
    
    // Actualizar resumen general
    actualizarResumenGeneral();
    actualizarEstadisticasSO();
}

// Mostrar usuarios sospechosos
function mostrarUsuariosSospechosos() {
    const descargasPorUsuario = {};
    const ipsPorUsuario = {};
    const sosPorUsuario = {};
    
    allDownloads.forEach(d => {
        if (!descargasPorUsuario[d.usuarioId]) {
            descargasPorUsuario[d.usuarioId] = {
                nombre: d.usuarioNombre,
                email: d.usuarioEmail,
                foto: d.usuarioFoto || '',
                count: 0,
                ultimaDescarga: d.fecha,
                ips: new Set(),
                sistemaOperativo: d.sistemaOperativo || 'Desconocido'
            };
        }
        descargasPorUsuario[d.usuarioId].count++;
        descargasPorUsuario[d.usuarioId].ips.add(d.ip);
        
        // Actualizar foto si existe en algún registro
        if (d.usuarioFoto && !descargasPorUsuario[d.usuarioId].foto) {
            descargasPorUsuario[d.usuarioId].foto = d.usuarioFoto;
        }
        
        // Detectar SO sospechoso (Linux)
        if (d.sistemaOperativo && d.sistemaOperativo.toLowerCase().includes('linux')) {
            sosPorUsuario[d.usuarioId] = true;
        }
    });

    // Verificar cuántos usuarios sospechosos hay este mes
    const ahora = new Date();
    const mesActual = ahora.getMonth();
    const añoActual = ahora.getFullYear();
    
    const sospechososEsteMes = JSON.parse(localStorage.getItem('sospechosos_mes') || '[]');
    const sospechososMesActual = sospechososEsteMes.filter(s => {
        const fecha = new Date(s.fecha);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
    });

    // Filtrar usuarios sospechosos con criterios más estrictos
    const sospechosos = Object.entries(descargasPorUsuario)
        .filter(([id, data]) => {
            // Criterios para ser sospechoso:
            // 1. Más de 3 IPs diferentes Y más de 15 descargas
            // 2. O sistema operativo Linux
            const multipleIPs = data.ips.size > SUSPICIOUS_IP_THRESHOLD && data.count > SUSPICIOUS_DOWNLOADS_THRESHOLD;
            const soSospechoso = sosPorUsuario[id];
            
            return multipleIPs || soSospechoso;
        })
        .map(([id, data]) => {
            const ipsArray = Array.from(data.ips);
            return { 
                id, 
                ...data,
                cantidadIPs: data.ips.size,
                listaIPs: ipsArray.join(', '),
                razon: sosPorUsuario[id] ? 'Sistema operativo no permitido (Linux)' : 'Múltiples IPs y descargas excesivas'
            };
        })
        .slice(0, MAX_SUSPICIOUS_PER_MONTH); // Limitar a 1 por mes

    const suspiciousGrid = document.getElementById('suspiciousGrid');

    if (sospechosos.length > 0) {
        suspiciousGrid.innerHTML = sospechosos.map(user => {
            const avatarContent = user.foto 
                ? `<img src="${user.foto}" alt="${user.nombre}">`
                : user.nombre.charAt(0).toUpperCase();
            return `
            <div class="suspicious-card">
                <div class="suspicious-card-header">
                    <div class="suspicious-avatar">${avatarContent}</div>
                    <div class="suspicious-info">
                        <h3>${user.nombre}</h3>
                        <p>${user.email || 'Sin email'}</p>
                    </div>
                </div>
                <div class="suspicious-card-body">
                    <div class="suspicious-stats">
                        <div class="suspicious-stat">
                            <div class="suspicious-stat-value">${user.count}</div>
                            <div class="suspicious-stat-label">Descargas</div>
                        </div>
                        <div class="suspicious-stat">
                            <div class="suspicious-stat-value">${user.cantidadIPs}</div>
                            <div class="suspicious-stat-label">IPs Diferentes</div>
                        </div>
                    </div>
                    <div class="suspicious-reason">
                        <strong><i class="bi bi-exclamation-triangle-fill"></i> Razón:</strong>
                        <p>${user.razon}</p>
                    </div>
                    <small style="color: rgba(255, 255, 255, 0.6); font-size: 0.8rem; display: block;">
                        SO: ${user.sistemaOperativo} | IPs: ${user.listaIPs}
                    </small>
                </div>
                <div class="suspicious-card-footer">
                    <button class="btn-view-user" onclick="verDetalleUsuario('${user.id}')">
                        <i class="bi bi-eye-fill"></i> Ver Detalle
                    </button>
                    <button class="btn-disable-user" onclick="toggleUsuarioEstado('${user.id}', '${user.nombre.replace(/'/g, "\\'")}', false)" title="Desactivar usuario">
                        <i class="bi bi-x-circle-fill"></i>
                    </button>
                </div>
            </div>
        `}).join('');
    } else {
        suspiciousGrid.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-shield-check"></i>
                <h3>No hay usuarios sospechosos</h3>
                <p>El sistema no ha detectado actividad sospechosa este mes</p>
            </div>
        `;
    }
}

// Actualizar resumen general
function actualizarResumenGeneral() {
    const activityList = document.getElementById('activityList');
    const ultimasDescargas = allDownloads.slice(0, 5);
    
    if (ultimasDescargas.length === 0) {
        activityList.innerHTML = `
            <div class="activity-item">
                <i class="bi bi-info-circle"></i>
                <span>No hay actividad reciente</span>
            </div>
        `;
        return;
    }
    
    activityList.innerHTML = ultimasDescargas.map(d => {
        const fecha = new Date(d.fecha);
        const tiempoTranscurrido = calcularTiempoTranscurrido(fecha);
        return `
            <div class="activity-item">
                <i class="bi bi-download"></i>
                <span><strong>${d.usuarioNombre}</strong> descargó <em>${d.documento}</em> - ${tiempoTranscurrido}</span>
            </div>
        `;
    }).join('');
}

// Calcular tiempo transcurrido
function calcularTiempoTranscurrido(fecha) {
    const ahora = new Date();
    const diff = ahora - fecha;
    const minutos = Math.floor(diff / 60000);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);
    
    if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
    return 'hace un momento';
}

// Actualizar estadísticas de SO
function actualizarEstadisticasSO() {
    let windowsCount = 0;
    let macCount = 0;
    let linuxCount = 0;
    
    allDownloads.forEach(d => {
        const so = (d.sistemaOperativo || '').toLowerCase();
        if (so.includes('windows')) {
            windowsCount++;
        } else if (so.includes('mac')) {
            macCount++;
        } else if (so.includes('linux')) {
            linuxCount++;
        }
    });
    
    document.getElementById('windowsCount').textContent = windowsCount;
    document.getElementById('macCount').textContent = macCount;
    document.getElementById('linuxCount').textContent = linuxCount;
}

// Aplicar filtros
function applyFilters() {
    const statusFilter = document.getElementById('filterStatus').value;
    const dateFilter = document.getElementById('filterDate').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // Contar IPs diferentes por usuario
    const ipsPorUsuario = {};
    allDownloads.forEach(d => {
        if (!ipsPorUsuario[d.usuarioId]) {
            ipsPorUsuario[d.usuarioId] = new Set();
        }
        ipsPorUsuario[d.usuarioId].add(d.ip);
    });

    filteredDownloads = allDownloads.filter(download => {
        // Filtro de estado - verificar si el usuario tiene más de 1 IP diferente
        const cantidadIPs = ipsPorUsuario[download.usuarioId]?.size || 0;
        const isSuspicious = cantidadIPs > SUSPICIOUS_IP_THRESHOLD;
        
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
                download.aula,
                download.ip
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

    // Contar descargas por usuario y contar IPs diferentes
    const descargasPorUsuario = {};
    const ipsPorUsuario = {};
    const sosPorUsuario = {};
    
    allDownloads.forEach(d => {
        descargasPorUsuario[d.usuarioId] = (descargasPorUsuario[d.usuarioId] || 0) + 1;
        
        if (!ipsPorUsuario[d.usuarioId]) {
            ipsPorUsuario[d.usuarioId] = new Set();
        }
        ipsPorUsuario[d.usuarioId].add(d.ip);
        
        // Detectar SO sospechoso
        if (d.sistemaOperativo && d.sistemaOperativo.toLowerCase().includes('linux')) {
            sosPorUsuario[d.usuarioId] = true;
        }
    });

    // Cargar fotos y estado de usuarios
    const usuariosIds = [...new Set(pageData.map(d => d.usuarioId))];
    const fotosUsuarios = await cargarFotosUsuarios(usuariosIds);
    const estadoUsuarios = await cargarEstadoUsuarios(usuariosIds);

    tbody.innerHTML = pageData.map(download => {
        const userDownloads = descargasPorUsuario[download.usuarioId];
        const cantidadIPs = ipsPorUsuario[download.usuarioId]?.size || 0;
        const soSospechoso = sosPorUsuario[download.usuarioId];
        
        // Criterios más estrictos para marcar como sospechoso
        const isSuspicious = (cantidadIPs > SUSPICIOUS_IP_THRESHOLD && userDownloads > SUSPICIOUS_DOWNLOADS_THRESHOLD) || soSospechoso;
        
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
            ? `<div class="user-cell-avatar"><img src="${fotoUsuario}" alt="${download.usuarioNombre}"></div>`
            : `<div class="user-cell-avatar">${download.usuarioNombre.charAt(0).toUpperCase()}</div>`;
        
        // Detectar SO y asignar color
        const sistemaOperativo = download.sistemaOperativo || 'Desconocido';
        let soClass = 'so-normal';
        let soIcon = 'bi-laptop';
        
        if (sistemaOperativo.toLowerCase().includes('windows')) {
            soClass = 'so-windows';
            soIcon = 'bi-windows';
        } else if (sistemaOperativo.toLowerCase().includes('mac')) {
            soClass = 'so-mac';
            soIcon = 'bi-apple';
        } else if (sistemaOperativo.toLowerCase().includes('linux')) {
            soClass = 'so-linux';
            soIcon = 'bi-exclamation-triangle-fill';
        }
        
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
                    <span class="aula-nombre">${download.aula || 'Sin aula'}</span>
                </td>
                <td>
                    <div class="fecha-cell">
                        <span class="fecha-dia">${fechaStr}</span>
                        <span class="fecha-hora">${horaStr}</span>
                    </div>
                </td>
                <td>
                    <div class="so-cell ${soClass}">
                        <i class="bi ${soIcon}"></i>
                        <span>${sistemaOperativo}</span>
                    </div>
                </td>
                <td><code>${download.ip}</code></td>
                <td>
                    <span class="downloads-count ${isSuspicious ? 'high' : ''}">
                        ${isSuspicious ? '<i class="bi bi-exclamation-triangle-fill"></i>' : ''}
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
                            <i class="bi bi-${isInactive ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                        </button>
                        <button class="action-btn clear-btn" onclick="limpiarHistorialUsuario('${download.usuarioId}', '${download.usuarioNombre.replace(/'/g, "\\'")}')" title="Limpiar historial de descargas">
                            <i class="bi bi-trash-fill"></i>
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
window.verDetalleUsuario = async function(usuarioId) {
    const userDownloads = allDownloads.filter(d => d.usuarioId === usuarioId);
    if (userDownloads.length === 0) {
        mostrarNotificacion('No se encontraron descargas para este usuario', 'error');
        return;
    }

    const user = userDownloads[0];
    
    // Contar IPs diferentes
    const ipsUnicas = new Set(userDownloads.map(d => d.ip));
    const cantidadIPs = ipsUnicas.size;
    
    // Detectar SO sospechoso
    const soSospechoso = userDownloads.some(d => 
        d.sistemaOperativo && d.sistemaOperativo.toLowerCase().includes('linux')
    );
    
    const isSuspicious = (cantidadIPs > SUSPICIOUS_IP_THRESHOLD && userDownloads.length > SUSPICIOUS_DOWNLOADS_THRESHOLD) || soSospechoso;

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
window.closeUserModal = function() {
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
window.toggleUsuarioEstado = function(usuarioId, usuarioNombre, estaInactivo) {
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
window.confirmarToggleUsuario = async function(usuarioId, activar) {
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
window.limpiarHistorialUsuario = function(usuarioId, usuarioNombre) {
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
window.confirmarLimpiarHistorial = async function(usuarioId) {
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
window.closeConfirmModal = function() {
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

// Limpiar todo el historial de descargas
window.limpiarTodoElHistorial = function() {
    const modal = document.getElementById('confirmModal');
    const body = document.getElementById('confirmBody');
    
    const totalRegistros = allDownloads.length;
    
    body.innerHTML = `
        <div class="confirm-content">
            <div class="confirm-icon delete">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </div>
            <h3>⚠️ ¿Limpiar TODO el historial?</h3>
            <p>Estás a punto de eliminar <strong>TODOS los ${totalRegistros} registros</strong> de descargas del sistema.</p>
            <p style="color: #ff0000; font-size: 0.9rem; margin-top: 1rem; font-weight: 600;">
                <i class="bi bi-exclamation-octagon"></i> Esta acción es IRREVERSIBLE y eliminará permanentemente todo el historial de descargas de todos los usuarios.
            </p>
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(255, 0, 0, 0.1); border-radius: 8px; border-left: 4px solid #ff0000;">
                <p style="margin: 0; font-size: 0.85rem; color: #333;">
                    <strong>Nota:</strong> Esta acción solo debe realizarse si estás completamente seguro. Se recomienda exportar los datos antes de eliminarlos.
                </p>
            </div>
            <div class="confirm-actions" style="margin-top: 1.5rem;">
                <button class="btn-cancel" onclick="closeConfirmModal()">Cancelar</button>
                <button class="btn-confirm delete" onclick="confirmarLimpiarTodoElHistorial()">
                    <i class="bi bi-trash3"></i> Sí, Eliminar Todo
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

// Confirmar limpiar todo el historial
window.confirmarLimpiarTodoElHistorial = async function() {
    try {
        await esperarFirebase();
        const db = window.firebaseDB;
        
        // Mostrar mensaje de procesamiento
        const body = document.getElementById('confirmBody');
        body.innerHTML = `
            <div class="confirm-content">
                <div class="confirm-icon" style="background: #2196F3;">
                    <i class="bi bi-hourglass-split"></i>
                </div>
                <h3>Eliminando registros...</h3>
                <p>Por favor espera mientras se eliminan todos los registros.</p>
                <div style="margin-top: 1rem;">
                    <div style="width: 100%; height: 4px; background: #e0e0e0; border-radius: 2px; overflow: hidden;">
                        <div style="width: 100%; height: 100%; background: #2196F3; animation: progress 2s ease-in-out infinite;"></div>
                    </div>
                </div>
            </div>
        `;
        
        // Obtener todos los registros
        const snapshot = await db.collection('registroDescargas').get();
        
        if (snapshot.empty) {
            closeConfirmModal();
            mostrarNotificacion('No hay registros para eliminar', 'error');
            return;
        }
        
        // Eliminar en lotes de 500 (límite de Firestore)
        const batchSize = 500;
        const totalDocs = snapshot.docs.length;
        let deletedCount = 0;
        
        for (let i = 0; i < totalDocs; i += batchSize) {
            const batch = db.batch();
            const batchDocs = snapshot.docs.slice(i, i + batchSize);
            
            batchDocs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            deletedCount += batchDocs.length;
        }
        
        closeConfirmModal();
        mostrarNotificacion(`Se eliminaron ${deletedCount} registro(s) correctamente`, 'success');
        loadDownloadsData();
        
    } catch (error) {
        console.error('Error al limpiar historial completo:', error);
        closeConfirmModal();
        mostrarNotificacion('Error al limpiar el historial completo', 'error');
    }
}
