//HomeStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; 
import CalculateFareScreen from '../screens/home/CalculateFareScreen';

const Stack = createNativeStackNavigator();
export default function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="CalculateFare" 
        component={CalculateFareScreen} 
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}