import React from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useTheme} from '../theme/Theme';
import type {ClassroomNeed} from '../services/classroomNeeds';
import {NEED_STATUS_LABELS} from '../config/donationConfig';
import NeedArtwork from './NeedArtwork';

interface NeedCardProps {
  need: ClassroomNeed;
  onPress: (need: ClassroomNeed) => void;
}

export default function NeedCard({need, onPress}: NeedCardProps) {
  const {theme} = useTheme();
  const isOpen = need.status === 'open';
  const statusLabel = NEED_STATUS_LABELS[need.status] ?? need.status.toUpperCase();

  const statusColor = isOpen
    ? theme.colors.accent
    : need.status === 'funded' || need.status === 'purchased'
      ? theme.colors.accent
      : need.status === 'delivered' || need.status === 'classroom_photo_added'
        ? theme.colors.teal
        : theme.colors.textTertiary;

  const location = [need.school_city, need.school_state]
    .filter(Boolean)
    .join(', ');

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      onPress={() => onPress(need)}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.borderMuted,
        },
        theme.shadows.card,
      ]}>
      {need.image_url ? (
        <Image
          source={{uri: need.image_url}}
          style={[styles.image, {borderColor: theme.colors.borderMuted}]}
          resizeMode="cover"
        />
      ) : (
        <NeedArtwork need={need} />
      )}

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text
            style={[
              styles.price,
              {color: theme.colors.textPrimary, fontFamily: theme.typography.brand},
            ]}>
            ${need.price_usdc.toFixed(2)} USDC
          </Text>
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
        </View>

        <Text
          style={[styles.title, {color: theme.colors.textPrimary}]}
          numberOfLines={2}>
          {need.title}
        </Text>

        <Text
          style={[styles.meta, {color: theme.colors.textSecondary}]}
          numberOfLines={1}>
          {need.teacher_first_name}'s class at {need.school_name}
          {location ? ` \u00B7 ${location}` : ''}
        </Text>

        {need.description ? (
          <Text
            style={[styles.excerpt, {color: theme.colors.textSecondary}]}
            numberOfLines={2}>
            {need.description}
          </Text>
        ) : null}

        <View
          style={[
            styles.ctaRow,
            {borderTopColor: theme.colors.borderMuted},
          ]}>
          <Text
            style={[
              styles.ctaText,
              {color: theme.colors.accent, fontFamily: theme.typography.brand},
            ]}>
            {isOpen ? 'FUND THIS NEED' : 'VIEW DETAILS'} {'\u2192'}
          </Text>
        </View>

        {!isOpen && (
          <View
            style={[
              styles.proofHint,
              {backgroundColor: theme.colors.teal + '12'},
            ]}>
            <Text
              style={[
                styles.proofHintText,
                {color: theme.colors.teal, fontFamily: theme.typography.brand},
              ]}>
              PROOF AVAILABLE
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    borderBottomWidth: 1,
  },
  body: {
    padding: 14,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: '700',
    marginBottom: 4,
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
  },
  excerpt: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  ctaRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  proofHint: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  proofHintText: {
    fontSize: 9,
    letterSpacing: 0.7,
  },
});
