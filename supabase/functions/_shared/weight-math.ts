// ══════════════════════════════════════════════════════════════
// Lógica canónica de cálculo de pesos (metal, piedras y pieza).
// Fuente de verdad del backend — el frontend sólo la refleja como
// fallback offline.
// ══════════════════════════════════════════════════════════════

export const SIZE_MAP: Record<string, number> = {
  "4": 14.86, "4.25": 15.07, "4.5": 15.27, "4.75": 15.49,
  "5": 15.70, "5.25": 15.90, "5.5": 16.10, "5.75": 16.31,
  "6": 16.51, "6.25": 16.71, "6.5": 16.92, "6.75": 17.13,
  "7": 17.35, "7.25": 17.55, "7.5": 17.75, "7.75": 17.97,
  "8": 18.19, "8.25": 18.39, "8.5": 18.59, "8.75": 18.80,
  "9": 19.02, "9.25": 19.22, "9.5": 19.43, "9.75": 19.63,
  "10": 19.84, "10.25": 20.05, "10.5": 20.26, "10.75": 20.47,
  "11": 20.68, "11.25": 20.88, "11.5": 21.08, "11.75": 21.29,
  "12": 21.49, "12.25": 21.69, "12.5": 21.89, "12.75": 22.11,
  "13": 22.33,
};

export const ALLOYS: Record<string, { purity: number; density: number; label: string }> = {
  "10K": { purity: 0.417, density: 11.57, label: "10K" },
  "14K": { purity: 0.583, density: 13.07, label: "14K" },
  "18K": { purity: 0.750, density: 15.58, label: "18K" },
};

export const CUT_FACTORS: Record<string, { factor: number; isRound: boolean; depthRatio: number }> = {
  round: { factor: 0.0061, isRound: true, depthRatio: 0.615 },
  princess: { factor: 0.0083, isRound: false, depthRatio: 0.71 },
  oval: { factor: 0.0062, isRound: false, depthRatio: 0.475 },
  marquise: { factor: 0.00565, isRound: false, depthRatio: 0.35 },
  pear: { factor: 0.0059, isRound: false, depthRatio: 0.40 },
  heart: { factor: 0.0059, isRound: false, depthRatio: 0.60 },
  cushion: { factor: 0.0082, isRound: false, depthRatio: 0.63 },
  emerald: { factor: 0.0092, isRound: false, depthRatio: 0.50 },
  radiant: { factor: 0.0083, isRound: false, depthRatio: 0.587 },
  asscher: { factor: 0.0080, isRound: false, depthRatio: 0.70 },
};

export const CARAT_TO_GRAMS = 0.2;

export interface MetalInput {
  size: number;
  width: number;
  thickness: number;
  alloy: string;
  pieceCount?: number;
}

export interface MetalResult {
  innerDiameter: number;
  outerDiameter: number;
  volumeCm3: number;
  weightPerPiece: number;
  weightTotal: number;
  pureGold: number;
  density: number;
  purity: number;
}

export function calcMetal(input: MetalInput): MetalResult {
  const alloy = ALLOYS[input.alloy] ?? ALLOYS["14K"];
  const innerDiameter = SIZE_MAP[String(input.size)] ?? input.size;
  const outerDiameter = innerDiameter + 2 * input.thickness;
  const volumeMm3 =
    (Math.PI / 4) *
    (outerDiameter * outerDiameter - innerDiameter * innerDiameter) *
    input.width;
  const volumeCm3 = volumeMm3 / 1000;
  const weightPerPiece = volumeCm3 * alloy.density;
  const pieceCount = input.pieceCount && input.pieceCount > 0 ? input.pieceCount : 1;

  return {
    innerDiameter,
    outerDiameter,
    volumeCm3,
    weightPerPiece,
    weightTotal: weightPerPiece * pieceCount,
    pureGold: weightPerPiece * alloy.purity,
    density: alloy.density,
    purity: alloy.purity,
  };
}

export interface StoneInput {
  cut: string;
  diameter?: number;
  length?: number;
  width?: number;
  depth: number;
  stoneCount?: number;
}

export interface StoneResult {
  caratsPerStone: number;
  mgPerStone: number;
  totalCarats: number;
  totalMg: number;
  totalGrams: number;
  rangeLow: number;
  rangeHigh: number;
  depthPct: number;
  formula: string;
}

export function calcStone(input: StoneInput): StoneResult {
  const cut = CUT_FACTORS[input.cut] ?? CUT_FACTORS.round;
  const depth = input.depth;
  const stoneCount = input.stoneCount ?? 1;

  let caratsPerStone: number;
  let depthPct: number;
  let formula: string;

  if (cut.isRound) {
    const d = input.diameter ?? input.length ?? 0;
    caratsPerStone = d * d * depth * cut.factor;
    depthPct = d > 0 ? (depth / d) * 100 : 0;
    formula = `${d.toFixed(2)}² × ${depth.toFixed(2)} × ${cut.factor}`;
  } else {
    const l = input.length ?? 0;
    const w = input.width ?? 0;
    caratsPerStone = l * w * depth * cut.factor;
    depthPct = l > 0 ? (depth / l) * 100 : 0;
    formula = `${l.toFixed(2)} × ${w.toFixed(2)} × ${depth.toFixed(2)} × ${cut.factor}`;
  }

  const totalCarats = caratsPerStone * stoneCount;

  return {
    caratsPerStone,
    mgPerStone: Math.round(caratsPerStone * 200),
    totalCarats,
    totalMg: Math.round(totalCarats * 200),
    totalGrams: totalCarats * CARAT_TO_GRAMS,
    rangeLow: caratsPerStone * 0.9,
    rangeHigh: caratsPerStone * 1.1,
    depthPct,
    formula,
  };
}

export interface PieceInput {
  metal: MetalInput;
  stone?: StoneInput | null;
}

export interface PieceResult {
  metal: MetalResult;
  stone: StoneResult | null;
  metalWeightPerPiece: number;
  metalWeightTotal: number;
  stoneWeightGrams: number;
  totalWeightPerPiece: number;
  totalWeightAll: number;
}

export function calcPiece(input: PieceInput): PieceResult {
  const metal = calcMetal(input.metal);
  const pieceCount = input.metal.pieceCount && input.metal.pieceCount > 0 ? input.metal.pieceCount : 1;
  const hasStones = !!input.stone && (input.stone.stoneCount ?? 0) > 0;
  const stone = input.stone ? calcStone(input.stone) : null;
  const stoneWeightGrams = hasStones && stone ? stone.totalGrams : 0;

  return {
    metal,
    stone,
    metalWeightPerPiece: metal.weightPerPiece,
    metalWeightTotal: metal.weightTotal,
    stoneWeightGrams,
    totalWeightPerPiece: metal.weightPerPiece + stoneWeightGrams,
    totalWeightAll: metal.weightTotal + stoneWeightGrams * pieceCount,
  };
}
