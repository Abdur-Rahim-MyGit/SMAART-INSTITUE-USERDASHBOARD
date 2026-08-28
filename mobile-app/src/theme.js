// SMAART Institute brand palette — Obsidian Navy & Cyber Blue.
export const colors = {
  // Navy/Slate family — deep obsidian header/surface tones
  navyDarkest: '#0A0F1D', // Deepest obsidian space-dark color
  navyDark: '#0D1527',    // Brand slate-dark navy — auth background/header
  navy: '#1E293B',        // Slate-800 surface color
  navyLight: '#334155',   // Slate-700 borders/dividers

  primary: '#2563EB',      // Modern vibrant cyber blue
  primaryBright: '#3B82F6', // Lighter neon cyber blue highlight state

  // Gold / cream / silver accents
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  cream: '#FFF0C7',   // Warm accent — premium highlight touches
  silver: '#CBD5E1',

  // Neutrals — icy slate-blue tinted
  bg: '#0A0F1D',
  surface: '#1E293B',
  surfaceMuted: '#1E293B',
  border: '#334155',
  text: '#F8FAFC',
  muted: '#94A3B8',
  mutedLight: '#64748B',

  danger: '#EF4444',
  dangerBg: '#7A1C1C',
  success: '#10B981', // Emerald success

  white: '#FFFFFF',
  black: '#000000',

  // Legacy aliases
  accent: '#2563EB',
  light: '#0A0F1D',
  grey: '#1E293B',
  lightBlue: '#3B82F6',
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadow = {
  card: {
    shadowColor: '#0F1E42',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  button: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 5,
  },
};

export const typography = {
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
};
