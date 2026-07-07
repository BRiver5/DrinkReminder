export interface AccentTheme {
  /** Stored in user_settings.theme_color */
  key: string;
  name: string;
  primary: string;
  /** Header / CTA gradient, dark to light */
  gradient: [string, string];
  /** Progress ring gradient */
  ring: [string, string];
  /** Very light tint for icon chips and selected states */
  soft: string;
}

export const ACCENTS: AccentTheme[] = [
  {
    key: '#0B57D0',
    name: 'Classic Blue',
    primary: '#0B57D0',
    gradient: ['#0B57D0', '#4FA3F7'],
    ring: ['#2E9EFF', '#5FD0FF'],
    soft: '#E3EEFB',
  },
  {
    key: '#1E88E5',
    name: 'Sky',
    primary: '#1E88E5',
    gradient: ['#1E88E5', '#6AB7F5'],
    ring: ['#42A5F5', '#90CAF9'],
    soft: '#E4F1FC',
  },
  {
    key: '#00ACC1',
    name: 'Cyan',
    primary: '#00ACC1',
    gradient: ['#00ACC1', '#4DD0E1'],
    ring: ['#26C6DA', '#80DEEA'],
    soft: '#DFF6F9',
  },
  {
    key: '#00897B',
    name: 'Teal',
    primary: '#00897B',
    gradient: ['#00897B', '#4DB6AC'],
    ring: ['#26A69A', '#80CBC4'],
    soft: '#DFF2F0',
  },
  {
    key: '#3949AB',
    name: 'Indigo',
    primary: '#3949AB',
    gradient: ['#3949AB', '#7986CB'],
    ring: ['#5C6BC0', '#9FA8DA'],
    soft: '#E7EAF8',
  },
  {
    key: '#0288D1',
    name: 'Ocean',
    primary: '#0288D1',
    gradient: ['#0288D1', '#4FC3F7'],
    ring: ['#29B6F6', '#81D4FA'],
    soft: '#E1F3FC',
  },
];

export const BASE_COLORS = {
  background: '#F4F8FC',
  card: '#FFFFFF',
  textPrimary: '#0E2A47',
  textSecondary: '#7A8CA3',
  border: '#E3ECF5',
  track: '#E9F1F9',
  danger: '#E5484D',
  success: '#2FBF71',
  white: '#FFFFFF',
};

export interface Theme extends AccentTheme {
  colors: typeof BASE_COLORS;
}

export const DEFAULT_ACCENT = ACCENTS[0];

export function buildTheme(themeColor: string): Theme {
  const accent = ACCENTS.find((a) => a.key === themeColor) ?? DEFAULT_ACCENT;
  return { ...accent, colors: BASE_COLORS };
}

export const RADIUS = {
  card: 18,
  button: 14,
  chip: 28,
};

export const CARD_SHADOW = {
  shadowColor: '#0E2A47',
  shadowOpacity: 0.07,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
