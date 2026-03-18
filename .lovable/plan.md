

## Integrar Calculadora de Peso en el Paso 2 de la Cotización

### Cambio

Cuando el usuario selecciona un material de categoría "Metales" en el paso 2 del `QuotationDialog`, se muestra la calculadora de peso (`RingWeightCalculator`) de forma colapsable debajo del selector de material. Esto le permite estimar el peso del anillo y usar ese valor como cantidad (gramos) del material.

### Archivos a editar

| Archivo | Cambio |
|---------|--------|
| `src/components/crm/RingWeightCalculator.tsx` | Agregar prop opcional `onUseWeight?: (weight: number) => void` que muestre un botón "Usar este peso" para enviar el valor al padre. Exportar sin cambiar el default. |
| `src/components/crm/QuotationDialog.tsx` | Importar `RingWeightCalculator`. En el paso 2, cuando `selectedMaterial?.categoria === "Metales"`, renderizar un bloque colapsable (con `Collapsible`) que muestre la calculadora. El callback `onUseWeight` rellena el campo `materialCantidad`. |
| `src/pages/Projects.tsx` | Quitar el botón "Calculadora de Peso" independiente y su `Dialog`, ya que la calculadora ahora vive dentro del flujo de cotización. |

### Detalle de la UX

1. El usuario selecciona un metal del dropdown
2. Aparece un bloque colapsable: "Calculadora de peso de anillo"
3. Al expandir, se muestra la calculadora completa
4. El botón "Usar este peso" copia el peso calculado al campo de cantidad (gramos)
5. Si el material seleccionado no es de categoría "Metales", la calculadora no se muestra

