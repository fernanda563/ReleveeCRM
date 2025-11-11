import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "administrador" | "disenador" | "joyero" | "gerente_tienda" | "contador";

interface Profile {
  id: string;
  nombre: string;
  apellido_paterno: string;
  user_roles: { role: AppRole }[];
}

interface RoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
  onSuccess: () => void;
}

const ROLES = [
  { value: "administrador", label: "Administrador", description: "Acceso total al sistema" },
  { value: "disenador", label: "Diseñador", description: "Gestión de diseño y modelos" },
  { value: "joyero", label: "Joyero", description: "Seguimiento de producción en taller" },
  { value: "gerente_tienda", label: "Gerente de Tienda", description: "Gestión de CRM y pedidos" },
  { value: "contador", label: "Contador", description: "Acceso a información financiera" },
];

export const RoleDialog = ({ open, onOpenChange, profile, onSuccess }: RoleDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (open && profile) {
      setSelectedRoles(profile.user_roles.map((r) => r.role));
    }
  }, [open, profile]);

  const toggleRole = (roleValue: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleValue)
        ? prev.filter((r) => r !== roleValue)
        : [...prev, roleValue]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get current roles
      const currentRoles = profile.user_roles.map((r) => r.role);
      
      // Determine roles to add and remove
      const rolesToAdd = selectedRoles.filter((r) => !currentRoles.includes(r as AppRole));
      const rolesToRemove = currentRoles.filter((r) => !selectedRoles.includes(r));

      // Remove roles
      if (rolesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", profile.id)
          .in("role", rolesToRemove as AppRole[]);

        if (deleteError) throw deleteError;
      }

      // Add new roles
      if (rolesToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert(rolesToAdd.map((role) => ({ 
            user_id: profile.id, 
            role: role as AppRole 
          })));

        if (insertError) throw insertError;
      }

      toast.success("Roles actualizados exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating roles:", error);
      toast.error(error.message || "Error al actualizar los roles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Gestionar Roles - {profile.nombre} {profile.apellido_paterno}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {ROLES.map((role) => (
              <div key={role.value} className="flex items-start space-x-3">
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => toggleRole(role.value)}
                />
                <div className="space-y-1">
                  <Label
                    htmlFor={role.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {role.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
