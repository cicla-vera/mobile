import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { colors, radius, spacing } from '@/constants/theme';
import {
  useSetVeraPinMutation,
  useUpdateVeraProfileMutation,
  useVeraProfileQuery,
} from '@/hooks/vera';
import { getApiErrorMessage } from '@/services/api-error';
import { queryClient } from '@/services/query-client';
import { clearStoredVeraBiometricSession } from '@/services/vera';
import { useVeraStore } from '@/stores/vera.store';

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 8;

export default function VeraSettingsRoute() {
  const lockVeraSession = useVeraStore((state) => state.lockVeraSession);
  const profileQuery = useVeraProfileQuery();
  const updateProfileMutation = useUpdateVeraProfileMutation();
  const setPinMutation = useSetVeraPinMutation();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  const profile = profileQuery.data;
  const profileError = profileQuery.isError
    ? getApiErrorMessage(
        profileQuery.error,
        'Nao deu para carregar seu perfil Vera agora.',
      )
    : null;
  const updateError = updateProfileMutation.error
    ? getApiErrorMessage(
        updateProfileMutation.error,
        'Nao deu para atualizar seu perfil Vera agora.',
      )
    : null;
  const pinMutationError = setPinMutation.error
    ? getApiErrorMessage(
        setPinMutation.error,
        'Nao deu para salvar o PIN Vera agora.',
      )
    : null;
  const isUpdatingProfile = updateProfileMutation.isPending;
  const isSavingPin = setPinMutation.isPending;

  function normalizePin(value: string) {
    return value.replace(/\D/g, '').slice(0, PIN_MAX_LENGTH);
  }

  function resetPinState() {
    setPinError(null);
    setPinFeedback(null);
    setPinMutation.reset();
  }

  async function updateBooleanSetting(
    key:
      | 'veraEnabled'
      | 'monitoringEnabled'
      | 'biometricUnlockEnabled'
      | 'discreetNotificationsEnabled',
    value: boolean,
  ) {
    await updateProfileMutation.mutateAsync({ [key]: value });
  }

  async function handleSavePin() {
    resetPinState();

    if (newPin.length < PIN_MIN_LENGTH) {
      setPinError('Digite entre 4 e 8 numeros.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinError('Os PINs nao conferem.');
      return;
    }

    if (profile?.pinConfigured && currentPin.length < PIN_MIN_LENGTH) {
      setPinError('Digite o PIN atual para alterar.');
      return;
    }

    await setPinMutation.mutateAsync({
      pin: newPin,
      ...(profile?.pinConfigured ? { currentPin } : {}),
    });

    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinFeedback(
      profile?.pinConfigured ? 'PIN Vera atualizado.' : 'PIN Vera configurado.',
    );
  }

  function handleRevokeConsent() {
    Alert.alert(
      'Revogar consentimento Vera',
      'Isso pausa o modo Vera, encerra a sessao privada neste aparelho e exige novo aceite para entrar novamente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: () => {
            void revokeConsent();
          },
        },
      ],
    );
  }

  async function revokeConsent() {
    await updateProfileMutation.mutateAsync({ consentAccepted: false });
    lockVeraSession();
    await clearStoredVeraBiometricSession();
    await queryClient.invalidateQueries({ queryKey: ['vera'] });
    router.replace('/(exterior)');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboard}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Header />

        {profileQuery.isLoading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.mint} size="large" />
            <AppText variant="caption" style={styles.darkMuted}>
              Carregando perfil Vera...
            </AppText>
          </View>
        ) : null}

        {profileError ? (
          <Message
            text={profileError}
            actionLabel="Tentar de novo"
            onAction={() => void profileQuery.refetch()}
          />
        ) : null}

        {profile ? (
          <>
            <View style={styles.summaryPanel}>
              <View style={styles.summaryIcon}>
                <Feather name="shield" size={20} color={colors.ink} />
              </View>
              <View style={styles.summaryCopy}>
                <AppText variant="label" tone="cream">
                  {profile.veraEnabled ? 'Perfil Vera ativo' : 'Perfil Vera pausado'}
                </AppText>
                <AppText variant="caption" style={styles.darkMuted}>
                  {profile.consentAcceptedAt
                    ? `Consentimento registrado em ${formatDate(profile.consentAcceptedAt)}`
                    : 'Consentimento ainda nao registrado'}
                </AppText>
              </View>
            </View>

            <View style={styles.panel}>
              <AppText variant="label" style={styles.panelTitle}>
                Estado do perfil
              </AppText>

              <SettingRow
                title="Modo Vera"
                detail="Permite usar a camada privada depois do desbloqueio."
                icon="shield"
                value={profile.veraEnabled}
                disabled={!profile.consentAccepted || isUpdatingProfile}
                onValueChange={(value) =>
                  void updateBooleanSetting('veraEnabled', value)
                }
              />
              <SettingRow
                title="Monitoramento"
                detail="Mantem sessoes normais disponiveis para locais e acionamentos."
                icon="activity"
                value={profile.monitoringEnabled}
                disabled={
                  !profile.consentAccepted ||
                  !profile.veraEnabled ||
                  isUpdatingProfile
                }
                onValueChange={(value) =>
                  void updateBooleanSetting('monitoringEnabled', value)
                }
              />
              <SettingRow
                title="Notificacoes discretas"
                detail="Usa textos neutros e curtos quando uma notificacao for necessaria."
                icon="bell"
                value={profile.discreetNotificationsEnabled}
                disabled={isUpdatingProfile}
                onValueChange={(value) =>
                  void updateBooleanSetting(
                    'discreetNotificationsEnabled',
                    value,
                  )
                }
              />
              <SettingRow
                title="Biometria"
                detail="Permite reabrir a sessao Vera neste aparelho com biometria."
                icon="lock"
                value={profile.biometricUnlockEnabled}
                disabled={isUpdatingProfile}
                onValueChange={(value) =>
                  void updateBooleanSetting('biometricUnlockEnabled', value)
                }
              />

              {updateError ? <Message text={updateError} compact /> : null}
            </View>

            <View style={styles.panel}>
              <View style={styles.pinHeader}>
                <View>
                  <AppText variant="label" style={styles.panelTitle}>
                    PIN Vera
                  </AppText>
                  <AppText variant="caption" tone="muted">
                    {profile.pinConfigured
                      ? `Atualizado em ${formatDate(profile.pinUpdatedAt)}`
                      : 'Crie um PIN de 4 a 8 numeros.'}
                  </AppText>
                </View>
                <StatusBadge ok={profile.pinConfigured} />
              </View>

              {profile.pinConfigured ? (
                <TextField
                  accessibilityLabel="PIN Vera atual"
                  autoComplete="off"
                  inputMode="numeric"
                  keyboardType="number-pad"
                  label="PIN atual"
                  maxLength={PIN_MAX_LENGTH}
                  onChangeText={(value) => {
                    resetPinState();
                    setCurrentPin(normalizePin(value));
                  }}
                  placeholder="0000"
                  secureTextEntry
                  value={currentPin}
                />
              ) : null}

              <TextField
                accessibilityLabel="Novo PIN Vera"
                autoComplete="off"
                inputMode="numeric"
                keyboardType="number-pad"
                label={profile.pinConfigured ? 'Novo PIN' : 'PIN Vera'}
                maxLength={PIN_MAX_LENGTH}
                onChangeText={(value) => {
                  resetPinState();
                  setNewPin(normalizePin(value));
                }}
                placeholder="0000"
                secureTextEntry
                value={newPin}
              />

              <TextField
                accessibilityLabel="Confirmar PIN Vera"
                autoComplete="off"
                error={pinError ?? pinMutationError ?? undefined}
                inputMode="numeric"
                keyboardType="number-pad"
                label="Confirmar PIN"
                maxLength={PIN_MAX_LENGTH}
                onChangeText={(value) => {
                  resetPinState();
                  setConfirmPin(normalizePin(value));
                }}
                onSubmitEditing={handleSavePin}
                placeholder="0000"
                returnKeyType="done"
                secureTextEntry
                value={confirmPin}
              />

              {pinFeedback ? (
                <View style={styles.feedback}>
                  <Feather name="check" size={16} color={colors.ink} />
                  <AppText variant="caption" style={styles.feedbackText}>
                    {pinFeedback}
                  </AppText>
                </View>
              ) : null}

              <Button
                accessibilityRole="button"
                disabled={isSavingPin}
                loading={isSavingPin}
                onPress={handleSavePin}
                style={styles.stretchButton}
              >
                {profile.pinConfigured ? 'Atualizar PIN' : 'Criar PIN'}
              </Button>
            </View>

            <View style={styles.panel}>
              <AppText variant="label" style={styles.panelTitle}>
                Consentimento
              </AppText>
              <AppText tone="muted">
                Revogar desativa a camada Vera e encerra a sessao privada neste
                aparelho.
              </AppText>
              <Button
                accessibilityRole="button"
                disabled={isUpdatingProfile}
                onPress={handleRevokeConsent}
                style={styles.stretchButton}
                variant="secondary"
              >
                Revogar consentimento
              </Button>
            </View>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
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
          Seguranca
        </AppText>
      </View>
    </View>
  );
}

