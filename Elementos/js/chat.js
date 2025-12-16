// Chat JavaScript
document.addEventListener('DOMContentLoaded', async function () {
    // Check authentication
    await checkAuthentication();

    // Load user info
    loadUserInfo();

    // Initialize page
    initializePage();

    // Load contacts
    loadContacts();

    // Initialize profile
    if (typeof inicializarPerfilCompartido === 'function') {
        inicializarPerfilCompartido();
    }
});

let currentUser = null;
let allUsers = [];
let allContacts = [];
let currentChat = null;
let messagesListener = null;
let currentFilter = 'todos';

// ImgBB API Configuration
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// DOM Elements
const elements = {
    contactsList: document.getElementById('contactsList'),
    searchContactsInput: document.getElementById('searchContactsInput'),
    backBtn: document.getElementById('backBtn'),

    // Chat Area
    chatArea: document.getElementById('chatArea'),
    activeChat: document.getElementById('activeChat'),
    messagesContainer: document.getElementById('messagesContainer'),
    messageForm: document.getElementById('messageForm'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    chatContactName: document.getElementById('chatContactName'),
    chatContactRole: document.getElementById('chatContactRole'),
    chatContactAvatar: document.getElementById('chatContactAvatar'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    attachBtn: document.getElementById('attachBtn'),
    imageInput: document.getElementById('imageInput'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),
    previewImage: document.getElementById('previewImage'),
    removeImageBtn: document.getElementById('removeImageBtn'),
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),

    messageContainer: document.getElementById('messageContainer')
};

// Variable para almacenar la imagen seleccionada
let selectedImageFile = null;

// Check authentication
async function checkAuthentication() {
    currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');

    if (!currentUser.id) {
        window.location.href = '../index.html';
        return;
    }

    // Actualizar datos del usuario desde Firebase para obtener la foto de perfil
    try {
        await waitForFirebase();
        const db = window.firebaseDB;
        const userDoc = await db.collection('usuarios').doc(currentUser.id).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            currentUser.fotoPerfil = userData.fotoPerfil || null;
            currentUser.nombre = userData.nombre || currentUser.nombre;
            currentUser.tipoUsuario = userData.tipoUsuario || currentUser.tipoUsuario;

            // Actualizar sessionStorage con los datos actualizados
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load user info
function loadUserInfo() {
    if (currentUser.nombre) {
        document.getElementById('userName').textContent = currentUser.nombre.toUpperCase();
    }
}

// Initialize page
function initializePage() {
    // Back button - Siempre vuelve al panel
    elements.backBtn.addEventListener('click', () => {
        const userType = currentUser.tipoUsuario;
        if (userType === 'admin') {
            window.location.href = 'Panel_Admin.html';
        } else {
            window.location.href = 'Panel_Estudiantes.html';
        }
    });

    // El logout del dropdown se maneja en perfil-compartido.js

    // Search contacts
    elements.searchContactsInput.addEventListener('input', handleSearchContacts);

    // Message form
    elements.messageForm.addEventListener('submit', handleSendMessage);

    // Auto-resize textarea
    elements.messageInput.addEventListener('input', autoResizeTextarea);

    // Handle Enter key for sending messages
    elements.messageInput.addEventListener('keydown', handleMessageKeydown);

    // Clear chat button
    elements.clearChatBtn.addEventListener('click', handleClearChat);

    // Filter buttons para contactos
    const filterContactBtns = document.querySelectorAll('.filter-contact-btn');
    filterContactBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            filterContactBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            renderContacts();
        });
    });

    // Attach image button
    elements.attachBtn.addEventListener('click', () => {
        elements.imageInput.click();
    });

    // Image input change
    elements.imageInput.addEventListener('change', handleImageSelection);

    // Remove image button
    elements.removeImageBtn.addEventListener('click', removeSelectedImage);

    // Paste image functionality
    elements.messageInput.addEventListener('paste', handlePasteImage);

    // Mobile menu button
    elements.mobileMenuBtn.addEventListener('click', toggleSidebarMobile);

    // Sidebar overlay (cerrar al hacer clic fuera)
    elements.sidebarOverlay.addEventListener('click', closeSidebarMobile);
}

