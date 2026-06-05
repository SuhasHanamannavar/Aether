import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows, animation } from '../theme/tokens';

export interface TravelerType {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color: string;
}

interface TravelerTypeCardProps {
  type: TravelerType;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function TravelerTypeCard({
  type,
  selected,
  onPress,
  style,
}: TravelerTypeCardProps) {
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, animation.spring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, animation.spring);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={[
        styles.card,
        selected && { backgroundColor: type.color + '15', borderColor: type.color },
        animatedStyle,
        style,
      ]}
    >
      <View style={[styles.accentStrip, { backgroundColor: type.color }]} />
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{type.emoji}</Text>
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.name, selected && { color: type.color }]}>
          {type.name}
        </Text>
        <Text style={styles.description}>{type.description}</Text>
      </View>
      <View style={[styles.checkCircle, selected && { backgroundColor: type.color, borderColor: type.color }]}>
        <CheckIcon visible={selected} />
      </View>
    </AnimatedTouchable>
  );
}

function CheckIcon({ visible }: { visible: boolean }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 8, stiffness: 100 });
      opacity.value = withSpring(1, { damping: 15, stiffness: 150 });
    } else {
      scale.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withSpring(0, { damping: 15, stiffness: 150 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text style={styles.checkMark}>✓</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  accentStrip: {
    width: 6,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderTopLeftRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.xl,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xl + 6,
    marginVertical: spacing.lg,
  },
  emoji: {
    fontSize: 28,
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.md,
    marginVertical: spacing.lg,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  checkMark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
