# Configuración de Firebase para Likes y Comentarios

## 📋 Colecciones Necesarias

Para que el sistema de likes y comentarios funcione correctamente, necesitas crear las siguientes colecciones en Firebase Firestore:

### 1. Colección: `publicacionLikes`

**Estructura del documento:**
```javascript
{
  publicacionId: string,      // ID de la publicación
  usuarioId: string,          // Email del usuario
  nombreUsuario: string,      // Nombre completo del usuario
  fecha: timestamp            // Fecha del like
}
```

**ID del documento:** `{usuarioId}_{publicacionId}`
Ejemplo: `usuario@email.com_abc123`

**Índices necesarios:**
- Campo único: `publicacionId` (Ascendente)

### 2. Colección: `publicacionComentarios`

**Estructura del documento:**
```javascript
{
  publicacionId: string,      // ID de la publicación
  usuarioId: string,          // Email del usuario
  nombreUsuario: string,      // Nombre completo del usuario
  comentario: string,         // Texto del comentario
  fecha: timestamp            // Fecha del comentario
}
```

**Índices necesarios (IMPORTANTE):**
Debes crear un índice compuesto para poder ordenar los comentarios:
- Campo 1: `publicacionId` (Ascendente)
- Campo 2: `fecha` (Descendente)

## 🔧 Pasos para Configurar

### Paso 1: Crear las Colecciones

1. Ve a Firebase Console → Firestore Database
2. Haz clic en "Iniciar colección"
3. Nombre: `publicacionLikes`
4. Agrega un documento de prueba (puedes eliminarlo después)
5. Repite para `publicacionComentarios`

### Paso 2: Configurar Índices (OPCIONAL)

**NOTA IMPORTANTE:** El código actual NO requiere índices compuestos porque ordena los comentarios en el cliente. Sin embargo, si quieres mejorar el rendimiento para muchos comentarios, puedes crear el índice:

#### Para `publicacionComentarios` (Opcional):

1. Ve a la pestaña "Índices" en Firestore
2. Haz clic en "Crear índice"
3. Colección: `publicacionComentarios`
4. Campos a indexar:
   - `publicacionId`: Ascendente
   - `fecha`: Descendente
5. Estado de consulta: Habilitado
6. Haz clic en "Crear"

**Alternativa rápida:** Si ves el error en la consola, Firebase te dará un enlace directo para crear el índice automáticamente. Solo haz clic en ese enlace.

**Nota:** Firebase puede tardar unos minutos en crear el índice. Mientras tanto, el sistema funcionará ordenando los comentarios en el cliente.

### Paso 3: Configurar Reglas de Seguridad

Agrega estas reglas en Firestore Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para likes
    match /publicacionLikes/{likeId} {
      // Permitir lectura a todos
      allow read: if true;
      
      // Permitir crear/eliminar solo si el usuario está autenticado
      // y el ID del documento coincide con el patrón usuarioId_publicacionId
      allow create, delete: if request.auth != null 
        && likeId == request.auth.token.email + '_' + request.resource.data.publicacionId;
    }
    
    // Reglas para comentarios
    match /publicacionComentarios/{commentId} {
      // Permitir lectura a todos
      allow read: if true;
      
      // Permitir crear solo si el usuario está autenticado
      allow create: if request.auth != null 
        && request.resource.data.usuarioId == request.auth.token.email;
      
      // Permitir actualizar/eliminar solo al autor del comentario
      allow update, delete: if request.auth != null 
        && resource.data.usuarioId == request.auth.token.email;
    }
    
    // Reglas para publicaciones (lectura pública)
    match /publicaciones/{publicacionId} {
      allow read: if true;
      allow write: if request.auth != null; // Solo usuarios autenticados pueden escribir
    }
  }
}
```

## 🧪 Probar la Configuración

### Test 1: Verificar Likes

1. Inicia sesión en la plataforma
2. Ve a la landing page
3. Haz clic en el ícono de corazón de una publicación
4. Ve a Firebase Console → Firestore
5. Verifica que se creó un documento en `publicacionLikes`

### Test 2: Verificar Comentarios

1. Haz clic en el ícono de comentarios de una publicación
2. Escribe un comentario y publícalo
3. Ve a Firebase Console → Firestore
4. Verifica que se creó un documento en `publicacionComentarios`
5. Verifica que el comentario aparece en el modal

### Test 3: Verificar Contadores

1. Recarga la página
2. Verifica que los contadores de likes y comentarios sean correctos
3. Da like a varias publicaciones
4. Verifica que los contadores se actualicen

## 🔍 Consultas Útiles en Firebase Console

### Ver todos los likes de una publicación:
```
Colección: publicacionLikes
Filtro: publicacionId == "ID_DE_LA_PUBLICACION"
```

### Ver todos los comentarios de una publicación:
```
Colección: publicacionComentarios
Filtro: publicacionId == "ID_DE_LA_PUBLICACION"
Ordenar por: fecha (descendente)
```

### Ver todas las interacciones de un usuario:
```
Colección: publicacionLikes
Filtro: usuarioId == "email@usuario.com"
```

## ⚠️ Errores Comunes y Soluciones

### Error: "Missing or insufficient permissions"
**Solución:** Verifica las reglas de seguridad en Firestore Rules

### Error: "The query requires an index"
**Solución:** 
1. Firebase te dará un enlace en el error
2. Haz clic en el enlace para crear el índice automáticamente
3. O créalo manualmente siguiendo el Paso 2

### Error: "Cannot read property 'usuario' of null"
**Solución:** El usuario no ha iniciado sesión correctamente. Verifica que `sessionStorage` contenga `currentUser`

### Los contadores no se actualizan
**Solución:** 
1. Verifica que las colecciones existan
2. Verifica que los documentos se estén creando correctamente
3. Revisa la consola del navegador para errores

## 📊 Monitoreo y Análisis

### Métricas Importantes:

1. **Total de Likes por Publicación:**
   - Cuenta los documentos en `publicacionLikes` con el mismo `publicacionId`

2. **Total de Comentarios por Publicación:**
   - Cuenta los documentos en `publicacionComentarios` con el mismo `publicacionId`

3. **Usuarios Más Activos:**
   - Cuenta los documentos por `usuarioId` en ambas colecciones

4. **Publicaciones Más Populares:**
   - Ordena por cantidad de likes y comentarios

## 🔐 Consideraciones de Seguridad

1. **Validación del lado del servidor:** Las reglas de Firestore validan que solo el usuario autenticado pueda crear likes/comentarios
2. **IDs únicos:** Los likes usan un ID compuesto para evitar duplicados
3. **Timestamps del servidor:** Se usa `serverTimestamp()` para evitar manipulación de fechas
4. **Sanitización:** Considera agregar validación adicional para el contenido de los comentarios

## 📈 Optimización

### Para mejorar el rendimiento:

1. **Caché de contadores:** Considera guardar los contadores en el documento de la publicación
2. **Paginación:** Implementa paginación para comentarios si hay muchos
3. **Lazy loading:** Carga los comentarios solo cuando se abre el modal
4. **Índices compuestos:** Asegúrate de tener todos los índices necesarios

## 🆘 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs de Firebase Console
3. Verifica que todas las colecciones e índices estén creados
4. Verifica las reglas de seguridad

---

**Última actualización:** Noviembre 2024
**Versión:** 1.0
