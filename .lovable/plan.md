

## Aplicar máscara de moneda al campo "Costo directo por unidad"

Cambio en un solo archivo: `src/components/materials/MaterialDialog.tsx`.

### Cambios

1. **Cambiar `costo_directo` en el form state** de `number` a `string` para manejar el valor formateado (ej: `"$1,250.00"`).

2. **Agregar funciones `formatCurrency` y `unformatCurrency`** idénticas a las usadas en `OrderDialog.tsx`:
   - `formatCurrency`: limpia caracteres no numéricos, formatea con comas y prefijo `$`
   - `unformatCurrency`: extrae solo el valor numérico

3. **Actualizar el input de costo directo** (línea ~150):
   - Cambiar `type="number"` a `type="text"`
   - Usar `formatCurrency` en el `onChange`
   - Placeholder `"$0.00"`

4. **Actualizar `handleSubmit`**: antes de enviar, convertir el string formateado a número con `parseFloat(unformatCurrency(form.costo_directo))`.

5. **Actualizar el cálculo del precio preview**: usar `parseFloat(unformatCurrency(...))` para obtener el valor numérico antes de pasarlo a `calcularPrecioMaterial`.

6. **Actualizar `useEffect` de inicialización**: al cargar datos existentes, formatear el `costo_directo` numérico a string con `formatCurrency`.

Mismo patrón que ya se usa en `OrderDialog.tsx` para `precioVenta` e `importeAnticipo`.

