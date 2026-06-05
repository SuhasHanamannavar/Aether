import Animated, {
  FadeInUp,
  FadeInDown,
  ZoomIn,
  ZoomInUp,
  withSpring,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { animation } from './tokens';

export const springPressConfig = { damping: 12, stiffness: 200 };

export function useSpringPress() {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = () => {
    scale.value = withSpring(0.96, springPressConfig);
  };

  const pressOut = () => {
    scale.value = withSpring(1, springPressConfig);
  };

  return { animatedStyle, pressIn, pressOut };
}

export const cardEntrance = FadeInUp
  .duration(400)
  .springify()
  .damping(16)
  .stiffness(180);

export const mapEntrance = FadeInUp
  .duration(600)
  .springify()
  .damping(20)
  .stiffness(150);

export const sectionEntrance = FadeInUp
  .duration(350)
  .springify()
  .damping(18)
  .stiffness(200);

export const pillEntrance = ZoomIn
  .duration(300)
  .springify()
  .damping(14)
  .stiffness(200);
