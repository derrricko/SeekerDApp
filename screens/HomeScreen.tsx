import React, {useEffect, useRef, useState, useCallback} from 'react';
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
  Platform,
  LayoutAnimation,
  UIManager,
  Easing,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, Typography} from '../components/theme';
import {useAuthorization} from '../components/providers/AuthorizationProvider';
import {useConnection} from '../components/providers/ConnectionProvider';
import {TIERS, DIRECTIONS, FAQ_DATA, PRESET_AMOUNTS} from '../data/content';
import {transferUSDC, RECIPIENT_WALLET} from '../utils/transfer';
import {transact, Web3MobileWallet} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import {APP_IDENTITY} from '../components/providers/AuthorizationProvider';
import GlassCard from '../components/GlassCard';
import {triggerHaptic} from '../utils/haptics';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Shared animation config
const ENTRANCE_DURATION = 300;
const ENTRANCE_STAGGER = 50;
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

const springConfig = {useNativeDriver: true, speed: 50, bounciness: 4};
const smoothLayout = {
  duration: 250,
  update: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
  create: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
  delete: {type: LayoutAnimation.Types.easeInEaseOut, property: LayoutAnimation.Properties.opacity},
};

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

// Nav icons — active state uses filled style
const GiveNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    {active ? (
      <View style={[navIconStyles.heart, {backgroundColor: color, borderColor: color}]} />
    ) : (
      <View style={[navIconStyles.heart, {borderColor: color, opacity: 0.4}]} />
    )}
  </View>
);

const GlimpsesNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    {active ? (
      <View style={[navIconStyles.glimpseActive]}>
        <View style={[navIconStyles.glimpseCard, {backgroundColor: color}]} />
        <View style={[navIconStyles.glimpseCardBack, {backgroundColor: color, opacity: 0.4}]} />
      </View>
    ) : (
      <View style={[navIconStyles.rect, {borderColor: color, opacity: 0.4}]} />
    )}
  </View>
);

const ProfileNavIcon = ({active, color}: {active: boolean; color: string}) => (
  <View style={navIconStyles.container}>
    {active ? (
      <>
        <View style={[navIconStyles.profileCircle, {backgroundColor: color, borderColor: color}]} />
        <View style={[navIconStyles.profileBody, {backgroundColor: color, borderColor: color}]} />
      </>
    ) : (
      <>
        <View style={[navIconStyles.profileCircle, {borderColor: color, opacity: 0.4}]} />
        <View style={[navIconStyles.profileBody, {borderColor: color, opacity: 0.4}]} />
      </>
    )}
  </View>
);

