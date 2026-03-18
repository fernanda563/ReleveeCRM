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

  let title = tipo || "cotización";
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
      return "border-transparent bg-primary text-primary-foreground";
    case "convertido":
      return "border-border bg-secondary text-secondary-foreground";
    case "en_pausa":
      return "border-border bg-background text-foreground";
    case "inactivo":
      return "border-border bg-muted/70 text-muted-foreground";
    case "vencida":
      return "border-border bg-muted text-foreground";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
};

export const getVigenciaStatus = (prospect: { estado: string; fecha_vigencia?: string | null }) => {
  if (prospect.estado === "convertido") {
    return { label: "Convertido", color: getStatusColor("convertido") };
  }
  if (prospect.estado === "en_pausa") {
    return { label: "En pausa", color: getStatusColor("en_pausa") };
  }
  if (prospect.estado === "inactivo") {
    return { label: "Inactivo", color: getStatusColor("inactivo") };
  }
  if (prospect.fecha_vigencia) {
    const now = new Date();
    const vigencia = new Date(prospect.fecha_vigencia + "T23:59:59");
    if (vigencia < now) {
      return { label: "Vencida", color: getStatusColor("vencida") };
    }
    const formatted = new Date(prospect.fecha_vigencia).toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return { label: `Vigente hasta ${formatted}`, color: getStatusColor("activo") };
  }
  return { label: "Sin vigencia", color: "bg-muted/50 text-muted-foreground" };
};
