# Panel de Configuración de Usuario - Seamos Genios

## 📋 Descripción General

Se ha implementado un sistema completo de configuración de usuario que permite a cada usuario (tanto administradores como estudiantes) gestionar su información personal y personalizar su perfil con una foto.

## ✨ Características Implementadas

### 1. Foto de Perfil
- **Subida de Imágenes**: Los usuarios pueden subir una foto de perfil personalizada
- **API de imgBB**: Las imágenes se alojan en imgBB usando la misma API que las preguntas
- **Validaciones**: 
  - Tamaño máximo: 5MB
  - Formatos permitidos: JPG, PNG, GIF
- **Vista Previa**: La foto se muestra inmediatamente en el avatar del header
- **Eliminar Foto**: Los usuarios pueden eliminar su foto y volver al icono por defecto

### 2. Información Personal
Los usuarios pueden editar:
- Nombre completo
- Correo electrónico
- Teléfono

Campos de solo lectura (información del sistema):
- Documento de identidad
- Tipo de usuario
- Fecha de registro

### 3. Cambio de Contraseña
- Formulario seguro para cambiar contraseña
- Validaciones:
  - Verificación de contraseña actual
  - Longitud mínima de 6 caracteres
  - Confirmación de nueva contraseña
  - La nueva contraseña debe ser diferente a la actual
- Botones para mostrar/ocultar contraseñas

### 4. Menú Desplegable en Header
- **Avatar Clickeable**: Click en el avatar para ir a configuración
- **Menú Dropdown**: Botón de menú desplegable con opciones:
  - Configuración
  - Cerrar Sesión
- **Foto de Perfil en Header**: Se muestra la foto de perfil si existe

## 📁 Archivos Creados/Modificados

### Archivos Nuevos:
1. **`Secciones/panelUsuario.html`** - Página de configuración de usuario
2. **`Elementos/css/panel-usuario.css`** - Estilos del panel de configuración
3. **`Elementos/js/panel-usuario.js`** - Lógica del panel de configuración

### Archivos Modificados:
1. **`Secciones/Panel_Admin.html`** - Agregado menú desplegable y soporte para foto de perfil
2. **`Secciones/Panel_Estudiantes.html`** - Agregado menú desplegable y soporte para foto de perfil
3. **`Elementos/css/panel.css`** - Agregados estilos para avatar y menú desplegable
4. **`Elementos/js/panel-admin.js`** - Agregada funcionalidad para cargar foto de perfil
5. **`Elementos/js/panel-estudiante.js`** - Agregada funcionalidad para cargar foto de perfil

## 🔧 Configuración Técnica

### API de imgBB
```javascript
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
```

### Estructura de Datos en Firebase

Los datos del usuario se almacenan en la colección `usuarios` con los siguientes campos adicionales:

```javascript
{
  fotoPerfil: "https://i.ibb.co/...", // URL de la imagen
  fotoPerfilData: {
    url: "https://i.ibb.co/...",
    deleteUrl: "https://ibb.co/...",
    filename: "nombre-archivo.jpg"
  },
  telefono: "1234567890",
  fechaActualizacion: Timestamp
}
```

## 🎨 Diseño y UX

### Características de Diseño:
- **Responsive**: Totalmente adaptable a dispositivos móviles
- **Animaciones**: Transiciones suaves y animaciones modernas
- **Notificaciones**: Sistema de notificaciones para feedback al usuario
- **Loading States**: Indicadores de carga durante operaciones
- **Modales de Confirmación**: Para acciones importantes como eliminar foto o cerrar sesión

### Paleta de Colores:
- **Primario**: #007bff (Azul)
- **Éxito**: #28a745 (Verde)
- **Peligro**: #dc3545 (Rojo)
- **Advertencia**: #ffc107 (Amarillo)
- **Secundario**: #6c757d (Gris)

## 🚀 Cómo Usar

### Para Usuarios:

1. **Acceder al Panel de Configuración**:
   - Desde el panel principal, hacer click en el avatar
   - O usar el menú desplegable y seleccionar "Configuración"

2. **Cambiar Foto de Perfil**:
   - Click en "Cambiar Foto"
   - Seleccionar una imagen desde tu computadora
   - La imagen se sube automáticamente a imgBB
   - Se muestra inmediatamente en el perfil

3. **Editar Información**:
   - Modificar los campos deseados
   - Click en "Guardar Cambios"
   - Los cambios se reflejan inmediatamente

4. **Cambiar Contraseña**:
   - Ingresar contraseña actual
   - Ingresar nueva contraseña (mínimo 6 caracteres)
   - Confirmar nueva contraseña
   - Click en "Cambiar Contraseña"

### Para Desarrolladores:

#### Cargar Foto de Perfil en Otros Componentes:

```javascript
async function cargarFotoPerfil(usuarioId) {
    try {
        const db = window.firebaseDB;
        const usuarioDoc = await db.collection('usuarios').doc(usuarioId).get();
        
        if (usuarioDoc.exists) {
            const datosUsuario = usuarioDoc.data();
            if (datosUsuario.fotoPerfil) {
                // Usar datosUsuario.fotoPerfil
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
```

#### Subir Imagen a imgBB:

```javascript
async function subirImagenImgBB(archivo) {
    const formData = new FormData();
    formData.append('image', archivo);
    formData.append('key', IMGBB_API_KEY);

    const respuesta = await fetch(IMGBB_API_URL, {
        method: 'POST',
        body: formData
    });

    const resultado = await respuesta.json();
    
    if (resultado.success) {
        return {
            url: resultado.data.url,
            deleteUrl: resultado.data.delete_url,
            filename: resultado.data.image.filename
        };
    }
}
```

## 🔒 Seguridad

- **Validación de Sesión**: Solo usuarios autenticados pueden acceder
- **Validación de Email**: Se verifica que el email no esté en uso por otro usuario
- **Validación de Contraseña**: Se verifica la contraseña actual antes de cambiarla
- **Prevención de Cache**: Headers de seguridad para evitar problemas de caché
- **Sanitización**: Validación de datos antes de guardar en Firebase

## 📱 Compatibilidad

- ✅ Chrome (última versión)
- ✅ Firefox (última versión)
- ✅ Safari (última versión)
- ✅ Edge (última versión)
- ✅ Dispositivos móviles (iOS y Android)

## 🐛 Solución de Problemas

### La imagen no se sube:
- Verificar que el archivo sea menor a 5MB
- Verificar que sea un formato de imagen válido (JPG, PNG, GIF)
- Verificar conexión a internet

### La foto no aparece en el header:
- Hacer click en el avatar para refrescar
- Cerrar sesión e iniciar sesión nuevamente
- Verificar que la imagen se haya guardado en Firebase

### No puedo cambiar la contraseña:
- Verificar que la contraseña actual sea correcta
- Verificar que la nueva contraseña tenga al menos 6 caracteres
- Verificar que ambas contraseñas nuevas coincidan

## 🔄 Actualizaciones Futuras Sugeridas

- [ ] Recortar/redimensionar imágenes antes de subir
- [ ] Más campos de perfil (biografía, redes sociales, etc.)
- [ ] Temas de color personalizables
- [ ] Estadísticas de usuario
- [ ] Historial de actividad
- [ ] Configuración de notificaciones
- [ ] Exportar datos del usuario

## 📞 Soporte

Para cualquier problema o sugerencia, contactar al equipo de desarrollo de Seamos Genios.

---

**Desarrollado con ❤️ por Servidor HRZ**
**Fecha de Implementación: Octubre 2025**

