import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Linking,
  Platform,
  UIManager,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, Typography} from '../components/theme';
import {useWallet} from '../components/providers/WalletProvider';
import {useConnection} from '../components/providers/ConnectionProvider';
import {useNeeds} from '../hooks/useNeeds';
import type {Need} from '../data/content';
import {transferUSDC, RECIPIENT_WALLET} from '../utils/transfer';
import {handleMWAError, handleTransactionError} from '../utils/errors';
import {
  fetchMyTransactions,
  recordTransaction,
  TransactionRecord,
} from '../services/transactions';
import GlassCard from '../components/GlassCard';
import NeedCard from '../components/NeedCard';
import GiveChoiceModal from '../components/GiveChoiceModal';
import OnboardingModal from '../components/OnboardingModal';
import ConfirmModal from '../components/ConfirmModal';
import {
  GiveNavIcon,
  GlimpsesNavIcon,
  ProfileNavIcon,
} from '../components/NavIcons';
import ProfileTab from './tabs/ProfileTab';
import {
  ENTRANCE_STAGGER,
  EASE_OUT,
  EASE_IN,
  useEntrance,
} from '../utils/animations';
import {triggerHaptic} from '../utils/haptics';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Home Screen ─────────────────────────────────────────────────────────────

interface HomeScreenProps {
  hideHeaderBrand?: boolean;
}

