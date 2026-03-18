import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gem } from "lucide-react";

// ── Colors for measurement arrows ──
const BLUE = "#378ADD";
const GREEN = "#1D9E75";
const RED = "#E24B4A";

// ── Cut definitions ──
interface DimensionDef {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  hint: string;
  color: string;
}

interface CutDef {
  id: string;
  name: string;
  factor: number;
  isRound: boolean;
  dimensions: DimensionDef[];
  note?: string;
}

const CUTS: CutDef[] = [
  {
    id: "round", name: "Round", factor: 0.0061, isRound: true,
    dimensions: [
      { key: "diameter", label: "Diameter", min: 2, max: 15, default: 6.5, hint: "Measure across the girdle at the widest point", color: BLUE },
      { key: "depth", label: "Depth", min: 1, max: 12, default: 4.0, hint: "From table (top) to culet (bottom)", color: RED },
    ],
  },
  {
    id: "princess", name: "Princess", factor: 0.0083, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 2, max: 15, default: 5.5, hint: "Longer side measured at the girdle", color: BLUE },
      { key: "width", label: "Width", min: 2, max: 15, default: 5.5, hint: "Shorter side measured at the girdle", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 12, default: 3.9, hint: "From table to culet", color: RED },
    ],
  },
  {
    id: "oval", name: "Oval", factor: 0.0062, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 3, max: 20, default: 8.0, hint: "Major axis: tip to tip", color: BLUE },
      { key: "width", label: "Width", min: 2, max: 15, default: 5.5, hint: "Minor axis: widest perpendicular point", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 12, default: 3.8, hint: "From table to culet", color: RED },
    ],
  },
  {
    id: "marquise", name: "Marquise", factor: 0.00565, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 4, max: 25, default: 10.0, hint: "Tip to tip along the long axis", color: BLUE },
      { key: "width", label: "Width", min: 2, max: 12, default: 5.0, hint: "Widest point perpendicular to length", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 10, default: 3.5, hint: "From table to culet", color: RED },
    ],
  },
  {
    id: "pear", name: "Pear", factor: 0.0059, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 4, max: 20, default: 9.0, hint: "From the pointed tip to the top of the rounded end", color: BLUE },
      { key: "width", label: "Width", min: 3, max: 14, default: 5.5, hint: "Widest point of the rounded section", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 10, default: 3.6, hint: "From table to culet", color: RED },
    ],
  },
  {
    id: "heart", name: "Heart", factor: 0.0059, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 4, max: 18, default: 8.0, hint: "From bottom tip to the center of the cleft at top", color: BLUE },
      { key: "width", label: "Width", min: 4, max: 18, default: 8.0, hint: "Lobe to lobe at the widest point", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 10, default: 4.8, hint: "From table to culet", color: RED },
    ],
  },
  {
    id: "cushion", name: "Cushion", factor: 0.0082, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 3, max: 18, default: 6.5, hint: "Longer side measured at the girdle", color: BLUE },
      { key: "width", label: "Width", min: 3, max: 15, default: 6.0, hint: "Shorter side measured at the girdle", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 12, default: 4.1, hint: "From table to culet", color: RED },
    ],
  },
  {
    id: "emerald", name: "Emerald", factor: 0.0092, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 4, max: 22, default: 8.0, hint: "Long side of the rectangle measured at the girdle (not the corners)", color: BLUE },
      { key: "width", label: "Width", min: 3, max: 16, default: 6.0, hint: "Short side measured at the girdle", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 12, default: 4.0, hint: "From table to culet", color: RED },
    ],
  },
  {
    id: "radiant", name: "Radiant", factor: 0.0083, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 4, max: 18, default: 7.5, hint: "Longer straight side at the girdle — do NOT measure across the cut corners", color: BLUE },
      { key: "width", label: "Width", min: 3, max: 15, default: 6.0, hint: "Shorter straight side at the girdle", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 12, default: 4.4, hint: "From table to culet", color: RED },
    ],
  },
  {
    id: "asscher", name: "Asscher", factor: 0.0080, isRound: false,
    dimensions: [
      { key: "length", label: "Length", min: 3, max: 16, default: 6.0, hint: "One straight side of the octagon (between two cut corners)", color: BLUE },
      { key: "width", label: "Width", min: 3, max: 16, default: 6.0, hint: "Opposite parallel side — should be nearly equal to length", color: GREEN },
      { key: "depth", label: "Depth", min: 1, max: 12, default: 4.2, hint: "From table to culet", color: RED },
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
    case "heart": {
      return (
        <svg width={s} height={s} viewBox="0 0 28 28">
          <path d="M14,25 Q2,16 4,9 Q6,3 14,8 Q22,3 24,9 Q26,16 14,25Z" fill="none" stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    }
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

// ── Arrow helpers ──
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

// ── Measurement diagram SVGs ──
function MeasurementDiagram({ cutId }: { cutId: string }) {
  const W = 280;
  const H = 280;
  const cx = 120;
  const cy = 130;
  const sw = 1.5;
  const fillTable = "rgba(200,200,220,0.15)";
  const strokeShape = "#9ca3af";

  // Common depth arrow on the right
  const depthArrow = (top: number, bottom: number) => (
    <g>
      <line x1={230} y1={top} x2={230} y2={bottom} stroke={RED} strokeWidth={1.5} strokeDasharray="4 3" />
      {arrowHead(230, top, "up", RED)}
      {arrowHead(230, bottom, "down", RED)}
      <text x={245} y={(top + bottom) / 2 + 4} fill={RED} fontSize={11} fontWeight={600}>D</text>
      {/* tick marks */}
      <line x1={226} y1={top} x2={234} y2={top} stroke={RED} strokeWidth={1.5} />
      <line x1={226} y1={bottom} x2={234} y2={bottom} stroke={RED} strokeWidth={1.5} />
    </g>
  );

  switch (cutId) {
    case "round": {
      const r = 70;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={strokeShape} strokeWidth={sw} />
          {/* table facet - octagon */}
          <polygon points={`${cx},${cy - 35} ${cx + 25},${cy - 25} ${cx + 35},${cy} ${cx + 25},${cy + 25} ${cx},${cy + 35} ${cx - 25},${cy + 25} ${cx - 35},${cy} ${cx - 25},${cy - 25}`} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          {/* diameter arrow (blue) */}
          <line x1={cx - r} y1={cy + r + 18} x2={cx + r} y2={cy + r + 18} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx - r, cy + r + 18, "left", BLUE)}
          {arrowHead(cx + r, cy + r + 18, "right", BLUE)}
          <text x={cx - 5} y={cy + r + 32} fill={BLUE} fontSize={11} fontWeight={600}>∅</text>
          {depthArrow(cy - r, cy + r)}
          <text x={cx - 40} y={H - 8} fill="#6b7280" fontSize={10} textAnchor="middle">Girdle</text>
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
          {/* length */}
          <line x1={x0} y1={cy + sz + 18} x2={x0 + sz * 2} y2={cy + sz + 18} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(x0, cy + sz + 18, "left", BLUE)}
          {arrowHead(x0 + sz * 2, cy + sz + 18, "right", BLUE)}
          <text x={cx - 3} y={cy + sz + 32} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          {/* width */}
          <line x1={x0 - 18} y1={y0} x2={x0 - 18} y2={y0 + sz * 2} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(x0 - 18, y0, "up", GREEN)}
          {arrowHead(x0 - 18, y0 + sz * 2, "down", GREEN)}
          <text x={x0 - 30} y={cy + 4} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
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
          <line x1={cx - rx} y1={cy + ry + 18} x2={cx + rx} y2={cy + ry + 18} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx - rx, cy + ry + 18, "left", BLUE)}
          {arrowHead(cx + rx, cy + ry + 18, "right", BLUE)}
          <text x={cx - 3} y={cy + ry + 32} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - rx - 18} y1={cy - ry} x2={cx - rx - 18} y2={cy + ry} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(cx - rx - 18, cy - ry, "up", GREEN)}
          {arrowHead(cx - rx - 18, cy + ry, "down", GREEN)}
          <text x={cx - rx - 30} y={cy + 4} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
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
          <line x1={cx - rx} y1={cy + ry + 18} x2={cx + rx} y2={cy + ry + 18} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx - rx, cy + ry + 18, "left", BLUE)}
          {arrowHead(cx + rx, cy + ry + 18, "right", BLUE)}
          <text x={cx - 3} y={cy + ry + 32} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - rx - 18} y1={cy - ry} x2={cx - rx - 18} y2={cy + ry} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(cx - rx - 18, cy - ry, "up", GREEN)}
          {arrowHead(cx - rx - 18, cy + ry, "down", GREEN)}
          <text x={cx - rx - 30} y={cy + 4} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - ry, cy + ry)}
        </svg>
      );
    }
    case "pear": {
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <path d={`M${cx},${cy + 80} Q${cx - 65},${cy} ${cx},${cy - 70} Q${cx + 65},${cy} ${cx},${cy + 80}Z`} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <path d={`M${cx},${cy + 35} Q${cx - 25},${cy + 5} ${cx},${cy - 25} Q${cx + 25},${cy + 5} ${cx},${cy + 35}Z`} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx + 75} y1={cy - 70} x2={cx + 75} y2={cy + 80} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx + 75, cy - 70, "up", BLUE)}
          {arrowHead(cx + 75, cy + 80, "down", BLUE)}
          <text x={cx + 85} y={cy + 8} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - 55} y1={cy + 90} x2={cx + 55} y2={cy + 90} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(cx - 55, cy + 90, "left", GREEN)}
          {arrowHead(cx + 55, cy + 90, "right", GREEN)}
          <text x={cx - 3} y={cy + 104} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - 70, cy + 80)}
        </svg>
      );
    }
    case "heart": {
      return (
        <svg width={W} height={H} viewBox="0 0 280 280" className="mx-auto">
          <path d={`M${cx},${cy + 75} Q${cx - 90},${cy + 10} ${cx - 55},${cy - 45} Q${cx - 20},${cy - 75} ${cx},${cy - 40} Q${cx + 20},${cy - 75} ${cx + 55},${cy - 45} Q${cx + 90},${cy + 10} ${cx},${cy + 75}Z`} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <path d={`M${cx},${cy + 25} Q${cx - 35},${cy} ${cx - 20},${cy - 20} Q${cx - 8},${cy - 32} ${cx},${cy - 18} Q${cx + 8},${cy - 32} ${cx + 20},${cy - 20} Q${cx + 35},${cy} ${cx},${cy + 25}Z`} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx + 80} y1={cy - 55} x2={cx + 80} y2={cy + 75} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx + 80, cy - 55, "up", BLUE)}
          {arrowHead(cx + 80, cy + 75, "down", BLUE)}
          <text x={cx + 90} y={cy + 12} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - 60} y1={cy + 85} x2={cx + 60} y2={cy + 85} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(cx - 60, cy + 85, "left", GREEN)}
          {arrowHead(cx + 60, cy + 85, "right", GREEN)}
          <text x={cx - 3} y={cy + 99} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - 55, cy + 75)}
        </svg>
      );
    }
    case "cushion": {
      const w2 = 65;
      const h2 = 60;
      const r = 18;
      return (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
          <rect x={cx - w2} y={cy - h2} width={w2 * 2} height={h2 * 2} rx={r} fill="none" stroke={strokeShape} strokeWidth={sw} />
          <rect x={cx - w2 + 22} y={cy - h2 + 22} width={(w2 - 22) * 2} height={(h2 - 22) * 2} rx={8} fill={fillTable} stroke={strokeShape} strokeWidth={0.8} />
          <line x1={cx - w2} y1={cy + h2 + 18} x2={cx + w2} y2={cy + h2 + 18} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx - w2, cy + h2 + 18, "left", BLUE)}
          {arrowHead(cx + w2, cy + h2 + 18, "right", BLUE)}
          <text x={cx - 3} y={cy + h2 + 32} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - w2 - 18} y1={cy - h2} x2={cx - w2 - 18} y2={cy + h2} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(cx - w2 - 18, cy - h2, "up", GREEN)}
          {arrowHead(cx - w2 - 18, cy + h2, "down", GREEN)}
          <text x={cx - w2 - 30} y={cy + 4} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
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
          <line x1={cx - 60} y1={cy + 55 + 18} x2={cx + 60} y2={cy + 55 + 18} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx - 60, cy + 55 + 18, "left", BLUE)}
          {arrowHead(cx + 60, cy + 55 + 18, "right", BLUE)}
          <text x={cx - 3} y={cy + 55 + 32} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - 60 - 18} y1={cy - 55} x2={cx - 60 - 18} y2={cy + 55} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(cx - 60 - 18, cy - 55, "up", GREEN)}
          {arrowHead(cx - 60 - 18, cy + 55, "down", GREEN)}
          <text x={cx - 60 - 30} y={cy + 4} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - 55, cy + 55)}
          <text x={cx} y={H - 4} fill="#6b7280" fontSize={9} textAnchor="middle">Measure straight sides, not cut corners</text>
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
          <line x1={cx - 55} y1={cy + 55 + 18} x2={cx + 55} y2={cy + 55 + 18} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx - 55, cy + 55 + 18, "left", BLUE)}
          {arrowHead(cx + 55, cy + 55 + 18, "right", BLUE)}
          <text x={cx - 3} y={cy + 55 + 32} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - 55 - 18} y1={cy - 55} x2={cx - 55 - 18} y2={cy + 55} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(cx - 55 - 18, cy - 55, "up", GREEN)}
          {arrowHead(cx - 55 - 18, cy + 55, "down", GREEN)}
          <text x={cx - 55 - 30} y={cy + 4} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - 55, cy + 55)}
          <text x={cx} y={H - 4} fill="#6b7280" fontSize={9} textAnchor="middle">Measure straight sides, not cut corners</text>
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
          <line x1={cx - sz} y1={cy + sz + 18} x2={cx + sz} y2={cy + sz + 18} stroke={BLUE} strokeWidth={1.5} />
          {arrowHead(cx - sz, cy + sz + 18, "left", BLUE)}
          {arrowHead(cx + sz, cy + sz + 18, "right", BLUE)}
          <text x={cx - 3} y={cy + sz + 32} fill={BLUE} fontSize={11} fontWeight={600}>L</text>
          <line x1={cx - sz - 18} y1={cy - sz} x2={cx - sz - 18} y2={cy + sz} stroke={GREEN} strokeWidth={1.5} />
          {arrowHead(cx - sz - 18, cy - sz, "up", GREEN)}
          {arrowHead(cx - sz - 18, cy + sz, "down", GREEN)}
          <text x={cx - sz - 30} y={cy + 4} fill={GREEN} fontSize={11} fontWeight={600}>W</text>
          {depthArrow(cy - sz, cy + sz)}
          <text x={cx} y={H - 4} fill="#6b7280" fontSize={9} textAnchor="middle">Measure straight sides, not cut corners</text>
        </svg>
      );
    }
    default:
      return null;
  }
}

