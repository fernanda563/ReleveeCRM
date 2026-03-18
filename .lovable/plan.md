

## Validación de materiales requeridos por tipo de pieza

### Enfoque

Definir un mapa client-side que asocie cada tipo de pieza con sus requisitos de materiales (metal y/o piedra). En el paso 2, validar que se hayan agregado los materiales necesarios antes de avanzar. Incluir checkboxes de excepción ("El cliente proporciona su metal/piedra").

### Mapa de requisitos por tipo de pieza

| Tipo de pieza | Requiere metal | Requiere piedra |
|---|---|---|
| anillo | ✓ | ✗ |
| anillo de compromiso* | ✓ | ✓ |
| collar | ✓ | ✗ |
| pulsera | ✓ | ✗ |
| arete | ✓ | ✗ |
| dije | ✓ | ✗ |
| cadena | ✓ | ✗ |
| brazalete | ✓ | ✗ |
| piercing | ✓ | ✗ |
| toby | ✓ | ✗ |
| otro | ✗ | ✗ |

*Nota: El `selectedType` viene de `accessory_type_config.tipo_accesorio`. Necesito verificar los valores exactos en la BD para mapear correctamente cuáles requieren piedra. La mayoría de piezas requieren metal; solo algunas requieren piedra obligatoriamente.

### Cambios en `QuotationDialog.tsx`

1. **Nuevo estado**: `skipMetal` y `skipStone` (booleans, default false).

2. **Mapa de requisitos**: Objeto constante que define para cada `tipo_accesorio` si requiere metal (`requiresMetal`) y piedra (`requiresStone`). Por defecto todas requieren metal; las que típicamente llevan piedra (como tipos que incluyan "compromiso") también requieren piedra.

3. **UI en paso 2**: Mostrar al inicio del paso un bloque informativo con los requisitos de la pieza seleccionada, y dos checkboxes:
   - "El cliente proporciona su propio metal" (solo si requiere metal)
   - "El cliente proporciona su propia piedra" (solo si requiere piedra)

4. **Validación en `canAdvance()`**: Cuando `step === 1`:
   - Si requiere metal y `!skipMetal`, verificar que `materialItems` contenga al menos un item con categoría "Metales".
   - Si requiere piedra y `!skipStone`, verificar que `materialItems` contenga al menos un item con categoría "Piedras Preciosas".
   - Si no se cumplen, no permitir avanzar.

5. **Mensaje de ayuda**: Mostrar texto debajo de la tabla indicando qué falta agregar (ej. "Falta agregar un metal" / "Falta agregar una piedra").

6. **Reset**: Limpiar `skipMetal`/`skipStone` en `resetForm()`.

### Detalle técnico

Para saber la categoría de cada item agregado, se guardará la categoría del material en el `QuoteItem` (agregar campo `categoria` al interface) al momento de hacer `addMaterial`, ya que `selectedMaterial.categoria` está disponible. Luego en la validación se filtra por `categoria === "Metales"` o `categoria === "Piedras Preciosas"`.

