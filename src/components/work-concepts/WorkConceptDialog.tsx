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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { WorkConcept, WorkArea, UNIT_MEASURES } from "@/types/work-concepts";

interface WorkConceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concept: WorkConcept | null;
  onSaved: () => void;
}

export const WorkConceptDialog = ({
  open,
  onOpenChange,
  concept,
  onSaved,
}: WorkConceptDialogProps) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    area: "taller" as WorkArea,
    costo_base: "",
    precio_venta_base: "",
    unidad_medida: "unidad",
    es_precio_variable: false,
    activo: true,
  });

  useEffect(() => {
    if (concept) {
      setFormData({
        nombre: concept.nombre,
        descripcion: concept.descripcion || "",
        area: concept.area,
        costo_base: concept.costo_base.toString(),
        precio_venta_base: concept.precio_venta_base.toString(),
        unidad_medida: concept.unidad_medida,
        es_precio_variable: concept.es_precio_variable,
        activo: concept.activo,
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        area: "taller",
        costo_base: "",
        precio_venta_base: "",
        unidad_medida: "unidad",
        es_precio_variable: false,
        activo: true,
      });
    }
  }, [concept, open]);

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (!formData.costo_base || parseFloat(formData.costo_base) < 0) {
      toast.error("El costo base debe ser un valor válido");
      return;
    }

    if (!formData.precio_venta_base || parseFloat(formData.precio_venta_base) < 0) {
      toast.error("El precio de venta base debe ser un valor válido");
      return;
    }

    setSaving(true);

    try {
      const data = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        area: formData.area,
        costo_base: parseFloat(formData.costo_base),
        precio_venta_base: parseFloat(formData.precio_venta_base),
        unidad_medida: formData.unidad_medida,
        es_precio_variable: formData.es_precio_variable,
        activo: formData.activo,
      };

      if (concept) {
        const { error } = await supabase
          .from("work_concepts")
          .update(data)
          .eq("id", concept.id);

        if (error) throw error;
        toast.success("Concepto actualizado correctamente");
      } else {
        const { error } = await supabase.from("work_concepts").insert(data);

        if (error) throw error;
        toast.success("Concepto creado correctamente");
      }

      onSaved();
    } catch (error: any) {
      console.error("Error saving concept:", error);
      toast.error(error.message || "Error al guardar el concepto");
    } finally {
      setSaving(false);
    }
  };

  const margin =
    formData.precio_venta_base && formData.costo_base
      ? parseFloat(formData.precio_venta_base) - parseFloat(formData.costo_base)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {concept ? "Editar Concepto" : "Nuevo Concepto de Trabajo"}
          </DialogTitle>
          <DialogDescription>
            {concept
              ? "Modifica los datos del concepto de trabajo"
              : "Define un nuevo concepto de trabajo para diseño o taller"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              placeholder="Ej: Montaje de piedra"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Descripción opcional del concepto..."
              rows={2}
            />
          </div>

          {/* Área */}
          <div className="space-y-2">
            <Label>Área *</Label>
            <Select
              value={formData.area}
              onValueChange={(value: WorkArea) =>
                setFormData({ ...formData, area: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar área" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="diseño">Diseño</SelectItem>
                <SelectItem value="taller">Taller</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Costo y Precio */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costo_base">Costo base *</Label>
              <Input
                id="costo_base"
                type="number"
                min="0"
                step="0.01"
                value={formData.costo_base}
                onChange={(e) =>
                  setFormData({ ...formData, costo_base: e.target.value })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Lo que pagas al artesano/diseñador
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio_venta_base">Precio de venta *</Label>
              <Input
                id="precio_venta_base"
                type="number"
                min="0"
                step="0.01"
                value={formData.precio_venta_base}
                onChange={(e) =>
                  setFormData({ ...formData, precio_venta_base: e.target.value })
                }
                placeholder="0.00"
              />
              <p className="text-xs text-muted-foreground">
                Lo que cobras al cliente
              </p>
            </div>
          </div>

          {/* Margen */}
          {formData.costo_base && formData.precio_venta_base && (
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">
                Margen de ganancia:{" "}
                <span
                  className={`font-semibold ${
                    margin >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  ${margin.toFixed(2)}
                </span>
              </p>
            </div>
          )}

          {/* Unidad de medida */}
          <div className="space-y-2">
            <Label>Unidad de medida</Label>
            <Select
              value={formData.unidad_medida}
              onValueChange={(value) =>
                setFormData({ ...formData, unidad_medida: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar unidad" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_MEASURES.map((unit) => (
                  <SelectItem key={unit.value} value={unit.value}>
                    {unit.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Switches */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Precio variable según cantidad</Label>
                <p className="text-xs text-muted-foreground">
                  El precio final depende de la cantidad (ej: número de piedras)
                </p>
              </div>
              <Switch
                checked={formData.es_precio_variable}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, es_precio_variable: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Concepto activo</Label>
                <p className="text-xs text-muted-foreground">
                  Solo los conceptos activos pueden agregarse a órdenes
                </p>
              </div>
              <Switch
                checked={formData.activo}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, activo: checked })
                }
              />
            </div>
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
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {concept ? "Guardar cambios" : "Crear concepto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
