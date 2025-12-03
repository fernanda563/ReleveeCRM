import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Plus, DollarSign, Package, TrendingUp, Calendar as CalendarIcon, X, ShoppingBag, LayoutGrid, Table2, Printer } from "lucide-react";
import OrderDialog from "@/components/orders/OrderDialog";
import OrderList from "@/components/orders/OrderList";
import { Badge } from "@/components/ui/badge";
import ClientDialog from "@/components/crm/ClientDialog";
import { OrderPrintDialog } from "@/components/orders/OrderPrintDialog";
import { generateOrderLabelsPDF } from "@/components/orders/OrderLabelsGenerator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InternalOrderDialog } from "@/components/orders/InternalOrderDialog";
import { InternalOrderList } from "@/components/orders/InternalOrderList";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from "@/components/ui/separator";
import { OrderTableView } from "@/components/orders/OrderTableView";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface Order {
  id: string;
  custom_id?: string;
  client_id: string;
  tipo_accesorio?: string;
  talla?: number;
  precio_venta: number;
  importe_anticipo: number;
  forma_pago: string;
  referencia_pago?: string | null;
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
  signature_status?: string | null;
  signature_request_id?: string | null;
  signed_document_url?: string | null;
  signature_sent_at?: string | null;
  signature_completed_at?: string | null;
  embedded_sign_url?: string | null;
  embedded_sign_url_expires_at?: string | null;
  internal_order_id?: string | null;
  internal_order?: {
    numero_reporte: string | null;
  } | null;
  created_at: string;
  clients?: {
    nombre: string;
    apellido: string;
    email: string;
  };
}

const STONE_STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "en_busqueda", label: "En proceso de búsqueda" },
  { value: "piedra_comprada", label: "Piedra comprada" },
  { value: "en_transito_po_box", label: "Piedra en tránsito a PO Box" },
  { value: "en_po_box", label: "Piedra en PO Box" },
  { value: "en_levant", label: "Piedra en Levant" },
  { value: "con_disenador", label: "Piedra con diseñador" },
  { value: "en_taller", label: "Piedra en taller" },
  { value: "montada", label: "Piedra montada" },
];

