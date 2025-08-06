// src/navigation/HistoryStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/history/HistoryScreen';
import TripDetailsScreen from '../screens/history/TripDetailsScreen';

const Stack = createNativeStackNavigator();

export default function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Back"
        component={HistoryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TripDetails"
        component={TripDetailsScreen}
        options={{
          headerTitle: '',                 
          headerBackTitleVisible: false, 
        }}
      />
    </Stack.Navigator>
  );
}
