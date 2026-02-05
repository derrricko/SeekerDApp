import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NeedsDetailScreen from './NeedsDetailScreen';
import {useTheme} from '../components/theme';

// Tier data
const TIERS = [
  {
    id: 'be-heard',
    amount: '$25',
    isRange: false,
    title: 'A clean shower and fresh clothes',
    partner: 'BeHeard Movement · Tulsa, OK',
    description:
      'Give someone the simple gift of feeling clean, refreshed, and seen.',
    cta: 'Give This Gift',
    icon: 'circle-user',
  },
];

// Real needs data
const REAL_NEEDS = [
  {
    id: 'oil-change',
    amount: '$450',
    title: 'Safe Ride to Work',
    recipient: 'For Maria',
    description: 'New tires + oil change so she can keep her job.',
  },
  {
    id: 'diapers',
    amount: '$180',
    title: '3 Months of Diapers',
    recipient: 'Johnson Family',
    description: 'Twins arrived early. A little help goes far.',
  },
  {
    id: 'wardrobe',
    amount: '$200',
    title: 'Back to School',
    recipient: 'For Marcus, 13',
    description: 'New clothes for 8th grade. Confidence matters.',
  },
  {
    id: 'groceries',
    amount: '$150',
    title: 'Full Fridge',
    recipient: 'For Sandra',
    description: 'Fresh start deserves fresh food.',
  },
];

const CUSTOM_TIER = {
  id: 'custom',
  title: 'Something bigger?',
  subtitle: "Let's talk.",
  cta: 'Connect →',
};

// Theme toggle icon component
function ThemeToggleIcon({mode}: {mode: 'light' | 'dark' | 'system'}) {
  const {colors} = useTheme();

  if (mode === 'light') {
    return (
      <View style={[iconStyles.sunOuter, {borderColor: colors.textPrimary}]}>
        <View style={[iconStyles.sunInner, {backgroundColor: colors.textPrimary}]} />
      </View>
    );
  }

  if (mode === 'dark') {
    return (
      <View style={[iconStyles.moon, {borderColor: colors.textPrimary}]} />
    );
  }

  return (
    <View style={iconStyles.systemIcon}>
      <View style={[iconStyles.systemHalf, {backgroundColor: colors.textPrimary}]} />
      <View style={[iconStyles.systemHalfOutline, {borderColor: colors.textPrimary}]} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  sunOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sunInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderTopRightRadius: 0,
  },
  systemIcon: {
    width: 20,
    height: 20,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 4,
  },
  systemHalf: {
    width: 10,
    height: 20,
  },
  systemHalfOutline: {
    width: 8,
    height: 18,
    borderWidth: 2,
    marginLeft: -2,
  },
});

// Simple icon components
const CircleUserIcon = ({color}: {color: string}) => (
  <View style={simpleIconStyles.container}>
    <View style={[simpleIconStyles.circle, {borderColor: color}]} />
  </View>
);

const simpleIconStyles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
  },
});

interface TierCardProps {
  tier: typeof TIERS[0];
  index: number;
  onPress: () => void;
  onDonate?: () => void;
}

