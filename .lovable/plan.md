
## Mejora del selector de comprobantes de pago en el modal de nueva orden

### Problema actual
En el paso 1 del modal de orden de compra, el selector de archivos usa un `<Input type="file">` nativo del navegador (línea 1227 de `OrderDialog.tsx`). Esto genera el botón gris estándar del sistema operativo con el texto "Elegir archivos", que es poco intuitivo y visualmente inconsistente con el resto del sistema.

### Solución
Reemplazar el `<Input type="file">` visible por un patrón de botón estilizado + input oculto, un patrón ya usado en otros componentes del sistema.

### Cambios en `src/components/orders/OrderDialog.tsx` (líneas 1225-1233)

Reemplazar esto:
```jsx
<div className="space-y-2 mt-4">
  <Label>Comprobantes de Pago</Label>
  <Input
    type="file"
    accept="image/jpeg,image/png,image/jpg,application/pdf"
    multiple
    onChange={handleReceiptUpload}
    disabled={loading || uploading}
  />
```

Por esto:
```jsx
<div className="space-y-2 mt-4">
  <Label>Comprobantes de Pago</Label>
  <div>
    <input
      id="receipt-upload"
      type="file"
      accept="image/jpeg,image/png,image/jpg,application/pdf"
      multiple
      onChange={handleReceiptUpload}
      disabled={loading || uploading}
      className="hidden"
    />
    <Button
      type="button"
      variant="outline"
      onClick={() => document.getElementById('receipt-upload')?.click()}
      disabled={loading || uploading}
      className="w-full"
    >
      <Upload className="h-4 w-4 mr-2" />
      Subir comprobantes de pago
    </Button>
  </div>
```

### Resultado visual

| Antes | Después |
|---|---|
| Botón gris genérico del sistema operativo | Botón estilizado con ícono de subida, borde, ancho completo y texto claro |

El comportamiento es idéntico: al hacer clic en el botón se abre el explorador de archivos con los mismos filtros (JPG, PNG, PDF) y permite selección múltiple.
