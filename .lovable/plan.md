

## Plan: Agregar tipo de cambio USD/MXN a la sincronización de precios de metales

### Resumen

Consultar el tipo de cambio USD→MXN durante cada sincronización de precios, guardar los precios en ambas divisas, y mostrar ambas columnas en la tarjeta de configuración. Los materiales en la base de datos se almacenarán en MXN (pesos mexicanos) en lugar de USD.

### Cambios detallados

**1. Edge Function `fetch-metal-prices/index.ts`**

- Después de obtener los precios de Metals.dev, hacer un fetch al tipo de cambio USD/MXN usando una API gratuita (ej. `https://api.exchangerate-api.com/v4/latest/USD` — no requiere API key)
- Extraer `rates.MXN` del response
- En el `price_table`, agregar campo `precio_gramo_mxn` = `precio_gramo * tipoCambio` (redondeado a 2 decimales)
- Al actualizar los materiales en la tabla `materials`, guardar el precio en MXN en `costo_directo` (en vez de USD)
- Guardar el tipo de cambio en `system_settings` (key: `metal_price_exchange_rate`, category: `metals`) con valor `{ usd_mxn: number, updated_at: string }`
- Incluir `exchange_rate` y `precio_gramo_mxn` en el response JSON

**2. MetalPriceSettingsCard.tsx**

- Actualizar la interfaz `PriceRow` para incluir `precio_gramo_mxn`
- Cargar el tipo de cambio desde `system_settings` al iniciar
- Mostrar el tipo de cambio actual (ej. "1 USD = $20.45 MXN") en un badge o info box
- En la tabla de precios, mostrar dos columnas: USD/g y MXN/g lado a lado
- Actualizar el estado con los nuevos datos después de cada sync manual

**3. MaterialCard.tsx**

- Los precios ya se muestran con `$` y `toLocaleString("es-MX")` — al cambiar el costo base a MXN, los precios se mostrarán automáticamente en pesos. Agregar indicador "MXN" junto al precio para mayor claridad.

**4. MaterialDialog.tsx**

- En el `useEffect` que auto-asigna el costo directo, usar `precio_gramo_mxn` del price table en vez de `precio_gramo` (USD)

### API de tipo de cambio

Se usará `https://api.exchangerate-api.com/v4/latest/USD` (gratuita, sin API key, hasta 1,500 requests/mes). Alternativa: `https://open.er-api.com/v6/latest/USD`.

### Archivos modificados

- `supabase/functions/fetch-metal-prices/index.ts` — fetch tipo de cambio, calcular MXN, guardar en system_settings
- `src/components/settings/MetalPriceSettingsCard.tsx` — mostrar USD y MXN, tipo de cambio
- `src/components/materials/MaterialCard.tsx` — indicador "MXN"
- `src/components/materials/MaterialDialog.tsx` — usar `precio_gramo_mxn`

