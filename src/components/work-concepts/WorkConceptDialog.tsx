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
import { Separator } from "@/components/ui/separator";
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
import { calcularPrecioMaterial } from "@/lib/material-utils";

interface WorkConceptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  concept: WorkConcept | null;
  onSaved: () => void;
}

const formatCurrency = (value: string): string => {
  const numericValue = value.replace(/[^\d.]/g, '');
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    return formatCurrency(parts[0] + '.' + parts.slice(1).join(''));
  }
  if (numericValue === '') return '';
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';
  return '$' + integerPart + decimalPart;
};

const unformatCurrency = (value: string): string => {
  return value.replace(/[^\d.]/g, '');
};

const formatPercentage = (value: string): string => {
  const numericValue = value.replace(/[^\d.]/g, '');
  const parts = numericValue.split('.');
  if (parts.length > 2) {
    return formatPercentage(parts[0] + '.' + parts.slice(1).join(''));
  }
  if (numericValue === '') return '';
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimalPart = parts.length > 1 ? '.' + parts[1].slice(0, 2) : '';
  return integerPart + decimalPart + '%';
};

const unformatPercentage = (value: string): string => {
  return value.replace(/[^\d.]/g, '');
};

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
    unidad_medida: "unidad",
    es_precio_variable: false,
    activo: true,
    tipo_margen: "porcentaje",
    valor_margen: "",
    redondeo: "ninguno",
    redondeo_multiplo: "",
  });

  useEffect(() => {
    if (!open) return;

    if (concept) {
      // Infer margin type from existing data
      const costo = concept.costo_base;
      const precio = concept.precio_venta_base;
      let tipoMargen = "porcentaje";
      let valorMargen = "";

      if (costo > 0) {
        const diff = precio - costo;
        const pct = (diff / costo) * 100;
        // If percentage is a round-ish number, treat as percentage
        if (Math.abs(pct - Math.round(pct)) < 0.01 && pct >= 0) {
          tipoMargen = "porcentaje";
          valorMargen = formatPercentage(String(Math.round(pct)));
        } else {
          tipoMargen = "fijo";
          valorMargen = formatCurrency(String(diff));
        }
      } else if (precio > 0) {
        tipoMargen = "fijo";
        valorMargen = formatCurrency(String(precio));
      }

      setFormData({
        nombre: concept.nombre,
        descripcion: concept.descripcion || "",
        area: concept.area,
        costo_base: formatCurrency(String(concept.costo_base)),
        unidad_medida: concept.unidad_medida,
        es_precio_variable: concept.es_precio_variable,
        activo: concept.activo,
        tipo_margen: tipoMargen,
        valor_margen: valorMargen,
        redondeo: "ninguno",
        redondeo_multiplo: "",
      });
    } else {
      setFormData({
        nombre: "",
        descripcion: "",
        area: "taller",
        costo_base: "",
        unidad_medida: "unidad",
        es_precio_variable: false,
        activo: true,
        tipo_margen: "porcentaje",
        valor_margen: "",
        redondeo: "ninguno",
        redondeo_multiplo: "",
      });
    }
  }, [concept, open]);

  const update = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const costoNumerico = parseFloat(unformatCurrency(formData.costo_base)) || 0;
  const margenNumerico = parseFloat(unformatPercentage(formData.valor_margen)) || 0;
  const multiploNumerico = parseFloat(unformatCurrency(formData.redondeo_multiplo)) || 1;
  const precioCalculado = calcularPrecioMaterial(
    costoNumerico, formData.tipo_margen, margenNumerico, formData.redondeo, multiploNumerico
  );

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    if (costoNumerico < 0) {
      toast.error("El costo base debe ser un valor válido");
      return;
    }

    setSaving(true);

    try {
      const data = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || null,
        area: formData.area,
        costo_base: costoNumerico,
        precio_venta_base: precioCalculado,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {concept ? "Editar Concepto" : "Nuevo Concepto de Mano de Obra"}
          </DialogTitle>
          <DialogDescription>
            {concept
              ? "Modifica los datos del concepto de mano de obra"
              : "Define un nuevo concepto de mano de obra para diseño o taller"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              placeholder="Ej: Montaje de piedra"
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => update("descripcion", e.target.value)}
              placeholder="Descripción opcional del concepto..."
              rows={2}
            />
          </div>

          {/* Área */}
          <div className="space-y-2">
            <Label>Área *</Label>
            <Select
              value={formData.area}
              onValueChange={(value: WorkArea) => update("area", value)}
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

          {/* Unidad de medida */}
          <div className="space-y-2">
            <Label>Unidad de medida</Label>
            <Select
              value={formData.unidad_medida}
              onValueChange={(value) => update("unidad_medida", value)}
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

          <Separator />

          {/* Costo base */}
          <div className="space-y-2">
            <Label htmlFor="costo_base">Costo base por unidad ($) *</Label>
            <Input
              id="costo_base"
              type="text"
              value={formData.costo_base}
              onChange={(e) => update("costo_base", formatCurrency(e.target.value))}
              placeholder="$0.00"
            />
            <p className="text-xs text-muted-foreground">
              Lo que pagas al artesano/diseñador
            </p>
          </div>

          {/* Tipo de margen */}
          <div className="space-y-2">
            <Label>Tipo de margen</Label>
            <Select
              value={formData.tipo_margen}
              onValueChange={(v) => {
                const rawVal = unformatPercentage(formData.valor_margen);
                const reformatted = rawVal
                  ? (v === "porcentaje" ? formatPercentage(rawVal) : formatCurrency(rawVal))
                  : "";
                setFormData((prev) => ({ ...prev, tipo_margen: v, valor_margen: reformatted }));
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                <SelectItem value="fijo">Cantidad fija ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Valor de margen */}
          <div className="space-y-2">
            <Label htmlFor="valor_margen">
              Valor de margen {formData.tipo_margen === "porcentaje" ? "(%)" : "($)"}
            </Label>
            <Input
              id="valor_margen"
              type="text"
              value={formData.valor_margen}
              onChange={(e) =>
                update(
                  "valor_margen",
                  formData.tipo_margen === "porcentaje"
                    ? formatPercentage(e.target.value)
                    : formatCurrency(e.target.value)
                )
              }
              placeholder={formData.tipo_margen === "porcentaje" ? "0%" : "$0.00"}
            />
          </div>

          <Separator />

          {/* Redondeo */}
          <div className="space-y-2">
            <Label>Redondeo</Label>
            <Select value={formData.redondeo} onValueChange={(v) => update("redondeo", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">Sin redondeo</SelectItem>
                <SelectItem value="superior">Redondeo superior</SelectItem>
                <SelectItem value="inferior">Redondeo inferior</SelectItem>
                <SelectItem value="mas_cercano">Al más cercano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.redondeo !== "ninguno" && (
            <div className="space-y-2">
              <Label htmlFor="redondeo_multiplo">Múltiplo de redondeo</Label>
              <Input
                id="redondeo_multiplo"
                type="text"
                value={formData.redondeo_multiplo}
                onChange={(e) => update("redondeo_multiplo", formatCurrency(e.target.value))}
                placeholder="$0.00"
              />
              <p className="text-xs text-muted-foreground">
                Ej: $10 redondeará a múltiplos de 10 ($10, $20, $30...)
              </p>
            </div>
          )}

          {/* Preview del precio */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Precio de venta resultante</p>
            <p className="text-2xl font-bold text-primary">${precioCalculado.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Lo que se cobrará al cliente
            </p>
          </div>

          <Separator />

          {/* Switches */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Precio variable según cantidad</Label>
                <p className="text-xs text-muted-foreground">
                  El precio final depende de la cantidad (ej: número de piedras)
                </p>
              </div>
              <Switch
                checked={formData.es_precio_variable}
                onCheckedChange={(checked) => update("es_precio_variable", checked)}
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
                onCheckedChange={(checked) => update("activo", checked)}
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
