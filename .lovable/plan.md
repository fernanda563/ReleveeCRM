

## Problema

La página de Cotizaciones (`/projects`) muestra las tarjetas `ProspectCard` en un layout `flex flex-col gap-4` (una tarjeta por fila, ancho completo). Esto difiere del patrón estándar de administración que usa `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.

Además, la tarjeta muestra demasiada información detallada (metal, piedra, estilo, largo, observaciones) que debería reservarse para el diálogo de detalle.

## Cambios propuestos

### 1. `src/pages/Projects.tsx` — Cambiar layout de lista

Reemplazar el contenedor de tarjetas de:
```
<div className="flex flex-col gap-4">
```
a:
```
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### 2. `src/components/client-detail/ProspectCard.tsx` — Rediseñar como tarjeta vertical compacta

Adaptar la tarjeta al patrón estándar de administración (similar a `MaterialCard`):

- **Header**: Título de la cotización (`generateProspectTitle`) con `DropdownMenu` (MoreHorizontal) a la derecha
- **Badges**: Estado + tipo de pieza como badges debajo del título
- **Body compacto**: Solo mostrar información clave resumida:
  - Metal (tipo + color/pureza en una línea)
  - Importe previsto
  - Fecha de entrega deseada
- **Eliminar** de la vista de tarjeta: piedra, estilo, largo, observaciones (se ven al hacer clic en detalle)
- **Fila de cliente**: Se mantiene condicional (`showClientName`) pero como badge o línea compacta
- **Notas**: Si hay observaciones, mostrar truncadas con `line-clamp-2` como en MaterialCard

La estructura seguirá el patrón: `CardHeader` (título + menú) → badges → `CardContent` (grid de datos compactos).

