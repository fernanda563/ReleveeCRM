
## Simplificar el Paso 5: Eliminar subida de STL y agregar búsqueda por nombre

### Qué hay que cambiar

El archivo `src/components/orders/OrderDialogStep5.tsx` actualmente tiene dos mecanismos:
1. Un `<Select>` para seleccionar STL existentes del repositorio.
2. Un panel expandible (toggle) para subir un archivo STL nuevo directamente al repositorio.

La petición es eliminar el mecanismo de subida y reemplazar el `<Select>` por un buscador por nombre.

---

### Cambios en `OrderDialogStep5.tsx`

**Eliminar completamente:**
- Los estados `showUpload`, `uploading`, `stlFile`, `stlNombre`, `stlDescripcion`
- Las funciones `resetUpload` y `handleUpload`
- Todo el bloque JSX del panel de subida (el `div` con la clase `rounded-lg border border-dashed`)
- Los imports de `Upload`, `Loader2`, `X`, `ChevronDown`, `ChevronUp` de lucide-react (si ya no se usan)
- La prop `onSTLUploaded` de la interfaz y del componente

**Reemplazar el `<Select>` por un buscador con `Command`:**

El proyecto ya tiene instalado `cmdk` y el componente `Command` disponible en `src/components/ui/command.tsx`. Se usará para crear un combo de búsqueda tipo "popover + command" que:
- Muestra un campo de texto con placeholder "Buscar STL por nombre..."
- Al escribir, filtra la lista de `availableSTLFiles` por nombre en tiempo real
- Al seleccionar un resultado, actualiza `selectedSTLFileId`
- Muestra el nombre del STL seleccionado en el trigger del popover
- Incluye una opción "Ninguno" para deseleccionar

**Patrón a usar:** `Popover` + `Command` + `CommandInput` + `CommandList` + `CommandItem` (patrón combobox estándar de shadcn/ui, que ya está completamente disponible en el proyecto).

```
[Trigger: Popover]
  "Buscar STL por nombre..."  ← campo de búsqueda
  ─────────────────────────
  Ninguno
  Anillo solitario clásico
  Solitario 6 uñas          ← filtrado en tiempo real
  ...
```

**Interfaz de props actualizada:**
```typescript
interface OrderDialogStep5Props {
  notas: string;
  setNotas: (value: string) => void;
  selectedSTLFileId: string;
  setSelectedSTLFileId: (value: string) => void;
  availableSTLFiles: STLFile[];
  loading: boolean;
  // onSTLUploaded ← eliminada
}
```

---

### Cambio en `OrderDialog.tsx`

Quitar la prop `onSTLUploaded` que se pasa al componente `OrderDialogStep5` en el JSX del diálogo principal. Esta prop ya no existe en la interfaz del componente.

---

### Resultado visual esperado

```
Paso 5 — Notas y Diseño STL
─────────────────────────────────────────────────────

[Notas Adicionales]
  [ Textarea para notas... ]

Archivo STL (Opcional)
  Selecciona un diseño existente del repositorio.

  [🔍 Buscar archivo STL por nombre...  ▼]
       ← popover con búsqueda reactiva →

  [Vista previa del STL seleccionado]

─────────────────────────────────────────────────────
```

---

### Archivos a modificar

1. **`src/components/orders/OrderDialogStep5.tsx`** — Eliminar toda la lógica y UI de subida, reemplazar el `<Select>` por un combobox `Popover + Command`.
2. **`src/components/orders/OrderDialog.tsx`** — Quitar la prop `onSTLUploaded` del lugar donde se renderiza `<OrderDialogStep5 ... />`.
