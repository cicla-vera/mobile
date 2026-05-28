import { Feather } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { colors, radius, spacing } from "@/constants/theme";
import { LOCAL_SECURITY_EVIDENCE_SESSION_ID } from "@/constants/vera-security-audio";
import {
  useAnalyzeEvidenceMutation,
  useCachedEvidenceAnalysisQuery,
  useVaultEvidenceRecordsQuery,
  useVerifyEvidenceMutation,
} from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import {
  deleteSecurityAudioEvidence,
  hashLocalFile,
} from "@/services/vera/security-audio-evidence.service";
import {
  findLocalSecurityEvidenceRecord,
  isLocalSecurityEvidenceRecord,
  parseLocalSecurityEvidenceId,
} from "@/services/vera/security-audio-evidence-records.service";
import type {
  AlertLevel,
  EvidenceAnalysis,
  EvidenceRecord,
  EvidenceType,
  EvidenceVerification,
  VeraMetadataValue,
} from "@/types/vera.types";

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

export default function VeraEvidenceDetailRoute() {
  const params = useLocalSearchParams<{
    alertSessionId?: string | string[];
    evidenceRecordId?: string | string[];
  }>();
  const alertSessionId = normalizeParam(params.alertSessionId);
  const evidenceRecordId = normalizeParam(params.evidenceRecordId);
  const vaultSessionKey =
    alertSessionId === LOCAL_SECURITY_EVIDENCE_SESSION_ID
      ? null
      : alertSessionId || null;
  const evidenceQuery = useVaultEvidenceRecordsQuery(vaultSessionKey);
  const cachedAnalysisQuery = useCachedEvidenceAnalysisQuery(evidenceRecordId);
  const verifyEvidenceMutation = useVerifyEvidenceMutation();
  const analyzeEvidenceMutation = useAnalyzeEvidenceMutation();
  const [verification, setVerification] = useState<EvidenceVerification | null>(
    null,
  );
  const [analysis, setAnalysis] = useState<EvidenceAnalysis | null>(null);
  const [localRecordFallback, setLocalRecordFallback] =
    useState<EvidenceRecord | null>(null);
  const [isVerifyingLocal, setIsVerifyingLocal] = useState(false);

  const record = useMemo(() => {
    const fromQuery =
      evidenceQuery.data?.find((item) => item.id === evidenceRecordId) ?? null;

    return fromQuery ?? localRecordFallback;
  }, [evidenceQuery.data, evidenceRecordId, localRecordFallback]);
  const isLocalSecurity = record
    ? isLocalSecurityEvidenceRecord(record.id)
    : isLocalSecurityEvidenceRecord(evidenceRecordId);

  useEffect(() => {
    if (!evidenceRecordId || !isLocalSecurityEvidenceRecord(evidenceRecordId)) {
      setLocalRecordFallback(null);
      return;
    }

    if (evidenceQuery.data?.some((item) => item.id === evidenceRecordId)) {
      setLocalRecordFallback(null);
      return;
    }

    let cancelled = false;

    void findLocalSecurityEvidenceRecord(evidenceRecordId).then((item) => {
      if (!cancelled) {
        setLocalRecordFallback(item);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [evidenceQuery.data, evidenceRecordId]);
  const queryError =
    !alertSessionId || !evidenceRecordId
      ? "Não deu para identificar a evidência selecionada."
      : evidenceQuery.isError
        ? getApiErrorMessage(
            evidenceQuery.error,
            "Não deu para carregar a evidência agora.",
          )
        : null;
  const verifyError = verifyEvidenceMutation.error
    ? getApiErrorMessage(
        verifyEvidenceMutation.error,
        "Não deu para verificar a integridade agora.",
      )
    : null;
  const analysisError = analyzeEvidenceMutation.error
    ? getApiErrorMessage(
        analyzeEvidenceMutation.error,
        "Não deu para solicitar a análise agora.",
      )
    : null;
  const isRefreshing = evidenceQuery.isRefetching;
  const isMissingRecord =
    !evidenceQuery.isLoading &&
    !queryError &&
    Boolean(evidenceQuery.data) &&
    !record;
  const displayedAnalysis = analysis ?? cachedAnalysisQuery.data ?? null;

  async function handleVerify() {
    if (!record) {
      return;
    }

    verifyEvidenceMutation.reset();
    setVerification(null);

    if (isLocalSecurityEvidenceRecord(record.id)) {
      const localUri = record.metadata?.localUri;

      if (typeof localUri !== "string" || !localUri) {
        return;
      }

      setIsVerifyingLocal(true);

      try {
        const calculatedHash = await hashLocalFile(localUri);
        setVerification({
          evidenceRecordId: record.id,
          hashAlgorithm: record.hashAlgorithm,
          storedHash: record.contentHash,
          calculatedHash,
          matches: calculatedHash === record.contentHash,
          checkedAt: new Date().toISOString(),
        });
      } finally {
        setIsVerifyingLocal(false);
      }

      return;
    }

    try {
      const result = await verifyEvidenceMutation.mutateAsync({
        alertSessionId: record.alertSessionId,
        evidenceRecordId: record.id,
      });
      setVerification(result);
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  async function handleAnalyze() {
    if (!record) {
      return;
    }

    analyzeEvidenceMutation.reset();

    try {
      const result = await analyzeEvidenceMutation.mutateAsync({
        alertSessionId: record.alertSessionId,
        evidenceRecordId: record.id,
      });
      setAnalysis(result);
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  function handleDeleteLocalAudio() {
    if (!record || !isLocalSecurityEvidenceRecord(record.id)) {
      return;
    }

    Alert.alert(
      "Excluir áudio",
      "O arquivo de áudio será removido deste aparelho. Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            void deleteLocalAudio(record.id);
          },
        },
      ],
    );
  }

  async function deleteLocalAudio(recordId: string) {
    const securityEvidenceId = parseLocalSecurityEvidenceId(recordId);

    if (!securityEvidenceId) {
      return;
    }

    await deleteSecurityAudioEvidence(securityEvidenceId);
    router.back();
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void evidenceQuery.refetch()}
            tintColor={colors.mint}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <Header />

        {evidenceQuery.isLoading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.mint} size="large" />
            <AppText variant="caption" style={styles.darkMuted}>
              Carregando evidência...
            </AppText>
          </View>
        ) : null}

        {queryError ? <Message text={queryError} /> : null}

        {isMissingRecord ? (
          <EmptyState
            icon="file-minus"
            title="Evidência não encontrada"
            detail="O item pode ter sido ocultado, removido ou pertencer a outra sessão."
          />
        ) : null}

        {record ? (
          <>
            <EvidenceSummary record={record} isLocalSecurity={isLocalSecurity} />

            {isLocalSecurity && typeof record.metadata?.localUri === "string" ? (
              <LocalAudioPanel localUri={record.metadata.localUri} />
            ) : null}

            {isLocalSecurity ? (
              <Button
                onPress={handleDeleteLocalAudio}
                style={styles.stretchButton}
                variant="ghost"
              >
                Excluir áudio deste aparelho
              </Button>
            ) : null}

            <IntegrityPanel
              record={record}
              verification={verification}
              onVerify={() => void handleVerify()}
              loading={verifyEvidenceMutation.isPending || isVerifyingLocal}
              isLocalSecurity={isLocalSecurity}
            />

            {verifyError ? <Message text={verifyError} /> : null}

            <RetentionPanel record={record} isLocalSecurity={isLocalSecurity} />

            <MetadataPanel record={record} isLocalSecurity={isLocalSecurity} />

            {!isLocalSecurity ? (
              <AnalysisPanel
                analysis={displayedAnalysis}
                loading={analyzeEvidenceMutation.isPending}
                onAnalyze={() => void handleAnalyze()}
                record={record}
              />
            ) : null}

            {analysisError ? <Message text={analysisError} /> : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <ButtonIcon
        accessibilityLabel="Voltar"
        icon="arrow-left"
        onPress={() => router.back()}
      />

      <View style={styles.headerCopy}>
        <AppText variant="label" tone="pink" style={styles.eyebrow}>
          Vera
        </AppText>
        <AppText variant="title" tone="cream">
          Detalhe da evidência
        </AppText>
      </View>
    </View>
  );
}

function ButtonIcon({
  accessibilityLabel,
  icon,
  onPress,
}: {
  accessibilityLabel: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Feather name={icon} size={20} color={colors.cream} />
    </Pressable>
  );
}

function EvidenceSummary({
  isLocalSecurity,
  record,
}: {
  isLocalSecurity: boolean;
  record: EvidenceRecord;
}) {
  return (
    <View style={styles.heroPanel}>
      <View style={styles.heroHeader}>
        <View
          style={[
            styles.typeIcon,
            { backgroundColor: evidenceTone[record.type] },
          ]}
        >
          <Feather
            name={evidenceIcon[record.type]}
            size={23}
            color={record.type === "IMAGE" ? colors.ink : colors.cream}
          />
        </View>
        <View style={styles.heroCopy}>
          <AppText variant="label" tone="cream">
            {record.originalName ?? evidenceLabel[record.type]}
          </AppText>
          <AppText variant="caption" style={styles.darkMuted}>
            {isLocalSecurity ? "Modo Seguranca · " : ""}
            {evidenceLabel[record.type]} - {formatBytes(record.size)}
          </AppText>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <DarkTile
          label="Origem"
          value={isLocalSecurity ? "Modo Seguranca" : "Enviado"}
        />
        <DarkTile label="Data" value={formatDateTime(record.createdAt)} />
        <DarkTile
          label="Sessao"
          value={
            isLocalSecurity
              ? "Local"
              : formatShortId(record.alertSessionId)
          }
        />
        <DarkTile label="MIME" value={record.mimeType} />
      </View>
    </View>
  );
}

function LocalAudioPanel({ localUri }: { localUri: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const player = useAudioPlayer(isPlaying ? localUri : null);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying, player]);

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelIcon}>
          <Feather name="headphones" size={22} color={colors.ink} />
        </View>
        <View style={styles.panelCopy}>
          <AppText variant="label">Reproducao local</AppText>
          <AppText variant="caption" tone="muted">
            Audio selado no dispositivo durante o Modo Seguranca.
          </AppText>
        </View>
      </View>

      <Button
        onPress={() => setIsPlaying((current) => !current)}
        style={styles.stretchButton}
        variant="secondary"
      >
        {isPlaying && playerStatus.playing ? "Pausar audio" : "Ouvir evidencia"}
      </Button>
    </View>
  );
}

function IntegrityPanel({
  isLocalSecurity,
  loading,
  onVerify,
  record,
  verification,
}: {
  isLocalSecurity: boolean;
  loading: boolean;
  onVerify: () => void;
  record: EvidenceRecord;
  verification: EvidenceVerification | null;
}) {
  const verified = Boolean(record.contentHash && record.hashAlgorithm);
  const lastCheck = verification
    ? verification.matches
      ? "Integridade confirmada"
      : "Hash divergente"
    : verified
      ? isLocalSecurity
        ? "Hash registrado localmente"
        : "Hash registrado pelo backend"
      : "Hash pendente";

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelIcon}>
          <Feather name="shield" size={22} color={colors.ink} />
        </View>
        <View style={styles.panelCopy}>
          <AppText variant="label">Integridade</AppText>
          <AppText variant="caption" tone="muted">
            {lastCheck}
          </AppText>
        </View>
      </View>

      <View style={styles.hashBox}>
        <AppText variant="caption" tone="muted">
          {record.hashAlgorithm || "Hash"}
        </AppText>
        <AppText selectable variant="caption" style={styles.hashValue}>
          {record.contentHash || "Pendente"}
        </AppText>
      </View>

      <InfoRow
        icon="clock"
        label="Calculado em"
        value={formatNullableDateTime(record.hashedAt)}
      />

      {verification ? (
        <View
          style={[
            styles.verificationBadge,
            verification.matches && styles.verificationBadgeOk,
          ]}
        >
          <Feather
            name={verification.matches ? "check" : "alert-triangle"}
            size={22}
            color={verification.matches ? colors.ink : colors.danger}
          />
          <AppText
            variant="caption"
            style={[
              styles.verificationText,
              verification.matches && styles.verificationTextOk,
            ]}
          >
            {verification.matches
              ? `Verificado em ${formatDateTime(verification.checkedAt)}`
              : "O hash calculado não confere com o registro."}
          </AppText>
        </View>
      ) : null}

      <Button
        loading={loading}
        onPress={onVerify}
        style={styles.stretchButton}
        variant="secondary"
      >
        Verificar integridade
      </Button>
    </View>
  );
}

