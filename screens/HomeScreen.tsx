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
  ActivityIndicator,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../components/theme';
import {useAuthorization} from '../components/providers/AuthorizationProvider';
import {useConnection} from '../components/providers/ConnectionProvider';
import {TIERS, DIRECTIONS, CUSTOM_TIER, FAQ_DATA} from '../data/content';
import {transferUSDC, RECIPIENT_WALLET} from '../utils/transfer';
import {transact, Web3MobileWallet} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {APP_IDENTITY} from '../components/providers/AuthorizationProvider';

// ─── Icons ───────────────────────────────────────────────────────────────────

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
    return <View style={[iconStyles.moon, {borderColor: colors.textPrimary}]} />;
  }
  return (
    <View style={iconStyles.systemIcon}>
      <View style={[iconStyles.systemHalf, {backgroundColor: colors.textPrimary}]} />
      <View style={[iconStyles.systemHalfOutline, {borderColor: colors.textPrimary}]} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  sunOuter: {width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  sunInner: {width: 8, height: 8, borderRadius: 4},
  moon: {width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderTopRightRadius: 0},
  systemIcon: {width: 20, height: 20, flexDirection: 'row', overflow: 'hidden', borderRadius: 4},
  systemHalf: {width: 10, height: 20},
  systemHalfOutline: {width: 8, height: 18, borderWidth: 2, marginLeft: -2},
});

const ChevronDownIcon = ({color}: {color: string}) => (
  <View style={{width: 20, height: 20, alignItems: 'center', justifyContent: 'center'}}>
    <View
      style={{
        width: 10,
        height: 10,
        borderRightWidth: 2,
        borderBottomWidth: 2,
        borderColor: color,
        transform: [{rotate: '45deg'}, {translateY: -2}],
      }}
    />
  </View>
);

const CircleUserIcon = ({color}: {color: string}) => (
  <View style={{width: 20, height: 20, alignItems: 'center', justifyContent: 'center'}}>
    <View style={{width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: color}} />
  </View>
);

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

const ProfileNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    <View style={[navIconStyles.profileCircle, {borderColor: color, opacity: active ? 1 : 0.4}]} />
    <View style={[navIconStyles.profileBody, {borderColor: color, opacity: active ? 1 : 0.4}]} />
  </View>
);

const navIconStyles = StyleSheet.create({
  container: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  heart: {width: 18, height: 18, borderWidth: 2, borderRadius: 4, transform: [{rotate: '45deg'}]},
  rect: {width: 18, height: 18, borderWidth: 2, borderRadius: 4},
  profileCircle: {width: 12, height: 12, borderWidth: 2, borderRadius: 6, marginBottom: 2},
  profileBody: {width: 18, height: 8, borderWidth: 2, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomWidth: 0},
});

// X Icon
function XIcon({color}: {color: string}) {
  return (
    <View style={{width: 16, height: 16, marginRight: 6, justifyContent: 'center', alignItems: 'center'}}>
      <View style={{position: 'absolute', width: 16, height: 2, borderRadius: 1, backgroundColor: color, transform: [{rotate: '45deg'}]}} />
      <View style={{position: 'absolute', width: 16, height: 2, borderRadius: 1, backgroundColor: color, transform: [{rotate: '-45deg'}]}} />
    </View>
  );
}

// ─── Confirmation Modal ──────────────────────────────────────────────────────

