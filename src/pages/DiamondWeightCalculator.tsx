import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Gem, Weight, Percent, ArrowLeftRight, AlertTriangle, Diamond, Layers, Link, Unlink } from "lucide-react";

// ── Piece types ──
interface PieceType {
  id: string;
  name: string;
  defaultStones: number;
  description: string;
}

const PIECE_TYPES: PieceType[] = [
  { id: "piedra_suelta", name: "Piedra suelta", defaultStones: 1, description: "Sin montar" },
  { id: "anillo_compromiso", name: "Anillo de compromiso", defaultStones: 1, description: "Piedra central" },
  { id: "churumbela", name: "Churumbela", defaultStones: 13, description: "Banda con múltiples piedras" },
  { id: "anillo_eternidad", name: "Anillo de eternidad", defaultStones: 20, description: "Piedras alrededor completo" },
  { id: "media_churumbela", name: "Media churumbela", defaultStones: 7, description: "Medio anillo con piedras" },
  { id: "anillo_coctel", name: "Anillo cóctel", defaultStones: 1, description: "Piedra central grande" },
  { id: "aretes", name: "Aretes (par)", defaultStones: 2, description: "Una piedra por arete" },
  { id: "collar", name: "Collar / Gargantilla", defaultStones: 1, description: "Piedra central o pendiente" },
  { id: "pulsera_tennis", name: "Pulsera tennis", defaultStones: 30, description: "Múltiples piedras en línea" },
  { id: "dije", name: "Dije / Pendiente", defaultStones: 1, description: "Piedra central" },
  { id: "argollas_matrimonio", name: "Argollas de matrimonio", defaultStones: 0, description: "Generalmente sin piedra" },
  { id: "otro", name: "Otro", defaultStones: 1, description: "Personalizable" },
];

// ── Cut definitions ──
interface DimensionDef {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  hint: string;
  style: "solid" | "dashed" | "dotted";
}

interface CutDef {
  id: string;
  name: string;
  factor: number;
  isRound: boolean;
  depthRatio: number; // typical depth / primary dimension ratio
  dimensions: DimensionDef[];
  note?: string;
}

