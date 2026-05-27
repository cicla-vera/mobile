import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import {
  VaultHeader,
  VaultPanel,
  VaultScrollScreen,
} from "@/components/vera/vault-layout";
import { veraTheme } from "@/constants/vera-theme";
import { colors, radius, spacing } from "@/constants/theme";
import {
  useAlertSessionQuery,
  useAlertTimelineQuery,
  useDispatchEmergencyContactsMutation,
  useEmergencyContactsQuery,
} from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import type {
  AlertEvent,
  AlertSession,
  EmergencyContact,
  EmergencyDispatchResponse,
} from "@/types/vera.types";

type ContactDispatchState = "pending" | "sent" | "failed" | "not_configured";

type ContactStatusItem = {
  contact: EmergencyContact;
  detail: string;
  event: AlertEvent | null;
  status: ContactDispatchState;
};

const statusCopy: Record<
  ContactDispatchState,
  {
    label: string;
    icon: keyof typeof Feather.glyphMap;
    tone: string;
  }
> = {
  sent: {
    label: "Enviado",
    icon: "send",
    tone: colors.mint,
  },
  failed: {
    label: "Falhou",
    icon: "alert-triangle",
    tone: colors.danger,
  },
  pending: {
    label: "Pendente",
    icon: "clock",
    tone: colors.sky,
  },
  not_configured: {
    label: "Não configurado",
    icon: "slash",
    tone: colors.muted,
  },
};

export default function ContactDispatchStatusRoute() {
  const params = useLocalSearchParams<{
    alertSessionId?: string | string[];
  }>();
  const alertSessionId = normalizeParam(params.alertSessionId);
  const sessionQuery = useAlertSessionQuery(alertSessionId);
  const contactsQuery = useEmergencyContactsQuery(true);
  const timelineQuery = useAlertTimelineQuery(alertSessionId);
  const dispatchMutation = useDispatchEmergencyContactsMutation();
  const [feedback, setFeedback] = useState<string | null>(null);

  const session = sessionQuery.data ?? null;
  const contacts = contactsQuery.data ?? [];
  const orderedEvents = useMemo(
    () =>
      [...(timelineQuery.data?.events ?? [])].sort(
        (left, right) =>
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime(),
      ),
    [timelineQuery.data?.events],
  );
  const contactStatusItems = useMemo(
    () => buildContactStatusItems(contacts, orderedEvents, session),
    [contacts, orderedEvents, session],
  );
  const activeContacts = contacts.filter((contact) => contact.enabled);
  const generalFailures = useMemo(
    () => orderedEvents.filter(isGeneralContactFailure),
    [orderedEvents],
  );
  const summary = useMemo(
    () => summarizeContactStatuses(contactStatusItems),
    [contactStatusItems],
  );
  const isLoading =
    sessionQuery.isLoading || contactsQuery.isLoading || timelineQuery.isLoading;
  const isRefreshing =
    sessionQuery.isFetching ||
    contactsQuery.isFetching ||
    timelineQuery.isFetching;
  const queryError = !alertSessionId
    ? "Não deu para identificar a sessão de alerta."
    : sessionQuery.isError
      ? getApiErrorMessage(
          sessionQuery.error,
          "Não deu para carregar a sessão agora.",
        )
      : contactsQuery.isError
        ? getApiErrorMessage(
            contactsQuery.error,
            "Não deu para carregar os contatos agora.",
          )
        : timelineQuery.isError
          ? getApiErrorMessage(
              timelineQuery.error,
              "Não deu para carregar o status dos acionamentos.",
            )
          : null;
  const dispatchError = dispatchMutation.error
    ? getApiErrorMessage(
        dispatchMutation.error,
        "Não deu para acionar os contatos agora.",
      )
    : null;
  const canDispatch =
    Boolean(alertSessionId) &&
    session?.status === "ACTIVE" &&
    session.level === "CRITICAL" &&
    activeContacts.length > 0 &&
    !dispatchMutation.isPending;

  function refetchAll() {
    void sessionQuery.refetch();
    void contactsQuery.refetch();
    void timelineQuery.refetch();
  }

  function handleDispatchPress() {
    if (!canDispatch) {
      return;
    }

    Alert.alert(
      "Acionar contatos",
      "A Vera vai preparar o acionamento dos contatos ativos desta sessão.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: "Acionar",
          style: "destructive",
          onPress: () => {
            void dispatchContacts();
          },
        },
      ],
    );
  }

  async function dispatchContacts() {
    if (!alertSessionId) {
      return;
    }

    setFeedback(null);
    dispatchMutation.reset();

    try {
      const response = await dispatchMutation.mutateAsync(alertSessionId);
      setFeedback(formatDispatchFeedback(response));
      refetchAll();
    } catch {
      setFeedback(null);
    }
  }

  return (
    <VaultScrollScreen>
      <VaultHeader
        title="Status dos contatos"
        subtitle="Acompanhamento discreto dos acionamentos da sessão"
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atualizar status dos contatos"
            disabled={isRefreshing}
            onPress={refetchAll}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.pressed,
              isRefreshing && styles.disabledAction,
            ]}
          >
            {isRefreshing ? (
              <ActivityIndicator color={veraTheme.icon} />
            ) : (
              <Feather name="refresh-cw" size={18} color={veraTheme.icon} />
            )}
          </Pressable>
        }
      />

      {isLoading ? (
        <View style={styles.loadingPanel}>
          <ActivityIndicator color={colors.mint} size="large" />
          <AppText variant="caption" style={styles.mutedText}>
            Carregando contatos...
          </AppText>
        </View>
      ) : null}

      {queryError ? <Message text={queryError} /> : null}

      {session ? (
        <SessionSummary
          activeContactsCount={activeContacts.length}
          session={session}
          summary={summary}
        />
      ) : null}

      {generalFailures.length > 0 ? (
        <Message text={formatGeneralFailure(generalFailures[0])} />
      ) : null}

      {feedback ? <SuccessMessage text={feedback} /> : null}
      {dispatchError ? <Message text={dispatchError} /> : null}

      <VaultPanel>
        <View style={styles.dispatchHeader}>
          <View style={styles.dispatchHeaderCopy}>
            <AppText variant="label" style={styles.panelTitle}>
              Acionamento
            </AppText>
            <AppText variant="caption" style={styles.mutedText}>
              {getDispatchHint(session, activeContacts.length)}
            </AppText>
          </View>
        </View>

        <Button
          accessibilityRole="button"
          disabled={!canDispatch}
          loading={dispatchMutation.isPending}
          onPress={handleDispatchPress}
          style={styles.actionButton}
        >
          Acionar contatos
        </Button>
      </VaultPanel>

      {!isLoading && !queryError && contacts.length === 0 ? (
        <EmptyState
          title="Nenhum contato cadastrado"
          detail="Cadastre contatos de confianca antes de usar acionamentos criticos."
        />
      ) : null}

      {contacts.length > 0 ? (
        <View style={styles.list}>
          {contactStatusItems.map((item) => (
            <ContactStatusCard key={item.contact.id} item={item} />
          ))}
        </View>
      ) : null}
    </VaultScrollScreen>
  );
}

