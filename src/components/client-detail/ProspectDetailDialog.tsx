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
import { Gem, DollarSign, Calendar, Trash2 } from "lucide-react";
import { generateProspectTitle } from "./prospect-utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
  estado: string;
  observaciones: string | null;
  created_at: string;
}

interface ProspectDetailDialogProps {
  prospect: Prospect | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (prospect: Prospect) => void;
}

export const ProspectDetailDialog = ({
  prospect,
  open,
  onOpenChange,
  onSaved,
}: ProspectDetailDialogProps) => {
  if (!prospect) return null;

  // Edición de proyecto
  const [isEditing, setIsEditing] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [estado, setEstado] = React.useState<string>(prospect.estado);
  const [estiloAnillo, setEstiloAnillo] = React.useState<string>(prospect.estilo_anillo || "");
  const [importePrevisto, setImportePrevisto] = React.useState<string>(
    prospect.importe_previsto !== null ? String(prospect.importe_previsto) : ""
  );
  const [fechaEntrega, setFechaEntrega] = React.useState<string>(
    prospect.fecha_entrega_deseada ? prospect.fecha_entrega_deseada : ""
  );
  const [observaciones, setObservaciones] = React.useState<string>(prospect.observaciones || "");

  const handleCancel = () => {
    setIsEditing(false);
    setEstado(prospect.estado);
    setEstiloAnillo(prospect.estilo_anillo || "");
    setImportePrevisto(prospect.importe_previsto !== null ? String(prospect.importe_previsto) : "");
    setFechaEntrega(prospect.fecha_entrega_deseada || "");
    setObservaciones(prospect.observaciones || "");
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from("prospects")
      .delete()
      .eq("id", prospect.id);

    if (error) {
      console.error(error);
      toast.error("No se pudo eliminar el proyecto");
      return;
    }

    toast.success("Proyecto eliminado");
    setShowDeleteDialog(false);
    onOpenChange(false);
    if (onSaved) {
      onSaved(prospect);
    }
  };

  const handleSave = async () => {
    const updates: any = {
      estado,
      estilo_anillo: estiloAnillo || null,
      observaciones: observaciones || null,
    };

    // Convertir importe
    const importeNum = importePrevisto.trim() === "" ? null : Number(importePrevisto.replace(/,/g, "."));
    updates.importe_previsto = importeNum;

    // Fecha
    updates.fecha_entrega_deseada = fechaEntrega || null;

    const { data, error } = await supabase
      .from("prospects")
      .update(updates)
      .eq("id", prospect.id)
      .select()
      .single();

    if (error) {
      console.error(error);
      toast.error("No se pudo actualizar el proyecto");
      return;
    }

    toast.success("Proyecto actualizado");
    setIsEditing(false);
    if (onSaved && data) {
      onSaved(data);
    }
    onOpenChange(false);
  };


  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "activo":
        return "bg-success/10 text-success";
      case "convertido":
        return "bg-primary/10 text-primary";
      case "perdido":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <DialogTitle className="text-2xl capitalize">
                {generateProspectTitle(prospect)}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(prospect.estado)}>
                {isEditing ? estado : prospect.estado}
              </Badge>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Editar
                </Button>
              )}
            </div>
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

          {/* Estilo de anillo - editable si aplica */}
          {prospect.tipo_accesorio === "anillo" && prospect.incluye_piedra === "si" && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">ESTILO DE ANILLO</p>
              {isEditing ? (
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
              ) : (
                <p className="font-medium capitalize">{prospect.estilo_anillo?.replace(/_/g, ' ') || "N/A"}</p>
              )}
            </div>
          )}

          {/* Sección de Metal */}
          {prospect.metal_tipo && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">METAL</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Tipo:</p>
                  <p className="font-medium capitalize">{prospect.metal_tipo}</p>
                </div>
                {prospect.metal_tipo === "oro" && (
                  <>
                    <div>
                      <p className="text-muted-foreground mb-1">Color:</p>
                      <p className="font-medium capitalize">{prospect.color_oro || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Pureza:</p>
                      <p className="font-medium">{prospect.pureza_oro || "N/A"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Sección de Piedra */}
          {prospect.incluye_piedra === "si" && prospect.tipo_piedra && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">PIEDRA</p>
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Tipo:</p>
                <p className="font-medium capitalize">{prospect.tipo_piedra}</p>
              </div>
            </div>
          )}

          {/* Largo aproximado (para collares/pulseras) */}
          {prospect.largo_aprox && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-3">DIMENSIONES</p>
              <div className="text-sm">
                <p className="text-muted-foreground mb-1">Largo aproximado:</p>
                <p className="font-medium">{prospect.largo_aprox}</p>
              </div>
            </div>
          )}

          {/* Información financiera y fecha */}
          {(prospect.importe_previsto || prospect.fecha_entrega_deseada || isEditing) && (
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
                      onChange={(e) => setImportePrevisto(e.target.value)}
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
                    <Input
                      type="date"
                      value={fechaEntrega}
                      onChange={(e) => setFechaEntrega(e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">
                      {formatDate(prospect.fecha_entrega_deseada)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Observaciones */}
          {(prospect.observaciones || isEditing) && (
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
                  {prospect.observaciones}
                </p>
              )}
            </div>
          )}

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
