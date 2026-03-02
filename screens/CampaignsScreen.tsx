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

const FEED_WALLETS = [
  '7aK9...mP3d',
  'F2r4...vQ9x',
  'D9n8...uT6w',
  'Q1b5...kR2z',
];
const FEED_IMPACT_NOTES = [
  '4 diaper packs for a foster family placement',
  'a brake pad and labor payment for a single mom',
  'two after-school program fee blocks',
  'three classroom supply kits for public teachers',
];

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
                borderColor: theme.colors.borderMuted,
                backgroundColor: theme.colors.surfaceMuted,
              },
            ]}>
            <TouchableOpacity
              style={[
                styles.togglePill,
                viewMode === 'feed' && {
                  backgroundColor: theme.colors.borderMuted,
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
                viewMode === 'my_glimpses' && {
                  backgroundColor: theme.colors.borderMuted,
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

          <View
            style={[
              styles.panelRule,
              {backgroundColor: theme.colors.borderMuted},
            ]}
          />

          {viewMode === 'feed'
            ? renderFeed({
                glimpses,
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
  theme,
}: {
  glimpses: ReturnType<typeof useAppState>['glimpses'];
  theme: ReturnType<typeof useTheme>['theme'];
}) {
  const completedFeed = glimpses
    .filter(glimpse => glimpse.status === 'Fulfilled')
    .map((glimpse, index) => ({
      id: `feed-${glimpse.id}`,
      wallet: FEED_WALLETS[index % FEED_WALLETS.length],
      amount: glimpse.raised,
      impact: FEED_IMPACT_NOTES[index % FEED_IMPACT_NOTES.length],
      glimpseLabel: glimpse.title,
      timestampLabel: index === 0 ? 'Just now' : 'Recently',
    }));

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
        COMPLETED GLIMPSES FEED
      </Text>

      <View style={styles.feedWrap}>
        {completedFeed.length === 0 ? (
          <View
            style={[
              styles.feedEmpty,
              {
                backgroundColor: theme.colors.surfaceMuted,
                borderColor: theme.colors.borderMuted,
              },
            ]}>
            <Text
              style={[
                styles.feedEmptyText,
                {
                  color: theme.colors.textSecondary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              No completed glimpses yet.
            </Text>
          </View>
        ) : (
          completedFeed.map(item => (
            <View
              key={item.id}
              style={[
                styles.feedCard,
                {
                  backgroundColor: theme.colors.surfaceMuted,
                  borderColor: theme.colors.borderMuted,
                },
              ]}>
              <Text
                style={[
                  styles.feedAmount,
                  {
                    color: theme.colors.textPrimary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                ${item.amount.toFixed(0)} USDC
              </Text>
              <Text
                style={[styles.feedBody, {color: theme.colors.textSecondary}]}>
                {item.wallet} gave for {item.impact}.
              </Text>
              <Text
                style={[styles.feedBody, {color: theme.colors.textSecondary}]}>
                Applied to {item.glimpseLabel}.
              </Text>
              <View style={styles.feedMetaRow}>
                <View
                  style={[
                    styles.feedCompleteDot,
                    {backgroundColor: theme.colors.success},
                  ]}
                />
                <Text
                  style={[
                    styles.feedMetaText,
                    {
                      color: theme.colors.success,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  COMPLETED
                </Text>
                <Text
                  style={[
                    styles.feedMetaDivider,
                    {color: theme.colors.textTertiary},
                  ]}>
                  •
                </Text>
                <Text
                  style={[
                    styles.feedMetaText,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {item.timestampLabel}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
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
        <View
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
        </View>
      ) : loading ? (
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
      ) : error ? (
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
      ) : rows.length === 0 ? (
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
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.borderMuted,
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
              </TouchableOpacity>
            );
          })}
        </View>
      )}
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
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1,
    marginBottom: 14,
  },
  feedWrap: {
    gap: 8,
  },
  feedEmpty: {
    borderWidth: 1,
    borderRadius: 10,
    minHeight: 90,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  feedEmptyText: {
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  feedCard: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  feedAmount: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  feedBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  feedMetaRow: {
    marginTop: 7,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedCompleteDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    marginRight: 5,
  },
  feedMetaText: {
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  feedMetaDivider: {
    marginHorizontal: 5,
    fontSize: 9,
    lineHeight: 12,
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
  historyThreadLink: {
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontWeight: '700',
    marginTop: 6,
  },
});
