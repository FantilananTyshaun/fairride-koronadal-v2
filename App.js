import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import CalculateFareScreen from './src/screens/home/CalculateFareScreen';
import HistoryScreen from './src/screens/history/HistoryScreen';
import ReportStack from './src/navigation/ReportStack';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: 'green',
            paddingLeft: 16,
          },
          tabBarStyle: {
            backgroundColor: '#fff',
            paddingBottom: 5,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            color: 'green',
          },
        }}
      >
        <Tab.Screen name="FairRide Koronadal" component={CalculateFareScreen} />
        <Tab.Screen name="Trip History" component={HistoryScreen} />
        <Tab.Screen
          name="Report"
          component={ReportStack}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
