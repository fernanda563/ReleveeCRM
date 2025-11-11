import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { 
  Phone, 
  Edit, 
  Calendar, 
  Gem, 
  Bell,
  Loader2,
  Eye,
  MoreVertical,
  ShoppingBag,
  AlertCircle,
  DollarSign,
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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
};

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
            <div className="flex items-start justify-between gap-4">
              {/* Información del Cliente */}
              <div className="flex-1 min-w-0">
                {/* Nombre y Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <h3 
                    className="text-xl font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
                    onClick={() => navigate(`/crm/${client.id}`)}
                  >
                    {client.nombre} {client.apellido}
                  </h3>
                  
                  {/* Badge de Total de Pedidos */}
                  <Badge variant="outline" className="flex items-center gap-1.5 shrink-0">
                    <ShoppingBag className="h-3 w-3" />
                    <span className="text-xs">
                      {client.total_orders ?? 0} {(client.total_orders ?? 0) === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </Badge>
                  
                  {client.documento_id_url && (
                    <Badge variant="secondary" className="shrink-0">INE registrada</Badge>
                  )}
                </div>

                {/* Información de Contacto */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span className="truncate">{client.telefono_principal}</span>
                    {client.telefono_adicional && (
                      <>
                        <span className="mx-2">•</span>
                        <span className="truncate">{client.telefono_adicional}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Métricas de Negocio */}
                <div className="flex flex-wrap gap-2">
                  {/* Órdenes Activas */}
                  {client.active_orders && client.active_orders > 0 && (
                    <Badge variant="default" className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">
                        {client.active_orders} {client.active_orders === 1 ? 'orden activa' : 'órdenes activas'}
                      </span>
                    </Badge>
                  )}

                  {/* Deuda */}
                  {client.total_debt && client.total_debt > 0 && (
                    <Badge variant="destructive" className="flex items-center gap-1.5">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-xs">
                        Debe {formatCurrency(client.total_debt)}
                      </span>
                    </Badge>
                  )}

                  {/* Cliente al corriente */}
                  {(!client.total_debt || client.total_debt === 0) && client.total_orders && client.total_orders > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1.5 text-green-600 border-green-600">
                      <DollarSign className="h-3 w-3" />
                      <span className="text-xs">Al corriente</span>
                    </Badge>
                  )}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Botón Ver Detalle (prominente) */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate(`/crm/${client.id}`)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalle
                </Button>

                {/* Dropdown Menu para más acciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar Cliente
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => onAddAppointment(client)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Cita
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onAddProspect(client)}>
                      <Gem className="h-4 w-4 mr-2" />
                      Añadir Prospecto
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onAddReminder(client)}>
                      <Bell className="h-4 w-4 mr-2" />
                      Crear Recordatorio
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientList;
