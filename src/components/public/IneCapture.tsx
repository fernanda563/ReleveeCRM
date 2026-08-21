import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Check, Loader2, RefreshCw, Image as ImageIcon } from "lucide-react";
import { compressImage } from "@/lib/image-compression";

export type IneSide = "front" | "back";

interface IneCaptureProps {
  side: IneSide;
  title: string;
  hint: string;
  uploaded: boolean;
  onUpload: (dataUrl: string) => Promise<boolean>;
}

export function IneCapture({ side, title, hint, uploaded, onUpload }: IneCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      if (!file.type.startsWith("image/")) {
        setError("Selecciona una imagen válida.");
        return;
      }
      const { dataUrl } = await compressImage(file);
      setPreview(dataUrl);
    } catch {
      setError("No pudimos procesar la imagen. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    const ok = await onUpload(preview);
    setBusy(false);
    if (!ok) {
      setError("No pudimos subir la foto. Revisa tu conexión e inténtalo de nuevo.");
    } else {
      setPreview(null);
    }
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
        </div>
        {uploaded && !preview && (
          <span className="flex shrink-0 items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
            <Check className="h-3.5 w-3.5" /> Listo
          </span>
        )}
      </div>

      {preview && (
        <div className="mt-4 overflow-hidden rounded-md border border-border">
          <img src={preview} alt={`Vista previa de INE ${side === "front" ? "frente" : "reverso"}`} className="w-full" />
        </div>
      )}

      {error && <p className="mt-3 text-sm text-foreground">{error}</p>}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      <div className="mt-4 space-y-2">
        {preview ? (
          <>
            <Button className="h-12 w-full text-base" onClick={confirm} disabled={busy}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Usar esta foto
            </Button>
            <Button
              variant="outline"
              className="h-12 w-full text-base"
              onClick={() => cameraRef.current?.click()}
              disabled={busy}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Volver a tomar
            </Button>
          </>
        ) : (
          <>
            <Button
              className="h-12 w-full text-base"
              variant={uploaded ? "outline" : "default"}
              onClick={() => cameraRef.current?.click()}
              disabled={busy}
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
              {uploaded ? "Tomar de nuevo" : "Tomar foto"}
            </Button>
            <Button
              variant="ghost"
              className="h-11 w-full text-sm"
              onClick={() => galleryRef.current?.click()}
              disabled={busy}
            >
              <ImageIcon className="mr-2 h-4 w-4" /> Elegir desde la galería
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
