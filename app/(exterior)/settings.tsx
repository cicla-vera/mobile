import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { NotificationSettingsPanel } from '@/components/settings';
import { AppText, ListActionRow, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useNotificationSettingsQuery } from '@/hooks/useNotificationSettings';

export default function SettingsRoute() {
  const router = useRouter();
  const settingsQuery = useNotificationSettingsQuery();

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: spacing[5],
            paddingBottom: spacing[8] + spacing[6],
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={settingsQuery.isRefetching}
            onRefresh={() => void settingsQuery.refetch()}
            tintColor={colors.blue}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para o calendario"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={24} color={colors.ink} />
          </Pressable>
          <AppText variant="caption" tone="muted" style={styles.eyebrow}>
            Configuracoes
          </AppText>
        </View>

        <View style={styles.hero}>
          <AppText variant="heading">Ajuste o Cicla ao seu ritmo</AppText>
          <AppText tone="muted" style={styles.heroText}>
            Defina lembretes e escolha quando quer ser avisada sobre ciclo,
            ovulacao e habitos do dia.
          </AppText>
        </View>

        <NotificationSettingsPanel />

        <View style={styles.linksCard}>
          <AppText variant="label">Conta</AppText>
          <ListActionRow
            title="Editar perfil"
            description="Nome, telefone e dados pessoais."
            icon="user"
            onPress={() => router.push('/(exterior)/profile')}
            style={styles.linkRow}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingHorizontal: spacing[5],
    gap: spacing[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  hero: {
    gap: spacing[3],
  },
  heroText: {
    lineHeight: 23,
  },
  linksCard: {
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.md,
    backgroundColor: colors.white,
    gap: spacing[4],
  },
  linkRow: {
    marginTop: spacing[1],
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: spacing[3],
    backgroundColor: 'transparent',
  },
});
