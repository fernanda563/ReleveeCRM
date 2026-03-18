import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  MoreHorizontal,
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
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((client) => (
        <Card key={client.id} className="border-border hover:shadow-md transition-shadow flex flex-col">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
            <CardTitle
              className="text-lg font-semibold text-foreground hover:text-primary cursor-pointer transition-colors leading-tight pr-2"
              onClick={() => navigate(`/crm/${client.id}`)}
            >
              {client.nombre} {client.apellido}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/crm/${client.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalle
                </DropdownMenuItem>
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
                  Añadir Proyecto
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAddReminder(client)}>
                  <Bell className="h-4 w-4 mr-2" />
                  Crear Recordatorio
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>

          <CardContent className="flex-1 space-y-4">
            {/* Contacto */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span className="truncate">{client.telefono_principal}</span>
            </div>
            {client.telefono_adicional && client.telefono_adicional.length >= 10 && client.telefono_adicional !== "000" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground -mt-2">
                <Phone className="h-4 w-4 shrink-0 invisible" />
                <span className="truncate">{client.telefono_adicional}</span>
              </div>
            )}

            {/* Badges */}
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="flex items-center gap-1">
                <ShoppingBag className="h-3 w-3" />
                <span className="text-xs">
                  {client.total_orders ?? 0} {(client.total_orders ?? 0) === 1 ? 'pedido' : 'pedidos'}
                </span>
              </Badge>

              {Number(client.active_prospects ?? 0) > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 text-foreground border-foreground">
                  <Gem className="h-3 w-3" />
                  <span className="text-xs">
                    {client.active_prospects} {client.active_prospects === 1 ? 'proyecto' : 'proyectos'}
                  </span>
                </Badge>
              )}

              {client.documento_id_url && (
                <Badge variant="secondary">INE registrada</Badge>
              )}
            </div>

            {/* Métricas financieras */}
            {(Number(client.active_orders ?? 0) > 0 || Number(client.total_debt ?? 0) > 0 || (Number(client.total_orders ?? 0) > 0 && Number(client.total_debt ?? 0) === 0)) && (
              <div className="flex flex-wrap gap-1.5">
                {Number(client.active_orders ?? 0) > 0 && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span className="text-xs">
                      {Number(client.active_orders ?? 0)} {Number(client.active_orders ?? 0) === 1 ? 'orden activa' : 'órdenes activas'}
                    </span>
                  </Badge>
                )}

                {Number(client.total_debt ?? 0) > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1 whitespace-nowrap">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs">Debe {formatCurrency(Number(client.total_debt ?? 0))}</span>
                  </Badge>
                )}

                {Number(client.total_debt ?? 0) === 0 && Number(client.total_orders ?? 0) > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="text-xs">Al corriente</span>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClientList;
