

## Agregar dropdown de estados de México al campo "Estado" en formularios

### Archivos afectados
- **Nuevo**: `src/lib/mexican-states.ts` — Array con los 32 estados de México
- **Editar**: `src/components/designers/DesignerDialog.tsx` — Reemplazar `Input` por `Select` condicional
- **Editar**: `src/components/workshops/WorkshopDialog.tsx` — Reemplazar `Input` por `Select` condicional

### Cambios

**1. Crear `src/lib/mexican-states.ts`**
Array exportado con los 32 estados: Aguascalientes, Baja California, Baja California Sur, Campeche, Chiapas, Chihuahua, Ciudad de México, Coahuila, Colima, Durango, Estado de México, Guanajuato, Guerrero, Hidalgo, Jalisco, Michoacán, Morelos, Nayarit, Nuevo León, Oaxaca, Puebla, Querétaro, Quintana Roo, San Luis Potosí, Sinaloa, Sonora, Tabasco, Tamaulipas, Tlaxcala, Veracruz, Yucatán, Zacatecas.

**2. En DesignerDialog.tsx y WorkshopDialog.tsx**
- Importar `MEXICAN_STATES` y el componente `Select`
- Cuando `ubicacion_pais === "México"`: mostrar un `Select` con los 32 estados como opciones
- Cuando el país sea otro: mantener el `Input` de texto libre
- Al cambiar de país, limpiar el valor de `ubicacion_estado` si ya no aplica

