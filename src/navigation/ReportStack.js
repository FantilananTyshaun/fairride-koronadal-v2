// src/navigation/ReportStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';
import ReportIncidentScreen from '../screens/report/ReportIncidentScreen';
import ViewReportsScreen from '../screens/report/ViewReportsScreen';
import ReportDetailsScreen from '../screens/report/ReportDetailsScreen';

const Stack = createNativeStackNavigator();
const HeaderTitle = ({ title }) => (
  <View style={styles.headerContainer}>
    <Text style={styles.headerText}>{title}</Text>
  </View>
);
export default function ReportStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
        headerTintColor: 'green',
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: 'green',
        },
      }}
    >
      <Stack.Screen
        name="ReportIncident"
        component={ReportIncidentScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Report Incident" />,
        }}
      />
      <Stack.Screen
        name="ViewReports"
        component={ViewReportsScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Submitted Reports" />,
        }}
      />
      <Stack.Screen
        name="ReportDetails"
        component={ReportDetailsScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Report Details" />,
        }}
      />
    </Stack.Navigator>
  );
}
const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'left',
    justifyContent: 'center',
    width: '100%',
  },
  headerText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'green',
  },
});
