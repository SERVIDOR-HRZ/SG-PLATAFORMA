# 📊 Diagrama del Sistema de Simulacros Editables

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    SEAMOS GENIOS                             │
│                 Sistema de Simulacros                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────┐                          ┌───────────────┐
│  PANEL ADMIN  │                          │  PÁGINA WEB   │
│               │                          │   (Landing)   │
└───────────────┘                          └───────────────┘
        │                                           │
        │ CRUD Operations                           │ Read Only
        │                                           │
        ▼                                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      FIREBASE FIRESTORE                      │
│                   Colección: simulacros                      │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐           │
│  │ Simulacro  │  │ Simulacro  │  │ Simulacro  │           │
│  │  Básico    │  │  Premium   │  │ Intensivo  │  ...      │
│  └────────────┘  └────────────┘  └────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujo de Datos

### Crear/Editar Simulacro

```
┌──────────────┐
│ Administrador│
└──────┬───────┘
       │
       │ 1. Accede al panel
       ▼
┌──────────────────────┐
│ Gestión de Contenido │
│   Pestaña Simulacros │
└──────┬───────────────┘
       │
       │ 2. Click "Agregar/Editar"
       ▼
┌──────────────────────┐
│  Modal de Edición    │
│  - Badge             │
│  - Título            │
│  - Descripción       │
│  - Características   │
│  - Precio            │
│  - Imagen (opcional) │
│  - Opciones          │
└──────┬───────────────┘
       │
       │ 3. Completa formulario
       │ 4. Click "Guardar"
       ▼
┌──────────────────────┐
│  Subir Imagen        │
│  (si hay imagen)     │
│  → ImgBB API         │
└──────┬───────────────┘
       │
       │ 5. Obtiene URL
       ▼
┌──────────────────────┐
│  Guardar en Firebase │
│  Colección:          │
│  simulacros          │
└──────┬───────────────┘
       │
       │ 6. Confirmación
       ▼
┌──────────────────────┐
│  Recarga lista       │
│  de simulacros       │
└──────────────────────┘
```

### Mostrar en Página Web

```
┌──────────────┐
│   Usuario    │
│   Visitante  │
└──────┬───────┘
       │
       │ 1. Visita index.html
       ▼
┌──────────────────────┐
│  Página Principal    │
│  (Landing)           │
└──────┬───────────────┘
       │
       │ 2. DOMContentLoaded
       ▼
┌──────────────────────┐
│ loadSimulacrosFrom   │
│ Firebase()           │
└──────┬───────────────┘
       │
       │ 3. Query Firebase
       ▼
┌──────────────────────┐
│  Firebase Firestore  │
│  WHERE activo = true │
│  ORDER BY orden      │
└──────┬───────────────┘
       │
       │ 4. Retorna datos
       ▼
┌──────────────────────┐
│  Renderizar Tarjetas │
│  - Crear HTML        │
│  - Aplicar estilos   │
│  - Insertar en DOM   │
└──────┬───────────────┘
       │
       │ 5. Muestra al usuario
       ▼
┌──────────────────────┐
│  Sección Simulacros  │
│  Pre-ICFES           │
│  ┌────┐ ┌────┐ ┌────┐│
│  │ 💳 │ │ 💳 │ │ 💳 ││
│  └────┘ └────┘ └────┘│
└──────────────────────┘
```

## 📦 Estructura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    GESTIÓN DE CONTENIDO                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              PESTAÑA SIMULACROS                     │    │
│  ├────────────────────────────────────────────────────┤    │
│  │                                                     │    │
│  │  [+ Agregar Simulacro]                             │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │  Simulacro Card                              │ │    │
│  │  │  ┌────────────┐                              │ │    │
│  │  │  │   Imagen   │                              │ │    │
│  │  │  └────────────┘                              │ │    │
│  │  │  [Badge] Título                              │ │    │
│  │  │  Descripción...                              │ │    │
│  │  │  ✓ Característica 1                          │ │    │
│  │  │  ✓ Característica 2                          │ │    │
│  │  │  $XX.XXX COP                                 │ │    │
│  │  │  [Activo]                                    │ │    │
│  │  │  [👁️] [✏️] [🗑️]                              │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Flujo de Personalización

