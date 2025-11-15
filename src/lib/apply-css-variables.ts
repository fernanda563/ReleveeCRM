import { ThemeColors } from './theme-presets';

// Color normalization utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function parseAnyColorToHsl(color: string): { h: number; s: number; l: number } | null {
  color = color.trim();

  // Already HSL format: "H S% L%"
  const hslMatch = color.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (hslMatch) {
    return {
      h: parseInt(hslMatch[1]),
      s: parseInt(hslMatch[2]),
      l: parseInt(hslMatch[3])
    };
  }

  // hsl() or hsla() format
  const hslFuncMatch = color.match(/^hsla?\(\s*(\d+)\s*,?\s*(\d+)%\s*,?\s*(\d+)%/);
  if (hslFuncMatch) {
    return {
      h: parseInt(hslFuncMatch[1]),
      s: parseInt(hslFuncMatch[2]),
      l: parseInt(hslFuncMatch[3])
    };
  }

  // Hex format
  if (color.startsWith('#')) {
    const rgb = hexToRgb(color);
    if (rgb) {
      return rgbToHsl(rgb.r, rgb.g, rgb.b);
    }
  }

  // rgb() or rgba() format
  const rgbMatch = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return rgbToHsl(
      parseInt(rgbMatch[1]),
      parseInt(rgbMatch[2]),
      parseInt(rgbMatch[3])
    );
  }

  return null;
}

// Convert OKLCH to RGB
function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  // Convert to radians
  const hRad = (h * Math.PI) / 180;
  
  // Convert to OKLab
  const a = c * Math.cos(hRad);
  const b = c * Math.sin(hRad);
  
  // OKLab to linear sRGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;
  
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  
  const r_lin = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g_lin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const b_lin = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;
  
  // Apply gamma correction
  const gammaCorrect = (val: number) => {
    const abs = Math.abs(val);
    if (abs <= 0.0031308) return val * 12.92;
    return (Math.sign(val) || 1) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055);
  };
  
  // Clamp and convert to 0-255
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val * 255)));
  
  return {
    r: clamp(gammaCorrect(r_lin)),
    g: clamp(gammaCorrect(g_lin)),
    b: clamp(gammaCorrect(b_lin))
  };
}

function normalizeToHslString(color: string): string {
  color = color.trim();
  
  // Handle OKLCH format: oklch(L C H) or oklch(L% C H)
  const oklchMatch = color.match(/^oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)\s*\)$/i);
  if (oklchMatch) {
    const l = parseFloat(oklchMatch[1]) / (oklchMatch[1].includes('%') ? 100 : 1);
    const c = parseFloat(oklchMatch[2]);
    const h = parseFloat(oklchMatch[3]);
    
    const rgb = oklchToRgb(l, c, h);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
  }
  
  const hsl = parseAnyColorToHsl(color);
  if (!hsl) {
    console.warn(`Could not parse color: ${color}, keeping original`);
    return color;
  }
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
}

// Key normalization utilities
function normalizeKeyToKebabCase(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

const validThemeKeys = [
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
  'accent', 'accent-foreground', 'destructive', 'destructive-foreground', 'border', 'input',
  'ring', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
  'sidebar-background', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
  'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring'
];

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

  // Construir el CSS con !important
  const cssVars = Object.entries(colors)
    .map(([key, value]) => `  --${key}: ${value} !important;`)
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
    .map(([key, value]) => `  --${key}: ${value} !important;`)
    .join('\n');

  const darkCssVars = Object.entries(darkColors)
    .map(([key, value]) => `  --${key}: ${value} !important;`)
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
    // Primero intentar parsear como JSON (formato TweakCN)
    try {
      const json = JSON.parse(css);
      if (json.cssVars && json.cssVars.light && json.cssVars.dark) {
        // Normalizar colores y claves del JSON
        const normalizeThemeObject = (obj: any): Partial<ThemeColors> => {
          const normalized: Partial<ThemeColors> = {};
          
          Object.entries(obj).forEach(([key, value]) => {
            const normalizedKey = normalizeKeyToKebabCase(key);
            
            if (validThemeKeys.includes(normalizedKey) && typeof value === 'string') {
              const normalizedValue = normalizeToHslString(value);
              normalized[normalizedKey as keyof ThemeColors] = normalizedValue;
            }
          });
          
          return normalized;
        };

        return {
          light: normalizeThemeObject(json.cssVars.light) as ThemeColors,
          dark: normalizeThemeObject(json.cssVars.dark) as ThemeColors,
        };
      }
    } catch {
      // Si no es JSON, intentar parsear como CSS
    }

    // Parsear como CSS text
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
          const colorKey = normalizeKeyToKebabCase(key.substring(2));
          
          if (validThemeKeys.includes(colorKey)) {
            colors[colorKey as keyof ThemeColors] = normalizeToHslString(value);
          }
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
