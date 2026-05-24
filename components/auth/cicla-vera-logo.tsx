import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { colors, spacing } from '@/constants/theme';

export function CiclaVeraLogo() {
  return (
    <View style={styles.row}>
      <AppText style={styles.cicla}>Cicla</AppText>
      <AppText style={styles.ver}>VER</AppText>
      <View style={styles.lock} accessibilityLabel="Cadeado">
        <View style={styles.lockShackle} />
        <View style={styles.lockBody}>
          <View style={styles.lockHole} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  cicla: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    color: colors.blue,
    letterSpacing: -0.5,
  },
  ver: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '900',
    color: colors.pink,
    letterSpacing: -0.5,
  },
  lock: {
    width: 22,
    height: 26,
    marginLeft: spacing[2],
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  lockShackle: {
    position: 'absolute',
    top: 0,
    width: 14,
    height: 10,
    borderWidth: 3,
    borderColor: colors.blue,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  lockBody: {
    width: 20,
    height: 16,
    borderRadius: 4,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockHole: {
    width: 4,
    height: 5,
    borderRadius: 2,
    backgroundColor: colors.cream,
  },
});
