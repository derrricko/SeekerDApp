import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import GlassCard from './GlassCard';
import {useTheme, Typography} from './theme';
import {triggerHaptic} from '../utils/haptics';
import type {Need} from '../data/content';

const ENTRANCE_DURATION = 300;
const EASE_OUT = Easing.out(Easing.cubic);
const springConfig = {useNativeDriver: true, speed: 50, bounciness: 4};

const smoothLayout = {
  duration: 250,
  update: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
  create: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
  delete: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
};

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// Amount size scales with magnitude — visual weight matches the ask
function getAmountSize(amount: number): number {
  if (amount >= 1000) return 40;
  if (amount >= 400) return 36;
  if (amount >= 250) return 33;
  if (amount >= 100) return 30;
  return 28;
}

interface NeedCardProps {
  need: Need;
  delay: number;
  index: number;
  onGive: (need: Need) => void;
}

export default function NeedCard({need, delay, index, onGive}: NeedCardProps) {
  const {colors} = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const padOffset = 24;
  const amountSize = getAmountSize(need.amount);
  const accentColors = [colors.primary, colors.accent, colors.secondary];
  const accentColor = accentColors[index % accentColors.length];
  // Breathing room before the big ask ($1,000)
  const bottomMargin = index === 3 ? 28 : 16;

  // Entrance animation
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: ENTRANCE_DURATION, delay, easing: EASE_OUT, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 0, duration: ENTRANCE_DURATION, delay, easing: EASE_OUT, useNativeDriver: true}),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  // Press animation
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => {
    triggerHaptic('impactLight');
    Animated.spring(scale, {toValue: 0.97, ...springConfig}).start();
  }, [scale]);
  const onPressOut = useCallback(() => {
    Animated.spring(scale, {toValue: 1, ...springConfig}).start();
  }, [scale]);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(smoothLayout);
    setIsExpanded(!isExpanded);
    triggerHaptic('impactLight');
  };

  const handleGive = () => {
    triggerHaptic('impactMedium');
    onGive(need);
  };

  return (
    <Animated.View style={[{marginBottom: bottomMargin}, {opacity, transform: [{translateY}, {scale}]}]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleExpand}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <GlassCard variant="primary">
          <View style={cardStyles.content}>
            {/* Accent bar — brand thread along left edge */}
            <View
              style={[
                cardStyles.accentBar,
                {
                  backgroundColor: accentColor,
                  left: -padOffset,
                  top: -padOffset,
                  bottom: -padOffset,
                },
              ]}
            />

            {/* Amount — hero, scaled by magnitude */}
            <Text
              style={[
                cardStyles.amount,
                {color: colors.textPrimary, fontSize: amountSize},
              ]}>
              ${need.amount.toLocaleString()}
            </Text>

            {/* Title — emotional context beneath the number */}
            <Text style={[cardStyles.title, {color: colors.textPrimary}]}>
              {need.title}
            </Text>

            {/* Expanded: description + Give button */}
            {isExpanded && (
              <View style={cardStyles.expandedInner}>
                <View style={[cardStyles.divider, {backgroundColor: colors.border}]} />
                <Text style={[cardStyles.description, {color: colors.textSecondary}]}>
                  {need.description}
                </Text>
                {need.partner && (
                  <Text style={[cardStyles.partner, {color: colors.textTertiary}]}>
                    {need.partner}
                  </Text>
                )}
                <TouchableOpacity
                  style={[cardStyles.giveButton, {backgroundColor: colors.primary, shadowColor: colors.shadow}]}
                  onPress={handleGive}
                  activeOpacity={0.8}>
                  <Text style={[cardStyles.giveButtonText, {color: colors.textOnPrimary}]}>
                    Give This Gift
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const cardStyles = StyleSheet.create({
  content: {padding: 0},
  accentBar: {
    position: 'absolute',
    width: 3,
  },
  amount: {
    fontWeight: '300',
    fontFamily: DISPLAY_FONT,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    fontSize: Typography.body.fontSize,
    fontWeight: '400',
    lineHeight: Typography.body.lineHeight,
  },
  expandedInner: {paddingTop: 20},
  divider: {height: 1, marginBottom: 16},
  description: {
    fontSize: Typography.body.fontSize,
    lineHeight: 26,
    marginBottom: 8,
  },
  partner: {
    fontSize: Typography.caption.fontSize,
    letterSpacing: Typography.caption.letterSpacing,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 8,
  },
  giveButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  giveButtonText: {
    ...Typography.buttonLarge,
  },
});
