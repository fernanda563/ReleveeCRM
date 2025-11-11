import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gem, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProspectDetailDialog } from "./ProspectDetailDialog";
import { ProspectCard } from "./ProspectCard";

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
  updated_at: string;
}

interface ProspectsHistoryProps {
  clientId: string;
}

export const ProspectsHistory = ({ clientId }: ProspectsHistoryProps) => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

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
      toast.error("Error al cargar los proyectos");
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
          <p className="text-muted-foreground">No hay proyectos registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {prospects.map((prospect) => (
          <ProspectCard
            key={prospect.id}
            prospect={prospect}
            onClick={() => setSelectedProspect(prospect)}
            className="w-full"
          />
        ))}
      </div>

    <ProspectDetailDialog
      prospect={selectedProspect}
      open={!!selectedProspect}
      onOpenChange={(open) => !open && setSelectedProspect(null)}
      onSaved={() => fetchProspects()}
    />
    </>
  );
};
