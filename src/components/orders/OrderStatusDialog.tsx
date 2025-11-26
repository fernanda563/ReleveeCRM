import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  currentPiedraStatus: string;
  currentMonturaStatus: string;
  onSuccess: () => void;
}

const STONE_STATUS = [
  { value: "en_busqueda", label: "En proceso de búsqueda" },
  { value: "piedra_comprada", label: "Piedra comprada" },
  { value: "en_transito_po_box", label: "Piedra en tránsito a PO Box" },
  { value: "en_po_box", label: "Piedra en PO Box" },
  { value: "en_levant", label: "Piedra en Levant" },
  { value: "con_disenador", label: "Piedra con diseñador" },
  { value: "en_taller", label: "Piedra en taller" },
  { value: "piedra_montada", label: "Piedra montada" },
];

const MOUNTING_STATUS = [
  { value: "en_espera", label: "En espera de iniciar el proceso" },
  { value: "en_diseno", label: "En proceso de diseño" },
  { value: "impresion_modelo", label: "Impresión de modelo" },
  { value: "reimpresion_modelo", label: "Reimpresión de modelo" },
  { value: "traslado_modelo", label: "Traslado de modelo" },
  { value: "en_espera_taller", label: "En espera en taller" },
  { value: "en_vaciado", label: "En proceso de vaciado" },
  { value: "pieza_terminada_taller", label: "Pieza terminada en taller" },
  { value: "en_recoleccion", label: "En proceso de recolección" },
  { value: "recolectado", label: "Recolectado" },
  { value: "entregado_oyamel", label: "Entregado en Oyamel" },
  { value: "entregado_levant", label: "Entregado en Levant" },
  { value: "no_aplica", label: "No aplica" },
];

export const OrderStatusDialog = ({
  open,
  onOpenChange,
  orderId,
  currentPiedraStatus,
  currentMonturaStatus,
  onSuccess,
}: OrderStatusDialogProps) => {
  const [piedraStatus, setPiedraStatus] = useState(currentPiedraStatus);
  const [monturaStatus, setMonturaStatus] = useState(currentMonturaStatus);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          estatus_piedra: piedraStatus,
          estatus_montura: monturaStatus,
        })
        .eq("id", orderId);

      if (error) throw error;

      toast.success("Estatus actualizado correctamente");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Error al actualizar el estatus");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modificar Estatus</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="piedra-status">Estatus de Piedra</Label>
            <Select value={piedraStatus} onValueChange={setPiedraStatus}>
              <SelectTrigger id="piedra-status">
                <SelectValue placeholder="Seleccionar estatus" />
              </SelectTrigger>
              <SelectContent>
                {STONE_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="montura-status">Estatus de Montura</Label>
            <Select value={monturaStatus} onValueChange={setMonturaStatus}>
              <SelectTrigger id="montura-status">
                <SelectValue placeholder="Seleccionar estatus" />
              </SelectTrigger>
              <SelectContent>
                {MOUNTING_STATUS.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
