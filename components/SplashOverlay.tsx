import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, Typography} from './theme';

const EASE_OUT = Easing.out(Easing.cubic);

// Portrait art frame — fill the screen, maintaining ~290:640 aspect ratio
const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const ART_WIDTH = SCREEN_W - 32; // 16px margin each side
const ART_HEIGHT = Math.max(ART_WIDTH * 2.2, SCREEN_H * 0.88);
// The two hands meet at ~39% from the top of the image
const HANDS_RATIO = 0.48;

interface SplashOverlayProps {
  onAnimationDone: () => void;
}

export default function SplashOverlay({onAnimationDone}: SplashOverlayProps) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {height: SCREEN_HEIGHT} = useWindowDimensions();

  // Animation values
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(0.95)).current;
  const artOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Transition: brand moves from center to header
  const transitionProgress = useRef(new Animated.Value(0)).current;

  // Calculate positions — brand starts at the hands, not screen center
  const handsOffsetFromCenter = ART_HEIGHT * (HANDS_RATIO - 0.39); // hands are above center
  const headerCenterY = insets.top + 12 + Typography.brand.lineHeight / 2;
  const brandStartY = SCREEN_HEIGHT / 2 - handsOffsetFromCenter;
  const translateDistance = brandStartY - headerCenterY;

  // Scale from 28px to 24px brand size
  const brandSizeScale = 24 / 28; // ~0.857

  useEffect(() => {
    // Phase 1: Brand entrance (0–1000ms)
    const brandEntrance = Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 1000,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(brandScale, {
        toValue: 1,
        duration: 1000,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Hold (1000–2200ms)
    // Phase 3: Art fades + brand moves to header (2200–4000ms)
    const autoTransition = Animated.parallel([
      Animated.timing(transitionProgress, {
        toValue: 1,
        duration: 1800,
        delay: 2200,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(artOpacity, {
        toValue: 0,
        duration: 1000,
        delay: 2200,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]);

    // Phase 4: Background fades to reveal Give page after brand is at top
    const revealHome = Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 600,
      delay: 4000, // 2200 + 1800 = brand at header
      easing: EASE_OUT,
      useNativeDriver: true,
    });

    Animated.parallel([brandEntrance, autoTransition, revealHome]).start(() => {
      onAnimationDone();
    });

    return () => {
      brandOpacity.stopAnimation();
      brandScale.stopAnimation();
      artOpacity.stopAnimation();
      overlayOpacity.stopAnimation();
      transitionProgress.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animation values are stable refs, runs once on mount
  }, []);

  // Interpolate brand translateY: 0 → -translateDistance (moves up)
  const brandTranslateY = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -translateDistance],
  });

  // Interpolate brand scale: 1 → brandSizeScale
  const brandScaleTransition = transitionProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, brandSizeScale],
  });

  // Combined scale = entrance scale * transition scale
  const combinedScale = Animated.multiply(brandScale, brandScaleTransition);

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Background + art — these fade out */}
      <Animated.View
        style={[
          styles.backgroundLayer,
          {
            backgroundColor: colors.background,
            opacity: overlayOpacity,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.artWrapper,
          {
            opacity: artOpacity,
            top: SCREEN_HEIGHT / 2 - ART_HEIGHT * HANDS_RATIO,
            width: ART_WIDTH,
            height: ART_HEIGHT,
          },
        ]}
        pointerEvents="none">
        <View
          style={[
            styles.artFrame,
            {
              borderColor: colors.glassBorder,
              shadowColor: colors.shadow,
              backgroundColor: colors.card,
            },
          ]}>
          <Image
            source={require('../assets/creation_of_adam_vertical.jpg')}
            style={styles.artImage}
            resizeMode="cover"
          />
          <View
            style={[styles.artWash, {backgroundColor: colors.background}]}
          />
          <View
            style={[styles.artTint, {backgroundColor: colors.primaryLight}]}
          />
          <View style={[styles.artVignette, {borderColor: colors.border}]} />
        </View>
      </Animated.View>

      {/* Brand text — positioned at the hands, transitions to header */}
      <Animated.View
        style={[
          styles.brandContainer,
          {
            top: brandStartY - 14, // center the 28px text at hands Y
            opacity: brandOpacity,
            transform: [{translateY: brandTranslateY}, {scale: combinedScale}],
          },
        ]}>
        <Text style={[styles.brand, {color: colors.textPrimary}]}>Glimpse</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    zIndex: 100,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  artWrapper: {
    position: 'absolute',
    alignSelf: 'center',
  },
  artFrame: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  artImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  artWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.25,
  },
  artTint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
  },
  artVignette: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 20,
    borderWidth: 1,
    opacity: 0.4,
  },
  brandContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: 28,
    fontWeight: Typography.brand.fontWeight,
    letterSpacing: Typography.brand.letterSpacing,
    fontFamily: Typography.brand.fontFamily,
  },
});
