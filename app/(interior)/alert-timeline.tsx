import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/app-text";
import {
  VaultHeader,
  VaultPanel,
  VaultScrollScreen,
} from "@/components/vera/vault-layout";
import { veraTheme } from "@/constants/vera-theme";
import { colors, radius, spacing } from "@/constants/theme";
import { useAlertTimelineQuery } from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import type {
  AlertEvent,
  AlertEventType,
  AlertLevel,
  AlertStatus,
  VeraMetadataValue,
} from "@/types/vera.types";

type TimelineGroup = {
  label: string;
  events: AlertEvent[];
};

const eventCopy: Record<
  AlertEventType,
  {
    title: string;
    detail: string;
    icon: keyof typeof Feather.glyphMap;
    tone: string;
  }
> = {
  SESSION_STARTED: {
    title: "Sessão iniciada",
    detail: "Registro inicial criado pela Vera.",
    icon: "play-circle",
    tone: colors.mint,
  },
  LOCATION_ENTERED: {
    title: "Entrada em local",
    detail: "A localização monitorada registrou entrada.",
    icon: "map-pin",
    tone: colors.sky,
  },
  EVIDENCE_UPLOADED: {
    title: "Evidência enviada",
    detail: "Um item foi anexado ao cofre da sessão.",
    icon: "archive",
    tone: colors.plum,
  },
  AI_ANALYSIS_COMPLETED: {
    title: "Análise IA concluída",
    detail: "O resultado assistido foi registrado.",
    icon: "cpu",
    tone: colors.blue,
  },
  ALERT_ESCALATED: {
    title: "Nivel atualizado",
    detail: "A sessão recebeu uma mudança de nível.",
    icon: "trending-up",
    tone: colors.coral,
  },
  CONTACT_NOTIFIED: {
    title: "Contato acionado",
    detail: "Um contato de emergência recebeu o acionamento.",
    icon: "phone-call",
    tone: colors.mint,
  },
  CONTACT_NOTIFICATION_FAILED: {
    title: "Falha no contato",
    detail: "Uma tentativa de acionamento não foi concluída.",
    icon: "phone-off",
    tone: colors.danger,
  },
  SESSION_CLOSED: {
    title: "Sessão encerrada",
    detail: "O alerta foi fechado no app.",
    icon: "check-circle",
    tone: colors.muted,
  },
};

