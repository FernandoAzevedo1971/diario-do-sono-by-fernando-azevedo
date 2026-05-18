import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../theme/tokens';

interface RingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  primary?: string;
  track?: string;
  label?: string;
  sublabel?: string;
  animated?: boolean;
  glow?: boolean;
}

export const Ring: React.FC<RingProps> = ({
  value = 94,
  size = 128,
  strokeWidth = 10,
  primary = colors.primary,
  track = colors.ghost,
  label = 'Eficiência',
  sublabel,
  animated = true,
  glow = false,
}) => {
  const [displayValue, setDisplayValue] = useState(animated ? 0 : value);

  useEffect(() => {
    if (!animated) {
      setDisplayValue(value);
      return;
    }

    let raf: any;
    let start: number | undefined;
    const duration = 1100;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min(1, (timestamp - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, animated]);

  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (displayValue / 100) * c;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ position: 'relative', width: size, height: size }}>
        <Svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={track}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={primary}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={c}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {label && (
        <View style={{ marginTop: 12, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: fonts.serif.display,
              fontSize: 20,
              color: colors.ink,
              letterSpacing: -0.01,
              fontWeight: '400',
            }}
          >
            {displayValue}%
          </Text>
          {sublabel && (
            <Text
              style={{
                fontSize: 12,
                color: colors.textMuted,
                marginTop: 2,
              }}
            >
              Insônia {sublabel.toLowerCase()}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};
