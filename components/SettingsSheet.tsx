import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
  LayoutAnimation,
  Dimensions,
} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, Typography} from './theme';
import {useWallet} from './providers/WalletProvider';
import {FAQ_DATA} from '../data/content';
import {EASE_OUT, EASE_IN, smoothLayout} from '../utils/animations';
import {triggerHaptic} from '../utils/haptics';
import {formatUSDC, MOCK_AUTO_GIVE, MOCK_CIRCLE} from '../data/mockData';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.7;

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsSheet({visible, onClose}: SettingsSheetProps) {
  const insets = useSafeAreaInsets();
  const {colors, isDark, mode, toggleMode} = useTheme();
  const {publicKey, connected} = useWallet();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(SHEET_HEIGHT);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 14,
          bounciness: 4,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: EASE_OUT,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        easing: EASE_IN,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        easing: EASE_IN,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const walletAddress = publicKey?.toBase58();
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  const handleToggleFaq = (id: string) => {
    LayoutAnimation.configureNext(smoothLayout);
    triggerHaptic('impactLight');
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <Animated.View
        style={[sheetStyles.backdrop, {opacity: backdropOpacity}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          sheetStyles.sheet,
          {
            height: SHEET_HEIGHT,
            paddingBottom: insets.bottom + 20,
            transform: [{translateY}],
          },
        ]}>
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={isDark ? 'dark' : 'light'}
          blurAmount={20}
          reducedTransparencyFallbackColor={colors.card}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            {backgroundColor: colors.glass},
          ]}
        />

        {/* Drag handle */}
        <View style={sheetStyles.handleWrap}>
          <View
            style={[
              sheetStyles.handle,
              {backgroundColor: colors.glassBorder},
            ]}
          />
        </View>

        <ScrollView
          style={sheetStyles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 40}}>
          {/* ─── Auto-Give Section ───────────────────────────────── */}
          <View style={sheetStyles.section}>
            <Text
              style={[sheetStyles.sectionTitle, {color: colors.textPrimary}]}>
              Auto-Give
            </Text>
            <View style={sheetStyles.settingRow}>
              <Text
                style={[sheetStyles.settingLabel, {color: colors.textSecondary}]}>
                Vault
              </Text>
              <Text
                style={[
                  sheetStyles.settingValue,
                  {color: colors.textPrimary},
                ]}>
                SLC Community Support
              </Text>
            </View>
            <View style={sheetStyles.settingRow}>
              <Text
                style={[sheetStyles.settingLabel, {color: colors.textSecondary}]}>
                Per purchase
              </Text>
              <Text
                style={[
                  sheetStyles.settingValue,
                  {color: colors.textPrimary},
                ]}>
                {formatUSDC(MOCK_AUTO_GIVE.amountPerTrigger)}
              </Text>
            </View>
            <View style={sheetStyles.settingRow}>
              <Text
                style={[sheetStyles.settingLabel, {color: colors.textSecondary}]}>
                Reserve balance
              </Text>
              <Text
                style={[
                  sheetStyles.settingValue,
                  {color: colors.textPrimary},
                ]}>
                {formatUSDC(MOCK_AUTO_GIVE.reserveBalance)}
              </Text>
            </View>
            <View style={sheetStyles.buttonRow}>
              <TouchableOpacity
                style={[
                  sheetStyles.smallButton,
                  {backgroundColor: colors.primary},
                ]}
                onPress={() => triggerHaptic('impactLight')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    sheetStyles.smallButtonText,
                    {color: colors.textOnPrimary},
                  ]}>
                  Fund Reserve
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  sheetStyles.smallButton,
                  {borderColor: colors.border, borderWidth: 1, backgroundColor: 'transparent'},
                ]}
                onPress={() => triggerHaptic('impactLight')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    sheetStyles.smallButtonText,
                    {color: colors.textSecondary},
                  ]}>
                  Withdraw
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[sheetStyles.divider, {backgroundColor: colors.border}]} />

          {/* ─── Circle Section ───────────────────────────────────── */}
          <View style={sheetStyles.section}>
            <Text
              style={[sheetStyles.sectionTitle, {color: colors.textPrimary}]}>
              Circle
            </Text>
            <View style={sheetStyles.settingRow}>
              <Text
                style={[sheetStyles.settingLabel, {color: colors.textSecondary}]}>
                {MOCK_CIRCLE.name}
              </Text>
              <Text
                style={[
                  sheetStyles.settingValue,
                  {color: colors.textTertiary},
                ]}>
                {MOCK_CIRCLE.members.length} members
              </Text>
            </View>
            <View style={sheetStyles.buttonRow}>
              <TouchableOpacity
                style={[
                  sheetStyles.smallButton,
                  {backgroundColor: colors.secondary},
                ]}
                onPress={() => triggerHaptic('impactLight')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    sheetStyles.smallButtonText,
                    {color: colors.textOnPrimary},
                  ]}>
                  Share Invite
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  sheetStyles.smallButton,
                  {borderColor: colors.border, borderWidth: 1, backgroundColor: 'transparent'},
                ]}
                onPress={() => triggerHaptic('impactLight')}
                activeOpacity={0.8}>
                <Text
                  style={[
                    sheetStyles.smallButtonText,
                    {color: colors.textSecondary},
                  ]}>
                  Leave Circle
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[sheetStyles.divider, {backgroundColor: colors.border}]} />

          {/* ─── Wallet ───────────────────────────────────────────── */}
          <View style={sheetStyles.section}>
            <Text
              style={[sheetStyles.sectionTitle, {color: colors.textPrimary}]}>
              Wallet
            </Text>
            <View style={sheetStyles.settingRow}>
              <Text
                style={[sheetStyles.settingLabel, {color: colors.textSecondary}]}>
                {connected ? 'Connected' : 'Not connected'}
              </Text>
              {shortAddress && (
                <Text
                  style={[
                    sheetStyles.settingValue,
                    {color: colors.textTertiary, fontFamily: 'monospace'},
                  ]}>
                  {shortAddress}
                </Text>
              )}
            </View>
          </View>

          <View style={[sheetStyles.divider, {backgroundColor: colors.border}]} />

          {/* ─── Appearance ───────────────────────────────────────── */}
          <View style={sheetStyles.section}>
            <Text
              style={[sheetStyles.sectionTitle, {color: colors.textPrimary}]}>
              Appearance
            </Text>
            <TouchableOpacity
              style={sheetStyles.settingRow}
              onPress={() => {
                triggerHaptic('impactLight');
                toggleMode();
              }}
              activeOpacity={0.7}>
              <Text
                style={[sheetStyles.settingLabel, {color: colors.textSecondary}]}>
                {mode === 'light' ? 'Light' : mode === 'dark' ? 'Dark' : 'System'}
              </Text>
              <Text
                style={[
                  sheetStyles.settingValue,
                  {color: colors.textTertiary},
                ]}>
                Tap to change
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[sheetStyles.divider, {backgroundColor: colors.border}]} />

          {/* ─── FAQ ──────────────────────────────────────────────── */}
          <View style={sheetStyles.section}>
            <Text
              style={[sheetStyles.sectionTitle, {color: colors.textPrimary}]}>
              FAQ
            </Text>
            {FAQ_DATA.slice(0, 5).map(item => (
              <View
                key={item.id}
                style={[
                  sheetStyles.faqItem,
                  {borderBottomColor: colors.border},
                ]}>
                <TouchableOpacity
                  style={sheetStyles.faqHeader}
                  onPress={() => handleToggleFaq(item.id)}
                  activeOpacity={0.7}>
                  <Text
                    style={[
                      sheetStyles.faqQuestion,
                      {color: colors.textPrimary},
                    ]}>
                    {item.question}
                  </Text>
                  <Text
                    style={[sheetStyles.faqIcon, {color: colors.primary}]}>
                    {expandedFaq === item.id ? '\u2212' : '+'}
                  </Text>
                </TouchableOpacity>
                {expandedFaq === item.id && (
                  <Text
                    style={[
                      sheetStyles.faqAnswer,
                      {color: colors.textSecondary},
                    ]}>
                    {item.answer}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* ─── Version ─────────────────────────────────────────── */}
          <Text style={[sheetStyles.version, {color: colors.textTertiary}]}>
            Glimpse v0.2.0-demo
          </Text>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    paddingVertical: 16,
  },
  sectionTitle: {
    ...Typography.subheading,
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingLabel: {
    ...Typography.label,
  },
  settingValue: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  smallButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  smallButtonText: {
    ...Typography.buttonSmall,
  },
  divider: {
    height: 1,
  },
  // FAQ
  faqItem: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    ...Typography.label,
    paddingRight: 12,
  },
  faqIcon: {
    fontSize: 20,
    fontWeight: '300',
  },
  faqAnswer: {
    ...Typography.bodySmall,
    lineHeight: 22,
    paddingTop: 8,
    paddingRight: 36,
  },
  version: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
});
