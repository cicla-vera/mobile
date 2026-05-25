import { Link, type Href } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

type ToolbarAction = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  href?: Href;
  onPress?: () => void;
  showBadge?: boolean;
};

type CalendarToolbarProps = {
  onNotificationsPress: () => void;
  onGoToToday: () => void;
  hasUnreadNotifications?: boolean;
};

export function CalendarToolbar({
  onNotificationsPress,
  onGoToToday,
  hasUnreadNotifications = false,
}: CalendarToolbarProps) {
  const actions: ToolbarAction[] = [
    { icon: "plus", label: "Registrar", href: "/(exterior)/log" },
    { icon: "bar-chart-2", label: "Historico", href: "/(exterior)/history" },
    {
      icon: "pie-chart",
      label: "Resumo mensal",
      href: "/(exterior)/insights",
    },
    { icon: "calendar", label: "Ir para hoje", onPress: onGoToToday },
    {
      icon: "bell",
      label: "Notificações",
      onPress: onNotificationsPress,
      showBadge: hasUnreadNotifications,
    },
    { icon: "settings", label: "Configuracoes", href: "/(exterior)/settings" },
  ];

  return (
    <View style={styles.toolbar}>
      {actions.map((action) => (
        <ToolbarButton key={action.label} action={action} />
      ))}
    </View>
  );
}

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

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  button: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -1,
    right: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DA1919",
  },
});
