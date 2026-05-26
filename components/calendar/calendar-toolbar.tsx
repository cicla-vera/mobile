import { Feather } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, radius, spacing } from "@/constants/theme";

type ToolbarAction = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  href?: Href;
  onPress?: () => void;
};

type CalendarToolbarProps = {
  onGoToToday: () => void;
};

export function CalendarToolbar({ onGoToToday }: CalendarToolbarProps) {
  const router = useRouter();

  const actions: ToolbarAction[] = [
    { icon: "plus", label: "Registrar", href: "/(exterior)/log" },
    { icon: "bar-chart-2", label: "Historico", href: "/(exterior)/history" },
    {
      icon: "pie-chart",
      label: "Resumo mensal",
      href: "/(exterior)/insights",
    },
    { icon: "trending-up", label: "Graficos", href: "/(exterior)/charts" },
    { icon: "calendar", label: "Ir para hoje", onPress: onGoToToday },
  ];

  return (
    <View style={styles.toolbar}>
      {actions.map((action) => (
        <Pressable
          key={action.label}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          onPress={() => {
            if (action.onPress) {
              action.onPress();
              return;
            }

            if (action.href) {
              router.push(action.href);
            }
          }}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Feather name={action.icon} size={22} color={colors.ink} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  button: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    backgroundColor: colors.shell,
  },
  buttonPressed: {
    opacity: 0.72,
  },
});
