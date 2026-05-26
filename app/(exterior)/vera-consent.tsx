import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { colors, radius, spacing } from '@/constants/theme';
import {
  useUpdateVeraProfileMutation,
  useVeraNativeCapabilitiesQuery,
  useVeraProfileQuery,
} from '@/hooks/vera';
import { getApiErrorMessage } from '@/services/api-error';
import {
  requestVeraAudioRecordingPermission,
  requestVeraBackgroundLocationPermission,
  requestVeraCameraMicrophonePermission,
  requestVeraCameraPermission,
  requestVeraForegroundLocationPermission,
  requestVeraNotificationPermission,
  type VeraNativeCapabilityStatus,
  type VeraNativePermissionSnapshot,
} from '@/services/vera';

type PermissionKey = 'location' | 'notifications' | 'camera' | 'audio';
type PermissionState = 'granted' | 'denied' | 'pending' | 'unavailable';
type FeatherIconName = keyof typeof Feather.glyphMap;

type PermissionItem = {
  key: PermissionKey;
  icon: FeatherIconName;
  title: string;
  copy: string;
  state: PermissionState;
  detail: string;
  request: () => Promise<void>;
};

const statusLabels: Record<PermissionState, string> = {
  granted: 'Concedida',
  denied: 'Negada',
  pending: 'Pendente',
  unavailable: 'Indisponivel',
};

export default function VeraConsentRoute() {
  const profileQuery = useVeraProfileQuery();
  const capabilitiesQuery = useVeraNativeCapabilitiesQuery();
  const updateProfileMutation = useUpdateVeraProfileMutation();
  const [accepted, setAccepted] = useState(false);
  const [pendingPermission, setPendingPermission] =
    useState<PermissionKey | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const permissionItems = buildPermissionItems(
    capabilitiesQuery.data,
    makePermissionRequest('location', async () => {
      const foreground = await requestVeraForegroundLocationPermission();

      if (foreground.granted) {
        await requestVeraBackgroundLocationPermission();
      }
    }),
    makePermissionRequest('notifications', requestVeraNotificationPermission),
    makePermissionRequest('camera', async () => {
      await requestVeraCameraPermission();
      await requestVeraCameraMicrophonePermission();
    }),
    makePermissionRequest('audio', requestVeraAudioRecordingPermission),
  );

  if (profileQuery.isLoading) {
    return (
      <Screen style={styles.loadingScreen}>
        <ActivityIndicator color={colors.blue} size="large" />
      </Screen>
    );
  }

  if (profileQuery.data?.consentAccepted) {
    return <Redirect href="/(exterior)/vera-unlock" />;
  }

  const profileError = profileQuery.isError
    ? getApiErrorMessage(
        profileQuery.error,
        'Nao deu para carregar seu perfil Vera agora.',
      )
    : null;
  const saveError = updateProfileMutation.error
    ? getApiErrorMessage(
        updateProfileMutation.error,
        'Nao deu para salvar o consentimento agora.',
      )
    : null;
  const canContinue =
    accepted &&
    !profileQuery.isError &&
    !updateProfileMutation.isPending &&
    !pendingPermission;

  function makePermissionRequest(
    key: PermissionKey,
    request: () => Promise<unknown>,
  ) {
    return async () => {
      if (pendingPermission) {
        return;
      }

      setPendingPermission(key);
      setPermissionError(null);

      try {
        await request();
        await capabilitiesQuery.refetch();
      } catch {
        setPermissionError(
          'Nao deu para abrir a permissao agora. Voce ainda pode continuar e ajustar depois.',
        );
      } finally {
        setPendingPermission(null);
      }
    };
  }

  async function handleContinue() {
    if (!canContinue) {
      return;
    }

    try {
      await updateProfileMutation.mutateAsync({
        consentAccepted: true,
        veraEnabled: true,
        monitoringEnabled: false,
      });

      router.replace('/(exterior)/vera-unlock');
    } catch {
      // Mutation state renders the user-facing error.
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => router.replace('/(exterior)')}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Feather name="arrow-left" size={20} color={colors.cream} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.mark}>
            <Feather name="shield" size={24} color={colors.cream} />
          </View>
          <AppText variant="label" tone="pink" style={styles.eyebrow}>
            Vera
          </AppText>
          <AppText variant="title" style={styles.title}>
            Consentimento e permissoes
          </AppText>
          <AppText tone="muted" style={styles.copy}>
            A camada Vera so e ativada por escolha sua. Nenhum monitoramento,
            alerta ou evidencia comeca antes deste aceite.
          </AppText>
        </View>

        <View style={styles.section}>
          <InfoStrip
            icon="lock"
            text="Evidencias ficam ligadas a sessoes de alerta. Contatos recebem resumo seguro e localizacao, nao arquivos brutos."
          />

          <View style={styles.permissions}>
            {permissionItems.map((item) => (
              <PermissionRow
                key={item.key}
                item={item}
                pending={pendingPermission === item.key}
                disabled={
                  Boolean(pendingPermission) ||
                  item.state === 'unavailable' ||
                  (item.state === 'denied' && item.detail.includes('ajustes'))
                }
              />
            ))}
          </View>

          {capabilitiesQuery.isLoading ? (
            <AppText variant="caption" tone="muted" style={styles.helperText}>
              Verificando permissoes nativas...
            </AppText>
          ) : null}

          {profileError ? (
            <Message text={profileError} />
          ) : null}
          {permissionError ? (
            <Message text={permissionError} />
          ) : null}
          {saveError ? <Message text={saveError} /> : null}

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: accepted }}
            onPress={() => setAccepted((current) => !current)}
            style={({ pressed }) => [
              styles.consentBox,
              accepted && styles.consentBoxActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
              {accepted ? (
                <Feather name="check" size={16} color={colors.cream} />
              ) : null}
            </View>
            <AppText style={styles.consentText}>
              Eu aceito ativar a camada Vera de forma consentida neste aparelho.
            </AppText>
          </Pressable>

          <Button
            accessibilityRole="button"
            disabled={!canContinue}
            loading={updateProfileMutation.isPending}
            onPress={handleContinue}
            style={styles.primaryAction}
          >
            Salvar e continuar
          </Button>

          <Button
            accessibilityRole="button"
            onPress={() => router.replace('/(exterior)')}
            style={styles.secondaryAction}
            variant="ghost"
          >
            Agora nao
          </Button>
        </View>
      </ScrollView>
    </Screen>
  );
}

