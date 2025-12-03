import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Prospect } from "./ProspectCard";

interface ProspectStatusDialogProps {
  prospect: Prospect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const PROJECT_STATUS = [
  { value: "activo", label: "Activo" },
  { value: "en_pausa", label: "En pausa" },
  { value: "inactivo", label: "Inactivo" },
];

export const ProspectStatusDialog = ({
  prospect,
  open,
  onOpenChange,
  onSaved,
}: ProspectStatusDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState(prospect?.estado || "activo");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prospect) {
      setSelectedStatus(prospect.estado || "activo");
    }
  }, [prospect]);

  const handleSave = async () => {
    if (!prospect) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("prospects")
        .update({ estado: selectedStatus })
        .eq("id", prospect.id);

      if (error) throw error;

      toast.success("Estatus actualizado exitosamente");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating prospect status:", error);
      toast.error("Error al actualizar el estatus");
    } finally {
      setSaving(false);
    }
  };

  if (!prospect) return null;

  const isConverted = prospect.estado === "convertido";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Estatus del Proyecto</DialogTitle>
          <DialogDescription>
            {isConverted
              ? "Este proyecto ya ha sido convertido a orden y no puede modificarse."
              : "Selecciona el nuevo estatus para este proyecto."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="status-select">Estatus del proyecto</Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              disabled={isConverted}
            >
              <SelectTrigger id="status-select" className="w-full">
                <SelectValue placeholder="Seleccionar estatus" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || isConverted}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
