import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  ImageSourcePropType,
  Image,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows, animation } from '../theme/tokens';

interface CardProps {
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'elevated' | 'outlined';
  imageSrc?: ImageSourcePropType;
  title?: string;
  subtitle?: string;
  badge?: string | number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function Card({
  children,
  onPress,
  style,
  variant = 'elevated',
  imageSrc,
  title,
  subtitle,
  badge,
}: CardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (onPress) scale.value = withSpring(0.98, animation.spring);
  }, [onPress, scale]);

  const handlePressOut = useCallback(() => {
    if (onPress) scale.value = withSpring(1, animation.spring);
  }, [onPress, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const Container = onPress ? AnimatedTouchable : View;
  const containerProps = onPress
    ? {
        onPress,
        onPressIn: handlePressIn,
        onPressOut: handlePressOut,
        activeOpacity: 1,
      }
    : {};

  return (
    <Container
      {...containerProps}
      style={[
        styles.base,
        variant === 'elevated' ? styles.elevated : styles.outlined,
        animatedStyle,
        style,
      ]}
    >
      {imageSrc && (
        <Image source={imageSrc} style={styles.image} resizeMode="cover" />
      )}
      {(title || subtitle) && (
        <View style={styles.content}>
          {badge && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      {children}
    </Container>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  elevated: {
    ...shadows.md,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
