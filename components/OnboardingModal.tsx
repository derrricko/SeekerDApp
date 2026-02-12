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
  Platform,
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

// Slide icons — 72x72, themed with full palette
function SlideIcon({index}: {index: number}) {
  const {colors} = useTheme();

  if (index === 0) {
    // Direct — arrow through a dashed ring
    return (
      <View style={iconStyles.container}>
        <View
          style={[
            iconStyles.dashedRing,
            {borderColor: colors.accent},
            Platform.select({
              ios: {borderStyle: 'dashed' as const},
              default: {borderStyle: 'solid' as const, opacity: 0.5},
            }),
          ]}
        />
        <View style={iconStyles.arrowRow}>
          <View
            style={[iconStyles.arrowDot, {backgroundColor: colors.secondary}]}
          />
          <View
            style={[iconStyles.arrowShaft, {backgroundColor: colors.primary}]}
          />
          <View style={iconStyles.chevronWrap}>
            <View
              style={[
                iconStyles.chevronArm,
                {
                  backgroundColor: colors.primary,
                  transform: [{rotate: '-35deg'}],
                  marginBottom: -1,
                },
              ]}
            />
            <View
              style={[
                iconStyles.chevronArm,
                {
                  backgroundColor: colors.primary,
                  transform: [{rotate: '35deg'}],
                  marginTop: -1,
                },
              ]}
            />
          </View>
          <View
            style={[iconStyles.arrowDot, {backgroundColor: colors.success}]}
          />
        </View>
      </View>
    );
  }

  if (index === 1) {
    // Choose — 2x2 card grid, top-left selected
    return (
      <View style={iconStyles.container}>
        <View style={iconStyles.grid}>
          <View
            style={[iconStyles.tileFilled, {backgroundColor: colors.primary}]}>
            <View style={iconStyles.tileCheckWrap}>
              <View
                style={[
                  iconStyles.tileCheckShort,
                  {backgroundColor: '#FFFFFF'},
                ]}
              />
              <View
                style={[iconStyles.tileCheckLong, {backgroundColor: '#FFFFFF'}]}
              />
            </View>
          </View>
          <View style={[iconStyles.tile, {borderColor: colors.accent}]} />
          <View style={[iconStyles.tile, {borderColor: colors.secondary}]} />
          <View style={[iconStyles.tile, {borderColor: colors.accent}]} />
        </View>
      </View>
    );
  }

  if (index === 2) {
    // Proof — receipt document + chain link
    return (
      <View style={iconStyles.container}>
        <View style={[iconStyles.receipt, {borderColor: colors.accent}]}>
          <View
            style={[
              iconStyles.receiptLine,
              {width: 24, backgroundColor: colors.accent, opacity: 0.5},
            ]}
          />
          <View
            style={[
              iconStyles.receiptLine,
              {width: 18, backgroundColor: colors.accent, opacity: 0.5},
            ]}
          />
          <View
            style={[
              iconStyles.receiptLine,
              {width: 12, backgroundColor: colors.accent, opacity: 0.5},
            ]}
          />
          <View
            style={[
              iconStyles.receiptDivider,
              {backgroundColor: colors.accent, opacity: 0.3},
            ]}
          />
          <View style={iconStyles.receiptDotsRow}>
            <View
              style={[iconStyles.receiptDot, {backgroundColor: colors.success}]}
            />
            <View
              style={[iconStyles.receiptDot, {backgroundColor: colors.success}]}
            />
            <View
              style={[iconStyles.receiptDot, {backgroundColor: colors.success}]}
            />
          </View>
        </View>
        <View style={iconStyles.chainWrap}>
          <View
            style={[
              iconStyles.chainCircle,
              {left: 0, borderColor: colors.primary},
            ]}
          />
          <View
            style={[
              iconStyles.chainCircle,
              {right: 0, borderColor: colors.primary},
            ]}
          />
        </View>
      </View>
    );
  }

  // Scale — concentric ripples + heart center
  return (
    <View style={iconStyles.container}>
      <View
        style={[
          iconStyles.rippleOuter,
          {borderColor: colors.secondary, opacity: 0.25},
        ]}
      />
      <View
        style={[
          iconStyles.rippleMiddle,
          {borderColor: colors.accent, opacity: 0.5},
        ]}
      />
      <View
        style={[
          iconStyles.rippleInner,
          {borderColor: colors.primary, opacity: 0.8},
        ]}
      />
      <View
        style={[iconStyles.heartCenter, {backgroundColor: colors.primary}]}
      />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  container: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  // Slide 0 — Direct
  dashedRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
  },
  arrowRow: {flexDirection: 'row', alignItems: 'center'},
  arrowDot: {width: 7, height: 7, borderRadius: 3.5},
  arrowShaft: {width: 36, height: 2.5, borderRadius: 1.25},
  chevronWrap: {
    width: 10,
    height: 14,
    justifyContent: 'center',
    marginRight: 2,
  },
  chevronArm: {width: 10, height: 2.5, borderRadius: 1.25},
  // Slide 1 — Choose
  grid: {width: 56, height: 56, flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  tile: {width: 25, height: 25, borderRadius: 6, borderWidth: 2},
  tileFilled: {
    width: 25,
    height: 25,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCheckWrap: {width: 12, height: 10, position: 'relative'},
  tileCheckShort: {
    position: 'absolute',
    width: 2.5,
    height: 7,
    borderRadius: 1.25,
    bottom: 0,
    left: 1,
    transform: [{rotate: '-45deg'}],
  },
  tileCheckLong: {
    position: 'absolute',
    width: 2.5,
    height: 11,
    borderRadius: 1.25,
    bottom: 0,
    right: 1,
    transform: [{rotate: '30deg'}],
  },
  // Slide 2 — Proof
  receipt: {
    width: 40,
    height: 52,
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingTop: 8,
    alignItems: 'flex-start',
  },
  receiptLine: {height: 2.5, borderRadius: 1.25, marginBottom: 5},
  receiptDivider: {width: '100%' as any, height: 1, marginBottom: 5},
  receiptDotsRow: {flexDirection: 'row', gap: 4},
  receiptDot: {width: 4, height: 4, borderRadius: 2},
  chainWrap: {position: 'absolute', bottom: 4, right: 8, width: 22, height: 14},
  chainCircle: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  // Slide 3 — Scale
  rippleOuter: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
  },
  rippleMiddle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  rippleInner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  heartCenter: {
    width: 14,
    height: 14,
    borderRadius: 3,
    transform: [{rotate: '45deg'}],
  },
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
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 300,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(iconTranslateY, {
          toValue: 0,
          duration: 300,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(headlineOpacity, {
            toValue: 1,
            duration: 300,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(headlineTranslateY, {
            toValue: 0,
            duration: 300,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
        ]).start();
      }, 100);

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(bodyOpacity, {
            toValue: 1,
            duration: 300,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(bodyTranslateY, {
            toValue: 0,
            duration: 300,
            easing: EASE_OUT,
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
        style={{
          opacity: iconOpacity,
          transform: [{translateY: iconTranslateY}],
        }}>
        {children[0]}
      </Animated.View>
      <Animated.View
        style={{
          opacity: headlineOpacity,
          transform: [{translateY: headlineTranslateY}],
        }}>
        {children[1]}
      </Animated.View>
      <Animated.View
        style={{
          opacity: bodyOpacity,
          transform: [{translateY: bodyTranslateY}],
        }}>
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
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animation values are stable refs, runs once on mount
  }, []);

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
        Animated.timing(modalScale, {
          toValue: 0.9,
          duration: 300,
          easing: EASE_IN,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 300,
          easing: EASE_IN,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 300,
          easing: EASE_IN,
          useNativeDriver: true,
        }),
      ]).start(() => onComplete());
    }
  };

  const onCtaPressIn = () => {
    Animated.timing(ctaScale, {
      toValue: 0.97,
      duration: 100,
      useNativeDriver: true,
    }).start();
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
              marginTop: insets.top + 60,
              marginBottom: insets.bottom + 40,
            },
          ]}>
          <GlassCard style={{borderRadius: 20}}>
            <View style={styles.cardContent}>
              {/* Section header — stays visible across all slides */}
              <Text
                style={[styles.sectionHeader, {color: colors.textTertiary}]}>
                HOW IT WORKS
              </Text>

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
                    <AnimatedSlideContent
                      index={index}
                      currentIndex={currentIndex}>
                      <SlideIcon index={index} />
                      <Text
                        style={[styles.headline, {color: colors.textPrimary}]}>
                        {item.headline}
                      </Text>
                      <Text
                        style={[styles.body, {color: colors.textSecondary}]}>
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
    maxHeight: 520,
  },
  cardContent: {
    paddingVertical: 32,
  },
  sectionHeader: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
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
