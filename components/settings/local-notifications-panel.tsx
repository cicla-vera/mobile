import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { SettingToggleRow } from "@/components/settings/setting-toggle-row";
import { AppText } from "@/components/ui/app-text";
import { colors, radius, spacing } from "@/constants/theme";
import { useCyclePredictionQuery } from "@/hooks/useCycles";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useNotificationSettingsQuery } from "@/hooks/useNotificationSettings";
import {
  isLocalNotificationsSupported,
  syncLocalNotificationsFromPrediction,
} from "@/services/local-notifications.service";
import { getExpoNotificationsUnsupportedReason } from "@/services/expo-notifications-runtime";

export function LocalNotificationsPanel() {
  const predictionQuery = useCyclePredictionQuery();
  const settingsQuery = useNotificationSettingsQuery();
  const { enabled, isReady, permissionDenied, toggleNotifications } =
    useNotificationPreferences();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const notificationsSupported = isLocalNotificationsSupported();
  const unsupportedReason = getExpoNotificationsUnsupportedReason();
  const isBusy = !isReady || isUpdating;

  async function handleToggle(nextValue: boolean) {
    setIsUpdating(true);
    setFeedback(null);

    try {
      const result = await toggleNotifications(
        nextValue,
        predictionQuery.data,
        settingsQuery.data,
      );

      if (!result.ok) {
        Alert.alert(
          "Permissao necessaria",
          "Ative as notificacoes nas configuracoes do celular para receber lembretes do Cicla.",
        );
        return;
      }

      setFeedback(
        nextValue ? "Lembretes locais ativados." : "Lembretes pausados.",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleReschedule() {
    setIsUpdating(true);
    setFeedback(null);

    try {
      const [predictionResult, settingsResult] = await Promise.all([
        predictionQuery.refetch(),
        settingsQuery.refetch(),
      ]);

      const result = await syncLocalNotificationsFromPrediction(
        predictionResult.data,
        settingsResult.data ?? settingsQuery.data,
      );

      if (!result.scheduled && result.reason === "permission_denied") {
        Alert.alert(
          "Permissao necessaria",
          "Ative as notificacoes nas configuracoes do celular para receber lembretes do Cicla.",
        );
        return;
      }

      if (!result.scheduled && result.reason === "disabled") {
        setFeedback("Ative os lembretes locais para reagendar.");
        return;
      }

      setFeedback("Lembretes locais atualizados.");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <AppText variant="label">No aparelho</AppText>
          <AppText variant="caption" tone="muted">
            Autorize o celular a entregar os lembretes configurados acima.
          </AppText>
        </View>
        {isBusy ? <ActivityIndicator color={colors.blue} size="small" /> : null}
      </View>

      {!notificationsSupported ? (
        <View style={styles.notice}>
          <Feather name="smartphone" size={22} color={colors.muted} />
          <AppText variant="caption" tone="muted" style={styles.noticeText}>
            {unsupportedReason === "expo_go_android"
              ? "Notificacoes exigem um development build no Android. O Expo Go nao oferece esse recurso."
              : "Disponivel apenas no app iOS ou Android."}
          </AppText>
        </View>
      ) : null}

      {permissionDenied ? (
        <View style={styles.warning}>
          <Feather name="alert-circle" size={22} color={colors.danger} />
          <AppText variant="caption" style={styles.warningText}>
            Permissao negada. Ative nas configuracoes do sistema.
          </AppText>
        </View>
      ) : null}

      {feedback ? (
        <View style={styles.feedback}>
          <Feather name="check-circle" size={22} color={colors.blue} />
          <AppText variant="caption" tone="blue">
            {feedback}
          </AppText>
        </View>
      ) : null}

      <SettingToggleRow
        icon="bell"
        title="Lembretes locais"
        description="Agenda avisos de menstruacao, janela fertil e rotina diaria no celular."
        value={enabled}
        disabled={isBusy || !notificationsSupported}
        onValueChange={(nextValue) => void handleToggle(nextValue)}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityState={{
          disabled: isBusy || !enabled || !notificationsSupported,
        }}
        disabled={isBusy || !enabled || !notificationsSupported}
        onPress={() => void handleReschedule()}
        style={({ pressed }) => [
          styles.rescheduleButton,
          pressed && styles.rescheduleButtonPressed,
          (isBusy || !enabled || !notificationsSupported) &&
            styles.rescheduleButtonDisabled,
        ]}
      >
        <Feather name="refresh-cw" size={22} color={colors.blue} />
        <AppText variant="caption" tone="blue" style={styles.rescheduleLabel}>
          Reagendar com a previsao atual
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(20, 16, 17, 0.08)",
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  sectionCopy: {
    flex: 1,
    gap: spacing[1],
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[3],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.shell,
  },
  noticeText: {
    flex: 1,
  },
  warning: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[3],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(180, 35, 66, 0.08)",
  },
  warningText: {
    flex: 1,
    color: colors.danger,
  },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  rescheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing[2],
    marginTop: spacing[4],
    minHeight: 48,
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.shell,
  },
  rescheduleButtonPressed: {
    opacity: 0.78,
  },
  rescheduleButtonDisabled: {
    opacity: 0.45,
  },
  rescheduleLabel: {
    fontWeight: "800",
  },
});
