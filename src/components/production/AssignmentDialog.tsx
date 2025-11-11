import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  nombre: string;
  apellido_paterno: string;
}

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentDisenadorId: string | null;
  currentJoyeroId: string | null;
  onSuccess: () => void;
}

export const AssignmentDialog = ({
  open,
  onOpenChange,
  orderId,
  currentDisenadorId,
  currentJoyeroId,
  onSuccess,
}: AssignmentDialogProps) => {
  const [disenadores, setDisenadores] = useState<Profile[]>([]);
  const [joyeros, setJoyeros] = useState<Profile[]>([]);
  const [disenadorId, setDisenadorId] = useState(currentDisenadorId || "");
  const [joyeroId, setJoyeroId] = useState(currentJoyeroId || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setDisenadorId(currentDisenadorId || "");
      setJoyeroId(currentJoyeroId || "");
      fetchUsers();
    }
  }, [open, currentDisenadorId, currentJoyeroId]);

  const fetchUsers = async () => {
    try {
      // Fetch designers - get user IDs with designer role first
      const { data: disenadorRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "disenador");

      const disenadorIds = disenadorRoles?.map((r) => r.user_id) || [];

      if (disenadorIds.length > 0) {
        const { data: disenadorData } = await supabase
          .from("profiles")
          .select("id, nombre, apellido_paterno")
          .in("id", disenadorIds);
        
        setDisenadores(disenadorData || []);
      }

      // Fetch jewelers - get user IDs with jeweler role first
      const { data: joyeroRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "joyero");

      const joyeroIds = joyeroRoles?.map((r) => r.user_id) || [];

      if (joyeroIds.length > 0) {
        const { data: joyeroData } = await supabase
          .from("profiles")
          .select("id, nombre, apellido_paterno")
          .in("id", joyeroIds);
        
        setJoyeros(joyeroData || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updates: any = {};
      if (disenadorId) updates.disenador_id = disenadorId;
      if (joyeroId) updates.joyero_id = joyeroId;

      const { error } = await supabase
        .from("orders")
        .update(updates)
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Asignaciones actualizadas");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating assignments:", error);
      toast.error("Error al actualizar las asignaciones");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Diseñador y Joyero</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="disenador">Diseñador</Label>
            <Select value={disenadorId} onValueChange={setDisenadorId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar diseñador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {disenadores.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre} {d.apellido_paterno}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="joyero">Joyero</Label>
            <Select value={joyeroId} onValueChange={setJoyeroId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar joyero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Sin asignar</SelectItem>
                {joyeros.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    {j.nombre} {j.apellido_paterno}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Asignaciones"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