// ── Main Component ──
const DiamondWeightCalculator = () => {
  const [selectedCut, setSelectedCut] = useState("round");
  const cut = CUTS.find((c) => c.id === selectedCut)!;

  // Initialize dimension values from defaults
  const [values, setValues] = useState<Record<string, Record<string, number>>>(() => {
    const init: Record<string, Record<string, number>> = {};
    CUTS.forEach((c) => {
      const dims: Record<string, number> = {};
      c.dimensions.forEach((d) => (dims[d.key] = d.default));
      init[c.id] = dims;
    });
    return init;
  });

  const dims = values[selectedCut];

  const setDimValue = (key: string, val: number) => {
    setValues((prev) => ({
      ...prev,
      [selectedCut]: { ...prev[selectedCut], [key]: val },
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

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Gem className="h-6 w-6 text-primary" />
          Calculadora de Diamante
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Selecciona un corte e ingresa las dimensiones para estimar el peso en quilates.
        </p>
      </div>

      {/* Cut selector */}
      <div className="grid grid-cols-5 gap-2">
        {CUTS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCut(c.id)}
            className={`flex flex-col items-center gap-1 rounded-lg border-2 p-2 md:p-3 transition-all text-xs md:text-sm font-medium hover:shadow-sm ${
              selectedCut === c.id
                ? "border-[#378ADD] bg-[#378ADD]/5 text-[#378ADD]"
                : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40"
            }`}
          >
            <CutIcon cutId={c.id} size={24} />
            <span className="leading-tight">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Main area: diagram + sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Diagram */}
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <MeasurementDiagram cutId={selectedCut} />
            <div className="mt-3 flex gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 rounded" style={{ background: BLUE }} />
                {cut.isRound ? "Diameter" : "Length"}
              </span>
              {!cut.isRound && (
                <span className="flex items-center gap-1">
                  <span className="inline-block w-3 h-0.5 rounded" style={{ background: GREEN }} />
                  Width
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-0.5 rounded border-dashed" style={{ background: RED }} />
                Depth
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Sliders */}
        <Card>
          <CardContent className="pt-6 space-y-5">
            {cut.dimensions.map((dim) => (
              <div key={dim.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: dim.color }} />
                    {dim.label}
                  </label>
                  <span className="text-sm font-semibold tabular-nums" style={{ color: dim.color }}>
                    {dims[dim.key].toFixed(2)} mm
                  </span>
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

      {/* Results */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ResultBox label="Quilates estimados" value={`${result.carats.toFixed(3)} ct`} large />
            <ResultBox label="Miligramos" value={`${result.mg} mg`} />
            <ResultBox label="Rango ±10%" value={`${result.rangeLow.toFixed(2)} – ${result.rangeHigh.toFixed(2)} ct`} />
            <ResultBox label="Depth %" value={`${result.depthPct.toFixed(1)}%`} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-4">
            Fórmula: <span className="font-mono">{result.formula}</span> = {result.carats.toFixed(3)} ct
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

function ResultBox({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4 text-center space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-semibold tabular-nums flex items-center justify-center gap-1.5 ${large ? "text-xl" : "text-base"}`}>
        {large && <Gem className="h-4 w-4 text-primary" />}
        {value}
      </p>
    </div>
  );
}

export default DiamondWeightCalculator;
