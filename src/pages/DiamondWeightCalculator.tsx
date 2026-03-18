import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Gem } from "lucide-react";

const DIAMOND_DENSITY = 3.52; // g/cm³

// Shape formulas: volume in mm³ based on dimensions
const SHAPES = [
  { value: "round", label: "Redondo", calc: (l: number, _w: number, d: number) => Math.PI / 4 * l * l * d },
  { value: "oval", label: "Oval", calc: (l: number, w: number, d: number) => Math.PI / 4 * l * w * d },
  { value: "princess", label: "Princesa", calc: (l: number, w: number, d: number) => l * w * d },
  { value: "emerald", label: "Esmeralda", calc: (l: number, w: number, d: number) => l * w * d * 0.91 },
  { value: "pear", label: "Pera", calc: (l: number, w: number, d: number) => Math.PI / 4 * l * w * d * 0.85 },
  { value: "marquise", label: "Marquesa", calc: (l: number, w: number, d: number) => Math.PI / 4 * l * w * d * 0.76 },
  { value: "cushion", label: "Cojín", calc: (l: number, w: number, d: number) => l * w * d * 0.88 },
  { value: "heart", label: "Corazón", calc: (l: number, w: number, d: number) => Math.PI / 4 * l * w * d * 0.82 },
];

const DiamondWeightCalculator = () => {
  const [shape, setShape] = useState("round");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [depth, setDepth] = useState("");

  const selectedShape = SHAPES.find((s) => s.value === shape)!;
  const isRound = shape === "round";

  const result = useMemo(() => {
    const l = parseFloat(length);
    const w = isRound ? l : parseFloat(width);
    const d = parseFloat(depth);
    if (!l || !d || (!isRound && !w)) return null;

    const volumeMm3 = selectedShape.calc(l, w, d);
    const volumeCm3 = volumeMm3 / 1000;
    const weightGrams = volumeCm3 * DIAMOND_DENSITY;
    const weightCarats = weightGrams * 5;

    return { volumeMm3, weightGrams, weightCarats };
  }, [length, width, depth, shape, isRound, selectedShape]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Calculadora de Peso de Diamante</h1>
      <p className="text-muted-foreground text-sm">
        Estima el peso en quilates de un diamante a partir de sus dimensiones y forma.
      </p>

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma</Label>
              <Select value={shape} onValueChange={setShape}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SHAPES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRound ? "Diámetro (mm)" : "Largo (mm)"}</Label>
              <Input type="number" step="0.01" min="0" value={length} onChange={(e) => setLength(e.target.value)} placeholder="ej. 6.50" />
            </div>

            {!isRound && (
              <div className="space-y-2">
                <Label>Ancho (mm)</Label>
                <Input type="number" step="0.01" min="0" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="ej. 4.50" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Profundidad (mm)</Label>
              <Input type="number" step="0.01" min="0" value={depth} onChange={(e) => setDepth(e.target.value)} placeholder="ej. 3.90" />
            </div>
          </div>

          {result && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              <ResultCard label="Peso estimado" value={`${result.weightCarats.toFixed(2)} ct`} />
              <ResultCard label="Peso en gramos" value={`${result.weightGrams.toFixed(4)} g`} />
              <ResultCard label="Volumen" value={`${result.volumeMm3.toFixed(2)} mm³`} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

function ResultCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-center space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold flex items-center justify-center gap-1.5">
        <Gem className="h-4 w-4 text-primary" />
        {value}
      </p>
    </div>
  );
}

export default DiamondWeightCalculator;
