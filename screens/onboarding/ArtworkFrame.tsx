import React, {useEffect, useRef} from 'react';
import {Animated, Image, StyleSheet, Text, View} from 'react-native';
import {useTheme, Typography} from '../../components/theme';
import {EASE_OUT} from '../../utils/animations';

interface ArtworkFrameProps {
  isVisible: boolean;
}

export default function ArtworkFrame({isVisible}: ArtworkFrameProps) {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, opacity, scale]);

  return (
    <View style={styles.wrapper}>
      {/* Warm glow behind frame */}
      <View style={[styles.glow, {backgroundColor: colors.primaryLight}]} />
      <Animated.View
        style={[
          styles.frameOuter,
          {
            opacity,
            transform: [{scale}],
          },
        ]}>
        <View
          style={[
            styles.frame,
            {
              borderColor: colors.glassBorder,
              shadowColor: colors.shadow,
              backgroundColor: colors.card,
            },
          ]}>
          <Image
            source={require('../../assets/creationofadam.jpg')}
            style={styles.image}
            resizeMode="cover"
          />
          <View style={[styles.wash, {backgroundColor: colors.background}]} />
          <View style={[styles.tint, {backgroundColor: colors.primaryLight}]} />
          <View style={[styles.vignette, {borderColor: colors.border}]} />
        </View>
      </Animated.View>
      <Text
        style={[
          styles.caption,
          {
            color: colors.textTertiary,
            fontFamily: Typography.display.fontFamily,
          },
        ]}>
        documenting kindness
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  },
  glow: {
    position: 'absolute',
    top: -8,
    left: -8,
    right: -8,
    bottom: 16,
    borderRadius: 32,
    opacity: 0.12,
  },
  frameOuter: {
    width: '100%',
  },
  frame: {
    width: '100%',
    height: 280,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  image: {
    position: 'absolute',
    top: -60,
    left: -30,
    width: '120%',
    height: '150%',
    opacity: 0.95,
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.25,
  },
  tint: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
  },
  vignette: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    borderRadius: 20,
    borderWidth: 1,
    opacity: 0.4,
  },
  caption: {
    marginTop: 12,
    fontSize: 15,
    fontStyle: 'italic',
  },
});
