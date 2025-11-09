# Sistema de Likes y Comentarios - Seamos Genios

## 📋 Descripción General

Se ha implementado un sistema completo de likes y comentarios para las publicaciones en la landing page. Solo los usuarios que han iniciado sesión (estudiantes o administradores) pueden interactuar con las publicaciones.

## 🔥 Características Implementadas

### 1. Sistema de Likes
- ✅ Los usuarios pueden dar "like" a las publicaciones
- ✅ El like se guarda en Firebase en la colección `publicacionLikes`
- ✅ El contador de likes se actualiza en tiempo real
- ✅ El usuario puede quitar su like haciendo clic nuevamente
- ✅ El ícono cambia de corazón vacío a corazón lleno cuando se da like
- ✅ Animación visual al dar like

### 2. Sistema de Comentarios
- ✅ Los usuarios pueden comentar en las publicaciones
- ✅ Los comentarios se guardan en Firebase en la colección `publicacionComentarios`
- ✅ Los comentarios se muestran en orden cronológico (más recientes primero)
- ✅ Cada comentario muestra:
  - Avatar con inicial del usuario
  - Nombre del usuario
  - Fecha y hora del comentario
  - Texto del comentario
- ✅ El contador de comentarios se actualiza automáticamente

### 3. Control de Acceso
- ✅ Solo usuarios con sesión iniciada pueden dar likes
- ✅ Solo usuarios con sesión iniciada pueden comentar
- ✅ Si un usuario no ha iniciado sesión, se le redirige a la página de login
- ✅ El sistema verifica la sesión usando `sessionStorage`

## 📊 Estructura de Firebase

### Colección: `publicacionLikes`
```javascript
{
  documentId: "usuario@email.com_publicacionId", // ID único
  publicacionId: "id_de_la_publicacion",
  usuarioId: "usuario@email.com",
  nombreUsuario: "Nombre del Usuario",
  fecha: Timestamp
}
```

### Colección: `publicacionComentarios`
```javascript
{
  publicacionId: "id_de_la_publicacion",
  usuarioId: "usuario@email.com",
  nombreUsuario: "Nombre del Usuario",
  comentario: "Texto del comentario",
  fecha: Timestamp
}
```

## 🎨 Interfaz de Usuario

### Tarjetas de Publicaciones
- Botón de like con contador
- Botón de comentarios con contador
- Animación al dar like (efecto de latido)
- Cambio de color cuando el usuario ha dado like

### Modal de Comentarios
- Diseño moderno con gradientes
- Lista de comentarios con scroll
- Avatar circular con inicial del usuario
- Fecha formateada en español
- Campo de texto para nuevo comentario
- Botón de envío con ícono
- Animaciones suaves de entrada/salida

## 🔧 Funciones Principales

### `loadPosts()`
Carga las publicaciones desde Firebase y cuenta los likes y comentarios de cada una.

### `createPostCard(post)`
Crea la tarjeta visual de cada publicación, verificando si el usuario actual ha dado like.

### `handleLike(postId)`
Maneja el evento de dar/quitar like:
1. Verifica que el usuario esté logueado
2. Consulta si ya existe un like del usuario
3. Agrega o elimina el like en Firebase
4. Actualiza la UI en tiempo real

### `openPostModal(postId)`
Abre el modal con los detalles de la publicación:
1. Carga la información de la publicación
2. Carga todos los comentarios
3. Muestra el formulario para nuevo comentario

### `submitComment(postId)`
Envía un nuevo comentario:
1. Valida que haya texto
2. Verifica la sesión del usuario
3. Guarda el comentario en Firebase
4. Actualiza el contador
5. Recarga el modal con el nuevo comentario

## 🎯 Flujo de Usuario

### Para dar Like:
1. Usuario hace clic en el ícono de corazón
2. Sistema verifica sesión
3. Si no hay sesión → Redirige a login
4. Si hay sesión → Guarda/elimina like en Firebase
5. Actualiza UI con animación

### Para Comentar:
1. Usuario hace clic en el ícono de comentarios
2. Sistema verifica sesión
3. Si no hay sesión → Redirige a login
4. Si hay sesión → Abre modal con comentarios
5. Usuario escribe comentario
6. Usuario hace clic en "Publicar Comentario"
7. Sistema guarda en Firebase
8. Modal se actualiza mostrando el nuevo comentario

## 🔒 Seguridad

- ✅ Validación de sesión en cada acción
- ✅ IDs únicos para evitar likes duplicados
- ✅ Timestamps del servidor para evitar manipulación de fechas
- ✅ Validación de campos vacíos
- ✅ Manejo de errores con try-catch

## 📱 Responsive Design

- ✅ Modal adaptable a dispositivos móviles
- ✅ Comentarios con scroll en pantallas pequeñas
- ✅ Botones táctiles optimizados
- ✅ Animaciones suaves en todos los dispositivos

## 🚀 Mejoras Futuras Sugeridas

1. **Notificaciones**: Notificar al autor cuando recibe likes o comentarios
2. **Editar/Eliminar**: Permitir editar o eliminar comentarios propios
3. **Respuestas**: Sistema de respuestas a comentarios (hilos)
4. **Reacciones**: Más tipos de reacciones además del like
5. **Moderación**: Panel de administración para moderar comentarios
6. **Menciones**: Poder mencionar a otros usuarios con @
7. **Emojis**: Selector de emojis para comentarios
8. **Reportar**: Opción para reportar comentarios inapropiados

## 📝 Notas Importantes

- Los contadores se actualizan en tiempo real sin necesidad de recargar la página
- El sistema es compatible con estudiantes y administradores
- Los datos persisten en Firebase y están disponibles en todos los dispositivos
- Las animaciones mejoran la experiencia de usuario sin afectar el rendimiento

## 🐛 Solución de Problemas

### Si los likes no se guardan:
1. Verificar que Firebase esté correctamente configurado
2. Verificar que la colección `publicacionLikes` tenga permisos de escritura
3. Revisar la consola del navegador para errores

### Si los comentarios no aparecen:
1. Verificar que la colección `publicacionComentarios` exista
2. Verificar que haya un índice compuesto en Firebase para `publicacionId` y `fecha`
3. Revisar los permisos de lectura en Firestore

### Si la sesión no se detecta:
1. Verificar que el usuario haya iniciado sesión correctamente
2. Verificar que `sessionStorage` contenga `currentUser`
3. Revisar que el formato del objeto de usuario sea correcto

---

**Desarrollado para Seamos Genios** 🎓
Sistema implementado: Noviembre 2024