const CUTS: CutDef[] = [
  {
    id: "round", name: "Round", factor: 0.0061, isRound: true, depthRatio: 0.615,
    dimensions: [
      { key: "diameter", label: "Diámetro", min: 2, max: 15, default: 6.5, hint: "Medir a lo ancho del filetín en el punto más amplio", style: "solid" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.0, hint: "Desde la tabla (arriba) hasta el culet (abajo)", style: "dashed" },
    ],
  },
  {
    id: "princess", name: "Princess", factor: 0.0083, isRound: false, depthRatio: 0.71,
    dimensions: [
      { key: "length", label: "Largo", min: 2, max: 15, default: 5.5, hint: "Lado más largo medido en el filetín", style: "solid" },
      { key: "width", label: "Ancho", min: 2, max: 15, default: 5.5, hint: "Lado más corto medido en el filetín", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 3.9, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
  {
    id: "oval", name: "Oval", factor: 0.0062, isRound: false, depthRatio: 0.475,
    dimensions: [
      { key: "length", label: "Largo", min: 3, max: 20, default: 8.0, hint: "Eje mayor: de punta a punta", style: "solid" },
      { key: "width", label: "Ancho", min: 2, max: 15, default: 5.5, hint: "Eje menor: punto perpendicular más ancho", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 3.8, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
  {
    id: "marquise", name: "Marquise", factor: 0.00565, isRound: false, depthRatio: 0.35,
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 25, default: 10.0, hint: "De punta a punta a lo largo del eje mayor", style: "solid" },
      { key: "width", label: "Ancho", min: 2, max: 12, default: 5.0, hint: "Punto más ancho perpendicular al largo", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 10, default: 3.5, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
  {
    id: "pear", name: "Pear", factor: 0.0059, isRound: false, depthRatio: 0.40,
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 20, default: 9.0, hint: "Desde la punta hasta la parte superior del extremo redondeado", style: "solid" },
      { key: "width", label: "Ancho", min: 3, max: 14, default: 5.5, hint: "Punto más ancho de la sección redondeada", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 10, default: 3.6, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
  {
    id: "heart", name: "Heart", factor: 0.0059, isRound: false, depthRatio: 0.60,
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 18, default: 8.0, hint: "Desde la punta inferior hasta el centro de la hendidura superior", style: "solid" },
      { key: "width", label: "Ancho", min: 4, max: 18, default: 8.0, hint: "De lóbulo a lóbulo en el punto más ancho", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 10, default: 4.8, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
  {
    id: "cushion", name: "Cushion", factor: 0.0082, isRound: false, depthRatio: 0.63,
    dimensions: [
      { key: "length", label: "Largo", min: 3, max: 18, default: 6.5, hint: "Lado más largo medido en el filetín", style: "solid" },
      { key: "width", label: "Ancho", min: 3, max: 15, default: 6.0, hint: "Lado más corto medido en el filetín", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.1, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
  {
    id: "emerald", name: "Emerald", factor: 0.0092, isRound: false, depthRatio: 0.50,
    note: "Medir lados rectos, no esquinas cortadas",
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 22, default: 8.0, hint: "Lado largo del rectángulo medido en el filetín (no las esquinas)", style: "solid" },
      { key: "width", label: "Ancho", min: 3, max: 16, default: 6.0, hint: "Lado corto medido en el filetín", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.0, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
  {
    id: "radiant", name: "Radiant", factor: 0.0083, isRound: false, depthRatio: 0.587,
    note: "Medir lados rectos, no esquinas cortadas",
    dimensions: [
      { key: "length", label: "Largo", min: 4, max: 18, default: 7.5, hint: "Lado recto más largo en el filetín — NO medir a través de las esquinas cortadas", style: "solid" },
      { key: "width", label: "Ancho", min: 3, max: 15, default: 6.0, hint: "Lado recto más corto en el filetín", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.4, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
  {
    id: "asscher", name: "Asscher", factor: 0.0080, isRound: false, depthRatio: 0.70,
    note: "Medir lados rectos, no esquinas cortadas",
    dimensions: [
      { key: "length", label: "Largo", min: 3, max: 16, default: 6.0, hint: "Un lado recto del octágono (entre dos esquinas cortadas)", style: "solid" },
      { key: "width", label: "Ancho", min: 3, max: 16, default: 6.0, hint: "Lado paralelo opuesto — debe ser casi igual al largo", style: "dotted" },
      { key: "depth", label: "Profundidad", min: 1, max: 12, default: 4.2, hint: "Desde la tabla hasta el culet", style: "dashed" },
    ],
  },
];

// ── Small SVG icons for cut selector ──
function CutIcon({ cutId, size = 28 }: { cutId: string; size?: number }) {
  const s = size;
  const h = s / 2;
  const stroke = "currentColor";
  const sw = 1.5;

  switch (cutId) {
    case "round":
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><circle cx={h} cy={h} r={h - 2} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "princess":
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={2} y={2} width={s - 4} height={s - 4} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "oval":
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><ellipse cx={h} cy={h} rx={h - 2} ry={h * 0.65} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "marquise":
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><ellipse cx={h} cy={h} rx={h - 2} ry={h * 0.45} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "pear": {
      const px = h;
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <path d={`M${px},${s - 2} Q${2},${h} ${px},${2} Q${s - 2},${h} ${px},${s - 2}Z`} fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    }
    case "heart":
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <path d="M14,25 Q2,16 4,9 Q6,3 14,8 Q22,3 24,9 Q26,16 14,25Z" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case "cushion":
      return <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}><rect x={2} y={3} width={s - 4} height={s - 6} rx={5} fill="none" stroke={stroke} strokeWidth={sw} /></svg>;
    case "emerald":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <polygon points={`${6},${2} ${s - 6},${2} ${s - 2},${6} ${s - 2},${s - 6} ${s - 6},${s - 2} ${6},${s - 2} ${2},${s - 6} ${2},${6}`} fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case "radiant":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <polygon points={`${7},${2} ${s - 7},${2} ${s - 2},${7} ${s - 2},${s - 7} ${s - 7},${s - 2} ${7},${s - 2} ${2},${s - 7} ${2},${7}`} fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case "asscher":
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
          <polygon points={`${8},${2} ${s - 8},${2} ${s - 2},${8} ${s - 2},${s - 8} ${s - 8},${s - 2} ${8},${s - 2} ${2},${s - 8} ${2},${8}`} fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    default:
      return null;
  }
}

// ── Arrow helpers (monochromatic) ──
const ARROW_DARK = "#404040";
const ARROW_MID = "#808080";
const ARROW_LIGHT = "#a0a0a0";

function arrowHead(x: number, y: number, dir: "up" | "down" | "left" | "right", color: string) {
  const s = 5;
  let points = "";
  switch (dir) {
    case "up": points = `${x},${y} ${x - s},${y + s} ${x + s},${y + s}`; break;
    case "down": points = `${x},${y} ${x - s},${y - s} ${x + s},${y - s}`; break;
    case "left": points = `${x},${y} ${x + s},${y - s} ${x + s},${y + s}`; break;
    case "right": points = `${x},${y} ${x - s},${y - s} ${x - s},${y + s}`; break;
  }
  return <polygon points={points} fill={color} />;
}

// ── Measurement diagram SVGs (monochromatic) ──
function MeasurementDiagram({ cutId }: { cutId: string }) {
  const W = 280;
  const H = 280;
  const cx = 120;
  const cy = 130;
  const sw = 1.5;
  const fillTable = "rgba(160,160,160,0.12)";
  const strokeShape = "#9ca3af";

  const depthArrow = (top: number, bottom: number) => (
    <g>
      <line x1={230} y1={top} x2={230} y2={bottom} stroke={ARROW_LIGHT} strokeWidth={1.5} strokeDasharray="4 3" />
      {arrowHead(230, top, "up", ARROW_LIGHT)}
      {arrowHead(230, bottom, "down", ARROW_LIGHT)}
      <text x={245} y={(top + bottom) / 2 + 4} fill={ARROW_LIGHT} fontSize={11} fontWeight={600}>D</text>
      <line x1={226} y1={top} x2={234} y2={top} stroke={ARROW_LIGHT} strokeWidth={1.5} />
      <line x1={226} y1={bottom} x2={234} y2={bottom} stroke={ARROW_LIGHT} strokeWidth={1.5} />
    </g>
  );

  switch (cutId) {
    case "round": {
      const r = 70;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <polygon points={`${cx},${cy - 35} ${cx + 25},${cy - 25} ${cx + 35},${cy} ${cx + 25},${cy + 25} ${cx},${cy + 35} ${cx - 25},${cy + 25} ${cx - 35},${cy} ${cx - 25},${cy - 25}`} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx - r} y1={cy + r + 18} x2={cx + r} y2={cy + r + 18} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx - r, cy + r + 18, "left", ARROW_DARK)}
          {arrowHead(cx + r, cy + r + 18, "right", ARROW_DARK)}
          <text x={cx - 5} y={cy + r + 32} fill={ARROW_DARK} fontSize={11} fontWeight={600}>∅</text>
          {depthArrow(cy - r, cy + r)}
          <text x={cx - 40} y={H - 8} fill="#6b7280" fontSize={10} textAnchor="middle">Filetín</text>
        </svg>
      );
    }
    case "princess": {
      const sz = 70;
      const x0 = cx - sz;
      const y0 = cy - sz;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <rect x={x0} y={y0} width={sz * 2} height={sz * 2} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <rect x={x0 + 25} y={y0 + 25} width={sz * 2 - 50} height={sz * 2 - 50} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={x0} y1={cy + sz + 18} x2={x0 + sz * 2} y2={cy + sz + 18} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(x0, cy + sz + 18, "left", ARROW_DARK)}
          {arrowHead(x0 + sz * 2, cy + sz + 18, "right", ARROW_DARK)}
          <text x={cx - 3} y={cy + sz + 32} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={x0 - 18} y1={y0} x2={x0 - 18} y2={y0 + sz * 2} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(x0 - 18, y0, "up", ARROW_MID)}
          {arrowHead(x0 - 18, y0 + sz * 2, "down", ARROW_MID)}
          <text x={x0 - 30} y={cy + 4} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(y0, y0 + sz * 2)}
        </svg>
      );
    }
    case "oval": {
      const rx = 75;
      const ry = 50;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <ellipse cx={cx} cy={cy} rx={rx * 0.55} ry={ry * 0.55} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx - rx} y1={cy + ry + 18} x2={cx + rx} y2={cy + ry + 18} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx - rx, cy + ry + 18, "left", ARROW_DARK)}
          {arrowHead(cx + rx, cy + ry + 18, "right", ARROW_DARK)}
          <text x={cx - 3} y={cy + ry + 32} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - rx - 18} y1={cy - ry} x2={cx - rx - 18} y2={cy + ry} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(cx - rx - 18, cy - ry, "up", ARROW_MID)}
          {arrowHead(cx - rx - 18, cy + ry, "down", ARROW_MID)}
          <text x={cx - rx - 30} y={cy + 4} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - ry, cy + ry)}
        </svg>
      );
    }
    case "marquise": {
      const rx = 85;
      const ry = 38;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <ellipse cx={cx} cy={cy} rx={rx * 0.5} ry={ry * 0.45} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx - rx} y1={cy + ry + 18} x2={cx + rx} y2={cy + ry + 18} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx - rx, cy + ry + 18, "left", ARROW_DARK)}
          {arrowHead(cx + rx, cy + ry + 18, "right", ARROW_DARK)}
          <text x={cx - 3} y={cy + ry + 32} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - rx - 18} y1={cy - ry} x2={cx - rx - 18} y2={cy + ry} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(cx - rx - 18, cy - ry, "up", ARROW_MID)}
          {arrowHead(cx - rx - 18, cy + ry, "down", ARROW_MID)}
          <text x={cx - rx - 30} y={cy + 4} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - ry, cy + ry)}
        </svg>
      );
    }
    case "pear":
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <path d={`M${cx},${cy + 80} Q${cx - 65},${cy} ${cx},${cy - 70} Q${cx + 65},${cy} ${cx},${cy + 80}Z`} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <path d={`M${cx},${cy + 35} Q${cx - 25},${cy + 5} ${cx},${cy - 25} Q${cx + 25},${cy + 5} ${cx},${cy + 35}Z`} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx + 75} y1={cy - 70} x2={cx + 75} y2={cy + 80} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx + 75, cy - 70, "up", ARROW_DARK)}
          {arrowHead(cx + 75, cy + 80, "down", ARROW_DARK)}
          <text x={cx + 85} y={cy + 8} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - 55} y1={cy + 90} x2={cx + 55} y2={cy + 90} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(cx - 55, cy + 90, "left", ARROW_MID)}
          {arrowHead(cx + 55, cy + 90, "right", ARROW_MID)}
          <text x={cx - 3} y={cy + 104} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - 70, cy + 80)}
        </svg>
      );
    case "heart":
      return (
        <svg width={W} height={H} viewBox="0 0 280 280" className="mx-auto">
          <path d={`M${cx},${cy + 75} Q${cx - 90},${cy + 10} ${cx - 55},${cy - 45} Q${cx - 20},${cy - 75} ${cx},${cy - 40} Q${cx + 20},${cy - 75} ${cx + 55},${cy - 45} Q${cx + 90},${cy + 10} ${cx},${cy + 75}Z`} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <path d={`M${cx},${cy + 25} Q${cx - 35},${cy} ${cx - 20},${cy - 20} Q${cx - 8},${cy - 32} ${cx},${cy - 18} Q${cx + 8},${cy - 32} ${cx + 20},${cy - 20} Q${cx + 35},${cy} ${cx},${cy + 25}Z`} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx + 80} y1={cy - 55} x2={cx + 80} y2={cy + 75} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx + 80, cy - 55, "up", ARROW_DARK)}
          {arrowHead(cx + 80, cy + 75, "down", ARROW_DARK)}
          <text x={cx + 90} y={cy + 12} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - 60} y1={cy + 85} x2={cx + 60} y2={cy + 85} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(cx - 60, cy + 85, "left", ARROW_MID)}
          {arrowHead(cx + 60, cy + 85, "right", ARROW_MID)}
          <text x={cx - 3} y={cy + 99} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - 55, cy + 75)}
        </svg>
      );
    case "cushion": {
      const w2 = 65;
      const h2 = 60;
      const r = 18;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <rect x={cx - w2} y={cy - h2} width={w2 * 2} height={h2 * 2} rx={r} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <rect x={cx - w2 + 22} y={cy - h2 + 22} width={(w2 - 22) * 2} height={(h2 - 22) * 2} rx={8} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx - w2} y1={cy + h2 + 18} x2={cx + w2} y2={cy + h2 + 18} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx - w2, cy + h2 + 18, "left", ARROW_DARK)}
          {arrowHead(cx + w2, cy + h2 + 18, "right", ARROW_DARK)}
          <text x={cx - 3} y={cy + h2 + 32} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - w2 - 18} y1={cy - h2} x2={cx - w2 - 18} y2={cy + h2} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(cx - w2 - 18, cy - h2, "up", ARROW_MID)}
          {arrowHead(cx - w2 - 18, cy + h2, "down", ARROW_MID)}
          <text x={cx - w2 - 30} y={cy + 4} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - h2, cy + h2)}
        </svg>
      );
    }
    case "emerald": {
      const c = 14;
      const pts = `${cx - 60 + c},${cy - 55} ${cx + 60 - c},${cy - 55} ${cx + 60},${cy - 55 + c} ${cx + 60},${cy + 55 - c} ${cx + 60 - c},${cy + 55} ${cx - 60 + c},${cy + 55} ${cx - 60},${cy + 55 - c} ${cx - 60},${cy - 55 + c}`;
      const ci = 10;
      const ptsI = `${cx - 35 + ci},${cy - 30} ${cx + 35 - ci},${cy - 30} ${cx + 35},${cy - 30 + ci} ${cx + 35},${cy + 30 - ci} ${cx + 35 - ci},${cy + 30} ${cx - 35 + ci},${cy + 30} ${cx - 35},${cy + 30 - ci} ${cx - 35},${cy - 30 + ci}`;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <polygon points={pts} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <polygon points={ptsI} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx - 60} y1={cy + 55 + 18} x2={cx + 60} y2={cy + 55 + 18} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx - 60, cy + 55 + 18, "left", ARROW_DARK)}
          {arrowHead(cx + 60, cy + 55 + 18, "right", ARROW_DARK)}
          <text x={cx - 3} y={cy + 55 + 32} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - 60 - 18} y1={cy - 55} x2={cx - 60 - 18} y2={cy + 55} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(cx - 60 - 18, cy - 55, "up", ARROW_MID)}
          {arrowHead(cx - 60 - 18, cy + 55, "down", ARROW_MID)}
          <text x={cx - 60 - 30} y={cy + 4} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - 55, cy + 55)}
          <text x={cx} y={H - 4} fill="#6b7280" fontSize={9} textAnchor="middle">Medir lados rectos, no esquinas cortadas</text>
        </svg>
      );
    }
    case "radiant": {
      const c = 18;
      const pts = `${cx - 55 + c},${cy - 55} ${cx + 55 - c},${cy - 55} ${cx + 55},${cy - 55 + c} ${cx + 55},${cy + 55 - c} ${cx + 55 - c},${cy + 55} ${cx - 55 + c},${cy + 55} ${cx - 55},${cy + 55 - c} ${cx - 55},${cy - 55 + c}`;
      const ci = 12;
      const ptsI = `${cx - 30 + ci},${cy - 30} ${cx + 30 - ci},${cy - 30} ${cx + 30},${cy - 30 + ci} ${cx + 30},${cy + 30 - ci} ${cx + 30 - ci},${cy + 30} ${cx - 30 + ci},${cy + 30} ${cx - 30},${cy + 30 - ci} ${cx - 30},${cy - 30 + ci}`;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <polygon points={pts} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <polygon points={ptsI} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx - 55} y1={cy + 55 + 18} x2={cx + 55} y2={cy + 55 + 18} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx - 55, cy + 55 + 18, "left", ARROW_DARK)}
          {arrowHead(cx + 55, cy + 55 + 18, "right", ARROW_DARK)}
          <text x={cx - 3} y={cy + 55 + 32} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - 55 - 18} y1={cy - 55} x2={cx - 55 - 18} y2={cy + 55} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(cx - 55 - 18, cy - 55, "up", ARROW_MID)}
          {arrowHead(cx - 55 - 18, cy + 55, "down", ARROW_MID)}
          <text x={cx - 55 - 30} y={cy + 4} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - 55, cy + 55)}
          <text x={cx} y={H - 4} fill="#6b7280" fontSize={9} textAnchor="middle">Medir lados rectos, no esquinas cortadas</text>
        </svg>
      );
    }
    case "asscher": {
      const c = 22;
      const sz = 55;
      const pts = `${cx - sz + c},${cy - sz} ${cx + sz - c},${cy - sz} ${cx + sz},${cy - sz + c} ${cx + sz},${cy + sz - c} ${cx + sz - c},${cy + sz} ${cx - sz + c},${cy + sz} ${cx - sz},${cy + sz - c} ${cx - sz},${cy - sz + c}`;
      const ci = 15;
      const si = 30;
      const ptsI = `${cx - si + ci},${cy - si} ${cx + si - ci},${cy - si} ${cx + si},${cy - si + ci} ${cx + si},${cy + si - ci} ${cx + si - ci},${cy + si} ${cx - si + ci},${cy + si} ${cx - si},${cy + si - ci} ${cx - si},${cy - si + ci}`;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <polygon points={pts} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <polygon points={ptsI} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx - sz} y1={cy + sz + 18} x2={cx + sz} y2={cy + sz + 18} stroke={ARROW_DARK} strokeWidth={1.5} />
          {arrowHead(cx - sz, cy + sz + 18, "left", ARROW_DARK)}
          {arrowHead(cx + sz, cy + sz + 18, "right", ARROW_DARK)}
          <text x={cx - 3} y={cy + sz + 32} fill={ARROW_DARK} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - sz - 18} y1={cy - sz} x2={cx - sz - 18} y2={cy + sz} stroke={ARROW_MID} strokeWidth={1.5} strokeDasharray="2 2" />
          {arrowHead(cx - sz - 18, cy - sz, "up", ARROW_MID)}
          {arrowHead(cx - sz - 18, cy + sz, "down", ARROW_MID)}
          <text x={cx - sz - 30} y={cy + 4} fill={ARROW_MID} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - sz, cy + sz)}
          <text x={cx} y={H - 4} fill="#6b7280" fontSize={9} textAnchor="middle">Medir lados rectos, no esquinas cortadas</text>
        </svg>
      );
    }
    default:
      return null;
  }
}

