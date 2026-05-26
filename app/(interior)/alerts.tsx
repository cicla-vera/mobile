import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { colors, radius, spacing } from "@/constants/theme";
import {
  useActiveAlertSessionQuery,
  useCloseAlertSessionMutation,
  useStartManualAlertSessionMutation,
} from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import { requestVeraForegroundLocationPermission } from "@/services/vera";
import type {
  AlertSession,
  AlertStatus,
  StartManualAlertSessionRequest,
} from "@/types/vera.types";

const MESSAGE_MAX_LENGTH = 240;

type AlertLocation = {
  latitude: number;
  longitude: number;
};

export default function VeraAlertsRoute() {
  const activeAlertQuery = useActiveAlertSessionQuery();
  const startManualAlertMutation = useStartManualAlertSessionMutation();
  const closeAlertMutation = useCloseAlertSessionMutation();
  const [message, setMessage] = useState("");
  const [initialLocation, setInitialLocation] = useState<AlertLocation | null>(
    null,
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isReadingLocation, setIsReadingLocation] = useState(false);

  const activeAlert = activeAlertQuery.data ?? null;
  const isMutating =
    startManualAlertMutation.isPending || closeAlertMutation.isPending;
  const queryError = activeAlertQuery.isError
    ? getApiErrorMessage(
        activeAlertQuery.error,
        "Nao deu para carregar o estado de alerta agora.",
      )
    : null;
  const mutationError = startManualAlertMutation.error
    ? getApiErrorMessage(
        startManualAlertMutation.error,
        "Nao deu para iniciar o alerta agora.",
      )
    : closeAlertMutation.error
      ? getApiErrorMessage(
          closeAlertMutation.error,
          "Nao deu para encerrar o alerta agora.",
        )
      : null;

  function resetMutationState() {
    startManualAlertMutation.reset();
    closeAlertMutation.reset();
  }

  function handleMessageChange(value: string) {
    setMessage(value.slice(0, MESSAGE_MAX_LENGTH));
    setFormError(null);
    setFeedback(null);
    resetMutationState();
  }

  async function handleUseCurrentLocation() {
    setIsReadingLocation(true);
    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      const permission = await requestVeraForegroundLocationPermission();

      if (!permission.granted) {
        setInitialLocation(null);
        setFormError(
          permission.canAskAgain
            ? "Permissao de localizacao negada. O alerta ainda pode ser iniciado sem coordenadas."
            : "Permissao de localizacao bloqueada. O alerta ainda pode ser iniciado sem coordenadas.",
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setInitialLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setFeedback("Localizacao anexada ao alerta.");
    } catch {
      setInitialLocation(null);
      setFormError(
        "Nao deu para obter sua localizacao agora. O alerta ainda pode ser iniciado sem coordenadas.",
      );
    } finally {
      setIsReadingLocation(false);
    }
  }

  function handleLongPressStart() {
    if (activeAlert || isMutating || activeAlertQuery.isLoading) {
      return;
    }

    const trimmedMessage = message.trim();

    if (trimmedMessage.length > MESSAGE_MAX_LENGTH) {
      setFormError("Mensagem deve ter no maximo 240 caracteres.");
      return;
    }

    Alert.alert(
      "Iniciar alerta manual",
      initialLocation
        ? "Um alerta Vera sera iniciado com sua localizacao aproximada."
        : "Um alerta Vera sera iniciado sem coordenadas iniciais.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Iniciar",
          style: "destructive",
          onPress: () => {
            void startManualAlert();
          },
        },
      ],
    );
  }

  async function startManualAlert() {
    const payload = buildStartPayload(message, initialLocation);

    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      const session = await startManualAlertMutation.mutateAsync(payload);

      setMessage("");
      setInitialLocation(null);
      setFeedback(
        session.alreadyActive
          ? "Ja havia um alerta ativo. Exibindo a sessao em andamento."
          : "Alerta manual iniciado.",
      );
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  function handleCloseAlert(status: Exclude<AlertStatus, "ACTIVE">) {
    if (!activeAlert) {
      return;
    }

    const isCancelled = status === "CANCELLED";

    Alert.alert(
      isCancelled ? "Cancelar alerta" : "Encerrar alerta",
      isCancelled
        ? "Isso registra a sessao como cancelada e remove o estado ativo."
        : "Isso registra a sessao como resolvida e remove o estado ativo.",
      [
        { text: "Voltar", style: "cancel" },
        {
          text: isCancelled ? "Cancelar alerta" : "Encerrar",
          style: isCancelled ? "destructive" : "default",
          onPress: () => {
            void closeAlert(activeAlert, status);
          },
        },
      ],
    );
  }

  async function closeAlert(
    session: AlertSession,
    status: Exclude<AlertStatus, "ACTIVE">,
  ) {
    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      await closeAlertMutation.mutateAsync({
        id: session.id,
        payload: {
          status,
          message:
            status === "CANCELLED"
              ? "Cancelado manualmente no app."
              : "Resolvido manualmente no app.",
        },
      });

      setFeedback(
        status === "CANCELLED" ? "Alerta cancelado." : "Alerta encerrado.",
      );
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        {activeAlertQuery.isLoading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.mint} size="large" />
            <AppText variant="caption" style={styles.darkMuted}>
              Verificando alerta ativo...
            </AppText>
          </View>
        ) : null}

        {queryError ? (
          <Message
            text={queryError}
            actionLabel="Tentar de novo"
            onAction={() => void activeAlertQuery.refetch()}
          />
        ) : null}

        {activeAlert ? (
          <ActiveAlertPanel
            disabled={isMutating}
            onCancel={() => handleCloseAlert("CANCELLED")}
            onRefresh={() => void activeAlertQuery.refetch()}
            onResolve={() => handleCloseAlert("RESOLVED")}
            refreshing={activeAlertQuery.isFetching}
            session={activeAlert}
          />
        ) : (
          <ManualAlertPanel
            disabled={isMutating || activeAlertQuery.isLoading}
            formError={formError}
            initialLocation={initialLocation}
            isReadingLocation={isReadingLocation}
            message={message}
            onLongPressStart={handleLongPressStart}
            onMessageChange={handleMessageChange}
            onUseCurrentLocation={handleUseCurrentLocation}
          />
        )}

        {mutationError ? <Message text={mutationError} /> : null}

        {feedback ? (
          <View style={styles.feedback}>
            <Feather name="check" size={16} color={colors.ink} />
            <AppText variant="caption" style={styles.feedbackText}>
              {feedback}
            </AppText>
          </View>
        ) : null}

        <View style={styles.infoPanel}>
          <Feather name="shield" size={17} color={colors.mint} />
          <AppText variant="caption" style={styles.infoText}>
            Acoes de alerta ficam dentro da camada Vera e exigem confirmacao
            antes de iniciar ou encerrar uma sessao.
          </AppText>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function buildStartPayload(
  message: string,
  initialLocation: AlertLocation | null,
): StartManualAlertSessionRequest {
  const trimmedMessage = message.trim();

  return {
    ...(trimmedMessage ? { message: trimmedMessage } : {}),
    ...(initialLocation
      ? {
          initialLatitude: initialLocation.latitude,
          initialLongitude: initialLocation.longitude,
        }
      : {}),
  };
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
          Alertas
        </AppText>
      </View>
    </View>
  );
}

