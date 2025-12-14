import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Workshop, WorkshopProcess } from "@/types/workshops";

interface WorkConcept {
  id: string;
  nombre: string;
  area: string;
  costo_base: number;
  unidad_medida: string;
}

interface WorkshopProcessesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshop: Workshop | null;
  onSuccess: () => void;
}

interface ProcessFormData {
  work_concept_id: string;
  enabled: boolean;
  costo_acordado: number;
  tiempo_estimado_dias: number | null;
}

export const WorkshopProcessesDialog = ({
  open,
  onOpenChange,
  workshop,
  onSuccess,
}: WorkshopProcessesDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workConcepts, setWorkConcepts] = useState<WorkConcept[]>([]);
  const [existingProcesses, setExistingProcesses] = useState<WorkshopProcess[]>([]);
  const [processesData, setProcessesData] = useState<Record<string, ProcessFormData>>({});

  useEffect(() => {
    if (open && workshop) {
      fetchData();
    }
  }, [open, workshop]);

  const fetchData = async () => {
    if (!workshop) return;
    setLoading(true);

    try {
      // Fetch work concepts for "taller" area
      const { data: concepts, error: conceptsError } = await supabase
        .from("work_concepts")
        .select("id, nombre, area, costo_base, unidad_medida")
        .eq("area", "taller")
        .eq("activo", true)
        .order("nombre");

      if (conceptsError) throw conceptsError;
      setWorkConcepts(concepts || []);

      // Fetch existing processes for this workshop
      const { data: processes, error: processesError } = await supabase
        .from("workshop_processes")
        .select("*")
        .eq("workshop_id", workshop.id);

      if (processesError) throw processesError;
      setExistingProcesses(processes || []);

      // Initialize form data
      const initialData: Record<string, ProcessFormData> = {};
      (concepts || []).forEach((concept) => {
        const existingProcess = (processes || []).find(
          (p) => p.work_concept_id === concept.id
        );
        initialData[concept.id] = {
          work_concept_id: concept.id,
          enabled: !!existingProcess,
          costo_acordado: existingProcess?.costo_acordado ?? concept.costo_base,
          tiempo_estimado_dias: existingProcess?.tiempo_estimado_dias ?? null,
        };
      });
      setProcessesData(initialData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workshop) return;
    setSaving(true);

    try {
      // Get enabled processes
      const enabledProcesses = Object.values(processesData).filter((p) => p.enabled);

      // Delete all existing processes for this workshop
      const { error: deleteError } = await supabase
        .from("workshop_processes")
        .delete()
        .eq("workshop_id", workshop.id);

      if (deleteError) throw deleteError;

      // Insert new processes
      if (enabledProcesses.length > 0) {
        const processesToInsert = enabledProcesses.map((p) => ({
          workshop_id: workshop.id,
          work_concept_id: p.work_concept_id,
          costo_acordado: p.costo_acordado,
          tiempo_estimado_dias: p.tiempo_estimado_dias,
          activo: true,
        }));

        const { error: insertError } = await supabase
          .from("workshop_processes")
          .insert(processesToInsert);

        if (insertError) throw insertError;
      }

      toast.success("Procesos actualizados exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving processes:", error);
      toast.error(error.message || "Error al guardar los procesos");
    } finally {
      setSaving(false);
    }
  };

  const updateProcess = (conceptId: string, field: keyof ProcessFormData, value: any) => {
    setProcessesData((prev) => ({
      ...prev,
      [conceptId]: {
        ...prev[conceptId],
        [field]: value,
      },
    }));
  };

  if (!workshop) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Procesos de {workshop.nombre}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : workConcepts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay conceptos de trabajo de tipo "taller" registrados.
            <br />
            Primero crea conceptos en Gestión de Conceptos.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona los procesos que realiza este taller y especifica el costo acordado para cada uno.
            </p>

            <div className="space-y-4">
              {workConcepts.map((concept) => {
                const processData = processesData[concept.id];
                if (!processData) return null;

                return (
                  <div
                    key={concept.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      processData.enabled ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id={`process-${concept.id}`}
                        checked={processData.enabled}
                        onCheckedChange={(checked) =>
                          updateProcess(concept.id, "enabled", !!checked)
                        }
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor={`process-${concept.id}`}
                            className="text-base font-medium cursor-pointer"
                          >
                            {concept.nombre}
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            Costo base: ${concept.costo_base.toLocaleString()} / {concept.unidad_medida}
                          </span>
                        </div>

                        {processData.enabled && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`costo-${concept.id}`} className="text-sm">
                                Costo Acordado *
                              </Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                  $
                                </span>
                                <Input
                                  id={`costo-${concept.id}`}
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={processData.costo_acordado}
                                  onChange={(e) =>
                                    updateProcess(
                                      concept.id,
                                      "costo_acordado",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="pl-7"
                                  required={processData.enabled}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`tiempo-${concept.id}`} className="text-sm">
                                Tiempo Estimado (días)
                              </Label>
                              <Input
                                id={`tiempo-${concept.id}`}
                                type="number"
                                min="0"
                                value={processData.tiempo_estimado_dias || ""}
                                onChange={(e) =>
                                  updateProcess(
                                    concept.id,
                                    "tiempo_estimado_dias",
                                    e.target.value ? parseInt(e.target.value) : null
                                  )
                                }
                                placeholder="Opcional"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
