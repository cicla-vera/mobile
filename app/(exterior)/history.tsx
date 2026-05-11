import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryRoute() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>Historico</Text>
        <Text style={styles.title}>Seus ciclos em perspectiva.</Text>
        <Text style={styles.copy}>
          Esta rota vai reunir ciclos anteriores, duracao media e padroes.
        </Text>
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
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  eyebrow: {
    color: '#209ED0',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  title: {
    color: '#141011',
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 40,
  },
  copy: {
    color: '#635957',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 16,
  },
});
