import React, {useCallback, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CampaignsScreen from '../screens/CampaignsScreen';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import HowItWorksCarousel from '../screens/HowItWorksCarousel';

const Tab = createBottomTabNavigator();

const TAB_BAR_THEME = {
  background: '#F3EFFF',
  border: '#1A1125',
  textPrimary: '#1A1125',
  textTertiary: '#6E6787',
  accent: '#6554D1',
  brand: 'CourierPrime-Regular',
};

interface GiveFlowContextValue {
  onOpenGiveFlow: () => void;
}

function AppTabBar({
  state,
  navigation,
  onOpenGiveFlow,
}: BottomTabBarProps & GiveFlowContextValue) {
  const isGlimpsesTab = state.index === 0;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: TAB_BAR_THEME.background,
          borderTopColor: TAB_BAR_THEME.border,
        },
      ]}>
      <TouchableOpacity
        onPress={() => navigation.navigate('Glimpses')}
        style={styles.sideButton}
        activeOpacity={0.8}>
        <View
          style={[
            styles.sideIconCircle,
            {
              borderColor: TAB_BAR_THEME.border,
              backgroundColor: isGlimpsesTab
                ? TAB_BAR_THEME.border
                : TAB_BAR_THEME.background,
            },
          ]}>
          <Text
            style={[
              styles.sideIconText,
              {
                color: isGlimpsesTab
                  ? TAB_BAR_THEME.background
                  : TAB_BAR_THEME.textPrimary,
                fontFamily: TAB_BAR_THEME.brand,
              },
            ]}>
            ✉
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenGiveFlow}
        style={[
          styles.centerButton,
          {
            backgroundColor: TAB_BAR_THEME.accent,
            borderColor: TAB_BAR_THEME.border,
          },
        ]}
        activeOpacity={0.9}>
        <Text style={[styles.centerText, {fontFamily: TAB_BAR_THEME.brand}]}>
          DONATE
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Rank')}
        style={styles.sideButton}
        activeOpacity={0.8}>
        <Text
          style={[
            styles.sideText,
            {
              color:
                state.index === 1
                  ? TAB_BAR_THEME.textPrimary
                  : TAB_BAR_THEME.textTertiary,
              fontFamily: TAB_BAR_THEME.brand,
            },
          ]}>
          RANK
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function MainTabs({onOpenGiveFlow}: GiveFlowContextValue) {
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => (
      <AppTabBar {...props} onOpenGiveFlow={onOpenGiveFlow} />
    ),
    [onOpenGiveFlow],
  );

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Glimpses"
        tabBar={renderTabBar}
        screenOptions={{headerShown: false}}>
        <Tab.Screen name="Glimpses" component={CampaignsScreen} />
        <Tab.Screen name="Rank" component={LeaderboardScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  const [entered, setEntered] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const insets = useSafeAreaInsets();

  const openGiveFlow = useCallback(() => {
    setShowHowItWorks(true);
  }, []);

  const closeGiveFlow = useCallback(() => {
    setShowHowItWorks(false);
  }, []);

  if (!entered) {
    return (
      <HomeScreen
        onContinue={() => {
          setEntered(true);
          openGiveFlow();
        }}
      />
    );
  }

  return (
    <View style={styles.root}>
      <MainTabs onOpenGiveFlow={openGiveFlow} />

      <TouchableOpacity
        onPress={openGiveFlow}
        style={[
          styles.topHelpButton,
          {
            top: insets.top + 8,
            borderColor: TAB_BAR_THEME.border,
            backgroundColor: showHowItWorks
              ? TAB_BAR_THEME.accent
              : TAB_BAR_THEME.background,
          },
        ]}
        activeOpacity={0.86}>
        <Text
          style={[
            styles.topHelpText,
            {
              color: showHowItWorks
                ? TAB_BAR_THEME.background
                : TAB_BAR_THEME.textPrimary,
              fontFamily: TAB_BAR_THEME.brand,
            },
          ]}>
          ?
        </Text>
      </TouchableOpacity>

      <HowItWorksCarousel visible={showHowItWorks} onClose={closeGiveFlow} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 3,
    height: 72,
    paddingHorizontal: 18,
    paddingBottom: 8,
    marginBottom: 18,
  },
  sideButton: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -10,
  },
  sideIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideIconText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  sideText: {
    fontSize: 29,
    letterSpacing: 1,
    fontWeight: '700',
  },
  centerButton: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    marginTop: -70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A1125',
    shadowOpacity: 0.3,
    shadowRadius: 0,
    shadowOffset: {width: 2, height: 2},
    elevation: 4,
  },
  centerText: {
    color: '#F3EFFF',
    fontSize: 19,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  topHelpButton: {
    position: 'absolute',
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 8,
    shadowColor: '#1A1125',
    shadowOpacity: 0.22,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
  topHelpText: {
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '700',
  },
});
