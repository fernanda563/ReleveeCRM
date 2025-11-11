import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar } from "lucide-react";
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
}

interface ProspectCardProps {
  prospect: Prospect;
  onClick?: () => void;
  className?: string;
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
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const ProspectCard = ({ prospect, onClick, className }: ProspectCardProps) => {
  const title = generateProspectTitle(prospect);

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-lg transition-shadow",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg capitalize">{title}</CardTitle>
          </div>
          <Badge className={getStatusColor(prospect.estado)}>{prospect.estado}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {prospect.metal_tipo && (
          <div>
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

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">PIEDRA</p>
          <div className="text-sm space-y-1">
            <div>
              <p className="text-muted-foreground">Incluye piedra:</p>
              <p className="font-medium capitalize">{prospect.incluye_piedra || "No especificado"}</p>
            </div>
            {prospect.incluye_piedra === "si" && prospect.tipo_piedra && (
              <div>
                <p className="text-muted-foreground">Tipo:</p>
                <p className="font-medium capitalize">{prospect.tipo_piedra}</p>
              </div>
            )}
          </div>
        </div>

        {prospect.estilo_anillo && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">ESTILO</p>
            <div className="text-sm">
              <p className="font-medium capitalize">{prospect.estilo_anillo.replace(/_/g, " ")}</p>
            </div>
          </div>
        )}

        {prospect.largo_aprox && (
          <div className="text-sm">
            <p className="text-muted-foreground">Largo aproximado:</p>
            <p className="font-medium">{prospect.largo_aprox}</p>
          </div>
        )}

        {(prospect.importe_previsto || prospect.fecha_entrega_deseada) && (
          <div className="flex flex-wrap gap-3 pt-2 border-t">
            {prospect.importe_previsto && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formatCurrency(prospect.importe_previsto)}</span>
              </div>
            )}

            {prospect.fecha_entrega_deseada && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Entrega: {formatDate(prospect.fecha_entrega_deseada)}</span>
              </div>
            )}
          </div>
        )}

        {prospect.observaciones && (
          <div className="text-sm pt-2 border-t">
            <p className="font-medium mb-1">Observaciones:</p>
            <p className="text-muted-foreground">{prospect.observaciones}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
