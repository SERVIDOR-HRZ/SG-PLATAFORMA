# 📱 Guía de Integración WhatsApp - Simulacros

## Funcionalidad Implementada

Se ha agregado integración con WhatsApp para que los usuarios puedan contactar directamente al hacer clic en el precio de cualquier simulacro.

## Características

### 1. **Click en Precio**
- Al hacer clic en el precio de un simulacro, se abre WhatsApp automáticamente
- Funciona tanto en escritorio como en móvil
- El mensaje se genera automáticamente con toda la información del simulacro

### 2. **Mensaje Automático**
El mensaje incluye:
- ✅ Título del simulacro
- ✅ Precio
- ✅ Descripción
- ✅ Lista de características
- ✅ URL de la página actual

### 3. **Efecto Visual**
- El precio tiene cursor pointer (manita)
- Al pasar el mouse, muestra "💬 Contactar por WhatsApp"
- Efecto de elevación con sombra verde (color WhatsApp)
- Transición suave

## Configuración

### Número de WhatsApp
El número está configurado en `Elementos/js/landing.js`:

```javascript
const phoneNumber = '573042797630'; // +57 304 2797630
```

Para cambiar el número, edita esta línea en la función `contactarWhatsApp()`.

## Ejemplo de Mensaje Generado

```
¡Hola! 👋

Estoy interesado en el simulacro:

📚 *Simulacro Básico ICFES*
💰 Precio: $50.000 COP

📝 Prepárate para el ICFES con nuestro simulacro básico

✅ Características:
• 100 preguntas tipo ICFES
• Retroalimentación inmediata
• Acceso por 30 días
• Estadísticas detalladas

Me gustaría obtener más información sobre este simulacro.

Página: https://seamosgenios.org/
```

## Cómo Funciona

1. **Usuario hace clic** en el precio del simulacro
2. **JavaScript captura** el evento y llama a `contactarWhatsApp(simulacro)`
3. **Se genera** el mensaje con toda la información
4. **Se codifica** el mensaje para URL
5. **Se abre** WhatsApp Web (escritorio) o la app (móvil)
6. **El mensaje** aparece pre-escrito, listo para enviar

## Compatibilidad

- ✅ WhatsApp Web (navegadores de escritorio)
- ✅ WhatsApp App (dispositivos móviles)
- ✅ Todos los navegadores modernos
- ✅ iOS y Android

## Personalización

### Cambiar el Mensaje
Edita la función `contactarWhatsApp()` en `Elementos/js/landing.js`:

```javascript
function contactarWhatsApp(simulacro) {
    const phoneNumber = '573042797630';
    
    // Personaliza el mensaje aquí
    let mensaje = `Tu mensaje personalizado...`;
    
    // ... resto del código
}
```

### Cambiar el Estilo del Hover
Edita `.price-tag::before` en `Elementos/css/landing.css`:

```css
.price-tag::before {
    content: '💬 Tu texto aquí';
    background: linear-gradient(135deg, #25D366, #128C7E);
    /* ... más estilos */
}
```

## Notas Importantes

1. **Formato del Número**: El número debe estar en formato internacional sin el símbolo `+`
   - ✅ Correcto: `573042797630`
   - ❌ Incorrecto: `+57 304 2797630`

2. **Codificación**: El mensaje se codifica automáticamente para URL, por lo que caracteres especiales funcionan correctamente

3. **Ventana Nueva**: WhatsApp se abre en una nueva pestaña/ventana para no interrumpir la navegación

## Pruebas

Para probar la funcionalidad:

1. Abre `index.html` en tu navegador
2. Ve a la sección de Simulacros
3. Haz clic en cualquier precio
4. Verifica que se abra WhatsApp con el mensaje correcto

## Soporte

Si necesitas ayuda o quieres personalizar más la funcionalidad, revisa:
- `Elementos/js/landing.js` - Función `contactarWhatsApp()`
- `Elementos/css/landing.css` - Estilos `.price-tag`
