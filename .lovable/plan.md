

## Agregar máscaras de formato a campos de margen y redondeo

### Cambios en `src/components/materials/MaterialDialog.tsx`

1. **Cambiar `valor_margen` y `redondeo_multiplo` de `number` a `string`** en `MaterialFormData` para manejar valores formateados.

2. **Agregar función `formatPercentage`**: similar a `formatCurrency` pero con sufijo `%` en lugar de prefijo `$`.

3. **Campo "Valor de margen" (líneas 177-189)**:
   - Si `tipo_margen === "porcentaje"`: aplicar máscara de porcentaje (`formatPercentage`) → muestra ej: `25.5%`
   - Si `tipo_margen === "fijo"`: aplicar máscara de moneda (`formatCurrency`) → muestra ej: `$150.00`
   - Cambiar `type="number"` a `type="text"`

4. **Campo "Múltiplo de redondeo" (líneas 209-217)**:
   - Aplicar máscara de moneda (`formatCurrency`)
   - Cambiar `type="number"` a `type="text"`

5. **Lógica al cambiar `tipo_margen`**: cuando el usuario cambie entre porcentaje y fijo, reformatear el valor actual de `valor_margen` con la máscara correspondiente.

6. **`handleSubmit`**: convertir `valor_margen` y `redondeo_multiplo` de string formateado a número con `parseFloat(unformat...)`.

7. **`useEffect` de inicialización**: formatear valores numéricos existentes al abrir el diálogo.

8. **Cálculo de precio preview**: usar `parseFloat(unformat...)` para ambos campos.

### Regla general anotada

Todo campo de moneda en el proyecto debe usar la máscara `formatCurrency`/`unformatCurrency`. Todo campo de porcentaje debe usar `formatPercentage`/`unformatPercentage`.

