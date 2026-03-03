import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  NavigationContainer,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CampaignsScreen from '../screens/CampaignsScreen';
import GiveScreen from '../screens/GiveScreen';
import HomeScreen from '../screens/HomeScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import HowItWorksCarousel from '../screens/HowItWorksCarousel';
import MessagesScreen from '../screens/MessagesScreen';
import {useUnread} from '../components/providers/UnreadProvider';
import {useTheme} from '../theme/Theme';

export type RootTabParamList = {
  Glimpses: undefined;
  Give: undefined;
  Messages: {conversationId?: string; demoMode?: boolean} | undefined;
  Rank: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

interface GiveFlowContextValue {
  onOpenGiveFlow: () => void;
}

function GlimpsesIcon({active}: {active: boolean}) {
  const {theme} = useTheme();
  const iconColor = active
    ? theme.colors.textPrimary
    : theme.colors.textTertiary;

  return (
    <View style={[styles.glimpseIconFrame, {borderColor: iconColor}]}>
      <View style={styles.glimpseIconRow}>
        <View style={[styles.glimpseIconDot, {backgroundColor: iconColor}]} />
        <View style={[styles.glimpseIconLine, {backgroundColor: iconColor}]} />
      </View>
      <View style={styles.glimpseIconRow}>
        <View style={[styles.glimpseIconDot, {backgroundColor: iconColor}]} />
        <View style={[styles.glimpseIconLine, {backgroundColor: iconColor}]} />
      </View>
      <View style={styles.glimpseIconRow}>
        <View style={[styles.glimpseIconDot, {backgroundColor: iconColor}]} />
        <View style={[styles.glimpseIconLine, {backgroundColor: iconColor}]} />
      </View>
    </View>
  );
}

function MessagesIcon({active}: {active: boolean}) {
  const {theme} = useTheme();
  const iconColor = active
    ? theme.colors.textPrimary
    : theme.colors.textTertiary;

  return (
    <View style={styles.messagesIconWrap}>
      <View style={[styles.messagesBubble, {borderColor: iconColor}]} />
      <View style={[styles.messagesTail, {borderColor: iconColor}]} />
    </View>
  );
}

function AppTabBar({
  state,
  navigation,
  onOpenGiveFlow,
}: BottomTabBarProps & GiveFlowContextValue) {
  const {theme} = useTheme();
  const {totalUnread, activeConversationId} = useUnread();
  const activeRouteName = state.routes[state.index]?.name as
    | keyof RootTabParamList
    | undefined;
  const isGlimpsesTab = activeRouteName === 'Glimpses';
  const isGiveTab = activeRouteName === 'Give';
  const isMessagesTab = activeRouteName === 'Messages';
  const isMessagesThreadOpen = isMessagesTab && Boolean(activeConversationId);
  const glimpsesIndicator = useRef(
    new Animated.Value(isGlimpsesTab ? 1 : 0),
  ).current;
  const messagesIndicator = useRef(
    new Animated.Value(isMessagesTab ? 1 : 0),
  ).current;

  useEffect(() => {
    Animated.timing(glimpsesIndicator, {
      toValue: isGlimpsesTab ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [glimpsesIndicator, isGlimpsesTab]);

  useEffect(() => {
    Animated.timing(messagesIndicator, {
      toValue: isMessagesTab ? 1 : 0,
      duration: 180,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [messagesIndicator, isMessagesTab]);

  const buildIndicatorStyle = (progress: Animated.Value) => ({
    opacity: progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    }),
    transform: [
      {
        scaleX: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1],
        }),
      },
    ],
  });

  if (isMessagesThreadOpen) {
    return <View style={styles.messagesBarHidden} />;
  }

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.colors.surface,
        },
      ]}>
      <View
        style={[
          styles.topFill,
          {
            backgroundColor: theme.colors.surface,
          },
        ]}
      />
      <View
        style={[
          styles.topRail,
          {
            backgroundColor: theme.colors.border,
          },
        ]}
      />

      <TouchableOpacity
        onPress={() => navigation.navigate('Glimpses')}
        style={styles.sideButton}
        activeOpacity={0.8}>
        <View style={styles.sideIconStack}>
          <View style={styles.sideIconWrap}>
            <GlimpsesIcon active={isGlimpsesTab} />
          </View>
          <Animated.View
            style={[
              styles.sideActiveIndicator,
              {
                backgroundColor: theme.colors.accent,
              },
              buildIndicatorStyle(glimpsesIndicator),
            ]}
          />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={onOpenGiveFlow}
        style={[
          styles.centerButton,
          {
            backgroundColor: isGiveTab
              ? theme.colors.accentPressed
              : theme.colors.accent,
            borderColor: theme.colors.border,
          },
        ]}
        activeOpacity={0.9}>
        <Text style={[styles.centerText, {fontFamily: theme.typography.brand}]}>
          DONATE
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Messages')}
        style={styles.sideButton}
        activeOpacity={0.8}>
        <View style={styles.sideIconStack}>
          <View style={styles.sideIconWrap}>
            <MessagesIcon active={isMessagesTab} />
            {totalUnread > 0 ? (
              <View
                style={[
                  styles.unreadBadge,
                  {
                    backgroundColor: theme.colors.accent,
                    borderColor: theme.colors.surface,
                  },
                ]}>
                <Text style={styles.unreadBadgeText}>
                  {totalUnread > 99 ? '99+' : totalUnread}
                </Text>
              </View>
            ) : null}
          </View>
          <Animated.View
            style={[
              styles.sideActiveIndicator,
              {
                backgroundColor: theme.colors.accent,
              },
              buildIndicatorStyle(messagesIndicator),
            ]}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

