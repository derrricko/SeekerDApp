import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  FlatList,
  TouchableOpacity,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, Typography} from './theme';
import GlassCard from './GlassCard';
import {triggerHaptic} from '../utils/haptics';
import {ONBOARDING_SLIDES} from '../data/content';

const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

// Slide icons (same as original OnboardingScreen)
function SlideIcon({index}: {index: number}) {
  const {colors} = useTheme();

  if (index === 0) {
    return (
      <View style={slideIconStyles.container}>
        <View style={[slideIconStyles.eyeOuter, {borderColor: colors.secondary}]}>
          <View style={[slideIconStyles.eyeInner, {backgroundColor: colors.secondary}]} />
        </View>
      </View>
    );
  }
  if (index === 1) {
    return (
      <View style={slideIconStyles.container}>
        <View style={[slideIconStyles.compass, {borderColor: colors.primary}]}>
          <View style={[slideIconStyles.compassNeedle, {backgroundColor: colors.primary}]} />
        </View>
      </View>
    );
  }
  if (index === 2) {
    return (
      <View style={slideIconStyles.container}>
        <View style={[slideIconStyles.checkCircle, {borderColor: colors.secondary}]}>
          <View style={slideIconStyles.checkContainer}>
            <View style={[slideIconStyles.checkShort, {backgroundColor: colors.secondary}]} />
            <View style={[slideIconStyles.checkLong, {backgroundColor: colors.secondary}]} />
          </View>
        </View>
      </View>
    );
  }
  return (
    <View style={slideIconStyles.container}>
      <View style={[slideIconStyles.heart, {borderColor: colors.primary}]} />
    </View>
  );
}

const slideIconStyles = StyleSheet.create({
  container: {width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 24},
  eyeOuter: {width: 48, height: 28, borderWidth: 2.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center'},
  eyeInner: {width: 12, height: 12, borderRadius: 6},
  compass: {width: 40, height: 40, borderWidth: 2.5, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  compassNeedle: {width: 3, height: 16, borderRadius: 1.5, transform: [{rotate: '45deg'}]},
  checkCircle: {width: 40, height: 40, borderWidth: 2.5, borderRadius: 20, alignItems: 'center', justifyContent: 'center'},
  checkContainer: {width: 18, height: 14, position: 'relative'},
  checkShort: {position: 'absolute', width: 3, height: 9, borderRadius: 1.5, bottom: 0, left: 2, transform: [{rotate: '-45deg'}]},
  checkLong: {position: 'absolute', width: 3, height: 14, borderRadius: 1.5, bottom: 0, right: 2, transform: [{rotate: '30deg'}]},
  heart: {width: 30, height: 30, borderWidth: 2.5, borderRadius: 7, transform: [{rotate: '45deg'}]},
});

// Staggered entrance for slide content
function AnimatedSlideContent({
  index,
  currentIndex,
  children,
}: {
  index: number;
  currentIndex: number;
  children: [React.ReactNode, React.ReactNode, React.ReactNode];
}) {
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const iconTranslateY = useRef(new Animated.Value(15)).current;
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslateY = useRef(new Animated.Value(15)).current;
  const bodyOpacity = useRef(new Animated.Value(0)).current;
  const bodyTranslateY = useRef(new Animated.Value(15)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (index === currentIndex && !hasAnimated.current) {
      hasAnimated.current = true;

      Animated.parallel([
        Animated.timing(iconOpacity, {toValue: 1, duration: 300, easing: EASE_OUT, useNativeDriver: true}),
        Animated.timing(iconTranslateY, {toValue: 0, duration: 300, easing: EASE_OUT, useNativeDriver: true}),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(headlineOpacity, {toValue: 1, duration: 300, easing: EASE_OUT, useNativeDriver: true}),
          Animated.timing(headlineTranslateY, {toValue: 0, duration: 300, easing: EASE_OUT, useNativeDriver: true}),
        ]).start();
      }, 100);

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(bodyOpacity, {toValue: 1, duration: 300, easing: EASE_OUT, useNativeDriver: true}),
          Animated.timing(bodyTranslateY, {toValue: 0, duration: 300, easing: EASE_OUT, useNativeDriver: true}),
        ]).start();
      }, 200);
    }
  }, [index, currentIndex, iconOpacity, iconTranslateY, headlineOpacity, headlineTranslateY, bodyOpacity, bodyTranslateY]);

  return (
    <>
      <Animated.View style={{opacity: iconOpacity, transform: [{translateY: iconTranslateY}]}}>
        {children[0]}
      </Animated.View>
      <Animated.View style={{opacity: headlineOpacity, transform: [{translateY: headlineTranslateY}]}}>
        {children[1]}
      </Animated.View>
      <Animated.View style={{opacity: bodyOpacity, transform: [{translateY: bodyTranslateY}]}}>
        {children[2]}
      </Animated.View>
    </>
  );
}

