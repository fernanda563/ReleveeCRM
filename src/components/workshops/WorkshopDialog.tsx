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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { COUNTRIES } from "@/lib/countries";
import { COUNTRY_PHONE_CODES } from "@/lib/country-phone-codes";
import { Workshop } from "@/types/workshops";

interface WorkshopDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workshop: Workshop | null;
  onSuccess: () => void;
}

export const WorkshopDialog = ({
  open,
  onOpenChange,
  workshop,
  onSuccess,
}: WorkshopDialogProps) => {
  const { isAdmin } = useUserRole();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    responsable_nombre: "",
    responsable_telefono: "",
    responsable_telefono_codigo_pais: "+52",
    email: "",
    ubicacion_ciudad: "",
    ubicacion_estado: "",
    ubicacion_pais: "México",
    direccion: "",
    notas: "",
    activo: true,
  });

  useEffect(() => {
    if (workshop) {
      const fullPhone = workshop.responsable_telefono_codigo_pais 
        ? `${workshop.responsable_telefono_codigo_pais}${workshop.responsable_telefono || ""}`
        : workshop.responsable_telefono || "";
      
      setFormData({
        nombre: workshop.nombre,
        responsable_nombre: workshop.responsable_nombre,
        responsable_telefono: fullPhone,
        responsable_telefono_codigo_pais: workshop.responsable_telefono_codigo_pais || "+52",
        email: workshop.email || "",
        ubicacion_ciudad: workshop.ubicacion_ciudad || "",
        ubicacion_estado: workshop.ubicacion_estado || "",
        ubicacion_pais: workshop.ubicacion_pais || "México",
        direccion: workshop.direccion || "",
        notas: workshop.notas || "",
        activo: workshop.activo,
      });
    } else {
      setFormData({
        nombre: "",
        responsable_nombre: "",
        responsable_telefono: "",
        responsable_telefono_codigo_pais: "+52",
        email: "",
        ubicacion_ciudad: "",
        ubicacion_estado: "",
        ubicacion_pais: "México",
        direccion: "",
        notas: "",
        activo: true,
      });
    }
  }, [workshop, open]);

  const capitalizeWords = (text: string) => {
    return text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, responsable_telefono: value });
  };

  const handleCountryChange = (selectedCountry: string) => {
    const phoneCode = COUNTRY_PHONE_CODES[selectedCountry] || "+52";
    
    const currentPhone = formData.responsable_telefono;
    const phoneMatch = currentPhone.match(/^(\+\d{1,4})(\d+)$/);
    const phoneNumber = phoneMatch ? phoneMatch[2] : currentPhone.replace(/^\+\d{1,4}/, "");
    
    setFormData({
      ...formData,
      ubicacion_pais: selectedCountry,
      responsable_telefono_codigo_pais: phoneCode,
      responsable_telefono: phoneNumber ? `${phoneCode}${phoneNumber}` : phoneCode,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const phoneMatch = formData.responsable_telefono.match(/^(\+\d{1,4})(\d+)$/);
      const countryCode = phoneMatch ? phoneMatch[1] : "+52";
      const phoneNumber = phoneMatch ? phoneMatch[2] : formData.responsable_telefono;

      const workshopData = {
        nombre: formData.nombre.trim(),
        responsable_nombre: capitalizeWords(formData.responsable_nombre.trim()),
        responsable_telefono: phoneNumber || null,
        responsable_telefono_codigo_pais: phoneNumber ? countryCode : null,
        email: formData.email.toLowerCase().trim() || null,
        ubicacion_ciudad: formData.ubicacion_ciudad.trim() || null,
        ubicacion_estado: formData.ubicacion_estado.trim() || null,
        ubicacion_pais: formData.ubicacion_pais.trim() || null,
        direccion: formData.direccion.trim() || null,
        notas: formData.notas.trim() || null,
        activo: formData.activo,
      };

      if (workshop) {
        const { error } = await supabase
          .from("workshops")
          .update(workshopData)
          .eq("id", workshop.id);

        if (error) throw error;
        toast.success("Taller actualizado exitosamente");
      } else {
        const { error } = await supabase
          .from("workshops")
          .insert([workshopData]);

        if (error) throw error;
        toast.success("Taller creado exitosamente");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving workshop:", error);
      toast.error(error.message || "Error al guardar el taller");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!workshop) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("workshops")
        .delete()
        .eq("id", workshop.id);

      if (error) throw error;

      toast.success("Taller eliminado exitosamente");
      onSuccess();
      onOpenChange(false);
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error("Error deleting workshop:", error);
      toast.error(error.message || "Error al eliminar el taller");
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
              {workshop ? "Editar Taller" : "Nuevo Taller"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del Taller */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Información del Taller
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="nombre">Nombre del Taller *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubicacion_pais">País</Label>
                  <Select
                    value={formData.ubicacion_pais}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un país" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubicacion_estado">Estado / Provincia</Label>
                  <Input
                    id="ubicacion_estado"
                    value={formData.ubicacion_estado}
                    onChange={(e) =>
                      setFormData({ ...formData, ubicacion_estado: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ubicacion_ciudad">Ciudad</Label>
                  <Input
                    id="ubicacion_ciudad"
                    value={formData.ubicacion_ciudad}
                    onChange={(e) =>
                      setFormData({ ...formData, ubicacion_ciudad: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    value={formData.direccion}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion: e.target.value })
                    }
                    placeholder="Calle, número, colonia..."
                  />
                </div>
              </div>
            </div>

            {/* Información del Responsable */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Información del Responsable
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="responsable_nombre">Nombre del Responsable *</Label>
                  <Input
                    id="responsable_nombre"
                    value={formData.responsable_nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, responsable_nombre: e.target.value })
                    }
                    onBlur={(e) =>
                      setFormData({
                        ...formData,
                        responsable_nombre: capitalizeWords(e.target.value),
                      })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <PhoneInput
                    value={formData.responsable_telefono}
                    onChange={handlePhoneChange}
                    defaultCountryCode={formData.responsable_telefono_codigo_pais || "+52"}
                    readOnlyCountryCode={true}
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
                    placeholder="Observaciones, especialidades, horarios, etc."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="activo">Estado del Taller</Label>
                    <p className="text-xs text-muted-foreground">
                      Los talleres inactivos no aparecerán en los listados
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
                {workshop && isAdmin() && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                    disabled={loading}
                  >
                    Eliminar Taller
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
                    : workshop
                    ? "Guardar Cambios"
                    : "Crear Taller"}
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
              taller y todos sus procesos asociados del sistema.
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
