
## Expandir catálogo de tipos de piedra en el modal de Nueva Orden de Compra

### Contexto actual

El campo `piedra_tipo` en el paso 3 del modal solo ofrece dos opciones: **Diamante** y **Gema**. Internamente, la lógica del sistema distingue entre:
- `"diamante"` → muestra formulario completo con Corte, Quilataje, Color, Claridad y Calidad de Corte
- cualquier otro valor → muestra solo un campo de observaciones de texto libre

### Catálogo propuesto

Se incluirán las opciones solicitadas más variantes estándar del mercado joyero:

| Valor en BD | Etiqueta visible | Formulario que activa |
|---|---|---|
| `diamante_natural` | Diamante Natural | Especificaciones completas (forma, quilataje, color, claridad, corte) |
| `diamante_laboratorio` | Diamante de Laboratorio | Especificaciones completas (forma, quilataje, color, claridad, corte) |
| `gema` | Gema (Rubí, Esmeralda, Zafiro, etc.) | Campo de observaciones libre |
| `perla` | Perla | Campo de observaciones libre |
| `circonia` | Circonia Cúbica | Campo de observaciones libre |
| `moissanita` | Moissanita | Campo de observaciones libre |
| `piedra_semipreciosa` | Piedra Semipreciosa | Campo de observaciones libre |
| `piedra_personalizada` | Piedra Personalizada | Campo de observaciones libre |

### Cambios técnicos en `src/components/orders/OrderDialog.tsx`

**1. Tipo del estado (línea 103)**
Ampliar el tipo del estado `piedraTipo` de `"diamante" | "gema"` a un union type más amplio que incluya todos los nuevos valores.

**2. Selector del dropdown (líneas 1475-1478)**
Reemplazar las 2 opciones actuales por las 8 opciones del catálogo agrupadas visualmente con separadores:
- Grupo "Diamantes": Diamante Natural, Diamante de Laboratorio
- Grupo "Otras piedras": Gema, Perla, Circonia Cúbica, Moissanita, Piedra Semipreciosa, Piedra Personalizada

**3. Lógica de formulario condicional (líneas 1482 y 1617)**
- El bloque de especificaciones técnicas (color, claridad, corte, quilataje, forma) se activa para `diamante_natural` y `diamante_laboratorio`
- El bloque de observaciones en texto libre se activa para todos los demás tipos

**4. Validaciones (líneas 561-572 y 749-775)**
Actualizar las condiciones `if (piedraTipo === "diamante")` para que validen cuando `piedraTipo === "diamante_natural" || piedraTipo === "diamante_laboratorio"`.

**5. Lógica de guardado (líneas 821-834)**
Igual que las validaciones: los campos específicos de diamante (`diamante_color`, `diamante_claridad`, etc.) se guardan cuando el tipo es `diamante_natural` o `diamante_laboratorio`.

**6. Prellenado desde prospecto (líneas 134 y 351)**
Actualizar la lógica de mapeo: si el prospecto tiene `tipo_piedra === "diamante"`, se mapea a `"diamante_natural"` como valor por defecto razonable.

### Compatibilidad con datos históricos

Las órdenes existentes que tienen `piedra_tipo = "diamante"` o `piedra_tipo = "gema"` en la base de datos seguirán funcionando. El valor `"diamante"` antiguo se mostrará tal cual en los registros históricos (el campo `capitalizeFirst` lo mostrará como "Diamante"). No se requiere migración de datos.

### Archivos a modificar

- **`src/components/orders/OrderDialog.tsx`**: Todos los cambios descritos arriba (tipo del estado, dropdown, validaciones, guardado, prellenado)
