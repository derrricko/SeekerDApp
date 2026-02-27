import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useAppState} from '../components/providers/AppStateProvider';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';

export default function CampaignsScreen() {
  const {theme} = useTheme();
  const {glimpses} = useAppState();

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Glimpses" />
      <ScreenContainer>
        {glimpses.map(glimpse => (
          <SurfaceCard key={glimpse.id} style={styles.card}>
            {/** Replit card tag bar */}
            <View style={styles.tagRow}>
              <View />
              <View
                style={[
                  styles.tag,
                  {
                    backgroundColor:
                      glimpse.visibility === 'Private'
                        ? theme.colors.textPrimary
                        : theme.colors.accent,
                    borderColor: theme.colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.tagText,
                    {
                      color: '#FFFFFF',
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {glimpse.tag}
                </Text>
              </View>
            </View>

            <Text style={[styles.title, {color: theme.colors.textPrimary}]}>
              {glimpse.title.toUpperCase()}
            </Text>

            <View style={styles.metaRow}>
              {glimpse.visibility === 'Public' ? (
                <Text
                  style={[
                    styles.metaBadge,
                    {
                      color: theme.colors.accent,
                      borderColor: theme.colors.accent,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  {glimpse.visibility.toUpperCase()}
                </Text>
              ) : (
                <Text
                  style={[
                    styles.privateMeta,
                    {
                      color: theme.colors.textPrimary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  ▢ PRIVATE
                </Text>
              )}
              <Text
                style={[styles.metaDot, {color: theme.colors.textSecondary}]}>
                •
              </Text>
              <Text
                style={[
                  styles.metaDate,
                  {
                    color: theme.colors.textSecondary,
                    fontFamily: theme.typography.brand,
                  },
                ]}>
                {glimpse.dateLabel.toUpperCase()}
              </Text>
            </View>

            <View
              style={[
                styles.separator,
                {borderBottomColor: theme.colors.border},
              ]}
            />

            <View style={styles.footerRow}>
              <View>
                <Text
                  style={[
                    styles.label,
                    {
                      color: theme.colors.textTertiary,
                      fontFamily: theme.typography.brand,
                    },
                  ]}>
                  STATUS
                </Text>
                <Text
                  style={[styles.status, {color: theme.colors.textPrimary}]}>
                  ◉ {glimpse.status.toUpperCase()}
                </Text>
              </View>

              <View style={{alignItems: 'flex-end'}}>
                <Text
                  style={[styles.label, {color: theme.colors.textTertiary}]}>
                  RAISED
                </Text>
                <Text
                  style={[
                    styles.raised,
                    {
                      color:
                        glimpse.visibility === 'Private'
                          ? theme.colors.textPrimary
                          : theme.colors.accent,
                    },
                  ]}>
                  ${Math.round(glimpse.raised).toLocaleString()}
                </Text>
              </View>
            </View>
          </SurfaceCard>
        ))}
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  card: {
    marginBottom: 18,
    paddingTop: 12,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tag: {
    borderWidth: 2,
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  metaBadge: {
    borderWidth: 2,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: 12,
    letterSpacing: 0.8,
  },
  metaDot: {
    marginHorizontal: 8,
    fontSize: 14,
  },
  metaDate: {
    fontSize: 12,
    letterSpacing: 1,
  },
  privateMeta: {
    fontSize: 12,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  separator: {
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 4,
  },
  status: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  raised: {
    fontSize: 43,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
