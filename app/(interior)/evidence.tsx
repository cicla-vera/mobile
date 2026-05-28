import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Screen } from "@/components/ui/screen";
import {
  EvidenceCapturePanel,
  EvidenceUploadQueuePanel,
} from "@/components/vera/evidence-capture-panel";
import { colors, radius, spacing } from "@/constants/theme";
import {
  useActiveAlertSessionQuery,
  useHideEvidenceMutation,
  useVaultEvidenceRecordsQuery,
} from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import { deleteSecurityAudioEvidence } from "@/services/vera/security-audio-evidence.service";
import {
  isLocalSecurityEvidenceRecord,
  parseLocalSecurityEvidenceId,
} from "@/services/vera/security-audio-evidence-records.service";
import type {
  AlertSession,
  EvidenceRecord,
  EvidenceType,
  VeraMetadataValue,
} from "@/types/vera.types";

type TypeFilter = EvidenceType | "ALL";
type StatusFilter = "ALL" | "VERIFIED" | "PENDING";

type TypeFilterOption = {
  value: TypeFilter;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

type StatusFilterOption = {
  value: StatusFilter;
  label: string;
  icon: keyof typeof Feather.glyphMap;
};

type EvidenceGroup = {
  label: string;
  records: EvidenceRecord[];
};

const TYPE_FILTER_OPTIONS: TypeFilterOption[] = [
  { value: "ALL", label: "Todos", icon: "grid" },
  { value: "AUDIO", label: "Áudio", icon: "mic" },
  { value: "VIDEO", label: "Video", icon: "video" },
  { value: "IMAGE", label: "Imagem", icon: "image" },
  { value: "FILE", label: "Arquivo", icon: "file-text" },
];

const STATUS_FILTER_OPTIONS: StatusFilterOption[] = [
  { value: "ALL", label: "Todos", icon: "layers" },
  { value: "VERIFIED", label: "Integridade", icon: "shield" },
  { value: "PENDING", label: "Pendente", icon: "clock" },
];

const evidenceTone: Record<EvidenceType, string> = {
  AUDIO: colors.sky,
  VIDEO: colors.coral,
  IMAGE: colors.mint,
  FILE: colors.plum,
};

const evidenceIcon: Record<EvidenceType, keyof typeof Feather.glyphMap> = {
  AUDIO: "mic",
  VIDEO: "video",
  IMAGE: "image",
  FILE: "file-text",
};

const evidenceLabel: Record<EvidenceType, string> = {
  AUDIO: "Áudio",
  VIDEO: "Video",
  IMAGE: "Imagem",
  FILE: "Arquivo",
};

export default function VeraEvidenceRoute() {
  const activeAlertQuery = useActiveAlertSessionQuery();
  const activeAlert = activeAlertQuery.data ?? null;
  const evidenceQuery = useVaultEvidenceRecordsQuery(activeAlert?.id ?? null);
  const hideEvidenceMutation = useHideEvidenceMutation();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [feedback, setFeedback] = useState<string | null>(null);

  const visibleRecords = useMemo(
    () => filterVisibleRecords(evidenceQuery.data ?? []),
    [evidenceQuery.data],
  );
  const filteredRecords = useMemo(
    () => filterEvidenceRecords(visibleRecords, typeFilter, statusFilter),
    [statusFilter, typeFilter, visibleRecords],
  );
  const groupedRecords = useMemo(
    () => groupEvidenceByDate(filteredRecords),
    [filteredRecords],
  );
  const totalSize = useMemo(
    () => visibleRecords.reduce((total, record) => total + record.size, 0),
    [visibleRecords],
  );

  const queryError = activeAlertQuery.isError
    ? getApiErrorMessage(
        activeAlertQuery.error,
        "Não deu para carregar a sessão Vera agora.",
      )
    : evidenceQuery.isError
      ? getApiErrorMessage(
          evidenceQuery.error,
          "Não deu para carregar o cofre de evidências agora.",
        )
      : null;
  const mutationError = hideEvidenceMutation.error
    ? getApiErrorMessage(
        hideEvidenceMutation.error,
        "Não deu para ocultar a evidência agora.",
      )
    : null;
  const isLoading =
    activeAlertQuery.isLoading || evidenceQuery.isLoading;
  const isRefreshing =
    activeAlertQuery.isRefetching || evidenceQuery.isRefetching;
  const hasEvidenceContent = Boolean(activeAlert) || visibleRecords.length > 0;

  function refresh() {
    void activeAlertQuery.refetch();
    void evidenceQuery.refetch();
  }

  function handleHideEvidence(record: EvidenceRecord) {
    if (isLocalSecurityEvidenceRecord(record.id)) {
      Alert.alert(
        "Excluir áudio",
        "O arquivo de áudio será removido deste aparelho. Esta ação não pode ser desfeita.",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Excluir",
            style: "destructive",
            onPress: () => {
              void deleteLocalEvidence(record);
            },
          },
        ],
      );
      return;
    }

    Alert.alert(
      "Ocultar evidência",
      "Ela deixa de aparecer no cofre, mas o registro de integridade continua preservado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Ocultar",
          style: "destructive",
          onPress: () => {
            void hideEvidence(record);
          },
        },
      ],
    );
  }

  async function hideEvidence(record: EvidenceRecord) {
    if (isLocalSecurityEvidenceRecord(record.id)) {
      return;
    }

    setFeedback(null);
    hideEvidenceMutation.reset();

    try {
      await hideEvidenceMutation.mutateAsync({
        alertSessionId: record.alertSessionId,
        evidenceRecordId: record.id,
      });
      setFeedback("Evidência removida da visão principal.");
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  async function deleteLocalEvidence(record: EvidenceRecord) {
    const securityEvidenceId = parseLocalSecurityEvidenceId(record.id);

    if (!securityEvidenceId) {
      return;
    }

    setFeedback(null);

    try {
      const deleted = await deleteSecurityAudioEvidence(securityEvidenceId);

      if (deleted) {
        setFeedback("Áudio excluído deste aparelho.");
        await evidenceQuery.refetch();
      }
    } catch {
      setFeedback("Não deu para excluir o áudio agora.");
    }
  }

  function openEvidenceDetail(record: EvidenceRecord) {
    router.push({
      pathname: "/(interior)/evidence-detail",
      params: {
        alertSessionId: record.alertSessionId,
        evidenceRecordId: record.id,
      },
    });
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refresh}
            tintColor={colors.mint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header />

        {isLoading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.mint} size="large" />
            <AppText variant="caption" style={styles.darkMuted}>
              Abrindo cofre Vera...
            </AppText>
          </View>
        ) : null}

        {queryError ? (
          <Message
            text={queryError}
            actionLabel="Tentar de novo"
            onAction={refresh}
          />
        ) : null}

        {!isLoading && !queryError && !hasEvidenceContent ? (
          <EmptyState
            icon="archive"
            title="Sem sessao ativa"
            detail="Quando um alerta estiver em andamento, as evidencias consentidas ficam reunidas aqui. Audios do Modo Seguranca Vera tambem aparecem nesta tela."
          />
        ) : null}

        {hasEvidenceContent ? (
          <>
            {activeAlert ? (
              <SessionSummary
                session={activeAlert}
                totalRecords={visibleRecords.length}
                totalSize={totalSize}
              />
            ) : (
              <LocalSecuritySummary
                totalRecords={visibleRecords.length}
                totalSize={totalSize}
              />
            )}

            {activeAlert ? (
              <>
                <EvidenceCapturePanel alertSessionId={activeAlert.id} />

                <EvidenceUploadQueuePanel alertSessionId={activeAlert.id} />
              </>
            ) : null}

            <FilterPanel
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
            />

            {feedback ? (
              <View style={styles.feedback}>
                <Feather name="check" size={22} color={colors.ink} />
                <AppText variant="caption" style={styles.feedbackText}>
                  {feedback}
                </AppText>
              </View>
            ) : null}

            {mutationError ? <Message text={mutationError} /> : null}

            {!evidenceQuery.isLoading && visibleRecords.length === 0 ? (
              <EmptyState
                icon="folder"
                title="Cofre vazio"
                detail="Nenhuma evidência foi adicionada a esta sessão ainda."
              />
            ) : null}

            {!evidenceQuery.isLoading &&
            visibleRecords.length > 0 &&
            filteredRecords.length === 0 ? (
              <EmptyState
                icon="filter"
                title="Nada neste filtro"
                detail="Altere o tipo ou o status para ver outros itens guardados."
              />
            ) : null}

            <View style={styles.groups}>
              {groupedRecords.map((group) => (
                <View key={group.label} style={styles.group}>
                  <AppText variant="caption" style={styles.groupLabel}>
                    {group.label}
                  </AppText>
                  <View style={styles.recordList}>
                    {group.records.map((record) => (
                      <EvidenceCard
                        key={record.id}
                        disabled={hideEvidenceMutation.isPending}
                        record={record}
                        onOpen={() => openEvidenceDetail(record)}
                        onHide={() => handleHideEvidence(record)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => router.back()}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <Feather name="arrow-left" size={20} color={colors.cream} />
      </Pressable>

      <View style={styles.headerCopy}>
        <AppText variant="label" tone="pink" style={styles.eyebrow}>
          Vera
        </AppText>
        <AppText variant="title" tone="cream">
          Evidências
        </AppText>
      </View>
    </View>
  );
}

function SessionSummary({
  session,
  totalRecords,
  totalSize,
}: {
  session: AlertSession;
  totalRecords: number;
  totalSize: number;
}) {
  return (
    <View style={styles.summaryPanel}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryIcon}>
          <Feather name="archive" size={20} color={colors.ink} />
        </View>
        <View style={styles.summaryCopy}>
          <AppText variant="label" tone="cream">
            Cofre da sessão ativa
          </AppText>
          <AppText variant="caption" style={styles.darkMuted}>
            Iniciada em {formatDateTime(session.startedAt)}
          </AppText>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <StatusTile label="Itens" value={String(totalRecords)} />
        <StatusTile label="Volume" value={formatBytes(totalSize)} />
        <StatusTile label="Nivel" value={formatAlertLevel(session.level)} />
        <StatusTile label="Sessao" value={formatShortId(session.id)} />
      </View>
    </View>
  );
}

function LocalSecuritySummary({
  totalRecords,
  totalSize,
}: {
  totalRecords: number;
  totalSize: number;
}) {
  return (
    <View style={styles.summaryPanel}>
      <View style={styles.summaryHeader}>
        <View style={styles.summaryIcon}>
          <Feather name="shield" size={20} color={colors.ink} />
        </View>
        <View style={styles.summaryCopy}>
          <AppText variant="label" tone="cream">
            Evidencias do Modo Seguranca
          </AppText>
          <AppText variant="caption" style={styles.darkMuted}>
            Audios selados localmente com hash SHA-256
          </AppText>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <StatusTile label="Itens" value={String(totalRecords)} />
        <StatusTile label="Volume" value={formatBytes(totalSize)} />
        <StatusTile label="Origem" value="Local" />
        <StatusTile label="Tipo" value="Audio" />
      </View>
    </View>
  );
}

function FilterPanel({
  statusFilter,
  typeFilter,
  onStatusChange,
  onTypeChange,
}: {
  statusFilter: StatusFilter;
  typeFilter: TypeFilter;
  onStatusChange: (value: StatusFilter) => void;
  onTypeChange: (value: TypeFilter) => void;
}) {
  return (
    <View style={styles.filterPanel}>
      <View style={styles.filterBlock}>
        <AppText variant="caption" style={styles.filterLabel}>
          Tipo
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {TYPE_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                icon={option.icon}
                label={option.label}
                selected={typeFilter === option.value}
                onPress={() => onTypeChange(option.value)}
              />
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.filterBlock}>
        <AppText variant="caption" style={styles.filterLabel}>
          Status
        </AppText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterRow}>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <FilterChip
                key={option.value}
                icon={option.icon}
                label={option.label}
                selected={statusFilter === option.value}
                onPress={() => onStatusChange(option.value)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function FilterChip({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        selected && styles.filterChipSelected,
        pressed && styles.pressed,
      ]}
    >
      <Feather
        name={icon}
        size={22}
        color={selected ? colors.ink : colors.cream}
      />
      <AppText
        variant="caption"
        style={[
          styles.filterChipText,
          selected && styles.filterChipTextSelected,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function EvidenceCard({
  disabled,
  record,
  onHide,
  onOpen,
}: {
  disabled: boolean;
  record: EvidenceRecord;
  onHide: () => void;
  onOpen: () => void;
}) {
  const verified = isEvidenceVerified(record);
  const metadataEntries = getMetadataEntries(record);
  const isLocalSecurity = isLocalSecurityEvidenceRecord(record.id);

  return (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View
          style={[
            styles.recordTypeIcon,
            { backgroundColor: evidenceTone[record.type] },
          ]}
        >
          <Feather
            name={evidenceIcon[record.type]}
            size={22}
            color={record.type === "IMAGE" ? colors.ink : colors.cream}
          />
        </View>

        <View style={styles.recordTitleWrap}>
          <AppText variant="label" style={styles.recordTitle} numberOfLines={1}>
            {record.originalName ?? evidenceLabel[record.type]}
          </AppText>
          <AppText variant="caption" tone="muted">
            {isLocalSecurity ? "Modo Seguranca · " : ""}
            {evidenceLabel[record.type]} - {formatBytes(record.size)}
          </AppText>
        </View>

        <View style={styles.recordActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir detalhe da evidência"
            onPress={onOpen}
            style={({ pressed }) => [
              styles.detailButton,
              pressed && styles.pressed,
            ]}
          >
            <Feather name="chevron-right" size={22} color={colors.blue} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isLocalSecurity ? "Excluir audio" : "Ocultar evidencia"
            }
            disabled={disabled}
            onPress={onHide}
            style={({ pressed }) => [
              styles.hideButton,
              pressed && styles.pressed,
              disabled && styles.disabledAction,
            ]}
          >
            <Feather
              name={isLocalSecurity ? "trash-2" : "eye-off"}
              size={20}
              color={colors.danger}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.recordMetaPanel}>
        <MetaRow
          icon="clock"
          label="Criada"
          value={formatTime(record.createdAt)}
        />
        <MetaRow
          icon={verified ? "shield" : "clock"}
          label="Integridade"
          value={verified ? "Hash registrado" : "Pendente"}
        />
        <MetaRow
          icon="hash"
          label={record.hashAlgorithm}
          value={formatHash(record.contentHash)}
        />
      </View>

      {metadataEntries.length > 0 ? (
        <View style={styles.metadataPanel}>
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
  );
}

function StatusTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusTile}>
      <AppText variant="caption" style={styles.statusTileLabel}>
        {label}
      </AppText>
      <AppText variant="label" tone="cream" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Feather name={icon} size={22} color={colors.plum} />
      <View style={styles.metaCopy}>
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText variant="caption" style={styles.metaValue} numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function EmptyState({
  detail,
  icon,
  title,
}: {
  detail: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Feather name={icon} size={21} color={colors.cream} />
      </View>
      <AppText variant="label" tone="cream">
        {title}
      </AppText>
      <AppText variant="caption" style={styles.emptyText}>
        {detail}
      </AppText>
    </View>
  );
}

function Message({
  actionLabel,
  onAction,
  text,
}: {
  actionLabel?: string;
  onAction?: () => void;
  text: string;
}) {
  return (
    <View style={styles.message}>
      <Feather name="alert-circle" size={20} color={colors.danger} />
      <AppText variant="caption" style={styles.messageText}>
        {text}
      </AppText>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={({ pressed }) => [
            styles.messageAction,
            pressed && styles.pressed,
          ]}
        >
          <AppText
            variant="caption"
            tone="blue"
            style={styles.messageActionText}
          >
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function filterVisibleRecords(records: EvidenceRecord[]) {
  return records.filter(
    (record) => !record.hiddenFromUserAt && !record.deletedAt,
  );
}

function filterEvidenceRecords(
  records: EvidenceRecord[],
  typeFilter: TypeFilter,
  statusFilter: StatusFilter,
) {
  return records.filter((record) => {
    const matchesType = typeFilter === "ALL" || record.type === typeFilter;
    const verified = isEvidenceVerified(record);
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "VERIFIED" && verified) ||
      (statusFilter === "PENDING" && !verified);

    return matchesType && matchesStatus;
  });
}

function groupEvidenceByDate(records: EvidenceRecord[]): EvidenceGroup[] {
  const groups = new Map<string, EvidenceRecord[]>();

  records.forEach((record) => {
    const label = formatDateLabel(record.createdAt);
    const group = groups.get(label) ?? [];
    group.push(record);
    groups.set(label, group);
  });

  return Array.from(groups, ([label, groupRecords]) => ({
    label,
    records: groupRecords,
  }));
}

function isEvidenceVerified(record: EvidenceRecord) {
  return Boolean(record.contentHash && record.hashAlgorithm && record.hashedAt);
}

function getMetadataEntries(record: EvidenceRecord) {
  if (!record.metadata) {
    return [];
  }

  return Object.entries(record.metadata)
    .filter(([key]) => key !== "localUri")
    .slice(0, 3);
}

function formatAlertLevel(level: AlertSession["level"]) {
  return level === "CRITICAL" ? "Crítico" : "Normal";
}

function formatShortId(id: string) {
  return `#${id.slice(0, 6)}`;
}

function formatHash(hash: string) {
  if (!hash) {
    return "Pendente";
  }

  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

function formatMetadataValue(value: VeraMetadataValue) {
  if (value === null) {
    return "nulo";
  }

  return String(value);
}

function formatBytes(bytes: number) {
  if (bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);

  if (exponent === 0) {
    return `${bytes} B`;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  content: {
    flexGrow: 1,
    gap: spacing[4],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[7],
    paddingBottom: spacing[10],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    marginBottom: spacing[2],
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.16)",
    borderRadius: 22,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  pressed: {
    opacity: 0.72,
  },
  disabledAction: {
    opacity: 0.48,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    textTransform: "uppercase",
  },
  darkMuted: {
    color: "rgba(255, 245, 236, 0.7)",
  },
  loadingPanel: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  summaryPanel: {
    gap: spacing[5],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.12)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  summaryHeader: {
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
    width: "48%",
    minHeight: 58,
    justifyContent: "center",
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.1)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  statusTileLabel: {
    color: "rgba(255, 245, 236, 0.58)",
    textTransform: "uppercase",
  },
  filterPanel: {
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  filterBlock: {
    gap: spacing[2],
  },
  filterLabel: {
    color: "rgba(255, 245, 236, 0.62)",
    textTransform: "uppercase",
  },
  filterRow: {
    flexDirection: "row",
    gap: spacing[2],
    paddingRight: spacing[4],
  },
  filterChip: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.12)",
    borderRadius: radius.pill,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  filterChipSelected: {
    borderColor: colors.mint,
    backgroundColor: colors.mint,
  },
  filterChipText: {
    color: colors.cream,
    fontWeight: "800",
  },
  filterChipTextSelected: {
    color: colors.ink,
  },
  feedback: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.mint,
  },
  feedbackText: {
    flex: 1,
    color: colors.ink,
    fontWeight: "800",
  },
  groups: {
    gap: spacing[5],
  },
  group: {
    gap: spacing[2],
  },
  groupLabel: {
    color: "rgba(255, 245, 236, 0.62)",
    textTransform: "uppercase",
  },
  recordList: {
    gap: spacing[3],
  },
  recordCard: {
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  recordHeader: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  recordTypeIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
  },
  recordTitleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  recordTitle: {
    color: colors.ink,
  },
  recordActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  detailButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(32, 37, 123, 0.08)",
  },
  hideButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(180, 35, 66, 0.08)",
  },
  recordMetaPanel: {
    gap: spacing[2],
  },
  metaRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  metaCopy: {
    flex: 1,
    minWidth: 0,
  },
  metaValue: {
    color: colors.ink,
    fontWeight: "800",
  },
  metadataPanel: {
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
  emptyState: {
    minHeight: 188,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.12)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  emptyIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.plum,
  },
  emptyText: {
    maxWidth: 280,
    textAlign: "center",
    color: "rgba(255, 245, 236, 0.68)",
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.96)",
  },
  messageText: {
    flex: 1,
    color: colors.danger,
  },
  messageAction: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: spacing[2],
  },
  messageActionText: {
    fontWeight: "800",
  },
});
