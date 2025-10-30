# Cambios en Materiales, Anuncios y Tareas

## Resumen
Se ha actualizado la sección de Materiales para permitir agregar múltiples imágenes y videos sin límites. También se han mejorado los modales de editar para Anuncios y Tareas, permitiendo ver y modificar el contenido multimedia existente.

## Cambios Realizados

### 1. Layout de Materiales (CSS)
- **Grid de 3 columnas**: Los materiales ahora se muestran en un grid de 3 columnas en lugar de una lista vertical
- **Videos más pequeños**: Reducidos de 400px a 200px de altura
- **Drive más pequeño**: Reducido de 500px a 250px de altura
- **Responsive**: 
  - Desktop (>1024px): 3 columnas
  - Tablets (769px-1024px): 2 columnas
  - Móviles (<768px): 1 columna

### 2. Modal de Crear Material (HTML)
Se reemplazó el sistema de un solo video/enlace por:
- **Múltiples imágenes**: Input de tipo file con soporte para múltiples archivos
- **Múltiples videos**: Sistema para agregar videos de YouTube o Google Drive sin límite
- **Carpeta de Drive**: Campo opcional para enlazar una carpeta compartida de Drive

### 3. Funcionalidad (JavaScript)

#### Nuevas características:
- `crearMaterial()`: Actualizada para subir múltiples imágenes a ImgBB y guardar múltiples videos
- `createMaterialCard()`: Actualizada para mostrar todas las imágenes y videos en un grid
- `removeMaterialImage()`: Función para eliminar imágenes del preview antes de subir
- `removeMaterialVideo()`: Función para eliminar videos del preview antes de crear

#### Event Listeners agregados:
- Upload de múltiples imágenes con preview
- Agregar videos uno por uno con preview
- Remover imágenes y videos del preview

### 4. Estilos CSS Agregados
- `.material-media-container`: Grid para mostrar imágenes y videos
- `.material-image`: Estilos para imágenes en materiales
- `.images-preview` y `.videos-preview`: Previews en el modal
- `.preview-item`: Items de preview de imágenes
- `.video-preview-item`: Items de preview de videos
- `.video-input-container`: Contenedor para inputs de video
- `.upload-btn`: Botón de subir imágenes
- `.add-video-btn`: Botón de agregar video

## Estructura de Datos en Firestore

```javascript
{
  materia: "matematicas",
  titulo: "Título del material",
  descripcion: "Descripción del material",
  imageUrls: ["url1", "url2", "url3", ...],  // Array de URLs de imágenes
  videos: [
    { tipo: "youtube", url: "https://..." },
    { tipo: "drive", url: "https://..." },
    ...
  ],
  driveUrl: "https://drive.google.com/...",  // Opcional
  fecha: Timestamp
}
```

### 5. Modal de Editar Material

El modal de editar ahora incluye:
- **Imágenes actuales**: Muestra todas las imágenes del material con opción de eliminar
- **Videos actuales**: Muestra todos los videos del material con opción de eliminar
- **Agregar nuevas imágenes**: Permite subir nuevas imágenes adicionales
- **Agregar nuevos videos**: Permite agregar nuevos videos adicionales
- **Carpeta de Drive**: Campo editable para la carpeta de Drive

#### Funciones agregadas:
- `removeEditMaterialCurrentImage()`: Eliminar imagen actual
- `removeEditMaterialCurrentVideo()`: Eliminar video actual
- `removeEditMaterialNewImage()`: Eliminar imagen nueva del preview
- `removeEditMaterialNewVideo()`: Eliminar video nuevo del preview

### 6. Editar Anuncios y Tareas

Los modales de editar anuncios y tareas ahora incluyen:
- **Imagen actual**: Muestra la imagen del anuncio/tarea con opción de eliminar
- **Video actual**: Muestra el video del anuncio/tarea con opción de eliminar
- **Cambiar/Agregar imagen**: Permite subir una nueva imagen para reemplazar o agregar
- **Cambiar/Agregar video**: Permite cambiar o agregar un nuevo video

#### Funciones agregadas:
- `removeEditPostCurrentImage()`: Eliminar imagen actual del anuncio
- `removeEditPostCurrentVideo()`: Eliminar video actual del anuncio
- `removeEditTaskCurrentImage()`: Eliminar imagen actual de la tarea
- `removeEditTaskCurrentVideo()`: Eliminar video actual de la tarea
- `clearEditPostNewImage()`: Limpiar preview de nueva imagen del anuncio
- `clearEditTaskNewImage()`: Limpiar preview de nueva imagen de la tarea

### 7. Tamaños Uniformes

Los videos e imágenes en materiales ahora tienen el mismo tamaño que en anuncios y tareas:
- **Imágenes**: max-width 500px, height 300px
- **Videos (YouTube/Drive)**: max-width 500px, height 280px
- **Grid responsive**: Se adapta automáticamente al tamaño de pantalla

## Notas
- Los materiales se muestran en **layout vertical** (filas) como estaban originalmente
- Las imágenes se suben a ImgBB (servicio externo)
- Los videos se almacenan como referencias (URLs) no se suben archivos
- No hay límite en la cantidad de imágenes o videos que se pueden agregar en materiales
- Al editar anuncios, tareas y materiales, puedes ver y eliminar el contenido actual, y agregar nuevo contenido
- Los tamaños de videos e imágenes son consistentes en toda la plataforma
