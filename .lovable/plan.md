

## Correcciones monocromáticas

### Problema 1: Número rojo en tarjeta "Vencidas"
En `src/pages/Projects.tsx` línea 282, el número usa `text-destructive`. Aunque `--destructive` está definido como negro en CSS, el valor puede estar siendo sobreescrito por el tema dinámico o por algún otro mecanismo. Cambiar a `text-foreground` para garantizar consistencia monocromática.

### Problema 2: Badge con estilo no estándar
El badge de vigencia en `ProspectCard.tsx` línea 158 usa clases personalizadas (`rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em]`) que no coinciden con el estilo de badges usado en el resto del sistema. Revertir a un `<Badge>` estándar sin esas clases custom.

### Cambios

**`src/pages/Projects.tsx`** (línea 282):
- Cambiar `text-destructive` → `text-foreground`

**`src/components/client-detail/ProspectCard.tsx`** (línea 158):
- Simplificar el Badge a usar solo la clase de color de `vigencia.color` sin las clases custom de `rounded-full`, `uppercase`, `tracking-[0.12em]`, `text-[11px]`, `px-3 py-1`

**`src/components/client-detail/prospect-utils.ts`**:
- Verificar que `getStatusColor` y `getVigenciaStatus` devuelvan clases consistentes con el sistema monocromático existente (sin referencias a success/warning/destructive como colores semánticos)

