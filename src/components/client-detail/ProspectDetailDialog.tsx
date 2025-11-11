import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Gem, DollarSign, Calendar } from "lucide-react";

interface Prospect {
  id: string;
  tipo_accesorio: string | null;
  subtipo_accesorio: string | null;
  tipo_piedra: string | null;
  metal_tipo: string | null;
  color_oro: string | null;
  pureza_oro: string | null;
  incluye_piedra: string | null;
  largo_aprox: string | null;
  estilo_anillo: string | null;
  importe_previsto: number | null;
  fecha_entrega_deseada: string | null;
  estado: string;
  observaciones: string | null;
  created_at: string;
}

interface ProspectDetailDialogProps {
  prospect: Prospect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProspectDetailDialog = ({
  prospect,
  open,
  onOpenChange,
}: ProspectDetailDialogProps) => {
  if (!prospect) return null;

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

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-success/10 text-success";
      case "convertido":
        return "bg-primary/10 text-primary";
      case "perdido":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl capitalize">
                {prospect.tipo_accesorio || "Tipo no especificado"}
                {prospect.subtipo_accesorio && ` - ${prospect.subtipo_accesorio}`}
              </DialogTitle>
              {prospect.estilo_anillo && (
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  Estilo: {prospect.estilo_anillo.replace(/_/g, ' ')}
                </p>
              )}
            </div>
            <Badge className={getStatusColor(prospect.estado)}>
              {prospect.estado}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Sección de Metal */}
          {prospect.metal_tipo && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">METAL</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Tipo:</p>
                  <p className="font-medium capitalize">{prospect.metal_tipo}</p>
                </div>
                {prospect.metal_tipo === "oro" && (
                  <>
                    <div>
                      <p className="text-muted-foreground mb-1">Color:</p>
                      <p className="font-medium capitalize">{prospect.color_oro || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Pureza:</p>
                      <p className="font-medium">{prospect.pureza_oro || "N/A"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Sección de Piedra */}
          {prospect.incluye_piedra === "si" && prospect.tipo_piedra && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">PIEDRA</p>
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Tipo:</p>
                <p className="font-medium capitalize">{prospect.tipo_piedra}</p>
              </div>
            </div>
          )}

          {/* Largo aproximado (para collares/pulseras) */}
          {prospect.largo_aprox && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">DIMENSIONES</p>
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Largo aproximado:</p>
                <p className="font-medium">{prospect.largo_aprox}</p>
              </div>
            </div>
          )}

          {/* Información financiera y fecha */}
          {(prospect.importe_previsto || prospect.fecha_entrega_deseada) && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                {prospect.importe_previsto && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <DollarSign className="h-4 w-4" />
                      <span>Importe previsto</span>
                    </div>
                    <p className="font-semibold text-lg">
                      {formatCurrency(prospect.importe_previsto)}
                    </p>
                  </div>
                )}

                {prospect.fecha_entrega_deseada && (
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-4 w-4" />
                      <span>Fecha de entrega</span>
                    </div>
                    <p className="font-medium">
                      {formatDate(prospect.fecha_entrega_deseada)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observaciones */}
          {prospect.observaciones && (
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">OBSERVACIONES</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {prospect.observaciones}
              </p>
            </div>
          )}

          {/* Fecha de creación */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Proyecto creado el {formatDate(prospect.created_at)}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
