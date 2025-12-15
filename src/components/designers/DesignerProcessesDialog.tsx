import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Designer, DesignerProcess } from "@/types/designers";
import { WorkConcept } from "@/types/work-concepts";

interface DesignerProcessesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designer: Designer;
  onSaved: () => void;
}

interface ProcessFormData {
  work_concept_id: string;
  enabled: boolean;
  costo_acordado: number;
  tiempo_estimado_dias: number | null;
}

export function DesignerProcessesDialog({ open, onOpenChange, designer, onSaved }: DesignerProcessesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [workConcepts, setWorkConcepts] = useState<WorkConcept[]>([]);
  const [existingProcesses, setExistingProcesses] = useState<DesignerProcess[]>([]);
  const [formData, setFormData] = useState<ProcessFormData[]>([]);

  useEffect(() => {
    if (open && designer) {
      fetchData();
    }
  }, [open, designer]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch work concepts with area "diseño"
      const { data: concepts, error: conceptsError } = await supabase
        .from("work_concepts")
        .select("*")
        .eq("area", "diseño")
        .eq("activo", true)
        .order("nombre");

      if (conceptsError) throw conceptsError;

      // Fetch existing designer processes
      const { data: processes, error: processesError } = await supabase
        .from("designer_processes")
        .select("*")
        .eq("designer_id", designer.id);

      if (processesError) throw processesError;

      setWorkConcepts(concepts || []);
      setExistingProcesses(processes || []);

      // Initialize form data
      const initialData: ProcessFormData[] = (concepts || []).map(concept => {
        const existing = (processes || []).find(p => p.work_concept_id === concept.id);
        return {
          work_concept_id: concept.id,
          enabled: !!existing,
          costo_acordado: existing?.costo_acordado || concept.costo_base || 0,
          tiempo_estimado_dias: existing?.tiempo_estimado_dias || null
        };
      });

      setFormData(initialData);
    } catch (error: any) {
      toast.error("Error al cargar procesos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Delete existing processes
      const { error: deleteError } = await supabase
        .from("designer_processes")
        .delete()
        .eq("designer_id", designer.id);

      if (deleteError) throw deleteError;

      // Insert enabled processes
      const enabledProcesses = formData
        .filter(p => p.enabled)
        .map(p => ({
          designer_id: designer.id,
          work_concept_id: p.work_concept_id,
          costo_acordado: p.costo_acordado,
          tiempo_estimado_dias: p.tiempo_estimado_dias
        }));

      if (enabledProcesses.length > 0) {
        const { error: insertError } = await supabase
          .from("designer_processes")
          .insert(enabledProcesses);

        if (insertError) throw insertError;
      }

      toast.success("Procesos actualizados correctamente");
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar procesos");
    } finally {
      setSaving(false);
    }
  };

  const updateProcess = (conceptId: string, field: keyof ProcessFormData, value: any) => {
    setFormData(prev => prev.map(p => 
      p.work_concept_id === conceptId ? { ...p, [field]: value } : p
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Procesos de Diseño - {designer.nombre}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando procesos...</div>
        ) : workConcepts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No hay conceptos de trabajo con área "diseño" disponibles
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona los procesos de diseño que realiza este diseñador y especifica los costos acordados.
            </p>

            <div className="border rounded-lg divide-y">
              {workConcepts.map((concept) => {
                const processData = formData.find(p => p.work_concept_id === concept.id);
                if (!processData) return null;

                return (
                  <div key={concept.id} className="p-4 flex items-center gap-4">
                    <Checkbox
                      checked={processData.enabled}
                      onCheckedChange={(checked) => 
                        updateProcess(concept.id, "enabled", checked)
                      }
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{concept.nombre}</p>
                      {concept.descripcion && (
                        <p className="text-sm text-muted-foreground truncate">
                          {concept.descripcion}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-32">
                        <Input
                          type="number"
                          placeholder="Costo"
                          value={processData.costo_acordado || ""}
                          onChange={(e) => 
                            updateProcess(concept.id, "costo_acordado", parseFloat(e.target.value) || 0)
                          }
                          disabled={!processData.enabled}
                          className="text-right"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12">MXN</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Días"
                          value={processData.tiempo_estimado_dias || ""}
                          onChange={(e) => 
                            updateProcess(concept.id, "tiempo_estimado_dias", parseInt(e.target.value) || null)
                          }
                          disabled={!processData.enabled}
                          className="text-right"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-10">días</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Guardando..." : "Guardar Procesos"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
