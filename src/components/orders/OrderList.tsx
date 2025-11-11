import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, Eye } from "lucide-react";
import type { Order } from "@/pages/Orders";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface OrderListProps {
  orders: Order[];
  loading: boolean;
  onEdit: (order: Order) => void;
  onRefresh: () => void;
}

const OrderList = ({ orders, loading, onEdit }: OrderListProps) => {
  const getPaymentStatusBadge = (status: string) => {
    if (status === "liquidado") {
      return <Badge className="bg-success text-success-foreground">Liquidado</Badge>;
    }
    return <Badge variant="secondary">Anticipo Recibido</Badge>;
  };

  const getProductionStatus = (order: Order) => {
    if (order.estatus_piedra === "piedra_montada" && order.estatus_montura === "entregado_levant") {
      return <Badge className="bg-success text-success-foreground">Completada</Badge>;
    }
    return <Badge className="bg-accent text-accent-foreground">En Producción</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No se encontraron órdenes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id} className="border-border hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold text-foreground">
                    {order.clients?.nombre} {order.clients?.apellido}
                  </h3>
                  {order.custom_id && (
                    <span className="text-sm font-medium text-muted-foreground">
                      {order.custom_id}
                    </span>
                  )}
                  {getPaymentStatusBadge(order.estatus_pago)}
                  {getProductionStatus(order)}
                </div>

                {/* Product Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Metal:</span>
                    <span className="text-muted-foreground ml-2">
                      {order.metal_tipo === "oro" && `Oro ${order.metal_pureza} ${order.metal_color}`}
                      {order.metal_tipo === "plata" && "Plata"}
                      {order.metal_tipo === "platino" && "Platino"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Piedra:</span>
                    <span className="text-muted-foreground ml-2">
                      {order.piedra_tipo === "diamante" &&
                        `Diamante ${order.diamante_quilataje}ct ${order.diamante_forma}`}
                      {order.piedra_tipo === "gema" && "Gema"}
                    </span>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground">Precio Total</p>
                    <p className="text-lg font-semibold text-foreground">
                      ${Number(order.precio_venta).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Anticipo</p>
                    <p className="text-lg font-semibold text-accent">
                      ${Number(order.importe_anticipo).toLocaleString("es-MX")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Saldo Pendiente</p>
                    <p className="text-lg font-semibold text-warning">
                      $
                      {(Number(order.precio_venta) - Number(order.importe_anticipo)).toLocaleString(
                        "es-MX"
                      )}
                    </p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Creada el {format(new Date(order.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                  </span>
                  {order.fecha_entrega_esperada && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-accent">
                        Entrega: {format(new Date(order.fecha_entrega_esperada), "dd 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 ml-4">
                <Button variant="outline" size="sm" onClick={() => onEdit(order)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalles
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderList;
