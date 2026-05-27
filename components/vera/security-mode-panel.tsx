import { Feather } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { colors, radius, spacing } from '@/constants/theme';
import { useSecurityMode } from '@/hooks/vera/useSecurityMode';
import { getSecurityModeOverlayActionLabel } from '@/services/vera/security-mode-overlay.service';

const statusCopy = {
  idle: 'Inativo',
  starting: 'Iniciando...',
  recording: 'Gravando em ciclo',
  post_trigger: 'Capturando pos-gatilho',
  sealing: 'Selando evidencia',
  stopping: 'Encerrando...',
  error: 'Erro',
} as const;

export function SecurityModePanel() {
  const {
    snapshot,
    isBusy,
    overlayNotice,
    start,
    stop,
    simulateTrigger,
    requestOverlayPermission,
    openOverlaySettings,
    syncOverlayPermission,
  } = useSecurityMode();
  const [actionError, setActionError] = useState<string | null>(null);
  const [overlayActionLabel, setOverlayActionLabel] = useState(
    Platform.OS === 'android' ? 'Permitir sobreposicao' : 'Permitir notificacoes',
  );

  useEffect(() => {
    void syncOverlayPermission().then((permission) => {
      setOverlayActionLabel(getSecurityModeOverlayActionLabel(permission));
    });
  }, [syncOverlayPermission, overlayNotice]);

  const statusLabel = statusCopy[snapshot.status];
  const canStart = !snapshot.isActive && !isBusy;
  const canStop = snapshot.isActive && !isBusy;
  const canSimulate =
    snapshot.isActive &&
    !isBusy &&
    snapshot.status !== 'post_trigger' &&
    snapshot.status !== 'sealing';

  async function handleStart() {
    setActionError(null);

    try {
      await start();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Nao deu para iniciar o Modo Seguranca.',
      );
    }
  }

  async function handleStop() {
    setActionError(null);

    try {
      await stop();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Nao deu para encerrar o Modo Seguranca.',
      );
    }
  }

  async function handleSimulateTrigger() {
    setActionError(null);

    try {
      await simulateTrigger();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : 'Nao deu para simular o gatilho agora.',
      );
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}>
          <Feather name="shield" size={20} color={colors.cream} />
        </View>
        <View style={styles.headerCopy}>
          <AppText variant="label">Modo Seguranca (simulacao)</AppText>
          <AppText variant="caption" tone="muted">
            Grava audio em ciclos de 2 min, simula IA e sela evidencias com
            SHA-256. Os audios ficam em Vera → Evidencias. No Android, o aviso
            disfarçado usa sobreposicao sobre outros apps.
          </AppText>
        </View>
        <View
          style={[
            styles.statusPill,
            snapshot.isActive && styles.statusPillActive,
          ]}
        >
          <AppText variant="caption" style={styles.statusText}>
            {statusLabel}
          </AppText>
        </View>
      </View>

      <View style={styles.meta}>
        {snapshot.segmentStartedAt ? (
          <MetaRow
            icon="clock"
            label={`Segmento desde ${formatClock(snapshot.segmentStartedAt)}`}
          />
        ) : null}
        {snapshot.nextSimulatedTriggerAt && snapshot.isActive ? (
          <MetaRow
            icon="zap"
            label={`Proximo gatilho aleatorio: ${formatClock(snapshot.nextSimulatedTriggerAt)}`}
          />
        ) : null}
        {snapshot.lastDetectedText ? (
          <MetaRow icon="alert-triangle" label={snapshot.lastDetectedText} />
        ) : null}
      </View>

      {snapshot.lastError || actionError ? (
        <View style={styles.errorBox}>
          <Feather name="alert-circle" size={18} color={colors.danger} />
          <AppText variant="caption" style={styles.errorText}>
            {actionError ?? snapshot.lastError}
          </AppText>
        </View>
      ) : null}

      {overlayNotice ? (
        <View style={styles.noticeBox}>
          <Feather name="bell" size={18} color={colors.blue} />
          <View style={styles.noticeCopy}>
            <AppText variant="caption" style={styles.noticeText}>
              {overlayNotice}
            </AppText>
            <View style={styles.noticeActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => void requestOverlayPermission()}
                style={({ pressed }) => [
                  styles.noticeButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppText variant="caption" tone="blue">
                  {overlayActionLabel}
                </AppText>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => void openOverlaySettings()}
                style={({ pressed }) => [
                  styles.noticeButton,
                  pressed && styles.pressed,
                ]}
              >
                <AppText variant="caption" tone="blue">
                  Abrir ajustes
                </AppText>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={!canStart}
          loading={isBusy && !snapshot.isActive}
          onPress={handleStart}
          style={styles.actionButton}
        >
          Iniciar
        </Button>
        <Button
          disabled={!canStop}
          loading={isBusy && snapshot.isActive}
          onPress={handleStop}
          style={styles.actionButton}
          variant="ghost"
        >
          Parar
        </Button>
      </View>

      <Button
        disabled={!canSimulate}
        onPress={handleSimulateTrigger}
        style={styles.simulateButton}
        variant="secondary"
      >
        Simular gatilho de violencia
      </Button>
    </Card>
  );
}

function MetaRow({
  icon,
  label,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metaRow}>
      <Feather name={icon} size={16} color={colors.blue} />
      <AppText variant="caption" tone="muted" style={styles.metaText}>
        {label}
      </AppText>
    </View>
  );
}

function formatClock(value: string) {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

const styles = StyleSheet.create({
  card: {
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.plum,
  },
  headerCopy: {
    flex: 1,
    gap: spacing[1],
  },
  statusPill: {
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    borderRadius: radius.pill,
    backgroundColor: colors.shell,
  },
  statusPillActive: {
    backgroundColor: 'rgba(142, 207, 184, 0.32)',
  },
  statusText: {
    fontWeight: '800',
    color: colors.ink,
  },
  meta: {
    gap: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  metaText: {
    flex: 1,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  errorText: {
    flex: 1,
    color: colors.danger,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(32, 37, 123, 0.08)',
  },
  noticeCopy: {
    flex: 1,
    gap: spacing[2],
  },
  noticeText: {
    color: colors.ink,
  },
  noticeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  noticeButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
  },
  simulateButton: {
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.72,
  },
});
