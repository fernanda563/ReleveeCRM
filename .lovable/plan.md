
## Fix: Padding derecho del modal en mobile

### Diagnóstico

En la imagen se observa que los campos (dropdowns, inputs) en el paso 3 del modal están cortados por el lado derecho. La raíz del problema es la combinación de dos factores:

**Factor 1 — El botón de cierre (X) ocupa espacio visual**
El `DialogContent` base (en `src/components/ui/dialog.tsx`) posiciona el botón X con `right-4 top-4` de forma absoluta. En desktop esto no interfiere porque hay margen. En mobile con `w-full mx-0 p-4`, el contenido del modal llega hasta el borde, y el padding derecho de `16px` (p-4) deja los campos prácticamente encima del botón X.

**Factor 2 — Tailwind Merge y el padding base**
El `DialogContent` base tiene `p-6` hardcoded. Al pasar `sm:p-6 p-4` en `className`, Tailwind Merge lo sobreescribe correctamente — pero el valor `p-4` aplica el mismo padding a los cuatro lados, incluyendo la derecha donde está el X.

**Solución**
En mobile se necesita un padding derecho mayor que el izquierdo para compensar el botón X. Esto se logra reemplazando la clase padding en `DialogContent` del modal de órdenes:

- Cambiar `sm:p-6 p-4` por `sm:p-6 pt-4 pb-4 pl-4 pr-10`

Esto da 16px arriba/abajo/izquierda y 40px a la derecha en mobile — espacio suficiente para que el botón X no tape los campos. En desktop (`sm:p-6`) se mantiene el padding uniforme.

### Cambio técnico

**Archivo: `src/components/orders/OrderDialog.tsx` — línea 931**

```
// ANTES
className="w-full max-w-4xl max-h-[90vh] overflow-y-auto sm:mx-4 mx-0 sm:rounded-lg rounded-none sm:w-auto sm:p-6 p-4"

// DESPUÉS
className="w-full max-w-4xl max-h-[90vh] overflow-y-auto sm:mx-4 mx-0 sm:rounded-lg rounded-none sm:w-auto sm:p-6 pt-4 pb-4 pl-4 pr-10"
```

Este es el único cambio necesario — un ajuste de una sola línea que soluciona el margen derecho sin afectar ningún otro paso ni comportamiento del modal.
