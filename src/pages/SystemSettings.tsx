import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Building2, Bell, Globe, Palette } from "lucide-react";

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
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Información de la Empresa</CardTitle>
            </div>
            <CardDescription>
              Configura los datos básicos de Joyería Relevée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Esta sección permitirá configurar nombre, logo, dirección y datos de contacto de la empresa.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>Notificaciones</CardTitle>
            </div>
            <CardDescription>
              Gestiona las notificaciones del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Configura recordatorios automáticos, alertas de producción y notificaciones por email.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <CardTitle>Regionalización</CardTitle>
            </div>
            <CardDescription>
              Idioma, zona horaria y formato de fecha
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Configura el idioma predeterminado, zona horaria y formatos de fecha y moneda.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle>Personalización</CardTitle>
            </div>
            <CardDescription>
              Tema y apariencia de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                Personaliza colores, logos y elementos visuales del sistema.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
