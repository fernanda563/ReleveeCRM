import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Gem, Bell, ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProspectCard } from "./ProspectCard";
import { cn } from "@/lib/utils";

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

interface TimelineEvent {
  id: string;
  type: "appointment" | "prospect" | "reminder" | "order";
  title: string;
  description: string;
  date: string;
  status?: string;
  prospectData?: Prospect;
}

interface ClientTimelineProps {
  clientId: string;
}

export const ClientTimeline = ({ clientId }: ClientTimelineProps) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [clientId]);

  const fetchTimeline = async () => {
    try {
      // Fetch all related data
      const [appointments, prospects, reminders, orders] = await Promise.all([
        supabase
          .from("appointments")
          .select("*")
          .eq("client_id", clientId)
          .order("fecha", { ascending: false }),
        supabase
          .from("prospects")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
        supabase
          .from("reminders")
          .select("*")
          .eq("client_id", clientId)
          .order("fecha_recordatorio", { ascending: false }),
        supabase
          .from("orders")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false }),
      ]);

      const timelineEvents: TimelineEvent[] = [];

      // Add appointments
      appointments.data?.forEach((apt) => {
        timelineEvents.push({
          id: apt.id,
          type: "appointment",
          title: `Cita ${apt.tipo}`,
          description: apt.notas || "Sin notas",
          date: apt.fecha,
          status: apt.estado,
        });
      });

      // Add prospects
      prospects.data?.forEach((pros) => {
        timelineEvents.push({
          id: pros.id,
          type: "prospect",
          title: "Proyecto registrado",
          description: `${pros.tipo_accesorio || "N/A"}${pros.subtipo_accesorio ? ` - ${pros.subtipo_accesorio}` : ""}`,
          date: pros.created_at,
          status: pros.estado,
          prospectData: pros,
        });
      });

      // Add reminders
      reminders.data?.forEach((rem) => {
        timelineEvents.push({
          id: rem.id,
          type: "reminder",
          title: rem.titulo,
          description: rem.descripcion || "Sin descripción",
          date: rem.fecha_recordatorio,
          status: rem.completado ? "completado" : "pendiente",
        });
      });

      // Add orders
      orders.data?.forEach((order) => {
        timelineEvents.push({
          id: order.id,
          type: "order",
          title: "Orden de compra",
          description: `${order.metal_tipo} - ${order.piedra_tipo}`,
          date: order.created_at,
          status: order.estatus_pago,
        });
      });

      // Sort all events by date
      timelineEvents.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setEvents(timelineEvents);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      toast.error("Error al cargar el timeline");
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment":
        return <Calendar className="h-5 w-5" />;
      case "prospect":
        return <Gem className="h-5 w-5" />;
      case "reminder":
        return <Bell className="h-5 w-5" />;
      case "order":
        return <ShoppingCart className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "appointment":
        return "bg-success/10 text-success";
      case "prospect":
        return "bg-warning/10 text-warning";
      case "reminder":
        return "bg-primary/10 text-primary";
      case "order":
        return "bg-accent/10 text-accent";
      default:
        return "bg-muted";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No hay interacciones registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="relative space-y-6">
        {events.map((event, index) => (
          <div key={event.id} className="relative">
            {/* Connector line - shown for all items except the last one */}
            {index !== events.length - 1 && (
              <div className="absolute left-6 top-[3.5rem] bottom-0 w-0.5 bg-border translate-y-2" />
            )}
            
            {/* Si es proyecto, usar ProspectCard */}
            {event.type === "prospect" && event.prospectData ? (
              <div className="relative pl-14">
                <div className="absolute left-0 top-4 p-3 rounded-full bg-primary/10 flex-shrink-0">
                  <Gem className="h-5 w-5 text-primary" />
                </div>
                <ProspectCard
                  prospect={event.prospectData}
                  className="w-full"
                />
              </div>
            ) : (
              /* Otros eventos con la tarjeta original */
              <div className="relative pl-14">
                <div className={`absolute left-0 top-4 p-3 rounded-full ${getTypeColor(event.type)} flex-shrink-0`}>
                  {getIcon(event.type)}
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{event.title}</h4>
                        <p className="text-sm text-muted-foreground">{event.description}</p>
                      </div>
                      {event.status && (
                        <Badge variant="outline">{event.status}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.date)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
};
