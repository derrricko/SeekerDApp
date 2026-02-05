import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Linking,
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../components/theme';
import AboutContent from '../components/AboutContent';

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

const CUSTOM_TIER = {
  id: 'custom',
  title: 'Something bigger?',
  subtitle: "Let's talk.",
  cta: 'Connect →',
};

// Direction options for custom giving
const DIRECTIONS = [
  {id: 'single-moms', label: 'Single moms'},
  {id: 'low-income-kids', label: 'Low-income kids'},
  {id: 'homeless', label: 'Neighbors experiencing homelessness'},
  {id: 'recovery', label: 'People in recovery'},
  {id: 'seniors', label: 'Seniors'},
];

// Theme toggle icon component
function ThemeToggleIcon({mode}: {mode: 'light' | 'dark' | 'system'}) {
  const {colors} = useTheme();

  if (mode === 'light') {
    return (
      <View style={[iconStyles.sunOuter, {borderColor: colors.textPrimary}]}>
        <View
          style={[iconStyles.sunInner, {backgroundColor: colors.textPrimary}]}
        />
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
      <View
        style={[iconStyles.systemHalf, {backgroundColor: colors.textPrimary}]}
      />
      <View
        style={[
          iconStyles.systemHalfOutline,
          {borderColor: colors.textPrimary},
        ]}
      />
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
  tier: (typeof TIERS)[0];
  index: number;
  onPress: () => void;
  onDonate?: () => void;
}

function TierCard({tier, index, onPress: _onPress, onDonate}: TierCardProps) {
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
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
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
          <Text
            style={[styles.donateButtonText, {color: colors.textOnPrimary}]}>
            Donate {tier.amount}
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={{height: expandedContentHeight, overflow: 'hidden'}}>
          <View style={styles.tierExpandedInner}>
            <View
              style={[styles.tierDivider, {backgroundColor: colors.border}]}
            />
            <Text
              style={[styles.tierExpandedText, {color: colors.textSecondary}]}>
              BeHeard is a nonprofit serving the unhoused population.
            </Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                Linking.openURL('https://www.instagram.com/beheard.mvmt/')
              }>
              <Text style={[styles.tierExpandedLink, {color: colors.primary}]}>
                See what they do →
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.tierExpandedText,
                {color: colors.textSecondary, marginTop: 12},
              ]}>
              There is no guarantee of a response, but you will be given a first
              name and last initial.
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function CustomCard() {
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

  const openX = () => {
    Linking.openURL('https://x.com/DerrickWKing');
  };

  return (
    <Animated.View
      style={[
        styles.customCard,
        {opacity, transform: [{translateY}, {scale}]},
      ]}>
      <TouchableOpacity
        style={[
          styles.customCardInner,
          {
            backgroundColor: colors.accentLight,
            borderColor: colors.glassBorder,
            shadowColor: colors.accent,
          },
        ]}
        onPress={openX}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        <View style={styles.customContent}>
          <View style={styles.customTextWrap}>
            <Text style={[styles.customTitle, {color: colors.textPrimary}]}>
              {CUSTOM_TIER.title}
            </Text>
            <Text
              style={[styles.customSubtitle, {color: colors.textSecondary}]}>
              {CUSTOM_TIER.subtitle}
            </Text>
          </View>
          <View style={[styles.customCta, {backgroundColor: colors.accent}]}>
            <Text style={[styles.customCtaText, {color: colors.textOnPrimary}]}>
              {CUSTOM_TIER.cta}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Chevron icon for dropdown
const ChevronDownIcon = ({color}: {color: string}) => (
  <View style={chevronStyles.container}>
    <View style={[chevronStyles.chevron, {borderColor: color}]} />
  </View>
);

const chevronStyles = StyleSheet.create({
  container: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 10,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    transform: [{rotate: '45deg'}, {translateY: -2}],
  },
});

interface CustomGivingCardProps {
  onDonate: (amount: number, direction: string) => void;
}

function CustomGivingCard({onDonate}: CustomGivingCardProps) {
  const {colors, isDark} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;

  const [selectedDirection, setSelectedDirection] = useState(DIRECTIONS[0]);
  const [amount, setAmount] = useState('25');
  const [showDropdown, setShowDropdown] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        delay: 500,
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

  const handleAmountChange = (text: string) => {
    // Only allow numeric input
    const numericValue = text.replace(/[^0-9]/g, '');
    setAmount(numericValue);
    setValidationError('');
  };

  const handleGiveNow = () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount < 10) {
      setValidationError('Minimum donation is $10');
      return;
    }
    setValidationError('');
    onDonate(numAmount, selectedDirection.label);
  };

  const selectDirection = (direction: (typeof DIRECTIONS)[0]) => {
    setSelectedDirection(direction);
    setShowDropdown(false);
  };

  const numAmount = parseInt(amount, 10) || 0;
  const isPooled = numAmount > 0 && numAmount < 100;

  return (
    <Animated.View
      style={[
        styles.customGivingCard,
        {opacity, transform: [{translateY}, {scale}]},
      ]}>
      <View
        style={[
          styles.customGivingCardInner,
          {
            backgroundColor: colors.card,
            borderColor: colors.glassBorder,
            shadowColor: colors.shadow,
          },
        ]}>
        <Text style={[styles.customGivingTitle, {color: colors.textPrimary}]}>
          Give Your Way
        </Text>

        {/* Direction dropdown */}
        <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>
          Direction
        </Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            {
              backgroundColor: isDark
                ? colors.backgroundSecondary
                : colors.background,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.8}>
          <Text style={[styles.dropdownText, {color: colors.textPrimary}]}>
            {selectedDirection.label}
          </Text>
          <ChevronDownIcon color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Amount input */}
        <Text
          style={[
            styles.inputLabel,
            {color: colors.textSecondary, marginTop: 16},
          ]}>
          Amount
        </Text>
        <View
          style={[
            styles.amountInputContainer,
            {
              backgroundColor: isDark
                ? colors.backgroundSecondary
                : colors.background,
              borderColor: validationError ? colors.error : colors.border,
            },
          ]}>
          <Text style={[styles.dollarSign, {color: colors.textSecondary}]}>
            $
          </Text>
          <TextInput
            style={[styles.amountInput, {color: colors.textPrimary}]}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            placeholder="25"
            placeholderTextColor={colors.textTertiary}
          />
        </View>
        {validationError ? (
          <Text style={[styles.errorText, {color: colors.error}]}>
            {validationError}
          </Text>
        ) : (
          <Text style={[styles.minimumText, {color: colors.textTertiary}]}>
            Minimum $10
          </Text>
        )}

        {/* Give Now button */}
        <TouchableOpacity
          style={[styles.giveNowButton, {backgroundColor: colors.primary}]}
          onPress={handleGiveNow}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}>
          <Text
            style={[styles.giveNowButtonText, {color: colors.textOnPrimary}]}>
            Give Now
          </Text>
        </TouchableOpacity>

        {/* Pooling message */}
        {isPooled && (
          <Text style={[styles.poolingText, {color: colors.textTertiary}]}>
            Under $100? Your gift combines with others for bigger impact.
          </Text>
        )}

        {/* Dropdown Modal */}
        <Modal
          visible={showDropdown}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}>
            <View
              style={[
                styles.dropdownModal,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.glassBorder,
                  shadowColor: colors.shadow,
                },
              ]}>
              <FlatList
                data={DIRECTIONS}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      item.id === selectedDirection.id && {
                        backgroundColor: colors.primaryLight,
                      },
                    ]}
                    onPress={() => selectDirection(item)}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {color: colors.textPrimary},
                        item.id === selectedDirection.id && {
                          color: colors.primary,
                          fontWeight: '600',
                        },
                      ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Animated.View>
  );
}

