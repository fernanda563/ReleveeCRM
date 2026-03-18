

## Plan: Módulo de Materiales

### 1. Base de datos

Crear tabla `materials` con las siguientes columnas:

| Columna | Tipo | Descripción |
|---|---|---|
| id | uuid PK | |
| nombre | text NOT NULL | Nombre del material (ej: "Oro 14k Amarillo") |
| categoria | text | Categoría libre (ej: "Metales", "Piedras", "Insumos") |
| unidad_medida | text NOT NULL default 'gramo' | gramo, quilate, pieza, etc. |
| costo_directo | numeric NOT NULL default 0 | Costo base por unidad |
| tipo_margen | text NOT NULL default 'porcentaje' | 'porcentaje' o 'fijo' |
| valor_margen | numeric NOT NULL default 0 | % de utilidad o monto fijo |
| redondeo | text NOT NULL default 'ninguno' | 'ninguno', 'superior', 'inferior', 'mas_cercano' |
| redondeo_multiplo | numeric default 1 | A qué múltiplo redondear (ej: 10, 50, 100) |
| precio_calculado | numeric generated always as (computed) | No usar generated column; se calcula en frontend |
| activo | boolean default true | |
| notas | text | |
| created_at | timestamptz default now() | |
| updated_at | timestamptz default now() | |

RLS: Solo admins pueden CRUD; authenticated pueden SELECT.

Trigger `update_updated_at_column` para updated_at.

### 2. Matriz de permisos

En `RolesManagement.tsx`, agregar entrada "Materiales" al array `permissions` con `administrador: true` y el resto `false`.

### 3. Navegación

En `AppSidebar.tsx`, agregar "Gestión de Materiales" en la sección "Administración" (adminOnly: true), con icono `Package` y ruta `/materials`.

### 4. Página Materials.tsx

Nueva página `src/pages/Materials.tsx` siguiendo el layout estandarizado de páginas de administración:
- Título 3xl, botón "Nuevo Material"
- Stats cards: Total materiales, Activos, Categorías distintas
- Filtros: búsqueda por nombre, filtro por categoría, filtro por estado activo/inactivo
- Lista de materiales en cards mostrando: nombre, categoría, costo directo, tipo de margen, valor margen, precio resultante calculado, unidad de medida

### 5. MaterialDialog.tsx

Diálogo para crear/editar material con campos:
- Nombre, Categoría (input con sugerencias de categorías existentes), Unidad de medida (select)
- Costo directo (numérico)
- Tipo de margen: toggle entre "Porcentaje" y "Cantidad fija"
- Valor de margen (% o $)
- Redondeo: select con opciones (Ninguno, Superior, Inferior, Más cercano)
- Múltiplo de redondeo (numérico, visible solo si redondeo != ninguno)
- Preview en tiempo real del precio resultante calculado
- Notas, toggle Activo/Inactivo

**Lógica de cálculo del precio (frontend):**
```
Si tipo_margen = 'porcentaje':
  precio = costo_directo * (1 + valor_margen / 100)
Si tipo_margen = 'fijo':
  precio = costo_directo + valor_margen

Aplicar redondeo según configuración:
  'superior': Math.ceil(precio / multiplo) * multiplo
  'inferior': Math.floor(precio / multiplo) * multiplo
  'mas_cercano': Math.round(precio / multiplo) * multiplo
```

### 6. Ruta

En `App.tsx`, agregar `<Route path="/materials" element={<Materials />} />` dentro del DashboardLayout.

### 7. Archivos nuevos/modificados

| Archivo | Acción |
|---|---|
| DB migration | Crear tabla `materials` + RLS + trigger |
| `src/pages/Materials.tsx` | Nuevo |
| `src/components/materials/MaterialDialog.tsx` | Nuevo |
| `src/components/materials/MaterialCard.tsx` | Nuevo |
| `src/App.tsx` | Agregar ruta |
| `src/components/AppSidebar.tsx` | Agregar enlace de navegación |
| `src/pages/RolesManagement.tsx` | Agregar permiso "Materiales" |

