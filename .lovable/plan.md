

## Estandarizar tarjetas en grid de 3 columnas para Talleres, Diseñadores, Usuarios y Proveedores

Las 4 secciones actualmente usan `<div className="space-y-4">` (una sola columna, tarjetas a ancho completo). Se cambiarán a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` como ya se hizo en Materiales y Mano de Obra.

### Cambios por archivo

**1. `src/pages/Workshops.tsx` (~línea 264)**
- Cambiar `<div className="space-y-4">` → `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`
- Reestructurar la tarjeta de layout horizontal (`flex items-start justify-between`) a vertical:
  - Nombre + badges arriba con dropdown menu (MoreHorizontal icon en lugar de botón "Acciones")
  - Info de contacto (responsable, email, teléfono, ubicación) en bloque vertical
  - Conteo de procesos al pie

**2. `src/pages/Designers.tsx` (~línea 210)**
- Cambiar `<div className="space-y-4">` → `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`
- Reestructurar tarjeta a vertical:
  - Nombre + badges (activo/especialidad) + dropdown menu (icon) arriba
  - Contacto (email, teléfono, ubicación, portafolio) en bloque
  - Procesos como badges al pie
  - Conteo de órdenes

**3. `src/pages/Users.tsx` (~línea 220)**
- Cambiar `<div className="space-y-4">` → `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`
- Reestructurar tarjeta a vertical:
  - Nombre + dropdown menu (con "Gestionar Roles") arriba
  - Email, teléfono, fecha de registro en bloque
  - Roles como badges al pie

**4. `src/pages/Suppliers.tsx` (~línea 221)**
- Cambiar `<div className="space-y-4">` → `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`
- Reestructurar tarjeta a vertical:
  - Nombre empresa + badge activo/inactivo + dropdown menu arriba
  - Contacto, email, teléfono, país en bloque
  - Tipos de productos como badges al pie

### Patrón de tarjeta unificado

Todas las tarjetas seguirán esta estructura vertical consistente con Materiales y Mano de Obra:

```text
┌─────────────────────────┐
│ Nombre           [···]  │  ← Header + DropdownMenu (MoreHorizontal)
│ Badge Badge             │  ← Status / categoría
├─────────────────────────┤
│ Info línea 1            │  ← Datos de contacto / detalle
│ Info línea 2            │
│ Info línea 3            │
├─────────────────────────┤
│ [badge] [badge] [badge] │  ← Tags / procesos / roles
└─────────────────────────┘
```

El dropdown menu usará el icono `MoreHorizontal` (como en MaterialCard) en lugar del botón texto "Acciones" o "Editar", para mantener consistencia visual.

