import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Designer, DesignerProcess } from "@/types/designers";
import { DesignerDialog } from "@/components/designers/DesignerDialog";
import { DesignerProcessesDialog } from "@/components/designers/DesignerProcessesDialog";
import { DesignerAccountStatement } from "@/components/designers/DesignerAccountStatement";
import { Plus, Search, MoreHorizontal, Pencil, ListChecks, FileText, Users, UserCheck, Briefcase, Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export default function Designers() {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [designerProcesses, setDesignerProcesses] = useState<Record<string, DesignerProcess[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDesigner, setEditingDesigner] = useState<Designer | null>(null);
  
  const [processesDialogOpen, setProcessesDialogOpen] = useState(false);
  const [processesDesigner, setProcessesDesigner] = useState<Designer | null>(null);
  
  const [statementOpen, setStatementOpen] = useState(false);
  const [statementDesigner, setStatementDesigner] = useState<Designer | null>(null);

  const [workOrderCounts, setWorkOrderCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchDesigners();
  }, []);

  const fetchDesigners = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("designers")
        .select("*")
        .order("nombre");

      if (error) throw error;
      setDesigners(data || []);

      // Fetch processes for each designer
      const { data: processes, error: processesError } = await supabase
        .from("designer_processes")
        .select(`
          *,
          work_concept:work_concepts(id, nombre, area)
        `);

      if (processesError) throw processesError;

      const processesMap: Record<string, DesignerProcess[]> = {};
      (processes || []).forEach(p => {
        if (!processesMap[p.designer_id]) {
          processesMap[p.designer_id] = [];
        }
        processesMap[p.designer_id].push(p);
      });
      setDesignerProcesses(processesMap);

      // Fetch work order counts
      const { data: workOrders, error: workOrdersError } = await supabase
        .from("work_orders")
        .select("designer_id")
        .not("designer_id", "is", null);

      if (!workOrdersError && workOrders) {
        const counts: Record<string, number> = {};
        workOrders.forEach(wo => {
          if (wo.designer_id) {
            counts[wo.designer_id] = (counts[wo.designer_id] || 0) + 1;
          }
        });
        setWorkOrderCounts(counts);
      }
    } catch (error: any) {
      toast.error("Error al cargar diseñadores");
    } finally {
      setLoading(false);
    }
  };

  const filteredDesigners = designers.filter(d =>
    d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.especialidad?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDesigners = designers.length;
  const activeDesigners = designers.filter(d => d.activo).length;
  const totalWorkOrders = Object.values(workOrderCounts).reduce((sum, c) => sum + c, 0);

  const handleNewDesigner = () => {
    setEditingDesigner(null);
    setDialogOpen(true);
  };

  const handleEditDesigner = (designer: Designer) => {
    setEditingDesigner(designer);
    setDialogOpen(true);
  };

  const handleViewProcesses = (designer: Designer) => {
    setProcessesDesigner(designer);
    setProcessesDialogOpen(true);
  };

  const handleViewStatement = (designer: Designer) => {
    setStatementDesigner(designer);
    setStatementOpen(true);
  };

  return (
    <div className="min-h-full bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Gestión de Diseñadores</h1>
          <p className="text-muted-foreground">
            Administra los diseñadores externos, sus procesos y estados de cuenta
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total de Diseñadores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalDesigners}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Diseñadores Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeDesigners}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Órdenes de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalWorkOrders}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, especialidad o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleNewDesigner}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Diseñador
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Designers List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando diseñadores...</div>
        ) : filteredDesigners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? "No se encontraron diseñadores" : "No hay diseñadores registrados"}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDesigners.map((designer) => {
              const processes = designerProcesses[designer.id] || [];
              const orderCount = workOrderCounts[designer.id] || 0;

              return (
                <Card key={designer.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold">{designer.nombre}</h3>
                          <Badge variant={designer.activo ? "default" : "secondary"}>
                            {designer.activo ? "Activo" : "Inactivo"}
                          </Badge>
                          {designer.especialidad && (
                            <Badge variant="outline">{designer.especialidad}</Badge>
                          )}
                        </div>

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                          {designer.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {designer.email}
                            </span>
                          )}
                          {designer.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {designer.telefono_codigo_pais} {designer.telefono}
                            </span>
                          )}
                          {(designer.ubicacion_ciudad || designer.ubicacion_pais) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {[designer.ubicacion_ciudad, designer.ubicacion_estado, designer.ubicacion_pais]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          )}
                          {designer.portafolio_url && (
                            <a 
                              href={designer.portafolio_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Portafolio
                            </a>
                          )}
                        </div>

                        {/* Processes */}
                        {processes.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {processes.map((process) => (
                              <Badge key={process.id} variant="secondary" className="text-xs">
                                {process.work_concept?.nombre} - ${process.costo_acordado.toLocaleString()}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Order Count */}
                        {orderCount > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {orderCount} orden{orderCount !== 1 ? "es" : ""} de trabajo asignada{orderCount !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditDesigner(designer)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewProcesses(designer)}>
                            <ListChecks className="h-4 w-4 mr-2" />
                            Ver Procesos
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewStatement(designer)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Estado de Cuenta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialogs */}
        <DesignerDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          designer={editingDesigner}
          onSaved={fetchDesigners}
        />

        {processesDesigner && (
          <DesignerProcessesDialog
            open={processesDialogOpen}
            onOpenChange={setProcessesDialogOpen}
            designer={processesDesigner}
            onSaved={fetchDesigners}
          />
        )}

        {statementDesigner && (
          <DesignerAccountStatement
            open={statementOpen}
            onOpenChange={setStatementOpen}
            designer={statementDesigner}
          />
        )}
      </div>
    </div>
  );
}
