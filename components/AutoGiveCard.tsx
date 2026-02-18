import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import GlassCard from './GlassCard';
import {useTheme, Typography} from './theme';
import {triggerHaptic} from '../utils/haptics';
import {EASE_OUT} from '../utils/animations';
import {formatUSDC} from '../data/mockData';
import type {AutoGiveConfig} from '../data/mockData';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

interface AutoGiveCardProps {
  config: AutoGiveConfig;
  onChainReaction?: (updates: {
    amountDelta: number;
    streakDelta: number;
    newPosition: string;
  }) => void;
}

export default function AutoGiveCard({config, onChainReaction}: AutoGiveCardProps) {
  const {colors} = useTheme();
  const [simulating, setSimulating] = useState(false);

  // Toast animation
  const toastTranslateY = useRef(new Animated.Value(-80)).current;
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);

  // Button scale
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handleSimulate = () => {
    if (simulating) {return;}
    setSimulating(true);

    // Step 1: Haptic + button pulse
    triggerHaptic('notificationSuccess');
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 6,
      }),
    ]).start();

    // Step 2: Toast slides down (300ms delay)
    setTimeout(() => {
      setShowToast(true);
      toastTranslateY.setValue(-80);
      toastOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(toastTranslateY, {
          toValue: 0,
          duration: 300,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    // Step 3: Trigger chain reaction updates (800ms)
    setTimeout(() => {
      onChainReaction?.({
        amountDelta: 430_000, // $0.43 in micro-USDC
        streakDelta: 1,
        newPosition: '#3 this week',
      });
    }, 800);

    // Step 4: Dismiss toast (2500ms)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(toastTranslateY, {
          toValue: -80,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => setShowToast(false));
    }, 2500);

    // Reset simulating state
    setTimeout(() => setSimulating(false), 3000);
  };

  return (
    <View>
      {/* Toast banner */}
      {showToast && (
        <Animated.View
          style={[
            autoStyles.toast,
            {
              backgroundColor: colors.accent,
              transform: [{translateY: toastTranslateY}],
              opacity: toastOpacity,
            },
          ]}>
          <Text style={[autoStyles.toastText, {color: colors.textOnPrimary}]}>
            Purchase detected: $42.50 at Coffee Shop
          </Text>
        </Animated.View>
      )}

      <GlassCard variant="primary">
        <View>
          <Text style={[autoStyles.title, {color: colors.textPrimary}]}>
            Auto-Give
          </Text>

          <View style={autoStyles.statsRow}>
            <View style={autoStyles.stat}>
              <Text style={[autoStyles.statValue, {color: colors.textPrimary}]}>
                {formatUSDC(config.reserveBalance)}
              </Text>
              <Text style={[autoStyles.statLabel, {color: colors.textTertiary}]}>
                reserve
              </Text>
            </View>
            <View style={autoStyles.stat}>
              <Text style={[autoStyles.statValue, {color: colors.textPrimary}]}>
                {formatUSDC(config.amountPerTrigger)}
              </Text>
              <Text style={[autoStyles.statLabel, {color: colors.textTertiary}]}>
                per purchase
              </Text>
            </View>
            <View style={autoStyles.stat}>
              <Text style={[autoStyles.statValue, {color: colors.textPrimary}]}>
                {config.triggerCount}
              </Text>
              <Text style={[autoStyles.statLabel, {color: colors.textTertiary}]}>
                triggers
              </Text>
            </View>
          </View>

          <Animated.View style={{transform: [{scale: buttonScale}]}}>
            <TouchableOpacity
              style={[
                autoStyles.simulateButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.shadow,
                  opacity: simulating ? 0.7 : 1,
                },
              ]}
              onPress={handleSimulate}
              activeOpacity={0.8}
              disabled={simulating}>
              <Text
                style={[
                  autoStyles.simulateText,
                  {color: colors.textOnPrimary},
                ]}>
                {simulating ? 'Simulating...' : 'Simulate a Purchase'}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Text style={[autoStyles.badge, {color: colors.textTertiary}]}>
            devnet pilot
          </Text>
        </View>
      </GlassCard>
    </View>
  );
}

const autoStyles = StyleSheet.create({
  title: {
    ...Typography.subheading,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '300',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -0.3,
  },
  statLabel: {
    ...Typography.caption,
    marginTop: 4,
  },
  simulateButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  simulateText: {
    ...Typography.buttonLarge,
  },
  badge: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 12,
  },
  toast: {
    position: 'absolute',
    top: -60,
    left: 0,
    right: 0,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 10,
    alignItems: 'center',
  },
  toastText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
});
