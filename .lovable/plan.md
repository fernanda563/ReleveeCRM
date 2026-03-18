

## Plan: Vigencia por defecto = fecha actual + 7 días

### Cambio

**`src/components/crm/QuotationDialog.tsx`**:

1. Cambiar la inicialización de `fechaVigencia` de `""` a una función que calcule `today + 7 días` en formato `YYYY-MM-DD`.
2. En la función `resetForm`, también asignar el valor por defecto de +7 días en lugar de `""`.

Esto es un cambio de 2 líneas. El campo seguirá siendo editable por el usuario, pero vendrá pre-llenado con la fecha actual + 7 días.

