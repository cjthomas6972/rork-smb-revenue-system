import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');

interface CinematicSplashProps {
  onComplete: () => void;
}

export default function CinematicSplash({ onComplete }: CinematicSplashProps) {
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const wordmarkTranslate = useRef(new Animated.Value(18)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(0.85)).current;
  const shimmerTranslate = useRef(new Animated.Value(-280)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(haloOpacity, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(haloScale, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(wordmarkOpacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(wordmarkTranslate, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerTranslate, {
          toValue: 280,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1000),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onComplete();
    });
  }, [containerOpacity, haloOpacity, haloScale, onComplete, shimmerTranslate, wordmarkOpacity, wordmarkTranslate]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}> 
      <View style={styles.background} />

      <Animated.View
        style={[
          styles.halo,
          {
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      >
        <View style={styles.outerRing} />
        <View style={styles.innerRing} />
      </Animated.View>

      <Animated.View
        style={[
          styles.wordmarkWrap,
          {
            opacity: wordmarkOpacity,
            transform: [{ translateY: wordmarkTranslate }],
          },
        ]}
      >
        <LinearGradient
          colors={[Colors.brandGradient.start, Colors.brandGradient.middle, Colors.brandGradient.end]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.wordmarkGradient}
        >
          <Animated.View style={[styles.shimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
        </LinearGradient>
        <View style={styles.wordmarkInner}>
          <Animated.Text style={styles.wordmarkText}>SKYFORGE</Animated.Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A0A0F',
  },
  halo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    position: 'absolute',
    width: width * 0.86,
    height: width * 0.86,
    borderRadius: (width * 0.86) / 2,
    borderWidth: 1,
    borderColor: Colors.brandGradient.middle,
  },
  innerRing: {
    position: 'absolute',
    width: width * 0.52,
    height: width * 0.52,
    borderRadius: (width * 0.52) / 2,
    borderWidth: 1,
    borderColor: Colors.brandGradient.end,
  },
  wordmarkWrap: {
    width: Math.min(width - 48, 320),
    height: 86,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: Colors.brandGradient.middle,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 18,
  },
  wordmarkGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  shimmer: {
    position: 'absolute',
    width: 84,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  wordmarkInner: {
    flex: 1,
    margin: 1.5,
    borderRadius: 22,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkText: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: '900' as const,
    letterSpacing: 5,
  },
});