interface OnboardingModalProps {
  onComplete: () => void;
}

export default function OnboardingModal({onComplete}: OnboardingModalProps) {
  const {width: SCREEN_WIDTH} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

  // Modal entrance animation
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Slide width = screen width minus modal horizontal padding (32 * 2) minus GlassCard inner padding (20 * 2)
  const SLIDE_WIDTH = SCREEN_WIDTH - 64 - 40;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(modalScale, {toValue: 1, useNativeDriver: true, friction: 8, tension: 65}),
      Animated.timing(modalOpacity, {toValue: 1, duration: 300, easing: EASE_OUT, useNativeDriver: true}),
      Animated.timing(backdropOpacity, {toValue: 1, duration: 300, easing: EASE_OUT, useNativeDriver: true}),
    ]).start();
  }, []);

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollX.setValue(event.nativeEvent.contentOffset.x);
    },
    [scrollX],
  );

  const handleNext = () => {
    triggerHaptic('impactLight');
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Last slide — animate out and complete
      Animated.parallel([
        Animated.timing(modalScale, {toValue: 0.9, duration: 300, easing: EASE_IN, useNativeDriver: true}),
        Animated.timing(modalOpacity, {toValue: 0, duration: 300, easing: EASE_IN, useNativeDriver: true}),
        Animated.timing(backdropOpacity, {toValue: 0, duration: 300, easing: EASE_IN, useNativeDriver: true}),
      ]).start(() => onComplete());
    }
  };

  const onCtaPressIn = () => {
    Animated.timing(ctaScale, {toValue: 0.97, duration: 100, useNativeDriver: true}).start();
  };

  const onCtaPressOut = () => {
    Animated.spring(ctaScale, {toValue: 1, useNativeDriver: true}).start();
  };

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SLIDE_WIDTH,
      offset: SLIDE_WIDTH * index,
      index,
    }),
    [SLIDE_WIDTH],
  );

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <Modal visible transparent animationType="none">
      <Animated.View style={[styles.backdrop, {opacity: backdropOpacity}]}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: modalOpacity,
              transform: [{scale: modalScale}],
              marginTop: insets.top + 80,
              marginBottom: insets.bottom + 40,
            },
          ]}>
          <GlassCard style={{borderRadius: 20}}>
            <View style={styles.cardContent}>
              {/* Slides */}
              <FlatList
                ref={flatListRef}
                data={ONBOARDING_SLIDES}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                onScroll={onScroll}
                scrollEventThrottle={16}
                getItemLayout={getItemLayout}
                snapToInterval={SLIDE_WIDTH}
                decelerationRate="fast"
                keyExtractor={item => item.id}
                renderItem={({item, index}) => (
                  <View style={[styles.slide, {width: SLIDE_WIDTH}]}>
                    <AnimatedSlideContent index={index} currentIndex={currentIndex}>
                      <SlideIcon index={index} />
                      <Text style={[styles.headline, {color: colors.textPrimary}]}>
                        {item.headline}
                      </Text>
                      <Text style={[styles.body, {color: colors.textSecondary}]}>
                        {item.body}
                      </Text>
                    </AnimatedSlideContent>
                  </View>
                )}
              />

              {/* Pagination dots */}
              <View style={styles.dots}>
                {ONBOARDING_SLIDES.map((_, i) => {
                  const inputRange = [
                    (i - 1) * SLIDE_WIDTH,
                    i * SLIDE_WIDTH,
                    (i + 1) * SLIDE_WIDTH,
                  ];

                  const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                  });

                  const dotColor = scrollX.interpolate({
                    inputRange,
                    outputRange: [colors.border, colors.primary, colors.border],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      key={i}
                      style={[
                        styles.dot,
                        {backgroundColor: dotColor, width: dotWidth},
                      ]}
                    />
                  );
                })}
              </View>

              {/* CTA button */}
              <Animated.View style={{transform: [{scale: ctaScale}]}}>
                <TouchableOpacity
                  style={[styles.ctaButton, {backgroundColor: colors.primary}]}
                  onPress={handleNext}
                  onPressIn={onCtaPressIn}
                  onPressOut={onCtaPressOut}
                  activeOpacity={0.8}>
                  <Text style={[styles.ctaText, {color: colors.textOnPrimary}]}>
                    {isLastSlide ? "Let's Go" : 'Next'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    maxHeight: 480,
  },
  cardContent: {
    paddingVertical: 32,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  headline: {
    ...Typography.heading,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    ...Typography.body,
    textAlign: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    ...Typography.buttonLarge,
  },
});
