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

  // Diseño horizontal para vista de proyectos
  if (showClientName) {
    return (
      <Card
        className={cn(
          "hover:shadow-md transition-all cursor-pointer",
          className
        )}
        onClick={() => onClick?.()}
      >
        <CardContent className="p-4">
          {/* Fila 1: Cliente, estado, acciones */}
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

          {/* Fila 2: Título del proyecto */}
          <h3 className="text-lg font-semibold mb-3 capitalize">{title}</h3>

          {/* Fila 3: Detalles en línea horizontal */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-2">
            {prospect.metal_tipo && (
              <div className="flex items-center gap-1">
                <span>💍 Metal:</span>
                <span>{prospect.metal_tipo}</span>
                {prospect.metal_tipo === "Oro" && prospect.color_oro && (
                  <span>• {prospect.color_oro}</span>
                )}
                {prospect.metal_tipo === "Oro" && prospect.pureza_oro && (
                  <span>• {prospect.pureza_oro}</span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <span>💎 Piedra:</span>
              <span>{prospect.incluye_piedra || "No especificado"}</span>
              {prospect.incluye_piedra === "Sí" && prospect.tipo_piedra && (
                <span>• {prospect.tipo_piedra}</span>
              )}
            </div>

            {prospect.estilo_anillo && (
              <div className="flex items-center gap-1">
                <span>✨ Estilo:</span>
                <span className="capitalize">{prospect.estilo_anillo.replace(/_/g, " ")}</span>
              </div>
            )}

            {prospect.largo_aprox && (
              <div className="flex items-center gap-1">
                <span>📏 Largo:</span>
                <span>{prospect.largo_aprox}</span>
              </div>
            )}
          </div>

          {/* Fila 4: Financiero y fecha */}
          <div className="flex flex-wrap gap-4 text-sm mb-2">
            {prospect.importe_previsto && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">💰 Importe:</span>
                <span className="font-semibold">{formatCurrency(prospect.importe_previsto)}</span>
              </div>
            )}
            {prospect.fecha_entrega_deseada && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">📅 Entrega:</span>
                <span className="font-semibold">{formatDate(prospect.fecha_entrega_deseada)}</span>
              </div>
            )}
          </div>

          {/* Fila 5: Observaciones */}
          {prospect.observaciones && (
            <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
              📝 {prospect.observaciones}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Diseño vertical para vista de detalle del cliente
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
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary para proyectos (siempre visible) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            {prospect.importe_previsto && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{formatCurrency(prospect.importe_previsto)}</span>
              </div>
            )}
            {prospect.fecha_entrega_deseada && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(prospect.fecha_entrega_deseada)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botón de expansión */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Ver más detalles
            </>
          )}
        </Button>

        {/* Detalles expandidos */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t">
            {/* Detalles del Metal */}
            {prospect.metal_tipo && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Metal</p>
                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                  <span>Tipo: {prospect.metal_tipo}</span>
                  {prospect.metal_tipo === "Oro" && prospect.color_oro && (
                    <span>• Color: {prospect.color_oro}</span>
                  )}
                  {prospect.metal_tipo === "Oro" && prospect.pureza_oro && (
                    <span>• Pureza: {prospect.pureza_oro}</span>
                  )}
                </div>
              </div>
            )}

            {/* Detalles de Piedra */}
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">Piedra</p>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>Incluye piedra: {prospect.incluye_piedra || "No especificado"}</span>
                {prospect.incluye_piedra === "Sí" && prospect.tipo_piedra && (
                  <span>• Tipo: {prospect.tipo_piedra}</span>
                )}
              </div>
            </div>

            {/* Estilo de Anillo si aplica */}
            {prospect.estilo_anillo && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Estilo de Anillo</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {prospect.estilo_anillo.replace(/_/g, " ")}
                </p>
              </div>
            )}

            {/* Largo aproximado */}
            {prospect.largo_aprox && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Largo aproximado</p>
                <p className="text-sm text-muted-foreground">{prospect.largo_aprox}</p>
              </div>
            )}

            {/* Observaciones */}
            {prospect.observaciones && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Observaciones</p>
                <p className="text-sm text-muted-foreground">{prospect.observaciones}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
