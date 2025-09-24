import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReportOverchargingScreen from '../screens/report/ReportOverchargingScreen';
import ViewReportsScreen from '../screens/report/ViewReportsScreen';
import ReportDetailsScreen from '../screens/report/ReportDetailsScreen';

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
        name="ReportOvercharging"
        component={ReportOverchargingScreen}
        options={{ title: 'Report Overcharging' }} // show header here
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
