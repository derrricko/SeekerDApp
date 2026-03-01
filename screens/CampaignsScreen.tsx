import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppState} from '../components/providers/AppStateProvider';
import {useWallet} from '../components/providers/WalletProvider';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';
import {getRecipientLabel, type HoldStatus} from '../data/donationConfig';
import {fetchDonationHistory, type DonationHistoryItem} from '../services/chat';

type ViewMode = 'feed' | 'my_glimpses';

const HOLD_STATUS_LABELS: Record<HoldStatus, string> = {
  pending: 'PENDING',
  locked: 'LOCKED',
  released: 'RELEASED',
};

export default function CampaignsScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const {glimpses} = useAppState();
  const {publicKey} = useWallet();
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [donationHistory, setDonationHistory] = useState<DonationHistoryItem[]>(
    [],
  );
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const lastFetchedAt = useRef(0);

  const walletAddress = publicKey?.toBase58() ?? null;

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

    // Skip re-fetch if data was loaded within the last 30 seconds
    const STALE_MS = 30_000;
    if (
      donationHistory.length > 0 &&
      Date.now() - lastFetchedAt.current < STALE_MS
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
          lastFetchedAt.current = Date.now();
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
                borderColor: 'rgba(26,17,37,0.1)',
                backgroundColor: 'rgba(26,17,37,0.06)',
              },
            ]}>
            <TouchableOpacity
              style={[
                styles.togglePill,
                viewMode === 'feed' && styles.togglePillActive,
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
                viewMode === 'my_glimpses' && styles.togglePillActive,
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

          <View
            style={[styles.panelRule, {backgroundColor: 'rgba(26,17,37,0.12)'}]}
          />

          {viewMode === 'feed'
            ? renderFeed({
                glimpses,
                navigation,
                theme,
              })
            : renderDonationHistory({
                walletAddress,
                loading: historyLoading,
                error: historyError,
                rows: donationHistory,
                navigation,
                theme,
              })}
        </SurfaceCard>
      </ScreenContainer>
    </View>
  );
}

