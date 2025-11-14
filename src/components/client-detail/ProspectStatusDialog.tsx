import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

export const ProspectStatusDialog = ({
  prospect,
  open,
  onOpenChange,
  onSaved,
}: ProspectStatusDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState(prospect?.estado || "activo");
  const [saving, setSaving] = useState(false);

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

  // Update selected status when prospect changes
  useState(() => {
    if (prospect) {
      setSelectedStatus(prospect.estado);
    }
  });

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

        <div className="space-y-6 py-4">
          <RadioGroup
            value={selectedStatus}
            onValueChange={setSelectedStatus}
            disabled={isConverted}
          >
            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="activo" id="activo" />
              <Label htmlFor="activo" className="font-normal cursor-pointer">
                <div>
                  <p className="font-medium">Activo</p>
                  <p className="text-sm text-muted-foreground">
                    El proyecto está en seguimiento activo
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="en_pausa" id="en_pausa" />
              <Label htmlFor="en_pausa" className="font-normal cursor-pointer">
                <div>
                  <p className="font-medium">En Pausa</p>
                  <p className="text-sm text-muted-foreground">
                    El proyecto está temporalmente pausado
                  </p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 space-y-0">
              <RadioGroupItem value="inactivo" id="inactivo" />
              <Label htmlFor="inactivo" className="font-normal cursor-pointer">
                <div>
                  <p className="font-medium">Inactivo</p>
                  <p className="text-sm text-muted-foreground">
                    El proyecto no se continuará
                  </p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-3 pt-4">
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
