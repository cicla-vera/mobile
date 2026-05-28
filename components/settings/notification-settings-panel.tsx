import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { SettingToggleRow } from '@/components/settings/setting-toggle-row';
import { ReminderHourPicker } from '@/components/settings/reminder-hour-picker';
import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/constants/theme';
import {
  useNotificationSettingsQuery,
  useUpdateNotificationSettingsMutation,
} from '@/hooks/useNotificationSettings';
import { getApiErrorMessage } from '@/services/api-error';
import type { UpdateNotificationSettingsRequest } from '@/types/api.types';

export function NotificationSettingsPanel() {
  const settingsQuery = useNotificationSettingsQuery();
  const updateSettingsMutation = useUpdateNotificationSettingsMutation();
  const [feedback, setFeedback] = useState<string | null>(null);

  const settings = settingsQuery.data;
  const isSaving = updateSettingsMutation.isPending;
  const errorMessage = settingsQuery.isError
    ? getApiErrorMessage(
        settingsQuery.error,
        'Não deu para carregar as notificações.',
      )
    : updateSettingsMutation.isError
      ? getApiErrorMessage(
          updateSettingsMutation.error,
          'Não deu para salvar a preferência.',
        )
      : null;

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timeout = setTimeout(() => setFeedback(null), 2200);

    return () => clearTimeout(timeout);
  }, [feedback]);

  async function patchSettings(payload: UpdateNotificationSettingsRequest) {
    setFeedback(null);

    try {
      await updateSettingsMutation.mutateAsync(payload);
      setFeedback('Preferencia salva.');
    } catch {
      setFeedback(null);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionCopy}>
          <AppText variant="label">Lembretes</AppText>
          <AppText variant="caption" tone="muted">
            Escolha o que quer receber e em qual horario.
          </AppText>
        </View>
        {settingsQuery.isLoading || isSaving ? (
          <ActivityIndicator color={colors.blue} size="small" />
        ) : null}
      </View>

      {errorMessage ? (
        <View style={styles.notice}>
          <Feather name="alert-circle" size={22} color={colors.danger} />
          <AppText variant="caption" style={styles.noticeText}>
            {errorMessage}
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
        icon="droplet"
        title="Menstruação"
        description="Aviso quando a próxima menstruação estiver chegando."
        value={settings?.periodReminder ?? true}
        disabled={!settings || isSaving}
        onValueChange={(periodReminder) => void patchSettings({ periodReminder })}
      />
      <SettingToggleRow
        icon="sun"
        title="Ovulação"
        description="Lembrete na janela fértil prevista."
        value={settings?.ovulationReminder ?? true}
        disabled={!settings || isSaving}
        onValueChange={(ovulationReminder) =>
          void patchSettings({ ovulationReminder })
        }
      />
      <SettingToggleRow
        icon="plus-circle"
        title="Medicamentos"
        description="Alerta diário para registrar ou tomar remédios."
        value={settings?.medicationReminder ?? false}
        disabled={!settings || isSaving}
        onValueChange={(medicationReminder) =>
          void patchSettings({ medicationReminder })
        }
      />
      <SettingToggleRow
        icon="droplet"
        title="Água"
        description="Pequeno empurrão para manter a hidratação."
        value={settings?.waterReminder ?? false}
        disabled={!settings || isSaving}
        onValueChange={(waterReminder) => void patchSettings({ waterReminder })}
      />

      <ReminderHourPicker
        value={settings?.reminderHour}
        disabled={!settings || isSaving}
        onChange={(reminderHour) => void patchSettings({ reminderHour })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  sectionCopy: {
    flex: 1,
    gap: spacing[1],
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  noticeText: {
    flex: 1,
    color: colors.danger,
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
});
