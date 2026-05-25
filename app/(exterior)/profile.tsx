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
            <AppText variant="heading">{displayName}</AppText>
            <AppText tone="muted" style={styles.emailText}>
              {displayEmail}
            </AppText>
          </View>
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

        <View style={styles.formCard}>
          <View style={styles.sectionHeader}>
            <AppText variant="label">Dados pessoais</AppText>
            {profileQuery.isLoading ? (
              <ActivityIndicator color={colors.blue} size="small" />
            ) : null}
          </View>

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
              placeholder="Seu nome"
            />
            <TextField
              label="Telefone"
              value={phone}
              onChangeText={setPhone}
              autoComplete="tel"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              placeholder="(00) 00000-0000"
            />
            <TextField
              label="Nascimento"
              value={birthDate}
              onChangeText={setBirthDate}
              keyboardType="numbers-and-punctuation"
              placeholder="AAAA-MM-DD"
            />
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
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/(exterior)/data-import',
              params: { source: 'flo' },
            })
          }
          style={({ pressed }) => [
            styles.importCard,
            pressed && styles.importCardPressed,
          ]}
        >
          <View style={styles.importIcon}>
            <Feather name="upload-cloud" size={17} color={colors.blue} />
          </View>
          <View style={styles.importCopy}>
            <AppText variant="label">Importar Flo</AppText>
            <AppText variant="caption" tone="muted">
              Trazer historico exportado do Flo.
            </AppText>
          </View>
          <Feather name="chevron-right" size={18} color={colors.soft} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({
              pathname: '/(exterior)/data-import',
              params: { source: 'apple-health' },
            })
          }
          style={({ pressed }) => [
            styles.importCard,
            pressed && styles.importCardPressed,
          ]}
        >
          <View style={styles.importIcon}>
            <Feather name="heart" size={17} color={colors.blue} />
          </View>
          <View style={styles.importCopy}>
            <AppText variant="label">Apple Health</AppText>
            <AppText variant="caption" tone="muted">
              Importar export.xml do app Saude.
            </AppText>
          </View>
          <Feather name="chevron-right" size={18} color={colors.soft} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.logoutButtonPressed,
          ]}
        >
          <Feather name="log-out" size={17} color={colors.danger} />
          <AppText variant="label" style={styles.logoutText}>
            Sair da conta
          </AppText>
        </Pressable>
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
        <AppText variant="caption" tone="muted">
          {label}
        </AppText>
        <AppText variant="label">{value}</AppText>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    gap: spacing[4],
    marginTop: spacing[5],
    padding: spacing[5],
    borderRadius: radius.md,
    backgroundColor: colors.blue,
    shadowColor: shadow.color,
    shadowOffset: shadow.offset,
    shadowOpacity: 0.16,
    shadowRadius: shadow.radius,
    elevation: shadow.elevation,
  },
  avatar: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 33,
    backgroundColor: colors.pink,
  },
  heroCopy: {
    flex: 1,
  },
  emailText: {
    color: 'rgba(255, 245, 236, 0.72)',
    marginTop: spacing[1],
  },
  infoGrid: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  infoPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
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
  },
  formCard: {
    marginTop: spacing[5],
    padding: spacing[5],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[4],
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
  formError: {
    marginTop: spacing[4],
    color: colors.danger,
  },
  formFeedback: {
    marginTop: spacing[4],
    color: colors.blue,
  },
  saveButton: {
    alignSelf: 'stretch',
    marginTop: spacing[5],
  },
  importCard: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginTop: spacing[5],
    padding: spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  importCardPressed: {
    opacity: 0.72,
  },
  importIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.shell,
  },
  importCopy: {
    flex: 1,
  },
  logoutButton: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    marginTop: spacing[5],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(180, 35, 66, 0.08)',
  },
  logoutButtonPressed: {
    opacity: 0.72,
  },
  logoutText: {
    color: colors.danger,
  },
});
