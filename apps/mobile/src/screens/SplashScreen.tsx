import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/tokens';

// ─── Estrelas fixas com posições pré-definidas ────────────────────────────────
// Evitam a região central (onde ficam lua + título)

const STARS: Array<{ x: string; y: string; r: number; delay: number; duration: number }> = [
  { x: '8%',  y: '7%',  r: 1.5, delay: 0,    duration: 3200 },
  { x: '83%', y: '5%',  r: 2,   delay: 700,  duration: 2800 },
  { x: '22%', y: '13%', r: 1,   delay: 300,  duration: 3600 },
  { x: '65%', y: '10%', r: 2,   delay: 1100, duration: 2600 },
  { x: '91%', y: '20%', r: 1.5, delay: 200,  duration: 3400 },
  { x: '5%',  y: '30%', r: 1,   delay: 900,  duration: 2900 },
  { x: '94%', y: '42%', r: 2,   delay: 500,  duration: 3100 },
  { x: '10%', y: '55%', r: 1,   delay: 1300, duration: 2700 },
  { x: '88%', y: '62%', r: 1.5, delay: 400,  duration: 3500 },
  { x: '4%',  y: '72%', r: 2,   delay: 800,  duration: 2800 },
  { x: '92%', y: '78%', r: 1,   delay: 100,  duration: 3300 },
  { x: '18%', y: '84%', r: 1.5, delay: 600,  duration: 3000 },
];

function Star({ x, y, r, delay, duration }: typeof STARS[0]) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.85, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.15, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        starStyle.dot,
        { left: x as unknown as number, top: y as unknown as number, width: r * 2, height: r * 2, borderRadius: r, opacity },
      ]}
    />
  );
}

const starStyle = StyleSheet.create({
  dot: { position: 'absolute', backgroundColor: '#fff' },
});

// ─── Lua crescente com halos ──────────────────────────────────────────────────

function Moon({ scaleAnim, glowAnim }: { scaleAnim: Animated.Value; glowAnim: Animated.Value }) {
  return (
    <Animated.View style={[moonStyle.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      {/* Halos concêntricos que pulsam */}
      <Animated.View style={[moonStyle.halo, moonStyle.halo3, { opacity: glowAnim }]} />
      <Animated.View style={[moonStyle.halo, moonStyle.halo2, { opacity: glowAnim }]} />
      <Animated.View style={[moonStyle.halo, moonStyle.halo1, { opacity: glowAnim }]} />
      {/* Lua */}
      <Text style={moonStyle.moon}>☾</Text>
    </Animated.View>
  );
}

const moonStyle = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', borderRadius: 999 },
  halo1: { width: 190, height: 190, backgroundColor: 'rgba(248,200,106,0.14)' },
  halo2: { width: 260, height: 260, backgroundColor: 'rgba(248,200,106,0.07)' },
  halo3: { width: 340, height: 340, backgroundColor: 'rgba(248,200,106,0.03)' },
  moon:  {
    fontSize: 120,
    color: '#F8C86A',
    textShadowColor: 'rgba(248,200,106,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 40,
  },
});

// ─── SplashScreen ─────────────────────────────────────────────────────────────

export function SplashScreen() {
  // Valores animados
  const screenOpacity   = useRef(new Animated.Value(0)).current;
  const moonOpacity     = useRef(new Animated.Value(0)).current;
  const moonScale       = useRef(new Animated.Value(0.85)).current;
  const glowOpacity     = useRef(new Animated.Value(0.2)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const titleOpacity    = useRef(new Animated.Value(0)).current;
  const markOpacity     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fase 1 — aparecimento inicial
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1, duration: 700, useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.timing(moonOpacity, {
            toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true,
          }),
          Animated.timing(moonScale, {
            toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(600),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1, duration: 700, useNativeDriver: true,
          }),
          Animated.timing(titleTranslateY, {
            toValue: 0, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(1100),
        Animated.timing(markOpacity, {
          toValue: 0.28, duration: 900, useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Fase 2 — loops contínuos
      Animated.loop(
        Animated.sequence([
          Animated.timing(moonScale, { toValue: 1.05, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(moonScale, { toValue: 1.00, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.65, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.20, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <LinearGradient
        colors={['#060919', '#0C1130', '#130C38']}
        locations={[0, 0.55, 1]}
        style={styles.gradient}
      >
        {/* ── Estrelas ── */}
        <View style={styles.starsLayer} pointerEvents="none">
          {STARS.map((s, i) => <Star key={i} {...s} />)}
        </View>

        {/* ── Conteúdo principal ── */}
        <View style={styles.center}>
          {/* Lua */}
          <Animated.View style={{ opacity: moonOpacity }}>
            <Moon scaleAnim={moonScale} glowAnim={glowOpacity} />
          </Animated.View>

          {/* Título */}
          <Animated.View style={[styles.titleBlock, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}>
            <Text style={styles.titleLine1}>DIÁRIO</Text>
            <Text style={styles.titleLine2}>DO SONO</Text>
            <View style={styles.divider} />
            <Text style={styles.subtitle}>Seu registro clínico do sono</Text>
          </Animated.View>
        </View>

        {/* ── Marca d'água (estilo da referência) ── */}
        <Animated.View style={[styles.watermark, { opacity: markOpacity }]}>
          <Text style={styles.watermarkLine}>BY FERNANDO AZEVEDO</Text>
          <Text style={styles.watermarkLine}>PNEUMOLOGIA  ·  MEDICINA DO SONO</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 36,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 0,
  },
  titleLine1: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 14,
    lineHeight: 56,
    textAlign: 'center',
  },
  titleLine2: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: 14,
    lineHeight: 52,
    textAlign: 'center',
  },
  divider: {
    width: 48,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#F8C86A',
    opacity: 0.6,
    marginTop: 16,
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    letterSpacing: 1.5,
    textAlign: 'center',
    fontWeight: '300',
  },
  watermark: {
    position: 'absolute',
    bottom: 44,
    alignItems: 'center',
    gap: 5,
  },
  watermarkLine: {
    color: '#ffffff',
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '400',
    textAlign: 'center',
  },
});
