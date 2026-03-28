

## Plan: Calculadora de "Peso de Pieza" — Combinación de montura + diamantes

### Resumen

Crear una nueva página `/calculators/piece-weight` que integre ambas calculadoras existentes en un solo flujo unificado. El usuario selecciona el tipo de pieza, configura la montura (metal) y las piedras (diamantes), y obtiene un desglose completo del peso total de la pieza terminada.

### Flujo de la calculadora

```text
┌─────────────────────────────────────┐
│ 1. Tipo de pieza (selector unificado)│
├─────────────────────────────────────┤
│ 2. MONTURA                          │
│    Talla · Ancho · Grosor · Quilataje│
│    → Peso del metal                  │
├─────────────────────────────────────┤
│ 3. PIEDRAS                           │
│    Corte · Dimensiones · Nº piedras  │
│    → Peso en quilates                │
├─────────────────────────────────────┤
│ 4. RESUMEN TOTAL                     │
│    Peso metal + Peso piedras (g)     │
│    = Peso total de la pieza          │
└─────────────────────────────────────┘
```

### Tipos de pieza unificados

Los tipos de pieza determinan los presets **tanto** de la montura como de las piedras:

| Tipo | Ancho/Grosor | Piedras default | Corte default |
|---|---|---|---|
| Solitario | 2.0/1.5 mm | 1 | Round |
| Churumbela | 2.5/2.0 mm | 13 | Round |
| Media churumbela | 2.0/1.5 mm | 7 | Round |
| Anillo de eternidad | 2.5/2.0 mm | 20 | Round |
| Argolla Dama | 2.0/1.5 mm | 0 | — |
| Argolla Caballero | 4.0/2.0 mm | 0 | — |
| Arras (×13) | 2.0/1.0 mm | 0 | — |
| Cóctel | 5.0/2.5 mm | 1 | Cushion |
| Sello / Signet | 6.0/2.5 mm | 0 | — |
| Banda Lisa | 3.0/2.0 mm | 0 | — |
| Personalizado | manual | manual | manual |

Cuando el tipo no tiene piedras (argollas, arras, sello, banda), la sección de piedras se oculta automáticamente.

### Implementación

**1. Nueva página `src/pages/PieceWeightCalculator.tsx`**
- Selector de tipo de pieza (grid de botones con tooltips, mismo patrón visual)
- Sección "Montura": reutiliza `RingWeightCalculator` como componente embebido (ya acepta props `alloy`, `onAlloyChange`, `onUseWeight`)
- Sección "Piedras": extrae la lógica de cálculo de `DiamondWeightCalculator` en un componente reutilizable o la embebe directamente (selector de corte, dimensiones, número de piedras)
- Sección "Resumen": tarjetas con peso metal (g), peso piedras (ct y g, usando 1 ct = 0.2 g), peso total combinado

**2. Sincronización entre secciones**
- Al cambiar tipo de pieza → actualiza presets de montura Y número de piedras/corte
- El quilataje seleccionado en la montura se comparte (ya soportado por props)
- El `pieceCount` de la montura (ej. 13 para arras) multiplica tanto el peso del metal como el de las piedras

**3. Navegación**
- Agregar ruta `/calculators/piece-weight` en `App.tsx`
- Agregar entrada "Peso de Pieza" en `AppSidebar.tsx` como primer item de la sección Calculadoras (antes de "Peso de Montura")
- Icono: `Layers` o `Package` (ya importados)

### Archivos

| Archivo | Cambio |
|---|---|
| `src/pages/PieceWeightCalculator.tsx` | **Nuevo** — página principal |
| `src/App.tsx` | Agregar ruta |
| `src/components/AppSidebar.tsx` | Agregar entrada al menú |
| `src/components/crm/RingWeightCalculator.tsx` | Posible refactor menor para exponer peso calculado via callback |

### Notas técnicas

- Conversión: 1 quilate = 0.2 gramos, para sumar peso de piedras al peso del metal
- El componente `RingWeightCalculator` ya expone `onUseWeight` — se puede reutilizar o agregar un callback `onWeightChange` que emita el peso en tiempo real
- La tabla de referencia de la calculadora de montura se puede ocultar en el modo embebido para ahorrar espacio
- Se mantienen las calculadoras individuales accesibles por separado para uso independiente

