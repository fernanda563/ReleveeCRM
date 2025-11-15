import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeColors } from '@/lib/theme-presets';

interface ColorEditorProps {
  initialLight: Partial<ThemeColors>;
  initialDark: Partial<ThemeColors>;
  onApply: (light: Partial<ThemeColors>, dark: Partial<ThemeColors>) => Promise<void>;
}

const colorKeys: Array<keyof ThemeColors> = [
  'background',
  'foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'destructive',
  'destructive-foreground',
  'border',
  'input',
  'ring',
];

export function ColorEditor({ initialLight, initialDark, onApply }: ColorEditorProps) {
  const [lightColors, setLightColors] = useState<Partial<ThemeColors>>(initialLight);
  const [darkColors, setDarkColors] = useState<Partial<ThemeColors>>(initialDark);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    setLightColors(initialLight);
    setDarkColors(initialDark);
  }, [initialLight, initialDark]);

  const handleApply = async () => {
    setApplying(true);
    try {
      await onApply(lightColors, darkColors);
    } finally {
      setApplying(false);
    }
  };

  const formatLabel = (key: string) => {
    return key
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="light" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="light">Modo Claro</TabsTrigger>
          <TabsTrigger value="dark">Modo Oscuro</TabsTrigger>
        </TabsList>

        <TabsContent value="light" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {colorKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`light-${key}`} className="text-xs">
                  {formatLabel(key)}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`light-${key}`}
                    placeholder="H S% L% (ej: 0 0% 100%)"
                    value={lightColors[key] || ''}
                    onChange={(e) =>
                      setLightColors({ ...lightColors, [key]: e.target.value })
                    }
                    className="font-mono text-sm"
                  />
                  <div
                    className="w-10 h-10 rounded border shrink-0"
                    style={{
                      backgroundColor: `hsl(${lightColors[key] || '0 0% 50%'})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dark" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {colorKeys.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`dark-${key}`} className="text-xs">
                  {formatLabel(key)}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`dark-${key}`}
                    placeholder="H S% L% (ej: 0 0% 0%)"
                    value={darkColors[key] || ''}
                    onChange={(e) =>
                      setDarkColors({ ...darkColors, [key]: e.target.value })
                    }
                    className="font-mono text-sm"
                  />
                  <div
                    className="w-10 h-10 rounded border shrink-0"
                    style={{
                      backgroundColor: `hsl(${darkColors[key] || '0 0% 50%'})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={handleApply} disabled={applying} className="flex-1">
          {applying ? 'Aplicando...' : 'Aplicar Colores'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Los valores deben estar en formato HSL: tono saturación% luminosidad% (ej: 262 83% 58%)
      </p>
    </div>
  );
}
