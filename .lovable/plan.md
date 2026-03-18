

## Vigencia de cotización y mejora de tarjeta

### Problema
- La tarjeta muestra un badge "activo" sin sentido porque no hay fecha de vigencia en el formulario
- Falta mostrar fecha de creación y fecha de entrega en la tarjeta
- No existe campo de vigencia/caducidad en el formulario de cotización

### Cambios propuestos

#### 1. Migración de base de datos
Agregar columna `fecha_vigencia` (date, nullable) a la tabla `prospects`:
```sql
ALTER TABLE public.prospects ADD COLUMN fecha_vigencia date;
```

#### 2. `src/components/crm/QuotationDialog.tsx` — Agregar campo de vigencia
- Nuevo estado `fechaVigencia` en Step 1
- Input tipo date con label "Vigencia de la cotización" después de "Fecha de entrega deseada"
- Incluir `fecha_vigencia` en el insert a `prospects`
- Agregar al `resetForm`

#### 3. `src/components/client-detail/ProspectCard.tsx` — Rediseñar tarjeta
- Agregar `fecha_vigencia` al tipo `Prospect`
- Reemplazar el badge estático de estado por lógica dinámica:
  - Si `estado === "convertido"` → badge "Convertido" (primary)
  - Si `fecha_vigencia` existe y ya pasó → badge "Vencida" (destructive)
  - Si `fecha_vigencia` existe y no ha pasado → badge "Vigente hasta [fecha]" (success)
  - Si no hay `fecha_vigencia` → badge "Sin vigencia" (muted)
- Mostrar en el cuerpo de la tarjeta:
  - Fecha de creación (`created_at`) con icono de calendario
  - Fecha de entrega deseada (si existe)
  - Metal (como ya está)
  - Importe previsto (como ya está)
- Eliminar observaciones de la tarjeta (se ven en detalle)

#### 4. `src/components/client-detail/prospect-utils.ts` — Actualizar `getStatusColor`
- Agregar caso "vencida" para el color destructivo
- Mantener los demás estados existentes

#### 5. `src/pages/Projects.tsx` — Actualizar estadísticas
- Considerar "vencida" como un estado visual derivado (cotizaciones activas cuya vigencia ya pasó)
- Opcionalmente agregar contador de vencidas en el dashboard

### Detalle técnico
- La vigencia se calcula en el frontend comparando `fecha_vigencia` con `new Date()` — no se modifica el campo `estado` en la BD
- El estado "activo" sigue existiendo en la BD, pero en la tarjeta se muestra "Vigente" o "Vencida" según la fecha