function SettingRow({
  title,
  detail,
  icon,
  value,
  disabled,
  onValueChange,
}: {
  title: string;
  detail: string;
  icon: keyof typeof Feather.glyphMap;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={[styles.settingRow, disabled && styles.disabledRow]}>
      <View style={styles.settingIcon}>
        <Feather name={icon} size={17} color={colors.cream} />
      </View>
      <View style={styles.settingCopy}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" tone="muted" style={styles.settingDetail}>
          {detail}
        </AppText>
      </View>
      <Switch
        accessibilityLabel={title}
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor={value ? colors.cream : colors.white}
        trackColor={{
          false: 'rgba(20, 16, 17, 0.18)',
          true: colors.blue,
        }}
        value={value}
      />
    </View>
  );
}

function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <View style={[styles.badge, ok && styles.badgeOk]}>
      <Feather
        name={ok ? 'check' : 'minus'}
        size={14}
        color={ok ? colors.ink : colors.cream}
      />
      <AppText variant="caption" style={[styles.badgeText, ok && styles.badgeTextOk]}>
        {ok ? 'Ativo' : 'Pendente'}
      </AppText>
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
          style={({ pressed }) => [styles.messageAction, pressed && styles.pressed]}
        >
          <AppText variant="caption" tone="blue" style={styles.messageActionText}>
            {actionLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return 'data indisponivel';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    marginBottom: spacing[2],
  },
  backButton: {
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
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  loadingPanel: {
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 245, 236, 0.08)',
  },
  summaryPanel: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(142, 207, 184, 0.22)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(142, 207, 184, 0.1)',
  },
  summaryIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.mint,
  },
  summaryCopy: {
    flex: 1,
  },
  darkMuted: {
    color: 'rgba(255, 245, 236, 0.7)',
  },
  panel: {
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  panelTitle: {
    textTransform: 'uppercase',
  },
  settingRow: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  disabledRow: {
    opacity: 0.58,
  },
  settingIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    backgroundColor: colors.ink,
  },
  settingCopy: {
    flex: 1,
    gap: 2,
  },
  settingDetail: {
    maxWidth: 220,
  },
  pinHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[3],
  },
  badge: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  badgeOk: {
    backgroundColor: colors.mint,
  },
  badgeText: {
    color: colors.cream,
    fontWeight: '800',
  },
  badgeTextOk: {
    color: colors.ink,
  },
  feedback: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(142, 207, 184, 0.32)',
  },
  feedbackText: {
    flex: 1,
    color: colors.ink,
  },
  stretchButton: {
    alignSelf: 'stretch',
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  messageCompact: {
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  messageText: {
    flex: 1,
    color: colors.danger,
  },
  messageAction: {
    minHeight: 30,
    justifyContent: 'center',
    paddingHorizontal: spacing[2],
  },
  messageActionText: {
    fontWeight: '800',
  },
});