const MOUNTING_STATUS_OPTIONS = [
  { value: "todos", label: "Todos" },
  { value: "en_espera", label: "En espera de iniciar" },
  { value: "en_diseno", label: "En proceso de diseño" },
  { value: "impresion_modelo", label: "Impresión de modelo" },
  { value: "reimpresion_modelo", label: "Reimpresión de modelo" },
  { value: "traslado_modelo", label: "Traslado de modelo" },
  { value: "espera_taller", label: "En espera en taller" },
  { value: "en_vaciado", label: "En proceso de vaciado" },
  { value: "pieza_terminada", label: "Pieza terminada en taller" },
  { value: "en_recoleccion", label: "En proceso de recolección" },
  { value: "recolectado", label: "Recolectado" },
  { value: "entregado_oyamel", label: "Entregado en Oyamel" },
  { value: "entregado_levant", label: "Entregado en Levant" },
  { value: "no_aplica", label: "No aplica" },
];

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
  const [autoSendToSign, setAutoSendToSign] = useState(false);
  const [isInternalOrderDialogOpen, setIsInternalOrderDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("external");
  const [internalOrders, setInternalOrders] = useState<any[]>([]);
  const [filteredInternalOrders, setFilteredInternalOrders] = useState<any[]>([]);
  const [loadingInternal, setLoadingInternal] = useState(true);
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [internalFilterTipo, setInternalFilterTipo] = useState("todos");
  const [internalFilterEstatus, setInternalFilterEstatus] = useState("todos");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [filterEstatusPiedra, setFilterEstatusPiedra] = useState<string>("todos");
  const [filterEstatusMontura, setFilterEstatusMontura] = useState<string>("todos");

  // Stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingPayment: 0,
    inProduction: 0,
  });

  const [internalStats, setInternalStats] = useState({
    totalCompras: 0,
    gastoTotal: 0,
    enTransito: 0,
    recibidas: 0,
  });

  useEffect(() => {
    fetchOrders();
    fetchInternalOrders();
  }, []);
  
  useEffect(() => {
    applyInternalFilters();
  }, [internalOrders, internalSearchTerm, internalFilterTipo, internalFilterEstatus]);

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

    // Filtrar por estatus de piedra
    if (filterEstatusPiedra !== "todos") {
      filtered = filtered.filter((order) => order.estatus_piedra === filterEstatusPiedra);
    }

    // Filtrar por estatus de montura
    if (filterEstatusMontura !== "todos") {
      filtered = filtered.filter((order) => order.estatus_montura === filterEstatusMontura);
    }

    setFilteredOrders(filtered);
  }, [searchTerm, orders, fechaDesde, fechaHasta, filterEstatusPiedra, filterEstatusMontura]);

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
        ),
        internal_order:purchase_orders_internal!orders_internal_order_id_fkey (
          numero_reporte
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
      (o) => o.estatus_piedra !== "piedra_montada" || 
             (o.estatus_montura !== "entregado_oyamel" && o.estatus_montura !== "entregado_levant")
    ).length;

    setStats({
      totalOrders: total,
      totalRevenue: revenue,
      pendingPayment: pending,
      inProduction: inProd,
    });
  };

  const fetchInternalOrders = async () => {
    try {
      setLoadingInternal(true);
      const { data, error } = await supabase
        .from('purchase_orders_internal')
        .select(`
          *,
          supplier:suppliers(
            id,
            nombre_empresa,
            nombre_contacto,
            email,
            telefono
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate batch counts
      const batchCounts = new Map<string, number>();
      (data || []).forEach(order => {
        if (order.batch_id) {
          batchCounts.set(order.batch_id, (batchCounts.get(order.batch_id) || 0) + 1);
        }
      });

      // Add batch_count to each order
      const ordersWithBatchCount = (data || []).map(order => ({
        ...order,
        batch_count: order.batch_id ? batchCounts.get(order.batch_id) : undefined
      }));

      // Get linked client orders
      const internalOrderIds = ordersWithBatchCount.map(o => o.id);
      const { data: linkedOrders } = await supabase
        .from('orders')
        .select('id, custom_id, internal_order_id, clients(nombre, apellido)')
        .in('internal_order_id', internalOrderIds);

      // Create map of linked orders
      const linkedOrdersMap = new Map();
      linkedOrders?.forEach(order => {
        if (order.internal_order_id) {
          linkedOrdersMap.set(order.internal_order_id, {
            id: order.id,
            custom_id: order.custom_id,
            client_name: `${order.clients?.nombre} ${order.clients?.apellido}`
          });
        }
      });

      // Add linked client order info to each internal order
      const ordersWithClientInfo = ordersWithBatchCount.map(order => ({
        ...order,
        linked_client_order: linkedOrdersMap.get(order.id)
      }));

      setInternalOrders(ordersWithClientInfo);
      
      // Calculate stats
      const stats = {
        totalCompras: data?.length || 0,
        gastoTotal: data?.reduce((sum, order) => 
          order.is_batch_primary !== false ? sum + (order.precio_compra || 0) : sum, 0
        ) || 0,
        enTransito: data?.filter(order => order.estatus === 'en_transito').length || 0,
        recibidas: data?.filter(order => order.estatus === 'recibido').length || 0,
      };

      setInternalStats(stats);
    } catch (error) {
      console.error('Error fetching internal orders:', error);
      toast.error("Error al cargar órdenes internas");
    } finally {
      setLoadingInternal(false);
    }
  };
  
  const applyInternalFilters = () => {
    let filtered = internalOrders;

    if (internalSearchTerm) {
      filtered = filtered.filter(order =>
        order.proveedor_nombre.toLowerCase().includes(internalSearchTerm.toLowerCase())
      );
    }

    if (internalFilterTipo !== "todos") {
      filtered = filtered.filter(order => order.tipo_producto === internalFilterTipo);
    }

    if (internalFilterEstatus !== "todos") {
      filtered = filtered.filter(order => order.estatus === internalFilterEstatus);
    }

    setFilteredInternalOrders(filtered);
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

  const handleSendToSign = (orderId: string) => {
    setPrintOrderId(orderId);
    setAutoSendToSign(true);
    setIsPrintDialogOpen(true);
  };

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Órdenes de Compra</h1>
            <p className="text-muted-foreground">
              Gestión completa de pedidos y producción
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 grid w-full grid-cols-2">
            <TabsTrigger value="external" className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Órdenes de Clientes
            </TabsTrigger>
            <TabsTrigger value="internal" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Compras a Proveedores
            </TabsTrigger>
          </TabsList>

          {/* Botón "Nueva Orden" debajo de las pestañas */}
          <div className="mb-6 flex justify-end">
            <Button
              onClick={() => {
                if (activeTab === "external") {
                  setIsOrderDialogOpen(true);
                } else {
                  setIsInternalOrderDialogOpen(true);
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === "external" ? "Nueva Orden de Cliente" : "Nueva Compra a Proveedor"}
            </Button>
          </div>

          <TabsContent value="external">
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
              <div className="text-3xl font-bold text-foreground">{stats.inProduction}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            {/* Título */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros Avanzados</h3>
            </div>
            
            {/* Fila 1: Búsqueda completa */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre del cliente, apellido o ID de orden..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Fila 2: Fechas + Piedra + Montura */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Fecha:
                </span>
                <Popover open={isDateFromOpen} onOpenChange={setIsDateFromOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal w-[140px]",
                        !fechaDesde && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaDesde ? format(fechaDesde, "dd/MM/yy") : "Desde"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
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

                <Popover open={isDateToOpen} onOpenChange={setIsDateToOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn(
                        "justify-start text-left font-normal w-[140px]",
                        !fechaHasta && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaHasta ? format(fechaHasta, "dd/MM/yy") : "Hasta"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
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

                {(fechaDesde || fechaHasta) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFechaDesde(undefined);
                      setFechaHasta(undefined);
                    }}
                    className="h-8 px-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Piedra:
                </span>
                <Select value={filterEstatusPiedra} onValueChange={setFilterEstatusPiedra}>
                  <SelectTrigger className="flex-1 max-w-[200px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {STONE_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Montura:
                </span>
                <Select value={filterEstatusMontura} onValueChange={setFilterEstatusMontura}>
                  <SelectTrigger className="flex-1 max-w-[200px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {MOUNTING_STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between gap-3 mb-4">
          {/* Results counter */}
          <span className="text-sm text-muted-foreground">
            {filteredOrders.length} resultados encontrados
          </span>
          
          {/* View controls */}
          <div className="flex items-center gap-3">
            <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'cards' | 'table')}>
              <ToggleGroupItem value="cards" aria-label="Vista de tarjetas">
                <LayoutGrid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="table" aria-label="Vista de tabla">
                <Table2 className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            
            <Separator orientation="vertical" className="h-6" />
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                try {
                  await generateOrderLabelsPDF(filteredOrders);
                  toast.success("PDF de etiquetas generado exitosamente");
                } catch (error) {
                  console.error("Error generando PDF:", error);
                  toast.error("Error al generar el PDF de etiquetas");
                }
              }}
            >
              <Printer className="h-4 w-4 mr-2" />
              Generar PDF de Impresión
            </Button>
          </div>
        </div>

        {/* Orders List or Table */}
        {viewMode === 'cards' ? (
          <OrderList
            orders={filteredOrders}
            loading={loading}
            onEdit={handleOrderAction}
            onRefresh={fetchOrders}
            onOpenPrint={handleOpenPrint}
            onSendToSign={handleSendToSign}
          />
        ) : (
          <OrderTableView
            orders={filteredOrders}
            onOrderClick={handleOrderAction}
          />
        )}
          </TabsContent>

          <TabsContent value="internal">
            {/* Internal Orders Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Total Compras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{internalStats.totalCompras}</div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Gasto Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    ${internalStats.gastoTotal.toLocaleString("es-MX")}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    En Tránsito
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{internalStats.enTransito}</div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Recibidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{internalStats.recibidas}</div>
                </CardContent>
              </Card>
            </div>

            {/* Internal Orders List */}
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por proveedor..."
                      value={internalSearchTerm}
                      onChange={(e) => setInternalSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <select
                    value={internalFilterTipo}
                    onChange={(e) => setInternalFilterTipo(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="todos">Todos los productos</option>
                    <option value="diamante">Diamante</option>
                    <option value="gema">Gema</option>
                    <option value="anillo">Anillo</option>
                    <option value="collar">Collar</option>
                    <option value="arete">Arete</option>
                    <option value="dije">Dije</option>
                    <option value="cadena">Cadena</option>
                    <option value="componente">Componente</option>
                    <option value="otro">Otro</option>
                  </select>

                  <select
                    value={internalFilterEstatus}
                    onChange={(e) => setInternalFilterEstatus(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="todos">Todos los estatus</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="en_transito">En Tránsito</option>
                    <option value="recibido">Recibido</option>
                    <option value="cancelado">Cancelado</option>
                  </select>

                  {(internalSearchTerm || internalFilterTipo !== "todos" || internalFilterEstatus !== "todos") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setInternalSearchTerm("");
                        setInternalFilterTipo("todos");
                        setInternalFilterEstatus("todos");
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <InternalOrderList 
              orders={filteredInternalOrders}
              loading={loadingInternal}
              onRefresh={fetchInternalOrders} 
            />
          </TabsContent>
        </Tabs>
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

      {/* Internal Order Dialog */}
      <InternalOrderDialog
        open={isInternalOrderDialogOpen}
        onOpenChange={setIsInternalOrderDialogOpen}
        onSuccess={() => {
          fetchInternalOrders();
          toast.success("Orden interna creada exitosamente");
        }}
      />

      {/* Order Print Dialog */}
      <OrderPrintDialog
        orderId={printOrderId}
        open={isPrintDialogOpen}
        onOpenChange={(open) => {
          setIsPrintDialogOpen(open);
          if (!open) setAutoSendToSign(false);
        }}
        autoSendToSign={autoSendToSign}
      />
    </div>
  );
};

export default Orders;
