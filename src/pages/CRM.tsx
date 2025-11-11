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
}

const CRM = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
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
    let filtered = clients;

    // Filtro por letra
    if (selectedLetter) {
      filtered = filtered.filter((client) =>
        client.nombre.toUpperCase().startsWith(selectedLetter)
      );
    }

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.telefono_principal.includes(searchTerm)
      );
    }

    setFilteredClients(filtered);
  }, [searchTerm, selectedLetter, clients]);

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
            Administra tu cartera de clientes, citas, prospectos y recordatorios
          </p>
        </div>

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

        {/* Alphabet Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap mr-2">
                Filtrar por letra:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto pb-2">
                {/* Botón "Todas" */}
                <Button
                  variant={selectedLetter === null ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedLetter(null)}
                  className="h-8 px-3 min-w-[60px]"
                >
                  Todas
                </Button>
                
                {/* Letras A-Z */}
                {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
                  const hasClients = clients.some((client) =>
                    client.nombre.toUpperCase().startsWith(letter)
                  );
                  
                  return (
                    <Button
                      key={letter}
                      variant={selectedLetter === letter ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSelectedLetter(letter)}
                      disabled={!hasClients}
                      className={`h-8 w-8 p-0 ${
                        !hasClients ? "opacity-30" : ""
                      }`}
                    >
                      {letter}
                    </Button>
                  );
                })}
              </div>
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
