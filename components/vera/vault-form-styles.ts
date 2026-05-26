import { StyleSheet } from 'react-native';

import { vaultLayoutStyles } from '@/components/vera/vault-layout';
import { veraTheme } from '@/constants/vera-theme';
import { colors, radius, spacing, touchTarget } from '@/constants/theme';

export const vaultFormStyles = StyleSheet.create({
  ...vaultLayoutStyles,
  summaryPanel: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: veraTheme.summaryBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.summaryBackground,
  },
  summaryIcon: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.comfortable / 2,
    backgroundColor: veraTheme.chipBackground,
  },
  summaryCopy: {
    flex: 1,
  },
  mutedText: {
    color: veraTheme.mutedText,
  },
  loadingPanel: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.loadingBackground,
  },
  panel: {
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: veraTheme.panelBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
  },
  panelTitle: {
    textTransform: 'uppercase',
    color: veraTheme.sectionTitle,
  },
  listTitle: {
    textTransform: 'uppercase',
    color: veraTheme.sectionTitle,
  },
  formHeader: {
    minHeight: touchTarget.comfortable,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  formHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: veraTheme.panelBorder,
    borderRadius: touchTarget.comfortable / 2,
    backgroundColor: veraTheme.backButtonBackground,
  },
  switchIcon: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.min / 2,
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  switchRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  stretchButton: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: spacing[2],
  },
  feedback: {
    minHeight: touchTarget.comfortable,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(142, 207, 184, 0.32)',
  },
  feedbackText: {
    flex: 1,
    color: colors.ink,
  },
  listSection: {
    gap: spacing[3],
    paddingTop: spacing[2],
  },
  listHeader: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  refreshButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.comfortable / 2,
    backgroundColor: veraTheme.backButtonBackground,
  },
  emptyState: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: veraTheme.emptyBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.emptyBackground,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
  },
  messageCompact: {
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  messageText: {
    flex: 1,
    color: colors.danger,
  },
  messageAction: {
    minHeight: touchTarget.min,
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  messageActionText: {
    fontWeight: '800',
  },
  disabledAction: {
    opacity: 0.48,
  },
});
