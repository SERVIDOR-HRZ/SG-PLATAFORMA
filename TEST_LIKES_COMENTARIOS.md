# Test del Sistema de Likes y Comentarios

## ✅ Checklist de Verificación

### Antes de Empezar
- [ ] Firebase está configurado correctamente
- [ ] Las colecciones `publicacionLikes` y `publicacionComentarios` existen
- [ ] Las reglas de seguridad están configuradas
- [ ] Hay al menos una publicación en la colección `publicaciones`
- [ ] El usuario ha iniciado sesión

### Test 1: Cargar Publicaciones
1. [ ] Abre la landing page (index.html)
2. [ ] Verifica que las publicaciones se cargan
3. [ ] Verifica que cada publicación tiene:
   - [ ] Imagen
   - [ ] Título
   - [ ] Descripción
   - [ ] Botón de like (corazón)
   - [ ] Botón de comentarios (chat)
   - [ ] Contadores (números junto a los iconos)

**Errores esperados:** Ninguno
**Si hay error:** Verifica que la colección `publicaciones` tenga documentos

### Test 2: Sistema de Likes (Sin Sesión)
1. [ ] Cierra sesión (si estás logueado)
2. [ ] Haz clic en el corazón de una publicación
3. [ ] Debe aparecer un alert: "Debes iniciar sesión para dar like"
4. [ ] Debe redirigir a la página de login

**Errores esperados:** Ninguno
**Si hay error:** Verifica que `sessionStorage` esté vacío

### Test 3: Sistema de Likes (Con Sesión)
1. [ ] Inicia sesión como estudiante o admin
2. [ ] Ve a la landing page
3. [ ] Haz clic en el corazón de una publicación
4. [ ] El corazón debe cambiar de vacío a lleno
5. [ ] El contador debe aumentar en 1
6. [ ] Haz clic de nuevo en el corazón
7. [ ] El corazón debe cambiar de lleno a vacío
8. [ ] El contador debe disminuir en 1

**Verificar en Firebase:**
- [ ] Ve a Firestore → `publicacionLikes`
- [ ] Debe haber un documento con ID: `{tu_email}_{id_publicacion}`
- [ ] El documento debe tener:
  - `publicacionId`: ID de la publicación
  - `usuarioId`: Tu email
  - `nombreUsuario`: Tu nombre
  - `fecha`: Timestamp

**Errores esperados:** Ninguno
**Si hay error:** 
- Verifica que `sessionStorage.currentUser` exista
- Verifica las reglas de seguridad de Firebase
- Revisa la consola del navegador

### Test 4: Sistema de Comentarios (Sin Sesión)
1. [ ] Cierra sesión
2. [ ] Haz clic en el icono de comentarios
3. [ ] Debe aparecer un alert: "Debes iniciar sesión para ver los comentarios"
4. [ ] Debe redirigir a la página de login

**Errores esperados:** Ninguno

### Test 5: Abrir Modal de Comentarios (Con Sesión)
1. [ ] Inicia sesión
2. [ ] Haz clic en el icono de comentarios de una publicación
3. [ ] Debe abrirse un modal con:
   - [ ] Título de la publicación
   - [ ] Imagen de la publicación
   - [ ] Contenido completo
   - [ ] Sección de comentarios
   - [ ] Campo de texto para nuevo comentario
   - [ ] Botón "Publicar Comentario"
   - [ ] Botón X para cerrar (arriba a la derecha)

**Errores esperados:** Ninguno
**Si hay error:** Verifica que el modal existe en el HTML

### Test 6: Publicar Comentario
1. [ ] Con el modal abierto, escribe un comentario
2. [ ] Haz clic en "Publicar Comentario"
3. [ ] El modal debe cerrarse y reabrirse
4. [ ] Tu comentario debe aparecer en la lista
5. [ ] El comentario debe mostrar:
   - [ ] Tu inicial en un círculo
   - [ ] Tu nombre
   - [ ] Fecha y hora
   - [ ] El texto del comentario
6. [ ] El contador de comentarios debe aumentar en 1

**Verificar en Firebase:**
- [ ] Ve a Firestore → `publicacionComentarios`
- [ ] Debe haber un nuevo documento con:
  - `publicacionId`: ID de la publicación
  - `usuarioId`: Tu email
  - `nombreUsuario`: Tu nombre
  - `comentario`: El texto que escribiste
  - `fecha`: Timestamp

**Errores esperados:** Ninguno
**Si hay error:**
- Verifica que el campo de texto no esté vacío
- Verifica las reglas de seguridad
- Revisa la consola del navegador

