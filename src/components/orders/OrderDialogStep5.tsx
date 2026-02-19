import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STLViewer } from "@/components/stl/STLViewer";
import { Box, Upload, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface STLFile {
  id: string;
  nombre: string;
  descripcion: string | null;
  stl_file_url: string;
  tipo_accesorio: string | null;
}

interface OrderDialogStep5Props {
  notas: string;
  setNotas: (value: string) => void;
  selectedSTLFileId: string;
  setSelectedSTLFileId: (value: string) => void;
  availableSTLFiles: STLFile[];
  loading: boolean;
  onSTLUploaded?: (newFile: STLFile) => void;
}

export function OrderDialogStep5({
  notas,
  setNotas,
  selectedSTLFileId,
  setSelectedSTLFileId,
  availableSTLFiles,
  loading,
  onSTLUploaded,
}: OrderDialogStep5Props) {
  const selectedSTLFile = selectedSTLFileId && selectedSTLFileId !== "none"
    ? availableSTLFiles.find(f => f.id === selectedSTLFileId)
    : null;

  // Upload new STL inline
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stlFile, setStlFile] = useState<File | null>(null);
  const [stlNombre, setStlNombre] = useState("");
  const [stlDescripcion, setStlDescripcion] = useState("");

  const resetUpload = () => {
    setStlFile(null);
    setStlNombre("");
    setStlDescripcion("");
    setShowUpload(false);
  };

  const handleUpload = async () => {
    if (!stlFile) { toast.error("Selecciona un archivo STL"); return; }
    if (!stlNombre.trim()) { toast.error("El nombre es obligatorio"); return; }

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No autenticado");

      const fileName = `${Date.now()}_${stlFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("3d-files")
        .upload(`stl/${fileName}`, stlFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("3d-files")
        .getPublicUrl(uploadData.path);

      const { data: inserted, error: dbError } = await supabase
        .from("stl_files")
        .insert({
          nombre: stlNombre.trim(),
          descripcion: stlDescripcion.trim() || null,
          stl_file_url: publicUrl,
          created_by: user.id,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success("Archivo STL subido y vinculado a la orden");
      onSTLUploaded?.(inserted as STLFile);
      setSelectedSTLFileId(inserted.id);
      resetUpload();
    } catch (err) {
      console.error(err);
      toast.error("Error al subir el archivo STL");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Notas Adicionales</Label>
        <Textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          disabled={loading}
          placeholder="Detalles adicionales sobre la orden..."
          rows={4}
        />
      </div>

      {/* STL File Section */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-accent" />
          <Label className="text-base">Archivo STL (Opcional)</Label>
        </div>
        <p className="text-sm text-muted-foreground">
          Selecciona un diseño existente del repositorio o sube un archivo STL nuevo directamente.
        </p>

        {/* Select from repository */}
        <Select
          value={selectedSTLFileId}
          onValueChange={setSelectedSTLFileId}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar archivo STL existente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Ninguno (dejar en blanco)</SelectItem>
            {availableSTLFiles.map((file) => (
              <SelectItem key={file.id} value={file.id}>
                {file.nombre}
                {file.tipo_accesorio && (
                  <span className="text-muted-foreground ml-2 capitalize">
                    ({file.tipo_accesorio})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Upload new STL toggle */}
        <div className="rounded-lg border border-dashed border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setShowUpload(v => !v)}
            disabled={loading || uploading}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Subir nuevo archivo STL
            </span>
            {showUpload ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showUpload && (
            <div className="px-4 pb-4 pt-2 space-y-3 border-t border-dashed border-border bg-muted/20">
              <div className="space-y-1.5">
                <Label className="text-xs">Nombre *</Label>
                <Input
                  value={stlNombre}
                  onChange={(e) => setStlNombre(e.target.value)}
                  placeholder="Ej: Anillo solitario clásico"
                  disabled={uploading}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descripción (opcional)</Label>
                <Input
                  value={stlDescripcion}
                  onChange={(e) => setStlDescripcion(e.target.value)}
                  placeholder="Breve descripción del diseño"
                  disabled={uploading}
                  className="h-8 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Archivo STL *</Label>
                {stlFile ? (
                  <div className="flex items-center gap-2 text-sm border border-border rounded-md px-3 py-1.5 bg-background">
                    <Box className="h-4 w-4 text-accent flex-shrink-0" />
                    <span className="flex-1 truncate">{stlFile.name}</span>
                    <span className="text-muted-foreground text-xs flex-shrink-0">
                      {(stlFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => setStlFile(null)}
                      disabled={uploading}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 text-sm border border-dashed border-border rounded-md px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Seleccionar archivo .stl</span>
                    <input
                      type="file"
                      accept=".stl"
                      className="hidden"
                      onChange={(e) => setStlFile(e.target.files?.[0] || null)}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetUpload}
                  disabled={uploading}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading || !stlFile || !stlNombre.trim()}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                  {uploading ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Subiendo...</>
                  ) : (
                    <><Upload className="h-3.5 w-3.5 mr-1.5" />Subir y vincular</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* STL Preview */}
        {selectedSTLFile && (
          <div className="space-y-2 mt-4">
            <p className="text-sm font-medium">Vista previa del archivo STL</p>
            <STLViewer fileUrl={selectedSTLFile.stl_file_url} height="350px" />
            {selectedSTLFile.descripcion && (
              <p className="text-sm text-muted-foreground mt-2">
                {selectedSTLFile.descripcion}
              </p>
            )}
          </div>
        )}

        {availableSTLFiles.length === 0 && !showUpload && (
          <div className="text-center py-6 text-muted-foreground">
            <Box className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay archivos STL en el repositorio</p>
            <p className="text-xs mt-1">Sube uno nuevo usando el botón de arriba</p>
          </div>
        )}
      </div>
    </div>
  );
}
