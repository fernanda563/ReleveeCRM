
## Estandarización del tamaño del modal — Nueva Orden de Compra

### Causa raíz identificada

El modal cambia de tamaño entre pasos porque su altura es completamente dinámica — crece o se encoge según el contenido del paso activo:

- **Paso 1** (Cliente, Pagos, Accesorio, Fecha): ~12 campos → modal muy alto
- **Paso 2** (Metal): solo 1–3 selects → modal muy pequeño
- **Paso 3** (Piedra): varía según selección (diamante = 7 campos, gema = 1 textarea)
- **Paso 4** (Imágenes): zona de drag-drop fija + lista dinámica
- **Paso 5** (Archivos 3D + Notas): contenido moderado

El `DialogContent` actual tiene `max-h-[90vh] overflow-y-auto` pero **ninguna altura mínima**. Esto hace que el modal se redimensione a cada paso.

### Solución

Establecer una altura fija en el `DialogContent` en lugar de una altura máxima flexible. El enfoque correcto es:

1. Cambiar de `max-h-[90vh] overflow-y-auto` a `h-[90vh]` — el modal siempre ocupa el 90% de la pantalla, sin importar el paso.
2. Hacer que el `<form>` interno use `flex flex-col flex-1 overflow-hidden` para que ocupe el espacio restante.
3. Envolver el contenido de cada paso en un `div` con `flex-1 overflow-y-auto` — así el scroll ocurre solo dentro del área de contenido, no en todo el modal.
4. El footer de navegación (botones Anterior/Siguiente/Cancelar) se fija siempre al fondo del modal.

Este patrón es el estándar para modales multi-paso: **header fijo + contenido scrollable + footer fijo**.

### Cambios técnicos

**Archivo: `src/components/orders/OrderDialog.tsx`**

**Cambio 1 — `DialogContent` (línea 931)**

```
// ANTES:
className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-0 sm:mx-4 rounded-none sm:rounded-lg sm:w-auto pr-10 sm:pr-6"

// DESPUÉS:
className="w-full max-w-4xl h-[90vh] flex flex-col mx-0 sm:mx-4 rounded-none sm:rounded-lg sm:w-auto pr-10 sm:pr-6 overflow-hidden"
```

- `h-[90vh]` en lugar de `max-h-[90vh]`: altura **fija** al 90% de la pantalla
- `flex flex-col`: permite que los hijos se distribuyan verticalmente
- `overflow-hidden`: el scroll se delega al contenido interno

**Cambio 2 — `<form>` (línea 1022)**

```
// ANTES:
<form onSubmit={handleSubmit}>

// DESPUÉS:
<form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
```

- `flex flex-col flex-1`: el form ocupa todo el espacio vertical disponible
- `overflow-hidden min-h-0`: necesario para que el scroll interno funcione correctamente en flex

**Cambio 3 — Contenedor de cada paso (wrapper interior al `<form>`)**

Envolver los bloques de cada paso (`{currentStep === 1 && ...}`, etc.) y el footer dentro de una estructura:

```jsx
{/* Área de contenido scrollable */}
<div className="flex-1 overflow-y-auto min-h-0 py-4">
  {/* Step 1 */}
  {currentStep === 1 && ( <div className="space-y-4">...</div> )}
  {/* Step 2 */}
  {currentStep === 2 && ( <div className="space-y-4">...</div> )}
  {/* ... pasos 3, 4, 5 ... */}
</div>

{/* Footer fijo */}
<div className="flex justify-between gap-3 pt-4 border-t flex-wrap gap-y-2 flex-shrink-0">
  ...botones...
</div>
```

El `flex-shrink-0` en el footer garantiza que nunca se comprima. El `overflow-y-auto` en el contenido permite scroll solo cuando el paso tiene muchos campos (como el paso 1).

**Cambio 4 — Stepper desktop y mobile**

El stepper (visual de círculos + línea en desktop, barra de progreso en mobile) también debe tener `flex-shrink-0` para que no se encoja:

```
// Stepper desktop (línea 942):
<div className="hidden sm:flex ... flex-shrink-0">

// Stepper mobile (línea 985):
<div className="flex sm:hidden ... flex-shrink-0">
```

### Estructura final del modal

```text
DialogContent [h-[90vh] flex flex-col overflow-hidden]
  ├── DialogHeader          [flex-shrink-0]  ← título siempre visible
  ├── Stepper desktop/mobile [flex-shrink-0] ← progreso siempre visible
  ├── form [flex flex-col flex-1 overflow-hidden]
  │   ├── Área de contenido [flex-1 overflow-y-auto]  ← scroll aquí
  │   │   ├── {currentStep === 1 && ...}
  │   │   ├── {currentStep === 2 && ...}
  │   │   ├── {currentStep === 3 && ...}
  │   │   ├── {currentStep === 4 && ...}
  │   │   └── {currentStep === 5 && ...}
  │   └── Footer botones [flex-shrink-0]  ← siempre al fondo
```

### Resultado esperado

- El modal **no cambia de tamaño** entre pasos — siempre ocupa exactamente el 90% de la pantalla.
- Los pasos con poco contenido (Paso 2: Metal) tendrán espacio vacío debajo — el footer queda abajo.
- Los pasos con mucho contenido (Paso 1: Cliente+Pagos) harán scroll dentro del área de contenido.
- El stepper y los botones de navegación son siempre visibles — no quedan ocultos por el scroll.
- El cambio es completamente autónomo dentro de `OrderDialog.tsx` — no afecta ningún otro modal del sistema.
