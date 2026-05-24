import { StyleSheet, View } from 'react-native';

import { colors } from '@/constants/theme';

type MoonMarkProps = {
  size?: number;
};

export function MoonMark({ size = 24 }: MoonMarkProps) {
  const moonSize = size * 0.84;

  return (
    <View
      style={{ width: size, height: size * 0.95 }}
      accessibilityElementsHidden
    >
      <View
        style={[
          styles.moon,
          {
            width: moonSize,
            height: moonSize,
            borderRadius: moonSize / 2,
          },
        ]}
      />
      <View
        style={[
          styles.cutout,
          {
            width: moonSize,
            height: moonSize,
            borderRadius: moonSize / 2,
            left: size * 0.16,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  moon: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: '#C4459F',
    transform: [{ rotate: '-10deg' }],
  },
  cutout: {
    position: 'absolute',
    top: -1,
    backgroundColor: colors.cream,
    transform: [{ rotate: '8deg' }],
  },
});
