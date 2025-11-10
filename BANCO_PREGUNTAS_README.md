# 📚 Banco de Preguntas - Guía de Uso

## ¿Qué es el Banco de Preguntas?

El **Banco de Preguntas** es una funcionalidad que te permite **reutilizar preguntas** de pruebas anteriores según la materia. Esto significa que no tendrás que crear las mismas preguntas una y otra vez.

## 🎯 Características Principales

### 1. **Guardado Automático**
- Cada vez que guardas una materia con preguntas, estas se agregan automáticamente al banco
- Las preguntas duplicadas no se guardan dos veces (se compara el texto y tipo)
- El banco se organiza por materia (Matemáticas, Lectura, Sociales, Ciencias, Inglés)

### 2. **Reutilización Fácil**
- Accede al banco desde el botón "Banco de Preguntas" en el editor de materias
- Visualiza todas las preguntas guardadas de esa materia
- Selecciona las preguntas que quieres agregar a la prueba actual
- Las preguntas se copian (no se mueven), así que puedes usarlas en múltiples pruebas

### 3. **Búsqueda y Filtrado**
- Usa el campo de búsqueda para encontrar preguntas específicas
- Filtra por texto de pregunta, opciones o contenido

### 4. **Vista Previa Completa**
- Ve el texto completo de cada pregunta
- Visualiza las opciones y cuál es la correcta (marcada en verde)
- Ve imágenes y videos asociados
- Identifica textos de lectura con su título y párrafo

## 📖 Cómo Usar el Banco de Preguntas

### Paso 1: Crear Preguntas Normalmente
1. Entra al editor de bloques de una prueba
2. Selecciona una materia (ej: Matemáticas)
3. Crea tus preguntas como siempre
4. Haz clic en "Guardar Materia"

✅ **Las preguntas se guardan automáticamente en el banco**

### Paso 2: Reutilizar Preguntas en Otra Prueba
1. Entra al editor de bloques de una nueva prueba
2. Selecciona la misma materia (ej: Matemáticas)
3. Haz clic en el botón **"Banco de Preguntas"** (botón verde con ícono de base de datos)
4. Verás todas las preguntas guardadas de esa materia
5. Selecciona las preguntas que quieres agregar (haz clic en el checkbox o en la tarjeta)
6. Haz clic en **"Agregar X Pregunta(s)"**
7. Las preguntas se agregan a tu prueba actual

### Paso 3: Editar y Guardar
- Puedes editar las preguntas agregadas si lo necesitas
- Al guardar la materia, las versiones editadas también se agregan al banco

## 🎨 Tipos de Preguntas Soportadas

### ✅ Preguntas de Selección Múltiple
- Texto de la pregunta
- Imágenes y videos
- Opciones con texto e imágenes
- Respuesta correcta marcada

### ✅ Textos de Lectura
- Título del texto
- Párrafo completo
- Imágenes y videos
- Configuración de contexto

## 💡 Consejos y Mejores Prácticas

1. **Crea preguntas de calidad**: Las preguntas que guardes estarán disponibles para todas tus pruebas futuras

2. **Usa nombres descriptivos**: Escribe preguntas claras para que sean fáciles de identificar en el banco

3. **Revisa antes de agregar**: Puedes ver toda la información de la pregunta antes de agregarla

4. **Edita si es necesario**: Las preguntas agregadas del banco se pueden editar en la prueba actual sin afectar el banco

5. **Organiza por materia**: El banco se organiza automáticamente por materia, así que siempre encontrarás las preguntas correctas

## 🔧 Estructura Técnica

### Base de Datos (Firebase)
```
bancoPreguntas/
  ├── matematicas/
  │   ├── materia: "matematicas"
  │   ├── questions: [...]
  │   └── fechaActualizacion: timestamp
  ├── lectura/
  ├── sociales/
  ├── ciencias/
  └── ingles/
```

### Cada Pregunta Incluye
- `type`: Tipo de pregunta (multiple, reading, short, open)
- `text`: Texto de la pregunta o párrafo
- `title`: Título (solo para textos de lectura)
- `images`: Array de imágenes con URLs
- `videos`: Array de videos de YouTube
- `options`: Opciones de respuesta (para preguntas múltiples)
- `showInQuestions`: Configuración de contexto (para textos de lectura)

## 🚀 Beneficios

✅ **Ahorra tiempo**: No vuelvas a crear las mismas preguntas
✅ **Consistencia**: Mantén la calidad de tus preguntas
✅ **Reutilización**: Usa preguntas en múltiples pruebas
✅ **Organización**: Todo organizado por materia
✅ **Búsqueda rápida**: Encuentra preguntas fácilmente
✅ **Sin duplicados**: El sistema evita guardar preguntas duplicadas

## 📝 Notas Importantes

- Las preguntas se guardan **por materia**, no por prueba
- Al agregar una pregunta del banco, se crea una **copia independiente**
- Editar una pregunta en una prueba **no afecta** la versión del banco
- El banco se actualiza cada vez que guardas una materia con preguntas nuevas
- No hay límite en la cantidad de preguntas que puedes guardar en el banco

---

**¡Disfruta de tu nuevo banco de preguntas y ahorra tiempo creando pruebas! 🎉**
