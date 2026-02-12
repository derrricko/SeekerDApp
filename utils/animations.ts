import {useCallback, useEffect, useRef} from 'react';
import {Animated, Easing, LayoutAnimation} from 'react-native';
import {triggerHaptic} from './haptics';

export const ENTRANCE_DURATION = 300;
export const ENTRANCE_STAGGER = 50;
export const EASE_OUT = Easing.out(Easing.cubic);
export const EASE_IN = Easing.in(Easing.cubic);

export const springConfig = {useNativeDriver: true, speed: 50, bounciness: 4};

export const smoothLayout = {
  duration: 250,
  update: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
};

export function usePressAnimation() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => {
    triggerHaptic('impactLight');
    Animated.spring(scale, {toValue: 0.97, ...springConfig}).start();
  }, [scale]);
  const onPressOut = useCallback(() => {
    Animated.spring(scale, {toValue: 1, ...springConfig}).start();
  }, [scale]);
  return {scale, onPressIn, onPressOut};
}

export function useEntrance(delay: number = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTRANCE_DURATION,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ENTRANCE_DURATION,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return {opacity, translateY};
}
