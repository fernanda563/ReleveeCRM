export type ProspectLike = {
  tipo_accesorio: string | null;
  subtipo_accesorio: string | null;
  estilo_anillo: string | null;
  estado?: string | null;
};

export const generateProspectTitle = (prospect: ProspectLike) => {
  const tipo = (prospect.tipo_accesorio || "").trim().toLowerCase();
  const subtipo = (prospect.subtipo_accesorio || "").trim().toLowerCase();
  const estilo = (prospect.estilo_anillo || "").trim().toLowerCase().replace(/_/g, " ");

  let title = tipo || "proyecto";
  if (subtipo) {
    // e.g., "anillo de compromiso"
    title += ` de ${subtipo}`;
  }
  if (estilo) {
    // e.g., "anillo de compromiso estilo solitario"
    title += ` estilo ${estilo}`;
  }
  return title;
};

export const getStatusColor = (estado?: string | null) => {
  switch (estado) {
    case "activo":
      return "bg-success/10 text-success";
    case "convertido":
      return "bg-primary/10 text-primary";
    case "en_pausa":
      return "bg-warning/10 text-warning";
    case "inactivo":
      return "bg-muted/50 text-muted-foreground";
    default:
      return "bg-muted";
  }
};
