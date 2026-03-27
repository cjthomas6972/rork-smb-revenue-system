import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface BrandWatermarkProps {
  opacity?: number;
  size?: number;
  position?: 'center' | 'top' | 'bottom';
}

export default function BrandWatermark({ 
  opacity = 0.03, 
  size = 200,
  position = 'center' 
}: BrandWatermarkProps) {
  const positionStyles = {
    center: { top: '35%' } as const,
    top: { top: '15%' } as const,
    bottom: { bottom: '20%' } as const,
  };

  return (
    <View style={[styles.container, positionStyles[position]]} pointerEvents="none">
      <View style={[styles.watermark, { opacity }]}>
        <View style={[styles.outerRing, { width: size, height: size, borderRadius: size / 2 }]}>
          <View style={[styles.innerRing, { width: size * 0.7, height: size * 0.7, borderRadius: (size * 0.7) / 2 }]}>
            <Zap size={size * 0.35} color={Colors.text} strokeWidth={1} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  watermark: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    borderWidth: 1,
    borderColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    borderWidth: 1,
    borderColor: Colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
