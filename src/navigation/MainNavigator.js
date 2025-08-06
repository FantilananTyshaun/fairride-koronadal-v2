// src/navigation/MainNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';

import CalculateFareScreen from 'screens/home/CalculateFareScreen';
import HistoryScreen from 'screens/history/HistoryScreen';


const Tab = createBottomTabNavigator();

export default function MainNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Calculate Fare" component={CalculateFareScreen} />
        <Tab.Screen name="Trip History" component={HistoryScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
