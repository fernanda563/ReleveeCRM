import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Designer } from "@/types/designers";
import { DollarSign, FileText, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface DesignerAccountStatementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designer: Designer;
}

interface WorkOrderWithDetails {
  id: string;
  descripcion: string | null;
  estado: string;
  fecha_solicitud: string;
  total_costo: number;
  total_precio: number;
  client?: {
    nombre: string;
    apellido: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Completado",
  cancelado: "Cancelado"
};

export function DesignerAccountStatement({ open, onOpenChange, designer }: DesignerAccountStatementProps) {
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrderWithDetails[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  useEffect(() => {
    if (open && designer) {
      fetchWorkOrders();
    }
  }, [open, designer]);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          id,
          descripcion,
          estado,
          fecha_solicitud,
          total_costo,
          total_precio,
          client:clients(nombre, apellido)
        `)
        .eq("designer_id", designer.id)
        .order("fecha_solicitud", { ascending: false });

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = workOrders.filter(order => 
    statusFilter === "todos" || order.estado === statusFilter
  );

  const totalOrders = filteredOrders.length;
  const totalAmount = filteredOrders.reduce((sum, o) => sum + (o.total_costo || 0), 0);
  const completedAmount = filteredOrders
    .filter(o => o.estado === "completado")
    .reduce((sum, o) => sum + (o.total_costo || 0), 0);
  const pendingAmount = totalAmount - completedAmount;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pendiente: "secondary",
      en_progreso: "default",
      completado: "outline",
      cancelado: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{STATUS_LABELS[status] || status}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Estado de Cuenta - {designer.nombre}
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalOrders}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Monto Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">${totalAmount.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">${completedAmount.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pendiente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">${pendingAmount.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Estado:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="en_progreso">En progreso</SelectItem>
                <SelectItem value="completado">Completado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando órdenes...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay órdenes de trabajo para este diseñador
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Cliente</th>
                  <th className="text-left p-3 text-sm font-medium">Descripción</th>
                  <th className="text-left p-3 text-sm font-medium">Fecha</th>
                  <th className="text-right p-3 text-sm font-medium">Costo</th>
                  <th className="text-center p-3 text-sm font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      {order.client ? `${order.client.nombre} ${order.client.apellido}` : "—"}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {order.descripcion || "Sin descripción"}
                    </td>
                    <td className="p-3 text-sm">
                      {format(new Date(order.fecha_solicitud), "d MMM yyyy", { locale: es })}
                    </td>
                    <td className="p-3 text-right font-medium">
                      ${(order.total_costo || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      {getStatusBadge(order.estado)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
