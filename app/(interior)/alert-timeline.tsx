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
import { isVeraDemoModeEnabled } from "@/constants/demo";
import { veraTheme } from "@/constants/vera-theme";
import { colors, radius, spacing } from "@/constants/theme";
import {
  useAlertTimelineQuery,
  useLatestEvidenceAnalysisQuery,
} from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import type {
  AlertEvent,
  AlertEventType,
  AlertLevel,
  AlertStatus,
  EvidenceAnalysis,
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
  const evidenceRecordId = getEventEvidenceRecordId(event);

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

        {evidenceRecordId ? (
          <EvidenceAnalysisBlock
            alertSessionId={event.alertSessionId}
            evidenceRecordId={evidenceRecordId}
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

function EvidenceAnalysisBlock({
  alertSessionId,
  evidenceRecordId,
}: {
  alertSessionId: string;
  evidenceRecordId: string;
}) {
  const analysisQuery = useLatestEvidenceAnalysisQuery(
    alertSessionId,
    evidenceRecordId,
  );
  const analysis = analysisQuery.data ?? null;
  const state = getAnalysisState({
    analysis,
    demo: isVeraDemoModeEnabled,
    error: analysisQuery.isError,
    loading: analysisQuery.isLoading,
  });
  const signalLabels = getDetectedSignalLabels(analysis);

  return (
    <View style={styles.analysisBlock}>
      <View style={styles.analysisHeader}>
        <View style={[styles.analysisIcon, { backgroundColor: state.tone }]}>
          <Feather
            name={state.icon}
            size={18}
            color={state.tone === colors.mint ? colors.ink : colors.cream}
          />
        </View>
        <View style={styles.analysisCopy}>
          <AppText variant="caption" style={styles.analysisTitle}>
            {state.title}
          </AppText>
          <AppText variant="caption" style={styles.analysisDetail}>
            {state.detail}
          </AppText>
        </View>
      </View>

      {analysis?.summary ? (
        <AppText variant="caption" style={styles.analysisSummary}>
          {analysis.summary}
        </AppText>
      ) : null}

      {analysis ? (
        <View style={styles.analysisMetaRow}>
          <AnalysisChip
            label="Risco"
            value={formatRiskLevel(analysis.riskLevel)}
          />
          <AnalysisChip
            label="Confiança"
            value={formatConfidence(analysis.confidence)}
          />
          <AnalysisChip
            label="Nível"
            value={
              analysis.suggestedAlertLevel === "CRITICAL" ? "Crítico" : "Normal"
            }
          />
        </View>
      ) : null}

      {signalLabels.length > 0 ? (
        <View style={styles.analysisSignals}>
          {signalLabels.map((label) => (
            <View key={label} style={styles.analysisSignalPill}>
              <AppText variant="caption" style={styles.analysisSignalText}>
                {label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

      <AppText variant="caption" style={styles.analysisDisclaimer}>
        {isVeraDemoModeEnabled
          ? "Dados demonstrativos, sem avaliação real."
          : "Leitura assistida. Use junto com o restante das evidências."}
      </AppText>
    </View>
  );
}

function AnalysisChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.analysisChip}>
      <AppText variant="caption" style={styles.analysisChipLabel}>
        {label}
      </AppText>
      <AppText variant="caption" style={styles.analysisChipValue}>
        {value}
      </AppText>
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

function getEventEvidenceRecordId(event: AlertEvent) {
  if (
    event.type === "EVIDENCE_UPLOADED" &&
    event.metadata?.evidenceType !== "AUDIO"
  ) {
    return null;
  }

  if (
    event.type !== "EVIDENCE_UPLOADED" &&
    event.type !== "AI_ANALYSIS_COMPLETED"
  ) {
    return null;
  }

  const value = event.metadata?.evidenceRecordId;

  return typeof value === "string" && value ? value : null;
}

function getAnalysisState({
  analysis,
  demo,
  error,
  loading,
}: {
  analysis: EvidenceAnalysis | null;
  demo: boolean;
  error: boolean;
  loading: boolean;
}) {
  if (demo && analysis) {
    return {
      title: "Exemplo de análise",
      detail: "Dados demonstrativos para validar a interface.",
      icon: "cpu" as const,
      tone: colors.sky,
    };
  }

  if (loading && !analysis) {
    return {
      title: "Verificando análise",
      detail: "Buscando resultado real da IA.",
      icon: "loader" as const,
      tone: colors.sky,
    };
  }

  if (error) {
    return {
      title: "Análise indisponível",
      detail: "Não foi possível carregar o resultado agora.",
      icon: "alert-circle" as const,
      tone: colors.danger,
    };
  }

  if (!analysis) {
    return {
      title: "Aguardando análise",
      detail: "A evidência já foi registrada; a análise ainda não chegou.",
      icon: "clock" as const,
      tone: colors.soft,
    };
  }

  if (analysis.status === "QUEUED") {
    return {
      title: "Aguardando análise",
      detail: "O serviço recebeu a solicitação e vai processar o áudio.",
      icon: "clock" as const,
      tone: colors.soft,
    };
  }

  if (analysis.status === "PROCESSING") {
    return {
      title: "Análise em andamento",
      detail: "O áudio está sendo avaliado pelo serviço de IA.",
      icon: "cpu" as const,
      tone: colors.sky,
    };
  }

  if (analysis.status === "FAILED") {
    return {
      title: "Análise falhou",
      detail: "A evidência segue preservada no cofre.",
      icon: "alert-circle" as const,
      tone: colors.danger,
    };
  }

  if (analysis.status === "INCONCLUSIVE") {
    return {
      title: "Resultado inconclusivo",
      detail: "A IA não encontrou sinal suficiente para classificar o trecho.",
      icon: "help-circle" as const,
      tone: colors.muted,
    };
  }

  if (analysis.suggestedAlertLevel === "CRITICAL" || analysis.shouldEscalate) {
    return {
      title: "Alerta crítico identificado",
      detail: "A IA apontou risco elevado para esta sessão.",
      icon: "zap" as const,
      tone: colors.coral,
    };
  }

  return {
    title: "Sinais analisados",
    detail: "Resultado assistido registrado para esta evidência.",
    icon: "check-circle" as const,
    tone: colors.mint,
  };
}

function getDetectedSignalLabels(analysis: EvidenceAnalysis | null) {
  if (!analysis) {
    return [];
  }

  const labels = getSignalLabelsFromValue(analysis.detectedSignals);

  if (labels.length > 0) {
    return labels.slice(0, 5);
  }

  return getSignalLabelsFromValue(analysis.acousticEvents).slice(0, 5);
}

function getSignalLabelsFromValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => formatSignalValue(item))
      .filter((label): label is string => Boolean(label));
  }

  if (!value || typeof value !== "object") {
    return [];
  }

  return Object.entries(value)
    .filter(([, entryValue]) => hasSignalValue(entryValue))
    .map(([key, entryValue]) => formatSignalKey(key, entryValue))
    .filter((label): label is string => Boolean(label));
}

function hasSignalValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return Boolean(value && typeof value === "object");
}

function formatSignalKey(key: string, value: unknown) {
  const knownSignals: Record<string, string> = {
    distressLanguage: "linguagem de aflição",
    impactNoise: "ruído brusco",
    raisedVoice: "voz elevada",
    threatTerms: "termos de ameaça",
  };

  if (knownSignals[key]) {
    return knownSignals[key];
  }

  const suffix =
    Array.isArray(value) && value.length > 1 ? ` (${value.length})` : "";

  return `${key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase()}${suffix}`;
}

function formatSignalValue(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  if (value && typeof value === "object" && "label" in value) {
    const label = (value as { label?: unknown }).label;

    return typeof label === "string" && label.trim() ? label.trim() : null;
  }

  return null;
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

function formatRiskLevel(value: string | null) {
  if (!value) {
    return "Não definido";
  }

  const riskCopy: Record<string, string> = {
    CRITICAL: "Crítico",
    HIGH: "Alto",
    LOW: "Baixo",
    MEDIUM: "Médio",
    NONE: "Sem sinal",
  };

  return riskCopy[value.toUpperCase()] ?? value;
}

function formatConfidence(value: number | null) {
  if (value === null) {
    return "Não definida";
  }

  return `${Math.round(value * 100)}%`;
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
  analysisBlock: {
    gap: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: "rgba(32, 37, 123, 0.12)",
  },
  analysisHeader: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  analysisIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  analysisCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  analysisTitle: {
    color: veraTheme.sectionTitle,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  analysisDetail: {
    color: veraTheme.mutedText,
  },
  analysisSummary: {
    color: colors.ink,
    lineHeight: 18,
  },
  analysisMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  analysisChip: {
    minHeight: 44,
    justifyContent: "center",
    gap: 1,
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.summaryBackground,
  },
  analysisChipLabel: {
    color: veraTheme.sectionSubtitle,
    textTransform: "uppercase",
  },
  analysisChipValue: {
    color: colors.ink,
    fontWeight: "800",
  },
  analysisSignals: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  analysisSignalPill: {
    maxWidth: "100%",
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radius.sm,
    backgroundColor: "rgba(142, 207, 184, 0.18)",
  },
  analysisSignalText: {
    color: veraTheme.sectionTitle,
    fontWeight: "800",
  },
  analysisDisclaimer: {
    color: veraTheme.mutedText,
    fontStyle: "italic",
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
