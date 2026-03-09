import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/Theme';
import type {ClassroomNeed} from '../services/classroomNeeds';

type NeedArtworkVariant = 'card' | 'hero';
type ArtworkKind = 'notebooks' | 'markers' | 'calculators' | 'generic';

export default function NeedArtwork({
  need,
  variant = 'card',
}: {
  need: Pick<ClassroomNeed, 'title' | 'description'>;
  variant?: NeedArtworkVariant;
}) {
  const {theme} = useTheme();
  const kind = getArtworkKind(need.title, need.description);
  const isHero = variant === 'hero';

  return (
    <View
      style={[
        styles.frame,
        isHero ? styles.frameHero : styles.frameCard,
        {
          backgroundColor: theme.colors.surfaceAlt,
          borderColor: theme.colors.borderMuted,
        },
      ]}>
      <View
        style={[
          styles.glowOne,
          {backgroundColor: theme.colors.accent + '16'},
        ]}
      />
      <View
        style={[
          styles.glowTwo,
          {backgroundColor: theme.colors.teal + '18'},
        ]}
      />

      <View style={styles.kickerRow}>
        <View
          style={[
            styles.kickerBadge,
            {
              backgroundColor: theme.colors.surface + 'E6',
              borderColor: theme.colors.borderMuted,
            },
          ]}>
          <Text
            style={[
              styles.kickerText,
              {
                color: theme.colors.textTertiary,
                fontFamily: theme.typography.brand,
              },
            ]}>
            EXACT NEED
          </Text>
        </View>
      </View>

      <View style={styles.artStage}>
        {kind === 'notebooks' ? (
          <NotebookArtwork />
        ) : kind === 'markers' ? (
          <MarkerArtwork />
        ) : kind === 'calculators' ? (
          <CalculatorArtwork />
        ) : (
          <GenericArtwork />
        )}
      </View>
    </View>
  );
}

function getArtworkKind(
  title: string,
  description: string | null | undefined,
): ArtworkKind {
  const haystack = `${title} ${description ?? ''}`.toLowerCase();

  if (
    haystack.includes('notebook') ||
    haystack.includes('composition') ||
    haystack.includes('journal')
  ) {
    return 'notebooks';
  }
  if (
    haystack.includes('marker') ||
    haystack.includes('markers') ||
    haystack.includes('art')
  ) {
    return 'markers';
  }
  if (
    haystack.includes('calculator') ||
    haystack.includes('pre-algebra') ||
    haystack.includes('math')
  ) {
    return 'calculators';
  }

  return 'generic';
}

function NotebookArtwork() {
  return (
    <View style={styles.notebookCluster}>
      <View style={[styles.shadowPlate, styles.shadowLeft]} />
      <View style={[styles.shadowPlate, styles.shadowRight]} />

      <View style={[styles.notebook, styles.notebookBack]}>
        <View style={styles.binding} />
        <View style={styles.ruleGroup}>
          <View style={styles.rule} />
          <View style={styles.rule} />
          <View style={styles.rule} />
          <View style={styles.ruleShort} />
        </View>
      </View>

      <View style={[styles.notebook, styles.notebookFront]}>
        <View style={styles.binding} />
        <View style={styles.ruleGroup}>
          <View style={styles.rule} />
          <View style={styles.rule} />
          <View style={styles.rule} />
          <View style={styles.ruleShort} />
        </View>
      </View>
    </View>
  );
}

function MarkerArtwork() {
  return (
    <View style={styles.markerCluster}>
      <View style={[styles.marker, styles.markerTiltOne]}>
        <View style={[styles.markerCap, {backgroundColor: '#F08A5D'}]} />
        <View style={styles.markerBody} />
      </View>
      <View style={[styles.marker, styles.markerTiltTwo]}>
        <View style={[styles.markerCap, {backgroundColor: '#47CBCD'}]} />
        <View style={styles.markerBody} />
      </View>
      <View style={[styles.marker, styles.markerTiltThree]}>
        <View style={[styles.markerCap, {backgroundColor: '#6554D1'}]} />
        <View style={styles.markerBody} />
      </View>
      <View style={[styles.markerTray, styles.markerTrayBack]} />
      <View style={[styles.markerTray, styles.markerTrayFront]} />
    </View>
  );
}

function CalculatorArtwork() {
  return (
    <View style={styles.calculatorWrap}>
      <View style={styles.calculatorBody}>
        <View style={styles.calculatorScreen}>
          <Text style={styles.calculatorDigits}>42.00</Text>
        </View>
        <View style={styles.keypad}>
          {Array.from({length: 12}).map((_, index) => (
            <View
              key={index}
              style={[
                styles.key,
                index % 4 === 3 ? styles.keyAccent : null,
              ]}
            />
          ))}
        </View>
      </View>
      <View style={styles.calcChip} />
      <View style={[styles.calcChip, styles.calcChipTwo]} />
    </View>
  );
}

