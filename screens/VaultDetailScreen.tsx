import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import {useTheme, Typography} from '../components/theme';
import GlassCard from '../components/GlassCard';
import DepositModal from '../components/DepositModal';
import {useEntrance, ENTRANCE_STAGGER} from '../utils/animations';
import {triggerHaptic} from '../utils/haptics';
import {
  formatUSDC,
  MOCK_VAULTS,
  MOCK_VAULT_HISTORY,
} from '../data/mockData';
import type {VaultStackParamList} from '../navigation/AppNavigator';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

type DetailRoute = RouteProp<VaultStackParamList, 'VaultDetail'>;

export default function VaultDetailScreen() {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const navigation = useNavigation();
  const route = useRoute<DetailRoute>();

  const vault = MOCK_VAULTS.find(v => v.id === route.params.vaultId);
  const [depositVisible, setDepositVisible] = useState(false);

  const headerEntrance = useEntrance(0);
  const descEntrance = useEntrance(ENTRANCE_STAGGER * 1);
  const timelineEntrance = useEntrance(ENTRANCE_STAGGER * 2);
  const statsEntrance = useEntrance(ENTRANCE_STAGGER * 3);
  const historyEntrance = useEntrance(ENTRANCE_STAGGER * 4);
  const ctaEntrance = useEntrance(ENTRANCE_STAGGER * 5);

  const accentColors = [colors.primary, colors.accent, colors.secondary];

  if (!vault) {
    return (
      <View style={[detailStyles.container, {backgroundColor: colors.background}]}>
        <Text style={{color: colors.textPrimary, padding: 24}}>Vault not found</Text>
      </View>
    );
  }

  const progress = vault.totalDeposited / vault.target;
  const remaining = vault.target - vault.totalDeposited;

  return (
    <View style={[detailStyles.container, {backgroundColor: colors.background}]}>
      {/* Header with back button */}
      <View
        style={[
          detailStyles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.glassBorder,
          },
        ]}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('impactLight');
            navigation.goBack();
          }}
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={[detailStyles.backArrow, {color: colors.accent}]}>
            {'\u2190'}
          </Text>
        </TouchableOpacity>
        <Text style={[detailStyles.headerLabel, {color: colors.textTertiary}]}>
          Vault
        </Text>
        <View style={{width: 28}} />
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={[
          detailStyles.scrollContent,
          {paddingBottom: 100 + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* ─── Vault Name ────────────────────────────────────────── */}
        <Animated.View
          style={[
            detailStyles.section,
            {
              opacity: headerEntrance.opacity,
              transform: [{translateY: headerEntrance.translateY}],
            },
          ]}>
          <Text style={[detailStyles.vaultName, {color: colors.textPrimary}]}>
            {vault.name}
          </Text>
        </Animated.View>

        {/* ─── Pull-quote Description ────────────────────────────── */}
        <Animated.View
          style={[
            detailStyles.section,
            {
              opacity: descEntrance.opacity,
              transform: [{translateY: descEntrance.translateY}],
            },
          ]}>
          <View style={detailStyles.pullQuote}>
            <View
              style={[
                detailStyles.pullQuoteBorder,
                {backgroundColor: colors.primary},
              ]}
            />
            <Text
              style={[detailStyles.pullQuoteText, {color: colors.textSecondary}]}>
              {vault.description}
            </Text>
          </View>
        </Animated.View>

        {/* ─── Recipient Timeline ────────────────────────────────── */}
        <Animated.View
          style={[
            detailStyles.section,
            {
              opacity: timelineEntrance.opacity,
              transform: [{translateY: timelineEntrance.translateY}],
            },
          ]}>
          <Text
            style={[detailStyles.sectionTitle, {color: colors.textSecondary}]}>
            Recipients
          </Text>
          <View style={detailStyles.timeline}>
            {vault.recipients.map((recipient, index) => {
              const dotColor = accentColors[index % accentColors.length];
              const isLast = index === vault.recipients.length - 1;
              return (
                <View key={recipient.name} style={detailStyles.timelineItem}>
                  {/* Dot + connecting line */}
                  <View style={detailStyles.timelineDotCol}>
                    <View
                      style={[
                        detailStyles.timelineDot,
                        {backgroundColor: dotColor},
                      ]}
                    />
                    {!isLast && (
                      <View
                        style={[
                          detailStyles.timelineLine,
                          {backgroundColor: colors.glassBorder},
                        ]}
                      />
                    )}
                  </View>
                  {/* Info */}
                  <View style={detailStyles.timelineContent}>
                    <View style={detailStyles.timelineRow}>
                      <Text
                        style={[
                          detailStyles.recipientName,
                          {color: colors.textPrimary},
                        ]}>
                        {recipient.name}
                      </Text>
                      <Text
                        style={[
                          detailStyles.recipientAlloc,
                          {color: dotColor},
                        ]}>
                        {recipient.allocationBps / 100}%
                      </Text>
                    </View>
                    <Text
                      style={[
                        detailStyles.recipientDist,
                        {color: colors.textTertiary},
                      ]}>
                      {formatUSDC(recipient.distributed)} distributed
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ─── Stats ─────────────────────────────────────────────── */}
        <Animated.View
          style={[
            detailStyles.section,
            {
              opacity: statsEntrance.opacity,
              transform: [{translateY: statsEntrance.translateY}],
            },
          ]}>
          <View style={detailStyles.statsRow}>
            <GlassCard variant="subtle" style={{flex: 1}}>
              <View style={detailStyles.statInner}>
                <Text
                  style={[detailStyles.statValue, {color: colors.accent}]}>
                  {formatUSDC(vault.totalDeposited)}
                </Text>
                <Text
                  style={[
                    detailStyles.statLabel,
                    {color: colors.textTertiary},
                  ]}>
                  deposited
                </Text>
              </View>
            </GlassCard>
            <GlassCard variant="subtle" style={{flex: 1}}>
              <View style={detailStyles.statInner}>
                <Text
                  style={[detailStyles.statValue, {color: colors.accent}]}>
                  {vault.depositorCount}
                </Text>
                <Text
                  style={[
                    detailStyles.statLabel,
                    {color: colors.textTertiary},
                  ]}>
                  givers
                </Text>
              </View>
            </GlassCard>
            <GlassCard variant="subtle" style={{flex: 1}}>
              <View style={detailStyles.statInner}>
                <Text
                  style={[detailStyles.statValue, {color: colors.accent}]}>
                  {Math.round(progress * 100)}%
                </Text>
                <Text
                  style={[
                    detailStyles.statLabel,
                    {color: colors.textTertiary},
                  ]}>
                  funded
                </Text>
              </View>
            </GlassCard>
          </View>
        </Animated.View>

        {/* ─── Recent History (naked text with accent bars) ───────── */}
        <Animated.View
          style={[
            detailStyles.section,
            {
              opacity: historyEntrance.opacity,
              transform: [{translateY: historyEntrance.translateY}],
            },
          ]}>
          <Text
            style={[detailStyles.sectionTitle, {color: colors.textSecondary}]}>
            Recent Activity
          </Text>
          {MOCK_VAULT_HISTORY.map(entry => (
            <View key={entry.id} style={detailStyles.feedItem}>
              <View
                style={[
                  detailStyles.feedAccent,
                  {
                    backgroundColor:
                      accentColors[entry.accentIndex % 3],
                  },
                ]}
              />
              <View style={detailStyles.feedContent}>
                <Text
                  style={[
                    detailStyles.feedText,
                    {color: colors.textPrimary},
                  ]}>
                  {entry.description}
                </Text>
                <Text
                  style={[
                    detailStyles.feedTime,
                    {color: colors.textTertiary},
                  ]}>
                  {entry.timeAgo}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* ─── Hero CTA ──────────────────────────────────────────── */}
        <Animated.View
          style={[
            detailStyles.section,
            {
              opacity: ctaEntrance.opacity,
              transform: [{translateY: ctaEntrance.translateY}],
            },
          ]}>
          <TouchableOpacity
            style={[
              detailStyles.heroCta,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.shadow,
              },
            ]}
            onPress={() => {
              triggerHaptic('impactMedium');
              setDepositVisible(true);
            }}
            activeOpacity={0.8}>
            <Text
              style={[
                detailStyles.heroCtaText,
                {color: colors.textOnPrimary},
              ]}>
              Fund the entire need — {formatUSDC(remaining)}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      <DepositModal
        visible={depositVisible}
        vault={vault}
        amount={remaining / 1_000_000}
        onClose={() => setDepositVisible(false)}
      />
    </View>
  );
}

const detailStyles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '300',
  },
  headerLabel: {
    ...Typography.label,
  },
  scrollContent: {
    paddingTop: 24,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  vaultName: {
    fontSize: 32,
    fontWeight: '200',
    letterSpacing: 0.5,
    lineHeight: 40,
    fontFamily: DISPLAY_FONT,
  },

  // Pull-quote
  pullQuote: {
    flexDirection: 'row',
  },
  pullQuoteBorder: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 16,
  },
  pullQuoteText: {
    flex: 1,
    fontSize: 17,
    fontStyle: 'italic',
    fontFamily: DISPLAY_FONT,
    lineHeight: 28,
  },

  // Timeline
  sectionTitle: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  timeline: {},
  timelineItem: {
    flexDirection: 'row',
    minHeight: 56,
  },
  timelineDotCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
    marginLeft: 8,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  recipientName: {
    ...Typography.body,
    fontWeight: '500',
  },
  recipientAlloc: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  recipientDist: {
    ...Typography.caption,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statInner: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '200',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.caption,
  },

  // Activity feed
  feedItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  feedAccent: {
    width: 3,
    borderRadius: 1.5,
    marginRight: 12,
  },
  feedContent: {
    flex: 1,
  },
  feedText: {
    ...Typography.body,
    marginBottom: 2,
  },
  feedTime: {
    ...Typography.caption,
  },

  // Hero CTA
  heroCta: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  heroCtaText: {
    ...Typography.buttonLarge,
  },
});
