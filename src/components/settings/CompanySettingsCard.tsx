import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Upload, X, Sun, Moon } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CompanySettingsCard() {
  const { settings, loading, updateSetting } = useSystemSettings('company');
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingLight, setUploadingLight] = useState(false);
  const [uploadingDark, setUploadingDark] = useState(false);
  const [logoLightPreview, setLogoLightPreview] = useState<string | null>(null);
  const [logoDarkPreview, setLogoDarkPreview] = useState<string | null>(null);
  const [logoLightFile, setLogoLightFile] = useState<File | null>(null);
  const [logoDarkFile, setLogoDarkFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_logo_light_url: '',
    company_logo_dark_url: '',
  });

  useEffect(() => {
    if (!loading && settings) {
      setFormData({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_logo_light_url: settings.company_logo_light_url || settings.company_logo_url || '',
        company_logo_dark_url: settings.company_logo_dark_url || settings.company_logo_url || '',
      });
      
      if (settings.company_logo_light_url || settings.company_logo_url) {
        setLogoLightPreview(settings.company_logo_light_url || settings.company_logo_url);
      }
      if (settings.company_logo_dark_url || settings.company_logo_url) {
        setLogoDarkPreview(settings.company_logo_dark_url || settings.company_logo_url);
      }
    }
  }, [loading, settings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'light' | 'dark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "El archivo es muy grande. Máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Solo se permiten archivos de imagen.",
        variant: "destructive",
      });
      return;
    }

    if (type === 'light') {
      setLogoLightFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoLightPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setLogoDarkFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoDarkPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async (type: 'light' | 'dark') => {
    const urlKey = type === 'light' ? 'company_logo_light_url' : 'company_logo_dark_url';
    const url = formData[urlKey];
    
    if (url) {
      // Eliminar del storage
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('company-assets').remove([`logos/${fileName}`]);
      }
    }
    
    if (type === 'light') {
      setLogoLightFile(null);
      setLogoLightPreview(null);
      setFormData({ ...formData, company_logo_light_url: '' });
    } else {
      setLogoDarkFile(null);
      setLogoDarkPreview(null);
      setFormData({ ...formData, company_logo_dark_url: '' });
    }
    
    await updateSetting(urlKey, '', 'company');
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      let logoLightUrl = formData.company_logo_light_url;
      let logoDarkUrl = formData.company_logo_dark_url;

      // Subir logo claro si hay uno nuevo
      if (logoLightFile) {
        setUploadingLight(true);
        const fileExt = logoLightFile.name.split('.').pop();
        const fileName = `logo-light-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // Eliminar logo anterior si existe
        if (formData.company_logo_light_url) {
          const oldFileName = formData.company_logo_light_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('company-assets').remove([`logos/${oldFileName}`]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('company-assets')
          .upload(filePath, logoLightFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('company-assets')
          .getPublicUrl(filePath);

        logoLightUrl = publicUrl;
        setUploadingLight(false);
      }

      // Subir logo oscuro si hay uno nuevo
      if (logoDarkFile) {
        setUploadingDark(true);
        const fileExt = logoDarkFile.name.split('.').pop();
        const fileName = `logo-dark-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // Eliminar logo anterior si existe
        if (formData.company_logo_dark_url) {
          const oldFileName = formData.company_logo_dark_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('company-assets').remove([`logos/${oldFileName}`]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('company-assets')
          .upload(filePath, logoDarkFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('company-assets')
          .getPublicUrl(filePath);

        logoDarkUrl = publicUrl;
        setUploadingDark(false);
      }

      await Promise.all([
        updateSetting('company_name', formData.company_name, 'company'),
        updateSetting('company_address', formData.company_address, 'company'),
        updateSetting('company_phone', formData.company_phone, 'company'),
        updateSetting('company_email', formData.company_email, 'company'),
        updateSetting('company_logo_light_url', logoLightUrl, 'company'),
        updateSetting('company_logo_dark_url', logoDarkUrl, 'company'),
      ]);

      setLogoLightFile(null);
      setLogoDarkFile(null);
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploadingLight(false);
      setUploadingDark(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-foreground" />
          <CardTitle>Información de la Empresa</CardTitle>
        </div>
        <CardDescription>
          Configura los datos básicos de Joyería Relevée
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Logo Claro */}
          <div className="space-y-2">
            <Label htmlFor="company_logo_light" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Logo Claro
            </Label>
            <div className="space-y-2">
              {logoLightPreview ? (
                <div className="relative">
                  <img 
                    src={logoLightPreview} 
                    alt="Logo claro preview" 
                    className="h-24 w-full object-contain rounded-lg border border-border bg-background"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => handleRemoveLogo('light')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-24 w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <Input
                id="company_logo_light"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'light')}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG o SVG. Máx 2MB.
              </p>
            </div>
          </div>

          {/* Logo Oscuro */}
          <div className="space-y-2">
            <Label htmlFor="company_logo_dark" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Logo Oscuro
            </Label>
            <div className="space-y-2">
              {logoDarkPreview ? (
                <div className="relative">
                  <img 
                    src={logoDarkPreview} 
                    alt="Logo oscuro preview" 
                    className="h-24 w-full object-contain rounded-lg border border-border bg-slate-900"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => handleRemoveLogo('dark')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="h-24 w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-slate-900">
                  <Upload className="h-8 w-8 text-slate-400" />
                </div>
              )}
              <Input
                id="company_logo_dark"
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e, 'dark')}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG o SVG. Máx 2MB.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_name">Nombre de la Empresa</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Joyería Relevée"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_address">Dirección</Label>
          <Textarea
            id="company_address"
            value={formData.company_address}
            onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
            placeholder="Calle Principal #123, Colonia Centro"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_phone">Teléfono</Label>
          <Input
            id="company_phone"
            type="tel"
            value={formData.company_phone}
            onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
            placeholder="+52 123 456 7890"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company_email">Correo Electrónico</Label>
          <Input
            id="company_email"
            type="email"
            value={formData.company_email}
            onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
            placeholder="contacto@joyeria.com"
          />
        </div>

        <Button 
          onClick={handleSave} 
          disabled={saving || uploadingLight || uploadingDark}
          className="w-full"
        >
          {(saving || uploadingLight || uploadingDark) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {uploadingLight && 'Subiendo logo claro...'}
              {uploadingDark && 'Subiendo logo oscuro...'}
              {saving && !uploadingLight && !uploadingDark && 'Guardando...'}
            </>
          ) : (
            'Guardar Cambios'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
