

## Corrección de estilos del modal de Cotización (ProspectDialog)

### Inconsistencias detectadas

Comparando `ProspectDialog.tsx` contra los modales estándar (`MaterialDialog`, `SupplierDialog`, `ClientDialog`):

| Problema | ProspectDialog (actual) | Patrón estándar |
|----------|------------------------|-----------------|
| Footer | `<div className="flex justify-end gap-3 pt-2">` | `<DialogFooter>` |
| Botón submit | `bg-warning hover:bg-warning/90 text-warning-foreground` | `<Button>` sin clases de color (hereda primary monocromático) |
| Input de largo | `<input>` HTML nativo con clases manuales (línea 446) | `<Input>` componente del sistema |

### Cambios en `src/components/crm/ProspectDialog.tsx`

1. **Líneas 565-588**: Reemplazar el `<div>` del footer por `<DialogFooter>` (importar desde dialog). El botón submit pierde las clases `bg-warning` y queda como `<Button type="submit">` estándar.

2. **Líneas 446-452**: Reemplazar el `<input>` HTML nativo por el componente `<Input>` del sistema (ya importado en otros modales pero no en este archivo; hay que agregarlo al import).

3. Agregar `DialogFooter` al import existente de dialog (línea 2-8) y agregar `Input` a los imports.

| Archivo | Cambio |
|---------|--------|
| `src/components/crm/ProspectDialog.tsx` | Usar `DialogFooter`, quitar color del botón, usar `<Input>` |

