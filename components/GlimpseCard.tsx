import React, {useEffect, useRef} from 'react';
import {Animated, Easing, Platform, StyleSheet, Text, View} from 'react-native';
import GlassCard from './GlassCard';
import {useTheme, Typography} from './theme';
import type {GlimpseProof} from '../data/content';

const ENTRANCE_DURATION = 300;
const EASE_OUT = Easing.out(Easing.cubic);
const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

interface GlimpseCardProps {
  glimpse: GlimpseProof;
  delay: number;
}

export default function GlimpseCard({glimpse, delay}: GlimpseCardProps) {
  const {colors} = useTheme();

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTRANCE_DURATION,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: ENTRANCE_DURATION,
        delay,
        easing: EASE_OUT,
        useNativeDriver: true,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[glimpseStyles.wrapper, {opacity, transform: [{translateY}]}]}>
      <GlassCard variant="secondary">
        {/* Image placeholder */}
        <View
          style={[
            glimpseStyles.imagePlaceholder,
            {
              backgroundColor: colors.primaryLight,
              borderColor: colors.glassBorder,
            },
          ]}>
          <Text
            style={[
              glimpseStyles.imagePlaceholderIcon,
              {color: colors.primary},
            ]}>
            {'\uD83D\uDDBC'}
          </Text>
          <Text
            style={[
              glimpseStyles.imagePlaceholderText,
              {color: colors.textTertiary},
            ]}>
            Photo proof
          </Text>
        </View>

        {/* Need title + amount */}
        <Text style={[glimpseStyles.needTitle, {color: colors.textPrimary}]}>
          {glimpse.needTitle}
        </Text>
        <Text style={[glimpseStyles.amount, {color: colors.primary}]}>
          ${glimpse.amount} gift
        </Text>

        {/* Caption — the story */}
        <Text style={[glimpseStyles.caption, {color: colors.textSecondary}]}>
          {glimpse.caption}
        </Text>

        {/* Footer: date + verified badge */}
        <View style={glimpseStyles.footer}>
          <Text style={[glimpseStyles.date, {color: colors.textTertiary}]}>
            {glimpse.date}
          </Text>
          <View
            style={[
              glimpseStyles.verifiedBadge,
              {backgroundColor: colors.primaryLight},
            ]}>
            <Text style={[glimpseStyles.verifiedText, {color: colors.accent}]}>
              Verified on Solana
            </Text>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const glimpseStyles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  imagePlaceholder: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  imagePlaceholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  imagePlaceholderText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
  },
  needTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    fontFamily: DISPLAY_FONT,
    marginBottom: 4,
  },
  amount: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    marginBottom: 12,
  },
  caption: {
    fontSize: Typography.body.fontSize,
    lineHeight: 26,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: Typography.caption.fontSize,
    letterSpacing: Typography.caption.letterSpacing,
  },
  verifiedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
