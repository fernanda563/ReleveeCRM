import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, DollarSign, Package, TrendingUp, Calendar as CalendarIcon, X } from "lucide-react";
import OrderDialog from "@/components/orders/OrderDialog";
import OrderList from "@/components/orders/OrderList";
import { Badge } from "@/components/ui/badge";
import ClientDialog from "@/components/crm/ClientDialog";
import { OrderPrintDialog } from "@/components/orders/OrderPrintDialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export interface Order {
  id: string;
  custom_id?: string;
  client_id: string;
  tipo_accesorio?: string;
  talla?: number;
  precio_venta: number;
  importe_anticipo: number;
  forma_pago: string;
  estatus_pago: string;
  metal_tipo: string;
  metal_pureza?: string;
  metal_color?: string;
  piedra_tipo: string;
  diamante_color?: string;
  diamante_claridad?: string;
  diamante_corte?: string;
  diamante_quilataje?: number;
  diamante_forma?: string;
  gema_observaciones?: string;
  estatus_piedra: string;
  estatus_montura: string;
  notas?: string;
  comprobantes_pago?: string[];
  imagenes_referencia?: string[];
  fecha_entrega_esperada?: string;
  stl_file_id?: string;
  stl_file?: {
    id: string;
    nombre: string;
    tipo_accesorio: string;
    stl_file_url: string;
  } | null;
  created_at: string;
  clients?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>();
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>();
  const [isDateFromOpen, setIsDateFromOpen] = useState(false);
  const [isDateToOpen, setIsDateToOpen] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingPayment: 0,
    inProduction: 0,
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let filtered = [...orders];

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter((order) => {
        const clientName = `${order.clients?.nombre} ${order.clients?.apellido}`.toLowerCase();
        const orderNum = order.id.slice(0, 8).toLowerCase();
        return (
          clientName.includes(searchTerm.toLowerCase()) ||
          orderNum.includes(searchTerm.toLowerCase())
        );
      });
    }

    // Filtrar por rango de fechas de entrega
    if (fechaDesde || fechaHasta) {
      filtered = filtered.filter((order) => {
        if (!order.fecha_entrega_esperada) return false;
        
        const fechaEntrega = new Date(order.fecha_entrega_esperada);
        
        if (fechaDesde && fechaHasta) {
          return fechaEntrega >= fechaDesde && fechaEntrega <= fechaHasta;
        } else if (fechaDesde) {
          return fechaEntrega >= fechaDesde;
        } else if (fechaHasta) {
          return fechaEntrega <= fechaHasta;
        }
        
        return true;
      });
    }

    setFilteredOrders(filtered);
  }, [searchTerm, orders, fechaDesde, fechaHasta]);

  useEffect(() => {
    calculateStats();
  }, [orders]);

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        clients (
          nombre,
          apellido,
          email
        ),
        stl_file:stl_files!orders_stl_file_id_fkey (
          id,
          nombre,
          tipo_accesorio,
          stl_file_url
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar órdenes");
      console.error(error);
    } else {
      const ordersWithParsedReceipts = (data || []).map(order => ({
        ...order,
        comprobantes_pago: Array.isArray(order.comprobantes_pago) 
          ? order.comprobantes_pago 
          : []
      })) as Order[];
      setOrders(ordersWithParsedReceipts);
      setFilteredOrders(ordersWithParsedReceipts);
    }
    setLoading(false);
  };

  const calculateStats = () => {
    const total = orders.length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.precio_venta), 0);
    const pending = orders.filter((o) => o.estatus_pago === "anticipo_recibido").length;
    const inProd = orders.filter(
      (o) => o.estatus_piedra !== "piedra_montada" || o.estatus_montura !== "entregado_levant"
    ).length;

    setStats({
      totalOrders: total,
      totalRevenue: revenue,
      pendingPayment: pending,
      inProduction: inProd,
    });
  };

  const handleOrderAction = (order?: Order) => {
    setSelectedOrder(order || null);
    setIsOrderDialogOpen(true);
  };

  const handleOpenClientDialog = () => {
    setIsOrderDialogOpen(false);
    setIsClientDialogOpen(true);
  };

  const handleClientSuccess = () => {
    fetchOrders();
    setTimeout(() => {
      setIsOrderDialogOpen(true);
    }, 300);
  };

  const handleOpenPrint = (orderId: string) => {
    setPrintOrderId(orderId);
    setIsPrintDialogOpen(true);
  };

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Órdenes de Compra</h1>
          <p className="text-muted-foreground">
            Gestión completa de pedidos y producción
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Ingresos Totales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                ${stats.totalRevenue.toLocaleString("es-MX")}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Pendientes de Liquidar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.pendingPayment}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                En Producción
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.inProduction}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente o número de orden..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button
                  onClick={() => handleOrderAction()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Orden
                </Button>
              </div>

              {/* Date Range Filter */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Fecha de entrega:
                  </span>
                  
                  {/* Fecha Desde */}
                  <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !fechaDesde && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaDesde ? format(fechaDesde, "PPP", { locale: es }) : "Desde"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaDesde}
                        onSelect={(date) => {
                          setFechaDesde(date);
                          setIsDateFromOpen(false);
                        }}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Fecha Hasta */}
                  <Popover open={isDateToOpen} onOpenChange={setIsDateToOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !fechaHasta && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaHasta ? format(fechaHasta, "PPP", { locale: es }) : "Hasta"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={fechaHasta}
                        onSelect={(date) => {
                          setFechaHasta(date);
                          setIsDateToOpen(false);
                        }}
                        disabled={(date) => fechaDesde ? date < fechaDesde : false}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Botón para limpiar filtros de fecha */}
                  {(fechaDesde || fechaHasta) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFechaDesde(undefined);
                        setFechaHasta(undefined);
                      }}
                      className="h-9 px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Active Filters Badge */}
                {(fechaDesde || fechaHasta) && (
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {filteredOrders.length} {filteredOrders.length === 1 ? 'resultado' : 'resultados'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <OrderList
          orders={filteredOrders}
          loading={loading}
          onEdit={handleOrderAction}
          onRefresh={fetchOrders}
          onOpenPrint={handleOpenPrint}
        />
      </main>

      {/* Order Dialog */}
      <OrderDialog
        open={isOrderDialogOpen}
        onOpenChange={setIsOrderDialogOpen}
        order={selectedOrder}
        onSuccess={fetchOrders}
        onOpenClientDialog={handleOpenClientDialog}
      />

      {/* Client Dialog */}
      <ClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        onSuccess={handleClientSuccess}
      />

      {/* Order Print Dialog */}
      <OrderPrintDialog
        orderId={printOrderId}
        open={isPrintDialogOpen}
        onOpenChange={setIsPrintDialogOpen}
      />
    </div>
  );
};

export default Orders;
