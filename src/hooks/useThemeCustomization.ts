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
      
      // Use only imported themes (no default themes)
      const importedThemes = settings.imported_themes || [];
      
      // Ensure exactly one theme is marked as default if there are themes
      if (importedThemes.length > 0) {
        const hasDefault = importedThemes.some(t => t.isDefault);
        if (!hasDefault) {
          importedThemes[0].isDefault = true;
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
        importedThemes: importedThemes,
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

      // Get current imported themes and add new one at the beginning
      // Keep only the last 4 themes (FIFO - First In, First Out)
      const currentThemes = config.importedThemes || [];
      const updatedThemes = [newTheme, ...currentThemes].slice(0, 4);
      
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
        importedThemes: updatedThemes,
      });

      // Apply the imported theme
      applyThemeColors(parsed.light, parsed.dark);

      // Save to database
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
      const updatedThemes = config.importedThemes.map(t => ({
        ...t,
        isDefault: t.id === themeId,
      }));

      // Update config state
      setConfig({
        ...config,
        importedThemes: updatedThemes,
      });

      // Save to database
      await updateSetting('imported_themes', updatedThemes, 'appearance');

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
      // Filter out the theme to delete
      const updatedThemes = config.importedThemes.filter(t => t.id !== themeId);

      // If deleted theme was the active one, apply first available theme or default colors
      if (config.activePreset === themeId) {
        if (updatedThemes.length > 0) {
          const nextTheme = updatedThemes.find(t => t.isDefault) || updatedThemes[0];
          await applyImportedTheme(nextTheme.id);
        } else {
          // No themes left, apply default Lovable Original theme
          const defaultTheme = DEFAULT_THEMES[0];
          applyThemeColors(defaultTheme.light, defaultTheme.dark);
          await updateSetting('custom_theme_light', defaultTheme.light, 'appearance');
          await updateSetting('custom_theme_dark', defaultTheme.dark, 'appearance');
          await updateSetting('theme_source', 'default', 'appearance');
          await updateSetting('active_preset', null, 'appearance');
        }
      }

      // If deleted theme was the default, set first theme as default
      const deletedTheme = config.importedThemes.find(t => t.id === themeId);
      if (deletedTheme?.isDefault && updatedThemes.length > 0) {
        updatedThemes[0].isDefault = true;
      }

      // Update config state
      setConfig({
        ...config,
        importedThemes: updatedThemes,
      });

      // Save to database
      await updateSetting('imported_themes', updatedThemes, 'appearance');

      toast.success('Tema eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar tema:', error);
      toast.error('Error al eliminar el tema');
    }
  };

  const renameTheme = async (themeId: string, newName: string) => {
    try {
      if (!newName.trim()) {
        toast.error('El nombre no puede estar vacío');
        return;
      }

      // Update the theme name
      const updatedThemes = config.importedThemes.map(t => 
        t.id === themeId ? { ...t, name: newName.trim() } : t
      );

      // Update config state
      setConfig({
        ...config,
        importedThemes: updatedThemes,
      });

      // Save to database
      await updateSetting('imported_themes', updatedThemes, 'appearance');

      toast.success('Tema renombrado correctamente');
    } catch (error) {
      console.error('Error al renombrar tema:', error);
      toast.error('Error al renombrar el tema');
    }
  };

  const resetToDefault = async () => {
    try {
      // If there are imported themes, apply the default one
      if (config.importedThemes.length > 0) {
        const defaultTheme = config.importedThemes.find(t => t.isDefault) || config.importedThemes[0];
        await applyImportedTheme(defaultTheme.id);
      } else {
        // No imported themes, apply Lovable Original default
        const defaultTheme = DEFAULT_THEMES[0];
        applyThemeColors(defaultTheme.light, defaultTheme.dark);
        
        await updateSetting('custom_theme_light', defaultTheme.light, 'appearance');
        await updateSetting('custom_theme_dark', defaultTheme.dark, 'appearance');
        await updateSetting('theme_source', 'default', 'appearance');
        await updateSetting('active_preset', null, 'appearance');
        
        setConfig({
          ...config,
          customColors: {
            light: defaultTheme.light,
            dark: defaultTheme.dark,
          },
          source: 'default',
          activePreset: undefined,
        });
      }

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
    renameTheme,
    resetToDefault,
  };
};
