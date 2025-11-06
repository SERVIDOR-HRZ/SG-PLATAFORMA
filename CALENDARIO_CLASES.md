# 📅 Sistema de Calendario de Clases

## Descripción
Sistema de calendario integrado en el panel de administración que permite a los profesores programar clases para sus asignaturas. Las clases programadas se muestran automáticamente como anuncios en el aula correspondiente.

## Características Implementadas

### 1. Vista de Calendario Mensual (Estilo Google Calendar)
- Calendario visual mensual completo
- Todos los días del mes visibles
- Navegación entre meses (anterior/siguiente)
- Clases mostradas con colores según la materia
- Click en cualquier día para crear nueva clase
- Día actual resaltado

### 2. Vista de Lista
- Lista completa de clases programadas
- Información detallada de cada clase
- Botón para eliminar clases
- Enlaces a clases virtuales (si están disponibles)

### 3. Programación y Edición de Clases
- Formulario modal para crear y editar clases
- Campos:
  - Materia (solo las asignadas al profesor)
  - Título de la clase
  - Descripción
  - Fecha y hora
  - Duración (30, 45, 60, 90, 120 minutos)
  - Enlace opcional (Google Meet, Zoom, etc.)
- **Edición de clases**: Click en el botón de editar o en la clase en el calendario
- Al editar una clase, se actualiza automáticamente el anuncio en el aula

### 4. Control de Acceso
- **Superusuarios**: Pueden crear clases para todas las materias
- **Profesores**: Solo pueden crear clases para sus asignaturas asignadas
- Validación automática de permisos

### 5. Integración con Aulas
- Al crear una clase, se genera automáticamente un anuncio en el aula correspondiente
- Al editar una clase, se actualiza el anuncio existente en el aula
- **Al eliminar una clase, se elimina también el anuncio del aula**
- El anuncio incluye:
  - Título de la clase
  - Tipología, unidad, tema
  - Tutor encargado
  - Fecha y horario completo
  - Duración
  - Descripción
  - **Botón destacado para unirse a la clase virtual** (si hay enlace)
- **Los anuncios de clases aparecen PRIMERO** en el aula, antes que otros anuncios

## Colores por Materia

- 🔵 **Matemáticas**: Azul (#2196F3)
- 🔴 **Lectura Crítica**: Rojo (#F44336)
- 🟠 **Ciencias Sociales**: Naranja (#FF9800)
- 🟢 **Ciencias Naturales**: Verde (#4CAF50)
- 🟣 **Inglés**: Morado (#9C27B0)

## Archivos Creados

1. **Secciones/Calendario.html** - Página principal del calendario
2. **Elementos/css/calendario.css** - Estilos del calendario
3. **Elementos/js/calendario.js** - Lógica del calendario

## Archivos Modificados

1. **Secciones/Panel_Admin.html** - Agregada tarjeta de Calendario
2. **Elementos/js/panel-admin.js** - Agregada navegación al calendario

## Estructura de Datos en Firebase

### Colección: `clases_programadas`
```javascript
{
  materia: "matematicas",
  titulo: "Introducción al Álgebra",
  descripcion: "Conceptos básicos de álgebra",
  fecha: "2025-11-10",
  hora: "14:00",
  duracion: 60,
  enlace: "https://meet.google.com/...",
  profesorId: "userId123",
  profesorNombre: "Juan Pérez",
  creadoEn: "2025-11-05T10:30:00.000Z"
}
```

### Colección: `anuncios` (generado automáticamente)
```javascript
{
  materia: "matematicas",
  titulo: "📅 Clase Programada: Introducción al Álgebra",
  contenido: "Se ha programado una nueva clase para el...",
  profesorId: "userId123",
  profesorNombre: "Juan Pérez",
  fecha: "2025-11-05T10:30:00.000Z",
  tipo: "clase"
}
```

## Uso

### Crear Clase:
1. Acceder al Panel de Administración
2. Click en la tarjeta "Calendario de Clases" (primera tarjeta)
3. Elegir entre vista de calendario mensual o lista
4. Click en cualquier día del calendario o botón "Nueva Clase"
5. Completar el formulario
6. La clase se programa y aparece automáticamente en el aula como primer anuncio

### Editar Clase:
1. En vista calendario: Click en la clase que deseas editar
2. En vista lista: Click en el botón de editar (lápiz)
3. Modificar los campos necesarios
4. Click en "Actualizar Clase"
5. El anuncio en el aula se actualiza automáticamente

### Eliminar Clase:
1. En vista lista: Click en el botón de eliminar (papelera)
2. Confirmar la eliminación
3. La clase y su anuncio en el aula se eliminan automáticamente

### Unirse a una Clase Virtual:
1. Los estudiantes ven el anuncio de la clase en el aula
2. Si la clase tiene un enlace virtual, aparece un botón destacado rojo
3. Click en "Unirse a la Clase Virtual" para abrir el enlace (Google Meet, Zoom, etc.)

## Responsive Design

- ✅ Desktop (1400px+)
- ✅ Tablet (768px - 1024px)
- ✅ Móvil (480px - 768px)
- ✅ Móvil pequeño (< 480px)

## Notas Técnicas

- El calendario usa la zona horaria local del navegador
- Las clases se almacenan en formato ISO (YYYY-MM-DD)
- La semana comienza en Lunes
- Los anuncios se crean automáticamente al programar una clase
- Los profesores solo ven sus asignaturas en el selector
- Los anuncios de tipo "clase" se ordenan primero en el aula
- El calendario muestra el mes completo (estilo Google Calendar)
- Los días de otros meses aparecen atenuados