const navIconStyles = StyleSheet.create({
  container: {width: 36, height: 36, alignItems: 'center', justifyContent: 'center'},
  heart: {width: 18, height: 18, borderWidth: 2, borderRadius: 4, transform: [{rotate: '45deg'}]},
  rect: {width: 18, height: 18, borderWidth: 2, borderRadius: 4},
  glimpseActive: {width: 22, height: 18, position: 'relative'},
  glimpseCard: {width: 16, height: 16, borderRadius: 3, position: 'absolute', bottom: 0, left: 0},
  glimpseCardBack: {width: 16, height: 16, borderRadius: 3, position: 'absolute', top: 0, right: 0},
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

// ─── Shared press hook ──────────────────────────────────────────────────────

function usePressAnimation() {
  const scale = useRef(new Animated.Value(1)).current;
  const onPressIn = useCallback(() => {
    triggerHaptic('impactLight');
    Animated.spring(scale, {toValue: 0.97, ...springConfig}).start();
  }, [scale]);
  const onPressOut = useCallback(() => {
    Animated.spring(scale, {toValue: 1, ...springConfig}).start();
  }, [scale]);
  return {scale, onPressIn, onPressOut};
}

// ─── Entrance animation hook ────────────────────────────────────────────────

function useEntrance(delay: number = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, {toValue: 1, duration: ENTRANCE_DURATION, delay, easing: EASE_OUT, useNativeDriver: true}),
      Animated.timing(translateY, {toValue: 0, duration: ENTRANCE_DURATION, delay, easing: EASE_OUT, useNativeDriver: true}),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return {opacity, translateY};
}

// ─── Error mapping ───────────────────────────────────────────────────────────

function friendlyError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('user rejected') || lower.includes('declined') || lower.includes('cancelled')) {
    return 'Transaction was cancelled.';
  }
  if (lower.includes('insufficient')) {
    return 'Insufficient funds in your wallet.';
  }
  if (lower.includes('timeout')) {
    return 'The transaction timed out. Please try again.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Network error. Please check your connection.';
  }
  return 'Something went wrong. Please try again.';
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
  onRetry: () => void;
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
  onRetry,
  onClose,
}: ConfirmModalProps) {
  const {colors} = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const {scale: btnScale, onPressIn: btnPressIn, onPressOut: btnPressOut} = usePressAnimation();

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {toValue: 1, useNativeDriver: true, friction: 8, tension: 65}),
        Animated.timing(opacityAnim, {toValue: 1, duration: 200, easing: EASE_OUT, useNativeDriver: true}),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (success) {
      triggerHaptic('notificationSuccess');
    } else if (error) {
      triggerHaptic('notificationError');
    }
  }, [success, error]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {toValue: 0.9, duration: 150, easing: EASE_IN, useNativeDriver: true}),
      Animated.timing(opacityAnim, {toValue: 0, duration: 150, easing: EASE_IN, useNativeDriver: true}),
    ]).start(() => onClose());
  };

  const handleConfirm = () => {
    triggerHaptic('impactMedium');
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[modalStyles.overlay, {opacity: opacityAnim}]}>
        <Animated.View style={{transform: [{scale: scaleAnim}]}}>
          <GlassCard style={{borderRadius: 20}}>
            <View style={modalStyles.cardContent}>
              {loading ? (
                <View style={modalStyles.centered}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[modalStyles.loadingText, {color: colors.textSecondary}]}>
                    Sending your gift...
                  </Text>
                  <TouchableOpacity
                    style={[modalStyles.cancelLoadingButton, {borderColor: colors.border}]}
                    onPress={handleClose}
                    activeOpacity={0.8}>
                    <Text style={[modalStyles.cancelText, {color: colors.textSecondary}]}>Cancel</Text>
                  </TouchableOpacity>
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
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={modalStyles.txHashWrap}
                      onPress={() => Linking.openURL(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)}>
                      <Text style={[modalStyles.txHash, {color: colors.textTertiary}]}>
                        View transaction details
                      </Text>
                    </TouchableOpacity>
                  )}
                  <Animated.View style={{transform: [{scale: btnScale}]}}>
                    <TouchableOpacity
                      style={[modalStyles.doneButton, {backgroundColor: colors.primary}]}
                      onPress={handleClose}
                      onPressIn={btnPressIn}
                      onPressOut={btnPressOut}
                      activeOpacity={0.8}>
                      <Text style={[modalStyles.doneText, {color: colors.textOnPrimary}]}>Done</Text>
                    </TouchableOpacity>
                  </Animated.View>
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
                    {friendlyError(error)}
                  </Text>
                  <View style={modalStyles.buttonRow}>
                    <TouchableOpacity
                      style={[modalStyles.cancelButton, {borderColor: colors.border}]}
                      onPress={handleClose}
                      activeOpacity={0.8}>
                      <Text style={[modalStyles.cancelText, {color: colors.textSecondary}]}>Close</Text>
                    </TouchableOpacity>
                    <Animated.View style={{flex: 1, transform: [{scale: btnScale}]}}>
                      <TouchableOpacity
                        style={[modalStyles.confirmButton, {backgroundColor: colors.primary}]}
                        onPress={() => { triggerHaptic('impactMedium'); onRetry(); }}
                        onPressIn={btnPressIn}
                        onPressOut={btnPressOut}
                        activeOpacity={0.8}>
                        <Text style={[modalStyles.confirmButtonText, {color: colors.textOnPrimary}]}>Try Again</Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
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
                      onPress={handleClose}
                      activeOpacity={0.8}>
                      <Text style={[modalStyles.cancelText, {color: colors.textSecondary}]}>Cancel</Text>
                    </TouchableOpacity>
                    <Animated.View style={{flex: 1, transform: [{scale: btnScale}]}}>
                      <TouchableOpacity
                        style={[modalStyles.confirmButton, {backgroundColor: colors.primary}]}
                        onPress={handleConfirm}
                        onPressIn={btnPressIn}
                        onPressOut={btnPressOut}
                        activeOpacity={0.8}>
                        <Text style={[modalStyles.confirmButtonText, {color: colors.textOnPrimary}]}>
                          Send Gift
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  </View>
                </>
              )}
            </View>
          </GlassCard>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', paddingHorizontal: 32},
  cardContent: {padding: 28},
  centered: {alignItems: 'center', paddingVertical: 16},
  loadingText: {marginTop: 24, fontSize: Typography.body.fontSize, fontWeight: '500'},
  successCircle: {width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 24},
  successCheck: {fontSize: 36, fontWeight: '300'},
  successTitle: {...Typography.subheading, marginBottom: 12},
  successBody: {fontSize: Typography.body.fontSize, marginBottom: 12},
  txHashWrap: {marginBottom: 24},
  txHash: {fontSize: Typography.bodySmall.fontSize, textDecorationLine: 'underline'},
  errorCircle: {width: 80, height: 80, borderRadius: 40, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 24},
  errorX: {fontSize: 36, fontWeight: '600'},
  doneButton: {paddingVertical: 16, paddingHorizontal: 56, borderRadius: 12, marginTop: 8},
  doneText: {...Typography.buttonLarge},
  confirmTitle: {...Typography.subheading, marginBottom: 24, textAlign: 'center'},
  detailRow: {flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1},
  detailLabel: {fontSize: Typography.bodySmall.fontSize},
  detailValue: {fontSize: Typography.bodySmall.fontSize, fontWeight: '600'},
  disclaimer: {fontSize: Typography.bodySmall.fontSize, textAlign: 'center', marginTop: 20, marginBottom: 24, lineHeight: Typography.bodySmall.lineHeight},
  buttonRow: {flexDirection: 'row', gap: 12},
  cancelButton: {flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: 'center'},
  cancelText: {fontSize: Typography.body.fontSize, fontWeight: '500'},
  confirmButton: {paddingVertical: 14, borderRadius: 12, alignItems: 'center'},
  confirmButtonText: {...Typography.buttonLarge},

  cancelLoadingButton: {paddingVertical: 12, paddingHorizontal: 32, borderRadius: 12, borderWidth: 1, marginTop: 24},
});

