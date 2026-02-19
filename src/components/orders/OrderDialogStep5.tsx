import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { STLViewer } from "@/components/stl/STLViewer";
import { Box, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export function OrderDialogStep5({
  notas,
  setNotas,
  selectedSTLFileId,
  setSelectedSTLFileId,
  availableSTLFiles,
  loading,
}: OrderDialogStep5Props) {
  const [open, setOpen] = useState(false);

  const selectedSTLFile =
    selectedSTLFileId && selectedSTLFileId !== "none"
      ? availableSTLFiles.find((f) => f.id === selectedSTLFileId)
      : null;

  const displayLabel = selectedSTLFile
    ? selectedSTLFile.nombre
    : "Buscar archivo STL por nombre...";

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
          Selecciona un diseño existente del repositorio de STLs.
        </p>

        {/* Combobox search */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={loading}
              className="w-full justify-between font-normal"
            >
              <span className="truncate text-left">{displayLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar STL por nombre..." />
              <CommandList>
                <CommandEmpty>No se encontraron archivos STL.</CommandEmpty>
                <CommandGroup>
                  {/* Deselect option */}
                  <CommandItem
                    value="none"
                    onSelect={() => {
                      setSelectedSTLFileId("none");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        !selectedSTLFile ? "opacity-100" : "opacity-0"
                      )}
                    />
                    Ninguno
                  </CommandItem>

                  {availableSTLFiles.map((file) => (
                    <CommandItem
                      key={file.id}
                      value={file.nombre}
                      onSelect={() => {
                        setSelectedSTLFileId(file.id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedSTLFileId === file.id
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <span className="flex-1">{file.nombre}</span>
                      {file.tipo_accesorio && (
                        <span className="ml-2 text-xs text-muted-foreground capitalize">
                          {file.tipo_accesorio}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

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

        {availableSTLFiles.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Box className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No hay archivos STL en el repositorio</p>
          </div>
        )}
      </div>
    </div>
  );
}
