

## Nueva Cotización: Modal con selección de pieza, materiales y mano de obra

### Concepto

Crear un nuevo componente `QuotationDialog` que permita al usuario:
1. Seleccionar un **cliente** (dropdown de clientes existentes)
2. Seleccionar un **tipo de pieza** de joyería (dropdown con ~20 tipos comunes)
3. Agregar **materiales** del catálogo (metales y piedras) con cantidad/peso/quilataje
4. Agregar **mano de obra** del catálogo (work_concepts) con cantidad
5. Ver el **precio total calculado** en tiempo real (materiales + mano de obra)
6. Guardar la cotización en la tabla `prospects` + `prospect_items`

### Tipos de pieza (Top 20 joyería)

Se ampliará la tabla `accessory_type_config` con los tipos faltantes. Los tipos actuales son: anillo, arete, brazalete, cadena, collar, dije, piercing, pulsera, toby, otro. Se agregarán:
- Anillo de compromiso, Anillo de boda, Churumbela, Argolla, Escapulario, Medalla, Broche, Mancuernillas, Reloj (bisel/caja), Tiara/Corona

### Estructura del modal (pasos)

**Paso 1 — Información general:**
- Cliente (dropdown, obligatorio)
- Tipo de pieza (dropdown desde `accessory_type_config`)
- Fecha de entrega deseada (opcional)
- Observaciones (textarea, opcional)

**Paso 2 — Materiales:**
- Dropdown para seleccionar material del catálogo (tabla `materials`, solo activos)
- Al seleccionar, se muestra su precio unitario (calculado con `calcularPrecioMaterial`)
- Input de cantidad/peso según `unidad_medida` del material
- Para piedras: input de quilataje y número de piedras
- Botón "Agregar" → se acumula en una tabla resumen
- Se pueden agregar múltiples materiales

**Paso 3 — Mano de obra:**
- Dropdown para seleccionar concepto de trabajo (tabla `work_concepts`, solo activos)
- Se muestra su `precio_venta_base` y `unidad_medida`
- Input de cantidad según unidad
- Botón "Agregar" → se acumula en tabla resumen

**Paso 4 — Resumen y precio:**
- Tabla con todos los materiales + cantidades + subtotales
- Tabla con toda la mano de obra + cantidades + subtotales
- **Total materiales + Total mano de obra = Precio cotización**
- Botón "Guardar Cotización"

### Lógica de precios

- **Materiales**: `calcularPrecioMaterial(costo_directo, tipo_margen, valor_margen, redondeo, redondeo_multiplo) × cantidad`
- **Piedras**: precio unitario × quilataje (o × número de piedras, según `unidad_medida`)
- **Mano de obra**: `precio_venta_base × cantidad`
- **Total**: Σ subtotales materiales + Σ subtotales mano de obra

### Persistencia

- Insertar en `prospects`: `client_id`, `tipo_accesorio`, `importe_previsto` (total calculado), `fecha_entrega_deseada`, `observaciones`, `estado: 'activo'`
- Insertar en `prospect_items`: una fila por cada material/concepto agregado, con `tipo` ('material' o 'mano_de_obra'), `referencia_id` (material.id o work_concept.id), `cantidad`, `costo_unitario`, `precio_unitario`

### Archivos

| Archivo | Acción |
|---------|--------|
| `src/components/crm/QuotationDialog.tsx` | **Crear** — Modal multi-paso con toda la lógica |
| `src/pages/Projects.tsx` | **Editar** — Agregar botón "Nueva Cotización" + import y estado del dialog |
| `src/pages/ClientDetail.tsx` | **Editar** — Agregar botón "Nueva Cotización" en pestaña de cotizaciones |
| Migración SQL | **Crear** — Insertar tipos faltantes en `accessory_type_config` |

### Estilo

Seguir el patrón monocromático del sistema: `DialogHeader`, `DialogFooter`, `<Button>` sin clases de color, `<Input>` del sistema, `<Select>` estándar.