export default function HomeScreen({hideHeaderBrand}: HomeScreenProps) {
  const insets = useSafeAreaInsets();
  const {colors, isDark} = useTheme();
  const {publicKey, connect, signAndSendTransaction} = useWallet();
  const {connection} = useConnection();
  const {needs} = useNeeds();
  const [activeTab, setActiveTab] = useState('give');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [glimpses, setGlimpses] = useState<TransactionRecord[]>([]);
  const [glimpsesLoading, setGlimpsesLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Fetch transaction history when Glimpses tab is active
  useEffect(() => {
    if (activeTab === 'glimpses' && publicKey) {
      setGlimpsesLoading(true);
      fetchMyTransactions(publicKey.toBase58())
        .then(setGlimpses)
        .catch(() => setGlimpses([]))
        .finally(() => setGlimpsesLoading(false));
    }
  }, [activeTab, publicKey]);

  // Needs-based Give state
  const [giveChoiceVisible, setGiveChoiceVisible] = useState(false);
  const [selectedNeed, setSelectedNeed] = useState<Need | null>(null);

  const handleNeedGive = (need: Need) => {
    setSelectedNeed(need);
    setGiveChoiceVisible(true);
  };

  const handleAmountSelected = (amount: number) => {
    if (!selectedNeed) {
      return;
    }
    setGiveChoiceVisible(false);
    handleDonate(amount, selectedNeed.title);
  };

  // Give tab entrance animations
  const heroEntrance = useEntrance(0);
  const ctaEntrance = useEntrance(ENTRANCE_STAGGER * (needs.length + 2));

  // Tab transition
  const tabOpacity = useRef(new Animated.Value(1)).current;

  const switchTab = (tab: string) => {
    if (tab === activeTab) {
      scrollRef.current?.scrollTo({y: 0, animated: true});
      return;
    }
    triggerHaptic('impactLight');
    Animated.timing(tabOpacity, {
      toValue: 0,
      duration: 120,
      easing: EASE_IN,
      useNativeDriver: true,
    }).start(() => {
      setActiveTab(tab);
      scrollRef.current?.scrollTo({y: 0, animated: false});
      Animated.timing(tabOpacity, {
        toValue: 1,
        duration: 200,
        easing: EASE_OUT,
        useNativeDriver: true,
      }).start();
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
  const [, setDonationNote] = useState<string | undefined>();

  const handleDonate = (amount: number, direction: string) => {
    setConfirmAmount(amount);
    setConfirmDirection(direction);
    setTxLoading(false);
    setTxSuccess(null);
    setTxError(null);
    setTxSignature(null);
    setDonationNote(undefined);
    setConfirmVisible(true);
  };

  const handleConfirmSend = async (note?: string) => {
    setTxLoading(true);
    setTxError(null);
    if (note) {
      setDonationNote(note);
    }

    try {
      let pubKey = publicKey;

      if (!pubKey) {
        await connect();
        // publicKey updates asynchronously via state — but we need it now.
        // Re-read won't work in the same render. Ask user to retry.
        setTxError('Wallet connected. Please tap Send Gift again.');
        setTxLoading(false);
        return;
      }

      const signature = await transferUSDC(
        connection,
        pubKey,
        RECIPIENT_WALLET,
        confirmAmount,
        signAndSendTransaction,
        selectedNeed?.id,
      );
      setTxSignature(signature);
      setTxSuccess(true);

      // Record transaction in Supabase (fire-and-forget — tx is already on-chain)
      recordTransaction(
        pubKey.toBase58(),
        signature,
        selectedNeed?.id,
        note,
      ).catch(() => {});
    } catch (err: any) {
      const mwaResult = handleMWAError(err);
      if (mwaResult.message !== (err?.message ?? String(err))) {
        setTxError(mwaResult.message);
      } else {
        setTxError(handleTransactionError(err));
      }
    } finally {
      setTxLoading(false);
    }
  };

  const handleCloseModal = () => {
    setConfirmVisible(false);
  };

  const handleViewGlimpses = () => {
    switchTab('glimpses');
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 12,
            backgroundColor: colors.background,
            borderBottomColor: colors.glassBorder,
          },
        ]}>
        <Text
          style={[
            styles.headerBrand,
            {color: colors.textPrimary, opacity: hideHeaderBrand ? 0 : 1},
          ]}>
          Glimpse
        </Text>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => {
            triggerHaptic('impactLight');
            setShowOnboarding(true);
          }}
          activeOpacity={0.7}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Text style={[styles.helpText, {color: colors.textTertiary}]}>?</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View style={{flex: 1, opacity: tabOpacity}}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: 100 + insets.bottom},
          ]}
          showsVerticalScrollIndicator={false}>
          {activeTab === 'give' && (
            <>
              {/* Tagline */}
              <Animated.View
                style={[
                  styles.heroArea,
                  {
                    opacity: heroEntrance.opacity,
                    transform: [{translateY: heroEntrance.translateY}],
                  },
                ]}>
                <Text
                  style={[styles.heroTagline, {color: colors.textTertiary}]}>
                  documenting kindness, creating connections
                </Text>
              </Animated.View>

              {/* Need cards */}
              {needs.map((need, index) => (
                <NeedCard
                  key={need.id}
                  need={need}
                  index={index}
                  delay={ENTRANCE_STAGGER * (index + 1)}
                  onGive={handleNeedGive}
                />
              ))}

              {/* Something bigger — inline text */}
              <Animated.View
                style={[
                  giveStyles.biggerWrap,
                  {
                    opacity: ctaEntrance.opacity,
                    transform: [{translateY: ctaEntrance.translateY}],
                  },
                ]}>
                <Text
                  style={[giveStyles.biggerText, {color: colors.textTertiary}]}>
                  Something bigger?{' '}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    Linking.openURL('https://x.com/DerrickWKing');
                    triggerHaptic('impactLight');
                  }}>
                  <Text
                    style={[giveStyles.biggerLink, {color: colors.primary}]}>
                    Let's talk {'\u2192'}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}

          {activeTab === 'glimpses' && (
            <View style={styles.glimpsesContainer}>
              <Text
                style={[styles.glimpsesIntro, {color: colors.textTertiary}]}>
                See the impact of every gift.
              </Text>
              {glimpsesLoading ? (
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                  style={{marginTop: 32}}
                />
              ) : glimpses.length > 0 ? (
                glimpses.map(tx => (
                  <GlassCard
                    key={tx.id}
                    variant="secondary"
                    style={{marginBottom: 12}}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}>
                      <Text
                        style={[
                          Typography.bodySmall,
                          {color: colors.primary, fontWeight: '600'},
                        ]}>
                        ${tx.amount}
                      </Text>
                      <Text
                        style={[
                          Typography.caption,
                          {color: colors.textTertiary},
                        ]}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    {tx.note && (
                      <Text
                        style={[
                          Typography.body,
                          {color: colors.textPrimary, marginBottom: 8},
                        ]}>
                        {tx.note}
                      </Text>
                    )}
                    <Text
                      style={[Typography.caption, {color: colors.textTertiary}]}
                      numberOfLines={1}>
                      tx: {tx.tx_signature}
                    </Text>
                  </GlassCard>
                ))
              ) : (
                <View style={{alignItems: 'center', paddingVertical: 48}}>
                  <Text
                    style={[
                      Typography.subheading,
                      {color: colors.textTertiary, marginBottom: 12},
                    ]}>
                    No glimpses yet
                  </Text>
                  <Text
                    style={[
                      Typography.body,
                      {
                        color: colors.textTertiary,
                        textAlign: 'center',
                        paddingHorizontal: 24,
                      },
                    ]}>
                    After you give, your donation history and impact proofs will
                    appear here.
                  </Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'profile' && <ProfileTab />}
        </ScrollView>
      </Animated.View>

      {/* Bottom Nav */}
      <View
        style={[
          styles.bottomNav,
          {
            paddingBottom: insets.bottom + 8,
            borderTopColor: colors.glassBorder,
            overflow: 'hidden',
          },
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
          <TouchableOpacity
            key={id}
            style={styles.navItem}
            onPress={() => switchTab(id)}
            activeOpacity={0.7}>
            <Icon
              active={activeTab === id}
              color={activeTab === id ? colors.primary : colors.textPrimary}
            />
            <Text
              style={[
                styles.navLabel,
                {
                  color:
                    activeTab === id ? colors.primary : colors.textTertiary,
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

      {/* Give Choice Modal */}
      <GiveChoiceModal
        visible={giveChoiceVisible}
        need={selectedNeed}
        onSelectAmount={handleAmountSelected}
        onClose={() => setGiveChoiceVisible(false)}
      />

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
        onViewGlimpses={handleViewGlimpses}
      />

      {/* Onboarding replay */}
      {showOnboarding && (
        <OnboardingModal onComplete={() => setShowOnboarding(false)} />
      )}
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
  helpButton: {
    position: 'absolute',
    right: 24,
    bottom: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Georgia',
  },
  scrollView: {flex: 1},
  scrollContent: {paddingHorizontal: 24, paddingTop: 24},

  // Hero
  heroArea: {marginBottom: 24, alignItems: 'center'},
  heroTagline: {
    fontSize: 15,
    fontStyle: 'italic' as const,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '300',
    letterSpacing: 0.3,
  },

  // Glimpses tab
  glimpsesContainer: {paddingTop: 8},
  glimpsesIntro: {
    fontSize: 15,
    fontStyle: 'italic' as const,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontWeight: '300',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 24,
  },

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
  navLabel: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: Typography.caption.letterSpacing,
  },
  navActiveDot: {width: 20, height: 4, borderRadius: 2, marginTop: 4},
});

// ─── Give Tab Styles ──────────────────────────────────────────────────────────

const giveStyles = StyleSheet.create({
  biggerWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  biggerText: {fontSize: Typography.body.fontSize, fontWeight: '300'},
  biggerLink: {fontSize: Typography.body.fontSize, fontWeight: '600'},
});
