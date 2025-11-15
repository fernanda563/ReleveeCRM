import { useState, useEffect } from 'react';
import { useSystemSettings } from './useSystemSettings';
import { applyThemeColors, parseThemeFromCSS } from '@/lib/apply-css-variables';
import { ThemeColors, ImportedTheme } from '@/lib/theme-presets';
import { toast } from 'sonner';

interface ThemeConfig {
  mode: 'system' | 'light' | 'dark';
  customColors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  source: 'default' | 'preset' | 'tweakcn' | 'custom';
  registryUrl?: string;
  activePreset?: string;
  importedThemes: ImportedTheme[];
}

export const useThemeCustomization = () => {
  const { settings, loading, updateSetting } = useSystemSettings('appearance');
  const [config, setConfig] = useState<ThemeConfig>({
    mode: 'system',
    customColors: {
      light: {} as ThemeColors,
      dark: {} as ThemeColors,
    },
    source: 'default',
    activePreset: undefined,
    importedThemes: [],
  });

  useEffect(() => {
    if (!loading && settings) {
      // Normalize colors from database (might contain OKLCH)
      let lightColors = settings.custom_theme_light || ({} as ThemeColors);
      let darkColors = settings.custom_theme_dark || ({} as ThemeColors);
      
      // Check if we need to normalize (if any value still contains 'oklch')
      const needsNormalization = 
        JSON.stringify(lightColors).includes('oklch') || 
        JSON.stringify(darkColors).includes('oklch');
      
      if (needsNormalization) {
        // Parse and re-normalize to ensure all colors are HSL
        const normalized = parseThemeFromCSS(JSON.stringify({
          cssVars: { light: lightColors, dark: darkColors }
        }));
        
        if (normalized) {
          lightColors = normalized.light;
          darkColors = normalized.dark;
          
          // Update database with normalized colors
          updateSetting('custom_theme_light', lightColors, 'appearance');
          updateSetting('custom_theme_dark', darkColors, 'appearance');
        }
      }
      
      const newConfig: ThemeConfig = {
        mode: settings.theme_mode || 'system',
        customColors: {
          light: lightColors,
          dark: darkColors,
        },
        source: settings.theme_source || 'default',
        registryUrl: settings.tweakcn_registry_url,
        activePreset: settings.active_preset,
        importedThemes: settings.imported_themes || [],
      };
      
      setConfig(newConfig);

      // Apply theme colors if custom colors exist
      if (Object.keys(lightColors).length > 0 && Object.keys(darkColors).length > 0) {
        applyThemeColors(lightColors, darkColors);
      }
    }
  }, [loading, settings, updateSetting]);

  const generateThemeId = () => `tweakcn_${Date.now()}`;
  
  const extractThemeName = (url: string): string => {
    const date = new Date();
    const formattedDate = date.toLocaleString('es-MX', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `Tema Importado - ${formattedDate}`;
  };

  const importFromTweakCN = async (registryUrl: string) => {
    if (!registryUrl.trim()) {
      toast.error('Por favor ingresa una URL válida');
      return;
    }

    try {
      const response = await fetch(registryUrl);
      
      if (!response.ok) {
        throw new Error('No se pudo obtener el tema desde TweakCN');
      }

      const data = await response.text();
      const parsed = parseThemeFromCSS(data);

      if (!parsed) {
        throw new Error('Formato de tema inválido');
      }

      // Create new imported theme object
      const newTheme: ImportedTheme = {
        id: generateThemeId(),
        name: extractThemeName(registryUrl),
        url: registryUrl,
        importedAt: new Date().toISOString(),
        light: parsed.light,
        dark: parsed.dark,
      };

      // Get current imported themes and add new one at the beginning
      const currentThemes = config.importedThemes || [];
      const updatedThemes = [newTheme, ...currentThemes].slice(0, 4); // Keep only last 4

      // Apply the imported theme
      applyThemeColors(parsed.light, parsed.dark);

      // Save to database (use existing keys)
      await updateSetting('custom_theme_light', parsed.light, 'appearance');
      await updateSetting('custom_theme_dark', parsed.dark, 'appearance');
      await updateSetting('theme_source', 'tweakcn', 'appearance', { imported_themes: updatedThemes });
      await updateSetting('tweakcn_registry_url', registryUrl, 'appearance');
      await updateSetting('active_preset', newTheme.id, 'appearance');

      // Update local state
      setConfig(prev => ({
        ...prev,
        customColors: { light: parsed.light, dark: parsed.dark },
        source: 'tweakcn',
        registryUrl,
        activePreset: newTheme.id,
        importedThemes: updatedThemes,
      }));

      toast.success('Tema importado y aplicado correctamente');
    } catch (error) {
      console.error('Error importing theme:', error);
      toast.error(error instanceof Error ? error.message : 'Error al importar el tema');
    }
  };

  const applyImportedTheme = async (themeId: string) => {
    const theme = config.importedThemes.find(t => t.id === themeId);
    if (!theme) {
      toast.error('Tema no encontrado');
      return;
    }

    try {
      // Apply the theme colors
      applyThemeColors(theme.light, theme.dark);

      // Save to database
      await updateSetting('custom_theme_light', theme.light, 'appearance');
      await updateSetting('custom_theme_dark', theme.dark, 'appearance');
      await updateSetting('theme_source', 'tweakcn', 'appearance');
      await updateSetting('active_preset', themeId, 'appearance');
      await updateSetting('tweakcn_registry_url', theme.url, 'appearance');

      // Update local state
      setConfig(prev => ({
        ...prev,
        customColors: { light: theme.light, dark: theme.dark },
        source: 'tweakcn',
        activePreset: themeId,
        registryUrl: theme.url,
      }));

      toast.success('Tema aplicado correctamente');
    } catch (error) {
      console.error('Error applying theme:', error);
      toast.error('Error al aplicar el tema');
    }
  };

  const applyCustomColors = async (light: Partial<ThemeColors>, dark: Partial<ThemeColors>) => {
    try {
      // Merge with existing colors
      const mergedLight = { ...config.customColors.light, ...light };
      const mergedDark = { ...config.customColors.dark, ...dark };

      // Apply the colors
      applyThemeColors(mergedLight, mergedDark);

      // Save to database
      await updateSetting('custom_theme_light', mergedLight, 'appearance');
      await updateSetting('custom_theme_dark', mergedDark, 'appearance');
      await updateSetting('theme_source', 'custom', 'appearance');

      // Update local state
      setConfig(prev => ({
        ...prev,
        customColors: { light: mergedLight, dark: mergedDark },
        source: 'custom',
        activePreset: undefined,
      }));

      toast.success('Colores personalizados aplicados');
    } catch (error) {
      console.error('Error applying custom colors:', error);
      toast.error('Error al aplicar los colores personalizados');
    }
  };

  const resetToDefault = async () => {
    try {
      // Use simple light theme as default
      const defaultLight: ThemeColors = {
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        card: "0 0% 100%",
        "card-foreground": "222.2 84% 4.9%",
        popover: "0 0% 100%",
        "popover-foreground": "222.2 84% 4.9%",
        primary: "222.2 47.4% 11.2%",
        "primary-foreground": "210 40% 98%",
        secondary: "210 40% 96.1%",
        "secondary-foreground": "222.2 47.4% 11.2%",
        muted: "210 40% 96.1%",
        "muted-foreground": "215.4 16.3% 46.9%",
        accent: "210 40% 96.1%",
        "accent-foreground": "222.2 47.4% 11.2%",
        destructive: "0 84.2% 60.2%",
        "destructive-foreground": "210 40% 98%",
        border: "214.3 31.8% 91.4%",
        input: "214.3 31.8% 91.4%",
        ring: "222.2 84% 4.9%",
      };

      const defaultDark: ThemeColors = {
        background: "222.2 84% 4.9%",
        foreground: "210 40% 98%",
        card: "222.2 84% 4.9%",
        "card-foreground": "210 40% 98%",
        popover: "222.2 84% 4.9%",
        "popover-foreground": "210 40% 98%",
        primary: "210 40% 98%",
        "primary-foreground": "222.2 47.4% 11.2%",
        secondary: "217.2 32.6% 17.5%",
        "secondary-foreground": "210 40% 98%",
        muted: "217.2 32.6% 17.5%",
        "muted-foreground": "215 20.2% 65.1%",
        accent: "217.2 32.6% 17.5%",
        "accent-foreground": "210 40% 98%",
        destructive: "0 62.8% 30.6%",
        "destructive-foreground": "210 40% 98%",
        border: "217.2 32.6% 17.5%",
        input: "217.2 32.6% 17.5%",
        ring: "212.7 26.8% 83.9%",
      };
      
      // Apply default theme
      applyThemeColors(defaultLight, defaultDark);

      // Reset all settings
      await updateSetting('custom_colors', { light: defaultLight, dark: defaultDark }, 'appearance');
      await updateSetting('theme_source', 'default', 'appearance');
      await updateSetting('registry_url', null, 'appearance');
      await updateSetting('active_preset', null, 'appearance');

      // Update local state
      setConfig(prev => ({
        ...prev,
        customColors: { light: defaultLight, dark: defaultDark },
        source: 'default',
        registryUrl: undefined,
        activePreset: undefined,
      }));

      toast.success('Tema restablecido al predeterminado');
    } catch (error) {
      console.error('Error resetting theme:', error);
      toast.error('Error al restablecer el tema');
    }
  };

  return {
    config,
    loading,
    importFromTweakCN,
    applyImportedTheme,
    applyCustomColors,
    resetToDefault,
  };
};