// Nav icons
const AboutNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.infoCircle,
        {borderColor: color, opacity: active ? 1 : 0.4},
      ]}>
      <View
        style={[
          navIconStyles.infoDot,
          {backgroundColor: color, opacity: active ? 1 : 0.4},
        ]}
      />
      <View
        style={[
          navIconStyles.infoLine,
          {backgroundColor: color, opacity: active ? 1 : 0.4},
        ]}
      />
    </View>
  </View>
);

const GiveNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.heart,
        {borderColor: color, opacity: active ? 1 : 0.4},
      ]}
    />
  </View>
);

const GlimpsesNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    <View
      style={[
        navIconStyles.rect,
        {borderColor: color, opacity: active ? 1 : 0.4},
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
  infoCircle: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginBottom: 1,
  },
  infoLine: {
    width: 2,
    height: 6,
    borderRadius: 1,
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
});

interface HomeScreenProps {
  onTierPress?: (tierId: string) => void;
}

export default function HomeScreen({onTierPress}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {colors, mode, toggleMode} = useTheme();
  const [activeTab, setActiveTab] = useState('give');

  const handleTierPress = (tierId: string) => {
    if (onTierPress) {
      onTierPress(tierId);
    }
  };

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
        <Text style={[styles.headerBrand, {color: colors.textPrimary}]}>
          Glimpse
        </Text>
        <TouchableOpacity onPress={toggleMode} style={styles.themeToggle}>
          <ThemeToggleIcon mode={mode} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: 100 + insets.bottom},
        ]}
        showsVerticalScrollIndicator={false}>
        {activeTab === 'about' && <AboutContent />}

        {activeTab === 'give' && (
          <>
            {TIERS.map((tier, index) => (
              <TierCard
                key={tier.id}
                tier={tier}
                index={index}
                onPress={() => handleTierPress(tier.id)}
                onDonate={() => handleTierPress(tier.id)}
              />
            ))}

            <CustomGivingCard
              onDonate={(amount, direction) => {
                console.log('Custom donation:', amount, direction);
              }}
            />

            <CustomCard />
          </>
        )}

        {activeTab === 'glimpses' && (
          <View style={styles.comingSoon}>
            <Text style={[styles.comingSoonText, {color: colors.textTertiary}]}>
              Glimpses coming soon
            </Text>
          </View>
        )}
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
          {id: 'about', Icon: AboutNavIcon, label: 'About'},
          {id: 'give', Icon: GiveNavIcon, label: 'Give'},
          {id: 'glimpses', Icon: GlimpsesNavIcon, label: 'Glimpses'},
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
                {
                  color:
                    activeTab === id ? colors.textPrimary : colors.textTertiary,
                },
              ]}>
              {label}
            </Text>
            {activeTab === id && (
              <View
                style={[styles.navActiveDot, {backgroundColor: colors.primary}]}
              />
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
  customCard: {
    marginBottom: 16,
    marginTop: 8,
  },
  customCardInner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 0,
  },
  customContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  customTextWrap: {
    flex: 1,
    backgroundColor: 'transparent',
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
  comingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // CustomGivingCard styles
  customGivingCard: {
    marginBottom: 24,
  },
  customGivingCardInner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  customGivingTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  amountInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {
    fontSize: 24,
    fontWeight: '300',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '300',
    paddingVertical: 10,
  },
  minimumText: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '500',
  },
  giveNowButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  giveNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  poolingText: {
    fontSize: 13,
    marginTop: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  dropdownModal: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dropdownItemText: {
    fontSize: 16,
  },
});
