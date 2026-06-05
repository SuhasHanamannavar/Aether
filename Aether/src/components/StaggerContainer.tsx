import React, { useMemo } from 'react';
import { ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  duration?: number;
  index?: number;
  style?: ViewStyle;
  translateY?: number;
}

export default function StaggerContainer({
  children,
  staggerDelay = 80,
  duration = 300,
  index = 0,
  style,
  translateY = 20,
}: StaggerContainerProps) {
  const childrenArray = useMemo(
    () => React.Children.toArray(children),
    [children]
  );

  return (
    <Animated.View style={style}>
      {childrenArray.map((child, i) => (
        <Animated.View
          key={i}
          entering={FadeInDown
            .duration(duration)
            .delay((index + i) * staggerDelay)
            .springify()
            .damping(15)
            .stiffness(200)
          }
        >
          {child}
        </Animated.View>
      ))}
    </Animated.View>
  );
}
