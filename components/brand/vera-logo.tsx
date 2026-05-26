import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

const logoSource = require('@/assets/images/cicla-vera-logo.png');

const LOGO_ASPECT_RATIO = 86 / 35;

type VeraLogoProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export function VeraLogo({
  width = 86,
  height,
  style,
  imageStyle,
}: VeraLogoProps) {
  const resolvedHeight = height ?? Math.round(width / LOGO_ASPECT_RATIO);

  return (
    <View style={[styles.container, style]}>
      <Image
        accessibilityLabel="Vera"
        resizeMode="contain"
        source={logoSource}
        style={[{ width, height: resolvedHeight }, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
