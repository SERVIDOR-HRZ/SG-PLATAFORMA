# Guía: Sistema de Simulacros Completamente Editable

## ✅ Cambios Implementados

Se ha creado un sistema completo para gestionar las tarjetas de simulacros desde el panel de administración con total libertad de edición.

### 1. Nueva Pestaña en Gestión de Contenido

Se agregó una nueva pestaña **"Simulacros"** en `Secciones/Gestion-Contenido.html` que permite:

- ✅ Agregar nuevos simulacros
- ✅ Editar simulacros existentes
- ✅ Eliminar simulacros
- ✅ Activar/Desactivar simulacros
- ✅ Reordenar simulacros

### 2. Campos Editables

Cada simulacro puede tener:

#### Imagen (Opcional)
- Subir una imagen personalizada para el simulacro
- Se sube a ImgBB automáticamente

#### Badge/Etiqueta
- **Texto del badge**: Ej: "Básico", "Premium", "Intensivo", "VIP", etc.
- **Color del badge**: 
  - Azul (Básico)
  - Dorado (Premium)
  - Morado (Intensivo)
  - Color personalizado (Hex)

#### Información Principal
- **Título**: Ej: "Simulacro Básico"
- **Descripción**: Ej: "Ideal para comenzar tu preparación"

#### Características
- Lista de características (una por línea)
- Cada característica se muestra con un ícono de check
- Ejemplo:
  ```
  50+ Simulacros
  Material de estudio
  Seguimiento básico
  Resultados inmediatos
  ```

#### Precio
- **Texto del precio**: Ej: "$50.000 COP", "$1 COP", "Gratis"
- **Color del precio**:
  - Rojo (por defecto)
  - Dorado
  - Azul
  - Verde

#### Opciones Adicionales
- **Destacar tarjeta**: Agrega borde dorado y hace la tarjeta más grande
- **Activo**: Muestra/oculta el simulacro en la página principal

### 3. Estructura de Datos en Firebase

Los simulacros se guardan en la colección `simulacros` con la siguiente estructura:

```javascript
{
  badge: "Premium",
  badgeColor: "premium", // basic, premium, intensive, custom
  customColor: "#ff0000", // Solo si badgeColor es "custom"
  titulo: "Simulacro Premium",
  descripcion: "La mejor preparación para tu examen",
  caracteristicas: [
    "200+ Simulacros",
    "Tutorías personalizadas",
    "Análisis detallado",
    "Garantía de resultados",
    "Acceso de por vida"
  ],
  precio: "$80.000 COP",
  precioColor: "gold", // red, gold, blue, green
  imagen: "https://...", // URL de la imagen (opcional)
  destacado: true, // true/false
  activo: true, // true/false
  orden: 0, // Para ordenar las tarjetas
  fechaCreacion: timestamp,
  fechaActualizacion: timestamp
}
```

## 📋 Pasos para Usar el Sistema

### Paso 1: Acceder al Panel de Gestión

1. Inicia sesión como administrador
2. Ve al Panel de Administración
3. Click en "Gestión de Contenido Web"
4. Selecciona la pestaña "Simulacros"

### Paso 2: Agregar un Nuevo Simulacro

1. Click en el botón "Agregar Simulacro"
2. Completa todos los campos:
   - (Opcional) Sube una imagen
   - Escribe el texto del badge (Ej: "Premium")
   - Selecciona el color del badge
   - Escribe el título
   - Escribe la descripción
   - Agrega las características (una por línea)
   - Escribe el precio
   - Selecciona el color del precio
   - Marca si quieres destacar la tarjeta
   - Marca si está activo
3. Click en "Guardar"

### Paso 3: Editar un Simulacro Existente

1. En la lista de simulacros, click en el ícono de lápiz (editar)
2. Modifica los campos que desees
3. Click en "Guardar"

### Paso 4: Eliminar un Simulacro

1. Click en el ícono de basura (eliminar)
2. Confirma la eliminación

### Paso 5: Activar/Desactivar un Simulacro

1. Click en el ícono de ojo
2. El simulacro se ocultará/mostrará en la página principal

## 🔄 Migración de Datos Existentes

