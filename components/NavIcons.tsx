import React from 'react';
import {View, StyleSheet} from 'react-native';

interface NavIconProps {
  active: boolean;
  color: string;
}

export const GiveNavIcon = ({active, color}: NavIconProps) => (
  <View style={navIconStyles.container}>
    {active ? (
      <View
        style={[
          navIconStyles.heart,
          {backgroundColor: color, borderColor: color},
        ]}
      />
    ) : (
      <View style={[navIconStyles.heart, {borderColor: color, opacity: 0.4}]} />
    )}
  </View>
);

export const GlimpsesNavIcon = ({active, color}: NavIconProps) => (
  <View style={navIconStyles.container}>
    {active ? (
      <View style={[navIconStyles.glimpseActive]}>
        <View style={[navIconStyles.glimpseCard, {backgroundColor: color}]} />
        <View
          style={[
            navIconStyles.glimpseCardBack,
            {backgroundColor: color, opacity: 0.4},
          ]}
        />
      </View>
    ) : (
      <View style={[navIconStyles.rect, {borderColor: color, opacity: 0.4}]} />
    )}
  </View>
);

export const ProfileNavIcon = ({active, color}: NavIconProps) => (
  <View style={navIconStyles.container}>
    {active ? (
      <>
        <View
          style={[
            navIconStyles.profileCircle,
            {backgroundColor: color, borderColor: color},
          ]}
        />
        <View
          style={[
            navIconStyles.profileBody,
            {backgroundColor: color, borderColor: color},
          ]}
        />
      </>
    ) : (
      <>
        <View
          style={[
            navIconStyles.profileCircle,
            {borderColor: color, opacity: 0.4},
          ]}
        />
        <View
          style={[
            navIconStyles.profileBody,
            {borderColor: color, opacity: 0.4},
          ]}
        />
      </>
    )}
  </View>
);

// ─── New Nav Icons ──────────────────────────────────────────────────────────

export const DashboardNavIcon = ({active, color}: NavIconProps) => (
  <View style={navIconStyles.container}>
    {active ? (
      <View style={navIconStyles.gridWrap}>
        <View style={[navIconStyles.gridCell, {backgroundColor: color, borderRadius: 3}]} />
        <View style={[navIconStyles.gridCell, {backgroundColor: color, borderRadius: 3}]} />
        <View style={[navIconStyles.gridCell, {backgroundColor: color, borderRadius: 3}]} />
        <View style={[navIconStyles.gridCell, {backgroundColor: color, borderRadius: 3}]} />
      </View>
    ) : (
      <View style={navIconStyles.gridWrap}>
        <View style={[navIconStyles.gridCell, {borderColor: color, borderWidth: 1.5, borderRadius: 3, opacity: 0.4}]} />
        <View style={[navIconStyles.gridCell, {borderColor: color, borderWidth: 1.5, borderRadius: 3, opacity: 0.4}]} />
        <View style={[navIconStyles.gridCell, {borderColor: color, borderWidth: 1.5, borderRadius: 3, opacity: 0.4}]} />
        <View style={[navIconStyles.gridCell, {borderColor: color, borderWidth: 1.5, borderRadius: 3, opacity: 0.4}]} />
      </View>
    )}
  </View>
);

export const VaultsNavIcon = ({active, color}: NavIconProps) => (
  <View style={navIconStyles.container}>
    {active ? (
      <View style={[navIconStyles.vaultBox, {backgroundColor: color, borderRadius: 4}]}>
        <View style={[navIconStyles.vaultLine, {backgroundColor: 'rgba(255,255,255,0.5)'}]} />
      </View>
    ) : (
      <View style={[navIconStyles.vaultBox, {borderColor: color, borderWidth: 2, borderRadius: 4, opacity: 0.4}]}>
        <View style={[navIconStyles.vaultLine, {backgroundColor: color, opacity: 0.5}]} />
      </View>
    )}
  </View>
);

export const CommunityNavIcon = ({active, color}: NavIconProps) => (
  <View style={navIconStyles.container}>
    {active ? (
      <View style={navIconStyles.communityWrap}>
        <View style={[navIconStyles.communityCircle, {backgroundColor: color, left: 3}]} />
        <View style={[navIconStyles.communityCircle, {backgroundColor: color, left: 11, opacity: 0.6}]} />
      </View>
    ) : (
      <View style={navIconStyles.communityWrap}>
        <View style={[navIconStyles.communityCircle, {borderColor: color, borderWidth: 2, left: 3, opacity: 0.4}]} />
        <View style={[navIconStyles.communityCircle, {borderColor: color, borderWidth: 2, left: 11, opacity: 0.4}]} />
      </View>
    )}
  </View>
);

export const SettingsGearIcon = ({color, size = 20}: {color: string; size?: number}) => (
  <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
    <View
      style={{
        width: size * 0.5,
        height: size * 0.5,
        borderRadius: size * 0.25,
        borderWidth: 2,
        borderColor: color,
      }}
    />
    {/* Gear teeth — 4 small bars at cardinal directions */}
    <View style={{position: 'absolute', width: size * 0.2, height: 2.5, backgroundColor: color, top: 0, borderRadius: 1}} />
    <View style={{position: 'absolute', width: size * 0.2, height: 2.5, backgroundColor: color, bottom: 0, borderRadius: 1}} />
    <View style={{position: 'absolute', width: 2.5, height: size * 0.2, backgroundColor: color, left: 0, borderRadius: 1}} />
    <View style={{position: 'absolute', width: 2.5, height: size * 0.2, backgroundColor: color, right: 0, borderRadius: 1}} />
  </View>
);

const navIconStyles = StyleSheet.create({
  container: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
    transform: [{rotate: '45deg'}],
  },
  rect: {width: 18, height: 18, borderWidth: 2, borderRadius: 4},
  glimpseActive: {width: 22, height: 18, position: 'relative'},
  glimpseCard: {
    width: 16,
    height: 16,
    borderRadius: 3,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  glimpseCardBack: {
    width: 16,
    height: 16,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    right: 0,
  },
  profileCircle: {
    width: 12,
    height: 12,
    borderWidth: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  profileBody: {
    width: 18,
    height: 8,
    borderWidth: 2,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomWidth: 0,
  },
  // Dashboard grid
  gridWrap: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  gridCell: {
    width: 8,
    height: 8,
  },
  // Vaults
  vaultBox: {
    width: 20,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultLine: {
    width: 12,
    height: 2,
    borderRadius: 1,
  },
  // Community
  communityWrap: {
    width: 24,
    height: 16,
    position: 'relative',
  },
  communityCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    position: 'absolute',
    top: 1,
  },
});
