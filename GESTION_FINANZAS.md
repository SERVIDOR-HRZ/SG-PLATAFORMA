# Gestión de Finanzas - Sistema de Pagos a Profesores

## Descripción General

El módulo de Gestión de Finanzas permite a los superadministradores gestionar los pagos semanales a profesores basados en las clases que han dictado. El sistema calcula automáticamente el pago según la tarifa por hora asignada a cada profesor.

## Características Principales

### 1. Control de Acceso
- **Solo Superusuarios**: El acceso a esta sección está restringido únicamente a usuarios con `rol: "superusuario"`
- El botón de "Gestión de Finanzas" solo aparece en el Panel de Admin para superusuarios
- Si un usuario sin permisos intenta acceder, será redirigido automáticamente al Panel de Admin

### 2. Tarifas por Hora
- Asignar y editar la tarifa por hora de cada profesor
- Las tarifas se almacenan en el perfil del profesor en Firestore
- Visualización clara de la tarifa actual de cada profesor

### 3. Pagos Semanales
- Cálculo automático de pagos basado en:
  - Número de clases dictadas en la semana
  - Horas totales trabajadas
  - Tarifa por hora del profesor
- Navegación por semanas (anterior/siguiente)
- Estados de pago: Pendiente o Pagado
- Registro de pagos con comprobante

### 4. Comprobantes de Pago
- Subida de imágenes de comprobantes usando ImgBB API
- Visualización de comprobantes en el historial
- Almacenamiento permanente de URLs de comprobantes

### 5. Historial de Pagos
- Registro completo de todos los pagos realizados
- Filtros por:
  - Profesor específico
  - Mes/año
- Información detallada de cada pago

## Estructura de Datos en Firestore

### Colección: `usuarios` (profesores)
```javascript
{
  nombre: "Nombre del Profesor",
  email: "profesor@example.com",
  tipoUsuario: "admin",
  rol: "profesor", // o "admin" para profesores con permisos administrativos
  tarifaPorHora: 50000, // Tarifa en COP
  tarifaActualizadaEn: Timestamp,
  tarifaActualizadaPor: "userId"
}
```

**Nota**: Los profesores en el sistema tienen `tipoUsuario: "admin"` y `rol: "profesor"` o `rol: "admin"`. Los superusuarios tienen `rol: "superusuario"`.

### Colección: `pagos`
```javascript
{
  profesorId: "userId",
  profesorNombre: "Nombre del Profesor",
  profesorEmail: "profesor@example.com",
  semanaInicio: Timestamp,
  semanaFin: Timestamp,
  clasesTotales: 10,
  horasTotales: 15.5,
  tarifaPorHora: 50000,
  totalPagado: 775000,
  comprobanteUrl: "https://i.ibb.co/...",
  notas: "Notas opcionales",
  pagadoPor: "adminUserId",
  pagadoPorNombre: "Admin Name",
  fechaPago: Timestamp,
  createdAt: Timestamp
}
```

### Colección: `clases`
```javascript
{
  tutorId: "profesorId",
  fecha: Timestamp,
  duracion: 90, // minutos
  // ... otros campos
}
```

## Flujo de Trabajo

### 1. Asignar Tarifa a Profesor
1. Ir a la pestaña "Tarifas por Hora"
2. Hacer clic en "Editar Tarifa" del profesor deseado
3. Ingresar la tarifa por hora en COP
4. Guardar cambios

### 2. Registrar Pago Semanal
1. Ir a la pestaña "Pagos Semanales"
2. Seleccionar la semana deseada usando los botones de navegación
3. El sistema muestra automáticamente:
   - Clases dictadas por cada profesor
   - Horas totales trabajadas
   - Total a pagar
4. Hacer clic en "Registrar Pago"
5. Subir comprobante de pago (imagen)
6. Agregar notas opcionales
7. Confirmar el pago

### 3. Consultar Historial
1. Ir a la pestaña "Historial de Pagos"
2. Usar filtros para buscar pagos específicos
3. Ver comprobantes haciendo clic en el ícono de ojo

## Cálculo de Pagos

```
Total a Pagar = Tarifa por Hora × Horas Totales

Donde:
- Horas Totales = Suma de duraciones de clases / 60
- Las clases se filtran por semana (Lunes a Domingo)
```

## API de ImgBB

### Configuración
```javascript
const IMGBB_API_KEY = '0d447185d3dc7cba69ee1c6df144f146';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
```

### Uso
- Los comprobantes se suben automáticamente al registrar un pago
- Las imágenes se almacenan permanentemente en ImgBB
- Se guarda la URL en Firestore para acceso futuro

## Seguridad

1. **Autenticación**: Verificación de usuario logueado
2. **Autorización**: Solo superadministradores pueden acceder
3. **Validación**: Verificación de datos antes de guardar
4. **Auditoría**: Registro de quién realizó cada pago y cuándo

## Archivos del Sistema

### HTML
- `Secciones/Finanzas.html` - Interfaz principal

### CSS
- `Elementos/css/finanzas.css` - Estilos del módulo

### JavaScript
- `Elementos/js/finanzas.js` - Lógica del módulo
- `Elementos/js/panel-admin.js` - Integración con panel de admin

## Notas Importantes

1. **Semanas**: El sistema considera la semana de Lunes a Domingo
2. **Cálculo automático**: Los pagos se calculan automáticamente basados en las clases registradas
3. **No duplicación**: El sistema previene registrar pagos duplicados para la misma semana
4. **Comprobantes obligatorios**: No se puede registrar un pago sin subir un comprobante
5. **Historial permanente**: Todos los pagos quedan registrados permanentemente

## Mejoras Futuras Sugeridas

1. Exportar reportes a PDF o Excel
2. Notificaciones automáticas a profesores cuando se registra un pago
3. Dashboard con estadísticas de pagos mensuales/anuales
4. Integración con sistemas de pago electrónico
5. Generación automática de recibos de pago
6. Reportes de impuestos y deducciones