function RetentionPanel({
  isLocalSecurity,
  record,
}: {
  isLocalSecurity: boolean;
  record: EvidenceRecord;
}) {
  const hidden = Boolean(record.hiddenFromUserAt);
  const deleted = Boolean(record.deletedAt);

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelIcon}>
          <Feather name="eye-off" size={22} color={colors.ink} />
        </View>
        <View style={styles.panelCopy}>
          <AppText variant="label">Retenção e visibilidade</AppText>
          <AppText variant="caption" tone="muted">
            {isLocalSecurity
              ? "Armazenada localmente no cofre Vera"
              : deleted
                ? "Marcada para exclusao"
                : hidden
                  ? "Ocultada da visao principal"
                  : "Visivel no cofre"}
          </AppText>
        </View>
      </View>

      {!isLocalSecurity ? (
        <>
          <InfoRow
            icon="eye-off"
            label="Ocultada em"
            value={formatNullableDateTime(record.hiddenFromUserAt)}
          />
          <InfoRow
            icon="calendar"
            label="Retencao ate"
            value={formatNullableDateTime(record.retentionUntil)}
          />
          <InfoRow
            icon="trash-2"
            label="Excluida em"
            value={formatNullableDateTime(record.deletedAt)}
          />
        </>
      ) : null}
    </View>
  );
}

