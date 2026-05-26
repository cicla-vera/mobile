import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ActiveAlertIndicator } from '@/components/vera/active-alert-indicator';
import { VaultActionRow, VaultHomeHeader } from '@/components/vera/vault-layout';
import {
  VaultContactsRow,
  VaultHelpResourcesRow,
  VaultLocationsRow,
  VaultRecordingsRow,
  VaultSectionHeader,
} from '@/components/vera/vault-home-sections';
import { veraTheme } from '@/constants/vera-theme';
import { spacing } from '@/constants/theme';
import {
  useActiveAlertSessionQuery,
  useEmergencyContactsQuery,
  useEvidenceRecordsQuery,
  useSafetyLocationsQuery,
} from '@/hooks/vera';
import { clearStoredVeraBiometricSession } from '@/services/vera';
import { useVeraStore } from '@/stores/vera.store';

export default function InteriorIndexRoute() {
  const lockVeraSession = useVeraStore((state) => state.lockVeraSession);
  const contactsQuery = useEmergencyContactsQuery();
  const locationsQuery = useSafetyLocationsQuery();
  const activeAlertQuery = useActiveAlertSessionQuery();
  const activeAlertId = activeAlertQuery.data?.id ?? '';
  const evidenceQuery = useEvidenceRecordsQuery(activeAlertId);

  async function handleLock() {
    lockVeraSession();
    await clearStoredVeraBiometricSession();
    router.replace('/(exterior)');
  }

  return (
    <Screen padded={false} style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <VaultHomeHeader
          onLock={handleLock}
          onSettings={() => router.push('/(interior)/settings')}
        />

        <ActiveAlertIndicator
          variant="interior"
          style={styles.headerStatus}
        />

        <View style={styles.section}>
          <VaultSectionHeader
            title="Contatos de emergencia"
            subtitle="Quem pode receber alertas caso algo ocorra com voce"
          />
          <VaultContactsRow
            contacts={contactsQuery.data ?? []}
            loading={contactsQuery.isLoading}
            onAddPress={() => router.push('/(interior)/contacts')}
          />
        </View>

        <View style={styles.section}>
          <VaultSectionHeader
            title="Localizacoes"
            subtitle="Locais onde o monitoramento sera ativado automaticamente"
          />
          <VaultLocationsRow
            locations={locationsQuery.data ?? []}
            loading={locationsQuery.isLoading}
            onAddPress={() => router.push('/(interior)/locations')}
          />
        </View>

        <View style={styles.section}>
          <VaultSectionHeader
            title="Gravacoes"
            subtitle="Provas criptografadas, autenticadas e validas."
          />
          <VaultRecordingsRow
            records={evidenceQuery.data ?? []}
            loading={
              activeAlertQuery.isLoading ||
              (Boolean(activeAlertId) && evidenceQuery.isLoading)
            }
          />
        </View>

        <View style={styles.section}>
          <VaultSectionHeader
            title="Precisa de mais ajuda?"
            subtitle="Sugestoes de ONGs para entrar em contato"
          />
          <VaultHelpResourcesRow />
        </View>

        <View style={styles.section}>
          <VaultSectionHeader
            title="Central de alertas"
            subtitle="Acionamento manual e acompanhamento de sessoes ativas"
          />
          <VaultActionRow
            icon="shield"
            onPress={() => router.push('/(interior)/alerts')}
            title="Central de alertas Vera"
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: veraTheme.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: veraTheme.background,
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing[2],
    paddingBottom: spacing[10],
    gap: spacing[7],
  },
  section: {
    gap: spacing[1],
  },
  headerStatus: {
    marginHorizontal: spacing[6],
  },
});
