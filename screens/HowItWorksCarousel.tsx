import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  ViewToken,
} from 'react-native';
import {useTheme} from '../theme/Theme';
import SurfaceCard from '../ui/SurfaceCard';

type SlideKey = 'step-1' | 'step-2' | 'step-3' | 'step-4' | 'step-5';

const SLIDES: SlideKey[] = ['step-1', 'step-2', 'step-3', 'step-4', 'step-5'];

export default function HowItWorksCarousel({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {theme} = useTheme();
  const {width} = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);

  const [amount, setAmount] = useState<number | null>(null);
  const [poolType, setPoolType] = useState<'public' | 'private' | null>(null);
  const [option1, setOption1] = useState('');
  const [option2, setOption2] = useState('');

  const listRef = useRef<FlatList<SlideKey>>(null);

  const cardWidth = Math.min(width - 28, 420);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 70,
  }).current;

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      const first = viewableItems[0];
      if (!first || typeof first.index !== 'number') {
        return;
      }
      setCurrentIndex(first.index);
    },
  ).current;

  useEffect(() => {
    if (!visible) {
      return;
    }

    setCurrentIndex(0);

    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({index: 0, animated: false});
    });
  }, [visible]);

  const canPrev = currentIndex > 0;

  const goToIndex = (nextIndex: number) => {
    listRef.current?.scrollToIndex({index: nextIndex, animated: true});
    setCurrentIndex(nextIndex);
  };

  const nextLabel = useMemo(() => {
    if (currentIndex === SLIDES.length - 1) {
      return 'Lock & Continue';
    }
    return 'Next';
  }, [currentIndex]);

  const renderSlide = ({item}: {item: SlideKey}) => {
    if (item === 'step-1') {
      return (
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
      );
    }

    if (item === 'step-2') {
      return (
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
      );
    }

    if (item === 'step-3') {
      return (
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
      );
    }

    if (item === 'step-4') {
      return (
        <StepCard number="4" title="Refundable">
          <View style={styles.infoTagWrap}>
            <View style={[styles.infoTag, {backgroundColor: '#1A1125'}]}>
              <Text style={styles.infoTagText}>GUARANTEE</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>↺</Text>
            <View style={{flex: 1}}>
              <Text style={styles.infoTitle}>REFUNDABLE</Text>
              <Text style={styles.infoBody}>
                100% refundable before 48 hours.
              </Text>
            </View>
          </View>
        </StepCard>
      );
    }

    return (
      <StepCard number="5" title="Transparency">
        <View style={styles.infoTagWrap}>
          <View style={[styles.infoTag, {backgroundColor: '#6554D1'}]}>
            <Text style={styles.infoTagText}>PROOF</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>≣</Text>
          <View style={{flex: 1}}>
            <Text style={styles.infoTitle}>TRANSPARENCY</Text>
            <Text style={styles.infoBody}>
              Receipts uploaded 5-7 days after lock.
            </Text>
          </View>
        </View>
      </StepCard>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.panel,
            {
              width: cardWidth,
              borderColor: '#1A1125',
              backgroundColor: '#F3EFFF',
            },
          ]}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.headerTitle,
                {color: '#1A1125', fontFamily: theme.typography.brand},
              ]}>
              HOW IT WORKS
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.8}>
              <Text style={styles.closeText}>X</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            data={SLIDES}
            keyExtractor={item => item}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={({item}) => (
              <View style={{width: cardWidth - 24, paddingRight: 10}}>
                {renderSlide({item})}
              </View>
            )}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            getItemLayout={(_, index) => ({
              length: cardWidth - 24,
              offset: (cardWidth - 24) * index,
              index,
            })}
          />

          <View style={styles.footerRow}>
            <TouchableOpacity
              onPress={() => goToIndex(currentIndex - 1)}
              disabled={!canPrev}
              style={[styles.arrowBtn, {opacity: canPrev ? 1 : 0.35}]}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <View style={styles.dotsRow}>
              {SLIDES.map((slide, idx) => (
                <View
                  key={slide}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        idx === currentIndex ? '#6554D1' : '#B8B1D4',
                    },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                if (currentIndex === SLIDES.length - 1) {
                  onClose();
                  return;
                }
                goToIndex(currentIndex + 1);
              }}
              style={styles.nextBtn}
              activeOpacity={0.9}>
              <Text style={styles.nextText}>{nextLabel.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  panel: {
    borderWidth: 3,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#1A1125',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 27,
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: '#1A1125',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE8FA',
  },
  closeText: {
    fontSize: 15,
    color: '#1A1125',
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    minHeight: 274,
    paddingVertical: 2,
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
    borderColor: '#1A1125',
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
  footerRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrowBtn: {
    width: 36,
    height: 36,
    borderWidth: 2,
    borderColor: '#1A1125',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE8FA',
  },
  arrowText: {
    fontSize: 25,
    lineHeight: 28,
    color: '#1A1125',
    fontWeight: '700',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
  },
  nextBtn: {
    borderWidth: 2,
    borderColor: '#1A1125',
    backgroundColor: '#6554D1',
    minWidth: 124,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  nextText: {
    color: '#EDE8FA',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
});
