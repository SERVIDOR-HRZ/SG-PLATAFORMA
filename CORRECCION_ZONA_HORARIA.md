# Corrección de Problema de Zona Horaria en Fechas

## Problema Identificado
Las fechas en el sistema de finanzas mostraban un día menos del esperado (por ejemplo, mostraba 21 cuando debería ser 22). Esto se debía a problemas de conversión de zona horaria entre JavaScript y Firebase.

## Causa Raíz
Cuando se usa un input HTML de tipo `date`, el valor retornado está en formato `YYYY-MM-DD` (sin información de hora). Al convertir esto a un objeto Date de JavaScript usando `new Date(fecha)`, el navegador lo interpreta como medianoche UTC (00:00:00 UTC).

Para usuarios en zonas horarias negativas (como Colombia, UTC-5), esto causa que la fecha se "reste" un día cuando se convierte a la hora local.

## Solución Implementada

### 1. Al Crear Fechas desde Input
En lugar de:
```javascript
fecha: firebase.firestore.Timestamp.fromDate(new Date(fecha))
```

Ahora usamos:
```javascript
const [year, month, day] = fecha.split('-');
const fechaCorrecta = new Date(year, month - 1, day, 12, 0, 0); // Mediodía local
fecha: firebase.firestore.Timestamp.fromDate(fechaCorrecta)
```

### 2. Al Mostrar Fechas en Input
En lugar de:
```javascript
document.getElementById('fechaInput').value = fecha.toISOString().split('T')[0];
```

Ahora usamos:
```javascript
const year = fecha.getFullYear();
const month = String(fecha.getMonth() + 1).padStart(2, '0');
const day = String(fecha.getDate()).padStart(2, '0');
document.getElementById('fechaInput').value = `${year}-${month}-${day}`;
```

### 3. Al Establecer Fecha Actual
En lugar de:
```javascript
document.getElementById('fechaInput').valueAsDate = new Date();
```

Ahora usamos:
```javascript
const hoy = new Date();
const year = hoy.getFullYear();
const month = String(hoy.getMonth() + 1).padStart(2, '0');
const day = String(hoy.getDate()).padStart(2, '0');
document.getElementById('fechaInput').value = `${year}-${month}-${day}`;
```

## Archivos Modificados
- `Elementos/js/finanzas-cuentas.js` - Creación de movimientos y establecer fecha actual
- `Elementos/js/finanzas-edit.js` - Edición de movimientos y mostrar fechas

## Beneficios
- Las fechas ahora se muestran correctamente sin importar la zona horaria del usuario
- Se usa mediodía (12:00:00) como hora de referencia para evitar problemas de conversión
- La fecha mostrada en el input siempre coincide con la fecha almacenada en Firebase

## Notas Técnicas
- Usar mediodía (12:00:00) en lugar de medianoche evita problemas de zona horaria en ambas direcciones
- El método `split('-')` es más confiable que parsear la fecha directamente
- `padStart(2, '0')` asegura que los meses y días siempre tengan 2 dígitos
