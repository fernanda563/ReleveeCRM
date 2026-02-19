
## Unificar "Proceso de Diseño" y "Proceso de Taller" en Órdenes de Trabajo

### Objetivo

Eliminar los dos ítems del menú de navegación ("Proceso de Diseño" y "Proceso de Taller") y reorganizar la página de Órdenes de Trabajo para mostrar las órdenes divididas en dos pestañas: **Órdenes de diseño** y **Órdenes de taller**.

---

### Análisis del estado actual

**Menú (AppSidebar.tsx):** La sección "Proceso de Producción" actualmente tiene 4 ítems:
- Seguimiento de Producción → `/production`
- Órdenes de Trabajo → `/work-orders`
- Proceso de Diseño → `/design-process` ← eliminar
- Proceso de Taller → `/workshop-process` ← eliminar

**Distinción diseño vs taller (ya existe en el modelo):**
- Si `designer_id` tiene valor → orden de diseño
- Si `workshop_id` tiene valor → orden de taller
- El `WorkOrderDialog` ya usa un `RadioGroup` con `assignmentType: 'taller' | 'diseñador'` para determinar a quién se asigna

**Estructura actual de WorkOrders.tsx:**
- Tarjetas de estadísticas (Pendientes, En proceso, Completadas)
- Filtros (búsqueda + estado)
- Contador de resultados
- Grid de tarjetas `WorkOrderCard`

---

### Cambios a realizar

#### 1. AppSidebar.tsx — Eliminar ítems del menú

Quitar los dos ítems de la sección "Proceso de Producción":
```
{ title: "Proceso de Diseño", url: "/design-process", icon: Pencil, adminOnly: false },
{ title: "Proceso de Taller", url: "/workshop-process", icon: Wrench, adminOnly: false },
```

También quitar las importaciones de iconos `Pencil` y `Wrench` si ya no se usan en ningún otro lugar del sidebar.

#### 2. WorkOrders.tsx — Agregar pestañas por tipo

Reestructurar la página para incorporar las pestañas **antes** del grid de tarjetas (pero **después** de los filtros y estadísticas).

**Nueva lógica de filtrado:**

```
Todas las órdenes → filtradas por búsqueda/estado → separadas por tab activo:
  - Tab "Órdenes de diseño": workOrder.designer_id !== null
  - Tab "Órdenes de taller": workOrder.workshop_id !== null (o sin asignación a diseñador)
```

**Estructura visual nueva:**

```
[Header + botón Nueva Orden]
[Tarjetas de estadísticas — contextuales al tab activo]
[Filtros (búsqueda + estado)]

[Tabs]
  ┌─────────────────┬──────────────────┐
  │ Órdenes de      │ Órdenes de       │
  │ diseño  (N)     │ taller  (N)      │
  └─────────────────┴──────────────────┘
  [Contador de resultados]
  [Grid de WorkOrderCard]
```

Las estadísticas (Pendientes / En proceso / Completadas) se calcularán sobre las órdenes del tab activo, para que los números sean siempre relevantes al contexto visible.

---

### Archivos a modificar

**`src/components/AppSidebar.tsx`**
- Eliminar líneas de "Proceso de Diseño" y "Proceso de Taller" del array `menuSections`
- Quitar importaciones de `Pencil` y `Wrench` de lucide-react (si no se usan en otro lugar dentro del mismo archivo)

**`src/pages/WorkOrders.tsx`**
- Añadir import de `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` desde `@/components/ui/tabs`
- Agregar estado `activeTab: 'diseño' | 'taller'` (valor inicial: `'taller'`)
- Separar `filteredOrders` en dos subconjuntos tras aplicar filtros de búsqueda/estado:
  - `designOrders`: donde `designer_id !== null && designer_id !== ""`
  - `workshopOrders`: resto (donde `workshop_id` tiene valor o no hay asignación)
- Hacer que las stats (pendientes/en proceso/completadas) sean reactivas al tab activo
- Renderizar `<Tabs>` envolviendo el contador y el grid, con dos `<TabsTrigger>` que muestren el nombre y el conteo entre paréntesis

---

### Resultado esperado

- El menú lateral queda limpio con solo 2 ítems en "Proceso de Producción": Seguimiento de Producción y Órdenes de Trabajo.
- La página de Órdenes de Trabajo muestra una pestaña "Órdenes de taller" y otra "Órdenes de diseño", cada una con su propio listado de tarjetas filtrado.
- Las tarjetas son las mismas `WorkOrderCard` ya existentes — no hay cambio de componente.
- Los filtros de búsqueda y estado siguen funcionando dentro del tab activo.
- Las rutas `/design-process` y `/workshop-process` siguen existiendo técnicamente en `App.tsx` pero dejan de aparecer en el menú (no se eliminan las páginas para no romper rutas existentes).
