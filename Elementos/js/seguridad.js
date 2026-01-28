/**
 * SISTEMA DE PROTECCIÓN WEB PROFESIONAL
 * =====================================
 * Sistema avanzado de seguridad con detección inteligente de amenazas,
 * registro de eventos y simulación de descargas sospechosas.
 */

class ProteccionWeb {
    constructor(configuracion = {}) {
        // Configuración por defecto
        this.config = {
            titulo: configuracion.titulo || "Contenido Protegido",
            subtitulo: configuracion.subtitulo || "Esta página tiene medidas de seguridad activadas. El contenido está protegido para mantener la integridad.",
            mensajeConsola: configuracion.mensajeConsola || "CONTENIDO PROTEGIDO - MEDIDAS DE SEGURIDAD ACTIVAS",
            mostrarAviso: configuracion.mostrarAviso !== false,
            bloquearDevTools: configuracion.bloquearDevTools !== false,
            bloquearClicDerecho: configuracion.bloquearClicDerecho !== false,
            bloquearSeleccion: configuracion.bloquearSeleccion !== false,
            bloquearArrastrar: configuracion.bloquearArrastrar !== false,
            bloquearCopiar: configuracion.bloquearCopiar !== false,
            recordatorioConsola: configuracion.recordatorioConsola || 10000,
            registrarEventos: configuracion.registrarEventos !== false,
            detectarSO: configuracion.detectarSO !== false,
            simularDescargas: configuracion.simularDescargas !== false,
            ...configuracion
        };

        this.devtools = { abierto: false };
        this.threshold = 160;
        this.inicializado = false;
        this.eventosRegistrados = [];
        this.ultimoEventoSospechoso = null;
        this.sistemaOperativo = null;
        this.navegador = null;

        this.inicializar();
    }

    inicializar() {
        if (this.inicializado) return;
        
        this.detectarSistemaOperativo();
        this.detectarNavegador();
        this.crearModal();
        this.configurarEventos();
        this.mostrarMensajeInicial();
        this.iniciarRecordatorios();
        
        if (this.config.registrarEventos) {
            this.inicializarRegistroEventos();
        }
        
        if (this.config.simularDescargas) {
            this.inicializarSimuladorDescargas();
        }
        
        this.inicializado = true;
    }

    // Detectar sistema operativo
    detectarSistemaOperativo() {
        const userAgent = navigator.userAgent.toLowerCase();
        const platform = navigator.platform.toLowerCase();
        
        if (userAgent.includes('win')) {
            // Detectar Windows 10 o 11
            if (userAgent.includes('windows nt 10.0')) {
                this.sistemaOperativo = 'Windows 10/11';
            } else {
                this.sistemaOperativo = 'Windows (Versión no soportada)';
            }
        } else if (userAgent.includes('mac') || platform.includes('mac')) {
            this.sistemaOperativo = 'macOS';
        } else if (userAgent.includes('linux')) {
            this.sistemaOperativo = 'Linux (No permitido)';
            this.registrarEventoSospechoso('Sistema operativo no permitido: Linux');
        } else {
            this.sistemaOperativo = 'Desconocido';
            this.registrarEventoSospechoso('Sistema operativo desconocido');
        }
        
        return this.sistemaOperativo;
    }

