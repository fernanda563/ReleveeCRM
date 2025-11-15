import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Separator } from "@/components/ui/separator";
import { CompanySettingsCard } from "@/components/settings/CompanySettingsCard";
import { NotificationSettingsCard } from "@/components/settings/NotificationSettingsCard";
import { RegionalSettingsCard } from "@/components/settings/RegionalSettingsCard";
import { AppearanceSettingsCard } from "@/components/settings/AppearanceSettingsCard";

export default function SystemSettings() {
  const navigate = useNavigate();
  const { isAdmin, loading } = useUserRole();

  useEffect(() => {
    if (!loading && !isAdmin()) {
      navigate("/dashboard");
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración del Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Administra las configuraciones generales de la aplicación
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        <CompanySettingsCard />
        <NotificationSettingsCard />
        <RegionalSettingsCard />
        <AppearanceSettingsCard />
      </div>
    </div>
  );
}
