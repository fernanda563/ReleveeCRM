import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { calcularPrecioMaterial } from "@/lib/material-utils";

interface Material {
  id: string;
  nombre: string;
  categoria: string | null;
  unidad_medida: string;
  costo_directo: number;
  tipo_margen: string;
  valor_margen: number;
  redondeo: string;
  redondeo_multiplo: number | null;
  activo: boolean;
  notas: string | null;
}

interface MaterialCardProps {
  material: Material;
  onEdit: (material: Material) => void;
  onDelete: (material: Material) => void;
}

const unidadLabels: Record<string, string> = {
  gramo: "g",
  quilate: "ct",
  pieza: "pza",
  onza: "oz",
  metro: "m",
};

export function MaterialCard({ material, onEdit, onDelete }: MaterialCardProps) {
  const precio = calcularPrecioMaterial(
    material.costo_directo,
    material.tipo_margen,
    material.valor_margen,
    material.redondeo,
    material.redondeo_multiplo ?? 1
  );

  const margenLabel =
    material.tipo_margen === "porcentaje"
      ? `${material.valor_margen}%`
      : `$${material.valor_margen.toLocaleString()}`;

  const unidadLabel = unidadLabels[material.unidad_medida] || material.unidad_medida;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground truncate">{material.nombre}</h3>
              {material.categoria && (
                <Badge variant="secondary" className="text-xs">{material.categoria}</Badge>
              )}
              {!material.activo && (
                <Badge variant="outline" className="text-xs text-muted-foreground">Inactivo</Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Costo directo</p>
                <p className="font-medium">${material.costo_directo.toLocaleString()} / {unidadLabel}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Margen</p>
                <p className="font-medium">{margenLabel} ({material.tipo_margen})</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Redondeo</p>
                <p className="font-medium capitalize">
                  {material.redondeo === "ninguno"
                    ? "Sin redondeo"
                    : `${material.redondeo.replace("_", " ")} (×${material.redondeo_multiplo ?? 1})`}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Precio resultante</p>
                <p className="font-bold text-primary">${precio.toLocaleString()} / {unidadLabel}</p>
              </div>
            </div>

            {material.notas && (
              <p className="text-xs text-muted-foreground line-clamp-2">{material.notas}</p>
            )}
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" onClick={() => onEdit(material)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(material)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
