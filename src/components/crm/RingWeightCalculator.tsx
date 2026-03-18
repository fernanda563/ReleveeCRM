import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// US ring sizes → internal diameter (mm)
const SIZE_MAP: Record<number, number> = {
  4: 14.86, 4.25: 15.07, 4.5: 15.27, 4.75: 15.49,
  5: 15.70, 5.25: 15.90, 5.5: 16.10, 5.75: 16.31,
  6: 16.51, 6.25: 16.71, 6.5: 16.92, 6.75: 17.13,
  7: 17.35, 7.25: 17.55, 7.5: 17.75, 7.75: 17.97,
  8: 18.19, 8.25: 18.39, 8.5: 18.59, 8.75: 18.80,
  9: 19.02, 9.25: 19.22, 9.5: 19.43, 9.75: 19.63,
  10: 19.84, 10.25: 20.05, 10.5: 20.26, 10.75: 20.47,
  11: 20.68, 11.25: 20.88, 11.5: 21.08, 11.75: 21.29,
  12: 21.49, 12.25: 21.69, 12.5: 21.89, 12.75: 22.11,
  13: 22.33,
};

const ALLOYS = {
  "10K": { purity: 0.417, density: 11.57, label: "10K" },
  "14K": { purity: 0.583, density: 13.07, label: "14K" },
  "18K": { purity: 0.750, density: 15.58, label: "18K" },
} as const;

type AlloyKey = keyof typeof ALLOYS;

const THICKNESS_LABELS: Record<number, string> = {
  1: "Muy fina",
  1.5: "Banda fina",
  2: "Estándar",
  2.5: "Robusta",
  3: "Gruesa",
};

function calcWeight(id: number, width: number, thickness: number, density: number) {
  const od = id + 2 * thickness;
  const volumeMm3 = (Math.PI / 4) * (od * od - id * id) * width;
  const volumeCm3 = volumeMm3 / 1000;
  return { weight: volumeCm3 * density, volumeCm3 };
}

const WHOLE_SIZES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13];

interface RingWeightCalculatorProps {
  onUseWeight?: (weight: number) => void;
  alloy?: AlloyKey;
  onAlloyChange?: (alloy: AlloyKey) => void;
}

export default function RingWeightCalculator({ onUseWeight, alloy: controlledAlloy, onAlloyChange }: RingWeightCalculatorProps = {}) {
  const [size, setSize] = useState(5);
  const [width, setWidth] = useState(2);
  const [thickness, setThickness] = useState(2);
  const [internalAlloy, setInternalAlloy] = useState<AlloyKey>("14K");

  const alloy = controlledAlloy ?? internalAlloy;
  const setAlloy = (v: AlloyKey) => {
    setInternalAlloy(v);
    onAlloyChange?.(v);
  };

  const id = SIZE_MAP[size];
  const currentAlloy = ALLOYS[alloy];

  const { weight, volumeCm3 } = useMemo(
    () => calcWeight(id, width, thickness, currentAlloy.density),
    [id, width, thickness, currentAlloy.density]
  );

  const pureGold = weight * currentAlloy.purity;

  // Reference table data
  const tableData = useMemo(() =>
    WHOLE_SIZES.map((s) => {
      const d = SIZE_MAP[s];
      return {
        size: s,
        diameter: d,
        w10: calcWeight(d, width, thickness, ALLOYS["10K"].density).weight,
        w14: calcWeight(d, width, thickness, ALLOYS["14K"].density).weight,
        w18: calcWeight(d, width, thickness, ALLOYS["18K"].density).weight,
      };
    }),
    [width, thickness]
  );

  // Size slider: convert 0-18 index to 4-13 step 0.5
  const sizeIndex = (size - 4) * 4;

  return (
    <div className="space-y-6 pt-4">
      {/* Sliders */}
      <div className="space-y-5">
        {/* Ring Size */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">Talla US</span>
            <span className="text-sm text-muted-foreground">
              ({size} — ⌀ {id.toFixed(2)} mm)
            </span>
          </div>
          <Slider
            value={[sizeIndex]}
            min={0}
            max={36}
            step={1}
            onValueChange={([v]) => setSize(4 + v * 0.25)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>4</span><span>13</span>
          </div>
        </div>

        {/* Band Width */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">Ancho de banda</span>
            <span className="text-sm text-muted-foreground">({width.toFixed(1)} mm)</span>
          </div>
          <Slider
            value={[width]}
            min={2}
            max={8}
            step={0.1}
            onValueChange={([v]) => setWidth(Math.round(v * 10) / 10)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>2 mm</span><span>8 mm</span>
          </div>
        </div>

        {/* Wall Thickness */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">Grosor de pared</span>
            <span className="text-sm text-muted-foreground">
              ({thickness} mm — {THICKNESS_LABELS[thickness]})
            </span>
          </div>
          <Slider
            value={[(thickness - 1) * 2]}
            min={0}
            max={4}
            step={1}
            onValueChange={([v]) => setThickness(1 + v * 0.5)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 mm</span><span>3 mm</span>
          </div>
        </div>
      </div>

      {/* Alloy Toggle */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">Quilataje</span>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(ALLOYS) as AlloyKey[]).map((key) => {
            const a = ALLOYS[key];
            const isActive = alloy === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setAlloy(key)}
                className={`flex flex-col items-center gap-0.5 py-5 px-3 rounded-md border transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border hover:bg-accent"
                }`}
              >
                <span className="font-semibold text-sm">{key}</span>
                <span className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {(a.purity * 100).toFixed(1)}% oro
                </span>
                <span className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                  {a.density} g/cm³
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Result Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border">
          <CardContent className="pt-6 pb-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Peso estimado</p>
            <p className="text-2xl font-bold text-foreground">{weight.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">gramos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6 pb-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Oro puro</p>
            <p className="text-2xl font-bold text-foreground">{pureGold.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">gramos</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6 pb-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Volumen</p>
            <p className="text-2xl font-bold text-foreground">{volumeCm3.toFixed(3)}</p>
            <p className="text-xs text-muted-foreground">cm³</p>
          </CardContent>
        </Card>
      </div>

      {/* Reference Table */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">
          Tabla de referencia — {width} mm ancho, {thickness} mm grosor
        </h3>
        <div className="border border-border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Talla US</TableHead>
                <TableHead className="text-xs">⌀ interior</TableHead>
                <TableHead className="text-xs text-right">10K (g)</TableHead>
                <TableHead className="text-xs text-right">14K (g)</TableHead>
                <TableHead className="text-xs text-right">18K (g)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((row) => {
                const isActive = row.size === Math.floor(size) && size % 1 === 0;
                return (
                  <TableRow
                    key={row.size}
                    className={isActive ? "bg-muted" : ""}
                  >
                    <TableCell className="text-sm font-medium">{row.size}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{row.diameter.toFixed(2)} mm</TableCell>
                    <TableCell className="text-sm text-right">{row.w10.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right">{row.w14.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-right">{row.w18.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Use weight button */}
      {onUseWeight && (
        <Button
          onClick={() => onUseWeight(parseFloat(weight.toFixed(2)))}
          className="w-full"
        >
          Usar este peso ({weight.toFixed(2)} g)
        </Button>
      )}

      {/* Footnote */}
      <p className="text-xs text-muted-foreground text-center">
        Pesos aproximados para bandas planas comfort-fit. Anillos con piedras, grabados o diseños elaborados pueden variar ±15-30%.
      </p>
    </div>
  );
}
