import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { 
  Mail, 
  Phone, 
  Edit, 
  Calendar, 
  Gem, 
  Bell,
  Loader2,
  Eye
} from "lucide-react";
import type { Client } from "@/pages/CRM";

interface ClientListProps {
  clients: Client[];
  loading: boolean;
  onEdit: (client: Client) => void;
  onAddAppointment: (client: Client) => void;
  onAddProspect: (client: Client) => void;
  onAddReminder: (client: Client) => void;
  onRefresh: () => void;
}

const ClientList = ({
  clients,
  loading,
  onEdit,
  onAddAppointment,
  onAddProspect,
  onAddReminder,
}: ClientListProps) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No se encontraron clientes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {clients.map((client) => (
        <Card key={client.id} className="border-border hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 
                    className="text-xl font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
                    onClick={() => navigate(`/crm/${client.id}`)}
                  >
                    {client.nombre} {client.apellido}
                  </h3>
                  {client.documento_id_url && (
                    <Badge variant="secondary">INE registrada</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{client.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{client.telefono_principal}</span>
                    {client.telefono_adicional && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{client.telefono_adicional}</span>
                      </>
                    )}
                  </div>
                  {client.fuente_contacto && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Fuente:</span> {client.fuente_contacto}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full lg:w-auto lg:min-w-[200px]">
                {/* Botones principales */}
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/crm/${client.id}`)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Detalle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(client)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
                
                {/* Botones de acciones rápidas */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddAppointment(client)}
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Cita
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddProspect(client)}
                  >
                    <Gem className="h-4 w-4 mr-1" />
                    Prospecto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddReminder(client)}
                  >
                    <Bell className="h-4 w-4 mr-1" />
                    Recordatorio
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientList;
