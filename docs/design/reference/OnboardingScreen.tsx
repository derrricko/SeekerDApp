import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  FlatList,
  ViewToken,
  Easing,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {triggerHaptic} from '../utils/haptics';
import {useTheme, Typography} from '../components/theme';
import {ONBOARDING_SLIDES} from '../data/content';

// Slide icons built with View primitives
function SlideIcon({index}: {index: number}) {
  const {colors} = useTheme();

  if (index === 0) {
    // Eye / transparency icon
    return (
      <View style={slideIconStyles.container}>
        <View
          style={[slideIconStyles.eyeOuter, {borderColor: colors.secondary}]}>
          <View
            style={[slideIconStyles.eyeInner, {backgroundColor: colors.secondary}]}
          />
        </View>
      </View>
    );
  }
  if (index === 1) {
    // Compass / direction icon
    return (
      <View style={slideIconStyles.container}>
        <View
          style={[slideIconStyles.compass, {borderColor: colors.primary}]}>
          <View
            style={[slideIconStyles.compassNeedle, {backgroundColor: colors.primary}]}
          />
        </View>
      </View>
    );
  }
  if (index === 2) {
    // Checkmark / proof icon
    return (
      <View style={slideIconStyles.container}>
        <View
          style={[slideIconStyles.checkCircle, {borderColor: colors.secondary}]}>
          <View style={slideIconStyles.checkContainer}>
            <View
              style={[slideIconStyles.checkShort, {backgroundColor: colors.secondary}]}
            />
            <View
              style={[slideIconStyles.checkLong, {backgroundColor: colors.secondary}]}
            />
          </View>
        </View>
      </View>
    );
  }
  // Heart / ready icon
  return (
    <View style={slideIconStyles.container}>
      <View style={[slideIconStyles.heart, {borderColor: colors.primary}]} />
    </View>
  );
}

const slideIconStyles = StyleSheet.create({
  container: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  eyeOuter: {
    width: 56,
    height: 32,
    borderWidth: 2.5,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  compass: {
    width: 48,
    height: 48,
    borderWidth: 2.5,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compassNeedle: {
    width: 3,
    height: 20,
    borderRadius: 1.5,
    transform: [{rotate: '45deg'}],
  },
  checkCircle: {
    width: 48,
    height: 48,
    borderWidth: 2.5,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContainer: {
    width: 20,
    height: 16,
    position: 'relative',
  },
  checkShort: {
    position: 'absolute',
    width: 3,
    height: 10,
    borderRadius: 1.5,
    bottom: 0,
    left: 2,
    transform: [{rotate: '-45deg'}],
  },
  checkLong: {
    position: 'absolute',
    width: 3,
    height: 16,
    borderRadius: 1.5,
    bottom: 0,
    right: 2,
    transform: [{rotate: '30deg'}],
  },
  heart: {
    width: 36,
    height: 36,
    borderWidth: 2.5,
    borderRadius: 8,
    transform: [{rotate: '45deg'}],
  },
});

// Staggered entrance component for slide content
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

      // Icon: 0ms delay
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(iconTranslateY, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();

      // Headline: 100ms delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(headlineOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(headlineTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }, 100);

      // Body: 200ms delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(bodyOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(bodyTranslateY, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      }, 200);
    }
  }, [
    index,
    currentIndex,
    iconOpacity,
    iconTranslateY,
    headlineOpacity,
    headlineTranslateY,
    bodyOpacity,
    bodyTranslateY,
  ]);

  return (
    <>
      <Animated.View
        style={{opacity: iconOpacity, transform: [{translateY: iconTranslateY}]}}>
        {children[0]}
      </Animated.View>
      <Animated.View
        style={{opacity: headlineOpacity, transform: [{translateY: headlineTranslateY}]}}>
        {children[1]}
      </Animated.View>
      <Animated.View
        style={{opacity: bodyOpacity, transform: [{translateY: bodyTranslateY}]}}>
        {children[2]}
      </Animated.View>
    </>
  );
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({onComplete}: OnboardingScreenProps) {
  const {width: SCREEN_WIDTH} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const ctaScale = useRef(new Animated.Value(1)).current;

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
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => onComplete());
    }
  };

  const handleSkip = () => {
    triggerHaptic('impactLight');
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => onComplete());
  };

  const onCtaPressIn = () => {
    Animated.timing(ctaScale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onCtaPressOut = () => {
    Animated.spring(ctaScale, {
      toValue: 1.0,
      useNativeDriver: true,
    }).start();
  };

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [SCREEN_WIDTH],
  );

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <Animated.View
      style={[
        styles.container,
        {backgroundColor: colors.background, opacity: fadeAnim},
      ]}>
      {/* Skip button */}
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        {!isLastSlide ? (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}>
            <Text style={[styles.skipText, {color: colors.textTertiary}]}>
              Skip
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.skipButton} />
        )}
      </View>

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
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <View style={[styles.slide, {width: SCREEN_WIDTH}]}>
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

      {/* Bottom area: dots + button */}
      <View style={[styles.bottomArea, {paddingBottom: insets.bottom + 32}]}>
        {/* Pagination dots */}
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * SCREEN_WIDTH,
              i * SCREEN_WIDTH,
              (i + 1) * SCREEN_WIDTH,
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
                  {
                    backgroundColor: dotColor,
                    width: dotWidth,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA button */}
        <Animated.View
          style={[
            styles.ctaButtonWrapper,
            {transform: [{scale: ctaScale}]},
          ]}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  headline: {
    ...Typography.heading,
    textAlign: 'center',
    marginBottom: 16,
  },
  body: {
    ...Typography.body,
    textAlign: 'center',
  },
  bottomArea: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButtonWrapper: {
    width: '100%',
  },
  ctaButton: {
    width: '100%',
    paddingVertical: 18,
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
