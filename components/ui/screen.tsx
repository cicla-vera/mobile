import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import {
  SafeAreaView,
  type Edge,
} from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';

const DEFAULT_EDGES: Edge[] = ['top', 'right', 'bottom', 'left'];

type ScreenProps = {
  children: ReactNode;
  padded?: boolean;
  style?: ViewStyle;
  edges?: Edge[];
};

export function Screen({
  children,
  padded = true,
  style,
  edges = DEFAULT_EDGES,
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={styles.screen}>
      <View style={[styles.content, padded && styles.padded, style]}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing[6],
  },
});
