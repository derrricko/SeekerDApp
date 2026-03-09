import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../theme/Theme';
import type {ClassroomNeed} from '../services/classroomNeeds';

type NeedArtworkVariant = 'card' | 'hero';
type ArtworkKind = 'notebooks' | 'markers' | 'calculators' | 'generic';
type ArtworkMeta = {
  kind: ArtworkKind;
  quantityLabel: string;
  itemLabel: string;
};

export default function NeedArtwork({
  need,
  variant = 'card',
}: {
  need: Pick<ClassroomNeed, 'title' | 'description'>;
  variant?: NeedArtworkVariant;
}) {
  const {theme} = useTheme();
  const meta = getArtworkMeta(need.title, need.description);
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
        {meta.kind === 'notebooks' ? (
          <NotebookArtwork quantityLabel={meta.quantityLabel} />
        ) : meta.kind === 'markers' ? (
          <MarkerArtwork quantityLabel={meta.quantityLabel} />
        ) : meta.kind === 'calculators' ? (
          <CalculatorArtwork quantityLabel={meta.quantityLabel} />
        ) : (
          <GenericArtwork itemLabel={meta.itemLabel} />
        )}
      </View>

      <View style={styles.captionRow}>
        <View
          style={[
            styles.captionBadge,
            {
              backgroundColor: theme.colors.surface + 'ED',
              borderColor: theme.colors.borderMuted,
            },
          ]}>
          <Text
            style={[
              styles.captionText,
              {
                color: theme.colors.textPrimary,
                fontFamily: theme.typography.brand,
              },
            ]}>
            {meta.itemLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

function getArtworkMeta(
  title: string,
  description: string | null | undefined,
): ArtworkMeta {
  const haystack = `${title} ${description ?? ''}`.toLowerCase();
  const quantityLabel = getQuantityLabel(title);

  if (
    haystack.includes('notebook') ||
    haystack.includes('composition') ||
    haystack.includes('journal')
  ) {
    return {
      kind: 'notebooks',
      quantityLabel,
      itemLabel: 'COMPOSITION NOTEBOOKS',
    };
  }
  if (
    haystack.includes('marker') ||
    haystack.includes('markers') ||
    haystack.includes('art')
  ) {
    return {
      kind: 'markers',
      quantityLabel,
      itemLabel: 'CLASSROOM MARKERS',
    };
  }
  if (
    haystack.includes('calculator') ||
    haystack.includes('pre-algebra') ||
    haystack.includes('math')
  ) {
    return {
      kind: 'calculators',
      quantityLabel,
      itemLabel: 'SCIENTIFIC CALCULATORS',
    };
  }

  return {
    kind: 'generic',
    quantityLabel,
    itemLabel: normalizeItemLabel(title),
  };
}

function getQuantityLabel(title: string) {
  const packMatch = title.match(/(\d+)\s*[- ]?(pack|count)/i);
  if (packMatch) {
    return `${packMatch[1]} ${packMatch[2].toUpperCase()}`;
  }

  const boxesMatch = title.match(/(\d+)\s*boxes?/i);
  if (boxesMatch) {
    return `${boxesMatch[1]} BOXES`;
  }

  const numberMatch = title.match(/(\d+)/);
  if (numberMatch) {
    return `${numberMatch[1]} ITEMS`;
  }

  return 'CLASSROOM ITEM';
}

function normalizeItemLabel(title: string) {
  return title
    .replace(/\([^)]*\)/g, '')
    .replace(/\b\d+\s*[- ]?(pack|count|boxes?)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
    .slice(0, 28);
}

function NotebookArtwork({quantityLabel}: {quantityLabel: string}) {
  return (
    <View style={styles.notebookCluster}>
      <View style={[styles.shadowPlate, styles.shadowLeft]} />
      <View style={[styles.shadowPlate, styles.shadowRight]} />

      <View style={[styles.notebook, styles.notebookBack]}>
        <View style={styles.binding} />
        <View style={styles.ruleGroup}>
          <View style={styles.coverStripe} />
          <View style={styles.rule} />
          <View style={styles.rule} />
          <View style={styles.rule} />
          <View style={styles.ruleShort} />
        </View>
      </View>

      <View style={[styles.notebook, styles.notebookFront]}>
        <View style={styles.binding} />
        <View style={styles.ruleGroup}>
          <View style={styles.coverStripe} />
          <View style={styles.rule} />
          <View style={styles.rule} />
          <View style={styles.rule} />
          <View style={styles.ruleShort} />
        </View>
      </View>

      <View style={styles.quantityChip}>
        <Text style={styles.quantityChipText}>{quantityLabel}</Text>
      </View>
    </View>
  );
}

function MarkerArtwork({quantityLabel}: {quantityLabel: string}) {
  return (
    <View style={styles.markerCluster}>
      <View style={styles.markerBoxShadow} />
      <View style={styles.markerBox}>
        <View style={styles.markerBoxHeader}>
          <Text style={styles.markerBoxLabel}>{quantityLabel}</Text>
        </View>
        <View style={styles.markerPreviewRow}>
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
        </View>
      </View>
    </View>
  );
}

function CalculatorArtwork({quantityLabel}: {quantityLabel: string}) {
  return (
    <View style={styles.calculatorWrap}>
      <View style={[styles.calculatorBody, styles.calculatorStackBack]} />
      <View style={[styles.calculatorBody, styles.calculatorStackMid]} />
      <View style={styles.calculatorBody}>
        <View style={styles.calculatorTopBar}>
          <Text style={styles.calculatorTopBarText}>{quantityLabel}</Text>
        </View>
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

function GenericArtwork({itemLabel}: {itemLabel: string}) {
  return (
    <View style={styles.genericWrap}>
      <View style={[styles.genericCard, styles.genericLeft]}>
        <View style={styles.genericRule} />
        <View style={styles.genericRule} />
      </View>
      <View style={[styles.genericCard, styles.genericCenter]}>
        <Text style={styles.genericLabel}>{itemLabel}</Text>
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
    paddingBottom: 8,
  },
  captionRow: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  captionBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  captionText: {
    fontSize: 9,
    letterSpacing: 0.7,
  },
  notebookCluster: {
    width: 190,
    height: 118,
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
  coverStripe: {
    width: '48%',
    height: 8,
    borderRadius: 99,
    backgroundColor: 'rgba(101,84,209,0.6)',
    marginBottom: 4,
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
  quantityChip: {
    position: 'absolute',
    right: 10,
    bottom: 8,
    backgroundColor: '#1A1125',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quantityChipText: {
    color: '#F4EEFF',
    fontSize: 9,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  markerCluster: {
    width: 210,
    height: 112,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerBoxShadow: {
    position: 'absolute',
    width: 170,
    height: 92,
    borderRadius: 20,
    backgroundColor: 'rgba(26,17,37,0.08)',
    top: 18,
    transform: [{rotate: '-5deg'}],
  },
  markerBox: {
    width: 170,
    height: 92,
    borderRadius: 20,
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(26,17,37,0.12)',
    overflow: 'hidden',
    transform: [{rotate: '-3deg'}],
  },
  markerBoxHeader: {
    height: 28,
    backgroundColor: 'rgba(101,84,209,0.12)',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  markerBoxLabel: {
    color: '#1A1125',
    fontSize: 10,
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  markerPreviewRow: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  marker: {
    position: 'absolute',
    width: 108,
    height: 18,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  markerTiltOne: {
    top: 6,
    left: 0,
    transform: [{rotate: '-16deg'}],
  },
  markerTiltTwo: {
    top: 22,
    left: 28,
    transform: [{rotate: '8deg'}],
  },
  markerTiltThree: {
    top: 40,
    left: 12,
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
  calculatorStackBack: {
    position: 'absolute',
    backgroundColor: 'rgba(255,253,248,0.72)',
    top: 10,
    left: 18,
    transform: [{rotate: '-11deg'}],
  },
  calculatorStackMid: {
    position: 'absolute',
    backgroundColor: 'rgba(255,253,248,0.86)',
    top: 6,
    right: 14,
    transform: [{rotate: '-8deg'}],
  },
  calculatorTopBar: {
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(101,84,209,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  calculatorTopBarText: {
    color: '#1A1125',
    fontSize: 9,
    letterSpacing: 0.7,
    fontWeight: '700',
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
  genericLabel: {
    color: '#1A1125',
    fontSize: 9,
    letterSpacing: 0.6,
    fontWeight: '700',
    marginBottom: 4,
  },
  genericRuleShort: {
    width: '62%',
    height: 4,
    borderRadius: 99,
    backgroundColor: 'rgba(71,203,205,0.28)',
  },
});
