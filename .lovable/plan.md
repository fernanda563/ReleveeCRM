

## Plan: Nueva sección "Calculadoras" en el menú lateral

### Cambio

**`src/components/AppSidebar.tsx`**:

Agregar una nueva sección después de "Proceso de Producción" en el array `menuSections`:

```ts
{
  label: "Calculadoras",
  items: [
    { title: "Peso de Montura", url: "/calculators/ring-weight", icon: Scale, adminOnly: false },
    { title: "Peso de Diamante", url: "/calculators/diamond-weight", icon: Gem, adminOnly: false },
  ],
},
```

Importar el ícono `Scale` de lucide-react (ya se tiene `Gem`).

**`src/App.tsx`**: Agregar las dos rutas nuevas apuntando a sus páginas.

**`src/pages/RingWeightCalculator.tsx`**: Nueva página que envuelve el componente existente `RingWeightCalculator` en el layout del dashboard.

**`src/pages/DiamondWeightCalculator.tsx`**: Nueva página con una calculadora de peso de diamante (placeholder inicial o fórmula básica basada en dimensiones y forma).

