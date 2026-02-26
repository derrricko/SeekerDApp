// v2 Leaderboard — placeholder for hackathon demo

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default function LeaderboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <View style={styles.comingSoon}>
        <Text style={styles.comingSoonTitle}>Rankings coming soon</Text>
        <Text style={styles.comingSoonText}>
          Every donation creates a verifiable on-chain receipt. We're building a
          public leaderboard that ranks donors by total given — transparent,
          on Solana, no trust required.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FAFAFA',
    marginBottom: 24,
  },
  comingSoon: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    alignItems: 'center',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#818CF8',
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 15,
    color: '#888',
    lineHeight: 22,
    textAlign: 'center',
  },
});