// ─── Tier Spotlight (compact horizontal) ─────────────────────────────────────

interface TierSpotlightProps {
  tier: (typeof TIERS)[0];
  delay: number;
  onDonate: () => void;
}

function TierSpotlight({tier, delay, onDonate}: TierSpotlightProps) {
  const {colors} = useTheme();
  const {opacity, translateY} = useEntrance(delay);
  const {scale, onPressIn, onPressOut} = usePressAnimation();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(smoothLayout);
    setIsExpanded(!isExpanded);
    triggerHaptic('impactLight');
  };

  const handleDonate = () => {
    triggerHaptic('impactMedium');
    onDonate();
  };

  return (
    <Animated.View style={[spotlightStyles.wrapper, {opacity, transform: [{translateY}, {scale}]}]}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleExpand}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <GlassCard variant="secondary">
          <View style={spotlightStyles.content}>
            <View style={spotlightStyles.row}>
              <View style={[spotlightStyles.iconCircle, {backgroundColor: colors.primaryLight, borderColor: colors.primary}]}>
                <CircleUserIcon color={colors.primary} />
              </View>
              <View style={spotlightStyles.textWrap}>
                <Text style={[spotlightStyles.title, {color: colors.textPrimary}]}>{tier.title}</Text>
                <Text style={[spotlightStyles.partner, {color: colors.textTertiary}]}>{tier.partner}</Text>
              </View>
              <TouchableOpacity
                style={[spotlightStyles.pill, {backgroundColor: colors.primary}]}
                onPress={handleDonate}
                activeOpacity={0.8}>
                <Text style={[spotlightStyles.pillText, {color: colors.textOnPrimary}]}>{tier.amount}</Text>
              </TouchableOpacity>
            </View>
            {isExpanded && (
              <View style={spotlightStyles.expandedInner}>
                <View style={[spotlightStyles.divider, {backgroundColor: colors.border}]} />
                <Text style={[spotlightStyles.expandedText, {color: colors.textSecondary}]}>
                  BeHeard is a nonprofit serving the unhoused population.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL('https://www.instagram.com/beheard.mvmt/')}>
                  <Text style={[spotlightStyles.expandedLink, {color: colors.primary}]}>See what they do {'\u2192'}</Text>
                </TouchableOpacity>
                <Text style={[spotlightStyles.expandedText, {color: colors.textSecondary, marginTop: 12}]}>
                  There is no guarantee of a response, but you will be given a first name and last initial.
                </Text>
              </View>
            )}
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

