/**
 * ADMIN RICH UI - Scripts
 * Inicializa editores enriquecidos, color pickers, sliders.
 */

document.addEventListener('DOMContentLoaded', () => {

    // 1. Inicializar QuillJS en todos los textareas que tengan la clase .quill-container
    const quillContainers = document.querySelectorAll('.quill-container');
    
    quillContainers.forEach(container => {
        // Encontrar el textarea original
        const targetId = container.getAttribute('data-target');
        const hiddenTextarea = document.getElementById(targetId);
        
        // Configuración de la barra de herramientas
        const toolbarOptions = [
            ['bold', 'italic', 'underline', 'strike'],        // negrita, cursiva, subrayado, tachado
            ['blockquote', 'code-block'],                     // citas y código
        
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],     // listas enumeradas o viñetas
            [{ 'script': 'sub'}, { 'script': 'super' }],      // superíndice / subíndice
            [{ 'indent': '-1'}, { 'indent': '+1' }],          // identación
            
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],        // Títulos h1 a h6
        
            [{ 'color': [] }, { 'background': [] }],          // Colores
            [{ 'align': [] }],                                // Alineación
        
            ['clean']                                         // Eliminar formatos
        ];

        // Crear instancia de Quill
        const quill = new Quill(container, {
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions
            },
            placeholder: 'Escribe el contenido aquí...'
        });

        // Evento de escucha: cada vez que el texto cambie en Quill, 
        // pasamos el valor al textarea escondido para que los scripts
        // originales sigan funcionando y guardando los datos intactos.
        quill.on('text-change', function() {
            if(hiddenTextarea) {
                hiddenTextarea.value = quill.root.innerHTML;
            }
        });
        
        // Forzar el salto de contenido inicial al editor
        if(hiddenTextarea && hiddenTextarea.value) {
            quill.root.innerHTML = hiddenTextarea.value;
        }
    });

    // 2. Toggles y Sliders (el HTML embebido con oninput ya se encarga de muchos,
    // pero podemos hacer listeners en JS si lo necesitamos a futuro).
    console.log("Rich UI Modules loaded successfully.");
});
