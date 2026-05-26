import { StyleSheet } from 'react-native';

import { colors, iconSize, radius, spacing, touchTarget } from '@/constants/theme';

export { iconSize, touchTarget };

export const a11yStyles = StyleSheet.create({
  iconButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.comfortable / 2,
  },
  iconButtonShell: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.comfortable / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  iconBubble: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  iconBubbleLarge: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  minTouchRow: {
    minHeight: touchTarget.min,
  },
  minTouchAction: {
    minHeight: touchTarget.comfortable,
  },
  compactAction: {
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[3],
  },
  chipAction: {
    minHeight: touchTarget.comfortable,
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    borderRadius: radius.sm,
  },
});

export const backIconColor = colors.ink;
