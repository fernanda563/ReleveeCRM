# Auditoría de /agendar-cita: alineación del calendario y ancho del combo box

Objetivo: corregir dos desajustes concretos en la vista pública de agendamiento, sin rediseñar la interfaz.

## 1. Calendario: columnas y fechas alineadas a la izquierda

**Problema confirmado:** en `src/components/public/LargeCalendar.tsx` las celdas de días y de encabezado tienen ancho fijo `w-12` y sus filas usan `flex`, por lo que el mes no ocupa todo el ancho de la tarjeta y se ve alineado a la izquierda.

**Cambio:**
- Revisar `LargeCalendar.tsx`.
- Cambiar `head_row` para que ocupe el ancho total (`w-full`) y `head_cell` para que reparta el espacio (`flex-1`, manteniendo centrado del texto).
- Cambiar `row` y `cell` para que las celdas de días usen `flex-1` en lugar de `w-12`, manteniendo `h-12` de alto.
- Ajustar `day` para que se estire al ancho de la celda (`w-full` o `h-12`) sin deformar el texto.
- Preservar estados `selected`, `today`, `disabled` y `outside` del calendario shadcn.

**Verificación:** captura de pantalla del paso 3 en desktop; el calendario debe ocupar el ancho completo del panel izquierdo y las columnas deben estar equidistantes.

## 2. Combo box "¿Cómo se enteró de nosotros?": ocupar todo el ancho como fila aparte

**Problema confirmado:** en `src/pages/PublicBooking.tsx`, paso 0, el campo `fuente_contacto` está dentro del grid de dos columnas (`grid-cols-1 sm:grid-cols-2`) con `sm:col-span-2`. El usuario reporta que debería ser una fila independiente y ocupar todo el ancho de las dos columnas.

**Cambio:**
- Mover el `FormField` de `fuente_contacto` fuera del grid de datos personales.
- Colocarlo en una sección propia dentro del `CardContent` como fila completa, con `w-full` y `SelectTrigger` que se estire a todo el ancho.
- Revisar el layout del `CardContent` para que el grid de datos arriba (1-2 columnas según breakpoint) y el combo box abajo (1 columna) mantengan la separación visual sin desbordarse.
- Revisar que el Select de shadcn conserve el ancho total (`w-full` en `SelectTrigger` ya existe, pero verificar que el contenedor padre no lo limite).

**Verificación:** captura de pantalla del paso 1; el combo box debe mostrarse en una fila propia debajo de los datos personales y ocupar todo el ancho disponible.

## 3. Verificación de integridad

- Ejecutar el build para detectar errores de tipos o JSX tras mover componentes.
- Confirmar que no se afecta la funcionalidad del formulario (validación, envío, máscara de teléfono, checkbox de privacidad).
- Confirmar que el calendario sigue deshabilitando fechas sin disponibilidad y que la selección de día/horario funciona.
