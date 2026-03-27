import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface SkyforgeLogoFullProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
}

const SIZES = {
  small: { icon: 32, ring: 56, text: 16 },
  medium: { icon: 48, ring: 80, text: 24 },
  large: { icon: 64, ring: 110, text: 32 },
};

export default function SkyforgeLogoFull({ 
  size = 'medium',
  showText = true 
}: SkyforgeLogoFullProps) {
  const dimensions = SIZES[size];

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={[Colors.brandGradient.start, Colors.brandGradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.outerRing,
            { 
              width: dimensions.ring, 
              height: dimensions.ring, 
              borderRadius: dimensions.ring / 2 
            }
          ]}
        >
          <View style={[
            styles.innerCircle,
            {
              width: dimensions.ring - 8,
              height: dimensions.ring - 8,
              borderRadius: (dimensions.ring - 8) / 2,
            }
          ]}>
            <Zap 
              size={dimensions.icon} 
              color={Colors.accent} 
              strokeWidth={2} 
              fill={Colors.accent}
            />
          </View>
        </LinearGradient>
      </View>
      {showText && (
        <Text style={[styles.logoText, { fontSize: dimensions.text }]}>
          SKYFORGE
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    shadowColor: Colors.brandGradient.start,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  innerCircle: {
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 4,
    marginTop: 16,
  },
});
