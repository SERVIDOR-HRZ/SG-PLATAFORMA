# Guía de Gestión de Contenido Web

## Descripción
Sistema de administración de contenido dinámico para la página principal de Seamos Genios. Permite a los administradores gestionar el carrusel, publicaciones, precios y testimonios desde un panel intuitivo.

## Acceso
1. Iniciar sesión como administrador
2. En el Panel de Administrador, hacer clic en la tarjeta **"Gestión de Contenido"**
3. Se abrirá el panel de gestión con 4 pestañas principales

## Funcionalidades

### 1. Gestión del Carrusel
Administra las imágenes y contenido del carrusel principal de la página de inicio.

**Características:**
- Agregar nuevos slides con imagen, título, descripción y botón
- Editar slides existentes
- Activar/desactivar slides
- Eliminar slides
- Las imágenes se suben automáticamente a ImgBB

**Campos:**
- **Imagen**: Imagen de fondo del slide (se sube a ImgBB)
- **Título**: Título principal del slide
- **Descripción**: Texto descriptivo
- **Texto del Botón**: Texto que aparecerá en el botón (opcional)
- **Enlace del Botón**: URL a la que redirige el botón (opcional)
- **Activo**: Checkbox para activar/desactivar el slide

### 2. Gestión de Publicaciones
Crea y administra las publicaciones que aparecen en la sección de noticias.

**Características:**
- Crear nuevas publicaciones con imagen
- Editar publicaciones existentes
- Eliminar publicaciones
- Las imágenes se suben automáticamente a ImgBB

**Campos:**
- **Imagen**: Imagen destacada de la publicación
- **Título**: Título de la publicación
- **Contenido**: Texto completo de la publicación
- **Categoría**: Categoría de la publicación (opcional)

### 3. Gestión de Precios
Actualiza los precios de los planes de simulacros.

**Planes disponibles:**
- **Básico**: Plan de entrada
- **Premium**: Plan destacado
- **Intensivo**: Plan acelerado

**Cómo actualizar:**
1. Hacer clic en el precio que deseas cambiar
2. Editar el texto directamente
3. Hacer clic en el botón "Actualizar"

### 4. Gestión de Testimonios
Administra los testimonios de estudiantes que aparecen en la página principal.

**Características:**
- Agregar nuevos testimonios
- Editar testimonios existentes
- Eliminar testimonios

**Campos:**
- **Nombre del Estudiante**: Nombre completo
- **Testimonio**: Texto del testimonio
- **Calificación**: Estrellas de 1 a 5

## Integración con ImgBB

### API Key
```javascript
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
```

### Funcionamiento
- Todas las imágenes se suben automáticamente a ImgBB
- Se obtiene una URL permanente que se guarda en Firebase
- No hay límite de almacenamiento en el servidor
- Las imágenes se optimizan automáticamente

## Estructura de Firebase

### Colección: `carouselItems`
```javascript
{
  titulo: string,
  descripcion: string,
  imagen: string (URL de ImgBB),
  textoBoton: string,
  enlaceBoton: string,
  activo: boolean,
  orden: number,
  fechaCreacion: timestamp,
  fechaActualizacion: timestamp
}
```

### Colección: `publicaciones`
```javascript
{
  titulo: string,
  contenido: string,
  imagen: string (URL de ImgBB),
  categoria: string,
  fecha: timestamp
}
```

### Colección: `configuracion/precios`
```javascript
{
  basico: string,
  premium: string,
  intensivo: string
}
```

### Colección: `testimonios`
```javascript
{
  autor: string,
  texto: string,
  calificacion: number (1-5),
  fecha: timestamp
}
```

## Carga Dinámica en la Web Principal

### Carrusel
El carrusel se carga automáticamente desde Firebase al cargar la página:
- Solo muestra slides activos
- Se ordenan por el campo `orden`
- Soporta imágenes de fondo con overlay oscuro

### Publicaciones
Las publicaciones se cargan en la sección "Últimas Publicaciones":
- Muestra las 6 más recientes
- Ordenadas por fecha descendente
- Incluye imagen, título y extracto del contenido

### Precios
Los precios se actualizan dinámicamente en la sección de simulacros.

### Testimonios
Los testimonios se cargan en la sección correspondiente con las estrellas de calificación.

## Archivos Creados

1. **Secciones/Gestion-Contenido.html** - Página principal del panel
2. **Elementos/css/gestion-contenido.css** - Estilos del panel
3. **Elementos/js/gestion-contenido.js** - Lógica del panel

## Archivos Modificados

1. **Secciones/Panel_Admin.html** - Agregada tarjeta de Gestión de Contenido
2. **Elementos/js/panel-admin.js** - Agregada navegación a Gestión de Contenido
3. **Elementos/js/landing.js** - Carga dinámica de contenido desde Firebase
4. **Elementos/css/landing.css** - Soporte para imágenes de fondo en carrusel

### 5. Gestión de Videos Educativos
Administra los videos que aparecen en la sección de videos educativos.

**Características:**
- Agregar videos de YouTube u otras plataformas
- Editar videos existentes
- Activar/desactivar videos
- Eliminar videos
- Subir miniaturas personalizadas (opcional)

**Campos:**
- **Título**: Título del video
- **Descripción**: Descripción breve (opcional)
- **URL del Video**: Enlace de YouTube, Vimeo u otra plataforma
- **Miniatura**: Imagen personalizada (opcional, se usa la de YouTube por defecto)
- **Activo**: Checkbox para activar/desactivar el video

**Nota:** Si usas un enlace de YouTube, el video se mostrará embebido directamente en la página.

## Inicialización de Contenido

### Primera vez
Si es la primera vez que usas el sistema, puedes inicializar contenido de ejemplo:

1. Abre el archivo `init-content.html` en tu navegador
2. Haz clic en "Inicializar Contenido"
3. Espera a que se complete el proceso
4. Vuelve a la página principal para ver el contenido

Esto creará:
- 3 slides de carrusel con imágenes de ejemplo
- 3 publicaciones
- Precios configurados
- 3 testimonios
- 3 videos de ejemplo

## Estructura de Firebase

### Colección: `videos`
```javascript
{
  titulo: string,
  descripcion: string,
  url: string (URL del video),
  thumbnail: string (URL de ImgBB, opcional),
  activo: boolean,
  orden: number,
  fechaCreacion: timestamp,
  fechaActualizacion: timestamp
}
```

## Notas Importantes

- Solo los administradores pueden acceder al panel de gestión
- Las imágenes se suben a ImgBB antes de guardar en Firebase
- Se muestra un overlay de carga durante las operaciones
- Todas las acciones requieren confirmación antes de eliminar
- El contenido se actualiza en tiempo real en la web principal
- Los videos de YouTube se muestran embebidos automáticamente
- Si no ves el contenido en la página principal, asegúrate de haber inicializado los datos

## Solución de Problemas

### El contenido no aparece en la página principal
1. Verifica que Firebase esté configurado correctamente
2. Abre la consola del navegador (F12) y busca errores
3. Asegúrate de que los datos existen en Firebase
4. Usa `init-content.html` para crear datos de ejemplo
5. Recarga la página con Ctrl+F5 (limpia caché)

### Las imágenes no se suben
1. Verifica que la API Key de ImgBB sea válida
2. Comprueba que el archivo sea una imagen válida
3. Revisa la consola del navegador para ver errores específicos

## Soporte

Para cualquier problema o sugerencia, contactar al equipo de desarrollo.
