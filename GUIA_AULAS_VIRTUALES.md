# Guía de Aulas Virtuales - Seamos Genios

## Descripción General

El sistema de Aulas Virtuales es una plataforma educativa integrada que permite a administradores y estudiantes interactuar en un entorno similar a Google Classroom o un campus universitario virtual.

## Características Principales

### 1. Materias Disponibles
- **Matemáticas** - Álgebra, geometría, cálculo
- **Lectura Crítica** - Comprensión lectora y análisis
- **Ciencias Sociales** - Historia, geografía, ciudadanía
- **Ciencias Naturales** - Biología, química, física
- **Inglés** - Gramática, vocabulario, comprensión

### 2. Funcionalidades por Rol

#### Administradores
- Acceso completo a todas las aulas
- Crear y publicar anuncios
- Asignar tareas con fechas de entrega
- Subir materiales educativos (videos de YouTube, archivos de Drive, enlaces)
- Ver lista de estudiantes inscritos en cada materia
- Eliminar contenido publicado
- Gestionar permisos de acceso de estudiantes

#### Estudiantes
- Acceso solo a las aulas autorizadas por el administrador
- Ver anuncios del profesor
- Consultar tareas asignadas
- Acceder a materiales educativos
- Ver fechas de entrega de tareas

### 3. Secciones de Cada Aula

#### Anuncios
- Mensajes y comunicados del profesor
- Información importante sobre la materia
- Actualizaciones y recordatorios

#### Tareas
- Asignaciones con título y descripción
- Fecha y hora de entrega
- Estado: Pendiente, Completada, Vencida
- Indicador visual de tareas próximas a vencer

#### Materiales
- Videos de YouTube (embebidos)
- Archivos de Google Drive
- Enlaces externos
- Recursos de estudio y apoyo

#### Estudiantes (Solo Admin)
- Lista de estudiantes con acceso al aula
- Información de contacto
- Foto de perfil

## Gestión de Permisos

### Asignar Acceso a Aulas

1. Ir a **Panel Admin** → **Usuarios**
2. Hacer clic en el botón de **Editar** del estudiante
3. En la sección "Acceso a Aulas Virtuales", seleccionar las materias
4. Guardar cambios

### Permisos por Defecto
- Los nuevos estudiantes no tienen acceso a ninguna aula
- El administrador debe asignar permisos manualmente
- Los administradores tienen acceso completo a todas las aulas

## Estructura de Datos en Firebase

### Colección: `anuncios`
```javascript
{
  materia: 'matematicas',
  contenido: 'Texto del anuncio',
  autorId: 'userId',
  fecha: timestamp
}
```

### Colección: `tareas`
```javascript
{
  materia: 'lectura',
  titulo: 'Título de la tarea',
  descripcion: 'Descripción detallada',
  fechaEntrega: timestamp,
  fecha: timestamp
}
```

### Colección: `materiales`
```javascript
{
  materia: 'ingles',
  titulo: 'Nombre del material',
  tipo: 'youtube' | 'drive' | 'link',
  url: 'https://...',
  descripcion: 'Descripción opcional',
  fecha: timestamp
}
```

### Colección: `usuarios` (campo adicional)
```javascript
{
  // ... otros campos
  clasesPermitidas: ['matematicas', 'lectura', 'sociales']
}
```

## Navegación

### Desde Panel de Administrador
Panel Admin → Aulas Virtuales → Seleccionar Materia → Gestionar Contenido

### Desde Panel de Estudiante
Panel Estudiante → Aulas Virtuales → Ver Materias Permitidas → Acceder a Contenido

## Archivos del Sistema

### HTML
- `Secciones/Clases.html` - Vista de todas las aulas
- `Secciones/Aula.html` - Vista individual de cada aula

### CSS
- `Elementos/css/clases.css` - Estilos de la vista de aulas
- `Elementos/css/aula.css` - Estilos del aula individual

### JavaScript
- `Elementos/js/clases.js` - Lógica de la vista de aulas
- `Elementos/js/aula.js` - Lógica del aula individual

## Personalización

### Agregar Nueva Materia

1. En `clases.js`, agregar a `materiasDisponibles`:
```javascript
{
  id: 'nueva_materia',
  nombre: 'Nueva Materia',
  descripcion: 'Descripción de la materia',
  icon: 'bi-icon-name'
}
```

2. En `clases.css`, agregar color:
```css
.clase-card[data-materia="nueva_materia"] .clase-header {
  background: linear-gradient(135deg, #color1, #color2);
}
```

3. En `aula.js`, agregar al objeto `materias`:
```javascript
'nueva_materia': 'Nueva Materia'
```

4. En `Usuarios.html`, agregar checkbox en permisos:
```html
<label class="clase-checkbox">
  <input type="checkbox" name="clasePermiso" value="nueva_materia">
  <div class="checkbox-content">
    <i class="bi-icon-name"></i>
    <span>Nueva Materia</span>
  </div>
</label>
```

## Mejoras Futuras Sugeridas

1. **Sistema de Entregas**
   - Permitir a estudiantes subir archivos
   - Calificaciones y retroalimentación

2. **Notificaciones**
   - Alertas de nuevas tareas
   - Recordatorios de fechas de entrega

3. **Calendario**
   - Vista de calendario con todas las tareas
   - Integración con Google Calendar

4. **Foros de Discusión**
   - Comentarios en anuncios
   - Preguntas y respuestas

5. **Estadísticas**
   - Progreso del estudiante
   - Tareas completadas vs pendientes
   - Tiempo de estudio

## Soporte

Para problemas o sugerencias sobre el sistema de aulas virtuales, contactar al administrador del sistema.
