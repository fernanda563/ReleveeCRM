

## Correcciones de estilo en la Calculadora de Peso

### Problemas identificados

1. **Tarjetas de quilataje**: El `ToggleGroupItem` usa `bg-primary text-primary-foreground` pero el componente base de `toggle-group` aplica sus propios estilos `data-[state=on]` que sobrescriben las clases custom, causando que el texto no sea visible. Además `py-3` no da suficiente altura.

2. **Padding superior en tarjetas de resultado**: `pt-4` es insuficiente para separar el contenido del borde superior.

### Cambios

**`src/components/crm/RingWeightCalculator.tsx`**

- **Tarjetas de quilataje (líneas 163-179)**: Cambiar el estilo del `ToggleGroupItem` activo para usar clases explícitas que no sean sobrescritas por los estilos base del toggle. Usar `!bg-primary !text-primary-foreground` (con `!important` de Tailwind) o mejor, aplicar estilos inline/data-attribute. Aumentar padding vertical de `py-3` a `py-4` para que el contenido quepa bien.

- **Tarjetas de resultado (líneas 188, 195, 201)**: Cambiar `pt-4` a `pt-6` para mayor separación del borde superior.

