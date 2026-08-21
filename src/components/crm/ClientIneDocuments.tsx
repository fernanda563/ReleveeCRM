import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Eye, FileText, Loader2, Upload } from "lucide-react";
import {
  ClientDocument,
  fetchClientDocuments,
  getDocumentSignedUrl,
  uploadClientDocument,
} from "@/lib/client-documents";

interface Props {
  clientId?: string;
  /** Files chosen before the client exists; uploaded after creation. */
  pending: { front?: File; back?: File };
  onPendingChange: (pending: { front?: File; back?: File }) => void;
}

const SIDES: Array<{ key: "front" | "back"; label: string }> = [
  { key: "front", label: "INE — Frente" },
  { key: "back", label: "INE — Reverso" },
];

export function ClientIneDocuments({ clientId, pending, onPendingChange }: Props) {
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [busySide, setBusySide] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = async () => {
    if (!clientId) return;
    try {
      setDocuments(await fetchClientDocuments(clientId));
    } catch (error) {
      console.error("Error loading client documents:", error);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const handleFile = async (side: "front" | "back", file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no debe superar 10MB");
      return;
    }
    if (!clientId) {
      onPendingChange({ ...pending, [side]: file });
      return;
    }
    setBusySide(side);
    try {
      await uploadClientDocument(clientId, file, side);
      toast.success("Documento guardado de forma privada");
      await load();
    } catch (error) {
      console.error(error);
      toast.error("No se pudo subir el documento");
    } finally {
      setBusySide(null);
    }
  };

  const view = async (doc: ClientDocument) => {
    try {
      const url = await getDocumentSignedUrl(doc.storage_path);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      toast.error("No se pudo abrir el documento");
    }
  };

  const legacy = documents.filter((d) => d.document_side === "legacy");

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Identificación oficial (INE)</p>
        <p className="text-xs text-muted-foreground">
          Almacenamiento privado. Imagen o PDF, máximo 10MB por archivo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {SIDES.map(({ key, label }) => {
          const existing = documents.find((d) => d.document_side === key);
          const pendingFile = pending[key];
          return (
            <div key={key} className="rounded-md border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-foreground">{label}</span>
                {existing && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => view(existing)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {pendingFile
                  ? pendingFile.name
                  : existing
                    ? `Cargado ${new Date(existing.created_at).toLocaleDateString("es-MX")}`
                    : "Sin documento"}
              </p>

              <input
                ref={(el) => (fileRefs.current[key] = el)}
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) handleFile(key, file);
                }}
              />
              <input
                ref={(el) => (fileRefs.current[`${key}-file`] = el)}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (file) handleFile(key, file);
                }}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={busySide === key}
                  onClick={() => fileRefs.current[`${key}-file`]?.click()}
                >
                  {busySide === key ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Archivo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={busySide === key}
                  onClick={() => fileRefs.current[key]?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Cámara
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {legacy.length > 0 && (
        <div className="rounded-md border border-border p-3">
          <p className="mb-2 text-xs text-muted-foreground">Documentos anteriores</p>
          {legacy.map((doc) => (
            <Button key={doc.id} type="button" variant="ghost" size="sm" onClick={() => view(doc)}>
              <FileText className="mr-2 h-4 w-4" />
              INE archivada ({new Date(doc.created_at).toLocaleDateString("es-MX")})
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
