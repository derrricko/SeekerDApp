import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';

export default function LeaderboardScreen() {
  const {theme} = useTheme();

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="Rank" />
      <ScreenContainer>
        <SurfaceCard tone="hero">
          <View style={styles.innerList}>
            {[1, 2, 3, 4, 5].map(i => (
              <View key={i} style={styles.row}>
                <Text style={styles.rowRank}>#{i}</Text>
                <View style={styles.fakeAvatar} />
                <View style={{flex: 1}}>
                  <View style={styles.linePrimary} />
                  <View style={styles.lineSecondary} />
                </View>
                <Text style={styles.points}>{1000 - i * 150}</Text>
              </View>
            ))}
          </View>

          <View
            style={[
              styles.overlay,
              {backgroundColor: 'rgba(237,232,250,0.82)'},
            ]}>
            <View style={[styles.overlayCard, theme.shadows.card]}>
              <Text style={styles.overlayLock}>⌾</Text>
              <Text style={styles.overlayText}>COMING SOON</Text>
            </View>
          </View>
        </SurfaceCard>
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  innerList: {
    opacity: 0.28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderBottomColor: 'rgba(26,17,37,0.25)',
    paddingVertical: 10,
  },
  rowRank: {
    width: 34,
    fontSize: 17,
    color: '#1A1125',
    fontWeight: '700',
  },
  fakeAvatar: {
    width: 34,
    height: 34,
    borderWidth: 2,
    borderColor: '#1A1125',
    backgroundColor: '#1A1125',
  },
  linePrimary: {
    height: 10,
    width: 128,
    backgroundColor: '#1A1125',
    marginBottom: 6,
  },
  lineSecondary: {
    height: 8,
    width: 80,
    backgroundColor: 'rgba(26,17,37,0.5)',
  },
  points: {
    fontSize: 20,
    color: '#1A1125',
    fontWeight: '700',
    minWidth: 52,
    textAlign: 'right',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCard: {
    borderWidth: 2,
    borderColor: '#1A1125',
    backgroundColor: '#6554D1',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    transform: [{rotate: '-2deg'}],
  },
  overlayLock: {
    fontSize: 28,
    color: '#EDE8FA',
    fontWeight: '700',
    marginBottom: 4,
  },
  overlayText: {
    color: '#EDE8FA',
    fontSize: 24,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
});