### Test 7: Ver Múltiples Comentarios
1. [ ] Publica varios comentarios en la misma publicación
2. [ ] Abre el modal de comentarios
3. [ ] Los comentarios deben aparecer ordenados (más recientes primero)
4. [ ] Cada comentario debe tener su propia tarjeta
5. [ ] Si hay muchos comentarios, debe aparecer scroll

**Errores esperados:** Ninguno

### Test 8: Cerrar Modal
1. [ ] Abre el modal de comentarios
2. [ ] Haz clic en la X (arriba a la derecha)
3. [ ] El modal debe cerrarse
4. [ ] Abre el modal de nuevo
5. [ ] Haz clic fuera del modal (en el fondo oscuro)
6. [ ] El modal debe cerrarse

**Errores esperados:** Ninguno

### Test 9: Persistencia de Datos
1. [ ] Da like a una publicación
2. [ ] Comenta en una publicación
3. [ ] Recarga la página (F5)
4. [ ] El like debe seguir activo (corazón lleno)
5. [ ] El contador de likes debe ser correcto
6. [ ] El contador de comentarios debe ser correcto
7. [ ] Abre el modal de comentarios
8. [ ] Tu comentario debe seguir ahí

**Errores esperados:** Ninguno
**Si hay error:** Los datos no se están guardando en Firebase

### Test 10: Múltiples Usuarios
1. [ ] Usuario A da like a una publicación
2. [ ] Usuario A comenta en la publicación
3. [ ] Cierra sesión
4. [ ] Inicia sesión como Usuario B
5. [ ] Ve a la landing page
6. [ ] Los contadores deben mostrar los likes y comentarios de Usuario A
7. [ ] Usuario B puede dar like (contador aumenta)
8. [ ] Usuario B puede comentar
9. [ ] Ambos comentarios deben aparecer en el modal

**Errores esperados:** Ninguno

## 🐛 Errores Comunes y Soluciones

### Error: "Cannot read property 'querySelector' of null"
**Causa:** El modal no existe en el HTML
**Solución:** Verifica que index.html tenga el div con id="postModal"

### Error: "Permission denied"
**Causa:** Las reglas de Firebase no permiten la operación
**Solución:** Revisa las reglas de seguridad en Firebase Console

### Error: "Cannot read property 'usuario' of null"
**Causa:** El usuario no está logueado correctamente
**Solución:** 
- Verifica que sessionStorage.currentUser exista
- Verifica que tenga la propiedad 'usuario'
- Inicia sesión de nuevo

### Error: "The query requires an index"
**Causa:** Firebase necesita un índice compuesto
**Solución:** 
- El código actual NO debería dar este error
- Si lo ves, haz clic en el enlace del error para crear el índice
- O espera, el código ordena en el cliente

### Los contadores no se actualizan
**Causa:** Las colecciones no existen o están vacías
**Solución:**
- Crea las colecciones en Firebase
- Da like o comenta para crear documentos
- Recarga la página

### El modal no se cierra
**Causa:** Los event listeners no se inicializaron
**Solución:**
- Verifica que setupModalListeners() se llame en DOMContentLoaded
- Recarga la página
- Revisa la consola para errores

## 📊 Resultados Esperados

### Después de todos los tests:
- ✅ Las publicaciones se cargan correctamente
- ✅ Los likes funcionan (dar y quitar)
- ✅ Los comentarios se publican correctamente
- ✅ Los contadores son precisos
- ✅ Los datos persisten después de recargar
- ✅ Múltiples usuarios pueden interactuar
- ✅ El modal funciona correctamente
- ✅ No hay errores en la consola

### En Firebase Console debes ver:
- Documentos en `publicacionLikes`
- Documentos en `publicacionComentarios`
- Cada documento con todos sus campos
- Timestamps correctos

## 🎯 Métricas de Éxito

- **Tiempo de carga:** < 2 segundos
- **Tiempo de respuesta al dar like:** < 500ms
- **Tiempo de respuesta al comentar:** < 1 segundo
- **Errores en consola:** 0
- **Tasa de éxito de operaciones:** 100%

## 📝 Notas

- Si un test falla, detente y soluciona antes de continuar
- Revisa siempre la consola del navegador (F12)
- Verifica Firebase Console después de cada operación
- Prueba con diferentes usuarios
- Prueba con diferentes navegadores

---

**Fecha de última actualización:** Noviembre 2024
**Versión del sistema:** 1.0
