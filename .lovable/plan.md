

## Plan: Adaptar Calculadora de Diamante al estilo del sistema

### Cambios en `src/pages/DiamondWeightCalculator.tsx`

**1. Estructura de página estándar**
- Envolver todo en `<div className="min-h-full bg-background"><main className="container mx-auto px-6 py-8">` como WorkConcepts
- Header con `text-3xl font-bold` y subtítulo en `text-muted-foreground`

**2. Eliminar colores semánticos (sistema monocromático estricto)**
- Eliminar constantes `BLUE`, `GREEN`, `RED` — reemplazar con `foreground`, `muted-foreground` y estilos monocromáticos
- Flechas SVG: usar tonos de gris diferenciados + estilos de línea (sólida, punteada, discontinua) para diferenciar largo/ancho/profundidad en lugar de colores
- Botones del selector de corte: usar `bg-primary text-primary-foreground` (negro/blanco) para activo, en vez de azul
- Indicadores de color en sliders: usar `foreground`/`muted-foreground` en vez de colores RGB
- `ResultBox`: usar `border-border` sin colores

**3. Traducir todo el texto a español**
- Labels de dimensiones: "Diameter" → "Diámetro", "Length" → "Largo", "Width" → "Ancho", "Depth" → "Profundidad"
- Hints: traducir todos al español (ej. "Measure across the girdle at the widest point" → "Medir a lo ancho del filetín en el punto más amplio")
- Leyenda del diagrama: "Diameter/Length/Width/Depth" → "Diámetro/Largo/Ancho/Profundidad"
- Notas SVG: "Measure straight sides, not cut corners" → "Medir lados rectos, no esquinas cortadas"
- "Depth %" → "Profundidad %"
- Nombres de cortes se mantienen en inglés (son términos técnicos universales)

**4. Cards de resultados**
- Seguir el patrón de stats cards de WorkConcepts: `CardHeader` con icono + título, `CardContent` con valor `text-3xl font-bold`

### Archivo modificado
- `src/pages/DiamondWeightCalculator.tsx` — reescritura del layout y textos

