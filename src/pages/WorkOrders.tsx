import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Clock,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkOrder, WORK_ORDER_STATUS_LABELS } from "@/types/work-concepts";
import { WorkOrderCard } from "@/components/work-orders/WorkOrderCard";
import { WorkOrderDialog } from "@/components/work-orders/WorkOrderDialog";

const WorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("work_orders")
        .select(`
          *,
          client:clients(id, nombre, apellido),
          workshop:workshops(id, nombre),
          designer:designers(id, nombre),
          order:orders(id, custom_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorkOrders((data as WorkOrder[]) || []);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      toast.error("Error al cargar las órdenes de trabajo");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (order: WorkOrder) => {
    setEditingOrder(order);
    setDialogOpen(true);
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingOrder(null);
  };

  const handleSaved = () => {
    fetchWorkOrders();
    handleDialogClose();
  };

  const filteredOrders = workOrders.filter((order) => {
    const clientName = order.client
      ? `${order.client.nombre} ${order.client.apellido}`.toLowerCase()
      : "";
    const matchesSearch =
      clientName.includes(searchTerm.toLowerCase()) ||
      (order.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === "all" || order.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = workOrders.filter((o) => o.estado === "pendiente").length;
  const inProgressCount = workOrders.filter((o) => o.estado === "en_proceso").length;
  const completedCount = workOrders.filter((o) => o.estado === "completado").length;

  const stats = [
    { title: "Pendientes", value: pendingCount, icon: Clock },
    { title: "En proceso", value: inProgressCount, icon: AlertCircle },
    { title: "Completadas", value: completedCount, icon: CheckCircle },
  ];

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Órdenes de Trabajo
            </h1>
            <Button onClick={handleNewOrder}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Orden de Trabajo
            </Button>
          </div>
          <p className="text-muted-foreground">
            Gestión de órdenes de trabajo para diseño y taller
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <stat.icon className="h-4 w-4" />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros avanzados</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(WORK_ORDER_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredOrders.length} orden(es) de trabajo encontrada(s)
        </p>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No se encontraron órdenes de trabajo.
                <br />
                {workOrders.length === 0 && "Comienza creando tu primera orden de trabajo."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <WorkOrderCard
                key={order.id}
                workOrder={order}
                onEdit={handleEdit}
                onRefresh={fetchWorkOrders}
              />
            ))}
          </div>
        )}

        {/* Dialog */}
        <WorkOrderDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          workOrder={editingOrder}
          onSaved={handleSaved}
        />
      </main>
    </div>
  );
};

export default WorkOrders;
