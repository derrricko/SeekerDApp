import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {BlurView} from '@react-native-community/blur';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, Typography} from '../components/theme';
import {triggerHaptic} from '../utils/haptics';
import {
  DashboardNavIcon,
  VaultsNavIcon,
  CommunityNavIcon,
  SettingsGearIcon,
} from '../components/NavIcons';
import DashboardScreen from '../screens/DashboardScreen';
import VaultListScreen from '../screens/VaultListScreen';
import VaultDetailScreen from '../screens/VaultDetailScreen';
import CommunityScreen from '../screens/CommunityScreen';

// ─── Types ──────────────────────────────────────────────────────────────────

export type VaultStackParamList = {
  VaultList: undefined;
  VaultDetail: {vaultId: string};
};

export type TabParamList = {
  Dashboard: undefined;
  Vaults: undefined;
  Community: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const VaultStack = createNativeStackNavigator<VaultStackParamList>();

// ─── Vault Stack Navigator ──────────────────────────────────────────────────

function VaultStackNavigator() {
  return (
    <VaultStack.Navigator screenOptions={{headerShown: false}}>
      <VaultStack.Screen name="VaultList" component={VaultListScreen} />
      <VaultStack.Screen
        name="VaultDetail"
        component={VaultDetailScreen}
        options={{
          animation: 'fade',
          animationDuration: 250,
        }}
      />
    </VaultStack.Navigator>
  );
}

// ─── Tab Config ─────────────────────────────────────────────────────────────

const TAB_CONFIG = [
  {key: 'Dashboard', label: 'Dashboard', Icon: DashboardNavIcon},
  {key: 'Vaults', label: 'Vaults', Icon: VaultsNavIcon},
  {key: 'Community', label: 'Community', Icon: CommunityNavIcon},
] as const;

// Per-tab accent dot colors (keys into theme colors)
const TAB_ACCENT_KEYS = ['primary', 'accent', 'secondary'] as const;

// ─── Custom Glass Tab Bar ───────────────────────────────────────────────────

function GlassTabBar({state, navigation}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const {colors, isDark} = useTheme();

  // Animated dot position
  const dotPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(dotPosition, {
      toValue: state.index,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [state.index, dotPosition]);

  return (
    <View
      style={[
        tabBarStyles.container,
        {
          paddingBottom: insets.bottom + 8,
          borderTopColor: colors.glassBorder,
        },
      ]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={12}
        reducedTransparencyFallbackColor={colors.card}
      />
      {TAB_CONFIG.map((tab, index) => {
        const isActive = state.index === index;
        const accentKey = TAB_ACCENT_KEYS[index];
        const accentColor = colors[accentKey];
        const iconColor = isActive ? accentColor : colors.textPrimary;

        return (
          <TouchableOpacity
            key={tab.key}
            style={tabBarStyles.tab}
            onPress={() => {
              triggerHaptic('impactLight');
              if (!isActive) {
                navigation.navigate(tab.key);
              }
            }}
            activeOpacity={0.7}>
            <tab.Icon active={isActive} color={iconColor} />
            <Text
              style={[
                tabBarStyles.label,
                {color: isActive ? accentColor : colors.textTertiary},
              ]}>
              {tab.label}
            </Text>
            {isActive && (
              <View
                style={[
                  tabBarStyles.activeDot,
                  {backgroundColor: accentColor},
                ]}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Settings Gear Header Button ────────────────────────────────────────────

interface SettingsButtonProps {
  onPress: () => void;
}

export function SettingsHeaderButton({onPress}: SettingsButtonProps) {
  const {colors} = useTheme();
  return (
    <TouchableOpacity
      style={tabBarStyles.gearButton}
      onPress={() => {
        triggerHaptic('impactLight');
        onPress();
      }}
      activeOpacity={0.7}
      hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
      <SettingsGearIcon color={colors.textTertiary} size={22} />
    </TouchableOpacity>
  );
}

// ─── App Navigator ──────────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        tabBar={props => <GlassTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}>
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Vaults" component={VaultStackNavigator} />
        <Tab.Screen name="Community" component={CommunityScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const tabBarStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tab: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: Typography.caption.letterSpacing,
  },
  activeDot: {
    width: 20,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  gearButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
