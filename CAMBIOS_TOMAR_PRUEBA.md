# Cambios en Tomar Prueba - Soporte para Títulos y Párrafos

## Resumen de Cambios

Se ha actualizado el sistema de tomar pruebas para que los estudiantes puedan ver correctamente los títulos y párrafos que los profesores agreguen como contexto.

## Características Implementadas

### 1. **Visualización de Elementos de Contexto**

Cuando un estudiante navega por las preguntas, ahora verá:

#### **Títulos**
- Se muestran con un fondo azul claro
- Tienen un badge que dice "Título"
- Texto grande y destacado
- Incluyen una nota: "Este es un título de sección. Usa los botones de navegación para continuar."

#### **Párrafos**
- Se muestran con un fondo amarillo claro
- Tienen un badge que dice "Texto de Lectura"
- Texto justificado y fácil de leer
- Pueden incluir imágenes y videos
- Incluyen una nota: "Lee el texto cuidadosamente. Usa los botones de navegación para continuar."

### 2. **Contexto Automático**

Cuando un estudiante llega a una pregunta, el sistema automáticamente muestra:
- Todos los títulos y párrafos que vienen ANTES de esa pregunta
- Estos se muestran en un recuadro gris claro arriba de la pregunta
- Esto permite que el estudiante siempre tenga el contexto necesario

**Ejemplo:**
```
┌─────────────────────────────────────┐
│ [CONTEXTO]                          │
│                                     │
│ 📝 Comprensión de Lectura          │
│                                     │
│ 📄 "En un pequeño pueblo..."       │
│    (texto completo del párrafo)    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ PREGUNTA 1                          │
│ ¿Cómo se llamaba el niño?          │
│ ○ Juan                              │
│ ○ Pedro                             │
│ ○ Luis                              │
│ ○ Carlos                            │
└─────────────────────────────────────┘
```

### 3. **Navegación Inteligente**

- Los botones "Anterior" y "Siguiente" permiten navegar por TODOS los elementos (títulos, párrafos y preguntas)
- El selector de preguntas (números) solo muestra las preguntas reales
- Los títulos y párrafos no aparecen en el selector numérico

### 4. **Contador de Preguntas Correcto**

- El contador solo cuenta las preguntas reales
- Los títulos y párrafos NO se cuentan
- Ejemplo: Si hay 1 título + 1 párrafo + 5 preguntas = "5 preguntas"

### 5. **Progreso Actualizado**

- La barra de progreso solo considera las preguntas reales
- Los títulos y párrafos no afectan el porcentaje de completitud

## Flujo de Uso para Estudiantes

1. El estudiante selecciona una materia
2. Navega con los botones "Anterior" y "Siguiente"
3. Cuando llega a un título, lo ve destacado en azul
4. Cuando llega a un párrafo, lo lee en el recuadro amarillo
5. Cuando llega a una pregunta, ve el contexto arriba (si hay) y responde
6. Puede saltar directamente a preguntas específicas usando el selector numérico

## Ejemplo de Estructura

### Vista del Profesor (Editor):
```
1. [TÍTULO] Comprensión de Lectura
2. [PÁRRAFO] "Había una vez..."
3. [PREGUNTA 1] ¿Quién es el protagonista?
4. [PREGUNTA 2] ¿Dónde ocurre la historia?
5. [TÍTULO] Matemáticas Básicas
6. [PREGUNTA 3] ¿Cuánto es 2+2?
```

### Vista del Estudiante (Tomar Prueba):
- Navegación completa: 6 elementos
- Selector de preguntas: Solo muestra 1, 2, 3
- Contador: "3 preguntas"
- Al estar en Pregunta 1 o 2, se muestra el contexto del título y párrafo arriba

## Estilos Visuales

### Títulos
- Fondo: Azul claro (#e6f3ff)
- Borde: Azul (#007bff)
- Icono: 📝 (H1)
- Texto: Grande y en negrita

### Párrafos
- Fondo: Amarillo claro (#fff9e6)
- Borde: Amarillo (#ffc107)
- Icono: 📄 (Paragraph)
- Texto: Justificado, fácil de leer

### Contexto (cuando aparece arriba de preguntas)
- Fondo: Gris claro
- Títulos y párrafos más compactos
- Siempre visible cuando hay contexto relevante

## Compatibilidad

- ✅ Funciona con preguntas existentes (sin títulos ni párrafos)
- ✅ Funciona con nuevas pruebas que incluyen títulos y párrafos
- ✅ Responsive (se adapta a móviles y tablets)
- ✅ Mantiene todas las funcionalidades existentes (timer, música, navegación bloqueada, etc.)

## Archivos Modificados

1. **Elementos/js/tomar-prueba.js**
   - Función `showCurrentQuestion()` - Actualizada para manejar títulos y párrafos
   - Función `getRealQuestionNumber()` - Nueva función para contar solo preguntas reales
   - Función `getContextElements()` - Nueva función para obtener contexto
   - Función `renderCurrentItem()` - Nueva función para renderizar cualquier tipo de elemento
   - Función `createQuestionsSelector()` - Actualizada para mostrar solo preguntas reales
   - Función `updateProgress()` - Actualizada para contar solo preguntas reales

2. **Elementos/css/tomar-prueba.css**
   - Estilos para `.context-elements`
   - Estilos para `.context-title`
   - Estilos para `.context-paragraph`
   - Estilos para `.current-title-item`
   - Estilos para `.current-paragraph-item`
   - Estilos responsive para todos los nuevos elementos