function TierCard({tier, index, onPress, onDonate}: TierCardProps) {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const expandHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = 300 + index * 200;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const toggleExpand = () => {
    const toValue = isExpanded ? 0 : 1;
    setIsExpanded(!isExpanded);
    Animated.spring(expandHeight, {
      toValue,
      useNativeDriver: false,
      friction: 10,
      tension: 40,
    }).start();
  };

  const expandedContentHeight = expandHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  return (
    <Animated.View
      style={[
        styles.tierCard,
        {
          opacity,
          transform: [{translateY}, {scale}],
        },
      ]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleExpand}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.tierCardInner,
          {
            backgroundColor: colors.card,
            borderColor: colors.glassBorder,
            shadowColor: colors.shadow,
          },
        ]}>
        <View style={styles.tierTop}>
          <Text style={[styles.tierAmount, {color: colors.textPrimary}]}>
            {tier.amount}
          </Text>
          <View
            style={[
              styles.tierIcon,
              {backgroundColor: colors.primaryLight, borderColor: colors.primary},
            ]}>
            <CircleUserIcon color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.tierTitle, {color: colors.textPrimary}]}>
          {tier.title}
        </Text>
        <Text style={[styles.tierPartner, {color: colors.textSecondary}]}>
          {tier.partner}
        </Text>

        <TouchableOpacity
          style={[styles.donateButton, {backgroundColor: colors.primary}]}
          onPress={onDonate}
          activeOpacity={0.8}>
          <Text style={[styles.donateButtonText, {color: colors.textOnPrimary}]}>
            Donate {tier.amount}
          </Text>
        </TouchableOpacity>

        <Animated.View style={{height: expandedContentHeight, overflow: 'hidden'}}>
          <View style={styles.tierExpandedInner}>
            <View style={[styles.tierDivider, {backgroundColor: colors.border}]} />
            <Text style={[styles.tierExpandedText, {color: colors.textSecondary}]}>
              BeHeard is a nonprofit serving the unhoused population.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://www.instagram.com/beheard.mvmt/')}>
              <Text style={[styles.tierExpandedLink, {color: colors.primary}]}>
                See what they do →
              </Text>
            </TouchableOpacity>
            <Text style={[styles.tierExpandedText, {color: colors.textSecondary, marginTop: 12}]}>
              There is no guarantee of a response, but you will be given a first name and last initial.
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface RealNeedCardProps {
  need: typeof REAL_NEEDS[0];
  onPress: () => void;
}