// Wait for Firebase
function waitForFirebase() {
    return new Promise((resolve) => {
        const checkFirebase = () => {
            if (window.firebaseDB) {
                resolve();
            } else {
                setTimeout(checkFirebase, 100);
            }
        };
        checkFirebase();
    });
}

// Load contacts - Cargar todos los usuarios
async function loadContacts() {
    try {
        await waitForFirebase();
        const db = window.firebaseDB;

        // Cargar todos los usuarios excepto el usuario actual
        const usersSnapshot = await db.collection('usuarios')
            .where(firebase.firestore.FieldPath.documentId(), '!=', currentUser.id)
            .get();

        allUsers = [];
        usersSnapshot.forEach(doc => {
            allUsers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Obtener conversaciones existentes para mostrar últimos mensajes
        const conversationsRef = db.collection('conversaciones')
            .where('participantes', 'array-contains', currentUser.id);

        conversationsRef.onSnapshot(async (snapshot) => {
            const conversationsMap = {};

            for (const doc of snapshot.docs) {
                const conversation = { id: doc.id, ...doc.data() };
                const otherUserId = conversation.participantes.find(id => id !== currentUser.id);

                if (otherUserId) {
                    conversationsMap[otherUserId] = {
                        conversationId: conversation.id,
                        lastMessage: conversation.ultimoMensaje || '',
                        lastMessageTime: conversation.ultimoMensajeFecha,
                        unreadCount: conversation.noLeidos?.[currentUser.id] || 0
                    };
                }
            }

            // Crear lista de contactos con todos los usuarios
            allContacts = allUsers.map(user => ({
                conversationId: conversationsMap[user.id]?.conversationId || null,
                userId: user.id,
                nombre: user.nombre,
                email: user.usuario || user.email,
                tipoUsuario: user.tipoUsuario,
                fotoPerfil: user.fotoPerfil,
                lastMessage: conversationsMap[user.id]?.lastMessage || '',
                lastMessageTime: conversationsMap[user.id]?.lastMessageTime || null,
                unreadCount: conversationsMap[user.id]?.unreadCount || 0
            }));

            // Ordenar: primero los que tienen mensajes, luego por nombre
            allContacts.sort((a, b) => {
                // Si ambos tienen mensajes, ordenar por fecha
                if (a.lastMessageTime && b.lastMessageTime) {
                    return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
                }
                // Si solo uno tiene mensajes, ese va primero
                if (a.lastMessageTime) return -1;
                if (b.lastMessageTime) return 1;
                // Si ninguno tiene mensajes, ordenar por nombre
                return a.nombre.localeCompare(b.nombre);
            });

            renderContacts();
        });

    } catch (error) {
        console.error('Error loading contacts:', error);
        showMessage('Error al cargar contactos', 'error');
    }
}

// Render contacts
function renderContacts() {
    const contactsList = elements.contactsList;

    // Aplicar filtro
    let filteredContacts = allContacts;
    if (currentFilter !== 'todos') {
        filteredContacts = allContacts.filter(contact => contact.tipoUsuario === currentFilter);
    }

    // Aplicar búsqueda si hay texto
    const searchTerm = elements.searchContactsInput.value.toLowerCase().trim();
    if (searchTerm) {
        filteredContacts = filteredContacts.filter(contact =>
            contact.nombre.toLowerCase().includes(searchTerm) ||
            contact.email.toLowerCase().includes(searchTerm)
        );
    }

    if (filteredContacts.length === 0) {
        contactsList.innerHTML = `
            <div class="loading-contacts">
                <i class="bi bi-person-x"></i>
                <p>No se encontraron contactos</p>
            </div>
        `;
        return;
    }

    contactsList.innerHTML = '';

    filteredContacts.forEach(contact => {
        const contactItem = document.createElement('div');
        contactItem.className = 'contact-item';
        if (currentChat && currentChat.userId === contact.userId) {
            contactItem.classList.add('active');
        }

        const timeString = contact.lastMessageTime ?
            formatTime(contact.lastMessageTime.toDate()) : '';

        const roleBadge = contact.tipoUsuario === 'admin' ?
            '<span class="contact-type-badge admin">Profesor</span>' :
            '<span class="contact-type-badge estudiante">Estudiante</span>';

        contactItem.innerHTML = `
            <div class="contact-item-avatar">
                ${contact.fotoPerfil ?
                `<img src="${contact.fotoPerfil}" alt="${contact.nombre}">` :
                `<i class="bi bi-person-fill"></i>`
            }
            </div>
            <div class="contact-item-info">
                <div class="contact-item-header">
                    <span class="contact-item-name">${contact.nombre}</span>
                    <span class="contact-item-time">${timeString}</span>
                </div>
                <div class="contact-item-preview">
                    ${roleBadge}
                    <span class="preview-text">${contact.lastMessage || 'Iniciar conversación'}</span>
                </div>
            </div>
            ${contact.unreadCount > 0 ?
                `<span class="contact-item-badge">${contact.unreadCount}</span>` :
                ''
            }
        `;

        contactItem.addEventListener('click', () => startChatWithUser(contact));
        contactsList.appendChild(contactItem);
    });
}

// Handle search contacts
function handleSearchContacts() {
    renderContacts();
}

// Open chat
async function openChat(contact) {
    try {
        currentChat = contact;

        // Update UI
        document.querySelector('.no-chat-selected').style.display = 'none';
        elements.activeChat.style.display = 'flex';

        // Update chat header
        elements.chatContactName.textContent = contact.nombre;
        elements.chatContactRole.textContent = contact.tipoUsuario === 'admin' ? 'Profesor' : 'Estudiante';

        if (contact.fotoPerfil) {
            elements.chatContactAvatar.innerHTML = `<img src="${contact.fotoPerfil}" alt="${contact.nombre}">`;
        } else {
            elements.chatContactAvatar.innerHTML = '<i class="bi bi-person-fill"></i>';
        }

        // Clear messages
        elements.messagesContainer.innerHTML = '';

        // Load messages
        loadMessages(contact.conversationId);

        // Mark as read
        await markAsRead(contact.conversationId);

        // Update contacts list
        renderContacts();

        // Ocultar sidebar en móviles
        hideSidebarOnMobile();

    } catch (error) {
        console.error('Error opening chat:', error);
        showMessage('Error al abrir el chat', 'error');
    }
}

// Hide sidebar on mobile devices
function hideSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('contactsSidebar');
        const overlay = elements.sidebarOverlay;
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Show sidebar on mobile devices
function showSidebarOnMobile() {
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('contactsSidebar');
        const overlay = elements.sidebarOverlay;
        const btnIcon = elements.mobileMenuBtn.querySelector('i');

        sidebar.classList.add('mobile-open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Rotar flecha hacia la izquierda
        if (btnIcon) {
            btnIcon.style.transform = 'rotate(180deg)';
        }
    }
}

// Toggle sidebar visibility
function toggleSidebarMobile() {
    const sidebar = document.getElementById('contactsSidebar');
    const overlay = elements.sidebarOverlay;
    const btn = elements.mobileMenuBtn;

    if (sidebar.classList.contains('mobile-open')) {
        closeSidebarMobile();
    } else {
        showSidebarOnMobile();
    }
}

// Close sidebar mobile
function closeSidebarMobile() {
    const sidebar = document.getElementById('contactsSidebar');
    const overlay = elements.sidebarOverlay;
    const btnIcon = elements.mobileMenuBtn.querySelector('i');

    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';

    // Rotar flecha hacia la derecha
    if (btnIcon) {
        btnIcon.style.transform = 'rotate(0deg)';
    }
}

// Load messages
function loadMessages(conversationId) {
    // Remove previous listener
    if (messagesListener) {
        messagesListener();
    }

    const db = window.firebaseDB;
    const messagesRef = db.collection('conversaciones')
        .doc(conversationId)
        .collection('mensajes')
        .orderBy('fecha', 'asc');

    messagesListener = messagesRef.onSnapshot((snapshot) => {
        elements.messagesContainer.innerHTML = '';

        snapshot.forEach((doc) => {
            const message = doc.data();
            renderMessage(message);
        });

        // Scroll to bottom
        scrollToBottom();
    });
}

// Render message
function renderMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.remitenteId === currentUser.id ? 'sent' : 'received'}`;

    const timeString = message.fecha ? formatTime(message.fecha.toDate()) : '';

    // Crear contenido del mensaje
    let messageContent = '';

    // Si el mensaje tiene una imagen
    if (message.imagen) {
        messageContent = `
            <div class="message-bubble message-image-bubble">
                <img src="${message.imagen}" alt="Imagen enviada" class="message-image" onclick="showImageModal('${message.imagen}')">
                ${message.texto ? `<div class="message-text-with-image">${formatWhatsAppText(message.texto)}</div>` : ''}
            </div>
        `;
    } else {
        // Mensaje de solo texto
        messageContent = `<div class="message-bubble">${formatWhatsAppText(message.texto)}</div>`;
    }

    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${message.remitenteAvatar ?
            `<img src="${message.remitenteAvatar}" alt="${message.remitenteNombre}">` :
            `<i class="bi bi-person-fill"></i>`
        }
        </div>
        <div class="message-content">
            ${messageContent}
            <div class="message-time">${timeString}</div>
        </div>
    `;

    elements.messagesContainer.appendChild(messageDiv);
}

