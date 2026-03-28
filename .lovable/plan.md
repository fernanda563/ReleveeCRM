

## Plan: Agregar inputs numéricos a los controles de la calculadora de peso de montura

### Resumen

Replicar el patrón ya implementado en la calculadora de diamantes: agregar un `<Input>` numérico compacto al lado de cada slider (Talla US, Ancho de banda, Grosor de pared) para que el usuario pueda escribir valores exactos.

### Cambios en `src/components/crm/RingWeightCalculator.tsx`

**1. Importar `Input`** desde `@/components/ui/input`

**2. Talla US** — Reemplazar el `<span>` con el valor por un `<Input>` numérico:
- `type="number"`, `step="0.25"`, `min={4}`, `max={13}`
- Valor: `size`, onChange: parsear y clampar al rango válido, redondear a 0.25
- Ancho compacto (`w-20 h-8`)

**3. Ancho de banda** — Agregar `<Input>` numérico junto al label:
- `step="0.1"`, `min={2}`, `max={8}`
- Valor: `width`, onChange: parsear, clampar, redondear a 0.1

**4. Grosor de pared** — Agregar `<Input>` numérico junto al label:
- `step="0.5"`, `min={1}`, `max={3}`
- Valor: `thickness`, onChange: parsear, clampar, redondear a 0.5

Todos los inputs se sincronizan bidireccionalmente con sus respectivos sliders, igual que en la calculadora de diamantes.

### Archivo modificado
- `src/components/crm/RingWeightCalculator.tsx`

