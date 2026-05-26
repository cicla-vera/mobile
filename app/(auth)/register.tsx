import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { CiclaVeraLogo } from '@/components/auth/cicla-vera-logo';
import { UnderlineField } from '@/components/auth/underline-field';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors, radius, spacing } from '@/constants/theme';
import { useRegisterMutation } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/api-error';

export default function RegisterScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const registerMutation = useRegisterMutation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const horizontalPadding = spacing[8];
  const contentWidth = windowWidth - horizontalPadding * 2;
  const isRegistering = registerMutation.isPending;

  async function handleRegister() {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password) {
      setFormError('Preencha nome, email e senha.');
      return;
    }

    if (password.length < 8) {
      setFormError('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }

    setFormError(null);

    try {
      await registerMutation.mutateAsync({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });

      router.replace('/(exterior)');
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Nao foi possivel criar sua conta agora.'),
      );
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: spacing[10],
            paddingBottom: spacing[8] + spacing[8],
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.logoSection}>
          <CiclaVeraLogo />
        </View>

        <View style={[styles.formSection, { width: contentWidth }]}>
          <AppText style={styles.title}>Cadastro</AppText>
          <View style={styles.fieldSpacing}>
            <UnderlineField
              label="Nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />
          </View>
          <View style={styles.fieldSpacing}>
            <UnderlineField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />
          </View>
          <UnderlineField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
            onSubmitEditing={handleRegister}
          />
        </View>

        <View style={[styles.messageSection, { width: contentWidth }]}>
          {formError ? (
            <AppText variant="caption" style={styles.formError}>
              {formError}
            </AppText>
          ) : null}
        </View>

        <View style={[styles.actionsSection, { width: contentWidth }]}>
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isRegistering}
            activeOpacity={0.85}
            style={[
              styles.primaryButton,
              { width: contentWidth },
              isRegistering && styles.primaryButtonDisabled,
            ]}
          >
            {isRegistering ? (
              <ActivityIndicator color={colors.cream} />
            ) : (
              <Text style={styles.primaryButtonLabel}>Criar conta</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <AppText style={styles.loginText}>Ja tem conta?</AppText>
            <Link href="/login" asChild>
              <TouchableOpacity activeOpacity={0.7} style={styles.loginLink}>
                <AppText style={styles.loginLabel}>Entrar</AppText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: spacing[8],
    marginBottom: spacing[8],
  },
  formSection: {
    alignSelf: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
    marginBottom: spacing[6],
    textAlign: 'center',
  },
  fieldSpacing: {
    marginBottom: spacing[7],
  },
  messageSection: {
    alignSelf: 'center',
    minHeight: 24,
    justifyContent: 'center',
    marginTop: spacing[5],
    marginBottom: spacing[5],
    paddingHorizontal: spacing[2],
  },
  formError: {
    color: colors.danger,
    textAlign: 'center',
  },
  actionsSection: {
    alignSelf: 'center',
    marginTop: spacing[2],
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  primaryButtonDisabled: {
    opacity: 0.65,
  },
  primaryButtonLabel: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 20,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[6],
  },
  loginText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  loginLink: {
    paddingVertical: spacing[1],
  },
  loginLabel: {
    color: colors.blue,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
    textDecorationLine: 'underline',
  },
});
