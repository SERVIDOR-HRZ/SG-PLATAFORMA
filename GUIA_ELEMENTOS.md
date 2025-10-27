# Guía de Uso - Editor de Bloques con Párrafos y Títulos

## Nuevas Funcionalidades

Ahora el editor de bloques permite agregar tres tipos de elementos:

### 1. **Preguntas** (Selección Múltiple)
- Son las preguntas tradicionales con opciones de respuesta
- Se numeran automáticamente (Pregunta 1, Pregunta 2, etc.)
- Cuentan para el total de preguntas de la materia
- Pueden incluir imágenes y videos
- Las opciones pueden tener imágenes

### 2. **Párrafos** (Texto de Contexto)
- Permiten agregar texto de lectura o contexto
- **NO cuentan como preguntas**
- Útiles para:
  - Textos de comprensión lectora
  - Contexto para varias preguntas
  - Instrucciones especiales
- Pueden incluir imágenes y videos
- Tienen un fondo amarillo claro para distinguirlos

### 3. **Títulos** (Encabezados)
- Permiten organizar las preguntas en secciones
- **NO cuentan como preguntas**
- Útiles para:
  - Separar bloques temáticos
  - Indicar "Según el siguiente texto, responde las preguntas 23 y 24"
  - Organizar la prueba por temas
- Tienen un fondo azul claro para distinguirlos
- Texto más grande y destacado

## Ejemplo de Uso

```
[TÍTULO] Comprensión de Lectura

[PÁRRAFO] 
"En un pequeño pueblo vivía un niño llamado Pedro. 
Pedro amaba los animales y soñaba con ser veterinario..."

[TÍTULO] Según el texto anterior, responde las preguntas 1 y 2:

[PREGUNTA 1] ¿Cómo se llamaba el niño?
a) Juan
b) Pedro ✓
c) Luis
d) Carlos

[PREGUNTA 2] ¿Qué quería ser Pedro?
a) Médico
b) Profesor
c) Veterinario ✓
d) Ingeniero
```

## Cómo Agregar Elementos

1. Haz clic en el botón **"Agregar Elemento"**
2. Selecciona el tipo de elemento que deseas:
   - **Pregunta**: Para preguntas con opciones
   - **Párrafo**: Para texto de contexto
   - **Título**: Para encabezados
3. Completa el contenido
4. Guarda la materia

## Contador de Preguntas

El contador en cada materia muestra **solo las preguntas reales**, no cuenta los párrafos ni títulos. Por ejemplo:

- Si tienes: 1 título + 1 párrafo + 3 preguntas + 1 título + 2 preguntas
- El contador mostrará: **5 preguntas**

## Validaciones

- **Preguntas**: Deben tener texto y al menos 2 opciones con una correcta
- **Párrafos**: Deben tener texto (no pueden estar vacíos)
- **Títulos**: Deben tener texto (no pueden estar vacíos)

## Características Visuales

- **Preguntas**: Fondo blanco, borde multicolor
- **Párrafos**: Fondo amarillo claro, badge naranja
- **Títulos**: Fondo azul claro, badge azul

Todos los elementos pueden ser eliminados individualmente y se pueden reordenar según el orden en que los agregues.
