import { Link, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

type ToolbarAction = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  href?: Href;
  onPress?: () => void;
  showBadge?: boolean;
};

const ACTIONS: ToolbarAction[] = [
  { icon: 'plus', label: 'Registrar', href: '/(exterior)/log' },
  { icon: 'user', label: 'Perfil', href: '/(interior)' },
  { icon: 'calendar', label: 'Calendario', href: '/(exterior)' },
  { icon: 'bell', label: 'Notificacoes', showBadge: true },
  { icon: 'settings', label: 'Configuracoes', href: '/(exterior)/settings' },
];

function ToolbarButton({ action }: { action: ToolbarAction }) {
  const icon = (
    <>
      <Feather name={action.icon} size={16} color={colors.ink} />
      {action.showBadge ? <View style={styles.badge} /> : null}
    </>
  );

  if (action.href) {
    return (
      <Link href={action.href} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={styles.button}
        >
          {icon}
        </Pressable>
      </Link>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={action.label}
      onPress={action.onPress}
      style={styles.button}
    >
      {icon}
    </Pressable>
  );
}

export function CalendarToolbar() {
  return (
    <View style={styles.toolbar}>
      {ACTIONS.map((action) => (
        <ToolbarButton key={action.label} action={action} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  button: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -1,
    right: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DA1919',
  },
});
