

## Renombrar "Proyecto(s)" a "Cotización(es)" en todo el sistema

### Alcance del cambio

Es un cambio puramente de texto visible al usuario (labels, títulos, toasts, placeholders, comentarios JSX). No se modifican nombres de variables, props, tipos, tablas de base de datos ni rutas URL. Solo se reemplazan las cadenas de texto en español que dicen "proyecto/proyectos" por "cotización/cotizaciones".

### Archivos afectados (15 archivos, ~80 reemplazos de texto)

| Archivo | Cambios principales |
|---|---|
| **`src/components/AppSidebar.tsx`** | `"Proyectos"` → `"Cotizaciones"` en el menú de navegación |
| **`src/pages/Projects.tsx`** | Título `"Proyectos"` → `"Cotizaciones"`, descripción, toasts ("Proyecto convertido...", "Proyecto eliminado..."), stats label "Total proyectos", textos de filtros vacíos, título del AlertDialog |
| **`src/pages/Dashboard.tsx`** | `"Nuevo Proyecto"` → `"Nueva Cotización"`, `"Proyectos activos"` → `"Cotizaciones activas"`, descripción del CRM |
| **`src/pages/CRM.tsx`** | `"Añadir Proyecto"` → `"Añadir Cotización"`, descripción, toast de éxito |
| **`src/pages/ClientDetail.tsx`** | Tab `"Proyectos"` → `"Cotizaciones"`, botón `"Nuevo Proyecto"` → `"Nueva Cotización"`, toast de éxito |
| **`src/components/crm/ProspectDialog.tsx`** | DialogTitle `"Registrar Proyecto"` → `"Registrar Cotización"`, DialogDescription, botón submit, toasts |
| **`src/components/crm/ClientDialog.tsx`** | Textos de eliminación: `"proyectos"` → `"cotizaciones"` en lista y toast |
| **`src/components/client-detail/ProspectCard.tsx`** | `"Editar proyecto"` → `"Editar cotización"`, comentario JSX |
| **`src/components/client-detail/ProspectsHistory.tsx`** | Toasts, comentarios, textos vacíos, títulos de AlertDialog |
| **`src/components/client-detail/ProspectDetailDialog.tsx`** | Toasts de eliminar/actualizar, comentarios |
| **`src/components/client-detail/ProspectStatusDialog.tsx`** | DialogTitle, DialogDescription, Label |
| **`src/components/client-detail/ClientTimeline.tsx`** | `"Proyecto registrado"` → `"Cotización registrada"`, comentarios |
| **`src/components/client-detail/prospect-utils.ts`** | Fallback title: `"proyecto"` → `"cotización"` |
| **`src/components/orders/OrderDialog.tsx`** | Labels de prospect dropdown: `"proyecto"` → `"cotización"`, placeholders, toasts, textos descriptivos |

### Regla de reemplazo

- "Proyecto" (singular) → "Cotización"
- "Proyectos" (plural) → "Cotizaciones"  
- "proyecto" (singular minúscula) → "cotización"
- "proyectos" (plural minúscula) → "cotizaciones"
- Ajustar concordancia de género: "Nuevo Proyecto" → "Nueva Cotización", "registrado" → "registrada", "eliminado" → "eliminada", "convertido" → "convertida", "activos" → "activas"

### Lo que NO se modifica

- Nombres de variables/funciones (`prospect`, `fetchProspects`, `ProspectCard`, etc.)
- Nombres de archivos (`Projects.tsx`, `ProspectDialog.tsx`, etc.)
- Rutas URL (`/projects`)
- Tablas de base de datos (`prospects`)
- Props e interfaces TypeScript
- Comentarios puramente técnicos (solo los que son texto visible o contextual en español)

