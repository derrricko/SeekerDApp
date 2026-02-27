import React, {useMemo, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useAppState} from '../components/providers/AppStateProvider';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import PrimaryButton from '../ui/PrimaryButton';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';

export default function VaultScreen() {
  const navigation = useNavigation<any>();
  const {theme} = useTheme();
  const {currentUser, runningTally} = useAppState();
  const [showDetails, setShowDetails] = useState(false);

  const estimatedWeight = useMemo(() => {
    if (currentUser.totalDonated <= 0) {
      return 1;
    }
    return Number(
      (currentUser.campaignScore / currentUser.totalDonated).toFixed(2),
    );
  }, [currentUser.campaignScore, currentUser.totalDonated]);

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Vault" />
      <ScreenContainer>
        <SurfaceCard style={{marginBottom: theme.spacing.lg}}>
          <Text
            style={[
              styles.eyebrow,
              {
                color: theme.colors.textTertiary,
                fontFamily: theme.typography.brand,
              },
            ]}>
            CONTRIBUTION VAULT
          </Text>
          <Text style={[styles.heading, {color: theme.colors.textPrimary}]}>
            Your impact weight
          </Text>
          <Text style={[styles.body, {color: theme.colors.textSecondary}]}>
            Donations are weighted by consistency. Daily streaks build more
            impact than isolated gifts.
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricBlock}>
              <Text
                style={[
                  styles.metricLabel,
                  {color: theme.colors.textTertiary},
                ]}>
                Your total
              </Text>
              <Text style={[styles.metricValue, {color: theme.colors.accent}]}>
                {currentUser.totalDonated.toFixed(2)} SOL
              </Text>
            </View>
            <View style={styles.metricBlock}>
              <Text
                style={[
                  styles.metricLabel,
                  {color: theme.colors.textTertiary},
                ]}>
                Weight factor
              </Text>
              <Text
                style={[styles.metricValue, {color: theme.colors.textPrimary}]}>
                x{estimatedWeight}
              </Text>
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricBlock}>
              <Text
                style={[
                  styles.metricLabel,
                  {color: theme.colors.textTertiary},
                ]}>
                Streak
              </Text>
              <Text
                style={[styles.metricValue, {color: theme.colors.textPrimary}]}>
                {currentUser.streakDays} days
              </Text>
            </View>
            <View style={styles.metricBlock}>
              <Text
                style={[
                  styles.metricLabel,
                  {color: theme.colors.textTertiary},
                ]}>
                Campaign tally
              </Text>
              <Text
                style={[styles.metricValue, {color: theme.colors.textPrimary}]}>
                ${runningTally.toLocaleString()}
              </Text>
            </View>
          </View>

          <PrimaryButton
            label={showDetails ? 'Hide Vault Details' : 'View Vault'}
            onPress={() => setShowDetails(prev => !prev)}
            style={{marginTop: theme.spacing.sm}}
          />
        </SurfaceCard>

        {showDetails && (
          <SurfaceCard>
            <Text
              style={[
                styles.eyebrow,
                {
                  color: theme.colors.textTertiary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              HOW WEIGHTING WORKS
            </Text>
            <Text
              style={[styles.detailTitle, {color: theme.colors.textPrimary}]}>
              One-time donation
            </Text>
            <Text
              style={[styles.detailBody, {color: theme.colors.textSecondary}]}>
              Immediate contribution with base weighting.
            </Text>

            <Text
              style={[styles.detailTitle, {color: theme.colors.textPrimary}]}>
              Daily donation
            </Text>
            <Text
              style={[styles.detailBody, {color: theme.colors.textSecondary}]}>
              Daily commitments receive a consistency multiplier and increase
              streak progress.
            </Text>

            <Text
              style={[styles.detailTitle, {color: theme.colors.textPrimary}]}>
              Streak effect
            </Text>
            <Text
              style={[styles.detailBody, {color: theme.colors.textSecondary}]}>
              Longer uninterrupted streaks add extra weighting to each
              contribution.
            </Text>

            <Text style={[styles.formula, {color: theme.colors.accent}]}>
              Weighted points = amount x cadence multiplier x streak multiplier
            </Text>

            <PrimaryButton
              label="Give From Campaign"
              variant="secondary"
              onPress={() => navigation.navigate('Campaigns')}
              style={{marginTop: theme.spacing.sm}}
            />
          </SurfaceCard>
        )}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  heading: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricBlock: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  detailBody: {
    fontSize: 16,
    lineHeight: 23,
  },
  formula: {
    marginTop: 14,
    fontSize: 15,
    fontWeight: '600',
  },
});
