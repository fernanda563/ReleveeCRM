

## Auto-agregar material al hacer clic en "Usar este peso"

### Cambio en `src/components/crm/QuotationDialog.tsx`

Modificar el callback `onUseWeight` del `RingWeightCalculator` (línea 576) para que, además de setear `materialCantidad`, invoque directamente la lógica de agregar el material a la lista:

1. Cambiar el callback de `onUseWeight` para que:
   - Valide que hay un material seleccionado (`selectedMaterial`)
   - Sete la cantidad con el peso calculado
   - Llame la misma lógica de `addMaterial()` directamente (crear el `QuoteItem` y agregarlo a `materialItems`)
   - Si no hay material seleccionado, mostrar un toast indicando que debe seleccionar un metal primero

Esto es un cambio mínimo: solo se modifica la línea 576 para ejecutar el add automáticamente en vez de solo llenar el campo de cantidad.

