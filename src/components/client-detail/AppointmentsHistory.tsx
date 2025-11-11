import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Appointment {
  id: string;
  fecha: string;
  tipo: string;
  estado: string;
  notas: string | null;
  created_at: string;
}

interface AppointmentsHistoryProps {
  clientId: string;
}

export const AppointmentsHistory = ({ clientId }: AppointmentsHistoryProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, [clientId]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("client_id", clientId)
        .order("fecha", { ascending: false });

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      toast.error("Error al cargar las citas");
    } finally {
      setLoading(false);
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

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "completada":
        return "bg-success/10 text-success";
      case "cancelada":
        return "bg-destructive/10 text-destructive";
      case "programada":
        return "bg-primary/10 text-primary";
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

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay citas registradas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {appointments.map((appointment) => (
        <Card key={appointment.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg capitalize">{appointment.tipo}</CardTitle>
              <Badge className={getStatusColor(appointment.estado)}>
                {appointment.estado}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDate(appointment.fecha)}</span>
            </div>
            {appointment.notas && (
              <div className="text-sm">
                <p className="font-medium mb-1">Notas:</p>
                <p className="text-muted-foreground">{appointment.notas}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