function ManualAlertPanel({
  disabled,
  formError,
  initialLocation,
  isReadingLocation,
  message,
  onLongPressStart,
  onMessageChange,
  onUseCurrentLocation,
}: {
  disabled: boolean;
  formError: string | null;
  initialLocation: AlertLocation | null;
  isReadingLocation: boolean;
  message: string;
  onLongPressStart: () => void;
  onMessageChange: (value: string) => void;
  onUseCurrentLocation: () => void;
}) {
  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelIconDanger}>
          <Feather name="radio" size={20} color={colors.ink} />
        </View>
        <View style={styles.panelCopy}>
          <AppText variant="label" style={styles.panelTitle}>
            Acionamento manual
          </AppText>
          <AppText variant="caption" tone="muted">
            Pressione e segure para evitar disparos acidentais.
          </AppText>
        </View>
      </View>

      <TextField
        accessibilityLabel="Mensagem opcional do alerta"
        error={formError?.startsWith("Mensagem") ? formError : undefined}
        label="Mensagem opcional"
        maxLength={MESSAGE_MAX_LENGTH}
        multiline
        onChangeText={onMessageChange}
        placeholder="Contexto curto para a sessao"
        returnKeyType="done"
        style={styles.messageInput}
        textAlignVertical="top"
        value={message}
      />

      <Pressable
        accessibilityRole="button"
        disabled={disabled || isReadingLocation}
        onPress={onUseCurrentLocation}
        style={({ pressed }) => [
          styles.locationButton,
          pressed && styles.pressed,
          (disabled || isReadingLocation) && styles.disabledAction,
        ]}
      >
        <View style={styles.locationIcon}>
          {isReadingLocation ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Feather name="crosshair" size={17} color={colors.ink} />
          )}
        </View>
        <View style={styles.locationCopy}>
          <AppText variant="label">
            {initialLocation ? "Localizacao anexada" : "Anexar localizacao"}
          </AppText>
          <AppText variant="caption" tone="muted">
            {initialLocation
              ? `${formatCoordinate(initialLocation.latitude)}, ${formatCoordinate(
                  initialLocation.longitude,
                )}`
              : "O alerta funciona mesmo sem permissao."}
          </AppText>
        </View>
      </Pressable>

      {formError && !formError.startsWith("Mensagem") ? (
        <Message text={formError} compact />
      ) : null}

      <Pressable
        accessibilityRole="button"
        delayLongPress={1200}
        disabled={disabled}
        onLongPress={onLongPressStart}
        onPress={() => undefined}
        style={({ pressed }) => [
          styles.holdButton,
          pressed && !disabled && styles.holdButtonPressed,
          disabled && styles.disabledAction,
        ]}
      >
        <View style={styles.holdIcon}>
          <Feather name="alert-octagon" size={22} color={colors.cream} />
        </View>
        <View style={styles.holdCopy}>
          <AppText variant="label" tone="cream">
            Pressione e segure
          </AppText>
          <AppText variant="caption" style={styles.holdText}>
            Solte depois da confirmacao para abrir a sessao.
          </AppText>
        </View>
      </Pressable>
    </View>
  );
}

