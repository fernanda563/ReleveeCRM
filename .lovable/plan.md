

## Ajustes a la calculadora de peso del anillo

### Cambios en `src/components/crm/RingWeightCalculator.tsx`

1. **Valores iniciales**: Cambiar `useState(7)` → `useState(5)` para talla, y `useState(4)` → `useState(2)` para ancho de banda.

2. **Slider de ancho de banda con decimales**: Cambiar el slider de `step={1}` a `step={0.1}` para permitir valores como 2.1, 2.2, etc. Actualizar el label para mostrar un decimal (`width.toFixed(1) mm`).

