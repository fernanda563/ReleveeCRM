
## Diagnóstico Definitivo: Por qué los `!important` de Tailwind no funcionan

Después de leer el código de `dialog.tsx` línea 39 en detalle, encontré la causa exacta del problema:

El componente base `DialogContent` en `src/components/ui/dialog.tsx` aplica sus clases así:

```
className={cn(
  "... p-6 ...",  // clases base con p-6
  className,       // clases del usuario al final
)}
```

La función `cn()` usa `tailwind-merge` internamente. Tailwind Merge es inteligente: sabe que `p-6` (shorthand) y `pt-4 pr-12 pb-4 pl-4` (individuales) son conflictivos, y **el que va último gana**. Como `className` del usuario va al final, en teoría debería ganar.

**Entonces ¿por qué no funciona?** Porque el intento anterior mezcló `sm:!p-6` con `!pt-4 !pb-4 !pl-4 !pr-12`. El modificador `!` de Tailwind convierte cada clase en `!important`, pero `sm:!p-6` **también se convierte en `!important` en pantallas `sm:`**, y en mobile el valor resultante queda controlado por la resolución de merge de `p-6` base vs `!pt-4` etc. El resultado es impredecible porque `tailwind-merge` v2 trata el prefijo `!` de forma especial.

**El verdadero problema**: La clase `p-6` del `DialogContent` base en `dialog.tsx` no tiene breakpoints — se aplica siempre, incluyendo mobile. Y el intento de sobreescribirla con clases individuales `!pt-4 !pr-12` tiene conflictos porque `p-6` expande internamente a `pt-6 pr-6 pb-6 pl-6`, y merge tiene que resolver 4 conflictos simultáneamente.

---

## Solución Definitiva: Enfoque desde la raíz

En lugar de seguir luchando contra `tailwind-merge` desde el exterior, la solución correcta es **modificar el componente base `DialogContent` en `dialog.tsx`** para:

1. Quitar el `p-6` hardcodeado de las clases base (o condicionarlo a `sm:`)
2. Poner `p-4 sm:p-6` como base, lo que da padding simétrico correcto en ambas pantallas
3. También mover el botón X a `right-2 sm:right-4` para que en mobile no invada el contenido

Y luego en `OrderDialog.tsx`, simplificar el `DialogContent` para que no necesite ningún override de padding (el base ya estará bien).

Adicionalmente, en `OrderDialog.tsx` hay **dos bugs extra** a corregir:
- El botón `⚡ Skip` de desarrollo sigue en el código (líneas 2043-2052) — se elimina
- El stepper mobile en `px-2 pr-8` tiene una combinación rota: `px-2` establece `pl-2 pr-2`, luego `pr-8` sobreescribe solo la derecha — esto funciona, pero la asimetría visual (2px izq, 32px der) hace que el texto "Piedra"/"Imágenes" quede muy separado del borde derecho cuando debería estar justamente antes del botón X

---

## Cambios técnicos

### Archivo 1: `src/components/ui/dialog.tsx`

**Cambio en línea 39** — quitar `p-6` de las clases base y reemplazar por `p-4 sm:p-6`:

```
// ANTES (línea 39):
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg ..."

// DESPUÉS:
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-4 sm:p-6 shadow-lg ..."
```

**Cambio en línea 45** — mover el botón X responsive:

```
// ANTES:
<DialogPrimitive.Close className="absolute right-4 top-4 ...">

// DESPUÉS:
<DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 ...">
```

Esto hace que el botón X en mobile esté a 12px del borde (no 16px), dejando más espacio visual para el contenido.

### Archivo 2: `src/components/orders/OrderDialog.tsx`

**Cambio 1 — `DialogContent` (línea 931)** — limpiar completamente los overrides de padding (ya no son necesarios porque `dialog.tsx` los maneja correctamente):

```
// ANTES:
className="w-full max-w-4xl max-h-[90vh] overflow-y-auto sm:mx-4 mx-0 sm:rounded-lg rounded-none sm:w-auto sm:!p-6 !pt-4 !pb-4 !pl-4 !pr-12"

// DESPUÉS:
className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-0 sm:mx-4 rounded-none sm:rounded-lg w-full sm:w-auto pr-10 sm:pr-6"
```

El `pr-10` (40px) en mobile es el padding derecho ampliado — suficiente para el botón X que queda a 12px del borde + tamaño del ícono 16px = 28px total, con 12px de holgura adicional.

**Cambio 2 — Stepper mobile (línea 992)** — corregir el padding para que sea simétrico con espacio para el X:

```
// ANTES:
<div className="flex sm:hidden flex-col gap-2 mb-4 px-2 pr-8">

// DESPUÉS:
<div className="flex sm:hidden flex-col gap-2 mb-4">
```

El stepper NO necesita padding propio porque el `DialogContent` ya tiene `pr-10` — el padding del contenedor padre ya da el espacio.

**Cambio 3 — Eliminar botón ⚡ Skip (líneas 2041-2061)** — eliminar el bloque del botón de desarrollo que ya no se necesita:

```
// ANTES: hay un div con dos botones (Skip y Siguiente)
// DESPUÉS: solo el botón Siguiente directamente
```

**Cambio 4 — Navegación footer: alinear correctamente para mobile (línea 2002)**

En mobile, los botones "Anterior" / "Cancelar" / "Siguiente" están en `flex justify-between`. En pantallas muy estrechas, si hay 3 botones ("Anterior", "Cancelar", "Siguiente"), se aprietan. Agregar `flex-wrap gap-y-2` para que puedan bajar de línea si no caben.

---

## Resultado esperado

Todos los campos, selects y textos del stepper en todos los pasos (1-5) tendrán:
- **Izquierda**: 16px de padding (p-4)
- **Derecha**: 40px de padding (pr-10) — el botón X queda a 12px del borde con 16px de ícono = 28px, dejando 12px de holgura limpia
- **Arriba/abajo**: 16px (p-4)
- En **desktop** (`sm:`): padding uniforme 24px en todos lados (p-6), sin cambios

El cambio en `dialog.tsx` beneficia a **todos los modales del sistema** en mobile, no solo el de órdenes.
