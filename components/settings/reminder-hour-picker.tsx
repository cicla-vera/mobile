import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing, surfaces } from '@/constants/theme';

const REMINDER_HOUR_OPTIONS = [6, 7, 8, 9, 12, 18, 20, 21] as const;

function formatReminderHour(hour: number) {
  return `${String(hour).padStart(2, '0')}:00`;
}

type ReminderHourPickerProps = {
  value?: number;
  disabled?: boolean;
  onChange: (hour: number) => void;
};

export function ReminderHourPicker({
  value,
  disabled = false,
  onChange,
}: ReminderHourPickerProps) {
  const selectedHour =
    value !== undefined && value !== null ? Number(value) : undefined;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <AppText variant="label">Horario dos lembretes</AppText>
          <AppText variant="caption" tone="muted">
            Toque para escolher quando receber os avisos diarios.
          </AppText>
        </View>
        {selectedHour !== undefined ? (
          <View style={styles.selectedBadge}>
            <Feather name="clock" size={22} color={colors.white} />
            <Text style={styles.selectedBadgeText}>
              {formatReminderHour(selectedHour)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.grid}>
        {REMINDER_HOUR_OPTIONS.map((hour) => {
          const selected = selectedHour === hour;
          const isDisabled = disabled || selectedHour === undefined;

          return (
            <Pressable
              key={hour}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Selecionar ${formatReminderHour(hour)}`}
              disabled={isDisabled}
              onPress={() => onChange(hour)}
              style={({ pressed }) => [
                styles.optionWrap,
                pressed && !selected && !isDisabled && styles.optionWrapPressed,
              ]}
            >
              <View
                style={[
                  styles.option,
                  selected ? styles.optionSelected : styles.optionIdle,
                  isDisabled && styles.optionDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    selected ? styles.optionLabelSelected : styles.optionLabelIdle,
                  ]}
                >
                  {formatReminderHour(hour)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing[2],
    padding: spacing[3],
    gap: spacing[3],
    ...surfaces.inset,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing[1],
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
  },
  selectedBadgeText: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  optionWrap: {
    width: '23.5%',
  },
  optionWrapPressed: {
    opacity: 0.88,
  },
  option: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
  },
  optionIdle: {
    borderWidth: 1,
    borderColor: 'rgba(47, 37, 34, 0.16)',
    backgroundColor: colors.white,
  },
  optionSelected: {
    borderWidth: 2,
    borderColor: colors.pink,
    backgroundColor: colors.blue,
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  optionLabelIdle: {
    color: colors.ink,
  },
  optionLabelSelected: {
    color: colors.white,
  },
});
