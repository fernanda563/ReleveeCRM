export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  light: ThemeColors;
  dark: ThemeColors;
}

export const themePresets: ThemePreset[] = [
  {
    id: 'minimalista',
    name: 'Minimalista B/N',
    description: 'Tema blanco y negro minimalista actual',
    light: {
      background: '0 0% 100%',
      foreground: '0 0% 0%',
      card: '0 0% 100%',
      'card-foreground': '0 0% 0%',
      popover: '0 0% 100%',
      'popover-foreground': '0 0% 0%',
      primary: '0 0% 0%',
      'primary-foreground': '0 0% 100%',
      secondary: '0 0% 96%',
      'secondary-foreground': '0 0% 0%',
      muted: '0 0% 96%',
      'muted-foreground': '0 0% 45%',
      accent: '0 0% 96%',
      'accent-foreground': '0 0% 0%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 98%',
      border: '0 0% 90%',
      input: '0 0% 90%',
      ring: '0 0% 0%',
    },
    dark: {
      background: '0 0% 0%',
      foreground: '0 0% 100%',
      card: '0 0% 0%',
      'card-foreground': '0 0% 100%',
      popover: '0 0% 0%',
      'popover-foreground': '0 0% 100%',
      primary: '0 0% 100%',
      'primary-foreground': '0 0% 0%',
      secondary: '0 0% 10%',
      'secondary-foreground': '0 0% 100%',
      muted: '0 0% 10%',
      'muted-foreground': '0 0% 65%',
      accent: '0 0% 10%',
      'accent-foreground': '0 0% 100%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 98%',
      border: '0 0% 15%',
      input: '0 0% 15%',
      ring: '0 0% 100%',
    },
  },
  {
    id: 'professional-blue',
    name: 'Profesional Azul',
    description: 'Tema azul corporativo profesional',
    light: {
      background: '0 0% 100%',
      foreground: '222 47% 11%',
      card: '0 0% 100%',
      'card-foreground': '222 47% 11%',
      popover: '0 0% 100%',
      'popover-foreground': '222 47% 11%',
      primary: '221 83% 53%',
      'primary-foreground': '210 40% 98%',
      secondary: '210 40% 96%',
      'secondary-foreground': '222 47% 11%',
      muted: '210 40% 96%',
      'muted-foreground': '215 16% 47%',
      accent: '210 40% 96%',
      'accent-foreground': '222 47% 11%',
      destructive: '0 84% 60%',
      'destructive-foreground': '210 40% 98%',
      border: '214 32% 91%',
      input: '214 32% 91%',
      ring: '221 83% 53%',
    },
    dark: {
      background: '222 47% 11%',
      foreground: '210 40% 98%',
      card: '222 47% 11%',
      'card-foreground': '210 40% 98%',
      popover: '222 47% 11%',
      'popover-foreground': '210 40% 98%',
      primary: '217 91% 60%',
      'primary-foreground': '222 47% 11%',
      secondary: '217 33% 17%',
      'secondary-foreground': '210 40% 98%',
      muted: '217 33% 17%',
      'muted-foreground': '215 20% 65%',
      accent: '217 33% 17%',
      'accent-foreground': '210 40% 98%',
      destructive: '0 62% 30%',
      'destructive-foreground': '210 40% 98%',
      border: '217 33% 17%',
      input: '217 33% 17%',
      ring: '224 76% 48%',
    },
  },
  {
    id: 'elegant-purple',
    name: 'Elegante Morado',
    description: 'Tema morado elegante y moderno',
    light: {
      background: '0 0% 100%',
      foreground: '270 5% 16%',
      card: '0 0% 100%',
      'card-foreground': '270 5% 16%',
      popover: '0 0% 100%',
      'popover-foreground': '270 5% 16%',
      primary: '262 83% 58%',
      'primary-foreground': '0 0% 100%',
      secondary: '270 5% 96%',
      'secondary-foreground': '270 5% 16%',
      muted: '270 5% 96%',
      'muted-foreground': '270 4% 47%',
      accent: '270 5% 96%',
      'accent-foreground': '270 5% 16%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 98%',
      border: '270 5% 91%',
      input: '270 5% 91%',
      ring: '262 83% 58%',
    },
    dark: {
      background: '270 5% 8%',
      foreground: '0 0% 98%',
      card: '270 5% 8%',
      'card-foreground': '0 0% 98%',
      popover: '270 5% 8%',
      'popover-foreground': '0 0% 98%',
      primary: '263 70% 63%',
      'primary-foreground': '270 5% 8%',
      secondary: '270 5% 14%',
      'secondary-foreground': '0 0% 98%',
      muted: '270 5% 14%',
      'muted-foreground': '270 4% 65%',
      accent: '270 5% 14%',
      'accent-foreground': '0 0% 98%',
      destructive: '0 62% 30%',
      'destructive-foreground': '0 0% 98%',
      border: '270 5% 14%',
      input: '270 5% 14%',
      ring: '263 70% 63%',
    },
  },
  {
    id: 'warm-orange',
    name: 'Cálido Naranja',
    description: 'Tema naranja cálido y acogedor',
    light: {
      background: '0 0% 100%',
      foreground: '20 14% 8%',
      card: '0 0% 100%',
      'card-foreground': '20 14% 8%',
      popover: '0 0% 100%',
      'popover-foreground': '20 14% 8%',
      primary: '25 95% 53%',
      'primary-foreground': '0 0% 100%',
      secondary: '60 5% 96%',
      'secondary-foreground': '20 14% 8%',
      muted: '60 5% 96%',
      'muted-foreground': '25 6% 45%',
      accent: '60 5% 96%',
      'accent-foreground': '20 14% 8%',
      destructive: '0 84% 60%',
      'destructive-foreground': '0 0% 98%',
      border: '20 6% 90%',
      input: '20 6% 90%',
      ring: '25 95% 53%',
    },
    dark: {
      background: '20 14% 8%',
      foreground: '60 10% 98%',
      card: '20 14% 8%',
      'card-foreground': '60 10% 98%',
      popover: '20 14% 8%',
      'popover-foreground': '60 10% 98%',
      primary: '21 90% 48%',
      'primary-foreground': '0 0% 100%',
      secondary: '12 7% 15%',
      'secondary-foreground': '60 10% 98%',
      muted: '12 7% 15%',
      'muted-foreground': '24 6% 63%',
      accent: '12 7% 15%',
      'accent-foreground': '60 10% 98%',
      destructive: '0 62% 30%',
      'destructive-foreground': '60 10% 98%',
      border: '12 7% 15%',
      input: '12 7% 15%',
      ring: '21 90% 48%',
    },
  },
];
