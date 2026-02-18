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
import {useTheme, Typography} from '../components/theme';
import CommunityList from '../components/CommunityList';
import {useEntrance, ENTRANCE_STAGGER} from '../utils/animations';
import {triggerHaptic} from '../utils/haptics';
import {
  MOCK_COMMUNITY,
  MOCK_CIRCLE,
  MOCK_COLLECTIVE_TOTAL,
} from '../data/mockData';

const DISPLAY_FONT = Platform.OS === 'ios' ? 'Georgia' : 'serif';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const [hasCircle, setHasCircle] = useState(true); // Toggle for demo

  const headerEntrance = useEntrance(0);
  const contentEntrance = useEntrance(ENTRANCE_STAGGER * 1);
  const ctaEntrance = useEntrance(ENTRANCE_STAGGER * 2);

  const totalGivers = MOCK_COMMUNITY.length;

  return (
    <View style={[commStyles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          commStyles.header,
          {
            paddingTop: insets.top + 12,
            borderBottomColor: colors.glassBorder,
          },
        ]}>
        <Animated.View
          style={{
            opacity: headerEntrance.opacity,
            transform: [{translateY: headerEntrance.translateY}],
          }}>
          <Text
            style={[commStyles.headerTitle, {color: colors.secondary}]}>
            Community
          </Text>
        </Animated.View>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={[
          commStyles.scrollContent,
          {paddingBottom: 100 + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}>
        {hasCircle ? (
          /* ─── Full community view ────────────────────────────── */
          <Animated.View
            style={{
              opacity: contentEntrance.opacity,
              transform: [{translateY: contentEntrance.translateY}],
            }}>
            <CommunityList
              community={MOCK_COMMUNITY}
              circle={MOCK_CIRCLE}
              collectiveTotal={MOCK_COLLECTIVE_TOTAL}
              totalGivers={totalGivers}
            />
          </Animated.View>
        ) : (
          /* ─── Empty state — no circle yet ────────────────────── */
          <Animated.View
            style={[
              commStyles.emptyState,
              {
                opacity: contentEntrance.opacity,
                transform: [{translateY: contentEntrance.translateY}],
              },
            ]}>
            <Text
              style={[commStyles.emptyHeadline, {color: colors.textPrimary}]}>
              Giving is better together.
            </Text>
            <Text
              style={[commStyles.emptyBody, {color: colors.textSecondary}]}>
              Create a circle with friends,{'\n'}family, or your team.
            </Text>
          </Animated.View>
        )}

        {/* ─── Circle CTA buttons ────────────────────────────────── */}
        <Animated.View
          style={[
            commStyles.ctaSection,
            {
              opacity: ctaEntrance.opacity,
              transform: [{translateY: ctaEntrance.translateY}],
            },
          ]}>
          {!hasCircle ? (
            <View style={commStyles.ctaRow}>
              <TouchableOpacity
                style={[
                  commStyles.primaryCta,
                  {backgroundColor: colors.secondary, shadowColor: colors.shadow},
                ]}
                onPress={() => {
                  triggerHaptic('notificationSuccess');
                  setHasCircle(true);
                }}
                activeOpacity={0.8}>
                <Text
                  style={[
                    commStyles.primaryCtaText,
                    {color: colors.textOnPrimary},
                  ]}>
                  Create a Circle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  commStyles.outlineCta,
                  {borderColor: colors.secondary},
                ]}
                onPress={() => {
                  triggerHaptic('notificationSuccess');
                  setHasCircle(true);
                }}
                activeOpacity={0.8}>
                <Text
                  style={[
                    commStyles.outlineCtaText,
                    {color: colors.secondary},
                  ]}>
                  Join a Circle
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={commStyles.ctaRow}>
              <TouchableOpacity
                style={[
                  commStyles.outlineCta,
                  {borderColor: colors.secondary, flex: 1},
                ]}
                onPress={() => triggerHaptic('impactLight')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    commStyles.outlineCtaText,
                    {color: colors.secondary},
                  ]}>
                  Create a Circle
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  commStyles.outlineCta,
                  {borderColor: colors.secondary, flex: 1},
                ]}
                onPress={() => triggerHaptic('impactLight')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    commStyles.outlineCtaText,
                    {color: colors.secondary},
                  ]}>
                  Join a Circle
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const commStyles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '200',
    letterSpacing: 1,
    lineHeight: 40,
  },
  scrollContent: {
    paddingTop: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyHeadline: {
    fontSize: 28,
    fontWeight: '200',
    fontFamily: DISPLAY_FONT,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  emptyBody: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 26,
  },

  // CTAs
  ctaSection: {
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 32,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryCta: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryCtaText: {
    ...Typography.buttonLarge,
  },
  outlineCta: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  outlineCtaText: {
    ...Typography.buttonSmall,
    fontWeight: '600',
  },
});
