import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Search, Loader2, FolderOpen, CheckCircle, ArrowRightCircle, PauseCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProspectCard, type Prospect } from "@/components/client-detail/ProspectCard";
import { ProspectDetailDialog } from "@/components/client-detail/ProspectDetailDialog";
import { ProspectStatusDialog } from "@/components/client-detail/ProspectStatusDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import OrderDialog from "@/components/orders/OrderDialog";
import { generateProspectTitle } from "@/components/client-detail/prospect-utils";

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
  const [filterEstado, setFilterEstado] = useState<string>("todos");
  const [selectedProspect, setSelectedProspect] = useState<ProspectWithClient | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [convertingProspect, setConvertingProspect] = useState<ProspectWithClient | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [deletingProspect, setDeletingProspect] = useState<ProspectWithClient | null>(null);

  useEffect(() => {
    fetchProspects();
  }, []);

  useEffect(() => {
    filterProspects();
  }, [searchQuery, filterEstado, prospects]);

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
    let filtered = [...prospects];

    // Filtrar por estado
    if (filterEstado !== "todos") {
      filtered = filtered.filter((prospect) => prospect.estado === filterEstado);
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((prospect) => {
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
    }

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

  const handleConvertToOrder = async (prospect: ProspectWithClient) => {
    setConvertingProspect(prospect);
    setShowOrderDialog(true);
  };

  const handleOrderCreated = async () => {
    if (!convertingProspect) return;
    
    try {
      const { error } = await supabase
        .from("prospects")
        .update({ estado: "convertido" })
        .eq("id", convertingProspect.id);
      
      if (error) throw error;
      
      toast.success("Proyecto convertido exitosamente a orden");
      setShowOrderDialog(false);
      setConvertingProspect(null);
      fetchProspects();
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al convertir proyecto");
    }
  };

  const handleDeleteProspect = (prospect: ProspectWithClient) => {
    setDeletingProspect(prospect);
  };

  const confirmDeleteProspect = async () => {
    if (!deletingProspect) return;

    try {
      const { error } = await supabase
        .from("prospects")
        .delete()
        .eq("id", deletingProspect.id);

      if (error) throw error;

      toast.success("Proyecto eliminado exitosamente");
      setDeletingProspect(null);
      fetchProspects();
    } catch (error) {
      console.error("Error deleting prospect:", error);
      toast.error("Error al eliminar el proyecto");
    }
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
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Proyectos</h1>
            <p className="text-muted-foreground">
              Explora todos los proyectos de joyería de tus clientes
            </p>
          </div>
        </div>

        {/* Dashboard de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                Total proyectos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.activo}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ArrowRightCircle className="h-4 w-4" />
                Convertidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.convertido}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PauseCircle className="h-4 w-4" />
                En pausa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.en_pausa}</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Inactivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-muted-foreground">{stats.inactivo}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros Avanzados */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros avanzados</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Búsqueda */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, tipo, estado o palabra clave..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* Filtro por estado */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Estado:</span>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="convertido">Convertido</SelectItem>
                    <SelectItem value="en_pausa">En pausa</SelectItem>
                    <SelectItem value="inactivo">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contador de resultados */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <span className="text-sm text-muted-foreground">
            {filteredProspects.length} resultados encontrados
          </span>
        </div>

        {/* Lista de proyectos */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredProspects.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery || filterEstado !== "todos" 
                ? "No se encontraron proyectos con esos filtros" 
                : "No hay proyectos registrados"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredProspects.map((prospect) => (
              <ProspectCard
                key={prospect.id}
                prospect={prospect}
                onClick={() => handleProspectClick(prospect)}
                onEditStatus={() => handleEditStatus(prospect)}
                onConvertToOrder={() => handleConvertToOrder(prospect)}
                onDelete={() => handleDeleteProspect(prospect)}
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

        {/* Dialog de Nueva Orden */}
        <OrderDialog
          open={showOrderDialog}
          onOpenChange={setShowOrderDialog}
          prospect={convertingProspect}
          clientId={convertingProspect?.clients.id}
          onSuccess={handleOrderCreated}
        />

        {/* Dialog de Confirmación de Eliminación */}
        <AlertDialog 
          open={!!deletingProspect} 
          onOpenChange={(open) => !open && setDeletingProspect(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Estás seguro de eliminar el proyecto "{deletingProspect ? generateProspectTitle(deletingProspect) : ""}"? 
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeleteProspect} 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