// Handle send message
async function handleSendMessage(e) {
    e.preventDefault();

    const messageText = elements.messageInput.value.trim();

    // Validar que hay al menos texto o imagen
    if (!messageText && !selectedImageFile) return;

    if (!currentChat) return;

    try {
        elements.sendBtn.disabled = true;
        elements.attachBtn.disabled = true;

        await waitForFirebase();
        const db = window.firebaseDB;

        let imageUrl = null;

        // Si hay una imagen seleccionada, subirla primero
        if (selectedImageFile) {
            imageUrl = await uploadImageToImgBB(selectedImageFile);
        }

        // Create message
        const message = {
            texto: messageText || '',
            remitenteId: currentUser.id,
            remitenteNombre: currentUser.nombre,
            remitenteAvatar: currentUser.fotoPerfil || null,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            leido: false
        };

        // Agregar URL de imagen si existe
        if (imageUrl) {
            message.imagen = imageUrl;
        }

        // Add message to conversation
        await db.collection('conversaciones')
            .doc(currentChat.conversationId)
            .collection('mensajes')
            .add(message);

        // Determinar el texto del último mensaje
        let lastMessageText = '';
        if (imageUrl && messageText) {
            lastMessageText = '📷 ' + messageText.substring(0, 40);
        } else if (imageUrl) {
            lastMessageText = '📷 Imagen';
        } else {
            lastMessageText = messageText.substring(0, 50);
        }

        // Update conversation last message
        await db.collection('conversaciones')
            .doc(currentChat.conversationId)
            .update({
                ultimoMensaje: lastMessageText,
                ultimoMensajeFecha: firebase.firestore.FieldValue.serverTimestamp(),
                [`noLeidos.${currentChat.userId}`]: firebase.firestore.FieldValue.increment(1)
            });

        // Clear input and image
        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';
        removeSelectedImage();

    } catch (error) {
        console.error('Error sending message:', error);
        showMessage('Error al enviar el mensaje', 'error');
    } finally {
        elements.sendBtn.disabled = false;
        elements.attachBtn.disabled = false;
        elements.messageInput.focus();
    }
}

