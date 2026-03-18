import { Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import RingWeightCalculator from "@/components/crm/RingWeightCalculator";

const RingWeightCalculatorPage = () => (
  <div className="min-h-full bg-background">
    <main className="container mx-auto px-6 py-8 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Scale className="h-8 w-8 text-foreground" />
          <h1 className="text-3xl font-bold text-foreground">Calculadora de Peso de Montura</h1>
        </div>
        <p className="text-muted-foreground">
          Estima el peso de una montura tipo banda según talla, ancho, grosor y quilataje del oro.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <RingWeightCalculator />
        </CardContent>
      </Card>
    </main>
  </div>
);

export default RingWeightCalculatorPage;
