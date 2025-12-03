import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Layers,
  Plus,
  Search,
  Palette,
  Wrench,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WorkConcept, WorkArea, WORK_AREA_LABELS } from "@/types/work-concepts";
import { WorkConceptDialog } from "@/components/work-concepts/WorkConceptDialog";
import { WorkConceptCard } from "@/components/work-concepts/WorkConceptCard";

const WorkConcepts = () => {
  const [concepts, setConcepts] = useState<WorkConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConcept, setEditingConcept] = useState<WorkConcept | null>(null);

  useEffect(() => {
    fetchConcepts();
  }, []);

  const fetchConcepts = async () => {
    try {
      const { data, error } = await supabase
        .from("work_concepts")
        .select("*")
        .order("area", { ascending: true })
        .order("nombre", { ascending: true });

      if (error) throw error;
      setConcepts((data as WorkConcept[]) || []);
    } catch (error) {
      console.error("Error fetching concepts:", error);
      toast.error("Error al cargar los conceptos");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (concept: WorkConcept) => {
    setEditingConcept(concept);
    setDialogOpen(true);
  };

  const handleNewConcept = () => {
    setEditingConcept(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingConcept(null);
  };

  const handleSaved = () => {
    fetchConcepts();
    handleDialogClose();
  };

  const filteredConcepts = concepts.filter((concept) => {
    const matchesSearch =
      concept.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (concept.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesArea = areaFilter === "all" || concept.area === areaFilter;
    return matchesSearch && matchesArea;
  });

  const designConcepts = concepts.filter((c) => c.area === "diseño" && c.activo);
  const workshopConcepts = concepts.filter((c) => c.area === "taller" && c.activo);

  const stats = [
    {
      title: "Total Conceptos",
      value: concepts.filter((c) => c.activo).length,
      icon: Layers,
    },
    {
      title: "Conceptos de Diseño",
      value: designConcepts.length,
      icon: Palette,
    },
    {
      title: "Conceptos de Taller",
      value: workshopConcepts.length,
      icon: Wrench,
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Gestión de Conceptos
            </h1>
            <Button onClick={handleNewConcept}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Concepto
            </Button>
          </div>
          <p className="text-muted-foreground">
            Administra los conceptos de trabajo para diseño y taller
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filtrar por área" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las áreas</SelectItem>
                  <SelectItem value="diseño">Diseño</SelectItem>
                  <SelectItem value="taller">Taller</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <p className="text-sm text-muted-foreground mb-4">
          {filteredConcepts.length} concepto(s) encontrado(s)
        </p>

        {/* Concepts List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredConcepts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No se encontraron conceptos.
                <br />
                {concepts.length === 0 && "Comienza creando tu primer concepto de trabajo."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredConcepts.map((concept) => (
              <WorkConceptCard
                key={concept.id}
                concept={concept}
                onEdit={handleEdit}
                onRefresh={fetchConcepts}
              />
            ))}
          </div>
        )}

        {/* Dialog */}
        <WorkConceptDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          concept={editingConcept}
          onSaved={handleSaved}
        />
      </main>
    </div>
  );
};

export default WorkConcepts;
