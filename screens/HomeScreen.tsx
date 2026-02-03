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

const {width} = Dimensions.get('window');

// Soft Blue Color Palette - Light, Trustworthy, Calm
const Colors = {
  // Light Blue Backgrounds
  cream: '#F0F7FC',             // Very light blue - main bg
  paper: '#F5FAFD',             // Softer blue tint
  cardBg: '#FFFFFF',            // Clean white cards

  // Blue Tones
  warmBrown: '#4A6B8B',         // Slate blue (for subtle text)
  softOrange: '#1E3A5F',        // Deep navy - primary action button
  goldenYellow: '#2D4A6F',      // Medium navy
  gentleGreen: '#60A5FA',       // Light blue accent
  softRose: '#93C5FD',          // Soft blue highlight

  // Text
  textDark: '#1E3A5F',          // Deep navy
  textMedium: '#3D5A80',        // Medium blue-gray
  textLight: '#6B8CAE',         // Light blue-gray
  textAccent: '#1E3A5F',        // Navy accent

  // Borders & Lines
  borderLight: '#DBEAFE',       // Soft blue border
  borderWarm: '#BFDBFE',        // Slightly deeper blue border

  // Legacy (keeping for compatibility)
  white: '#FAFAF8',
  offWhite: '#F5F4F0',
  warmGray: '#E8E6E1',
  mediumGray: '#B8B5AD',
  darkGray: '#6B6860',
  charcoal: '#3A3835',
  nearBlack: '#1A1917',
  deepBlue: '#1B365D',
  deepBlueSoft: 'rgba(27, 54, 93, 0.08)',
  goldSubtle: '#C4A87C',
  goldWarm: '#B8975A',
  goldLine: 'rgba(196, 168, 124, 0.4)',
};

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
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    width: 12,
    height: 12,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.textMedium,
    borderRadius: 6,
    transform: [{rotate: '45deg'}],
  },
  plusH: {
    position: 'absolute',
    width: 12,
    height: 1.5,
    backgroundColor: Colors.textMedium,
  },
  plusV: {
    position: 'absolute',
    width: 1.5,
    height: 12,
    backgroundColor: Colors.textMedium,
  },
  circle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.textMedium,
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

// Real Need Mini Card
interface RealNeedCardProps {
  need: typeof REAL_NEEDS[0];
  onPress: () => void;
}

function RealNeedCard({need, onPress}: RealNeedCardProps) {
  return (
    <TouchableOpacity style={styles.needCard} onPress={onPress} activeOpacity={0.8}>
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

// Custom Card - minimal, curiosity-sparking
interface CustomCardProps {
  onPress: () => void;
}

function CustomCard({onPress}: CustomCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

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
      <TouchableOpacity style={styles.customCardInner} onPress={onPress} activeOpacity={0.8}>
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

// Nav icons - Blue Theme
const GiveNavIcon = ({active}: {active: boolean}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.heart,
        {borderColor: active ? Colors.softOrange : Colors.textLight},
      ]}
    />
  </View>
);

const GlimpsesNavIcon = ({active}: {active: boolean}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.rect,
        {borderColor: active ? Colors.softOrange : Colors.textLight},
      ]}
    />
  </View>
);

const BoardNavIcon = ({active}: {active: boolean}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.line,
        {backgroundColor: active ? Colors.softOrange : Colors.textLight},
      ]}
    />
  </View>
);

const navIconStyles = StyleSheet.create({
  container: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heart: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 7,
    transform: [{rotate: '45deg'}],
  },
  rect: {
    width: 14,
    height: 14,
    borderWidth: 2,
    borderRadius: 2,
  },
  line: {
    width: 14,
    height: 2,
    borderRadius: 1,
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
          style={styles.navItem}
          onPress={() => setActiveTab('give')}>
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
          style={styles.navItem}
          onPress={() => setActiveTab('glimpses')}>
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
          style={styles.navItem}
          onPress={() => setActiveTab('board')}>
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
    backgroundColor: Colors.cream,
  },
  header: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerBrand: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 4,
    color: Colors.textMedium,
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
  // Tier card styles - Sleek & Modern
  tierCard: {
    marginBottom: 24,
  },
  tierCardInner: {
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tierTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  tierAmount: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 32,
    color: Colors.textDark,
  },
  tierAmountRange: {
    fontSize: 24,
  },
  tierAmountCustom: {
    fontSize: 26,
  },
  tierIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 16,
    color: Colors.textDark,
    marginBottom: 4,
    lineHeight: 22,
  },
  tierPartner: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 11,
    letterSpacing: 0.5,
    color: Colors.textLight,
    marginBottom: 10,
  },
  tierCardExpanded: {
    borderColor: Colors.textMedium,
  },
  donateBlock: {
    marginTop: 16,
  },
  donateBlockButton: {
    backgroundColor: Colors.softOrange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  donateBlockButtonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.cardBg,
  },
  tierExpandedContent: {
    overflow: 'hidden',
  },
  tierExpandedInner: {
    paddingTop: 16,
  },
  tierDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 16,
  },
  tierExpandedText: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 13,
    color: Colors.textMedium,
    lineHeight: 20,
    marginBottom: 6,
  },
  tierExpandedLink: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 12,
    color: Colors.gentleGreen,
    marginBottom: 4,
  },
  tierDonateButton: {
    backgroundColor: Colors.softOrange,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  tierDonateButtonText: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.cardBg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Real Needs Section - Sleek & Modern
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
    fontFamily: 'System',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textLight,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  realNeedsSubtitle: {
    fontFamily: 'System',
    fontSize: 11,
    fontWeight: '400',
    color: Colors.textLight,
    opacity: 0.7,
  },
  needsScrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  needCard: {
    width: 156,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  needAmount: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 20,
    color: Colors.textDark,
    marginBottom: 6,
  },
  needTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 13,
    color: Colors.textDark,
    marginBottom: 2,
    lineHeight: 18,
  },
  needRecipient: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 11,
    color: Colors.textMedium,
    marginBottom: 6,
  },
  needDesc: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 11,
    color: Colors.textLight,
    lineHeight: 15,
  },
  // Custom Card - Small & Subtle
  customCard: {
    marginBottom: 16,
    marginTop: 8,
  },
  customCardInner: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customTitle: {
    fontFamily: 'CourierPrime-Bold',
    fontSize: 14,
    color: Colors.textMedium,
    marginBottom: 2,
  },
  customSubtitle: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 12,
    color: Colors.textLight,
  },
  customCta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.paper,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderWarm,
  },
  customCtaText: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 11,
    letterSpacing: 0.3,
    color: Colors.textMedium,
  },
  // Bottom nav - Sleek
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    backgroundColor: Colors.cardBg,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 10,
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  navIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.4,
  },
  navIconActive: {
    opacity: 1,
  },
  navLabel: {
    fontFamily: 'CourierPrime-Regular',
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: Colors.textLight,
    marginTop: 4,
  },
  navLabelActive: {
    color: Colors.softOrange,
  },
  navActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.softOrange,
    marginTop: 4,
  },
});
