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
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";

interface WorkConcept {
  id: string;
  nombre: string;
  area: string;
  unidad_medida: string;
  costo_base: number;
  precio_venta_base: number;
  es_precio_variable: boolean;
  activo: boolean;
}

export interface QuoteLaborItem {
  referencia_id: string;
  nombre: string;
  unidad_medida: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
}

interface QuoteLaborEditorProps {
  items: QuoteLaborItem[];
  onItemsChange: (items: QuoteLaborItem[]) => void;
}

const AREA_LABELS: Record<string, string> = {
  diseño: "Diseño",
  taller: "Taller",
};

export const QuoteLaborEditor = ({
  items,
  onItemsChange,
}: QuoteLaborEditorProps) => {
  const [concepts, setConcepts] = useState<WorkConcept[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("work_concepts")
        .select("*")
        .eq("activo", true)
        .order("area")
        .order("nombre");
      if (data) setConcepts(data as WorkConcept[]);
    };
    fetch();
  }, []);

  const handleAdd = () => {
    if (!selectedId) return;
    const concept = concepts.find((c) => c.id === selectedId);
    if (!concept) return;

    onItemsChange([
      ...items,
      {
        referencia_id: concept.id,
        nombre: concept.nombre,
        unidad_medida: concept.unidad_medida,
        cantidad: 1,
        costo_unitario: concept.costo_base,
        precio_unitario: concept.precio_venta_base,
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

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Seleccionar concepto de mano de obra" />
          </SelectTrigger>
          <SelectContent>
            {concepts.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    [{AREA_LABELS[c.area] || c.area}]
                  </span>
                  {c.nombre} — ${c.precio_venta_base.toLocaleString("es-MX")}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAdd} disabled={!selectedId} size="icon">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Agrega conceptos de mano de obra
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
                      <Label className="text-xs">Cantidad ({item.unidad_medida})</Label>
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
