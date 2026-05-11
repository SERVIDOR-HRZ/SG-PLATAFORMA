/* ═══════════════════════════════════════════════════════════
   SEAMOS GENIOS — CMS Section: CTA
   ═══════════════════════════════════════════════════════════ */

window.SGSection_cta = (() => {

    function render(container) {
        const storeData = SGStore.get();
        const secData = storeData.cta || {};

        let html = '<div class="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">';
        html += '<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">';
        html += '<div><h2 class="text-2xl font-bold text-white flex items-center gap-3"><i data-lucide="megaphone" class="w-6 h-6 text-orange-500"></i> Editor de CTA / Banner Final</h2><p class="text-sm text-gray-400 mt-1">Llamado a la acción principal del final de la página</p></div>';
        html += '<button class="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-orange-400 hover:from-orange-500 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all transform hover:scale-105" onclick="SGToast.success(\'' + 'CTA / Banner Final guardado correctamente' + '\')"><i data-lucide="save" class="w-4 h-4"></i> Guardar Cambios</button>';
        html += '</div>';

        html += '<div class="grid grid-cols-1 grid-cols-1 gap-8">';

        // Left Column: Fields
        html += '<div class="col-span-1 space-y-8">';
        html += '<div class="cms-card rounded-xl p-8 relative overflow-hidden group">';
        html += '<div class="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:bg-orange-500/10"></div>';
        html += '<h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2"><i data-lucide="edit-3" class="w-5 h-5 text-orange-500"></i> Contenido Principal</h3>';
        html += '<div class="space-y-6 relative z-10">';

        html += '<div class="form-group mb-4"><label class="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-winder text-xs">title</label><input type="text" value="' + (secData.title || '') + '" class="w-full bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" onchange="SGStore.update(\'cta\', \'title\', this.value)"></div>';

        html += '<div class="form-group mb-4"><label class="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-winder text-xs">subtitle</label><input type="text" value="' + (secData.subtitle || '') + '" class="w-full bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" onchange="SGStore.update(\'cta\', \'subtitle\', this.value)"></div>';

        html += '<div class="form-group mb-4"><label class="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-winder text-xs">buttonText</label><input type="text" value="' + (secData.buttonText || '') + '" class="w-full bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" onchange="SGStore.update(\'cta\', \'buttonText\', this.value)"></div>';

        html += '<div class="form-group mb-4"><label class="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-winder text-xs">buttonLink</label><input type="text" value="' + (secData.buttonLink || '') + '" class="w-full bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" onchange="SGStore.update(\'cta\', \'buttonLink\', this.value)"></div>';

        html += '</div></div></div>'; // end left column

        html += '</div>'; // close grid
        html += '</div>'; // close main container

        container.innerHTML = html;
        if (window.lucide) { lucide.createIcons(); }
    }

    return { render };
})();
