import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTheme} from '../theme/Theme';
import AppHeader from '../ui/AppHeader';
import ScreenContainer from '../ui/ScreenContainer';
import SurfaceCard from '../ui/SurfaceCard';

export default function HowItWorksScreen() {
  const {theme} = useTheme();
  const [amount, setAmount] = useState<number | null>(null);
  const [poolType, setPoolType] = useState<'public' | 'private' | null>(null);
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');

  return (
    <View style={[styles.root, {backgroundColor: theme.colors.background}]}>
      <AppHeader title="How It Works" />
      <ScreenContainer>
        <View style={styles.stack}>
          <StepCard number="1" title="Donation Amount">
            <View style={styles.amountRow}>
              {[10, 50, 100].map(value => {
                const selected = amount === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setAmount(value)}
                    style={[
                      styles.amountButton,
                      {
                        borderColor: '#1A1125',
                        backgroundColor: selected ? '#1A1125' : '#EDE8FA',
                      },
                      selected ? theme.shadows.subtle : theme.shadows.card,
                    ]}
                    activeOpacity={0.9}>
                    <Text
                      style={[
                        styles.amountText,
                        {
                          color: selected ? '#EDE8FA' : '#1A1125',
                          fontFamily: theme.typography.brand,
                        },
                      ]}>
                      ${value}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </StepCard>

          <StepCard number="2" title="Where Should It Go?">
            <Text style={[styles.smallLabel, {color: '#4C4466'}]}>
              ENTER 2-3 OPTIONS
            </Text>
            <TextInput
              value={option1}
              onChangeText={setOption1}
              placeholder="OPTION 1..."
              placeholderTextColor="#7A7391"
              style={styles.input}
            />
            <TextInput
              value={option2}
              onChangeText={setOption2}
              placeholder="OPTION 2..."
              placeholderTextColor="#7A7391"
              style={styles.input}
            />
          </StepCard>

          <StepCard number="3" title="Pool Type">
            <PoolTypeButton
              selected={poolType === 'private'}
              title="Private Pool"
              body="Self-funded entirely by you."
              onPress={() => setPoolType('private')}
            />
            <PoolTypeButton
              selected={poolType === 'public'}
              title="Public Pool"
              body="Allow others to add to the donation."
              onPress={() => setPoolType('public')}
            />
          </StepCard>

          <InfoCard
            tag="GUARANTEE"
            title="Refundable"
            body="100% refundable before 48 hours."
            icon="↺"
            darkTag
          />

          <InfoCard
            tag="PROOF"
            title="Transparency"
            body="Receipts uploaded 5-7 days after lock."
            icon="≣"
          />

          <TouchableOpacity
            style={[styles.lockBtn, theme.shadows.card]}
            activeOpacity={0.9}>
            <Text
              style={[styles.lockText, {fontFamily: theme.typography.brand}]}>
              LOCK & CONTINUE
            </Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </View>
  );
}

function StepCard({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{number}</Text>
      </View>
      <SurfaceCard style={styles.stepCard}>
        <Text style={styles.stepTitle}>{title.toUpperCase()}</Text>
        {children}
      </SurfaceCard>
    </View>
  );
}

function PoolTypeButton({
  selected,
  title,
  body,
  onPress,
}: {
  selected: boolean;
  title: string;
  body: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.poolBtn,
        {
          backgroundColor: selected ? '#1A1125' : '#EDE8FA',
          borderColor: '#1A1125',
        },
      ]}
      activeOpacity={0.85}>
      <Text
        style={[styles.poolTitle, {color: selected ? '#EDE8FA' : '#1A1125'}]}>
        {title.toUpperCase()}
      </Text>
      <Text
        style={[styles.poolBody, {color: selected ? '#CFC7F1' : '#4C4466'}]}>
        {body}
      </Text>
    </TouchableOpacity>
  );
}

function InfoCard({
  tag,
  title,
  body,
  icon,
  darkTag = false,
}: {
  tag: string;
  title: string;
  body: string;
  icon: string;
  darkTag?: boolean;
}) {
  return (
    <SurfaceCard style={{paddingTop: 16}}>
      <View style={styles.infoTagWrap}>
        <View
          style={[
            styles.infoTag,
            {
              backgroundColor: darkTag ? '#1A1125' : '#6554D1',
              borderColor: '#1A1125',
            },
          ]}>
          <Text style={styles.infoTagText}>{tag}</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>{icon}</Text>
        <View style={{flex: 1}}>
          <Text style={styles.infoTitle}>{title.toUpperCase()}</Text>
          <Text style={styles.infoBody}>{body}</Text>
        </View>
      </View>
    </SurfaceCard>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  stack: {gap: 14},
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBadge: {
    width: 42,
    height: 42,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#1A1125',
    backgroundColor: '#6554D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: {
    color: '#EDE8FA',
    fontSize: 20,
    fontWeight: '700',
  },
  stepCard: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '700',
    color: '#1A1125',
    marginBottom: 8,
    letterSpacing: 0.9,
  },
  amountRow: {
    flexDirection: 'row',
    gap: 10,
  },
  amountButton: {
    flex: 1,
    minHeight: 44,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountText: {
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  smallLabel: {
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#1A1125',
    backgroundColor: '#EDE8FA',
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1125',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  poolBtn: {
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  poolTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.7,
  },
  poolBody: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  infoTagWrap: {
    alignItems: 'flex-end',
    marginTop: -16,
    marginBottom: 8,
  },
  infoTag: {
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  infoTagText: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '700',
    color: '#EDE8FA',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 22,
    color: '#6554D1',
    fontWeight: '700',
    lineHeight: 26,
  },
  infoTitle: {
    fontSize: 20,
    lineHeight: 23,
    color: '#1A1125',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  infoBody: {
    marginTop: 2,
    color: '#4C4466',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
  },
  lockBtn: {
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#1A1125',
    backgroundColor: '#6554D1',
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    color: '#EDE8FA',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
