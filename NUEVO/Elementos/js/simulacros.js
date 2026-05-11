/* ═══════════════════════════════════════════════════════════
   SEAMOS GENIOS — CMS Section: SIMULACROS
   ═══════════════════════════════════════════════════════════ */

window.SGSection_simulacros = (() => {

    function render(container) {
        const storeData = SGStore.get();
        const secData = storeData.simulacros || {};

        let html = '<div class="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">';
        html += '<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">';
        html += '<div><h2 class="text-2xl font-bold text-white flex items-center gap-3"><i data-lucide="file-text" class="w-6 h-6 text-sg-purple"></i> Editor de Simulacros</h2><p class="text-sm text-gray-400 mt-1">Configura los módulos de pruebas</p></div>';
        html += '<button class="w-full sm:w-auto bg-gradient-to-r from-sg-600 to-sg-400 hover:from-sg-500 text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all transform hover:scale-105" onclick="SGToast.success(\'' + 'Simulacros guardado correctamente' + '\')"><i data-lucide="save" class="w-4 h-4"></i> Guardar Cambios</button>';
        html += '</div>';

        html += '<div class="grid grid-cols-1 xl:grid-cols-12 gap-8">';

        // Left Column: Fields
        html += '<div class="xl:col-span-5 space-y-8">';
        html += '<div class="cms-card rounded-xl p-8 relative overflow-hidden group">';
        html += '<div class="absolute top-0 right-0 w-32 h-32 bg-sg-purple/5 rounded-bl-[100px] pointer-events-none transition-all group-hover:bg-sg-purple/10"></div>';
        html += '<h3 class="text-lg font-bold text-white mb-6 flex items-center gap-2"><i data-lucide="edit-3" class="w-5 h-5 text-sg-purple"></i> Contenido Principal</h3>';
        html += '<div class="space-y-6 relative z-10">';

        html += '<div class="form-group mb-4"><label class="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-winder text-xs">badge</label><input type="text" value="' + (secData.badge || '') + '" class="w-full bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-white outline-none focus:border-sg-purple focus:ring-1 focus:ring-sg-purple transition-all" onchange="SGStore.update(\'simulacros\', \'badge\', this.value)"></div>';

        html += '<div class="form-group mb-4"><label class="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-winder text-xs">title</label><input type="text" value="' + (secData.title || '') + '" class="w-full bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-white outline-none focus:border-sg-purple focus:ring-1 focus:ring-sg-purple transition-all" onchange="SGStore.update(\'simulacros\', \'title\', this.value)"></div>';

        html += '<div class="form-group mb-4"><label class="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-winder text-xs">subtitle</label><input type="text" value="' + (secData.subtitle || '') + '" class="w-full bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-white outline-none focus:border-sg-purple focus:ring-1 focus:ring-sg-purple transition-all" onchange="SGStore.update(\'simulacros\', \'subtitle\', this.value)"></div>';

        html += '</div></div></div>'; // end left column

        // Right Column: List
        html += '<div class="xl:col-span-7 space-y-6">';
        html += '<div class="cms-card rounded-xl p-8 relative overflow-hidden group">';
        html += '<h3 class="text-lg font-bold text-white mb-2 flex items-center gap-2"><i data-lucide="list" class="w-5 h-5 text-sg-purple"></i> Módulos</h3>';
        html += '<p class="text-sm text-gray-400 mb-6">Añade módulos al simulacro</p>';
        html += '<div class="space-y-4">';
        const listArr = secData.modules || [];
        listArr.forEach((item, i) => {
            html += '<div class="p-6 bg-gray-900/30 border border-sg-border hover:border-sg-purple/30 transition-colors rounded-xl relative group/item">';
            html += '<div class="text-[10px] text-sg-purple font-bold absolute -top-3 -left-3 bg-[#111827] border border-sg-purple/50 shadow-[0_0_10px_rgba(255,255,255,0.05)] rounded-full w-8 h-8 flex items-center justify-center">' + (i+1) + '</div>';
            html += '<div class="flex flex-col sm:flex-row gap-3"><input type="text" value="" class="flex-1 bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-sg-purple font-bold" onchange="SGStore.update(\'simulacros\', \'modules[\' + i + \'].name\', this.value)" placeholder="Nombre del módulo"><input type="number" value="" class="w-full sm:w-28 bg-gray-900/50 border border-sg-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-sg-purple" onchange="SGStore.update(\'simulacros\', \'modules[\' + i + \'].questions\', this.value)" placeholder="Nº Pregs"><input type="color" value="" class="w-full sm:w-16 h-12 p-1 rounded-lg border border-sg-border bg-gray-900/50 cursor-pointer" onchange="SGStore.update(\'simulacros\', \'modules[\' + i + \'].color\', this.value)"></div>';
            html += '<button class="absolute top-2 right-2 p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover/item:opacity-100 transition-opacity" title="Eliminar" onclick="const arr = [...SGStore.get().simulacros?.modules]; arr.splice(' + i + ', 1); SGStore.update(\'simulacros\', \'modules\', arr)"><i data-lucide="trash-2" class="w-4 h-4"></i></button>';
            html += '</div>';
        });
        html += '<button class="mt-6 w-full flex items-center justify-center gap-2 py-4 border border-dashed border-gray-600 rounded-xl text-gray-400 hover:text-sg-purple hover:border-sg-purple transition-colors font-medium bg-gray-900/20" onclick="SGStore.update(\'simulacros\', \'modules\', [...(SGStore.get().simulacros?.modules || []), {}])"><i data-lucide="plus-circle" class="w-5 h-5"></i> Agregar Nuevo Item</button>';
        html += '</div></div></div>'; // end right column

        html += '</div>'; // close grid
        html += '</div>'; // close main container

        container.innerHTML = html;
        if (window.lucide) { lucide.createIcons(); }
    }

    return { render };
})();
