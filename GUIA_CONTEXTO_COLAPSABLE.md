# Guía - Contexto Colapsable Selectivo

## Nueva Funcionalidad Implementada

Ahora el profesor puede **seleccionar específicamente** en qué preguntas aparecerá el texto de lectura como contexto, y este contexto aparece como un **desplegable colapsable** para no ocupar espacio.

## Cómo Funciona

### Para el Profesor (Editor de Bloques)

#### 1. Crear Texto de Lectura
Al agregar un "Texto de Lectura", verás 3 secciones:

**a) Título:**
- Campo para el encabezado
- Ejemplo: "Comprensión de Lectura", "Según el texto responde..."

**b) Texto:**
- Campo para el párrafo de lectura
- Puede incluir imágenes y videos

**c) Mostrar como contexto en:**
- Lista de checkboxes con las preguntas que vienen después
- Selecciona en cuáles preguntas quieres que aparezca el contexto

#### 2. Seleccionar Preguntas
```
┌─────────────────────────────────────────┐
│ 📚 TEXTO DE LECTURA                     │
├─────────────────────────────────────────┤
│ 📝 Título: [Comprensión de Lectura]    │
│                                         │
│ 📄 Texto: [Había una vez...]           │
│                                         │
│ 👁️ Mostrar como contexto en:           │
│ ☑️ Pregunta 1                           │
│ ☑️ Pregunta 2                           │
│ ☐ Pregunta 3                            │
└─────────────────────────────────────────┘
```

En este ejemplo:
- El contexto aparecerá en Pregunta 1 y 2
- NO aparecerá en Pregunta 3

#### 3. Reglas Automáticas
- Solo se muestran las preguntas que vienen **DESPUÉS** del texto
- Si agregas otra lectura, las preguntas se dividen automáticamente
- Si no hay preguntas después, aparece un mensaje informativo

### Para el Estudiante (Tomar Prueba)

#### Navegación Normal
El estudiante puede:
1. Navegar con botones "Anterior/Siguiente"
2. Hacer clic en el botón 📖 del selector para ver el texto completo
3. Hacer clic en los números para ir a preguntas específicas

#### Contexto Colapsable
Cuando el estudiante llega a una pregunta que tiene contexto:

**Estado Inicial (Colapsado):**
```
┌─────────────────────────────────────────┐
│ 🔽 📖 Comprensión de Lectura            │
│    Click para ver/ocultar               │
└─────────────────────────────────────────┘

PREGUNTA 1
¿Dónde ocurre la historia?
○ Opción A
○ Opción B
```

**Al hacer clic (Expandido):**
```
┌─────────────────────────────────────────┐
│ 🔼 📖 Comprensión de Lectura            │
│    Click para ver/ocultar               │
├─────────────────────────────────────────┤
│ "Había una vez un reino lejano donde   │
│  vivía un príncipe valiente..."         │
└─────────────────────────────────────────┘

PREGUNTA 1
¿Dónde ocurre la historia?
○ Opción A
○ Opción B
```

## Ventajas del Sistema

### 1. **Control Total del Profesor**
- Decide exactamente en qué preguntas aparece el contexto
- Puede mostrar el texto solo en preguntas difíciles
- Puede ocultar el contexto en preguntas fáciles

### 2. **Interfaz Limpia**
- El contexto está colapsado por defecto
- No ocupa espacio hasta que el estudiante lo necesite
- Fácil de expandir/colapsar con un clic

### 3. **Flexibilidad**
- El estudiante siempre puede ver el texto completo navegando
- El contexto es opcional y controlado
- Mejor experiencia de usuario

## Ejemplos de Uso

### Ejemplo 1: Comprensión Lectora Básica
```
Profesor crea:
- Texto: "Historia del reino"
- Pregunta 1: ¿Dónde ocurre? → ✅ Mostrar contexto
- Pregunta 2: ¿Quién es el protagonista? → ✅ Mostrar contexto
- Pregunta 3: ¿Qué pasó al final? → ✅ Mostrar contexto

Resultado: Todas las preguntas tienen el contexto disponible
```

### Ejemplo 2: Comprensión Avanzada
```
Profesor crea:
- Texto: "Artículo científico"
- Pregunta 1: ¿Cuál es el tema? → ❌ Sin contexto (fácil)
- Pregunta 2: ¿Qué dice el párrafo 3? → ✅ Con contexto (específica)
- Pregunta 3: ¿Cuál es la conclusión? → ✅ Con contexto (requiere relectura)

Resultado: Solo las preguntas complejas tienen contexto
```

### Ejemplo 3: Múltiples Textos
```
Profesor crea:
- Texto 1: "Poema"
  - Pregunta 1-3: ✅ Con contexto
- Texto 2: "Cuento"
  - Pregunta 4-6: ✅ Con contexto

Resultado: Cada grupo de preguntas tiene su propio contexto
```

## Características Técnicas

### Colapsable
- **Estado inicial**: Colapsado (no ocupa espacio)
- **Animación suave**: Al expandir/colapsar
- **Indicador visual**: Flecha que cambia de dirección
- **Color distintivo**: Naranja para identificar fácilmente

### Responsive
- **Desktop**: Botón grande con hint "Click para ver/ocultar"
- **Tablet**: Botón mediano con hint
- **Móvil**: Botón compacto sin hint (más espacio)

### Persistencia
- El estado (expandido/colapsado) se mantiene mientras estás en la pregunta
- Al cambiar de pregunta, el nuevo contexto inicia colapsado

## Validaciones

- El texto de lectura debe tener título y texto
- Solo se pueden seleccionar preguntas que vienen después del texto
- Si se elimina una pregunta, se actualiza automáticamente la selección
- Si no hay preguntas después, se muestra un mensaje informativo

## Compatibilidad

✅ Funciona con textos de lectura nuevos
✅ Textos antiguos sin selección no muestran contexto (comportamiento seguro)
✅ Responsive en todos los dispositivos
✅ Compatible con imágenes y videos en el contexto
