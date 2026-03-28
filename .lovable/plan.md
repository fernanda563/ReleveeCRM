

## Problema

El `ProspectDetailDialog` no muestra los ítems de la cotización (`prospect_items`). El wizard de cotización (`QuotationDialog`) guarda materiales y mano de obra en la tabla `prospect_items`, pero el diálogo de detalle nunca los consulta ni los renderiza. Esto hace que el modal parezca vacío cuando se abre una cotización.

Además, varios campos del prospect se ocultan condicionalmente (importe, fecha de entrega, piedra, etc.), así que si alguno es null, esa sección no aparece — contribuyendo a la sensación de vacío.

## Plan

### 1. Obtener `prospect_items` al abrir el diálogo

En `ProspectDetailDialog.tsx`, agregar un `useEffect` que al abrir el diálogo haga fetch de:

```sql
SELECT pi.*, m.nombre as material_nombre, wc.nombre as concepto_nombre
FROM prospect_items pi
LEFT JOIN materials m ON pi.tipo = 'material' AND pi.referencia_id = m.id
LEFT JOIN work_concepts wc ON pi.tipo = 'mano_de_obra' AND pi.referencia_id = wc.id
WHERE pi.prospect_id = ?
```

Se harán dos queries separadas (una para materiales, otra para mano de obra) usando el SDK de Supabase, ya que no se pueden hacer JOINs cruzados fácilmente. Alternativa: fetch todos los `prospect_items` por `prospect_id`, luego fetch los nombres de `materials` y `work_concepts` correspondientes.

### 2. Mostrar sección de ítems en el diálogo

Agregar dos secciones nuevas en el diálogo (modo lectura):

- **Materiales**: tabla con nombre, cantidad, costo unitario, precio unitario, subtotal
- **Mano de obra**: tabla con nombre, cantidad, costo unitario, precio unitario, subtotal
- **Totales**: suma de costos y precios

Usar el mismo estilo de tabla que ya se usa en otros componentes del proyecto (`Table`, `TableHeader`, `TableBody`, etc.).

### 3. Mostrar todos los campos siempre (no condicionalmente)

Cambiar las condiciones que ocultan secciones para que siempre se muestren los campos en modo lectura, mostrando "N/A" o "—" cuando el valor sea null. Esto aplica a:
- Metal (tipo, color, pureza)
- Piedra (incluye piedra, tipo)
- Importe previsto
- Fecha de entrega
- Observaciones
- Fecha de vigencia (agregar este campo que falta)

### Archivo modificado

- `src/components/client-detail/ProspectDetailDialog.tsx` — agregar fetch de prospect_items, renderizar tablas de materiales y mano de obra, mostrar todos los campos siempre

