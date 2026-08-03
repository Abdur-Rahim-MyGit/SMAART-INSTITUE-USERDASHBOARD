// SMAART Institute brand palette — kept in sync with front-end/tailwind.config.ts
// so the mobile app and web dashboard read as the same product.
export const colors = {
  // Navy — primary brand surface/text color
  navyDarkest: '#00152E',
  navyDark: '#002147',
  navy: '#112B6B',
  navyLight: '#002A5C',
  primary: '#1A3884',
  primaryBright: '#3B82F6',

  // Gold / silver — sparing accent use only
  gold: '#DAA520',
  goldLight: '#F4C430',
  silver: '#C0C0C0',

  // Neutrals
  bg: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E5EAF2',
  text: '#0F172A',
  muted: '#64748B',
  mutedLight: '#94A3B8',

  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  success: '#16A34A',

  white: '#FFFFFF',
  black: '#000000',

  // Legacy aliases kept so any not-yet-migrated screen doesn't break.
  accent: '#1A3884',
  light: '#DCE6F1',
  grey: '#F2F2F2',
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
