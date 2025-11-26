import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Clock, Package, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  estatus_piedra: string | null;
  estatus_montura: string | null;
  created_at: string;
  updated_at: string;
}

const COLORS = {
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  accent: "hsl(var(--accent))",
  muted: "hsl(var(--muted))",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
};

const ProductionDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("id, estatus_piedra, estatus_montura, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas generales
  const calculateGeneralStats = () => {
    const total = orders.length;
    const completed = orders.filter(
      (o) => o.estatus_piedra === "piedra_montada" && 
             (o.estatus_montura === "entregado_oyamel" || o.estatus_montura === "entregado_levant")
    ).length;
    const inProgress = orders.filter(
      (o) =>
        o.estatus_piedra !== "piedra_montada" || 
        (o.estatus_montura !== "entregado_oyamel" && o.estatus_montura !== "entregado_levant")
    ).length;
    const avgDays = calculateAverageDays();

    return { total, completed, inProgress, avgDays };
  };

  // Calcular días promedio de producción
  const calculateAverageDays = () => {
    const completedOrders = orders.filter(
      (o) => o.estatus_piedra === "piedra_montada" && 
             (o.estatus_montura === "entregado_oyamel" || o.estatus_montura === "entregado_levant")
    );

    if (completedOrders.length === 0) return 0;

    const totalDays = completedOrders.reduce((sum, order) => {
      const start = new Date(order.created_at);
      const end = new Date(order.updated_at);
      const days = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return Math.round(totalDays / completedOrders.length);
  };

  // Datos para gráfica de estado de piedras
  const getStoneStatusData = () => {
    const statusCount: Record<string, number> = {};
    orders.forEach((order) => {
      const status = order.estatus_piedra || "Sin definir";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));
  };

  // Datos para gráfica de estado de monturas
  const getMountingStatusData = () => {
    const statusCount: Record<string, number> = {};
    orders.forEach((order) => {
      const status = order.estatus_montura || "Sin definir";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([name, value]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
    }));
  };

  // Datos para comparativa mensual
  const getMonthlyData = () => {
    const monthlyStats: Record<
      string,
      { created: number; completed: number; inProgress: number }
    > = {};

    orders.forEach((order) => {
      const month = new Date(order.created_at).toLocaleDateString("es-MX", {
        year: "numeric",
        month: "short",
      });

      if (!monthlyStats[month]) {
        monthlyStats[month] = { created: 0, completed: 0, inProgress: 0 };
      }

      monthlyStats[month].created += 1;

      if (
        order.estatus_piedra === "piedra_montada" &&
        (order.estatus_montura === "entregado_oyamel" || order.estatus_montura === "entregado_levant")
      ) {
        monthlyStats[month].completed += 1;
      } else {
        monthlyStats[month].inProgress += 1;
      }
    });

    return Object.entries(monthlyStats)
      .map(([month, stats]) => ({
        month,
        ...stats,
      }))
      .slice(-6)
      .reverse();
  };

  // Datos para tiempo promedio por fase (simulado)
  const getPhaseTimeData = () => {
    return [
      { phase: "Búsqueda Piedra", days: 7 },
      { phase: "Compra", days: 3 },
      { phase: "Tránsito", days: 10 },
      { phase: "Diseño", days: 5 },
      { phase: "Fabricación", days: 12 },
      { phase: "Montaje", days: 4 },
      { phase: "Entrega", days: 2 },
    ];
  };

  const stats = calculateGeneralStats();
  const stoneStatusData = getStoneStatusData();
  const mountingStatusData = getMountingStatusData();
  const monthlyData = getMonthlyData();
  const phaseTimeData = getPhaseTimeData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard de Producción</h1>
          <p className="text-muted-foreground mt-2">
            Análisis detallado del rendimiento y tiempos de producción
          </p>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Todas las órdenes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% del
                total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">Órdenes activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tiempo Promedio</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgDays}</div>
              <p className="text-xs text-muted-foreground">Días por orden</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficas */}
        <Tabs defaultValue="monthly" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monthly">Comparativa Mensual</TabsTrigger>
            <TabsTrigger value="phases">Tiempos por Fase</TabsTrigger>
            <TabsTrigger value="stones">Estado Piedras</TabsTrigger>
            <TabsTrigger value="mounting">Estado Monturas</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparativa Mensual de Órdenes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="completed"
                      stackId="1"
                      stroke={COLORS.success}
                      fill={COLORS.success}
                      name="Completadas"
                    />
                    <Area
                      type="monotone"
                      dataKey="inProgress"
                      stackId="1"
                      stroke={COLORS.warning}
                      fill={COLORS.warning}
                      name="En Progreso"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="phases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tiempo Promedio por Fase de Producción</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={phaseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="phase" angle={-45} textAnchor="end" height={100} />
                    <YAxis label={{ value: "Días", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="days" fill={COLORS.primary} name="Días promedio" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Estados de Piedra</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={stoneStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stoneStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mounting" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Estados de Montura</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={mountingStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mountingStatusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={Object.values(COLORS)[index % Object.values(COLORS).length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductionDashboard;
