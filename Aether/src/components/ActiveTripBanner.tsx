import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows, animation } from '../theme/tokens';

interface ActiveTripBannerProps {
  destination: string;
  daysUntil: number;
  onPress: () => void;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ActiveTripBanner({
  destination,
  daysUntil,
  onPress,
  style,
}: ActiveTripBannerProps) {
  const scale = useSharedValue(0.95);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    scale.value = withDelay(300, withSpring(1, { damping: 15, stiffness: 150 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.banner, animatedStyle, style]}
    >
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>✈️</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Upcoming trip</Text>
        <Text style={styles.destination}>
          {destination} · {daysUntil} day{daysUntil !== 1 ? 's' : ''} away
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  destination: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
  },
});