Para migrar los simulacros actuales (hardcodeados en el HTML) a Firebase, sigue estos pasos:

### Opción 1: Crear Manualmente desde el Panel

1. Accede al panel de gestión
2. Crea cada simulacro con los datos actuales:

**Simulacro Básico:**
- Badge: "Básico"
- Color Badge: Azul (Básico)
- Título: "Simulacro Básico"
- Descripción: "Ideal para comenzar tu preparación"
- Características:
  ```
  50+ Simulacros
  Material de estudio
  Seguimiento básico
  Resultados inmediatos
  ```
- Precio: "$50.000 COP"
- Color Precio: Rojo

**Simulacro Premium:**
- Badge: "Premium"
- Color Badge: Dorado (Premium)
- Título: "Simulacro Premium"
- Descripción: "La mejor preparación para tu examen"
- Características:
  ```
  200+ Simulacros
  Tutorías personalizadas
  Análisis detallado
  Garantía de resultados
  Acceso de por vida
  ```
- Precio: "$80.000 COP"
- Color Precio: Dorado
- ✅ Destacar tarjeta

**Simulacro Intensivo:**
- Badge: "Intensivo"
- Color Badge: Morado (Intensivo)
- Título: "Simulacro Intensivo"
- Descripción: "Preparación acelerada y efectiva"
- Características:
  ```
  100+ Simulacros
  Clases en vivo
  Seguimiento avanzado
  Soporte prioritario
  ```
- Precio: "$65.000 COP"
- Color Precio: Rojo

### Opción 2: Script de Migración Automática

Puedes ejecutar este script en la consola del navegador (F12) cuando estés en la página de gestión de contenido:

```javascript
// Script de migración de simulacros
async function migrarSimulacros() {
  const db = firebase.firestore();
  
  const simulacros = [
    {
      badge: "Básico",
      badgeColor: "basic",
      titulo: "Simulacro Básico",
      descripcion: "Ideal para comenzar tu preparación",
      caracteristicas: [
        "50+ Simulacros",
        "Material de estudio",
        "Seguimiento básico",
        "Resultados inmediatos"
      ],
      precio: "$50.000 COP",
      precioColor: "red",
      destacado: false,
      activo: true,
      orden: 0,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    },
    {
      badge: "Premium",
      badgeColor: "premium",
      titulo: "Simulacro Premium",
      descripcion: "La mejor preparación para tu examen",
      caracteristicas: [
        "200+ Simulacros",
        "Tutorías personalizadas",
        "Análisis detallado",
        "Garantía de resultados",
        "Acceso de por vida"
      ],
      precio: "$80.000 COP",
      precioColor: "gold",
      destacado: true,
      activo: true,
      orden: 1,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    },
    {
      badge: "Intensivo",
      badgeColor: "intensive",
      titulo: "Simulacro Intensivo",
      descripcion: "Preparación acelerada y efectiva",
      caracteristicas: [
        "100+ Simulacros",
        "Clases en vivo",
        "Seguimiento avanzado",
        "Soporte prioritario"
      ],
      precio: "$65.000 COP",
      precioColor: "red",
      destacado: false,
      activo: true,
      orden: 2,
      fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
    }
  ];
  
  for (const simulacro of simulacros) {
    await db.collection('simulacros').add(simulacro);
    console.log(`Simulacro "${simulacro.titulo}" migrado exitosamente`);
  }
  
  console.log('✅ Migración completada');
  alert('Simulacros migrados exitosamente. Recarga la página.');
}

// Ejecutar migración
migrarSimulacros();
```

## 🎨 Estilos CSS Necesarios

Agrega estos estilos al archivo `Elementos/css/landing.css` para que los simulacros se vean correctamente:

