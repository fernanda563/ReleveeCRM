

## Restaurar botón "Nueva Cotización" en la página de Cotizaciones

El header de `src/pages/Projects.tsx` (líneas 194-201) solo tiene título y descripción, sin botón de acción. Falta el botón para crear una nueva cotización.

### Cambios en `src/pages/Projects.tsx`

1. **Importar** `Button` de `@/components/ui/button`, `Plus` de `lucide-react`, y `ProspectDialog` de `@/components/crm/ProspectDialog.tsx`.

2. **Agregar estado** para controlar el diálogo:
   - `showProspectDialog` (boolean)

3. **Agregar botón** en el header (línea ~200, dentro del `div` de `flex items-center justify-between`):
   ```tsx
   <Button onClick={() => setShowProspectDialog(true)}>
     <Plus className="h-4 w-4 mr-2" />
     Nueva Cotización
   </Button>
   ```

4. **Renderizar `ProspectDialog`** al final, con `onSuccess` que llame a `fetchProspects()`.

