import { Feather } from '@expo/vector-icons';
import { Switch, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, iconSize, spacing, touchTarget } from '@/constants/theme';

type SettingToggleRowProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
};

export function SettingToggleRow({
  icon,
  title,
  description,
  value,
  disabled = false,
  onValueChange,
}: SettingToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <Feather name={icon} size={iconSize.sm} color={colors.blue} />
      </View>
      <View style={styles.copy}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" tone="muted" style={styles.description}>
          {description}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{
          false: 'rgba(20, 16, 17, 0.12)',
          true: 'rgba(32, 37, 123, 0.42)',
        }}
        thumbColor={value ? colors.blue : colors.white}
        ios_backgroundColor="rgba(20, 16, 17, 0.12)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    minHeight: touchTarget.comfortable,
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(20, 16, 17, 0.06)',
  },
  iconWrap: {
    width: touchTarget.min,
    height: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.min / 2,
    backgroundColor: colors.shell,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  description: {
    lineHeight: 17,
  },
});
