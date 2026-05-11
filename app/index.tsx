import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashRoute() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.mark} accessibilityElementsHidden>
          <View style={styles.moon} />
          <View style={styles.moonCutout} />
        </View>

        <Text style={styles.logo}>Cicla</Text>
        <Text style={styles.tagline}>conheca seu ciclo</Text>

        <Link href="/(exterior)" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonLabel}>Entrar</Text>
          </Pressable>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF5EC',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  mark: {
    width: 190,
    height: 180,
    marginBottom: 16,
  },
  moon: {
    position: 'absolute',
    left: 20,
    top: 4,
    width: 142,
    height: 164,
    borderRadius: 82,
    backgroundColor: '#C949A8',
    transform: [{ rotate: '-10deg' }],
  },
  moonCutout: {
    position: 'absolute',
    left: 78,
    top: -6,
    width: 142,
    height: 154,
    borderRadius: 82,
    backgroundColor: '#FFF5EC',
    transform: [{ rotate: '8deg' }],
  },
  logo: {
    color: '#20257B',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0,
    marginTop: 2,
  },
  tagline: {
    color: '#A6A6A6',
    fontSize: 16,
    marginTop: 4,
  },
  button: {
    minWidth: 156,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 56,
    borderRadius: 22,
    backgroundColor: '#20257B',
  },
  buttonLabel: {
    color: '#FFF5EC',
    fontSize: 15,
    fontWeight: '700',
  },
});
