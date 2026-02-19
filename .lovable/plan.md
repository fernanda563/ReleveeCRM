
## Fix: Padding derecho del modal en mobile

### Diagnóstico real

El problema tiene dos capas:

**Capa 1 — Conflicto de Tailwind Merge con `p-6` base**

El componente `DialogContent` en `src/components/ui/dialog.tsx` tiene `p-6` hardcodeado en sus clases base (línea 39). Cuando se pasan clases como `pt-4 pb-4 pl-4 pr-10` en el `className`, Tailwind Merge resuelve el conflicto parcialmente — en algunos casos el shorthand `p-6` puede ganar sobre las propiedades individuales dependiendo del orden de aplicación. El resultado es que el padding derecho no se aplica consistentemente.

**Capa 2 — El botón X del `DialogContent` está en `right-4 top-4` absoluto**

El botón de cierre en `dialog.tsx` línea 45 tiene `absolute right-4 top-4`. En mobile con el modal a ancho completo, esto posiciona el X a 16px del borde derecho del modal. Si el padding interno del modal es solo `p-4` (16px), el X queda pegado al borde del contenido — lo que se ve en la imagen: el texto "Piedra" del stepper y los dropdowns llegan hasta donde está el X.

**Capa 3 — El stepper de pasos se extiende al 100% del ancho**

En las imágenes se ve que "Paso 3 de 5" y "Piedra" están alineados a los extremos del modal — el "Piedra" queda prácticamente debajo del X. El stepper necesita un `pr-8` para no chocar con el botón X.

### Solución correcta

En lugar de pelear con el Tailwind Merge del `DialogContent`, la solución limpia es:

1. **Resetear el padding del `DialogContent` a `p-0`** en el modal de órdenes — esto libera el control total al contenido interno.
2. **Agregar un wrapper interno** con el padding correcto: `px-4 pt-4 pb-4` en mobile y `px-6 pt-6 pb-6` en desktop — con `pr-12` en mobile para dejar espacio al botón X.
3. **Ajustar el `DialogHeader`** para que también tenga el padding correcto.

Sin embargo, esto implicaría reestructurar bastante el JSX. La forma más quirúrgica y menos invasiva es:

**Solución alternativa (menos invasiva)**: Modificar directamente el `DialogContent` base en `dialog.tsx` para que el botón X sea responsive — en mobile usar `right-2` — y ajustar el `className` del `DialogContent` en `OrderDialog.tsx` para usar padding individual con `!` (importante) de Tailwind para forzar el override:

```
sm:p-6 !pt-4 !pb-4 !pl-4 !pr-12
```

El `!` en Tailwind fuerza `!important` en el CSS generado, garantizando que el padding individual siempre gane sobre el `p-6` base.

**Solución definitiva (la más correcta)**: Agregar `pr-12` al wrapper del stepper en mobile para que nunca choque con el X, y usar `!pr-12` en el `DialogContent` para forzar el padding derecho. Los campos de formulario no se ven afectados porque el padding se aplica al contenedor del modal, no a los campos individuales.

### Cambios técnicos

**Archivo: `src/components/orders/OrderDialog.tsx`**

1. **`DialogContent` (línea 931)** — Usar `!` de Tailwind para forzar el override del `p-6` base:
   ```
   className="w-full max-w-4xl max-h-[90vh] overflow-y-auto sm:mx-4 mx-0 sm:rounded-lg rounded-none sm:w-auto sm:p-6 !pt-4 !pb-4 !pl-4 !pr-12"
   ```
   El `!pr-12` (48px a la derecha) garantiza que ningún campo o texto quede tapado por el botón X en ningún paso.

2. **Stepper del lado derecho** — El texto del nombre del paso (ej. "Piedra", "Imágenes") que aparece alineado a la derecha en el stepper también necesita `pr-2` para no chocar con el X.

**Resultado esperado**: Todos los campos, dropdowns y textos del stepper tendrán 48px de separación del borde derecho en mobile — suficiente para el botón X (que está a 16px del borde con tamaño de ~16px, total ~32px) con holgura.
