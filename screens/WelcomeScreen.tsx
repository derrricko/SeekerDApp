import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../components/theme';

interface WelcomeScreenProps {
  onContinue: () => void;
}

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
    // Brand reveal with scale
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

    // Line expand
    Animated.timing(lineWidth, {
      toValue: 80,
      duration: 1800,
      delay: 1400,
      useNativeDriver: false,
    }).start();

    // Tagline
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

    // Tap hint
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

    // Tap arrow pulse
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

    // Footer
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
        <View style={styles.content}>
          {/* Brand */}
          <Animated.View
            style={[
              styles.brandContainer,
              {
                opacity: brandOpacity,
                transform: [{translateY: brandTranslateY}, {scale: brandScale}],
              },
            ]}>
            <Text style={[styles.brand, {color: colors.textPrimary}]}>
              GLIMPSE
            </Text>
            <Animated.View
              style={[
                styles.brandLine,
                {width: lineWidth, backgroundColor: colors.primary},
              ]}
            />
          </Animated.View>

          {/* Tagline */}
          <Animated.Text
            style={[
              styles.tagline,
              {
                color: colors.textSecondary,
                opacity: taglineOpacity,
                transform: [{translateY: taglineTranslateY}],
              },
            ]}>
            DOCUMENTING KINDNESS.
          </Animated.Text>
        </View>

        {/* Scripture reference */}
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

        {/* Tap to continue */}
        <Animated.View
          style={[
            styles.tapContainer,
            {
              opacity: footerOpacity,
              transform: [{translateY: footerTranslateY}],
              bottom: 36 + insets.bottom,
            },
          ]}>
          <Text style={[styles.tapText, {color: colors.textTertiary}]}>
            Tap to continue
          </Text>
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

        {/* Transition overlay */}
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
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
  },
  brand: {
    fontSize: 48,
    fontWeight: '200',
    letterSpacing: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  brandLine: {
    height: 2,
    marginTop: 12,
    borderRadius: 1,
  },
  tagline: {
    marginTop: 32,
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scriptureHint: {
    position: 'absolute',
    bottom: 100,
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
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tapContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tapText: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
