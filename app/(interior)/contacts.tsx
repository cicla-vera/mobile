import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  View,
} from "react-native";

import { AppText } from "@/components/ui/app-text";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import {
  VaultHeader,
  VaultScrollScreen,
} from "@/components/vera/vault-layout";
import { vaultFormStyles } from "@/components/vera/vault-form-styles";
import { veraTheme } from "@/constants/vera-theme";
import { colors, radius, spacing } from "@/constants/theme";
import {
  useCreateEmergencyContactMutation,
  useDisableEmergencyContactMutation,
  useEmergencyContactsQuery,
  useUpdateEmergencyContactMutation,
} from "@/hooks/vera";
import { getApiErrorMessage } from "@/services/api-error";
import type {
  CreateEmergencyContactRequest,
  EmergencyContact,
  UpdateEmergencyContactRequest,
} from "@/types/vera.types";

const PHONE_PATTERN = /^\+?[0-9\s().-]+$/;

type ContactFormState = {
  name: string;
  phone: string;
  relationship: string;
  priority: string;
  enabled: boolean;
};

function createEmptyForm(): ContactFormState {
  return {
    name: "",
    phone: "",
    relationship: "",
    priority: "0",
    enabled: true,
  };
}

export default function VeraContactsRoute() {
  const contactsQuery = useEmergencyContactsQuery(true);
  const createContactMutation = useCreateEmergencyContactMutation();
  const updateContactMutation = useUpdateEmergencyContactMutation();
  const disableContactMutation = useDisableEmergencyContactMutation();
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null,
  );
  const [form, setForm] = useState<ContactFormState>(() => createEmptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const contacts = contactsQuery.data ?? [];
  const activeCount = useMemo(
    () => contacts.filter((contact) => contact.enabled).length,
    [contacts],
  );
  const inactiveCount = contacts.length - activeCount;
  const isMutating =
    createContactMutation.isPending ||
    updateContactMutation.isPending ||
    disableContactMutation.isPending;
  const contactsError = contactsQuery.isError
    ? getApiErrorMessage(
        contactsQuery.error,
        "Nao deu para carregar os contatos de emergencia agora.",
      )
    : null;
  const mutationError = createContactMutation.error
    ? getApiErrorMessage(
        createContactMutation.error,
        "Nao deu para salvar o contato agora.",
      )
    : updateContactMutation.error
      ? getApiErrorMessage(
          updateContactMutation.error,
          "Nao deu para atualizar o contato agora.",
        )
      : disableContactMutation.error
        ? getApiErrorMessage(
            disableContactMutation.error,
            "Nao deu para desativar o contato agora.",
          )
        : null;

  function resetMutationState() {
    createContactMutation.reset();
    updateContactMutation.reset();
    disableContactMutation.reset();
  }

  function updateFormField<Key extends keyof ContactFormState>(
    key: Key,
    value: ContactFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFormError(null);
    setFeedback(null);
    resetMutationState();
  }

  function handlePriorityChange(value: string) {
    updateFormField("priority", value.replace(/\D/g, "").slice(0, 3));
  }

  function handleCreateMode() {
    setEditingContact(null);
    setForm(createEmptyForm());
    setFormError(null);
    setFeedback(null);
    resetMutationState();
  }

  function handleEdit(contact: EmergencyContact) {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship ?? "",
      priority: String(contact.priority),
      enabled: contact.enabled,
    });
    setFormError(null);
    setFeedback(null);
    resetMutationState();
  }

  async function handleSubmit() {
    const payload = validateAndBuildPayload(form, Boolean(editingContact));

    if (typeof payload === "string") {
      setFormError(payload);
      return;
    }

    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      if (editingContact) {
        const updatePayload: UpdateEmergencyContactRequest = {
          ...payload,
          enabled: form.enabled,
        };

        const updatedContact = await updateContactMutation.mutateAsync({
          id: editingContact.id,
          payload: updatePayload,
        });

        handleEdit(updatedContact);
        setFeedback("Contato atualizado.");
        return;
      }

      const createdContact = await createContactMutation.mutateAsync(payload);

      if (!form.enabled) {
        await updateContactMutation.mutateAsync({
          id: createdContact.id,
          payload: { enabled: false },
        });
      }

      handleCreateMode();
      setFeedback("Contato criado.");
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  function handleDisable(contact: EmergencyContact) {
    Alert.alert(
      "Desativar contato",
      `O contato ${contact.name} deixa de ser acionado em alertas criticos. Ele continua no historico e pode ser reativado.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Desativar",
          style: "destructive",
          onPress: () => {
            void disableContact(contact);
          },
        },
      ],
    );
  }

  async function disableContact(contact: EmergencyContact) {
    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      const disabledContact = await disableContactMutation.mutateAsync(
        contact.id,
      );

      if (editingContact?.id === disabledContact.id) {
        handleEdit(disabledContact);
      }

      setFeedback("Contato desativado.");
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  async function reactivateContact(contact: EmergencyContact) {
    setFormError(null);
    setFeedback(null);
    resetMutationState();

    try {
      const reactivatedContact = await updateContactMutation.mutateAsync({
        id: contact.id,
        payload: { enabled: true },
      });

      if (editingContact?.id === reactivatedContact.id) {
        handleEdit(reactivatedContact);
      }

      setFeedback("Contato reativado.");
    } catch {
      // Mutation errors are rendered from React Query state.
    }
  }

  return (
    <VaultScrollScreen keyboard>
        <VaultHeader
          title="Contatos de emergencia"
          subtitle="Quem pode receber alertas caso algo ocorra com voce"
        />

        <View style={styles.summaryPanel}>
          <View style={styles.summaryIcon}>
            <Feather name="phone-call" size={20} color={colors.ink} />
          </View>
          <View style={styles.summaryCopy}>
            <AppText variant="label" tone="ink">
              {activeCount} contatos ativos
            </AppText>
            <AppText variant="caption" style={styles.mutedText}>
              {inactiveCount > 0
                ? `${inactiveCount} contatos inativos ficam fora dos alertas.`
                : "Prioridade menor aparece primeiro nos acionamentos."}
            </AppText>
          </View>
        </View>

        {contactsQuery.isLoading ? (
          <View style={styles.loadingPanel}>
            <ActivityIndicator color={colors.mint} size="large" />
            <AppText variant="caption" style={styles.mutedText}>
              Carregando contatos...
            </AppText>
          </View>
        ) : null}

        {contactsError ? (
          <Message
            text={contactsError}
            actionLabel="Tentar de novo"
            onAction={() => void contactsQuery.refetch()}
          />
        ) : null}

        <View style={styles.panel}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <AppText variant="label" style={styles.panelTitle}>
                {editingContact ? "Editar contato" : "Novo contato"}
              </AppText>
              <AppText variant="caption" tone="muted">
                Dados usados apenas em fluxos Vera de emergencia.
              </AppText>
            </View>

            {editingContact ? (
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
            accessibilityLabel="Nome do contato de emergencia"
            autoCapitalize="words"
            error={formError?.startsWith("Nome") ? formError : undefined}
            label="Nome"
            maxLength={80}
            onChangeText={(value) => updateFormField("name", value)}
            placeholder="Nome do contato"
            returnKeyType="next"
            value={form.name}
          />

          <TextField
            accessibilityLabel="Telefone do contato de emergencia"
            autoComplete="tel"
            error={formError?.startsWith("Telefone") ? formError : undefined}
            inputMode="tel"
            keyboardType="phone-pad"
            label="Telefone"
            maxLength={32}
            onChangeText={(value) => updateFormField("phone", value)}
            placeholder="+55 85 99999-0000"
            returnKeyType="next"
            value={form.phone}
          />

          <View style={styles.inlineFields}>
            <View style={styles.inlineField}>
              <TextField
                accessibilityLabel="Relacao com o contato"
                autoCapitalize="words"
                error={formError?.startsWith("Relacao") ? formError : undefined}
                label="Relacao"
                maxLength={60}
                onChangeText={(value) => updateFormField("relationship", value)}
                placeholder="Irma, amiga..."
                returnKeyType="next"
                value={form.relationship}
              />
            </View>
            <View style={styles.priorityField}>
              <TextField
                accessibilityLabel="Prioridade do contato"
                error={
                  formError?.startsWith("Prioridade") ? formError : undefined
                }
                inputMode="numeric"
                keyboardType="number-pad"
                label="Prioridade"
                maxLength={3}
                onChangeText={handlePriorityChange}
                onSubmitEditing={handleSubmit}
                placeholder="0"
                returnKeyType="done"
                value={form.priority}
              />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchIcon}>
              <Feather
                name={form.enabled ? "check-circle" : "minus-circle"}
                size={17}
                color={colors.ink}
              />
            </View>
            <View style={styles.switchCopy}>
              <AppText variant="label">Contato ativo</AppText>
              <AppText variant="caption" tone="muted">
                Contatos inativos nao sao acionados em alertas.
              </AppText>
            </View>
            <Switch
              accessibilityLabel="Contato ativo"
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
          !formError.startsWith("Telefone") &&
          !formError.startsWith("Relacao") &&
          !formError.startsWith("Prioridade") ? (
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
            disabled={isMutating}
            loading={
              createContactMutation.isPending || updateContactMutation.isPending
            }
            onPress={handleSubmit}
            style={styles.stretchButton}
          >
            {editingContact ? "Salvar contato" : "Criar contato"}
          </Button>
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <View>
              <AppText variant="label" style={styles.listTitle}>
                Contatos cadastrados
              </AppText>
              <AppText variant="caption" style={styles.mutedText}>
                Toque para editar ou desativar um contato.
              </AppText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Atualizar contatos"
              disabled={contactsQuery.isFetching}
              onPress={() => void contactsQuery.refetch()}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.pressed,
                contactsQuery.isFetching && styles.disabledAction,
              ]}
            >
              {contactsQuery.isFetching ? (
                <ActivityIndicator color={veraTheme.icon} />
              ) : (
                <Feather name="refresh-cw" size={18} color={veraTheme.icon} />
              )}
            </Pressable>
          </View>

          {!contactsQuery.isLoading && contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="user-plus" size={24} color={colors.mint} />
              <AppText variant="label" tone="cream">
                Nenhum contato ainda
              </AppText>
              <AppText variant="caption" style={styles.mutedText}>
                Cadastre pelo menos uma pessoa confiavel para acionamentos.
              </AppText>
            </View>
          ) : null}

          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              disabled={isMutating}
              isEditing={editingContact?.id === contact.id}
              onDisable={handleDisable}
              onEdit={handleEdit}
              onReactivate={(selectedContact) => {
                void reactivateContact(selectedContact);
              }}
            />
          ))}
        </View>
    </VaultScrollScreen>
  );
}

function validateAndBuildPayload(
  form: ContactFormState,
  isEditing: boolean,
): CreateEmergencyContactRequest | string {
  const name = form.name.trim();
  const phone = form.phone.trim();
  const relationship = form.relationship.trim();
  const priorityText = form.priority.trim();
  const priority = priorityText ? Number(priorityText) : 0;

  if (name.length < 2) {
    return "Nome deve ter pelo menos 2 caracteres.";
  }

  if (name.length > 80) {
    return "Nome deve ter no maximo 80 caracteres.";
  }

  if (phone.length < 8) {
    return "Telefone deve ter pelo menos 8 caracteres.";
  }

  if (phone.length > 32 || !PHONE_PATTERN.test(phone)) {
    return "Telefone deve conter apenas numeros, espacos e sinais comuns.";
  }

  if (relationship.length > 60) {
    return "Relacao deve ter no maximo 60 caracteres.";
  }

  if (!Number.isInteger(priority) || priority < 0) {
    return "Prioridade deve ser um numero inteiro maior ou igual a zero.";
  }

  const payload: CreateEmergencyContactRequest = {
    name,
    phone,
    priority,
  };

  if (relationship || isEditing) {
    payload.relationship = relationship;
  }

  return payload;
}

function ContactCard({
  contact,
  disabled,
  isEditing,
  onDisable,
  onEdit,
  onReactivate,
}: {
  contact: EmergencyContact;
  disabled: boolean;
  isEditing: boolean;
  onDisable: (contact: EmergencyContact) => void;
  onEdit: (contact: EmergencyContact) => void;
  onReactivate: (contact: EmergencyContact) => void;
}) {
  return (
    <View
      style={[
        styles.contactCard,
        !contact.enabled && styles.contactCardInactive,
        isEditing && styles.contactCardEditing,
      ]}
    >
      <View style={styles.contactTopRow}>
        <View
          style={[
            styles.contactAvatar,
            !contact.enabled && styles.contactAvatarInactive,
          ]}
        >
          <Feather
            name={contact.enabled ? "user-check" : "user-x"}
            size={18}
            color={contact.enabled ? colors.ink : veraTheme.icon}
          />
        </View>

        <View style={styles.contactCopy}>
          <AppText variant="label" style={styles.contactName}>
            {contact.name}
          </AppText>
          <AppText variant="caption" tone="muted">
            {contact.relationship || "Relacao nao informada"}
          </AppText>
          <AppText variant="body" style={styles.contactPhone}>
            {contact.phone}
          </AppText>
        </View>

        <StatusBadge enabled={contact.enabled} />
      </View>

      <View style={styles.contactMetaRow}>
        <MetaPill icon="flag" text={`Prioridade ${contact.priority}`} />
        <MetaPill icon="clock" text={formatDate(contact.updatedAt)} />
      </View>

      <View style={styles.actionRow}>
        <ActionButton
          disabled={disabled}
          icon="edit-2"
          label="Editar"
          onPress={() => onEdit(contact)}
        />

        {contact.enabled ? (
          <ActionButton
            destructive
            disabled={disabled}
            icon="slash"
            label="Desativar"
            onPress={() => onDisable(contact)}
          />
        ) : (
          <ActionButton
            disabled={disabled}
            icon="refresh-cw"
            label="Reativar"
            onPress={() => onReactivate(contact)}
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
        color={enabled ? colors.ink : veraTheme.icon}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  ...vaultFormStyles,
  summaryPanel: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: veraTheme.summaryBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.summaryBackground,
  },
  summaryIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: veraTheme.chipBackground,
  },
  summaryCopy: {
    flex: 1,
  },
  mutedText: {
    color: veraTheme.mutedText,
  },
  loadingPanel: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.loadingBackground,
  },
  panel: {
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: veraTheme.panelBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
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
  inlineFields: {
    gap: spacing[3],
  },
  inlineField: {
    minWidth: 0,
  },
  priorityField: {
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
    backgroundColor: veraTheme.chipBackgroundMuted,
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
  listTitle: {
    textTransform: "uppercase",
    color: veraTheme.sectionTitle,
  },
  refreshButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: veraTheme.backButtonBackground,
  },
  emptyState: {
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: veraTheme.emptyBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.emptyBackground,
  },
  contactCard: {
    gap: spacing[4],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: veraTheme.panelBorder,
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
  },
  contactCardInactive: {
    opacity: 0.74,
    backgroundColor: colors.shell,
  },
  contactCardEditing: {
    borderColor: colors.mint,
    borderWidth: 2,
  },
  contactTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[3],
  },
  contactAvatar: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: veraTheme.chipBackground,
  },
  contactAvatarInactive: {
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  contactCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  contactName: {
    flexShrink: 1,
  },
  contactPhone: {
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
    backgroundColor: veraTheme.chipBackgroundMuted,
  },
  badgeActive: {
    backgroundColor: colors.mint,
  },
  badgeText: {
    color: colors.ink,
    fontWeight: "800",
  },
  badgeTextActive: {
    color: colors.ink,
  },
  contactMetaRow: {
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: veraTheme.panelBackground,
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
