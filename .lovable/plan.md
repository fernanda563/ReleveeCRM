

## Plan: Selector de tipo de anillo con presets de dimensiones en la calculadora de peso de montura

### Concepto

Cada tipo de anillo tiene proporciones típicas distintas (ancho de banda y grosor de pared). Por ejemplo, un anillo de compromiso solitario es más delgado que una churumbela, y una argolla de matrimonio para caballero es más ancha y gruesa que una para dama. 

La propuesta es agregar un selector de tipo de anillo **antes** de los sliders, que al seleccionarse pre-llene los valores de ancho de banda y grosor de pared con defaults realistas. El usuario siempre puede ajustarlos después.

### Tipos de anillo y presets propuestos

| Tipo | Ancho (mm) | Grosor (mm) | Notas |
|---|---|---|---|
| Solitario (compromiso) | 2.0 | 1.5 | Banda fina, el peso se concentra en la montura de la piedra |
| Churumbela | 2.5 | 2.0 | Banda media con canal para piedras |
| Argolla matrimonio dama | 2.0 | 1.5 | Comfort-fit clásica delgada |
| Argolla matrimonio caballero | 4.0 | 2.0 | Más ancha y robusta |
| Anillo de arras | 2.0 | 1.0 | Muy finas y ligeras (×13 piezas) |
| Anillo coctel | 5.0 | 2.5 | Pieza ancha y vistosa |
| Sello / Signet | 6.0 | 2.5 | Superficie plana amplia |
| Banda lisa | 3.0 | 2.0 | Banda simple sin piedras |
| Personalizado | — | — | Sin presets, valores actuales |

**Para arras**: agregar un campo de cantidad de piezas (default 13) y mostrar el peso total multiplicado, similar a lo que hicimos en la calculadora de diamantes con el conteo de piedras.

### Implementación

**1. Constante `RING_TYPES`** — Array de objetos con `id`, `label`, `defaultWidth`, `defaultThickness`, `defaultCount` (1 para todos excepto arras=13).

**2. Selector visual** — Grid de botones compactos (como los de tipo de pieza en diamantes) con tooltips para descripción. Se coloca antes de los sliders.

**3. Estado `ringType`** y `pieceCount` — Al cambiar tipo, se actualizan `width`, `thickness` y `pieceCount` con los defaults. Un `useEffect` maneja esta lógica.

**4. Resultados** — Si `pieceCount > 1`, agregar una tarjeta adicional "Total (N piezas)" con el peso multiplicado. Las tarjetas existentes muestran "por pieza".

**5. El usuario puede editar** ancho/grosor/cantidad libremente después de seleccionar el tipo.

### Archivo modificado
- `src/components/crm/RingWeightCalculator.tsx`

