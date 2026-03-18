import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { QuoteMaterialItem } from "./QuoteMaterialsEditor";
import type { QuoteLaborItem } from "./QuoteLaborEditor";

interface QuoteSummaryProps {
  materialItems: QuoteMaterialItem[];
  laborItems: QuoteLaborItem[];
}

export const QuoteSummary = ({ materialItems, laborItems }: QuoteSummaryProps) => {
  const totalMateriales = materialItems.reduce(
    (sum, item) => sum + item.cantidad * item.precio_unitario,
    0
  );
  const totalManoObra = laborItems.reduce(
    (sum, item) => sum + item.cantidad * item.precio_unitario,
    0
  );
  const totalCotizacion = totalMateriales + totalManoObra;

  const totalCostoMateriales = materialItems.reduce(
    (sum, item) => sum + item.cantidad * item.costo_unitario,
    0
  );
  const totalCostoManoObra = laborItems.reduce(
    (sum, item) => sum + item.cantidad * item.costo_unitario,
    0
  );
  const totalCosto = totalCostoMateriales + totalCostoManoObra;
  const utilidad = totalCotizacion - totalCosto;

  const fmt = (n: number) =>
    "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <h4 className="font-semibold text-sm text-foreground">Resumen de Cotización</h4>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Materiales ({materialItems.length})</span>
            <span>{fmt(totalMateriales)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mano de Obra ({laborItems.length})</span>
            <span>{fmt(totalManoObra)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex justify-between font-bold text-base">
          <span>Total Cotización</span>
          <span className="text-primary">{fmt(totalCotizacion)}</span>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Costo total</span>
          <span>{fmt(totalCosto)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Utilidad estimada</span>
          <span className={utilidad >= 0 ? "text-green-600" : "text-destructive"}>
            {fmt(utilidad)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
