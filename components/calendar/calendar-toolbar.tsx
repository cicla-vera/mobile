import { Feather } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { colors } from "@/constants/theme";

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
          style={styles.button}
        >
          <Feather name={action.icon} size={16} color={colors.ink} />
        </Pressable>
      ))}
    </View>
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
});
