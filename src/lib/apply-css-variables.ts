import { ThemeColors } from './theme-presets';

export function applyCSSVariables(colors: ThemeColors, mode: 'light' | 'dark') {
  const root = document.documentElement;
  const prefix = mode === 'dark' ? '.dark' : ':root';
  
  // Si estamos en dark mode, añadimos la clase dark al html
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Crear un style tag para las variables CSS
  let styleTag = document.getElementById('theme-variables');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'theme-variables';
    document.head.appendChild(styleTag);
  }

  // Construir el CSS
  const cssVars = Object.entries(colors)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');

  const css = `
${prefix} {
${cssVars}
}
  `.trim();

  styleTag.textContent = css;
}

export function applyThemeColors(lightColors: ThemeColors, darkColors: ThemeColors) {
  let styleTag = document.getElementById('theme-variables');
  if (!styleTag) {
    styleTag = document.createElement('style');
    styleTag.id = 'theme-variables';
    document.head.appendChild(styleTag);
  }

  const lightCssVars = Object.entries(lightColors)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');

  const darkCssVars = Object.entries(darkColors)
    .map(([key, value]) => `  --${key}: ${value};`)
    .join('\n');

  const css = `
:root {
${lightCssVars}
}

.dark {
${darkCssVars}
}
  `.trim();

  styleTag.textContent = css;
}

export function parseThemeFromCSS(css: string): { light: ThemeColors; dark: ThemeColors } | null {
  try {
    const lightMatch = css.match(/:root\s*{([^}]+)}/);
    const darkMatch = css.match(/\.dark\s*{([^}]+)}/);

    if (!lightMatch || !darkMatch) {
      return null;
    }

    const parseColors = (cssText: string): ThemeColors => {
      const colors: Partial<ThemeColors> = {};
      const lines = cssText.split(';').map(l => l.trim()).filter(Boolean);
      
      lines.forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value && key.startsWith('--')) {
          const colorKey = key.substring(2) as keyof ThemeColors;
          colors[colorKey] = value;
        }
      });

      return colors as ThemeColors;
    };

    return {
      light: parseColors(lightMatch[1]),
      dark: parseColors(darkMatch[1]),
    };
  } catch (error) {
    console.error('Error parsing theme from CSS:', error);
    return null;
  }
}
