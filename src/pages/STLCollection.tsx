import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Upload, Box, Download, ExternalLink, Trash2, Eye } from "lucide-react";
import { STLViewer } from "@/components/stl/STLViewer";
import { STLUploadDialog } from "@/components/stl/STLUploadDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserRole } from "@/hooks/useUserRole";
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

interface STLFile {
  id: string;
  nombre: string;
  descripcion: string | null;
  order_id: string | null;
  stl_file_url: string;
  edit_file_url: string | null;
  edit_file_type: string | null;
  tipo_accesorio: string | null;
  created_at: string;
  created_by: string | null;
}

export default function STLCollection() {
  const [files, setFiles] = useState<STLFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<STLFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAccessoryType, setFilterAccessoryType] = useState<string>("all");
  const [filterEditType, setFilterEditType] = useState<string>("all");
  const [selectedFile, setSelectedFile] = useState<STLFile | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<STLFile | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerLoading, setViewerLoading] = useState(false);
  const { isAdmin } = useUserRole();

  useEffect(() => {
    fetchSTLFiles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterAccessoryType, filterEditType, files]);

  const fetchSTLFiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("stl_files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching STL files:", error);
      toast.error("Error al cargar los archivos STL");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...files];

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAccessoryType !== "all") {
      filtered = filtered.filter(file => file.tipo_accesorio === filterAccessoryType);
    }

    if (filterEditType !== "all") {
      filtered = filtered.filter(file => file.edit_file_type === filterEditType);
    }

    setFilteredFiles(filtered);
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      const { error } = await supabase
        .from("stl_files")
        .delete()
        .eq("id", fileToDelete.id);

      if (error) throw error;

      toast.success("Archivo eliminado exitosamente");
      fetchSTLFiles();
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Error al eliminar el archivo");
    }
  };

  const openDeleteDialog = (file: STLFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const openViewer = async (file: STLFile) => {
    setSelectedFile(file);
    setViewerOpen(true);
    setViewerUrl(null);
    setViewerLoading(true);

    const getStoragePath = (url: string) => {
      try {
        const marker = "/storage/v1/object/";
        const idx = url.indexOf(marker);
        if (idx === -1) return null;
        const after = url.slice(idx + marker.length);
        const parts = after.split("/");
        const bucketIndex = parts[0] === "public" ? 1 : 0;
        if (parts[bucketIndex] !== "3d-files") return null;
        return parts.slice(bucketIndex + 1).join("/");
      } catch {
        return null;
      }
    };

    const path = getStoragePath(file.stl_file_url);
    if (path) {
      const { data, error } = await supabase.storage
        .from("3d-files")
        .createSignedUrl(path, 60 * 15); // 15 minutos de vigencia
      if (!error && data?.signedUrl) {
        setViewerUrl(data.signedUrl);
      } else {
        console.error("Error generando signed URL:", error);
        setViewerUrl(file.stl_file_url);
      }
    } else {
      setViewerUrl(file.stl_file_url);
    }
    setViewerLoading(false);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Box className="h-12 w-12 animate-spin mx-auto mb-4 text-accent" />
          <p className="text-muted-foreground">Cargando colección...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Colección STL/EDIT</h1>
          <p className="text-muted-foreground">
            Repositorio de archivos 3D y editables para joyería
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin() && (
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir archivo
            </Button>
          )}
          <Badge variant="secondary" className="text-lg px-4 py-2">
            <Box className="h-4 w-4 mr-2" />
            {files.length} archivos
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de búsqueda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterAccessoryType} onValueChange={setFilterAccessoryType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de accesorio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los accesorios</SelectItem>
                <SelectItem value="anillo">Anillo</SelectItem>
                <SelectItem value="collar">Collar</SelectItem>
                <SelectItem value="pulsera">Pulsera</SelectItem>
                <SelectItem value="aretes">Aretes</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterEditType} onValueChange={setFilterEditType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de archivo EDIT" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los archivos</SelectItem>
                <SelectItem value="rhino">Rhino (.3dm)</SelectItem>
                <SelectItem value="blender">Blender (.blend)</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Grid */}
      {filteredFiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Box className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-xl font-medium mb-2">No se encontraron archivos</p>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm || filterAccessoryType !== "all" || filterEditType !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Los archivos STL aparecerán aquí cuando los diseñadores los suban"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1">{file.nombre}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {file.descripcion || "Sin descripción"}
                    </CardDescription>
                  </div>
                  <Box className="h-8 w-8 text-accent flex-shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {file.tipo_accesorio && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {file.tipo_accesorio}
                    </Badge>
                    {file.edit_file_type && (
                      <Badge variant="secondary" className="capitalize">
                        {file.edit_file_type}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  {new Date(file.created_at).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openViewer(file)}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver 3D
                  </Button>
                  
                  {file.edit_file_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={file.edit_file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-1" />
                        EDIT
                      </a>
                    </Button>
                  )}

                  {isAdmin() && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.nombre}</DialogTitle>
            <DialogDescription>
              {selectedFile?.descripcion || "Vista previa del archivo STL"}
            </DialogDescription>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              {viewerLoading || !viewerUrl ? (
                <div className="h-[500px] flex items-center justify-center border border-border rounded-lg bg-muted">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Cargando previsualización...</p>
                  </div>
                </div>
              ) : (
                <STLViewer 
                  fileUrl={viewerUrl} 
                  height="500px"
                  showOpenInNewWindow={true}
                />
              )}
              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <a href={selectedFile.stl_file_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Descargar STL
                  </a>
                </Button>
                {selectedFile.edit_file_url && (
                  <Button asChild variant="outline" className="flex-1">
                    <a href={selectedFile.edit_file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar EDIT
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <STLUploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onSuccess={fetchSTLFiles}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el archivo "{fileToDelete?.nombre}". 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
