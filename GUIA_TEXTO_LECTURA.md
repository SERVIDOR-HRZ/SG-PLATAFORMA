# Guía - Texto de Lectura (Título + Párrafo)

## Cambio Implementado

Se ha simplificado el sistema para que los títulos y párrafos siempre vayan juntos como una unidad llamada **"Texto de Lectura"**.

## Cómo Funciona

### Para el Profesor (Editor de Bloques)

Cuando agregas elementos, ahora solo tienes 2 opciones:

1. **Pregunta** - Pregunta de selección múltiple normal
2. **Texto de Lectura** - Título + Párrafo juntos

#### Al seleccionar "Texto de Lectura":

Se crea un elemento que contiene:
- **Título**: Campo para el encabezado (Ej: "Comprensión de Lectura", "Según el texto responde...")
- **Texto**: Campo para el párrafo de lectura
- **Imágenes y Videos**: Se pueden agregar al texto

**Ejemplo de creación:**
```
┌─────────────────────────────────────────┐
│ 📚 TEXTO DE LECTURA                     │
├─────────────────────────────────────────┤
│ 📝 Título:                              │
│ [Comprensión de Lectura]                │
│                                         │
│ 📄 Texto:                               │
│ [Había una vez un reino lejano...]     │
│                                         │
│ [+ Agregar Imagen] [+ Agregar Video]   │
└─────────────────────────────────────────┘
```

### Para el Estudiante (Tomar Prueba)

Cuando el estudiante navega por la prueba:

#### Si llega a un "Texto de Lectura":
Ve una pantalla completa con:
- Badge naranja que dice "Texto de Lectura"
- El título destacado en azul
- El texto del párrafo en un recuadro blanco
- Imágenes/videos si los hay
- Nota: "Lee el texto cuidadosamente..."

#### Si llega a una Pregunta después del texto:
Ve automáticamente arriba:
- El título y párrafo del texto de lectura (en un recuadro gris)
- Luego la pregunta normal abajo

**Ejemplo visual para el estudiante:**

```
┌─────────────────────────────────────────┐
│ [CONTEXTO]                              │
│ 📚 Comprensión de Lectura               │
│ "Había una vez un reino lejano..."     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PREGUNTA 1                              │
│ ¿Dónde ocurre la historia?              │
│ ○ En un reino lejano                    │
│ ○ En una ciudad                         │
│ ○ En el mar                             │
│ ○ En el bosque                          │
└─────────────────────────────────────────┘
```

## Estructura de Ejemplo

### Profesor crea:
```
1. [TEXTO DE LECTURA]
   Título: "Comprensión de Lectura"
   Texto: "Había una vez un reino lejano donde vivía..."

2. [PREGUNTA 1] ¿Dónde ocurre la historia?

3. [PREGUNTA 2] ¿Quién es el protagonista?

4. [TEXTO DE LECTURA]
   Título: "Matemáticas - Problema"
   Texto: "Juan tiene 5 manzanas y compra 3 más..."

5. [PREGUNTA 3] ¿Cuántas manzanas tiene Juan?
```

### Estudiante ve:
- **Navegación completa**: 5 elementos (puede navegar por todos)
- **Selector de preguntas**: Solo muestra 1, 2, 3 (las preguntas reales)
- **Contador**: "3 preguntas"
- **Al estar en Pregunta 1 o 2**: Ve el texto de lectura arriba automáticamente
- **Al estar en Pregunta 3**: Ve el segundo texto de lectura arriba

## Ventajas del Nuevo Sistema

1. **Más Simple**: Solo 2 tipos de elementos (Pregunta y Texto de Lectura)
2. **Siempre Juntos**: El título y párrafo siempre van unidos, no se pueden separar
3. **Contexto Automático**: El estudiante siempre ve el texto relevante cuando responde
4. **Mejor Organización**: Más fácil crear pruebas de comprensión lectora

## Validaciones

- El título del texto de lectura no puede estar vacío
- El texto del párrafo no puede estar vacío
- Las preguntas siguen las mismas validaciones de antes

## Contador de Preguntas

- Los "Textos de Lectura" **NO** cuentan como preguntas
- Solo las preguntas reales se cuentan
- Ejemplo: 2 textos de lectura + 5 preguntas = "5 preguntas"

## Navegación

- **Botones Anterior/Siguiente**: Navegan por TODOS los elementos (textos y preguntas)
- **Selector Numérico**: Solo muestra las preguntas reales (1, 2, 3...)
- El estudiante puede leer los textos de lectura navegando o los ve automáticamente como contexto

## Estilos Visuales

### En el Editor (Profesor):
- **Texto de Lectura**: Fondo naranja claro, badge naranja
- **Pregunta**: Fondo blanco, badge azul

### En la Prueba (Estudiante):
- **Texto de Lectura completo**: Fondo naranja claro, título azul destacado
- **Texto como contexto**: Recuadro gris con título azul y párrafo amarillo
- **Pregunta**: Diseño normal con el contexto arriba si aplica

## Compatibilidad

✅ Funciona con pruebas antiguas que tenían títulos y párrafos separados (se convierten automáticamente)
✅ Responsive (móviles, tablets, desktop)
✅ Mantiene todas las funcionalidades (imágenes, videos, timer, etc.)
