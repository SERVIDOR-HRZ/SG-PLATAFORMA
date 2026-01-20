# Sistema de Foro con Tutores

## Descripción

Se ha implementado un sistema completo de foro en la sección de Aula donde:

- **Solo los tutores** pueden crear publicaciones
- **Todos los estudiantes** pueden comentar en las publicaciones
- **Los administradores** pueden gestionar quiénes son tutores

## Características Principales

### Para Administradores

1. **Gestionar Tutores**
   - Botón "Gestionar Tutores" visible en la pestaña Foro
   - Permite asignar/remover estudiantes como tutores
   - Los tutores se asignan por aula y materia específica

2. **Crear Publicaciones**
   - Los administradores también pueden crear publicaciones como tutores
   - Pueden editar y eliminar cualquier publicación
   - Pueden eliminar cualquier comentario

### Para Tutores (Estudiantes Asignados)

1. **Crear Publicaciones**
   - Botón "Crear Publicación" visible en el foro
   - Pueden agregar:
     - Título (opcional)
     - Contenido (obligatorio)
     - Imágenes (múltiples)
     - Videos (YouTube o Google Drive)
     - Archivos y enlaces (PDFs, carpetas de Drive, Canva, GitHub, etc.)

2. **Gestionar sus Publicaciones**
   - Editar sus propias publicaciones
   - Eliminar sus propias publicaciones
   - Eliminar comentarios en sus publicaciones

### Para Todos los Estudiantes

1. **Ver Publicaciones**
   - Pueden ver todas las publicaciones del foro
   - Ver quién es el autor (con badge de "Tutor")
   - Ver fecha de publicación

2. **Comentar**
   - Pueden comentar en cualquier publicación
   - Ver todos los comentarios
   - Eliminar sus propios comentarios

## Estructura de Datos en Firebase

### Colección: `tutores`
```javascript
{
  aulaId: string,          // ID del aula
  materia: string,         // Nombre de la materia
  estudianteId: string,    // ID del estudiante tutor
  fechaAsignacion: timestamp
}
```

### Colección: `foro`
```javascript
{
  aulaId: string,
  materia: string,
  autorId: string,
  titulo: string,
  contenido: string,
  imagenes: [string],      // URLs de imágenes
  videos: [{tipo, url}],   // Videos de YouTube o Drive
  archivos: [{url, nombre}], // Enlaces a archivos
  fechaCreacion: timestamp,
  fechaEdicion: timestamp  // Opcional
}
```

### Subcolección: `foro/{publicacionId}/comentarios`
```javascript
{
  autorId: string,
  texto: string,
  fecha: timestamp,
  publicacionId: string
}
```

## Funciones Principales

### JavaScript (aula.js)

- `loadForo()` - Carga el foro con publicaciones y comentarios
- `verificarSiEsTutor()` - Verifica si el usuario actual es tutor
- `abrirModalGestionarTutores()` - Modal para gestionar tutores (admin)
- `guardarTutores()` - Guarda los cambios de tutores
- `abrirModalCrearPublicacionForo()` - Modal para crear publicación
- `crearPublicacionForo()` - Crea una nueva publicación
- `enviarComentarioForo()` - Envía un comentario
- `eliminarComentarioForo()` - Elimina un comentario
- `eliminarPublicacionForo()` - Elimina una publicación y sus comentarios

## Estilos CSS

Los estilos del foro se encuentran al final de `Elementos/css/aula.css` con el prefijo `.foro-*`

## Características Adicionales

1. **Fechas Relativas**: Las fechas se muestran de forma relativa (hace 5 minutos, hace 2 horas, etc.)
2. **Iconos Dinámicos**: Los archivos muestran iconos según su tipo (PDF, Word, Excel, carpeta, etc.)
3. **Responsive**: El diseño se adapta a dispositivos móviles
4. **Persistencia de Estado**: Al recargar la página, se mantiene en la pestaña del foro si estabas ahí

## Uso

1. **Como Administrador**:
   - Ve a la pestaña "Foro" en cualquier materia
   - Haz clic en "Gestionar Tutores"
   - Activa el switch de los estudiantes que quieres como tutores
   - Guarda los cambios

2. **Como Tutor**:
   - Ve a la pestaña "Foro"
   - Haz clic en "Crear Publicación"
   - Completa el formulario con contenido, imágenes, videos, etc.
   - Publica

3. **Como Estudiante**:
   - Ve a la pestaña "Foro"
   - Lee las publicaciones
   - Haz clic en "Comentar" para agregar un comentario
   - Escribe tu comentario y envía

## Notas Importantes

- Los tutores se asignan por **aula y materia**, no globalmente
- Un estudiante puede ser tutor en una materia pero no en otra
- Las imágenes se suben a ImgBB (usando la API key configurada)
- Los videos y archivos se enlazan (no se suben al servidor)
- Los administradores siempre pueden crear publicaciones sin ser tutores