// Mark messages as read
async function markAsRead(conversationId) {
    try {
        const db = window.firebaseDB;
        await db.collection('conversaciones')
            .doc(conversationId)
            .update({
                [`noLeidos.${currentUser.id}`]: 0
            });
    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

// Start chat with user (crea la conversación si no existe)
async function startChatWithUser(contact) {
    try {
        await waitForFirebase();
        const db = window.firebaseDB;

        // Si ya existe la conversación, abrirla directamente
        if (contact.conversationId) {
            await openChat(contact);
            return;
        }

        // Si no existe, crear nueva conversación
        const newConv = await db.collection('conversaciones').add({
            participantes: [currentUser.id, contact.userId],
            ultimoMensaje: '',
            ultimoMensajeFecha: firebase.firestore.FieldValue.serverTimestamp(),
            noLeidos: {
                [currentUser.id]: 0,
                [contact.userId]: 0
            }
        });

        // Actualizar el contact con el ID de conversación
        contact.conversationId = newConv.id;

        // Abrir el chat
        await openChat(contact);

        // Ocultar sidebar en móviles
        hideSidebarOnMobile();

    } catch (error) {
        console.error('Error starting chat:', error);
        showMessage('Error al iniciar la conversación', 'error');
    }
}

// Handle clear chat
function handleClearChat() {
    if (!currentChat) return;
    showConfirmDeleteModal();
}

// Show confirm delete modal
function showConfirmDeleteModal() {
    const modal = document.getElementById('confirmDeleteModal');
    modal.classList.add('active');

    // Setup buttons
    document.getElementById('acceptDeleteBtn').onclick = confirmDeleteChat;
    document.getElementById('cancelDeleteBtn').onclick = hideConfirmDeleteModal;

    // Close on overlay click
    modal.onclick = function (e) {
        if (e.target === modal) {
            hideConfirmDeleteModal();
        }
    };
}

// Hide confirm delete modal
function hideConfirmDeleteModal() {
    const modal = document.getElementById('confirmDeleteModal');
    modal.classList.remove('active');
}

// Confirm delete chat
async function confirmDeleteChat() {
    hideConfirmDeleteModal();

    if (!currentChat) return;

    try {
        await waitForFirebase();
        const db = window.firebaseDB;

        // Get all messages
        const messagesSnapshot = await db.collection('conversaciones')
            .doc(currentChat.conversationId)
            .collection('mensajes')
            .get();

        // Delete all messages
        const batch = db.batch();
        messagesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Update conversation
        await db.collection('conversaciones')
            .doc(currentChat.conversationId)
            .update({
                ultimoMensaje: '',
                [`noLeidos.${currentUser.id}`]: 0,
                [`noLeidos.${currentChat.userId}`]: 0
            });

        showMessage('Conversación borrada', 'success');

    } catch (error) {
        console.error('Error clearing chat:', error);
        showMessage('Error al borrar la conversación', 'error');
    }
}

// Handle message keydown (Enter to send, Ctrl+Enter for new line)
function handleMessageKeydown(e) {
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            // Ctrl + Enter: insertar salto de línea
            // El comportamiento por defecto ya inserta el salto
            return;
        } else {
            // Enter solo: enviar mensaje
            e.preventDefault();
            elements.messageForm.dispatchEvent(new Event('submit'));
        }
    }
}

