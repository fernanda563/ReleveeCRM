import { useState, useEffect } from 'react';
import { useSystemSettings } from './useSystemSettings';
import { applyThemeColors, parseThemeFromCSS } from '@/lib/apply-css-variables';
import { ThemeColors, ImportedTheme, DEFAULT_THEMES } from '@/lib/theme-presets';
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
      
      // Combine DEFAULT_THEMES with imported themes
      const importedThemes = settings.imported_themes || [];
      const allThemes = [...DEFAULT_THEMES, ...importedThemes];
      
      // Ensure exactly one theme is marked as default
      const hasDefault = allThemes.some(t => t.isDefault);
      if (!hasDefault && allThemes.length > 0) {
        allThemes[0].isDefault = true;
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
        importedThemes: allThemes,
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
        isDefault: false,
      };

      // Filter out default themes and add to imported themes
      const userImportedThemes = config.importedThemes.filter(t => !DEFAULT_THEMES.find(dt => dt.id === t.id));
      const updatedThemes = [...userImportedThemes, newTheme];
      
      // Update config state
      setConfig({
        ...config,
        customColors: {
          light: parsed.light,
          dark: parsed.dark,
        },
        source: 'tweakcn',
        registryUrl,
        activePreset: newTheme.id,
        importedThemes: [...DEFAULT_THEMES, ...updatedThemes],
      });

      // Apply the imported theme
      applyThemeColors(parsed.light, parsed.dark);

      // Save to database (only user-imported themes, not defaults)
      await updateSetting('custom_theme_light', parsed.light, 'appearance');
      await updateSetting('custom_theme_dark', parsed.dark, 'appearance');
      await updateSetting('theme_source', 'tweakcn', 'appearance');
      await updateSetting('tweakcn_registry_url', registryUrl, 'appearance');
      await updateSetting('active_preset', newTheme.id, 'appearance');
      await updateSetting('imported_themes', updatedThemes, 'appearance');

      toast.success('Tema importado y aplicado correctamente');
    } catch (error) {
      console.error('Error importing theme:', error);
      toast.error(error instanceof Error ? error.message : 'Error al importar el tema');
    }
  };

  const applyImportedTheme = async (themeId: string) => {
    const theme = config.importedThemes?.find(t => t.id === themeId);
    if (!theme) {
      toast.error('Tema no encontrado');
      return;
    }

    try {
      // Update config state
      setConfig({
        ...config,
        customColors: {
          light: theme.light,
          dark: theme.dark,
        },
        source: 'tweakcn',
        activePreset: themeId,
      });

      // Apply theme colors
      applyThemeColors(theme.light, theme.dark);

      // Save to database
      await updateSetting('custom_theme_light', theme.light, 'appearance');
      await updateSetting('custom_theme_dark', theme.dark, 'appearance');
      await updateSetting('theme_source', 'tweakcn', 'appearance');
      await updateSetting('active_preset', themeId, 'appearance');

      toast.success('Tema aplicado correctamente');
    } catch (error) {
      console.error('Error al aplicar tema:', error);
      toast.error('Error al aplicar el tema');
    }
  };

  const setDefaultTheme = async (themeId: string) => {
    try {
      // Update all themes to mark only the selected one as default
      const updatedAllThemes = config.importedThemes.map(t => ({
        ...t,
        isDefault: t.id === themeId,
      }));

      // Filter out default themes for saving
      const userImportedThemes = updatedAllThemes.filter(t => !DEFAULT_THEMES.find(dt => dt.id === t.id));

      // Update config state
      setConfig({
        ...config,
        importedThemes: updatedAllThemes,
      });

      // Save to database (only user-imported themes)
      await updateSetting('imported_themes', userImportedThemes, 'appearance');

      toast.success('Tema predeterminado actualizado');
    } catch (error) {
      console.error('Error al establecer tema predeterminado:', error);
      toast.error('Error al establecer el tema predeterminado');
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

  const deleteTheme = async (themeId: string) => {
    try {
      // Check if it's a default theme (cannot be deleted)
      const isDefaultTheme = DEFAULT_THEMES.find(t => t.id === themeId);
      if (isDefaultTheme) {
        toast.error('No puedes eliminar un tema precargado');
        return;
      }

      // Filter out the theme to delete
      const updatedAllThemes = config.importedThemes.filter(t => t.id !== themeId);
      const userImportedThemes = updatedAllThemes.filter(t => !DEFAULT_THEMES.find(dt => dt.id === t.id));

      // If deleted theme was the active one, apply default theme
      if (config.activePreset === themeId) {
        const defaultTheme = updatedAllThemes.find(t => t.isDefault) || DEFAULT_THEMES[0];
        await applyImportedTheme(defaultTheme.id);
      }

      // If deleted theme was the default, set first theme as default
      const deletedTheme = config.importedThemes.find(t => t.id === themeId);
      if (deletedTheme?.isDefault && updatedAllThemes.length > 0) {
        updatedAllThemes[0].isDefault = true;
        const updatedUserThemes = updatedAllThemes.filter(t => !DEFAULT_THEMES.find(dt => dt.id === t.id));
        await updateSetting('imported_themes', updatedUserThemes, 'appearance');
      }

      // Update config state
      setConfig({
        ...config,
        importedThemes: updatedAllThemes,
      });

      // Save to database
      await updateSetting('imported_themes', userImportedThemes, 'appearance');

      toast.success('Tema eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar tema:', error);
      toast.error('Error al eliminar el tema');
    }
  };

  const resetToDefault = async () => {
    try {
      // Find the default theme
      const defaultTheme = config.importedThemes.find(t => t.isDefault) || DEFAULT_THEMES[0];

      // Apply the default theme
      await applyImportedTheme(defaultTheme.id);

      toast.success('Tema restablecido al predeterminado');
    } catch (error) {
      console.error('Error al restablecer tema:', error);
      toast.error('Error al restablecer el tema');
    }
  };

  return {
    config,
    loading,
    importFromTweakCN,
    applyImportedTheme,
    applyCustomColors,
    setDefaultTheme,
    deleteTheme,
    resetToDefault,
  };
};
