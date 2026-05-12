export const colors = {
  cream: '#FFF5EC',
  shell: '#F7E6DB',
  ink: '#141011',
  coffee: '#2F2522',
  muted: '#6C5F5B',
  soft: '#A69A96',
  blue: '#20257B',
  plum: '#4A225E',
  pink: '#C949A8',
  coral: '#F2617E',
  sky: '#209ED0',
  mint: '#8ECFB8',
  white: '#FFFFFF',
  danger: '#B42342',
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const typography = {
  hero: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '900' as const,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900' as const,
  },
  heading: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '800' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500' as const,
  },
} as const;

export const shadow = {
  color: '#2A1E1A',
  offset: { width: 0, height: 8 },
  opacity: 0.14,
  radius: 18,
  elevation: 5,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadow,
} as const;
