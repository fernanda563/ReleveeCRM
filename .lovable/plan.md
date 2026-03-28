

## Plan: Grosor de pared — step 0.1 mm y máximo 4 mm

### Cambios en 2 archivos

**`src/components/crm/RingWeightCalculator.tsx`** y **`src/pages/PieceWeightCalculator.tsx`** — mismos cambios en ambos:

1. **THICKNESS_LABELS** — agregar entrada `3.5: "Muy gruesa"` y `4: "Extra gruesa"` (los valores intermedios como 1.7 usarán el fallback `${thickness} mm`)

2. **Input numérico** — cambiar `step={0.5}` → `step={0.1}`, `max={3}` → `max={4}`, y el redondeo de `* 2) / 2` (round a 0.5) → `* 10) / 10` (round a 0.1), clamp a `max 4`

3. **Slider** — actualmente usa una conversión indirecta (`(thickness - 1) * 2`, step 1, max 4) que solo permite saltos de 0.5. Cambiar a slider directo: `value={[thickness]}`, `min={1}`, `max={4}`, `step={0.1}`, `onValueChange={([v]) => setThickness(Math.round(v * 10) / 10)}`

4. **Etiqueta del rango** — cambiar `3 mm` → `4 mm`

