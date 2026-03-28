

## Plan: Auto-detectar materiales con precio API durante la creación

### Problema

La lógica `isAutoMetal` actual requiere `isEditing` (línea 105), por lo que al crear un nuevo material de tipo oro/plata/platino, el formulario no bloquea los campos ni asigna automáticamente el costo desde la API. El usuario puede ingresar un costo manual que será sobreescrito en la próxima sincronización.

### Solución

Eliminar la condición `isEditing` de `isAutoMetal` para que aplique tanto en creación como en edición. Cuando el usuario selecciona categoría "Metales" + tipo (oro/plata/platino) + kilataje, el formulario:

1. **Bloquea** los campos de costo directo y unidad de medida (igual que en edición)
2. **Consulta** la tabla `metal_price_table` de `system_settings` para obtener el precio por gramo correspondiente a ese tipo+pureza y lo asigna automáticamente al campo `costo_directo`
3. **Muestra** el aviso de que el costo se gestiona vía API

### Cambios en `src/components/materials/MaterialDialog.tsx`

**1. Cambiar la condición `isAutoMetal`** (línea 105):
```ts
// Antes
const isAutoMetal = isEditing && form.categoria === "Metales" && ...
// Después
const isAutoMetal = form.categoria === "Metales" &&
  ["oro", "plata", "platino"].includes(form.tipo_material) &&
  !!form.kilataje;
```

**2. Cargar `price_table` de `system_settings`** al abrir el diálogo:
- Fetch a `system_settings` donde `key = 'metal_price_table'`
- Almacenar en estado local `priceTable`

**3. Auto-asignar costo directo** cuando `isAutoMetal` cambia a `true`:
- En un `useEffect` que observe `form.tipo_material`, `form.kilataje` y `priceTable`
- Buscar en `priceTable` la entrada que coincida con el metal y pureza seleccionados
- Asignar `form.costo_directo = formatCurrency(precio_gramo)` y `form.unidad_medida = "gramo"`

**4. Ajustar el aviso** para que en modo creación diga algo como: "El costo directo se asignará automáticamente desde la API de precios de metales."

### Archivo modificado
- `src/components/materials/MaterialDialog.tsx`