function ActiveAlertPanel({
  disabled,
  onCancel,
  onRefresh,
  onResolve,
  refreshing,
  session,
}: {
  disabled: boolean;
  onCancel: () => void;
  onRefresh: () => void;
  onResolve: () => void;
  refreshing: boolean;
  session: AlertSession;
}) {
  return (
    <View style={styles.activePanel}>
      <View style={styles.activeHeader}>
        <View style={styles.activeIcon}>
          <Feather name="activity" size={22} color={colors.ink} />
        </View>
        <View style={styles.activeCopy}>
          <AppText variant="label" tone="cream">
            Alerta ativo
          </AppText>
          <AppText variant="caption" style={styles.darkMuted}>
            Iniciado em {formatDateTime(session.startedAt)}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Atualizar alerta"
          disabled={refreshing}
          onPress={onRefresh}
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.pressed,
            refreshing && styles.disabledAction,
          ]}
        >
          {refreshing ? (
            <ActivityIndicator color={colors.cream} />
          ) : (
            <Feather name="refresh-cw" size={18} color={colors.cream} />
          )}
        </Pressable>
      </View>

      <View style={styles.statusGrid}>
        <StatusTile label="Status" value={formatStatus(session.status)} />
        <StatusTile label="Nivel" value={formatLevel(session.level)} />
        <StatusTile label="Origem" value={formatTrigger(session.trigger)} />
        <StatusTile label="Eventos" value={String(session.events.length)} />
      </View>

      <View style={styles.detailPanel}>
        <MetaRow
          icon="map-pin"
          label="Coordenadas"
          value={formatSessionLocation(session)}
        />
        <MetaRow
          icon="clock"
          label="Duracao"
          value={formatDuration(session.startedAt)}
        />
        {session.events[0]?.message ? (
          <MetaRow
            icon="message-circle"
            label="Mensagem"
            value={session.events[0].message}
          />
        ) : null}
      </View>

      <View style={styles.actionRow}>
        <Button
          accessibilityRole="button"
          disabled={disabled}
          loading={disabled}
          onPress={onResolve}
          style={styles.actionButtonStretch}
        >
          Encerrar
        </Button>
        <Button
          accessibilityRole="button"
          disabled={disabled}
          onPress={onCancel}
          style={styles.actionButtonStretch}
          variant="secondary"
        >
          Cancelar alerta
        </Button>
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
      <AppText variant="label" tone="cream">
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
      <Feather name={icon} size={16} color={colors.mint} />
      <View style={styles.metaCopy}>
        <AppText variant="caption" style={styles.metaLabel}>
          {label}
        </AppText>
        <AppText variant="caption" style={styles.metaValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function Message({
  text,
  actionLabel,
  onAction,
  compact,
}: {
  text: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={[styles.message, compact && styles.messageCompact]}>
      <Feather name="alert-circle" size={17} color={colors.danger} />
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

function formatCoordinate(value: number) {
  return value.toFixed(6);
}

function formatSessionLocation(session: AlertSession) {
  if (session.initialLatitude === null || session.initialLongitude === null) {
    return "Nao anexadas";
  }

  return `${formatCoordinate(session.initialLatitude)}, ${formatCoordinate(
    session.initialLongitude,
  )}`;
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

function formatLevel(level: AlertSession["level"]) {
  return level === "CRITICAL" ? "Critico" : "Normal";
}

function formatTrigger(trigger: AlertSession["trigger"]) {
  return trigger === "MANUAL" ? "Manual" : "Local";
}

function formatDuration(startedAt: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 60000),
  );

  if (minutes < 1) {
    return "Menos de 1 min";
  }

  if (minutes === 1) {
    return "1 min";
  }

  return `${minutes} min`;
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
  keyboard: {
    flex: 1,
    backgroundColor: colors.ink,
  },
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
  panel: {
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  panelHeader: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  panelIconDanger: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.coral,
  },
  panelCopy: {
    flex: 1,
    gap: 2,
  },
  panelTitle: {
    textTransform: "uppercase",
  },
  messageInput: {
    minHeight: 96,
    paddingTop: spacing[3],
  },
  locationButton: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: "rgba(32, 37, 123, 0.16)",
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  locationIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.mint,
  },
  locationCopy: {
    flex: 1,
    gap: 2,
  },
  holdButton: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.danger,
  },
  holdButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  holdIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255, 245, 236, 0.16)",
  },
  holdCopy: {
    flex: 1,
    gap: 2,
  },
  holdText: {
    color: "rgba(255, 245, 236, 0.78)",
  },
  activePanel: {
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: "rgba(242, 97, 126, 0.26)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(180, 35, 66, 0.18)",
  },
  activeHeader: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  activeIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.coral,
  },
  activeCopy: {
    flex: 1,
    gap: 2,
  },
  refreshButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.16)",
    borderRadius: 21,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  statusGrid: {
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
    backgroundColor: "rgba(255, 245, 236, 0.1)",
  },
  statusTileLabel: {
    color: "rgba(255, 245, 236, 0.66)",
    textTransform: "uppercase",
  },
  detailPanel: {
    gap: spacing[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.1)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(20, 16, 17, 0.18)",
  },
  metaRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  metaCopy: {
    flex: 1,
    gap: 2,
  },
  metaLabel: {
    color: "rgba(255, 245, 236, 0.58)",
  },
  metaValue: {
    color: colors.cream,
    fontWeight: "800",
  },
  actionRow: {
    gap: spacing[3],
  },
  actionButtonStretch: {
    alignSelf: "stretch",
  },
  feedback: {
    minHeight: 38,
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
  },
  infoPanel: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[3],
    borderWidth: 1,
    borderColor: "rgba(142, 207, 184, 0.2)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(142, 207, 184, 0.08)",
  },
  infoText: {
    flex: 1,
    color: "rgba(255, 245, 236, 0.74)",
  },
  message: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  messageCompact: {
    backgroundColor: "rgba(180, 35, 66, 0.08)",
  },
  messageText: {
    flex: 1,
    color: colors.danger,
  },
  messageAction: {
    minHeight: 30,
    justifyContent: "center",
    paddingHorizontal: spacing[2],
  },
  messageActionText: {
    fontWeight: "800",
  },
  disabledAction: {
    opacity: 0.48,
  },
});
