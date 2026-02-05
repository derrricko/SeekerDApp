import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NeedsDetailScreen from './NeedsDetailScreen';
import {Colors} from '../components/Colors';

const {width} = Dimensions.get('window');

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

// Real needs data for scrollable list
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

// Custom tier (card 3) - minimal, curiosity-sparking
const CUSTOM_TIER = {
  id: 'custom',
  title: 'Something bigger?',
  subtitle: 'Let\'s talk.',
  cta: 'Connect →',
};


// Simple icon components
const HeartIcon = () => (
  <View style={iconStyles.container}>
    <View style={iconStyles.heart} />
  </View>
);

const PlusIcon = () => (
  <View style={iconStyles.container}>
    <View style={iconStyles.plusH} />
    <View style={iconStyles.plusV} />
  </View>
);

const CircleUserIcon = () => (
  <View style={iconStyles.container}>
    <View style={iconStyles.circle} />
  </View>
);

const iconStyles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    width: 14,
    height: 14,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.textDark,
    borderRadius: 0,
    transform: [{rotate: '45deg'}],
  },
  plusH: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: Colors.textDark,
  },
  plusV: {
    position: 'absolute',
    width: 2,
    height: 14,
    backgroundColor: Colors.textDark,
  },
  circle: {
    width: 16,
    height: 16,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: Colors.textDark,
  },
});

interface TierCardProps {
  tier: typeof TIERS[0];
  index: number;
  onPress: () => void;
  onDonate?: () => void;
}

function TierCard({tier, index, onPress, onDonate}: TierCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const expandHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Card reveal starts at 0.3s
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
    Animated.timing(scale, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
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

  const renderIcon = () => {
    switch (tier.icon) {
      case 'heart':
        return <HeartIcon />;
      case 'plus':
        return <PlusIcon />;
      default:
        return <CircleUserIcon />;
    }
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
        style={[styles.tierCardInner, isExpanded && styles.tierCardExpanded]}>
        <View style={styles.tierTop}>
          <Text
            style={[
              styles.tierAmount,
              tier.isRange && styles.tierAmountRange,
              tier.isCustom && styles.tierAmountCustom,
            ]}>
            {tier.amount}
          </Text>
          <View style={styles.tierIcon}>{renderIcon()}</View>
        </View>
        <Text style={styles.tierTitle}>{tier.title}</Text>
        <Text style={styles.tierPartner}>{tier.partner}</Text>

        {/* Donate Block */}
        <View style={styles.donateBlock}>
          <View style={styles.donateBlockButton}>
            <Text style={styles.donateBlockButtonText}>Donate {tier.amount}</Text>
          </View>
        </View>


        {/* Expanded Content */}
        <Animated.View style={[styles.tierExpandedContent, {height: expandedContentHeight}]}>
          <View style={styles.tierExpandedInner}>
            <View style={styles.tierDivider} />
            <Text style={styles.tierExpandedText}>
              BeHeard is a nonprofit serving the unhoused population.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => Linking.openURL('https://www.instagram.com/beheard.mvmt/')}>
              <Text style={styles.tierExpandedLink}>See what they do →</Text>
            </TouchableOpacity>
            <Text style={[styles.tierExpandedText, {marginTop: 12}]}>
              There is no guarantee of a response, but you will be given a first name and last initial. You may receive a text or video response. You will receive a receipt of your donation.
            </Text>
            <TouchableOpacity
              style={styles.tierDonateButton}
              onPress={onDonate}
              activeOpacity={0.8}>
              <Text style={styles.tierDonateButtonText}>Donate $25</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Real Need Mini Card with press state
interface RealNeedCardProps {
  need: typeof REAL_NEEDS[0];
  onPress: () => void;
}

function RealNeedCard({need, onPress}: RealNeedCardProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.needCard, isPressed && styles.needCardPressed]}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      activeOpacity={1}>
      <Text style={styles.needAmount}>{need.amount}</Text>
      <Text style={styles.needTitle}>{need.title}</Text>
      <Text style={styles.needRecipient}>{need.recipient}</Text>
      <Text style={styles.needDesc} numberOfLines={2}>{need.description}</Text>
    </TouchableOpacity>
  );
}

// Real Needs Section with scrollable list
interface RealNeedsSectionProps {
  onNeedPress: (needId: string) => void;
}

