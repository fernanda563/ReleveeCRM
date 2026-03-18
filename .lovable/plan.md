

## Problema

Las variables de color semánticas `--success`, `--warning` y sus foregrounds **no están definidas** en el CSS ni en el tailwind config. Esto significa que todas las clases como `bg-success`, `text-success`, `bg-warning`, `text-warning` que se usan en ~10 archivos del proyecto **no renderizan ningún color visible** — se caen silenciosamente.

El badge de vigencia en la tarjeta de cotización usa estas clases inexistentes, por lo que no muestra colores diferenciados para "Vigente", "Vencida", etc.

## Cambios propuestos

### 1. `src/index.css` — Agregar variables semánticas de color

Definir `--success`, `--success-foreground`, `--warning`, `--warning-foreground` en `:root` y `.dark`:

- **Success** (verde): `142 76% 36%` (light) / `142 76% 56%` (dark)
- **Warning** (ámbar): `38 92% 50%` (light) / `38 92% 50%` (dark)
- **Destructive** (rojo): Cambiar de negro/blanco a un rojo real `0 84% 60%` (light) / `0 84% 50%` (dark) para que también comunique peligro visualmente

### 2. `tailwind.config.ts` — Registrar los colores

Agregar al `extend.colors`:
```
success: {
  DEFAULT: "hsl(var(--success))",
  foreground: "hsl(var(--success-foreground))",
},
warning: {
  DEFAULT: "hsl(var(--warning))",
  foreground: "hsl(var(--warning-foreground))",
},
```

Actualizar `destructive` para usar el nuevo rojo.

### 3. `src/components/client-detail/ProspectCard.tsx` — Ajustar badge de vigencia

Mantener la misma lógica de `getVigenciaStatus` pero ahora los colores serán visibles:
- **Vigente** → verde (success)
- **Vencida** → rojo (destructive)
- **En pausa** → ámbar (warning)
- **Convertido** → primary (negro)
- **Sin vigencia** → muted (gris)

El badge ya usa `<Badge className={vigencia.color}>` — una vez que los colores existan, funcionará correctamente sin cambios en el componente.

### Impacto

Esto corrige **todos** los usos de `bg-success`, `text-success`, `bg-warning`, `text-warning` en el proyecto (~10 archivos), no solo la tarjeta de cotización.

