# Cambios realizados - Eliminación de Gestión de Contenido

## Archivos eliminados

| Archivo | Descripción |
|---------|-------------|
| `Secciones/Gestion-Contenido.html` | Página principal de gestión de contenido web (carrusel, publicaciones, simulacros, testimonios, videos) |
| `Elementos/css/gestion-contenido.css` | Estilos de la sección de gestión de contenido |
| `Elementos/js/gestion-contenido.js` | Lógica JavaScript de la sección de gestión de contenido |

## Referencias eliminadas

- `Secciones/Panel_Admin.html`: Se removió la tarjeta/card que enlazaba a "Gestión de Contenido" desde el panel de administrador.
- `Elementos/js/panel-admin.js`: Se removió el case `'contenido'` del switch de navegación que redirigía a `Gestion-Contenido.html`.

## Motivo

Se eliminó toda la sección de Gestión de Contenido del proyecto por solicitud del usuario. Esta sección permitía administrar el contenido visible en la landing page (carrusel de imágenes, publicaciones/blog, simulacros, testimonios de estudiantes y videos educativos).
