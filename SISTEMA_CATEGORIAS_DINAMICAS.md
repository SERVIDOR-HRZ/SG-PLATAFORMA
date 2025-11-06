# Sistema de Categorías Dinámicas - Finanzas

## Cambios Realizados

Se ha implementado un sistema de categorías dinámicas para ingresos y gastos, eliminando las categorías predefinidas y permitiendo crear, gestionar y reutilizar categorías personalizadas.

## Características Implementadas

### 1. Gestión de Categorías
- **Crear categorías personalizadas**: Puedes crear nuevas categorías desde dos lugares:
  - Al registrar un ingreso/gasto: selecciona "+ Crear nueva categoría" en el dropdown
  - Desde el modal "Gestionar Categorías": botón dedicado para gestión completa

- **Eliminar categorías**: Puedes eliminar categorías que ya no necesites
  - Si la categoría tiene movimientos asociados, se muestra una advertencia
  - Los movimientos no se eliminan, solo quedan sin categoría

- **Estadísticas por categoría**: El modal muestra:
  - Cantidad de movimientos por categoría
  - Total acumulado por categoría

### 2. Filtros Mejorados
- **Filtro por categoría**: Nuevo filtro en la pestaña "Ingresos y Gastos"
  - Se actualiza dinámicamente según el tipo de movimiento seleccionado
  - Muestra solo las categorías relevantes (ingresos o gastos)

### 3. Almacenamiento en Firebase
Las categorías se guardan en la colección `categorias_financieras` con la siguiente estructura:
```javascript
{
  nombre: "Nombre de la categoría",
  tipo: "ingreso" | "gasto",
  createdAt: timestamp
}
```

## Cómo Usar

### Crear una Nueva Categoría

**Opción 1: Al registrar un movimiento**
1. Haz clic en "Nuevo Ingreso" o "Nuevo Gasto"
2. En el campo "Categoría", selecciona "+ Crear nueva categoría"
3. Se abrirá un modal donde puedes ingresar el nombre de la categoría
4. Haz clic en "Crear Categoría"
5. La categoría se crea y se selecciona automáticamente en el formulario

**Opción 2: Desde el gestor de categorías**
1. Ve a la pestaña "Ingresos y Gastos"
2. Haz clic en "Gestionar Categorías"
3. Selecciona la pestaña "Ingresos" o "Gastos"
4. Haz clic en "+ Crear nueva categoría"
5. Se abrirá un modal donde puedes ingresar el nombre
6. Haz clic en "Crear Categoría"

### Eliminar una Categoría
1. Abre "Gestionar Categorías"
2. Selecciona la pestaña correspondiente (Ingresos o Gastos)
3. Haz clic en el icono de papelera junto a la categoría
4. Confirma la eliminación

### Filtrar por Categoría
1. Ve a la pestaña "Ingresos y Gastos"
2. Usa el filtro "Todas las categorías" para seleccionar una específica
3. Combina con otros filtros (tipo, cuenta, mes) para búsquedas más precisas

## Archivos Modificados

### HTML
- `Secciones/Finanzas.html`
  - Agregado filtro de categorías
  - Agregado botón "Gestionar Categorías"
  - Agregado modal para gestionar categorías

### JavaScript
- `Elementos/js/finanzas-cuentas.js`
  - Eliminadas constantes de categorías predefinidas
  - Agregadas funciones para cargar categorías desde Firebase
  - Agregada función para crear categorías dinámicamente
  - Agregada función para obtener estadísticas por categoría
  - Actualizada función `loadMovimientos` para incluir filtro de categorías

- `Elementos/js/finanzas.js`
  - Agregadas funciones para gestionar el modal de categorías
  - Agregada función para cargar categorías en filtros
  - Agregada función para eliminar categorías
  - Actualizado `switchTab` para cargar categorías al cambiar a movimientos
  - Actualizados event listeners para filtros

### CSS
- `Elementos/css/finanzas.css`
  - Estilos para el modal de categorías
  - Estilos para las pestañas de categorías
  - Estilos para los items de categorías
  - Estilos para filtros adicionales

## Ventajas del Sistema

1. **Flexibilidad**: Crea categorías según tus necesidades específicas
2. **Organización**: Mantén tus finanzas organizadas con categorías personalizadas
3. **Análisis**: Visualiza estadísticas por categoría para mejor control
4. **Reutilización**: Las categorías se guardan y pueden reutilizarse
5. **Filtrado**: Filtra movimientos por categoría para análisis detallado

## Notas Técnicas

- Las categorías se almacenan en Firebase Firestore
- Cada categoría tiene un tipo (ingreso o gasto)
- Las categorías son únicas por nombre y tipo
- Al eliminar una categoría, los movimientos asociados no se eliminan
- El sistema valida que no existan categorías duplicadas
