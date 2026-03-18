import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, DollarSign, Percent, RotateCw } from "lucide-react";
import { calcularPrecioMaterial } from "@/lib/material-utils";

export interface Material {
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
  created_at: string;
  updated_at: string;
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
    <Card className={`${!material.activo ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {material.nombre}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(material)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(material)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex flex-wrap gap-2">
          {material.categoria && (
            <Badge variant="secondary" className="text-xs">{material.categoria}</Badge>
          )}
          {(material as any).tipo_material && (
            <Badge variant="default" className="text-xs capitalize">{(material as any).tipo_material}</Badge>
          )}
          {(material as any).kilataje && (
            <Badge variant="outline" className="text-xs">{(material as any).kilataje}</Badge>
          )}
          {(material as any).color && (
            <Badge variant="outline" className="text-xs capitalize">{(material as any).color}</Badge>
          )}
          {!material.activo && (
            <Badge variant="outline" className="text-muted-foreground text-xs">Inactivo</Badge>
          )}
          <Badge variant="outline" className="text-xs">{unidadLabel}</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Costo directo</p>
            <p className="text-sm font-medium">
              ${material.costo_directo.toLocaleString("es-MX", { minimumFractionDigits: 2 })} / {unidadLabel}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Margen</p>
            <p className="text-sm font-medium">
              {margenLabel} ({material.tipo_margen})
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Redondeo</p>
            <p className="text-sm font-medium capitalize">
              {material.redondeo === "ninguno"
                ? "Sin redondeo"
                : `${material.redondeo.replace("_", " ")} (×${material.redondeo_multiplo ?? 1})`}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Precio resultante</p>
            <p className="text-sm font-bold text-primary">
              ${precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })} / {unidadLabel}
            </p>
          </div>
        </div>

        {material.notas && (
          <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t">{material.notas}</p>
        )}
      </CardContent>
    </Card>
  );
}
