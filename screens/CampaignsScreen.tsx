import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useWallet} from '../components/providers/WalletProvider';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';
import {
  getRecipientLabel,
  DONATION_STATUS_LABELS,
} from '../data/donationConfig';
import {getExplorerUrl} from '../utils/explorer';
import {
  fetchDonationHistory,
  fetchAllDonations,
  type DonationHistoryItem,
} from '../services/chat';

type ViewMode = 'feed' | 'my_glimpses';

const STALE_MS = 30_000;

export default function CampaignsScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const {publicKey, connect} = useWallet();
  const [viewMode, setViewMode] = useState<ViewMode>('feed');

  // Feed state (all donations)
  const [feedDonations, setFeedDonations] = useState<DonationHistoryItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const lastFeedFetchAt = useRef(0);

  // My Glimpses state (user's donations)
  const [donationHistory, setDonationHistory] = useState<DonationHistoryItem[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const lastHistoryFetchAt = useRef(0);

  const walletAddress = publicKey?.toBase58() ?? null;

  // Feed tab — all donations
  useEffect(() => {
    if (viewMode !== 'feed') {
      return;
    }

    if (
      lastFeedFetchAt.current > 0 &&
      Date.now() - lastFeedFetchAt.current < STALE_MS
    ) {
      return;
    }

    let cancelled = false;
    setFeedLoading(true);
    setFeedError(null);

    fetchAllDonations(50)
      .then(rows => {
        if (!cancelled) {
          setFeedDonations(rows);
          setFeedLoading(false);
          lastFeedFetchAt.current = Date.now();
        }
      })
      .catch(error => {
        if (!cancelled) {
          setFeedError(
            error instanceof Error
              ? error.message
              : 'Unable to load feed right now.',
          );
          setFeedLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // My Glimpses tab — user's donations
  useEffect(() => {
    if (viewMode !== 'my_glimpses') {
      return;
    }
    if (!walletAddress) {
      setDonationHistory([]);
      setHistoryLoading(false);
      setHistoryError(null);
      return;
    }

    if (
      lastHistoryFetchAt.current > 0 &&
      Date.now() - lastHistoryFetchAt.current < STALE_MS
    ) {
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);

    fetchDonationHistory(walletAddress)
      .then(rows => {
        if (!cancelled) {
          setDonationHistory(rows);
          setHistoryLoading(false);
          lastHistoryFetchAt.current = Date.now();
        }
      })
      .catch(error => {
        if (!cancelled) {
          setHistoryError(
            error instanceof Error
              ? error.message
              : 'Unable to load donation history right now.',
          );
          setHistoryLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, walletAddress]);

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Glimpses" />
      <ScreenContainer>
        <SurfaceCard style={styles.panel}>
          <View
            style={[
              styles.toggle,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}>
            <TouchableOpacity
              style={[
                styles.togglePill,
                {
                  backgroundColor:
                    viewMode === 'feed' ? theme.colors.accent : 'transparent',
                },
              ]}
              onPress={() => setViewMode('feed')}
              activeOpacity={0.85}>
              <Text
                style={[
                  styles.toggleText,
                  {
                    color:
                      viewMode === 'feed'
                        ? '#F3EFFF'
                        : theme.colors.textSecondary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                FEED
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.togglePill,
                {
                  backgroundColor:
                    viewMode === 'my_glimpses'
                      ? theme.colors.accent
                      : 'transparent',
                },
              ]}
              onPress={() => setViewMode('my_glimpses')}
              activeOpacity={0.85}>
              <Text
                style={[
                  styles.toggleText,
                  {
                    color:
                      viewMode === 'my_glimpses'
                        ? '#F3EFFF'
                        : theme.colors.textSecondary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                MY GLIMPSES
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.panelRule,
              {backgroundColor: theme.colors.borderMuted},
            ]}
          />

          {viewMode === 'feed'
            ? renderDonationList({
                requiresWallet: false,
                walletConnected: !!walletAddress,
                loading: feedLoading,
                error: feedError,
                rows: feedDonations,
                navigation,
                theme,
                emptyText: 'No donations yet. Be the first to give a glimpse.',
                showDonorWallet: true,
              })
            : renderDonationList({
                requiresWallet: true,
                walletConnected: !!walletAddress,
                loading: historyLoading,
                error: historyError,
                rows: donationHistory,
                navigation,
                theme,
                emptyText: 'No donations recorded for this wallet yet.',
                showDonorWallet: false,
                onConnect: connect,
              })}
        </SurfaceCard>
      </ScreenContainer>
    </View>
  );
}

function renderDonationList({
  requiresWallet,
  walletConnected,
  loading,
  error,
  rows,
  navigation,
  theme,
  emptyText,
  showDonorWallet,
  onConnect,
}: {
  requiresWallet: boolean;
  walletConnected: boolean;
  loading: boolean;
  error: string | null;
  rows: DonationHistoryItem[];
  navigation: any;
  theme: ReturnType<typeof useTheme>['theme'];
  emptyText: string;
  showDonorWallet: boolean;
  onConnect?: () => void;
}) {
  if (requiresWallet && !walletConnected) {
    return (
      <TouchableOpacity
        activeOpacity={0.84}
        onPress={() => onConnect?.()}
        style={[
          styles.stateCard,
          styles.centeredState,
          {
            borderColor: theme.colors.borderMuted,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}>
        <Text
          style={[
            styles.stateText,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.typography.brand,
            },
          ]}>
          Connect your wallet to see your donation history.
        </Text>
        <Text
          style={[
            styles.stateLink,
            {
              color: theme.colors.accent,
              fontFamily: theme.typography.brand,
            },
          ]}>
          CONNECT WALLET →
        </Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          styles.stateCard,
          styles.centeredState,
          {
            borderColor: theme.colors.borderMuted,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}>
        <ActivityIndicator size="small" color={theme.colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View
        style={[
          styles.stateCard,
          styles.centeredState,
          {
            borderColor: theme.colors.borderMuted,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}>
        <Text style={[styles.stateText, {color: theme.colors.danger}]}>
          {error}
        </Text>
      </View>
    );
  }

  if (rows.length === 0) {
    return (
      <View
        style={[
          styles.stateCard,
          styles.centeredState,
          {
            borderColor: theme.colors.borderMuted,
            backgroundColor: theme.colors.surfaceMuted,
          },
        ]}>
        <Text style={[styles.stateText, {color: theme.colors.textSecondary}]}>
          {emptyText}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.historyWrap}>
      {rows.map(item => {
        const recipient = getRecipientLabel(item.recipient_id);
        const statusLabel = DONATION_STATUS_LABELS[item.status] ?? 'CONFIRMED';
        const statusColor =
          item.status === 'completed'
            ? theme.colors.success
            : theme.colors.accent;
        const truncatedWallet = item.donor_wallet
          ? `${item.donor_wallet.slice(0, 4)}...${item.donor_wallet.slice(-4)}`
          : '';
        const cardContent = (
          <>
            <View style={styles.historyTopRow}>
              <Text
                style={[
                  styles.historyAmount,
                  {color: theme.colors.textPrimary},
                ]}>
                ${item.amount_usdc.toFixed(2)} USDC
              </Text>
              <Text
                style={[
                  styles.historyStatus,
                  {color: statusColor, fontFamily: theme.typography.brand},
                ]}>
                {statusLabel}
              </Text>
            </View>
            {showDonorWallet && truncatedWallet ? (
              <Text
                style={[
                  styles.historyMeta,
                  {color: theme.colors.textSecondary},
                ]}>
                {truncatedWallet} - {recipient}
              </Text>
            ) : (
              <Text
                style={[
                  styles.historyMeta,
                  {color: theme.colors.textSecondary},
                ]}>
                {recipient} -{' '}
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            )}
          </>
        );

        if (showDonorWallet) {
          return (
            <View
              key={item.id}
              style={[
                styles.historyCard,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.borderMuted,
                },
              ]}>
              {cardContent}
              {item.tx_signature ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    Linking.openURL(getExplorerUrl(item.tx_signature))
                  }>
                  <Text
                    style={[
                      styles.explorerLink,
                      {color: theme.colors.textTertiary},
                    ]}>
                    View on Explorer {'\u2197'}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.84}
            onPress={() => {
              if (item.conversation_id) {
                navigation.navigate('Messages', {
                  conversationId: item.conversation_id,
                });
              } else {
                navigation.navigate('Messages');
              }
            }}
            style={[
              styles.historyCard,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.borderMuted,
              },
            ]}>
            {cardContent}
            <View style={styles.historyActions}>
              {item.tx_signature ? (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={e => {
                    e.stopPropagation();
                    Linking.openURL(getExplorerUrl(item.tx_signature));
                  }}>
                  <Text
                    style={[
                      styles.explorerLink,
                      {color: theme.colors.textTertiary},
                    ]}>
                    View on Explorer {'\u2197'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              <Text
                style={[
                  styles.historyThreadLink,
                  {
                    color: theme.colors.accent,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                {item.conversation_id
                  ? 'VIEW THREAD \u2192'
                  : 'PROCESSING...'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  panel: {
    marginBottom: 18,
    borderRadius: 16,
    borderWidth: 2,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  toggle: {
    borderWidth: 2,
    borderRadius: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  togglePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  panelRule: {
    height: 1,
    marginTop: 12,
    marginBottom: 10,
  },
  historyWrap: {
    gap: 8,
  },
  historyCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  historyTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyAmount: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  historyStatus: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  historyMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  stateCard: {
    borderRadius: 10,
    borderWidth: 1,
  },
  centeredState: {
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  stateText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  stateLink: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontWeight: '700',
    marginTop: 10,
  },
  historyThreadLink: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  explorerLink: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
});
