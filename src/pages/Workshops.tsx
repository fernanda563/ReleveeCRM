import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Factory,
  MapPin,
  Loader2,
  Mail,
  Phone,
  ClipboardList,
  Settings2,
  FileText,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { WorkshopDialog } from "@/components/workshops/WorkshopDialog";
import { WorkshopProcessesDialog } from "@/components/workshops/WorkshopProcessesDialog";
import { WorkshopAccountStatement } from "@/components/workshops/WorkshopAccountStatement";
import { Workshop, WorkshopProcess } from "@/types/workshops";

interface WorkshopWithDetails extends Workshop {
  workshop_processes: WorkshopProcess[];
  _count?: {
    work_orders: number;
  };
}

const Workshops = () => {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [workshops, setWorkshops] = useState<WorkshopWithDetails[]>([]);
  const [filteredWorkshops, setFilteredWorkshops] = useState<WorkshopWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [processesDialogOpen, setProcessesDialogOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin()) {
      toast.error("No tienes permisos para acceder a esta página");
      navigate("/dashboard");
    }
  }, [isAdmin, roleLoading, navigate]);

  useEffect(() => {
    if (isAdmin() && !roleLoading) {
      fetchWorkshops();
    }
  }, [roleLoading]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = workshops.filter(
        (workshop) =>
          workshop.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          workshop.responsable_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (workshop.ubicacion_ciudad?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
      setFilteredWorkshops(filtered);
    } else {
      setFilteredWorkshops(workshops);
    }
  }, [searchTerm, workshops]);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      
      // Fetch workshops with their processes
      const { data: workshopsData, error: workshopsError } = await supabase
        .from("workshops")
        .select(`
          *,
          workshop_processes(
            id,
            work_concept_id,
            costo_acordado,
            tiempo_estimado_dias,
            activo
          )
        `)
        .order("created_at", { ascending: false });

      if (workshopsError) throw workshopsError;

      // Fetch work order counts per workshop
      const { data: orderCounts, error: countsError } = await supabase
        .from("work_orders")
        .select("workshop_id")
        .not("workshop_id", "is", null);

      if (countsError) throw countsError;

      // Count orders per workshop
      const countMap: Record<string, number> = {};
      (orderCounts || []).forEach((order) => {
        if (order.workshop_id) {
          countMap[order.workshop_id] = (countMap[order.workshop_id] || 0) + 1;
        }
      });

      const workshopsWithCounts = (workshopsData || []).map((w) => ({
        ...w,
        workshop_processes: w.workshop_processes || [],
        _count: {
          work_orders: countMap[w.id] || 0,
        },
      }));

      setWorkshops(workshopsWithCounts);
      setFilteredWorkshops(workshopsWithCounts);
    } catch (error: any) {
      console.error("Error fetching workshops:", error);
      if (error?.message && !error?.message.includes("Failed to fetch")) {
        toast.error("Error al cargar los talleres");
      }
    } finally {
      setLoading(false);
    }
  };

  const getActiveWorkshops = () => workshops.filter((w) => w.activo).length;
  
  const getTotalActiveOrders = () => 
    workshops.reduce((sum, w) => sum + (w._count?.work_orders || 0), 0);

  const handleEdit = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setDialogOpen(true);
  };

  const handleProcesses = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setProcessesDialogOpen(true);
  };

  const handleAccount = (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setAccountDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedWorkshop(null);
    setDialogOpen(true);
  };

  const getLocationString = (workshop: Workshop) => {
    const parts = [
      workshop.ubicacion_ciudad,
      workshop.ubicacion_estado,
      workshop.ubicacion_pais,
    ].filter(Boolean);
    return parts.join(", ") || "Sin ubicación";
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin()) {
    return null;
  }

  return (
    <main className="min-h-full bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestión de Talleres</h1>
          <p className="text-muted-foreground mt-2">
            Administra los talleres externos y sus procesos de fabricación
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Talleres</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{workshops.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Talleres Activos</CardTitle>
              <Factory className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getActiveWorkshops()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Órdenes de Trabajo</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{getTotalActiveOrders()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, responsable o ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Taller
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Workshops List */}
        <div className="space-y-4">
          {filteredWorkshops.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Factory className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No se encontraron talleres</p>
              </CardContent>
            </Card>
          ) : (
            filteredWorkshops.map((workshop) => (
              <Card key={workshop.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{workshop.nombre}</h3>
                        <Badge variant={workshop.activo ? "default" : "secondary"}>
                          {workshop.activo ? "Activo" : "Inactivo"}
                        </Badge>
                        {(workshop._count?.work_orders ?? 0) > 0 && (
                          <Badge variant="outline">
                            {workshop._count?.work_orders} órdenes
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">
                          Responsable: {workshop.responsable_nombre}
                        </p>
                        {workshop.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {workshop.email}
                          </p>
                        )}
                        {workshop.responsable_telefono && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {workshop.responsable_telefono_codigo_pais || "+52"}{" "}
                            {workshop.responsable_telefono}
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {getLocationString(workshop)}
                        </p>
                      </div>

                      {/* Process badges */}
                      {workshop.workshop_processes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground mr-2">
                            {workshop.workshop_processes.length} procesos asignados
                          </span>
                        </div>
                      )}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          Acciones
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(workshop)}>
                          <Settings2 className="h-4 w-4 mr-2" />
                          Editar Taller
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleProcesses(workshop)}>
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Ver Procesos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAccount(workshop)}>
                          <FileText className="h-4 w-4 mr-2" />
                          Estado de Cuenta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <WorkshopDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workshop={selectedWorkshop}
        onSuccess={fetchWorkshops}
      />

      <WorkshopProcessesDialog
        open={processesDialogOpen}
        onOpenChange={setProcessesDialogOpen}
        workshop={selectedWorkshop}
        onSuccess={fetchWorkshops}
      />

      <WorkshopAccountStatement
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        workshop={selectedWorkshop}
      />
    </main>
  );
};

export default Workshops;
