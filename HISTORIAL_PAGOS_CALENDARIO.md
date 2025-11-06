# Historial de Pagos en Calendario

## Descripción
Se ha agregado funcionalidad para que cada profesor pueda ver su historial de pagos con comprobantes según la semana desde el módulo de Calendario.

## Cambios Realizados

### 1. Secciones/Calendario.html
- **Botón "Mis Pagos"**: Agregado en el header para acceder al historial de pagos
- **Modal Historial de Pagos**: Nuevo modal que muestra los pagos del profesor por semana
- **Modal Ver Comprobante**: Modal para visualizar los comprobantes de pago

### 2. Elementos/css/calendario.css
- **Estilos del botón**: `.btn-historial-pagos` con gradiente verde
- **Estilos del modal historial**: `.modal-historial-pagos` con diseño responsive
- **Tarjetas de pago**: `.historial-pago-card` con información detallada
- **Selector de semana**: `.week-selector-historial` para navegar entre semanas
- **Responsive**: Adaptación para móviles (oculta texto del botón, muestra solo icono)

### 3. Elementos/js/calendario.js
- **Variables globales**: `historialWeekStart` y `historialWeekEnd` para manejar la semana seleccionada
- **Funciones principales**:
  - `initializeHistorialWeek()`: Inicializa la semana actual
  - `openHistorialPagos()`: Abre el modal y carga los pagos
  - `loadHistorialPagos()`: Consulta Firebase y muestra los pagos de la semana
  - `createPagoCard()`: Crea las tarjetas de pago con toda la información
  - `verComprobanteCalendario()`: Muestra el comprobante en un modal
  - `updateHistorialWeekDisplay()`: Actualiza el rango de fechas mostrado

## Funcionalidades

### Para Profesores
1. **Acceso rápido**: Botón "Mis Pagos" en el header del calendario
2. **Navegación por semanas**: Botones para ver pagos de semanas anteriores o futuras
3. **Información detallada por pago**:
   - Fecha de pago
   - Semana correspondiente
   - Clases dictadas
   - Horas totales
   - Tarifa por hora
   - Total pagado
   - Notas (si las hay)
4. **Ver comprobantes**: Botón para visualizar el comprobante de pago en pantalla completa
5. **Abrir en nueva pestaña**: Opción para abrir el comprobante en una nueva ventana

## Integración con Finanzas
- Los pagos se consultan desde la colección `pagos` en Firebase
- Se filtran por `profesorId` del usuario actual
- Se filtran por rango de fechas (`semanaInicio` y `semanaFin`)
- Compatible con el sistema de pagos existente en el módulo de Finanzas

## Diseño
- **Colores**: Verde (#28a745) para el tema de pagos
- **Iconos**: Bootstrap Icons para una interfaz consistente
- **Responsive**: Totalmente adaptable a móviles y tablets
- **Animaciones**: Transiciones suaves en hover y al abrir modales

## Notas Técnicas
- Requiere Firebase inicializado
- Usa la misma estructura de datos que el módulo de Finanzas
- Formato de moneda: Pesos colombianos (COP)
- Formato de fechas: Español (es-ES)
