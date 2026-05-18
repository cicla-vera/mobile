import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CiclaVeraLogo } from '@/components/auth/cicla-vera-logo';
import { UnderlineField } from '@/components/auth/underline-field';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { colors, radius, spacing } from '@/constants/theme';
import { useLoginMutation } from '@/hooks/useAuth';
import { isApiError } from '@/services/api';

function getLoginErrorMessage(error: unknown) {
  if (!isApiError(error)) {
    return 'Nao foi possivel entrar. Tente novamente.';
  }

  const message = error.response?.data?.message;

  if (Array.isArray(message)) {
    return message[0] ?? 'Credenciais invalidas.';
  }

  return message ?? error.response?.data?.error ?? 'Credenciais invalidas.';
}

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const horizontalPadding = spacing[8];
  const contentWidth = windowWidth - horizontalPadding * 2;

  async function handleLogin() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setFormError('Preencha e-mail e senha.');
      return;
    }

    setFormError(null);

    try {
      await loginMutation.mutateAsync({
        email: trimmedEmail,
        password,
      });
      router.replace('/(exterior)');
    } catch (error) {
      setFormError(getLoginErrorMessage(error));
    }
  }

  function handleForgotPassword() {
    Alert.alert(
      'Recuperar senha',
      'A recuperacao de senha sera disponibilizada em breve.',
    );
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
            paddingBottom: Math.max(insets.bottom, spacing[8]) + spacing[8],
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
          <AppText style={styles.title}>Login</AppText>
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
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
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
            onPress={handleForgotPassword}
            activeOpacity={0.7}
            style={styles.forgotButton}
          >
            <AppText style={styles.forgotLabel}>Esqueceu a senha?</AppText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            activeOpacity={0.85}
            style={[
              styles.loginButton,
              { width: contentWidth },
              loginMutation.isPending && styles.loginButtonDisabled,
            ]}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color={colors.cream} />
            ) : (
              <Text style={styles.loginButtonLabel}>Entrar</Text>
            )}
          </TouchableOpacity>
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
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing[6],
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
  forgotButton: {
    alignSelf: 'center',
    paddingVertical: spacing[1],
    marginBottom: spacing[5],
  },
  forgotLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.blue,
    textDecorationLine: 'underline',
  },
  loginButton: {
    minHeight: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonLabel: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: colors.cream,
  },
});