    // Detectar navegador
    detectarNavegador() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            this.navegador = 'Chrome';
        } else if (userAgent.includes('Firefox')) {
            this.navegador = 'Firefox';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            this.navegador = 'Safari';
        } else if (userAgent.includes('Edg')) {
            this.navegador = 'Edge';
        } else {
            this.navegador = 'Desconocido';
        }
        
        return this.navegador;
    }

    // Inicializar registro de eventos
    inicializarRegistroEventos() {
        this.registrarEvento('Sistema de protección iniciado', 'info');
        this.registrarEvento(`SO: ${this.sistemaOperativo} | Navegador: ${this.navegador}`, 'info');
    }

    // Registrar evento
    registrarEvento(descripcion, tipo = 'info', datos = {}) {
        const evento = {
            timestamp: new Date().toISOString(),
            descripcion,
            tipo, // 'info', 'warning', 'danger', 'sospechoso'
            sistemaOperativo: this.sistemaOperativo,
            navegador: this.navegador,
            ip: 'Detectando...', // Se puede obtener con API externa
            ...datos
        };
        
        this.eventosRegistrados.push(evento);
        
        // Guardar en localStorage
        try {
            const eventosGuardados = JSON.parse(localStorage.getItem('proteccion_eventos') || '[]');
            eventosGuardados.push(evento);
            // Mantener solo los últimos 100 eventos
            if (eventosGuardados.length > 100) {
                eventosGuardados.shift();
            }
            localStorage.setItem('proteccion_eventos', JSON.stringify(eventosGuardados));
        } catch (e) {
            console.error('Error guardando evento:', e);
        }
        
        // Si es sospechoso, registrar en Firebase (si está disponible)
        if (tipo === 'sospechoso' && this.config.registrarEventos) {
            this.registrarEventoEnFirebase(evento);
        }
        
        return evento;
    }

    // Registrar evento sospechoso
    registrarEventoSospechoso(descripcion, datos = {}) {
        // Verificar si ya hubo un evento sospechoso este mes
        const ahora = new Date();
        const mesActual = ahora.getMonth();
        const añoActual = ahora.getFullYear();
        
        if (this.ultimoEventoSospechoso) {
            const fechaUltimo = new Date(this.ultimoEventoSospechoso);
            if (fechaUltimo.getMonth() === mesActual && fechaUltimo.getFullYear() === añoActual) {
                // Ya hubo un evento sospechoso este mes, no registrar
                console.log('Ya se registró un evento sospechoso este mes');
                return null;
            }
        }
        
        this.ultimoEventoSospechoso = ahora.toISOString();
        localStorage.setItem('ultimo_evento_sospechoso', this.ultimoEventoSospechoso);
        
        return this.registrarEvento(descripcion, 'sospechoso', datos);
    }

    // Registrar evento en Firebase
    async registrarEventoEnFirebase(evento) {
        try {
            if (!window.firebaseDB) return;
            
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            
            await window.firebaseDB.collection('registroSeguridad').add({
                ...evento,
                usuarioId: currentUser.id || 'anonimo',
                usuarioNombre: currentUser.nombre || 'Anónimo',
                usuarioEmail: currentUser.email || '',
                fecha: window.firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error registrando en Firebase:', error);
        }
    }

    // Inicializar simulador de descargas
    inicializarSimuladorDescargas() {
        // Simular descarga de archivo ilegítimo cada cierto tiempo (solo para pruebas)
        const probabilidad = 0.01; // 1% de probabilidad
        
        if (Math.random() < probabilidad) {
            setTimeout(() => {
                this.simularDescargaIlegitima();
            }, Math.random() * 60000 + 30000); // Entre 30s y 90s
        }
    }

    // Simular descarga ilegítima
    async simularDescargaIlegitima() {
        const archivosIlegitimos = [
            'examen_respuestas_2024.pdf',
            'solucionario_completo.pdf',
            'claves_prueba_saber.pdf',
            'respuestas_simulacro.pdf'
        ];
        
        const archivoAleatorio = archivosIlegitimos[Math.floor(Math.random() * archivosIlegitimos.length)];
        
        this.registrarEventoSospechoso(`Intento de descarga de archivo no autorizado: ${archivoAleatorio}`, {
            archivo: archivoAleatorio,
            accion: 'descarga_bloqueada'
        });
        
        // Registrar en Firebase
        try {
            if (!window.firebaseDB) return;
            
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            
            await window.firebaseDB.collection('registroDescargas').add({
                usuarioId: currentUser.id || 'anonimo',
                usuarioNombre: currentUser.nombre || 'Anónimo',
                usuarioEmail: currentUser.email || '',
                documento: archivoAleatorio,
                aula: 'N/A',
                materia: 'N/A',
                fecha: new Date().toISOString(),
                dispositivo: this.navegador,
                tipoDispositivo: this.detectarTipoDispositivo(),
                ip: await this.obtenerIP(),
                sistemaOperativo: this.sistemaOperativo,
                sospechoso: true,
                bloqueado: true
            });
        } catch (error) {
            console.error('Error registrando descarga:', error);
        }
    }

    // Detectar tipo de dispositivo
    detectarTipoDispositivo() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
            return 'tablet';
        }
        if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }

    // Obtener IP (usando API externa)
    async obtenerIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'No disponible';
        }
    }

    crearModal() {
        // Crear el modal si no existe
        if (!document.getElementById('proteccion-modal')) {
            const modal = document.createElement('div');
            modal.id = 'proteccion-modal';
            modal.className = 'proteccion-modal';
            
            modal.innerHTML = `
                <div class="proteccion-contenido">
                    <div class="proteccion-icono">
                        <i class="bi bi-shield-exclamation" style="font-size: 56px; color: #dc3545;"></i>
                    </div>
                    <div class="proteccion-titulo">${this.config.titulo}</div>
                    <div class="proteccion-subtitulo">${this.config.subtitulo}</div>
                    <button class="proteccion-boton" onclick="proteccionWeb.cerrarModal()">Continuar</button>
                </div>
            `;
            
            document.body.appendChild(modal);
        }
    }

    mostrarModal() {
        const modal = document.getElementById('proteccion-modal');
        if (modal) {
            modal.style.display = 'block';
            this.mostrarMensajesConsola();
        }
    }

    cerrarModal() {
        const modal = document.getElementById('proteccion-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    mostrarMensajesConsola() {
        console.clear();
        console.log(`%c${this.config.mensajeConsola}`, 
            "color: #dc3545; font-size: 18px; font-weight: bold; background: #f8f9fa; padding: 8px; border: 1px solid #dc3545;");

        const mensajes = [
            "AVISO: Contenido protegido",
            "INFORMACIÓN: Medidas de seguridad activas",
            "PLATAFORMA: Modo protegido activado",
            "SEGURIDAD: Protección de integridad activa"
        ];

        mensajes.forEach((mensaje, index) => {
            setTimeout(() => {
                console.log(`%c${mensaje}`, "color: #dc3545; font-size: 14px; font-weight: 500;");
            }, index * 300);
        });
    }

    configurarEventos() {
        // Bloquear herramientas de desarrollador
        if (this.config.bloquearDevTools) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'F12' ||
                    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
                    (e.ctrlKey && e.key === 'U')) {
                    e.preventDefault();
                    this.mostrarModal();
                    return false;
                }
            });
        }

        // Bloquear clic derecho
        if (this.config.bloquearClicDerecho) {
            document.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.mostrarModal();
                return false;
            });
        }

        // Bloquear selección de texto
        if (this.config.bloquearSeleccion) {
            document.addEventListener('selectstart', (e) => {
                e.preventDefault();
                return false;
            });
        }

        // Bloquear arrastrar elementos (excepto elementos con draggable="true")
        if (this.config.bloquearArrastrar) {
            document.addEventListener('dragstart', (e) => {
                // Permitir drag en elementos que explícitamente tienen draggable="true"
                if (e.target.draggable === true || 
                    e.target.hasAttribute('draggable') && e.target.getAttribute('draggable') === 'true' ||
                    e.target.closest('[draggable="true"]')) {
                    return true; // Permitir el drag
                }
                e.preventDefault();
                return false;
            });
        }

        // Bloquear Ctrl+A (seleccionar todo)
        if (this.config.bloquearCopiar) {
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'a') {
                    e.preventDefault();
                    this.mostrarModal();
                    return false;
                }
            });
        }

        // Detectar DevTools abiertos
        if (this.config.bloquearDevTools) {
            setInterval(() => {
                if (window.outerHeight - window.innerHeight > this.threshold ||
                    window.outerWidth - window.innerWidth > this.threshold) {
                    if (!this.devtools.abierto) {
                        this.devtools.abierto = true;
                        this.mostrarModal();
                    }
                } else {
                    this.devtools.abierto = false;
                }
            }, 1000);

            // Detectar debugger
            setInterval(() => {
                this.detectarDebugger();
            }, 2000);
        }
    }

    detectarDebugger() {
        const inicio = performance.now();
        debugger;
        const fin = performance.now();
        if (fin - inicio > 100) {
            this.mostrarModal();
        }
    }

    mostrarMensajeInicial() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                console.log("%cBienvenido a la página protegida", 
                    "color: #007bff; font-size: 16px; font-weight: bold;");
                console.log("%cEl contenido está protegido para mantener la integridad", 
                    "color: #6c757d; font-size: 14px;");
            }, 1000);
        });
    }

    iniciarRecordatorios() {
        if (this.config.recordatorioConsola > 0) {
            setInterval(() => {
                console.log("%cRecordatorio: Contenido protegido", 
                    "color: #dc3545; font-size: 12px; background: #fff3cd; padding: 4px;");
            }, this.config.recordatorioConsola);
        }
    }

    // Métodos públicos para control
    activar() {
        this.inicializar();
    }

    desactivar() {
        // Remover event listeners (implementación básica)
        this.inicializado = false;
    }

    cambiarConfiguracion(nuevaConfig) {
        this.config = { ...this.config, ...nuevaConfig };
    }
}

// Crear instancia global
let proteccionWeb;

// Función de inicialización automática
function inicializarProteccion(configuracion = {}) {
    proteccionWeb = new ProteccionWeb(configuracion);
    return proteccionWeb;
}

// Inicialización automática si no se ha hecho manualmente
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!proteccionWeb) {
            proteccionWeb = new ProteccionWeb();
        }
    });
} 