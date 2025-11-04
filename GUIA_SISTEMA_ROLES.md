# 🔐 Sistema de Roles y Permisos - Seamos Genios

## 📋 Descripción General

El sistema ahora cuenta con **3 niveles de roles** con diferentes permisos y capacidades:

---

## 👥 Roles Disponibles

### 1. 🎓 **ESTUDIANTE**
- **Descripción**: Usuario regular del sistema
- **Permisos**:
  - Acceso a su panel de estudiante
  - Ver y tomar pruebas asignadas
  - Acceder a aulas virtuales permitidas
  - Ver sus reportes y calificaciones
  - Editar su propio perfil

### 2. 🛡️ **ADMINISTRADOR** (Admin)
- **Descripción**: Gestor de estudiantes y contenido
- **Permisos**:
  - Acceso al panel de administración
  - **Crear, editar y eliminar estudiantes**
  - Gestionar contenido educativo
  - Crear y asignar pruebas
  - Ver reportes de estudiantes
  - Editar su propio perfil
  - **NO puede editar otros administradores**
  - **NO puede crear superusuarios**

### 3. 👑 **SUPERUSUARIO** (Superuser)
- **Descripción**: Administrador con acceso total al sistema
- **Permisos**:
  - **Acceso total al sistema**
  - Crear, editar y eliminar **cualquier tipo de usuario**
  - Gestionar administradores
  - Crear otros superusuarios
  - Cambiar roles de usuarios
  - Todas las funciones de administrador
  - Control total sobre permisos

---

## 🔄 Cómo Funciona el Sistema

### Autenticación y Sesión
```javascript
// Al iniciar sesión, el sistema guarda:
{
  id: "usuario123",
  nombre: "Juan Pérez",
  email: "juan@ejemplo.com",
  tipoUsuario: "admin",
  rol: "superusuario"  // Nuevo campo
}
```

### Verificación de Permisos

#### En la Gestión de Usuarios:
- **Superusuario**: Ve y puede editar TODOS los usuarios
- **Admin**: Solo ve y puede editar estudiantes (no otros admins)
- **Estudiante**: No tiene acceso a esta sección

#### En la Tabla de Usuarios:
```
┌─────────────────┬──────────────┬─────────────┐
│ Usuario         │ Rol          │ Acciones    │
├─────────────────┼──────────────┼─────────────┤
│ María López     │ SUPER        │ ✓ Editar    │
│ Carlos Admin    │ ADM          │ ✓ Editar*   │
│ Ana Estudiante  │ EST          │ ✓ Editar    │
└─────────────────┴──────────────┴─────────────┘

* Solo superusuarios pueden editar administradores
```

---

## 🎨 Identificación Visual

### Badges de Rol:
- **SUPER** - Morado con animación de pulso
- **ADM** - Rojo
- **EST** - Azul

### Indicadores:
- 🔒 **Sin permisos** - Aparece cuando un admin intenta editar otro admin

---

## 📝 Crear Usuarios con Roles

### Crear un Estudiante:
1. Ir a "Gestión de Usuarios"
2. Clic en "Crear Usuario"
3. Seleccionar "Estudiante"
4. Llenar todos los campos requeridos
5. Guardar

### Crear un Administrador (Solo Superusuario):
1. Ir a "Gestión de Usuarios"
2. Clic en "Crear Usuario"
3. Seleccionar "Administrador"
4. **Aparecerá selector de nivel de permisos**:
   - Administrador (gestiona estudiantes)
   - Superusuario (acceso total)
5. Llenar campos básicos
6. Guardar

### Crear un Superusuario (Dos Métodos):

#### Método 1: Desde Gestión de Usuarios (Solo Superusuario):
1. Seguir pasos de crear administrador
2. En "Nivel de Permisos" seleccionar **"Superusuario"**
3. Guardar

#### Método 2: Registro Especial de Superusuario:
1. Acceder a: `Secciones/registro-superusuario.html`
2. Ingresar el **código de acceso especial**:
   ```
   SG-SUPER-2025-MASTER-ACCESS-KEY
   ```
3. Llenar información básica:
   - Nombre completo
   - Correo electrónico
   - Correo de recuperación
   - Teléfono
   - Contraseña (mínimo 8 caracteres)
4. Hacer clic en "Crear Cuenta de Superusuario"
5. Guardar el código de recuperación generado
6. Iniciar sesión con las credenciales creadas

**⚠️ IMPORTANTE**: El código de acceso es sensible y solo debe compartirse con personal autorizado.

---

## 🔧 Editar Roles de Usuarios

