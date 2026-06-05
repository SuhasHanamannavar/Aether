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
import { colors, spacing, borderRadius } from '../theme/tokens';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const brandOpacity = useSharedValue(0);
  const brandTranslate = useSharedValue(24);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslate = useSharedValue(16);

  useEffect(() => {
    logoScale.value = withTiming(1, { duration: 800 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    ringScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    ringOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    brandOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    brandTranslate.value = withDelay(600, withTiming(0, { duration: 500 }));

    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 400 }));
    taglineTranslate.value = withDelay(900, withTiming(0, { duration: 400 }));

    const timeout = setTimeout(() => {
      router.replace('/onboarding');
    }, 1800);

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

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslate.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.backgroundGlow} />

      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={styles.logo}>
          <Text style={styles.logoLetter}>A</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.brandContainer, brandStyle]}>
        <Text style={styles.brandName}>Aether</Text>
      </Animated.View>

      <Animated.View style={[styles.taglineContainer, taglineStyle]}>
        <Text style={styles.tagline}>Your intelligent travel planner</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D4A2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundGlow: {
    position: 'absolute',
    top: height * 0.15,
    alignSelf: 'center',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(232, 168, 124, 0.08)',
  },
  ring: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
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
  logoLetter: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  brandContainer: {
    position: 'absolute',
    bottom: height * 0.15,
    alignItems: 'center',
  },
  brandName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  taglineContainer: {
    position: 'absolute',
    bottom: height * 0.11,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.3,
  },
});
