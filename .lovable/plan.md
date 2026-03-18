

## Cambiar input de Categoría a dropdown (Select)

Reemplazar el `<Input>` con `<datalist>` (líneas 95-106) por un `<Select>` de shadcn/ui que muestre las categorías existentes como opciones. Incluir también una opción para escribir una nueva categoría mediante un item "Otra..." que muestre un input inline.

### Cambios en `src/components/materials/MaterialDialog.tsx`

1. Reemplazar el bloque de Categoría (líneas 93-106) por un `<Select>` con:
   - Las `existingCategories` como `<SelectItem>` 
   - Un `<SelectItem value="__nueva__">Otra (nueva categoría)</SelectItem>` al final
2. Agregar estado `showCustomCategoria` — cuando se selecciona "\_\_nueva\_\_", mostrar un `<Input>` debajo para escribir la categoría personalizada
3. Cuando se selecciona una categoría existente, actualizar `form.categoria` directamente; cuando se escribe una nueva, actualizar desde el input

Sin cambios en otros archivos ni en base de datos.

