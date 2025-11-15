import { useState, useEffect } from 'react';
import { useSystemSettings } from './useSystemSettings';
import { ThemeColors, themePresets } from '@/lib/theme-presets';
import { applyThemeColors, parseThemeFromCSS } from '@/lib/apply-css-variables';
import { toast } from '@/hooks/use-toast';

export interface ThemeConfig {
  mode: 'system' | 'light' | 'dark';
  customColors: {
    light: Partial<ThemeColors>;
    dark: Partial<ThemeColors>;
  };
  source: 'default' | 'preset' | 'tweakcn' | 'custom';
  registryUrl?: string;
  activePreset?: string;
}

export function useThemeCustomization() {
  const { settings, loading, updateSetting } = useSystemSettings('appearance');
  const [config, setConfig] = useState<ThemeConfig>({
    mode: 'system',
    customColors: { light: {}, dark: {} },
    source: 'default',
  });

  useEffect(() => {
    if (!loading && settings) {
      const mode = settings.theme_mode || 'system';
      const lightColors = settings.custom_theme_light || {};
      const darkColors = settings.custom_theme_dark || {};
      const source = settings.theme_source || 'default';
      const registryUrl = settings.tweakcn_registry_url || '';
      const activePreset = settings.active_preset || 'minimalista';

      setConfig({
        mode,
        customColors: { light: lightColors, dark: darkColors },
        source,
        registryUrl,
        activePreset,
      });

      // Aplicar colores si hay personalizaciones
      if (Object.keys(lightColors).length > 0 && Object.keys(darkColors).length > 0) {
        applyThemeColors(lightColors as ThemeColors, darkColors as ThemeColors);
      }
    }
  }, [loading, settings]);

  const applyPreset = async (presetId: string) => {
    const preset = themePresets.find(p => p.id === presetId);
    if (!preset) {
      toast({
        title: 'Error',
        description: 'Preset no encontrado',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateSetting('custom_theme_light', preset.light, 'appearance');
      await updateSetting('custom_theme_dark', preset.dark, 'appearance');
      await updateSetting('theme_source', 'preset', 'appearance');
      await updateSetting('active_preset', presetId, 'appearance');

      applyThemeColors(preset.light, preset.dark);

      toast({
        title: 'Tema aplicado',
        description: `${preset.name} ha sido aplicado correctamente`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo aplicar el tema',
        variant: 'destructive',
      });
    }
  };

  const importFromTweakCN = async (registryUrl: string) => {
    try {
      const response = await fetch(registryUrl);
      if (!response.ok) {
        throw new Error('No se pudo obtener el tema desde TweakCN');
      }

      const cssText = await response.text();
      const parsed = parseThemeFromCSS(cssText);

      if (!parsed) {
        throw new Error('Formato de tema inválido');
      }

      await updateSetting('custom_theme_light', parsed.light, 'appearance');
      await updateSetting('custom_theme_dark', parsed.dark, 'appearance');
      await updateSetting('theme_source', 'tweakcn', 'appearance');
      await updateSetting('tweakcn_registry_url', registryUrl, 'appearance');

      applyThemeColors(parsed.light, parsed.dark);

      toast({
        title: 'Tema importado',
        description: 'El tema desde TweakCN ha sido aplicado correctamente',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo importar el tema',
        variant: 'destructive',
      });
    }
  };

  const applyCustomColors = async (light: Partial<ThemeColors>, dark: Partial<ThemeColors>) => {
    try {
      // Mergear con colores existentes
      const currentPreset = themePresets.find(p => p.id === config.activePreset) || themePresets[0];
      const mergedLight = { ...currentPreset.light, ...light };
      const mergedDark = { ...currentPreset.dark, ...dark };

      await updateSetting('custom_theme_light', mergedLight, 'appearance');
      await updateSetting('custom_theme_dark', mergedDark, 'appearance');
      await updateSetting('theme_source', 'custom', 'appearance');

      applyThemeColors(mergedLight, mergedDark);

      toast({
        title: 'Colores aplicados',
        description: 'Los colores personalizados han sido guardados',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los colores',
        variant: 'destructive',
      });
    }
  };

  const resetToDefault = async () => {
    try {
      const defaultPreset = themePresets[0];
      
      await updateSetting('custom_theme_light', defaultPreset.light, 'appearance');
      await updateSetting('custom_theme_dark', defaultPreset.dark, 'appearance');
      await updateSetting('theme_source', 'default', 'appearance');
      await updateSetting('active_preset', 'minimalista', 'appearance');
      await updateSetting('tweakcn_registry_url', '', 'appearance');

      applyThemeColors(defaultPreset.light, defaultPreset.dark);

      toast({
        title: 'Tema restablecido',
        description: 'Se ha vuelto al tema por defecto',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo restablecer el tema',
        variant: 'destructive',
      });
    }
  };

  return {
    config,
    loading,
    applyPreset,
    importFromTweakCN,
    applyCustomColors,
    resetToDefault,
  };
}
