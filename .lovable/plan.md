

## Plan: Reescribir la Calculadora de Peso de Diamante

Reemplazar completamente `src/pages/DiamondWeightCalculator.tsx` con una implementación profesional según las especificaciones detalladas.

### Estructura del archivo

Un solo archivo `src/pages/DiamondWeightCalculator.tsx` que contiene:

1. **Datos de configuración**: Array de 10 cortes (Round, Princess, Oval, Marquise, Pear, Heart, Cushion, Emerald, Radiant, Asscher) cada uno con:
   - Factor de fórmula específico
   - Dimensiones con rangos min/max, defaults y hint text
   - Función SVG para el ícono pequeño del selector y el diagrama de medición

2. **Selector de cortes**: Grid de 5×2 botones con ícono SVG pequeño + nombre. El corte activo se resalta con borde azul (#378ADD).

3. **Área principal en dos columnas**:
   - **Izquierda**: Diagrama SVG del corte seleccionado con:
     - Silueta del corte
     - Polígono interior (table facet)
     - Flecha azul (#378ADD) para largo/diámetro
     - Flecha verde (#1D9E75) para ancho
     - Línea roja punteada (#E24B4A) para profundidad
     - Nota descriptiva debajo
   - **Derecha**: Sliders (usando componente `Slider` existente) para cada dimensión, mostrando label, valor actual, hint text y rango

4. **Panel de resultados** (ancho completo, debajo):
   - Quilates estimados (3 decimales, número grande)
   - Miligramos (quilates × 200, entero)
   - Rango ±10% ("X.XX – X.XX ct")
   - Depth % (depth ÷ length × 100, 1 decimal)
   - Fórmula con valores sustituidos

### Fórmulas exactas

| Corte | Fórmula |
|---|---|
| Round | diameter² × depth × 0.0061 |
| Princess | L × W × D × 0.0083 |
| Oval | L × W × D × 0.0062 |
| Marquise | L × W × D × 0.00565 |
| Pear | L × W × D × 0.0059 |
| Heart | L × W × D × 0.0059 |
| Cushion | L × W × D × 0.0082 |
| Emerald | L × W × D × 0.0092 |
| Radiant | L × W × D × 0.0083 |
| Asscher | L × W × D × 0.0080 |

### Diagramas SVG

Se crearán 10 funciones SVG inline, una por corte. Cada una dibuja:
- Silueta exterior (stroke gris)
- Table facet interior (fill semitransparente)
- Flechas de medición con colores codificados
- Labels de dimensiones

Formas: círculo (Round), cuadrado (Princess), elipse (Oval), ojo/lente (Marquise), gota (Pear), corazón (Heart), rectángulo redondeado (Cushion), rectángulo con esquinas cortadas (Emerald/Radiant/Asscher con variaciones en el tamaño del corte).

### Diseño responsive

- Desktop: dos columnas (diagrama + sliders)
- Mobile: stack vertical (diagrama arriba, sliders abajo)
- Fondo blanco, superficies secundarias en gris sutil
- Colores específicos solo para las flechas de medición: azul, verde, rojo

### Archivo modificado

- `src/pages/DiamondWeightCalculator.tsx` — reescritura completa

No se necesitan cambios en rutas ni navegación (ya están configurados).

