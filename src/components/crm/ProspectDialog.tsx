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
  const [tipoAccesorio, setTipoAccesorio] = useState("");
  const [subtipoAccesorio, setSubtipoAccesorio] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState<Date>();
  const [importePrevisto, setImportePrevisto] = useState("");
  const [tipoMetal, setTipoMetal] = useState<string>("");
  const [colorOro, setColorOro] = useState<string>("");
  const [purezaOro, setPurezaOro] = useState<string>("");
  const [incluyePiedra, setIncluyePiedra] = useState<string>("");
  const [tipoPiedra, setTipoPiedra] = useState<string>("");
  const [observaciones, setObservaciones] = useState("");
  const [largoAprox, setLargoAprox] = useState("");
  const [estiloAnillo, setEstiloAnillo] = useState<string>("");

  // Funciones de formato de moneda
  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return formatCurrency(parts[0] + '.' + parts.slice(1).join(''));
    }
    if (numericValue === '') return '';
    const [integer, decimal] = numericValue.split('.');
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimal !== undefined 
      ? `$${formattedInteger}.${decimal}`
      : `$${formattedInteger}`;
  };

  const unformatCurrency = (value: string): string => {
    return value.replace(/[^\d.]/g, '');
  };

  useEffect(() => {
    if (open) {
      fetchClients();
      if (client) {
        setSelectedClientId(client.id);
      } else {
        setSelectedClientId("");
      }
      // Reset form
      setTipoAccesorio("");
      setSubtipoAccesorio("");
      setFechaEntrega(undefined);
      setImportePrevisto("");
      setTipoMetal("");
      setColorOro("");
      setPurezaOro("");
      setIncluyePiedra("");
      setTipoPiedra("");
      setObservaciones("");
      setLargoAprox("");
      setEstiloAnillo("");
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
          tipo_accesorio: tipoAccesorio || null,
          subtipo_accesorio: subtipoAccesorio || null,
          fecha_entrega_deseada: fechaEntrega?.toISOString().split('T')[0] || null,
          importe_previsto: importePrevisto ? parseFloat(unformatCurrency(importePrevisto)) : null,
          metal_tipo: tipoMetal || null,
          color_oro: colorOro || null,
          pureza_oro: purezaOro || null,
          incluye_piedra: incluyePiedra || null,
          tipo_piedra: tipoPiedra || null,
          largo_aprox: largoAprox || null,
          observaciones: observaciones || null,
          estilo_anillo: estiloAnillo || null,
        },
      ]);

      if (error) throw error;

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar wish list");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Wish List</DialogTitle>
          <DialogDescription>
            Registra proyectos de joyería que el cliente desea crear
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

          {selectedClientId && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo_accesorio">Tipo de Accesorio *</Label>
                  <Select
                    value={tipoAccesorio}
                    onValueChange={(value) => {
                      setTipoAccesorio(value);
                      setSubtipoAccesorio("");
                      setTipoMetal("");
                      setColorOro("");
                      setPurezaOro("");
                      setIncluyePiedra("");
                      setTipoPiedra("");
                      setLargoAprox("");
                      setEstiloAnillo("");
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anillo">Anillo</SelectItem>
                      <SelectItem value="collar">Collar</SelectItem>
                      <SelectItem value="pulsera">Pulsera</SelectItem>
                      <SelectItem value="arete">Arete</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
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

              {/* Subtipo e Importe en dos columnas */}
              <div className="grid grid-cols-2 gap-4">
                {/* Subtipo - Condicional según tipo de accesorio */}
                {tipoAccesorio && tipoAccesorio !== "otro" && (
                  <div className="space-y-2">
                    <Label>Subtipo / Estilo</Label>
                    <Select
                      value={subtipoAccesorio}
                      onValueChange={setSubtipoAccesorio}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {tipoAccesorio === "anillo" && (
                          <>
                            <SelectItem value="compromiso">Compromiso</SelectItem>
                            <SelectItem value="matrimonio">Matrimonio</SelectItem>
                            <SelectItem value="aniversario">Aniversario</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </>
                        )}
                        {tipoAccesorio === "collar" && (
                          <>
                            <SelectItem value="cadena">Cadena</SelectItem>
                            <SelectItem value="dije">Dije</SelectItem>
                            <SelectItem value="collar_completo">Collar completo</SelectItem>
                            <SelectItem value="gargantilla">Gargantilla</SelectItem>
                          </>
                        )}
                        {tipoAccesorio === "pulsera" && (
                          <>
                            <SelectItem value="cadena">Cadena</SelectItem>
                            <SelectItem value="brazalete">Brazalete</SelectItem>
                            <SelectItem value="esclava">Esclava</SelectItem>
                            <SelectItem value="charm">Charm</SelectItem>
                          </>
                        )}
                        {tipoAccesorio === "arete" && (
                          <>
                            <SelectItem value="arracada">Arracada</SelectItem>
                            <SelectItem value="boton">Botón</SelectItem>
                            <SelectItem value="colgante">Colgante</SelectItem>
                            <SelectItem value="argolla">Argolla</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Importe de Inversión Previsto */}
                <div className="space-y-2">
                  <Label htmlFor="importe">Importe de Inversión Previsto</Label>
                  <Input
                    id="importe"
                    type="text"
                    value={importePrevisto}
                    onChange={(e) => setImportePrevisto(formatCurrency(e.target.value))}
                    placeholder="$0.00"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Campos de Metal */}
              {tipoAccesorio && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Metal</Label>
                    <Select
                      value={tipoMetal}
                      onValueChange={(value) => {
                        setTipoMetal(value);
                        if (value !== "oro") {
                          setColorOro("");
                        }
                      }}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="oro">Oro</SelectItem>
                        <SelectItem value="plata">Plata</SelectItem>
                        <SelectItem value="platino">Platino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoMetal === "oro" && (
                    <>
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
                    </>
                  )}
                </div>
              )}

              {/* Largo Aproximado - Solo para collar y pulsera */}
              {(tipoAccesorio === "collar" || tipoAccesorio === "pulsera") && (
                <div className="space-y-2">
                  <Label htmlFor="largo">Largo Aproximado</Label>
                  <Input
                    id="largo"
                    value={largoAprox}
                    onChange={(e) => setLargoAprox(e.target.value)}
                    placeholder="Ej: 45cm, 18 pulgadas..."
                    disabled={loading}
                  />
                </div>
              )}

              {/* Incluye Piedra y Tipo de Piedra en dos columnas */}
              {tipoAccesorio && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Incluye Piedra */}
                  <div className="space-y-2">
                    <Label>¿Incluye Piedra?</Label>
                    <Select
                      value={incluyePiedra}
                onValueChange={(value) => {
                  setIncluyePiedra(value);
                  if (value === "no") {
                    setTipoPiedra("");
                    setEstiloAnillo("");
                  }
                }}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="si">Sí</SelectItem>
                        <SelectItem value="no">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo de Piedra - Solo si incluye piedra */}
                  {incluyePiedra === "si" && (
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
                  )}
                </div>
              )}

              {/* Estilo de Anillo - Condicional */}
              {tipoAccesorio === "anillo" && 
               incluyePiedra === "si" && 
               (tipoPiedra === "diamante" || tipoPiedra === "gema") && (
                <div className="space-y-2">
                  <Label>Estilo de Anillo</Label>
                  <Select
                    value={estiloAnillo}
                    onValueChange={setEstiloAnillo}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solitario">Solitario</SelectItem>
                      <SelectItem value="3_piedras">3 Piedras</SelectItem>
                      <SelectItem value="piedra_lateral">Piedra lateral</SelectItem>
                      <SelectItem value="aureola">Aureola</SelectItem>
                      <SelectItem value="two_stone">Two Stone</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

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
            </>
          )}

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
