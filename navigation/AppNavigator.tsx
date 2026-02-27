import React, {useCallback, useMemo, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
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
  openGiveFlow: () => void;
  isGiveFlowOpen: boolean;
}

const GiveFlowContext = React.createContext<GiveFlowContextValue>({
  openGiveFlow: () => {},
  isGiveFlowOpen: false,
});

function AppTabBar({state, navigation}: BottomTabBarProps) {
  const {openGiveFlow, isGiveFlowOpen} = React.useContext(GiveFlowContext);

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
        onPress={openGiveFlow}
        style={styles.sideButton}
        activeOpacity={0.8}>
        <View
          style={[
            styles.questionCircle,
            {
              borderColor: TAB_BAR_THEME.border,
              backgroundColor: isGiveFlowOpen
                ? TAB_BAR_THEME.border
                : TAB_BAR_THEME.background,
            },
          ]}>
          <Text
            style={[
              styles.questionText,
              {
                color: isGiveFlowOpen
                  ? TAB_BAR_THEME.background
                  : TAB_BAR_THEME.textPrimary,
                fontFamily: TAB_BAR_THEME.brand,
              },
            ]}>
            ?
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={openGiveFlow}
        style={[
          styles.centerButton,
          {
            backgroundColor: TAB_BAR_THEME.accent,
            borderColor: TAB_BAR_THEME.border,
          },
        ]}
        activeOpacity={0.9}>
        <Text style={[styles.centerText, {fontFamily: TAB_BAR_THEME.brand}]}>
          GIVE
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

function MainTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Glimpses"
        tabBar={AppTabBar}
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

  const openGiveFlow = useCallback(() => {
    setShowHowItWorks(true);
  }, []);

  const closeGiveFlow = useCallback(() => {
    setShowHowItWorks(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      openGiveFlow,
      isGiveFlowOpen: showHowItWorks,
    }),
    [openGiveFlow, showHowItWorks],
  );

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
    <GiveFlowContext.Provider value={contextValue}>
      <View style={{flex: 1}}>
        <MainTabs />
        <HowItWorksCarousel visible={showHowItWorks} onClose={closeGiveFlow} />
      </View>
    </GiveFlowContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 3,
    height: 58,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  sideButton: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 21,
    lineHeight: 24,
    fontWeight: '700',
  },
  sideText: {
    fontSize: 29,
    letterSpacing: 1,
    fontWeight: '700',
  },
  centerButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    marginTop: -48,
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
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
