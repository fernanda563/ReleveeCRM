import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Calendar, ChevronDown, ChevronUp, ShoppingCart, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);
  const title = generateProspectTitle(prospect);

  const handleExpandClick = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-lg transition-all duration-300",
        className
      )}
      onClick={handleExpandClick}
      role="button"
    >
      <CardHeader className="pb-3">
        {showClientName && clientName && (
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">
              Cliente: <span className="font-medium text-foreground">{clientName}</span>
            </p>
            {clientId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/crm/${clientId}`;
                }}
              >
                Ver cliente
              </Button>
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg capitalize flex-1">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(prospect.estado)}>{prospect.estado.replace(/_/g, " ")}</Badge>
            
            {/* Dropdown de opciones - solo si no está convertido */}
            {prospect.estado !== "convertido" && (onEditStatus || onClick) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEditStatus && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStatus(prospect);
                      }}
                    >
                      Editar estatus
                    </DropdownMenuItem>
                  )}
                  {onClick && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                      }}
                    >
                      Editar proyecto
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Información siempre visible (compacta) */}
        <div className="flex flex-col gap-3 text-sm">
          {prospect.importe_previsto && (
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{formatCurrency(prospect.importe_previsto)}</span>
            </div>
          )}

          {/* Fechas siempre visibles */}
          <div className="grid grid-cols-1 gap-2 pt-2 border-t text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Creado:</span>
              <span className="font-medium">{formatDate(prospect.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Última edición:</span>
              <span className="font-medium">{formatDate(prospect.updated_at)}</span>
            </div>
            {prospect.fecha_entrega_deseada && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Entrega deseada:</span>
                <span className="font-medium text-primary">{formatDate(prospect.fecha_entrega_deseada)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Detalles expandibles */}
        <div
          className={cn(
            "space-y-3 overflow-hidden transition-all duration-300",
            isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          )}
        >
          {prospect.metal_tipo && (
            <div className="pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">METAL</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Tipo:</p>
                  <p className="font-medium capitalize">{prospect.metal_tipo}</p>
                </div>
                {prospect.metal_tipo === "oro" && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Color:</p>
                      <p className="font-medium capitalize">{prospect.color_oro || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pureza:</p>
                      <p className="font-medium">{prospect.pureza_oro || "N/A"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">DETALLES DEL DISEÑO</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Incluye piedra:</p>
                <p className="font-medium capitalize">{prospect.incluye_piedra || "No especificado"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tipo de piedra:</p>
                <p className="font-medium capitalize">
                  {prospect.incluye_piedra === "si" && prospect.tipo_piedra 
                    ? prospect.tipo_piedra 
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Estilo:</p>
                <p className="font-medium capitalize">
                  {prospect.estilo_anillo 
                    ? prospect.estilo_anillo.replace(/_/g, " ") 
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>

          {prospect.largo_aprox && (
            <div className="text-sm">
              <p className="text-muted-foreground">Largo aproximado:</p>
              <p className="font-medium">{prospect.largo_aprox}</p>
            </div>
          )}

          {prospect.observaciones && (
            <div className="text-sm pt-2 border-t">
              <p className="font-medium mb-1">Observaciones:</p>
              <p className="text-muted-foreground">{prospect.observaciones}</p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        {prospect.estado !== "convertido" && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between gap-2">
              {/* Botón eliminar - alineado a la izquierda */}
              {onDelete && (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(prospect);
                  }}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              )}
              
              {/* Botones convertir y editar - alineados a la derecha */}
              <div className="flex items-center gap-2 ml-auto">
                {onClick && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClick();
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
                
                {(prospect.estado === "activo" || prospect.estado === "en_pausa") && onConvertToOrder && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onConvertToOrder(prospect);
                    }}
                    size="sm"
                    variant="default"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Convertir a Orden
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