### Cambiar Rol de un Administrador:
1. **Solo superusuarios** pueden hacer esto
2. Abrir modal de edición del administrador
3. Aparecerá selector "Nivel de Permisos"
4. Cambiar entre:
   - Administrador
   - Superusuario
5. Guardar cambios

---

## 🚫 Restricciones de Seguridad

### Administradores NO pueden:
- ❌ Editar otros administradores
- ❌ Editar superusuarios
- ❌ Crear superusuarios
- ❌ Cambiar roles de usuarios
- ❌ Ver selector de roles

### Superusuarios pueden:
- ✅ Todo lo anterior
- ✅ Gestionar cualquier usuario
- ✅ Crear y modificar roles
- ✅ Eliminar cualquier usuario (con código de seguridad)

---

## 💾 Estructura en Firebase

### Documento de Usuario:
```javascript
{
  nombre: "Juan Pérez",
  usuario: "juan@ejemplo.com",
  password: "******",
  tipoUsuario: "admin",
  rol: "superusuario",  // Nuevo campo
  activo: true,
  telefono: "3001234567",
  emailRecuperacion: "recuperacion@ejemplo.com",
  codigoRecuperacion: "ABC12345",
  fechaCreacion: Timestamp,
  fechaUltimaActualizacion: Timestamp
}
```

### Valores de `rol`:
- `"estudiante"` - Para estudiantes
- `"admin"` - Para administradores normales
- `"superusuario"` - Para superusuarios

---

## 🔐 Código de Seguridad para Eliminación

Para eliminar cualquier usuario, se requiere el código de seguridad:

```
SG-PG-2025-OWH346OU6634OSDFS4YE431FSD325
```

**Nota**: Solo superusuarios pueden eliminar administradores.

---

## 📊 Estadísticas en el Dashboard

El sistema cuenta automáticamente:
- Total de usuarios
- Total de administradores (incluye superusuarios)
- Total de estudiantes
- Usuarios activos

---

## 🎯 Casos de Uso

### Caso 1: Admin intenta editar otro Admin
```
❌ Resultado: Mensaje "No tienes permisos para editar este administrador"
```

### Caso 2: Superusuario edita Admin
```
✅ Resultado: Modal de edición con selector de rol visible
```

### Caso 3: Admin crea estudiante
```
✅ Resultado: Formulario completo sin selector de rol
```

### Caso 4: Superusuario crea admin
```
✅ Resultado: Formulario con selector de rol (Admin/Superusuario)
```

---

## 🔄 Migración de Usuarios Existentes

Los usuarios existentes sin campo `rol` se manejan automáticamente:
- Si `tipoUsuario === "admin"` → se considera `rol: "admin"`
- Si `tipoUsuario === "estudiante"` → se considera `rol: "estudiante"`

Para actualizar usuarios existentes a superusuarios:
1. Iniciar sesión como superusuario
2. Editar el usuario administrador
3. Cambiar rol a "Superusuario"
4. Guardar

---

## 🛠️ Archivos Modificados

### JavaScript:
- `Elementos/js/login.js` - Manejo de roles en login
- `Elementos/js/usuarios.js` - Lógica de permisos y roles

### HTML:
- `Secciones/Usuarios.html` - Selectores de rol en modales

### CSS:
- `Elementos/css/usuarios.css` - Estilos para badges y selectores

---

## 📞 Soporte y Creación del Primer Superusuario

### Opción 1: Registro Especial (Recomendado)
Usar la página de registro especial: `Secciones/registro-superusuario.html`

**Código de Acceso**:
```
SG-SUPER-2025-MASTER-ACCESS-KEY
```

### Opción 2: Modificación Directa en Firebase
Si necesitas convertir un usuario existente en superusuario:

1. Ir a Firebase Console
2. Seleccionar colección `usuarios`
3. Editar usuario administrador
4. Agregar/modificar campo: `rol: "superusuario"`
5. Guardar

### Opción 3: Desde Gestión de Usuarios
Si ya existe un superusuario, puede crear otros desde el panel de administración.

---

## ✅ Checklist de Implementación

- [x] Sistema de roles implementado
- [x] Verificación de permisos en frontend
- [x] Badges visuales diferenciados
- [x] Selector de rol en creación
- [x] Selector de rol en edición
- [x] Restricciones de edición
- [x] Compatibilidad con usuarios existentes
- [x] Estilos CSS completos
- [x] Documentación completa

---

**Versión**: 1.0  
**Fecha**: Noviembre 2024  
**Desarrollado por**: Tecnología HRZ
