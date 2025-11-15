import { useState } from 'react';
import { themePresets } from '@/lib/theme-presets';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface ThemeGalleryProps {
  activePreset?: string;
  onApply: (presetId: string) => Promise<void>;
}

export function ThemeGallery({ activePreset, onApply }: ThemeGalleryProps) {
  const [applying, setApplying] = useState<string | null>(null);

  const handleApply = async (presetId: string) => {
    setApplying(presetId);
    try {
      await onApply(presetId);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {themePresets.map((preset) => {
          const isActive = activePreset === preset.id;
          const isApplying = applying === preset.id;

          return (
            <Card
              key={preset.id}
              className={isActive ? 'ring-2 ring-foreground' : ''}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{preset.name}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      {preset.description}
                    </CardDescription>
                  </div>
                  {isActive && <Check className="h-5 w-5 text-foreground" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Preview de colores */}
                <div className="space-y-2">
                  <p className="text-xs font-medium">Modo Claro</p>
                  <div className="flex gap-1 h-8 rounded overflow-hidden border">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${preset.light.background})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${preset.light.primary})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${preset.light.secondary})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${preset.light.accent})` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium">Modo Oscuro</p>
                  <div className="flex gap-1 h-8 rounded overflow-hidden border">
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${preset.dark.background})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${preset.dark.primary})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${preset.dark.secondary})` }}
                    />
                    <div
                      className="flex-1"
                      style={{ backgroundColor: `hsl(${preset.dark.accent})` }}
                    />
                  </div>
                </div>

                <Button
                  onClick={() => handleApply(preset.id)}
                  disabled={isApplying || isActive}
                  variant={isActive ? 'secondary' : 'default'}
                  size="sm"
                  className="w-full"
                >
                  {isApplying
                    ? 'Aplicando...'
                    : isActive
                    ? 'Activo'
                    : 'Aplicar Tema'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