```css
/* Simulacros Section */
.simulacro-section {
    padding: 5rem 0;
    background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
}

.simulacro-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.simulacro-card {
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    border-radius: 20px;
    padding: 2rem;
    text-align: center;
    transition: all 0.3s ease;
    border: 2px solid transparent;
    position: relative;
}

.simulacro-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 10px 30px rgba(220, 20, 60, 0.3);
}

.simulacro-card.featured {
    border: 3px solid var(--gold);
    transform: scale(1.05);
}

.simulacro-card.featured:hover {
    transform: scale(1.08) translateY(-10px);
}

.simulacro-image {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 10px;
    margin-bottom: 1rem;
}

.simulacro-badge {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    border-radius: 25px;
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--primary-red), var(--dark-red));
    color: white;
}

.simulacro-badge.gold {
    background: linear-gradient(135deg, var(--gold), var(--dark-gold));
    color: var(--black);
}

.simulacro-card h3 {
    font-size: 1.8rem;
    margin-bottom: 1rem;
    color: var(--white);
}

.simulacro-card p {
    color: #cccccc;
    margin-bottom: 1.5rem;
}

.simulacro-card ul {
    list-style: none;
    text-align: left;
    margin: 1.5rem 0;
}

.simulacro-card ul li {
    padding: 0.5rem 0;
    color: #cccccc;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.simulacro-card ul li i {
    color: var(--primary-red);
    font-size: 1.2rem;
}

.price-tag {
    font-size: 2rem;
    font-weight: bold;
    color: var(--primary-red);
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(220, 20, 60, 0.1);
    border-radius: 10px;
}

.price-tag.featured-price {
    color: var(--gold);
    background: rgba(255, 215, 0, 0.1);
}

.price-tag.blue-price {
    color: #1976d2;
    background: rgba(25, 118, 210, 0.1);
}

.price-tag.green-price {
    color: #28a745;
    background: rgba(40, 167, 69, 0.1);
}
```

## 🚀 Ventajas del Nuevo Sistema

1. **Total Control**: Edita todos los aspectos de cada simulacro
2. **Flexibilidad**: Agrega tantos simulacros como necesites
3. **Imágenes Personalizadas**: Cada simulacro puede tener su propia imagen
4. **Colores Personalizados**: Elige colores para badges y precios
5. **Destacar Tarjetas**: Resalta los simulacros más importantes
6. **Activar/Desactivar**: Oculta simulacros sin eliminarlos
7. **Reordenar**: Controla el orden de aparición
8. **Sin Código**: Todo desde el panel de administración

## 📝 Notas Importantes

- Los simulacros solo se muestran en la página principal si están marcados como "Activo"
- El orden de los simulacros se determina por el campo `orden`
- Las imágenes son opcionales, si no se agrega una imagen, solo se muestra el contenido
- Los colores personalizados permiten crear badges únicos para cada simulacro
- La opción "Destacar" agrega un borde dorado y hace la tarjeta más grande

## 🔧 Solución de Problemas

### Los simulacros no aparecen en la página principal

1. Verifica que los simulacros estén marcados como "Activo"
2. Recarga la página principal (Ctrl + F5)
3. Verifica la consola del navegador (F12) para errores

### Las imágenes no se cargan

1. Verifica que la URL de la imagen sea válida
2. Asegúrate de que la imagen se haya subido correctamente a ImgBB
3. Intenta subir la imagen nuevamente

### Los colores no se aplican correctamente

1. Verifica que los estilos CSS estén agregados al archivo `landing.css`
2. Limpia la caché del navegador (Ctrl + Shift + Delete)
3. Recarga la página con Ctrl + F5

## ✅ Checklist de Implementación

- [x] Agregar pestaña "Simulacros" en gestión de contenido
- [x] Crear formulario de edición completo
- [x] Implementar subida de imágenes
- [x] Agregar opciones de colores personalizados
- [x] Crear funciones de carga desde Firebase
- [x] Implementar activar/desactivar
- [x] Agregar opción de destacar tarjetas
- [ ] Agregar estilos CSS al archivo landing.css
- [ ] Migrar datos existentes a Firebase
- [ ] Probar en la página principal

## 🎯 Próximos Pasos

1. Agrega los estilos CSS al archivo `Elementos/css/landing.css`
2. Ejecuta el script de migración o crea los simulacros manualmente
3. Verifica que los simulacros aparezcan correctamente en la página principal
4. Personaliza los simulacros según tus necesidades

¡Ahora tienes control total sobre la sección de simulacros! 🎉
