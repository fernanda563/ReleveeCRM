
## Dos problemas a resolver

### Problema 1 — Error al crear la orden (constraint violation)

**Causa exacta identificada:** La base de datos tiene un check constraint en la columna `piedra_tipo` de la tabla `orders` que solo acepta dos valores:

```
CHECK (piedra_tipo = ANY (ARRAY['diamante'::text, 'gema'::text]))
```

Pero el formulario en `OrderDialog.tsx` usa una lista ampliada de valores como `diamante_natural`, `diamante_laboratorio`, `perla`, `circonia`, `moissanita`, `piedra_semipreciosa`, `piedra_personalizada`. Cuando el usuario selecciona cualquiera de estos valores nuevos, la inserción en la base de datos falla con el error:

```
new row for relation "orders" violates check constraint "orders_piedra_tipo_check"
```

**Solución:** Hay dos opciones:

- **Opción A (recomendada):** Ampliar el check constraint de la base de datos para incluir todos los valores que el formulario ya ofrece.
- **Opción B:** Mapear los valores del formulario a `'diamante'` o `'gema'` antes de guardar.

La **Opción A** es la correcta porque preserva la información granular (diamante natural vs laboratorio) en la base de datos para futuras consultas y reportes. Se ejecutará una migración SQL que amplía el constraint.

**Migración SQL a ejecutar:**

```sql
-- Eliminar el constraint actual
ALTER TABLE public.orders DROP CONSTRAINT orders_piedra_tipo_check;

-- Crear el constraint actualizado con todos los valores válidos del formulario
ALTER TABLE public.orders ADD CONSTRAINT orders_piedra_tipo_check
  CHECK (piedra_tipo = ANY (ARRAY[
    'diamante'::text,
    'diamante_natural'::text,
    'diamante_laboratorio'::text,
    'gema'::text,
    'perla'::text,
    'circonia'::text,
    'moissanita'::text,
    'piedra_semipreciosa'::text,
    'piedra_personalizada'::text
  ]));
```

También hay que actualizar la validación en `handleSubmit` (línea 782) que detecta si es diamante para incluir `diamante_natural` y `diamante_laboratorio` — eso ya está correcto. Solo falta el constraint de BD.

---

### Problema 2 — Reordenar sección de comprobantes en el Paso 1

**Situación actual (líneas 1300-1397):**

```
[Label "Comprobantes de Pago"]
  [Botón: Subir comprobantes de pago]    ← botón 1
  [Botón: Tomar foto]                    ← botón 2
[p: texto de ayuda]
[Lista de comprobantes nuevos]           ← aparece DESPUÉS del texto de ayuda
[Lista de comprobantes guardados]
[Label "Fecha de Entrega *"]
```

**Situación deseada:**

```
[Label "Comprobantes de Pago"]
  [Botón: Subir comprobantes de pago]    ← botón 1
  [Lista de comprobantes nuevos]         ← inmediatamente debajo del botón 1
  [Botón: Tomar foto]                    ← botón 2
  [Lista de fotos tomadas]               ← inmediatamente debajo del botón 2
[p: texto de ayuda]
[Label "Fecha de Entrega *"]
```

**Cambio en `OrderDialog.tsx` (líneas 1300-1397):** Mover la lista de `paymentReceipts` para que quede justo después del primer botón y antes del segundo botón "Tomar foto". Actualmente ambas listas están al final del bloque después del texto de ayuda. Se reestructurará el JSX para que cada botón tenga su lista debajo de forma inmediata.

---

### Archivos a modificar

1. **Nueva migración SQL** — ampliar el check constraint `orders_piedra_tipo_check`.
2. **`src/components/orders/OrderDialog.tsx`** — reordenar el JSX de comprobantes en el Paso 1 (líneas ~1300-1397).

### Resultado esperado

- Al crear una orden con cualquier tipo de piedra (diamante natural, diamante de laboratorio, gema, perla, circonia, moissanita, etc.), la orden se guarda correctamente sin errores de constraint.
- Los comprobantes subidos aparecen inmediatamente debajo del botón "Subir comprobantes de pago", y las fotos tomadas aparecen inmediatamente debajo del botón "Tomar foto".
