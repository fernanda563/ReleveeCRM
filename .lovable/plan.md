

## Rediseño del Diálogo de Cotización con Cálculo Real de Precios

### Problema actual
El `ProspectDialog` actual solo recopila información descriptiva (tipo de accesorio, metal, piedra) y un campo manual de "Importe de Inversión Previsto". No realiza ningún cálculo basado en los materiales, mano de obra ni costos indirectos ya definidos en el sistema.

### Solución propuesta

Rediseñar el flujo de cotización para que calcule el precio final a partir de los elementos que componen el producto, usando la misma lógica de precios (`calcularPrecioMaterial`) ya implementada en Materiales y Mano de Obra.

---

### 1. Nueva tabla: `prospect_items`

Almacena las líneas de detalle de cada cotización (materiales, mano de obra, costos adicionales).

```sql
CREATE TABLE public.prospect_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'material' | 'mano_obra'
  referencia_id uuid NOT NULL, -- materials.id o work_concepts.id
  cantidad numeric NOT NULL DEFAULT 1,
  costo_unitario numeric NOT NULL DEFAULT 0,
  precio_unitario numeric NOT NULL DEFAULT 0,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prospect_items ENABLE ROW LEVEL SECURITY;

-- RLS: mismas políticas que prospects (authenticated full access)
CREATE POLICY "Auth users can view prospect items" ON public.prospect_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert prospect items" ON public.prospect_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update prospect items" ON public.prospect_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete prospect items" ON public.prospect_items FOR DELETE TO authenticated USING (true);
```

### 2. Rediseño del `ProspectDialog`

El diálogo se reorganiza en secciones claras dentro del mismo modal (sin pasos/wizard):

**Sección 1 — Información General** (se mantiene igual):
- Cliente, tipo de accesorio, subtipo, fecha de entrega, metal, piedra, observaciones

**Sección 2 — Materiales** (nuevo):
- Selector dropdown con materiales del catálogo (`materials` table, activos)
- Al seleccionar un material, se auto-poblan costo y precio de venta (ya calculados con margen y redondeo via `calcularPrecioMaterial`)
- Campo de cantidad editable
- Subtotal por línea = cantidad × precio_unitario
- Botón para agregar más materiales y eliminar

**Sección 3 — Mano de Obra** (nuevo):
- Selector dropdown con conceptos de trabajo (`work_concepts` table, activos)
- Al seleccionar, se auto-poblan costo_base y precio_venta_base
- Campo de cantidad editable (respetando decimales según unidad_medida)
- Subtotal por línea

**Sección 4 — Resumen de Cotización** (nuevo):
- Total Materiales: suma de subtotales de materiales
- Total Mano de Obra: suma de subtotales de mano de obra
- **Total Cotización**: suma de ambos
- Este total reemplaza el campo manual "Importe de Inversión Previsto" y se guarda en `importe_previsto`

### 3. Componentes nuevos

- **`src/components/crm/QuoteMaterialsEditor.tsx`** — Editor de líneas de materiales (similar a `WorkOrderItemsEditor`). Carga materiales, calcula precio con `calcularPrecioMaterial`, permite agregar/quitar líneas.

- **`src/components/crm/QuoteLaborEditor.tsx`** — Editor de líneas de mano de obra. Carga work_concepts, muestra costo y precio de venta, permite agregar/quitar líneas.

- **`src/components/crm/QuoteSummary.tsx`** — Componente de resumen que recibe los items y muestra totales desglosados.

### 4. Flujo de guardado

Al enviar el formulario:
1. Insertar el registro en `prospects` con `importe_previsto` = total calculado
2. Insertar todas las líneas en `prospect_items` con el `prospect_id` resultante
3. Ambas operaciones en secuencia (insertar prospect → obtener id → insertar items)

### 5. Archivos afectados

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/...` | Crear tabla `prospect_items` con RLS |
| `src/components/crm/QuoteMaterialsEditor.tsx` | **Crear** — Editor de materiales |
| `src/components/crm/QuoteLaborEditor.tsx` | **Crear** — Editor de mano de obra |
| `src/components/crm/QuoteSummary.tsx` | **Crear** — Resumen con totales |
| `src/components/crm/ProspectDialog.tsx` | **Reescribir** — Integrar editores y resumen, eliminar campo manual de importe |

### Notas técnicas

- Se reutiliza `calcularPrecioMaterial` para calcular precios de materiales
- Los precios de mano de obra usan directamente `precio_venta_base` del work_concept
- El patrón visual sigue lo establecido en `WorkOrderItemsEditor` (tarjetas con líneas, botones +/-)
- El campo `importe_previsto` del prospect se calcula automáticamente pero sigue guardándose para consultas rápidas

