// src/navigation/HomeStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; // <-- updated import
import CalculateFareScreen from '../screens/home/CalculateFareScreen';
import FareMatrixScreen from '../screens/home/FareMatrixScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CalculateFare" 
        component={CalculateFareScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="FareMatrix" 
        component={FareMatrixScreen} 
        options={{ title: 'Fare Matrix' }}
      />
    </Stack.Navigator>
  );
}