function RealNeedsSection({onNeedPress}: RealNeedsSectionProps) {
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
        <Text style={styles.realNeedsTitle}>Real Needs</Text>
        <Text style={styles.realNeedsSubtitle}>Verified stories, direct impact</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.needsScrollContent}>
        {REAL_NEEDS.map(need => (
          <RealNeedCard
            key={need.id}
            need={need}
            onPress={() => onNeedPress(need.id)}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// Custom Card - minimal, curiosity-sparking with press state
interface CustomCardProps {
  onPress: () => void;
}

function CustomCard({onPress}: CustomCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const [isPressed, setIsPressed] = useState(false);

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

  return (
    <Animated.View style={[styles.customCard, {opacity, transform: [{translateY}]}]}>
      <TouchableOpacity
        style={[styles.customCardInner, isPressed && styles.customCardInnerPressed]}
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={1}>
        <View>
          <Text style={styles.customTitle}>{CUSTOM_TIER.title}</Text>
          <Text style={styles.customSubtitle}>{CUSTOM_TIER.subtitle}</Text>
        </View>
        <View style={styles.customCta}>
          <Text style={styles.customCtaText}>{CUSTOM_TIER.cta}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Nav icons - Neo Brutalist
const GiveNavIcon = ({active}: {active: boolean}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.heart,
        {borderColor: active ? Colors.textDark : Colors.inactive},
      ]}
    />
  </View>
);

const GlimpsesNavIcon = ({active}: {active: boolean}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.rect,
        {borderColor: active ? Colors.textDark : Colors.inactive},
      ]}
    />
  </View>
);

const BoardNavIcon = ({active}: {active: boolean}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.line,
        {backgroundColor: active ? Colors.textDark : Colors.inactive},
      ]}
    />
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
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 0,
    transform: [{rotate: '45deg'}],
  },
  rect: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 0,
  },
  line: {
    width: 20,
    height: 4,
    borderRadius: 0,
  },
});

interface HomeScreenProps {
  onTierPress?: (tierId: string) => void;
  onNeedPress?: (needId: string) => void;
}

