// Script de inicialización de contenido de ejemplo
// Ejecutar este script una vez para crear datos de ejemplo en Firebase

async function initializeExampleContent() {
    console.log('Inicializando contenido de ejemplo...');
    
    const db = firebase.firestore();
    
    try {
        // 1. Crear slides de carrusel de ejemplo
        console.log('Creando slides de carrusel...');
        const carouselItems = [
            {
                titulo: 'Bienvenido a Seamos Genios',
                descripcion: 'Tu plataforma educativa para alcanzar el éxito en el ICFES',
                textoBoton: 'Explorar Simulacros',
                enlaceBoton: '#simulacro',
                imagen: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200',
                activo: true,
                orden: 0,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                titulo: 'Prepárate para el ICFES',
                descripcion: 'Simulacros especializados con los mejores resultados',
                textoBoton: 'Ver Simulacros',
                enlaceBoton: '#simulacro',
                imagen: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200',
                activo: true,
                orden: 1,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                titulo: 'Únete a Nuestra Comunidad',
                descripcion: 'Miles de estudiantes ya confían en nosotros',
                textoBoton: 'Comenzar Ahora',
                enlaceBoton: 'Secciones/login.html',
                imagen: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200',
                activo: true,
                orden: 2,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        for (const item of carouselItems) {
            await db.collection('carouselItems').add(item);
        }
        console.log('✓ Slides de carrusel creados');
        
        // 2. Crear publicaciones de ejemplo
        console.log('Creando publicaciones...');
        const posts = [
            {
                titulo: 'Nuevos Cursos Disponibles',
                contenido: 'Descubre nuestros nuevos cursos de matemáticas avanzadas y preparación ICFES. Aprende con los mejores profesores y materiales actualizados.',
                imagen: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
                categoria: 'Noticias',
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                titulo: 'Consejos para el Examen',
                contenido: 'Tips importantes para mejorar tu rendimiento en las pruebas. Descubre técnicas de estudio efectivas y estrategias para el día del examen.',
                imagen: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800',
                categoria: 'Consejos',
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                titulo: 'Historias de Éxito',
                contenido: 'Conoce las historias de nuestros estudiantes destacados que lograron excelentes resultados en el ICFES gracias a nuestra plataforma.',
                imagen: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800',
                categoria: 'Testimonios',
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        for (const post of posts) {
            await db.collection('publicaciones').add(post);
        }
        console.log('✓ Publicaciones creadas');
        
        // 3. Crear precios
        console.log('Creando precios...');
        await db.collection('configuracion').doc('precios').set({
            basico: '$50.000 COP',
            premium: '$80.000 COP',
            intensivo: '$65.000 COP'
        });
        console.log('✓ Precios creados');
        
        // 4. Crear testimonios
        console.log('Creando testimonios...');
        const testimonials = [
            {
                autor: 'Juan Ramírez',
                texto: 'Gracias a Seamos Genios logré mejorar mi puntaje en el ICFES. ¡Excelente plataforma!',
                calificacion: 5,
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                autor: 'Laura Sánchez',
                texto: 'Los simulacros son muy parecidos al examen real. Me sentí muy preparada.',
                calificacion: 5,
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                autor: 'Diego Torres',
                texto: 'La mejor inversión para mi futuro académico. Totalmente recomendado.',
                calificacion: 5,
                fecha: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        for (const testimonial of testimonials) {
            await db.collection('testimonios').add(testimonial);
        }
        console.log('✓ Testimonios creados');
        
        // 5. Crear videos
        console.log('Creando videos...');
        const videos = [
            {
                titulo: 'Consejos para el ICFES',
                descripcion: 'Tips y estrategias para obtener el mejor puntaje',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                activo: true,
                orden: 0,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                titulo: 'Técnicas de Estudio',
                descripcion: 'Aprende a estudiar de manera efectiva',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                activo: true,
                orden: 1,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                titulo: 'Matemáticas Fáciles',
                descripcion: 'Domina las matemáticas del ICFES',
                url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                activo: true,
                orden: 2,
                fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
            }
        ];
        
        for (const video of videos) {
            await db.collection('videos').add(video);
        }
        console.log('✓ Videos creados');
        
        console.log('✅ Contenido de ejemplo inicializado correctamente');
        alert('Contenido de ejemplo creado exitosamente. Recarga la página para ver los cambios.');
        
    } catch (error) {
        console.error('Error al inicializar contenido:', error);
        alert('Error al crear contenido de ejemplo: ' + error.message);
    }
}

// Ejecutar cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Esperar a que Firebase esté listo
    const waitForFirebase = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            clearInterval(waitForFirebase);
            
            // Agregar botón para inicializar contenido
            const button = document.createElement('button');
            button.textContent = 'Inicializar Contenido de Ejemplo';
            button.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 15px 25px;
                background: #ff0000;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                z-index: 9999;
                box-shadow: 0 5px 15px rgba(255, 0, 0, 0.3);
            `;
            button.addEventListener('click', initializeExampleContent);
            document.body.appendChild(button);
        }
    }, 100);
});
