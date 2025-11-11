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
  color_oro: string | null;
  pureza_oro: string | null;
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
      toast.error("Error al cargar los prospectos");
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
          <p className="text-muted-foreground">No hay prospectos registrados</p>
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
              <CardTitle className="text-lg capitalize">
                {prospect.tipo_accesorio || "Tipo no especificado"}
                {prospect.subtipo_accesorio && ` - ${prospect.subtipo_accesorio}`}
              </CardTitle>
              <Badge className={getStatusColor(prospect.estado)}>
                {prospect.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Piedra:</p>
                <p className="font-medium">{prospect.tipo_piedra || "N/A"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Oro:</p>
                <p className="font-medium">
                  {prospect.color_oro && prospect.pureza_oro
                    ? `${prospect.color_oro} ${prospect.pureza_oro}`
                    : "N/A"}
                </p>
              </div>
            </div>

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

            {prospect.observaciones && (
              <div className="text-sm">
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
