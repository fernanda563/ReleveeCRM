import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, Loader2, Upload, X } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function CompanySettingsCard() {
  const { settings, loading, updateSetting } = useSystemSettings('company');
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    company_logo_url: '',
  });

  useEffect(() => {
    if (!loading && settings) {
      setFormData({
        company_name: settings.company_name || '',
        company_address: settings.company_address || '',
        company_phone: settings.company_phone || '',
        company_email: settings.company_email || '',
        company_logo_url: settings.company_logo_url || '',
      });
      
      if (settings.company_logo_url) {
        setLogoPreview(settings.company_logo_url);
      }
    }
  }, [loading, settings]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (formData.company_logo_url) {
      // Eliminar del storage
      const fileName = formData.company_logo_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('company-assets').remove([`logos/${fileName}`]);
      }
    }
    
    setLogoFile(null);
    setLogoPreview(null);
    setFormData({ ...formData, company_logo_url: '' });
    await updateSetting('company_logo_url', '', 'company');
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      let logoUrl = formData.company_logo_url;

      // Si hay un nuevo archivo de logo, subirlo primero
      if (logoFile) {
        setUploading(true);
        const fileExt = logoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `logos/${fileName}`;

        // Eliminar logo anterior si existe
        if (formData.company_logo_url) {
          const oldFileName = formData.company_logo_url.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('company-assets').remove([`logos/${oldFileName}`]);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from('company-assets')
          .upload(filePath, logoFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from('company-assets')
          .getPublicUrl(filePath);

        logoUrl = publicUrl;
        setUploading(false);
      }

      await Promise.all([
        updateSetting('company_name', formData.company_name, 'company'),
        updateSetting('company_address', formData.company_address, 'company'),
        updateSetting('company_phone', formData.company_phone, 'company'),
        updateSetting('company_email', formData.company_email, 'company'),
        updateSetting('company_logo_url', logoUrl, 'company'),
      ]);

      setLogoFile(null);
    } catch (error) {
      console.error('Error saving company settings:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploading(false);
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
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>Información de la Empresa</CardTitle>
        </div>
        <CardDescription>
          Configura los datos básicos de Joyería Relevée
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="company_logo">Logo de la Empresa</Label>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="relative">
                <img 
                  src={logoPreview} 
                  alt="Logo preview" 
                  className="h-24 w-24 object-contain rounded-lg border border-border bg-background"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/50">
                <Upload className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input
                id="company_logo"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG o SVG. Máximo 2MB.
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
            placeholder="Calle, número, colonia, ciudad"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="company_email">Email</Label>
            <Input
              id="company_email"
              type="email"
              value={formData.company_email}
              onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
              placeholder="contacto@joyeriarelevee.com"
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || uploading} className="w-full md:w-auto">
          {(saving || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {uploading ? 'Subiendo logo...' : 'Guardar Cambios'}
        </Button>
      </CardContent>
    </Card>
  );
}
