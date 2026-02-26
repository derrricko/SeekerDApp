// v2 navigation — 3 tabs: Give, Messages, Leaderboard

import React from 'react';
import {Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import GiveScreen from '../screens/GiveScreen';
import MessagesScreen from '../screens/MessagesScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

const Tab = createBottomTabNavigator();

// Simple text icons to avoid adding a vector-icon dependency
const TAB_ICONS: Record<string, string> = {
  Give: '$',
  Messages: '#',
  Leaderboard: '*',
};

function TabIcon({name, color}: {name: string; color: string}) {
  return (
    <Text style={{fontSize: 20, color, fontWeight: '700'}}>
      {TAB_ICONS[name] || '?'}
    </Text>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({route}) => ({
          headerShown: false,
          tabBarIcon: ({color}) => <TabIcon name={route.name} color={color} />,
          tabBarStyle: {
            backgroundColor: '#0A0A0A',
            borderTopColor: '#1A1A1A',
            borderTopWidth: 1,
            paddingTop: 8,
            paddingBottom: 8,
            height: 60,
          },
          tabBarActiveTintColor: '#818CF8',
          tabBarInactiveTintColor: '#555',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        })}>
        <Tab.Screen
          name="Give"
          component={GiveScreen}
          options={{
            tabBarLabel: 'Give',
          }}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesScreen}
          options={{
            tabBarLabel: 'Messages',
          }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{
            tabBarLabel: 'Leaderboard',
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
