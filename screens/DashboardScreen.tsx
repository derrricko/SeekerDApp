import React, {useCallback, useRef, useState} from 'react';
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
import {useTheme, Typography} from '../components/theme';
import GlassCard from '../components/GlassCard';
import AutoGiveCard from '../components/AutoGiveCard';
import CircleProgress from '../components/CircleProgress';
import {StreakEmber} from '../components/StreakCard';
import {SettingsGearIcon} from '../components/NavIcons';
import SettingsSheet from '../components/SettingsSheet';
import {
  useEntrance,
  ENTRANCE_STAGGER,
  EASE_OUT,
} from '../utils/animations';
import {triggerHaptic} from '../utils/haptics';
import {
  formatUSDC,
  MOCK_USER_STREAK,
  MOCK_AUTO_GIVE,
  MOCK_CIRCLE,
  MOCK_ACTIVITY,
  MOCK_COMMUNITY,
} from '../data/mockData';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [settingsVisible, setSettingsVisible] = useState(false);

  // Mutable state for chain reaction
  const [totalGiven, setTotalGiven] = useState(1_247_000_000); // $1,247
  const [currentStreak, setCurrentStreak] = useState(
    MOCK_USER_STREAK.currentStreak,
  );
  const [position, setPosition] = useState('#4 this week');

  // Counting animation for total given
  const countAnim = useRef(new Animated.Value(0)).current;

  // Entrance animations
  const heroEntrance = useEntrance(0);
  const metricsEntrance = useEntrance(ENTRANCE_STAGGER * 1);
  const autoGiveEntrance = useEntrance(ENTRANCE_STAGGER * 2);
  const circleEntrance = useEntrance(ENTRANCE_STAGGER * 3);
  const feedEntrance = useEntrance(ENTRANCE_STAGGER * 4);

  // Accent colors for activity feed
  const accentColors = [colors.primary, colors.accent, colors.secondary];

  // Find user in community for circle badge
  const userEntry = MOCK_COMMUNITY.find(e => e.displayName === 'Derrick W.');
  const circleName = MOCK_CIRCLE.name;

  const handleChainReaction = useCallback(
    (updates: {amountDelta: number; streakDelta: number; newPosition: string}) => {
      // Animate total given counter
      setTotalGiven(prev => prev + updates.amountDelta);
      setCurrentStreak(prev => prev + updates.streakDelta);

      // Position shifts with slight delay
      setTimeout(() => {
        setPosition(updates.newPosition);
        triggerHaptic('impactLight');
      }, 400);
    },
    [],
  );

  return (
    <View style={[dashStyles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          dashStyles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.glassBorder,
          },
        ]}>
        <Text style={[dashStyles.headerBrand, {color: colors.textPrimary}]}>
          Glimpse
        </Text>
        <TouchableOpacity
          style={dashStyles.gearButton}
          onPress={() => {
            triggerHaptic('impactLight');
            setSettingsVisible(true);
          }}
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <SettingsGearIcon color={colors.textTertiary} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={dashStyles.scroll}
        contentContainerStyle={[
          dashStyles.scrollContent,
          {paddingBottom: 100 + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* ─── Hero Stat Zone (full-bleed, no card) ──────────────── */}
        <Animated.View
          style={[
            dashStyles.heroZone,
            {
              opacity: heroEntrance.opacity,
              transform: [{translateY: heroEntrance.translateY}],
            },
          ]}>
          {/* Subtle atmosphere gradient */}
          <View
            style={[
              dashStyles.heroGradient,
              {backgroundColor: colors.primaryLight},
            ]}
          />
          <Text style={[dashStyles.heroAmount, {color: colors.primary}]}>
            {formatUSDC(totalGiven)} given
          </Text>
          <View style={dashStyles.heroSubRow}>
            <Text style={[dashStyles.heroSub, {color: colors.textSecondary}]}>
              {currentStreak}-day streak
            </Text>
            <View style={{marginHorizontal: 6, marginTop: 2}}>
              <StreakEmber size={12} streak={currentStreak} />
            </View>
            <Text style={[dashStyles.heroSub, {color: colors.textSecondary}]}>
              {' \u00B7 '}{circleName}
            </Text>
          </View>
          <Text style={[dashStyles.heroPosition, {color: colors.textTertiary}]}>
            {position}
          </Text>
        </Animated.View>

        {/* ─── Two-column metric row ─────────────────────────────── */}
        <Animated.View
          style={[
            dashStyles.metricsRow,
            {
              opacity: metricsEntrance.opacity,
              transform: [{translateY: metricsEntrance.translateY}],
            },
          ]}>
          <GlassCard variant="subtle" style={dashStyles.metricCard}>
            <View style={dashStyles.metricInner}>
              <Text
                style={[dashStyles.metricValue, {color: colors.textPrimary}]}>
                {MOCK_USER_STREAK.longestStreak}
              </Text>
              <Text
                style={[
                  dashStyles.metricLabel,
                  {color: colors.textTertiary},
                ]}>
                Longest Streak
              </Text>
            </View>
          </GlassCard>
          <GlassCard variant="subtle" style={dashStyles.metricCard}>
            <View style={dashStyles.metricInner}>
              <Text
                style={[dashStyles.metricValue, {color: colors.textPrimary}]}>
                {MOCK_USER_STREAK.totalGives}
              </Text>
              <Text
                style={[
                  dashStyles.metricLabel,
                  {color: colors.textTertiary},
                ]}>
                Total Gives
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* ─── Auto-Give Card ────────────────────────────────────── */}
        <Animated.View
          style={[
            dashStyles.section,
            {
              opacity: autoGiveEntrance.opacity,
              transform: [{translateY: autoGiveEntrance.translateY}],
            },
          ]}>
          <AutoGiveCard
            config={MOCK_AUTO_GIVE}
            onChainReaction={handleChainReaction}
          />
        </Animated.View>

        {/* ─── Circle Progress ───────────────────────────────────── */}
        <Animated.View
          style={[
            dashStyles.section,
            {
              opacity: circleEntrance.opacity,
              transform: [{translateY: circleEntrance.translateY}],
            },
          ]}>
          <CircleProgress circle={MOCK_CIRCLE} />
        </Animated.View>

        {/* ─── Recent Activity Feed (naked text, no card) ────────── */}
        <Animated.View
          style={[
            dashStyles.section,
            {
              opacity: feedEntrance.opacity,
              transform: [{translateY: feedEntrance.translateY}],
            },
          ]}>
          <Text
            style={[dashStyles.feedTitle, {color: colors.textSecondary}]}>
            Recent Activity
          </Text>
          {MOCK_ACTIVITY.map(entry => (
            <View key={entry.id} style={dashStyles.feedItem}>
              <View
                style={[
                  dashStyles.feedAccent,
                  {backgroundColor: accentColors[entry.accentIndex % 3]},
                ]}
              />
              <View style={dashStyles.feedContent}>
                <Text
                  style={[dashStyles.feedText, {color: colors.textPrimary}]}>
                  {entry.description}
                </Text>
                <Text
                  style={[dashStyles.feedTime, {color: colors.textTertiary}]}>
                  {entry.timeAgo}
                </Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </ScrollView>

      {/* Settings Bottom Sheet */}
      <SettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </View>
  );
}

const dashStyles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    ...Typography.brand,
  },
  gearButton: {
    position: 'absolute',
    right: 24,
    bottom: 12,
  },
  scroll: {flex: 1},
  scrollContent: {paddingTop: 24},

  // Hero zone
  heroZone: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginBottom: 12,
  },
  heroGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: '50%',
    bottom: 0,
    opacity: 0.06,
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '200',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroSub: {
    ...Typography.body,
  },
  heroPosition: {
    ...Typography.caption,
    marginTop: 4,
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
  },
  metricInner: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '200',
    fontFamily: DISPLAY_FONT,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  metricLabel: {
    ...Typography.caption,
  },

  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },

  // Activity feed
  feedTitle: {
    ...Typography.label,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  feedItem: {
    flexDirection: 'row',
    marginBottom: 16,
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
});
