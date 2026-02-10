import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, Typography} from './theme';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const EASE_OUT = Easing.out(Easing.cubic);

interface SplashOverlayProps {
  onComplete: () => void;
}

export default function SplashOverlay({onComplete}: SplashOverlayProps) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();

  // Animation values
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandScale = useRef(new Animated.Value(0.95)).current;
  const artOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Transition: brand moves from center to header
  const transitionProgress = useRef(new Animated.Value(0)).current;

  // Calculate positions
  const headerCenterY = insets.top + 12 + Typography.brand.lineHeight / 2;
  const screenCenterY = SCREEN_HEIGHT / 2;

  // Scale from 52px to 24px brand size
  const brandSizeScale = 24 / 52; // ~0.462

  // Compensate for scale-around-center: when text shrinks from 52→24px,
  // the visual center shifts up by half the height difference * (1 - scale)
  // This offset prevents the "drift then snap" at the end of the animation
  const brandHeight = 52 * 1.2; // approximate rendered height with line spacing
  const scaleOffset = (brandHeight * (1 - brandSizeScale)) / 2;
  const translateDistance = screenCenterY - headerCenterY - scaleOffset;

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

    // Phase 2: Hold (1000–2800ms) — longer pause to breathe
    // Phase 3: Slow auto-transition (2800–4400ms) — 1600ms duration
    const autoTransition = Animated.parallel([
      // Drive the transition progress 0→1
      Animated.timing(transitionProgress, {
        toValue: 1,
        duration: 1400,
        delay: 2800,
        easing: Easing.out(Easing.quad), // clean deceleration, no stall at end
        useNativeDriver: true,
      }),
      // Art fades out (starts with transition, finishes earlier)
      Animated.timing(artOpacity, {
        toValue: 0,
        duration: 1000,
        delay: 2800,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      // Overlay background fades out (matches transition duration)
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 1400,
        delay: 2800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([brandEntrance, autoTransition]).start(() => {
      // Delay removal by one frame so the native driver can
      // composite the final position before React unmounts
      requestAnimationFrame(() => onComplete());
    });

    return () => {
      brandOpacity.stopAnimation();
      brandScale.stopAnimation();
      artOpacity.stopAnimation();
      overlayOpacity.stopAnimation();
      transitionProgress.stopAnimation();
    };
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
        style={[styles.artWrapper, {opacity: artOpacity}]}
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
            source={require('../assets/creationofadam.jpg')}
            style={styles.artImage}
            resizeMode="cover"
          />
          <View
            style={[styles.artWash, {backgroundColor: colors.background}]}
          />
          <View
            style={[styles.artTint, {backgroundColor: colors.primaryLight}]}
          />
          <View
            style={[styles.artVignette, {borderColor: colors.border}]}
          />
        </View>
      </Animated.View>

      {/* Brand text — stays fully visible, moves up to header */}
      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: brandOpacity,
            transform: [
              {translateY: brandTranslateY},
              {scale: combinedScale},
            ],
          },
        ]}>
        <Text style={[styles.brand, {color: colors.textPrimary}]}>
          Glimpse
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  artWrapper: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignSelf: 'center',
    // Vertically centered — offset slightly above center so brand text sits over the lower portion
    top: SCREEN_HEIGHT / 2 - 140,
    height: 240,
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
    top: -30,
    left: -30,
    width: '120%',
    height: '120%',
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
    alignItems: 'center',
  },
  brand: {
    fontSize: 52,
    fontWeight: Typography.brand.fontWeight,
    letterSpacing: Typography.brand.letterSpacing,
    fontFamily: Typography.brand.fontFamily,
  },
});