```
┌─────────────────────────────────────────────────────────────┐
│                  OPCIONES DE PERSONALIZACIÓN                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BADGE                                                       │
│  ├─ Texto: "Básico", "Premium", "VIP", etc.                │
│  └─ Color: Azul, Dorado, Morado, Personalizado             │
│                                                              │
│  CONTENIDO                                                   │
│  ├─ Título: Texto libre                                     │
│  ├─ Descripción: Texto libre                                │
│  └─ Características: Lista (una por línea)                  │
│                                                              │
│  PRECIO                                                      │
│  ├─ Texto: "$XX.XXX COP", "Gratis", etc.                   │
│  └─ Color: Rojo, Dorado, Azul, Verde                       │
│                                                              │
│  IMAGEN (Opcional)                                           │
│  └─ Subir archivo → ImgBB → URL                            │
│                                                              │
│  OPCIONES                                                    │
│  ├─ Destacar: Borde dorado + Más grande                    │
│  ├─ Activo: Mostrar/Ocultar en web                         │
│  └─ Orden: Posición en la lista                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Seguridad y Permisos

```
┌─────────────────────────────────────────────────────────────┐
│                      CONTROL DE ACCESO                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ADMINISTRADOR                                               │
│  ├─ ✅ Crear simulacros                                     │
│  ├─ ✅ Editar simulacros                                    │
│  ├─ ✅ Eliminar simulacros                                  │
│  ├─ ✅ Activar/Desactivar                                   │
│  └─ ✅ Subir imágenes                                       │
│                                                              │
│  USUARIO VISITANTE                                           │
│  ├─ ✅ Ver simulacros activos                               │
│  └─ ❌ No puede editar                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Modelo de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                    COLECCIÓN: simulacros                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Documento ID: auto-generado                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  badge: string                                         │ │
│  │  badgeColor: "basic"|"premium"|"intensive"|"custom"   │ │
│  │  customColor: string (hex) [opcional]                 │ │
│  │  titulo: string                                        │ │
│  │  descripcion: string                                   │ │
│  │  caracteristicas: array<string>                       │ │
│  │  precio: string                                        │ │
│  │  precioColor: "red"|"gold"|"blue"|"green"            │ │
│  │  imagen: string (URL) [opcional]                      │ │
│  │  destacado: boolean                                    │ │
│  │  activo: boolean                                       │ │
│  │  orden: number                                         │ │
│  │  fechaCreacion: timestamp                             │ │
│  │  fechaActualizacion: timestamp                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Casos de Uso

### Caso 1: Cambiar Precio de un Simulacro
```
Admin → Gestión Contenido → Simulacros → [✏️ Editar]
→ Cambiar campo "Precio" → Guardar
→ Actualización inmediata en Firebase
→ Cambio visible en la web al recargar
```

### Caso 2: Agregar Nuevo Simulacro "Empresarial"
```
Admin → Gestión Contenido → Simulacros → [+ Agregar]
→ Badge: "Empresarial", Color: Personalizado (#2c3e50)
→ Título: "Simulacro Empresarial"
→ Descripción: "Para empresas que capacitan empleados"
→ Características: Lista de beneficios
→ Precio: "$200.000 COP", Color: Azul
→ Destacar: ✅
→ Guardar
→ Nuevo simulacro visible en la web
```

### Caso 3: Ocultar Temporalmente un Simulacro
```
Admin → Gestión Contenido → Simulacros
→ Click [👁️] en el simulacro
→ Estado cambia a "Inactivo"
→ Simulacro oculto en la web (sin eliminar datos)
→ Click [👁️] nuevamente para reactivar
```

## 🔄 Ciclo de Vida de un Simulacro

```
┌─────────────┐
│   CREADO    │ ← Admin crea nuevo simulacro
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   ACTIVO    │ ← Visible en la web
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  EDITADO    │   │  INACTIVO   │ ← Oculto temporalmente
└──────┬──────┘   └──────┬──────┘
       │                 │
       │                 │ Reactivar
       │                 ▼
       │          ┌─────────────┐
       │          │   ACTIVO    │
       │          └─────────────┘
       │
       ▼
┌─────────────┐
│  ELIMINADO  │ ← Borrado permanente
└─────────────┘
```

## 📈 Escalabilidad

```
ACTUAL:
┌────────┐ ┌────────┐ ┌────────┐
│Básico  │ │Premium │ │Intensivo│
└────────┘ └────────┘ └────────┘

FUTURO (Ilimitado):
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│Básico  │ │Premium │ │Intensivo│ │  VIP   │ │Empresas│
└────────┘ └────────┘ └────────┘ └────────┘ └────────┘
┌────────┐ ┌────────┐ ┌────────┐
│Mensual │ │Anual   │ │Lifetime │  ...
└────────┘ └────────┘ └────────┘
```

---

**Sistema Diseñado para Seamos Genios** 🚀
Flexible, Escalable y Fácil de Usar
