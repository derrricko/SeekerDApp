import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
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
import ProofCard from '../ui/ProofCard';
import {
  fetchAllDonations,
  fetchDonationHistory,
  type DonationHistoryItem,
} from '../services/chat';
import {
  fetchEnhancedTransactions,
  type EnhancedDonation,
} from '../services/helius';

type ViewMode = 'feed' | 'my_glimpses';

const STALE_MS = 30_000;

export default function CampaignsScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const {publicKey, connect} = useWallet();
  const [viewMode, setViewMode] = useState<ViewMode>('feed');

  const [feedDonations, setFeedDonations] = useState<DonationHistoryItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const lastFeedFetchAt = useRef(0);

  const [donationHistory, setDonationHistory] = useState<DonationHistoryItem[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const lastHistoryFetchAtByWallet = useRef<Record<string, number>>({});
  const previousWalletRef = useRef<string | null>(null);

  const [enhancedData, setEnhancedData] = useState<
    Map<string, EnhancedDonation>
  >(new Map());
  const [enhancedFetching, setEnhancedFetching] = useState(false);

  const walletAddress = publicKey?.toBase58() ?? null;

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

    fetchAllDonations(60)
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
  }, [viewMode]);

  useEffect(() => {
    if (walletAddress !== previousWalletRef.current) {
      previousWalletRef.current = walletAddress;
      setDonationHistory([]);
      setHistoryError(null);
      setHistoryLoading(false);
    }
  }, [walletAddress]);

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

    const lastFetchAt = lastHistoryFetchAtByWallet.current[walletAddress] ?? 0;
    if (lastFetchAt > 0 && Date.now() - lastFetchAt < STALE_MS) {
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
          lastHistoryFetchAtByWallet.current[walletAddress] = Date.now();
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
  }, [viewMode, walletAddress]);

  const signatures = useMemo(() => {
    const allRows = [...feedDonations, ...donationHistory];
    const unique = new Set<string>();

    for (const row of allRows) {
      if (row.tx_signature) {
        unique.add(row.tx_signature);
      }
    }

    return [...unique];
  }, [donationHistory, feedDonations]);

  useEffect(() => {
    if (signatures.length === 0) {
      setEnhancedData(new Map());
      return;
    }

    let cancelled = false;
    setEnhancedFetching(true);

    fetchEnhancedTransactions(signatures)
      .then(data => {
        if (!cancelled) {
          setEnhancedData(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnhancedData(new Map());
        }
      })
      .finally(() => {
        if (!cancelled) {
          setEnhancedFetching(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [signatures]);

  const activeRows = viewMode === 'feed' ? feedDonations : donationHistory;
  const activeLoading = viewMode === 'feed' ? feedLoading : historyLoading;
  const activeError = viewMode === 'feed' ? feedError : historyError;

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Glimpses" />
      <ScreenContainer>
        <SurfaceCard style={styles.panel}>
          <View
            style={[
              styles.toggle,
              {
                borderColor: theme.colors.borderMuted,
                backgroundColor: theme.colors.surfaceMuted,
              },
            ]}>
            <TouchableOpacity
              style={[
                styles.togglePill,
                {
                  backgroundColor:
                    viewMode === 'feed'
                      ? theme.colors.surfaceAlt
                      : 'transparent',
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
                        ? theme.colors.textPrimary
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
                      ? theme.colors.surfaceAlt
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
                        ? theme.colors.textPrimary
                        : theme.colors.textSecondary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                MY GLIMPSES
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listWrap}>
            {renderDonationList({
              requiresWallet: viewMode === 'my_glimpses',
              walletConnected: !!walletAddress,
              loading: activeLoading,
              error: activeError,
              rows: activeRows,
              navigation,
              theme,
              emptyText:
                viewMode === 'feed'
                  ? 'No donations yet. Be the first to give a glimpse.'
                  : 'No donations recorded for this wallet yet.',
              showDonorWallet: viewMode === 'feed',
              onConnect: () => connect().catch(() => {}),
              enhancedData,
              enhancedFetching,
            })}
          </View>
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
  enhancedData,
  enhancedFetching,
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
  enhancedData?: Map<string, EnhancedDonation>;
  enhancedFetching: boolean;
}) {
  if (requiresWallet && !walletConnected) {
    return (
      <TouchableOpacity
        activeOpacity={0.84}
        onPress={() => onConnect?.()}
        style={[
          styles.stateCard,
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
        const enhanced = item.tx_signature
          ? enhancedData?.get(item.tx_signature)
          : undefined;

        const openThread = () => {
          if (item.conversation_id) {
            navigation.navigate('Messages', {
              conversationId: item.conversation_id,
            });
            return;
          }
          navigation.navigate('Messages');
        };

        return (
          <ProofCard
            key={item.id}
            amountUsdc={item.amount_usdc}
            recipientId={item.recipient_id ?? 'general'}
            createdAt={item.created_at}
            txSignature={item.tx_signature}
            donorWallet={showDonorWallet ? item.donor_wallet : undefined}
            status={item.status}
            enhanced={enhanced}
            enhancedLoading={enhancedFetching}
            action={
              showDonorWallet
                ? undefined
                : item.conversation_id
                ? {label: 'VIEW THREAD \u2192', onPress: openThread}
                : undefined
            }
            onPress={showDonorWallet ? undefined : openThread}
          />
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
    borderWidth: 1,
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 10,
  },
  toggle: {
    borderWidth: 1,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  togglePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  toggleText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  listWrap: {
    marginTop: 2,
  },
  historyWrap: {
    gap: 9,
  },
  stateCard: {
    minHeight: 94,
    borderRadius: 12,
    borderWidth: 1,
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
    marginTop: 10,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
});
