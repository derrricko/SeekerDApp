import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  FlatList,
  Platform,
  ViewToken,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../components/theme';
import {ONBOARDING_SLIDES} from '../data/content';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

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

interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({onComplete}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({viewAreaCoveragePercentThreshold: 50}).current;

  const handleNext = () => {
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
        useNativeDriver: true,
      }).start(() => onComplete());
    }
  };

  const handleSkip = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onComplete());
  };

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
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <View style={[styles.slide, {width: SCREEN_WIDTH}]}>
            <SlideIcon index={index} />
            <Text style={[styles.headline, {color: colors.textPrimary}]}>
              {item.headline}
            </Text>
            <Text style={[styles.body, {color: colors.textSecondary}]}>
              {item.body}
            </Text>
          </View>
        )}
      />

      {/* Bottom area: dots + button */}
      <View style={[styles.bottomArea, {paddingBottom: insets.bottom + 32}]}>
        {/* Pagination dots */}
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex ? colors.primary : colors.border,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.ctaButton, {backgroundColor: colors.primary}]}
          onPress={handleNext}
          activeOpacity={0.8}>
          <Text style={[styles.ctaText, {color: colors.textOnPrimary}]}>
            {isLastSlide ? "Let's Go" : 'Next'}
          </Text>
        </TouchableOpacity>
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
    fontSize: 15,
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
    fontSize: 32,
    fontWeight: '200',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'System' : undefined,
  },
  body: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '400',
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
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
