import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppState} from '../components/providers/AppStateProvider';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';

type ViewMode = 'table' | 'feed';

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

export default function CampaignsScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const {glimpses} = useAppState();
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const completedFeed = useMemo(() => {
    return glimpses
      .filter(glimpse => glimpse.status === 'Fulfilled')
      .map((glimpse, index) => ({
        id: `feed-${glimpse.id}`,
        wallet: FEED_WALLETS[index % FEED_WALLETS.length],
        amount: glimpse.raised,
        impact: FEED_IMPACT_NOTES[index % FEED_IMPACT_NOTES.length],
        glimpseLabel: glimpse.title,
        timestampLabel: index === 0 ? 'Just now' : 'Recently',
      }));
  }, [glimpses]);

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="My Glimpses" />
      <ScreenContainer>
        <SurfaceCard style={styles.panel}>
          <View style={styles.panelTop}>
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
                  viewMode === 'table' && {
                    backgroundColor: 'rgba(26,17,37,0.18)',
                  },
                ]}
                onPress={() => setViewMode('table')}
                activeOpacity={0.85}>
                <Text
                  style={[
                    styles.toggleText,
                    {
                      color:
                        viewMode === 'table'
                          ? theme.colors.textPrimary
                          : theme.colors.textSecondary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  Table
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  viewMode === 'feed' && {
                    backgroundColor: 'rgba(26,17,37,0.18)',
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
                  Feed
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View
            style={[styles.panelRule, {backgroundColor: 'rgba(26,17,37,0.12)'}]}
          />

          <Text
            style={[
              styles.sectionLabel,
              {
                color: theme.colors.textTertiary,
                fontFamily: theme.typography.brand,
              },
            ]}>
            {viewMode === 'table'
              ? 'RECENT ACTIVITY'
              : 'COMPLETED GLIMPSES FEED'}
          </Text>

          {viewMode === 'table' ? (
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
                const statusColor =
                  glimpse.visibility === 'Private'
                    ? theme.colors.textPrimary
                    : theme.colors.accent;
                const stageLabel =
                  glimpse.status === 'Fulfilled' ? 'Completed' : 'Processing';
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
                        style={[
                          styles.rowTitle,
                          {color: theme.colors.textPrimary},
                        ]}>
                        {glimpse.title}
                      </Text>
                      <View style={styles.rowMeta}>
                        <Text
                          style={[
                            styles.rowDate,
                            {
                              color: theme.colors.textSecondary,
                              fontFamily: theme.typography.brand,
                            },
                          ]}>
                          {glimpse.dateLabel}
                        </Text>
                        <Text
                          style={[
                            styles.rowDot,
                            {color: theme.colors.textTertiary},
                          ]}>
                          •
                        </Text>
                        <Text
                          style={[
                            styles.rowHash,
                            {
                              color: statusColor,
                              fontFamily: theme.typography.brand,
                            },
                          ]}>
                          {glimpse.id.toUpperCase()}
                        </Text>
                      </View>

                      <View style={styles.stageRow}>
                        <View
                          style={[
                            styles.stageDot,
                            {backgroundColor: stageColor},
                          ]}
                        />
                        <Text
                          style={[
                            styles.stageText,
                            {
                              color: stageColor,
                              fontFamily: theme.typography.brand,
                            },
                          ]}>
                          {stageLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.rowRight}>
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
                      <Text
                        style={[
                          styles.chevron,
                          {color: theme.colors.textTertiary},
                        ]}>
                        ›
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.feedWrap}>
              {completedFeed.length === 0 ? (
                <View
                  style={[
                    styles.feedEmpty,
                    {
                      backgroundColor: 'rgba(26,17,37,0.04)',
                      borderColor: 'rgba(26,17,37,0.1)',
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
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.84}
                    onPress={() => navigation.navigate('Messages')}
                    style={[
                      styles.feedCard,
                      {
                        backgroundColor: 'rgba(26,17,37,0.04)',
                        borderColor: 'rgba(26,17,37,0.12)',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.feedTitle,
                        {
                          color: theme.colors.textPrimary,
                          fontFamily: theme.typography.brand,
                        },
                      ]}>
                      {item.wallet} gave ${item.amount.toFixed(0)} USDC for{' '}
                      {item.impact}.
                    </Text>
                    <Text
                      style={[
                        styles.feedBody,
                        {color: theme.colors.textSecondary},
                      ]}>
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
                  </TouchableOpacity>
                ))
              )}
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
            {viewMode === 'table'
              ? 'New glimpse receipts appear here after funds lock.'
              : 'Feed only shows completed glimpses.'}
          </Text>
        </SurfaceCard>
      </ScreenContainer>
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
  panelTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  rowDate: {
    fontSize: 10,
    lineHeight: 12,
  },
  rowDot: {
    marginHorizontal: 5,
    fontSize: 10,
    lineHeight: 12,
  },
  rowHash: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '700',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  amount: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '700',
    minWidth: 58,
    textAlign: 'right',
  },
  chevron: {
    fontSize: 14,
    lineHeight: 15,
    fontWeight: '700',
  },
  note: {
    marginTop: 10,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.2,
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
  feedTitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
    fontWeight: '700',
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
});
