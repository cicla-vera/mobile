import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewProps } from "react-native";

import { AppText } from "@/components/ui/app-text";
import { colors, spacing } from "@/constants/theme";

type CyclePeriodCardProps = ViewProps & {
  title: string;
};

export function CyclePeriodCard({
  title,
  style,
  ...props
}: CyclePeriodCardProps) {
  return (
    <View {...props} style={[styles.shadowWrap, style]}>
      <LinearGradient
        colors={["rgba(242, 97, 126, 0.25)", "rgba(242, 97, 126, 0.83)"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.card}
      >
        <AppText style={styles.title}>{title}</AppText>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    marginTop: spacing[5],
    marginHorizontal: spacing[6],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  card: {
    minHeight: 72,
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingVertical: 18,
  },
  title: {
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "400",
    color: "rgba(0, 0, 0, 0.86)",
  },
});
