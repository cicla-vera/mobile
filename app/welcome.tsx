import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Screen } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';
import { markOnboardingSeen } from '@/services/onboarding-storage';

const highlights = [
  {
    icon: 'calendar' as const,
    title: 'Calendario vivo',
    description: 'Marque menstruacao, previsao, sintomas e dias importantes.',
  },
  {
    icon: 'bar-chart-2' as const,
    title: 'Leitura do mes',
    description: 'Veja historico, graficos e padroes sem complicar a rotina.',
  },
  {
    icon: 'lock' as const,
    title: 'Privacidade primeiro',
    description: 'Sua conta guarda os registros com acesso individual.',
  },
] as const;

export default function WelcomeRoute() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loadingAction, setLoadingAction] = useState<
    'login' | 'register' | null
  >(null);

  async function continueTo(route: '/login' | '/register') {
    setLoadingAction(route === '/login' ? 'login' : 'register');

    try {
      await markOnboardingSeen();
    } finally {
      router.replace(route);
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: spacing[7],
            paddingBottom: Math.max(insets.bottom, spacing[8]) + spacing[6],
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.mark} accessibilityElementsHidden>
            <View style={styles.moon} />
            <View style={styles.moonCutout} />
            <View style={styles.orbit} />
          </View>

          <AppText variant="hero" tone="blue" style={styles.logo}>
            vera
          </AppText>
          <AppText variant="heading" style={styles.title}>
            Um calendario menstrual com memoria e personalidade.
          </AppText>
          <AppText tone="muted" style={styles.copy}>
            Acompanhe seu ciclo, registre sinais do corpo e volte para seus
            padroes quando precisar entender o que mudou.
          </AppText>
        </View>

        <View style={styles.featureList}>
          {highlights.map((item) => (
            <View key={item.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={item.icon} size={17} color={colors.cream} />
              </View>
              <View style={styles.featureCopy}>
                <AppText variant="label">{item.title}</AppText>
                <AppText
                  variant="caption"
                  tone="muted"
                  style={styles.featureText}
                >
                  {item.description}
                </AppText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          <Button
            loading={loadingAction === 'register'}
            disabled={loadingAction !== null}
            onPress={() => void continueTo('/register')}
            style={styles.primaryAction}
          >
            Criar minha conta
          </Button>
          <Pressable
            accessibilityRole="button"
            disabled={loadingAction !== null}
            onPress={() => void continueTo('/login')}
            style={({ pressed }) => [
              styles.loginLink,
              pressed && loadingAction === null && styles.loginLinkPressed,
            ]}
          >
            <AppText variant="label" tone="blue">
              Ja tenho conta
            </AppText>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
  },
  hero: {
    alignItems: 'center',
    paddingTop: spacing[8],
  },
  mark: {
    width: 190,
    height: 172,
    marginBottom: spacing[4],
  },
  moon: {
    position: 'absolute',
    left: 22,
    top: 6,
    width: 138,
    height: 158,
    borderRadius: 80,
    backgroundColor: colors.pink,
    transform: [{ rotate: '-10deg' }],
  },
  moonCutout: {
    position: 'absolute',
    left: 78,
    top: -4,
    width: 138,
    height: 150,
    borderRadius: 80,
    backgroundColor: colors.cream,
    transform: [{ rotate: '8deg' }],
  },
  orbit: {
    position: 'absolute',
    left: 8,
    top: 108,
    width: 168,
    height: 34,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.28)',
    transform: [{ rotate: '-9deg' }],
  },
  logo: {
    textTransform: 'lowercase',
  },
  title: {
    maxWidth: 330,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  copy: {
    maxWidth: 340,
    marginTop: spacing[3],
    textAlign: 'center',
  },
  featureList: {
    gap: spacing[3],
    marginTop: spacing[8],
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(20, 16, 17, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.74)',
    shadowColor: shadow.color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  featureIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.blue,
  },
  featureCopy: {
    flex: 1,
  },
  featureText: {
    marginTop: 2,
  },
  actions: {
    gap: spacing[3],
    marginTop: spacing[8],
  },
  primaryAction: {
    alignSelf: 'stretch',
  },
  loginLink: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkPressed: {
    opacity: 0.68,
  },
});
