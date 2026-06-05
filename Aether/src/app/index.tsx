import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors } from '../theme/tokens';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const brandOpacity = useSharedValue(0);
  const brandTranslate = useSharedValue(20);

  useEffect(() => {
    logoScale.value = withTiming(1, { duration: 800 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    ringScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    ringOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    brandOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
    brandTranslate.value = withDelay(600, withTiming(0, { duration: 600 }));

    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 2200);

    return () => clearTimeout(timeout);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ translateY: brandTranslate.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.background}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>

      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logo}>
          <View style={styles.logoInner} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.brandContainer, brandStyle]}>
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>Zelo</Text>
        </View>
        <Text style={styles.tagline}>Your intelligent travel planner</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    ...StyleSheet.absoluteFill,
  },
  gradientTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(65, 179, 163, 0.15)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(232, 168, 124, 0.12)',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 16,
  },
  logoInner: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    opacity: 0.9,
  },
  brandContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 8,
    letterSpacing: 0.3,
  },
});
