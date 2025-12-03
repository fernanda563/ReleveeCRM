import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  User,
  Building2,
  Calendar,
  DollarSign,
  Link2,
} from "lucide-react";
import { WorkOrder, WORK_ORDER_STATUS_LABELS, WorkOrderStatus } from "@/types/work-concepts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useUserRole } from "@/hooks/useUserRole";

interface WorkOrderCardProps {
  workOrder: WorkOrder;
  onEdit: (order: WorkOrder) => void;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<WorkOrderStatus, string> = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  en_proceso: "bg-blue-100 text-blue-800 border-blue-200",
  completado: "bg-green-100 text-green-800 border-green-200",
  cancelado: "bg-red-100 text-red-800 border-red-200",
};

export const WorkOrderCard = ({
  workOrder,
  onEdit,
  onRefresh,
}: WorkOrderCardProps) => {
  const { isAdmin } = useUserRole();
  const clientName = workOrder.client
    ? `${workOrder.client.nombre} ${workOrder.client.apellido}`
    : "Cliente desconocido";

  const handleDelete = async () => {
    if (!confirm("¿Estás seguro de eliminar esta orden de trabajo?")) return;

    try {
      const { error } = await supabase
        .from("work_orders")
        .delete()
        .eq("id", workOrder.id);

      if (error) throw error;

      toast.success("Orden de trabajo eliminada");
      onRefresh();
    } catch (error) {
      console.error("Error deleting work order:", error);
      toast.error("Error al eliminar la orden de trabajo");
    }
  };

  const margin = workOrder.total_precio - workOrder.total_costo;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-semibold truncate">{clientName}</span>
            </div>
            {workOrder.descripcion && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {workOrder.descripcion}
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
              <DropdownMenuItem onClick={() => onEdit(workOrder)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              {isAdmin() && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Status and linked order badges */}
        <div className="flex flex-wrap gap-2">
          <Badge className={STATUS_COLORS[workOrder.estado]}>
            {WORK_ORDER_STATUS_LABELS[workOrder.estado]}
          </Badge>
          {workOrder.order && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              {workOrder.order.custom_id || "Orden vinculada"}
            </Badge>
          )}
        </div>

        {/* Workshop info */}
        {workOrder.taller && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>{workOrder.taller.nombre_empresa}</span>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>
              Solicitud: {format(new Date(workOrder.fecha_solicitud), "dd MMM yyyy", { locale: es })}
            </span>
          </div>
          {workOrder.fecha_entrega_esperada && (
            <div className="flex items-center gap-1">
              <span>
                Entrega: {format(new Date(workOrder.fecha_entrega_esperada), "dd MMM yyyy", { locale: es })}
              </span>
            </div>
          )}
        </div>

        {/* Financials */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Costo</p>
            <p className="text-sm font-medium">
              ${workOrder.total_costo.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Precio</p>
            <p className="text-sm font-medium">
              ${workOrder.total_precio.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Margen</p>
            <p className={`text-sm font-medium ${margin >= 0 ? "text-green-600" : "text-red-600"}`}>
              ${margin.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