// Auto resize textarea
function autoResizeTextarea() {
    const textarea = elements.messageInput;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

// Scroll to bottom
function scrollToBottom() {
    setTimeout(() => {
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }, 100);
}

// Format time
function formatTime(date) {
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) {
        return 'Ahora';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `Hace ${minutes} min`;
    }

    // Today
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
        return 'Ayer';
    }

    // This week
    if (diff < 604800000) {
        return date.toLocaleDateString('es-ES', { weekday: 'short' });
    }

    // Older
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Format text with WhatsApp-style formatting
function formatWhatsAppText(text) {
    if (!text) return '';

    // Escapar HTML primero
    let formatted = escapeHtml(text);

    // Negrita: *texto* -> <strong>texto</strong>
    formatted = formatted.replace(/\*([^\*]+)\*/g, '<strong>$1</strong>');

    // Cursiva: _texto_ -> <em>texto</em>
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');

    // Tachado: ~texto~ -> <del>texto</del>
    formatted = formatted.replace(/~([^~]+)~/g, '<del>$1</del>');

    // Monoespaciado: ```texto``` -> <code>texto</code>
    formatted = formatted.replace(/```([^`]+)```/g, '<code>$1</code>');

    // Saltos de línea
    formatted = formatted.replace(/\n/g, '<br>');

    return formatted;
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `notification-message ${type}`;
    messageDiv.textContent = message;

    elements.messageContainer.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Handle logout
async function handleLogout() {
    showConfirmLogoutModal();
}

// Show confirm logout modal
function showConfirmLogoutModal() {
    const modal = document.getElementById('confirmLogoutModal');
    modal.classList.add('active');

    // Setup buttons
    document.getElementById('acceptLogoutBtn').onclick = confirmLogout;
    document.getElementById('cancelLogoutBtn').onclick = hideConfirmLogoutModal;

    // Close on overlay click
    modal.onclick = function (e) {
        if (e.target === modal) {
            hideConfirmLogoutModal();
        }
    };
}

// Hide confirm logout modal
function hideConfirmLogoutModal() {
    const modal = document.getElementById('confirmLogoutModal');
    modal.classList.remove('active');
}

// Confirm logout
function confirmLogout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}

// Upload image to ImgBB
async function uploadImageToImgBB(file) {
    try {
        const formData = new FormData();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', file);

        const response = await fetch(IMGBB_API_URL, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Error al subir la imagen');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error('Error al procesar la imagen');
        }

        return data.data.url;

    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Handle image selection
function handleImageSelection(e) {
    const file = e.target.files[0];

    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
        showMessage('Por favor selecciona un archivo de imagen válido', 'error');
        return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showMessage('La imagen es demasiado grande. Máximo 5MB', 'error');
        return;
    }

    selectedImageFile = file;

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = function (e) {
        elements.previewImage.src = e.target.result;
        elements.imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);

    // Limpiar el input para permitir seleccionar la misma imagen de nuevo
    elements.imageInput.value = '';
}

// Remove selected image
function removeSelectedImage() {
    selectedImageFile = null;
    elements.previewImage.src = '';
    elements.imagePreviewContainer.style.display = 'none';
    elements.imageInput.value = '';
}

// Handle paste image
async function handlePasteImage(e) {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            e.preventDefault();

            const blob = items[i].getAsFile();

            // Validar tamaño
            if (blob.size > 5 * 1024 * 1024) {
                showMessage('La imagen es demasiado grande. Máximo 5MB', 'error');
                return;
            }

            selectedImageFile = blob;

            // Mostrar vista previa
            const reader = new FileReader();
            reader.onload = function (e) {
                elements.previewImage.src = e.target.result;
                elements.imagePreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(blob);

            break;
        }
    }
}

// Show image modal
function showImageModal(imageUrl) {
    // Remover modal existente si hay
    const existingModal = document.getElementById('chatImageModal');
    if (existingModal) {
        existingModal.remove();
    }

    const modalHTML = `
        <div class="chat-image-modal" id="chatImageModal">
            <div class="chat-image-modal-content">
                <button class="chat-image-modal-close" onclick="hideImageModal()">
                    <i class="bi bi-x"></i>
                </button>
                <img src="${imageUrl}" alt="Imagen ampliada">
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Mostrar con animación
    setTimeout(() => {
        document.getElementById('chatImageModal').classList.add('active');
    }, 10);

    // Cerrar al hacer clic fuera
    document.getElementById('chatImageModal').addEventListener('click', function (e) {
        if (e.target === this) {
            hideImageModal();
        }
    });
}

// Hide image modal
function hideImageModal() {
    const modal = document.getElementById('chatImageModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (modal && modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Hacer funciones accesibles globalmente
window.showImageModal = showImageModal;
window.hideImageModal = hideImageModal;