interface ConfirmModalProps {
  visible: boolean;
  amount: number;
  direction: string;
  loading: boolean;
  success: boolean | null;
  error: string | null;
  txSignature: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

function ConfirmModal({
  visible,
  amount,
  direction,
  loading,
  success,
  error,
  txSignature,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const {colors} = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View
          style={[
            modalStyles.card,
            {backgroundColor: colors.card, borderColor: colors.glassBorder, shadowColor: colors.shadow},
          ]}>
          {loading ? (
            <View style={modalStyles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[modalStyles.loadingText, {color: colors.textSecondary}]}>
                Sending your gift...
              </Text>
            </View>
          ) : success ? (
            <View style={modalStyles.centered}>
              <View style={[modalStyles.successCircle, {borderColor: colors.success}]}>
                <Text style={[modalStyles.successCheck, {color: colors.success}]}>
                  {'\u2713'}
                </Text>
              </View>
              <Text style={[modalStyles.successTitle, {color: colors.textPrimary}]}>
                Gift Sent
              </Text>
              <Text style={[modalStyles.successBody, {color: colors.textSecondary}]}>
                ${amount} toward {direction}
              </Text>
              {txSignature && (
                <Text style={[modalStyles.txHash, {color: colors.textTertiary}]}>
                  TX: {txSignature.slice(0, 8)}...{txSignature.slice(-8)}
                </Text>
              )}
              <TouchableOpacity
                style={[modalStyles.doneButton, {backgroundColor: colors.primary}]}
                onPress={onClose}
                activeOpacity={0.8}>
                <Text style={[modalStyles.doneText, {color: colors.textOnPrimary}]}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : error ? (
            <View style={modalStyles.centered}>
              <View style={[modalStyles.errorCircle, {borderColor: colors.error}]}>
                <Text style={[modalStyles.errorX, {color: colors.error}]}>!</Text>
              </View>
              <Text style={[modalStyles.successTitle, {color: colors.textPrimary}]}>
                Something went wrong
              </Text>
              <Text style={[modalStyles.successBody, {color: colors.textSecondary}]}>
                {error}
              </Text>
              <TouchableOpacity
                style={[modalStyles.doneButton, {backgroundColor: colors.primary}]}
                onPress={onClose}
                activeOpacity={0.8}>
                <Text style={[modalStyles.doneText, {color: colors.textOnPrimary}]}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[modalStyles.confirmTitle, {color: colors.textPrimary}]}>
                Confirm Your Gift
              </Text>
              <View style={[modalStyles.detailRow, {borderBottomColor: colors.border}]}>
                <Text style={[modalStyles.detailLabel, {color: colors.textTertiary}]}>Amount</Text>
                <Text style={[modalStyles.detailValue, {color: colors.textPrimary}]}>${amount}</Text>
              </View>
              <View style={[modalStyles.detailRow, {borderBottomColor: colors.border}]}>
                <Text style={[modalStyles.detailLabel, {color: colors.textTertiary}]}>Direction</Text>
                <Text style={[modalStyles.detailValue, {color: colors.textPrimary}]}>{direction}</Text>
              </View>
              <Text style={[modalStyles.disclaimer, {color: colors.textTertiary}]}>
                This will open your wallet to sign the transaction.
              </Text>
              <View style={modalStyles.buttonRow}>
                <TouchableOpacity
                  style={[modalStyles.cancelButton, {borderColor: colors.border}]}
                  onPress={onClose}
                  activeOpacity={0.8}>
                  <Text style={[modalStyles.cancelText, {color: colors.textSecondary}]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[modalStyles.confirmButton, {backgroundColor: colors.primary}]}
                  onPress={onConfirm}
                  activeOpacity={0.8}>
                  <Text style={[modalStyles.confirmButtonText, {color: colors.textOnPrimary}]}>
                    Send Gift
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 32},
  card: {borderRadius: 20, borderWidth: 1, padding: 28, shadowOffset: {width: 0, height: 8}, shadowOpacity: 0.25, shadowRadius: 24, elevation: 10},
  centered: {alignItems: 'center', paddingVertical: 12},
  loadingText: {marginTop: 20, fontSize: 16, fontWeight: '500'},
  successCircle: {width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 16},
  successCheck: {fontSize: 32, fontWeight: '300'},
  successTitle: {fontSize: 22, fontWeight: '300', marginBottom: 8, letterSpacing: 0.5},
  successBody: {fontSize: 16, marginBottom: 8},
  txHash: {fontSize: 12, marginBottom: 24, fontFamily: 'monospace'},
  errorCircle: {width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 16},
  errorX: {fontSize: 32, fontWeight: '600'},
  doneButton: {paddingVertical: 14, paddingHorizontal: 48, borderRadius: 12, marginTop: 8},
  doneText: {fontSize: 16, fontWeight: '600'},
  confirmTitle: {fontSize: 22, fontWeight: '300', marginBottom: 24, textAlign: 'center', letterSpacing: 0.5},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1},
  detailLabel: {fontSize: 15},
  detailValue: {fontSize: 15, fontWeight: '600'},
  disclaimer: {fontSize: 13, textAlign: 'center', marginTop: 20, marginBottom: 24, lineHeight: 18},
  buttonRow: {flexDirection: 'row', gap: 12},
  cancelButton: {flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center'},
  cancelText: {fontSize: 16, fontWeight: '500'},
  confirmButton: {flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center'},
  confirmButtonText: {fontSize: 16, fontWeight: '600'},
});

// ─── Tier Card ───────────────────────────────────────────────────────────────

interface TierCardProps {
  tier: (typeof TIERS)[0];
  index: number;
  onDonate: () => void;
}

function TierCard({tier, index, onDonate}: TierCardProps) {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const [isExpanded, setIsExpanded] = useState(false);
  const expandHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const delay = 300 + index * 200;
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 800, delay, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 0, duration: 800, delay, useNativeDriver: true}),
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scale, {toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 4}).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4}).start();
  };
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    Animated.spring(expandHeight, {toValue: isExpanded ? 0 : 1, useNativeDriver: false, friction: 10, tension: 40}).start();
  };

  const expandedContentHeight = expandHeight.interpolate({inputRange: [0, 1], outputRange: [0, 220]});

  return (
    <Animated.View style={[styles.tierCard, {opacity, transform: [{translateY}, {scale}]}]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleExpand}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.tierCardInner, {backgroundColor: colors.card, borderColor: colors.glassBorder, shadowColor: colors.shadow}]}>
        <View style={styles.tierTop}>
          <Text style={[styles.tierAmount, {color: colors.textPrimary}]}>{tier.amount}</Text>
          <View style={[styles.tierIcon, {backgroundColor: colors.primaryLight, borderColor: colors.primary}]}>
            <CircleUserIcon color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.tierTitle, {color: colors.textPrimary}]}>{tier.title}</Text>
        <Text style={[styles.tierPartner, {color: colors.textSecondary}]}>{tier.partner}</Text>
        <TouchableOpacity
          style={[styles.donateButton, {backgroundColor: colors.primary}]}
          onPress={onDonate}
          activeOpacity={0.8}>
          <Text style={[styles.donateButtonText, {color: colors.textOnPrimary}]}>Donate {tier.amount}</Text>
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
              <Text style={[styles.tierExpandedLink, {color: colors.primary}]}>See what they do {'\u2192'}</Text>
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

