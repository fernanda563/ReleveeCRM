import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gem, DollarSign, Calendar, Trash2, CalendarIcon, Loader2 } from "lucide-react";
import { generateProspectTitle } from "./prospect-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import * as React from "react";

interface Prospect {
  id: string;
  tipo_accesorio: string | null;
  subtipo_accesorio: string | null;
  tipo_piedra: string | null;
  metal_tipo: string | null;
  color_oro: string | null;
  pureza_oro: string | null;
  incluye_piedra: string | null;
  largo_aprox: string | null;
  estilo_anillo: string | null;
  importe_previsto: number | null;
  fecha_entrega_deseada: string | null;
  fecha_vigencia?: string | null;
  estado: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

interface ProspectItem {
  id: string;
  tipo: string;
  referencia_id: string;
  cantidad: number;
  costo_unitario: number;
  precio_unitario: number;
  notas: string | null;
  nombre?: string;
}

interface ProspectDetailDialogProps {
  prospect: Prospect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (prospect: Prospect) => void;
  initialEditMode?: boolean;
}

export const ProspectDetailDialog = ({
  prospect,
  open,
  onOpenChange,
  onSaved,
  initialEditMode = false,
}: ProspectDetailDialogProps) => {
  

  // Edición de proyecto
  const [isEditing, setIsEditing] = React.useState(initialEditMode);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [estado, setEstado] = React.useState<string>(prospect?.estado || "activo");
  const [tipoAccesorio, setTipoAccesorio] = React.useState<string>(prospect?.tipo_accesorio || "");
  const [subtipoAccesorio, setSubtipoAccesorio] = React.useState<string>(prospect?.subtipo_accesorio || "");
  const [tipoMetal, setTipoMetal] = React.useState<string>(prospect?.metal_tipo || "");
  const [colorOro, setColorOro] = React.useState<string>(prospect?.color_oro || "");
  const [purezaOro, setPurezaOro] = React.useState<string>(prospect?.pureza_oro || "");
  const [incluyePiedra, setIncluyePiedra] = React.useState<string>(prospect?.incluye_piedra || "");
  const [tipoPiedra, setTipoPiedra] = React.useState<string>(prospect?.tipo_piedra || "");
  const [largoAprox, setLargoAprox] = React.useState<string>(prospect?.largo_aprox || "");
  const [estiloAnillo, setEstiloAnillo] = React.useState<string>(prospect?.estilo_anillo || "");
  const [importePrevisto, setImportePrevisto] = React.useState<string>(
    prospect?.importe_previsto !== null && prospect?.importe_previsto !== undefined ? String(prospect.importe_previsto) : ""
  );
  const [fechaEntrega, setFechaEntrega] = React.useState<string>(
    prospect?.fecha_entrega_deseada ? prospect.fecha_entrega_deseada : ""
  );
  const [observaciones, setObservaciones] = React.useState<string>(prospect?.observaciones || "");

  // Prospect items
  const [items, setItems] = React.useState<ProspectItem[]>([]);
  const [loadingItems, setLoadingItems] = React.useState(false);

  // Fetch prospect items when dialog opens
  React.useEffect(() => {
    if (open && prospect?.id) {
      fetchProspectItems();
    } else {
      setItems([]);
    }
  }, [open, prospect?.id]);

  const fetchProspectItems = async () => {
    if (!prospect?.id) return;
    setLoadingItems(true);
    try {
      // Fetch all prospect items
      const { data: itemsData, error: itemsError } = await supabase
        .from("prospect_items")
        .select("*")
        .eq("prospect_id", prospect.id);

      if (itemsError) throw itemsError;
      if (!itemsData || itemsData.length === 0) {
        setItems([]);
        setLoadingItems(false);
        return;
      }

      // Separate by type
      const materialIds = itemsData.filter(i => i.tipo === "material").map(i => i.referencia_id);
      const conceptIds = itemsData.filter(i => i.tipo === "mano_de_obra").map(i => i.referencia_id);

      // Fetch names in parallel
      const [materialsRes, conceptsRes] = await Promise.all([
        materialIds.length > 0
          ? supabase.from("materials").select("id, nombre").in("id", materialIds)
          : Promise.resolve({ data: [], error: null }),
        conceptIds.length > 0
          ? supabase.from("work_concepts").select("id, nombre").in("id", conceptIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const materialNames = new Map((materialsRes.data || []).map(m => [m.id, m.nombre]));
      const conceptNames = new Map((conceptsRes.data || []).map(c => [c.id, c.nombre]));

      const enriched: ProspectItem[] = itemsData.map(item => ({
        ...item,
        nombre: item.tipo === "material"
          ? materialNames.get(item.referencia_id) || "Material desconocido"
          : conceptNames.get(item.referencia_id) || "Concepto desconocido",
      }));

      setItems(enriched);
    } catch (error) {
      console.error("Error fetching prospect items:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  // Reset all state when prospect or dialog changes
  React.useEffect(() => {
    if (open && prospect) {
      setIsEditing(initialEditMode);
      setEstado(prospect.estado);
      setTipoAccesorio(prospect.tipo_accesorio || "");
      setSubtipoAccesorio(prospect.subtipo_accesorio || "");
      setTipoMetal(prospect.metal_tipo || "");
      setColorOro(prospect.color_oro || "");
      setPurezaOro(prospect.pureza_oro || "");
      setIncluyePiedra(prospect.incluye_piedra || "");
      setTipoPiedra(prospect.tipo_piedra || "");
      setLargoAprox(prospect.largo_aprox || "");
      setEstiloAnillo(prospect.estilo_anillo || "");
      setImportePrevisto(prospect.importe_previsto !== null ? String(prospect.importe_previsto) : "");
      setFechaEntrega(prospect.fecha_entrega_deseada || "");
      setObservaciones(prospect.observaciones || "");
    }
  }, [open, prospect, initialEditMode]);

  const handleCancel = () => {
    if (!prospect) return;
    setIsEditing(false);
    setEstado(prospect.estado);
    setTipoAccesorio(prospect.tipo_accesorio || "");
    setSubtipoAccesorio(prospect.subtipo_accesorio || "");
    setTipoMetal(prospect.metal_tipo || "");
    setColorOro(prospect.color_oro || "");
    setPurezaOro(prospect.pureza_oro || "");
    setIncluyePiedra(prospect.incluye_piedra || "");
    setTipoPiedra(prospect.tipo_piedra || "");
    setLargoAprox(prospect.largo_aprox || "");
    setEstiloAnillo(prospect.estilo_anillo || "");
    setImportePrevisto(prospect.importe_previsto !== null ? String(prospect.importe_previsto) : "");
    setFechaEntrega(prospect.fecha_entrega_deseada || "");
    setObservaciones(prospect.observaciones || "");
  };

  const handleDelete = async () => {
    if (!prospect) return;
    const { error } = await supabase
      .from("prospects")
      .delete()
      .eq("id", prospect.id);

    if (error) {
      console.error(error);
      toast.error("No se pudo eliminar la cotización");
      return;
    }

    toast.success("Cotización eliminada");
    setShowDeleteDialog(false);
    onOpenChange(false);
    if (onSaved) {
      onSaved(prospect);
    }
  };

  const handleSave = async () => {
    if (!prospect) return;
    const updates: any = {
      estado,
      tipo_accesorio: tipoAccesorio || null,
      subtipo_accesorio: subtipoAccesorio || null,
      metal_tipo: tipoMetal || null,
      color_oro: colorOro || null,
      pureza_oro: purezaOro || null,
      incluye_piedra: incluyePiedra || null,
      tipo_piedra: tipoPiedra || null,
      largo_aprox: largoAprox || null,
      estilo_anillo: estiloAnillo || null,
      observaciones: observaciones || null,
    };

    const importeNum = importePrevisto.trim() === "" ? null : Number(importePrevisto.replace(/[$,]/g, ""));
    updates.importe_previsto = importeNum;
    updates.fecha_entrega_deseada = fechaEntrega || null;

    const { data, error } = await supabase
      .from("prospects")
      .update(updates)
      .eq("id", prospect.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("No se pudo actualizar la cotización");
      return;
    }

    toast.success("Cotización actualizada");
    setIsEditing(false);
    if (onSaved && data) {
      onSaved(data);
    }
    onOpenChange(false);
  };


  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "—";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatCurrencyInput = (value: string): string => {
    const numericValue = value.replace(/[^\d.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) {
      return formatCurrencyInput(parts[0] + '.' + parts.slice(1).join(''));
    }
    if (numericValue === '') return '';
    const [integer, decimal] = numericValue.split('.');
    const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimal !== undefined 
      ? `$${formattedInteger}.${decimal}`
      : `$${formattedInteger}`;
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-foreground/10 text-foreground";
      case "convertido":
        return "bg-foreground/20 text-foreground";
      case "perdido":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted";
    }
  };

  if (!prospect) return null;

  const materialItems = items.filter(i => i.tipo === "material");
  const laborItems = items.filter(i => i.tipo === "mano_de_obra");

  const totalCosto = items.reduce((sum, i) => sum + i.costo_unitario * i.cantidad, 0);
  const totalPrecio = items.reduce((sum, i) => sum + i.precio_unitario * i.cantidad, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-2xl capitalize">
              {generateProspectTitle(prospect)}
            </DialogTitle>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
            )}
            <Badge className={getStatusColor(isEditing ? estado : prospect.estado)}>
              {isEditing ? estado : prospect.estado}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Estado - editable */}
          {isEditing && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">ESTADO</p>
              <Select value={estado} onValueChange={setEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tipo de Accesorio */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">TIPO DE ACCESORIO</p>
            {isEditing ? (
              <Select value={tipoAccesorio} onValueChange={(value) => {
                setTipoAccesorio(value);
                setSubtipoAccesorio("");
                if (value !== "anillo") setEstiloAnillo("");
                if (value !== "collar" && value !== "pulsera") setLargoAprox("");
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anillo">Anillo</SelectItem>
                  <SelectItem value="collar">Collar</SelectItem>
                  <SelectItem value="pulsera">Pulsera</SelectItem>
                  <SelectItem value="arete">Arete</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p className="font-medium capitalize">{prospect.tipo_accesorio || "—"}</p>
            )}
          </div>

          {/* Subtipo */}
          {isEditing && tipoAccesorio && tipoAccesorio !== "otro" ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">SUBTIPO / ESTILO</p>
              <Select value={subtipoAccesorio} onValueChange={setSubtipoAccesorio}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar subtipo" />
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
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          ) : !isEditing && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">SUBTIPO / ESTILO</p>
              <p className="font-medium capitalize">{prospect.subtipo_accesorio || "—"}</p>
            </div>
          )}

          {/* Estilo de anillo */}
          {isEditing && tipoAccesorio === "anillo" && incluyePiedra === "si" ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">ESTILO DE ANILLO</p>
              <Select value={estiloAnillo} onValueChange={setEstiloAnillo}>
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
          ) : !isEditing && prospect.estilo_anillo && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">ESTILO DE ANILLO</p>
              <p className="font-medium capitalize">{prospect.estilo_anillo?.replace(/_/g, ' ')}</p>
            </div>
          )}

          {/* Sección de Metal */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">METAL</p>
            {isEditing ? (
              <div className="space-y-3">
                <Select value={tipoMetal} onValueChange={(value) => {
                  setTipoMetal(value);
                  if (value !== "oro") {
                    setColorOro("");
                    setPurezaOro("");
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo de metal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oro">Oro</SelectItem>
                    <SelectItem value="plata">Plata</SelectItem>
                    <SelectItem value="platino">Platino</SelectItem>
                  </SelectContent>
                </Select>

                {tipoMetal === "oro" && (
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={colorOro} onValueChange={setColorOro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amarillo">Amarillo</SelectItem>
                        <SelectItem value="blanco">Blanco</SelectItem>
                        <SelectItem value="rosado">Rosado</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={purezaOro} onValueChange={setPurezaOro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pureza" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10k">10k</SelectItem>
                        <SelectItem value="14k">14k</SelectItem>
                        <SelectItem value="18k">18k</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Tipo:</p>
                  <p className="font-medium capitalize">{prospect.metal_tipo || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Color:</p>
                  <p className="font-medium capitalize">{prospect.color_oro || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Pureza:</p>
                  <p className="font-medium">{prospect.pureza_oro || "—"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sección de Piedra */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-3">PIEDRA</p>
            {isEditing ? (
              <div className="space-y-3">
                <Select value={incluyePiedra} onValueChange={(value) => {
                  setIncluyePiedra(value);
                  if (value === "no") {
                    setTipoPiedra("");
                    setEstiloAnillo("");
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="¿Incluye piedra?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="si">Sí</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>

                {incluyePiedra === "si" && (
                  <Select value={tipoPiedra} onValueChange={setTipoPiedra}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de piedra" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diamante">Diamante</SelectItem>
                      <SelectItem value="gema">Gema</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Incluye piedra:</p>
                  <p className="font-medium capitalize">{prospect.incluye_piedra === "si" ? "Sí" : prospect.incluye_piedra === "no" ? "No" : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Tipo:</p>
                  <p className="font-medium capitalize">{prospect.tipo_piedra || "—"}</p>
                </div>
              </div>
            )}
          </div>

          {/* Largo aproximado */}
          {isEditing && (tipoAccesorio === "collar" || tipoAccesorio === "pulsera") ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">LARGO APROXIMADO</p>
              <Input
                value={largoAprox}
                onChange={(e) => setLargoAprox(e.target.value)}
                placeholder="Ej: 45cm, 18 pulgadas..."
              />
            </div>
          ) : !isEditing && prospect.largo_aprox && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">LARGO APROXIMADO</p>
              <p className="font-medium">{prospect.largo_aprox}</p>
            </div>
          )}

          {/* Información financiera y fechas - always show */}
          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Importe previsto</span>
                </div>
                {isEditing ? (
                  <Input
                    type="text"
                    value={importePrevisto}
                    onChange={(e) => setImportePrevisto(formatCurrencyInput(e.target.value))}
                    placeholder="$0.00"
                  />
                ) : (
                  <p className="font-semibold text-lg">
                    {formatCurrency(prospect.importe_previsto)}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha de entrega</span>
                </div>
                {isEditing ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !fechaEntrega && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {fechaEntrega ? format(new Date(fechaEntrega), "PPP", { locale: es }) : "Seleccionar"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={fechaEntrega ? new Date(fechaEntrega) : undefined}
                        onSelect={(date) => {
                          setFechaEntrega(date?.toISOString().split('T')[0] || "");
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                ) : (
                  <p className="font-medium">
                    {formatDate(prospect.fecha_entrega_deseada)}
                  </p>
                )}
              </div>
            </div>

            {/* Fecha de vigencia - read only */}
            {!isEditing && (
              <div className="mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Vigencia de cotización</span>
                </div>
                <p className="font-medium">
                  {formatDate(prospect.fecha_vigencia)}
                </p>
              </div>
            )}
          </div>

          {/* Materiales table */}
          {!isEditing && (
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-3">MATERIALES</p>
              {loadingItems ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : materialItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Costo Unit.</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materialItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell className="text-right">{item.cantidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.costo_unitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.precio_unitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.precio_unitario * item.cantidad)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Sin materiales registrados</p>
              )}
            </div>
          )}

          {/* Mano de obra table */}
          {!isEditing && (
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-3">MANO DE OBRA</p>
              {loadingItems ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : laborItems.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Costo Unit.</TableHead>
                      <TableHead className="text-right">Precio Unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {laborItems.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.nombre}</TableCell>
                        <TableCell className="text-right">{item.cantidad}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.costo_unitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.precio_unitario)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.precio_unitario * item.cantidad)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">Sin mano de obra registrada</p>
              )}
            </div>
          )}

          {/* Totales */}
          {!isEditing && items.length > 0 && (
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">COSTO TOTAL</p>
                  <p className="font-semibold text-lg">{formatCurrency(totalCosto)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">PRECIO TOTAL</p>
                  <p className="font-semibold text-lg">{formatCurrency(totalPrecio)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Observaciones - always show */}
          <div className="pt-4 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">OBSERVACIONES</p>
            {isEditing ? (
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones adicionales..."
                rows={3}
              />
            ) : (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {prospect.observaciones || "—"}
              </p>
            )}
          </div>

          {/* Botones de edición */}
          {isEditing && (
            <div className="flex items-center justify-between pt-4 border-t">
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>
                  Guardar cambios
                </Button>
              </div>
            </div>
          )}

          {/* Fecha de creación */}
          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Proyecto creado el {formatDate(prospect.created_at)}
            </p>
          </div>
        </div>
      </DialogContent>

      {/* Diálogo de confirmación de eliminación */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proyecto será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar proyecto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
