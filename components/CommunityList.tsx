import React from 'react';
import {View, Text, StyleSheet, Platform} from 'react-native';
import {useTheme, Typography} from './theme';
import {StreakEmber} from './StreakCard';
import {formatUSDC} from '../data/mockData';
import type {CommunityEntry, Circle} from '../data/mockData';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

// 8 warm initials colors that cycle
const INITIALS_HUES = [
  '#B8663C', // terracotta
  '#355C5A', // teal
  '#B89B5E', // gold
  '#7B5EA7', // plum
  '#5A8B6E', // sage
  '#C47A5A', // copper
  '#6B8DB5', // slate blue
  '#A67B5B', // warm brown
];

interface CommunityListProps {
  community: CommunityEntry[];
  circle: Circle | null;
  collectiveTotal: number;
  totalGivers: number;
  currentUserName?: string;
}

export default function CommunityList({
  community,
  circle,
  collectiveTotal,
  totalGivers,
  currentUserName = 'Derrick W.',
}: CommunityListProps) {
  const {colors} = useTheme();

  const circleMembers = circle
    ? community.filter(e => e.circleId === circle.id)
    : [];

  return (
    <View>
      {/* ─── Collective Hero Number (full-bleed, no card) ────────── */}
      <View style={communityStyles.heroZone}>
        <View
          style={[
            communityStyles.heroGradient,
            {backgroundColor: colors.secondaryLight},
          ]}
        />
        <Text style={[communityStyles.heroAmount, {color: colors.secondary}]}>
          {formatUSDC(collectiveTotal)} given together
        </Text>
        <Text style={[communityStyles.heroSub, {color: colors.textSecondary}]}>
          by {totalGivers} givers this month
        </Text>
      </View>

      {/* ─── My Circle ───────────────────────────────────────────── */}
      {circle && circleMembers.length > 0 && (
        <View style={communityStyles.sectionWrap}>
          <View style={communityStyles.sectionHeader}>
            <Text
              style={[
                communityStyles.sectionTitle,
                {color: colors.secondary},
              ]}>
              {circle.name}
            </Text>
            <View
              style={[
                communityStyles.memberBadge,
                {backgroundColor: colors.secondaryLight},
              ]}>
              <Text
                style={[
                  communityStyles.memberBadgeText,
                  {color: colors.secondary},
                ]}>
                {circle.members.length} members
              </Text>
            </View>
          </View>

          {circleMembers.map((entry, index) => (
            <MemberRow
              key={entry.displayName}
              entry={entry}
              index={index}
              isCurrentUser={entry.displayName === currentUserName}
              highlightColor={colors.primaryLight}
            />
          ))}
        </View>
      )}

      {/* ─── Everyone ────────────────────────────────────────────── */}
      <View style={communityStyles.sectionWrap}>
        <Text
          style={[
            communityStyles.sectionTitle,
            communityStyles.everyoneTitle,
            {color: colors.secondary},
          ]}>
          Everyone
        </Text>

        {community.slice(0, 10).map((entry, index) => (
          <MemberRow
            key={entry.displayName}
            entry={entry}
            index={index}
            isCurrentUser={entry.displayName === currentUserName}
            highlightColor={colors.primaryLight}
          />
        ))}
      </View>
    </View>
  );
}

function MemberRow({
  entry,
  index,
  isCurrentUser,
  highlightColor,
}: {
  entry: CommunityEntry;
  index: number;
  isCurrentUser: boolean;
  highlightColor: string;
}) {
  const {colors} = useTheme();
  const initialsColor = INITIALS_HUES[index % INITIALS_HUES.length];

  return (
    <View
      style={[
        communityStyles.memberRow,
        isCurrentUser && {
          backgroundColor: highlightColor,
          borderRadius: 12,
          marginHorizontal: -8,
          paddingHorizontal: 8,
        },
      ]}>
      {/* Initials circle */}
      <View
        style={[
          communityStyles.initialsCircle,
          {backgroundColor: initialsColor},
        ]}>
        <Text style={communityStyles.initialsText}>{entry.initials}</Text>
      </View>

      {/* Info */}
      <View style={communityStyles.memberInfo}>
        <Text style={[communityStyles.memberName, {color: colors.textPrimary}]}>
          {entry.displayName}
        </Text>
        <Text
          style={[
            communityStyles.memberImpact,
            {color: colors.textSecondary},
          ]}
          numberOfLines={1}>
          {entry.impactDescription}
        </Text>
      </View>

      {/* Streak ember + number */}
      <View style={communityStyles.streakWrap}>
        <StreakEmber size={10} streak={entry.currentStreak} />
        <Text
          style={[communityStyles.streakNum, {color: colors.textTertiary}]}>
          {entry.currentStreak}
        </Text>
      </View>
    </View>
  );
}

const communityStyles = StyleSheet.create({
  // Hero zone
  heroZone: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    marginBottom: 8,
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
  heroSub: {
    ...Typography.bodySmall,
  },

  // Sections
  sectionWrap: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.label,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  everyoneTitle: {
    marginBottom: 16,
  },
  memberBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },

  // Member row
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  initialsCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  memberInfo: {
    flex: 1,
    marginRight: 12,
  },
  memberName: {
    ...Typography.label,
    marginBottom: 1,
  },
  memberImpact: {
    ...Typography.caption,
  },
  streakWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakNum: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
