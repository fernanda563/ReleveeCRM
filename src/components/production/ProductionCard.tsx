import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, ChevronDown, ChevronUp } from "lucide-react";
import { StoneTimeline } from "./StoneTimeline";
import { MountingTimeline } from "./MountingTimeline";
import { AssignmentDialog } from "./AssignmentDialog";

interface Order {
  id: string;
  client_id: string;
  precio_venta: number;
  metal_tipo: string;
  metal_pureza: string | null;
  piedra_tipo: string;
  estatus_piedra: string | null;
  estatus_montura: string | null;
  disenador_id: string | null;
  joyero_id: string | null;
  created_at: string;
  clients: {
    nombre: string;
    apellido: string;
    telefono_principal: string;
  };
}

interface ProductionCardProps {
  order: Order;
  onUpdate: () => void;
}

export const ProductionCard = ({ order, onUpdate }: ProductionCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">
                {order.clients.nombre} {order.clients.apellido}
              </CardTitle>
              <div className="flex gap-2 mt-2 flex-wrap">
                <Badge variant="outline">
                  {order.metal_tipo.charAt(0).toUpperCase() + order.metal_tipo.slice(1)}
                  {order.metal_pureza && ` ${order.metal_pureza}`}
                </Badge>
                <Badge variant="outline">
                  {order.piedra_tipo === "diamante" ? "Diamante" : "Gema"}
                </Badge>
                <Badge variant="secondary">{formatCurrency(order.precio_venta)}</Badge>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignmentDialogOpen(true)}
                className="flex-1 sm:flex-initial"
              >
                <User className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Asignar</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        {expanded && (
          <CardContent className="space-y-6">
            {/* Info General */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Fecha de Orden:</span>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Teléfono:</span>
                <p className="font-medium">{order.clients.telefono_principal}</p>
              </div>
            </div>

            {/* Stone Timeline */}
            <div>
              <h4 className="font-semibold mb-3">Seguimiento de Piedra</h4>
              <StoneTimeline
                orderId={order.id}
                currentStatus={order.estatus_piedra || "en_busqueda"}
                onUpdate={onUpdate}
              />
            </div>

            {/* Mounting Timeline */}
            <div>
              <h4 className="font-semibold mb-3">Seguimiento de Montura</h4>
              <MountingTimeline
                orderId={order.id}
                currentStatus={order.estatus_montura || "en_espera"}
                onUpdate={onUpdate}
              />
            </div>

            {/* Assignments */}
            {(order.disenador_id || order.joyero_id) && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-2">Asignaciones</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {order.disenador_id && (
                    <div>
                      <span className="text-muted-foreground">Diseñador:</span>
                      <p className="font-medium break-words">{order.disenador_id}</p>
                    </div>
                  )}
                  {order.joyero_id && (
                    <div>
                      <span className="text-muted-foreground">Joyero:</span>
                      <p className="font-medium break-words">{order.joyero_id}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        orderId={order.id}
        currentDisenadorId={order.disenador_id}
        currentJoyeroId={order.joyero_id}
        onSuccess={onUpdate}
      />
    </>
  );
};
