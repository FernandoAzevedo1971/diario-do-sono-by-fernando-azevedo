import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { SafeAreaView, StyleSheet, View, type ViewProps } from 'react-native';
import { colors } from '../theme/tokens';

export function AppBackground({ children, style }: ViewProps) {
  return (
    <LinearGradient colors={[colors.background, colors.backgroundElevated, '#24164F']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.content, style]}>{children}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
});
