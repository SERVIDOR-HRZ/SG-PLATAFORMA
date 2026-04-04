// Invitation Link Management — múltiples links por aula via subcolección
// Estructura Firebase: aulas/{aulaId}/links/{linkId}
// Campos: codigo, linkGratis, linkExpiracion (null=indefinido), activo, creadoEn

let currentInvitationAulaId = null;
let currentQRCode = null;
let currentLinkId = null; // ID del último link generado (para descarga QR)

function generateInvitationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

function getExpiracionMs() {
    const valor = parseInt(document.getElementById('expiracionValor').value) || 24;
    const unidad = document.getElementById('expiracionUnidad').value;
    if (unidad === 'indefinido') return null;
    const map = { minutos: 60 * 1000, horas: 60 * 60 * 1000, dias: 24 * 60 * 60 * 1000 };
    return valor * (map[unidad] || map.horas);
}

function formatExpiracion(timestamp) {
    if (!timestamp) return 'Indefinido';
    const exp = timestamp.toMillis ? timestamp.toMillis() : new Date(timestamp).getTime();
    const diff = exp - Date.now();
    if (diff <= 0) return 'Expirado';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) return `Expira en ${Math.floor(h / 24)}d ${h % 24}h`;
    if (h > 0) return `Expira en ${h}h ${m}m`;
    return `Expira en ${m}m`;
}

function buildLink(aulaId, codigo) {
    return `${window.location.origin}/Secciones/registro-aula.html?aula=${aulaId}&codigo=${codigo}`;
}

// ── Abrir modal ──────────────────────────────────────────────────────────────
async function openInvitationLinkModal(aulaId, aulaNombre) {
    const modal = document.getElementById('invitationLinkModal');
    currentInvitationAulaId = aulaId;
    currentLinkId = null;
    currentQRCode = null;

    document.getElementById('invitationAulaName').textContent = aulaNombre;
    document.getElementById('invitationLinkBox').style.display = 'none';
    document.getElementById('invitationLinkText').textContent = '';
    document.getElementById('hiddenQRContainer').innerHTML = '';
    document.getElementById('expiracionInfoActual').style.display = 'none';
    document.getElementById('linksActivosList').innerHTML = '';

    // Reset tipo a "pago" por defecto
    document.querySelector('input[name="tipoEnlace"][value="pago"]').checked = true;
    document.getElementById('expiracionConfig').style.display = 'none';

    modal.style.display = 'flex';

    // Cargar links activos existentes
    await loadLinksActivos(aulaId);
}

