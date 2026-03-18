import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, ArrowLeft, ArrowRight, Loader2, Calculator, ChevronDown, AlertCircle } from "lucide-react";
import { calcularPrecioMaterial } from "@/lib/material-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import RingWeightCalculator from "@/components/crm/RingWeightCalculator";
import { Checkbox } from "@/components/ui/checkbox";

// Requirement map: which piece types need metal and/or stone
const MATERIAL_REQUIREMENTS: Record<string, { requiresMetal: boolean; requiresStone: boolean }> = {
  // Default: most pieces require metal only
};

function getPieceRequirements(tipo: string): { requiresMetal: boolean; requiresStone: boolean } {
  const lower = tipo.toLowerCase();
  // Check explicit map first
  if (MATERIAL_REQUIREMENTS[lower]) return MATERIAL_REQUIREMENTS[lower];
  // Pieces that require both metal and stone
  if (lower.includes("compromiso") || lower.includes("churumbela")) {
    return { requiresMetal: true, requiresStone: true };
  }
  // "otro" has no requirements
  if (lower === "otro") return { requiresMetal: false, requiresStone: false };
  // Default: requires metal
  return { requiresMetal: true, requiresStone: false };
}

interface Client {
  id: string;
  nombre: string;
  apellido: string;
}

interface AccessoryType {
  id: string;
  tipo_accesorio: string;
  codigo: string;
  requiere_talla: boolean;
}

interface Material {
  id: string;
  nombre: string;
  categoria: string | null;
  tipo_material: string | null;
  unidad_medida: string;
  costo_directo: number;
  tipo_margen: string;
  valor_margen: number;
  redondeo: string;
  redondeo_multiplo: number | null;
  kilataje: string | null;
  color: string | null;
}

interface WorkConcept {
  id: string;
  nombre: string;
  unidad_medida: string;
  costo_base: number;
  precio_venta_base: number;
  area: string;
}

interface QuoteItem {
  id: string;
  referencia_id: string;
  nombre: string;
  tipo: "material" | "mano_de_obra";
  categoria?: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  subtotal: number;
  unidad_medida: string;
}

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  clientId?: string;
}

const STEPS = [
  "Información General",
  "Materiales",
  "Mano de Obra",
  "Resumen",
];

