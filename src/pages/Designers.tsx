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
import { Plus, Search, MoreHorizontal, Pencil, ListChecks, FileText, Users, UserCheck, Briefcase, Mail, Phone, MapPin, ExternalLink, Loader2 } from "lucide-react";

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

  const stats = [
    {
      title: "Total de Diseñadores",
      value: totalDesigners,
      icon: Users,
    },
    {
      title: "Diseñadores Activos",
      value: activeDesigners,
      icon: UserCheck,
    },
    {
      title: "Órdenes de Trabajo",
      value: totalWorkOrders,
      icon: Briefcase,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">Gestión de Diseñadores</h1>
            <Button onClick={handleNewDesigner}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Diseñador
            </Button>
          </div>
          <p className="text-muted-foreground">
            Administra los diseñadores externos, sus procesos y estados de cuenta
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <stat.icon className="h-4 w-4" />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros avanzados</h3>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, especialidad o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredDesigners.length} diseñador(es) encontrado(s)
        </p>

        {/* Designers List */}
        {filteredDesigners.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                {searchTerm ? "No se encontraron diseñadores" : "No hay diseñadores registrados"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDesigners.map((designer) => {
              const processes = designerProcesses[designer.id] || [];
              const orderCount = workOrderCounts[designer.id] || 0;

              return (
                <Card key={designer.id} className={`hover:shadow-md transition-shadow ${!designer.activo ? "opacity-60" : ""}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="text-base font-semibold truncate">
                          {designer.nombre}
                        </CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={designer.activo ? "default" : "secondary"} className="text-xs">
                        {designer.activo ? "Activo" : "Inactivo"}
                      </Badge>
                      {designer.especialidad && (
                        <Badge variant="outline" className="text-xs">{designer.especialidad}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="space-y-2 text-sm">
                      {designer.email && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />
                          <span className="truncate">{designer.email}</span>
                        </p>
                      )}
                      {designer.telefono && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {designer.telefono_codigo_pais} {designer.telefono}
                        </p>
                      )}
                      {(designer.ubicacion_ciudad || designer.ubicacion_pais) && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          {[designer.ubicacion_ciudad, designer.ubicacion_estado, designer.ubicacion_pais]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                      {designer.portafolio_url && (
                        <a 
                          href={designer.portafolio_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline text-sm"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Portafolio
                        </a>
                      )}
                    </div>

                    {processes.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t">
                        {processes.map((process) => (
                          <Badge key={process.id} variant="secondary" className="text-xs">
                            {process.work_concept?.nombre}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {orderCount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {orderCount} orden{orderCount !== 1 ? "es" : ""} de trabajo
                      </p>
                    )}
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
      </main>
    </div>
  );
}