const spotlightStyles = StyleSheet.create({
  wrapper: {marginBottom: 16},
  content: {padding: 16},
  row: {flexDirection: 'row', alignItems: 'center'},
  iconCircle: {width: 44, height: 44, borderRadius: 22, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 12},
  textWrap: {flex: 1, marginRight: 12},
  title: {fontSize: Typography.bodySmall.fontSize, fontWeight: '600', marginBottom: 2},
  partner: {fontSize: Typography.caption.fontSize, letterSpacing: Typography.caption.letterSpacing},
  pill: {paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20},
  pillText: {fontSize: Typography.buttonSmall.fontSize, fontWeight: '600'},
  expandedInner: {paddingTop: 16},
  divider: {height: 1, marginBottom: 16},
  expandedText: {fontSize: Typography.bodySmall.fontSize, lineHeight: 22, marginBottom: 6},
  expandedLink: {fontSize: Typography.bodySmall.fontSize, fontWeight: '600', marginBottom: 4},
});

// ─── Amount-First Give UI (inline sections) ─────────────────────────────────
// State + logic live in HomeScreen; these are small presentational helpers.

function PresetChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const {colors} = useTheme();
  const chipScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    triggerHaptic('impactLight');
    Animated.spring(chipScale, {toValue: 0.93, ...springConfig}).start();
  };
  const handlePressOut = () => {
    Animated.spring(chipScale, {toValue: 1, ...springConfig}).start();
  };

  return (
    <Animated.View style={{transform: [{scale: chipScale}]}}>
      <TouchableOpacity
        style={[
          chipStyles.chip,
          {
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected ? colors.primaryLight : 'transparent',
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}>
        <Text
          style={[
            chipStyles.chipText,
            {color: selected ? colors.primary : colors.textSecondary},
            selected && {fontWeight: '600'},
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '500',
  },
});

// ─── Something Bigger (inline text CTA) ─────────────────────────────────────
// No card wrapper — just centered text with a tappable link portion.

// ─── FAQ Item for Profile ────────────────────────────────────────────────────

interface FAQItemProps {
  item: (typeof FAQ_DATA)[0];
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItem({item, isExpanded, onToggle}: FAQItemProps) {
  const {colors} = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 1 : 0,
      useNativeDriver: true,
      friction: 14,
      tension: 120,
    }).start();
  }, [isExpanded]);

  const rotate = rotateAnim.interpolate({inputRange: [0, 1], outputRange: ['0deg', '45deg']});

  const handleToggle = () => {
    LayoutAnimation.configureNext(smoothLayout);
    triggerHaptic('impactLight');
    onToggle();
  };

  return (
    <View style={[profileStyles.faqItem, {borderBottomColor: colors.border}]}>
      <TouchableOpacity style={profileStyles.faqHeader} onPress={handleToggle} activeOpacity={0.7}>
        <Text style={[profileStyles.faqQuestion, {color: colors.textPrimary}]}>{item.question}</Text>
        <Animated.View style={{transform: [{rotate}]}}>
          <Text style={[profileStyles.faqIcon, {color: colors.primary}]}>+</Text>
        </Animated.View>
      </TouchableOpacity>
      {isExpanded && (
        <Text style={[profileStyles.faqAnswer, {color: colors.textSecondary}]}>{item.answer}</Text>
      )}
    </View>
  );
}

// ─── Profile Tab Content ─────────────────────────────────────────────────────

function ProfileTab() {
  const {colors, mode, toggleMode} = useTheme();
  const {selectedAccount} = useAuthorization();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleConnect = async () => {
    triggerHaptic('impactMedium');
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
      <GlassCard style={profileStyles.cardSpacing}>
        <View style={profileStyles.cardContent}>
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
      </GlassCard>

      {/* Theme Section */}
      <GlassCard style={profileStyles.cardSpacing}>
        <View style={profileStyles.cardContent}>
          <Text style={[profileStyles.cardTitle, {color: colors.textPrimary}]}>Appearance</Text>
          <TouchableOpacity
            style={profileStyles.themeRow}
            onPress={() => {
              triggerHaptic('impactLight');
              toggleMode();
            }}
            activeOpacity={0.7}>
            <ThemeToggleIcon mode={mode} />
            <Text style={[profileStyles.themeLabel, {color: colors.textSecondary}]}>
              {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
            </Text>
            <Text style={[profileStyles.themeCycle, {color: colors.textTertiary}]}>Tap to change</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* FAQ Section */}
      <GlassCard style={profileStyles.cardSpacing}>
        <View style={profileStyles.cardContent}>
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
      </GlassCard>

      {/* Links */}
      <GlassCard style={profileStyles.cardSpacing}>
        <View style={profileStyles.cardContent}>
          <Text style={[profileStyles.cardTitle, {color: colors.textPrimary}]}>Links</Text>
          <TouchableOpacity
            style={profileStyles.linkRow}
            onPress={() => Linking.openURL('https://x.com/DerrickWKing')}
            activeOpacity={0.7}>
            <XIcon color={colors.primary} />
            <Text style={[profileStyles.linkText, {color: colors.primary}]}>@DerrickWKing</Text>
          </TouchableOpacity>
        </View>
      </GlassCard>

      {/* App version */}
      <Text style={[profileStyles.version, {color: colors.textTertiary}]}>Glimpse v0.0.1</Text>
    </View>
  );
}