function PermissionRow({
  item,
  pending,
  disabled,
}: {
  item: PermissionItem;
  pending: boolean;
  disabled: boolean;
}) {
  const statusStyle = [
    styles.statusPill,
    item.state === 'granted' && styles.statusGranted,
    item.state === 'denied' && styles.statusDenied,
    item.state === 'unavailable' && styles.statusUnavailable,
  ];

  return (
    <Card style={styles.permissionCard}>
      <View style={styles.permissionTop}>
        <View style={styles.permissionIcon}>
          <Feather name={item.icon} size={18} color={colors.cream} />
        </View>
        <View style={styles.permissionCopy}>
          <AppText variant="label">{item.title}</AppText>
          <AppText variant="caption" tone="muted" style={styles.permissionText}>
            {item.copy}
          </AppText>
        </View>
        <View style={statusStyle}>
          <AppText variant="caption" style={styles.statusText}>
            {pending ? 'Solicitando' : statusLabels[item.state]}
          </AppText>
        </View>
      </View>

      <View style={styles.permissionBottom}>
        <AppText variant="caption" tone="muted" style={styles.permissionDetail}>
          {item.detail}
        </AppText>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={item.request}
          style={({ pressed }) => [
            styles.permissionButton,
            disabled && styles.permissionButtonDisabled,
            pressed && !disabled && styles.pressed,
          ]}
        >
          {pending ? (
            <ActivityIndicator color={colors.blue} size="small" />
          ) : (
            <>
              <Feather name="unlock" size={15} color={colors.blue} />
              <AppText variant="caption" tone="blue" style={styles.buttonText}>
                Permitir
              </AppText>
            </>
          )}
        </Pressable>
      </View>
    </Card>
  );
}

