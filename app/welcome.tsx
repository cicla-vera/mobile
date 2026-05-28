import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { AppText, Screen } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/constants/theme';

const rhythmNotes = ['menstruação', 'sintomas', 'humor', 'ciclo'];

export default function WelcomeRoute() {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<
    'login' | 'register' | null
  >(null);

  function continueTo(route: '/login' | '/register') {
    setLoadingAction(route === '/login' ? 'login' : 'register');
    router.replace(route);
  }

  return (
    <Screen padded={false}>
      <View style={styles.root}>
        <View style={styles.hero}>
          <CiclaMoonMark />

          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>Cicla</Text>
            <Text style={styles.eyebrow}>calendário menstrual</Text>
          </View>

          <Text style={styles.title}>
            Seu ciclo em um calendário que respeita seu ritmo.
          </Text>
          <Text style={styles.copy}>
            Registre menstruação, sintomas e humor com calma. O Cicla organiza
            seus sinais para você enxergar padrões sem transformar cuidado em
            tarefa.
          </Text>

          <View style={styles.rhythmRow} accessibilityElementsHidden>
            {rhythmNotes.map((note, index) => (
              <View key={note} style={styles.rhythmItem}>
                {index > 0 ? <View style={styles.rhythmDot} /> : null}
                <AppText variant="caption" style={styles.rhythmText}>
                  {note}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.84}
            accessibilityRole="button"
            disabled={loadingAction !== null}
            onPress={() => continueTo('/register')}
            style={[
              styles.primaryButton,
              loadingAction !== null && styles.disabled,
            ]}
          >
            {loadingAction === 'register' ? (
              <ActivityIndicator color={colors.cream} />
            ) : (
              <AppText style={styles.primaryButtonLabel}>
                Criar minha conta
              </AppText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.74}
            accessibilityRole="button"
            disabled={loadingAction !== null}
            onPress={() => continueTo('/login')}
            style={[
              styles.secondaryButton,
              loadingAction !== null && styles.disabled,
            ]}
          >
            {loadingAction === 'login' ? (
              <ActivityIndicator color={colors.blue} />
            ) : (
              <AppText style={styles.secondaryButtonLabel}>
                Entrar
              </AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Screen>
  );
}

function CiclaMoonMark() {
  return (
    <View style={styles.mark} accessibilityLabel="Logo Cicla">
      <View style={styles.markGlow} />
      <View style={styles.moon} />
      <View style={styles.moonCutout} />
      <View style={styles.smallStar} />
      <View style={styles.calendarBadge}>
        <View style={styles.badgeBindingRow}>
          <View style={styles.badgeBinding} />
          <View style={styles.badgeBinding} />
        </View>
        <View style={styles.badgeLineLong} />
        <View style={styles.badgeLineShort} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing[6],
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: spacing[10],
    paddingBottom: spacing[4],
  },
  mark: {
    width: 244,
    height: 228,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  markGlow: {
    position: 'absolute',
    left: 28,
    top: 18,
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: 'rgba(242, 97, 126, 0.11)',
  },
  moon: {
    position: 'absolute',
    left: 45,
    top: 18,
    width: 150,
    height: 174,
    borderRadius: 92,
    backgroundColor: colors.pink,
    transform: [{ rotate: '-8deg' }],
    shadowColor: colors.pink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 4,
  },
  moonCutout: {
    position: 'absolute',
    left: 112,
    top: 12,
    width: 150,
    height: 178,
    borderRadius: 96,
    backgroundColor: colors.cream,
    transform: [{ rotate: '-5deg' }],
  },
  smallStar: {
    position: 'absolute',
    right: 26,
    bottom: 80,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  calendarBadge: {
    position: 'absolute',
    right: 29,
    bottom: 20,
    width: 68,
    height: 60,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.1)',
    paddingHorizontal: spacing[2],
    paddingTop: spacing[2],
    shadowColor: shadow.color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  badgeBindingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    marginBottom: spacing[2],
  },
  badgeBinding: {
    width: 6,
    height: 12,
    borderRadius: 3,
    backgroundColor: colors.blue,
  },
  badgeLineLong: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.shell,
    marginBottom: spacing[1],
  },
  badgeLineShort: {
    width: 29,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(201, 73, 168, 0.2)',
  },
  brandBlock: {
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[2],
  },
  brandName: {
    color: colors.blue,
    fontSize: 58,
    lineHeight: 62,
    fontWeight: '900',
  },
  eyebrow: {
    color: colors.pink,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    maxWidth: 430,
    marginTop: spacing[6],
    color: colors.ink,
    fontSize: 33,
    lineHeight: 40,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
  },
  copy: {
    maxWidth: 420,
    marginTop: spacing[5],
    color: colors.muted,
    fontSize: 18,
    lineHeight: 27,
    textAlign: 'center',
    letterSpacing: 0,
  },
  rhythmRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[3],
    marginTop: spacing[4],
    paddingHorizontal: spacing[2],
  },
  rhythmItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  rhythmDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  rhythmText: {
    color: colors.coffee,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  actions: {
    gap: spacing[3],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
    backgroundColor: colors.cream,
  },
  primaryButton: {
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.blue,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 4,
  },
  primaryButtonLabel: {
    color: colors.cream,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  secondaryButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(32, 37, 123, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
  },
  secondaryButtonLabel: {
    color: colors.blue,
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '900',
  },
  disabled: {
    opacity: 0.58,
  },
});
