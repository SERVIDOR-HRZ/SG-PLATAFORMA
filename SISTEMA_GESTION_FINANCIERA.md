# Sistema de Gestión Financiera Completo

## Descripción General
Se ha implementado un sistema completo de gestión financiera que incluye:
- Gestión de cuentas bancarias
- Control de ingresos y gastos
- Dashboard financiero
- Integración con pagos a profesores
- Descuento automático de saldos

## Nuevas Funcionalidades

### 1. Gestión de Cuentas Bancarias

#### Características:
- **Crear cuentas**: Agregar nuevas cuentas bancarias con información completa
- **Editar cuentas**: Modificar información de cuentas existentes
- **Eliminar cuentas**: Eliminar cuentas (con validación de movimientos asociados)
- **Visualización**: Tarjetas visuales con información de cada cuenta

#### Información de cada cuenta:
- Nombre de la cuenta
- Tipo (Nequi, Daviplata, Bancolombia, etc.)
- Número de cuenta
- Saldo actual
- Color de identificación
- Notas adicionales

#### Dashboard Financiero:
- **Saldo Total**: Suma de todas las cuentas
- **Cuentas Activas**: Número total de cuentas
- **Ingresos del Mes**: Total de ingresos del mes actual
- **Gastos del Mes**: Total de gastos del mes actual

### 2. Gestión de Ingresos y Gastos

#### Tipos de Movimientos:
**Ingresos:**
- Matrícula
- Pago de Clases
- Donación
- Venta de Material
- Otro Ingreso

**Gastos:**
- Pago a Profesores
- Servicios Públicos
- Arriendo
- Material Didáctico
- Publicidad
- Transporte
- Alimentación
- Tecnología
- Otro Gasto

#### Características:
- **Registrar ingresos**: Aumenta el saldo de la cuenta seleccionada
- **Registrar gastos**: Descuenta del saldo de la cuenta seleccionada
- **Validación de saldo**: No permite gastos si el saldo es insuficiente
- **Historial completo**: Lista de todos los movimientos con filtros
- **Categorización**: Organización por categorías predefinidas

#### Filtros de Movimientos:
- Por tipo (Ingresos/Gastos)
- Por cuenta bancaria
- Por mes

### 3. Integración con Pagos a Profesores

#### Proceso de Pago Mejorado:
1. **Selección de cuenta**: Al registrar un pago, se debe seleccionar la cuenta desde la cual se pagará
2. **Validación de saldo**: El sistema muestra si el saldo es suficiente o no
3. **Descuento automático**: Al confirmar el pago, se descuenta automáticamente del saldo de la cuenta
4. **Registro de movimiento**: Se crea automáticamente un registro de gasto en "Pago a Profesores"
5. **Comprobante**: Se sube el comprobante de pago como siempre

#### Información mostrada al seleccionar cuenta:
- ✓ Saldo suficiente: Muestra cuánto quedará después del pago
- ⚠️ Saldo insuficiente: Muestra cuánto falta para completar el pago

### 4. Estructura de Datos en Firebase

