

## Agregar dropdown de estados de México en SupplierDialog

### 1. Migración de base de datos
Agregar columna `estado` (tipo `text`, nullable) a la tabla `suppliers`.

```sql
ALTER TABLE public.suppliers ADD COLUMN estado text;
```

### 2. Editar `src/components/suppliers/SupplierDialog.tsx`
- Importar `MEXICAN_STATES` desde `@/lib/mexican-states`
- Agregar `estado: ""` al `formData` y al interface `Supplier`
- Agregar campo condicional después del campo País:
  - Si `pais === "México"`: mostrar `Select` con los 32 estados
  - Si otro país: mostrar `Input` de texto libre
- En `handleCountryChange`: limpiar `estado` al cambiar de país
- Incluir `estado` en `supplierData` al guardar

