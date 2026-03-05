import React from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {useTheme} from '../theme/Theme';
import {getRecipientLabel} from '../data/donationConfig';
import {getExplorerUrl} from '../utils/explorer';
import type {EnhancedDonation} from '../services/helius';

interface ProofCardProps {
  amountUsdc: number;
  recipientId: string;
  txSignature: string;
  createdAt: string;
  donorWallet?: string;
  status: string;
  enhanced?: EnhancedDonation;
  enhancedLoading?: boolean;
  onPress?: () => void;
  action?: {label: string; onPress: () => void};
  compact?: boolean;
  style?: ViewStyle;
}

type VerificationState = 'verified' | 'pending' | 'unavailable';

function getVerificationState(
  enhanced?: EnhancedDonation,
  enhancedLoading?: boolean,
): VerificationState {
  if (enhancedLoading) {
    return 'pending';
  }
  if (enhanced?.verified === true) {
    return 'verified';
  }
  return 'unavailable';
}

function ShieldGlyph({color}: {color: string}) {
  const {theme} = useTheme();

  return (
    <View style={styles.shieldWrap}>
      <View style={[styles.shieldBody, {backgroundColor: color}]} />
      <View style={[styles.shieldPoint, {borderTopColor: color}]} />
      <Text
        style={[
          styles.shieldLetter,
          {color: '#FFFFFF', fontFamily: theme.typography.brand},
        ]}>
        G
      </Text>
    </View>
  );
}

function formatMetaLine(
  recipientId: string,
  createdAt: string,
  donorWallet?: string,
): string {
  const label = getRecipientLabel(recipientId);
  const date = new Date(createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (donorWallet) {
    const short = `${donorWallet.slice(0, 4)}...${donorWallet.slice(-4)}`;
    return `${short}  \u00B7  ${label}  \u00B7  ${date}`;
  }

  return `${label}  \u00B7  ${date}`;
}

export default function ProofCard({
  amountUsdc,
  recipientId,
  txSignature,
  createdAt,
  donorWallet,
  enhanced,
  enhancedLoading,
  onPress,
  action,
  compact,
  style,
}: ProofCardProps) {
  const {theme} = useTheme();
  const verification = getVerificationState(enhanced, enhancedLoading);

  const card = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderMuted,
          borderRadius: theme.radius.lg,
        },
        theme.shadows.card,
        style,
      ]}>
      {/* Teal accent rail — verified only */}
      {verification === 'verified' && (
        <View
          style={[
            styles.rail,
            {
              backgroundColor: theme.colors.teal,
              borderTopLeftRadius: theme.radius.lg,
              borderBottomLeftRadius: theme.radius.lg,
            },
          ]}
        />
      )}

      <View style={styles.inner}>
        {/* Top row: amount + verification badge */}
        <View style={styles.topRow}>
          <Text
            style={[
              styles.amount,
              compact && styles.amountCompact,
              {
                color: theme.colors.textPrimary,
                fontFamily: compact
                  ? theme.typography.displayRegular
                  : theme.typography.display,
              },
            ]}>
            ${amountUsdc.toFixed(2)} USDC
          </Text>

          {verification === 'verified' ? (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.colors.teal + '24',
                  borderColor: theme.colors.teal + '66',
                },
              ]}>
              <ShieldGlyph color={theme.colors.teal} />
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: theme.colors.teal,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                VERIFIED ON-CHAIN
              </Text>
            </View>
          ) : verification === 'pending' ? (
            <View style={styles.pendingRow}>
              <ActivityIndicator
                size="small"
                color={theme.colors.textTertiary}
              />
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                CONFIRMING...
              </Text>
            </View>
          ) : null}
        </View>

        {/* Meta row */}
        <Text style={[styles.meta, {color: theme.colors.textSecondary}]}>
          {formatMetaLine(recipientId, createdAt, donorWallet)}
        </Text>

        {/* Footer row — skip in compact mode */}
        {!compact && (
          <View style={styles.footerRow}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => Linking.openURL(getExplorerUrl(txSignature))}>
              <Text
                style={[
                  styles.explorerLink,
                  {
                    color: theme.colors.teal,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                View on Explorer {'\u2197'}
              </Text>
            </TouchableOpacity>

            {action ? (
              <TouchableOpacity activeOpacity={0.8} onPress={action.onPress}>
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: theme.colors.accent,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text
                style={[
                  styles.dateText,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                {new Date(createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (!onPress) {
    return card;
  }

  return (
    <TouchableOpacity activeOpacity={0.84} onPress={onPress}>
      {card}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  inner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 7,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  amount: {
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '400',
    flexShrink: 1,
  },
  amountCompact: {
    fontSize: 18,
    lineHeight: 22,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  meta: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.3,
    fontFamily: 'CourierPrime-Regular',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 1,
  },
  explorerLink: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.5,
  },
  actionText: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dateText: {
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.4,
  },
  shieldWrap: {
    width: 14,
    height: 15,
    alignItems: 'center',
    position: 'relative',
  },
  shieldBody: {
    width: 12,
    height: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  shieldPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  shieldLetter: {
    position: 'absolute',
    top: 0,
    fontSize: 6,
    lineHeight: 8,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
