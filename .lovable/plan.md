

## Calculadora de Peso de Anillos — Integrada en el Sistema

El usuario quiere una calculadora interactiva de peso de anillos de oro. Aunque el prompt dice "HTML puro", lo integraremos como un componente React dentro del sistema existente, manteniendo el estilo monocromático. Será una herramienta auxiliar accesible desde la sección de cotizaciones.

### Archivo a crear

**`src/components/crm/RingWeightCalculator.tsx`** — Componente completo con:

- **Sliders** (componente `Slider` del sistema) para:
  - Talla US (4–13, paso 0.5) con mapa de diámetros interiores
  - Ancho de banda (2–8 mm, paso 1)
  - Grosor de pared (1–3 mm, paso 0.5) con etiquetas descriptivas
- **Toggle de quilataje** (10K / 14K / 18K) usando `ToggleGroup` del sistema, mostrando % oro y densidad
- **Tarjetas de resultado** (3 `Card`s): peso en gramos, gramos de oro puro, volumen en cm³
- **Tabla de referencia dinámica** con tallas enteras (4–13), columnas Talla | ⌀ interior | 10K | 14K | 18K, fila activa resaltada
- **Nota al pie** sobre aproximación ±15-30%
- Toda la lógica de cálculo con la fórmula de cilindro hueco y densidades reales, en JavaScript vanilla dentro del componente

### Archivo a editar

**`src/pages/Projects.tsx`** — Agregar un botón "Calculadora de Peso" que abra la calculadora en un `Dialog`, junto al botón existente de "Nueva Cotización"

### Constantes y fórmulas

```text
Densidades: 10K=11.57, 14K=13.07, 18K=15.58 g/cm³
Volumen = (π/4) × (OD² − ID²) × ancho
OD = ID + 2 × grosor
Peso = (Volumen / 1000) × densidad
Oro puro = peso × % oro
```

Mapa de tallas US → diámetro interior incluido directamente como constante.

