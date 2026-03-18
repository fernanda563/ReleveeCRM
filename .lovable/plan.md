

## Corrección de estilos monocromáticos en la vista de CRM

### Problemas detectados

Comparando CRM (`CRM.tsx` + `ClientList.tsx`) contra las vistas de referencia (Materials, etc.), hay 3 inconsistencias:

1. **Tarjetas CTA de acción rápida** (líneas 181-236 de `CRM.tsx`): Los iconos están envueltos en un contenedor `bg-secondary rounded-lg` con `text-secondary-foreground`, creando un fondo gris que no existe en otras vistas. En Materials, los iconos de las stat cards usan directamente `text-primary` sin fondo decorativo.

2. **Badge de deuda** (línea 167 de `ClientList.tsx`): Usa `variant="destructive"` que, aunque en el CSS vars es monocromático, semánticamente transmite "rojo/error". Debe usar `variant="outline"` con estilo monocromático consistente.

3. **Botón "Nuevo Cliente"** (línea 251-257 de `CRM.tsx`): Usa clases explícitas `bg-accent hover:bg-accent/90 text-accent-foreground` en vez del patrón estándar del sistema. En Materials, el botón equivalente usa simplemente `<Button>` sin clases de color adicionales (el variant `default` ya aplica `bg-primary text-primary-foreground`).

### Cambios

**`src/pages/CRM.tsx`**:
- Tarjetas CTA: Quitar el `<div className="p-2 bg-secondary rounded-lg">` que envuelve cada icono. Usar el icono directamente con `className="h-5 w-5 text-foreground"`, igual que en las stat cards de Materials.
- Botón "Nuevo Cliente": Quitar las clases explícitas de color y dejarlo como `<Button>` con variant default (hereda `bg-primary text-primary-foreground` del sistema).

**`src/components/crm/ClientList.tsx`**:
- Badge de deuda (línea 167): Cambiar `variant="destructive"` a `variant="outline"` con `className="flex items-center gap-1 whitespace-nowrap border-foreground text-foreground"` para mantener énfasis sin semántica de color.
- Badge de órdenes activas (línea 158): Verificar que `variant="default"` (negro/blanco) sea consistente, se mantiene.

| Archivo | Cambio |
|---------|--------|
| `src/pages/CRM.tsx` | Quitar fondos grises de iconos CTA; limpiar clases del botón |
| `src/components/crm/ClientList.tsx` | Cambiar badge destructive a outline monocromático |

