# Sistema de Gamificación en Finanzas

## Descripción General

Sistema que permite asociar ingresos con estudiantes compradores, otorgándoles puntos e insignias especiales que se reflejan en su perfil de usuario.

## Características Implementadas

### 1. Asociación de Estudiantes a Ingresos
- Campo opcional para seleccionar estudiante comprador
- Solo disponible para ingresos (no para gastos)
- Lista de todos los estudiantes activos

### 2. Sistema de Puntos
- Puntos personalizables por cada compra
- Se acumulan en el perfil del estudiante
- Visible en la gestión de usuarios

### 3. Insignias Especiales
Insignias disponibles:
- 🎉 **Primera Compra**: Para el primer ingreso del estudiante
- ⭐ **Comprador Frecuente**: Para compradores regulares
- 💎 **Gran Compra**: Para compras significativas
- 👑 **Cliente VIP**: Para clientes especiales
- 🏆 **Apoyo Especial**: Por apoyo extraordinario
- 🌟 **Benefactor**: Para grandes benefactores

### 4. Mensajes Personalizados
- Mensaje opcional de agradecimiento
- Se muestra en el perfil del estudiante
- Historial de mensajes recibidos

## Estructura de Datos

### Movimiento con Gamificación
```javascript
{
  // Datos normales del movimiento
  tipo: 'ingreso',
  monto: 50000,
  categoria: 'Matrícula',
  descripcion: 'Pago de matrícula',
  
  // Datos de gamificación
  estudianteId: 'abc123',
  estudianteNombre: 'Juan Pérez',
  puntosOtorgados: 100,
  insignia: 'primera-compra',
  mensajeRecompensa: '¡Gracias por tu primera compra!',
  fechaRecompensa: timestamp
}
```

### Usuario con Recompensas
```javascript
{
  // Datos normales del usuario
  nombre: 'Juan Pérez',
  tipoUsuario: 'estudiante',
  
  // Datos de gamificación
  puntosAcumulados: 500,
  insignias: [
    {
      tipo: 'primera-compra',
      nombre: 'Primera Compra',
      icono: '🎉',
      fecha: timestamp,
      movimientoId: 'mov123',
      mensaje: '¡Gracias por tu primera compra!'
    }
  ],
  historialRecompensas: [
    {
      fecha: timestamp,
      puntos: 100,
      insignia: 'primera-compra',
      movimientoId: 'mov123',
      descripcion: 'Pago de matrícula'
    }
  ]
}
```

## Flujo de Uso

### Registrar Ingreso con Recompensa
1. Admin crea un nuevo ingreso
2. Selecciona estudiante comprador (opcional)
3. Al seleccionar estudiante, aparecen campos de recompensa
4. Ingresa puntos a otorgar
5. Selecciona insignia especial (opcional)
6. Escribe mensaje personalizado (opcional)
7. Al guardar:
   - Se registra el ingreso
   - Se actualizan puntos del estudiante
   - Se agrega insignia al perfil
   - Se guarda en historial de recompensas

### Visualización en Gestión de Usuarios
- Columna de puntos acumulados
- Insignias visibles en el perfil
- Historial de recompensas recibidas
- Filtro por estudiantes con más puntos

## Beneficios

1. **Motivación**: Incentiva a los estudiantes a participar
2. **Reconocimiento**: Valora el apoyo de los estudiantes
3. **Engagement**: Crea conexión con la institución
4. **Tracking**: Permite seguimiento de compradores frecuentes
5. **Personalización**: Mensajes únicos para cada estudiante

## Archivos Modificados

- `Secciones/Finanzas.html`: Modal con campos de gamificación
- `Elementos/js/finanzas-cuentas.js`: Lógica de recompensas
- `Elementos/js/usuarios.js`: Visualización de puntos e insignias
- `Elementos/css/finanzas.css`: Estilos para sección de gamificación
- `Elementos/css/usuarios.css`: Estilos para insignias en perfil

## Próximas Mejoras

- Ranking de estudiantes por puntos
- Canje de puntos por beneficios
- Logros automáticos por hitos
- Notificaciones de recompensas
- Estadísticas de gamificación
