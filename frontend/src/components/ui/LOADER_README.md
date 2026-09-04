# CoreSpinLoader - Cargador Global del Proyecto

## Descripción
`CoreSpinLoader` es el componente de carga unificado para todo el proyecto Netland. Reemplaza todos los loaders anteriores (Skeleton, Spinner, etc.) con un diseño moderno y animado que incluye:

- ✨ Animaciones múltiples de anillos giratorios
- 🎨 Efectos de glow y blur
- 📝 Texto de estado dinámico que cambia cada segundo
- 🌙 Soporte para modo oscuro
- 🎯 Centro de atención visual

## Uso

### Importación
```tsx
import { CoreSpinLoader } from '../components/ui/CoreSpinLoader';
```

### Casos de Uso

#### 1. Carga de página completa (como PageLoader)
```tsx
if (isLoading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-netland-background">
      <CoreSpinLoader />
    </div>
  );
}
```

#### 2. Carga en secciones
```tsx
{isLoading ? (
  <CoreSpinLoader />
) : (
  <div>Contenido cargado</div>
)}
```

#### 3. Carga en tarjetas/Cards
```tsx
{isLoading ? (
  <Card>
    <div className="py-8">
      <CoreSpinLoader />
    </div>
  </Card>
) : (
  <Card>Contenido</Card>
)}
```

## Estados de texto
El loader muestra estos mensajes de forma rotativa (cada 1 segundo):
- Initializing
- Loading...
- Fetching Data..
- Syncing...
- Processing..
- Optimizing...

## Archivos actualizados
Se ha implementado en:
- ✅ `frontend/src/components/ui/PageLoader.tsx` - Loader principal de la app
- ✅ `frontend/src/pages/ProjectDetail.tsx` - Detalle de proyecto
- ✅ `frontend/src/pages/Projects.tsx` - Lista de proyectos
- ✅ `frontend/src/pages/Advisors.tsx` - Lista de asesores
- ✅ `frontend/src/pages/Home.tsx` - Sección de proyectos
- ✅ `frontend/src/features/admin/pages/Dashboard.tsx` - Dashboard admin
- ✅ `frontend/src/features/admin/pages/Lots.tsx` - Gestión de lotes
- ✅ `frontend/src/features/admin/pages/Leads.tsx` - Gestión de leads

## Características Técnicas
- **Sin dependencias externas**: Solo usa Tailwind CSS
- **Auto-contenido**: Maneja su propio estado interno
- **Responsive**: Se adapta a cualquier contenedor
- **Accesible**: Animaciones suaves que no causan mareo
- **Performance**: Optimizado con cleanup de intervals

## Personalización
El componente usa las siguientes clases de Tailwind que pueden personalizarse:
- Colores principales: `emerald-*`, `green-*`, `cyan-*`
- Tamaño: `w-20 h-20` (puede ajustarse cambiando estas clases)
- Espaciado: `min-h-[200px]` para el contenedor

## Migración desde otros loaders

### Desde Skeleton
```tsx
// Antes
<Skeleton className="h-32 rounded-lg" />

// Después
<CoreSpinLoader />
```

### Desde CardSkeleton
```tsx
// Antes
<div className="grid gap-8 md:grid-cols-2">
  <CardSkeleton />
  <CardSkeleton />
</div>

// Después
<CoreSpinLoader />
```

### Desde Spinner
```tsx
// Antes
<Spinner className="h-8 w-8" />

// Después  
<CoreSpinLoader />
```

## Notas
- El loader es completamente autónomo y no requiere props
- El `min-h-[200px]` asegura que tenga suficiente espacio vertical
- Se recomienda usarlo dentro de contenedores con flex o grid para centrarlo
