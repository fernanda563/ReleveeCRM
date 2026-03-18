import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, ShoppingCart, Gem, TrendingUp, Plus, UserPlus, ShoppingBag } from "lucide-react";
import ClientDialog from "@/components/crm/ClientDialog";
import OrderDialog from "@/components/orders/OrderDialog";


const Dashboard = () => {
  const navigate = useNavigate();
  const [clientDialogOpen, setClientDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  

  const handleOpenClientDialog = () => {
    setOrderDialogOpen(false);
    setClientDialogOpen(true);
  };

  const handleClientSuccess = () => {
    setClientDialogOpen(false);
    setTimeout(() => {
      setOrderDialogOpen(true);
    }, 300);
  };
  
  const stats = [
    {
      title: "Clientes Activos",
      value: "248",
      change: "+12.5%",
      icon: Users,
      iconColor: "text-foreground",
    },
    {
      title: "Órdenes en Proceso",
      value: "18",
      change: "+8.2%",
      icon: ShoppingCart,
      iconColor: "text-foreground",
    },
    {
      title: "Piezas en Taller",
      value: "12",
      change: "-3.1%",
      icon: Gem,
      iconColor: "text-foreground",
    },
    {
      title: "Ingresos del Mes",
      value: "$142,500",
      change: "+18.9%",
      icon: TrendingUp,
      iconColor: "text-foreground",
    },
  ];

  return (
    <div className="min-h-full bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Header with Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Bienvenido a tu sistema de gestión
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Acciones Rápidas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
              <DropdownMenuItem onClick={() => setClientDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOrderDialogOpen(true)}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Nueva Orden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  <span className={stat.change.startsWith('+') ? 'text-foreground' : 'text-foreground/70'}>
                    {stat.change}
                  </span>
                  {' '}desde el mes pasado
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card 
            className="border-border hover:border-foreground transition-colors duration-300 cursor-pointer group"
            onClick={() => navigate('/crm')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-foreground/10 rounded-lg group-hover:bg-foreground/20 transition-colors">
                  <Users className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Gestión de Clientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
          <p className="text-muted-foreground">
            Administra tu cartera de clientes, agenda citas y realiza seguimiento de cotizaciones.
          </p>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total clientes:</span>
                  <span className="font-semibold text-foreground">248</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Cotizaciones activas:</span>
                  <span className="font-semibold text-foreground">32</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="border-border hover:border-foreground transition-colors duration-300 cursor-pointer group"
            onClick={() => navigate('/orders')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-foreground/10 rounded-lg group-hover:bg-foreground/20 transition-colors">
                  <ShoppingCart className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Órdenes de Compra</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Crea y gestiona pedidos personalizados con seguimiento completo de pagos.
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">En proceso:</span>
                  <span className="font-semibold text-foreground">18</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Por liquidar:</span>
                  <span className="font-semibold text-foreground">7</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border hover:border-foreground transition-colors duration-300 cursor-pointer group">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-foreground/10 rounded-lg group-hover:bg-foreground/20 transition-colors">
                  <Gem className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Seguimiento de Producción</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitorea el proceso de fabricación de piedras y monturas en tiempo real.
              </p>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">En taller:</span>
                  <span className="font-semibold text-foreground">12</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">En diseño:</span>
                  <span className="font-semibold text-foreground">6</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <Card className="mt-8 border-border">
          <CardHeader>
            <CardTitle className="text-xl">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: "Nueva orden creada",
                  client: "María González",
                  detail: "Anillo de compromiso - Oro 18k con diamante",
                  time: "Hace 2 horas",
                  status: "success",
                },
                {
                  action: "Piedra recibida",
                  client: "Carlos Ramírez",
                  detail: "Diamante 1.2ct - Ya en Levant",
                  time: "Hace 5 horas",
                  status: "warning",
                },
                {
                  action: "Pieza completada",
                  client: "Ana Martínez",
                  detail: "Anillo de compromiso - Listo para entrega",
                  time: "Hace 1 día",
                  status: "primary",
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`mt-1 h-2 w-2 rounded-full bg-${activity.status}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{activity.action}</p>
                      <span className="text-xs text-muted-foreground">{activity.time}</span>
                    </div>
                    <p className="text-sm text-foreground mt-1">{activity.client}</p>
                    <p className="text-sm text-muted-foreground mt-1">{activity.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Dialogs */}
      <ClientDialog
        open={clientDialogOpen}
        onOpenChange={setClientDialogOpen}
        onSuccess={handleClientSuccess}
      />
      <OrderDialog
        open={orderDialogOpen}
        onOpenChange={setOrderDialogOpen}
        onSuccess={() => {
          setOrderDialogOpen(false);
        }}
        onOpenClientDialog={handleOpenClientDialog}
      />
    </div>
  );
};

export default Dashboard;
