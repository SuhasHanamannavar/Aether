import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, typography, shadows, animation } from '../theme/tokens';

interface QuickAction {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

interface QuickActionGridProps {
  actions: QuickAction[];
  onAction: (id: string) => void;
  style?: ViewStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function ActionCircle({ action, onPress }: { action: QuickAction; onPress: () => void }) {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.92, animation.spring);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, animation.spring);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      style={animatedStyle}
    >
      <View style={[styles.circle, { backgroundColor: action.color + '20' }]}>
        <Text style={styles.emoji}>{action.emoji}</Text>
      </View>
      <Text style={styles.label}>{action.label}</Text>
    </AnimatedTouchable>
  );
}

export default function QuickActionGrid({ actions, onAction, style }: QuickActionGridProps) {
  return (
    <View style={[styles.container, style]}>
      {actions.map((action) => (
        <ActionCircle
          key={action.id}
          action={action}
          onPress={() => onAction(action.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
});
