import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import { VeraLogo } from '@/components/brand/vera-logo';
import { AppText } from '@/components/ui/app-text';
import { veraTheme } from '@/constants/vera-theme';
import { colors, iconSize, radius, spacing, touchTarget } from '@/constants/theme';

type VaultScrollScreenProps = {
  children: ReactNode;
  keyboard?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  safeArea?: boolean;
};

export function VaultScrollScreen({
  children,
  keyboard = false,
  contentContainerStyle,
  safeArea = true,
}: VaultScrollScreenProps) {
  const scroll = (
    <ScrollView
      style={layoutStyles.scroll}
      contentContainerStyle={[
        layoutStyles.content,
        { paddingBottom: spacing[10] },
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );

  const body = keyboard ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={layoutStyles.keyboard}
    >
      {scroll}
    </KeyboardAvoidingView>
  ) : (
    scroll
  );

  if (!safeArea) {
    return body;
  }

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={layoutStyles.safeArea}
    >
      {body}
    </SafeAreaView>
  );
}

type VaultHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
};

export function VaultHeader({
  title,
  subtitle,
  onBack = () => router.back(),
  rightAction,
}: VaultHeaderProps) {
  return (
    <View style={layoutStyles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [layoutStyles.backButton, pressed && layoutStyles.pressed]}
      >
        <Feather name="arrow-left" size={iconSize.lg} color={veraTheme.icon} />
      </Pressable>

      <View style={layoutStyles.headerCopy}>
        <AppText style={layoutStyles.headerTitle}>{title}</AppText>
        {subtitle ? (
          <AppText style={layoutStyles.headerSubtitle}>{subtitle}</AppText>
        ) : null}
      </View>

      {rightAction ? (
        <View style={layoutStyles.headerTrailing}>{rightAction}</View>
      ) : (
        <View style={layoutStyles.headerSpacer} />
      )}
    </View>
  );
}

type VaultActionRowProps = {
  title: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
};

export function VaultActionRow({
  title,
  icon = 'shield',
  onPress,
}: VaultActionRowProps) {
  return (
    <View style={layoutStyles.actionRowContainer}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          layoutStyles.actionRowPressable,
          pressed && layoutStyles.pressed,
        ]}
      >
        <View style={layoutStyles.actionRow}>
          <View style={layoutStyles.actionRowIcon}>
            <Feather name={icon} size={iconSize.sm} color={veraTheme.icon} />
          </View>

          <AppText style={layoutStyles.actionRowText} numberOfLines={2}>
            {title}
          </AppText>

          <View style={layoutStyles.actionRowTrailing}>
            <Feather name="chevron-right" size={iconSize.sm} color={veraTheme.icon} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

type VaultHomeHeaderProps = {
  onLock: () => void;
  onSettings: () => void;
};

export function VaultHomeHeader({ onLock, onSettings }: VaultHomeHeaderProps) {
  return (
    <View style={layoutStyles.homeHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Bloquear Vera"
        hitSlop={12}
        onPress={onLock}
        style={({ pressed }) => [layoutStyles.iconButton, pressed && layoutStyles.pressed]}
      >
        <Feather name="lock" size={iconSize.md} color={veraTheme.icon} />
      </Pressable>

      <VeraLogo width={86} style={layoutStyles.homeLogo} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Configurações Vera"
        hitSlop={12}
        onPress={onSettings}
        style={({ pressed }) => [layoutStyles.iconButton, pressed && layoutStyles.pressed]}
      >
        <Feather name="settings" size={iconSize.md} color={veraTheme.icon} />
      </Pressable>
    </View>
  );
}

type VaultPanelProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function VaultPanel({ children, style }: VaultPanelProps) {
  return <View style={[layoutStyles.panel, style]}>{children}</View>;
}

export function VaultMutedText({ children }: { children: ReactNode }) {
  return <AppText style={layoutStyles.mutedText}>{children}</AppText>;
}

const layoutStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: veraTheme.background,
  },
  keyboard: {
    flex: 1,
    backgroundColor: veraTheme.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: veraTheme.background,
  },
  content: {
    flexGrow: 1,
    gap: spacing[5],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[1],
  },
  backButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.comfortable / 2,
    backgroundColor: veraTheme.backButtonBackground,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: spacing[1],
  },
  headerSpacer: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    flexShrink: 0,
  },
  headerTrailing: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: veraTheme.sectionTitle,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '400',
    color: veraTheme.sectionSubtitle,
  },
  homeHeader: {
    minHeight: touchTarget.comfortable,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[2],
  },
  homeLogo: {
    flex: 1,
  },
  iconButton: {
    width: touchTarget.comfortable,
    height: touchTarget.comfortable,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: touchTarget.comfortable / 2,
    backgroundColor: veraTheme.backButtonBackground,
  },
  panel: {
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: veraTheme.panelBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
  },
  mutedText: {
    fontSize: 12,
    lineHeight: 17,
    color: veraTheme.mutedText,
  },
  actionRowContainer: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  actionRowPressable: {
    minHeight: touchTarget.comfortable,
    paddingHorizontal: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.linkBackground,
  },
  actionRow: {
    minHeight: touchTarget.comfortable,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: spacing[3],
  },
  actionRowIcon: {
    width: iconSize.lg,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRowText: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: veraTheme.sectionTitle,
  },
  actionRowTrailing: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});

export const vaultLayoutStyles = layoutStyles;
