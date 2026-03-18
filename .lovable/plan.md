

## Estandarizar layout de tarjetas de Materiales

Actualmente las tarjetas de materiales se renderizan en `<div className="grid gap-3">` (una sola columna, ancho completo). Las tarjetas de Mano de Obra usan `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`.

### Cambio

**`src/pages/Materials.tsx` (línea ~189)**: Cambiar la clase del grid de resultados:

```
// Antes
<div className="grid gap-3">

// Después
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

**`src/components/materials/MaterialCard.tsx`**: Adaptar el layout interno de la tarjeta para que funcione bien en formato card (no row). Reorganizar la estructura para que sea vertical similar a `WorkConceptCard`:
- Nombre + badges arriba
- Grid 2×2 con costo, margen, redondeo, precio resultante
- Notas al pie
- Botones de editar/eliminar en un dropdown menu (como en WorkConceptCard) en vez de iconos flotantes