// ─── Custom Giving Card ──────────────────────────────────────────────────────

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
      Animated.timing(opacity, {toValue: 1, duration: 800, delay: 500, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 0, duration: 800, delay: 500, useNativeDriver: true}),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 4}).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4}).start();
  };

  const handleAmountChange = (text: string) => {
    setAmount(text.replace(/[^0-9]/g, ''));
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

  const numAmount = parseInt(amount, 10) || 0;
  const isPooled = numAmount > 0 && numAmount < 100;

  return (
    <Animated.View style={[styles.customGivingCard, {opacity, transform: [{translateY}, {scale}]}]}>
      <View
        style={[
          styles.customGivingCardInner,
          {backgroundColor: colors.card, borderColor: colors.glassBorder, shadowColor: colors.shadow},
        ]}>
        <Text style={[styles.customGivingTitle, {color: colors.textPrimary}]}>Give Your Way</Text>

        <Text style={[styles.inputLabel, {color: colors.textSecondary}]}>Direction</Text>
        <TouchableOpacity
          style={[
            styles.dropdown,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : colors.background,
              borderColor: colors.border,
            },
          ]}
          onPress={() => setShowDropdown(true)}
          activeOpacity={0.8}>
          <Text style={[styles.dropdownText, {color: colors.textPrimary}]}>{selectedDirection.label}</Text>
          <ChevronDownIcon color={colors.textSecondary} />
        </TouchableOpacity>

        <Text style={[styles.inputLabel, {color: colors.textSecondary, marginTop: 16}]}>Amount</Text>
        <View
          style={[
            styles.amountInputContainer,
            {
              backgroundColor: isDark ? colors.backgroundSecondary : colors.background,
              borderColor: validationError ? colors.error : colors.border,
            },
          ]}>
          <Text style={[styles.dollarSign, {color: colors.textSecondary}]}>$</Text>
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
          <Text style={[styles.errorText, {color: colors.error}]}>{validationError}</Text>
        ) : (
          <Text style={[styles.minimumText, {color: colors.textTertiary}]}>Minimum $10</Text>
        )}

        <TouchableOpacity
          style={[styles.giveNowButton, {backgroundColor: colors.primary}]}
          onPress={handleGiveNow}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.8}>
          <Text style={[styles.giveNowButtonText, {color: colors.textOnPrimary}]}>Give Now</Text>
        </TouchableOpacity>

        {isPooled && (
          <Text style={[styles.poolingText, {color: colors.textTertiary}]}>
            Under $100? Your gift combines with others for bigger impact.
          </Text>
        )}

        {/* Dropdown Modal */}
        <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
            <View
              style={[
                styles.dropdownModal,
                {backgroundColor: colors.card, borderColor: colors.glassBorder, shadowColor: colors.shadow},
              ]}>
              <FlatList
                data={DIRECTIONS}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      item.id === selectedDirection.id && {backgroundColor: colors.primaryLight},
                    ]}
                    onPress={() => {
                      setSelectedDirection(item);
                      setShowDropdown(false);
                    }}
                    activeOpacity={0.7}>
                    <Text
                      style={[
                        styles.dropdownItemText,
                        {color: colors.textPrimary},
                        item.id === selectedDirection.id && {color: colors.primary, fontWeight: '600'},
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

// ─── Something Bigger Card ───────────────────────────────────────────────────

function CustomCard() {
  const {colors} = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: 800, delay: 900, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 0, duration: 800, delay: 900, useNativeDriver: true}),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scale, {toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 4}).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4}).start();
  };

  return (
    <Animated.View style={[styles.customCard, {opacity, transform: [{translateY}, {scale}]}]}>
      <TouchableOpacity
        style={[
          styles.customCardInner,
          {backgroundColor: colors.accentLight, borderColor: colors.glassBorder, shadowColor: colors.accent},
        ]}
        onPress={() => Linking.openURL('https://x.com/DerrickWKing')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}>
        <View style={styles.customContent}>
          <View style={styles.customTextWrap}>
            <Text style={[styles.customTitle, {color: colors.textPrimary}]}>{CUSTOM_TIER.title}</Text>
            <Text style={[styles.customSubtitle, {color: colors.textSecondary}]}>{CUSTOM_TIER.subtitle}</Text>
          </View>
          <View style={[styles.customCta, {backgroundColor: colors.accent}]}>
            <Text style={[styles.customCtaText, {color: colors.textOnPrimary}]}>{CUSTOM_TIER.cta}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── FAQ Item for Profile ────────────────────────────────────────────────────

interface FAQItemProps {
  item: (typeof FAQ_DATA)[0];
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItem({item, isExpanded, onToggle}: FAQItemProps) {
  const {colors} = useTheme();
  const expandHeight = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(expandHeight, {toValue: isExpanded ? 1 : 0, useNativeDriver: false, friction: 10, tension: 40}),
      Animated.spring(rotateAnim, {toValue: isExpanded ? 1 : 0, useNativeDriver: true, friction: 10, tension: 40}),
    ]).start();
  }, [isExpanded]);

  const contentHeight = expandHeight.interpolate({inputRange: [0, 1], outputRange: [0, 150]});
  const rotate = rotateAnim.interpolate({inputRange: [0, 1], outputRange: ['0deg', '45deg']});

  return (
    <View style={[profileStyles.faqItem, {borderBottomColor: colors.border}]}>
      <TouchableOpacity style={profileStyles.faqHeader} onPress={onToggle} activeOpacity={0.7}>
        <Text style={[profileStyles.faqQuestion, {color: colors.textPrimary}]}>{item.question}</Text>
        <Animated.View style={{transform: [{rotate}]}}>
          <Text style={[profileStyles.faqIcon, {color: colors.primary}]}>+</Text>
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={{height: contentHeight, overflow: 'hidden'}}>
        <Text style={[profileStyles.faqAnswer, {color: colors.textSecondary}]}>{item.answer}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Profile Tab Content ─────────────────────────────────────────────────────

function ProfileTab() {
  const {colors, mode, toggleMode} = useTheme();
  const {selectedAccount} = useAuthorization();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleConnect = async () => {
    try {
      await transact(async (wallet: Web3MobileWallet) => {
        await wallet.authorize({
          cluster: 'devnet',
          identity: APP_IDENTITY,
        });
      });
    } catch {
      // User cancelled or error
    }
  };

  const walletAddress = selectedAccount?.publicKey?.toBase58();
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <View>
      {/* Wallet Section */}
      <View
        style={[
          profileStyles.card,
          {backgroundColor: colors.card, borderColor: colors.glassBorder, shadowColor: colors.shadow},
        ]}>
        <Text style={[profileStyles.cardTitle, {color: colors.textPrimary}]}>Wallet</Text>
        {selectedAccount ? (
          <>
            <View style={profileStyles.walletRow}>
              <View style={[profileStyles.statusDot, {backgroundColor: colors.success}]} />
              <Text style={[profileStyles.walletStatus, {color: colors.textSecondary}]}>Connected</Text>
            </View>
            <Text style={[profileStyles.walletAddress, {color: colors.textTertiary}]}>{shortAddress}</Text>
          </>
        ) : (
          <>
            <View style={profileStyles.walletRow}>
              <View style={[profileStyles.statusDot, {backgroundColor: colors.textTertiary}]} />
              <Text style={[profileStyles.walletStatus, {color: colors.textSecondary}]}>Not connected</Text>
            </View>
            <TouchableOpacity
              style={[profileStyles.connectButton, {backgroundColor: colors.primary}]}
              onPress={handleConnect}
              activeOpacity={0.8}>
              <Text style={[profileStyles.connectText, {color: colors.textOnPrimary}]}>Connect Wallet</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Theme Section */}
      <View
        style={[
          profileStyles.card,
          {backgroundColor: colors.card, borderColor: colors.glassBorder, shadowColor: colors.shadow},
        ]}>
        <Text style={[profileStyles.cardTitle, {color: colors.textPrimary}]}>Appearance</Text>
        <TouchableOpacity style={profileStyles.themeRow} onPress={toggleMode} activeOpacity={0.7}>
          <ThemeToggleIcon mode={mode} />
          <Text style={[profileStyles.themeLabel, {color: colors.textSecondary}]}>
            {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
          </Text>
          <Text style={[profileStyles.themeCycle, {color: colors.textTertiary}]}>Tap to change</Text>
        </TouchableOpacity>
      </View>

      {/* FAQ Section */}
      <View
        style={[
          profileStyles.card,
          {backgroundColor: colors.card, borderColor: colors.glassBorder, shadowColor: colors.shadow},
        ]}>
        <Text style={[profileStyles.cardTitle, {color: colors.textPrimary}]}>FAQ</Text>
        {FAQ_DATA.map(item => (
          <FAQItem
            key={item.id}
            item={item}
            isExpanded={expandedFaq === item.id}
            onToggle={() => setExpandedFaq(expandedFaq === item.id ? null : item.id)}
          />
        ))}
      </View>

      {/* Links */}
      <View
        style={[
          profileStyles.card,
          {backgroundColor: colors.card, borderColor: colors.glassBorder, shadowColor: colors.shadow},
        ]}>
        <Text style={[profileStyles.cardTitle, {color: colors.textPrimary}]}>Links</Text>
        <TouchableOpacity
          style={profileStyles.linkRow}
          onPress={() => Linking.openURL('https://x.com/DerrickWKing')}
          activeOpacity={0.7}>
          <XIcon color={colors.primary} />
          <Text style={[profileStyles.linkText, {color: colors.primary}]}>@DerrickWKing</Text>
        </TouchableOpacity>
      </View>

      {/* App version */}
      <Text style={[profileStyles.version, {color: colors.textTertiary}]}>Glimpse v0.0.1</Text>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  cardTitle: {fontSize: 18, fontWeight: '300', marginBottom: 16, letterSpacing: 0.5},
  walletRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  statusDot: {width: 8, height: 8, borderRadius: 4, marginRight: 8},
  walletStatus: {fontSize: 15, fontWeight: '500'},
  walletAddress: {fontSize: 13, fontFamily: 'monospace', marginBottom: 4},
  connectButton: {paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12},
  connectText: {fontSize: 16, fontWeight: '600'},
  themeRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
  themeLabel: {fontSize: 15, fontWeight: '500', marginLeft: 12, flex: 1},
  themeCycle: {fontSize: 13},
  faqItem: {borderBottomWidth: 1, paddingVertical: 14},
  faqHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  faqQuestion: {flex: 1, fontSize: 14, fontWeight: '500', paddingRight: 12},
  faqIcon: {fontSize: 22, fontWeight: '300'},
  faqAnswer: {fontSize: 13, lineHeight: 20, paddingTop: 10, paddingRight: 36},
  linkRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
  linkText: {fontSize: 15, fontWeight: '600'},
  version: {fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 32},
});

// ─── Home Screen ─────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {colors} = useTheme();
  const {selectedAccount, authorizeSession} = useAuthorization();
  const {connection} = useConnection();
  const [activeTab, setActiveTab] = useState('give');

  // Confirmation modal state
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [confirmAmount, setConfirmAmount] = useState(0);
  const [confirmDirection, setConfirmDirection] = useState('');
  const [txLoading, setTxLoading] = useState(false);
  const [txSuccess, setTxSuccess] = useState<boolean | null>(null);
  const [txError, setTxError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleDonate = (amount: number, direction: string) => {
    setConfirmAmount(amount);
    setConfirmDirection(direction);
    setTxLoading(false);
    setTxSuccess(null);
    setTxError(null);
    setTxSignature(null);
    setConfirmVisible(true);
  };

  const handleConfirmSend = async () => {
    setTxLoading(true);
    setTxError(null);

    try {
      if (!selectedAccount) {
        await transact(async (wallet: Web3MobileWallet) => {
          await authorizeSession(wallet);
        });
      }

      if (!selectedAccount?.publicKey) {
        setTxError('Please connect your wallet first.');
        setTxLoading(false);
        return;
      }

      const signature = await transferUSDC(
        connection,
        selectedAccount.publicKey,
        RECIPIENT_WALLET,
        confirmAmount,
      );
      setTxSignature(signature);
      setTxSuccess(true);
    } catch (err: any) {
      setTxError(err?.message || 'Transaction failed. Please try again.');
    } finally {
      setTxLoading(false);
    }
  };

  const handleCloseModal = () => {
    setConfirmVisible(false);
  };

  const handleTierDonate = () => {
    handleDonate(25, 'Neighbors experiencing homelessness');
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {paddingTop: insets.top + 12, backgroundColor: colors.card, borderBottomColor: colors.glassBorder},
        ]}>
        <Text style={[styles.headerBrand, {color: colors.textPrimary}]}>Glimpse</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 100 + insets.bottom}]}
        showsVerticalScrollIndicator={false}>
        {activeTab === 'give' && (
          <>
            <View style={styles.heroArea}>
              <Text style={[styles.heroTitle, {color: colors.textPrimary}]}>Give</Text>
              <Text style={[styles.heroSubtitle, {color: colors.textTertiary}]}>
                Your generosity, documented.
              </Text>
            </View>

            <CustomGivingCard onDonate={handleDonate} />

            {TIERS.map((tier, index) => (
              <TierCard key={tier.id} tier={tier} index={index} onDonate={handleTierDonate} />
            ))}

            <CustomCard />
          </>
        )}

        {activeTab === 'glimpses' && (
          <View style={styles.comingSoon}>
            <View style={[styles.comingSoonIcon, {borderColor: colors.textTertiary}]}>
              <View style={[styles.comingSoonRect, {backgroundColor: colors.textTertiary}]} />
            </View>
            <Text style={[styles.comingSoonTitle, {color: colors.textPrimary}]}>Glimpses</Text>
            <Text style={[styles.comingSoonText, {color: colors.textTertiary}]}>
              Impact stories are coming soon. You'll see photos, receipts, and proof of every gift.
            </Text>
          </View>
        )}

        {activeTab === 'profile' && <ProfileTab />}
      </ScrollView>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          {paddingBottom: insets.bottom + 8, backgroundColor: colors.card, borderTopColor: colors.glassBorder},
        ]}>
        {[
          {id: 'give', Icon: GiveNavIcon, label: 'Give'},
          {id: 'glimpses', Icon: GlimpsesNavIcon, label: 'Glimpses'},
          {id: 'profile', Icon: ProfileNavIcon, label: 'Profile'},
        ].map(({id, Icon, label}) => (
          <TouchableOpacity key={id} style={styles.navItem} onPress={() => setActiveTab(id)} activeOpacity={0.7}>
            <Icon active={activeTab === id} color={colors.textPrimary} />
            <Text
              style={[
                styles.navLabel,
                {color: activeTab === id ? colors.textPrimary : colors.textTertiary},
              ]}>
              {label}
            </Text>
            {activeTab === id && <View style={[styles.navActiveDot, {backgroundColor: colors.primary}]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Confirm Modal */}
      <ConfirmModal
        visible={confirmVisible}
        amount={confirmAmount}
        direction={confirmDirection}
        loading={txLoading}
        success={txSuccess}
        error={txError}
        txSignature={txSignature}
        onConfirm={handleConfirmSend}
        onClose={handleCloseModal}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrand: {fontSize: 24, fontWeight: '300', letterSpacing: 2},
  scrollView: {flex: 1},
  scrollContent: {paddingHorizontal: 24, paddingTop: 28},

  // Hero
  heroArea: {marginBottom: 28},
  heroTitle: {fontSize: 36, fontWeight: '200', letterSpacing: 1, marginBottom: 6},
  heroSubtitle: {fontSize: 15, fontWeight: '400', letterSpacing: 0.3},

  // Tier card
  tierCard: {marginBottom: 24},
  tierCardInner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  tierTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12},
  tierAmount: {fontSize: 36, fontWeight: '300'},
  tierIcon: {width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  tierTitle: {fontSize: 18, fontWeight: '600', marginBottom: 4, lineHeight: 24},
  tierPartner: {fontSize: 13, letterSpacing: 0.3, marginBottom: 16},
  donateButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  donateButtonText: {fontSize: 16, fontWeight: '600', letterSpacing: 0.5},
  tierExpandedInner: {paddingTop: 16},
  tierDivider: {height: 1, marginBottom: 16},
  tierExpandedText: {fontSize: 14, lineHeight: 22, marginBottom: 6},
  tierExpandedLink: {fontSize: 14, fontWeight: '600', marginBottom: 4},

  // Custom giving card
  customGivingCard: {marginBottom: 24},
  customGivingCardInner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  customGivingTitle: {fontSize: 20, fontWeight: '600', marginBottom: 20},
  inputLabel: {fontSize: 14, fontWeight: '500', marginBottom: 8},
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {fontSize: 16, flex: 1},
  amountInputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dollarSign: {fontSize: 32, fontWeight: '200', marginRight: 4},
  amountInput: {flex: 1, fontSize: 32, fontWeight: '200', paddingVertical: 10},
  minimumText: {fontSize: 12, marginTop: 6, fontStyle: 'italic'},
  errorText: {fontSize: 12, marginTop: 6, fontWeight: '500'},
  giveNowButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  giveNowButtonText: {fontSize: 17, fontWeight: '600', letterSpacing: 0.5},
  poolingText: {fontSize: 13, marginTop: 16, fontStyle: 'italic', textAlign: 'center', lineHeight: 18},

  // Something bigger card
  customCard: {marginBottom: 16, marginTop: 8},
  customCardInner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 0,
  },
  customContent: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'transparent'},
  customTextWrap: {flex: 1, backgroundColor: 'transparent'},
  customTitle: {fontSize: 16, fontWeight: '600', marginBottom: 2},
  customSubtitle: {fontSize: 14},
  customCta: {paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10},
  customCtaText: {fontSize: 13, fontWeight: '600', letterSpacing: 0.3},

  // Coming soon (Glimpses)
  comingSoon: {alignItems: 'center', justifyContent: 'center', paddingVertical: 80},
  comingSoonIcon: {width: 64, height: 64, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 20},
  comingSoonRect: {width: 24, height: 24, borderRadius: 4},
  comingSoonTitle: {fontSize: 22, fontWeight: '300', marginBottom: 12, letterSpacing: 0.5},
  comingSoonText: {fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20},

  // Bottom nav
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
  navItem: {alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8},
  navLabel: {fontSize: 11, fontWeight: '500', marginTop: 4, letterSpacing: 0.3},
  navActiveDot: {width: 4, height: 4, borderRadius: 2, marginTop: 4},

  // Dropdown modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', paddingHorizontal: 40},
  dropdownModal: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
  dropdownItem: {paddingHorizontal: 20, paddingVertical: 16},
  dropdownItemText: {fontSize: 16},
});
