import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Gem,
  Weight,
  Scale,
  Layers,
  Link,
  Unlink,
  Package,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// RING / METAL CONSTANTS (from RingWeightCalculator)
// ══════════════════════════════════════════════════════════════

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
  1: "Muy fina", 1.5: "Banda fina", 2: "Estándar", 2.5: "Robusta", 3: "Gruesa",
};

function calcMetalWeight(innerDiam: number, width: number, thickness: number, density: number) {
  const od = innerDiam + 2 * thickness;
  const volumeMm3 = (Math.PI / 4) * (od * od - innerDiam * innerDiam) * width;
  const volumeCm3 = volumeMm3 / 1000;
  return { weight: volumeCm3 * density, volumeCm3 };
}

// ══════════════════════════════════════════════════════════════
// DIAMOND / STONE CONSTANTS (from DiamondWeightCalculator)
// ══════════════════════════════════════════════════════════════

interface DimensionDef {
  key: string; label: string; min: number; max: number; default: number; hint: string;
}

interface CutDef {
  id: string; name: string; factor: number; isRound: boolean; depthRatio: number;
  dimensions: DimensionDef[];
}

const CUTS: CutDef[] = [
  { id: "round", name: "Round", factor: 0.0061, isRound: true, depthRatio: 0.615,
    dimensions: [
      { key: "diameter", label: "Diámetro", min: 2, max: 15, default: 6.5, hint: "Medir a lo ancho del filetín" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.0, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "princess", name: "Princess", factor: 0.0083, isRound: false, depthRatio: 0.71,
    dimensions: [
      { key: "length", label: "Largo", min: 2, max: 15, default: 5.5, hint: "Lado más largo en el filetín" },
      { key: "width", label: "Ancho", min: 2, max: 15, default: 5.5, hint: "Lado más corto en el filetín" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 3.9, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "oval", name: "Oval", factor: 0.0062, isRound: false, depthRatio: 0.475,
    dimensions: [
      { key: "length", label: "Largo", min: 3, max: 20, default: 8.0, hint: "Eje mayor" },
      { key: "width", label: "Ancho", min: 2, max: 15, default: 5.5, hint: "Eje menor" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 3.8, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "marquise", name: "Marquise", factor: 0.00565, isRound: false, depthRatio: 0.35,
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 25, default: 10.0, hint: "De punta a punta" },
      { key: "width", label: "Ancho", min: 2, max: 12, default: 5.0, hint: "Punto más ancho" },
      { key: "depth", label: "Profundidad", min: 1, max: 10, default: 3.5, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "pear", name: "Pear", factor: 0.0059, isRound: false, depthRatio: 0.40,
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 20, default: 9.0, hint: "Punta a extremo redondeado" },
      { key: "width", label: "Ancho", min: 3, max: 14, default: 5.5, hint: "Punto más ancho" },
      { key: "depth", label: "Profundidad", min: 1, max: 10, default: 3.6, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "cushion", name: "Cushion", factor: 0.0082, isRound: false, depthRatio: 0.63,
    dimensions: [
      { key: "length", label: "Largo", min: 3, max: 18, default: 6.5, hint: "Lado más largo en el filetín" },
      { key: "width", label: "Ancho", min: 3, max: 15, default: 6.0, hint: "Lado más corto en el filetín" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.1, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "emerald", name: "Emerald", factor: 0.0092, isRound: false, depthRatio: 0.50,
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 22, default: 8.0, hint: "Lado largo del rectángulo" },
      { key: "width", label: "Ancho", min: 3, max: 16, default: 6.0, hint: "Lado corto" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.0, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "radiant", name: "Radiant", factor: 0.0083, isRound: false, depthRatio: 0.587,
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 18, default: 7.5, hint: "Lado recto más largo" },
      { key: "width", label: "Ancho", min: 3, max: 15, default: 6.0, hint: "Lado recto más corto" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.4, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "heart", name: "Heart", factor: 0.0059, isRound: false, depthRatio: 0.60,
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 18, default: 8.0, hint: "De la punta a la hendidura" },
      { key: "width", label: "Ancho", min: 4, max: 18, default: 8.0, hint: "De lóbulo a lóbulo" },
      { key: "depth", label: "Profundidad", min: 1, max: 10, default: 4.8, hint: "Desde la tabla hasta el culet" },
    ],
  },
  { id: "asscher", name: "Asscher", factor: 0.0080, isRound: false, depthRatio: 0.70,
    dimensions: [
      { key: "length", label: "Largo", min: 3, max: 16, default: 6.0, hint: "Un lado recto del octágono" },
      { key: "width", label: "Ancho", min: 3, max: 16, default: 6.0, hint: "Lado paralelo opuesto" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.2, hint: "Desde la tabla hasta el culet" },
    ],
  },
];

// ══════════════════════════════════════════════════════════════
// UNIFIED PIECE TYPES
// ══════════════════════════════════════════════════════════════

interface PieceTypeUnified {
  id: string;
  label: string;
  description: string;
  // Metal presets
  defaultWidth: number | null;
  defaultThickness: number | null;
  metalPieceCount: number;
  // Stone presets
  defaultStones: number;
  defaultCut: string | null;
}

const PIECE_TYPES: PieceTypeUnified[] = [
  { id: "solitario", label: "Solitario", description: "Banda fina con piedra central", defaultWidth: 2.0, defaultThickness: 1.5, metalPieceCount: 1, defaultStones: 1, defaultCut: "round" },
  { id: "churumbela", label: "Churumbela", description: "Banda media con canal para múltiples piedras", defaultWidth: 2.5, defaultThickness: 2.0, metalPieceCount: 1, defaultStones: 13, defaultCut: "round" },
  { id: "media_churumbela", label: "Media churumbela", description: "Medio anillo con piedras", defaultWidth: 2.0, defaultThickness: 1.5, metalPieceCount: 1, defaultStones: 7, defaultCut: "round" },
  { id: "eternidad", label: "Eternidad", description: "Piedras alrededor completo", defaultWidth: 2.5, defaultThickness: 2.0, metalPieceCount: 1, defaultStones: 20, defaultCut: "round" },
  { id: "argolla_dama", label: "Argolla Dama", description: "Comfort-fit clásica para matrimonio", defaultWidth: 2.0, defaultThickness: 1.5, metalPieceCount: 1, defaultStones: 0, defaultCut: null },
  { id: "argolla_caballero", label: "Argolla Caballero", description: "Más ancha y robusta para matrimonio", defaultWidth: 4.0, defaultThickness: 2.0, metalPieceCount: 1, defaultStones: 0, defaultCut: null },
  { id: "arras", label: "Arras (×13)", description: "Anillos finos y ligeros, 13 piezas", defaultWidth: 2.0, defaultThickness: 1.0, metalPieceCount: 13, defaultStones: 0, defaultCut: null },
  { id: "coctel", label: "Cóctel", description: "Pieza ancha y vistosa, diseño llamativo", defaultWidth: 5.0, defaultThickness: 2.5, metalPieceCount: 1, defaultStones: 1, defaultCut: "cushion" },
  { id: "sello", label: "Sello / Signet", description: "Superficie plana amplia para grabado", defaultWidth: 6.0, defaultThickness: 2.5, metalPieceCount: 1, defaultStones: 0, defaultCut: null },
  { id: "banda_lisa", label: "Banda Lisa", description: "Banda simple sin piedras", defaultWidth: 3.0, defaultThickness: 2.0, metalPieceCount: 1, defaultStones: 0, defaultCut: null },
  { id: "personalizado", label: "Personalizado", description: "Ajusta todos los valores manualmente", defaultWidth: null, defaultThickness: null, metalPieceCount: 1, defaultStones: 0, defaultCut: null },
];

// ══════════════════════════════════════════════════════════════
// CUT ICONS (small SVGs)
// ══════════════════════════════════════════════════════════════

function CutIcon({ cutId, size = 24 }: { cutId: string; size?: number }) {
  const s = size;
  const h = s / 2;
  const stroke = "currentColor";
  const sw = 1.5;
  switch (cutId) {
    case "round": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><circle cx={h} cy={h} r={h - 2} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "princess": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={2} y={2} width={s - 4} height={s - 4} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "oval": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><ellipse cx={h} cy={h} rx={h - 2} ry={h * 0.65} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "marquise": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><ellipse cx={h} cy={h} rx={h - 2} ry={h * 0.45} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "pear": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><path d={`M${h},${s - 2} Q${2},${h} ${h},${2} Q${s - 2},${h} ${h},${s - 2}Z`} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "heart": return <svg width={s} height={s} viewBox="0 0 24 24"><path d="M12,21 Q2,14 3.5,8 Q5,3 12,7 Q19,3 20.5,8 Q22,14 12,21Z" fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "cushion": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={2} y={3} width={s - 4} height={s - 6} rx={5} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "emerald": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={`5,2 ${s - 5},2 ${s - 2},5 ${s - 2},${s - 5} ${s - 5},${s - 2} 5,${s - 2} 2,${s - 5} 2,5`} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "radiant": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={`6,2 ${s - 6},2 ${s - 2},6 ${s - 2},${s - 6} ${s - 6},${s - 2} 6,${s - 2} 2,${s - 6} 2,6`} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "asscher": return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><polygon points={`7,2 ${s - 7},2 ${s - 2},7 ${s - 2},${s - 7} ${s - 7},${s - 2} 7,${s - 2} 2,${s - 7} 2,7`} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    default: return null;
  }
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

const PieceWeightCalculator = () => {
  // ── Piece type ──
  const [pieceType, setPieceType] = useState("solitario");
  const currentPiece = PIECE_TYPES.find((p) => p.id === pieceType)!;

  // ── Metal state ──
  const [size, setSize] = useState(5);
  const [bandWidth, setBandWidth] = useState(2.0);
  const [thickness, setThickness] = useState(1.5);
  const [alloy, setAlloy] = useState<AlloyKey>("14K");
  const [metalPieceCount, setMetalPieceCount] = useState(1);

  // ── Stone state ──
  const [stoneCount, setStoneCount] = useState(1);
  const [selectedCut, setSelectedCut] = useState("round");
  const cut = CUTS.find((c) => c.id === selectedCut)!;

  const [stoneValues, setStoneValues] = useState<Record<string, Record<string, number>>>(() => {
    const init: Record<string, Record<string, number>> = {};
    CUTS.forEach((c) => {
      const dims: Record<string, number> = {};
      c.dimensions.forEach((d) => (dims[d.key] = d.default));
      init[c.id] = dims;
    });
    return init;
  });
  const [manualOverride, setManualOverride] = useState<Record<string, boolean>>({});

  const hasStones = currentPiece.defaultStones > 0 || stoneCount > 0;

  // ── Apply presets when piece type changes ──
  useEffect(() => {
    const p = currentPiece;
    if (p.defaultWidth !== null) setBandWidth(p.defaultWidth);
    if (p.defaultThickness !== null) setThickness(p.defaultThickness);
    setMetalPieceCount(p.metalPieceCount);
    setStoneCount(p.defaultStones);
    if (p.defaultCut) setSelectedCut(p.defaultCut);
  }, [pieceType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset stone link when cut changes
  useEffect(() => { setManualOverride({}); }, [selectedCut]);

  // ── Metal calculations ──
  const innerDiam = SIZE_MAP[size];
  const currentAlloy = ALLOYS[alloy];
  const sizeIndex = (size - 4) * 4;

  const metalResult = useMemo(
    () => calcMetalWeight(innerDiam, bandWidth, thickness, currentAlloy.density),
    [innerDiam, bandWidth, thickness, currentAlloy.density]
  );

  const metalWeightPerPiece = metalResult.weight;
  const metalWeightTotal = metalWeightPerPiece * metalPieceCount;
  const pureGold = metalWeightPerPiece * currentAlloy.purity;

  // ── Stone calculations ──
  const dims = stoneValues[selectedCut];

  const getPrimaryKey = useCallback(() => cut.isRound ? "diameter" : "length", [cut]);
  const getDepthDim = useCallback(() => cut.dimensions.find((d) => d.key === "depth")!, [cut]);
  const getPrimaryDim = useCallback(() => {
    const key = getPrimaryKey();
    return cut.dimensions.find((d) => d.key === key)!;
  }, [cut, getPrimaryKey]);

  const setDimViaSlider = (key: string, val: number) => {
    setStoneValues((prev) => {
      const next = { ...prev[selectedCut], [key]: val };
      const depthDim = getDepthDim();
      const primaryKey = getPrimaryKey();
      if (key === "depth" && !manualOverride[primaryKey]) {
        const primaryDim = getPrimaryDim();
        next[primaryKey] = Math.min(primaryDim.max, Math.max(primaryDim.min, parseFloat((val / cut.depthRatio).toFixed(2))));
      } else if (key === primaryKey && !manualOverride.depth) {
        next.depth = Math.min(depthDim.max, Math.max(depthDim.min, parseFloat((val * cut.depthRatio).toFixed(2))));
      }
      return { ...prev, [selectedCut]: next };
    });
  };

  const setDimViaInput = (key: string, val: number) => {
    setManualOverride((prev) => ({ ...prev, [key]: true }));
    setStoneValues((prev) => ({
      ...prev,
      [selectedCut]: { ...prev[selectedCut], [key]: val },
    }));
  };

  const isLinked = !manualOverride.depth && !manualOverride[getPrimaryKey()];

  const resetLink = () => {
    setManualOverride({});
    const primaryKey = getPrimaryKey();
    const depthDim = getDepthDim();
    const primaryVal = dims[primaryKey];
    const newDepth = Math.min(depthDim.max, Math.max(depthDim.min, parseFloat((primaryVal * cut.depthRatio).toFixed(2))));
    setStoneValues((prev) => ({ ...prev, [selectedCut]: { ...prev[selectedCut], depth: newDepth } }));
  };

  const stoneResult = useMemo(() => {
    if (cut.isRound) {
      const d = dims.diameter;
      const depth = dims.depth;
      const carats = d * d * depth * cut.factor;
      return { carats };
    } else {
      const l = dims.length;
      const w = dims.width;
      const depth = dims.depth;
      return { carats: l * w * depth * cut.factor };
    }
  }, [dims, cut]);

  const caratsPerStone = stoneResult.carats;
  const totalCarats = caratsPerStone * stoneCount;
  const stoneWeightGrams = totalCarats * 0.2; // 1 ct = 0.2 g
  const stoneWeightPerPieceGrams = stoneCount > 0 ? stoneWeightGrams / (metalPieceCount > 1 ? 1 : 1) : 0;

  // ── Total ──
  const totalWeightPerPiece = metalWeightPerPiece + (stoneCount > 0 ? stoneWeightGrams : 0);
  const totalWeightAll = metalWeightTotal + (stoneCount > 0 ? stoneWeightGrams * metalPieceCount : 0);

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Package className="h-8 w-8 text-foreground" />
            <h1 className="text-3xl font-bold text-foreground">Calculadora de Peso de Pieza</h1>
          </div>
          <p className="text-muted-foreground">
            Estima el peso total de una pieza de joyería: montura (metal) + piedras (diamantes).
          </p>
        </div>

        {/* ═══ SUMMARY CARDS ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-border">
            <CardContent className="pt-5 pb-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Metal {metalPieceCount > 1 ? "(por pieza)" : ""}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{metalWeightPerPiece.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">gramos</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Piedras</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{totalCarats.toFixed(3)}</p>
              <p className="text-xs text-muted-foreground">ct ({stoneWeightGrams.toFixed(2)} g)</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Peso por pieza</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{totalWeightPerPiece.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">gramos</p>
            </CardContent>
          </Card>
          <Card className={`${metalPieceCount > 1 ? "border-primary/30 bg-primary/5" : "border-border"}`}>
            <CardContent className="pt-5 pb-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {metalPieceCount > 1 ? `Total (${metalPieceCount} piezas)` : "Total"}
              </p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{totalWeightAll.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">gramos</p>
            </CardContent>
          </Card>
        </div>

        {/* ═══ 1. PIECE TYPE ═══ */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Tipo de pieza
            </h3>
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {PIECE_TYPES.map((p) => (
                  <Tooltip key={p.id}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setPieceType(p.id)}
                        className={`flex items-center justify-center rounded-lg border p-3 h-12 transition-all text-xs font-medium text-center ${
                          pieceType === p.id
                            ? "border-foreground bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/40"
                        }`}
                      >
                        <span className="leading-tight">{p.label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-60">
                      <p className="text-xs">{p.description}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* ═══ 2. MONTURA (METAL) ═══ */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Montura — Metal
            </h3>

            {/* Piece count for arras etc. */}
            {(metalPieceCount > 1 || pieceType === "arras") && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Número de piezas</span>
                <Input
                  type="number" step={1} min={1} max={100}
                  value={metalPieceCount}
                  onChange={(e) => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1) setMetalPieceCount(Math.min(100, v)); }}
                  className="w-20 h-8 text-center text-sm"
                />
              </div>
            )}

            {/* Ring Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">Talla US</span>
                  <span className="text-sm text-muted-foreground">(⌀ {innerDiam.toFixed(2)} mm)</span>
                </div>
                <Input
                  type="number" step={0.25} min={4} max={13}
                  value={size}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setSize(Math.round(Math.min(13, Math.max(4, v)) * 4) / 4); }}
                  className="w-20 h-8 text-center text-sm"
                />
              </div>
              <Slider value={[sizeIndex]} min={0} max={36} step={1} onValueChange={([v]) => setSize(4 + v * 0.25)} />
              <div className="flex justify-between text-xs text-muted-foreground"><span>4</span><span>13</span></div>
            </div>

            {/* Band Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Ancho de banda</span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" step={0.1} min={1} max={8}
                    value={bandWidth}
                    onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setBandWidth(Math.round(Math.min(8, Math.max(1, v)) * 10) / 10); }}
                    className="w-20 h-8 text-center text-sm"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                </div>
              </div>
              <Slider value={[bandWidth]} min={1} max={8} step={0.1} onValueChange={([v]) => setBandWidth(Math.round(v * 10) / 10)} />
              <div className="flex justify-between text-xs text-muted-foreground"><span>1 mm</span><span>8 mm</span></div>
            </div>

            {/* Wall Thickness */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">Grosor de pared</span>
                  <span className="text-sm text-muted-foreground">({THICKNESS_LABELS[thickness] ?? `${thickness} mm`})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number" step={0.5} min={1} max={3}
                    value={thickness}
                    onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v)) setThickness(Math.round(Math.min(3, Math.max(1, v)) * 2) / 2); }}
                    className="w-20 h-8 text-center text-sm"
                  />
                  <span className="text-xs text-muted-foreground">mm</span>
                </div>
              </div>
              <Slider value={[(thickness - 1) * 2]} min={0} max={4} step={1} onValueChange={([v]) => setThickness(1 + v * 0.5)} />
              <div className="flex justify-between text-xs text-muted-foreground"><span>1 mm</span><span>3 mm</span></div>
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
                      key={key} type="button"
                      onClick={() => setAlloy(key)}
                      className={`flex flex-col items-center gap-0.5 py-4 px-3 rounded-md border transition-colors ${
                        isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:bg-accent"
                      }`}
                    >
                      <span className="font-semibold text-sm">{key}</span>
                      <span className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{(a.purity * 100).toFixed(1)}% oro</span>
                      <span className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{a.density} g/cm³</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Metal results inline */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Peso metal</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{metalWeightPerPiece.toFixed(2)} g</p>
              </div>
              <div className="rounded-md border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Oro puro</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{pureGold.toFixed(2)} g</p>
              </div>
              <div className="rounded-md border border-border p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Volumen</p>
                <p className="text-lg font-bold text-foreground tabular-nums">{metalResult.volumeCm3.toFixed(3)} cm³</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══ 3. PIEDRAS (STONES) ═══ */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Gem className="h-4 w-4" />
                Piedras — Diamantes
              </h3>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Nº piedras:</label>
                <Input
                  type="number" min={0} max={999}
                  value={stoneCount}
                  onChange={(e) => setStoneCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-20 h-8 text-center text-sm"
                />
              </div>
            </div>

            {stoneCount > 0 && (
              <>
                {/* Cut selector */}
                <div className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Corte</span>
                  <div className="grid grid-cols-5 gap-2">
                    {CUTS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCut(c.id)}
                        className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all text-xs font-medium ${
                          selectedCut === c.id
                            ? "border-foreground bg-primary text-primary-foreground"
                            : "border-border bg-card text-muted-foreground hover:border-foreground/40"
                        }`}
                      >
                        <CutIcon cutId={c.id} size={20} />
                        <span className="leading-tight">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimensions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Dimensiones (mm)</span>
                    <button
                      onClick={resetLink}
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
                        isLinked ? "text-primary" : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {isLinked ? <Link className="h-3.5 w-3.5" /> : <Unlink className="h-3.5 w-3.5" />}
                      {isLinked ? "Vinculado" : "Vincular"}
                    </button>
                  </div>

                  {cut.dimensions.map((dim) => (
                    <div key={dim.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground">{dim.label}</label>
                        <div className="flex items-center gap-1.5">
                          <Input
                            type="number" min={dim.min} max={dim.max} step={0.01}
                            value={dims[dim.key]}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value);
                              if (!isNaN(v)) setDimViaInput(dim.key, Math.min(dim.max, Math.max(dim.min, v)));
                            }}
                            className="w-20 h-8 text-sm text-right tabular-nums px-2"
                          />
                          <span className="text-xs text-muted-foreground">mm</span>
                        </div>
                      </div>
                      <Slider
                        min={dim.min} max={dim.max} step={0.01}
                        value={[dims[dim.key]]}
                        onValueChange={([v]) => setDimViaSlider(dim.key, v)}
                      />
                    </div>
                  ))}
                </div>

                {/* Stone results inline */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Por piedra</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">{caratsPerStone.toFixed(3)} ct</p>
                  </div>
                  <div className="rounded-md border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total ({stoneCount} piedras)</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">{totalCarats.toFixed(3)} ct</p>
                  </div>
                  <div className="rounded-md border border-border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Peso en gramos</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">{stoneWeightGrams.toFixed(3)} g</p>
                  </div>
                </div>
              </>
            )}

            {stoneCount === 0 && (
              <p className="text-sm text-muted-foreground">Esta pieza no incluye piedras.</p>
            )}
          </CardContent>
        </Card>

        {/* ═══ FOOTNOTE ═══ */}
        <p className="text-xs text-muted-foreground text-center">
          Pesos aproximados. El metal se calcula como banda comfort-fit; piezas con diseños elaborados pueden variar ±15-30%.
          Conversión: 1 quilate = 0.2 gramos.
        </p>
      </main>
    </div>
  );
};

export default PieceWeightCalculator;
