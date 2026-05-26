import { StyleSheet } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { SafetyLocationType } from '@/types/vera.types';

export const DEFAULT_LATITUDE = -9.6658;
export const DEFAULT_LONGITUDE = -35.7353;
export const DEFAULT_DELTA = 0.012;

export const RADIUS_PRESETS = [50, 100, 200, 500, 1000] as const;

export type LocationMapPickerProps = {
  latitude: string;
  longitude: string;
  radiusMeters: string;
  type: SafetyLocationType;
  disabled?: boolean;
  onLocationChange: (latitude: string, longitude: string) => void;
  onRadiusChange: (radiusMeters: string) => void;
};

export function parseCoordinate(value: string) {
  const normalizedValue = value.trim().replace(',', '.');

  if (!normalizedValue) {
    return null;
  }

  const parsed = Number(normalizedValue);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function formatCoordinate(value: number) {
  return value.toFixed(6);
}

export function formatRadiusLabel(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '100 m';
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} km`;
  }

  return `${value} m`;
}

export function getSelectionState(latitude: string, longitude: string) {
  const parsedLatitude = parseCoordinate(latitude);
  const parsedLongitude = parseCoordinate(longitude);

  const hasSelection =
    parsedLatitude !== null &&
    parsedLongitude !== null &&
    parsedLatitude >= -90 &&
    parsedLatitude <= 90 &&
    parsedLongitude >= -180 &&
    parsedLongitude <= 180;

  return {
    parsedLatitude,
    parsedLongitude,
    hasSelection,
  };
}

export const locationMapPickerStyles = StyleSheet.create({
  container: {
    gap: spacing[3],
  },
  mapFrame: {
    height: 240,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.1)',
    borderRadius: radius.sm,
    backgroundColor: colors.shell,
  },
  map: {
    flex: 1,
  },
  mapHint: {
    position: 'absolute',
    left: spacing[3],
    right: spacing[3],
    bottom: spacing[3],
    alignItems: 'center',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
  },
  mapHintText: {
    fontWeight: '700',
    textAlign: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  coordinateSummary: {
    fontWeight: '700',
  },
  radiusBadge: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
  },
  radiusBadgeText: {
    fontWeight: '800',
    color: colors.blue,
  },
  radiusSection: {
    gap: spacing[2],
  },
  radiusLabel: {
    textTransform: 'uppercase',
  },
  radiusPresets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  radiusPreset: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.1)',
    backgroundColor: colors.white,
  },
  radiusPresetSelected: {
    borderColor: colors.blue,
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  radiusPresetText: {
    fontWeight: '700',
    color: colors.muted,
  },
  radiusPresetTextSelected: {
    color: colors.blue,
  },
  radiusStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
    padding: spacing[2],
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
  },
  stepperButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.shell,
  },
  stepperValue: {
    flex: 1,
    textAlign: 'center',
  },
  fallbackPanel: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.1)',
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  fallbackText: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.48,
  },
});
