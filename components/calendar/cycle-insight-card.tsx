import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewProps } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { colors, spacing } from "@/constants/theme";

type CycleInsightCardProps = ViewProps & {
  title: string;
  description: string;
};

export function CycleInsightCard({
  title,
  description,
  style,
  ...props
}: CycleInsightCardProps) {
  return (
    <View {...props} style={[styles.shadowWrap, style]}>
      <LinearGradient
        colors={["rgba(32, 158, 208, 0.62)", colors.sky]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.card}
      >
        <AppText style={styles.title}>{title}</AppText>
        <AppText style={styles.description}>{description}</AppText>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    marginTop: spacing[4],
    marginHorizontal: spacing[6],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    minHeight: 102,
    paddingHorizontal: 30,
    paddingVertical: 18,
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "400",
    color: "rgba(0, 0, 0, 0.86)",
  },
  description: {
    fontSize: 12,
    lineHeight: 14,
    marginTop: spacing[2],
    color: colors.ink,
  },
});
