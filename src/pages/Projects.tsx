import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProspectCard, type Prospect } from "@/components/client-detail/ProspectCard";
import { ProspectDetailDialog } from "@/components/client-detail/ProspectDetailDialog";
import { ProspectStatusDialog } from "@/components/client-detail/ProspectStatusDialog";

interface ProspectWithClient extends Prospect {
  clients: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export default function Projects() {
  const [prospects, setProspects] = useState<ProspectWithClient[]>([]);
  const [filteredProspects, setFilteredProspects] = useState<ProspectWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProspect, setSelectedProspect] = useState<ProspectWithClient | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  useEffect(() => {
    fetchProspects();
  }, []);

  useEffect(() => {
    filterProspects();
  }, [searchQuery, prospects]);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("prospects")
        .select(`
          *,
          clients (
            id,
            nombre,
            apellido
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProspects(data as ProspectWithClient[]);
    } catch (error) {
      console.error("Error al cargar proyectos:", error);
      toast.error("Error al cargar los proyectos");
    } finally {
      setLoading(false);
    }
  };

  const filterProspects = () => {
    if (!searchQuery.trim()) {
      setFilteredProspects(prospects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = prospects.filter((prospect) => {
      const clientName = `${prospect.clients.nombre} ${prospect.clients.apellido}`.toLowerCase();
      const tipoAccesorio = (prospect.tipo_accesorio || "").toLowerCase();
      const subtipoAccesorio = (prospect.subtipo_accesorio || "").toLowerCase();
      const estado = (prospect.estado || "").toLowerCase();
      const observaciones = (prospect.observaciones || "").toLowerCase();

      return (
        clientName.includes(query) ||
        tipoAccesorio.includes(query) ||
        subtipoAccesorio.includes(query) ||
        estado.includes(query) ||
        observaciones.includes(query)
      );
    });

    setFilteredProspects(filtered);
  };

  const handleProspectClick = (prospect: ProspectWithClient) => {
    setSelectedProspect(prospect);
    setDetailDialogOpen(true);
  };

  const handleEditStatus = (prospect: ProspectWithClient) => {
    setSelectedProspect(prospect);
    setStatusDialogOpen(true);
  };

  const handleProspectSaved = () => {
    fetchProspects();
    setDetailDialogOpen(false);
  };

  // Calcular estadísticas
  const stats = {
    total: prospects.length,
    activo: prospects.filter(p => p.estado === "activo").length,
    convertido: prospects.filter(p => p.estado === "convertido").length,
    en_pausa: prospects.filter(p => p.estado === "en_pausa").length,
    inactivo: prospects.filter(p => p.estado === "inactivo").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Proyectos</h1>
        <p className="text-muted-foreground mt-1">
          Explora todos los proyectos de joyería de tus clientes
        </p>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, tipo, estado o palabra clave..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.activo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Convertidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.convertido}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              En Pausa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.en_pausa}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactivo}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de proyectos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredProspects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {searchQuery ? "No se encontraron proyectos con esa búsqueda" : "No hay proyectos registrados"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProspects.map((prospect) => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              onClick={() => handleProspectClick(prospect)}
              onEditStatus={() => handleEditStatus(prospect)}
              showClientName
              clientName={`${prospect.clients.nombre} ${prospect.clients.apellido}`}
              clientId={prospect.clients.id}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {selectedProspect && (
        <>
          <ProspectDetailDialog
            prospect={selectedProspect}
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            onSaved={handleProspectSaved}
          />
          <ProspectStatusDialog
            prospect={selectedProspect}
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            onSaved={handleProspectSaved}
          />
        </>
      )}
    </div>
  );
}
