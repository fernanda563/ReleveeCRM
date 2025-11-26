import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Search, 
  Plus, 
  Calendar,
  Bell,
  Gem,
  Users,
  UserPlus,
} from "lucide-react";
import ClientDialog from "@/components/crm/ClientDialog";
import AppointmentDialog from "@/components/crm/AppointmentDialog";
import ProspectDialog from "@/components/crm/ProspectDialog";
import ReminderDialog from "@/components/crm/ReminderDialog";
import ClientList from "@/components/crm/ClientList";

export interface Client {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono_principal: string;
  telefono_adicional?: string;
  fuente_contacto?: string;
  documento_id_url?: string;
  created_at: string;
  // Métricas de negocio
  total_orders?: number;
  active_orders?: number;
  total_debt?: number;
  active_prospects?: number;
}

const CRM = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isAppointmentDialogOpen, setIsAppointmentDialogOpen] = useState(false);
  const [isProspectDialogOpen, setIsProspectDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    // Filtro por búsqueda de texto
    if (searchTerm) {
      const filtered = clients.filter(
        (client) =>
          client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.telefono_principal.includes(searchTerm)
      );
      setFilteredClients(filtered);
    } else {
      setFilteredClients(clients);
    }
  }, [searchTerm, clients]);

  const fetchClients = async () => {
    setLoading(true);
    
    // Primero obtenemos todos los clientes
    const { data: clientsData, error: clientsError } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (clientsError) {
      toast.error("Error al cargar clientes");
      console.error(clientsError);
      setLoading(false);
      return;
    }

    // Luego obtenemos los datos agregados de órdenes para cada cliente
    const clientsWithStats = await Promise.all(
      (clientsData || []).map(async (client) => {
        // Obtener todas las órdenes del cliente
        const { data: orders, error: ordersError } = await supabase
          .from("orders")
          .select("id, precio_venta, importe_anticipo, estatus_pago")
          .eq("client_id", client.id);

        if (ordersError) {
          console.error("Error al cargar órdenes del cliente:", ordersError);
          return {
            ...client,
            total_orders: 0,
            active_orders: 0,
            total_debt: 0,
          };
        }

        // Obtener prospectos activos
        const { data: prospects, error: prospectsError } = await supabase
          .from("prospects")
          .select("id, estado")
          .eq("client_id", client.id)
          .eq("estado", "activo");

        if (prospectsError) {
          console.error("Error al cargar prospectos del cliente:", prospectsError);
        }

        const activeProspects = prospects?.length || 0;

        // Calcular estadísticas
        const totalOrders = orders?.length || 0;
        const activeOrders = orders?.filter(
          (order) => order.estatus_pago !== "liquidado"
        ).length || 0;
        const totalDebt = orders
          ?.filter((order) => order.estatus_pago !== "liquidado")
          .reduce((sum, order) => {
            const debt = Number(order.precio_venta) - Number(order.importe_anticipo);
            return sum + debt;
          }, 0) || 0;

        return {
          ...client,
          total_orders: totalOrders,
          active_orders: activeOrders,
          total_debt: totalDebt,
          active_prospects: activeProspects,
        };
      })
    );

    setClients(clientsWithStats);
    setFilteredClients(clientsWithStats);
    setLoading(false);
  };

  const handleClientAction = (client?: Client) => {
    setSelectedClient(client || null);
    setIsClientDialogOpen(true);
  };

  const handleAppointmentAction = (client?: Client) => {
    setSelectedClient(client || null);
    setIsAppointmentDialogOpen(true);
  };

  const handleProspectAction = (client?: Client) => {
    setSelectedClient(client || null);
    setIsProspectDialogOpen(true);
  };

  const handleReminderAction = (client?: Client) => {
    setSelectedClient(client || null);
    setIsReminderDialogOpen(true);
  };

  return (
    <div className="min-h-full bg-background">
      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Gestión de Clientes
          </h1>
          <p className="text-muted-foreground">
            Administra tu cartera de clientes, citas, proyectos y recordatorios
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card 
            className="border-border hover:border-primary transition-colors cursor-pointer"
            onClick={() => handleClientAction()}
          >
            <CardHeader className="flex items-center py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
                  <Users className="h-4 w-4 text-secondary-foreground" />
                </div>
                Nuevo Cliente
              </CardTitle>
            </CardHeader>
          </Card>

          <Card 
            className="border-border hover:border-secondary transition-colors cursor-pointer"
            onClick={() => handleAppointmentAction()}
          >
            <CardHeader className="flex items-center py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
                  <Calendar className="h-4 w-4 text-secondary-foreground" />
                </div>
                Agendar Cita
              </CardTitle>
            </CardHeader>
          </Card>

          <Card 
            className="border-border hover:border-accent transition-colors cursor-pointer"
            onClick={() => handleProspectAction()}
          >
            <CardHeader className="flex items-center py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
              <Gem className="h-4 w-4 text-secondary-foreground" />
            </div>
            Añadir Proyecto
              </CardTitle>
            </CardHeader>
          </Card>

          <Card 
            className="border-border hover:border-primary transition-colors cursor-pointer"
            onClick={() => handleReminderAction()}
          >
            <CardHeader className="flex items-center py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-secondary rounded-lg">
                  <Bell className="h-4 w-4 text-secondary-foreground" />
                </div>
                Crear Recordatorio
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => handleClientAction()}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Client List */}
        <ClientList
          clients={filteredClients}
          loading={loading}
          onEdit={handleClientAction}
          onAddAppointment={handleAppointmentAction}
          onAddProspect={handleProspectAction}
          onAddReminder={handleReminderAction}
          onRefresh={fetchClients}
        />
      </main>

      {/* Dialogs */}
      <ClientDialog
        open={isClientDialogOpen}
        onOpenChange={setIsClientDialogOpen}
        client={selectedClient}
        onSuccess={fetchClients}
      />

      <AppointmentDialog
        open={isAppointmentDialogOpen}
        onOpenChange={setIsAppointmentDialogOpen}
        client={selectedClient}
        onSuccess={() => {
          toast.success("Cita agendada exitosamente");
          setIsAppointmentDialogOpen(false);
        }}
      />

      <ProspectDialog
        open={isProspectDialogOpen}
        onOpenChange={setIsProspectDialogOpen}
        client={selectedClient}
        onSuccess={() => {
          toast.success("Proyecto registrado exitosamente");
          setIsProspectDialogOpen(false);
        }}
      />

      <ReminderDialog
        open={isReminderDialogOpen}
        onOpenChange={setIsReminderDialogOpen}
        client={selectedClient}
        onSuccess={() => {
          toast.success("Recordatorio creado exitosamente");
          setIsReminderDialogOpen(false);
        }}
      />
    </div>
  );
};

export default CRM;
