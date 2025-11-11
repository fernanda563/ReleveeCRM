import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Client } from "@/pages/CRM";

interface ProspectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess: () => void;
}

const ProspectDialog = ({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ProspectDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [tipoAnillo, setTipoAnillo] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState<Date>();
  const [importePrevisto, setImportePrevisto] = useState("");
  const [colorOro, setColorOro] = useState<string>("");
  const [purezaOro, setPurezaOro] = useState<string>("");
  const [tipoPiedra, setTipoPiedra] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (open) {
      fetchClients();
      if (client) {
        setSelectedClientId(client.id);
      } else {
        setSelectedClientId("");
      }
      // Reset form
      setTipoAnillo("");
      setFechaEntrega(undefined);
      setImportePrevisto("");
      setColorOro("");
      setPurezaOro("");
      setTipoPiedra("");
      setObservaciones("");
    }
  }, [open, client]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("nombre");
    if (data) setClients(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId) {
      toast.error("Selecciona un cliente");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("prospects").insert([
        {
          client_id: selectedClientId,
          tipo_anillo: tipoAnillo || null,
          fecha_entrega_deseada: fechaEntrega?.toISOString().split('T')[0] || null,
          importe_previsto: importePrevisto ? parseFloat(importePrevisto) : null,
          color_oro: colorOro || null,
          pureza_oro: purezaOro || null,
          tipo_piedra: tipoPiedra || null,
          observaciones: observaciones || null,
        },
      ]);

      if (error) throw error;

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar prospecto");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Prospecto</DialogTitle>
          <DialogDescription>
            Guarda información de seguimiento para clientes potenciales
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
              disabled={loading || !!client}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nombre} {c.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_anillo">Tipo de Anillo</Label>
              <Input
                id="tipo_anillo"
                value={tipoAnillo}
                onChange={(e) => setTipoAnillo(e.target.value)}
                placeholder="Ej: Compromiso, Matrimonio..."
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label>Fecha de Entrega Deseada</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fechaEntrega && "text-muted-foreground"
                    )}
                    disabled={loading}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaEntrega ? format(fechaEntrega, "PPP", { locale: es }) : "Seleccionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fechaEntrega}
                    onSelect={setFechaEntrega}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="importe">Importe de Inversión Previsto</Label>
            <Input
              id="importe"
              type="number"
              step="0.01"
              min="0"
              value={importePrevisto}
              onChange={(e) => setImportePrevisto(e.target.value)}
              placeholder="0.00"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Color del Oro</Label>
              <Select
                value={colorOro}
                onValueChange={setColorOro}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="amarillo">Amarillo</SelectItem>
                  <SelectItem value="blanco">Blanco</SelectItem>
                  <SelectItem value="rosado">Rosado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pureza del Oro</Label>
              <Select
                value={purezaOro}
                onValueChange={setPurezaOro}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10k">10k</SelectItem>
                  <SelectItem value="14k">14k</SelectItem>
                  <SelectItem value="18k">18k</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Piedra</Label>
              <Select
                value={tipoPiedra}
                onValueChange={setTipoPiedra}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diamante">Diamante</SelectItem>
                  <SelectItem value="gema">Gema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles adicionales, preferencias del cliente..."
              disabled={loading}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-warning hover:bg-warning/90 text-warning-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Prospecto"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProspectDialog;
