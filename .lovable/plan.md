

## Plan: Fechas por defecto en Step 1 del wizard de cotización

### Cambios en `src/components/crm/QuotationDialog.tsx`

**1. Fecha de entrega deseada: +60 días por defecto**

Crear función `getDefaultEntrega()` similar a `getDefaultVigencia()` pero sumando 60 días. Usarla como valor inicial de `fechaEntrega` (línea 135) y en el reset (línea 172).

**2. Vigencia: +7 días (ya implementado)**

`getDefaultVigencia()` ya suma 7 días — no requiere cambios.

### Detalle técnico

```ts
const getDefaultEntrega = () => {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().split("T")[0];
};

// Línea 135: useState(getDefaultEntrega()) en vez de useState("")
// Línea 172: setFechaEntrega(getDefaultEntrega()) en vez de setFechaEntrega("")
```

### Archivo modificado
- `src/components/crm/QuotationDialog.tsx` — 3 líneas cambiadas