export default function AlertTimelineRoute() {
  const params = useLocalSearchParams<{
    alertSessionId?: string | string[];
  }>();
  const alertSessionId = normalizeParam(params.alertSessionId);
  const timelineQuery = useAlertTimelineQuery(alertSessionId);
  const timeline = timelineQuery.data ?? null;
  const orderedEvents = useMemo(
    () =>
      [...(timeline?.events ?? [])].sort(
        (left, right) =>
          new Date(left.createdAt).getTime() -
          new Date(right.createdAt).getTime(),
      ),
    [timeline?.events],
  );
  const groups = useMemo(
    () => groupEventsByDate(orderedEvents),
    [orderedEvents],
  );
  const errorMessage = !alertSessionId
    ? "Não deu para identificar a sessão de alerta."
    : timelineQuery.isError
      ? getApiErrorMessage(
          timelineQuery.error,
          "Não deu para carregar a timeline agora.",
        )
      : null;

  return (
    <VaultScrollScreen>
      <VaultHeader
        title="Timeline"
        subtitle="Eventos registrados durante a sessão de alerta"
        rightAction={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Atualizar timeline"
            disabled={timelineQuery.isRefetching}
            onPress={() => void timelineQuery.refetch()}
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.pressed,
              timelineQuery.isRefetching && styles.disabledAction,
            ]}
          >
            {timelineQuery.isRefetching ? (
              <ActivityIndicator color={veraTheme.icon} />
            ) : (
              <Feather name="refresh-cw" size={22} color={veraTheme.icon} />
            )}
          </Pressable>
        }
      />

      {timelineQuery.isLoading ? (
        <View style={styles.loadingPanel}>
          <ActivityIndicator color={colors.mint} size="large" />
          <AppText variant="caption" style={styles.mutedText}>
            Carregando eventos...
          </AppText>
        </View>
      ) : null}

      {errorMessage ? <Message text={errorMessage} /> : null}

      {timeline ? (
        <>
          <TimelineSummary
            alertSessionId={timeline.alertSessionId}
            eventCount={orderedEvents.length}
            level={timeline.level}
            status={timeline.status}
          />

          {orderedEvents.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={styles.timeline}>
              {groups.map((group) => (
                <View key={group.label} style={styles.group}>
                  <AppText variant="caption" style={styles.groupLabel}>
                    {group.label}
                  </AppText>

                  <View style={styles.groupEvents}>
                    {group.events.map((event, index) => (
                      <TimelineEventCard
                        key={event.id}
                        event={event}
                        first={index === 0}
                        last={index === group.events.length - 1}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      ) : null}
    </VaultScrollScreen>
  );
}

function TimelineSummary({
  alertSessionId,
  eventCount,
  level,
  status,
}: {
  alertSessionId: string;
  eventCount: number;
  level: AlertLevel;
  status: AlertStatus;
}) {
  return (
    <VaultPanel>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryIcon}>
          <Feather name="activity" size={24} color={colors.ink} />
        </View>
        <View style={styles.summaryCopy}>
          <AppText variant="label" style={styles.panelTitle}>
            Sessão {formatShortId(alertSessionId)}
          </AppText>
          <AppText variant="caption" style={styles.mutedText}>
            {eventCount} evento(s) em ordem cronologica.
          </AppText>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <StatusTile label="Status" value={formatStatus(status)} />
        <StatusTile label="Nivel" value={formatLevel(level)} />
      </View>
    </VaultPanel>
  );
}

function TimelineEventCard({
  event,
  first,
  last,
}: {
  event: AlertEvent;
  first: boolean;
  last: boolean;
}) {
  const copy = eventCopy[event.type];
  const metadataEntries = getMetadataEntries(event);

  return (
    <View style={styles.eventRow}>
      <View style={styles.eventRail}>
        <View style={[styles.railLine, first && styles.railLineHidden]} />
        <View style={[styles.eventDot, { backgroundColor: copy.tone }]}>
          <Feather
            name={copy.icon}
            size={22}
            color={copy.tone === colors.mint ? colors.ink : colors.cream}
          />
        </View>
        <View style={[styles.railLine, last && styles.railLineHidden]} />
      </View>

      <View style={styles.eventCard}>
        <View style={styles.eventHeader}>
          <View style={styles.eventTitleWrap}>
            <AppText variant="label" style={styles.eventTitle}>
              {copy.title}
            </AppText>
            <AppText variant="caption" style={styles.mutedText}>
              {formatTime(event.createdAt)}
            </AppText>
          </View>
          <View style={styles.eventBadge}>
            <AppText variant="caption" style={styles.eventBadgeText}>
              {formatEventStatus(event.type)}
            </AppText>
          </View>
        </View>

        <AppText variant="caption" tone="muted" style={styles.eventDetail}>
          {event.message || copy.detail}
        </AppText>

        {event.latitude !== null && event.longitude !== null ? (
          <InfoRow
            icon="map-pin"
            label="Coordenadas"
            value={`${formatCoordinate(event.latitude)}, ${formatCoordinate(
              event.longitude,
            )}`}
          />
        ) : null}

        {metadataEntries.length > 0 ? (
          <View style={styles.metadataList}>
            {metadataEntries.map(([key, value]) => (
              <View key={key} style={styles.metadataPill}>
                <AppText variant="caption" style={styles.metadataText}>
                  {key}: {formatMetadataValue(value)}
                </AppText>
              </View>
            ))}
          </View>
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={22} color={colors.plum} />
      <View style={styles.infoCopy}>
        <AppText variant="caption" style={styles.infoLabel}>
          {label}
        </AppText>
        <AppText variant="caption" style={styles.infoValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function Message({ text }: { text: string }) {
  return (
    <View style={styles.message}>
      <Feather name="alert-circle" size={20} color={colors.danger} />
      <AppText variant="caption" style={styles.messageText}>
        {text}
      </AppText>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name="clock" size={21} color={colors.cream} />
      </View>
      <AppText variant="label" style={styles.emptyTitle}>
        Sem eventos ainda
      </AppText>
      <AppText variant="caption" style={styles.emptyText}>
        Os registros da sessão aparecem aqui conforme forem criados.
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

function groupEventsByDate(events: AlertEvent[]): TimelineGroup[] {
  const groups = new Map<string, AlertEvent[]>();

  events.forEach((event) => {
    const label = formatDateLabel(event.createdAt);
    const group = groups.get(label) ?? [];
    group.push(event);
    groups.set(label, group);
  });

  return Array.from(groups, ([label, groupEvents]) => ({
    label,
    events: groupEvents,
  }));
}

function getMetadataEntries(event: AlertEvent) {
  if (!event.metadata) {
    return [];
  }

  return Object.entries(event.metadata).slice(0, 4);
}

function formatEventStatus(type: AlertEventType) {
  if (type === "CONTACT_NOTIFICATION_FAILED") {
    return "Falhou";
  }

  if (type === "SESSION_CLOSED") {
    return "Final";
  }

  if (type === "ALERT_ESCALATED") {
    return "Atualizado";
  }

  return "Registrado";
}

function formatStatus(status: AlertStatus) {
  if (status === "ACTIVE") {
    return "Ativo";
  }

  if (status === "RESOLVED") {
    return "Resolvido";
  }

  return "Cancelado";
}

function formatLevel(level: AlertLevel) {
  return level === "CRITICAL" ? "Crítico" : "Normal";
}

function formatShortId(id: string) {
  return `#${id.slice(0, 6)}`;
}

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function formatMetadataValue(value: VeraMetadataValue) {
  if (value === null) {
    return "nulo";
  }

  const text = String(value);

  return text.length > 72 ? `${text.slice(0, 69)}...` : text;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(value));
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
    width: 48,
    height: 48,
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
    width: 48,
    height: 48,
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
    minWidth: 112,
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
  timeline: {
    gap: spacing[5],
  },
  group: {
    gap: spacing[3],
  },
  groupLabel: {
    color: veraTheme.sectionSubtitle,
    textTransform: "uppercase",
  },
  groupEvents: {
    gap: 0,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  eventRail: {
    width: 48,
    alignItems: "center",
  },
  railLine: {
    width: 1,
    flex: 1,
    minHeight: spacing[3],
    backgroundColor: "rgba(32, 37, 123, 0.16)",
  },
  railLineHidden: {
    backgroundColor: "transparent",
  },
  eventDot: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
  },
  eventCard: {
    flex: 1,
    gap: spacing[3],
    marginBottom: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: veraTheme.panelBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
  },
  eventHeader: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  eventTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  eventTitle: {
    color: veraTheme.sectionTitle,
    textTransform: "uppercase",
  },
  eventBadge: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing[2],
    borderRadius: radius.pill,
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  eventBadgeText: {
    color: veraTheme.sectionTitle,
    fontWeight: "800",
  },
  eventDetail: {
    lineHeight: 18,
  },
  infoRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  infoLabel: {
    color: veraTheme.mutedText,
  },
  infoValue: {
    color: colors.ink,
    fontWeight: "800",
  },
  metadataList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  metadataPill: {
    maxWidth: "100%",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
    backgroundColor: "rgba(32, 37, 123, 0.08)",
  },
  metadataText: {
    color: colors.blue,
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
