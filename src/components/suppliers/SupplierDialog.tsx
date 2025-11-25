import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { useUserRole } from "@/hooks/useUserRole";
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

interface Supplier {
  id: string;
  nombre_empresa: string;
  nombre_contacto: string;
  apellido_contacto: string | null;
  email: string;
  telefono: string | null;
  telefono_codigo_pais: string | null;
  pais: string | null;
  ciudad: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
}

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: Supplier | null;
  onSuccess: () => void;
}

export const SupplierDialog = ({
  open,
  onOpenChange,
  supplier,
  onSuccess,
}: SupplierDialogProps) => {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre_empresa: "",
    nombre_contacto: "",
    apellido_contacto: "",
    email: "",
    telefono: "",
    telefono_codigo_pais: "+52",
    pais: "",
    ciudad: "",
    direccion: "",
    notas: "",
    activo: true,
  });

  useEffect(() => {
    if (supplier) {
      const fullPhone = supplier.telefono_codigo_pais 
        ? `${supplier.telefono_codigo_pais}${supplier.telefono || ""}`
        : supplier.telefono || "";
      
      setFormData({
        nombre_empresa: supplier.nombre_empresa,
        nombre_contacto: supplier.nombre_contacto,
        apellido_contacto: supplier.apellido_contacto || "",
        email: supplier.email,
        telefono: fullPhone,
        telefono_codigo_pais: supplier.telefono_codigo_pais || "+52",
        pais: supplier.pais || "",
        ciudad: supplier.ciudad || "",
        direccion: supplier.direccion || "",
        notas: supplier.notas || "",
        activo: supplier.activo,
      });
    } else {
      setFormData({
        nombre_empresa: "",
        nombre_contacto: "",
        apellido_contacto: "",
        email: "",
        telefono: "",
        telefono_codigo_pais: "+52",
        pais: "",
        ciudad: "",
        direccion: "",
        notas: "",
        activo: true,
      });
    }
  }, [supplier, open]);

  const capitalizeWords = (text: string) => {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, telefono: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Separar código de país y número
      const phoneMatch = formData.telefono.match(/^(\+\d{1,4})(\d+)$/);
      const countryCode = phoneMatch ? phoneMatch[1] : "+52";
      const phoneNumber = phoneMatch ? phoneMatch[2] : formData.telefono;

      const supplierData = {
        nombre_empresa: formData.nombre_empresa.trim(),
        nombre_contacto: capitalizeWords(formData.nombre_contacto.trim()),
        apellido_contacto: formData.apellido_contacto 
          ? capitalizeWords(formData.apellido_contacto.trim())
          : null,
        email: formData.email.toLowerCase().trim(),
        telefono: phoneNumber || null,
        telefono_codigo_pais: phoneNumber ? countryCode : null,
        pais: formData.pais.trim() || null,
        ciudad: formData.ciudad.trim() || null,
        direccion: formData.direccion.trim() || null,
        notas: formData.notas.trim() || null,
        activo: formData.activo,
      };

      if (supplier) {
        // Actualizar proveedor existente
        const { error } = await supabase
          .from("suppliers")
          .update(supplierData)
          .eq("id", supplier.id);

        if (error) throw error;
        toast.success("Proveedor actualizado exitosamente");
      } else {
        // Crear nuevo proveedor
        const { error } = await supabase
          .from("suppliers")
          .insert([supplierData]);

        if (error) {
          if (error.code === "23505") {
            toast.error("Ya existe un proveedor con ese email");
            return;
          }
          throw error;
        }
        toast.success("Proveedor creado exitosamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving supplier:", error);
      toast.error(error.message || "Error al guardar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!supplier) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("suppliers")
        .delete()
        .eq("id", supplier.id);

      if (error) throw error;

      toast.success("Proveedor eliminado exitosamente");
      onSuccess();
      onOpenChange(false);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting supplier:", error);
      toast.error(error.message || "Error al eliminar el proveedor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {supplier ? "Editar Proveedor" : "Nuevo Proveedor"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información de la Empresa */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Información de la Empresa
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="nombre_empresa">Nombre de la Empresa *</Label>
                  <Input
                    id="nombre_empresa"
                    value={formData.nombre_empresa}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre_empresa: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    value={formData.pais}
                    onChange={(e) =>
                      setFormData({ ...formData, pais: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad}
                    onChange={(e) =>
                      setFormData({ ...formData, ciudad: e.target.value })
                    }
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="direccion">Dirección Completa</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Información de Contacto */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Información de Contacto
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_contacto">Nombre del Contacto *</Label>
                  <Input
                    id="nombre_contacto"
                    value={formData.nombre_contacto}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre_contacto: e.target.value })
                    }
                    onBlur={(e) =>
                      setFormData({
                        ...formData,
                        nombre_contacto: capitalizeWords(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellido_contacto">Apellido del Contacto</Label>
                  <Input
                    id="apellido_contacto"
                    value={formData.apellido_contacto}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido_contacto: e.target.value })
                    }
                    onBlur={(e) =>
                      setFormData({
                        ...formData,
                        apellido_contacto: capitalizeWords(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <PhoneInput
                    value={formData.telefono}
                    onChange={handlePhoneChange}
                    defaultCountryCode="+52"
                  />
                </div>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Información Adicional
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notas">Notas</Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) =>
                      setFormData({ ...formData, notas: e.target.value })
                    }
                    rows={3}
                    placeholder="Observaciones, condiciones especiales, etc."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="activo">Estado del Proveedor</Label>
                    <p className="text-xs text-muted-foreground">
                      Los proveedores inactivos no aparecerán en los listados
                    </p>
                  </div>
                  <Switch
                    id="activo"
                    checked={formData.activo}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, activo: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <div>
                {supplier && isAdmin() && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={loading}
                  >
                    Eliminar Proveedor
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? "Guardando..."
                    : supplier
                    ? "Guardar Cambios"
                    : "Crear Proveedor"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              proveedor del sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
