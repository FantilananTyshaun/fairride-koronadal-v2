import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FareMatrixScreen from '../screens/home/FareMatrixScreen';
const Stack = createNativeStackNavigator();

export default function ReportStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#fff' },
        headerTitleAlign: 'left', 
        headerTitleStyle: { 
          fontSize: 30, 
          fontWeight: 'bold',
          color: 'green',
        },
      }}
    >
            <Stack.Screen 
              name="FareMatrix" 
              component={FareMatrixScreen} 
              options={{ title: 'Fare Matrix' }}
            />

    </Stack.Navigator>
  );
}
