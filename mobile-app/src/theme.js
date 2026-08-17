// SMAART Institute brand palette — kept in sync with front-end/tailwind.config.ts
// so the mobile app and web dashboard read as the same product.
export const colors = {
  // Slate Dark & Cyber Blue — primary brand surface/text color
  navyDarkest: '#0A0F1D', // Obsidian slate dark
  navyDark: '#111827',    // Premium dark grey-blue
  navy: '#1E293B',        // Slate navy
  navyLight: '#374151',   // Lighter slate grey
  primary: '#2563EB',     // Royal Blue (Matches Logo)
  primaryBright: '#3B82F6', // Cyber Blue (Matches Logo)

  // Gold / silver accents
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  silver: '#CBD5E1',

  // Neutrals
  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',
  border: '#E5E7EB',
  text: '#0F172A',
  muted: '#64748B',
  mutedLight: '#9CA3AF',

  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  success: '#10B981', // Emerald success

  white: '#FFFFFF',
  black: '#000000',

  // Legacy aliases
  accent: '#2563EB',
  light: '#EFF6FF',
  grey: '#F3F4F6',
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
