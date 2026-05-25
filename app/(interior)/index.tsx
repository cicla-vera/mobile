import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors, radius, spacing } from '@/constants/theme';
import {
  useActiveAlertSessionQuery,
  useActiveSafetyLocationsQuery,
  useEmergencyContactsQuery,
  useVeraProfileQuery,
} from '@/hooks/vera';
import { clearStoredVeraBiometricSession } from '@/services/vera';
import { useVeraStore } from '@/stores/vera.store';

type HubItem = {
  title: string;
  detail: string;
  icon: keyof typeof Feather.glyphMap;
  href: Href;
  tone: string;
};

export default function InteriorIndexRoute() {
  const lockVeraSession = useVeraStore((state) => state.lockVeraSession);
  const sessionExpiresAt = useVeraStore((state) => state.sessionExpiresAt);
  const profileQuery = useVeraProfileQuery();
  const contactsQuery = useEmergencyContactsQuery();
  const locationsQuery = useActiveSafetyLocationsQuery();
  const activeAlertQuery = useActiveAlertSessionQuery();

  const profile = profileQuery.data;
  const contactsCount = contactsQuery.data?.filter((item) => item.enabled).length;
  const locationsCount = locationsQuery.data?.length;
  const activeAlert = activeAlertQuery.data;
  const readiness = getReadinessScore({
    consentAccepted: Boolean(profile?.consentAccepted),
    pinConfigured: Boolean(profile?.pinConfigured),
    hasContacts: Boolean(contactsCount),
    hasLocations: Boolean(locationsCount),
  });

  const hubItems: HubItem[] = [
    {
      title: 'Contatos',
      detail: formatQueryCount(
        contactsQuery.isLoading,
        contactsQuery.isError,
        contactsCount,
        'contato ativo',
        'contatos ativos',
      ),
      icon: 'phone-call',
      href: '/(interior)/contacts',
      tone: colors.coral,
    },
    {
      title: 'Locais',
      detail: formatQueryCount(
        locationsQuery.isLoading,
        locationsQuery.isError,
        locationsCount,
        'local monitorado',
        'locais monitorados',
      ),
      icon: 'map-pin',
      href: '/(interior)/locations',
      tone: colors.sky,
    },
    {
      title: 'Alertas',
      detail: activeAlert
        ? `Sessao ${activeAlert.level.toLowerCase()} em andamento`
        : 'Sem alerta ativo',
      icon: activeAlert ? 'radio' : 'shield',
      href: '/(interior)/alerts',
      tone: activeAlert ? colors.danger : colors.mint,
    },
    {
      title: 'Evidencias',
      detail: activeAlert ? 'Cofre ligado a sessao ativa' : 'Cofre Vera',
      icon: 'archive',
      href: '/(interior)/evidence',
      tone: colors.plum,
    },
    {
      title: 'Seguranca',
      detail: profile?.pinConfigured ? 'PIN Vera configurado' : 'PIN pendente',
      icon: 'settings',
      href: '/(interior)/settings',
      tone: colors.blue,
    },
  ];

  async function handleLock() {
    lockVeraSession();
    await clearStoredVeraBiometricSession();
    router.replace('/(exterior)');
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <AppText variant="label" tone="pink" style={styles.eyebrow}>
              Vera
            </AppText>
            <AppText variant="title" tone="cream" style={styles.title}>
              Area protegida
            </AppText>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bloquear Vera"
            onPress={handleLock}
            style={({ pressed }) => [
              styles.lockButton,
              pressed && styles.pressed,
            ]}
          >
            <Feather name="lock" size={18} color={colors.cream} />
          </Pressable>
        </View>

        <View style={styles.statusBand}>
          <View style={styles.statusHeader}>
            <View style={styles.statusMark}>
              <Feather name="activity" size={18} color={colors.ink} />
            </View>
            <View style={styles.statusCopy}>
              <AppText variant="label" tone="cream">
                {profile?.veraEnabled ? 'Vera ativa' : 'Vera pausada'}
              </AppText>
              <AppText variant="caption" style={styles.statusText}>
                {formatSession(sessionExpiresAt)}
              </AppText>
            </View>
          </View>

          <View style={styles.statusGrid}>
            <StatusPill
              label="Consentimento"
              ok={Boolean(profile?.consentAccepted)}
            />
            <StatusPill label="PIN" ok={Boolean(profile?.pinConfigured)} />
            <StatusPill
              label="Contatos"
              ok={contactsQuery.isLoading ? null : Boolean(contactsCount)}
            />
            <StatusPill
              label="Locais"
              ok={locationsQuery.isLoading ? null : Boolean(locationsCount)}
            />
          </View>

          <View style={styles.readinessLine}>
            <AppText variant="caption" style={styles.statusText}>
              {readiness.done === readiness.total
                ? 'Perfil Vera configurado'
                : `${readiness.total - readiness.done} etapa(s) pendente(s)`}
            </AppText>
            {profileQuery.isLoading ? (
              <ActivityIndicator color={colors.cream} size="small" />
            ) : null}
          </View>
        </View>

        <View style={styles.grid}>
          {hubItems.map((item) => (
            <HubCard key={item.title} item={item} />
          ))}
        </View>

        <View style={styles.footerPanel}>
          <Feather name="bell" size={17} color={colors.mint} />
          <AppText variant="caption" style={styles.footerText}>
            {profile?.discreetNotificationsEnabled
              ? 'Notificacoes discretas ativas'
              : 'Notificacoes discretas pausadas'}
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

function HubCard({ item }: { item: HubItem }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push(item.href)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.cardIcon, { backgroundColor: item.tone }]}>
        <Feather name={item.icon} size={19} color={colors.cream} />
      </View>
      <View style={styles.cardCopy}>
        <AppText variant="label" tone="cream">
          {item.title}
        </AppText>
        <AppText variant="caption" style={styles.cardDetail}>
          {item.detail}
        </AppText>
      </View>
      <Feather name="chevron-right" size={18} color="rgba(255,245,236,0.62)" />
    </Pressable>
  );
}