#### Colección: `cuentas_bancarias`
```javascript
{
  nombre: string,
  tipo: string,
  numeroCuenta: string,
  saldo: number,
  color: string,
  notas: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### Colección: `movimientos`
```javascript
{
  tipo: string, // 'ingreso' o 'gasto'
  cuentaId: string,
  monto: number,
  categoria: string,
  descripcion: string,
  fecha: timestamp,
  notas: string,
  createdAt: timestamp
}
```

#### Actualización en colección: `pagos`
```javascript
{
  // ... campos existentes ...
  cuentaId: string, // NUEVO
  cuentaNombre: string // NUEVO
}
```

## Flujo de Trabajo

### Configuración Inicial:
1. Ir a **Finanzas** → **Cuentas Bancarias**
2. Crear las cuentas bancarias de la institución
3. Establecer el saldo inicial de cada cuenta

### Registro de Ingresos:
1. Ir a **Finanzas** → **Ingresos y Gastos**
2. Clic en **Nuevo Ingreso**
3. Seleccionar cuenta, monto, categoría y descripción
4. El saldo de la cuenta aumenta automáticamente

### Registro de Gastos:
1. Ir a **Finanzas** → **Ingresos y Gastos**
2. Clic en **Nuevo Gasto**
3. Seleccionar cuenta, monto, categoría y descripción
4. El sistema valida que haya saldo suficiente
5. El saldo de la cuenta disminuye automáticamente

### Pago a Profesores:
1. Ir a **Finanzas** → **Pagos Semanales**
2. Seleccionar la semana
3. Clic en **Registrar Pago** para un profesor
4. **NUEVO**: Seleccionar la cuenta desde la cual se pagará
5. El sistema muestra si el saldo es suficiente
6. Subir comprobante de pago
7. Al confirmar:
   - Se descuenta el monto de la cuenta seleccionada
   - Se registra automáticamente como gasto
   - Se guarda el comprobante
   - Se actualiza el historial

## Diseño y UX

### Colores por Tipo:
- **Cuentas**: Personalizable (8 colores disponibles)
- **Ingresos**: Verde (#28a745)
- **Gastos**: Rojo (#dc3545)
- **Dashboard**: Gradientes modernos

### Iconos:
- Banco: `bi-bank`
- Teléfono (Nequi/Daviplata): `bi-phone`
- Efectivo: `bi-cash-stack`
- Billetera: `bi-wallet2`
- Ingreso: `bi-arrow-down-circle`
- Gasto: `bi-arrow-up-circle`

### Responsive:
- Totalmente adaptable a móviles y tablets
- Grid flexible que se ajusta al tamaño de pantalla
- Filtros apilados en móviles

## Seguridad y Validaciones

### Validaciones Implementadas:
1. **Saldo insuficiente**: No permite gastos mayores al saldo disponible
2. **Campos requeridos**: Valida que todos los campos obligatorios estén completos
3. **Eliminación de cuentas**: No permite eliminar cuentas con movimientos asociados
4. **Permisos**: Solo superusuarios pueden acceder al módulo de finanzas

### Integridad de Datos:
- Actualización atómica de saldos
- Registro de timestamps en todas las operaciones
- Relación entre pagos, movimientos y cuentas

## Reportes y Análisis

### Información Disponible:
- Saldo total en tiempo real
- Ingresos y gastos del mes actual
- Historial completo de movimientos
- Pagos realizados por cuenta
- Balance por categoría

### Filtros Avanzados:
- Por tipo de movimiento
- Por cuenta bancaria
- Por rango de fechas
- Por categoría

## Beneficios del Sistema

1. **Control Total**: Visibilidad completa de todas las finanzas
2. **Automatización**: Descuentos automáticos al pagar
3. **Trazabilidad**: Historial completo de todos los movimientos
4. **Prevención de Errores**: Validaciones que evitan sobregiros
5. **Organización**: Categorización clara de ingresos y gastos
6. **Transparencia**: Comprobantes y registros de todos los pagos
7. **Análisis**: Dashboard con métricas clave en tiempo real

## Archivos Modificados/Creados

### HTML:
- `Secciones/Finanzas.html` - Actualizado con nuevos tabs y modales

### CSS:
- `Elementos/css/finanzas.css` - Estilos para cuentas, dashboard y movimientos

### JavaScript:
- `Elementos/js/finanzas.js` - Actualizado con integración de cuentas
- `Elementos/js/finanzas-cuentas.js` - NUEVO - Lógica de cuentas y movimientos

### Documentación:
- `SISTEMA_GESTION_FINANCIERA.md` - Este documento

## Próximas Mejoras Sugeridas

1. **Gráficos**: Agregar gráficos de ingresos vs gastos
2. **Exportación**: Exportar reportes a Excel/PDF
3. **Presupuestos**: Sistema de presupuestos por categoría
4. **Alertas**: Notificaciones cuando el saldo es bajo
5. **Conciliación**: Herramienta para conciliar con extractos bancarios
6. **Multi-moneda**: Soporte para múltiples monedas
7. **Proyecciones**: Proyecciones financieras basadas en histórico
