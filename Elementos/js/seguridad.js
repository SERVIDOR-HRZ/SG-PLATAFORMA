/**
 * SISTEMA DE PROTECCIÓN WEB GLOBAL
 * =================================
 * Este script proporciona protección básica contra inspección de código
 * y herramientas de desarrollador. Se puede adaptar a cualquier sitio web.
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
            recordatorioConsola: configuracion.recordatorioConsola || 10000, // 10 segundos
            ...configuracion
        };

        this.devtools = { abierto: false };
        this.threshold = 160;
        this.inicializado = false;

        this.inicializar();
    }

    inicializar() {
        if (this.inicializado) return;
        
        this.crearModal();
        this.configurarEventos();
        this.mostrarMensajeInicial();
        this.iniciarRecordatorios();
        
        this.inicializado = true;
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