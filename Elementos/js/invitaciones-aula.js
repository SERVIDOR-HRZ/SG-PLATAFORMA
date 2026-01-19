// Invitation Link Management for Classrooms
let currentInvitationAulaId = null;
let currentQRCode = null;

// Generate unique invitation code
function generateInvitationCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Open invitation link modal
async function openInvitationLinkModal(aulaId, aulaNombre) {
    const modal = document.getElementById('invitationLinkModal');
    const invitationAulaName = document.getElementById('invitationAulaName');
    const invitationLinkText = document.getElementById('invitationLinkText');
    const invitationStatus = document.getElementById('invitationStatus');
    const toggleInvitationBtn = document.getElementById('toggleInvitationBtn');
    const toggleInvitationText = document.getElementById('toggleInvitationText');
    const qrCodeContainer = document.getElementById('invitationQRCode');

    currentInvitationAulaId = aulaId;
    invitationAulaName.textContent = aulaNombre;

    try {
        // Get or create invitation code
        const aulaDoc = await window.firebaseDB.collection('aulas').doc(aulaId).get();
        const aulaData = aulaDoc.data();

        let codigoInvitacion = aulaData.codigoInvitacion;
        let invitacionActiva = aulaData.invitacionActiva !== false; // Default true

        // If no invitation code exists, create one
        if (!codigoInvitacion) {
            codigoInvitacion = generateInvitationCode();
            await window.firebaseDB.collection('aulas').doc(aulaId).update({
                codigoInvitacion: codigoInvitacion,
                invitacionActiva: true
            });
            invitacionActiva = true;
        }

        // Generate invitation link
        const baseUrl = 'https://seamosgenios.org';
        const invitationLink = `${baseUrl}/Secciones/registro-aula.html?aula=${aulaId}&codigo=${codigoInvitacion}`;
        invitationLinkText.textContent = invitationLink;

        // Update status
        if (invitacionActiva) {
            invitationStatus.className = 'invitation-status active';
            invitationStatus.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Enlace Activo</span>';
            toggleInvitationBtn.className = 'toggle-invitation-btn active';
            toggleInvitationBtn.innerHTML = '<i class="bi bi-toggle-on"></i><span id="toggleInvitationText">Desactivar Enlace</span>';
        } else {
            invitationStatus.className = 'invitation-status inactive';
            invitationStatus.innerHTML = '<i class="bi bi-x-circle-fill"></i><span>Enlace Inactivo</span>';
            toggleInvitationBtn.className = 'toggle-invitation-btn';
            toggleInvitationBtn.innerHTML = '<i class="bi bi-toggle-off"></i><span id="toggleInvitationText">Activar Enlace</span>';
        }

        // Generate QR Code
        qrCodeContainer.innerHTML = '';
        currentQRCode = new QRCode(qrCodeContainer, {
            text: invitationLink,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        modal.style.display = 'flex';
    } catch (error) {
        console.error('Error opening invitation modal:', error);
        showMessage('Error al generar el enlace de invitación', 'error');
    }
}

// Close invitation link modal
function closeInvitationLinkModal() {
    const modal = document.getElementById('invitationLinkModal');
    modal.style.display = 'none';
    currentInvitationAulaId = null;
    currentQRCode = null;
}

// Copy invitation link to clipboard
async function copyInvitationLink() {
    const invitationLinkText = document.getElementById('invitationLinkText');
    const copyBtn = document.getElementById('copyInvitationLinkBtn');
    const link = invitationLinkText.textContent;

    try {
        await navigator.clipboard.writeText(link);
        
        // Update button
        copyBtn.classList.add('copied');
        copyBtn.innerHTML = '<i class="bi bi-check-circle-fill"></i>Copiado';
        
        showMessage('Enlace copiado al portapapeles', 'success');

        setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.innerHTML = '<i class="bi bi-clipboard"></i>Copiar';
        }, 2000);
    } catch (error) {
        console.error('Error copying link:', error);
        showMessage('Error al copiar el enlace', 'error');
    }
}

// Toggle invitation link active/inactive
async function toggleInvitationLink() {
    if (!currentInvitationAulaId) return;

    try {
        const aulaDoc = await window.firebaseDB.collection('aulas').doc(currentInvitationAulaId).get();
        const aulaData = aulaDoc.data();
        const currentStatus = aulaData.invitacionActiva !== false;
        const newStatus = !currentStatus;

        await window.firebaseDB.collection('aulas').doc(currentInvitationAulaId).update({
            invitacionActiva: newStatus
        });

        const invitationStatus = document.getElementById('invitationStatus');
        const toggleInvitationBtn = document.getElementById('toggleInvitationBtn');

        if (newStatus) {
            invitationStatus.className = 'invitation-status active';
            invitationStatus.innerHTML = '<i class="bi bi-check-circle-fill"></i><span>Enlace Activo</span>';
            toggleInvitationBtn.className = 'toggle-invitation-btn active';
            toggleInvitationBtn.innerHTML = '<i class="bi bi-toggle-on"></i><span>Desactivar Enlace</span>';
            showMessage('Enlace de invitación activado', 'success');
        } else {
            invitationStatus.className = 'invitation-status inactive';
            invitationStatus.innerHTML = '<i class="bi bi-x-circle-fill"></i><span>Enlace Inactivo</span>';
            toggleInvitationBtn.className = 'toggle-invitation-btn';
            toggleInvitationBtn.innerHTML = '<i class="bi bi-toggle-off"></i><span>Activar Enlace</span>';
            showMessage('Enlace de invitación desactivado', 'success');
        }
    } catch (error) {
        console.error('Error toggling invitation:', error);
        showMessage('Error al cambiar el estado del enlace', 'error');
    }
}

// Download QR code
function downloadQRCode() {
    if (!currentQRCode) return;

    try {
        const qrCodeContainer = document.getElementById('invitationQRCode');
        const canvas = qrCodeContainer.querySelector('canvas');
        
        if (!canvas) {
            showMessage('Error: No se pudo encontrar el código QR', 'error');
            return;
        }

        // Create download link
        const link = document.createElement('a');
        link.download = `qr-invitacion-aula-${currentInvitationAulaId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        showMessage('Código QR descargado', 'success');
    } catch (error) {
        console.error('Error downloading QR:', error);
        showMessage('Error al descargar el código QR', 'error');
    }
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Close modal button
    const closeInvitationBtn = document.getElementById('closeInvitationLinkModal');
    if (closeInvitationBtn) {
        closeInvitationBtn.addEventListener('click', closeInvitationLinkModal);
    }

    // Copy link button
    const copyLinkBtn = document.getElementById('copyInvitationLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', copyInvitationLink);
    }

    // Toggle invitation button
    const toggleBtn = document.getElementById('toggleInvitationBtn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleInvitationLink);
    }

    // Download QR button
    const downloadQRBtn = document.getElementById('downloadQRBtn');
    if (downloadQRBtn) {
        downloadQRBtn.addEventListener('click', downloadQRCode);
    }

    // Close modal on outside click
    const modal = document.getElementById('invitationLinkModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeInvitationLinkModal();
            }
        });
    }
});

// Export functions for use in usuarios.js
window.openInvitationLinkModal = openInvitationLinkModal;
window.closeInvitationLinkModal = closeInvitationLinkModal;