function SessionSummary({
  activeContactsCount,
  session,
  summary,
}: {
  activeContactsCount: number;
  session: AlertSession;
  summary: Record<ContactDispatchState, number>;
}) {
  return (
    <VaultPanel>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryIcon}>
          <Feather name="phone-call" size={19} color={colors.ink} />
        </View>
        <View style={styles.summaryCopy}>
          <AppText variant="label" style={styles.panelTitle}>
            Sessão {formatShortId(session.id)}
          </AppText>
          <AppText variant="caption" style={styles.mutedText}>
            {activeContactsCount} contato(s) ativo(s) para acionamento.
          </AppText>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <StatusTile label="Nivel" value={formatLevel(session.level)} />
        <StatusTile label="Enviados" value={String(summary.sent)} />
        <StatusTile label="Falhas" value={String(summary.failed)} />
        <StatusTile label="Pendentes" value={String(summary.pending)} />
      </View>
    </VaultPanel>
  );
}

function ContactStatusCard({ item }: { item: ContactStatusItem }) {
  const copy = statusCopy[item.status];

  return (
    <View style={styles.contactCard}>
      <View style={styles.contactTopRow}>
        <View style={[styles.statusIcon, { backgroundColor: copy.tone }]}>
          <Feather
            name={copy.icon}
            size={17}
            color={copy.tone === colors.mint ? colors.ink : colors.cream}
          />
        </View>

        <View style={styles.contactCopy}>
          <AppText variant="label" numberOfLines={1} style={styles.contactName}>
            {item.contact.name}
          </AppText>
          <AppText variant="caption" numberOfLines={1} style={styles.mutedText}>
            {item.contact.relationship || "Relação não informada"}
          </AppText>
        </View>

        <View style={styles.statusBadge}>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={styles.statusBadgeText}
          >
            {copy.label}
          </AppText>
        </View>
      </View>

      <AppText variant="caption" style={styles.detailText}>
        {item.detail}
      </AppText>

      <View style={styles.metaRow}>
        <MetaPill icon="phone" text={maskPhone(item.contact.phone)} />
        <MetaPill icon="flag" text={`Prioridade ${item.contact.priority}`} />
        {item.event ? (
          <MetaPill icon="clock" text={formatTime(item.event.createdAt)} />
        ) : null}
      </View>
    </View>
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusTile}>
      <AppText variant="caption" style={styles.statusTileLabel}>
        {label}
      </AppText>
      <AppText variant="label" tone="ink">
        {value}
      </AppText>
    </View>
  );
}