function InfoStrip({
  icon,
  text,
}: {
  icon: FeatherIconName;
  text: string;
}) {
  return (
    <View style={styles.infoStrip}>
      <Feather name={icon} size={17} color={colors.blue} />
      <AppText variant="caption" tone="muted" style={styles.infoText}>
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

function buildPermissionItems(
  capabilities: VeraNativeCapabilityStatus | undefined,
  requestLocation: () => Promise<void>,
  requestNotifications: () => Promise<void>,
  requestCamera: () => Promise<void>,
  requestAudio: () => Promise<void>,
): PermissionItem[] {
  return [
    {
      key: 'location',
      icon: 'map-pin',
      title: 'Localizacao',
      copy: 'Necessaria para locais monitorados e alertas por entrada.',
      state: getLocationState(capabilities),
      detail: getLocationDetail(capabilities),
      request: requestLocation,
    },
    {
      key: 'notifications',
      icon: 'bell',
      title: 'Notificacoes discretas',
      copy: 'Permitem avisos curtos sem expor a camada Vera.',
      state: getSnapshotState(capabilities?.notifications),
      detail: getSnapshotDetail(
        capabilities?.notifications,
        'Notificacoes ainda nao foram solicitadas.',
        'Notificacoes negadas. Alertas visuais locais podem ficar limitados.',
        'Notificacoes nao estao disponiveis neste ambiente.',
      ),
      request: requestNotifications,
    },
    {
      key: 'camera',
      icon: 'camera',
      title: 'Camera',
      copy: 'Usada somente em captura consentida de evidencia.',
      state: getSnapshotState(capabilities?.camera.camera),
      detail: getSnapshotDetail(
        capabilities?.camera.camera,
        'Camera ainda nao foi solicitada.',
        'Camera negada. Voce pode seguir sem captura por imagem.',
        'Camera nao esta disponivel neste ambiente.',
      ),
      request: requestCamera,
    },
    {
      key: 'audio',
      icon: 'mic',
      title: 'Audio',
      copy: 'Usado somente em captura consentida de evidencia.',
      state: getAudioState(capabilities),
      detail: getAudioDetail(capabilities),
      request: requestAudio,
    },
  ];
}

function getSnapshotState(
  snapshot: VeraNativePermissionSnapshot | undefined,
): PermissionState {
  if (!snapshot) {
    return 'pending';
  }

  if (snapshot.status === 'granted') {
    return 'granted';
  }

  if (snapshot.status === 'denied') {
    return 'denied';
  }

  if (snapshot.status === 'unavailable') {
    return 'unavailable';
  }

  return 'pending';
}

function getSnapshotDetail(
  snapshot: VeraNativePermissionSnapshot | undefined,
  pendingText: string,
  deniedText: string,
  unavailableText: string,
) {
  if (!snapshot) {
    return 'Verificando permissao...';
  }

  if (snapshot.status === 'granted') {
    return 'Permissao concedida neste aparelho.';
  }

  if (snapshot.status === 'denied') {
    return snapshot.canAskAgain
      ? deniedText
      : `${deniedText} Revise nos ajustes do sistema.`;
  }

  if (snapshot.status === 'unavailable') {
    return unavailableText;
  }

  return pendingText;
}

function getLocationState(
  capabilities: VeraNativeCapabilityStatus | undefined,
): PermissionState {
  if (!capabilities) {
    return 'pending';
  }

  if (!capabilities.location.servicesEnabled) {
    return 'denied';
  }

  const foreground = getSnapshotState(capabilities.location.foreground);
  const background = getSnapshotState(capabilities.location.background);

  if (foreground === 'granted' && background === 'granted') {
    return 'granted';
  }

  if (foreground === 'unavailable' || background === 'unavailable') {
    return 'unavailable';
  }

  if (foreground === 'denied' || background === 'denied') {
    return 'denied';
  }

  return 'pending';
}

function getLocationDetail(
  capabilities: VeraNativeCapabilityStatus | undefined,
) {
  if (!capabilities) {
    return 'Verificando localizacao...';
  }

  if (!capabilities.location.servicesEnabled) {
    return 'Servicos de localizacao do aparelho estao desligados.';
  }

  if (capabilities.location.foreground.granted) {
    if (capabilities.location.background.granted) {
      return 'Localizacao em uso e em segundo plano concedidas.';
    }

    return 'Localizacao em uso concedida. Segundo plano ainda limita locais monitorados.';
  }

  return getSnapshotDetail(
    capabilities.location.foreground,
    'Localizacao ainda nao foi solicitada.',
    'Localizacao negada. Locais monitorados ficam desativados ate voce permitir.',
    'Localizacao nao esta disponivel neste ambiente.',
  );
}

function getAudioState(
  capabilities: VeraNativeCapabilityStatus | undefined,
): PermissionState {
  if (!capabilities) {
    return 'pending';
  }

  const recording = getSnapshotState(capabilities.audio.recording);
  const microphone = getSnapshotState(capabilities.camera.microphone);

  if (recording === 'granted' && microphone === 'granted') {
    return 'granted';
  }

  if (recording === 'unavailable' && microphone === 'unavailable') {
    return 'unavailable';
  }

  if (recording === 'denied' || microphone === 'denied') {
    return 'denied';
  }

  return 'pending';
}

function getAudioDetail(capabilities: VeraNativeCapabilityStatus | undefined) {
  if (!capabilities) {
    return 'Verificando audio...';
  }

  if (
    capabilities.audio.recording.granted &&
    capabilities.camera.microphone.granted
  ) {
    return 'Microfone e gravacao de audio concedidos.';
  }

  return getSnapshotDetail(
    capabilities.audio.recording,
    'Audio ainda nao foi solicitado.',
    'Audio negado. Voce pode seguir sem captura sonora.',
    'Audio nao esta disponivel neste ambiente.',
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[6],
    paddingBottom: spacing[10],
  },
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.ink,
  },
  pressed: {
    opacity: 0.72,
  },
  hero: {
    marginTop: spacing[8],
  },
  mark: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
    borderRadius: 27,
    backgroundColor: colors.plum,
  },
  eyebrow: {
    marginBottom: spacing[2],
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: 310,
  },
  copy: {
    maxWidth: 330,
    marginTop: spacing[4],
  },
  section: {
    gap: spacing[4],
    marginTop: spacing[7],
  },
  infoStrip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.12)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.66)',
  },
  infoText: {
    flex: 1,
  },
  permissions: {
    gap: spacing[3],
  },
  permissionCard: {
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius.sm,
    shadowOpacity: 0,
    elevation: 0,
  },
  permissionTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  permissionIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.ink,
  },
  permissionCopy: {
    flex: 1,
    gap: 2,
  },
  permissionText: {
    maxWidth: 210,
  },
  statusPill: {
    minWidth: 86,
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
    borderRadius: radius.pill,
    backgroundColor: colors.shell,
  },
  statusGranted: {
    backgroundColor: 'rgba(142, 207, 184, 0.32)',
  },
  statusDenied: {
    backgroundColor: 'rgba(180, 35, 66, 0.12)',
  },
  statusUnavailable: {
    backgroundColor: 'rgba(166, 154, 150, 0.18)',
  },
  statusText: {
    color: colors.ink,
    fontWeight: '800',
  },
  permissionBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  permissionDetail: {
    flex: 1,
  },
  permissionButton: {
    minWidth: 98,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.18)',
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  permissionButtonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontWeight: '800',
  },
  helperText: {
    marginTop: -spacing[2],
  },
  message: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  messageText: {
    flex: 1,
    color: colors.danger,
  },
  consentBox: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  consentBoxActive: {
    borderColor: 'rgba(32, 37, 123, 0.38)',
  },
  checkbox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.2)',
    borderRadius: 6,
    backgroundColor: colors.white,
  },
  checkboxActive: {
    borderColor: colors.blue,
    backgroundColor: colors.blue,
  },
  consentText: {
    flex: 1,
  },
  primaryAction: {
    alignSelf: 'stretch',
    marginTop: spacing[6],
  },
  secondaryAction: {
    alignSelf: 'stretch',
  },
});
