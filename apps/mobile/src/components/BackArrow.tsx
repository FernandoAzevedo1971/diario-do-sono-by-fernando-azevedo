import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/tokens';

export function BackArrow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={16} style={styles.btn}>
      <Text style={styles.icon}>←</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  icon: {
    color: colors.primaryLight,
    fontSize: 20,
    fontWeight: '700',
  },
});
