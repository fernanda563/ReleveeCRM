

## Rediseño de la sección de requisitos y eliminación del alert rojo

### Cambios en `src/components/crm/QuotationDialog.tsx`

**1. Eliminar el alert box rojo** (líneas 620-628): Quitar completamente el bloque `text-destructive bg-destructive/10` con el `AlertCircle`.

**2. Rediseñar la tarjeta de requisitos** (líneas 483-522): Reemplazar el diseño actual por uno más limpio y minimalista, acorde al sistema de diseño monocromático:

- Quitar el fondo `bg-muted/50` y usar solo un borde sutil `border border-border`.
- Integrar los indicadores de estado (✓ / pendiente) de forma más sutil, usando texto `text-muted-foreground` para pendientes y `font-medium` para completados.
- Los mensajes de validación ("Falta agregar...") se mostrarán inline dentro de la misma tarjeta de requisitos, como texto `text-muted-foreground text-xs` debajo de cada requisito pendiente, en lugar de un alert box separado.
- Los checkboxes se mantienen pero con mejor alineación visual.
- El título "Requisitos para: X" se simplifica a algo como "Requisitos — Anillo de Compromiso" en una sola línea más compacta.

Resultado: una tarjeta limpia, sin colores semánticos (rojo/verde), con indicadores sutiles de estado y validación integrada.

