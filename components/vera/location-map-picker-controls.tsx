import { Feather } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors } from '@/constants/theme';
import type { SafetyLocationType } from '@/types/vera.types';

import {
  RADIUS_PRESETS,
  formatRadiusLabel,
  locationMapPickerStyles as styles,
} from '@/components/vera/location-map-picker.shared';

type LocationMapPickerControlsProps = {
  latitude: string;
  longitude: string;
  radiusMeters: string;
  type: SafetyLocationType;
  hasSelection: boolean;
  disabled?: boolean;
  onRadiusChange: (radiusMeters: string) => void;
};

export function LocationMapPickerControls({
  latitude,
  longitude,
  radiusMeters,
  type,
  hasSelection,
  disabled = false,
  onRadiusChange,
}: LocationMapPickerControlsProps) {
  const parsedRadius = Number(radiusMeters);
  const isRisk = type === 'RISK';

  function adjustRadius(delta: number) {
    if (disabled) {
      return;
    }

    const current = Number(radiusMeters);
    const base = Number.isFinite(current) ? current : 100;
    const next = Math.min(10_000, Math.max(25, base + delta));
    onRadiusChange(String(next));
  }

  return (
    <>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCopy}>
          <AppText variant="label">
            {isRisk ? 'Zona de risco' : 'Local confiavel'}
          </AppText>
          <AppText variant="caption" tone="muted" style={styles.coordinateSummary}>
            {hasSelection
              ? `${latitude}, ${longitude}`
              : 'Nenhum ponto selecionado'}
          </AppText>
        </View>
        <View style={styles.radiusBadge}>
          <AppText variant="caption" style={styles.radiusBadgeText}>
            {formatRadiusLabel(parsedRadius)}
          </AppText>
        </View>
      </View>

      <View style={styles.radiusSection}>
        <AppText variant="caption" tone="muted" style={styles.radiusLabel}>
          Raio de monitoramento
        </AppText>
        <View style={styles.radiusPresets}>
          {RADIUS_PRESETS.map((preset) => {
            const selected = Number(radiusMeters) === preset;

            return (
              <Pressable
                key={preset}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Raio de ${formatRadiusLabel(preset)}`}
                disabled={disabled}
                onPress={() => onRadiusChange(String(preset))}
                style={({ pressed }) => [
                  styles.radiusPreset,
                  selected && styles.radiusPresetSelected,
                  pressed && !disabled && styles.pressed,
                  disabled && styles.disabled,
                ]}
              >
                <AppText
                  variant="caption"
                  style={[
                    styles.radiusPresetText,
                    selected && styles.radiusPresetTextSelected,
                  ]}
                >
                  {formatRadiusLabel(preset)}
                </AppText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.radiusStepper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Diminuir raio"
            disabled={disabled}
            onPress={() => adjustRadius(-25)}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <Feather name="minus" size={20} color={colors.ink} />
          </Pressable>
          <AppText variant="label" style={styles.stepperValue}>
            {formatRadiusLabel(parsedRadius)}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Aumentar raio"
            disabled={disabled}
            onPress={() => adjustRadius(25)}
            style={({ pressed }) => [
              styles.stepperButton,
              pressed && !disabled && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <Feather name="plus" size={20} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </>
  );
}
