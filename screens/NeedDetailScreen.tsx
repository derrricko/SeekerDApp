import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import type {RouteProp} from '@react-navigation/native';
import type {RootTabParamList, GiveNeedParams} from '../navigation/AppNavigator';
import {fetchClassroomNeedById} from '../services/classroomNeeds';
import type {ClassroomNeed} from '../services/classroomNeeds';
import {NEED_STATUS_LABELS} from '../config/donationConfig';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import NeedArtwork from '../ui/NeedArtwork';
import PrimaryButton from '../ui/PrimaryButton';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';

export default function NeedDetailScreen() {
  const {theme} = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootTabParamList, 'NeedDetail'>>();
  const {needId} = route.params;

  const [need, setNeed] = useState<ClassroomNeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchClassroomNeedById(needId)
      .then(result => {
        if (!cancelled) {
          if (!result) {
            setError('This need could not be found.');
          }
          setNeed(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load this need right now.');
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [needId]);

  const handleFund = () => {
    if (!need || need.status !== 'open') {
      return;
    }

    const giveParams: GiveNeedParams = {
      mode: 'need',
      classroomNeedId: need.id,
      title: need.title,
      imageUrl: need.image_url,
      teacherFirstName: need.teacher_first_name,
      schoolName: need.school_name,
      schoolCity: need.school_city,
      schoolState: need.school_state,
      amountUSDC: need.price_usdc,
      status: need.status,
    };

    navigation.navigate('Give', giveParams);
  };

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Glimpses');
    }
  };

  const isOpen = need?.status === 'open';
  const statusLabel = need
    ? NEED_STATUS_LABELS[need.status] ?? need.status.toUpperCase()
    : '';
  const statusColor = isOpen
    ? theme.colors.accent
    : need?.status === 'delivered' || need?.status === 'classroom_photo_added'
      ? theme.colors.teal
      : theme.colors.accent;

  const location = need
    ? [need.school_city, need.school_state].filter(Boolean).join(', ')
    : '';
  const statusHeadline = need ? getNeedStatusHeadline(need.status) : '';
  const statusBody = need ? getNeedStatusBody(need.status) : '';

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Need Details" onBack={handleBack} />
      <ScreenContainer>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : error || !need ? (
          <SurfaceCard style={styles.errorCard}>
            <Text style={[styles.errorText, {color: theme.colors.danger}]}>
              {error || 'Need not found.'}
            </Text>
            <PrimaryButton
              label="Back"
              variant="secondary"
              onPress={handleBack}
              style={styles.backButton}
            />
          </SurfaceCard>
        ) : (
          <View>
            {need.image_url ? (
              <Image
                source={{uri: need.image_url}}
                style={[
                  styles.heroImage,
                  {
                    borderColor: theme.colors.borderMuted,
                    backgroundColor: theme.colors.surfaceAlt,
                  },
                ]}
                resizeMode="cover"
              />
            ) : (
              <NeedArtwork need={need} variant="hero" />
            )}

            <SurfaceCard tone="hero" style={styles.detailCard}>
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: statusColor + '14',
                      borderColor: statusColor + '40',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.statusText,
                      {color: statusColor, fontFamily: theme.typography.brand},
                    ]}>
                    {statusLabel}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.priceText,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  ${need.price_usdc.toFixed(2)} USDC
                </Text>
              </View>

              <Text style={[styles.title, {color: theme.colors.textPrimary}]}>
                {need.title}
              </Text>

              {need.description ? (
                <Text
                  style={[
                    styles.description,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {need.description}
                </Text>
              ) : null}

              <View
                style={[
                  styles.divider,
                  {backgroundColor: theme.colors.borderMuted},
                ]}
              />

              <Text
                style={[
                  styles.teacherLabel,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                TEACHER
              </Text>
              <Text
                style={[
                  styles.teacherName,
                  {color: theme.colors.textPrimary},
                ]}>
                {need.teacher_first_name}'s classroom
              </Text>

              <Text
                style={[
                  styles.schoolLabel,
                  {
                    color: theme.colors.textTertiary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                SCHOOL
              </Text>
              <Text
                style={[styles.schoolName, {color: theme.colors.textPrimary}]}>
                {need.school_name}
                {location ? ` \u00B7 ${location}` : ''}
              </Text>
            </SurfaceCard>

            {isOpen ? (
              <SurfaceCard style={styles.fundCard}>
                <Text
                  style={[
                    styles.fundKicker,
                    {
                      color: theme.colors.accent,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  100% OF YOUR DONATION FUNDS THIS ITEM
                </Text>
                <Text
                  style={[
                    styles.fundBody,
                    {color: theme.colors.textSecondary},
                  ]}>
                  Your ${need.price_usdc.toFixed(2)} USDC will be used to
                  purchase this exact item. Glimpse reviews the request, buys
                  the item, and shares delivery proof in your message thread.
                </Text>
                <PrimaryButton
                  label={`Fund This Need \u2014 $${need.price_usdc.toFixed(2)}`}
                  onPress={handleFund}
                  style={styles.fundButton}
                />
              </SurfaceCard>
            ) : (
              <SurfaceCard tone="muted" style={styles.fundedCard}>
                <Text
                  style={[
                    styles.fundedLabel,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  CURRENT STATUS
                </Text>
                <View
                  style={[
                    styles.fundedStatusRow,
                    {
                      backgroundColor: statusColor + '10',
                      borderColor: statusColor + '26',
                    },
                  ]}>
                  <View
                    style={[
                      styles.fundedDot,
                      {backgroundColor: statusColor},
                    ]}
                  />
                  <Text
                    style={[
                      styles.fundedStatusText,
                      {
                        color: statusColor,
                        fontFamily: theme.typography.brand,
                      },
                    ]}>
                    {statusLabel}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.fundedTitle,
                    {color: theme.colors.textPrimary},
                  ]}>
                  {statusHeadline}
                </Text>
                <Text
                  style={[
                    styles.fundedBody,
                    {color: theme.colors.textSecondary},
                  ]}>
                  {statusBody}
                </Text>
              </SurfaceCard>
            )}

            <PrimaryButton
              label="Back to Needs"
              variant="secondary"
              onPress={handleBack}
              style={styles.backButton}
              fullWidth={false}
            />
          </View>
        )}
      </ScreenContainer>
    </View>
  );
}

function getNeedStatusHeadline(status: ClassroomNeed['status']) {
  switch (status) {
    case 'funded':
      return 'This need is funded.';
    case 'under_review':
      return 'Glimpse is reviewing this request.';
    case 'purchased':
      return 'This item has been purchased.';
    case 'delivered':
      return 'This item has been delivered.';
    case 'classroom_photo_added':
      return 'The classroom update is in.';
    case 'failed':
      return 'This need is not currently available.';
    case 'open':
    default:
      return 'This need is available to fund.';
  }
}

function getNeedStatusBody(status: ClassroomNeed['status']) {
  switch (status) {
    case 'funded':
      return 'A donor already covered the full cost. Glimpse will review the request before purchasing the item.';
    case 'under_review':
      return 'The item is being checked before purchase so the donor can receive a clean proof trail.';
    case 'purchased':
      return 'The order has been placed and is on its way to the school. Funding is closed for this request.';
    case 'delivered':
      return 'The item reached the school. Any follow-up proof or classroom response will appear in the donor message thread.';
    case 'classroom_photo_added':
      return 'The item was delivered and a classroom update was added to close the loop for the donor.';
    case 'failed':
      return 'This request needs manual attention and is not open for funding right now.';
    case 'open':
    default:
      return 'A donor can fund this exact item right now.';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  detailCard: {
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  teacherLabel: {
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  schoolLabel: {
    fontSize: 10,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  fundCard: {
    marginBottom: 12,
  },
  fundKicker: {
    fontSize: 11,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  fundBody: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  fundButton: {
    marginTop: 0,
  },
  fundedCard: {
    marginBottom: 12,
  },
  fundedLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 10,
  },
  fundedStatusRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 12,
  },
  fundedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  fundedStatusText: {
    fontSize: 10,
    letterSpacing: 0.7,
  },
  fundedTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  fundedBody: {
    fontSize: 14,
    lineHeight: 21,
  },
  errorCard: {
    marginTop: 20,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 14,
  },
  backButton: {
    alignSelf: 'center',
    minWidth: 180,
    paddingHorizontal: 26,
    marginTop: 2,
    marginBottom: 20,
  },
});
