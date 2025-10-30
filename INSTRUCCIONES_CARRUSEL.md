# 🔧 Solución de Problemas del Carrusel

## Problema: El carrusel no se actualiza

### Pasos para solucionar:

#### 1. Verificar que Firebase tenga datos
```
1. Abre: test-carousel.html
2. Haz clic en "1. Probar Conexión Firebase"
3. Haz clic en "2. Cargar Datos del Carrusel"
```

**Si no hay datos:**
- Abre `init-content.html`
- Haz clic en "Inicializar Contenido"
- Espera a que termine
- Vuelve a `test-carousel.html` y verifica

#### 2. Verificar la consola del navegador
```
1. Abre index.html
2. Presiona F12 para abrir las herramientas de desarrollo
3. Ve a la pestaña "Console"
4. Busca mensajes como:
   - "DOM loaded, initializing..."
   - "Firebase ready"
   - "Carousel snapshot: X items"
   - "Carousel data loaded: [...]"
   - "Carousel HTML updated"
   - "Carousel initialized successfully"
```

**Si ves errores:**
- Copia el error completo
- Verifica que config.js tenga la configuración correcta de Firebase

#### 3. Limpiar caché del navegador
```
1. Presiona Ctrl + Shift + Delete (Windows) o Cmd + Shift + Delete (Mac)
2. Selecciona "Imágenes y archivos en caché"
3. Haz clic en "Borrar datos"
4. O simplemente presiona Ctrl + F5 para recargar sin caché
```

#### 4. Verificar que los items estén activos
En Firebase:
```
1. Ve a Firestore Database
2. Busca la colección "carouselItems"
3. Verifica que al menos un documento tenga:
   - activo: true
   - orden: 0, 1, 2, etc.
   - imagen: URL válida
```

#### 5. Usar el Panel de Administración
```
1. Inicia sesión como administrador
2. Ve a Panel de Administrador
3. Haz clic en "Gestión de Contenido"
4. Ve a la pestaña "Carrusel"
5. Verifica que haya slides y estén activos (ojo verde)
6. Si no hay slides, agrega uno nuevo con el botón "Agregar Slide"
```

## Estructura correcta de un item del carrusel en Firebase

```javascript
{
  titulo: "Bienvenido a Seamos Genios",
  descripcion: "Tu plataforma educativa",
  textoBoton: "Explorar",
  enlaceBoton: "#simulacro",
  imagen: "https://...",  // URL completa de la imagen
  activo: true,           // DEBE ser true para que se muestre
  orden: 0,               // 0, 1, 2, etc.
  fechaCreacion: timestamp
}
```

## Checklist de verificación

- [ ] Firebase está configurado correctamente
- [ ] Hay al menos un item en la colección `carouselItems`
- [ ] El item tiene `activo: true`
- [ ] El item tiene una URL de imagen válida
- [ ] La consola no muestra errores
- [ ] El caché del navegador está limpio
- [ ] Los archivos JS se están cargando correctamente

## Comandos útiles en la consola del navegador

```javascript
// Ver si Firebase está cargado
console.log(firebase);

// Ver items del carrusel manualmente
firebase.firestore().collection('carouselItems').get()
  .then(snap => console.log('Items:', snap.size));

// Ver un item específico
firebase.firestore().collection('carouselItems').get()
  .then(snap => snap.forEach(doc => console.log(doc.data())));
```

## Si nada funciona

1. Elimina todos los items del carrusel en Firebase
2. Abre `init-content.html`
3. Haz clic en "Inicializar Contenido"
4. Espera a que termine
5. Presiona Ctrl + F5 en `index.html`
6. Verifica en la consola que todo se cargue correctamente

## Contacto

Si el problema persiste, revisa:
- La configuración de Firebase en `Elementos/js/config.js`
- Los permisos de Firestore (deben permitir lectura)
- Que no haya errores de CORS en la consola
