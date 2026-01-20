# Sistema de Asistencia

## Descripción

Se ha implementado un sistema completo de control de asistencia integrado con el calendario de clases. La asistencia solo puede ser marcada durante el horario de clase programado.

## Características Principales

### Para Administradores/Profesores

1. **Control de Asistencia por Clase**
   - Nueva pestaña "Asistencia" en cada materia del aula
   - Lista de todas las clases programadas
   - Vista de todos los estudiantes del aula por clase

2. **Restricción de Horario**
   - La asistencia solo se puede marcar durante el horario de clase
   - Se verifica la hora de inicio y fin de cada clase
   - Mensaje informativo cuando la clase no está en curso

3. **Estados de Clase**
   - **En curso**: Clase actualmente en progreso (se puede marcar asistencia)
   - **Finalizada**: Clase ya terminada (solo lectura)
   - **Próxima**: Clase programada para el futuro (no se puede marcar)

4. **Estadísticas en Tiempo Real**
   - Contador de presentes
   - Contador de ausentes
   - Total de estudiantes

5. **Interfaz Intuitiva**
   - Switch toggle para marcar presente/ausente
   - Colores según el estado (verde = presente, gris = ausente)
   - Avatar y nombre de cada estudiante
   - Colores adaptados a la materia actual

### Para Estudiantes

1. **Consulta de Asistencia**
   - Vista de su historial de asistencia
   - Lista de todas las clases
   - Estado claro: Presente o Ausente
   - Información de fecha y hora de cada clase

2. **Vista Simplificada**
   - Solo ven su propia asistencia
   - No pueden modificar registros
   - Interfaz clara con iconos visuales

## Integración con el Calendario

El sistema se integra con las clases programadas en el calendario:

- Lee las clases de la colección `clases_programadas`
- Filtra por `aulaId` y `materia`
- Verifica horarios (`horaInicio` y `horaFin`)
- Compara con la hora actual del sistema

## Estructura de Datos en Firebase

### Colección: `asistencia`
```javascript
{
  claseId: string,          // ID de la clase programada
  estudianteId: string,     // ID del estudiante
  aulaId: string,           // ID del aula
  materia: string,          // Nombre de la materia
  presente: boolean,        // true = presente, false = ausente
  fechaRegistro: timestamp, // Cuándo se registró
  registradoPor: string     // ID del profesor que registró
}
```

### Relación con `clases_programadas`
```javascript
{
  aulaId: string,
  materia: string,
  fecha: string,            // Formato: YYYY-MM-DD
  horaInicio: string,       // Formato: HH:MM
  horaFin: string,          // Formato: HH:MM
  titulo: string,
  // ... otros campos
}
```

## Funciones Principales

### JavaScript (aula.js)

- `loadAsistencia()` - Carga la vista de asistencia
- `renderClaseAsistencia()` - Renderiza una clase con su lista de asistencia
- `setupAsistenciaEventListeners()` - Configura los event listeners
- `marcarAsistencia()` - Registra o actualiza la asistencia de un estudiante

## Lógica de Validación de Horario

```javascript
// Verificar si la clase está en curso
const ahora = new Date();
const fechaInicioClase = new Date(año, mes, día, horaInicio);
const fechaFinClase = new Date(año, mes, día, horaFin);

const claseEnCurso = ahora >= fechaInicioClase && ahora <= fechaFinClase;
```

- Si `claseEnCurso = true`: Se puede marcar asistencia
- Si `claseEnCurso = false`: Los checkboxes están deshabilitados

## Estilos CSS

Los estilos se encuentran al final de `Elementos/css/aula.css` con el prefijo `.asistencia-*` y `.clase-asistencia-*`

### Características visuales:

- Colores dinámicos según la materia
- Estados visuales claros (presente/ausente)
- Animación de "pulso" para clases en curso
- Switch toggle personalizado
- Responsive para móviles

## Uso

### Como Profesor:

1. Entra a una materia en el aula
2. Ve a la pestaña "Asistencia"
3. Busca la clase actual (marcada como "En curso")
4. Marca presente/ausente para cada estudiante
5. Los cambios se guardan automáticamente

### Como Estudiante:

1. Entra a una materia en el aula
2. Ve a la pestaña "Asistencia"
3. Consulta tu historial de asistencia
4. Ve el estado de cada clase (Presente/Ausente)

## Ventajas del Sistema

1. **Precisión**: Solo se puede marcar durante el horario real de clase
2. **Automatización**: Se integra con el calendario existente
3. **Trazabilidad**: Registra quién y cuándo marcó la asistencia
4. **Flexibilidad**: Permite actualizar registros durante la clase
5. **Claridad**: Estados visuales claros para todos los usuarios
6. **Consistencia**: Usa los colores de cada materia

## Notas Importantes

- La asistencia se marca por clase individual, no por día
- Un estudiante puede tener múltiples clases el mismo día
- Los profesores pueden cambiar la asistencia durante el horario de clase
- Una vez finalizada la clase, la asistencia queda en modo solo lectura
- El sistema usa la hora del servidor/navegador para validar

## Mejoras Futuras Sugeridas

1. Reportes de asistencia por estudiante
2. Exportación a Excel/PDF
3. Notificaciones automáticas de ausencias
4. Estadísticas de asistencia por período
5. Justificación de ausencias
6. Asistencia por código QR o geolocalización
