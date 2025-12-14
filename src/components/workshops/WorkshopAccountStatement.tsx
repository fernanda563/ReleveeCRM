import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, DollarSign, ClipboardList, Clock, CheckCircle } from "lucide-react";
import { Workshop } from "@/types/workshops";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface WorkOrder {
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

interface WorkshopAccountStatementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshop: Workshop | null;
}

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

export const WorkshopAccountStatement = ({
  open,
  onOpenChange,
  workshop,
}: WorkshopAccountStatementProps) => {
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (open && workshop) {
      fetchWorkOrders();
    }
  }, [open, workshop]);

  const fetchWorkOrders = async () => {
    if (!workshop) return;
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
        .eq("workshop_id", workshop.id)
        .order("fecha_solicitud", { ascending: false });

      if (error) throw error;
      setWorkOrders(data || []);
    } catch (error: any) {
      console.error("Error fetching work orders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!workshop) return null;

  const filteredOrders = statusFilter === "all"
    ? workOrders
    : workOrders.filter((o) => o.estado === statusFilter);

  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter((o) => o.estado === "completada").length;
  const pendingOrders = filteredOrders.filter((o) => o.estado === "pendiente" || o.estado === "en_progreso").length;
  const totalAmount = filteredOrders.reduce((sum, o) => sum + Number(o.total_costo), 0);
  const completedAmount = filteredOrders
    .filter((o) => o.estado === "completada")
    .reduce((sum, o) => sum + Number(o.total_costo), 0);
  const pendingAmount = totalAmount - completedAmount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estado de Cuenta - {workshop.nombre}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completadas</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completedOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingOrders}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalAmount.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Pagado: ${completedAmount.toLocaleString()} | Pendiente: ${pendingAmount.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Filtrar por estado:</span>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En progreso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No hay órdenes de trabajo para este taller.
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-sm">
                          {format(new Date(order.fecha_solicitud), "dd MMM yyyy", { locale: es })}
                        </TableCell>
                        <TableCell>
                          {order.client
                            ? `${order.client.nombre} ${order.client.apellido}`
                            : "Sin cliente"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {order.descripcion || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.estado === "completada"
                                ? "default"
                                : order.estado === "cancelada"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {STATUS_LABELS[order.estado] || order.estado}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${Number(order.total_costo).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
