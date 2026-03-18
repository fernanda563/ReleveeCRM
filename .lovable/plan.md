

## Rediseño de tarjetas de clientes al estilo estándar del sistema

### Problema
La vista de clientes usa un layout de lista horizontal (una tarjeta por fila, ancho completo) con un botón "Ver Detalle" prominente y un `MoreVertical` para acciones. El resto del sistema (Materiales, Mano de Obra, Talleres, Diseñadores, Proveedores) usa una cuadrícula responsiva de tarjetas verticales con `CardHeader` (título + `MoreHorizontal`) y `CardContent` con información estructurada.

### Cambios en `src/components/crm/ClientList.tsx`

**Layout**: Cambiar de `space-y-4` (lista) a `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4` (cuadrícula).

**Estructura de cada tarjeta** (siguiendo el patrón estándar):

- **CardHeader**: Nombre completo como `CardTitle` (clickeable para navegar al detalle) + `DropdownMenu` con `MoreHorizontal` alineado a la derecha (conteniendo: Ver Detalle, Editar, Agendar Cita, Añadir Proyecto, Crear Recordatorio)
- **CardContent**:
  - Información de contacto (teléfonos) con icono
  - Badges: pedidos, proyectos activos, INE registrada
  - Métricas: órdenes activas, deuda o "Al corriente"

Se elimina el botón "Ver Detalle" como elemento separado; la acción se mueve al nombre clickeable y al dropdown.

### Archivos afectados

| Archivo | Acción |
|---------|--------|
| `src/components/crm/ClientList.tsx` | Reestructurar al patrón de cuadrícula con tarjetas verticales |

