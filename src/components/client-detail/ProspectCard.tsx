import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Calendar, 
  ShoppingCart, 
  MoreVertical, 
  Pencil, 
  Trash2,
  Circle,
  Gem,
  Sparkles,
  Ruler,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { generateProspectTitle, getStatusColor, type ProspectLike } from "./prospect-utils";

export interface Prospect extends ProspectLike {
  id: string;
  tipo_piedra: string | null;
  metal_tipo: string | null;
  color_oro: string | null;
  pureza_oro: string | null;
  incluye_piedra: string | null;
  estilo_anillo: string | null;
  largo_aprox: string | null;
  importe_previsto: number | null;
  fecha_entrega_deseada: string | null;
  estado: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

interface ProspectCardProps {
  prospect: Prospect;
  onClick?: () => void;
  onEditStatus?: (prospect: Prospect) => void;
  onConvertToOrder?: (prospect: Prospect) => void;
  onDelete?: (prospect: Prospect) => void;
  className?: string;
  showClientName?: boolean;
  clientName?: string;
  clientId?: string;
}

const formatCurrency = (amount: number | null) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const ProspectCard = ({ 
  prospect, 
  onClick, 
  onEditStatus, 
  onConvertToOrder, 
  onDelete, 
  className,
  showClientName = false,
  clientName,
  clientId
}: ProspectCardProps) => {
  const title = generateProspectTitle(prospect);

  return (
      <Card
        className={cn(
          "hover:shadow-md transition-all cursor-pointer",
          className
        )}
        onClick={() => onClick?.()}
      >
        <CardContent className="p-4">
          {/* Fila 1: Cliente, estado, acciones (solo si showClientName) */}
          {showClientName && (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <p className="text-sm">
                  Cliente: <span className="font-semibold">{clientName}</span>
                </p>
                <Badge className={getStatusColor(prospect.estado)}>
                  {prospect.estado.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {clientId && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/crm/${clientId}`;
                    }}
                  >
                    Ver cliente
                  </Button>
                )}
                {prospect.estado !== "convertido" && (onEditStatus || onConvertToOrder || onDelete) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {onEditStatus && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onEditStatus(prospect);
                        }}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar proyecto
                        </DropdownMenuItem>
                      )}
                      {prospect.estado === "activo" && onConvertToOrder && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          onConvertToOrder(prospect);
                        }}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Convertir a orden
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(prospect);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          )}

          {/* Fila 1b: Estado + acciones (cuando NO showClientName) */}
          {!showClientName && (
            <div className="flex items-center justify-between mb-3">
              <Badge className={getStatusColor(prospect.estado)}>
                {prospect.estado.replace(/_/g, " ")}
              </Badge>
              {prospect.estado !== "convertido" && (onEditStatus || onConvertToOrder || onDelete) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEditStatus && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onEditStatus(prospect);
                      }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar proyecto
                      </DropdownMenuItem>
                    )}
                    {prospect.estado === "activo" && onConvertToOrder && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onConvertToOrder(prospect);
                      }}>
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Convertir a orden
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(prospect);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Fila 2: Título del proyecto */}
          <h3 className="text-lg font-semibold mb-3 capitalize">{title}</h3>

          {/* Fila 3: Grid de 2 columnas - Detalles del producto + Info financiera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
            {/* Columna Izquierda: Detalles del Producto */}
            <div className="space-y-2">
              {prospect.metal_tipo && (
                <div className="flex items-center gap-2 text-sm">
                  <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-muted-foreground">Metal:</span>
                    <span className="font-medium">{prospect.metal_tipo}</span>
                    {prospect.metal_tipo === "Oro" && prospect.color_oro && (
                      <span className="text-muted-foreground">• {prospect.color_oro}</span>
                    )}
                    {prospect.metal_tipo === "Oro" && prospect.pureza_oro && (
                      <span className="text-muted-foreground">• {prospect.pureza_oro}</span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm">
                <Gem className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-muted-foreground">Piedra:</span>
                  <span className="font-medium">{prospect.incluye_piedra || "No especificado"}</span>
                  {prospect.incluye_piedra === "Sí" && prospect.tipo_piedra && (
                    <span className="text-muted-foreground">• {prospect.tipo_piedra}</span>
                  )}
                </div>
              </div>

              {prospect.estilo_anillo && (
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Estilo:</span>
                    <span className="font-medium capitalize">{prospect.estilo_anillo.replace(/_/g, " ")}</span>
                  </div>
                </div>
              )}

              {prospect.largo_aprox && (
                <div className="flex items-center gap-2 text-sm">
                  <Ruler className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Largo:</span>
                    <span className="font-medium">{prospect.largo_aprox}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Columna Derecha: Info Financiera y Temporal */}
            <div className="space-y-2">
              {prospect.importe_previsto && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Importe previsto:</span>
                    <span className="font-semibold">{formatCurrency(prospect.importe_previsto)}</span>
                  </div>
                </div>
              )}
              
              {prospect.fecha_entrega_deseada && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Entrega deseada:</span>
                    <span className="font-semibold">{formatDate(prospect.fecha_entrega_deseada)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fila 4: Observaciones */}
          {prospect.observaciones && (
            <div className="flex items-start gap-2 mt-3 pt-3 border-t">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="text-sm text-muted-foreground font-medium">Observaciones: </span>
                <span className="text-sm text-muted-foreground">{prospect.observaciones}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
};
