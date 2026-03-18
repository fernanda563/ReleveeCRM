

## Renombrar "Gestión de Conceptos" a "Gestión de Mano de Obra" y rediseñar el modal

### 1. Renombrar textos en toda la app

**Archivos afectados:**
- `src/components/AppSidebar.tsx` — cambiar `"Gestión de Conceptos"` → `"Gestión de Mano de Obra"`
- `src/pages/WorkConcepts.tsx` — cambiar título `"Gestión de Conceptos"` y subtítulo; actualizar labels de stats y textos vacíos
- `src/components/workshops/WorkshopProcessesDialog.tsx` — cambiar referencia `"Gestión de Conceptos"` → `"Gestión de Mano de Obra"`
- `src/components/work-concepts/WorkConceptDialog.tsx` — cambiar títulos del diálogo: `"Nuevo Concepto de Trabajo"` → `"Nuevo Concepto de Mano de Obra"`, etc.

### 2. Rediseñar el modal `WorkConceptDialog.tsx` (cambio principal)

Replicar el patrón de cálculo de precio usado en `MaterialDialog.tsx`:

- **Eliminar el campo `precio_venta_base`** del formulario (se calculará automáticamente).
- **Agregar campos nuevos al form state:**
  - `tipo_margen`: `"porcentaje" | "fijo"` (default `"porcentaje"`)
  - `valor_margen`: string (con máscara dinámica)
  - `redondeo`: `"ninguno" | "superior" | "inferior" | "mas_cercano"`
  - `redondeo_multiplo`: string (con máscara de moneda)

- **Agregar helpers** `formatCurrency`, `unformatCurrency`, `formatPercentage`, `unformatPercentage` (mismos que en `MaterialDialog`).

- **Aplicar máscara de moneda** al campo `costo_base` (`type="text"`, `formatCurrency` en onChange).

- **Sección de margen de utilidad** (igual que materiales):
  - Select para `tipo_margen` (Porcentaje / Cantidad fija)
  - Input `valor_margen` con máscara dinámica según tipo seleccionado
  - Select para tipo de redondeo
  - Input `redondeo_multiplo` con máscara de moneda (visible solo si redondeo !== "ninguno")

- **Preview de precio calculado**: usar `calcularPrecioMaterial` (o lógica equivalente) para mostrar el precio de venta resultante en tiempo real.

- **`handleSubmit`**: calcular `precio_venta_base` a partir de `costo_base + margen + redondeo` antes de enviar a la BD. Los campos `costo_base` y `precio_venta_base` siguen guardándose como números en la tabla `work_concepts`.

- **`useEffect` de inicialización**: al editar, inferir `tipo_margen` y `valor_margen` a partir de `costo_base` y `precio_venta_base` existentes (diferencia = fijo; ratio = porcentaje), y formatear con las máscaras correspondientes.

### 3. Resumen de archivos a modificar

| Archivo | Cambio |
|---|---|
| `AppSidebar.tsx` | Renombrar label del menú |
| `WorkConcepts.tsx` | Renombrar títulos y textos de la página |
| `WorkConceptDialog.tsx` | Rediseño completo del formulario con máscaras y cálculo de margen |
| `WorkshopProcessesDialog.tsx` | Renombrar referencia textual |

