

## Plan: Selector de tipo de pieza y número de piedras en la calculadora de diamantes

### Resumen

Agregar una sección antes del selector de corte donde el usuario seleccione el tipo de joya y la cantidad de piedras. Los resultados se multiplicarán automáticamente para mostrar el peso total estimado de todas las piedras.

### Tipos de pieza (con piedras sugeridas por defecto)

| Tipo de pieza | Piedras default | Descripción |
|---|---|---|
| Piedra suelta | 1 | Sin montar |
| Anillo de compromiso | 1 | Piedra central |
| Churumbela | 13 | Band con múltiples piedras |
| Anillo de eternidad | 20 | Piedras alrededor completo |
| Media churumbela | 7 | Medio anillo con piedras |
| Anillo cóctel | 1 | Piedra central grande |
| Aretes (par) | 2 | Una piedra por arete |
| Collar / Gargantilla | 1 | Piedra central o pendiente |
| Pulsera tennis | 30 | Múltiples piedras en línea |
| Dije / Pendiente | 1 | Piedra central |
| Argollas de matrimonio | 0 | Generalmente sin piedra |
| Otro | 1 | Personalizable |

### Comportamiento

1. Al seleccionar un tipo de pieza, el campo "Número de piedras" se pre-llena con el valor sugerido pero es **siempre editable**
2. Si el número de piedras es 0, se muestra un aviso de que esta pieza normalmente no lleva diamantes
3. Las tarjetas de resultado muestran:
   - **Peso por piedra**: el cálculo actual (quilates, mg, rango)
   - **Peso total**: peso por piedra × número de piedras (nueva fila o tarjeta adicional)
4. La fórmula al final incluye `× N piedras = X.XXX ct total`

### Cambios en `src/pages/DiamondWeightCalculator.tsx`

**1. Nueva constante `PIECE_TYPES`** al inicio del archivo con la tabla anterior

**2. Nuevos estados**:
```ts
const [pieceType, setPieceType] = useState("piedra_suelta");
const [stoneCount, setStoneCount] = useState(1);
```

**3. Nueva sección UI** entre el header y el selector de corte:
- Card con título "Tipo de pieza"
- Grid de botones (similar al selector de corte) con los tipos de pieza
- Input numérico para "Número de piedras" con valor pre-llenado según la pieza seleccionada
- `useEffect` que actualiza `stoneCount` al cambiar `pieceType`

**4. Tarjetas de resultado** actualizadas:
- Agregar una quinta tarjeta "Total (N piedras)" que muestre `carats × stoneCount`
- Las 4 tarjetas existentes se mantienen como "por piedra"

**5. Fórmula** actualizada para incluir el multiplicador

### Archivo modificado
- `src/pages/DiamondWeightCalculator.tsx` — selector de pieza, conteo de piedras, multiplicador en resultados

