import React, {useCallback, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewToken,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, Typography} from '../components/theme';
import {triggerHaptic} from '../utils/haptics';
import {EASE_IN, springConfig} from '../utils/animations';
import {JOURNEY_SLIDES, TOTAL_SLIDES} from '../data/journeyContent';
import JourneySlide from './onboarding/JourneySlide';
import StoryProgressBar from './onboarding/StoryProgressBar';

interface OnboardingJourneyProps {
  onComplete: () => void;
}

export default function OnboardingJourney({onComplete}: OnboardingJourneyProps) {
  const {width: SCREEN_WIDTH} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  // CTA press animation
  const ctaScale = useRef(new Animated.Value(1)).current;

  // Exit animation
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;

  const isLastSlide = currentIndex === TOTAL_SLIDES - 1;
  const currentSlide = JOURNEY_SLIDES[currentIndex];

  // ─── Viewability tracking ────────────────────────────────────
  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  // ─── Scroll tracking ────────────────────────────────────────
  const onScroll = Animated.event(
    [{nativeEvent: {contentOffset: {x: scrollX}}}],
    {useNativeDriver: false},
  );

  // ─── Exit animation ──────────────────────────────────────────
  const animateExit = useCallback(() => {
    Animated.parallel([
      Animated.timing(exitOpacity, {
        toValue: 0,
        duration: 500,
        easing: EASE_IN,
        useNativeDriver: true,
      }),
      Animated.timing(exitScale, {
        toValue: 1.02,
        duration: 500,
        easing: EASE_IN,
        useNativeDriver: true,
      }),
    ]).start(() => onComplete());
  }, [exitOpacity, exitScale, onComplete]);

  // ─── Navigation handlers ─────────────────────────────────────
  const handleContinue = () => {
    // Fire CTA haptic (default impactLight, or custom per slide)
    const haptic = currentSlide.ctaHaptic || 'impactLight';
    triggerHaptic(haptic);

    if (isLastSlide) {
      animateExit();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleBack = () => {
    triggerHaptic('impactLight');
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleSkip = () => {
    triggerHaptic('impactLight');
    animateExit();
  };

  // ─── CTA press animation ─────────────────────────────────────
  const onCtaPressIn = () => {
    Animated.spring(ctaScale, {toValue: 0.97, ...springConfig}).start();
  };
  const onCtaPressOut = () => {
    Animated.spring(ctaScale, {toValue: 1, ...springConfig}).start();
  };

  // ─── FlatList layout ─────────────────────────────────────────
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    [SCREEN_WIDTH],
  );

  // ─── Conditions ──────────────────────────────────────────────
  const showBack = currentIndex > 0;
  const showSkip = currentIndex >= 2 && !isLastSlide;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          opacity: exitOpacity,
          transform: [{scale: exitScale}],
        },
      ]}>
      {/* ─── Header bar ─────────────────────────────────────── */}
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        {/* Back button */}
        <View style={styles.headerSide}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}
              style={styles.backButton}>
              <Text style={[styles.chevron, {color: colors.textTertiary}]}>
                ‹
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Brand mark */}
        <Text style={[styles.brandMark, {color: colors.textTertiary}]}>
          Glimpse
        </Text>

        {/* Skip button */}
        <View style={[styles.headerSide, styles.headerRight]}>
          {showSkip && (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={[Typography.bodySmall, {color: colors.textTertiary}]}>
                Jump to app
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ─── Slides ─────────────────────────────────────────── */}
      <FlatList
        ref={flatListRef}
        data={JOURNEY_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        decelerationRate="fast"
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <JourneySlide
            slide={item}
            index={index}
            currentIndex={currentIndex}
          />
        )}
        contentContainerStyle={styles.flatListContent}
        style={styles.flatList}
      />

      {/* ─── Bottom area ────────────────────────────────────── */}
      <View style={[styles.bottomArea, {paddingBottom: insets.bottom + 16}]}>
        {/* Progress bar */}
        <StoryProgressBar scrollX={scrollX} slideWidth={SCREEN_WIDTH} />

        {/* CTA button */}
        <Animated.View
          style={[styles.ctaWrap, {transform: [{scale: ctaScale}]}]}>
          <TouchableOpacity
            style={[
              styles.ctaButton,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.shadow,
              },
              isLastSlide && styles.ctaButtonFinal,
            ]}
            onPress={handleContinue}
            onPressIn={onCtaPressIn}
            onPressOut={onCtaPressOut}
            activeOpacity={0.8}>
            <Text style={[Typography.buttonLarge, {color: colors.textOnPrimary}]}>
              {currentSlide.ctaLabel}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 101,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerSide: {
    width: 80,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    fontSize: 32,
    fontWeight: '300',
    marginTop: -2,
  },
  brandMark: {
    fontSize: 18,
    fontWeight: Typography.brand.fontWeight,
    letterSpacing: Typography.brand.letterSpacing,
    fontFamily: Typography.brand.fontFamily,
  },
  flatList: {
    flex: 1,
  },
  flatListContent: {
    // Let slides fill their container height
  },
  bottomArea: {
    paddingTop: 20,
  },
  ctaWrap: {
    marginTop: 16,
    marginHorizontal: 24,
  },
  ctaButton: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaButtonFinal: {
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
});
