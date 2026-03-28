

## Plan: Reducir el mínimo de ancho de banda a 1 mm

Cambiar el valor mínimo del control de ancho de banda de 2 mm a 1 mm en `src/components/crm/RingWeightCalculator.tsx`. Esto afecta:

1. El `<Slider>` — cambiar `min={2}` a `min={1}`
2. El `<Input>` — cambiar `min={2}` a `min={1}` y ajustar el clamp en el `onChange`
3. La etiqueta inferior del slider — cambiar `"2 mm"` a `"1 mm"`

### Archivo modificado
- `src/components/crm/RingWeightCalculator.tsx`

