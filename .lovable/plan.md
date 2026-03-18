

## Permitir múltiples especialidades en el diálogo de diseñador

### Problema actual
El campo `especialidad` usa un `Select` simple que solo permite elegir una opción. Se almacena como texto en la columna `especialidad` (tipo `text`).

### Solución
Convertir el selector a un sistema multi-select usando checkboxes dentro de un Popover/Command, almacenando las especialidades seleccionadas como texto separado por comas (ej: `"Diseño 3D / CAD, Renderizado"`). No requiere migración de base de datos.

### Cambios en `src/components/designers/DesignerDialog.tsx`

1. **Estado**: Cambiar `especialidad` de string simple a array interno para manejo en el form. Al cargar un diseñador existente, parsear el string por comas. Al guardar, unir el array con comas.

2. **UI**: Reemplazar el `Select` por un `Popover` con una lista de checkboxes (uno por cada especialidad en `ESPECIALIDADES`). Mostrar las especialidades seleccionadas como badges dentro del trigger del popover. Incluir un botón para limpiar la selección.

3. **Guardado**: Antes de enviar a la DB, convertir el array a string con `join(", ")`. Al cargar desde DB, hacer `split(", ")` para restaurar el array.

4. **Vista**: En el trigger del popover mostrar los badges de las especialidades seleccionadas, o un placeholder "Seleccionar especialidades" si no hay ninguna.