const profileStyles = StyleSheet.create({
  cardSpacing: {
    marginBottom: 20,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {...Typography.subheading, marginBottom: 16},
  walletRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  statusDot: {width: 8, height: 8, borderRadius: 4, marginRight: 8},
  walletStatus: {...Typography.label},
  walletAddress: {fontSize: Typography.caption.fontSize, fontFamily: 'monospace', marginBottom: 4, letterSpacing: Typography.caption.letterSpacing},
  connectButton: {paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12},
  connectText: {...Typography.buttonLarge},
  themeRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 14},
  themeLabel: {...Typography.label, marginLeft: 12, flex: 1},
  themeCycle: {...Typography.caption},
  faqItem: {borderBottomWidth: 1, paddingVertical: 14},
  faqHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  faqQuestion: {flex: 1, ...Typography.label, paddingRight: 12},
  faqIcon: {fontSize: Typography.subheading.fontSize, fontWeight: Typography.subheading.fontWeight},
  faqAnswer: {fontSize: Typography.bodySmall.fontSize, lineHeight: 22, paddingTop: 10, paddingRight: 36},
  linkRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
  linkText: {fontSize: Typography.bodySmall.fontSize, fontWeight: '600'},
  version: {...Typography.caption, textAlign: 'center', marginTop: 28, marginBottom: 32},
});

// ─── Home Screen ─────────────────────────────────────────────────────────────

interface HomeScreenProps {
  hideHeaderBrand?: boolean;
}

