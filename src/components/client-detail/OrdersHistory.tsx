import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, DollarSign, Package, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  precio_venta: number;
  importe_anticipo: number;
  estatus_pago: string;
  metal_tipo: string;
  metal_pureza: string | null;
  metal_color: string | null;
  piedra_tipo: string;
  estatus_piedra: string | null;
  estatus_montura: string | null;
  created_at: string;
}

interface OrdersHistoryProps {
  clientId: string;
}

export const OrdersHistory = ({ clientId }: OrdersHistoryProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [clientId]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "liquidado":
        return "bg-success/10 text-success";
      case "anticipo_recibido":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay órdenes registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">
                {order.metal_tipo.charAt(0).toUpperCase() + order.metal_tipo.slice(1)}
                {order.metal_pureza && ` ${order.metal_pureza}`}
              </CardTitle>
              <Badge className={getPaymentStatusColor(order.estatus_pago)}>
                {order.estatus_pago === "liquidado" ? "Pagado" : "Anticipo"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Piedra:</p>
                <p className="font-medium capitalize">{order.piedra_tipo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Color:</p>
                <p className="font-medium capitalize">
                  {order.metal_color || "N/A"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Precio Total:</span>
                <span className="font-semibold">
                  {formatCurrency(order.precio_venta)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Anticipo:</span>
                <span>{formatCurrency(order.importe_anticipo)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Saldo:</span>
                <span className="font-medium text-warning">
                  {formatCurrency(order.precio_venta - order.importe_anticipo)}
                </span>
              </div>
            </div>

            {(order.estatus_piedra || order.estatus_montura) && (
              <div className="pt-3 border-t space-y-2 text-sm">
                {order.estatus_piedra && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Piedra: {order.estatus_piedra.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
                {order.estatus_montura && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Montura: {order.estatus_montura.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-muted-foreground pt-2">
              Creada el {formatDate(order.created_at)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
