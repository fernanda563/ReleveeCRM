

## Plan: Mostrar precios de metales en la tarjeta de configuración y bloquear edición de campos automáticos en materiales

### Resumen

Dos cambios principales:
1. **MetalPriceSettingsCard**: Después de sincronizar, mostrar una tabla con los precios por gramo de cada metal y su desglose por pureza (los precios que la API devuelve y calcula).
2. **MaterialDialog**: Cuando el material es de categoría "Metales" y tiene `tipo_material` en (oro, plata, platino), deshabilitar los campos de categoría, tipo de material, kilataje, color, unidad de medida y costo directo — ya que estos se actualizan automáticamente vía la API. Solo permitir editar margen, redondeo y notas.

### Cambios detallados

**1. Edge Function `fetch-metal-prices` (modificación menor)**

Ya retorna `api_prices` con los precios base. Agregar al response un campo `price_table` con el desglose completo por pureza para que el frontend lo muestre:

```json
{
  "price_table": [
    { "metal": "Oro", "pureza": "24k", "factor": 1.0, "precio_gramo": 95.23 },
    { "metal": "Oro", "pureza": "18k", "factor": 0.75, "precio_gramo": 71.42 },
    ...
  ]
}
```

Además, guardar este `price_table` en `system_settings` (key: `metal_price_table`, category: `metals`) para que la tarjeta pueda mostrarlo sin necesidad de volver a llamar a la API.

**2. MetalPriceSettingsCard**

- Cargar el `price_table` de `system_settings` al iniciar
- Mostrar una tabla/grid con columnas: Metal, Pureza, Factor, Precio USD/g
- Actualizar la tabla después de cada sincronización manual (usando el response de la edge function)
- Agrupar visualmente por metal (Oro, Plata, Platino)

**3. MaterialDialog — bloquear campos para metales con API**

Determinar si el material es "automático" (categoría = "Metales" AND tipo_material IN ['oro', 'plata', 'platino'] AND tiene kilataje). Cuando es así:

- Deshabilitar (`disabled`) los selects de: categoría, tipo de material, kilataje, color, unidad de medida
- Deshabilitar el input de costo directo
- Mostrar un aviso: "El costo directo de este material se actualiza automáticamente desde la API de precios de metales"
- Dejar editables: tipo de margen, valor de margen, redondeo, múltiplo de redondeo, notas, activo

**4. MaterialCard — indicador visual**

Agregar un badge o icono sutil en las tarjetas de materiales con precio automático (ej. icono `RefreshCw` o badge "API") para que el usuario identifique cuáles se actualizan automáticamente.

### Archivos modificados

- `supabase/functions/fetch-metal-prices/index.ts` — agregar `price_table` al response y guardarlo en `system_settings`
- `src/components/settings/MetalPriceSettingsCard.tsx` — mostrar tabla de precios por pureza
- `src/components/materials/MaterialDialog.tsx` — deshabilitar campos para metales automáticos
- `src/components/materials/MaterialCard.tsx` — badge indicador de precio automático

