import { colors } from '@/constants/theme';

export const veraTheme = {
  background: colors.cream,
  sectionTitle: '#606060',
  sectionSubtitle: 'rgba(0, 0, 0, 0.31)',
  icon: '#606060',
  chipBackground: 'rgba(196, 196, 196, 0.73)',
  chipBackgroundMuted: 'rgba(196, 196, 196, 0.45)',
  panelBackground: colors.white,
  panelBorder: 'rgba(20, 16, 17, 0.08)',
  summaryBackground: 'rgba(196, 196, 196, 0.18)',
  summaryBorder: 'rgba(196, 196, 196, 0.35)',
  mutedText: colors.muted,
  emptyBackground: 'rgba(196, 196, 196, 0.15)',
  emptyBorder: 'rgba(196, 196, 196, 0.35)',
  linkBackground: 'rgba(196, 196, 196, 0.18)',
  backButtonBackground: 'rgba(196, 196, 196, 0.22)',
  loadingBackground: 'rgba(196, 196, 196, 0.12)',
} as const;
