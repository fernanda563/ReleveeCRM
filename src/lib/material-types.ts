export const TIPOS_MATERIAL_METALES = [
  { value: "oro", label: "Oro" },
  { value: "plata", label: "Plata" },
  { value: "platino", label: "Platino" },
  { value: "acero", label: "Acero" },
  { value: "titanio", label: "Titanio" },
] as const;

export const TIPOS_MATERIAL_PIEDRAS = [
  { value: "diamante", label: "Diamante" },
  { value: "rubi", label: "Rubí" },
  { value: "esmeralda", label: "Esmeralda" },
  { value: "zafiro", label: "Zafiro" },
  { value: "perla", label: "Perla" },
  { value: "otra", label: "Otra" },
] as const;

export const KILATAJES: Record<string, { value: string; label: string }[]> = {
  oro: [
    { value: "10k", label: "10k" },
    { value: "14k", label: "14k" },
    { value: "18k", label: "18k" },
    { value: "24k", label: "24k" },
  ],
  plata: [
    { value: "925", label: "925" },
    { value: "950", label: "950" },
  ],
  platino: [
    { value: "950", label: "950" },
  ],
};

export const COLORES_ORO = [
  { value: "amarillo", label: "Amarillo" },
  { value: "blanco", label: "Blanco" },
  { value: "rosado", label: "Rosado" },
] as const;

export function getTiposMaterialPorCategoria(categoria: string) {
  if (categoria === "Metales") return TIPOS_MATERIAL_METALES;
  if (categoria === "Piedras Preciosas") return TIPOS_MATERIAL_PIEDRAS;
  return [];
}

export function getKilatajes(tipoMaterial: string) {
  return KILATAJES[tipoMaterial] || [];
}

export function tieneColor(tipoMaterial: string) {
  return tipoMaterial === "oro";
}

export function generarNombreMaterial(
  tipoMaterial: string,
  kilataje: string,
  color: string,
  tipos: readonly { value: string; label: string }[]
) {
  const tipoLabel = tipos.find((t) => t.value === tipoMaterial)?.label || tipoMaterial;
  const parts = [tipoLabel];
  if (kilataje) parts.push(kilataje);
  if (color) {
    const colorLabel = COLORES_ORO.find((c) => c.value === color)?.label || color;
    parts.push(colorLabel);
  }
  return parts.join(" ");
}
