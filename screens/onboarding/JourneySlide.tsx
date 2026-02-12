import React, {useEffect, useRef} from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {useTheme, Typography} from '../../components/theme';
import {EASE_OUT} from '../../utils/animations';
import {triggerHaptic} from '../../utils/haptics';
import type {JourneySlideData} from '../../data/journeyContent';
import JourneyVisual from './JourneyVisuals';

interface JourneySlideProps {
  slide: JourneySlideData;
  index: number;
  currentIndex: number;
}

export default function JourneySlide({
  slide,
  index,
  currentIndex,
}: JourneySlideProps) {
  const {width} = useWindowDimensions();
  const {colors} = useTheme();
  const isVisible = index === currentIndex;

  // Staggered entrance animations
  const headlineOpacity = useRef(new Animated.Value(0)).current;
  const headlineTranslateY = useRef(new Animated.Value(20)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleTranslateY = useRef(new Animated.Value(20)).current;
  const visualOpacity = useRef(new Animated.Value(0)).current;
  const visualTranslateY = useRef(new Animated.Value(20)).current;
  const hasAnimated = useRef(false);

  const {entranceDuration, stagger} = slide;

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;

      if (slide.entranceHaptic) {
        triggerHaptic(slide.entranceHaptic);
      }

      // Headline entrance
      Animated.parallel([
        Animated.timing(headlineOpacity, {
          toValue: 1,
          duration: entranceDuration,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(headlineTranslateY, {
          toValue: 0,
          duration: entranceDuration,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtitle entrance
      if (slide.subtitle) {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(subtitleOpacity, {
              toValue: 1,
              duration: entranceDuration,
              easing: EASE_OUT,
              useNativeDriver: true,
            }),
            Animated.timing(subtitleTranslateY, {
              toValue: 0,
              duration: entranceDuration,
              easing: EASE_OUT,
              useNativeDriver: true,
            }),
          ]).start();
        }, stagger);
      }

      // Visual entrance
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(visualOpacity, {
            toValue: 1,
            duration: entranceDuration,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(visualTranslateY, {
            toValue: 0,
            duration: entranceDuration,
            easing: EASE_OUT,
            useNativeDriver: true,
          }),
        ]).start();
      }, stagger * (slide.subtitle ? 2 : 1));
    }
  }, [
    isVisible,
    entranceDuration,
    stagger,
    slide.entranceHaptic,
    slide.subtitle,
    headlineOpacity,
    headlineTranslateY,
    subtitleOpacity,
    subtitleTranslateY,
    visualOpacity,
    visualTranslateY,
  ]);

  // Text color varies by act
  const bodyColor = slide.act === 1 ? colors.textSecondary : colors.textPrimary;
  const subtitleColor =
    slide.act === 1 ? colors.textTertiary : colors.textSecondary;

  const headlineStyle = slide.isPeak ? Typography.display : Typography.heading;
  const hasEmphasis = slide.emphasisWord.length > 0;

  return (
    <View style={[styles.container, {width}]}>
      {/* Text zone */}
      <View style={styles.textZone}>
        <Animated.View
          style={{
            opacity: headlineOpacity,
            transform: [{translateY: headlineTranslateY}],
          }}>
          <Text style={[headlineStyle, styles.headline, {color: bodyColor}]}>
            {slide.headlineBefore}
            {hasEmphasis && (
              <Text
                style={[
                  styles.emphasis,
                  {textDecorationColor: colors.primary},
                ]}>
                {slide.emphasisWord}
              </Text>
            )}
            {slide.headlineAfter}
          </Text>
        </Animated.View>

        {slide.subtitle && (
          <Animated.View
            style={{
              opacity: subtitleOpacity,
              transform: [{translateY: subtitleTranslateY}],
            }}>
            <Text
              style={[
                Typography.body,
                styles.subtitle,
                {color: subtitleColor},
              ]}>
              {slide.subtitle}
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Visual zone — fills remaining space */}
      <Animated.View
        style={[
          styles.visualZone,
          {
            opacity: visualOpacity,
            transform: [{translateY: visualTranslateY}],
          },
        ]}>
        <JourneyVisual visualId={slide.visualId} isVisible={isVisible} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  textZone: {
    paddingHorizontal: 28,
    paddingTop: 4,
  },
  headline: {
    textAlign: 'left',
    marginBottom: 10,
  },
  emphasis: {
    fontStyle: 'italic',
    textDecorationLine: 'underline',
  },
  subtitle: {
    textAlign: 'left',
  },
  visualZone: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    marginTop: 24,
  },
});
