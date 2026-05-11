/* ═══════════════════════════════════════════════════════════
   SEAMOS GENIOS — CMS Section: TESTIMONIOS
   ═══════════════════════════════════════════════════════════ */

window.SGSection_testimonios = (() => {

    function render(container) {
        const data = SGStore.get();
        // Here you would normally extract the section data: const secData = data.testimonios || {};

        container.innerHTML = `
            <div class="max-w-7xl mx-auto space-y-6">
                <!-- Header -->
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold text-white flex items-center gap-3">
                            <i data-lucide="edit-3" class="w-6 h-6 text-sg-cyan"></i> Editor de ${capitalizeFirstLetter('testimonios')}
                        </h2>
                        <p class="text-sm text-gray-400">Configura el contenido y propiedades de esta sección.</p>
                    </div>
                    <button id="save-testimonios-btn" class="bg-gradient-to-r from-sg-cyan to-blue-500 hover:from-cyan-400 text-white font-semibold py-2 px-5 rounded-lg flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                        <i data-lucide="save" class="w-4 h-4"></i> Guardar Cambios
                    </button>
                </div>

                <!-- Editor Card -->
                <div class="cms-card rounded-xl p-8 space-y-8 relative overflow-hidden">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                        
                        <div class="md:col-span-2">
                            <div class="p-6 bg-sg-cyan/10 border border-sg-cyan/30 rounded-lg text-center">
                                <i data-lucide="wrench" class="w-12 h-12 text-sg-cyan mx-auto mb-3"></i>
                                <h3 class="text-lg font-bold text-white mb-2">Módulo en Construcción</h3>
                                <p class="text-gray-400 text-sm">Este panel está siendo unificado bajo la nueva arquitectura SPA.</p>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;

        // Bind events
        const saveBtn = container.querySelector(`#save-testimonios-btn`);
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                SGToast.success('Cambios guardados simulados');
            });
        }
    }

    // Helper
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    return { render };
})();