function MetaPill({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.metaPill}>
      <Feather name={icon} size={13} color={colors.plum} />
      <AppText variant="caption" style={styles.metaPillText}>
        {text}
      </AppText>
    </View>
  );
}

function Message({ text }: { text: string }) {
  return (
    <View style={styles.message}>
      <Feather name="alert-circle" size={17} color={colors.danger} />
      <AppText variant="caption" style={styles.messageText}>
        {text}
      </AppText>
    </View>
  );
}

function SuccessMessage({ text }: { text: string }) {
  return (
    <View style={styles.successMessage}>
      <Feather name="check" size={16} color={colors.ink} />
      <AppText variant="caption" style={styles.successText}>
        {text}
      </AppText>
    </View>
  );
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="user-plus" size={21} color={colors.cream} />
      </View>
      <AppText variant="label" style={styles.emptyTitle}>
        {title}
      </AppText>
      <AppText variant="caption" style={styles.emptyText}>
        {detail}
      </AppText>
    </View>
  );
}

function normalizeParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function buildContactStatusItems(
  contacts: EmergencyContact[],
  events: AlertEvent[],
  session: AlertSession | null,
): ContactStatusItem[] {
  const latestEventByContact = new Map<string, AlertEvent>();

  events.forEach((event) => {
    if (!isContactDispatchEvent(event)) {
      return;
    }

    const contactId = getMetadataString(event, "contactId");

    if (contactId) {
      latestEventByContact.set(contactId, event);
    }
  });

  return [...contacts]
    .sort((left, right) => {
      if (left.enabled !== right.enabled) {
        return left.enabled ? -1 : 1;
      }

      if (left.priority !== right.priority) {
        return left.priority - right.priority;
      }

      return left.createdAt.localeCompare(right.createdAt);
    })
    .map((contact) => {
      const event = latestEventByContact.get(contact.id) ?? null;

      if (!contact.enabled) {
        return {
          contact,
          event: null,
          status: "not_configured",
          detail: "Contato inativo e fora dos acionamentos desta sessão.",
        };
      }

      if (event?.type === "CONTACT_NOTIFIED") {
        return {
          contact,
          event,
          status: "sent",
          detail: "Mensagem preparada para envio ao contato.",
        };
      }

      if (event?.type === "CONTACT_NOTIFICATION_FAILED") {
        return {
          contact,
          event,
          status: "failed",
          detail: formatFailureReason(event),
        };
      }

      return {
        contact,
        event: null,
        status: "pending",
        detail:
          session?.level === "CRITICAL"
            ? "Aguardando acionamento ou atualização."
            : "Disponível se a sessão subir para nível crítico.",
      };
    });
}

function summarizeContactStatuses(items: ContactStatusItem[]) {
  return items.reduce<Record<ContactDispatchState, number>>(
    (summary, item) => ({
      ...summary,
      [item.status]: summary[item.status] + 1,
    }),
    {
      pending: 0,
      sent: 0,
      failed: 0,
      not_configured: 0,
    },
  );
}

function isContactDispatchEvent(event: AlertEvent) {
  return (
    event.type === "CONTACT_NOTIFIED" ||
    event.type === "CONTACT_NOTIFICATION_FAILED"
  );
}

function isGeneralContactFailure(event: AlertEvent) {
  return (
    event.type === "CONTACT_NOTIFICATION_FAILED" &&
    !getMetadataString(event, "contactId")
  );
}

