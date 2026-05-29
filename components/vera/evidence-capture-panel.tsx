import { Feather } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import * as DocumentPicker from 'expo-document-picker';
import {
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { colors, radius, spacing } from '@/constants/theme';
import {
  useEnqueueEvidenceUploadMutation,
  useEvidenceUploadQueueQuery,
  useFlushEvidenceUploadQueueMutation,
  useRemoveQueuedEvidenceUploadMutation,
  useRetryQueuedEvidenceUploadMutation,
} from '@/hooks/vera';
import { getApiErrorMessage } from '@/services/api-error';
import {
  getQueuedEvidenceUploadRetryDelayMs,
  requestVeraAudioRecordingPermission,
  requestVeraCameraPermission,
  type QueuedEvidenceUpload,
} from '@/services/vera';
import type { EvidenceType, VeraMetadata } from '@/types/vera.types';

type EvidenceCapturePanelProps = {
  alertSessionId: string;
};

type CaptureAction = 'audio' | 'camera' | 'file';

const uploadStatusCopy: Record<
  QueuedEvidenceUpload['status'],
  { icon: keyof typeof Feather.glyphMap; label: string; tone: string }
> = {
  failed: {
    icon: 'alert-circle',
    label: 'Erro',
    tone: colors.danger,
  },
  pending: {
    icon: 'clock',
    label: 'Pendente',
    tone: colors.soft,
  },
  uploaded: {
    icon: 'check-circle',
    label: 'Enviado',
    tone: colors.mint,
  },
  uploading: {
    icon: 'loader',
    label: 'Enviando',
    tone: colors.sky,
  },
};

const evidenceIcon: Record<EvidenceType, keyof typeof Feather.glyphMap> = {
  AUDIO: 'mic',
  FILE: 'file-text',
  IMAGE: 'image',
  VIDEO: 'video',
};

export function EvidenceCapturePanel({
  alertSessionId,
}: EvidenceCapturePanelProps) {
  const cameraRef = useRef<CameraView>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const audioState = useAudioRecorderState(audioRecorder);
  const enqueueMutation = useEnqueueEvidenceUploadMutation();
  const flushMutation = useFlushEvidenceUploadQueueMutation();
  const [activeCamera, setActiveCamera] = useState(false);
  const [busyAction, setBusyAction] = useState<CaptureAction | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const queueError =
    enqueueMutation.error || flushMutation.error
      ? getApiErrorMessage(
          enqueueMutation.error ?? flushMutation.error,
          'Não deu para enviar agora. A evidência ficou na fila local.',
        )
      : null;
  const isBusy = Boolean(busyAction) || enqueueMutation.isPending;

  async function enqueueAndFlush(input: {
    fileName: string;
    metadata: VeraMetadata;
    mimeType: string;
    size?: number;
    sourceUri: string;
    type: EvidenceType;
  }) {
    setFeedback(null);
    setLocalError(null);

    const queued = await enqueueMutation.mutateAsync({
      alertSessionId,
      ...input,
    });
    const result = await flushMutation.mutateAsync(alertSessionId);

    setFeedback(
      result.failed.some((item) => item.id === queued.id)
        ? 'Evidência guardada na fila local.'
        : 'Evidência enviada ao cofre.',
    );
  }

  async function handlePickFile() {
    setBusyAction('file');

    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: '*/*',
      });

      if (result.canceled || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      const type = inferEvidenceType(asset.mimeType, asset.name);

      await enqueueAndFlush({
        fileName: asset.name ?? createDefaultFileName(type),
        metadata: {
          capturedAt: new Date().toISOString(),
          source: 'document_picker',
        },
        mimeType: asset.mimeType ?? getDefaultMimeType(type),
        size: asset.size,
        sourceUri: asset.uri,
        type,
      });
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Não deu para selecionar o arquivo.',
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleOpenCamera() {
    setBusyAction('camera');
    setLocalError(null);

    try {
      const permission = await requestVeraCameraPermission();

      if (!permission.granted) {
        setLocalError('Permissão de câmera negada.');
        return;
      }

      setActiveCamera(true);
    } catch {
      setLocalError('Câmera indisponível neste ambiente.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleTakePhoto() {
    if (!cameraRef.current) {
      return;
    }

    setBusyAction('camera');

    try {
      const picture = await cameraRef.current.takePictureAsync({
        quality: 0.72,
      });

      await enqueueAndFlush({
        fileName: `vera-photo-${Date.now()}.jpg`,
        metadata: {
          capturedAt: new Date().toISOString(),
          height: picture.height,
          source: 'camera_photo',
          width: picture.width,
        },
        mimeType: 'image/jpeg',
        sourceUri: picture.uri,
        type: 'IMAGE',
      });
      setActiveCamera(false);
    } catch (error) {
      setLocalError(
        error instanceof Error
          ? error.message
          : 'Não deu para capturar a imagem.',
      );
    } finally {
      setBusyAction(null);
    }
  }

  async function handleStartAudio() {
    setBusyAction('audio');
    setLocalError(null);

    try {
      const permission = await requestVeraAudioRecordingPermission();

      if (!permission.granted) {
        setLocalError('Permissão de microfone negada.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch {
      setLocalError('Não deu para iniciar a gravação.');
    } finally {
      setBusyAction(null);
    }
  }

  async function handleStopAudio() {
    setBusyAction('audio');

    try {
      await audioRecorder.stop();
      await setAudioModeAsync({ allowsRecording: false });

      const uri = audioRecorder.uri ?? audioState.url;

      if (!uri) {
        setLocalError('Áudio finalizado sem arquivo local.');
        return;
      }

      await enqueueAndFlush({
        fileName: `vera-audio-${Date.now()}.m4a`,
        metadata: {
          capturedAt: new Date().toISOString(),
          durationMillis: audioState.durationMillis,
          source: 'microphone',
        },
        mimeType: 'audio/mp4',
        sourceUri: uri,
        type: 'AUDIO',
      });
    } catch {
      setLocalError('Não deu para finalizar a gravação.');
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <View style={styles.panel}>
      <View style={styles.panelHeader}>
        <View style={styles.panelIcon}>
          <Feather name="plus-circle" size={22} color={colors.ink} />
        </View>
        <View style={styles.panelCopy}>
          <AppText variant="label" tone="cream">
            Captura consentida
          </AppText>
          <AppText variant="caption" style={styles.mutedOnDark}>
            Adicione arquivos, fotos ou áudio a esta sessão.
          </AppText>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <ActionButton
          disabled={isBusy || audioState.isRecording}
          icon="file-plus"
          label="Arquivo"
          loading={busyAction === 'file'}
          onPress={() => void handlePickFile()}
        />
        <ActionButton
          disabled={isBusy || audioState.isRecording}
          icon="camera"
          label="Foto"
          loading={busyAction === 'camera' && !activeCamera}
          onPress={() => void handleOpenCamera()}
        />
        <ActionButton
          disabled={isBusy}
          icon={audioState.isRecording ? 'square' : 'mic'}
          label={
            audioState.isRecording
              ? formatRecordingTime(audioState.durationMillis)
              : 'Áudio'
          }
          loading={busyAction === 'audio'}
          onPress={() =>
            audioState.isRecording
              ? void handleStopAudio()
              : void handleStartAudio()
          }
        />
      </View>

      {activeCamera ? (
        <View style={styles.cameraPanel}>
          <CameraView ref={cameraRef} facing="back" style={styles.camera} />
          <View style={styles.cameraActions}>
            <Button
              disabled={busyAction === 'camera'}
              onPress={() => setActiveCamera(false)}
              variant="secondary"
            >
              Cancelar
            </Button>
            <Button
              loading={busyAction === 'camera'}
              onPress={() => void handleTakePhoto()}
            >
              Capturar
            </Button>
          </View>
        </View>
      ) : null}

      {feedback ? (
        <View style={styles.feedback}>
          <Feather name="check" size={20} color={colors.mint} />
          <AppText variant="caption" style={styles.feedbackText}>
            {feedback}
          </AppText>
        </View>
      ) : null}

      {localError || queueError ? (
        <View style={styles.errorMessage}>
          <Feather name="alert-circle" size={20} color={colors.danger} />
          <AppText variant="caption" style={styles.errorText}>
            {localError ?? queueError}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

export function EvidenceUploadQueuePanel({
  alertSessionId,
}: EvidenceCapturePanelProps) {
  const queueQuery = useEvidenceUploadQueueQuery(alertSessionId);
  const retryMutation = useRetryQueuedEvidenceUploadMutation();
  const removeMutation = useRemoveQueuedEvidenceUploadMutation();
  const visibleItems = (queueQuery.data ?? []).filter(
    (item) => item.status !== 'uploaded',
  );

  if (!queueQuery.isLoading && visibleItems.length === 0) {
    return null;
  }

  return (
    <View style={styles.queuePanel}>
      <View style={styles.queueHeader}>
        <View style={styles.panelIcon}>
          <Feather name="upload-cloud" size={22} color={colors.ink} />
        </View>
        <View style={styles.panelCopy}>
          <AppText variant="label" tone="cream">
            Fila local
          </AppText>
          <AppText variant="caption" style={styles.mutedOnDark}>
            Itens aguardando envio ao cofre.
          </AppText>
        </View>
      </View>

      {queueQuery.isLoading ? (
        <View style={styles.queueLoading}>
          <ActivityIndicator color={colors.mint} />
          <AppText variant="caption" style={styles.mutedOnDark}>
            Lendo fila...
          </AppText>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.queueRow}>
            {visibleItems.map((item) => (
              <QueuedUploadCard
                key={item.id}
                item={item}
                removing={removeMutation.isPending}
                retrying={retryMutation.isPending}
                onRemove={() =>
                  void removeMutation.mutate({
                    alertSessionId,
                    id: item.id,
                  })
                }
                onRetry={() => void retryMutation.mutate(item.id)}
              />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function ActionButton({
  disabled,
  icon,
  label,
  loading,
  onPress,
}: {
  disabled?: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  loading?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.cream} />
      ) : (
        <Feather name={icon} size={24} color={colors.cream} />
      )}
      <AppText variant="caption" style={styles.actionText}>
        {label}
      </AppText>
    </Pressable>
  );
}

function QueuedUploadCard({
  item,
  onRemove,
  onRetry,
  removing,
  retrying,
}: {
  item: QueuedEvidenceUpload;
  onRemove: () => void;
  onRetry: () => void;
  removing: boolean;
  retrying: boolean;
}) {
  const status = uploadStatusCopy[item.status];
  const retryDelayMs = getQueuedEvidenceUploadRetryDelayMs(item);
  const retryLabel =
    retryDelayMs > 0 ? ` - nova em ${formatRetryDelay(retryDelayMs)}` : '';

  return (
    <View style={styles.queueCard}>
      <View style={styles.queueCardHeader}>
        <View
          style={[
            styles.queueTypeIcon,
            item.type === 'IMAGE' && styles.queueTypeIconImage,
          ]}
        >
          <Feather
            name={evidenceIcon[item.type]}
            size={20}
            color={item.type === 'IMAGE' ? colors.ink : colors.cream}
          />
        </View>
        <View style={styles.queueCardCopy}>
          <AppText
            numberOfLines={1}
            variant="caption"
            style={styles.queueTitle}
          >
            {item.fileName}
          </AppText>
          <View style={styles.queueStatusRow}>
            <Feather name={status.icon} size={16} color={status.tone} />
            <AppText variant="caption" style={styles.queueStatusText}>
              {status.label} - tentativa {item.attempts}
              {retryLabel}
            </AppText>
          </View>
        </View>
      </View>

      {item.errorMessage ? (
        <AppText variant="caption" style={styles.queueError} numberOfLines={2}>
          {item.errorMessage}
        </AppText>
      ) : null}

      <View style={styles.queueActions}>
        <Pressable
          accessibilityRole="button"
          disabled={retrying || item.status === 'uploading'}
          onPress={onRetry}
          style={({ pressed }) => [
            styles.queueIconButton,
            pressed && styles.pressed,
          ]}
        >
          <Feather name="refresh-cw" size={18} color={colors.cream} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={removing || item.status === 'uploading'}
          onPress={onRemove}
          style={({ pressed }) => [
            styles.queueIconButton,
            pressed && styles.pressed,
          ]}
        >
          <Feather name="trash-2" size={18} color={colors.danger} />
        </Pressable>
      </View>
    </View>
  );
}

function formatRetryDelay(delayMs: number) {
  const seconds = Math.ceil(delayMs / 1000);

  if (seconds < 60) {
    return `${seconds}s`;
  }

  return `${Math.ceil(seconds / 60)}min`;
}

function inferEvidenceType(mimeType?: string | null, name?: string | null) {
  const lowerMime = mimeType?.toLowerCase() ?? '';
  const lowerName = name?.toLowerCase() ?? '';

  if (lowerMime.startsWith('audio/') || lowerName.match(/\.(m4a|mp3|wav)$/)) {
    return 'AUDIO';
  }

  if (lowerMime.startsWith('video/') || lowerName.match(/\.(mov|mp4|webm)$/)) {
    return 'VIDEO';
  }

  if (lowerMime.startsWith('image/') || lowerName.match(/\.(jpg|jpeg|png)$/)) {
    return 'IMAGE';
  }

  return 'FILE';
}

function getDefaultMimeType(type: EvidenceType) {
  const mimeByType: Record<EvidenceType, string> = {
    AUDIO: 'audio/mp4',
    FILE: 'application/octet-stream',
    IMAGE: 'image/jpeg',
    VIDEO: 'video/mp4',
  };

  return mimeByType[type];
}

function createDefaultFileName(type: EvidenceType) {
  const extensionByType: Record<EvidenceType, string> = {
    AUDIO: 'm4a',
    FILE: 'bin',
    IMAGE: 'jpg',
    VIDEO: 'mp4',
  };

  return `vera-evidence-${Date.now()}.${extensionByType[type]}`;
}

function formatRecordingTime(durationMillis: number) {
  const seconds = Math.max(0, Math.floor(durationMillis / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing[4],
    padding: spacing[5],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.14)',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  panelIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.mint,
  },
  panelCopy: {
    flex: 1,
    gap: spacing[1],
  },
  mutedOnDark: {
    color: 'rgba(255, 245, 236, 0.68)',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  actionButton: {
    flex: 1,
    minHeight: 78,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.14)',
  },
  actionText: {
    color: colors.cream,
    textAlign: 'center',
  },
  cameraPanel: {
    overflow: 'hidden',
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.16)',
  },
  camera: {
    height: 300,
  },
  cameraActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[3],
    padding: spacing[3],
    backgroundColor: 'rgba(255, 245, 236, 0.08)',
  },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(142, 207, 184, 0.14)',
  },
  feedbackText: {
    flex: 1,
    color: colors.cream,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(180, 35, 66, 0.12)',
  },
  errorText: {
    flex: 1,
    color: colors.cream,
  },
  queuePanel: {
    gap: spacing[4],
    padding: spacing[5],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.12)',
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  queueLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  queueRow: {
    flexDirection: 'row',
    gap: spacing[3],
    paddingRight: spacing[4],
  },
  queueCard: {
    width: 250,
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(20, 16, 17, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255, 245, 236, 0.12)',
  },
  queueCardHeader: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  queueTypeIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.plum,
  },
  queueTypeIconImage: {
    backgroundColor: colors.mint,
  },
  queueCardCopy: {
    flex: 1,
    gap: spacing[1],
  },
  queueTitle: {
    color: colors.cream,
  },
  queueStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  queueStatusText: {
    color: 'rgba(255, 245, 236, 0.7)',
  },
  queueError: {
    color: colors.shell,
  },
  queueActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[2],
  },
  queueIconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 245, 236, 0.08)',
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.55,
  },
});
