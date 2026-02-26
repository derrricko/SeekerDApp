// v2 navigation — 3 tabs: Give, Messages, Leaderboard

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {NavigationContainer} from '@react-navigation/native';
import GiveScreen from '../screens/GiveScreen';
import MessagesScreen from '../screens/MessagesScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
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
        }}>
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
