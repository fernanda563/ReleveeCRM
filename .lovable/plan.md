

## Mostrar una badge por cada especialidad en las tarjetas de diseñadores

### Cambio en `src/pages/Designers.tsx` (línea ~250-252)

Reemplazar la badge única que muestra `designer.especialidad` completo por un `.split(", ")` que genere una badge individual por cada especialidad:

```tsx
// Antes (una sola badge):
{designer.especialidad && (
  <Badge variant="outline">{designer.especialidad}</Badge>
)}

// Después (una badge por especialidad):
{designer.especialidad && designer.especialidad.split(", ").filter(Boolean).map((esp) => (
  <Badge key={esp} variant="outline" className="text-xs">{esp}</Badge>
))}
```

Un solo cambio en un solo archivo.

