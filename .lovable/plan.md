

## Plan: Adaptar página de Calculadora de Peso de Montura

La página `RingWeightCalculatorPage.tsx` actualmente es un wrapper mínimo. Se reescribirá para usar la misma estructura de layout que `DiamondWeightCalculator.tsx` (header con ícono, subtítulo, contenedor estándar), y el componente `RingWeightCalculator` ya existente se reutiliza tal cual dentro de un `Card`.

### Cambios en `src/pages/RingWeightCalculatorPage.tsx`

Reescribir para seguir el patrón exacto de DiamondWeightCalculator:

```
<div className="min-h-full bg-background">
  <main className="container mx-auto px-6 py-8">
    <!-- Header con ícono Scale, título "Calculadora de Peso de Montura", subtítulo descriptivo -->
    <!-- Card envolviendo <RingWeightCalculator /> -->
  </main>
</div>
```

- Importar `Scale` de lucide-react como ícono del header
- Importar `Card`, `CardContent` para envolver el componente
- Mantener el componente `RingWeightCalculator` sin modificaciones (ya tiene el estilo correcto internamente con sliders, cards monocromáticos, tabla de referencia)
- El header usará `text-3xl font-bold` + `text-muted-foreground` para el subtítulo, idéntico al de diamante

### Archivo modificado
- `src/pages/RingWeightCalculatorPage.tsx` — reescritura del layout

