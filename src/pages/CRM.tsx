import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  Plus, 
  Calendar,
  Bell,
  Gem,
  LogOut,
  ArrowLeft
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
}

const CRM = () => {
  const navigate = useNavigate();
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
    checkAuth();
    fetchClients();
  }, []);

  useEffect(() => {
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

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar clientes");
      console.error(error);
    } else {
      setClients(data || []);
      setFilteredClients(data || []);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
    toast.success("Sesión cerrada");
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Gem className="h-6 w-6 text-accent" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Gestión de Clientes</h1>
                  <p className="text-sm text-muted-foreground">CRM - Joyería Relevée</p>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card 
            className="border-border hover:border-accent transition-colors cursor-pointer"
            onClick={() => handleClientAction()}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Users className="h-4 w-4 text-accent" />
                </div>
                Nuevo Cliente
              </CardTitle>
            </CardHeader>
          </Card>

          <Card 
            className="border-border hover:border-success transition-colors cursor-pointer"
            onClick={() => handleAppointmentAction()}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Calendar className="h-4 w-4 text-success" />
                </div>
                Agendar Cita
              </CardTitle>
            </CardHeader>
          </Card>

          <Card 
            className="border-border hover:border-warning transition-colors cursor-pointer"
            onClick={() => handleProspectAction()}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-warning/10 rounded-lg">
                  <Gem className="h-4 w-4 text-warning" />
                </div>
                Añadir Prospecto
              </CardTitle>
            </CardHeader>
          </Card>

          <Card 
            className="border-border hover:border-primary transition-colors cursor-pointer"
            onClick={() => handleReminderAction()}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="h-4 w-4 text-primary" />
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
          toast.success("Prospecto registrado exitosamente");
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
