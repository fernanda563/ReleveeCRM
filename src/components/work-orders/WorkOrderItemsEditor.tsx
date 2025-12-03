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
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { WorkConcept, WORK_AREA_LABELS } from "@/types/work-concepts";

interface WorkOrderItemData {
  id?: string;
  work_concept_id: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  notas: string;
  concept_name?: string;
}

interface WorkOrderItemsEditorProps {
  items: WorkOrderItemData[];
  onItemsChange: (items: WorkOrderItemData[]) => void;
}

export const WorkOrderItemsEditor = ({
  items,
  onItemsChange,
}: WorkOrderItemsEditorProps) => {
  const [concepts, setConcepts] = useState<WorkConcept[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState<string>("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");

  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    const { data } = await supabase
      .from("work_concepts")
      .select("*")
      .eq("activo", true)
      .order("area")
      .order("nombre");
    setConcepts((data as WorkConcept[]) || []);
  };

  const handleAddConcept = () => {
    if (!selectedConceptId) return;

    const concept = concepts.find((c) => c.id === selectedConceptId);
    if (!concept) return;

    const newItem: WorkOrderItemData = {
      work_concept_id: concept.id,
      cantidad: 1,
      costo_unitario: concept.costo_base,
      precio_unitario: concept.precio_venta_base,
      notas: "",
      concept_name: concept.nombre,
    };

    onItemsChange([...items, newItem]);
    setSelectedConceptId("");
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);
  };

  const handleQuantityChange = (index: number, cantidad: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], cantidad: Math.max(1, cantidad) };
    onItemsChange(newItems);
  };

  const handleStartEditPrice = (index: number) => {
    setEditingIndex(index);
    setEditingPrice(items[index].precio_unitario.toString());
  };

  const handleSavePrice = () => {
    if (editingIndex === null) return;

    const newPrice = parseFloat(editingPrice);
    if (isNaN(newPrice) || newPrice < 0) return;

    const newItems = [...items];
    newItems[editingIndex] = { ...newItems[editingIndex], precio_unitario: newPrice };
    onItemsChange(newItems);
    setEditingIndex(null);
    setEditingPrice("");
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingPrice("");
  };

  const getConceptDetails = (conceptId: string) => {
    return concepts.find((c) => c.id === conceptId);
  };

  return (
    <div className="space-y-4">
      {/* Add concept selector */}
      <div className="flex gap-2">
        <Select value={selectedConceptId} onValueChange={setSelectedConceptId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Seleccionar concepto de trabajo" />
          </SelectTrigger>
          <SelectContent>
            {concepts.map((concept) => (
              <SelectItem key={concept.id} value={concept.id}>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    [{WORK_AREA_LABELS[concept.area]}]
                  </span>
                  {concept.nombre} - $
                  {concept.precio_venta_base.toLocaleString("es-MX")}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleAddConcept}
          disabled={!selectedConceptId}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Agrega conceptos de trabajo desde el selector de arriba
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => {
            const concept = getConceptDetails(item.work_concept_id);
            const subtotalCosto = item.cantidad * item.costo_unitario;
            const subtotalPrecio = item.cantidad * item.precio_unitario;

            return (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {item.concept_name || concept?.nombre || "Concepto"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {/* Cantidad */}
                        <div className="space-y-1">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) =>
                              handleQuantityChange(index, parseInt(e.target.value) || 1)
                            }
                            className="h-8"
                          />
                        </div>

                        {/* Costo unitario (read-only) */}
                        <div className="space-y-1">
                          <Label className="text-xs">Costo unit.</Label>
                          <div className="h-8 px-3 flex items-center bg-muted rounded-md text-sm">
                            ${item.costo_unitario.toLocaleString("es-MX")}
                          </div>
                        </div>

                        {/* Precio unitario (editable) */}
                        <div className="space-y-1">
                          <Label className="text-xs">Precio unit.</Label>
                          {editingIndex === index ? (
                            <div className="flex items-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editingPrice}
                                onChange={(e) => setEditingPrice(e.target.value)}
                                className="h-8"
                                autoFocus
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleSavePrice}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="h-8 px-3 flex items-center justify-between bg-muted rounded-md text-sm cursor-pointer hover:bg-muted/80"
                              onClick={() => handleStartEditPrice(index)}
                            >
                              ${item.precio_unitario.toLocaleString("es-MX")}
                              <Pencil className="h-3 w-3 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Subtotal */}
                        <div className="space-y-1">
                          <Label className="text-xs">Subtotal</Label>
                          <div className="h-8 px-3 flex items-center bg-primary/10 rounded-md text-sm font-medium">
                            ${subtotalPrecio.toLocaleString("es-MX")}
                          </div>
                        </div>
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