function StatusPill({
  label,
  ok,
}: {
  label: string;
  ok: boolean | null;
}) {
  return (
    <View style={[styles.pill, ok && styles.pillOk, ok === false && styles.pillTodo]}>
      {ok === null ? (
        <ActivityIndicator color={colors.cream} size="small" />
      ) : (
        <Feather
          name={ok ? 'check' : 'minus'}
          size={14}
          color={ok ? colors.ink : colors.cream}
        />
      )}
      <AppText variant="caption" style={[styles.pillText, ok && styles.pillTextOk]}>
        {label}
      </AppText>
    </View>
  );
}

function getReadinessScore(state: {
  consentAccepted: boolean;
  pinConfigured: boolean;
  hasContacts: boolean;
  hasLocations: boolean;
}) {
  const values = Object.values(state);

  return {
    done: values.filter(Boolean).length,
    total: values.length,
  };
}

function formatQueryCount(
  loading: boolean,
  error: boolean,
  count: number | undefined,
  singular: string,
  plural: string,
) {
  if (loading) {
    return 'Carregando';
  }

  if (error || count === undefined) {
    return 'Nao disponivel';
  }

  if (count === 1) {
    return `1 ${singular}`;
  }

  return `${count} ${plural}`;
}

function formatSession(expiresAt: string | null) {
  if (!expiresAt) {
    return 'Sessao privada';
  }

  const minutes = Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000),
  );

  if (minutes <= 1) {
    return 'Sessao expira em instantes';
  }

  return `Sessao expira em ${minutes} min`;
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[7],
    paddingBottom: spacing[10],
  },
  header: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[4],
  },
  eyebrow: {
    marginBottom: spacing[1],
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: 260,
  },
  lockButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.16)',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 245, 236, 0.08)',
  },
  pressed: {
    opacity: 0.72,
  },
  statusBand: {
    gap: spacing[5],
    marginTop: spacing[7],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.12)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.08)',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  statusMark: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.mint,
  },
  statusCopy: {
    flex: 1,
  },
  statusText: {
    color: 'rgba(255, 245, 236, 0.72)',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  pill: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 245, 236, 0.1)',
  },
  pillOk: {
    backgroundColor: colors.mint,
  },
  pillTodo: {
    backgroundColor: 'rgba(242, 97, 126, 0.2)',
  },
  pillText: {
    color: colors.cream,
    fontWeight: '800',
  },
  pillTextOk: {
    color: colors.ink,
  },
  readinessLine: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  grid: {
    gap: spacing[3],
    marginTop: spacing[6],
  },
  card: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.1)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.07)',
  },
  cardIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  cardCopy: {
    flex: 1,
    gap: 3,
  },
  cardDetail: {
    color: 'rgba(255, 245, 236, 0.66)',
  },
  footerPanel: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[6],
    paddingHorizontal: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(142, 207, 184, 0.2)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(142, 207, 184, 0.08)',
  },
  footerText: {
    flex: 1,
    color: 'rgba(255, 245, 236, 0.74)',
  },
});
