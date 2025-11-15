import { useState } from 'react';
import { ImportedTheme } from '@/lib/theme-presets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Calendar, ExternalLink, Star, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface ThemeGalleryProps {
  importedThemes: ImportedTheme[];
  activeThemeId?: string;
  onApply: (themeId: string) => Promise<void>;
  onSetDefault: (themeId: string) => Promise<void>;
  onDelete: (themeId: string) => Promise<void>;
}

export function ThemeGallery({ importedThemes, activeThemeId, onApply, onSetDefault, onDelete }: ThemeGalleryProps) {
  const [applying, setApplying] = useState<string | null>(null);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [themeToDelete, setThemeToDelete] = useState<ImportedTheme | null>(null);

  const handleApply = async (themeId: string) => {
    setApplying(themeId);
    try {
      await onApply(themeId);
    } finally {
      setApplying(null);
    }
  };

  const handleSetDefault = async (themeId: string) => {
    setSettingDefault(themeId);
    try {
      await onSetDefault(themeId);
    } finally {
      setSettingDefault(null);
    }
  };

  const openDeleteDialog = (theme: ImportedTheme) => {
    setThemeToDelete(theme);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!themeToDelete) return;
    
    try {
      await onDelete(themeToDelete.id);
      setDeleteDialogOpen(false);
      setThemeToDelete(null);
    } catch (error) {
      console.error('Error deleting theme:', error);
    }
  };

  if (importedThemes.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No hay temas importados. Ve a la pestaña "Importar desde TweakCN" para agregar temas. Puedes mantener hasta 4 temas guardados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Puedes guardar hasta 4 temas importados. Al importar un nuevo tema, el más antiguo se eliminará automáticamente.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 gap-4">
        {importedThemes.map((theme) => {
          const isActive = activeThemeId === theme.id;
          const isApplying = applying === theme.id;
          const isSettingDefault = settingDefault === theme.id;
          const isDefault = theme.isDefault;
          const importDate = new Date(theme.importedAt);
          const formattedDate = importDate.toLocaleString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <Card
              key={theme.id}
              className={isActive ? 'ring-2 ring-primary' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base truncate">{theme.name}</CardTitle>
                      {isDefault && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Predeterminado
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formattedDate}
                    </CardDescription>
                    {theme.url && (
                      <CardDescription className="text-xs mt-1 flex items-center gap-1 truncate">
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{theme.url}</span>
                      </CardDescription>
                    )}
                  </div>
                  {isActive && <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Preview de colores */}
                <div className="space-y-2">
                  <p className="text-xs font-medium">Modo Claro</p>
                  <div className="flex gap-1 h-8 rounded overflow-hidden border">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${theme.light.background})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${theme.light.primary})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${theme.light.secondary})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${theme.light.accent})` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium">Modo Oscuro</p>
                  <div className="flex gap-1 h-8 rounded overflow-hidden border">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${theme.dark.background})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${theme.dark.primary})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${theme.dark.secondary})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${theme.dark.accent})` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={() => handleApply(theme.id)}
                    disabled={isApplying || isActive}
                    className="flex-1"
                    size="sm"
                  >
                    {isApplying ? 'Aplicando...' : isActive ? 'Tema Activo' : 'Aplicar Tema'}
                  </Button>
                  
                  {!isDefault && (
                    <Button
                      onClick={() => handleSetDefault(theme.id)}
                      disabled={isSettingDefault}
                      variant="outline"
                      size="sm"
                      title="Marcar como predeterminado"
                    >
                      {isSettingDefault ? 'Guardando...' : <Star className="h-4 w-4" />}
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => openDeleteDialog(theme)}
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    title="Eliminar tema"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tema?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el tema "{themeToDelete?.name}"? Esta acción no se puede deshacer.
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