function getMetadataString(event: AlertEvent, key: string) {
  const value = event.metadata?.[key];

  return typeof value === "string" ? value : null;
}

function formatFailureReason(event: AlertEvent) {
  const reason = getMetadataString(event, "reason");

  if (reason === "sms_provider_not_configured") {
    return "Envio indisponível neste ambiente. Tente novamente depois.";
  }

  if (reason === "no_active_contacts") {
    return "Nenhum contato ativo configurado.";
  }

  return "A tentativa não foi concluída. Tente atualizar ou acionar de novo.";
}

function formatGeneralFailure(event: AlertEvent) {
  return formatFailureReason(event);
}

function getDispatchHint(session: AlertSession | null, activeContactsCount: number) {
  if (!session) {
    return "Carregue uma sessão para acompanhar acionamentos.";
  }

  if (session.status !== "ACTIVE") {
    return "A sessão já foi encerrada; os status ficam apenas para consulta.";
  }

  if (activeContactsCount === 0) {
    return "Cadastre ou reative contatos antes de acionar.";
  }

  if (session.level !== "CRITICAL") {
    return "Disponível quando a sessão estiver em nível crítico.";
  }

  return "Aciona somente contatos ativos desta sessão.";
}

function formatDispatchFeedback(response: EmergencyDispatchResponse) {
  if (response.attempts.length === 0) {
    return "Nenhum contato ativo configurado para esta sessão.";
  }

  const sent = response.attempts.filter((attempt) => attempt.status === "sent")
    .length;
  const failed = response.attempts.length - sent;

  if (sent > 0 && failed === 0) {
    return "Contatos acionados com sucesso.";
  }

  if (sent > 0) {
    return "Alguns contatos foram acionados; verifique os itens com falha.";
  }

  return "Não foi possível concluir o acionamento; verifique as falhas.";
}

function maskPhone(phone: string) {
  const visibleDigits = 4;
  const digits = phone.replace(/\D/g, "");

  if (digits.length <= visibleDigits) {
    return "*".repeat(digits.length);
  }

  return `${"*".repeat(digits.length - visibleDigits)}${digits.slice(
    -visibleDigits,
  )}`;
}

function formatLevel(level: AlertSession["level"]) {
  return level === "CRITICAL" ? "Crítico" : "Normal";
}

function formatShortId(id: string) {
  return `#${id.slice(0, 6)}`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  loadingPanel: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.loadingBackground,
  },
  mutedText: {
    color: veraTheme.mutedText,
  },
  pressed: {
    opacity: 0.72,
  },
  disabledAction: {
    opacity: 0.48,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: veraTheme.backButtonBackground,
  },
  panelTitle: {
    textTransform: "uppercase",
  },
  summaryHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  summaryIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.mint,
  },
  summaryCopy: {
    flex: 1,
    gap: 2,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  statusTile: {
    minWidth: 104,
    minHeight: 56,
    justifyContent: "center",
    gap: 2,
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.summaryBackground,
  },
  statusTileLabel: {
    color: veraTheme.sectionSubtitle,
    textTransform: "uppercase",
  },
  dispatchHeader: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  dispatchHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  actionButton: {
    alignSelf: "stretch",
  },
  list: {
    gap: spacing[3],
  },
  contactCard: {
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: veraTheme.panelBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
  },
  contactTopRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  statusIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  contactCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  contactName: {
    color: veraTheme.sectionTitle,
    textTransform: "uppercase",
  },
  statusBadge: {
    minHeight: 26,
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    borderRadius: radius.pill,
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  statusBadgeText: {
    color: veraTheme.sectionTitle,
    fontWeight: "800",
  },
  detailText: {
    color: colors.ink,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  metaPill: {
    minHeight: 26,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radius.pill,
    backgroundColor: "rgba(32, 37, 123, 0.08)",
  },
  metaPillText: {
    color: colors.plum,
    fontWeight: "800",
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
  },
  messageText: {
    flex: 1,
    color: colors.danger,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
  },
  successText: {
    flex: 1,
    color: colors.ink,
    fontWeight: "800",
  },
  emptyState: {
    minHeight: 172,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: veraTheme.emptyBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.emptyBackground,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.plum,
  },
  emptyTitle: {
    color: veraTheme.sectionTitle,
  },
  emptyText: {
    maxWidth: 280,
    textAlign: "center",
    color: veraTheme.mutedText,
  },
});
