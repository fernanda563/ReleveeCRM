

## Plan: Mejorar controles de dimensiones y simplificar tarjetas de tipo de pieza

### Cambios

**1. Controles de dimensiones más precisos**

Actualmente solo hay un Slider con step de 0.01, lo cual hace difícil llegar a un valor exacto. Se agregará un Input numérico editable al lado del valor mostrado, permitiendo al usuario escribir directamente el número deseado. El slider seguirá funcionando para ajustes rápidos.

- Reemplazar el `<span>` que muestra `X.XX mm` por un `<Input>` de tipo number con step 0.01, ancho compacto (~80px)
- El slider y el input se mantienen sincronizados bidireccionalmente
- Se preservan los límites min/max de cada dimensión

**2. Tarjetas de tipo de pieza: descripción en hover**

Eliminar el texto de descripción visible debajo del nombre en cada tarjeta. En su lugar, envolver cada botón en un `Tooltip` que muestre la descripción al hacer hover. Esto reduce el tamaño visual de las tarjetas y las hace más limpias.

- Importar `Tooltip`, `TooltipTrigger`, `TooltipContent` y `TooltipProvider`
- Envolver el grid de piezas en `TooltipProvider`
- Cada botón se envuelve en `Tooltip` + `TooltipTrigger`/`TooltipContent`
- Eliminar el `<span>` con `p.description` del interior del botón
- Opcionalmente, incluir el número de piedras default en el tooltip (ej. "Banda con múltiples piedras · 13 piedras")

### Archivo modificado
- `src/pages/DiamondWeightCalculator.tsx`