// SGT enforcement is server-side only (record-donation edge function).
// Client-side gating removed — the public mainnet RPC rate-limits the
// Token-2022 queries needed for SGT verification, blocking legitimate users.

function MainTabs({
  onOpenGiveFlow,
  navigationRef,
}: GiveFlowContextValue & {
  navigationRef: ReturnType<
    typeof createNavigationContainerRef<RootTabParamList>
  >;
}) {
  const renderTabBar = useCallback(
    (props: BottomTabBarProps) => (
      <AppTabBar {...props} onOpenGiveFlow={onOpenGiveFlow} />
    ),
    [onOpenGiveFlow],
  );

  return (
    <NavigationContainer ref={navigationRef}>
      <Tab.Navigator
        initialRouteName="Glimpses"
        tabBar={renderTabBar}
        screenOptions={{headerShown: false}}>
        <Tab.Screen name="Glimpses" component={CampaignsScreen} />
        <Tab.Screen name="Give" component={GiveScreen} />
        <Tab.Screen name="Messages" component={MessagesScreen} />
        <Tab.Screen
          name="Rank"
          component={LeaderboardScreen}
          options={{tabBarButton: () => null}}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function AppNavigator() {
  const {theme} = useTheme();
  const [entered, setEntered] = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const insets = useSafeAreaInsets();
  const navigationRef = React.useMemo(
    () => createNavigationContainerRef<RootTabParamList>(),
    [],
  );

  const openGiveFlow = useCallback(() => {
    setShowHowItWorks(true);
  }, []);

  const openGiveTab = useCallback(() => {
    if (navigationRef.isReady()) {
      navigationRef.navigate('Give');
    }
  }, [navigationRef]);

  const closeGiveFlow = useCallback(() => {
    setShowHowItWorks(false);
  }, []);

  const completeGiveFlow = useCallback(() => {
    setShowHowItWorks(false);
    if (navigationRef.isReady()) {
      navigationRef.navigate('Give');
    }
  }, [navigationRef]);

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
      <MainTabs onOpenGiveFlow={openGiveTab} navigationRef={navigationRef} />

      <TouchableOpacity
        onPress={openGiveFlow}
        style={[
          styles.topHelpButton,
          {
            top: insets.top + 8,
            borderColor: theme.colors.border,
            backgroundColor: showHowItWorks
              ? theme.colors.accent
              : theme.colors.surface,
          },
        ]}
        activeOpacity={0.86}>
        <Text
          style={[
            styles.topHelpText,
            {
              color: showHowItWorks
                ? theme.colors.surface
                : theme.colors.textPrimary,
              fontFamily: theme.typography.brand,
            },
          ]}>
          ?
        </Text>
      </TouchableOpacity>

      <HowItWorksCarousel
        visible={showHowItWorks}
        onClose={closeGiveFlow}
        onComplete={completeGiveFlow}
      />
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
    height: 84,
    paddingHorizontal: 18,
    paddingBottom: 10,
    marginBottom: 18,
    position: 'relative',
    overflow: 'visible',
  },
  messagesBarHidden: {
    height: 0,
    marginBottom: 0,
  },
  topFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -14,
    height: 14,
  },
  topRail: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -14,
    height: 3,
  },
  sideButton: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  sideIconStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideIconWrap: {
    width: 66,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideActiveIndicator: {
    width: 18,
    height: 3,
    borderRadius: 3,
    marginTop: -3,
  },
  glimpseIconFrame: {
    width: 35,
    height: 29,
    borderRadius: 8,
    borderWidth: 2.6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  glimpseIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  glimpseIconDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 3,
    marginRight: 3.6,
  },
  glimpseIconLine: {
    flex: 1,
    height: 2.6,
    borderRadius: 2,
  },
  messagesIconWrap: {
    width: 36,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  messagesBubble: {
    width: 27,
    height: 19,
    borderWidth: 2.6,
    borderRadius: 7,
    backgroundColor: 'transparent',
  },
  messagesTail: {
    position: 'absolute',
    right: 4,
    bottom: 2,
    width: 8,
    height: 8,
    borderLeftWidth: 2.6,
    borderBottomWidth: 2.6,
    borderBottomLeftRadius: 3,
    transform: [{rotate: '-28deg'}],
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -7,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 10,
    lineHeight: 11,
    fontWeight: '700',
  },
  centerButton: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 3,
    marginTop: -62,
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
  loadingRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    lineHeight: 22,
  },
});
