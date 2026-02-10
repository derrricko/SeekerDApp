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
  // Brand starts at screen center, ends at header center
  // Header: paddingTop = insets.top + 12, paddingBottom = 12
  // Brand lineHeight = 30, so center of brand in header = insets.top + 12 + 15
  const headerCenterY = insets.top + 12 + Typography.brand.lineHeight / 2;
  const screenCenterY = SCREEN_HEIGHT / 2;
  const translateDistance = screenCenterY - headerCenterY;

  // Scale from 52px to 24px brand size
  const brandSizeScale = 24 / 52; // ~0.462

  useEffect(() => {
    // Phase 1: Brand entrance (0–800ms)
    const brandEntrance = Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 800,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(brandScale, {
        toValue: 1,
        duration: 800,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]);

    // Phase 2: Hold (800–2000ms) — just a delay
    // Phase 3: Auto-transition (2000–2800ms)
    const autoTransition = Animated.parallel([
      // Drive the transition progress 0→1
      Animated.timing(transitionProgress, {
        toValue: 1,
        duration: 800,
        delay: 2000,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      // Art fades out
      Animated.timing(artOpacity, {
        toValue: 0,
        duration: 600,
        delay: 2000,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      // Overlay background fades out
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 800,
        delay: 2000,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([brandEntrance, autoTransition]).start(() => {
      onComplete();
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
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
          opacity: overlayOpacity,
        },
      ]}
      pointerEvents="none">
      {/* Art frame */}
      <Animated.View
        style={[styles.artContainer, {opacity: artOpacity}]}
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

      {/* Brand text — centered, animates up to header */}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  artContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  artFrame: {
    position: 'absolute',
    top: 100,
    left: 24,
    right: 24,
    height: 220,
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
