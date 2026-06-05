// Theme A — Nature Exploration (main theme)
export const colors = {
  primary: '#3D5A3D',
  primaryLight: '#5A7A5A',
  secondary: '#E8A87C',
  secondaryLight: '#F0C4A8',
  accent: '#E8A87C',
  accentLight: '#F0C4A8',
  background: '#3D5A3D',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

// Theme B — Warm Heritage (content screens: prep, expense, feedback)
export const heritageColors = {
  background: '#F5EDE3',
  surface: '#FFFFFF',
  primary: '#4A3728',
  secondary: '#C4956A',
  accent: '#C4956A',
  text: '#4A3728',
  textSecondary: '#8B7355',
  textTertiary: '#B8A58B',
  textInverse: '#FFFFFF',
  border: '#E8DDD0',
  borderLight: '#F2EBE1',
} as const;

// Theme C — Dark Utility (maps, live mode, airport)
export const darkColors = {
  background: '#121212',
  surface: 'rgba(255, 255, 255, 0.08)',
  primary: '#1A1A1A',
  secondary: '#7CFF6B',
  accent: '#7CFF6B',
  text: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textTertiary: 'rgba(255, 255, 255, 0.35)',
  textInverse: '#1A1A1A',
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
} as const;

export const typography = {
  display: { fontSize: 40, fontWeight: '700' as const, lineHeight: 48, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 36, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28, letterSpacing: -0.2 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyBold: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  captionBold: { fontSize: 13, fontWeight: '600' as const, lineHeight: 18 },
  button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 20 },
  small: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
} as const;

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: { damping: 15, stiffness: 200 },
} as const;

export const animationPresets = {
  hover: { duration: 150, easing: 'easeOut' },
  press: { duration: 150, spring: true, damping: 15, stiffness: 200 },
  cardAppear: { duration: 300, easing: 'spring', damping: 18, stiffness: 180 },
  pageTransition: { duration: 400, easing: 'easeInOut' },
  stagger: { delay: 80 },
} as const;
