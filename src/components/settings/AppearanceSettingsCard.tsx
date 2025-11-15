import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Palette, Loader2, RotateCcw } from "lucide-react";
import { useThemeCustomization } from "@/hooks/useThemeCustomization";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeImporter } from "./ThemeImporter";
import { ColorEditor } from "./ColorEditor";
import { ThemeGallery } from "./ThemeGallery";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AppearanceSettingsCard() {
  const { config, loading, importFromTweakCN, applyImportedTheme, applyCustomColors, resetToDefault } = useThemeCustomization();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-foreground" />
            <CardTitle>Personalización de Apariencia</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={resetToDefault}
          >
            <RotateCcw className="h-4 w-4" />
            Restablecer
          </Button>
        </div>
        <CardDescription>
          Personaliza los colores y apariencia del sistema usando TweakCN o editando manualmente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            El tema se controla desde el icono de luna/sol en el header. Aquí puedes personalizar los colores del tema.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="gallery" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gallery">Temas Importados</TabsTrigger>
            <TabsTrigger value="tweakcn">Importar TweakCN</TabsTrigger>
            <TabsTrigger value="editor">Editor de Colores</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="space-y-4 mt-4">
            <ThemeGallery
              importedThemes={config.importedThemes || []}
              activeThemeId={config.activePreset}
              onApply={applyImportedTheme}
            />
          </TabsContent>

          <TabsContent value="tweakcn" className="space-y-4 mt-4">
            <ThemeImporter onImport={importFromTweakCN} />
          </TabsContent>

          <TabsContent value="editor" className="space-y-4 mt-4">
            <ColorEditor
              initialLight={config.customColors.light}
              initialDark={config.customColors.dark}
              onApply={applyCustomColors}
            />
          </TabsContent>
        </Tabs>

        {config.source !== 'default' && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Tema activo:</strong>{' '}
              {config.source === 'tweakcn' && config.activePreset
                ? (() => {
                    const activeTheme = config.importedThemes?.find(t => t.id === config.activePreset);
                    if (activeTheme) {
                      const importDate = new Date(activeTheme.importedAt);
                      const formattedDate = importDate.toLocaleString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return `${activeTheme.name} (${formattedDate})`;
                    }
                    return 'Importado desde TweakCN';
                  })()
                : config.source === 'custom'
                ? 'Personalizado'
                : 'Por defecto'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
