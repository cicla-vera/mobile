import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { colors, radius, spacing } from '@/constants/theme';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useCyclePredictionQuery } from '@/hooks/useCycles';
import {
  isLocalNotificationsSupported,
  syncLocalNotificationsFromPrediction,
} from '@/services/local-notifications.service';

export default function SettingsRoute() {
  const predictionQuery = useCyclePredictionQuery();
  const { enabled, isReady, permissionDenied, toggleNotifications } =
    useNotificationPreferences();
  const [isUpdating, setIsUpdating] = useState(false);

  const notificationsSupported = isLocalNotificationsSupported();

  async function handleToggle(nextValue: boolean) {
    setIsUpdating(true);

    try {
      const result = await toggleNotifications(nextValue, predictionQuery.data);

      if (!result.ok) {
        Alert.alert(
          'Permissão necessária',
          'Ative as notificações nas configurações do celular para receber lembretes do Cicla.',
        );
      }
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <AppText style={styles.eyebrow}>Configurações</AppText>
        <AppText style={styles.title}>Ajuste o Cicla ao seu ritmo.</AppText>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.copy}>
              <AppText style={styles.cardTitle}>Lembretes locais</AppText>
              <AppText tone="muted" style={styles.cardBody}>
                Receba avisos sobre registro diário, janela fértil e próxima
                menstruação no seu celular.
              </AppText>
              {!notificationsSupported ? (
                <AppText variant="caption" style={styles.hint}>
                  Disponível apenas no app iOS ou Android (não na web).
                </AppText>
              ) : null}
              {permissionDenied ? (
                <AppText variant="caption" style={styles.warning}>
                  Permissão negada. Ative nas configurações do sistema.
                </AppText>
              ) : null}
            </View>

            {!isReady || isUpdating ? (
              <ActivityIndicator color={colors.blue} />
            ) : (
              <Switch
                value={enabled}
                onValueChange={handleToggle}
                disabled={!notificationsSupported}
                trackColor={{ false: colors.shell, true: colors.pink }}
                thumbColor={colors.white}
              />
            )}
          </View>
        </View>

        <Pressable
          onPress={async () => {
            const result = await predictionQuery.refetch();
            await syncLocalNotificationsFromPrediction(result.data);
          }}
          style={({ pressed }) => [styles.refresh, pressed && styles.refreshPressed]}
        >
          <AppText tone="blue" style={styles.refreshLabel}>
            Reagendar lembretes com a previsão atual
          </AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing[7],
    paddingTop: spacing[8],
  },
  eyebrow: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    color: colors.blue,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: spacing[8],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
  },
  copy: {
    flex: 1,
    gap: spacing[2],
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: colors.ink,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  hint: {
    color: colors.soft,
    marginTop: spacing[1],
  },
  warning: {
    color: colors.danger,
    marginTop: spacing[1],
  },
  refresh: {
    marginTop: spacing[6],
    alignSelf: 'flex-start',
    paddingVertical: spacing[2],
  },
  refreshPressed: {
    opacity: 0.7,
  },
  refreshLabel: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
