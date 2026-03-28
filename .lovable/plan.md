

## Plan: Estandarizar tarjetas de tipo de pieza y agregar ratio profundidad/diámetro automático

### Cambios

**1. Altura uniforme en tarjetas de tipo de pieza**

Agregar `h-12` (o similar) al botón de cada tipo de pieza para que todas tengan la misma altura independientemente del largo del texto.

**2. Ratios de profundidad por tipo de corte**

Definir un `depthRatio` en cada `CutDef` que represente la proporción típica profundidad/diámetro (o profundidad/largo para cortes no redondos):

| Corte | Ratio profundidad |
|---|---|
| Round | 0.615 (61.5% del diámetro) |
| Princess | 0.71 |
| Oval | 0.475 |
| Marquise | 0.35 |
| Pear | 0.40 |
| Heart | 0.60 |
| Cushion | 0.63 |
| Emerald | 0.50 |
| Radiant | 0.587 |
| Asscher | 0.70 |

**3. Lógica de sincronización slider ↔ profundidad**

- Agregar un estado `manualOverride: Record<string, boolean>` que rastree si el usuario ha editado manualmente (vía Input) una dimensión.
- Cuando el usuario mueve un **Slider** de diámetro/largo, la profundidad se recalcula automáticamente como `valor × depthRatio` (clamped al min/max), siempre que no haya override manual activo.
- Cuando el usuario mueve el **Slider** de profundidad, se recalcula el diámetro/largo inversamente.
- Cuando el usuario escribe directamente en el **Input numérico**, se marca `manualOverride[key] = true` y NO se recalcula la otra dimensión.
- Al cambiar de corte, se resetea el override.

**4. Implementación en `setDimValue`**

Crear una función `setDimViaSlider(key, val)` separada de `setDimViaInput(key, val)`:
- `setDimViaSlider`: actualiza el valor Y recalcula la dimensión complementaria usando el ratio
- `setDimViaInput`: actualiza solo el valor indicado, marca override

**5. Indicador visual**

Agregar un icono de enlace (🔗) o texto sutil junto al slider de profundidad indicando que está vinculado proporcionalmente. Si hay override manual, mostrar un botón "Vincular" para restablecer.

### Archivo modificado
- `src/pages/DiamondWeightCalculator.tsx`

