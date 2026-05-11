import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InteriorIndexRoute() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Vera</Text>
        <Text style={styles.title}>Area protegida.</Text>
        <Text style={styles.copy}>
          Esta camada fica reservada para o ciclo futuro de seguranca.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#141011',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  eyebrow: {
    color: '#F2617E',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFF5EC',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  copy: {
    color: 'rgba(255, 245, 236, 0.72)',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 16,
  },
});
