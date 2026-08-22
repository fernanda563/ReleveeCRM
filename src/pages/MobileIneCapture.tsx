import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { IneCapture } from "@/components/public/IneCapture";
import { useThemeInitializer } from "@/hooks/useThemeInitializer";
import { dataUrlBase64 } from "@/lib/image-compression";
import { callBooking } from "@/lib/public-booking-api";
import { Check, Monitor, RotateCcw, ShieldCheck } from "lucide-react";

type Sides = { front: boolean; back: boolean };

const MobileIneCapture = () => {
  const { ready: themeReady } = useThemeInitializer();
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [sides, setSides] = useState<Sides>({ front: false, back: false });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Captura tu INE | Relevée";
  }, []);

  useEffect(() => {
    if (!token) {
      setError("El enlace no es válido. Vuelve a escanear el código QR.");
      setLoading(false);
      return;
    }
    callBooking<Sides>("document_status", { token }).then(({ data, error: err }) => {
      setLoading(false);
      if (err || !data) {
        setError(err ?? "El enlace expiró. Vuelve a escanear el código QR.");
        return;
      }
      setSides(data);
    });
  }, [token]);

  const uploadSide = async (side: "front" | "back", dataUrl: string) => {
    if (!token) return false;
    const { error: err } = await callBooking("upload_document", {
      token,
      side,
      mime_type: "image/jpeg",
      data: dataUrlBase64(dataUrl),
    });
    if (err) {
      setError(err);
      return false;
    }
    setError(null);
    setSides((prev) => ({ ...prev, [side]: true }));
    return true;
  };

  const done = Number(sides.front) + Number(sides.back);

  if (!themeReady) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto max-w-2xl space-y-4 px-6 py-8">
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-20 items-center justify-center px-6">
          <div className="flex h-full items-center justify-center">
            <img
              src="/images/relevee-logo.png"
              alt="Relevée"
              className="h-10 max-h-full w-auto object-contain dark:invert"
            />
          </div>
        </div>
      </header>


      <main className="container mx-auto max-w-2xl px-6 py-8">
        {done === 2 ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted">
                <Check className="h-8 w-8 text-foreground" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">¡Listo!</h1>
                <p className="text-muted-foreground">
                  Recibimos las dos fotos de tu INE. Ya no necesitas hacer nada más en el celular.
                </p>
              </div>
            </div>

            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-foreground" />
                  Fotos recibidas
                </CardTitle>
                <CardDescription>
                  Se guardaron de forma privada y sólo puede consultarlas el personal autorizado de
                  Relevée.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {(["front", "back"] as const).map((side) => (
                    <div
                      key={side}
                      className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                    >
                      <span className="text-sm">
                        {side === "front" ? "INE — Frente" : "INE — Reverso"}
                      </span>
                      <Badge variant="secondary" className="gap-1">
                        <Check className="h-3.5 w-3.5" /> Recibida
                      </Badge>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Monitor className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                    <div>
                      <p className="text-sm font-medium">Continúa en la computadora</p>
                      <p className="text-sm text-muted-foreground">
                        La pantalla donde escaneaste el código ya avanzó sola al paso para elegir el
                        día y horario de tu cita.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-foreground" />
                    <div>
                      <p className="text-sm font-medium">Puedes cerrar esta ventana</p>
                      <p className="text-sm text-muted-foreground">
                        Tu registro sigue guardado; no se pierde nada al salir del celular.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setSides({ front: false, back: false })}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Volver a tomar las fotos
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="mb-8 space-y-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">Captura tu INE</h1>
              <p className="text-muted-foreground">
                Toma una foto del frente y del reverso. Al terminar, tu registro continúa en la
                computadora automáticamente.
              </p>
            </div>

            <div className="mb-8 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{done} de 2 fotos listas</p>
                <Badge variant="secondary">{done * 50}%</Badge>
              </div>
              <Progress value={done * 50} />
            </div>

            {error && (
              <Alert className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-foreground" />
                    Identificación oficial
                  </CardTitle>
                  <CardDescription>
                    Tu identificación se guarda de forma privada y sólo puede consultarla el
                    personal autorizado de Relevée.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <IneCapture
                    side="front"
                    title="INE — Frente"
                    hint="Coloca tu identificación sobre una superficie plana y captura el frente completo."
                    uploaded={sides.front}
                    preferCamera
                    onUpload={(dataUrl) => uploadSide("front", dataUrl)}
                  />
                  <IneCapture
                    side="back"
                    title="INE — Reverso"
                    hint="Ahora captura el reverso, cuidando que se lea con claridad."
                    uploaded={sides.back}
                    preferCamera
                    onUpload={(dataUrl) => uploadSide("back", dataUrl)}
                  />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>

    </div>
  );
};

export default MobileIneCapture;
