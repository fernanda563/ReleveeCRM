

## Estructuración del Catálogo de Materiales con Atributos del Mercado

### Problema

Actualmente los materiales se registran con un campo `nombre` de texto libre y una categoría genérica (Metales / Piedras Preciosas). No existen atributos estructurados como **tipo de material**, **kilataje/pureza** o **color**, lo que impide correlacionar correctamente el catálogo con los campos del formulario de cotización (tipo de metal, pureza del oro, tipo de piedra, etc.).

### Solución

Agregar campos estructurados a la tabla `materials` que representen los atributos reales del mercado joyero, y usar estos campos para filtrar/agrupar materiales en el selector de cotización.

---

### 1. Migración de base de datos

Agregar columnas a `materials`:

```sql
ALTER TABLE public.materials ADD COLUMN tipo_material text; -- oro, plata, platino, diamante, rubí, esmeralda, zafiro, etc.
ALTER TABLE public.materials ADD COLUMN kilataje text;      -- 10k, 14k, 18k, 24k, 950, 925, etc.
ALTER TABLE public.materials ADD COLUMN color text;         -- amarillo, blanco, rosado, etc.
```

### 2. Actualizar `MaterialDialog.tsx`

- Agregar campo **Tipo de material** como `Select` con opciones predefinidas según la categoría:
  - Si categoría = "Metales": oro, plata, platino, acero, titanio
  - Si categoría = "Piedras Preciosas": diamante, rubí, esmeralda, zafiro, perla, otra
- Agregar campo **Kilataje/Pureza** condicional:
  - Oro: 10k, 14k, 18k, 24k
  - Plata: 925, 950
  - Platino: 950
  - Piedras: no aplica (se oculta)
- Agregar campo **Color** condicional (solo para oro): amarillo, blanco, rosado
- El campo `nombre` se auto-genera o se complementa: ej. "Oro 14k Amarillo", pero sigue siendo editable

### 3. Actualizar `MaterialCard.tsx`

- Mostrar badges adicionales con tipo_material, kilataje y color cuando estén presentes

### 4. Actualizar `QuoteMaterialsEditor.tsx`

- Agrupar materiales en el dropdown por categoría y tipo_material
- Mostrar kilataje y color en cada opción del dropdown para facilitar la selección
- Opcionalmente, agregar filtros rápidos por categoría antes del selector

### 5. Archivos afectados

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/...` | Agregar columnas `tipo_material`, `kilataje`, `color` |
| `src/components/materials/MaterialDialog.tsx` | Agregar selectores condicionales |
| `src/components/materials/MaterialCard.tsx` | Mostrar nuevos atributos |
| `src/components/crm/QuoteMaterialsEditor.tsx` | Agrupar y mostrar atributos en dropdown |

