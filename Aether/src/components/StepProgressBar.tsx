import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius } from '../theme/tokens';

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export default function StepProgressBar({ currentStep, totalSteps }: StepProgressBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dotsRow}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <StepDot
            key={i}
            index={i}
            isActive={i + 1 === currentStep}
            isCompleted={i + 1 < currentStep}
          />
        ))}
      </View>
      <Text style={styles.label}>
        Step {currentStep} of {totalSteps}
      </Text>
    </View>
  );
}

function StepDot({
  index,
  isActive,
  isCompleted,
}: {
  index: number;
  isActive: boolean;
  isCompleted: boolean;
}) {
  const scale = useSharedValue(isActive ? 1 : isCompleted ? 1 : 0.8);
  const opacity = useSharedValue(isActive ? 1 : isCompleted ? 0.6 : 0.35);

  React.useEffect(() => {
    if (isActive) {
      scale.value = withDelay(150, withSpring(1, { damping: 10, stiffness: 120 }));
      opacity.value = withTiming(1, { duration: 200 });
    } else if (isCompleted) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(0.6, { duration: 200 });
    } else {
      scale.value = withSpring(0.8, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(0.35, { duration: 200 });
    }
  }, [isActive, isCompleted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.dotWrapper}>
      <Animated.View
        style={[
          styles.dot,
          isActive && styles.dotActive,
          isCompleted && styles.dotCompleted,
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dotWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textInverse,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  dotCompleted: {
    backgroundColor: colors.textInverse,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
