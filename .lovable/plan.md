

## Corrección de estilos en tarjetas de quilataje

### Problema raíz

El componente `ToggleGroupItem` usa `toggleVariants` que incluye `data-[state=on]:bg-accent data-[state=on]:text-accent-foreground`. Estas clases con el selector `data-[state=on]` tienen mayor especificidad CSS que las clases normales como `!bg-primary`, por lo que sobrescriben los estilos custom. Además, `cn()` (que usa `twMerge`) no puede resolver conflictos entre clases con y sin `data-` prefijo.

### Solución

**`src/components/crm/RingWeightCalculator.tsx`** — Reemplazar el `ToggleGroupItem` por botones `div` manuales que no hereden los estilos del toggle. Usar botones simples con `onClick` y manejar el estado directamente, aplicando:

- Seleccionado: `bg-primary text-primary-foreground` (fondo negro, texto blanco) sin interferencia del toggle base
- No seleccionado: `bg-background text-foreground border border-border`
- Padding: `py-5 px-3` para dar altura suficiente al contenido

Reemplazar el `ToggleGroup` + `ToggleGroupItem` por un `div` con 3 botones styled, eliminando la dependencia del componente toggle que causa el conflicto de estilos.

