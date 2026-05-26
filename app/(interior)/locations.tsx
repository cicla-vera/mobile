import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useMemo, useState } from "react";
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
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { colors, radius, spacing } from "@/constants/theme";
import {
  useCreateSafetyLocationMutation,
  useDisableSafetyLocationMutation,
  useSafetyLocationsQuery,
  useUpdateSafetyLocationMutation,
} from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import { requestVeraForegroundLocationPermission } from "@/services/vera";
import type {
  CreateSafetyLocationRequest,
  SafetyLocation,
  SafetyLocationType,
  UpdateSafetyLocationRequest,
} from "@/types/vera.types";

const DEFAULT_RADIUS_METERS = "100";

type LocationFormState = {
  name: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  type: SafetyLocationType;
  enabled: boolean;
};

function createEmptyForm(): LocationFormState {
  return {
    name: "",
    latitude: "",
    longitude: "",
    radiusMeters: DEFAULT_RADIUS_METERS,
    type: "RISK",
    enabled: true,
  };
}

export default function VeraLocationsRoute() {
  const locationsQuery = useSafetyLocationsQuery(true);
  const createLocationMutation = useCreateSafetyLocationMutation();
  const updateLocationMutation = useUpdateSafetyLocationMutation();
  const disableLocationMutation = useDisableSafetyLocationMutation();
  const [editingLocation, setEditingLocation] = useState<SafetyLocation | null>(
    null,
  );
  const [form, setForm] = useState<LocationFormState>(() => createEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);

  const locations = locationsQuery.data ?? [];
  const activeCount = useMemo(
    () => locations.filter((location) => location.enabled).length,
    [locations],
  );
  const riskCount = useMemo(
    () =>
      locations.filter(
        (location) => location.enabled && location.type === "RISK",
      ).length,
    [locations],
  );
  const inactiveCount = locations.length - activeCount;
  const isMutating =
    createLocationMutation.isPending ||
    updateLocationMutation.isPending ||
    disableLocationMutation.isPending;
  const locationsError = locationsQuery.isError
    ? getApiErrorMessage(
        locationsQuery.error,
        "Nao deu para carregar os locais monitorados agora.",
      )
    : null;
  const mutationError = createLocationMutation.error
    ? getApiErrorMessage(
        createLocationMutation.error,
        "Nao deu para salvar o local agora.",
      )
    : updateLocationMutation.error
      ? getApiErrorMessage(
          updateLocationMutation.error,
          "Nao deu para atualizar o local agora.",
        )
      : disableLocationMutation.error
        ? getApiErrorMessage(
            disableLocationMutation.error,
            "Nao deu para desativar o local agora.",
          )
        : null;

  function resetMutationState() {
    createLocationMutation.reset();
    updateLocationMutation.reset();
    disableLocationMutation.reset();
  }

  function updateFormField<Key extends keyof LocationFormState>(
    key: Key,
    value: LocationFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
    setFeedback(null);
    resetMutationState();
  }

  function handleRadiusChange(value: string) {
    updateFormField("radiusMeters", value.replace(/\D/g, "").slice(0, 5));
  }

  function handleCreateMode() {
    setEditingLocation(null);
    setForm(createEmptyForm());
    setFormError(null);
    setFeedback(null);
    resetMutationState();
  }

  function handleEdit(location: SafetyLocation) {
    setEditingLocation(location);
    setForm({
      name: location.name,
      latitude: formatCoordinate(location.latitude),
      longitude: formatCoordinate(location.longitude),
      radiusMeters: String(location.radiusMeters),
      type: location.type,
      enabled: location.enabled,
    });
    setFormError(null);
    setFeedback(null);
    resetMutationState();
  }

  async function handleUseCurrentLocation() {
    setIsUsingCurrentLocation(true);
    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      const permission = await requestVeraForegroundLocationPermission();

      if (!permission.granted) {
        setFormError(
          permission.canAskAgain
            ? "Permissao de localizacao negada. Voce ainda pode preencher as coordenadas manualmente."
            : "Permissao de localizacao bloqueada. Preencha as coordenadas manualmente.",
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setForm((current) => ({
        ...current,
        latitude: formatCoordinate(currentLocation.coords.latitude),
        longitude: formatCoordinate(currentLocation.coords.longitude),
      }));
      setFeedback("Coordenadas atuais preenchidas.");
    } catch {
      setFormError(
        "Nao deu para obter sua localizacao agora. Preencha as coordenadas manualmente.",
      );
    } finally {
      setIsUsingCurrentLocation(false);
    }
  }

  async function handleSubmit() {
    const payload = validateAndBuildPayload(form);

    if (typeof payload === "string") {
      setFormError(payload);
      return;
    }

    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      if (editingLocation) {
        const updatePayload: UpdateSafetyLocationRequest = {
          ...payload,
          enabled: form.enabled,
        };

        const updatedLocation = await updateLocationMutation.mutateAsync({
          id: editingLocation.id,
          payload: updatePayload,
        });

        handleEdit(updatedLocation);
        setFeedback("Local atualizado.");
        return;
      }

      const createdLocation = await createLocationMutation.mutateAsync(payload);

      if (!form.enabled) {
        await updateLocationMutation.mutateAsync({
          id: createdLocation.id,
          payload: { enabled: false },
        });
      }

      handleCreateMode();
      setFeedback("Local criado.");
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  function handleDisable(location: SafetyLocation) {
    Alert.alert(
      "Desativar local",
      `O local ${location.name} deixa de iniciar alertas por monitoramento. Ele continua no historico e pode ser reativado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: () => {
            void disableLocation(location);
          },
        },
      ],
    );
  }

  async function disableLocation(location: SafetyLocation) {
    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      const disabledLocation = await disableLocationMutation.mutateAsync(
        location.id,
      );

      if (editingLocation?.id === disabledLocation.id) {
        handleEdit(disabledLocation);
      }

      setFeedback("Local desativado.");
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  async function reactivateLocation(location: SafetyLocation) {
    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      const reactivatedLocation = await updateLocationMutation.mutateAsync({
        id: location.id,
        payload: { enabled: true },
      });

      if (editingLocation?.id === reactivatedLocation.id) {
        handleEdit(reactivatedLocation);
      }

      setFeedback("Local reativado.");
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

        <View style={styles.summaryPanel}>
          <View style={styles.summaryIcon}>
            <Feather name="map-pin" size={20} color={colors.ink} />
          </View>
          <View style={styles.summaryCopy}>
            <AppText variant="label" tone="cream">
              {activeCount} locais ativos
            </AppText>
            <AppText variant="caption" style={styles.darkMuted}>
              {inactiveCount > 0
                ? `${inactiveCount} locais inativos ficam fora do monitoramento.`
                : `${riskCount} zonas de risco ativas.`}
            </AppText>
          </View>
        </View>

        {locationsQuery.isLoading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.mint} size="large" />
            <AppText variant="caption" style={styles.darkMuted}>
              Carregando locais...
            </AppText>
          </View>
        ) : null}

        {locationsError ? (
          <Message
            text={locationsError}
            actionLabel="Tentar de novo"
            onAction={() => void locationsQuery.refetch()}
          />
        ) : null}

        <View style={styles.panel}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <AppText variant="label" style={styles.panelTitle}>
                {editingLocation ? "Editar local" : "Novo local"}
              </AppText>
              <AppText variant="caption" tone="muted">
                Locais ativos podem participar de acionamentos Vera.
              </AppText>
            </View>

            {editingLocation ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancelar edicao"
                disabled={isMutating}
                onPress={handleCreateMode}
                style={({ pressed }) => [
                  styles.iconButton,
                  pressed && styles.pressed,
                  isMutating && styles.disabledAction,
                ]}
              >
                <Feather name="x" size={18} color={colors.ink} />
              </Pressable>
            ) : null}
          </View>

          <TextField
            accessibilityLabel="Nome do local monitorado"
            autoCapitalize="words"
            error={formError?.startsWith("Nome") ? formError : undefined}
            label="Nome"
            maxLength={80}
            onChangeText={(value) => updateFormField("name", value)}
            placeholder="Casa, trabalho, escola..."
            returnKeyType="next"
            value={form.name}
          />

          <TypeSelector
            disabled={isMutating}
            onChange={(type) => updateFormField("type", type)}
            value={form.type}
          />

          <LocationPreview form={form} />

          <Pressable
            accessibilityRole="button"
            disabled={isUsingCurrentLocation || isMutating}
            onPress={handleUseCurrentLocation}
            style={({ pressed }) => [
              styles.currentLocationButton,
              pressed && styles.pressed,
              (isUsingCurrentLocation || isMutating) && styles.disabledAction,
            ]}
          >
            <View style={styles.currentLocationIcon}>
              {isUsingCurrentLocation ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <Feather name="crosshair" size={17} color={colors.ink} />
              )}
            </View>
            <View style={styles.currentLocationCopy}>
              <AppText variant="label">Usar localizacao atual</AppText>
              <AppText variant="caption" tone="muted">
                Se a permissao falhar, o formulario continua manual.
              </AppText>
            </View>
          </Pressable>

          <View style={styles.coordinateFields}>
            <View style={styles.coordinateField}>
              <TextField
                accessibilityLabel="Latitude do local monitorado"
                error={
                  formError?.startsWith("Latitude") ? formError : undefined
                }
                inputMode="decimal"
                keyboardType="numbers-and-punctuation"
                label="Latitude"
                maxLength={18}
                onChangeText={(value) => updateFormField("latitude", value)}
                placeholder="-3.731862"
                returnKeyType="next"
                value={form.latitude}
              />
            </View>

            <View style={styles.coordinateField}>
              <TextField
                accessibilityLabel="Longitude do local monitorado"
                error={
                  formError?.startsWith("Longitude") ? formError : undefined
                }
                inputMode="decimal"
                keyboardType="numbers-and-punctuation"
                label="Longitude"
                maxLength={18}
                onChangeText={(value) => updateFormField("longitude", value)}
                placeholder="-38.526669"
                returnKeyType="next"
                value={form.longitude}
              />
            </View>
          </View>

          <TextField
            accessibilityLabel="Raio do local monitorado em metros"
            error={formError?.startsWith("Raio") ? formError : undefined}
            inputMode="numeric"
            keyboardType="number-pad"
            label="Raio em metros"
            maxLength={5}
            onChangeText={handleRadiusChange}
            onSubmitEditing={handleSubmit}
            placeholder="100"
            returnKeyType="done"
            value={form.radiusMeters}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchIcon}>
              <Feather
                name={form.enabled ? "check-circle" : "minus-circle"}
                size={17}
                color={colors.cream}
              />
            </View>
            <View style={styles.switchCopy}>
              <AppText variant="label">Local ativo</AppText>
              <AppText variant="caption" tone="muted">
                Locais inativos nao iniciam monitoramento.
              </AppText>
            </View>
            <Switch
              accessibilityLabel="Local ativo"
              disabled={isMutating}
              onValueChange={(value) => updateFormField("enabled", value)}
              thumbColor={form.enabled ? colors.cream : colors.white}
              trackColor={{
                false: "rgba(20, 16, 17, 0.18)",
                true: colors.blue,
              }}
              value={form.enabled}
            />
          </View>

          {formError &&
          !formError.startsWith("Nome") &&
          !formError.startsWith("Latitude") &&
          !formError.startsWith("Longitude") &&
          !formError.startsWith("Raio") ? (
            <Message text={formError} compact />
          ) : null}

          {mutationError ? <Message text={mutationError} compact /> : null}

          {feedback ? (
            <View style={styles.feedback}>
              <Feather name="check" size={16} color={colors.ink} />
              <AppText variant="caption" style={styles.feedbackText}>
                {feedback}
              </AppText>
            </View>
          ) : null}

          <Button
            accessibilityRole="button"
            disabled={isMutating || isUsingCurrentLocation}
            loading={
              createLocationMutation.isPending ||
              updateLocationMutation.isPending
            }
            onPress={handleSubmit}
            style={styles.stretchButton}
          >
            {editingLocation ? "Salvar local" : "Criar local"}
          </Button>
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <View>
              <AppText variant="label" tone="pink" style={styles.eyebrow}>
                Lista
              </AppText>
              <AppText variant="heading" tone="cream">
                Locais cadastrados
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atualizar locais"
              disabled={locationsQuery.isFetching}
              onPress={() => void locationsQuery.refetch()}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.pressed,
                locationsQuery.isFetching && styles.disabledAction,
              ]}
            >
              {locationsQuery.isFetching ? (
                <ActivityIndicator color={colors.cream} />
              ) : (
                <Feather name="refresh-cw" size={18} color={colors.cream} />
              )}
            </Pressable>
          </View>

          {!locationsQuery.isLoading && locations.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="map" size={24} color={colors.mint} />
              <AppText variant="label" tone="cream">
                Nenhum local ainda
              </AppText>
              <AppText variant="caption" style={styles.darkMuted}>
                Cadastre zonas de risco ou locais confiaveis para monitoramento.
              </AppText>
            </View>
          ) : null}

          {locations.map((location) => (
            <LocationCard
              key={location.id}
              disabled={isMutating}
              isEditing={editingLocation?.id === location.id}
              location={location}
              onDisable={handleDisable}
              onEdit={handleEdit}
              onReactivate={(selectedLocation) => {
                void reactivateLocation(selectedLocation);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function validateAndBuildPayload(
  form: LocationFormState,
): CreateSafetyLocationRequest | string {
  const name = form.name.trim();
  const latitude = parseCoordinate(form.latitude);
  const longitude = parseCoordinate(form.longitude);
  const radiusMeters = Number(form.radiusMeters);

  if (name.length < 2) {
    return "Nome deve ter pelo menos 2 caracteres.";
  }

  if (name.length > 80) {
    return "Nome deve ter no maximo 80 caracteres.";
  }

  if (latitude === null || latitude < -90 || latitude > 90) {
    return "Latitude deve ser um numero entre -90 e 90.";
  }

  if (longitude === null || longitude < -180 || longitude > 180) {
    return "Longitude deve ser um numero entre -180 e 180.";
  }

  if (
    !Number.isInteger(radiusMeters) ||
    radiusMeters < 25 ||
    radiusMeters > 10000
  ) {
    return "Raio deve ser um inteiro entre 25 e 10000 metros.";
  }

  return {
    name,
    latitude,
    longitude,
    radiusMeters,
    type: form.type,
  };
}

function parseCoordinate(value: string) {
  const normalizedValue = value.trim().replace(",", ".");

  if (!normalizedValue) {
    return null;
  }

  const parsed = Number(normalizedValue);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
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
          Locais
        </AppText>
      </View>
    </View>
  );
}

function TypeSelector({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (type: SafetyLocationType) => void;
  value: SafetyLocationType;
}) {
  return (
    <View style={styles.typeSelector}>
      <TypeOption
        disabled={disabled}
        icon="alert-triangle"
        label="Risco"
        onPress={() => onChange("RISK")}
        selected={value === "RISK"}
        tone="danger"
      />
      <TypeOption
        disabled={disabled}
        icon="home"
        label="Confiavel"
        onPress={() => onChange("TRUSTED")}
        selected={value === "TRUSTED"}
        tone="calm"
      />
    </View>
  );
}

function TypeOption({
  disabled,
  icon,
  label,
  onPress,
  selected,
  tone,
}: {
  disabled: boolean;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  selected: boolean;
  tone: "danger" | "calm";
}) {
  const activeColor = tone === "danger" ? colors.coral : colors.mint;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.typeOption,
        selected && {
          borderColor: activeColor,
          backgroundColor:
            tone === "danger"
              ? "rgba(242, 97, 126, 0.16)"
              : "rgba(142, 207, 184, 0.24)",
        },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabledAction,
      ]}
    >
      <Feather
        name={icon}
        size={16}
        color={selected ? colors.ink : colors.muted}
      />
      <AppText
        variant="label"
        style={[styles.typeOptionText, selected && styles.typeOptionTextActive]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function LocationPreview({ form }: { form: LocationFormState }) {
  const hasCoordinates = Boolean(form.latitude.trim() && form.longitude.trim());

  return (
    <View style={styles.preview}>
      <View style={styles.previewGrid}>
        <View style={styles.previewLineHorizontal} />
        <View style={styles.previewLineVertical} />
        <View
          style={[
            styles.previewRadius,
            form.type === "TRUSTED" && styles.previewRadiusTrusted,
          ]}
        />
        <View
          style={[
            styles.previewPin,
            form.type === "TRUSTED" && styles.previewPinTrusted,
          ]}
        >
          <Feather name="map-pin" size={16} color={colors.ink} />
        </View>
      </View>
      <View style={styles.previewCopy}>
        <AppText variant="label">
          {form.type === "RISK" ? "Zona de risco" : "Local confiavel"}
        </AppText>
        <AppText variant="caption" tone="muted">
          {hasCoordinates
            ? `${form.latitude || "-"}, ${form.longitude || "-"}`
            : "Coordenadas pendentes"}
        </AppText>
      </View>
    </View>
  );
}

function LocationCard({
  disabled,
  isEditing,
  location,
  onDisable,
  onEdit,
  onReactivate,
}: {
  disabled: boolean;
  isEditing: boolean;
  location: SafetyLocation;
  onDisable: (location: SafetyLocation) => void;
  onEdit: (location: SafetyLocation) => void;
  onReactivate: (location: SafetyLocation) => void;
}) {
  const isRisk = location.type === "RISK";

  return (
    <View
      style={[
        styles.locationCard,
        !location.enabled && styles.locationCardInactive,
        isEditing && styles.locationCardEditing,
      ]}
    >
      <View style={styles.locationTopRow}>
        <View
          style={[
            styles.locationAvatar,
            !isRisk && styles.locationAvatarTrusted,
            !location.enabled && styles.locationAvatarInactive,
          ]}
        >
          <Feather
            name={isRisk ? "alert-triangle" : "home"}
            size={18}
            color={location.enabled ? colors.ink : colors.cream}
          />
        </View>

        <View style={styles.locationCopy}>
          <AppText variant="label" style={styles.locationName}>
            {location.name}
          </AppText>
          <AppText variant="caption" tone="muted">
            {isRisk ? "Zona de risco" : "Local confiavel"}
          </AppText>
          <AppText variant="body" style={styles.locationCoordinates}>
            {formatCoordinate(location.latitude)},{" "}
            {formatCoordinate(location.longitude)}
          </AppText>
        </View>

        <StatusBadge enabled={location.enabled} />
      </View>

      <View style={styles.locationMetaRow}>
        <MetaPill icon="radio" text={formatRadius(location.radiusMeters)} />
        <MetaPill icon="clock" text={formatDate(location.updatedAt)} />
      </View>

      <View style={styles.actionRow}>
        <ActionButton
          disabled={disabled}
          icon="edit-2"
          label="Editar"
          onPress={() => onEdit(location)}
        />

        {location.enabled ? (
          <ActionButton
            destructive
            disabled={disabled}
            icon="slash"
            label="Desativar"
            onPress={() => onDisable(location)}
          />
        ) : (
          <ActionButton
            disabled={disabled}
            icon="refresh-cw"
            label="Reativar"
            onPress={() => onReactivate(location)}
          />
        )}
      </View>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  destructive,
  disabled,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  destructive?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        destructive && styles.actionButtonDanger,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabledAction,
      ]}
    >
      <Feather
        name={icon}
        size={15}
        color={destructive ? colors.danger : colors.blue}
      />
      <AppText
        variant="caption"
        style={[
          styles.actionButtonText,
          destructive && styles.actionButtonDangerText,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

function StatusBadge({ enabled }: { enabled: boolean }) {
  return (
    <View style={[styles.badge, enabled && styles.badgeActive]}>
      <Feather
        name={enabled ? "check" : "minus"}
        size={14}
        color={enabled ? colors.ink : colors.cream}
      />
      <AppText
        variant="caption"
        style={[styles.badgeText, enabled && styles.badgeTextActive]}
      >
        {enabled ? "Ativo" : "Inativo"}
      </AppText>
    </View>
  );
}

function MetaPill({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.metaPill}>
      <Feather name={icon} size={13} color={colors.muted} />
      <AppText variant="caption" tone="muted">
        {text}
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

function formatRadius(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)} km`;
  }

  return `${value} m`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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
  summaryPanel: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: "rgba(142, 207, 184, 0.22)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(142, 207, 184, 0.1)",
  },
  summaryIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.mint,
  },
  summaryCopy: {
    flex: 1,
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
  panelTitle: {
    textTransform: "uppercase",
  },
  formHeader: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  formHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(20, 16, 17, 0.12)",
    borderRadius: 20,
    backgroundColor: colors.shell,
  },
  typeSelector: {
    flexDirection: "row",
    gap: spacing[2],
  },
  typeOption: {
    minHeight: 44,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    borderWidth: 1,
    borderColor: "rgba(20, 16, 17, 0.1)",
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  typeOptionText: {
    color: colors.muted,
  },
  typeOptionTextActive: {
    color: colors.ink,
  },
  preview: {
    minHeight: 132,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(20, 16, 17, 0.1)",
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  previewGrid: {
    minHeight: 92,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.shell,
  },
  previewLineHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 1,
    backgroundColor: "rgba(20, 16, 17, 0.08)",
  },
  previewLineVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: "50%",
    width: 1,
    backgroundColor: "rgba(20, 16, 17, 0.08)",
  },
  previewRadius: {
    width: 68,
    height: 68,
    borderWidth: 2,
    borderColor: colors.coral,
    borderRadius: 34,
    backgroundColor: "rgba(242, 97, 126, 0.14)",
  },
  previewRadiusTrusted: {
    borderColor: colors.mint,
    backgroundColor: "rgba(142, 207, 184, 0.24)",
  },
  previewPin: {
    position: "absolute",
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.coral,
  },
  previewPinTrusted: {
    backgroundColor: colors.mint,
  },
  previewCopy: {
    gap: 2,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  currentLocationButton: {
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
  currentLocationIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.mint,
  },
  currentLocationCopy: {
    flex: 1,
    gap: 2,
  },
  coordinateFields: {
    gap: spacing[3],
  },
  coordinateField: {
    minWidth: 0,
  },
  switchRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  switchIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.ink,
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  stretchButton: {
    alignSelf: "stretch",
  },
  feedback: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: "rgba(142, 207, 184, 0.32)",
  },
  feedbackText: {
    flex: 1,
    color: colors.ink,
  },
  listSection: {
    gap: spacing[3],
    paddingTop: spacing[2],
  },
  listHeader: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing[3],
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.16)",
    borderRadius: 22,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  emptyState: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: "rgba(255, 245, 236, 0.14)",
    borderRadius: radius.sm,
    backgroundColor: "rgba(255, 245, 236, 0.08)",
  },
  locationCard: {
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: "rgba(20, 16, 17, 0.08)",
    borderRadius: radius.sm,
    backgroundColor: colors.cream,
  },
  locationCardInactive: {
    opacity: 0.74,
    backgroundColor: colors.shell,
  },
  locationCardEditing: {
    borderColor: colors.mint,
    borderWidth: 2,
  },
  locationTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  locationAvatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.coral,
  },
  locationAvatarTrusted: {
    backgroundColor: colors.mint,
  },
  locationAvatarInactive: {
    backgroundColor: colors.ink,
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  locationName: {
    flexShrink: 1,
  },
  locationCoordinates: {
    color: colors.ink,
    fontWeight: "800",
  },
  badge: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  badgeActive: {
    backgroundColor: colors.mint,
  },
  badgeText: {
    color: colors.cream,
    fontWeight: "800",
  },
  badgeTextActive: {
    color: colors.ink,
  },
  locationMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  metaPill: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.pill,
    backgroundColor: "rgba(20, 16, 17, 0.06)",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing[2],
  },
  actionButton: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    borderWidth: 1,
    borderColor: "rgba(32, 37, 123, 0.18)",
    borderRadius: radius.pill,
    backgroundColor: colors.white,
  },
  actionButtonDanger: {
    borderColor: "rgba(180, 35, 66, 0.18)",
  },
  actionButtonText: {
    color: colors.blue,
    fontWeight: "800",
  },
  actionButtonDangerText: {
    color: colors.danger,
  },
  disabledAction: {
    opacity: 0.48,
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
});
