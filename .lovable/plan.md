
## Dos mejoras en el modal de nueva orden de compra

### 1. Corrección del stepper en vista móvil

**Problema:** El stepper en líneas 910-947 usa una distribución horizontal con `flex items-center justify-between`. En pantallas pequeñas los 5 pasos no caben: los círculos se comprimen y el texto de las etiquetas ("Cliente y Pago", "Metal", etc.) queda aplastado o invisible.

**Solución:** Hacer el stepper adaptativo:
- En **móvil**: mostrar solo el paso actual con texto descriptivo y una barra de progreso (ej: "Paso 2 de 5 — Metal"), sin intentar mostrar los 5 círculos en fila.
- En **desktop** (`sm:` en adelante): mantener el diseño horizontal de círculos que ya funciona bien.

Esto se logra con clases responsivas de Tailwind:
```
- div del stepper completo: hidden sm:flex (ocultar en móvil)
- nuevo div móvil: flex sm:hidden (mostrar solo en móvil)
```

El componente móvil mostrará:
```
[ ● ● ● ○ ○ ]   Paso 3 de 5 — Piedra
```
Con una barra de progreso y el nombre del paso actual centrado.

---

### 2. Botón "Tomar foto" debajo de "Subir comprobante de pago"

**Cómo funciona en cada dispositivo:**
- **Celular**: `capture="environment"` en el `<input type="file">` abre directamente la cámara trasera.
- **Computadora**: el mismo atributo es ignorado por los navegadores de escritorio, por lo que abre el explorador de archivos normal (igual que el botón de arriba, pero filtrado solo a imágenes).

**Cambios en líneas 1227-1247 de `OrderDialog.tsx`:**

Agregar debajo del botón existente:
```jsx
{/* Botón cámara */}
<input
  id="receipt-camera"
  type="file"
  accept="image/*"
  capture="environment"
  onChange={handleReceiptUpload}
  disabled={loading || uploading}
  className="hidden"
/>
<Button
  type="button"
  variant="outline"
  onClick={() => document.getElementById('receipt-camera')?.click()}
  disabled={loading || uploading}
  className="w-full mt-2"
>
  <Camera className="h-4 w-4 mr-2" />
  Tomar foto
</Button>
```

Importar el ícono `Camera` desde `lucide-react` (ya está instalado, solo falta agregarlo al import existente en línea 28).

La foto tomada pasa por el mismo `handleReceiptUpload` que ya valida tipo y tamaño (≤10MB), y se agrega a `paymentReceipts` junto con los demás comprobantes.

---

### Archivos a modificar

- `src/components/orders/OrderDialog.tsx`
  - **Línea 28**: Agregar `Camera` al import de lucide-react
  - **Líneas 910-947**: Refactorizar el stepper para ser responsivo (ocultar en móvil, mostrar versión compacta)
  - **Líneas 1247**: Agregar el input oculto con `capture="environment"` y el botón "Tomar foto"
