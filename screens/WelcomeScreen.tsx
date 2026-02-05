import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../components/theme';

interface WelcomeScreenProps {
  onContinue: () => void;
}

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function WelcomeScreen({onContinue}: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();

  // Animation values
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(12)).current;
  const brandScale = useRef(new Animated.Value(0.95)).current;

  const lineWidth = useRef(new Animated.Value(0)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;

  const tapHintOpacity = useRef(new Animated.Value(0)).current;
  const tapHintTranslateY = useRef(new Animated.Value(10)).current;
  const tapArrowPulse = useRef(new Animated.Value(0)).current;

  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(10)).current;

  // Transition animations
  const whiteOverlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 2400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(brandTranslateY, {
        toValue: 0,
        duration: 2400,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.spring(brandScale, {
        toValue: 1,
        delay: 200,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
    ]).start();

    Animated.timing(lineWidth, {
      toValue: 84,
      duration: 1800,
      delay: 1400,
      useNativeDriver: false,
    }).start();

    Animated.parallel([
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 2000,
        delay: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(taglineTranslateY, {
        toValue: 0,
        duration: 2000,
        delay: 2000,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(tapHintOpacity, {
        toValue: 1,
        duration: 1600,
        delay: 3200,
        useNativeDriver: true,
      }),
      Animated.timing(tapHintTranslateY, {
        toValue: 0,
        duration: 1600,
        delay: 3200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(tapArrowPulse, {
          toValue: 1,
          duration: 1400,
          delay: 4000,
          useNativeDriver: true,
        }),
        Animated.timing(tapArrowPulse, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.parallel([
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 2000,
        delay: 3600,
        useNativeDriver: true,
      }),
      Animated.timing(footerTranslateY, {
        toValue: 0,
        duration: 2000,
        delay: 3600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleTap = () => {
    Animated.parallel([
      Animated.timing(taglineOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(tapHintOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(footerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(brandTranslateY, {
        toValue: -20,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(brandOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(brandScale, {
        toValue: 1.1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(whiteOverlay, {
        toValue: 1,
        duration: 1200,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onContinue();
    });
  };

  const arrowOpacity = tapArrowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  const arrowTranslateY = tapArrowPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 4],
  });

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={[styles.container, {backgroundColor: colors.background}]}>
        <View pointerEvents="none" style={styles.background}>
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
              style={[
                styles.artWash,
                {backgroundColor: colors.background},
              ]}
            />
            <View
              style={[
                styles.artTint,
                {backgroundColor: colors.primaryLight},
              ]}
            />
            <View
              style={[
                styles.artVignette,
                {borderColor: colors.border},
              ]}
            />
          </View>
        </View>

        <View style={styles.content}>
          <Animated.View
            style={[
              styles.brandContainer,
              {
                opacity: brandOpacity,
                transform: [{translateY: brandTranslateY}, {scale: brandScale}],
              },
            ]}>
            <Text style={[styles.brand, {color: colors.textPrimary}]}>Glimpse</Text>
            <Animated.View
              style={[
                styles.brandLine,
                {width: lineWidth, backgroundColor: colors.primary},
              ]}
            />
          </Animated.View>

          <Animated.Text
            style={[
              styles.tagline,
              {
                color: colors.textSecondary,
                opacity: taglineOpacity,
                transform: [{translateY: taglineTranslateY}],
              },
            ]}>
            documenting kindness
          </Animated.Text>
        </View>

        <Animated.View
          style={[
            styles.scriptureHint,
            {
              opacity: tapHintOpacity,
              transform: [{translateY: tapHintTranslateY}],
            },
          ]}>
          <Text style={[styles.scriptureText, {color: colors.textTertiary}]}>
            Matthew 6:3
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.tapContainer,
            {
              opacity: footerOpacity,
              transform: [{translateY: footerTranslateY}],
              bottom: 36 + insets.bottom,
            },
          ]}>
          <Text style={[styles.tapText, {color: colors.textTertiary}]}>Tap to begin</Text>
          <Animated.View
            style={[
              styles.tapArrow,
              {
                opacity: arrowOpacity,
                transform: [{translateY: arrowTranslateY}, {rotate: '45deg'}],
                borderColor: colors.textTertiary,
              },
            ]}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: whiteOverlay,
              backgroundColor: colors.background,
            },
          ]}
          pointerEvents="none"
        />
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brand: {
    fontSize: 52,
    fontWeight: '500',
    letterSpacing: 4,
    fontFamily: DISPLAY_FONT,
  },
  brandLine: {
    height: 2,
    marginTop: 14,
    borderRadius: 1,
  },
  tagline: {
    marginTop: 28,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 2.5,
  },
  scriptureHint: {
    position: 'absolute',
    bottom: 110,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapArrow: {
    width: 16,
    height: 16,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    marginTop: 10,
  },
  scriptureText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2,
  },
  tapContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapText: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 2,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
