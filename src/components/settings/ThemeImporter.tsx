import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Download, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ThemeImporterProps {
  onImport: (url: string) => Promise<void>;
}

export function ThemeImporter({ onImport }: ThemeImporterProps) {
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) return;

    setImporting(true);
    try {
      await onImport(url);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          Visita{' '}
          <a
            href="https://tweakcn.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4"
          >
            TweakCN
          </a>{' '}
          para crear o explorar temas. Copia la URL del registro del tema que deseas importar.
        </AlertDescription>
      </Alert>

      <div className="space-y-2">
        <Label htmlFor="registry-url">URL del Registro TweakCN</Label>
        <div className="flex gap-2">
          <Input
            id="registry-url"
            placeholder="https://tweakcn.vercel.app/r/[theme-id]"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleImport} disabled={!url.trim() || importing}>
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          La URL debe apuntar al endpoint del registro del tema en TweakCN
        </p>
      </div>

      <div className="space-y-2">
        <Label>Ejemplo de URL válida</Label>
        <code className="block rounded-md bg-muted p-2 text-sm">
          https://tweakcn.vercel.app/r/[id]
        </code>
      </div>
    </div>
  );
}