// ── Cargar lista de links activos ────────────────────────────────────────────
async function loadLinksActivos(aulaId) {
    const container = document.getElementById('linksActivosList');
    container.innerHTML = '<p style="color:#888;font-size:0.85rem;">Cargando links...</p>';

    try {
        const snap = await window.firebaseDB
            .collection('aulas').doc(aulaId)
            .collection('links')
            .where('activo', '==', true)
            .get();

        const now = Date.now();
        const validos = [];
        const expirados = [];

        snap.forEach(doc => {
            const d = doc.data();
            const expMs = d.linkExpiracion ? (d.linkExpiracion.toMillis ? d.linkExpiracion.toMillis() : new Date(d.linkExpiracion).getTime()) : null;
            if (expMs && expMs < now) {
                expirados.push(doc.id);
            } else {
                validos.push({ id: doc.id, ...d, expMs });
            }
        });

        // Desactivar expirados en Firebase silenciosamente
        expirados.forEach(id => {
            window.firebaseDB.collection('aulas').doc(aulaId).collection('links').doc(id).update({ activo: false });
        });

        if (validos.length === 0) {
            container.innerHTML = '<p style="color:#aaa;font-size:0.82rem;text-align:center;">No hay links activos</p>';
            return;
        }

        container.innerHTML = '';
        validos.forEach(link => {
            const row = document.createElement('div');
            row.className = 'link-activo-row';
            const expText = link.expMs ? formatExpiracion(link.linkExpiracion) : 'Indefinido';
            const tipo = link.linkGratis ? '<span class="link-badge gratis">Gratis</span>' : '<span class="link-badge pago">Con Pago</span>';
            const url = buildLink(aulaId, link.codigo);
            row.innerHTML = `
                <div class="link-activo-info">
                    ${tipo}
                    <span class="link-activo-exp"><i class="bi bi-clock"></i> ${expText}</span>
                    <span class="link-activo-codigo" title="${url}">${link.codigo}</span>
                </div>
                <div class="link-activo-actions">
                    <button class="btn-copy-link-row" title="Copiar" onclick="copyLinkRow('${url}')"><i class="bi bi-clipboard"></i></button>
                    <button class="btn-dl-qr-row" title="Descargar QR" onclick="downloadQRRow('${url}', '${link.id}')"><i class="bi bi-qr-code"></i></button>
                    <button class="btn-del-link-row" title="Eliminar" onclick="deleteLinkRow('${aulaId}', '${link.id}')"><i class="bi bi-trash"></i></button>
                </div>`;
            container.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading links:', error);
        container.innerHTML = '<p style="color:#e74c3c;font-size:0.82rem;">Error al cargar links</p>';
    }
}

// ── Acciones de fila ─────────────────────────────────────────────────────────
async function copyLinkRow(url) {
    try {
        await navigator.clipboard.writeText(url);
        showMessage('Enlace copiado', 'success');
    } catch { showMessage('Error al copiar', 'error'); }
}

function downloadQRRow(url, linkId) {
    const tmp = document.createElement('div');
    tmp.style.display = 'none';
    document.body.appendChild(tmp);
    const qr = new QRCode(tmp, { text: url, width: 200, height: 200, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });
    setTimeout(() => {
        const canvas = tmp.querySelector('canvas');
        if (canvas) {
            const a = document.createElement('a');
            a.download = `qr-link-${linkId}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        }
        document.body.removeChild(tmp);
        showMessage('QR descargado', 'success');
    }, 300);
}

async function deleteLinkRow(aulaId, linkId) {
    try {
        await window.firebaseDB.collection('aulas').doc(aulaId).collection('links').doc(linkId).update({ activo: false });
        showMessage('Link eliminado', 'success');
        await loadLinksActivos(aulaId);
    } catch { showMessage('Error al eliminar', 'error'); }
}

// ── Generar nuevo link ───────────────────────────────────────────────────────
async function generateNewLink() {
    if (!currentInvitationAulaId) return;

    const esGratis = document.querySelector('input[name="tipoEnlace"]:checked').value === 'gratis';
    const expMs = esGratis ? getExpiracionMs() : null;
    const codigo = generateInvitationCode();

    const linkData = {
        codigo,
        linkGratis: esGratis,
        linkExpiracion: expMs ? new Date(Date.now() + expMs) : null,
        activo: true,
        creadoEn: new Date()
    };

    try {
        const ref = await window.firebaseDB
            .collection('aulas').doc(currentInvitationAulaId)
            .collection('links').add(linkData);

        currentLinkId = ref.id;
        const url = buildLink(currentInvitationAulaId, codigo);

        // Mostrar el link generado
        document.getElementById('invitationLinkText').textContent = url;
        document.getElementById('invitationLinkBox').style.display = 'block';

        // QR oculto para descarga
        const hiddenQR = document.getElementById('hiddenQRContainer');
        hiddenQR.innerHTML = '';
        currentQRCode = new QRCode(hiddenQR, { text: url, width: 200, height: 200, colorDark: '#000', colorLight: '#fff', correctLevel: QRCode.CorrectLevel.H });

        // Info expiración
        const infoEl = document.getElementById('expiracionInfoActual');
        const textoEl = document.getElementById('expiracionTextoActual');
        if (esGratis) {
            infoEl.style.display = 'block';
            textoEl.textContent = expMs ? formatExpiracion({ toMillis: () => Date.now() + expMs }) : 'Sin expiración (indefinido)';
        } else {
            infoEl.style.display = 'none';
        }

        showMessage('Enlace generado correctamente', 'success');
        await loadLinksActivos(currentInvitationAulaId);
    } catch (error) {
        console.error('Error generating link:', error);
        showMessage('Error al generar el enlace', 'error');
    }
}

// ── Copiar link actual ───────────────────────────────────────────────────────
async function copyInvitationLink() {
    const link = document.getElementById('invitationLinkText').textContent;
    if (!link) return;
    const copyBtn = document.getElementById('copyInvitationLinkBtn');
    try {
        await navigator.clipboard.writeText(link);
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i>Copiado';
        showMessage('Enlace copiado', 'success');
        setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.innerHTML = '<i class="bi bi-clipboard"></i>Copiar'; }, 2000);
    } catch { showMessage('Error al copiar', 'error'); }
}

// ── Descargar QR del link actual ─────────────────────────────────────────────
function downloadQRCode() {
    if (!currentQRCode) { showMessage('Primero genera un enlace', 'error'); return; }
    const canvas = document.getElementById('hiddenQRContainer').querySelector('canvas');
    if (!canvas) { showMessage('Genera el enlace primero', 'error'); return; }
    const a = document.createElement('a');
    a.download = `qr-${currentLinkId || 'link'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showMessage('QR descargado', 'success');
}

// ── Cerrar modal ─────────────────────────────────────────────────────────────
function closeInvitationLinkModal() {
    document.getElementById('invitationLinkModal').style.display = 'none';
    document.getElementById('invitationLinkBox').style.display = 'none';
    document.getElementById('hiddenQRContainer').innerHTML = '';
    currentInvitationAulaId = null;
    currentQRCode = null;
    currentLinkId = null;
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const closeBtn = document.getElementById('closeInvitationLinkModal');
    if (closeBtn) closeBtn.addEventListener('click', closeInvitationLinkModal);

    const copyBtn = document.getElementById('copyInvitationLinkBtn');
    if (copyBtn) copyBtn.addEventListener('click', copyInvitationLink);

    const downloadBtn = document.getElementById('downloadQRBtn');
    if (downloadBtn) downloadBtn.addEventListener('click', downloadQRCode);

    const generateBtn = document.getElementById('generateLinkBtn');
    if (generateBtn) generateBtn.addEventListener('click', generateNewLink);

    document.querySelectorAll('input[name="tipoEnlace"]').forEach(radio => {
        radio.addEventListener('change', function () {
            document.getElementById('expiracionConfig').style.display = this.value === 'gratis' ? 'block' : 'none';
        });
    });

    const expUnidad = document.getElementById('expiracionUnidad');
    const expValor = document.getElementById('expiracionValor');
    if (expUnidad && expValor) {
        expUnidad.addEventListener('change', function () {
            expValor.style.display = this.value === 'indefinido' ? 'none' : 'inline-block';
        });
    }

    const modal = document.getElementById('invitationLinkModal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeInvitationLinkModal(); });
});

window.openInvitationLinkModal = openInvitationLinkModal;
window.closeInvitationLinkModal = closeInvitationLinkModal;
window.copyLinkRow = copyLinkRow;
window.downloadQRRow = downloadQRRow;
window.deleteLinkRow = deleteLinkRow;
