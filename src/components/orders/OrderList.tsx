import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, Eye, ChevronDown, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const handleGeneratePDF = (order: Order) => {
    window.open(`/order-print/${order.id}`, '_blank', 'width=850,height=1100');
  };

  const getPaymentStatusBadge = (status: string) => {
    if (status === "liquidado") {
      return <Badge className="bg-foreground text-background">Liquidado</Badge>;
    }
    return <Badge variant="secondary">Anticipo Recibido</Badge>;
  };

  const getProductionStatus = (order: Order) => {
    if (order.estatus_piedra === "piedra_montada" && order.estatus_montura === "entregado_levant") {
      return <Badge className="bg-foreground text-background">Completada</Badge>;
    }
    return <Badge className="bg-foreground/10 text-foreground border border-foreground">En Producción</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
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
            <div className="space-y-3">
              {/* Header with badges and actions dropdown */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">
                      {order.clients?.nombre} {order.clients?.apellido}
                    </h3>
                    {getPaymentStatusBadge(order.estatus_pago)}
                    {getProductionStatus(order)}
                  </div>
                  {order.custom_id && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-muted-foreground">
                        {order.custom_id}
                      </span>
                      {order.stl_file && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <a
                            href={`/stl-viewer-fullscreen?url=${encodeURIComponent(order.stl_file.stl_file_url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <Badge 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                              <span className="mr-1">📐</span>
                              Ver STL
                            </Badge>
                          </a>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Acciones
                        <ChevronDown className="h-4 w-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => onEdit(order)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleGeneratePDF(order)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Generar PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const detailUrl = `/crm/${order.client_id}`;
                        window.open(detailUrl, '_blank');
                      }}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default OrderList;