// ── Main Component ──
const DiamondWeightCalculator = () => {
  const [pieceType, setPieceType] = useState("piedra_suelta");
  const [stoneCount, setStoneCount] = useState(1);
  const [selectedCut, setSelectedCut] = useState("round");
  const cut = CUTS.find((c) => c.id === selectedCut)!;
  const currentPiece = PIECE_TYPES.find((p) => p.id === pieceType)!;

  useEffect(() => {
    setStoneCount(currentPiece.defaultStones);
  }, [pieceType, currentPiece.defaultStones]);

  const [values, setValues] = useState<Record<string, Record<string, number>>>(() => {
    const init: Record<string, Record<string, number>> = {};
    CUTS.forEach((c) => {
      const dims: Record<string, number> = {};
      c.dimensions.forEach((d) => (dims[d.key] = d.default));
      init[c.id] = dims;
    });
    return init;
  });

  const [manualOverride, setManualOverride] = useState<Record<string, boolean>>({});

  // Reset manual override when cut changes
  useEffect(() => {
    setManualOverride({});
  }, [selectedCut]);

  const dims = values[selectedCut];

  const getPrimaryKey = useCallback(() => {
    return cut.isRound ? "diameter" : "length";
  }, [cut]);

  const getDepthDim = useCallback(() => {
    return cut.dimensions.find((d) => d.key === "depth")!;
  }, [cut]);

  const getPrimaryDim = useCallback(() => {
    const key = getPrimaryKey();
    return cut.dimensions.find((d) => d.key === key)!;
  }, [cut, getPrimaryKey]);

  const setDimViaSlider = (key: string, val: number) => {
    setValues((prev) => {
      const next = { ...prev[selectedCut], [key]: val };
      const depthDim = getDepthDim();
      const primaryKey = getPrimaryKey();

      if (key === "depth" && !manualOverride[primaryKey]) {
        // Moving depth slider → recalculate primary dimension inversely
        const primaryDim = getPrimaryDim();
        const newPrimary = Math.min(primaryDim.max, Math.max(primaryDim.min, parseFloat((val / cut.depthRatio).toFixed(2))));
        next[primaryKey] = newPrimary;
      } else if (key !== "depth" && (key === primaryKey) && !manualOverride.depth) {
        // Moving primary slider → recalculate depth
        const newDepth = Math.min(depthDim.max, Math.max(depthDim.min, parseFloat((val * cut.depthRatio).toFixed(2))));
        next.depth = newDepth;
      }

      return { ...prev, [selectedCut]: next };
    });
  };

  const setDimViaInput = (key: string, val: number) => {
    setManualOverride((prev) => ({ ...prev, [key]: true }));
    setValues((prev) => ({
      ...prev,
      [selectedCut]: { ...prev[selectedCut], [key]: val },
    }));
  };

  const isLinked = !manualOverride.depth && !manualOverride[getPrimaryKey()];

  const resetLink = () => {
    setManualOverride({});
    // Recalculate depth from current primary value
    const primaryKey = getPrimaryKey();
    const depthDim = getDepthDim();
    const primaryVal = dims[primaryKey];
    const newDepth = Math.min(depthDim.max, Math.max(depthDim.min, parseFloat((primaryVal * cut.depthRatio).toFixed(2))));
    setValues((prev) => ({
      ...prev,
      [selectedCut]: { ...prev[selectedCut], depth: newDepth },
    }));
  };

  const result = useMemo(() => {
    if (cut.isRound) {
      const d = dims.diameter;
      const depth = dims.depth;
      const carats = d * d * depth * cut.factor;
      const depthPct = (depth / d) * 100;
      return {
        carats,
        mg: Math.round(carats * 200),
        rangeLow: carats * 0.9,
        rangeHigh: carats * 1.1,
        depthPct,
        formula: `${d.toFixed(2)}² × ${depth.toFixed(2)} × ${cut.factor}`,
      };
    } else {
      const l = dims.length;
      const w = dims.width;
      const depth = dims.depth;
      const carats = l * w * depth * cut.factor;
      const depthPct = (depth / l) * 100;
      return {
        carats,
        mg: Math.round(carats * 200),
        rangeLow: carats * 0.9,
        rangeHigh: carats * 1.1,
        depthPct,
        formula: `${l.toFixed(2)} × ${w.toFixed(2)} × ${depth.toFixed(2)} × ${cut.factor}`,
      };
    }
  }, [dims, cut]);

  const totalCarats = result.carats * stoneCount;
  const totalMg = Math.round(totalCarats * 200);

  const stats = [
    {
      title: "Quilates por piedra",
      value: `${result.carats.toFixed(3)} ct`,
      icon: Gem,
    },
    {
      title: "Miligramos por piedra",
      value: `${result.mg} mg`,
      icon: Weight,
    },
    {
      title: "Rango ±10%",
      value: `${result.rangeLow.toFixed(2)} – ${result.rangeHigh.toFixed(2)} ct`,
      icon: ArrowLeftRight,
    },
    {
      title: "Profundidad %",
      value: `${result.depthPct.toFixed(1)}%`,
      icon: Percent,
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Gem className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Calculadora de Peso de Diamante
            </h1>
          </div>
          <p className="text-muted-foreground">
            Selecciona el tipo de pieza, el corte e ingresa las dimensiones para estimar el peso en quilates
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <stat.icon className="h-4 w-4" />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground tabular-nums">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
          {/* Total card */}
          <Card className={`border-border ${stoneCount > 1 ? "ring-2 ring-primary/30" : ""}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Total ({stoneCount} {stoneCount === 1 ? "piedra" : "piedras"})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground tabular-nums">{totalCarats.toFixed(3)} ct</div>
              <p className="text-xs text-muted-foreground mt-1">{totalMg} mg</p>
            </CardContent>
          </Card>
        </div>

        {/* Piece type selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Diamond className="h-4 w-4" />
              Tipo de pieza
            </h3>
            <TooltipProvider delayDuration={200}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mb-4">
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
                        <span className="leading-tight">{p.name}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>{p.description} · {p.defaultStones} {p.defaultStones === 1 ? "piedra" : "piedras"}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">
                Número de piedras:
              </label>
              <Input
                type="number"
                min={0}
                max={999}
                value={stoneCount}
                onChange={(e) => setStoneCount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24"
              />
              {currentPiece.defaultStones !== stoneCount && (
                <button
                  onClick={() => setStoneCount(currentPiece.defaultStones)}
                  className="text-xs text-primary hover:underline"
                >
                  Restablecer ({currentPiece.defaultStones})
                </button>
              )}
            </div>
            {stoneCount === 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Esta pieza normalmente no lleva diamantes
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cut selector */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-4">Seleccionar corte</h3>
            <div className="grid grid-cols-5 gap-2">
              {CUTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCut(c.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 md:p-3 transition-all text-xs md:text-sm font-medium ${
                    selectedCut === c.id
                      ? "border-foreground bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  <CutIcon cutId={c.id} size={24} />
                  <span className="leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main area: diagram + sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Diagram */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Diagrama de medición
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <MeasurementDiagram cutId={selectedCut} />
              <div className="mt-3 flex gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 rounded bg-foreground" />
                  {cut.isRound ? "Diámetro" : "Largo"}
                </span>
                {!cut.isRound && (
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-3 h-0.5 rounded bg-muted-foreground border-b border-dotted" />
                    Ancho
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 rounded bg-muted-foreground/50 border-b border-dashed" />
                  Profundidad
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Sliders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dimensiones (mm)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {cut.dimensions.map((dim) => (
                <div key={dim.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">
                      {dim.label}
                    </label>
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min={dim.min}
                        max={dim.max}
                        step={0.01}
                        value={dims[dim.key]}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!isNaN(v)) {
                            setDimValue(dim.key, Math.min(dim.max, Math.max(dim.min, v)));
                          }
                        }}
                        className="w-20 h-8 text-sm text-right tabular-nums px-2"
                      />
                      <span className="text-xs text-muted-foreground">mm</span>
                    </div>
                  </div>
                  <Slider
                    min={dim.min}
                    max={dim.max}
                    step={0.01}
                    value={[dims[dim.key]]}
                    onValueChange={([v]) => setDimValue(dim.key, v)}
                    className="w-full"
                  />
                  <p className="text-[11px] text-muted-foreground leading-snug">{dim.hint}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Formula */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Fórmula: <span className="font-mono text-foreground">{result.formula}</span> = <span className="font-semibold text-foreground">{result.carats.toFixed(3)} ct</span>
              {stoneCount > 1 && (
                <span className="ml-2">
                  × {stoneCount} piedras = <span className="font-semibold text-foreground">{totalCarats.toFixed(3)} ct total</span>
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DiamondWeightCalculator;
