import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
  LayoutAnimation,
} from 'react-native';
import {useTheme, Typography} from '../../components/theme';
import {useWallet} from '../../components/providers/WalletProvider';
import {useAuth} from '../../components/providers/AuthProvider';
import {FAQ_DATA} from '../../data/content';
import GlassCard from '../../components/GlassCard';
import {smoothLayout} from '../../utils/animations';
import {triggerHaptic} from '../../utils/haptics';

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

function XIcon({color}: {color: string}) {
  return (
    <View style={{width: 16, height: 16, marginRight: 6, justifyContent: 'center', alignItems: 'center'}}>
      <View style={{position: 'absolute', width: 16, height: 2, borderRadius: 1, backgroundColor: color, transform: [{rotate: '45deg'}]}} />
      <View style={{position: 'absolute', width: 16, height: 2, borderRadius: 1, backgroundColor: color, transform: [{rotate: '-45deg'}]}} />
    </View>
  );
}

// ─── FAQ Item ────────────────────────────────────────────────────────────────

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

// ─── Profile Tab ─────────────────────────────────────────────────────────────

export default function ProfileTab() {
  const {colors, mode, toggleMode} = useTheme();
  const {publicKey, connected, connect, disconnect} = useWallet();
  const {isAuthenticated, loading: authLoading, signInWithSolana, error: authError} = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleConnect = async () => {
    triggerHaptic('impactMedium');
    try {
      await connect();
    } catch {
      // User cancelled or error
    }
  };

  const handleDisconnect = async () => {
    triggerHaptic('impactMedium');
    try {
      await disconnect();
    } catch {
      // Error
    }
  };

  const walletAddress = publicKey?.toBase58();
  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <View>
      {/* Wallet Section */}
      <GlassCard style={profileStyles.cardSpacing}>
        <View style={profileStyles.cardContent}>
          <Text style={[profileStyles.cardTitle, {color: colors.textPrimary}]}>Wallet</Text>
          {connected ? (
            <>
              <View style={profileStyles.walletRow}>
                <View style={[profileStyles.statusDot, {backgroundColor: colors.success}]} />
                <Text style={[profileStyles.walletStatus, {color: colors.textSecondary}]}>Connected</Text>
              </View>
              <Text style={[profileStyles.walletAddress, {color: colors.textTertiary}]}>{shortAddress}</Text>
              {!isAuthenticated && (
                <TouchableOpacity
                  style={[profileStyles.connectButton, {backgroundColor: colors.accent, marginTop: 12}]}
                  onPress={() => {
                    triggerHaptic('impactMedium');
                    signInWithSolana();
                  }}
                  activeOpacity={0.8}
                  disabled={authLoading}>
                  <Text style={[profileStyles.connectText, {color: '#FFFFFF'}]}>
                    {authLoading ? 'Signing in...' : 'Sign In With Solana'}
                  </Text>
                </TouchableOpacity>
              )}
              {authError && (
                <Text style={[profileStyles.authError, {color: colors.error || '#D35F5F'}]}>{authError}</Text>
              )}
              <TouchableOpacity
                style={[profileStyles.disconnectButton, {borderColor: colors.border}]}
                onPress={handleDisconnect}
                activeOpacity={0.8}>
                <Text style={[profileStyles.disconnectText, {color: colors.textSecondary}]}>Disconnect</Text>
              </TouchableOpacity>
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
  disconnectButton: {paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center', marginTop: 12},
  disconnectText: {fontSize: Typography.bodySmall.fontSize, fontWeight: '500'},
  authError: {fontSize: Typography.caption.fontSize, marginTop: 8, textAlign: 'center' as const},
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
