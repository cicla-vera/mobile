import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsRoute() {
  return (
    <SafeAreaView style={styles.screen}>
      <View className="flex-1 justify-center px-7">
        <Text className="mb-3.5 text-[13px] font-extrabold uppercase text-vera-blue">
          Configuracoes
        </Text>
        <Text className="text-[34px] font-black leading-10 text-vera-ink">
          Ajuste o Cicla ao seu ritmo.
        </Text>
        <Text className="mt-4 text-base leading-[23px] text-vera-muted">
          Esta rota vai centralizar preferencias, notificacoes e conta.
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
});
