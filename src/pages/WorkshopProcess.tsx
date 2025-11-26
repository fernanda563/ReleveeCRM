import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

const WorkshopProcess = () => {
  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Wrench className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Proceso de Taller</h1>
          </div>
          <p className="text-muted-foreground">
            Gestión del proceso de fabricación en taller
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Funcionalidad en Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este módulo estará disponible próximamente para gestionar el proceso de taller.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default WorkshopProcess;
