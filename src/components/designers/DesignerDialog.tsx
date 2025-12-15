import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Designer } from "@/types/designers";
import { COUNTRIES } from "@/lib/countries";
import { COUNTRY_PHONE_CODES } from "@/lib/country-phone-codes";

interface DesignerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  designer: Designer | null;
  onSaved: () => void;
}

const ESPECIALIDADES = [
  "Diseño 3D / CAD",
  "Bocetos a mano",
  "Renderizado",
  "Modelado de cera",
  "Diseño conceptual",
  "Ilustración técnica",
  "Otro"
];

export function DesignerDialog({ open, onOpenChange, designer, onSaved }: DesignerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    especialidad: "",
    email: "",
    telefono: "",
    telefono_codigo_pais: "+52",
    ubicacion_ciudad: "",
    ubicacion_estado: "",
    ubicacion_pais: "México",
    portafolio_url: "",
    notas: "",
    activo: true
  });

  useEffect(() => {
    if (designer) {
      setFormData({
        nombre: designer.nombre || "",
        especialidad: designer.especialidad || "",
        email: designer.email || "",
        telefono: designer.telefono || "",
        telefono_codigo_pais: designer.telefono_codigo_pais || "+52",
        ubicacion_ciudad: designer.ubicacion_ciudad || "",
        ubicacion_estado: designer.ubicacion_estado || "",
        ubicacion_pais: designer.ubicacion_pais || "México",
        portafolio_url: designer.portafolio_url || "",
        notas: designer.notas || "",
        activo: designer.activo ?? true
      });
    } else {
      setFormData({
        nombre: "",
        especialidad: "",
        email: "",
        telefono: "",
        telefono_codigo_pais: "+52",
        ubicacion_ciudad: "",
        ubicacion_estado: "",
        ubicacion_pais: "México",
        portafolio_url: "",
        notas: "",
        activo: true
      });
    }
  }, [designer, open]);

  const handleCountryChange = (country: string) => {
    const phoneCode = COUNTRY_PHONE_CODES[country] || "+52";
    setFormData(prev => ({
      ...prev,
      ubicacion_pais: country,
      telefono_codigo_pais: phoneCode
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre.trim()) {
      toast.error("El nombre es requerido");
      return;
    }

    setLoading(true);
    try {
      if (designer) {
        const { error } = await supabase
          .from("designers")
          .update(formData)
          .eq("id", designer.id);
        
        if (error) throw error;
        toast.success("Diseñador actualizado correctamente");
      } else {
        const { error } = await supabase
          .from("designers")
          .insert(formData);
        
        if (error) throw error;
        toast.success("Diseñador creado correctamente");
      }
      
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Error al guardar diseñador");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {designer ? "Editar Diseñador" : "Nuevo Diseñador"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Diseñador */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Información del Diseñador</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre completo *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre del diseñador"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="especialidad">Especialidad</Label>
                <Select
                  value={formData.especialidad}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, especialidad: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESPECIALIDADES.map((esp) => (
                      <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="portafolio_url">URL de Portafolio</Label>
              <Input
                id="portafolio_url"
                type="url"
                value={formData.portafolio_url}
                onChange={(e) => setFormData(prev => ({ ...prev, portafolio_url: e.target.value }))}
                placeholder="https://portafolio.com"
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Contacto</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.telefono_codigo_pais}
                    className="w-20 bg-muted"
                    disabled
                  />
                  <Input
                    id="telefono"
                    value={formData.telefono}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, telefono: value }));
                    }}
                    placeholder="Número de teléfono"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Ubicación</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ubicacion_pais">País</Label>
                <Select
                  value={formData.ubicacion_pais}
                  onValueChange={handleCountryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar país" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubicacion_estado">Estado</Label>
                <Input
                  id="ubicacion_estado"
                  value={formData.ubicacion_estado}
                  onChange={(e) => setFormData(prev => ({ ...prev, ubicacion_estado: e.target.value }))}
                  placeholder="Estado o provincia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ubicacion_ciudad">Ciudad</Label>
                <Input
                  id="ubicacion_ciudad"
                  value={formData.ubicacion_ciudad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ubicacion_ciudad: e.target.value }))}
                  placeholder="Ciudad"
                />
              </div>
            </div>
          </div>

          {/* Notas y Estado */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Notas y Estado</h3>
            
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Textarea
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Notas adicionales sobre el diseñador..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="activo">Diseñador activo</Label>
              <Switch
                id="activo"
                checked={formData.activo}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : designer ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