function RealNeedCard({need, onPress}: RealNeedCardProps) {
  const {colors} = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <TouchableOpacity
        style={[
          styles.needCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.glassBorder,
            shadowColor: colors.shadow,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        <Text style={[styles.needAmount, {color: colors.primary}]}>{need.amount}</Text>
        <Text style={[styles.needTitle, {color: colors.textPrimary}]}>{need.title}</Text>
        <Text style={[styles.needRecipient, {color: colors.textSecondary}]}>{need.recipient}</Text>
        <Text style={[styles.needDesc, {color: colors.textTertiary}]} numberOfLines={2}>
          {need.description}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

interface RealNeedsSectionProps {
  onNeedPress: (needId: string) => void;
}

function RealNeedsSection({onNeedPress}: RealNeedsSectionProps) {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.realNeedsSection, {opacity, transform: [{translateY}]}]}>
      <View style={styles.realNeedsHeader}>
        <Text style={[styles.realNeedsTitle, {color: colors.textPrimary}]}>Real Needs</Text>
        <Text style={[styles.realNeedsSubtitle, {color: colors.textSecondary}]}>
          Verified stories, direct impact
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.needsScrollContent}>
        {REAL_NEEDS.map(need => (
          <RealNeedCard key={need.id} need={need} onPress={() => onNeedPress(need.id)} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

interface CustomCardProps {
  onPress: () => void;
}

function CustomCard({onPress}: CustomCardProps) {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay: 900,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Animated.View style={[styles.customCard, {opacity, transform: [{translateY}, {scale}]}]}>
      <TouchableOpacity
        style={[
          styles.customCardInner,
          {
            backgroundColor: colors.accentLight,
            borderColor: colors.glassBorder,
            shadowColor: colors.accent,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        <View>
          <Text style={[styles.customTitle, {color: colors.textPrimary}]}>{CUSTOM_TIER.title}</Text>
          <Text style={[styles.customSubtitle, {color: colors.textSecondary}]}>
            {CUSTOM_TIER.subtitle}
          </Text>
        </View>
        <View style={[styles.customCta, {backgroundColor: colors.accent}]}>
          <Text style={[styles.customCtaText, {color: colors.textOnPrimary}]}>{CUSTOM_TIER.cta}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Nav icons
const GiveNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    <View style={[navIconStyles.heart, {borderColor: color, opacity: active ? 1 : 0.4}]} />
  </View>
);

const GlimpsesNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    <View style={[navIconStyles.rect, {borderColor: color, opacity: active ? 1 : 0.4}]} />
  </View>
);

const BoardNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    <View style={[navIconStyles.line, {backgroundColor: color, opacity: active ? 1 : 0.4}]} />
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
  rect: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
  },
  line: {
    width: 18,
    height: 3,
    borderRadius: 2,
  },
});

interface HomeScreenProps {
  onTierPress?: (tierId: string) => void;
  onNeedPress?: (needId: string) => void;
}

export default function HomeScreen({onTierPress, onNeedPress}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {colors, mode, toggleMode} = useTheme();
  const [activeTab, setActiveTab] = useState('give');
  const [showNeedsDetail, setShowNeedsDetail] = useState(false);

  const handleTierPress = (tierId: string) => {
    if (onTierPress) {
      onTierPress(tierId);
    }
  };

  const handleNeedPress = (needId: string) => {
    setShowNeedsDetail(true);
    if (onNeedPress) {
      onNeedPress(needId);
    }
  };

  const handleCustomPress = () => {
    if (onTierPress) {
      onTierPress('custom');
    }
  };

  if (showNeedsDetail) {
    return (
      <NeedsDetailScreen
        onBack={() => setShowNeedsDetail(false)}
        onDonate={(amount, purpose) => {
          console.log('Donate:', amount, purpose);
        }}
      />
    );
  }

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.glassBorder,
          },
        ]}>
        <Text style={[styles.headerBrand, {color: colors.textPrimary}]}>Glimpse</Text>
        <TouchableOpacity onPress={toggleMode} style={styles.themeToggle}>
          <ThemeToggleIcon mode={mode} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 100 + insets.bottom}]}
        showsVerticalScrollIndicator={false}>
        {TIERS.map((tier, index) => (
          <TierCard
            key={tier.id}
            tier={tier}
            index={index}
            onPress={() => handleTierPress(tier.id)}
            onDonate={() => handleTierPress(tier.id)}
          />
        ))}

        <RealNeedsSection onNeedPress={handleNeedPress} />

        <CustomCard onPress={handleCustomPress} />
      </ScrollView>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: insets.bottom + 8,
            backgroundColor: colors.card,
            borderTopColor: colors.glassBorder,
          },
        ]}>
        {[
          {id: 'give', Icon: GiveNavIcon, label: 'Give'},
          {id: 'glimpses', Icon: GlimpsesNavIcon, label: 'Glimpses'},
          {id: 'board', Icon: BoardNavIcon, label: 'Board'},
        ].map(({id, Icon, label}) => (
          <TouchableOpacity
            key={id}
            style={styles.navItem}
            onPress={() => setActiveTab(id)}
            activeOpacity={0.7}>
            <Icon active={activeTab === id} color={colors.textPrimary} />
            <Text
              style={[
                styles.navLabel,
                {color: activeTab === id ? colors.textPrimary : colors.textTertiary},
              ]}>
              {label}
            </Text>
            {activeTab === id && (
              <View style={[styles.navActiveDot, {backgroundColor: colors.primary}]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {
    fontSize: 24,
    fontWeight: '300',
    letterSpacing: 2,
  },
  themeToggle: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  tierCard: {
    marginBottom: 24,
  },
  tierCardInner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  tierTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierAmount: {
    fontSize: 36,
    fontWeight: '300',
  },
  tierIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 24,
  },
  tierPartner: {
    fontSize: 13,
    letterSpacing: 0.3,
    marginBottom: 16,
  },
  donateButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  donateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tierExpandedInner: {
    paddingTop: 16,
  },
  tierDivider: {
    height: 1,
    marginBottom: 16,
  },
  tierExpandedText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 6,
  },
  tierExpandedLink: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  realNeedsSection: {
    marginTop: 8,
    marginBottom: 24,
    marginHorizontal: -20,
  },
  realNeedsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  realNeedsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  realNeedsSubtitle: {
    fontSize: 14,
  },
  needsScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  needCard: {
    width: 160,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  needAmount: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 6,
  },
  needTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    lineHeight: 18,
  },
  needRecipient: {
    fontSize: 12,
    marginBottom: 6,
  },
  needDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  customCard: {
    marginBottom: 16,
    marginTop: 8,
  },
  customCardInner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  customTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  customSubtitle: {
    fontSize: 14,
  },
  customCta: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  customCtaText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
