import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertCircle, FileSignature } from "lucide-react";

const Sign = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const openSignatureFlow = () => {
    const encodedUrl = searchParams.get("u");
    
    if (!encodedUrl) {
      setError("No se proporcionó URL de firma. Por favor, solicita un nuevo enlace.");
      setLoading(false);
      return;
    }

    try {
      const signUrl = decodeURIComponent(encodedUrl);
      
      // Importar y usar HelloSign embedded
      import("hellosign-embedded").then((module) => {
        const HelloSign = module.default;
        const client = new HelloSign({
          clientId: "9591cc59d6f65fda1758df721bdc95c4"
        });

        client.open(signUrl, {
          skipDomainVerification: true,
          testMode: true
        });

        setLoading(false);

        // Escuchar eventos de firma
        client.on("sign", () => {
          console.log("Documento firmado exitosamente");
        });

        client.on("close", () => {
          console.log("Modal de firma cerrado");
        });

        client.on("error", (data: any) => {
          console.error("Error en firma:", data);
          setError("Ocurrió un error al procesar la firma. Por favor, intenta nuevamente.");
        });
      }).catch((err) => {
        console.error("Error al cargar HelloSign:", err);
        setError("Error al cargar el sistema de firma. Por favor, intenta nuevamente.");
        setLoading(false);
      });
    } catch (err) {
      console.error("Error al decodificar URL:", err);
      setError("URL de firma inválida. Por favor, solicita un nuevo enlace.");
      setLoading(false);
    }
  };

  useEffect(() => {
    openSignatureFlow();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full p-6 space-y-4">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <h2 className="text-lg font-semibold">Error al cargar la firma</h2>
          </div>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            onClick={() => {
              setError(null);
              setLoading(true);
              openSignatureFlow();
            }}
            className="w-full"
          >
            Volver a intentar
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <FileSignature className="h-12 w-12 text-primary" />
              <Loader2 className="h-6 w-6 animate-spin text-primary absolute -bottom-1 -right-1" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Cargando firma...</h2>
              <p className="text-muted-foreground text-sm">
                Preparando el documento para tu firma
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full p-6">
        <p className="text-center text-muted-foreground">
          El proceso de firma debería abrirse en un momento...
        </p>
      </Card>
    </div>
  );
};

export default Sign;
