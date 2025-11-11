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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import type { Client } from "@/pages/CRM";

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess: () => void;
}

const ClientDialog = ({ open, onOpenChange, client, onSuccess }: ClientDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono_principal: "",
    telefono_adicional: "",
    fuente_contacto: "",
  });
  const [ineFile, setIneFile] = useState<File | null>(null);

  useEffect(() => {
    if (client) {
      setFormData({
        nombre: client.nombre,
        apellido: client.apellido,
        email: client.email,
        telefono_principal: client.telefono_principal,
        telefono_adicional: client.telefono_adicional || "",
        fuente_contacto: client.fuente_contacto || "",
      });
    } else {
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        telefono_principal: "",
        telefono_adicional: "",
        fuente_contacto: "",
      });
      setIneFile(null);
    }
  }, [client, open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Solo se permiten archivos PDF");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("El archivo no debe superar 5MB");
        return;
      }
      setIneFile(file);
    }
  };

  const uploadINE = async (clientId: string): Promise<string | null> => {
    if (!ineFile) return null;

    setUploading(true);
    const fileExt = "pdf";
    const fileName = `${clientId}_${Date.now()}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("ine-documents")
      .upload(filePath, ineFile);

    setUploading(false);

    if (uploadError) {
      toast.error("Error al subir el archivo");
      console.error(uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from("ine-documents")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let documentUrl = client?.documento_id_url;

      if (client) {
        // Update existing client
        if (ineFile) {
          documentUrl = await uploadINE(client.id);
        }

        const { error } = await supabase
          .from("clients")
          .update({
            ...formData,
            documento_id_url: documentUrl,
          })
          .eq("id", client.id);

        if (error) throw error;
        toast.success("Cliente actualizado exitosamente");
      } else {
        // Create new client
        const { data: newClient, error: insertError } = await supabase
          .from("clients")
          .insert([formData])
          .select()
          .single();

        if (insertError) throw insertError;

        if (ineFile && newClient) {
          documentUrl = await uploadINE(newClient.id);
          if (documentUrl) {
            await supabase
              .from("clients")
              .update({ documento_id_url: documentUrl })
              .eq("id", newClient.id);
          }
        }

        toast.success("Cliente creado exitosamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar cliente");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {client ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {client
              ? "Modifica la información del cliente"
              : "Completa los datos del nuevo cliente"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input
                id="apellido"
                value={formData.apellido}
                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono_principal">Teléfono Principal *</Label>
              <Input
                id="telefono_principal"
                type="tel"
                value={formData.telefono_principal}
                onChange={(e) =>
                  setFormData({ ...formData, telefono_principal: e.target.value })
                }
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono_adicional">Teléfono Adicional</Label>
              <Input
                id="telefono_adicional"
                type="tel"
                value={formData.telefono_adicional}
                onChange={(e) =>
                  setFormData({ ...formData, telefono_adicional: e.target.value })
                }
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuente_contacto">¿Cómo se enteró de nosotros?</Label>
            <Select
              value={formData.fuente_contacto}
              onValueChange={(value) =>
                setFormData({ ...formData, fuente_contacto: value })
              }
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Facebook">Facebook</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Recomendación">Recomendación</SelectItem>
                <SelectItem value="Tienda física">Tienda física</SelectItem>
                <SelectItem value="Google">Google</SelectItem>
                <SelectItem value="Otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ine">INE (PDF)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="ine"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={loading || uploading}
                className="flex-1"
              />
              {ineFile && (
                <span className="text-sm text-muted-foreground">
                  {ineFile.name}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Máximo 5MB. Solo archivos PDF.
            </p>
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
              disabled={loading || uploading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loading || uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? "Subiendo archivo..." : "Guardando..."}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {client ? "Actualizar" : "Crear"} Cliente
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDialog;
