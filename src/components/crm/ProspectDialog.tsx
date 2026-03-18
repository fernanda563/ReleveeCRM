import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { Client } from "@/pages/CRM";
import { QuoteMaterialsEditor, type QuoteMaterialItem } from "./QuoteMaterialsEditor";
import { QuoteLaborEditor, type QuoteLaborItem } from "./QuoteLaborEditor";
import { QuoteSummary } from "./QuoteSummary";

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
  const [clientComboOpen, setClientComboOpen] = useState(false);
  const [tipoAccesorio, setTipoAccesorio] = useState("");
  const [subtipoAccesorio, setSubtipoAccesorio] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState<Date>();
  const [tipoMetal, setTipoMetal] = useState("");
  const [colorOro, setColorOro] = useState("");
  const [purezaOro, setPurezaOro] = useState("");
  const [incluyePiedra, setIncluyePiedra] = useState("");
  const [tipoPiedra, setTipoPiedra] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [largoAprox, setLargoAprox] = useState("");
  const [estiloAnillo, setEstiloAnillo] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Quote items
  const [materialItems, setMaterialItems] = useState<QuoteMaterialItem[]>([]);
  const [laborItems, setLaborItems] = useState<QuoteLaborItem[]>([]);

  useEffect(() => {
    if (open) {
      fetchClients();
      if (client) {
        setSelectedClientId(client.id);
      } else {
        setSelectedClientId("");
      }
      setTipoAccesorio("");
      setSubtipoAccesorio("");
      setFechaEntrega(undefined);
      setTipoMetal("");
      setColorOro("");
      setPurezaOro("");
      setIncluyePiedra("");
      setTipoPiedra("");
      setObservaciones("");
      setLargoAprox("");
      setEstiloAnillo("");
      setMaterialItems([]);
      setLaborItems([]);
    }
  }, [open, client]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("nombre");
    if (data) setClients(data);
  };

  const calculateTotal = () => {
    const totalMat = materialItems.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
    const totalLab = laborItems.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);
    return totalMat + totalLab;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClientId) {
      toast.error("Selecciona un cliente");
      return;
    }

    if (materialItems.length === 0 && laborItems.length === 0) {
      toast.error("Agrega al menos un material o concepto de mano de obra");
      return;
    }

    setLoading(true);

    try {
      const totalCotizacion = calculateTotal();

      // 1. Insert prospect
      const { data: prospect, error } = await supabase
        .from("prospects")
        .insert([
          {
            client_id: selectedClientId,
            tipo_accesorio: tipoAccesorio || null,
            subtipo_accesorio: subtipoAccesorio || null,
            fecha_entrega_deseada: fechaEntrega?.toISOString().split("T")[0] || null,
            importe_previsto: totalCotizacion,
            metal_tipo: tipoMetal || null,
            color_oro: colorOro || null,
            pureza_oro: purezaOro || null,
            incluye_piedra: incluyePiedra || null,
            tipo_piedra: tipoPiedra || null,
            largo_aprox: largoAprox || null,
            observaciones: observaciones || null,
            estilo_anillo: estiloAnillo || null,
          },
        ])
        .select("id")
        .single();

      if (error) throw error;

      // 2. Insert prospect_items
      const allItems = [
        ...materialItems.map((item) => ({
          prospect_id: prospect.id,
          tipo: "material" as const,
          referencia_id: item.referencia_id,
          cantidad: item.cantidad,
          costo_unitario: item.costo_unitario,
          precio_unitario: item.precio_unitario,
        })),
        ...laborItems.map((item) => ({
          prospect_id: prospect.id,
          tipo: "mano_obra" as const,
          referencia_id: item.referencia_id,
          cantidad: item.cantidad,
          costo_unitario: item.costo_unitario,
          precio_unitario: item.precio_unitario,
        })),
      ];

      if (allItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("prospect_items")
          .insert(allItems);
        if (itemsError) throw itemsError;
      }

      onOpenChange(false);
      toast.success("Cotización registrada exitosamente");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Error al registrar cotización");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Cotización</DialogTitle>
          <DialogDescription>
            Calcula el precio final basado en materiales y mano de obra
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Sección 1: Información General ── */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Información General
            </h3>

            <div className="space-y-4">
              {/* Cliente */}
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Popover open={clientComboOpen} onOpenChange={setClientComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={clientComboOpen}
                      className="w-full justify-between"
                      disabled={loading || !!client}
                    >
                      {selectedClientId
                        ? clients.find((c) => c.id === selectedClientId)?.nombre +
                          " " +
                          clients.find((c) => c.id === selectedClientId)?.apellido
                        : "Selecciona un cliente"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-0 bg-popover z-50"
                    align="start"
                    style={{ width: "var(--radix-popover-trigger-width)" }}
                  >
                    <Command>
                      <CommandInput placeholder="Buscar cliente..." className="h-10" />
                      <CommandList>
                        <CommandEmpty>No se encontró ningún cliente.</CommandEmpty>
                        <CommandGroup>
                          {clients.map((c) => (
                            <CommandItem
                              key={c.id}
                              value={`${c.nombre} ${c.apellido}`}
                              onSelect={() => {
                                setSelectedClientId(c.id);
                                setClientComboOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedClientId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {c.nombre} {c.apellido}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {selectedClientId && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de Accesorio</Label>
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
                      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
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
                            {fechaEntrega
                              ? format(fechaEntrega, "PPP", { locale: es })
                              : "Seleccionar"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={fechaEntrega}
                            onSelect={(date) => {
                              setFechaEntrega(date);
                              setDatePickerOpen(false);
                            }}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Subtipo */}
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

                  {/* Metal */}
                  {tipoAccesorio && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Metal</Label>
                        <Select
                          value={tipoMetal}
                          onValueChange={(v) => {
                            setTipoMetal(v);
                            if (v !== "oro") setColorOro("");
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
                            <Select value={colorOro} onValueChange={setColorOro} disabled={loading}>
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
                            <Select value={purezaOro} onValueChange={setPurezaOro} disabled={loading}>
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

                  {/* Largo */}
                  {(tipoAccesorio === "collar" || tipoAccesorio === "pulsera") && (
                    <div className="space-y-2">
                      <Label>Largo Aproximado</Label>
                      <Input
                        value={largoAprox}
                        onChange={(e) => setLargoAprox(e.target.value)}
                        placeholder="Ej: 45cm, 18 pulgadas..."
                        disabled={loading}
                      />
                    </div>
                  )}

                  {/* Piedra */}
                  {tipoAccesorio && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>¿Incluye Piedra?</Label>
                        <Select
                          value={incluyePiedra}
                          onValueChange={(v) => {
                            setIncluyePiedra(v);
                            if (v === "no") {
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
                      {incluyePiedra === "si" && (
                        <div className="space-y-2">
                          <Label>Tipo de Piedra</Label>
                          <Select value={tipoPiedra} onValueChange={setTipoPiedra} disabled={loading}>
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

                  {/* Estilo anillo */}
                  {tipoAccesorio === "anillo" &&
                    incluyePiedra === "si" &&
                    (tipoPiedra === "diamante" || tipoPiedra === "gema") && (
                      <div className="space-y-2">
                        <Label>Estilo de Anillo</Label>
                        <Select value={estiloAnillo} onValueChange={setEstiloAnillo} disabled={loading}>
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

                  {/* Observaciones */}
                  <div className="space-y-2">
                    <Label>Observaciones</Label>
                    <Textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Detalles adicionales, preferencias del cliente..."
                      disabled={loading}
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedClientId && (
            <>
              <Separator />

              {/* ── Sección 2: Materiales ── */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Materiales
                </h3>
                <QuoteMaterialsEditor items={materialItems} onItemsChange={setMaterialItems} />
              </div>

              <Separator />

              {/* ── Sección 3: Mano de Obra ── */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Mano de Obra
                </h3>
                <QuoteLaborEditor items={laborItems} onItemsChange={setLaborItems} />
              </div>

              <Separator />

              {/* ── Sección 4: Resumen ── */}
              <QuoteSummary materialItems={materialItems} laborItems={laborItems} />
            </>
          )}

          <DialogFooter>
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
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Registrar Cotización"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProspectDialog;
