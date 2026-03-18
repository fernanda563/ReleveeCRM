import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  Calendar, 
  ShoppingCart, 
  MoreHorizontal, 
  Pencil, 
  Trash2,
  Circle,
  CalendarPlus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { generateProspectTitle, getVigenciaStatus, type ProspectLike } from "./prospect-utils";

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
  fecha_vigencia?: string | null;
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
  const vigencia = getVigenciaStatus(prospect);

  const metalLine = [
    prospect.metal_tipo,
    prospect.metal_tipo === "Oro" && prospect.color_oro,
    prospect.metal_tipo === "Oro" && prospect.pureza_oro,
  ].filter(Boolean).join(" • ");

  return (
    <Card
      className={cn("hover:shadow-md transition-all cursor-pointer", className)}
      onClick={() => onClick?.()}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate capitalize">
              {title}
            </CardTitle>
            {showClientName && clientName && (
              <p className="text-sm text-muted-foreground truncate">
                {clientName}
              </p>
            )}
          </div>
          {prospect.estado !== "convertido" && (onEditStatus || onConvertToOrder || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditStatus && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onEditStatus(prospect);
                  }}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar cotización
                  </DropdownMenuItem>
                )}
                {prospect.estado === "activo" && onConvertToOrder && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    onConvertToOrder(prospect);
                  }}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Convertir a orden
                  </DropdownMenuItem>
                )}
                {showClientName && clientId && (
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = `/crm/${clientId}`;
                  }}>
                    Ver cliente
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
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className={cn(vigencia.color)}>
            {vigencia.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {metalLine && (
          <div className="flex items-center gap-2 text-sm">
            <Circle className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground truncate">{metalLine}</span>
          </div>
        )}
        {prospect.importe_previsto && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold">{formatCurrency(prospect.importe_previsto)}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm">
          <CalendarPlus className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground">Creada: {formatDate(prospect.created_at)}</span>
        </div>
        {prospect.fecha_entrega_deseada && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">Entrega: {formatDate(prospect.fecha_entrega_deseada)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
