import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil } from "lucide-react";

const DesignProcess = () => {
  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Pencil className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Proceso de Diseño</h1>
          </div>
          <p className="text-muted-foreground">
            Gestión del proceso de diseño de piezas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Funcionalidad en Desarrollo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este módulo estará disponible próximamente para gestionar el proceso de diseño.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DesignProcess;
