import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Palette,
  Wrench,
  DollarSign,
  Ruler,
} from "lucide-react";
import { WorkConcept, WORK_AREA_LABELS, UNIT_MEASURES } from "@/types/work-concepts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WorkConceptCardProps {
  concept: WorkConcept;
  onEdit: (concept: WorkConcept) => void;
  onRefresh: () => void;
}

export const WorkConceptCard = ({
  concept,
  onEdit,
  onRefresh,
}: WorkConceptCardProps) => {
  const handleToggleActive = async () => {
    try {
      const { error } = await supabase
        .from("work_concepts")
        .update({ activo: !concept.activo })
        .eq("id", concept.id);

      if (error) throw error;

      toast.success(
        concept.activo ? "Concepto desactivado" : "Concepto activado"
      );
      onRefresh();
    } catch (error) {
      console.error("Error toggling concept:", error);
      toast.error("Error al cambiar el estado del concepto");
    }
  };

  const unitLabel =
    UNIT_MEASURES.find((u) => u.value === concept.unidad_medida)?.label ||
    concept.unidad_medida;

  const margin = concept.precio_venta_base - concept.costo_base;
  const marginPercentage =
    concept.costo_base > 0
      ? ((margin / concept.costo_base) * 100).toFixed(0)
      : 0;

  return (
    <Card className={`${!concept.activo ? "opacity-60" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {concept.nombre}
            </CardTitle>
            {concept.descripcion && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {concept.descripcion}
              </p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(concept)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleActive}>
                {concept.activo ? (
                  <>
                    <ToggleLeft className="h-4 w-4 mr-2" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <ToggleRight className="h-4 w-4 mr-2" />
                    Activar
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={concept.area === "diseño" ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {concept.area === "diseño" ? (
              <Palette className="h-3 w-3" />
            ) : (
              <Wrench className="h-3 w-3" />
            )}
            {WORK_AREA_LABELS[concept.area]}
          </Badge>
          {!concept.activo && (
            <Badge variant="outline" className="text-muted-foreground">
              Inactivo
            </Badge>
          )}
          {concept.es_precio_variable && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Precio variable
            </Badge>
          )}
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Costo</p>
            <p className="text-sm font-medium">
              ${concept.costo_base.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Precio venta</p>
            <p className="text-sm font-medium">
              ${concept.precio_venta_base.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Ruler className="h-3 w-3" />
            {unitLabel}
          </div>
          <div className={`font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
            Margen: {marginPercentage}%
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