export default function HomeScreen({hideHeaderBrand}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {colors, isDark} = useTheme();
  const {selectedAccount, authorizeSession} = useAuthorization();
  const {connection} = useConnection();
  const [activeTab, setActiveTab] = useState('give');
  const scrollRef = useRef<ScrollView>(null);

  // Amount-first Give state
  const [amountMode, setAmountMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedDirection, setSelectedDirection] = useState(DIRECTIONS[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [validationError, setValidationError] = useState('');
  const effectiveAmount = amountMode === 'preset' ? selectedPreset : (parseInt(customAmount, 10) || 0);
  const isValidAmount = effectiveAmount >= 10;
  const isPooled = effectiveAmount > 0 && effectiveAmount < 100;

  // Amount display pulse animation
  const amountPulse = useRef(new Animated.Value(1)).current;
  const pulseAmount = useCallback(() => {
    amountPulse.setValue(0.3);
    Animated.timing(amountPulse, {toValue: 1, duration: 200, easing: EASE_OUT, useNativeDriver: true}).start();
  }, [amountPulse]);

  const handlePresetSelect = (value: number) => {
    setAmountMode('preset');
    setSelectedPreset(value);
    setValidationError('');
    pulseAmount();
  };

  const handleCustomSelect = () => {
    setAmountMode('custom');
    setCustomAmount('');
    setValidationError('');
    pulseAmount();
  };

  const handleCustomAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const num = parseInt(cleaned, 10);
    if (!isNaN(num) && num > 10000) {
      setValidationError('Maximum donation is $10,000');
      return;
    }
    setCustomAmount(cleaned);
    setValidationError('');
    pulseAmount();
  };

  const handleGivePress = () => {
    if (!isValidAmount) return;
    if (effectiveAmount < 10) {
      setValidationError('Minimum donation is $10');
      triggerHaptic('notificationWarning');
      return;
    }
    setValidationError('');
    triggerHaptic('impactMedium');
    handleDonate(effectiveAmount, selectedDirection.label);
  };

  // Give tab entrance animations
  const heroEntrance = useEntrance(0);
  const amountEntrance = useEntrance(ENTRANCE_STAGGER);
  const chipsEntrance = useEntrance(ENTRANCE_STAGGER * 2);
  const directionEntrance = useEntrance(ENTRANCE_STAGGER * 3);
  const buttonEntrance = useEntrance(ENTRANCE_STAGGER * 4);
  const dividerEntrance = useEntrance(ENTRANCE_STAGGER * 6);
  const ctaEntrance = useEntrance(ENTRANCE_STAGGER * 8);

  // Give button press animation
  const {scale: giveBtnScale, onPressIn: giveBtnPressIn, onPressOut: giveBtnPressOut} = usePressAnimation();

  // Tab transition
  const tabOpacity = useRef(new Animated.Value(1)).current;

  const switchTab = (tab: string) => {
    if (tab === activeTab) {
      // Re-tap: scroll to top
      scrollRef.current?.scrollTo({y: 0, animated: true});
      return;
    }
    triggerHaptic('impactLight');
    Animated.timing(tabOpacity, {toValue: 0, duration: 120, easing: EASE_IN, useNativeDriver: true}).start(() => {
      setActiveTab(tab);
      scrollRef.current?.scrollTo({y: 0, animated: false});
      Animated.timing(tabOpacity, {toValue: 1, duration: 200, easing: EASE_OUT, useNativeDriver: true}).start();
    });
  };

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
      let pubKey = selectedAccount?.publicKey;

      if (!pubKey) {
        const account = await transact(async (wallet: Web3MobileWallet) => {
          return await authorizeSession(wallet);
        });
        pubKey = account?.publicKey;
      }

      if (!pubKey) {
        setTxError('Please connect your wallet first.');
        setTxLoading(false);
        return;
      }

      const signature = await transferUSDC(
        connection,
        pubKey,
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
          {paddingTop: insets.top + 12, backgroundColor: colors.background, borderBottomColor: colors.glassBorder},
        ]}>
        <Text style={[styles.headerBrand, {color: colors.textPrimary, opacity: hideHeaderBrand ? 0 : 1}]}>Glimpse</Text>
      </View>

      {/* Content */}
      <Animated.View style={{flex: 1, opacity: tabOpacity}}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, {paddingBottom: 100 + insets.bottom}]}
          showsVerticalScrollIndicator={false}>
          {activeTab === 'give' && (
            <>
              {/* Page label */}
              <Animated.View style={[styles.heroArea, {opacity: heroEntrance.opacity, transform: [{translateY: heroEntrance.translateY}]}]}>
                <Text style={[styles.heroLabel, {color: colors.textTertiary}]}>Give</Text>
              </Animated.View>

              {/* Amount display (hero) */}
              <Animated.View style={[giveStyles.amountDisplay, {opacity: amountEntrance.opacity, transform: [{translateY: amountEntrance.translateY}]}]}>
                <Animated.View style={[giveStyles.amountRow, {opacity: amountPulse}]}>
                  <Text style={[giveStyles.dollarSign, {color: colors.textTertiary}]}>$</Text>
                  {amountMode === 'custom' ? (
                    <TextInput
                      style={[giveStyles.amountHero, {color: colors.textPrimary}]}
                      value={customAmount}
                      onChangeText={handleCustomAmountChange}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textTertiary}
                      autoFocus
                    />
                  ) : (
                    <Text style={[giveStyles.amountHero, {color: colors.textPrimary}]}>
                      {effectiveAmount}
                    </Text>
                  )}
                </Animated.View>
              </Animated.View>

              {/* Preset chips */}
              <Animated.View style={[giveStyles.chipsRow, {opacity: chipsEntrance.opacity, transform: [{translateY: chipsEntrance.translateY}]}]}>
                {PRESET_AMOUNTS.map(value => (
                  <PresetChip
                    key={value}
                    label={`$${value}`}
                    selected={amountMode === 'preset' && selectedPreset === value}
                    onPress={() => handlePresetSelect(value)}
                  />
                ))}
                <PresetChip
                  label="Other"
                  selected={amountMode === 'custom'}
                  onPress={handleCustomSelect}
                />
              </Animated.View>

              {/* Validation error */}
              {validationError ? (
                <Text style={[giveStyles.errorText, {color: colors.error}]}>{validationError}</Text>
              ) : null}

              {/* Direction picker */}
              <Animated.View style={[giveStyles.directionWrap, {opacity: directionEntrance.opacity, transform: [{translateY: directionEntrance.translateY}]}]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setShowDropdown(true);
                    triggerHaptic('impactLight');
                  }}>
                  <GlassCard variant="secondary">
                    <View style={giveStyles.directionRow}>
                      <Text style={[giveStyles.directionLabel, {color: colors.textTertiary}]}>Giving toward</Text>
                      <Text style={[giveStyles.directionValue, {color: colors.textPrimary}]}>{selectedDirection.label}</Text>
                      <ChevronDownIcon color={colors.textSecondary} />
                    </View>
                  </GlassCard>
                </TouchableOpacity>
              </Animated.View>

              {/* Give button */}
              <Animated.View style={[giveStyles.buttonWrap, {opacity: buttonEntrance.opacity, transform: [{translateY: buttonEntrance.translateY}, {scale: giveBtnScale}]}]}>
                <TouchableOpacity
                  style={[
                    giveStyles.giveButton,
                    {backgroundColor: colors.primary, shadowColor: colors.shadow},
                    !isValidAmount && {opacity: 0.4},
                  ]}
                  onPress={handleGivePress}
                  onPressIn={isValidAmount ? giveBtnPressIn : undefined}
                  onPressOut={isValidAmount ? giveBtnPressOut : undefined}
                  activeOpacity={isValidAmount ? 0.8 : 1}
                  disabled={!isValidAmount}>
                  <Text style={[giveStyles.giveButtonText, {color: colors.textOnPrimary}]}>
                    {isValidAmount ? `Give $${effectiveAmount}` : 'Give Now'}
                  </Text>
                </TouchableOpacity>
                <Text style={[giveStyles.subtext, {color: colors.textTertiary, opacity: isPooled ? 1 : isValidAmount ? 1 : 0}]}>
                  {isPooled
                    ? 'Under $100? Your gift combines with others for bigger impact.'
                    : 'Your full gift goes to the need. Zero fees.'}
                </Text>
              </Animated.View>

              {/* "or" divider */}
              <Animated.View style={[giveStyles.orDivider, {opacity: dividerEntrance.opacity, transform: [{translateY: dividerEntrance.translateY}]}]}>
                <View style={[giveStyles.orLine, {backgroundColor: colors.border}]} />
                <Text style={[giveStyles.orText, {color: colors.textTertiary}]}>or</Text>
                <View style={[giveStyles.orLine, {backgroundColor: colors.border}]} />
              </Animated.View>

              {/* Tier spotlight */}
              {TIERS.map(tier => (
                <TierSpotlight key={tier.id} tier={tier} delay={350} onDonate={handleTierDonate} />
              ))}

              {/* Something bigger — inline text */}
              <Animated.View style={[giveStyles.biggerWrap, {opacity: ctaEntrance.opacity, transform: [{translateY: ctaEntrance.translateY}]}]}>
                <Text style={[giveStyles.biggerText, {color: colors.textTertiary}]}>
                  Something bigger?{' '}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Linking.openURL('https://x.com/DerrickWKing');
                    triggerHaptic('impactLight');
                  }}>
                  <Text style={[giveStyles.biggerLink, {color: colors.primary}]}>Let's talk {'\u2192'}</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Direction dropdown modal */}
              <Modal visible={showDropdown} transparent animationType="fade" onRequestClose={() => setShowDropdown(false)}>
                <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDropdown(false)}>
                  <GlassCard>
                    <View style={styles.dropdownModalContent}>
                      <Text style={[styles.dropdownHeader, {color: colors.textTertiary}]}>Choose a direction</Text>
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
                              triggerHaptic('impactLight');
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
                  </GlassCard>
                </TouchableOpacity>
              </Modal>
            </>
          )}

          {activeTab === 'glimpses' && (
            <View style={styles.comingSoon}>
              <View style={[styles.comingSoonCircle, {borderColor: colors.border}]}>
                <View style={[styles.comingSoonCardStack]}>
                  <View style={[styles.comingSoonCard1, {backgroundColor: colors.primary, opacity: 0.15}]} />
                  <View style={[styles.comingSoonCard2, {backgroundColor: colors.primary, opacity: 0.3}]} />
                  <View style={[styles.comingSoonCard3, {backgroundColor: colors.primary, opacity: 0.5}]} />
                </View>
              </View>
              <Text style={[styles.comingSoonTitle, {color: colors.textPrimary}]}>Glimpses</Text>
              <Text style={[styles.comingSoonText, {color: colors.textTertiary}]}>
                Impact stories are coming soon.
              </Text>
              <Text style={[styles.comingSoonSubtext, {color: colors.textTertiary}]}>
                You'll see photos, receipts, and proof that your gift made a difference.
              </Text>
            </View>
          )}

          {activeTab === 'profile' && <ProfileTab />}
        </ScrollView>
      </Animated.View>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          {paddingBottom: insets.bottom + 8, borderTopColor: colors.glassBorder, overflow: 'hidden'},
        ]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={12}
          reducedTransparencyFallbackColor={colors.card}
        />
        {[
          {id: 'give', Icon: GiveNavIcon, label: 'Give'},
          {id: 'glimpses', Icon: GlimpsesNavIcon, label: 'Glimpses'},
          {id: 'profile', Icon: ProfileNavIcon, label: 'Profile'},
        ].map(({id, Icon, label}) => (
          <TouchableOpacity key={id} style={styles.navItem} onPress={() => switchTab(id)} activeOpacity={0.7}>
            <Icon active={activeTab === id} color={activeTab === id ? colors.primary : colors.textPrimary} />
            <Text
              style={[
                styles.navLabel,
                {color: activeTab === id ? colors.primary : colors.textTertiary},
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
        onRetry={handleConfirmSend}
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
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerBrand: {...Typography.brand},
  scrollView: {flex: 1},
  scrollContent: {paddingHorizontal: 24, paddingTop: 28},

  // Hero
  heroArea: {marginBottom: 8, alignItems: 'center'},
  heroLabel: {...Typography.label, textTransform: 'uppercase' as const, letterSpacing: 2, fontSize: 13},

  // (Give tab styles moved to giveStyles below)

  // Coming soon (Glimpses) — redesigned
  comingSoon: {alignItems: 'center', justifyContent: 'center', paddingVertical: 100},
  comingSoonCircle: {width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 28},
  comingSoonCardStack: {width: 36, height: 36, position: 'relative'},
  comingSoonCard1: {position: 'absolute', width: 24, height: 24, borderRadius: 4, top: 0, left: 0},
  comingSoonCard2: {position: 'absolute', width: 24, height: 24, borderRadius: 4, top: 4, left: 4},
  comingSoonCard3: {position: 'absolute', width: 24, height: 24, borderRadius: 4, top: 8, left: 8},
  comingSoonTitle: {...Typography.subheading, marginBottom: 12},
  comingSoonText: {fontSize: Typography.body.fontSize, textAlign: 'center', lineHeight: Typography.body.lineHeight, paddingHorizontal: 20},
  comingSoonSubtext: {fontSize: Typography.bodySmall.fontSize, textAlign: 'center', lineHeight: 22, paddingHorizontal: 32, marginTop: 8},

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
  navLabel: {fontSize: Typography.caption.fontSize, fontWeight: '500', marginTop: 4, letterSpacing: Typography.caption.letterSpacing},
  navActiveDot: {width: 20, height: 4, borderRadius: 2, marginTop: 4},

  // Dropdown modal
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', paddingHorizontal: 40},
  dropdownModalContent: {paddingVertical: 8},
  dropdownHeader: {...Typography.label, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4},
  dropdownItem: {paddingHorizontal: 20, paddingVertical: 16},
  dropdownItemText: {fontSize: Typography.body.fontSize},
});

// ─── Give Tab Styles ──────────────────────────────────────────────────────────

const giveStyles = StyleSheet.create({
  // Amount display (hero)
  amountDisplay: {alignItems: 'center', marginBottom: 24},
  amountRow: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center'},
  dollarSign: {fontSize: 32, fontWeight: '200', marginRight: 4},
  amountHero: {
    fontSize: 64,
    fontWeight: '200',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    minWidth: 80,
    textAlign: 'center',
    padding: 0,
  },

  // Preset chips
  chipsRow: {flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 24},

  // Validation error
  errorText: {fontSize: Typography.caption.fontSize, fontWeight: '500', textAlign: 'center', marginTop: -16, marginBottom: 16},

  // Direction picker
  directionWrap: {marginBottom: 20},
  directionRow: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14},
  directionLabel: {fontSize: Typography.caption.fontSize, letterSpacing: Typography.caption.letterSpacing, marginRight: 6},
  directionValue: {fontSize: Typography.body.fontSize, fontWeight: '500', flex: 1},

  // Give button
  buttonWrap: {marginBottom: 28},
  giveButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  giveButtonText: {...Typography.buttonLarge},
  subtext: {...Typography.caption, marginTop: 8, textAlign: 'center', lineHeight: 18},

  // "or" divider
  orDivider: {flexDirection: 'row', alignItems: 'center', marginBottom: 24},
  orLine: {flex: 1, height: 1},
  orText: {fontSize: Typography.caption.fontSize, marginHorizontal: 16, fontWeight: '500'},

  // Something bigger — inline text
  biggerWrap: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 16},
  biggerText: {fontSize: Typography.bodySmall.fontSize},
  biggerLink: {fontSize: Typography.bodySmall.fontSize, fontWeight: '600'},
});
