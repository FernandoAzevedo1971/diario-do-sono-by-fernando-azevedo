import React, { useMemo } from 'react';
import { View, Dimensions, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme/tokens';

interface NocturneBackdropProps {
  primary?: string;
  withMoon?: boolean;
}

interface Star {
  x: number;
  y: number;
  r: number;
  delay: number;
  dur: number;
}

export const NocturneBackdrop: React.FC<NocturneBackdropProps> = ({
  primary = colors.primary,
  withMoon = true,
}) => {
  const { width, height } = Dimensions.get('window');

  const stars: Star[] = useMemo(() => {
    return Array.from({ length: 32 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 55,
      r: Math.random() * 1.0 + 0.35,
      delay: Math.random() * 4,
      dur: 2.4 + Math.random() * 3,
    }));
  }, []);

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Aurora radial gradient effect - simulated with View layers */}
      <View
        style={{
          position: 'absolute',
          top: -180,
          left: -100,
          right: -100,
          height: 560,
          backgroundColor: primary,
          opacity: 0.15,
          borderRadius: 280,
        }}
      />
      <View
        style={{
          position: 'absolute',
          top: -180,
          left: -100,
          right: -100,
          height: 560,
          backgroundColor: '#4339A4',
          opacity: 0.1,
          borderRadius: 280,
        }}
      />

      {/* Grain effect */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundColor: '#fff',
        }}
      />

      {/* Stars */}
      <Svg
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '40%',
        }}
      >
        {stars.map((star, i) => (
          <Circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            fill="#fff"
            opacity={0.7}
          />
        ))}
      </Svg>

      {/* Moon */}
      {withMoon && (
        <View
          style={{
            position: 'absolute',
            top: 84,
            right: 28,
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: colors.inkSoft,
            shadowColor: primary,
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 5,
          }}
        />
      )}
    </View>
  );
};
