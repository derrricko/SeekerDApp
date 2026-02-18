import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import GlassCard from './GlassCard';
import {useTheme, Typography} from './theme';
import {triggerHaptic} from '../utils/haptics';
import {formatUSDC} from '../data/mockData';
import type {Vault} from '../data/mockData';
import {CHIP_IN_AMOUNTS} from '../data/content';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

interface VaultCardProps {
  vault: Vault;
  index: number;
  onPress: () => void;
  onDeposit: (amount: number) => void;
}

export default function VaultCard({
  vault,
  index,
  onPress,
  onDeposit,
}: VaultCardProps) {
  const {colors} = useTheme();
  const accentColors = [colors.primary, colors.accent, colors.secondary];
  const accentColor = accentColors[index % accentColors.length];

  const progress = vault.totalDeposited / vault.target;
  const progressPercent = Math.min(progress * 100, 100);

  return (
    <GlassCard variant="secondary" onPress={onPress}>
      <View style={vaultStyles.content}>
        {/* Dynamic accent bar — height proportional to funding */}
        <View
          style={[
            vaultStyles.accentBar,
            {
              backgroundColor: accentColor,
              height: `${Math.max(progressPercent, 10)}%`,
            },
          ]}
        />

        <Text style={[vaultStyles.name, {color: colors.textPrimary}]}>
          {vault.name}
        </Text>
        <Text
          style={[vaultStyles.description, {color: colors.textSecondary}]}
          numberOfLines={2}>
          {vault.description}
        </Text>

        {/* Funding stats */}
        <View style={vaultStyles.statsRow}>
          <Text style={[vaultStyles.funded, {color: accentColor}]}>
            {formatUSDC(vault.totalDeposited)}
          </Text>
          <Text style={[vaultStyles.target, {color: colors.textTertiary}]}>
            {' '}of {formatUSDC(vault.target)}
          </Text>
          <Text style={[vaultStyles.depositors, {color: colors.textTertiary}]}>
            {' \u00B7 '}{vault.depositorCount} givers
          </Text>
        </View>

        {/* Quick-deposit chips */}
        <View style={vaultStyles.chipRow}>
          {CHIP_IN_AMOUNTS.map(amount => (
            <TouchableOpacity
              key={amount}
              style={[
                vaultStyles.chip,
                {borderColor: accentColor},
              ]}
              onPress={e => {
                e.stopPropagation?.();
                triggerHaptic('impactLight');
                onDeposit(amount);
              }}
              activeOpacity={0.7}>
              <Text style={[vaultStyles.chipText, {color: accentColor}]}>
                ${amount}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

const vaultStyles = StyleSheet.create({
  content: {
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    left: -20,
    bottom: -20,
    width: 3,
    borderRadius: 1.5,
  },
  name: {
    ...Typography.subheading,
    marginBottom: 6,
  },
  description: {
    ...Typography.bodySmall,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  funded: {
    fontSize: 20,
    fontWeight: '300',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.3,
  },
  target: {
    ...Typography.bodySmall,
  },
  depositors: {
    ...Typography.caption,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipText: {
    ...Typography.buttonSmall,
  },
});
