import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Palette, MoreVertical } from "lucide-react";
import { useThemeCustomization } from "@/hooks/useThemeCustomization";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeImporter } from "./ThemeImporter";
import { ColorEditor } from "./ColorEditor";
import { ThemeGallery } from "./ThemeGallery";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

export function AppearanceSettingsCard() {
  const { config, loading, importFromTweakCN, applyImportedTheme, applyCustomColors, setDefaultTheme, deleteTheme, resetToDefault } = useThemeCustomization();
  const [selectedView, setSelectedView] = useState<'gallery' | 'import' | 'editor'>('gallery');

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={resetToDefault}>
                Restablecer al predeterminado
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

        <Select value={selectedView} onValueChange={(value: 'gallery' | 'import' | 'editor') => setSelectedView(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gallery">Temas Disponibles</SelectItem>
            <SelectItem value="import">Importar desde TweakCN</SelectItem>
            <SelectItem value="editor">Editor de Colores</SelectItem>
          </SelectContent>
        </Select>

        <div className="mt-4">
          {selectedView === 'gallery' && (
            <ThemeGallery
              importedThemes={config.importedThemes || []}
              activeThemeId={config.activePreset}
              onApply={applyImportedTheme}
              onSetDefault={setDefaultTheme}
              onDelete={deleteTheme}
            />
          )}
          
          {selectedView === 'import' && (
            <ThemeImporter onImport={importFromTweakCN} />
          )}
          
          {selectedView === 'editor' && (
            <ColorEditor
              initialLight={config.customColors.light}
              initialDark={config.customColors.dark}
              onApply={applyCustomColors}
            />
          )}
        </div>

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
