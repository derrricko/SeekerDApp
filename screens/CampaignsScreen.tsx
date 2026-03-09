import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useWallet} from '../components/providers/WalletProvider';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import NeedCard from '../ui/NeedCard';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';
import {
  getRecipientLabel,
  DONATION_STATUS_LABELS,
} from '../config/donationConfig';
import {getExplorerUrl} from '../utils/explorer';
import {
  fetchDonationHistory,
  fetchAllDonations,
  type DonationHistoryItem,
} from '../services/chat';
import {
  fetchEnhancedTransactions,
  type EnhancedDonation,
} from '../services/helius';
import {
  fetchClassroomNeeds,
  groupNeedsBySection,
  type ClassroomNeed,
} from '../services/classroomNeeds';
import type {GiveNeedParams} from '../navigation/AppNavigator';

type ViewMode = 'needs' | 'feed' | 'my_glimpses';

const STALE_MS = 30_000;

export default function CampaignsScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const {publicKey, connect} = useWallet();
  const [viewMode, setViewMode] = useState<ViewMode>('needs');

  // Needs state
  const [needs, setNeeds] = useState<ClassroomNeed[]>([]);
  const [needsLoading, setNeedsLoading] = useState(false);
  const [needsError, setNeedsError] = useState<string | null>(null);
  const [needsImpactCount, setNeedsImpactCount] = useState<number | null>(null);
  const lastNeedsImpactFetchAtByWallet = useRef<Record<string, number>>({});

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
  const lastHistoryFetchAtByWallet = useRef<Record<string, number>>({});
  const previousWalletRef = useRef<string | null>(null);

  // Enhanced on-chain verification data (Helius)
  const [enhancedData, setEnhancedData] = useState<
    Map<string, EnhancedDonation>
  >(new Map());

  const walletAddress = publicKey?.toBase58() ?? null;

  // Bump on screen focus to refetch needs (funded needs should disappear from OPEN)
  const [needsFocusKey, setNeedsFocusKey] = useState(0);
  useFocusEffect(
    useCallback(() => {
      setNeedsFocusKey(k => k + 1);
    }, []),
  );

  // Needs tab — classroom needs
  useEffect(() => {
    if (viewMode !== 'needs') {
      return;
    }

    let cancelled = false;
    setNeedsLoading(true);
    setNeedsError(null);

    fetchClassroomNeeds()
      .then(rows => {
        if (!cancelled) {
          setNeeds(rows);
          setNeedsLoading(false);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setNeedsError(
            err instanceof Error
              ? err.message
              : 'Unable to load classroom needs right now.',
          );
          setNeedsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [viewMode, needsFocusKey]);

  useEffect(() => {
    if (viewMode !== 'needs') {
      return;
    }

    if (!walletAddress) {
      setNeedsImpactCount(0);
      return;
    }

    const lastFetchAt = lastNeedsImpactFetchAtByWallet.current[walletAddress] ?? 0;
    if (lastFetchAt > 0 && Date.now() - lastFetchAt < STALE_MS) {
      return;
    }

    let cancelled = false;

    fetchDonationHistory(walletAddress)
      .then(rows => {
        if (!cancelled) {
          const count = rows.filter(
            row => row.recipient_id === 'classroom-needs',
          ).length;
          setNeedsImpactCount(count);
          lastNeedsImpactFetchAtByWallet.current[walletAddress] = Date.now();
        }
      })
      .catch(() => {
        if (!cancelled) {
          setNeedsImpactCount(0);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [viewMode, walletAddress]);

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
  }, [viewMode]);

  // Fetch enhanced on-chain data for feed donations
  useEffect(() => {
    const signatures = feedDonations.map(d => d.tx_signature).filter(Boolean);

    if (signatures.length === 0) {
      return;
    }

    let cancelled = false;
    fetchEnhancedTransactions(signatures)
      .then(data => {
        if (!cancelled) {
          setEnhancedData(data);
        }
      })
      .catch(() => {
        // Non-fatal — feed works without enhanced data
      });

    return () => {
      cancelled = true;
    };
  }, [feedDonations]);

  useEffect(() => {
    if (walletAddress !== previousWalletRef.current) {
      previousWalletRef.current = walletAddress;
      setDonationHistory([]);
      setHistoryError(null);
      setHistoryLoading(false);
      setNeedsImpactCount(walletAddress ? null : 0);
    }
  }, [walletAddress]);

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

  const handleNeedPress = (need: ClassroomNeed) => {
    navigation.navigate('NeedDetail', {needId: need.id});
  };

  const groupedNeeds = groupNeedsBySection(needs);

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Glimpses" />
      <ScreenContainer>
        <SurfaceCard tone="hero" style={styles.panel}>
          <View
            style={[
              styles.toggle,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
              },
            ]}>
            {(['needs', 'feed', 'my_glimpses'] as ViewMode[]).map(mode => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.togglePill,
                  {
                    backgroundColor:
                      viewMode === mode ? theme.colors.accent : 'transparent',
                  },
                ]}
                onPress={() => setViewMode(mode)}
                activeOpacity={0.85}>
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color:
                        viewMode === mode
                          ? '#F3EFFF'
                          : theme.colors.textSecondary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {mode === 'needs'
                    ? 'NEEDS'
                    : mode === 'feed'
                      ? 'FEED'
                      : 'MY GLIMPSES'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View
            style={[
              styles.panelRule,
              {backgroundColor: theme.colors.borderMuted},
            ]}
          />

          {viewMode === 'needs'
            ? renderNeedsFeed({
                loading: needsLoading,
                error: needsError,
                grouped: groupedNeeds,
                theme,
                onNeedPress: handleNeedPress,
                impactCount: needsImpactCount ?? 0,
                onOpenMessages: () => navigation.navigate('Messages'),
              })
            : viewMode === 'feed'
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
                enhancedData,
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
                enhancedData,
              })}
        </SurfaceCard>
      </ScreenContainer>
    </View>
  );
}

function renderNeedsFeed({
  loading,
  error,
  grouped,
  theme,
  onNeedPress,
  impactCount,
  onOpenMessages,
}: {
  loading: boolean;
  error: string | null;
  grouped: ReturnType<typeof groupNeedsBySection>;
  theme: ReturnType<typeof useTheme>['theme'];
  onNeedPress: (need: ClassroomNeed) => void;
  impactCount: number;
  onOpenMessages: () => void;
}) {
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

  const totalNeeds =
    grouped.open.length + grouped.inMotion.length + grouped.delivered.length;
  const proofNeeds = [...grouped.delivered, ...grouped.inMotion].sort(
    (a, b) => getProofPriority(a.status) - getProofPriority(b.status),
  );

  if (totalNeeds === 0) {
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
          No classroom needs right now. Check back soon.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.needsFeed}>
      {impactCount > 0 && (
        <TouchableOpacity
          activeOpacity={0.84}
          onPress={onOpenMessages}
          style={[
            styles.impactCard,
            {
              backgroundColor: theme.colors.surfaceAlt,
              borderColor: theme.colors.borderMuted,
            },
          ]}>
          <View style={styles.impactTopRow}>
            <Text
              style={[
                styles.impactLabel,
                {color: theme.colors.accent, fontFamily: theme.typography.brand},
              ]}>
              YOUR IMPACT
            </Text>
            <View
              style={[
                styles.impactBadge,
                {
                  backgroundColor: theme.colors.accent + '14',
                  borderColor: theme.colors.accent + '40',
                },
              ]}>
              <Text
                style={[
                  styles.impactBadgeText,
                  {color: theme.colors.accent, fontFamily: theme.typography.brand},
                ]}>
                {impactCount} {impactCount === 1 ? 'NEED' : 'NEEDS'}
              </Text>
            </View>
          </View>
          <Text style={[styles.impactTitle, {color: theme.colors.textPrimary}]}>
            {impactCount === 1
              ? 'You already funded a classroom need.'
              : `You already funded ${impactCount} classroom needs.`}
          </Text>
          <Text
            style={[styles.impactBody, {color: theme.colors.textSecondary}]}>
            Open Messages to see proof, status updates, and delivery progress.
          </Text>
          <Text
            style={[
              styles.impactLink,
              {color: theme.colors.teal, fontFamily: theme.typography.brand},
            ]}>
            VIEW UPDATES {'\u2192'}
          </Text>
        </TouchableOpacity>
      )}

      {grouped.open.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text
            style={[
              styles.sectionHeader,
              {color: theme.colors.accent, fontFamily: theme.typography.brand},
            ]}>
            OPEN NEEDS
          </Text>
          <Text
            style={[styles.sectionIntro, {color: theme.colors.textSecondary}]}>
            Fund the exact item a teacher asked for.
          </Text>
          {grouped.open.map(need => (
            <View key={need.id} style={styles.needCardWrap}>
              <NeedCard need={need} onPress={onNeedPress} />
            </View>
          ))}
        </View>
      )}

      {proofNeeds.length > 0 && (
        <View style={styles.sectionBlock}>
          <Text
            style={[
              styles.sectionHeader,
              {color: theme.colors.teal, fontFamily: theme.typography.brand},
            ]}>
            PROOF
          </Text>
          <Text
            style={[styles.sectionIntro, {color: theme.colors.textSecondary}]}>
            See what funded classroom needs look like after Glimpse steps in.
          </Text>
          {proofNeeds.map(need => (
            <View key={need.id} style={styles.needCardWrap}>
              <NeedCard need={need} onPress={onNeedPress} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function getProofPriority(status: ClassroomNeed['status']) {
  switch (status) {
    case 'classroom_photo_added':
      return 0;
    case 'delivered':
      return 1;
    case 'purchased':
      return 2;
    case 'under_review':
      return 3;
    case 'funded':
      return 4;
    case 'failed':
      return 5;
    case 'open':
    default:
      return 6;
  }
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
        const enhanced = enhancedData?.get(item.tx_signature);
        const isVerified = enhanced?.verified === true;
        const cardContent = (
          <>
            <View style={styles.historyTopRow}>
              <Text
                style={[
                  styles.historyAmount,
                  {
                    color: theme.colors.textPrimary,
                  },
                ]}>
                ${item.amount_usdc.toFixed(2)} USDC
              </Text>
              <View style={styles.statusRow}>
                {isVerified && (
                  <View
                    style={[
                      styles.verifiedBadge,
                      {
                        backgroundColor: theme.colors.teal + '14',
                        borderColor: theme.colors.teal + '40',
                      },
                    ]}>
                    <View style={styles.verifiedShield}>
                      <View
                        style={[
                          styles.verifiedShieldBody,
                          {backgroundColor: theme.colors.teal},
                        ]}
                      />
                      <View
                        style={[
                          styles.verifiedShieldPoint,
                          {borderTopColor: theme.colors.teal},
                        ]}
                      />
                      <Text
                        style={[
                          styles.verifiedShieldLetter,
                          {
                            color: '#F3EFFF',
                            fontFamily: theme.typography.brand,
                          },
                        ]}>
                        G
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.verifiedText,
                        {
                          color: theme.colors.teal,
                          fontFamily: theme.typography.brand,
                        },
                      ]}>
                      VERIFIED ON-CHAIN
                    </Text>
                  </View>
                )}
                <Text
                  style={[
                    styles.historyStatus,
                    {color: statusColor, fontFamily: theme.typography.brand},
                  ]}>
                  {statusLabel}
                </Text>
              </View>
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
                {recipient} - {new Date(item.created_at).toLocaleDateString()}
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
                  accessibilityRole="link"
                  activeOpacity={0.7}
                  onPress={() =>
                    Linking.openURL(getExplorerUrl(item.tx_signature))
                  }>
                  <Text
                    style={[
                      styles.explorerLink,
                      {
                        color: theme.colors.accent,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    VIEW ON EXPLORER {'\u2197'}
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
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.borderMuted,
              },
            ]}>
            {cardContent}
            {item.tx_signature ? (
              <TouchableOpacity
                accessibilityRole="link"
                activeOpacity={0.7}
                onPress={e => {
                  e.stopPropagation();
                  Linking.openURL(getExplorerUrl(item.tx_signature));
                }}>
                <Text
                  style={[
                    styles.explorerLink,
                    {
                      color: theme.colors.accent,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  VIEW ON EXPLORER {'\u2197'}
                </Text>
              </TouchableOpacity>
            ) : null}
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
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  toggle: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  togglePill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
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
  needsFeed: {
    gap: 0,
  },
  impactCard: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  impactTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  impactLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '700',
  },
  impactBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  impactBadgeText: {
    fontSize: 9,
    letterSpacing: 0.7,
  },
  impactTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  impactBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  impactLink: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.9,
    marginTop: 12,
  },
  sectionBlock: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 4,
  },
  sectionIntro: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  needCardWrap: {
    marginBottom: 10,
  },
  historyWrap: {
    gap: 8,
  },
  historyCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
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
  explorerLink: {
    marginTop: 10,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  verifiedShield: {
    width: 13,
    height: 14,
    position: 'relative',
    alignItems: 'center',
  },
  verifiedShieldBody: {
    width: 11,
    height: 8,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  verifiedShieldPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 5.5,
    borderRightWidth: 5.5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  verifiedShieldLetter: {
    position: 'absolute',
    top: 0,
    fontSize: 6,
    lineHeight: 8,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  verifiedText: {
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 0.6,
    fontWeight: '700',
  },
});
