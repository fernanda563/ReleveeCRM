import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Reminder {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_recordatorio: string;
  completado: boolean;
  created_at: string;
}

interface RemindersHistoryProps {
  clientId: string;
}

export const RemindersHistory = ({ clientId }: RemindersHistoryProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
  }, [clientId]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("client_id", clientId)
        .order("fecha_recordatorio", { ascending: false });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
      toast.error("Error al cargar los recordatorios");
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (reminderId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .update({ completado: !currentStatus })
        .eq("id", reminderId);

      if (error) throw error;
      toast.success(
        !currentStatus ? "Recordatorio completado" : "Recordatorio marcado como pendiente"
      );
      fetchReminders();
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Error al actualizar el recordatorio");
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

  if (reminders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No hay recordatorios registrados</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reminders.map((reminder) => (
        <Card key={reminder.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{reminder.titulo}</CardTitle>
              <Badge
                variant={reminder.completado ? "default" : "outline"}
                className={
                  reminder.completado
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }
              >
                {reminder.completado ? "Completado" : "Pendiente"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{formatDate(reminder.fecha_recordatorio)}</span>
            </div>

            {reminder.descripcion && (
              <div className="text-sm">
                <p className="text-muted-foreground">{reminder.descripcion}</p>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleComplete(reminder.id, reminder.completado)}
              className="w-full"
            >
              {reminder.completado ? (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Marcar como pendiente
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como completado
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
