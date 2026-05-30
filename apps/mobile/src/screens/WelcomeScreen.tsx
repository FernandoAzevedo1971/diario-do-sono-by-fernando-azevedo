import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { AppBackground } from '../components/AppBackground';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors, spacing } from '../theme/tokens';

const RING_SIZE = 128;
const INNER_SIZE = RING_SIZE - 22;

export function WelcomeScreen({ onStart, isReturning = false }: { onStart: () => void; isReturning?: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale   = useRef(new Animated.Value(0.90)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 1300,
        easing: Easing.out(Easing.back(1.15)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <AppBackground>
      <Animated.View style={[styles.container, { opacity, transform: [{ scale }] }]}>

        {/* Lua em anel duplo */}
        <View style={styles.ringOuter}>
          <View style={styles.ringInner}>
            <Text style={styles.moon}>☾</Text>
          </View>
        </View>

        {/* Título */}
        <View style={styles.titleArea}>
          <Text style={styles.title}>DIÁRIO DO SONO</Text>
          <Text style={styles.subtitle}>Seu registro diário para entender melhor seu sono</Text>

          {/* Separador decorativo */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
          </View>
        </View>

        {/* Card de boas-vindas */}
        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>{isReturning ? 'Bem-vindo de volta' : 'Bem-vindo'}</Text>
          <Text style={styles.cardText}>
            {isReturning
              ? 'Pronto para registrar sua noite de hoje?'
              : 'Registre sua percepção do sono pela manhã, acompanhe médias e gere relatórios para seu médico.'}
          </Text>
          <PrimaryButton label={isReturning ? 'Continuar' : 'Começar'} onPress={onStart} />
        </GlassCard>

        {/* Assinatura do médico */}
        <Text style={styles.branding}>Dr. Fernando Azevedo · Pneumologia do Sono</Text>

      </Animated.View>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  ringOuter: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(150,190,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6090FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 6,
  },
  ringInner: {
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: INNER_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(150,190,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(80,110,220,0.06)',
  },
  moon: {
    color: '#C8DEFF',
    fontSize: 54,
    textShadowColor: 'rgba(140,180,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  titleArea: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 3.5,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xs,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(150,190,255,0.2)',
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(150,190,255,0.35)',
  },
  card: {
    gap: spacing.sm,
    width: '100%',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  branding: {
    color: 'rgba(150,180,230,0.38)',
    fontSize: 11,
    letterSpacing: 0.8,
    textAlign: 'center',
    fontWeight: '300',
  },
});
