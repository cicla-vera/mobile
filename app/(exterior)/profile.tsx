import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ImportSourceGrid, ProfileSectionCard } from '@/components/profile';
import { AppText, Button, Screen, TextField } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { useLogout } from '@/hooks/useAuth';
import {
  useUpdateUserProfileMutation,
  useUserProfileQuery,
} from '@/hooks/useUserProfile';
import { getApiErrorMessage } from '@/services/api-error';
import { useAuthStore } from '@/stores/auth.store';

export default function ProfileRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logout = useLogout();
  const cachedUser = useAuthStore((state) => state.user);
  const profileQuery = useUserProfileQuery();
  const updateProfileMutation = useUpdateUserProfileMutation();

  const profile = profileQuery.data;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formFeedback, setFormFeedback] = useState<string | null>(null);

  const displayName = name.trim() || cachedUser?.name || 'Vera';
  const displayEmail = profile?.email ?? cachedUser?.email ?? 'Conta Cicla';
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  useEffect(() => {
    if (!profile) {
      return;
    }

    setName(profile.name ?? '');
    setPhone(profile.phone ?? '');
    setBirthDate(formatDateInput(profile.birthDate));
  }, [profile]);

  async function handleSave() {
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedBirthDate = birthDate.trim();

    if (!trimmedName) {
      setFormError('Digite um nome para o perfil.');
      setFormFeedback(null);
      return;
    }

    if (trimmedBirthDate && !isDateInputValid(trimmedBirthDate)) {
      setFormError('Use a data no formato AAAA-MM-DD.');
      setFormFeedback(null);
      return;
    }

    setFormError(null);
    setFormFeedback(null);

    try {
      await updateProfileMutation.mutateAsync({
        name: trimmedName,
        phone: trimmedPhone,
        birthDate: trimmedBirthDate || undefined,
      });

      setFormFeedback('Perfil atualizado.');
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Nao foi possivel atualizar o perfil.'),
      );
    }
  }

  function handleLogout() {
    Alert.alert('Sair da conta', 'Voce quer encerrar esta sessao?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          void logout().then(() => {
            router.replace('/login');
          });
        },
      },
    ]);
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: spacing[5],
            paddingBottom: Math.max(insets.bottom, spacing[8]) + spacing[6],
          },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={profileQuery.isRefetching}
            onRefresh={() => void profileQuery.refetch()}
            tintColor={colors.blue}
          />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar para o calendario"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={19} color={colors.ink} />
          </Pressable>
          <AppText variant="caption" tone="muted" style={styles.eyebrow}>
            Perfil
          </AppText>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatar}>
            <AppText variant="heading" tone="cream">
              {initials}
            </AppText>
          </View>

          <View style={styles.heroCopy}>
            <View style={styles.heroMeta}>
              <AppText
                variant="heading"
                tone="cream"
                numberOfLines={1}
                style={styles.heroName}
              >
                {displayName}
              </AppText>
              <AppText style={styles.emailSeparator}>·</AppText>
              <AppText
                style={styles.emailText}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {displayEmail}
              </AppText>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sair da conta"
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Feather name="log-out" size={15} color={colors.cream} />
            <AppText variant="caption" tone="cream" style={styles.logoutText}>
              Sair
            </AppText>
          </Pressable>
        </View>

        <View style={styles.infoGrid}>
          <InfoPill
            icon="calendar"
            label="Conta criada"
            value={formatCreatedAt(profile?.createdAt)}
          />
          <InfoPill
            icon="shield"
            label="Sessao"
            value={cachedUser ? 'ativa' : 'protegida'}
          />
        </View>

        <ProfileSectionCard
          title="Dados pessoais"
          subtitle="Atualize nome, telefone e nascimento."
          trailing={
            profileQuery.isLoading ? (
              <ActivityIndicator color={colors.blue} size="small" />
            ) : null
          }
        >
          {profileQuery.isError ? (
            <View style={styles.notice}>
              <Feather name="alert-circle" size={17} color={colors.danger} />
              <AppText variant="caption" style={styles.noticeText}>
                {getApiErrorMessage(
                  profileQuery.error,
                  'Nao deu para carregar o perfil.',
                )}
              </AppText>
            </View>
          ) : null}

          <View style={styles.fields}>
            <TextField
              label="Nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              placeholder="Maria"
            />
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <TextField
                  label="Telefone"
                  value={phone}
                  onChangeText={setPhone}
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  textContentType="telephoneNumber"
                  placeholder="81999999999"
                />
              </View>
              <View style={styles.fieldHalf}>
                <TextField
                  label="Nascimento"
                  value={birthDate}
                  onChangeText={setBirthDate}
                  keyboardType="numbers-and-punctuation"
                  placeholder="1990-01-01"
                />
              </View>
            </View>
          </View>

          {formError ? (
            <AppText variant="caption" style={styles.formError}>
              {formError}
            </AppText>
          ) : null}
          {formFeedback ? (
            <AppText variant="caption" style={styles.formFeedback}>
              {formFeedback}
            </AppText>
          ) : null}

          <Button
            loading={updateProfileMutation.isPending}
            disabled={profileQuery.isLoading}
            onPress={() => void handleSave()}
            style={styles.saveButton}
          >
            Salvar perfil
          </Button>
        </ProfileSectionCard>

        <ProfileSectionCard
          title="Importar dados"
          subtitle="Flo, Apple Health e Health Connect."
        >
          <ImportSourceGrid />
        </ProfileSectionCard>
      </ScrollView>
    </Screen>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoPill}>
      <View style={styles.infoIcon}>
        <Feather name={icon} size={14} color={colors.blue} />
      </View>
      <View style={styles.infoCopy}>
        <AppText variant="caption" tone="muted" numberOfLines={1}>
          {label}
        </AppText>
        <AppText variant="caption" tone="muted">
          {' · '}
        </AppText>
        <AppText variant="label" numberOfLines={1} style={styles.infoValue}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'V';
  }

  return parts.map((part) => part[0]?.toUpperCase()).join('');
}

function formatDateInput(value?: string | null) {
  if (!value) {
    return '';
  }

  return value.slice(0, 10);
}

function isDateInputValid(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function formatCreatedAt(value?: string) {
  if (!value) {
    return 'em breve';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'em breve';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    paddingHorizontal: spacing[5],
    gap: spacing[5],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  eyebrow: {
    textTransform: 'uppercase',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: 0.16,
    shadowRadius: shadow.radius,
    elevation: shadow.elevation,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: colors.pink,
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: spacing[2],
    rowGap: spacing[1],
  },
  heroName: {
    flexShrink: 1,
  },
  emailSeparator: {
    color: 'rgba(255, 245, 236, 0.48)',
    fontSize: 16,
    lineHeight: 24,
  },
  emailText: {
    flexShrink: 1,
    color: 'rgba(255, 245, 236, 0.72)',
    fontSize: 14,
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  infoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  infoIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.shell,
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  infoValue: {
    flexShrink: 1,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  noticeText: {
    flex: 1,
    color: colors.danger,
  },
  fields: {
    gap: spacing[4],
  },
  fieldRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  fieldHalf: {
    flex: 1,
  },
  formError: {
    color: colors.danger,
  },
  formFeedback: {
    color: colors.blue,
  },
  saveButton: {
    alignSelf: 'stretch',
    marginTop: spacing[6],
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    minWidth: 52,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  logoutButtonPressed: {
    opacity: 0.72,
  },
  logoutText: {
    textAlign: 'center',
  },
});
