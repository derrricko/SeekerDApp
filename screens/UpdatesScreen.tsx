import React from 'react';
import {FlatList, StyleSheet, Text, View} from 'react-native';
import {FeedPost, useAppState} from '../components/providers/AppStateProvider';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import SurfaceCard from '../ui/SurfaceCard';

export default function UpdatesScreen() {
  const {theme} = useTheme();
  const {updates} = useAppState();

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Updates" />
      <FlatList
        data={updates}
        keyExtractor={item => item.id}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.md,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SurfaceCard style={{marginBottom: theme.spacing.sm}}>
            <Text
              style={[
                styles.eyebrow,
                {
                  color: theme.colors.textTertiary,
                  fontFamily: theme.typography.brand,
                },
              ]}>
              CAMPAIGN FEED
            </Text>
            <Text
              style={[styles.headerTitle, {color: theme.colors.textPrimary}]}>
              See where giving goes
            </Text>
            <Text
              style={[styles.headerBody, {color: theme.colors.textSecondary}]}>
              Every post reflects real campaign progress so donors can track
              impact over time.
            </Text>
          </SurfaceCard>
        }
        renderItem={({item}) => <UpdateCard post={item} />}
      />
    </View>
  );
}

function UpdateCard({post}: {post: FeedPost}) {
  const {theme} = useTheme();

  return (
    <SurfaceCard>
      <View style={styles.metaRow}>
        <Text style={[styles.campaign, {color: theme.colors.accent}]}>
          {post.campaign}
        </Text>
        <Text style={[styles.time, {color: theme.colors.textTertiary}]}>
          {post.timestampLabel}
        </Text>
      </View>

      <Text style={[styles.postTitle, {color: theme.colors.textPrimary}]}>
        {post.title}
      </Text>
      <Text style={[styles.postBody, {color: theme.colors.textSecondary}]}>
        {post.body}
      </Text>

      {post.mediaType ? (
        <View
          style={[
            styles.mediaBlock,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceAlt,
            },
          ]}>
          <Text
            style={[styles.mediaLabel, {color: theme.colors.textSecondary}]}>
            {post.mediaType === 'video'
              ? 'Video update available'
              : 'Photo update available'}
          </Text>
        </View>
      ) : null}
    </SurfaceCard>
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
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 8,
  },
  headerBody: {
    fontSize: 17,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  campaign: {
    fontSize: 13,
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
  },
  postTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 30,
  },
  postBody: {
    fontSize: 16,
    lineHeight: 23,
  },
  mediaBlock: {
    marginTop: 14,
    borderWidth: 1,
    borderRadius: 0,
    minHeight: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});
