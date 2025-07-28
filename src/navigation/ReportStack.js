import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReportIncidentScreen from '../screens/report/ReportIncidentScreen';
import ViewReportsScreen from '../screens/report/ViewReportsScreen';

const Stack = createNativeStackNavigator();

export default function ReportStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: 'green',              // ✅ Back arrow color
        headerTitleStyle: {
          color: 'green',                     
          fontWeight: 'bold',
          fontSize: 20,
        },
      }}
    >
      <Stack.Screen
        name="ReportIncident"
        component={ReportIncidentScreen}
        options={{ title: 'Report Incident' }}
      />
      <Stack.Screen
        name="ViewReports"
        component={ViewReportsScreen}
        options={{ title: 'Submitted Reports' }}
      />
    </Stack.Navigator>
  );
}
