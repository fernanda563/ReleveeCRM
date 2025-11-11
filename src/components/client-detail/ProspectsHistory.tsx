import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gem, DollarSign, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

interface ProspectsHistoryProps {
  clientId: string;
}

export const ProspectsHistory = ({ clientId }: ProspectsHistoryProps) => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProspects();
  }, [clientId]);

  const fetchProspects = async () => {
    try {
      const { data, error } = await supabase
        .from("prospects")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error) {
      console.error("Error fetching prospects:", error);
      toast.error("Error al cargar las wish lists");
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (prospects.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gem className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay wish lists registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {prospects.map((prospect) => (
        <Card key={prospect.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg capitalize">
                  {prospect.tipo_accesorio || "Tipo no especificado"}
                  {prospect.subtipo_accesorio && ` - ${prospect.subtipo_accesorio}`}
                </CardTitle>
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
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Sección de Metal */}
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
            
            {/* Sección de Piedra */}
            {prospect.incluye_piedra === "si" && prospect.tipo_piedra && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">PIEDRA</p>
                <div className="text-sm">
                  <p className="text-muted-foreground">Tipo:</p>
                  <p className="font-medium capitalize">{prospect.tipo_piedra}</p>
                </div>
              </div>
            )}
            
            {/* Largo aproximado (para collares/pulseras) */}
            {prospect.largo_aprox && (
              <div className="text-sm">
                <p className="text-muted-foreground">Largo aproximado:</p>
                <p className="font-medium">{prospect.largo_aprox}</p>
              </div>
            )}
            
            {/* Información financiera y fecha */}
            {(prospect.importe_previsto || prospect.fecha_entrega_deseada) && (
              <div className="flex flex-wrap gap-3 pt-2 border-t">
                {prospect.importe_previsto && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatCurrency(prospect.importe_previsto)}
                    </span>
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
            
            {/* Observaciones */}
            {prospect.observaciones && (
              <div className="text-sm pt-2 border-t">
                <p className="font-medium mb-1">Observaciones:</p>
                <p className="text-muted-foreground">{prospect.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
