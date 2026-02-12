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
});
