import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Package, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ProductionCard } from "@/components/production/ProductionCard";
import {
  ProductionFiltersComponent,
  ProductionFilters,
} from "@/components/production/ProductionFilters";

interface Order {
  id: string;
  client_id: string;
  precio_venta: number;
  importe_anticipo: number;
  forma_pago: string;
  estatus_pago: string;
  metal_tipo: string;
  metal_pureza: string | null;
  metal_color: string | null;
  piedra_tipo: string;
  diamante_color: string | null;
  diamante_claridad: string | null;
  diamante_corte: string | null;
  diamante_forma: string | null;
  diamante_quilataje: number | null;
  gema_observaciones: string | null;
  estatus_piedra: string | null;
  estatus_montura: string | null;
  disenador_id: string | null;
  joyero_id: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
  clients: {
    nombre: string;
    apellido: string;
    telefono_principal: string;
  };
}

const Production = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ProductionFilters>({
    estatusPiedra: "all",
    estatusMontura: "all",
    disenadorId: "all",
    joyeroId: "all",
    fechaDesde: undefined,
    fechaHasta: undefined,
  });

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          custom_id,
          clients (
            nombre,
            apellido,
            telefono_principal
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      setFilteredOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar las órdenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Real-time updates
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchTerm === "" && !hasActiveFilters()) {
      setFilteredOrders(orders);
    } else {
      let filtered = orders;

      // Apply search term
      if (searchTerm) {
        filtered = filtered.filter((order) => {
          const clientName = `${order.clients.nombre} ${order.clients.apellido}`.toLowerCase();
          const search = searchTerm.toLowerCase();
          return (
            clientName.includes(search) ||
            order.estatus_piedra?.toLowerCase().includes(search) ||
            order.estatus_montura?.toLowerCase().includes(search)
          );
        });
      }

      // Apply filters
      if (filters.estatusPiedra && filters.estatusPiedra !== "all") {
        filtered = filtered.filter((o) => o.estatus_piedra === filters.estatusPiedra);
      }

      if (filters.estatusMontura && filters.estatusMontura !== "all") {
        filtered = filtered.filter((o) => o.estatus_montura === filters.estatusMontura);
      }

      if (filters.disenadorId && filters.disenadorId !== "all") {
        if (filters.disenadorId === "sin_asignar") {
          filtered = filtered.filter((o) => !o.disenador_id);
        } else {
          filtered = filtered.filter((o) => o.disenador_id === filters.disenadorId);
        }
      }

      if (filters.joyeroId && filters.joyeroId !== "all") {
        if (filters.joyeroId === "sin_asignar") {
          filtered = filtered.filter((o) => !o.joyero_id);
        } else {
          filtered = filtered.filter((o) => o.joyero_id === filters.joyeroId);
        }
      }

      if (filters.fechaDesde) {
        filtered = filtered.filter(
          (o) => new Date(o.created_at) >= filters.fechaDesde!
        );
      }

      if (filters.fechaHasta) {
        const fechaHastaEnd = new Date(filters.fechaHasta);
        fechaHastaEnd.setHours(23, 59, 59, 999);
        filtered = filtered.filter(
          (o) => new Date(o.created_at) <= fechaHastaEnd
        );
      }

      setFilteredOrders(filtered);
    }
  }, [searchTerm, orders, filters]);

  const hasActiveFilters = () => {
    return (
      (filters.estatusPiedra && filters.estatusPiedra !== "all") ||
      (filters.estatusMontura && filters.estatusMontura !== "all") ||
      (filters.disenadorId && filters.disenadorId !== "all") ||
      (filters.joyeroId && filters.joyeroId !== "all") ||
      filters.fechaDesde ||
      filters.fechaHasta
    );
  };

  const calculateStats = () => {
    const enProceso = orders.filter(
      (o) => o.estatus_piedra !== "piedra_montada" || 
             (o.estatus_montura !== "entregado_oyamel" && o.estatus_montura !== "entregado_levant")
    ).length;
    const completadas = orders.filter(
      (o) => o.estatus_piedra === "piedra_montada" && 
             (o.estatus_montura === "entregado_oyamel" || o.estatus_montura === "entregado_levant")
    ).length;
    const enEspera = orders.filter(
      (o) => o.estatus_montura === "en_espera" || o.estatus_piedra === "en_busqueda"
    ).length;

    return { enProceso, completadas, enEspera };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Seguimiento de Producción</h1>
          <p className="text-muted-foreground">
            Monitorea el progreso de cada orden en tiempo real
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                En proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.enProceso}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En espera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.enEspera}</div>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.completadas}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros avanzados</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por cliente o estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <ProductionFiltersComponent filters={filters} onFiltersChange={setFilters} />
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No hay órdenes en producción</p>
              </CardContent>
            </Card>
          ) : (
            filteredOrders.map((order) => (
              <ProductionCard key={order.id} order={order} onUpdate={fetchOrders} />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Production;
