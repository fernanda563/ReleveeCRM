import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { calcularPrecioMaterial } from "@/lib/material-utils";

interface Material {
  id: string;
  nombre: string;
  categoria: string | null;
  unidad_medida: string;
  costo_directo: number;
  tipo_margen: string;
  valor_margen: number;
  redondeo: string;
  redondeo_multiplo: number | null;
  activo: boolean | null;
  tipo_material: string | null;
  kilataje: string | null;
  color: string | null;
}

export interface QuoteMaterialItem {
  referencia_id: string;
  nombre: string;
  unidad_medida: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
}

interface QuoteMaterialsEditorProps {
  items: QuoteMaterialItem[];
  onItemsChange: (items: QuoteMaterialItem[]) => void;
}

export const QuoteMaterialsEditor = ({
  items,
  onItemsChange,
}: QuoteMaterialsEditorProps) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const fetchMaterials = async () => {
      const { data } = await supabase
        .from("materials")
        .select("*")
        .eq("activo", true)
        .order("categoria")
        .order("nombre");
      if (data) setMaterials(data as Material[]);
    };
    fetchMaterials();
  }, []);

  const handleAdd = () => {
    if (!selectedId) return;
    const mat = materials.find((m) => m.id === selectedId);
    if (!mat) return;

    const precioVenta = calcularPrecioMaterial(
      mat.costo_directo,
      mat.tipo_margen,
      mat.valor_margen,
      mat.redondeo,
      mat.redondeo_multiplo ?? 1
    );

    onItemsChange([
      ...items,
      {
        referencia_id: mat.id,
        nombre: mat.nombre,
        unidad_medida: mat.unidad_medida,
        cantidad: 1,
        costo_unitario: mat.costo_directo,
        precio_unitario: precioVenta,
      },
    ]);
    setSelectedId("");
  };

  const handleRemove = (index: number) => {
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const handleQuantityChange = (index: number, val: number) => {
    const updated = [...items];
    updated[index] = { ...updated[index], cantidad: Math.max(0.01, val) };
    onItemsChange(updated);
  };

  const unitLabel = (unit: string) => {
    const map: Record<string, string> = {
      gramo: "g",
      quilate: "ct",
      pieza: "pz",
      onza: "oz",
      metro: "m",
    };
    return map[unit] || unit;
  };

  const formatMaterialLabel = (m: Material) => {
    const parts = [m.nombre];
    if (m.kilataje) parts.push(m.kilataje);
    if (m.color) parts.push(m.color);
    return parts.join(" ");
  };

  // Group materials by categoria
  const grouped = materials.reduce<Record<string, Material[]>>((acc, m) => {
    const key = m.categoria || "Sin categoría";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Seleccionar material del catálogo" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(grouped).map(([cat, mats]) => (
              <SelectGroup key={cat}>
                <SelectLabel>{cat}</SelectLabel>
                {mats.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <span className="flex items-center gap-2">
                      {formatMaterialLabel(m)} — ${m.costo_directo.toLocaleString("es-MX")}/{unitLabel(m.unidad_medida)}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={!selectedId} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Agrega materiales desde el catálogo
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const subtotal = item.cantidad * item.precio_unitario;
            return (
              <Card key={index}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{item.nombre}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleRemove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="space-y-1">
                      <Label className="text-xs">Cantidad ({unitLabel(item.unidad_medida)})</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={item.cantidad}
                        onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0.01)}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Costo unit.</Label>
                      <div className="h-8 px-2 flex items-center bg-muted rounded-md text-xs">
                        ${item.costo_unitario.toLocaleString("es-MX")}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Precio unit.</Label>
                      <div className="h-8 px-2 flex items-center bg-muted rounded-md text-xs">
                        ${item.precio_unitario.toLocaleString("es-MX")}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Subtotal</Label>
                      <div className="h-8 px-2 flex items-center bg-primary/10 rounded-md text-xs font-semibold">
                        ${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
