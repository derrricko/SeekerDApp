import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Colors} from '../components/Colors';

const {width, height} = Dimensions.get('window');

interface WelcomeScreenProps {
  onContinue: () => void;
}

export default function WelcomeScreen({onContinue}: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();

  // Animation values
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(12)).current;
  const brandLetterSpacing = useRef(new Animated.Value(20)).current; // Extra spacing that will reduce

  const lineWidth = useRef(new Animated.Value(0)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(10)).current;

  const tapHintOpacity = useRef(new Animated.Value(0)).current;
  const tapHintTranslateY = useRef(new Animated.Value(10)).current;
  const tapArrowPulse = useRef(new Animated.Value(0)).current;

  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(10)).current;

  // Transition animations
  const transitionOpacity = useRef(new Animated.Value(1)).current;
  const whiteOverlay = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered animation sequence matching the HTML timing

    // Brand reveal: starts at 0.2s, duration 2.4s
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
    ]).start();

    // Line expand: starts at 1.4s, duration 1.8s
    Animated.timing(lineWidth, {
      toValue: 60,
      duration: 1800,
      delay: 1400,
      useNativeDriver: false,
    }).start();

    // Tagline: starts at 2s, duration 2s
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

    // Tap hint: starts at 3.2s, duration 1.6s
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

    // Tap arrow pulse: starts at 4s, loops
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

    // Footer: starts at 3.6s, duration 2s
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
    // Transition animation sequence
    Animated.parallel([
      // Fade out tagline
      Animated.timing(taglineOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      // Fade out tap hint
      Animated.timing(tapHintOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade out footer
      Animated.timing(footerOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Brand floats up and fades
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
      // White overlay
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

  // Interpolate pulse for arrow opacity and movement
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
      <View style={styles.container}>
        {/* Warm glow from center */}
        <View style={styles.warmGlow} />

        <View style={styles.content}>
          {/* Brand */}
          <Animated.View
            style={[
              styles.brandContainer,
              {
                opacity: brandOpacity,
                transform: [{translateY: brandTranslateY}],
              },
            ]}>
            <Text style={styles.brand}>glimpse</Text>
            <Animated.View style={[styles.brandLine, {width: lineWidth}]} />
          </Animated.View>

          {/* Tagline */}
          <Animated.View
            style={[
              styles.taglineContainer,
              {
                opacity: taglineOpacity,
                transform: [{translateY: taglineTranslateY}],
              },
            ]}>
            <Text style={styles.tagline}>creating connections</Text>
            <Text style={styles.tagline}>documenting kindness</Text>
          </Animated.View>
        </View>

        {/* Tap hint */}
        <Animated.View
          style={[
            styles.tapHint,
            {
              opacity: tapHintOpacity,
              transform: [{translateY: tapHintTranslateY}],
            },
          ]}>
          <Animated.View
            style={[
              styles.tapArrow,
              {
                opacity: arrowOpacity,
                transform: [{translateY: arrowTranslateY}, {rotate: '45deg'}],
              },
            ]}
          />
          <Text style={styles.tapText}>tap to continue</Text>
        </Animated.View>

        {/* Footer reference */}
        <Animated.View
          style={[
            styles.footerContainer,
            {
              opacity: footerOpacity,
              transform: [{translateY: footerTranslateY}],
              bottom: 36 + insets.bottom,
            },
          ]}>
          <Text style={styles.footerRef}>Matthew 6 : 3</Text>
        </Animated.View>

        {/* White transition overlay */}
        <Animated.View
          style={[
            styles.whiteOverlay,
            {
              opacity: whiteOverlay,
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
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warmGlow: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    width: 300,
    height: 300,
    marginLeft: -150,
    marginTop: -150,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    opacity: 0.15,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: {width: 12, height: 12},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  brand: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 48,
    letterSpacing: 12,
    textTransform: 'uppercase',
    color: Colors.cardBg,
    fontWeight: '900',
  },
  brandLine: {
    height: 4,
    marginTop: 12,
    backgroundColor: Colors.primary,
  },
  taglineContainer: {
    marginTop: 32,
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 3,
    borderColor: Colors.border,
    shadowColor: Colors.border,
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tagline: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 13,
    color: Colors.textDark,
    textAlign: 'center',
    lineHeight: 24,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  tapHint: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  tapArrow: {
    width: 24,
    height: 24,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: Colors.cardBg,
    marginBottom: 12,
  },
  tapText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 11,
    color: Colors.cardBg,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  footerContainer: {
    position: 'absolute',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  footerRef: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 11,
    color: Colors.textLight,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background,
  },
});
