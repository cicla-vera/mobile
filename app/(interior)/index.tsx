import { router } from 'expo-router';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { VeraDemoBanner } from '@/components/demo/vera-demo-banner';
import { VaultActionRow, VaultHomeHeader } from '@/components/vera/vault-layout';
import {
  VaultActiveAlertSection,
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
  useSafetyLocationsQuery,
  useVaultEvidenceRecordsQuery,
} from '@/hooks/vera';
import { clearStoredVeraBiometricSession } from '@/services/vera';
import { useVeraStore } from '@/stores/vera.store';

export default function InteriorIndexRoute() {
  const lockVeraSession = useVeraStore((state) => state.lockVeraSession);
  const contactsQuery = useEmergencyContactsQuery();
  const locationsQuery = useSafetyLocationsQuery();
  const activeAlertQuery = useActiveAlertSessionQuery();
  const activeAlertId = activeAlertQuery.data?.id ?? null;
  const evidenceQuery = useVaultEvidenceRecordsQuery(activeAlertId);
  const audioRecords = (evidenceQuery.data ?? []).filter(
    (record) => record.type === 'AUDIO',
  );

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
        nestedScrollEnabled={Platform.OS === 'android'}
        showsVerticalScrollIndicator={false}
      >
        <VaultHomeHeader
          onLock={handleLock}
          onSettings={() => router.push('/(interior)/settings')}
        />

        <VeraDemoBanner />

        <VaultActiveAlertSection />

        <View style={styles.section}>
          <VaultSectionHeader
            title="Contatos de emergência"
            subtitle="Quem pode receber alertas caso algo ocorra com você"
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
            subtitle="Locais onde o monitoramento será ativado automaticamente"
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
            records={audioRecords}
            loading={evidenceQuery.isLoading}
          />
        </View>

        <View style={styles.section}>
          <VaultSectionHeader
            title="Precisa de mais ajuda?"
            subtitle="Sugestões de ONGs para entrar em contato"
          />
          <VaultHelpResourcesRow />
        </View>

        <View style={styles.section}>
          <VaultSectionHeader
            title="Central de alertas"
            subtitle="Acionamento manual e acompanhamento de sessões ativas"
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
});
