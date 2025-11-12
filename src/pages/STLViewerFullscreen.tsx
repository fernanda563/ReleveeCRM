import { useEffect, useState } from "react";
import { STLViewer } from "@/components/stl/STLViewer";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

export default function STLViewerFullscreen() {
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("url");
    if (url) {
      setFileUrl(decodeURIComponent(url));
    }
  }, []);

  if (!fileUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">No se especificó un archivo para visualizar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-card border-b border-border p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Visualizador 3D - WebGL Completo</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={fileUrl} download>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </a>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => window.close()}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <STLViewer fileUrl={fileUrl} height="calc(100vh - 120px)" width="100%" />
      </div>
    </div>
  );
}
