import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Screen } from '@/components/ui';
import { colors, spacing } from '@/constants/theme';

export default function WelcomeRoute() {
  return (
    <Screen padded={false}>
      <View style={styles.content}>
        <View style={styles.mark} accessibilityElementsHidden>
          <View style={styles.moon} />
          <View style={styles.moonCutout} />
        </View>

        <AppText variant="hero" tone="blue" style={styles.logo}>
          Cicla
        </AppText>
        <AppText tone="soft" style={styles.tagline}>
          conheca seu ciclo
        </AppText>

        <Link href="/login" asChild>
          <Button style={styles.button}>Entrar</Button>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
  },
  mark: {
    width: 190,
    height: 180,
    marginBottom: spacing[4],
  },
  moon: {
    position: 'absolute',
    left: 20,
    top: 4,
    width: 142,
    height: 164,
    borderRadius: 82,
    backgroundColor: colors.pink,
    transform: [{ rotate: '-10deg' }],
  },
  moonCutout: {
    position: 'absolute',
    left: 78,
    top: -6,
    width: 142,
    height: 154,
    borderRadius: 82,
    backgroundColor: colors.cream,
    transform: [{ rotate: '8deg' }],
  },
  logo: {
    marginTop: 2,
  },
  tagline: {
    marginTop: 4,
  },
  button: {
    minWidth: 156,
    marginTop: spacing[12],
  },
});
