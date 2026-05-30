import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/tokens';

// ─── Estrelas — posições diferentes da versão anterior ───────────────────────

const STARS: Array<{ x: string; y: string; r: number; delay: number; duration: number }> = [
  { x: '12%', y: '5%',  r: 1.5, delay: 0,    duration: 3200 },
  { x: '78%', y: '4%',  r: 1.8, delay: 700,  duration: 2800 },
  { x: '38%', y: '2%',  r: 1,   delay: 300,  duration: 3600 },
  { x: '88%', y: '14%', r: 2.2, delay: 1100, duration: 2600 },
  { x: '56%', y: '8%',  r: 1.2, delay: 200,  duration: 3400 },
  { x: '4%',  y: '26%', r: 1,   delay: 900,  duration: 2900 },
  { x: '96%', y: '38%', r: 2,   delay: 500,  duration: 3100 },
  { x: '6%',  y: '65%', r: 1,   delay: 1300, duration: 2700 },
  { x: '92%', y: '58%', r: 1.5, delay: 400,  duration: 3500 },
  { x: '3%',  y: '78%', r: 2,   delay: 800,  duration: 2800 },
  { x: '91%', y: '83%', r: 1,   delay: 100,  duration: 3300 },
  { x: '17%', y: '88%', r: 1.8, delay: 600,  duration: 3000 },
  { x: '50%', y: '1%',  r: 1,   delay: 1500, duration: 2800 },
  { x: '72%', y: '93%', r: 1.5, delay: 250,  duration: 3200 },
  { x: '29%', y: '95%', r: 1.2, delay: 950,  duration: 2700 },
];

function Star({ x, y, r, delay, duration }: typeof STARS[0]) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.08, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
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
  dot: { position: 'absolute', backgroundColor: '#D8EAFF' },
});

// ─── Lua prateada com anel de eclipse ─────────────────────────────────────────

function Moon({ breatheAnim, glowAnim }: { breatheAnim: Animated.Value; glowAnim: Animated.Value }) {
  return (
    <Animated.View style={[moonStyle.wrapper, { transform: [{ scale: breatheAnim }] }]}>
      {/* Halos em azul frio */}
      <Animated.View style={[moonStyle.halo, moonStyle.halo3, { opacity: glowAnim }]} />
      <Animated.View style={[moonStyle.halo, moonStyle.halo2, { opacity: glowAnim }]} />
      <Animated.View style={[moonStyle.halo, moonStyle.halo1, { opacity: glowAnim }]} />
      {/* Anel de eclipse */}
      <View style={moonStyle.eclipseRing} />
      {/* Lua prateada */}
      <Text style={moonStyle.moon}>☾</Text>
    </Animated.View>
  );
}

const moonStyle = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  eclipseRing: {
    position: 'absolute',
    width: 152,
    height: 152,
    borderRadius: 76,
    borderWidth: 1,
    borderColor: 'rgba(150,190,255,0.18)',
    backgroundColor: 'transparent',
  },
  halo: { position: 'absolute', borderRadius: 999 },
  halo1: { width: 190, height: 190, backgroundColor: 'rgba(100,150,255,0.10)' },
  halo2: { width: 265, height: 265, backgroundColor: 'rgba(80,120,240,0.05)' },
  halo3: { width: 350, height: 350, backgroundColor: 'rgba(60,100,220,0.025)' },
  moon: {
    fontSize: 130,
    color: '#C8DEFF',
    textShadowColor: 'rgba(140,180,255,0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 50,
  },
});

// ─── SplashScreen ─────────────────────────────────────────────────────────────

export function SplashScreen() {
  const screenOpacity     = useRef(new Animated.Value(0)).current;
  const centerScale       = useRef(new Animated.Value(0.06)).current;  // Zoom progressivo
  const centerOpacity     = useRef(new Animated.Value(0)).current;
  const starsOpacity      = useRef(new Animated.Value(0)).current;
  const watermarkOpacity  = useRef(new Animated.Value(0)).current;
  const moonBreathe       = useRef(new Animated.Value(1)).current;
  const glowOpacity       = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    // Fase 1 — zoom progressivo da composição central
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(centerOpacity, {
            toValue: 1, duration: 550, useNativeDriver: true,
          }),
          Animated.timing(centerScale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.back(1.45)),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(850),
        Animated.timing(starsOpacity, {
          toValue: 1, duration: 1100, useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(watermarkOpacity, {
          toValue: 0.35, duration: 900, useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Fase 2 — animações em loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(moonBreathe, { toValue: 1.06, duration: 2900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(moonBreathe, { toValue: 1.00, duration: 2900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.72, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.15, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ).start();
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: screenOpacity }]}>
      <LinearGradient
        colors={['#030212', '#07051E', '#0A1132', '#040A1C']}
        locations={[0, 0.3, 0.68, 1]}
        style={styles.gradient}
      >
        {/* ── Estrelas (aparecem após o zoom) ── */}
        <Animated.View style={[styles.starsLayer, { opacity: starsOpacity }]} pointerEvents="none">
          {STARS.map((s, i) => <Star key={i} {...s} />)}
        </Animated.View>

        {/* ── Composição central com zoom progressivo ── */}
        <Animated.View
          style={[
            styles.center,
            { transform: [{ scale: centerScale }], opacity: centerOpacity },
          ]}
        >
          <Moon breatheAnim={moonBreathe} glowAnim={glowOpacity} />

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <View style={styles.rule} />
              <Text style={styles.titleMain}>DIÁRIO DO SONO</Text>
              <View style={styles.rule} />
            </View>
            <Text style={styles.subtitle}>Seu registro clínico do sono</Text>
          </View>
        </Animated.View>

        {/* ── Assinatura ── */}
        <Animated.View style={[styles.watermark, { opacity: watermarkOpacity }]}>
          <Text style={styles.watermarkLine}>DR. FERNANDO AZEVEDO</Text>
          <Text style={styles.watermarkLine}>PNEUMOLOGIA  ·  MEDICINA DO SONO</Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  starsLayer: { ...StyleSheet.absoluteFillObject },
  center: {
    alignItems: 'center',
    gap: 34,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rule: {
    width: 26,
    height: 1,
    backgroundColor: 'rgba(150,190,255,0.45)',
  },
  titleMain: {
    color: '#E6F0FF',
    fontSize: 26,
    fontWeight: '300',
    letterSpacing: 7,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(150,180,230,0.65)',
    fontSize: 12,
    letterSpacing: 2.5,
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
    letterSpacing: 3.5,
    fontWeight: '300',
    textAlign: 'center',
  },
});