export default function QuotationDialog({
  open,
  onOpenChange,
  onSuccess,
  clientId,
}: QuotationDialogProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [clients, setClients] = useState<Client[]>([]);
  const [accessoryTypes, setAccessoryTypes] = useState<AccessoryType[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(clientId || "");
  const [selectedType, setSelectedType] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [observaciones, setObservaciones] = useState("");

  // Step 2
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [materialCantidad, setMaterialCantidad] = useState("1");
  const [materialItems, setMaterialItems] = useState<QuoteItem[]>([]);

  // Step 2 - skip overrides
  const [skipMetal, setSkipMetal] = useState(false);
  const [skipStone, setSkipStone] = useState(false);

  // Step 3
  const [workConcepts, setWorkConcepts] = useState<WorkConcept[]>([]);
  const [selectedConceptId, setSelectedConceptId] = useState("");
  const [conceptCantidad, setConceptCantidad] = useState("1");
  const [laborItems, setLaborItems] = useState<QuoteItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchData();
      resetForm();
      if (clientId) setSelectedClientId(clientId);
    }
  }, [open, clientId]);

  const resetForm = () => {
    setStep(0);
    setSelectedClientId(clientId || "");
    setSelectedType("");
    setFechaEntrega("");
    setObservaciones("");
    setMaterialItems([]);
    setLaborItems([]);
    setSelectedMaterialId("");
    setMaterialCantidad("1");
    setSelectedConceptId("");
    setConceptCantidad("1");
    setSkipMetal(false);
    setSkipStone(false);
  };

  const fetchData = async () => {
    const [clientsRes, typesRes, materialsRes, conceptsRes] = await Promise.all([
      supabase.from("clients").select("id, nombre, apellido").order("nombre"),
      supabase.from("accessory_type_config").select("*").order("tipo_accesorio"),
      supabase.from("materials").select("*").eq("activo", true).order("nombre"),
      supabase.from("work_concepts").select("*").eq("activo", true).order("nombre"),
    ]);

    if (clientsRes.data) setClients(clientsRes.data);
    if (typesRes.data) setAccessoryTypes(typesRes.data);
    if (materialsRes.data) setMaterials(materialsRes.data as Material[]);
    if (conceptsRes.data) setWorkConcepts(conceptsRes.data as WorkConcept[]);
  };

  // Price calculation helpers
  const getMaterialPrice = (mat: Material): number => {
    return calcularPrecioMaterial(
      mat.costo_directo,
      mat.tipo_margen,
      mat.valor_margen,
      mat.redondeo,
      mat.redondeo_multiplo || 1
    );
  };

  const selectedMaterial = useMemo(
    () => materials.find((m) => m.id === selectedMaterialId),
    [materials, selectedMaterialId]
  );

  const selectedConcept = useMemo(
    () => workConcepts.find((c) => c.id === selectedConceptId),
    [workConcepts, selectedConceptId]
  );

  const addMaterial = () => {
    if (!selectedMaterial) return;
    const qty = parseFloat(materialCantidad) || 0;
    if (qty <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    const precioUnit = getMaterialPrice(selectedMaterial);
    const item: QuoteItem = {
      id: crypto.randomUUID(),
      referencia_id: selectedMaterial.id,
      nombre: selectedMaterial.nombre,
      tipo: "material",
      categoria: selectedMaterial.categoria || undefined,
      cantidad: qty,
      costo_unitario: selectedMaterial.costo_directo,
      precio_unitario: precioUnit,
      subtotal: precioUnit * qty,
      unidad_medida: selectedMaterial.unidad_medida,
    };
    setMaterialItems((prev) => [...prev, item]);
    setSelectedMaterialId("");
    setMaterialCantidad("1");
  };

  const addLabor = () => {
    if (!selectedConcept) return;
    const qty = parseFloat(conceptCantidad) || 0;
    if (qty <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }
    const item: QuoteItem = {
      id: crypto.randomUUID(),
      referencia_id: selectedConcept.id,
      nombre: selectedConcept.nombre,
      tipo: "mano_de_obra",
      cantidad: qty,
      costo_unitario: selectedConcept.costo_base,
      precio_unitario: selectedConcept.precio_venta_base,
      subtotal: selectedConcept.precio_venta_base * qty,
      unidad_medida: selectedConcept.unidad_medida,
    };
    setLaborItems((prev) => [...prev, item]);
    setSelectedConceptId("");
    setConceptCantidad("1");
  };

  const removeItem = (id: string, type: "material" | "mano_de_obra") => {
    if (type === "material") {
      setMaterialItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      setLaborItems((prev) => prev.filter((i) => i.id !== id));
    }
  };

  const totalMaterials = useMemo(
    () => materialItems.reduce((sum, i) => sum + i.subtotal, 0),
    [materialItems]
  );

  const totalLabor = useMemo(
    () => laborItems.reduce((sum, i) => sum + i.subtotal, 0),
    [laborItems]
  );

  const grandTotal = totalMaterials + totalLabor;

  const pieceRequirements = useMemo(() => getPieceRequirements(selectedType), [selectedType]);

  const hasMetal = materialItems.some((i) => i.categoria === "Metales");
  const hasStone = materialItems.some((i) => i.categoria === "Piedras Preciosas");

  const missingMetal = pieceRequirements.requiresMetal && !skipMetal && !hasMetal;
  const missingStone = pieceRequirements.requiresStone && !skipStone && !hasStone;

  const canAdvance = () => {
    if (step === 0) return !!selectedClientId && !!selectedType;
    if (step === 1) return !missingMetal && !missingStone;
    return true;
  };

  const handleSave = async () => {
    if (materialItems.length === 0 && laborItems.length === 0) {
      toast.error("Agrega al menos un material o concepto de mano de obra");
      return;
    }

    setSaving(true);
    try {
      const { data: prospect, error: prospectError } = await supabase
        .from("prospects")
        .insert({
          client_id: selectedClientId,
          tipo_accesorio: selectedType,
          importe_previsto: grandTotal,
          fecha_entrega_deseada: fechaEntrega || null,
          observaciones: observaciones || null,
          estado: "activo",
        })
        .select("id")
        .single();

      if (prospectError) throw prospectError;

      const allItems = [...materialItems, ...laborItems].map((item) => ({
        prospect_id: prospect.id,
        referencia_id: item.referencia_id,
        tipo: item.tipo,
        cantidad: item.cantidad,
        costo_unitario: item.costo_unitario,
        precio_unitario: item.precio_unitario,
      }));

      const { error: itemsError } = await supabase
        .from("prospect_items")
        .insert(allItems);

      if (itemsError) throw itemsError;

      toast.success("Cotización creada exitosamente");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error al guardar cotización:", error);
      toast.error("Error al guardar la cotización");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(val);

  const renderItemTable = (items: QuoteItem[], type: "material" | "mano_de_obra") => {
    if (items.length === 0) {
      return (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No se han agregado {type === "material" ? "materiales" : "conceptos"} aún
        </p>
      );
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead className="text-right">Precio Unit.</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="text-sm">{item.nombre}</TableCell>
              <TableCell className="text-right text-sm">
                {item.cantidad} {item.unidad_medida}
              </TableCell>
              <TableCell className="text-right text-sm">
                {formatCurrency(item.precio_unitario)}
              </TableCell>
              <TableCell className="text-right text-sm font-medium">
                {formatCurrency(item.subtotal)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeItem(item.id, type)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Cotización</DialogTitle>
          <DialogDescription>
            Paso {step + 1} de {STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-foreground" : "bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Step 1: General */}
        {step === 0 && (
          <div className="space-y-4">
            {!clientId && (
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Tipo de pieza *</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo de pieza" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {accessoryTypes.map((t) => (
                    <SelectItem key={t.id} value={t.tipo_accesorio}>
                      {t.tipo_accesorio.charAt(0).toUpperCase() + t.tipo_accesorio.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Fecha de entrega deseada</Label>
              <Input
                type="date"
                value={fechaEntrega}
                onChange={(e) => setFechaEntrega(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea
                placeholder="Notas adicionales sobre la cotización..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 2: Materials */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Material requirements info & skip overrides */}
            {(pieceRequirements.requiresMetal || pieceRequirements.requiresStone) && (
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Requisitos — <span className="capitalize">{selectedType}</span>
                </p>
                {pieceRequirements.requiresMetal && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {hasMetal || skipMetal ? (
                        <span className="text-xs font-medium text-foreground">✓ Metal</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Falta agregar un metal</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id="skipMetal"
                        checked={skipMetal}
                        onCheckedChange={(v) => setSkipMetal(!!v)}
                      />
                      <label htmlFor="skipMetal" className="text-xs text-muted-foreground cursor-pointer">
                        Cliente proporciona metal
                      </label>
                    </div>
                  </div>
                )}
                {pieceRequirements.requiresStone && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {hasStone || skipStone ? (
                        <span className="text-xs font-medium text-foreground">✓ Piedra</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Falta agregar una piedra</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id="skipStone"
                        checked={skipStone}
                        onCheckedChange={(v) => setSkipStone(!!v)}
                      />
                      <label htmlFor="skipStone" className="text-xs text-muted-foreground cursor-pointer">
                        Cliente proporciona piedra
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6 space-y-2">
                <Label>Material</Label>
                <Select value={selectedMaterialId} onValueChange={setSelectedMaterialId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar material" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.nombre}
                        {m.kilataje ? ` (${m.kilataje})` : ""}
                        {m.color ? ` - ${m.color}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 space-y-2">
                <Label>
                  Cantidad{" "}
                  {selectedMaterial
                    ? `(${selectedMaterial.unidad_medida})`
                    : ""}
                </Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={materialCantidad}
                  onChange={(e) => setMaterialCantidad(e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <Button
                  onClick={addMaterial}
                  disabled={!selectedMaterialId}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>

            {selectedMaterial && (
              <p className="text-sm text-muted-foreground">
                Precio unitario:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(getMaterialPrice(selectedMaterial))}
                </span>{" "}
                / {selectedMaterial.unidad_medida}
              </p>
            )}

            {/* Ring Weight Calculator - only for metals */}
            {selectedMaterial?.categoria === "Metales" && (
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full py-2">
                  <Calculator className="h-4 w-4" />
                  Calculadora de peso de anillo
                  <ChevronDown className="h-3.5 w-3.5 ml-auto transition-transform [[data-state=open]>&]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pb-3 border border-border rounded-md p-4 mt-1">
                  <RingWeightCalculator
                    onUseWeight={(w) => setMaterialCantidad(String(w))}
                    alloy={
                      selectedMaterial?.kilataje === "10k" ? "10K" :
                      selectedMaterial?.kilataje === "18k" ? "18K" : "14K"
                    }
                    onAlloyChange={(a) => {
                      const targetKilataje = a.toLowerCase();
                      const match = materials.find(
                        (m) =>
                          m.categoria === "Metales" &&
                          m.kilataje === targetKilataje &&
                          m.tipo_material === selectedMaterial?.tipo_material &&
                          m.color === selectedMaterial?.color
                      );
                      if (match) setSelectedMaterialId(match.id);
                    }}
                  />
                </CollapsibleContent>
              </Collapsible>
            )}

            <Separator />
            {renderItemTable(materialItems, "material")}

            {materialItems.length > 0 && (
              <div className="text-right text-sm font-semibold">
                Subtotal materiales: {formatCurrency(totalMaterials)}
              </div>
            )}

            {/* Validation messages */}
            {(missingMetal || missingStone) && (
              <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  {missingMetal && <p>Falta agregar un metal para continuar.</p>}
                  {missingStone && <p>Falta agregar una piedra para continuar.</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Labor */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-6 space-y-2">
                <Label>Concepto de mano de obra</Label>
                <Select value={selectedConceptId} onValueChange={setSelectedConceptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar concepto" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {workConcepts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre} — {formatCurrency(c.precio_venta_base)}/{c.unidad_medida}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-3 space-y-2">
                <Label>
                  Cantidad{" "}
                  {selectedConcept
                    ? `(${selectedConcept.unidad_medida})`
                    : ""}
                </Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={conceptCantidad}
                  onChange={(e) => setConceptCantidad(e.target.value)}
                />
              </div>
              <div className="col-span-3">
                <Button
                  onClick={addLabor}
                  disabled={!selectedConceptId}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </Button>
              </div>
            </div>

            {selectedConcept && (
              <p className="text-sm text-muted-foreground">
                Precio:{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(selectedConcept.precio_venta_base)}
                </span>{" "}
                / {selectedConcept.unidad_medida}
              </p>
            )}

            <Separator />
            {renderItemTable(laborItems, "mano_de_obra")}

            {laborItems.length > 0 && (
              <div className="text-right text-sm font-semibold">
                Subtotal mano de obra: {formatCurrency(totalLabor)}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Summary */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2">Materiales</h4>
              {renderItemTable(materialItems, "material")}
              {materialItems.length > 0 && (
                <div className="text-right text-sm font-medium mt-1">
                  Subtotal: {formatCurrency(totalMaterials)}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-semibold mb-2">Mano de Obra</h4>
              {renderItemTable(laborItems, "mano_de_obra")}
              {laborItems.length > 0 && (
                <div className="text-right text-sm font-medium mt-1">
                  Subtotal: {formatCurrency(totalLabor)}
                </div>
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total Cotización</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between sm:justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}
            disabled={saving}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {step === 0 ? "Cancelar" : "Anterior"}
          </Button>

          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canAdvance()}>
              Siguiente
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar Cotización
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
