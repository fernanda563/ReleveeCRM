import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { applyThemeColors, parseThemeFromCSS } from '@/lib/apply-css-variables';
import { ThemeColors } from '@/lib/theme-presets';

export const useThemeInitializer = () => {
  useEffect(() => {
    const initializeTheme = async () => {
      try {
        // Fetch appearance settings
        const { data, error } = await supabase
          .from('system_settings')
          .select('*')
          .eq('category', 'appearance');

        if (error) {
          console.error('Error loading theme settings:', error);
          return;
        }

        // Map settings
        const settingsMap = data?.reduce((acc, setting) => {
          const raw = setting.value as any;
          acc[setting.key] = raw && typeof raw === 'object' && 'value' in raw ? raw.value : raw;
          return acc;
        }, {} as Record<string, any>) || {};

        // Extract colors
        let lightColors = settingsMap.custom_theme_light || ({} as ThemeColors);
        let darkColors = settingsMap.custom_theme_dark || ({} as ThemeColors);

        // Normalize if needed (OKLCH to HSL)
        const needsNormalization = 
          JSON.stringify(lightColors).includes('oklch') || 
          JSON.stringify(darkColors).includes('oklch');

        if (needsNormalization) {
          const normalized = parseThemeFromCSS(JSON.stringify({
            cssVars: { light: lightColors, dark: darkColors }
          }));

          if (normalized) {
            lightColors = normalized.light;
            darkColors = normalized.dark;
          }
        }

        // Apply theme if colors exist
        if (Object.keys(lightColors).length > 0 && Object.keys(darkColors).length > 0) {
          applyThemeColors(lightColors, darkColors);
          console.log('Theme applied successfully:', settingsMap.active_preset || 'custom');
        }
      } catch (error) {
        console.error('Error initializing theme:', error);
      }
    };

    initializeTheme();
  }, []); // Solo ejecutar una vez al montar
};