function renderFeed({
  glimpses,
  navigation,
  theme,
}: {
  glimpses: ReturnType<typeof useAppState>['glimpses'];
  navigation: any;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <>
      <Text
        style={[
          styles.sectionLabel,
          {
            color: theme.colors.textTertiary,
            fontFamily: theme.typography.brand,
          },
        ]}>
        CAMPAIGN FEED
      </Text>

      <View
        style={[
          styles.activityList,
          {
            backgroundColor: 'rgba(26,17,37,0.04)',
            borderColor: 'rgba(26,17,37,0.08)',
          },
        ]}>
        {glimpses.map((glimpse, index) => {
          const isLast = index === glimpses.length - 1;
          const stageLabel =
            glimpse.status === 'Fulfilled' ? 'COMPLETED' : 'PROCESSING';
          const stageColor =
            glimpse.status === 'Fulfilled'
              ? theme.colors.success
              : theme.colors.accent;

          return (
            <TouchableOpacity
              key={glimpse.id}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('Messages')}
              style={[
                styles.activityRow,
                !isLast && {
                  borderBottomWidth: 1,
                  borderBottomColor: 'rgba(26,17,37,0.1)',
                },
              ]}>
              <View
                style={[
                  styles.avatar,
                  {
                    backgroundColor:
                      glimpse.visibility === 'Private'
                        ? 'rgba(26,17,37,0.2)'
                        : 'rgba(101,84,209,0.28)',
                    borderColor:
                      glimpse.visibility === 'Private'
                        ? 'rgba(26,17,37,0.25)'
                        : 'rgba(101,84,209,0.4)',
                  },
                ]}>
                <Text
                  style={[
                    styles.avatarText,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {glimpse.title.slice(0, 2).toUpperCase()}
                </Text>
              </View>

              <View style={styles.rowBody}>
                <Text
                  style={[styles.rowTitle, {color: theme.colors.textPrimary}]}>
                  {glimpse.title}
                </Text>
                <Text
                  style={[
                    styles.rowMeta,
                    {
                      color: theme.colors.textSecondary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {glimpse.dateLabel} - {glimpse.id.toUpperCase()}
                </Text>

                <View style={styles.stageRow}>
                  <View
                    style={[styles.stageDot, {backgroundColor: stageColor}]}
                  />
                  <Text
                    style={[
                      styles.stageText,
                      {color: stageColor, fontFamily: theme.typography.brand},
                    ]}>
                    {stageLabel}
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.amount,
                  {
                    color:
                      glimpse.visibility === 'Private'
                        ? theme.colors.textPrimary
                        : theme.colors.accent,
                  },
                ]}>
                ${glimpse.raised.toFixed(2)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text
        style={[
          styles.note,
          {
            color: theme.colors.textTertiary,
            fontFamily: theme.typography.brand,
          },
        ]}>
        Feed shows active and completed campaigns.
      </Text>
    </>
  );
}

function renderDonationHistory({
  walletAddress,
  loading,
  error,
  rows,
  navigation,
  theme,
}: {
  walletAddress: string | null;
  loading: boolean;
  error: string | null;
  rows: DonationHistoryItem[];
  navigation: any;
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  return (
    <>
      <Text
        style={[
          styles.sectionLabel,
          {
            color: theme.colors.textTertiary,
            fontFamily: theme.typography.brand,
          },
        ]}>
        ON-CHAIN DONATION HISTORY
      </Text>

      {!walletAddress ? (
        <View style={[styles.stateCard, styles.centeredState]}>
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
        </View>
      ) : loading ? (
        <View style={[styles.stateCard, styles.centeredState]}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
        </View>
      ) : error ? (
        <View style={[styles.stateCard, styles.centeredState]}>
          <Text style={[styles.stateText, {color: theme.colors.danger}]}>
            {error}
          </Text>
        </View>
      ) : rows.length === 0 ? (
        <View style={[styles.stateCard, styles.centeredState]}>
          <Text style={[styles.stateText, {color: theme.colors.textSecondary}]}>
            No donations recorded for this wallet yet.
          </Text>
        </View>
      ) : (
        <View style={styles.historyWrap}>
          {rows.map(item => {
            const recipient = getRecipientLabel(item.recipient_id);
            const holdStatus = item.hold_status as HoldStatus;
            const statusLabel =
              HOLD_STATUS_LABELS[holdStatus] ?? item.hold_status.toUpperCase();
            const statusColor =
              holdStatus === 'released'
                ? theme.colors.success
                : holdStatus === 'locked'
                ? theme.colors.accent
                : theme.colors.textSecondary;
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
                    backgroundColor: 'rgba(26,17,37,0.04)',
                    borderColor: 'rgba(26,17,37,0.12)',
                  },
                ]}>
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
                <Text
                  style={[
                    styles.historyMeta,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {recipient} - {new Date(item.created_at).toLocaleDateString()}
                </Text>
                <Text
                  style={[
                    styles.historyMeta,
                    {color: theme.colors.textTertiary},
                  ]}>
                  Mode: {item.donation_mode} - Cadence: {item.cadence}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text
        style={[
          styles.note,
          {
            color: theme.colors.textTertiary,
            fontFamily: theme.typography.brand,
          },
        ]}>
        My Glimpses uses live donation rows from Supabase.
      </Text>
    </>
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
    borderWidth: 1,
    borderRadius: 9,
    paddingVertical: 3,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  togglePill: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  togglePillActive: {
    backgroundColor: 'rgba(26,17,37,0.18)',
  },
  toggleText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
  },
  panelRule: {
    height: 1,
    marginTop: 12,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 1,
    marginBottom: 10,
  },
  activityList: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  rowBody: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 20,
    lineHeight: 23,
    fontWeight: '600',
    marginBottom: 4,
  },
  rowMeta: {
    fontSize: 10,
    lineHeight: 12,
  },
  stageRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 5,
  },
  stageText: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amount: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    minWidth: 58,
    textAlign: 'right',
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
    borderColor: 'rgba(26,17,37,0.12)',
    backgroundColor: 'rgba(26,17,37,0.04)',
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
  note: {
    marginTop: 10,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
});
