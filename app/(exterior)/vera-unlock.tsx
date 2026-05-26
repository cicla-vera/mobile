import { Feather } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { VeraLogo } from "@/components/brand/vera-logo";
import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { Screen } from "@/components/ui/screen";
import { TextField } from "@/components/ui/text-field";
import { VeraUnlockOverlay } from "@/components/vera/vera-unlock-overlay";
import { colors, iconSize, spacing, touchTarget } from "@/constants/theme";
import {
  useSetVeraPinMutation,
  useVeraProfileQuery,
  useVerifyVeraPinMutation,
} from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import {
  getVeraBiometricUnlockAvailability,
  storeVeraSessionForBiometricUnlock,
  unlockStoredVeraSessionWithBiometrics,
  type VeraBiometricUnlockReason,
} from "@/services/vera";
import { isVeraSessionValid, useVeraStore } from "@/stores/vera.store";

const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 8;

export default function VeraUnlockRoute() {
  const isUnlocked = useVeraStore((state) => state.isUnlocked);
  const sessionExpiresAt = useVeraStore((state) => state.sessionExpiresAt);
  const unlockVeraSession = useVeraStore((state) => state.unlockVeraSession);
  const veraSessionToken = useVeraStore((state) => state.veraSessionToken);
  const profileQuery = useVeraProfileQuery();
  const setPinMutation = useSetVeraPinMutation();
  const verifyPinMutation = useVerifyVeraPinMutation();
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricPending, setBiometricPending] = useState(false);
  const [biometricReason, setBiometricReason] =
    useState<VeraBiometricUnlockReason | null>(null);
  const [pin, setPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [setupConfirmPin, setSetupConfirmPin] = useState("");
  const [pinPending, setPinPending] = useState(false);
  const [setupValidationError, setSetupValidationError] = useState<
    string | null
  >(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const hasValidSession = isVeraSessionValid({
    isUnlocked,
    sessionExpiresAt,
    veraSessionToken,
  });
  const biometricMessage = useMemo(
    () => getBiometricMessage(biometricReason),
    [biometricReason],
  );

  useEffect(() => {
    let active = true;

    void getVeraBiometricUnlockAvailability()
      .then((availability) => {
        if (!active) {
          return;
        }

        setBiometricAvailable(availability.available);
        setBiometricReason(availability.reason ?? null);
      })
      .catch(() => {
        if (active) {
          setBiometricAvailable(false);
          setBiometricReason("biometric_storage_unavailable");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (profileQuery.isLoading) {
    return (
      <Screen padded={false} style={styles.loadingScreen}>
        <ActivityIndicator color={colors.blue} size="large" />
      </Screen>
    );
  }

  if (profileQuery.data && !profileQuery.data.consentAccepted) {
    return <Redirect href="/(exterior)/vera-consent" />;
  }

  if (hasValidSession) {
    return <Redirect href="/(interior)" />;
  }

  const profileError = profileQuery.isError
    ? getApiErrorMessage(
        profileQuery.error,
        "Nao deu para confirmar seu consentimento Vera agora.",
      )
    : null;
  const pinError =
    profileError ??
    validationError ??
    (verifyPinMutation.error
      ? getApiErrorMessage(
          verifyPinMutation.error,
          "Nao deu para desbloquear agora.",
        )
      : undefined);
  const setupError =
    profileError ??
    setupValidationError ??
    (setPinMutation.error
      ? getApiErrorMessage(
          setPinMutation.error,
          "Nao deu para criar o PIN Vera agora.",
        )
      : verifyPinMutation.error
        ? getApiErrorMessage(
            verifyPinMutation.error,
            "PIN criado, mas nao deu para entrar agora.",
          )
        : undefined);
  const isSettingPin = setPinMutation.isPending || pinPending;

  function normalizePin(value: string) {
    return value.replace(/\D/g, "").slice(0, PIN_MAX_LENGTH);
  }

  function handlePinChange(value: string) {
    const nextPin = normalizePin(value);
    setPin(nextPin);
    setValidationError(null);
    if (biometricAvailable) {
      setBiometricReason(null);
    }
    verifyPinMutation.reset();

    if (
      nextPin.length === PIN_MAX_LENGTH &&
      !profileError &&
      !pinPending &&
      !biometricPending
    ) {
      void submitPin(nextPin);
    }
  }

  function handleSetupPinChange(value: string) {
    setSetupPin(normalizePin(value));
    setSetupValidationError(null);
    setPinMutation.reset();
    verifyPinMutation.reset();
  }

  function handleSetupConfirmPinChange(value: string) {
    setSetupConfirmPin(normalizePin(value));
    setSetupValidationError(null);
    setPinMutation.reset();
    verifyPinMutation.reset();
  }

  async function createPin() {
    if (pinPending || profileError) {
      return;
    }

    if (setupPin.length < PIN_MIN_LENGTH) {
      setSetupValidationError("Digite entre 4 e 8 numeros.");
      return;
    }

    if (setupPin !== setupConfirmPin) {
      setSetupValidationError("Os PINs nao conferem.");
      return;
    }

    setPinPending(true);
    setSetupValidationError(null);
    setPinMutation.reset();
    verifyPinMutation.reset();

    try {
      await setPinMutation.mutateAsync({ pin: setupPin });
      const session = await verifyPinMutation.mutateAsync({ pin: setupPin });
      const storageResult = await storeVeraSessionForBiometricUnlock(session);

      if (
        !storageResult.available &&
        storageResult.reason !== "session_expired"
      ) {
        setBiometricReason(storageResult.reason ?? "session_storage_failed");
      }

      setSetupPin("");
      setSetupConfirmPin("");
      router.replace("/(interior)");
    } catch {
      // Mutation state renders the user-facing error.
    } finally {
      setPinPending(false);
    }
  }

  async function submitPin(nextPin = pin) {
    if (pinPending || biometricPending || profileError) {
      return;
    }

    if (nextPin.length < PIN_MIN_LENGTH) {
      setValidationError("Digite entre 4 e 8 numeros.");
      return;
    }

    setPinPending(true);

    try {
      const session = await verifyPinMutation.mutateAsync({ pin: nextPin });
      const storageResult = await storeVeraSessionForBiometricUnlock(session);

      if (
        !storageResult.available &&
        storageResult.reason !== "session_expired"
      ) {
        setBiometricReason(storageResult.reason ?? "session_storage_failed");
      }

      setPin("");
      router.replace("/(interior)");
    } catch {
      setPin("");
    } finally {
      setPinPending(false);
    }
  }

  async function handleBiometricUnlock() {
    if (profileError) {
      return;
    }

    setBiometricPending(true);
    setBiometricReason(null);
    verifyPinMutation.reset();
    setValidationError(null);

    try {
      const result = await unlockStoredVeraSessionWithBiometrics();

      if (!result.success) {
        setBiometricReason(result.reason);
        return;
      }

      unlockVeraSession(result.session);
      router.replace("/(interior)");
    } finally {
      setBiometricPending(false);
    }
  }

  if (profileQuery.data && !profileQuery.data.pinConfigured) {
    return (
      <Screen edges={["top", "right", "bottom", "left"]} padded={false}>
        <VeraPinSetupOverlay
          confirmPin={setupConfirmPin}
          disabled={Boolean(profileError) || isSettingPin}
          error={setupError}
          loading={isSettingPin}
          onBack={() => router.replace("/(exterior)")}
          onConfirmPinChange={handleSetupConfirmPinChange}
          onPinChange={handleSetupPinChange}
          onSubmit={() => void createPin()}
          pin={setupPin}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={["top", "right", "bottom", "left"]} padded={false}>
      <VeraUnlockOverlay
        biometricAvailable={biometricAvailable}
        biometricMessage={biometricMessage}
        biometricPending={biometricPending}
        onBack={() => router.replace("/(exterior)")}
        onBiometricPress={handleBiometricUnlock}
        onPinChange={handlePinChange}
        onPinSubmit={() => void submitPin()}
        pin={pin}
        pinError={pinError}
        pinMaxLength={PIN_MAX_LENGTH}
        pinPending={pinPending}
      />
    </Screen>
  );
}

function VeraPinSetupOverlay({
  confirmPin,
  disabled,
  error,
  loading,
  onBack,
  onConfirmPinChange,
  onPinChange,
  onSubmit,
  pin,
}: {
  confirmPin: string;
  disabled: boolean;
  error?: string | null;
  loading: boolean;
  onBack: () => void;
  onConfirmPinChange: (value: string) => void;
  onPinChange: (value: string) => void;
  onSubmit: () => void;
  pin: string;
}) {
  return (
    <View style={styles.setupRoot}>
      <View pointerEvents="none" style={styles.setupBackdrop} />

      <View style={styles.setupHeader}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Feather color={colors.ink} name="arrow-left" size={iconSize.md} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? spacing[4] : 0}
        style={styles.setupBody}
      >
        <View style={styles.setupTopSection}>
          <VeraLogo width={150} style={styles.setupLogo} />
          <AppText style={styles.setupTitle}>Criar PIN Vera</AppText>
          <AppText tone="muted" style={styles.setupCopy}>
            Use de 4 a 8 numeros. Este PIN protege a area privada neste
            aparelho.
          </AppText>
        </View>

        <View style={styles.setupForm}>
          <TextField
            accessibilityLabel="Criar PIN Vera"
            autoComplete="off"
            editable={!disabled}
            inputMode="numeric"
            keyboardType="number-pad"
            label="PIN Vera"
            maxLength={PIN_MAX_LENGTH}
            onChangeText={onPinChange}
            placeholder="0000"
            secureTextEntry
            value={pin}
          />

          <TextField
            accessibilityLabel="Confirmar PIN Vera"
            autoComplete="off"
            editable={!disabled}
            error={error ?? undefined}
            inputMode="numeric"
            keyboardType="number-pad"
            label="Confirmar PIN"
            maxLength={PIN_MAX_LENGTH}
            onChangeText={onConfirmPinChange}
            onSubmitEditing={onSubmit}
            placeholder="0000"
            returnKeyType="done"
            secureTextEntry
            value={confirmPin}
          />

          <Button
            accessibilityRole="button"
            disabled={disabled}
            loading={loading}
            onPress={onSubmit}
            style={styles.setupButton}
          >
            Criar e entrar
          </Button>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: "center",
    justifyContent: "center",
  },
  setupRoot: {
    flex: 1,
    backgroundColor: colors.shell,
  },
  setupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 245, 236, 0.81)",
  },
  setupHeader: {
    paddingHorizontal: spacing[6],
    paddingTop: spacing[4],
  },
  backButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    borderRadius: touchTarget.min / 2,
    height: touchTarget.min,
    justifyContent: "center",
    width: touchTarget.min,
  },
  pressed: {
    opacity: 0.72,
  },
  setupBody: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: spacing[10],
    paddingHorizontal: spacing[6],
  },
  setupTopSection: {
    alignItems: "center",
  },
  setupLogo: {
    marginBottom: spacing[8],
  },
  setupTitle: {
    color: colors.blue,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    textAlign: "center",
  },
  setupCopy: {
    marginTop: spacing[3],
    maxWidth: 312,
    textAlign: "center",
  },
  setupForm: {
    gap: spacing[4],
    marginTop: spacing[8],
  },
  setupButton: {
    alignSelf: "stretch",
    marginTop: spacing[2],
  },
});

function getBiometricMessage(reason: VeraBiometricUnlockReason | null) {
  if (!reason) {
    return null;
  }

  if (reason === "session_missing") {
    return "Entre com o PIN uma vez neste aparelho.";
  }

  if (reason === "session_expired") {
    return "Sessao expirada. Use o PIN para continuar.";
  }

  if (reason === "authentication_failed") {
    return "Biometria cancelada ou nao reconhecida.";
  }

  if (
    reason === "web_unavailable" ||
    reason === "expo_go_unavailable" ||
    reason === "secure_store_unavailable" ||
    reason === "biometric_hardware_unavailable" ||
    reason === "biometric_not_enrolled" ||
    reason === "biometric_storage_unavailable"
  ) {
    return "Biometria indisponivel neste ambiente. Use o PIN.";
  }

  return "Nao deu para usar biometria agora. Use o PIN.";
}
