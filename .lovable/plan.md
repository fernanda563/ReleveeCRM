

## Eliminar modal de cotizaciones (ProspectDialog) y componentes asociados

### Alcance

Eliminar el componente `ProspectDialog` y sus editores de precio integrados, junto con todas las referencias en las páginas que lo utilizan. La idea es dejar limpio el terreno para construir un nuevo flujo de cotización basado en selección de pieza + atributos.

### Archivos a eliminar

| Archivo | Razón |
|---------|-------|
| `src/components/crm/ProspectDialog.tsx` | Modal completo de cotización (595 líneas) |
| `src/components/crm/QuoteMaterialsEditor.tsx` | Editor de materiales del modal |
| `src/components/crm/QuoteLaborEditor.tsx` | Editor de mano de obra del modal |
| `src/components/crm/QuoteSummary.tsx` | Resumen de precios del modal |

### Archivos a editar (quitar imports y uso)

| Archivo | Cambio |
|---------|--------|
| `src/pages/Projects.tsx` | Quitar import, estado `showProspectDialog`, botón "Nueva Cotización", y el `<ProspectDialog>` del JSX |
| `src/pages/CRM.tsx` | Quitar import, estado `isProspectDialogOpen`, función `handleProspectAction`, y el `<ProspectDialog>` del JSX |
| `src/pages/Dashboard.tsx` | Quitar import, estado `prospectDialogOpen`, el DropdownMenuItem de "Nueva Cotización", y el `<ProspectDialog>` del JSX |
| `src/pages/ClientDetail.tsx` | Quitar import, estado `showProspectDialog`, botón "Nueva Cotización" en la pestaña de prospects, y el `<ProspectDialog>` del JSX |

### Lo que se conserva

- La tabla `prospects` y `prospect_items` en la base de datos (se reutilizarán)
- `ProspectCard`, `ProspectDetailDialog`, `ProspectStatusDialog` (visualización existente)
- La página `Projects.tsx` con su listado y filtros (solo se quita el botón y dialog de creación)
- `calcularPrecioMaterial` y toda la lógica de pricing (se reutilizará en el nuevo flujo)

