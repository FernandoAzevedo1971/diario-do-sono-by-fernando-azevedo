// Nocturne V2 color palette
export const colors = {
  // Background & surface
  background: '#070914',
  backgroundDeep: '#050715',
  backgroundElevated: '#0A0D1F', // legacy support
  surface: 'rgba(255,255,255,0.04)',
  surfaceStrong: 'rgba(255,255,255,0.06)',
  card: 'rgba(255,255,255,0.10)', // legacy support
  cardStrong: '#141A33', // legacy support

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  // Text
  ink: '#FAFAF7',
  inkSoft: '#F0E9FF',
  text: '#FAFAF7', // legacy support
  textMuted: 'rgba(255,255,255,0.58)',
  dim: 'rgba(255,255,255,0.38)',
  ghost: 'rgba(255,255,255,0.16)',

  // Primary & accents
  primary: '#A76BFA',
  primaryLight: '#AFA7FF', // legacy support
  primarySage: '#7CC9B4',
  primaryAmber: '#E8A86B',
  primaryBlue: '#6B9CFF',
  primaryRose: '#FF9FB5',
  cyan: '#65D6FF', // legacy support
  sunrise: '#F8C86A', // legacy support

  // Status
  success: '#70E0A3',
  danger: '#FF6B7A',
  warning: '#FFA86B',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  full: 999,
};

// Typography scale (Nocturne V2)
export const typography = {
  // Display / Hero
  hero: {
    // TTS hero (hora + minuto): 84px, weight 300, letter-spacing -0.05em
    tts: {
      fontSize: 84,
      fontWeight: '300' as const,
      letterSpacing: -0.05,
      lineHeight: 0.82,
    },
    // TTS unit (h): 46px, weight 300
    ttsUnit: {
      fontSize: 46,
      fontWeight: '300' as const,
      letterSpacing: -0.03,
    },
    // Eficiência: 92px, weight 300
    efficiency: {
      fontSize: 92,
      fontWeight: '300' as const,
      letterSpacing: -0.05,
      lineHeight: 0.82,
    },
    // Eficiência unit (%): 36px, weight 300
    efficiencyUnit: {
      fontSize: 36,
      fontWeight: '300' as const,
      letterSpacing: -0.02,
    },
    // Latência: 96px, weight 300
    latency: {
      fontSize: 96,
      fontWeight: '300' as const,
      letterSpacing: -0.04,
      lineHeight: 0.82,
    },
    // Latência unit (min): 32px, weight 300
    latencyUnit: {
      fontSize: 32,
      fontWeight: '300' as const,
      letterSpacing: -0.02,
    },
  },

  // Headings
  heading1: {
    // Greeting: 28px, weight 400
    fontSize: 28,
    fontWeight: '400' as const,
    letterSpacing: -0.01,
    lineHeight: 1.05,
  },
  heading2: {
    // Screen title: 32px, weight 300
    fontSize: 32,
    fontWeight: '300' as const,
    letterSpacing: -0.015,
    lineHeight: 1.1,
  },
  heading3: {
    // Section title: 20px, weight 300
    fontSize: 20,
    fontWeight: '300' as const,
    letterSpacing: -0.01,
  },

  // Body
  body: {
    // Standard: 13-15px, weight 400
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 1.45,
  },
  bodyLarge: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 1.45,
  },

  // Labels & small text
  label: {
    // 11px, weight 500
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.16,
    textTransform: 'uppercase' as const,
  },
  kicker: {
    // 10-11px, weight 500 (mono)
    fontSize: 10,
    fontWeight: '500' as const,
    letterSpacing: 0.14,
  },
  mono: {
    // 10-11px, weight 400-500
    fontSize: 10,
    fontWeight: '400' as const,
    letterSpacing: 0.06,
  },
};

// Font families (require @expo-google-fonts/...)
export const fonts = {
  serif: {
    display: 'Fraunces, serif', // headings, titles
    accent: 'Instrument Serif, serif', // hero numbers
  },
  sans: {
    default: 'Inter, sans-serif', // UI, body
  },
  mono: {
    default: 'JetBrains Mono, monospace', // kickers, percentages, IDs
  },
};