function MetadataPanel({
  isLocalSecurity,
  record,
}: {
  isLocalSecurity: boolean;
  record: EvidenceRecord;
}) {
  const entries = getMetadataEntries(record);

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelIcon}>
          <Feather name="list" size={22} color={colors.ink} />
        </View>
        <View style={styles.panelCopy}>
          <AppText variant="label">Metadados</AppText>
          <AppText variant="caption" tone="muted">
            {isLocalSecurity
              ? "Informacoes tecnicas da evidencia selada localmente."
              : "Informacoes tecnicas recebidas do backend."}
          </AppText>
        </View>
      </View>

      {entries.length === 0 ? (
        <AppText variant="caption" tone="muted">
          Sem metadados adicionais.
        </AppText>
      ) : (
        <View style={styles.metadataList}>
          {entries.map(([key, value]) => (
            <InfoRow
              key={key}
              icon="tag"
              label={key}
              value={formatMetadataValue(value)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function AnalysisPanel({
  analysis,
  loading,
  onAnalyze,
  record,
}: {
  analysis: EvidenceAnalysis | null;
  loading: boolean;
  onAnalyze: () => void;
  record: EvidenceRecord;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelIcon}>
          <Feather name="cpu" size={22} color={colors.ink} />
        </View>
        <View style={styles.panelCopy}>
          <AppText variant="label">Análise IA</AppText>
          <AppText variant="caption" tone="muted">
            Leitura de apoio, sem substituir avaliação humana ou jurídica.
          </AppText>
        </View>
      </View>

      {analysis ? (
        <View style={styles.analysisResult}>
          <InfoRow
            icon="activity"
            label="Status"
            value={formatAnalysisStatus(analysis)}
          />
          <InfoRow
            icon="alert-circle"
            label="Risco"
            value={analysis.riskLevel ?? "Não informado"}
          />
          <InfoRow
            icon="bar-chart-2"
            label="Confianca"
            value={formatConfidence(analysis.confidence)}
          />
          <InfoRow
            icon="flag"
            label="Nivel sugerido"
            value={formatAlertLevel(analysis.suggestedAlertLevel)}
          />
          <InfoRow
            icon="trending-up"
            label="Escalonar"
            value={
              analysis.shouldEscalate === null
                ? "Não informado"
                : analysis.shouldEscalate
                  ? "Sim"
                  : "Não"
            }
          />
          <DetectedSignalsBox signals={analysis.detectedSignals} />
          {analysis.summary ? (
            <View style={styles.summaryBox}>
              <AppText variant="caption" tone="muted">
                Resumo de apoio
              </AppText>
              <AppText style={styles.summaryText}>{analysis.summary}</AppText>
            </View>
          ) : null}
          {analysis.failureReason ? (
            <View style={styles.failureBox}>
              <Feather name="alert-circle" size={22} color={colors.danger} />
              <AppText variant="caption" style={styles.failureText}>
                {analysis.failureReason}
              </AppText>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.analysisEmpty}>
          <Feather
            name={evidenceIcon[record.type]}
            size={22}
            color={colors.plum}
          />
          <AppText
            variant="caption"
            tone="muted"
            style={styles.analysisEmptyText}
          >
            Nenhum resultado de apoio salvo para esta evidência.
          </AppText>
        </View>
      )}

      <Button
        loading={loading}
        onPress={onAnalyze}
        style={styles.stretchButton}
      >
        Solicitar análise
      </Button>
    </View>
  );
}

function DetectedSignalsBox({ signals }: { signals: unknown }) {
  const entries = getDetectedSignalEntries(signals);

  if (entries.length === 0) {
    return (
      <View style={styles.summaryBox}>
        <AppText variant="caption" tone="muted">
          Sinais detectados
        </AppText>
        <AppText style={styles.summaryText}>
          Nenhum sinal estruturado foi retornado.
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.signalList}>
      <AppText variant="caption" tone="muted">
        Sinais detectados
      </AppText>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.signalRow}>
          <AppText variant="caption" style={styles.signalKey}>
            {formatSignalKey(key)}
          </AppText>
          <AppText variant="caption" style={styles.signalValue}>
            {formatSignalValue(value)}
          </AppText>
        </View>
      ))}
    </View>
  );
}

function DarkTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.darkTile}>
      <AppText variant="caption" style={styles.darkTileLabel}>
        {label}
      </AppText>
      <AppText variant="label" tone="cream" numberOfLines={1}>
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
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText variant="caption" style={styles.infoValue}>
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

function normalizeParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getMetadataEntries(record: EvidenceRecord) {
  if (!record.metadata) {
    return [];
  }

  return Object.entries(record.metadata)
    .filter(([key]) => key !== "localUri")
    .slice(0, 12);
}

function formatMetadataValue(value: VeraMetadataValue) {
  if (value === null) {
    return "nulo";
  }

  const text = String(value);

  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
}

function getDetectedSignalEntries(signals: unknown) {
  if (!signals || typeof signals !== "object" || Array.isArray(signals)) {
    return [];
  }

  return Object.entries(signals as Record<string, unknown>).slice(0, 8);
}

function formatSignalKey(key: string) {
  return key
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatSignalValue(value: unknown) {
  if (value === null || value === undefined) {
    return "Não informado";
  }

  if (Array.isArray(value)) {
    return value.length === 0
      ? "Nenhum"
      : value.map((item) => String(item)).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatAnalysisStatus(analysis: EvidenceAnalysis) {
  return analysis.status === "COMPLETED" ? "Concluida" : "Falhou";
}

function formatAlertLevel(level: AlertLevel | null) {
  if (!level) {
    return "Não informado";
  }

  return level === "CRITICAL" ? "Crítico" : "Normal";
}

function formatConfidence(value: number | null) {
  if (value === null) {
    return "Não informado";
  }

  return `${Math.round(value * 100)}%`;
}

function formatShortId(id: string) {
  return `#${id.slice(0, 6)}`;
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

function formatNullableDateTime(value: string | null) {
  if (!value) {
    return "Não registrado";
  }

  return formatDateTime(value);
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
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 0,
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.16)",
    borderRadius: 22,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
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
  pressed: {
    opacity: 0.72,
  },
  loadingPanel: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  heroPanel: {
    gap: spacing[5],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.12)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  heroHeader: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  typeIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  darkTile: {
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
  darkTileLabel: {
    color: "rgba(255, 245, 236, 0.58)",
    textTransform: "uppercase",
  },
  panel: {
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  panelHeader: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  panelIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.mint,
  },
  panelCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  hashBox: {
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(32, 37, 123, 0.08)",
  },
  hashValue: {
    color: colors.ink,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  verificationBadge: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(180, 35, 66, 0.08)",
  },
  verificationBadgeOk: {
    backgroundColor: colors.mint,
  },
  verificationText: {
    flex: 1,
    color: colors.danger,
  },
  verificationTextOk: {
    color: colors.ink,
    fontWeight: "800",
  },
  stretchButton: {
    alignSelf: "stretch",
    width: "100%",
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
  infoValue: {
    color: colors.ink,
    fontWeight: "800",
  },
  metadataList: {
    gap: spacing[2],
  },
  analysisResult: {
    gap: spacing[2],
  },
  analysisEmpty: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(32, 37, 123, 0.08)",
  },
  analysisEmptyText: {
    flex: 1,
  },
  summaryBox: {
    gap: spacing[2],
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  summaryText: {
    color: colors.ink,
    lineHeight: 21,
  },
  signalList: {
    gap: spacing[2],
    marginTop: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(32, 37, 123, 0.06)",
  },
  signalRow: {
    gap: spacing[1],
    paddingBottom: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20, 16, 17, 0.08)",
  },
  signalKey: {
    color: colors.plum,
    fontWeight: "800",
  },
  signalValue: {
    color: colors.ink,
  },
  failureBox: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    marginTop: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(180, 35, 66, 0.08)",
  },
  failureText: {
    flex: 1,
    color: colors.danger,
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
});