export default function HomeScreen({onTierPress, onNeedPress}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('give');
  const [showNeedsDetail, setShowNeedsDetail] = useState(false);
  const [pressedNav, setPressedNav] = useState<string | null>(null);

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

  // Show Needs Detail Screen
  if (showNeedsDetail) {
    return (
      <NeedsDetailScreen
        onBack={() => setShowNeedsDetail(false)}
        onDonate={(amount, purpose) => {
          console.log('Donate:', amount, purpose);
          // TODO: Wire up to payment flow
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={[styles.header, {paddingTop: insets.top + 12}]}>
        <Text style={styles.headerBrand}>GLIMPSE</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: 88 + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}>
        {/* Be Heard Card */}
        {TIERS.map((tier, index) => (
          <TierCard
            key={tier.id}
            tier={tier}
            index={index}
            onPress={() => handleTierPress(tier.id)}
            onDonate={() => handleTierPress(tier.id)}
          />
        ))}

        {/* Real Needs - Scrollable List */}
        <RealNeedsSection onNeedPress={handleNeedPress} />

        {/* Custom Card - Spark Curiosity */}
        <CustomCard onPress={handleCustomPress} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, {paddingBottom: insets.bottom}]}>
        <TouchableOpacity
          style={[styles.navItem, pressedNav === 'give' && styles.navItemPressed]}
          onPress={() => setActiveTab('give')}
          onPressIn={() => setPressedNav('give')}
          onPressOut={() => setPressedNav(null)}
          activeOpacity={1}>
          <View style={[styles.navIcon, activeTab === 'give' && styles.navIconActive]}>
            <GiveNavIcon active={activeTab === 'give'} />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'give' && styles.navLabelActive,
            ]}>
            give
          </Text>
          {activeTab === 'give' && <View style={styles.navActiveDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, pressedNav === 'glimpses' && styles.navItemPressed]}
          onPress={() => setActiveTab('glimpses')}
          onPressIn={() => setPressedNav('glimpses')}
          onPressOut={() => setPressedNav(null)}
          activeOpacity={1}>
          <View style={styles.navIcon}>
            <GlimpsesNavIcon active={activeTab === 'glimpses'} />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'glimpses' && styles.navLabelActive,
            ]}>
            glimpses
          </Text>
          {activeTab === 'glimpses' && <View style={styles.navActiveDot} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, pressedNav === 'board' && styles.navItemPressed]}
          onPress={() => setActiveTab('board')}
          onPressIn={() => setPressedNav('board')}
          onPressOut={() => setPressedNav(null)}
          activeOpacity={1}>
          <View style={styles.navIcon}>
            <BoardNavIcon active={activeTab === 'board'} />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeTab === 'board' && styles.navLabelActive,
            ]}>
            board
          </Text>
          {activeTab === 'board' && <View style={styles.navActiveDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.headerBg,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 3,
    borderBottomColor: Colors.border,
  },
  headerBrand: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 6,
    color: Colors.textDark,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  // Tier card styles - Neo Brutalist
  tierCard: {
    marginBottom: 24,
  },
  tierCardInner: {
    backgroundColor: Colors.cardBg,
    borderWidth: 3,
    borderColor: Colors.border,
    borderRadius: 0,
    padding: 20,
    // Hard shadow - 8px
    shadowColor: Colors.border,
    shadowOffset: {width: 8, height: 8},
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  tierTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierAmount: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 36,
    color: Colors.textDark,
    fontWeight: '900',
  },
  tierAmountRange: {
    fontSize: 28,
  },
  tierAmountCustom: {
    fontSize: 28,
  },
  tierIcon: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 18,
    color: Colors.textDark,
    marginBottom: 4,
    lineHeight: 24,
    textTransform: 'uppercase',
  },
  tierPartner: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.textLight,
    marginBottom: 10,
  },
  tierCardExpanded: {
    borderColor: Colors.border,
    shadowOffset: {width: 2, height: 2},
  },
  donateBlock: {
    marginTop: 16,
  },
  donateBlockButton: {
    backgroundColor: Colors.primary,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: Colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    // Hard shadow on button - 6px
    shadowColor: Colors.border,
    shadowOffset: {width: 6, height: 6},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  donateBlockButtonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 16,
    color: Colors.textDark,
    textTransform: 'uppercase',
    fontWeight: '900',
    letterSpacing: 1,
  },
  tierExpandedContent: {
    overflow: 'hidden',
  },
  tierExpandedInner: {
    paddingTop: 16,
  },
  tierDivider: {
    height: 3,
    backgroundColor: Colors.border,
    marginBottom: 16,
  },
  tierExpandedText: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 14,
    color: Colors.textMedium,
    lineHeight: 22,
    marginBottom: 6,
  },
  tierExpandedLink: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.accent,
    marginBottom: 4,
    textDecorationLine: 'underline',
  },
  tierDonateButton: {
    backgroundColor: Colors.primary,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: Colors.border,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.border,
    shadowOffset: {width: 6, height: 6},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  tierDonateButtonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 16,
    color: Colors.textDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '900',
  },
  // Real Needs Section - Neo Brutalist
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
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    fontWeight: '900',
    color: Colors.cardBg,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  realNeedsSubtitle: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 12,
    fontWeight: '400',
    color: Colors.light,
  },
  needsScrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  needCard: {
    width: 160,
    backgroundColor: Colors.cardBg,
    borderWidth: 3,
    borderColor: Colors.border,
    borderRadius: 0,
    padding: 16,
    // Hard shadow - 8px
    shadowColor: Colors.border,
    shadowOffset: {width: 8, height: 8},
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 0,
  },
  needCardPressed: {
    shadowOffset: {width: 0, height: 0},
    transform: [{translateX: 8}, {translateY: 8}],
  },
  needAmount: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 24,
    color: Colors.textDark,
    marginBottom: 6,
    fontWeight: '900',
  },
  needTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.textDark,
    marginBottom: 2,
    lineHeight: 18,
    textTransform: 'uppercase',
  },
  needRecipient: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 12,
    color: Colors.textMedium,
    marginBottom: 6,
  },
  needDesc: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 12,
    color: Colors.textLight,
    lineHeight: 16,
  },
  // Custom Card - Neo Brutalist
  customCard: {
    marginBottom: 16,
    marginTop: 8,
  },
  customCardInner: {
    backgroundColor: Colors.accent,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: Colors.border,
    borderStyle: 'solid',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.border,
    shadowOffset: {width: 8, height: 8},
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  customCardInnerPressed: {
    shadowOffset: {width: 0, height: 0},
    transform: [{translateX: 8}, {translateY: 8}],
  },
  customTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  customSubtitle: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 14,
    color: Colors.textDark,
  },
  customCta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.cardBg,
    borderRadius: 0,
    borderWidth: 3,
    borderColor: Colors.border,
  },
  customCtaText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 12,
    letterSpacing: 0.5,
    color: Colors.textDark,
    textTransform: 'uppercase',
  },
  // Bottom nav - Neo Brutalist
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 76,
    backgroundColor: Colors.headerBg,
    borderTopWidth: 3,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navItemPressed: {
    opacity: 0.7,
  },
  navIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.3,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.inactive,
    marginTop: 4,
  },
  navLabelActive: {
    color: Colors.textDark,
  },
  navActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 0,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.border,
    marginTop: 4,
  },
});
