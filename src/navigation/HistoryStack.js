//HistoryStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HistoryScreen from '../screens/history/HistoryScreen';
import TripDetailsScreen from '../screens/history/TripDetailsScreen';
import ReportOverchargingScreen from 'screens/report/ReportOverchargingScreen';

import ViewReportsScreen from '../screens/report/ViewReportsScreen';
import ReportDetailsScreen from '../screens/report/ReportDetailsScreen';
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
      <Stack.Screen
              name="ReportOvercharging"
              component={ReportOverchargingScreen}
              options={{ title: 'Report Overcharging' }}
            />
                  <Stack.Screen
        name="ViewReports"
        component={ViewReportsScreen}
        options={{ title: 'Submitted Reports' }}
      />
      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{ title: 'Report Details' }}
      />
    </Stack.Navigator>
  );
} 