function GenericArtwork() {
  return (
    <View style={styles.genericWrap}>
      <View style={[styles.genericCard, styles.genericLeft]}>
        <View style={styles.genericRule} />
        <View style={styles.genericRule} />
      </View>
      <View style={[styles.genericCard, styles.genericCenter]}>
        <View style={styles.genericRule} />
        <View style={styles.genericRule} />
        <View style={styles.genericRuleShort} />
      </View>
      <View style={[styles.genericCard, styles.genericRight]}>
        <View style={styles.genericRule} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
  },
  frameCard: {
    height: 168,
    borderBottomWidth: 1,
  },
  frameHero: {
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  glowOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    top: -50,
    right: -36,
  },
  glowTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    bottom: -48,
    left: -28,
  },
  kickerRow: {
    paddingTop: 12,
    paddingHorizontal: 14,
  },
  kickerBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  kickerText: {
    fontSize: 9,
    letterSpacing: 0.8,
  },
  artStage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  notebookCluster: {
    width: 190,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowPlate: {
    position: 'absolute',
    width: 120,
    height: 82,
    borderRadius: 18,
    backgroundColor: 'rgba(26,17,37,0.08)',
  },
  shadowLeft: {
    left: 20,
    top: 24,
    transform: [{rotate: '-12deg'}],
  },
  shadowRight: {
    right: 18,
    top: 10,
    transform: [{rotate: '10deg'}],
  },
  notebook: {
    position: 'absolute',
    width: 118,
    height: 82,
    borderRadius: 18,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(26,17,37,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
  },
  notebookBack: {
    left: 12,
    top: 16,
    transform: [{rotate: '-11deg'}],
  },
  notebookFront: {
    right: 12,
    top: 8,
    transform: [{rotate: '10deg'}],
  },
  binding: {
    width: 12,
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#6554D1',
    marginRight: 12,
  },
  ruleGroup: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  rule: {
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(101,84,209,0.24)',
  },
  ruleShort: {
    width: '68%',
    height: 3,
    borderRadius: 99,
    backgroundColor: 'rgba(71,203,205,0.34)',
  },
  markerCluster: {
    width: 210,
    height: 112,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerTray: {
    position: 'absolute',
    width: 164,
    height: 42,
    borderRadius: 18,
  },
  markerTrayBack: {
    bottom: 16,
    backgroundColor: 'rgba(101,84,209,0.12)',
    transform: [{rotate: '-8deg'}],
  },
  markerTrayFront: {
    bottom: 24,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(26,17,37,0.12)',
  },
  marker: {
    position: 'absolute',
    width: 122,
    height: 18,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  markerTiltOne: {
    top: 16,
    left: 32,
    transform: [{rotate: '-16deg'}],
  },
  markerTiltTwo: {
    top: 40,
    left: 48,
    transform: [{rotate: '8deg'}],
  },
  markerTiltThree: {
    top: 64,
    left: 40,
    transform: [{rotate: '-4deg'}],
  },
  markerCap: {
    width: 30,
    height: 18,
    borderTopLeftRadius: 999,
    borderBottomLeftRadius: 999,
  },
  markerBody: {
    flex: 1,
    height: 18,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(26,17,37,0.12)',
    borderLeftWidth: 0,
  },
  calculatorWrap: {
    width: 176,
    height: 122,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorBody: {
    width: 118,
    height: 146,
    borderRadius: 24,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(26,17,37,0.12)',
    padding: 14,
    justifyContent: 'space-between',
    transform: [{rotate: '-6deg'}],
  },
  calculatorScreen: {
    height: 26,
    borderRadius: 10,
    backgroundColor: 'rgba(71,203,205,0.22)',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
  },
  calculatorDigits: {
    fontSize: 13,
    letterSpacing: 0.6,
    color: '#1A1125',
    fontWeight: '700',
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 8,
  },
  key: {
    width: 20,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(26,17,37,0.1)',
  },
  keyAccent: {
    backgroundColor: 'rgba(101,84,209,0.28)',
  },
  calcChip: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(101,84,209,0.12)',
    top: 18,
    right: 8,
  },
  calcChipTwo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(71,203,205,0.18)',
    top: 92,
    left: 12,
  },
  genericWrap: {
    width: 190,
    height: 112,
    justifyContent: 'center',
    alignItems: 'center',
  },
  genericCard: {
    position: 'absolute',
    width: 92,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(26,17,37,0.12)',
    padding: 14,
    justifyContent: 'center',
    gap: 6,
  },
  genericLeft: {
    left: 8,
    transform: [{rotate: '-10deg'}],
  },
  genericCenter: {
    zIndex: 2,
  },
  genericRight: {
    right: 8,
    transform: [{rotate: '10deg'}],
  },
  genericRule: {
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(101,84,209,0.2)',
  },
  genericRuleShort: {
    width: '62%',
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(71,203,205,0.28)',
  },
});
