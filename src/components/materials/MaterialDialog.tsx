import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { calcularPrecioMaterial } from "@/lib/material-utils";

interface MaterialFormData {
  nombre: string;
  categoria: string;
  unidad_medida: string;
  costo_directo: string;
  tipo_margen: string;
  valor_margen: string;
  redondeo: string;
  redondeo_multiplo: string;
  activo: boolean;
  notas: string;
}

interface MaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: MaterialFormData) => void;
  initialData?: Record<string, any> | null;
  existingCategories: string[];
  loading?: boolean;
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

const defaultForm: MaterialFormData = {
  nombre: "",
  categoria: "",
  unidad_medida: "gramo",
  costo_directo: "",
  tipo_margen: "porcentaje",
  valor_margen: "",
  redondeo: "ninguno",
  redondeo_multiplo: "",
  activo: true,
  notas: "",
};

export function MaterialDialog({
  open, onOpenChange, onSubmit, initialData, existingCategories, loading,
}: MaterialDialogProps) {
  const [form, setForm] = useState<MaterialFormData>(defaultForm);
  const isEditing = !!initialData;

  useEffect(() => {
    if (open) {
      const raw = initialData ? { ...defaultForm, ...initialData } : defaultForm;
      const tipoMargen = raw.tipo_margen || "porcentaje";
      const data = {
        ...raw,
        costo_directo: raw.costo_directo
          ? formatCurrency(String(raw.costo_directo))
          : "",
        valor_margen: raw.valor_margen
          ? (tipoMargen === "porcentaje"
              ? formatPercentage(String(raw.valor_margen))
              : formatCurrency(String(raw.valor_margen)))
          : "",
        redondeo_multiplo: raw.redondeo_multiplo
          ? formatCurrency(String(raw.redondeo_multiplo))
          : "",
      };
      setForm(data);
    }
  }, [open, initialData]);

  const costoNumerico = parseFloat(unformatCurrency(form.costo_directo)) || 0;
  const margenNumerico = parseFloat(unformatPercentage(form.valor_margen)) || 0;
  const multiploNumerico = parseFloat(unformatCurrency(form.redondeo_multiplo)) || 1;
  const precio = calcularPrecioMaterial(
    costoNumerico, form.tipo_margen, margenNumerico, form.redondeo, multiploNumerico
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      costo_directo: parseFloat(unformatCurrency(form.costo_directo)) || 0,
      valor_margen: parseFloat(unformatPercentage(form.valor_margen)) || 0,
      redondeo_multiplo: parseFloat(unformatCurrency(form.redondeo_multiplo)) || 1,
    } as any);
  };

  const update = (field: keyof MaterialFormData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Material" : "Nuevo Material"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Modifica los datos del material" : "Registra un nuevo material con su configuración de precio"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input id="nombre" value={form.nombre} onChange={(e) => update("nombre", e.target.value)} required />
          </div>

          {/* Categoría */}
          <div className="space-y-2">
            <Label>Categoría</Label>
            <Select
              value={form.categoria || "__none__"}
              onValueChange={(v) => update("categoria", v === "__none__" ? "" : v)}
            >
              <SelectTrigger><SelectValue placeholder="Selecciona una categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin categoría</SelectItem>
                <SelectItem value="Metales">Metales</SelectItem>
                <SelectItem value="Piedras Preciosas">Piedras Preciosas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unidad de medida */}
          <div className="space-y-2">
            <Label>Unidad de medida</Label>
            <Select value={form.unidad_medida} onValueChange={(v) => update("unidad_medida", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gramo">Gramo</SelectItem>
                <SelectItem value="quilate">Quilate</SelectItem>
                <SelectItem value="pieza">Pieza</SelectItem>
                <SelectItem value="onza">Onza</SelectItem>
                <SelectItem value="metro">Metro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Costo directo */}
          <div className="space-y-2">
            <Label htmlFor="costo">Costo directo por unidad ($)</Label>
            <Input
              id="costo"
              type="text"
              value={form.costo_directo}
              onChange={(e) => update("costo_directo", formatCurrency(e.target.value))}
              placeholder="$0.00"
            />
          </div>

          {/* Tipo de margen */}
          <div className="space-y-2">
            <Label>Tipo de margen</Label>
            <Select
              value={form.tipo_margen}
              onValueChange={(v) => {
                const rawVal = unformatPercentage(form.valor_margen);
                const reformatted = rawVal
                  ? (v === "porcentaje" ? formatPercentage(rawVal) : formatCurrency(rawVal))
                  : "";
                setForm((prev) => ({ ...prev, tipo_margen: v, valor_margen: reformatted }));
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
            <Label htmlFor="margen">
              Valor de margen {form.tipo_margen === "porcentaje" ? "(%)" : "($)"}
            </Label>
            <Input
              id="margen"
              type="text"
              value={form.valor_margen}
              onChange={(e) =>
                update(
                  "valor_margen",
                  form.tipo_margen === "porcentaje"
                    ? formatPercentage(e.target.value)
                    : formatCurrency(e.target.value)
                )
              }
              placeholder={form.tipo_margen === "porcentaje" ? "0%" : "$0.00"}
            />
          </div>

          <Separator />

          {/* Redondeo */}
          <div className="space-y-2">
            <Label>Redondeo</Label>
            <Select value={form.redondeo} onValueChange={(v) => update("redondeo", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ninguno">Sin redondeo</SelectItem>
                <SelectItem value="superior">Redondeo superior</SelectItem>
                <SelectItem value="inferior">Redondeo inferior</SelectItem>
                <SelectItem value="mas_cercano">Al más cercano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.redondeo !== "ninguno" && (
            <div className="space-y-2">
              <Label htmlFor="multiplo">Múltiplo de redondeo</Label>
              <Input
                id="multiplo"
                type="number"
                min={1}
                step="1"
                value={form.redondeo_multiplo || ""}
                onChange={(e) => update("redondeo_multiplo", parseFloat(e.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Ej: 10 redondeará a múltiplos de 10 ($10, $20, $30...)
              </p>
            </div>
          )}

          {/* Preview del precio */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Precio resultante por unidad</p>
            <p className="text-2xl font-bold text-primary">${precio.toLocaleString()}</p>
          </div>

          <Separator />

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={form.notas}
              onChange={(e) => update("notas", e.target.value)}
              rows={2}
            />
          </div>

          {/* Activo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="activo">Material activo</Label>
            <Switch id="activo" checked={form.activo} onCheckedChange={(v) => update("activo", v)} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !form.nombre}>
              {isEditing ? "Guardar cambios" : "Crear material"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
